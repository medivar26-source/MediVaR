"""
Stored results (migration 013: `plans`, `attempts`, `assessment_results`), read for the dashboard.

One read returns everything the insight screens need for the caller, so the dashboard's roll-ups (means,
category averages, hotspots, trends) are computed in one place over one consistent set of rows:

* a learner gets their own attempts;
* an instructor gets the attempts of every learner in a cohort they own (the `cohort_members ->
  cohorts.owner_id` rule `resident_service._is_supervised` already uses);
* an administrator gets the learners of their institution.

Nothing here computes a score. Every figure comes from `assessment_results` as the scorer wrote it.
"""
from __future__ import annotations

from contextlib import contextmanager
from typing import Any, Dict, List, Optional

from db.session import get_db_conn

LEARNER_ROLES = ("student", "intern", "resident", "surgeon")


class ResultsUnavailable(Exception):
    """Migration 013 has not been applied, so there is nowhere results could be stored."""


@contextmanager
def _cursor():
    conn = get_db_conn()
    try:
        yield conn.cursor()
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def tables_exist(cur) -> bool:
    cur.execute("SELECT to_regclass('public.assessment_results') AS t, to_regclass('public.attempts') AS a")
    row = cur.fetchone()
    return bool(row and row["t"] and row["a"])


def _iso(value) -> Optional[str]:
    return value.isoformat() if value is not None else None


def _num(value) -> Optional[float]:
    if value is None:
        return None
    f = float(value)
    return int(f) if f.is_integer() else f


def _visible_learners(cur, user) -> List[Dict[str, Any]]:
    """The learners the caller may read, each with the cohort they are seen through."""
    if user.role in LEARNER_ROLES:
        cur.execute(
            """
            SELECT u.id, u.first_name, u.last_name, u.role, c.id AS cohort_id, c.name AS cohort_name
            FROM users u
            LEFT JOIN cohort_members cm ON cm.user_id = u.id
            LEFT JOIN cohorts c ON c.id = cm.cohort_id
            WHERE u.id = %s
            ORDER BY cm.joined_at NULLS LAST
            LIMIT 1
            """,
            (user.id,),
        )
    elif user.role == "instructor":
        cur.execute(
            """
            SELECT DISTINCT ON (u.id) u.id, u.first_name, u.last_name, u.role, c.id AS cohort_id, c.name AS cohort_name
            FROM cohorts c
            JOIN cohort_members cm ON cm.cohort_id = c.id
            JOIN users u ON u.id = cm.user_id
            WHERE c.owner_id = %s
            ORDER BY u.id, c.created_at
            """,
            (user.id,),
        )
    elif user.role == "admin" and user.institution_id:
        cur.execute(
            """
            SELECT DISTINCT ON (u.id) u.id, u.first_name, u.last_name, u.role, c.id AS cohort_id, c.name AS cohort_name
            FROM users u
            LEFT JOIN cohort_members cm ON cm.user_id = u.id
            LEFT JOIN cohorts c ON c.id = cm.cohort_id
            WHERE u.institution_id = %s AND u.role = ANY(%s)
            ORDER BY u.id, c.created_at NULLS LAST
            """,
            (user.institution_id, list(LEARNER_ROLES)),
        )
    else:
        return []
    return [dict(r) for r in cur.fetchall()]


def _visible_cohorts(cur, user, learners: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    if user.role == "instructor":
        cur.execute("SELECT id, name, owner_id, created_at FROM cohorts WHERE owner_id = %s ORDER BY created_at", (user.id,))
    else:
        ids = sorted({str(l["cohort_id"]) for l in learners if l.get("cohort_id")})
        if not ids:
            return []
        cur.execute("SELECT id, name, owner_id, created_at FROM cohorts WHERE id = ANY(%s::uuid[]) ORDER BY created_at", (ids,))
    return [
        {"id": str(r["id"]), "name": r["name"], "owner_id": str(r["owner_id"]), "created_at": _iso(r["created_at"])}
        for r in cur.fetchall()
    ]


def _attempts(cur, learner_ids: List[str]) -> List[Dict[str, Any]]:
    if not learner_ids:
        return []
    cur.execute(
        """
        SELECT a.id, a.resident_id, a.session_id, a.plan_id, a.mode, a.difficulty, a.implant_design, a.fixation,
               a.status, a.current_scene, a.started_at, a.completed_at,
               p.case_id, COALESCE(cv.title, c.name) AS case_title, pr.name AS procedure_name,
               r.id AS result_id, r.overall_score, r.max_score, r.pass_mark, r.passed, r.critical_errors, r.capped,
               r.percentile, r.categories, r.parameters, r.scene_results, r.feedback, r.payload,
               r.scoring_version, r.assessed_at
        FROM attempts a
        JOIN plans p ON p.id = a.plan_id
        LEFT JOIN cases c ON c.id = p.case_id
        LEFT JOIN case_versions cv ON cv.id = p.case_version_id
        LEFT JOIN procedures pr ON pr.id = c.procedure_id
        LEFT JOIN assessment_results r ON r.attempt_id = a.id
        WHERE a.resident_id = ANY(%s::uuid[])
        ORDER BY a.started_at DESC NULLS LAST
        """,
        (learner_ids,),
    )
    out = []
    for r in cur.fetchall():
        result = None
        if r["result_id"]:
            payload = r["payload"] or {}
            result = {
                "overall_score": _num(r["overall_score"]),
                "max_score": _num(r["max_score"]),
                "pass_mark": _num(r["pass_mark"]),
                "passed": r["passed"],
                "critical_errors": r["critical_errors"],
                "capped": r["capped"],
                "percentile": r["percentile"],
                "categories": r["categories"],
                "parameters": r["parameters"],
                "scene_results": r["scene_results"],
                "feedback": r["feedback"],
                "reason_codes": payload.get("reason_codes", []),
                # The scorer's own working, so the report can show how a total was reached.
                "rules": payload.get("rules"),
                "planning": payload.get("planning"),
                "sample_data": bool((payload.get("inputs") or {}).get("sample_data")),
                "scoring_version": r["scoring_version"],
                "assessed_at": _iso(r["assessed_at"]),
            }
        out.append({
            "id": str(r["id"]),
            "resident_id": str(r["resident_id"]),
            "session_id": str(r["session_id"]) if r["session_id"] else None,
            "plan_id": str(r["plan_id"]),
            "case_id": str(r["case_id"]) if r["case_id"] else None,
            "case_title": r["case_title"],
            "procedure_name": r["procedure_name"],
            "mode": r["mode"],
            "difficulty": r["difficulty"],
            "implant_design": r["implant_design"],
            "fixation": r["fixation"],
            "status": r["status"],
            "current_scene": r["current_scene"],
            "started_at": _iso(r["started_at"]),
            "completed_at": _iso(r["completed_at"]),
            "result": result,
        })
    return out


def results_for(user) -> Dict[str, Any]:
    with _cursor() as cur:
        if not tables_exist(cur):
            raise ResultsUnavailable()
        learners = _visible_learners(cur, user)
        cohorts = _visible_cohorts(cur, user, learners)
        attempts = _attempts(cur, [str(l["id"]) for l in learners])

    last_active: Dict[str, str] = {}
    for a in attempts:
        at = a["completed_at"] or a["started_at"]
        if at and at > last_active.get(a["resident_id"], ""):
            last_active[a["resident_id"]] = at

    return {
        "learners": [
            {
                "id": str(l["id"]),
                "display_name": f"{l['first_name']} {l['last_name']}".strip(),
                "role": l["role"],
                "cohort_id": str(l["cohort_id"]) if l.get("cohort_id") else None,
                "cohort_name": l.get("cohort_name"),
                "last_active_at": last_active.get(str(l["id"])),
            }
            for l in learners
        ],
        "cohorts": cohorts,
        "attempts": attempts,
    }
