"""
Pre-operative plans, kept in the database (table `plans`, migration 013).

    create_plan   start a draft for one case (an institution case, or the learner's own personal case)
    list_plans    the caller's plans, or (staff) the plans of the learners they supervise
    get_plan      one plan, with its sealed snapshot
    update_plan   save planner work into a draft (a whitelist of payload keys, merged, never replaced)
    lock_plan     seal a draft: freeze it, record the VR payload, and make it sendable to a headset

Why this exists: the dashboard used to keep plans in the Next.js server's memory, so every restart lost them.
The rules the dashboard enforces (which keys the planner may write, the assessment freezing once the learner
moves on, a locked plan never changing) are repeated here, because a browser-side rule is not a rule. The
database's own trigger (`plans_lock_guard`) is the last line: it refuses any change to a locked plan.

Nothing here applies a migration. Until 013 is applied every entry point raises PlanUnavailable.
"""
from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from core.connect.contract import validate_vr_payload
from services import connect_service as cs

# What the planner screens may write (mirrors dashboard/src/lib/data/plan_lock.ts). Anything else, notably
# `v1_vr_payload` and `session_config`, is set by the server at lock time and refused here.
WRITABLE_PAYLOAD_KEYS = (
    "v1_assessment",
    "assessment_landmarks",
    "scan_calibration",
    "v1_tibial",
    "tibial_planning",
    "v1_femoral",
    "femoral_planning",
)
# Frozen once the learner continues past the assessment (V1 PDF p.3, p.6).
ASSESSMENT_LOCKED_KEYS = ("v1_assessment", "assessment_landmarks", "scan_calibration")

MODES = ("training", "assessment")
DIFFICULTIES = ("beginner", "intermediate", "expert")
DESIGNS = ("CR", "PS")
FIXATIONS = ("cemented", "cementless")
CONFIG_KEYS = ("mode", "difficulty", "implant_design", "fixation")

MAX_UPDATE_BYTES = 1_000_000
DEFAULT_LIMIT, MAX_LIMIT = 200, 500

PLAN_COLUMNS = (
    "p.id, p.owner_id, p.case_id, p.personal_case_id, p.case_version_id, p.workflow, p.session_config, p.payload, "
    "p.step_timings, p.preset_name, p.status, p.locked_version_id, p.locked_at, p.locked_by, p.created_at, p.updated_at, "
    "(SELECT a.id FROM attempts a WHERE a.plan_id = p.id) AS attempt_id"
)


class PlanUnavailable(Exception):
    """Migration 013 has not been applied."""


class PlanError(Exception):
    def __init__(self, status: int, detail: str):
        super().__init__(detail)
        self.status, self.detail = status, detail


def _require_plans(cur) -> None:
    cur.execute("SELECT to_regclass('public.plans') AS p, to_regclass('public.attempts') AS t")
    row = cur.fetchone()
    if not row or not row["p"] or not row["t"]:
        raise PlanUnavailable()


def _uuid_or_none(value: Any) -> Optional[str]:
    try:
        return str(uuid.UUID(str(value)))
    except (ValueError, AttributeError, TypeError):
        return None


def _iso(value) -> Optional[str]:
    return value.isoformat() if value is not None else None


def _clean_config(config: Any, *, need: tuple = ()) -> Dict[str, str]:
    """Only the four known setup choices, each a known value. `need` names the ones that must be present."""
    if not isinstance(config, dict):
        raise PlanError(422, "session_config must be an object.")
    unknown = [k for k in config if k not in CONFIG_KEYS]
    if unknown:
        raise PlanError(422, f"session_config has fields that cannot be set: {', '.join(sorted(unknown))}.")
    allowed = {"mode": MODES, "difficulty": DIFFICULTIES, "implant_design": DESIGNS, "fixation": FIXATIONS}
    out: Dict[str, str] = {}
    for key, value in config.items():
        if value is None or value == "":
            continue
        if value not in allowed[key]:
            raise PlanError(422, f"session_config.{key} must be one of {', '.join(allowed[key])}.")
        out[key] = value
    missing = [k for k in need if k not in out]
    if missing:
        raise PlanError(422, f"session_config needs {', '.join(missing)}.")
    return out


# ---------------------------------------------------------------------------------------------------------
# Reading
# ---------------------------------------------------------------------------------------------------------
def _headsets_for(cur, plan_ids: List[str]) -> Dict[str, Dict[str, Any]]:
    """The newest headset assignment of each plan, when migration 015 is there (otherwise none)."""
    if not plan_ids:
        return {}
    cur.execute("SELECT to_regclass('public.assignments') AS a")
    row = cur.fetchone()
    if not row or not row["a"]:
        return {}
    cur.execute(
        "SELECT DISTINCT ON (plan_id) plan_id, status, code_expires_at, paired_at, created_at "
        "FROM assignments WHERE plan_id = ANY(%s::uuid[]) ORDER BY plan_id, created_at DESC",
        (plan_ids,),
    )
    now = datetime.now(timezone.utc)
    out: Dict[str, Dict[str, Any]] = {}
    for r in cur.fetchall():
        status = r["status"]
        if status == "pending" and r["code_expires_at"] <= now:
            status = "expired"  # derived: a read writes nothing
        out[str(r["plan_id"])] = {"status": status, "code_expires_at": _iso(r["code_expires_at"]), "paired_at": _iso(r["paired_at"])}
    return out


def _plan_json(row: Dict[str, Any], headsets: Dict[str, Dict[str, Any]], *, snapshot: bool = False) -> Dict[str, Any]:
    locked = None
    if row["status"] == "locked":
        locked = {
            "version_id": str(row["locked_version_id"]),
            "sealed_by": str(row["locked_by"]) if row.get("locked_by") else None,
            "sealed_at": _iso(row["locked_at"]),
        }
        if snapshot:
            locked["payload"] = row.get("locked_snapshot")
    return {
        "id": str(row["id"]),
        "owner_id": str(row["owner_id"]),
        "case_id": str(row["case_id"] or row["personal_case_id"]),
        "is_personal_case": row["personal_case_id"] is not None,
        "workflow": row["workflow"],
        "session_config": row["session_config"] or {},
        "payload": row["payload"] or {},
        "step_timings": row["step_timings"] or {},
        "preset_name": row["preset_name"],
        "status": row["status"],
        "locked": locked,
        "attempt_id": str(row["attempt_id"]) if row.get("attempt_id") else None,
        "headset": headsets.get(str(row["id"])),
        "created_at": _iso(row["created_at"]),
        "updated_at": _iso(row["updated_at"]),
    }


def _can_read(cur, user, owner_id: str) -> bool:
    """The owner; the instructor who supervises them; an administrator of the same institution."""
    if str(user.id) == str(owner_id):
        return True
    if user.role == "instructor":
        return cs._is_supervised(cur, str(owner_id), str(user.id))
    if user.role == "admin" and user.institution_id:
        cur.execute("SELECT 1 FROM users WHERE id = %s AND institution_id = %s", (owner_id, user.institution_id))
        return cur.fetchone() is not None
    return False


def _fetch(cur, plan_id: str, *, snapshot: bool = False, lock: bool = False) -> Optional[Dict[str, Any]]:
    extra = ", p.locked_snapshot" if snapshot else ""
    cur.execute(f"SELECT {PLAN_COLUMNS}{extra} FROM plans p WHERE p.id = %s{' FOR UPDATE OF p' if lock else ''}", (plan_id,))
    return cur.fetchone()


def get_plan(user, plan_id: str) -> Dict[str, Any]:
    pid = _uuid_or_none(plan_id)
    if not pid:
        raise PlanError(404, "Plan not found.")
    with cs.cursor() as cur:
        _require_plans(cur)
        row = _fetch(cur, pid, snapshot=True)
        # A plan the caller may not read is "not found", never "forbidden": its existence is not theirs to learn.
        if not row or not _can_read(cur, user, str(row["owner_id"])):
            raise PlanError(404, "Plan not found.")
        return _plan_json(row, _headsets_for(cur, [pid]), snapshot=True)


def list_plans(user, case_id: Optional[str] = None, supervised: bool = False, limit: int = DEFAULT_LIMIT) -> List[Dict[str, Any]]:
    limit = max(1, min(int(limit), MAX_LIMIT))
    where: List[str] = []
    params: List[Any] = []
    if supervised:
        if user.role == "instructor":
            where.append(
                "EXISTS (SELECT 1 FROM cohort_members cm JOIN cohorts c ON c.id = cm.cohort_id "
                "WHERE cm.user_id = p.owner_id AND c.owner_id = %s)"
            )
            params.append(user.id)
        elif user.role == "admin" and user.institution_id:
            where.append("EXISTS (SELECT 1 FROM users o WHERE o.id = p.owner_id AND o.institution_id = %s)")
            params.append(user.institution_id)
        else:
            raise PlanError(403, "Only staff can list the plans of the learners they supervise.")
    else:
        where.append("p.owner_id = %s")
        params.append(user.id)
    if case_id:
        cid = _uuid_or_none(case_id)
        if not cid:
            return []  # a built-in case has no stored plans
        where.append("(p.case_id = %s OR p.personal_case_id = %s)")
        params += [cid, cid]
    with cs.cursor() as cur:
        _require_plans(cur)
        cur.execute(
            f"SELECT {PLAN_COLUMNS} FROM plans p WHERE {' AND '.join(where)} ORDER BY p.updated_at DESC LIMIT %s",
            params + [limit],
        )
        rows = cur.fetchall()
        headsets = _headsets_for(cur, [str(r["id"]) for r in rows])
        return [_plan_json(r, headsets) for r in rows]


# ---------------------------------------------------------------------------------------------------------
# Writing
# ---------------------------------------------------------------------------------------------------------
def create_plan(user, case_id: Any, session_config: Any) -> Dict[str, Any]:
    cid = _uuid_or_none(case_id)
    if not cid:
        raise PlanError(422, "case_id must be the id of a case in the library or one of your own cases.")
    config = _clean_config(session_config, need=("mode", "difficulty"))

    with cs.cursor() as cur:
        _require_plans(cur)
        institution_case = personal_case = None
        version_id = None
        cur.execute(
            "SELECT id, published_version_id FROM cases WHERE id = %s AND institution_id IS NOT DISTINCT FROM %s",
            (cid, user.institution_id),
        )
        row = cur.fetchone()
        if row:
            institution_case, version_id = str(row["id"]), row["published_version_id"]
        else:
            cur.execute("SELECT id FROM learner_personal_cases WHERE id = %s AND owner_user_id = %s", (cid, user.id))
            if cur.fetchone():
                personal_case = cid
        if not institution_case and not personal_case:
            raise PlanError(404, "That case is not available to plan against.")

        # Stored exactly as the dashboard's PlanPayload; the setup choices live in both places by design.
        payload = {"workflow": "tkr", "case_id": cid, "session_config": config}
        cur.execute(
            """INSERT INTO plans (owner_id, case_id, personal_case_id, case_version_id, workflow, session_config, payload, step_timings)
               VALUES (%s, %s, %s, %s, 'tkr', %s, %s, '{}'::jsonb) RETURNING id""",
            (user.id, institution_case, personal_case, version_id, json.dumps(config), json.dumps(payload)),
        )
        new_id = str(cur.fetchone()["id"])
        row = _fetch(cur, new_id)
        return _plan_json(row, {})


def update_plan(user, plan_id: str, updates: Any) -> Dict[str, Any]:
    pid = _uuid_or_none(plan_id)
    if not pid:
        raise PlanError(404, "Plan not found.")
    if not isinstance(updates, dict) or not updates:
        raise PlanError(422, "Send the planner fields to save.")
    unknown = [k for k in updates if k not in WRITABLE_PAYLOAD_KEYS]
    if unknown:
        raise PlanError(422, f"These plan fields cannot be written from the planner: {', '.join(sorted(unknown))}.")
    try:
        body = json.dumps(updates, allow_nan=False)
    except (TypeError, ValueError):
        raise PlanError(422, "The plan contains a value that cannot be stored (NaN or not JSON).")
    if len(body) > MAX_UPDATE_BYTES:
        raise PlanError(422, "That update is too large to store.")

    with cs.cursor() as cur:
        _require_plans(cur)
        row = _fetch(cur, pid, lock=True)
        if not row or str(row["owner_id"]) != str(user.id):
            # Only the owner writes; anyone else gets the same answer as for a plan that does not exist.
            raise PlanError(404, "Plan not found.")
        if row["status"] != "draft":
            raise PlanError(409, "This plan is locked. Once locked, parameters cannot be modified in 2D software.")
        stored = row["payload"] or {}
        if stored.get("v1_assessment") and any(k in ASSESSMENT_LOCKED_KEYS for k in updates):
            raise PlanError(409, "The assessment is locked. Continuing to Tibial Planning locked it; start a new plan to measure again.")
        # `||` merges the top-level keys inside the database, so two saves in flight cannot overwrite each other's keys.
        cur.execute("UPDATE plans SET payload = payload || %s::jsonb WHERE id = %s AND status = 'draft' RETURNING id", (body, pid))
        if cur.fetchone() is None:
            raise PlanError(409, "This plan is locked. Once locked, parameters cannot be modified in 2D software.")
        row = _fetch(cur, pid)
        return _plan_json(row, {})


def lock_plan(user, plan_id: str, vr_payload: Any, session_config: Any = None) -> Dict[str, Any]:
    """Seal a draft. The stored planner state is what gets frozen, never what the browser says it is."""
    pid = _uuid_or_none(plan_id)
    if not pid:
        raise PlanError(404, "Plan not found.")
    choices = _clean_config(session_config or {})
    unwanted = [k for k in choices if k in ("mode", "difficulty")]
    if unwanted:
        raise PlanError(422, "Only the implant design and fixation can be chosen at lock time.")

    with cs.cursor() as cur:
        _require_plans(cur)
        row = _fetch(cur, pid, lock=True)
        if not row or str(row["owner_id"]) != str(user.id):
            raise PlanError(404, "Plan not found.")
        if row["status"] != "draft":
            raise PlanError(409, "This plan is already locked.")

        config = {**(row["session_config"] or {}), **choices}
        problems = validate_vr_payload(vr_payload)
        if config.get("difficulty") not in DIFFICULTIES:
            problems.append("session_config.difficulty is required")
        if config.get("implant_design") not in DESIGNS:
            problems.append("session_config.implant_design must be CR or PS")
        if config.get("fixation") not in FIXATIONS:
            problems.append("session_config.fixation must be cemented or cementless")
        if config.get("mode") not in MODES:
            problems.append("session_config.mode must be training or assessment")
        if problems:
            raise PlanError(422, "; ".join(problems))

        version_id = row["case_version_id"]
        if row["case_id"] and not version_id:
            cur.execute("SELECT published_version_id FROM cases WHERE id = %s", (row["case_id"],))
            found = cur.fetchone()
            version_id = found["published_version_id"] if found else None
            if not version_id:
                raise PlanError(409, "Publish the case before locking a plan against it.")

        payload = {**(row["payload"] or {}), "session_config": config, "v1_vr_payload": vr_payload}
        snapshot = json.dumps(payload)
        cur.execute(
            """UPDATE plans SET payload = %s, session_config = %s, case_version_id = %s, status = 'locked',
                      locked_version_id = %s, locked_at = now(), locked_by = %s, locked_snapshot = %s, vr_payload = %s
               WHERE id = %s AND status = 'draft' RETURNING id""",
            (snapshot, json.dumps(config), version_id, str(uuid.uuid4()), user.id, snapshot, json.dumps(vr_payload), pid),
        )
        if cur.fetchone() is None:
            raise PlanError(409, "This plan is already locked.")
        row = _fetch(cur, pid, snapshot=True)
        return _plan_json(row, _headsets_for(cur, [pid]), snapshot=True)
