# Prompt for the VR team's Claude Code: live view (events + eye-view snapshots)

Date: 2026-11-05 · From the dashboard/backend side · Full design: `25_LIVE_VIEW_AND_RUN_JOURNEY.md`

**How to use:** paste everything below the line into Claude Code, opened in the Unity project
(`VR Knee surgery`). It is written to stand alone. The backend endpoints it talks to are **not live yet** (they are being
built on our side from the same contract), so the headset must treat a 404 as "live view not available" and carry on.

---

## PROMPT (start)

You are working in the Unity project for the MediVeR knee-surgery VR simulator (Quest 3). The headset already pairs with
the MediVeR backend and uploads one RunReport per run (package `Assets/Scripts/Systems/Connect/`, `ConnectService`,
`ReportOutbox`, `SessionRecorder`, `StepSceneMap`, `ConnectSettings.asset`; see your own CHANGELOG entries of 2026-11-03/04).
That part works and must not change.

**Goal.** An instructor must be able to watch, on the web dashboard and in about real time, what the resident is doing
and seeing while they operate. Two new, small, optional uploads from the headset make that possible:

1. **Live events**: a stream of small JSON events (which step is running, which finished, warnings, live values), plus a
   heartbeat that carries the full current state.
2. **Eye-view snapshots**: a low-resolution JPEG of what the wearer sees, about once a second, **only while someone is
   watching** (the backend tells you).

This is not video. Do not add WebRTC, a streaming library, a socket, or anything that is not a plain HTTPS request.

### 0. Do this first, before writing code, and report what you find

I (the dashboard side) wrote this from documents, not from your code. Verify each of these and tell me where the facts
differ. Change nothing yet.

a. Which events or callbacks does the procedure engine expose for part started, step started, step completed (with
   outcome and time), step reported, warning, pause and resume, and run finished/abandoned? (I was told `ProcedureEngine`
   raises `OnPartStarted`, `OnStepStarted`, `OnStepCompleted`, `OnStepReported`. Confirm the real names and what each carries.)
b. Which clock does `RunReport.durationSeconds` use (wall clock from start, or active time excluding pauses)? The live
   `elapsedS` **must be the same clock**, so the live timer and the final report agree.
c. How does `SessionRecorder` identify a run (`runId`) and does that id stay the same when a run is resumed after an
   abandonment? The live `seq` must continue across a resume of the same `runId`.
d. How is the `sceneId` of a step known (`StepSceneMap`)? Live events use the same ids as the report.
e. How does `ConnectService`/`ReportOutbox` send requests today (UnityWebRequest on a coroutine, async, a worker)? Live
   uploads must use the same transport, token, base URL and `ConnectSettings`, and must not share the report outbox.
f. Which cameras render what the wearer sees (render pipeline: URP or built-in; single-pass instanced; world-space UI?).

Then write a short plan and start.

### 1. Non-negotiable rules

1. **Live is advisory. The report is the record.** Live traffic must never delay, reorder, block or alter a report upload or
   the run itself. If anything in the live code throws, catch it, disable live for the rest of the run, and continue.
2. **No scores, grades, pass/fail or verdicts in any live message.** Facts only (the standing rule: the headset sends no score).
3. **No patient data.** Messages carry step ids, scene ids, short fixed phrases and numbers. Free text in `warning.text` is
   one short sentence you author, never user input.
4. **HTTPS only in release builds** (same rule as the existing Connect package). Same bearer token as the report.
5. **Never block the main thread** for network, encoding or disk. No per-frame allocation in the snapshot path (pool buffers).
6. **Off by default if anything is unclear**: add a setting `liveViewEnabled` (default true) and a hidden override in
   `ConnectSettings`, so we can switch it off in the field without a new build.
7. Do not change the report contract (`RunReport`), the pairing contract, or the schema version.
8. JSON through `JsonUtility`: enums as strings, no NaN/Infinity, optional numbers as `hasX` + `x`. `JsonUtility` cannot
   omit a field, so **every event carries every field** (below). The backend ignores fields that do not belong to the event type.

### 2. The contract (base URL is the existing `ConnectSettings` base, `/api/v1`)

**2.1 Events.** `POST /assignments/{assignmentId}/runs/{runId}/events`, header `Authorization: Bearer <token>`,
`Content-Type: application/json`. `assignmentId` is the one you got at pairing; `runId` is the report's run id.

```json
{
  "schemaVersion": 1,
  "deviceId": "<same deviceId as pairing>",
  "events": [
    {
      "seq": 12, "type": "step_completed",
      "tUtc": "2026-11-05T10:15:03Z", "elapsedS": 184.2,
      "mode": "", "appVersion": "", "stepsTotal": 0,
      "partId": "", "partName": "",
      "stepId": "P2_04", "sceneId": "4.2", "label": "",
      "status": "Done", "timeSeconds": 21.5, "warnings": 0,
      "hasValue": true, "value": 8.0, "planKey": "P2.tibialDepthMm", "committed": true,
      "code": "", "text": "",
      "stepsDone": 0, "paused": false,
      "outcome": ""
    }
  ]
}
```

Rules:
- Up to **50 events per request, at most one request per second**. Batch what happened in that second.
- `seq` starts at **1 for each runId**, goes up by exactly 1 for every event you create (heartbeats included), and
  continues across pause/resume of the same runId. Persist the last `seq` with the run so a restart continues it.
- `tUtc`: ISO 8601 UTC with `Z`. `elapsedS`: seconds on the same clock as `RunReport.durationSeconds` (see 0b).
- `sceneId`: the same dashboard scene id the report uses, from `StepSceneMap`.
- Strings you do not use are `""`; numbers you do not use are `0`; booleans `false`. Use `hasValue` + `value` for an optional number.

| `type` | Send when | Fill these fields (everything else empty) |
|---|---|---|
| `run_started` | the run begins (also on resume, with the same runId) | `mode` (`Guided`/`Practice`/`Exam`), `appVersion`, `stepsTotal` |
| `part_started` | a part begins | `partId`, `partName` |
| `step_started` | a step begins | `stepId`, `sceneId`, `label` (the on-screen step title) |
| `step_completed` | a step ends | `stepId`, `sceneId`, `status` (`Done` / `Skipped` / `Failed`), `timeSeconds`, `warnings`, and `hasValue`/`value`/`planKey` if the step committed a judged value |
| `warning` | something went wrong in a step | `stepId`, `sceneId`, `code` (short stable code you define), `text` (one short sentence) |
| `value` | a judged value changes: a knob, a gauge, an exam meter | `planKey`, `hasValue`, `value`, `committed` (true once locked in). **At most 2 per second per key, and only when the value changed** |
| `run_paused`, `run_resumed` | the wearer pauses or resumes | (none) |
| `run_ended` | the run finishes or is abandoned | `outcome` (`Completed` / `Abandoned`). A hint only. Still upload the report as today |
| `heartbeat` | every **5 s** when nothing else was sent in that time | `partId`, `stepId`, `sceneId`, `stepsDone`, `stepsTotal`, `paused`, `elapsedS` |

`planKey` values are exactly the keys already in `casePlan.values[]` (for example `P2.tibialDepthMm`). Every heartbeat must
describe the **whole current state**, because a lost event must never leave the dashboard wrong for more than 5 seconds.

Success reply `200`:

```json
{ "accepted": 12, "duplicates": 0, "lastSeq": 12, "serverTimeUtc": "...",
  "live": { "watchers": 1, "wantFrames": true, "frameIntervalMs": 1000 } }
```

Store `live.wantFrames` and `live.frameIntervalMs` from every reply; they drive the snapshots (2.2).

| Reply | Do |
|---|---|
| 401 | stop live traffic until the device is paired again (the same moment the report outbox holds) |
| 403 | stop live traffic for this run |
| 404 | live view is not set up on this server: **switch live off for 10 minutes, silently** (no message to the wearer, no error log spam) |
| 409 / 410 | the run or assignment is finished/spent: stop live traffic for this run |
| 413 / 422 | drop that batch, log once, carry on with the next |
| 429 | wait `Retry-After` seconds |
| network error / 5xx | keep the events in memory and retry with backoff 1, 2, 4 ... 30 s. **Keep at most 500 events** (drop the oldest). Never write live events to disk and never put them in the report outbox |

**2.2 Snapshots.** `PUT /assignments/{assignmentId}/runs/{runId}/frame`, same auth. Body = the raw JPEG bytes.
Headers: `Content-Type: image/jpeg`, `X-Frame-Seq` (integer, starts at 1 per run, rising), `X-Captured-At` (ISO 8601 UTC),
`X-Frame-Width`, `X-Frame-Height`. The reply has the same `live` block as 2.1; treat it the same way.

- Send a frame **only while the most recent reply said `wantFrames: true`**. When it turns false, stop within one interval.
- Interval = `max(frameIntervalMs, 500)` ms. Never faster.
- Size: **640 x 360 or smaller, JPEG quality about 55, at most 150 KB** (the server refuses above that with 413: lower the
  quality or resolution for the next frame).
- Content: what the wearer sees in the headset, including world-space UI they see. **No passthrough camera, no system UI,
  no guardian.** A dedicated low-resolution capture camera that follows the head pose is expected; choose the
  method that fits your render pipeline (e.g. a second camera into a small `RenderTexture` + `AsyncGPUReadback`).
- **Performance budget (hard requirement).** The capture + encode + upload path may add at most **0.5 ms on average to the
  main thread** and must not allocate per frame (pool the buffers; encode on the thread that costs least; measure which).
  If the rolling average frame time of the last second exceeds 85% of the target frame time, **skip that capture and
  double the interval until it recovers.** Measure on a real Quest 3 in a development build, with the full surgical scene
  running, and report the numbers (average and worst-case main-thread ms, frame drops, memory, bytes per second sent, battery
  or thermal notes if you see any). If you cannot meet the budget at 640 x 360, go to 480 x 270 and tell us. If you cannot
  meet it at all, ship the events (2.1) without snapshots and tell us why.

### 3. What to build

1. `LiveEventSender` (or your naming): subscribes to the engine events from step 0a, builds the events above, batches them,
   posts them, applies the reply rules, owns the 500-event ring buffer and the heartbeat timer. A single place decides
   "live is on/off" (setting, backoff for 404, 401/403/409/410 stops).
2. `LiveFrameSender`: capture, encode, upload, with the gating and the budget guard above.
3. A kill switch in `ConnectSettings` and a one-line indicator in the existing Connect status chip/diagnostics
   ("Live: on / off (not available) / off (stopped)"). Nothing the wearer must act on.
4. Extend the editor-only E2E menu (`Tools > VR Knee Surgery > Connect > E2E`) so a run can be driven without a headset and
   the events visible in a log, as the report path was.
5. Tests (edit-mode where possible): event building for every type; `seq` continuity across pause/resume and restart;
   batching limits (50 per request, 1 per second); the 500-event ring; every reply code in the table; the
   `wantFrames` gating; the budget guard; and **a test that proves live failure never affects the report outbox**.
   Add a serialisation test that writes a sample events request to `%TEMP%\VRKneeSurgery.Connect.Tests\sample_events.json`
   and a sample frame request (headers listed), as you did for the report, so we can validate them from our side.
6. Update your CHANGELOG and `Docs/Connectivity` contract notes (a new section, not an edit of the existing contract).

### 4. What not to do

- Do not stream video, open sockets/WebRTC, add third-party networking packages, or capture the passthrough camera.
- Do not send anything about score, grade or competency. Do not change `RunReport`, pairing, or the plan application.
- Do not write live data to the disk outbox. Do not retry live data for longer than the 500-event buffer.
- Do not show the wearer any new message, popup or sound because of live view.
- Do not guess where facts differ from section 0: ask us, or state the assumption in your report.

### 5. Report back (a short Markdown file, plus the sample JSON files)

1. The answers to 0a to 0f, and every place my description was wrong.
2. The list of event types you implemented, and any you could not (with the reason), and any event you added.
3. The clock used for `elapsedS` and how you confirmed it matches `durationSeconds`.
4. The Quest 3 measurements from 2.2 and the resolution/quality/interval you settled on.
5. Anything in the contract you want changed, as a diff against section 2.
6. The test list and results.

### 6. How we will test it together

Until our backend is deployed, the endpoints answer 404 (you must handle that without errors; this is test case one).
We are extending our stand-in headset (`backend/scripts/fake_headset.py`) so that the dashboard and the backend can be
tested without you; you validate your messages against the sample files you write in section 3.5. When both sides are
ready, the first joint test is: pair, start a case, watch it on the dashboard from another device on another network, turn
the Wi-Fi off and on mid-run, finish, and compare the dashboard's step log with your report file.

## PROMPT (end)
