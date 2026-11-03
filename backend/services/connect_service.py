"""
Dashboard <-> Quest 3: the database half (proposed migration 015, on top of 013).

    store_locked_plan   the planner's sealed plan -> a locked `plans` row                  [dashboard, signed in]
    create_assignment   "Send to headset": mint a one-time code for a locked plan         [dashboard, signed in]
    list_assignments    the status of what was sent                                        [dashboard, signed in]
    pair_device         the headset redeems the code -> bearer token + the CasePlan        [headset, no token yet]
    authenticate_device bearer token -> the paired device                                  [headset]
    device_plan         re-fetch the CasePlan of an assignment the device is paired to     [headset]
    ingest_report       a RunReport -> stored verbatim, attempt kept, scored when it can be [headset]

The rules live in `core/connect` and `core/calculations/session_scoring` (pure, tested). This module only
reads and writes rows around them. Nothing here applies a migration; until 015 is applied every entry point
raises ConnectUnavailable and the endpoints answer 404.
"""
from __future__ import annotations

import json
import uuid
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from core.calculations.session_scoring import score_attempt
from core.connect import pairing
from core.connect.case_plan import PlanNotSendable, build_case_plan, deformity_from
from core.connect.contract import (
    ATTEMPT_MODE,
    ATTEMPT_STATUS_FOR_OUTCOME,
    HEADSET_MODE_FOR,
    validate_run_report,
    validate_vr_payload,
)
from core.connect.report_bridge import to_attempt_input
from db.session import get_db_conn

SCORING_SOURCE = "headset-report"
THROTTLE = pairing.FailureThrottle()


class ConnectUnavailable(Exception):
    """Migration 013 or 015 has not been applied."""


class ConnectError(Exception):
    def __init__(self, status: int, detail: str, retry_after: Optional[int] = None):
        super().__init__(detail)
        self.status, self.detail, self.retry_after = status, detail, retry_after


@contextmanager
def cursor():
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
    cur.execute(
        "SELECT to_regclass('public.assignments') AS a, to_regclass('public.run_reports') AS r, "
        "to_regclass('public.plans') AS p, to_regclass('public.attempts') AS t"
    )
    row = cur.fetchone()
    return bool(row and all(row.values()))


def _require_tables(cur) -> None:
    if not tables_exist(cur):
        raise ConnectUnavailable()


def _iso(value) -> Optional[str]:
    return value.isoformat() if value is not None else None


def _utc_iso(value: datetime) -> str:
    return value.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _parse_time(text: Any) -> Optional[datetime]:
    if not isinstance(text, str):
        return None
    try:
        return datetime.fromisoformat(text.replace("Z", "+00:00"))
    except ValueError:
        return None


def _is_supervised(cur, resident_id: str, instructor_id: str) -> bool:
    cur.execute(
        "SELECT 1 FROM cohort_members cm JOIN cohorts c ON c.id = cm.cohort_id "
        "WHERE cm.user_id = %s AND c.owner_id = %s LIMIT 1",
        (resident_id, instructor_id),
    )
    return cur.fetchone() is not None


def _can_act_for(cur, user, resident_id: str) -> bool:
    """The learner themself, or the instructor who supervises them."""
    return str(user.id) == str(resident_id) or (user.role == "instructor" and _is_supervised(cur, str(resident_id), str(user.id)))


# ---------------------------------------------------------------------------------------------------------
# 1. The planner's sealed plan
# ---------------------------------------------------------------------------------------------------------
def store_locked_plan(user, body: Dict[str, Any]) -> Dict[str, Any]:
    """Keep a sealed plan so a headset can be sent it. The browser says what was sealed; the server checks
    that the case is the caller's to plan against and that the VR payload has the V1 shape."""
    case_id, personal_id = body.get("case_id"), body.get("personal_case_id")
    if bool(case_id) == bool(personal_id):
        raise ConnectError(422, "Give exactly one of case_id and personal_case_id.")
    problems = validate_vr_payload(body.get("vr_payload"))
    config = body.get("session_config") or {}
    if config.get("difficulty") not in ("beginner", "intermediate", "expert"):
        problems.append("session_config.difficulty is required")
    if config.get("implant_design") not in ("CR", "PS"):
        problems.append("session_config.implant_design must be CR or PS")
    if config.get("fixation") not in ("cemented", "cementless"):
        problems.append("session_config.fixation must be cemented or cementless")
    if config.get("mode") not in ("training", "assessment"):
        problems.append("session_config.mode must be training or assessment")
    if not isinstance(body.get("payload"), dict):
        problems.append("payload (the planner state) is required")
    if problems:
        raise ConnectError(422, "; ".join(problems))

    with cursor() as cur:
        _require_tables(cur)
        version_id = None
        if case_id:
            cur.execute(
                "SELECT published_version_id FROM cases WHERE id = %s AND institution_id IS NOT DISTINCT FROM %s",
                (case_id, user.institution_id),
            )
            row = cur.fetchone()
            if not row or not row["published_version_id"]:
                raise ConnectError(404, "That case is not available to plan against.")
            version_id = row["published_version_id"]
        else:
            cur.execute("SELECT 1 FROM learner_personal_cases WHERE id = %s AND owner_user_id = %s", (personal_id, user.id))
            if not cur.fetchone():
                raise ConnectError(404, "That personal case is not yours.")

        locked_version = str(body.get("locked_version_id") or uuid.uuid4())
        cur.execute(
            """INSERT INTO plans (owner_id, case_id, personal_case_id, case_version_id, session_config, payload, step_timings,
                                  preset_name, status, locked_version_id, locked_at, locked_by, locked_snapshot, vr_payload)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'locked', %s, now(), %s, %s, %s)
               ON CONFLICT (locked_version_id) WHERE locked_version_id IS NOT NULL DO NOTHING
               RETURNING id""",
            (user.id, case_id, personal_id, version_id, json.dumps(config), json.dumps(body["payload"]),
             json.dumps(body.get("step_timings") or {}), body.get("preset_name"), locked_version, user.id,
             json.dumps(body["payload"]), json.dumps(body["vr_payload"])),
        )
        row = cur.fetchone()
        if row is None:  # the same sealed version again: idempotent, but only for its owner
            cur.execute("SELECT id, owner_id FROM plans WHERE locked_version_id = %s", (locked_version,))
            row = cur.fetchone()
            if not row or str(row["owner_id"]) != str(user.id):
                raise ConnectError(409, "That sealed version already exists.")
        return {"id": str(row["id"]), "status": "locked", "locked_version_id": locked_version}


# ---------------------------------------------------------------------------------------------------------
# 2. "Send to headset"
# ---------------------------------------------------------------------------------------------------------
def create_assignment(user, plan_id: str, headset_mode: Optional[str] = None, session_id: Optional[str] = None) -> Dict[str, Any]:
    with cursor() as cur:
        _require_tables(cur)
        cur.execute("SELECT id, owner_id, status, session_config FROM plans WHERE id = %s", (plan_id,))
        plan = cur.fetchone()
        if not plan or not _can_act_for(cur, user, plan["owner_id"]):
            raise ConnectError(404, "Plan not found.")      # not "forbidden": do not confirm that it exists
        if plan["status"] != "locked":
            raise ConnectError(409, "Lock the plan before sending it to a headset.")
        if headset_mode is not None and headset_mode not in ("Guided", "Practice", "Exam"):
            raise ConnectError(422, "mode must be Guided, Practice or Exam.")

        cur.execute("SELECT 1 FROM attempts WHERE plan_id = %s AND status IN ('completed', 'submitted', 'assessed')", (plan_id,))
        if cur.fetchone():
            raise ConnectError(409, "This plan has already been performed. Plan the case again to repeat it.")

        # Houseclean first: codes past their ten minutes are expired, and a fresh send replaces an unused code.
        cur.execute("UPDATE assignments SET status = 'expired' WHERE status = 'pending' AND code_expires_at <= now()")
        cur.execute("UPDATE assignments SET status = 'cancelled' WHERE plan_id = %s AND status = 'pending'", (plan_id,))
        cur.execute("SELECT 1 FROM assignments WHERE plan_id = %s AND status IN ('paired', 'running')", (plan_id,))
        if cur.fetchone():
            raise ConnectError(409, "This plan is already with a headset.")

        mode = headset_mode or HEADSET_MODE_FOR.get((plan["session_config"] or {}).get("mode", "training"), "Practice")
        expires = datetime.now(timezone.utc) + pairing.CODE_TTL
        for _ in range(8):   # a collision with another live code is a one-in-a-million retry
            code = pairing.generate_code()
            cur.execute(
                """INSERT INTO assignments (plan_id, resident_id, created_by, session_id, headset_mode, status,
                                            code_hash, code_expires_at)
                   VALUES (%s, %s, %s, %s, %s, 'pending', %s, %s)
                   ON CONFLICT (code_hash) WHERE status = 'pending' DO NOTHING
                   RETURNING id""",
                (plan_id, plan["owner_id"], user.id, session_id, mode, pairing.hash_code(code), expires),
            )
            row = cur.fetchone()
            if row:
                return {
                    "id": str(row["id"]), "plan_id": str(plan_id), "status": "pending", "headset_mode": mode,
                    "code": code,                      # shown once, never stored in the clear
                    "code_expires_at": _iso(expires),
                }
        raise ConnectError(503, "Could not mint a pairing code; try again.")


def list_assignments(user, plan_id: Optional[str] = None, limit: int = 20) -> List[Dict[str, Any]]:
    """What was sent, newest first, with where each has got to. Never includes a code."""
    with cursor() as cur:
        _require_tables(cur)
        where, params = "", []
        if user.role == "instructor":
            where = ("WHERE (a.created_by = %s OR EXISTS (SELECT 1 FROM cohort_members cm JOIN cohorts c ON c.id = cm.cohort_id "
                     "WHERE cm.user_id = a.resident_id AND c.owner_id = %s))")
            params = [user.id, user.id]
        else:
            where = "WHERE a.resident_id = %s"
            params = [user.id]
        if plan_id:
            where += " AND a.plan_id = %s"
            params.append(plan_id)
        cur.execute(
            f"""SELECT a.id, a.plan_id, a.resident_id, a.headset_mode, a.status, a.code_expires_at, a.paired_at, a.created_at,
                       d.name AS device_name,
                       (SELECT r.outcome FROM run_reports r WHERE r.assignment_id = a.id ORDER BY r.received_at DESC LIMIT 1) AS last_outcome,
                       (SELECT r.scoring_status FROM run_reports r WHERE r.assignment_id = a.id ORDER BY r.received_at DESC LIMIT 1) AS scoring_status,
                       (SELECT r.attempt_id FROM run_reports r WHERE r.assignment_id = a.id ORDER BY r.received_at DESC LIMIT 1) AS attempt_id
                FROM assignments a LEFT JOIN devices d ON d.id = a.device_id
                {where} ORDER BY a.created_at DESC LIMIT %s""",
            params + [limit],
        )
        now = datetime.now(timezone.utc)
        out = []
        for r in cur.fetchall():
            status = r["status"]
            if status == "pending" and r["code_expires_at"] <= now:
                status = "expired"      # derived: nothing is written by a read
            out.append({
                "id": str(r["id"]), "plan_id": str(r["plan_id"]), "resident_id": str(r["resident_id"]),
                "headset_mode": r["headset_mode"], "status": status, "device_name": r["device_name"],
                "code_expires_at": _iso(r["code_expires_at"]) if status == "pending" else None,
                "paired_at": _iso(r["paired_at"]), "created_at": _iso(r["created_at"]),
                "last_outcome": r["last_outcome"], "scoring_status": r["scoring_status"],
                "attempt_id": str(r["attempt_id"]) if r["attempt_id"] else None,
            })
        return out


# ---------------------------------------------------------------------------------------------------------
# 3. The headset
# ---------------------------------------------------------------------------------------------------------
def _case_plan_for(cur, assignment: Dict[str, Any]) -> Dict[str, Any]:
    """The CasePlan of an assignment, built from the locked plan and the case, never from the browser."""
    cur.execute(
        "SELECT id, owner_id, case_id, personal_case_id, case_version_id, session_config, payload, vr_payload "
        "FROM plans WHERE id = %s",
        (assignment["plan_id"],),
    )
    plan = cur.fetchone()
    if not plan:
        raise ConnectError(404, "The plan behind this assignment is gone.")

    if plan["case_version_id"]:
        cur.execute("SELECT title, pathology, pathology_label, patient FROM case_versions WHERE id = %s", (plan["case_version_id"],))
    else:
        cur.execute("SELECT title, pathology, pathology_label, patient FROM learner_personal_cases WHERE id = %s", (plan["personal_case_id"],))
    case = cur.fetchone() or {}
    patient = case.get("patient") or {}

    cur.execute(
        """SELECT u.first_name, u.last_name, i.name AS institution,
                  (SELECT c.name FROM cohort_members cm JOIN cohorts c ON c.id = cm.cohort_id
                    WHERE cm.user_id = u.id ORDER BY cm.joined_at DESC NULLS LAST LIMIT 1) AS cohort,
                  (SELECT ou.first_name || ' ' || ou.last_name FROM cohort_members cm JOIN cohorts c ON c.id = cm.cohort_id
                     JOIN users ou ON ou.id = c.owner_id WHERE cm.user_id = u.id ORDER BY cm.joined_at DESC NULLS LAST LIMIT 1) AS instructor
           FROM users u LEFT JOIN institutions i ON i.id = u.institution_id WHERE u.id = %s""",
        (plan["owner_id"],),
    )
    who = cur.fetchone() or {}
    vr = plan["vr_payload"] or {}
    targets = (plan["payload"] or {}).get("execution_targets")
    try:
        return build_case_plan(
            assignment_id=str(assignment["id"]),
            case_id=str(plan["case_id"] or plan["personal_case_id"]),
            issued_at_utc=_utc_iso(datetime.now(timezone.utc)),
            vr_payload=vr, session_config=plan["session_config"] or {}, execution_targets=targets,
            headset_mode=assignment["headset_mode"],
            trainee={"id": str(plan["owner_id"]), "display_name": f"{who.get('first_name', '')} {who.get('last_name', '')}".strip(),
                     "cohort": who.get("cohort"), "institution": who.get("institution")},
            instructor_name=who.get("instructor") or "",
            deformity=deformity_from(case.get("pathology_label"), case.get("pathology"), case.get("title")),
            deformity_deg=abs(float(vr.get("assessment", {}).get("mHKA_deg", 0.0))) if vr.get("assessment") else None,
            summary=case.get("title") or "",
            fixed_flexion_deg=float(patient.get("fixed_flexion_deg") or 0),
        )
    except PlanNotSendable as exc:
        raise ConnectError(409, f"This plan cannot be sent to a headset: {exc}.")


def pair_device(body: Dict[str, Any], client_key: str) -> Dict[str, Any]:
    """The headset types in a code. 404 unknown, 410 expired or used, 429 too many wrong tries."""
    wait = THROTTLE.retry_after(client_key)
    if wait:
        raise ConnectError(429, "Too many wrong codes. Wait a moment and try again.", retry_after=wait)
    for name in ("deviceId", "deviceName", "appVersion"):
        if not isinstance(body.get(name), str) or (name == "deviceId" and not body[name].strip()):
            raise ConnectError(422, f"{name} is required.")
    code = pairing.normalise_code(str(body.get("code", "")))
    now = datetime.now(timezone.utc)

    with cursor() as cur:
        _require_tables(cur)
        row = None
        if code is not None:
            cur.execute(
                "SELECT * FROM assignments WHERE code_hash = %s ORDER BY (status = 'pending') DESC, created_at DESC LIMIT 1 FOR UPDATE",
                (pairing.hash_code(code),),
            )
            row = cur.fetchone()
        decision = pairing.decide_redeem(row, now)
        if not decision.ok:
            THROTTLE.record_failure(client_key)
            raise ConnectError(decision.status, decision.reason)

        cur.execute(
            """INSERT INTO devices (device_id, name, app_version, last_seen_at) VALUES (%s, %s, %s, now())
               ON CONFLICT (device_id) DO UPDATE SET name = EXCLUDED.name, app_version = EXCLUDED.app_version, last_seen_at = now()
               RETURNING id""",
            (body["deviceId"].strip(), body["deviceName"][:120], body["appVersion"][:40]),
        )
        device_uuid = cur.fetchone()["id"]
        cur.execute(
            """UPDATE assignments SET status = 'paired', code_consumed_at = now(), paired_at = now(), device_id = %s
               WHERE id = %s AND status = 'pending' AND code_consumed_at IS NULL AND code_expires_at > now()
               RETURNING *""",
            (device_uuid, row["id"]),
        )
        assignment = cur.fetchone()
        if assignment is None:   # lost a race with another redeem or the clock
            THROTTLE.record_failure(client_key)
            raise ConnectError(410, "Code already used, ask for a new one")

        case_plan = _case_plan_for(cur, assignment)

        # One live token per device: pairing again replaces it, and a backlog from an earlier assignment still
        # uploads under the new token because the check is "was this device paired to that assignment".
        cur.execute("UPDATE device_tokens SET revoked_at = now() WHERE device_id = %s AND revoked_at IS NULL", (device_uuid,))
        token = pairing.new_token()
        expires = now + pairing.TOKEN_TTL
        cur.execute("INSERT INTO device_tokens (device_id, token_hash, expires_at) VALUES (%s, %s, %s)",
                    (device_uuid, pairing.hash_token(token), expires))
    THROTTLE.reset(client_key)
    return {"assignmentId": str(assignment["id"]), "token": token, "tokenExpiresAt": _utc_iso(expires), "casePlan": case_plan}


def authenticate_device(cur, token: str) -> Optional[Dict[str, Any]]:
    if not token:
        return None
    cur.execute(
        """SELECT d.id AS uuid, d.device_id FROM device_tokens t JOIN devices d ON d.id = t.device_id
           WHERE t.token_hash = %s AND t.revoked_at IS NULL AND t.expires_at > now()""",
        (pairing.hash_token(token),),
    )
    row = cur.fetchone()
    if row:
        cur.execute("UPDATE devices SET last_seen_at = now() WHERE id = %s", (row["uuid"],))
    return row


def _paired_assignment(cur, device: Dict[str, Any], assignment_id: str, lock: bool = False) -> Dict[str, Any]:
    cur.execute("SELECT * FROM assignments WHERE id = %s" + (" FOR UPDATE" if lock else ""), (assignment_id,))
    row = cur.fetchone()
    if not row:
        raise ConnectError(404, "Unknown assignment.")
    if row["device_id"] is None or str(row["device_id"]) != str(device["uuid"]):
        raise ConnectError(403, "This headset was not paired to that assignment.")
    return row


def device_plan(device: Dict[str, Any], assignment_id: str) -> Dict[str, Any]:
    with cursor() as cur:
        _require_tables(cur)
        row = _paired_assignment(cur, device, assignment_id)
        if row["status"] in ("cancelled", "expired"):
            raise ConnectError(410, "This assignment is no longer active.")
        return _case_plan_for(cur, row)


# ---------------------------------------------------------------------------------------------------------
# 4. Reports back
# ---------------------------------------------------------------------------------------------------------
def _score_and_store(cur, plan: Dict[str, Any], assignment: Dict[str, Any], attempt_id: str, run: str,
                     report: Dict[str, Any]) -> Dict[str, Any]:
    """Score a completed report if the scorer has everything; otherwise say what is missing. Returns the
    run_reports scoring columns."""
    cur.execute("SELECT 1 FROM assessment_results WHERE attempt_id = %s", (attempt_id,))
    if cur.fetchone():
        return {"scoring_status": "not_scored", "scoring_note": ["a result already exists; a re-score is a new attempt"]}
    if not plan["case_version_id"]:
        return {"scoring_status": "not_scored", "scoring_note": ["a personal case has no assessment criteria, so it is practice only"]}

    cur.execute(
        "SELECT name, parameter, unit, target_value, tolerance_max, severity_rule FROM assessment_criteria WHERE case_version_id = %s ORDER BY name",
        (plan["case_version_id"],),
    )
    criteria = [{"name": r["name"], "parameter": r["parameter"], "unit": r["unit"], "target_value": float(r["target_value"]),
                 "tolerance": float(r["tolerance_max"] or 0), "severity_rule": r["severity_rule"] or {}} for r in cur.fetchall()]
    if not criteria:
        return {"scoring_status": "not_scored", "scoring_note": ["the case has no assessment criteria"]}

    vr = plan["vr_payload"]
    planned_measurements = {k: float(v) for k, v in vr["assessment"].items()}
    planned_measurements["tibial_size"] = float(vr["tibial_component"]["implant_size"])
    planned_measurements["femoral_size"] = float(vr["femoral_component"]["implant_size"])

    case_plan = _case_plan_for(cur, assignment)
    bridged = to_attempt_input(report, case_plan=case_plan, session_config=plan["session_config"],
                               planned_measurements=planned_measurements, planning_criteria=criteria)
    if bridged.attempt_input is None:
        return {"scoring_status": "awaiting_inputs", "scoring_note": bridged.missing}

    r = score_attempt(bridged.attempt_input)
    payload = dict(r.get("payload") or {}, source=SCORING_SOURCE, run_id=run, report_revision=report["reportRevision"],
                   reported_by_device=bridged.reported)
    cur.execute(
        """INSERT INTO assessment_results (attempt_id, overall_score, max_score, pass_mark, passed, critical_errors, capped,
                                          percentile, categories, parameters, scene_results, feedback, payload, scoring_version)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
        (attempt_id, r["overall_score"], r["max_score"], r["pass_mark"], r["passed"], r["critical_errors"], r["capped"],
         None, json.dumps(r["categories"]), json.dumps(r["parameters"]), json.dumps(r["scene_results"]),
         json.dumps(r["feedback"]), json.dumps(payload), r["scoring_version"]),
    )
    cur.execute("UPDATE attempts SET status = 'assessed' WHERE id = %s", (attempt_id,))
    return {"scoring_status": "scored", "scoring_note": []}


def ingest_report(device: Dict[str, Any], assignment_id: str, run_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
    problems = validate_run_report(body)
    if not problems:
        if body["assignmentId"] != assignment_id or body["runId"] != run_id:
            problems.append("assignmentId and runId must match the address")
        if body["deviceId"] != device["device_id"]:
            problems.append("deviceId is not the paired device")
    if problems:
        raise ConnectError(422, "; ".join(problems))      # poison: a retry can never succeed

    with cursor() as cur:
        _require_tables(cur)
        assignment = _paired_assignment(cur, device, assignment_id, lock=True)
        if assignment["status"] in ("cancelled", "expired"):
            raise ConnectError(410, "This assignment is no longer active.")

        cur.execute("SELECT id, report_revision, received_at, attempt_id FROM run_reports WHERE assignment_id = %s AND run_id = %s FOR UPDATE",
                    (assignment_id, run_id))
        existing = cur.fetchone()
        revision = body["reportRevision"]
        if existing and revision <= existing["report_revision"]:
            # A retry or an old copy: harmless. Same revision = already have it; lower = we hold a newer one.
            return {"accepted": revision == existing["report_revision"], "receivedAtUtc": _utc_iso(existing["received_at"]),
                    "note": "already stored" if revision == existing["report_revision"] else "a newer revision is already stored"}

        cur.execute("SELECT id, owner_id, case_version_id, session_config, vr_payload FROM plans WHERE id = %s", (assignment["plan_id"],))
        plan = cur.fetchone()
        config = plan["session_config"]
        cur.execute("SELECT id, status FROM attempts WHERE plan_id = %s FOR UPDATE", (plan["id"],))
        attempt = cur.fetchone()
        if attempt and not (existing and existing["attempt_id"] and str(existing["attempt_id"]) == str(attempt["id"])):
            raise ConnectError(409, "This plan already has another run. Plan the case again to repeat it.")

        status = ATTEMPT_STATUS_FOR_OUTCOME[body["outcome"]]
        started, ended = _parse_time(body.get("startedAtUtc")), _parse_time(body.get("endedAtUtc"))
        if attempt is None:
            cur.execute(
                """INSERT INTO attempts (resident_id, session_id, plan_id, plan_version_id, mode, difficulty, implant_design, fixation,
                                         status, started_at, completed_at)
                   VALUES (%s, %s, %s, (SELECT locked_version_id FROM plans WHERE id = %s), %s, %s, %s, %s, %s, %s, %s) RETURNING id""",
                (plan["owner_id"], assignment["session_id"], plan["id"], plan["id"], ATTEMPT_MODE[body["mode"]], config["difficulty"],
                 config["implant_design"], config["fixation"], status, started,
                 ended if body["outcome"] == "Completed" else None),
            )
            attempt_id = str(cur.fetchone()["id"])
        else:
            attempt_id = str(attempt["id"])
            if attempt["status"] != "assessed":   # a result, once written, is final
                cur.execute("UPDATE attempts SET status = %s, completed_at = %s WHERE id = %s",
                            (status, ended if body["outcome"] == "Completed" else None, attempt_id))

        scoring = {"scoring_status": "not_scored", "scoring_note": ["the run did not finish, so it is not scored"]}
        if body["outcome"] == "Completed":
            scoring = _score_and_store(cur, plan, assignment, attempt_id, run_id, body)

        if existing:
            cur.execute(
                """UPDATE run_reports SET report_revision = %s, outcome = %s, schema_version = %s, payload = %s, attempt_id = %s,
                          scoring_status = %s, scoring_note = %s WHERE id = %s RETURNING received_at""",
                (revision, body["outcome"], body["schemaVersion"], json.dumps(body), attempt_id, scoring["scoring_status"],
                 json.dumps(scoring["scoring_note"]), existing["id"]),
            )
        else:
            cur.execute(
                """INSERT INTO run_reports (assignment_id, run_id, attempt_id, report_revision, outcome, schema_version, payload,
                                           scoring_status, scoring_note) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING received_at""",
                (assignment_id, run_id, attempt_id, revision, body["outcome"], body["schemaVersion"], json.dumps(body),
                 scoring["scoring_status"], json.dumps(scoring["scoring_note"])),
            )
        received = cur.fetchone()["received_at"]
        cur.execute("UPDATE assignments SET status = %s WHERE id = %s",
                    ("reported" if body["outcome"] == "Completed" else "running", assignment_id))
        return {"accepted": True, "receivedAtUtc": _utc_iso(received), "scoring": scoring["scoring_status"],
                "missing": scoring["scoring_note"] if scoring["scoring_status"] == "awaiting_inputs" else []}
