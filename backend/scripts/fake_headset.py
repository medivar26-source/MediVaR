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

--keys all      sends everything the scorer needs (what the brief asks the headset to send): the run is scored.
--keys headset  sends only the six keys of the headset's own plan: the run is stored as "awaiting inputs",
                and the backend lists what is missing. This is what a headset build without the additions does.
"""
from __future__ import annotations

import argparse
import json
import random
import sys
import urllib.error
import urllib.request
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from core.calculations.session_scoring import PARAMETERS, scenes_for_variant  # noqa: E402
from core.connect.contract import KEY_FOR_PARAMETER, PLAN_KEY_BY_NAME, plan_values_by_key  # noqa: E402

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


def build_report(case_plan: dict, *, assignment_id: str, device_id: str, keys: str, outcome: str, level: float,
                 rng: random.Random) -> dict:
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
        "schemaVersion": 1, "reportRevision": 1, "assignmentId": assignment_id, "runId": str(uuid.uuid4()),
        "caseId": case_plan["caseId"], "deviceId": device_id, "appVersion": "fake-headset-0.1",
        "mode": case_plan["mode"], "outcome": outcome,
        "startedAtUtc": started.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "endedAtUtc": (started + timedelta(seconds=elapsed)).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "deviceClockOffsetSeconds": 0, "durationSeconds": elapsed,
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
    report = build_report(case_plan, assignment_id=assignment_id, device_id=args.device_id, keys=args.keys,
                          outcome=args.outcome, level=args.level, rng=rng)
    status, body = call("PUT", f"{base}/assignments/{assignment_id}/runs/{report['runId']}/report", report, token=token)
    print(f"report  {status}  {body}")
    status, body = call("PUT", f"{base}/assignments/{assignment_id}/runs/{report['runId']}/report", report, token=token)
    print(f"retry   {status}  {body}   (the same report again must change nothing)")


if __name__ == "__main__":
    main()
