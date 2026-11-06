"""
A stand-in for the Quest 3: it speaks the headset contract to the backend, so the whole chain can be proved
before the real headset build is ready.

    dashboard "Send to headset" -> 6-digit code -> THIS SCRIPT pairs with it -> fetches the plan ->
    "performs" the case -> uploads a RunReport -> the backend scores it -> the report appears in the dashboard

It uses only the public HTTP API (the same calls the headset makes); it never touches the database directly.
It does write through that API (a device, a token, an attempt, a report), so run it against a backend you
mean to put test data in.

Usage (from backend/, with the backend running and migration 015 applied):
    ./venv/Scripts/python.exe scripts/fake_headset.py --code 004217
    ./venv/Scripts/python.exe scripts/fake_headset.py --code 004217 --keys headset   # only the keys the headset plan lists
    ./venv/Scripts/python.exe scripts/fake_headset.py --code 004217 --level 0.4      # a weaker run
    ./venv/Scripts/python.exe scripts/fake_headset.py --code 004217 --outcome Abandoned
    ./venv/Scripts/python.exe scripts/fake_headset.py --health                       # just check reachability
    ./venv/Scripts/python.exe scripts/fake_headset.py --code 004217 --live --pace 3  # LIVE VIEW: stream events while
                                                                                     # "performing", send eye-view
                                                                                     # frames while a dashboard watches,
                                                                                     # then upload the report as usual

--live          speaks the live-view contract (VR_TEAM_PROMPT_live_view.md section 2): run_started, part/step events,
                a value per planned parameter, heartbeats, run_ended; batches of up to 50 at most once a second; and a
                JPEG frame (drawn here, no Pillow needed) at the server's interval while the reply says wantFrames.
                A backend without migration 016 answers 404: the script says so once and goes on to the report.

--keys all      sends everything the scorer needs (what the brief asks the headset to send): the run is scored.
--keys headset  sends only the six keys of the headset's own plan: the run is stored as "awaiting inputs",
                and the backend lists what is missing. This is what a headset build without the additions does.
"""
from __future__ import annotations

import argparse
import json
import random
import sys
import time
import urllib.error
import urllib.request
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from core.calculations.session_scoring import PARAMETERS, scenes_for_variant  # noqa: E402
from core.connect.contract import KEY_FOR_PARAMETER, PLAN_KEY_BY_NAME, plan_values_by_key  # noqa: E402
from scripts.tiny_jpeg import render_frame  # noqa: E402

DEFAULT_BASE = "http://localhost:8000/api/v1"


def call(method: str, url: str, body=None, token: str | None = None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            return resp.status, json.loads(resp.read() or b"null")
    except urllib.error.HTTPError as e:
        try:
            detail = json.loads(e.read() or b"null")
        except ValueError:
            detail = None
        return e.code, detail
    except urllib.error.URLError as e:
        raise SystemExit(f"Cannot reach {url}: {e.reason}. Is the backend running, and is this the right address?")


def put_bytes(url: str, body: bytes, headers: dict, token: str):
    req = urllib.request.Request(url, data=body, method="PUT")
    for k, v in headers.items():
        req.add_header(k, v)
    req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            return resp.status, json.loads(resp.read() or b"null")
    except urllib.error.HTTPError as e:
        try:
            detail = json.loads(e.read() or b"null")
        except ValueError:
            detail = None
        return e.code, detail
    except urllib.error.URLError as e:
        raise SystemExit(f"Cannot reach {url}: {e.reason}.")


# --------------------------------------------------------------------------------------------- live view
EVENT_TEMPLATE = {
    "mode": "", "appVersion": "", "stepsTotal": 0, "partId": "", "partName": "", "stepId": "", "sceneId": "", "label": "",
    "status": "", "timeSeconds": 0.0, "warnings": 0, "hasValue": False, "value": 0.0, "planKey": "", "committed": False,
    "code": "", "text": "", "stepsDone": 0, "paused": False, "outcome": "",
}


def make_event(seq: int, kind: str, elapsed_s: float, **fields) -> dict:
    """An event as Unity's JsonUtility sends it: every field present, the unused ones empty / zero / false."""
    e = dict(EVENT_TEMPLATE)
    e.update({"seq": seq, "type": kind, "tUtc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
              "elapsedS": round(elapsed_s, 2)})
    e.update(fields)
    return e


class LiveSender:
    """Batches events (<= 50 per request, <= 1 request per second) and sends a frame while the server wants one."""

    def __init__(self, base: str, token: str, assignment_id: str, run_id: str, device_id: str, frame_size):
        self.base, self.token, self.assignment_id, self.run_id, self.device_id = base, token, assignment_id, run_id, device_id
        self.width, self.height = frame_size
        self.seq, self.frame_seq = 0, 0
        self.pending = []
        self.enabled = True
        self.want_frames, self.frame_interval_ms = False, 1000
        self.last_post, self.last_frame = 0.0, 0.0
        self.sent, self.frames = 0, 0
        self.scene_label = ("", "", "")

    def event(self, kind: str, elapsed_s: float, **fields) -> None:
        if not self.enabled:
            return
        self.seq += 1
        self.pending.append(make_event(self.seq, kind, elapsed_s, **fields))

    def tick(self, elapsed_s: float, progress: float, force: bool = False) -> None:
        """Post what is pending (once a second), then a frame if wanted and due."""
        if not self.enabled:
            return
        now = time.monotonic()
        if self.pending and (force or now - self.last_post >= 1.0):
            batch, self.pending = self.pending[:50], self.pending[50:]
            status, body = call("POST", f"{self.base}/assignments/{self.assignment_id}/runs/{self.run_id}/events",
                                {"schemaVersion": 1, "deviceId": self.device_id, "events": batch}, token=self.token)
            self.last_post = now
            if status == 200:
                self.sent += body.get("accepted", 0)
                live = body.get("live") or {}
                self.want_frames = bool(live.get("wantFrames"))
                self.frame_interval_ms = int(live.get("frameIntervalMs") or 1000)
            elif status == 404:
                print("live    404  live view is not set up on this server (migration 016): going on without it")
                self.enabled = False
                return
            elif status in (401, 403, 409, 410):
                print(f"live    {status}  {body}: live stopped for this run")
                self.enabled = False
                return
            else:
                print(f"live    {status}  {body}: batch dropped")
        if self.want_frames and now - self.last_frame >= max(self.frame_interval_ms, 500) / 1000.0:
            self.frame_seq += 1
            part, scene, step = self.scene_label
            jpeg = render_frame(self.width, self.height,
                                [f"SCENE {scene}" if scene else "WAITING", f"STEP {step}" if step else "", part,
                                 f"#{self.frame_seq}  T {int(elapsed_s)}S"], progress)
            status, body = put_bytes(
                f"{self.base}/assignments/{self.assignment_id}/runs/{self.run_id}/frame", jpeg,
                {"Content-Type": "image/jpeg", "X-Frame-Seq": str(self.frame_seq),
                 "X-Captured-At": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
                 "X-Frame-Width": str(self.width), "X-Frame-Height": str(self.height)}, self.token)
            self.last_frame = now
            if status == 200:
                self.frames += 1
                live = body.get("live") or {}
                self.want_frames = bool(live.get("wantFrames"))
                self.frame_interval_ms = int(live.get("frameIntervalMs") or 1000)
            else:
                print(f"frame   {status}  {body}")

    def flush(self, elapsed_s: float, progress: float) -> None:
        while self.enabled and self.pending:
            self.tick(elapsed_s, progress, force=True)


def perform_live(base: str, token: str, assignment_id: str, device_id: str, case_plan: dict, *, run_id: str,
                 pace: float, outcome: str, frame_size, rng: random.Random) -> float:
    """Walk the scenes of the plan's variant as a headset would, sending live events as it goes. Returns the run's
    elapsed seconds (the same clock the report's durationSeconds must use)."""
    by_key = plan_values_by_key(case_plan)
    visited = scenes_for_variant(case_plan.get("design", "CR"), case_plan.get("fixation", "cemented"))
    if outcome != "Completed":
        visited = visited[: max(1, len(visited) // 2)]
    param_for_scene = {}
    for p in PARAMETERS:
        key = KEY_FOR_PARAMETER[p.key]
        if key in by_key:
            param_for_scene.setdefault(p.scene, (key, by_key[key]))

    live = LiveSender(base, token, assignment_id, run_id, device_id, frame_size)
    t0 = time.monotonic()

    def elapsed() -> float:
        return time.monotonic() - t0

    live.event("run_started", 0.0, mode=case_plan["mode"], appVersion="fake-headset-0.2", stepsTotal=len(visited))
    live.tick(0.0, 0.0, force=True)
    print(f"live    streaming {len(visited)} scenes at {pace:.1f} s each"
          f"{' (open the live page on the dashboard to see frames)' if live.enabled else ''}")

    part = None
    done = 0
    last_heartbeat = time.monotonic()
    for i, sc in enumerate(visited):
        if not live.enabled:
            break                       # live is off (404 or a stop): straight on to the report
        if sc.part != part:
            part = sc.part
            live.event("part_started", elapsed(), partId=part, partName=part)
        step_id = f"fake-{sc.scene}"
        live.scene_label = (part, sc.scene, step_id)
        live.event("step_started", elapsed(), stepId=step_id, sceneId=sc.scene, label=sc.name)
        step_start = elapsed()
        progress = i / max(1, len(visited))
        key, value = "", None
        if sc.scene in param_for_scene:
            key, entry = param_for_scene[sc.scene]
            value = round(float(entry["value"]) + rng.gauss(0, 0.3 * (float(entry["tolerance"]) or 1.0)), 1)
        # dwell on the step, ticking the sender and sending a live value part-way through
        ticks = max(1, int(pace * 4))
        for k in range(ticks):
            time.sleep(pace / ticks)
            if value is not None and k == ticks // 2:
                live.event("value", elapsed(), planKey=key, hasValue=True, value=value, committed=False)
            if time.monotonic() - last_heartbeat >= 5.0:
                live.event("heartbeat", elapsed(), partId=part, stepId=step_id, sceneId=sc.scene, stepsDone=done,
                           stepsTotal=len(visited), paused=False)
                last_heartbeat = time.monotonic()
            live.tick(elapsed(), progress)
        warn = rng.random() < 0.15
        if warn:
            live.event("warning", elapsed(), stepId=step_id, sceneId=sc.scene, code="off_plan", text="Reading drifted off the plan.")
        fields = {"stepId": step_id, "sceneId": sc.scene, "status": "Done", "timeSeconds": round(elapsed() - step_start, 1),
                  "warnings": 1 if warn else 0}
        if value is not None:
            fields.update(hasValue=True, value=value, planKey=key)
        live.event("step_completed", elapsed(), **fields)
        done += 1
        last_heartbeat = time.monotonic()
    live.scene_label = (part or "", "", "")
    live.event("run_ended", elapsed(), outcome=outcome)
    live.flush(elapsed(), 1.0)
    if live.enabled:
        print(f"live    done: {live.sent} events accepted, {live.frames} frames sent, {int(elapsed())} s")
    return max(elapsed(), 1.0)


def build_report(case_plan: dict, *, assignment_id: str, device_id: str, keys: str, outcome: str, level: float,
                 rng: random.Random, run_id: str | None = None, duration_s: float | None = None) -> dict:
    """A run against the plan. `level` 1.0 hits every target at par time; lower drifts further and slower."""
    by_key = plan_values_by_key(case_plan)
    design, fixation = case_plan.get("design", "CR"), case_plan.get("fixation", "cemented")
    visited = scenes_for_variant(design, fixation)
    started = datetime.now(timezone.utc) - timedelta(minutes=45)
    drift = 1.6 * (1.0 - level)

    steps = []
    elapsed = 0
    for sc in visited:
        secs = int(sc.par_s * (0.9 + 0.6 * (1.0 - level)) * rng.uniform(0.9, 1.1))
        elapsed += secs
        step = {"stepId": f"fake-{sc.scene}", "partId": sc.part, "result": "Pass", "attempts": 1, "skipped": False,
                "undone": False, "timeSeconds": secs, "points": 0, "qualityFactor": 1.0, "qualityNote": "",
                "planKey": "", "plannedValue": 0, "tolerance": 0, "hasCommittedValue": False, "committedValue": 0}
        if keys == "all":
            step["sceneId"] = sc.scene
            step["warnings"] = 1 if rng.random() < (1.0 - level) * 0.25 else 0
        steps.append(step)

    scene_of_step = {s["stepId"]: s for s in steps}
    for p in PARAMETERS:
        key = KEY_FOR_PARAMETER[p.key]
        if keys == "headset" and not PLAN_KEY_BY_NAME[key].in_headset_plan:
            continue
        if p.scene not in {sc.scene for sc in visited}:
            continue
        entry = by_key[key]
        tol = float(entry["tolerance"]) or 1.0
        value = float(entry["value"])
        if entry["unit"] == "size":
            value += rng.choice([0, 0, 0, 1, -1]) if level < 0.7 else 0
        else:
            value = round(value + rng.gauss(0, drift * tol), 1)
        target = scene_of_step.get(f"fake-{p.scene}")
        if target is not None and not target["planKey"]:
            target.update({"planKey": key, "plannedValue": entry["value"], "tolerance": entry["tolerance"],
                           "hasCommittedValue": True, "committedValue": value})
        else:
            steps.append({"stepId": f"fake-{p.scene}-{key}", "partId": "", "result": "Pass", "attempts": 1, "skipped": False,
                          "undone": False, "timeSeconds": 0, "points": 0, "qualityFactor": 1.0, "qualityNote": "",
                          "planKey": key, "plannedValue": entry["value"], "tolerance": entry["tolerance"],
                          "hasCommittedValue": True, "committedValue": value,
                          **({"sceneId": p.scene, "warnings": 0} if keys == "all" else {})})

    if outcome != "Completed":
        steps = steps[: max(1, len(steps) // 2)]
    return {
        "schemaVersion": 1, "reportRevision": 1, "assignmentId": assignment_id, "runId": run_id or uuid.uuid4().hex,
        "caseId": case_plan["caseId"], "deviceId": device_id, "appVersion": "fake-headset-0.1",
        "mode": case_plan["mode"], "outcome": outcome,
        "startedAtUtc": started.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "endedAtUtc": (started + timedelta(seconds=elapsed)).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "deviceClockOffsetSeconds": 0, "durationSeconds": int(duration_s) if duration_s is not None else elapsed,
        "totalScore": 0, "maxScore": 100, "grade": "",          # the headset's own score: the backend ignores it
        "plan": case_plan, "steps": steps, "measurements": [],
        "exams": {"valgus": {"restHkaDeg": 0, "correctedHkaDeg": 0, "completed": False, "seconds": 0},
                  "sagittal": {"restFlexionDeg": 0, "endpointFlexionDeg": 0, "completed": False, "seconds": 0},
                  "rom": {"maxExtensionDeg": 0, "maxFlexionDeg": 0, "rangeDeg": 0, "accepted": False, "seconds": 0}},
    }


def main() -> None:
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8")
        except (AttributeError, ValueError):
            pass
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--base", default=DEFAULT_BASE, help=f"backend API base (default {DEFAULT_BASE})")
    ap.add_argument("--code", help="the 6-digit code the dashboard showed after 'Send to headset'")
    ap.add_argument("--device-id", default="fake-quest-001")
    ap.add_argument("--keys", choices=("all", "headset"), default="all")
    ap.add_argument("--outcome", choices=("Completed", "Abandoned"), default="Completed")
    ap.add_argument("--level", type=float, default=0.85, help="1.0 = perfect run, 0.3 = poor run (default 0.85)")
    ap.add_argument("--seed", type=int, default=None)
    ap.add_argument("--health", action="store_true", help="only check that the backend answers")
    ap.add_argument("--live", action="store_true", help="stream live events (and frames while watched) before the report")
    ap.add_argument("--pace", type=float, default=3.0, help="seconds spent per scene in --live (default 3)")
    ap.add_argument("--frame-size", default="320x180", help="WxH of the live frames in --live (default 320x180, max 640x360)")
    args = ap.parse_args()
    base = args.base.rstrip("/")

    status, body = call("GET", f"{base}/health")
    print(f"health  {status}  {body}")
    if args.health:
        return
    if not args.code:
        ap.error("--code is required (press 'Send to headset' on the plan's review page to get one)")

    status, body = call("POST", f"{base}/devices/pair", {
        "code": args.code, "deviceId": args.device_id, "deviceName": "Fake Quest (script)",
        "appVersion": "fake-headset-0.1", "schemaVersion": 1,
    })
    if status != 200:
        raise SystemExit(f"pair    {status}  {body}")
    token, assignment_id, case_plan = body["token"], body["assignmentId"], body["casePlan"]
    print(f"pair    200  assignment {assignment_id}, token expires {body['tokenExpiresAt']}")
    print(f"        trainee {case_plan['trainee']['displayName']} · {case_plan['patient']['label']} "
          f"({case_plan['patient']['side']}, {case_plan['patient']['deformity'] or 'deformity not recorded'}) · "
          f"{case_plan['mode']} · {case_plan.get('difficulty')} · {case_plan.get('design')}/{case_plan.get('fixation')}")
    for v in case_plan["values"]:
        print(f"        {v['key']:24} {v['value']:>7} ± {v['tolerance']:<5} {v['unit']}")

    status, again = call("GET", f"{base}/assignments/{assignment_id}/plan", token=token)
    print(f"plan    {status}  {'same plan' if status == 200 and again['values'] == case_plan['values'] else again}")

    rng = random.Random(args.seed)
    run_id, duration_s = uuid.uuid4().hex, None
    if args.live:
        try:
            w, h = (int(x) for x in args.frame_size.lower().split("x"))
        except ValueError:
            ap.error("--frame-size must look like 320x180")
        duration_s = perform_live(base, token, assignment_id, args.device_id, case_plan, run_id=run_id, pace=args.pace,
                                  outcome=args.outcome, frame_size=(min(w, 640), min(h, 360)), rng=rng)
    report = build_report(case_plan, assignment_id=assignment_id, device_id=args.device_id, keys=args.keys,
                          outcome=args.outcome, level=args.level, rng=rng, run_id=run_id, duration_s=duration_s)
    status, body = call("PUT", f"{base}/assignments/{assignment_id}/runs/{report['runId']}/report", report, token=token)
    print(f"report  {status}  {body}")
    status, body = call("PUT", f"{base}/assignments/{assignment_id}/runs/{report['runId']}/report", report, token=token)
    print(f"retry   {status}  {body}   (the same report again must change nothing)")


if __name__ == "__main__":
    main()
