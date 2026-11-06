"""
Live view: the database half (migration 016 on top of 015).

Headset (bearer token from pairing):
    ingest_events   POST /assignments/{a}/runs/{r}/events   small JSON events + heartbeats -> live_runs, run_events
    store_frame     PUT  /assignments/{a}/runs/{r}/frame    the newest eye-view JPEG -> live_frames (overwritten)

Dashboard (signed-in user):
    read_live       GET /assignments/{a}/live?after=seq      the run's state, the events after seq, frame meta
    read_frame      GET /assignments/{a}/live/frame          the newest JPEG bytes
    active_runs     GET /live/active                         the runs live now that the caller may watch

Report ingest (connect_service.ingest_report) calls end_run_in to close the live run and drop its frame.

The rules are in core/connect/live_contract (pure, tested); this module only reads and writes rows around them,
reusing connect_service's cursor, device-to-assignment check and ConnectError. Until 016 is applied every entry
point raises ConnectUnavailable and the endpoints answer 404, which the headset reads as "live view not available"
and the dashboard as "not set up".

Live is advisory: nothing here scores, and a missing or stale row changes no result.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from core.connect import live_contract as lc
from core.connect.contract import PLAN_KEY_BY_NAME
from services.connect_service import (
    ConnectError,
    ConnectUnavailable,
    _case_plan_for,
    _iso,
    _paired_assignment,
    _require_tables,
    _utc_iso,
    cursor,
)


def live_tables_exist(cur) -> bool:
    cur.execute("SELECT to_regclass('public.live_runs') AS l, to_regclass('public.run_events') AS e, "
                "to_regclass('public.live_frames') AS f")
    row = cur.fetchone()
    return bool(row and all(row.values()))


def _require_live(cur) -> None:
    _require_tables(cur)
    if not live_tables_exist(cur):
        raise ConnectUnavailable()


def _now(now: Optional[datetime]) -> datetime:
    return now or datetime.now(timezone.utc)


def _state_of(row: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    if not row:
        return lc.empty_state()
    state = row.get("state")
    if isinstance(state, str):
        try:
            state = json.loads(state)
        except ValueError:
            state = None
    return dict(lc.empty_state(), **(state or {}))


# ---------------------------------------------------------------------------------------------------------
# 1. Events from the headset
# ---------------------------------------------------------------------------------------------------------
def _open_assignment(cur, device: Dict[str, Any], assignment_id: str) -> Dict[str, Any]:
    """The assignment this device may send live data for: paired to it, and not over."""
    row = _paired_assignment(cur, device, assignment_id, lock=True)
    if row["status"] in ("cancelled", "expired"):
        raise ConnectError(410, "This assignment is no longer active.")
    if row["status"] == "reported":
        raise ConnectError(409, "This assignment's run is already reported.")
    return row


def _live_run(cur, assignment_id: str, lock: bool = False) -> Optional[Dict[str, Any]]:
    cur.execute("SELECT * FROM live_runs WHERE assignment_id = %s" + (" FOR UPDATE" if lock else ""), (assignment_id,))
    return cur.fetchone()


def ingest_events(device: Dict[str, Any], assignment_id: str, run_id: str, body: Any,
                  now: Optional[datetime] = None) -> Dict[str, Any]:
    problems = lc.validate_event_batch(body)
    if not problems and body["deviceId"] != device["device_id"]:
        problems.append("deviceId is not the paired device")
    if problems:
        raise ConnectError(422, "; ".join(problems))
    now = _now(now)

    with cursor() as cur:
        _require_live(cur)
        assignment = _open_assignment(cur, device, assignment_id)
        row = _live_run(cur, assignment_id, lock=True)

        if row and row["run_id"] != run_id:
            if not row.get("ended_at"):
                # Two runs cannot be live on one assignment. A new run id replaces an ended one only.
                raise ConnectError(409, f"Another run ({row['run_id']}) is live on this assignment.")
            cur.execute("DELETE FROM live_frames WHERE assignment_id = %s", (assignment_id,))
            row = None

        state = _state_of(row)
        last_seq = int(row["last_seq"]) if row else 0
        events = sorted(body["events"], key=lambda e: e["seq"])
        accepted, duplicates = 0, 0
        started_at = row.get("started_at") if row else None
        ended_at = row.get("ended_at") if row else None
        outcome = row.get("outcome") if row else None

        for e in events:
            if e["seq"] <= last_seq:
                duplicates += 1
                continue
            state = lc.reduce_state(state, e)
            last_seq = e["seq"]
            accepted += 1
            if e["type"] == "run_started":
                started_at = started_at or lc.parse_utc(e.get("tUtc")) or now
                ended_at, outcome = None, None
            if e["type"] == "run_ended":
                ended_at, outcome = now, e.get("outcome")
            if e["type"] in lc.STORED_EVENT_TYPES:
                cur.execute(
                    """INSERT INTO run_events (assignment_id, run_id, seq, type, t_utc, elapsed_s, data)
                       VALUES (%s, %s, %s, %s, %s, %s, %s) ON CONFLICT DO NOTHING""",
                    (assignment_id, run_id, e["seq"], e["type"], lc.parse_utc(e.get("tUtc")), e.get("elapsedS"),
                     json.dumps(lc.event_data(e))),
                )

        if row is None:
            cur.execute(
                """INSERT INTO live_runs (assignment_id, run_id, device_id, last_seq, state, started_at, last_event_at, ended_at, outcome)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                (assignment_id, run_id, device["uuid"], last_seq, json.dumps(state), started_at, now, ended_at, outcome),
            )
            last_viewed_at = None
        else:
            cur.execute(
                """UPDATE live_runs SET run_id = %s, device_id = %s, last_seq = %s, state = %s, started_at = %s,
                          last_event_at = %s, ended_at = %s, outcome = %s WHERE assignment_id = %s""",
                (run_id, device["uuid"], last_seq, json.dumps(state), started_at, now, ended_at, outcome, assignment_id),
            )
            last_viewed_at = row.get("last_viewed_at")

        if ended_at is not None:
            cur.execute("DELETE FROM live_frames WHERE assignment_id = %s", (assignment_id,))

        # The first sign of a run moves the assignment on; `running` never moves backwards, and a report decides
        # the rest (connect_service.ingest_report).
        if assignment["status"] == "paired" and any(e["type"] == "run_started" for e in events):
            cur.execute("UPDATE assignments SET status = 'running' WHERE id = %s AND status = 'paired'", (assignment_id,))

        return {"accepted": accepted, "duplicates": duplicates, "lastSeq": last_seq, "serverTimeUtc": _utc_iso(now),
                "live": lc.live_block(last_viewed_at, now)}


# ---------------------------------------------------------------------------------------------------------
# 2. Frames from the headset
# ---------------------------------------------------------------------------------------------------------
def store_frame(device: Dict[str, Any], assignment_id: str, run_id: str, headers: Dict[str, str], jpeg: bytes,
                now: Optional[datetime] = None) -> Dict[str, Any]:
    status, problems = lc.validate_frame_headers(headers, len(jpeg or b""), (jpeg or b"")[:3])
    if problems:
        raise ConnectError(status, "; ".join(problems))
    meta = lc.frame_meta(headers)
    now = _now(now)

    with cursor() as cur:
        _require_live(cur)
        _open_assignment(cur, device, assignment_id)
        row = _live_run(cur, assignment_id, lock=True)
        if row is None or row["run_id"] != run_id:
            raise ConnectError(409, "No live run with that id on this assignment; send run_started first.")
        if row.get("ended_at"):
            raise ConnectError(409, "This run has ended.")

        cur.execute("SELECT seq FROM live_frames WHERE assignment_id = %s", (assignment_id,))
        have = cur.fetchone()
        if have and int(have["seq"]) >= meta["seq"]:
            accepted = False                                  # an older frame arriving late changes nothing
        else:
            accepted = True
            cur.execute(
                """INSERT INTO live_frames (assignment_id, run_id, seq, width, height, jpeg, captured_at, received_at)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                   ON CONFLICT (assignment_id) DO UPDATE SET run_id = EXCLUDED.run_id, seq = EXCLUDED.seq,
                       width = EXCLUDED.width, height = EXCLUDED.height, jpeg = EXCLUDED.jpeg,
                       captured_at = EXCLUDED.captured_at, received_at = EXCLUDED.received_at""",
                (assignment_id, run_id, meta["seq"], meta["width"], meta["height"], jpeg, meta["capturedAt"], now),
            )
        return {"accepted": accepted, "seq": meta["seq"], "serverTimeUtc": _utc_iso(now),
                "live": lc.live_block(row.get("last_viewed_at"), now)}


# ---------------------------------------------------------------------------------------------------------
# 3. Who may watch, and what they see
# ---------------------------------------------------------------------------------------------------------
def _visibility_where(user) -> Tuple[str, List[Any]]:
    """The assignments the caller may watch: their own, their cohorts' learners' (instructor), their institution's
    learners' (admin). Other residents may not: a run in exam mode is an assessment."""
    if user.role == "instructor":
        return ("(a.created_by = %s OR EXISTS (SELECT 1 FROM cohort_members cm JOIN cohorts c ON c.id = cm.cohort_id "
                "WHERE cm.user_id = a.resident_id AND c.owner_id = %s))", [user.id, user.id])
    if user.role == "admin":
        if not user.institution_id:
            return "FALSE", []
        return "EXISTS (SELECT 1 FROM users u WHERE u.id = a.resident_id AND u.institution_id = %s)", [user.institution_id]
    return "a.resident_id = %s", [user.id]


ASSIGNMENT_SELECT = """
    SELECT a.id, a.plan_id, a.resident_id, a.status, a.headset_mode, a.session_id, a.created_at,
           ru.first_name || ' ' || ru.last_name AS resident_name,
           p.session_config->>'implant_design' AS design, p.session_config->>'fixation' AS fixation,
           COALESCE(cv.title, pc.title, '') AS case_title,
           (SELECT r.outcome FROM run_reports r WHERE r.assignment_id = a.id ORDER BY r.received_at DESC LIMIT 1) AS report_outcome,
           (SELECT r.scoring_status FROM run_reports r WHERE r.assignment_id = a.id ORDER BY r.received_at DESC LIMIT 1) AS scoring_status,
           (SELECT r.attempt_id FROM run_reports r WHERE r.assignment_id = a.id ORDER BY r.received_at DESC LIMIT 1) AS attempt_id
    FROM assignments a
    JOIN users ru ON ru.id = a.resident_id
    JOIN plans p ON p.id = a.plan_id
    LEFT JOIN case_versions cv ON cv.id = p.case_version_id
    LEFT JOIN learner_personal_cases pc ON pc.id = p.personal_case_id
"""


def _visible_assignment(cur, user, assignment_id: str) -> Dict[str, Any]:
    where, params = _visibility_where(user)
    cur.execute(ASSIGNMENT_SELECT + f" WHERE a.id = %s AND {where}", [assignment_id] + params)
    row = cur.fetchone()
    if not row:
        raise ConnectError(404, "Unknown assignment.")     # a stranger's looks like it does not exist
    return row


def _summary(assignment: Dict[str, Any], run: Optional[Dict[str, Any]], now: datetime) -> Dict[str, Any]:
    state = _state_of(run)
    has_report = bool(assignment.get("report_outcome"))
    word = lc.live_state(assignment_status=assignment["status"], last_event_at=run.get("last_event_at") if run else None,
                         ended=bool(run and run.get("ended_at")), paused=bool(state.get("paused")),
                         has_report=has_report, now=now)
    last_event = run.get("last_event_at") if run else None
    return {
        "assignmentId": str(assignment["id"]), "planId": str(assignment["plan_id"]),
        "residentId": str(assignment["resident_id"]), "resident": assignment.get("resident_name") or "",
        "caseTitle": assignment.get("case_title") or "", "mode": assignment.get("headset_mode"),
        "design": assignment.get("design"), "fixation": assignment.get("fixation"),
        "assignmentStatus": assignment["status"], "liveState": word,
        "runId": run["run_id"] if run else None, "lastSeq": int(run["last_seq"]) if run else 0,
        "state": state,
        "startedAtUtc": _iso(run.get("started_at")) if run else None,
        "lastEventAtUtc": _iso(last_event),
        "secondsSinceEvent": (now - last_event).total_seconds() if last_event else None,
        "endedAtUtc": _iso(run.get("ended_at")) if run else None,
        "outcome": (run.get("outcome") if run else None) or assignment.get("report_outcome"),
        "reportOutcome": assignment.get("report_outcome"), "scoringStatus": assignment.get("scoring_status"),
        "attemptId": str(assignment["attempt_id"]) if assignment.get("attempt_id") else None,
        "serverTimeUtc": _utc_iso(now),
    }


def read_live(user, assignment_id: str, after: int = 0, now: Optional[datetime] = None) -> Dict[str, Any]:
    now = _now(now)
    after = max(0, int(after or 0))
    with cursor() as cur:
        _require_live(cur)
        assignment = _visible_assignment(cur, user, assignment_id)
        run = _live_run(cur, assignment_id)
        out = _summary(assignment, run, now)

        events: List[Dict[str, Any]] = []
        frame = None
        if run:
            cur.execute(
                "SELECT seq, type, t_utc, elapsed_s, data FROM run_events WHERE assignment_id = %s AND run_id = %s AND seq > %s "
                "ORDER BY seq LIMIT %s",
                (assignment_id, run["run_id"], after, lc.MAX_EVENTS_PER_READ),
            )
            for r in cur.fetchall():
                data = r["data"] if isinstance(r["data"], dict) else json.loads(r["data"] or "{}")
                events.append({"seq": int(r["seq"]), "type": r["type"], "tUtc": _iso(r["t_utc"]),
                               "elapsedS": float(r["elapsed_s"]) if r["elapsed_s"] is not None else None, **data})
            cur.execute("SELECT seq, width, height, captured_at, received_at FROM live_frames WHERE assignment_id = %s",
                        (assignment_id,))
            f = cur.fetchone()
            if f:
                frame = {"seq": int(f["seq"]), "width": f["width"], "height": f["height"],
                         "capturedAtUtc": _iso(f["captured_at"]), "receivedAtUtc": _iso(f["received_at"])}
            # Watching is a fact the headset acts on (it sends frames only then): stamp it, but not on every poll.
            if not run.get("ended_at") and lc.should_restamp(run.get("last_viewed_at"), now):
                cur.execute("UPDATE live_runs SET last_viewed_at = %s WHERE assignment_id = %s", (now, assignment_id))

        out["events"] = events
        out["frame"] = frame
        out["planValues"] = _plan_values(cur, assignment)
        return out


def _plan_values(cur, assignment: Dict[str, Any]) -> List[Dict[str, Any]]:
    """The planned figures the headset was sent, so the live page can set a live reading beside its plan. Advisory:
    a plan that cannot be rebuilt (gone, unsendable) gives an empty list, never an error on the live page."""
    try:
        plan = _case_plan_for(cur, assignment)
    except ConnectError:
        return []
    out = []
    for v in plan.get("values") or []:
        key = v.get("key")
        meta = PLAN_KEY_BY_NAME.get(key)
        out.append({"key": key, "label": meta.label if meta else key, "value": v.get("value"),
                    "tolerance": v.get("tolerance"), "unit": v.get("unit")})
    return out


def read_frame(user, assignment_id: str) -> Optional[Dict[str, Any]]:
    with cursor() as cur:
        _require_live(cur)
        _visible_assignment(cur, user, assignment_id)
        cur.execute("SELECT seq, width, height, jpeg, captured_at FROM live_frames WHERE assignment_id = %s", (assignment_id,))
        row = cur.fetchone()
        if not row:
            return None
        jpeg = row["jpeg"]
        if isinstance(jpeg, memoryview):
            jpeg = jpeg.tobytes()
        return {"seq": int(row["seq"]), "width": row["width"], "height": row["height"], "jpeg": bytes(jpeg),
                "capturedAt": row.get("captured_at")}


def active_runs(user, now: Optional[datetime] = None) -> List[Dict[str, Any]]:
    """Runs heard from in the last two minutes and not ended, that the caller may watch. Newest first."""
    now = _now(now)
    with cursor() as cur:
        _require_live(cur)
        where, params = _visibility_where(user)
        cur.execute(
            ASSIGNMENT_SELECT + f""" JOIN live_runs lr ON lr.assignment_id = a.id
             WHERE {where} AND lr.ended_at IS NULL AND lr.last_event_at >= %s
               AND NOT EXISTS (SELECT 1 FROM run_reports r WHERE r.assignment_id = a.id)
             ORDER BY lr.last_event_at DESC LIMIT 50""",
            params + [lc.since(now, lc.STALE_UNTIL_SECONDS)],
        )
        assignments = cur.fetchall()
        out = []
        for a in assignments:
            run = _live_run(cur, str(a["id"]))
            out.append(_summary(a, run, now))
        return out


# ---------------------------------------------------------------------------------------------------------
# 4. The report arrived: the live run is over
# ---------------------------------------------------------------------------------------------------------
def end_run_in(cur, assignment_id: str, run_id: Optional[str], outcome: str, now: Optional[datetime] = None) -> None:
    """Called inside connect_service's transactions (a report arrived; the dashboard disconnected the headset).
    `run_id` None = whatever run is on the assignment. Harmless when 016 is not applied."""
    if not live_tables_exist(cur):
        return
    now = _now(now)
    word = outcome if outcome in lc.RUN_OUTCOMES else None
    if run_id is None:
        cur.execute("UPDATE live_runs SET ended_at = COALESCE(ended_at, %s), outcome = COALESCE(outcome, %s) WHERE assignment_id = %s",
                    (now, word, assignment_id))
    else:
        cur.execute("UPDATE live_runs SET ended_at = COALESCE(ended_at, %s), outcome = %s WHERE assignment_id = %s AND run_id = %s",
                    (now, word, assignment_id, run_id))
    cur.execute("DELETE FROM live_frames WHERE assignment_id = %s", (assignment_id,))
