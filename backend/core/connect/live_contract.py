"""
Live view: the contract between the headset's small live uploads and the dashboard's live page, as pure rules.

Design: mediver_documentation/25_LIVE_VIEW_AND_RUN_JOURNEY.md, section 4. Nothing here touches a database or a
clock it was not handed, so every rule is provable in a unit test:

    validate_event_batch   the shape of POST /assignments/{a}/runs/{r}/events
    event_data             the fields that belong to one event type, with the empty/zero "not given" values dropped
    reduce_state           fold events into the run's latest state (what a heartbeat carries in full)
    live_state             the one word every screen shows for a run, from when it was last heard from
    live_block             what every reply tells the headset: is anyone watching, send frames or not, how often
    validate_frame_headers the headers of PUT .../frame, and the body's size and magic bytes

Live is advisory. The report (run_reports) is the record; nothing here scores anything, and no event carries a score.
"""
from __future__ import annotations

import math
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

SCHEMA_VERSION = 1
MAX_EVENTS_PER_BATCH = 50
MAX_EVENTS_PER_READ = 200

# The headset sends a heartbeat every HEARTBEAT_SECONDS while nothing else was sent.
HEARTBEAT_SECONDS = 5
# liveState thresholds, seconds since the last event.
LIVE_WITHIN_SECONDS = 15
STALE_UNTIL_SECONDS = 120
# A dashboard that asked within this many seconds counts as watching; the headset sends frames only then.
WATCH_WINDOW_SECONDS = 10
# A read re-stamps last_viewed_at only when the stamp is older than this (one write per few seconds, not per poll).
VIEW_STAMP_MIN_SECONDS = 3
DEFAULT_FRAME_INTERVAL_MS = 1000
MIN_FRAME_INTERVAL_MS = 500

FRAME_MAX_BYTES = 150 * 1024
FRAME_MAX_WIDTH = 640
FRAME_MAX_HEIGHT = 360
JPEG_MAGIC = b"\xff\xd8\xff"

EVENT_TYPES = (
    "run_started", "part_started", "step_started", "step_completed", "warning", "value",
    "run_paused", "run_resumed", "run_ended", "heartbeat",
)
# Heartbeats refresh the state and are never stored in the trail.
STORED_EVENT_TYPES = tuple(t for t in EVENT_TYPES if t != "heartbeat")

STEP_STATUSES = ("Done", "Skipped", "Failed")
RUN_OUTCOMES = ("Completed", "Abandoned")
MODES = ("Guided", "Practice", "Exam")

# Which fields each event type uses. Unity's JsonUtility cannot omit a field, so every event carries every field
# and the backend keeps only these; an empty string or a zero outside this list is "not given".
FIELDS_FOR: Dict[str, Tuple[str, ...]] = {
    "run_started":    ("mode", "appVersion", "stepsTotal"),
    "part_started":   ("partId", "partName"),
    "step_started":   ("stepId", "sceneId", "label"),
    "step_completed": ("stepId", "sceneId", "status", "timeSeconds", "warnings", "hasValue", "value", "planKey"),
    "warning":        ("stepId", "sceneId", "code", "text"),
    "value":          ("planKey", "hasValue", "value", "committed"),
    "run_paused":     (),
    "run_resumed":    (),
    "run_ended":      ("outcome",),
    "heartbeat":      ("partId", "stepId", "sceneId", "stepsDone", "stepsTotal", "paused"),
}
COMMON_FIELDS = ("seq", "type", "tUtc", "elapsedS")

# The longest free text the headset may send (one short authored sentence, never user input).
MAX_TEXT = 200


def _is_int(value: Any) -> bool:
    return isinstance(value, int) and not isinstance(value, bool)


def _is_number(value: Any) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def parse_utc(text: Any) -> Optional[datetime]:
    """ISO 8601 with a Z or an offset; None when it is not one."""
    if not isinstance(text, str) or not text:
        return None
    try:
        value = datetime.fromisoformat(text.replace("Z", "+00:00"))
    except ValueError:
        return None
    return value if value.tzinfo is not None else value.replace(tzinfo=timezone.utc)


def utc_iso(value: datetime) -> str:
    return value.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


# ---------------------------------------------------------------------------------------------------------
# 1. Events in
# ---------------------------------------------------------------------------------------------------------
def validate_event_batch(body: Any) -> List[str]:
    """Every reason the batch cannot be taken, in one list (422 when non-empty). An empty list of events is valid:
    a headset may post one to learn the live block."""
    problems: List[str] = []
    if not isinstance(body, dict):
        return ["body must be an object"]
    if body.get("schemaVersion") != SCHEMA_VERSION:
        problems.append(f"schemaVersion must be {SCHEMA_VERSION}")
    if not isinstance(body.get("deviceId"), str) or not body["deviceId"]:
        problems.append("deviceId is required")
    events = body.get("events")
    if not isinstance(events, list):
        return problems + ["events must be a list"]
    if len(events) > MAX_EVENTS_PER_BATCH:
        problems.append(f"at most {MAX_EVENTS_PER_BATCH} events per request")
    seen = set()
    for i, e in enumerate(events):
        where = f"events[{i}]"
        if not isinstance(e, dict):
            problems.append(f"{where} must be an object")
            continue
        seq = e.get("seq")
        if not _is_int(seq) or seq < 1:
            problems.append(f"{where}.seq must be an integer >= 1")
        elif seq in seen:
            problems.append(f"{where}.seq {seq} repeats within the batch")
        else:
            seen.add(seq)
        kind = e.get("type")
        if kind not in EVENT_TYPES:
            problems.append(f"{where}.type is not a live event type")
        if parse_utc(e.get("tUtc")) is None:
            problems.append(f"{where}.tUtc must be ISO 8601 UTC")
        if not _is_number(e.get("elapsedS")) or e["elapsedS"] < 0:
            problems.append(f"{where}.elapsedS must be a number >= 0")
        if kind == "step_completed" and e.get("status") not in STEP_STATUSES:
            problems.append(f"{where}.status must be one of {', '.join(STEP_STATUSES)}")
        if kind == "run_ended" and e.get("outcome") not in RUN_OUTCOMES:
            problems.append(f"{where}.outcome must be one of {', '.join(RUN_OUTCOMES)}")
        if kind == "run_started" and e.get("mode") not in MODES:
            problems.append(f"{where}.mode must be one of {', '.join(MODES)}")
        if kind in ("value", "step_completed") and e.get("hasValue") is True and not _is_number(e.get("value")):
            problems.append(f"{where}.value must be a finite number when hasValue is true")
        for key in ("text", "label", "code", "partName"):
            if key in e and isinstance(e[key], str) and len(e[key]) > MAX_TEXT:
                problems.append(f"{where}.{key} is longer than {MAX_TEXT} characters")
    return problems


def event_data(event: Dict[str, Any]) -> Dict[str, Any]:
    """Only the fields that belong to the event's type, with "not given" values (empty string, zero, false)
    dropped — except the ones whose zero is meaningful (a step that took 0 s, a value of 0 when hasValue says so)."""
    kind = event.get("type")
    out: Dict[str, Any] = {}
    for key in FIELDS_FOR.get(kind, ()):
        if key not in event:
            continue
        v = event[key]
        if key == "value":
            if event.get("hasValue") is True and _is_number(v):
                out["value"] = v
            continue
        if key == "hasValue":
            continue                                   # folded into "value"
        if key in ("timeSeconds", "warnings", "stepsDone", "stepsTotal", "paused", "committed"):
            out[key] = v                               # zero and false carry meaning here
            continue
        if v in ("", 0, None, False):
            continue
        out[key] = v
    return out


# ---------------------------------------------------------------------------------------------------------
# 2. The run's latest state
# ---------------------------------------------------------------------------------------------------------
def empty_state() -> Dict[str, Any]:
    return {
        "mode": "", "appVersion": "",
        "partId": "", "partName": "", "stepId": "", "sceneId": "", "label": "",
        "stepsDone": 0, "stepsTotal": 0, "paused": False, "elapsedS": 0.0,
        "warnings": 0, "values": {}, "lastType": "", "lastSeq": 0,
    }


def reduce_state(state: Optional[Dict[str, Any]], event: Dict[str, Any]) -> Dict[str, Any]:
    """Fold one event into the state. Returns a new dict; the input is not changed. A heartbeat carries the
    whole current state and overwrites it, so a lost event never leaves the picture wrong for more than one
    heartbeat (design decision 4)."""
    s = dict(empty_state() if not state else state)
    s["values"] = dict(s.get("values") or {})
    kind = event.get("type")
    data = event_data(event)
    s["lastType"] = kind
    if _is_int(event.get("seq")):
        s["lastSeq"] = max(int(s.get("lastSeq") or 0), event["seq"])
    if _is_number(event.get("elapsedS")):
        s["elapsedS"] = float(event["elapsedS"])

    if kind == "run_started":
        s["mode"] = data.get("mode", s["mode"])
        s["appVersion"] = data.get("appVersion", s["appVersion"])
        if _is_int(data.get("stepsTotal")) and data["stepsTotal"] > 0:
            s["stepsTotal"] = data["stepsTotal"]
        s["paused"] = False
    elif kind == "part_started":
        s["partId"] = data.get("partId", "")
        s["partName"] = data.get("partName", "")
    elif kind == "step_started":
        s["stepId"] = data.get("stepId", "")
        s["sceneId"] = data.get("sceneId", "")
        s["label"] = data.get("label", "")
    elif kind == "step_completed":
        if data.get("status") in ("Done", "Skipped"):
            s["stepsDone"] = int(s.get("stepsDone") or 0) + 1
        if _is_int(data.get("warnings")):
            s["warnings"] = int(s.get("warnings") or 0) + max(0, data["warnings"])
        if data.get("planKey") and "value" in data:
            s["values"][data["planKey"]] = {"value": data["value"], "committed": True, "elapsedS": s["elapsedS"]}
    elif kind == "warning":
        s["warnings"] = int(s.get("warnings") or 0) + 1
    elif kind == "value":
        if data.get("planKey") and "value" in data:
            s["values"][data["planKey"]] = {"value": data["value"], "committed": bool(data.get("committed")), "elapsedS": s["elapsedS"]}
    elif kind == "run_paused":
        s["paused"] = True
    elif kind == "run_resumed":
        s["paused"] = False
    elif kind == "run_ended":
        s["paused"] = False
    elif kind == "heartbeat":
        for key in ("partId", "stepId", "sceneId"):
            if key in data:
                s[key] = data[key]
        if _is_int(data.get("stepsDone")):
            s["stepsDone"] = data["stepsDone"]
        if _is_int(data.get("stepsTotal")) and data["stepsTotal"] > 0:
            s["stepsTotal"] = data["stepsTotal"]
        if isinstance(data.get("paused"), bool):
            s["paused"] = data["paused"]
    return s


# ---------------------------------------------------------------------------------------------------------
# 3. The one word for where the run stands
# ---------------------------------------------------------------------------------------------------------
LIVE_STATES = ("waiting", "live", "paused", "stale", "lost", "ended")


def live_state(*, assignment_status: str, last_event_at: Optional[datetime], ended: bool, paused: bool,
               has_report: bool, now: datetime) -> str:
    """Design section 4.2. `ended` is a run_ended event or an ended_at stamp; `has_report` a run_reports row."""
    if has_report or ended:
        return "ended"
    if last_event_at is None:
        return "waiting"
    age = (now - last_event_at).total_seconds()
    if age > STALE_UNTIL_SECONDS:
        return "lost"
    if age > LIVE_WITHIN_SECONDS:
        return "stale"
    if paused:
        return "paused"
    return "live"


def live_block(last_viewed_at: Optional[datetime], now: datetime,
               frame_interval_ms: int = DEFAULT_FRAME_INTERVAL_MS) -> Dict[str, Any]:
    """What every reply tells the headset. Frames are wanted only while a dashboard asked recently."""
    watching = last_viewed_at is not None and (now - last_viewed_at).total_seconds() <= WATCH_WINDOW_SECONDS
    return {"watchers": 1 if watching else 0, "wantFrames": watching,
            "frameIntervalMs": max(MIN_FRAME_INTERVAL_MS, int(frame_interval_ms))}


def should_restamp(last_viewed_at: Optional[datetime], now: datetime) -> bool:
    return last_viewed_at is None or (now - last_viewed_at).total_seconds() >= VIEW_STAMP_MIN_SECONDS


# ---------------------------------------------------------------------------------------------------------
# 4. Frames in
# ---------------------------------------------------------------------------------------------------------
def validate_frame_headers(headers: Dict[str, str], body_length: int, body_head: bytes = b"") -> Tuple[int, List[str]]:
    """(status, problems). 413 when the body is over the limit, 422 for anything else wrong, 200 with no problems."""
    h = {str(k).lower(): v for k, v in (headers or {}).items()}
    if body_length > FRAME_MAX_BYTES:
        return 413, [f"frame is {body_length} bytes; at most {FRAME_MAX_BYTES} are accepted"]
    problems: List[str] = []
    if body_length <= 0:
        problems.append("frame body is empty")
    ctype = (h.get("content-type") or "").split(";")[0].strip().lower()
    if ctype != "image/jpeg":
        problems.append("Content-Type must be image/jpeg")
    if body_head and not body_head.startswith(JPEG_MAGIC):
        problems.append("body is not a JPEG")
    try:
        seq = int(h.get("x-frame-seq", ""))
        if seq < 1:
            raise ValueError
    except ValueError:
        problems.append("X-Frame-Seq must be an integer >= 1")
    for name, limit in (("x-frame-width", FRAME_MAX_WIDTH), ("x-frame-height", FRAME_MAX_HEIGHT)):
        try:
            v = int(h.get(name, ""))
            if not 1 <= v <= limit:
                problems.append(f"{name.upper().replace('X-FRAME-', 'X-Frame-').title()} must be between 1 and {limit}")
        except ValueError:
            problems.append(f"{name} must be an integer")
    if h.get("x-captured-at") and parse_utc(h["x-captured-at"]) is None:
        problems.append("X-Captured-At must be ISO 8601 UTC")
    return (422 if problems else 200), problems


def frame_meta(headers: Dict[str, str]) -> Dict[str, Any]:
    """The validated headers as values (call after validate_frame_headers said 200)."""
    h = {str(k).lower(): v for k, v in (headers or {}).items()}
    return {"seq": int(h["x-frame-seq"]), "width": int(h["x-frame-width"]), "height": int(h["x-frame-height"]),
            "capturedAt": parse_utc(h.get("x-captured-at"))}


def since(now: datetime, seconds: float) -> datetime:
    return now - timedelta(seconds=seconds)
