# Live view, and the path a user follows from plan to report

Written 2026-11-05. **Status: design and contract only. Nothing in this note is built or tested yet.**
What exists today is stated as "verified" with the file it was read in. Anything not read is marked "not verified".

Builds on `23_VR_CONNECTIVITY_DESIGN.md` (pairing, plan down, report up: working, tested by the owner) and
`24_CROSS_DEVICE_CONNECTIVITY_AND_PRODUCTION_ROLLOUT.md` (networks, production). Companion files:

- `proposals/016_live_view.proposed.sql` (new tables, not applied)
- `VR_TEAM_PROMPT_live_view.md` (the prompt for the VR team's Claude Code)

The request had three parts. Part 1 is the live view (section 2 to 6), part 2 the screens after a run (section 7), part 3 the
path and the guidance for users (section 8).

> **Reading of the request, to confirm.** "The post we have there" is read as the screens a user sees **after the headset
> run**: the Sessions list, the session report, and the plan's review page that shows the headset code and status. If a
> different screen was meant, section 7 changes and nothing else does.

---

## 1. What exists today (verified)

| Fact | Where it was read |
|---|---|
| The dashboard's live page (`/sessions/[id]`, `LiveMirror`) is a placeholder: the elapsed clock ticks, the scene marker and the done count are frozen at their state when the page loaded. Its own comment says there is no live channel from the headset. | `dashboard/src/app/sessions/[id]/LiveMirror.tsx`, `page.tsx` |
| The headset sends **one report per run**, at the end. It sends nothing while the resident operates. | `23_...` section 6, `backend/services/connect_service.py` |
| A run has **no attempt or session row until its report arrives**. The attempt is inserted inside `ingest_report`. So during a run there is no session id for a live page to attach to. | `connect_service.py:485` |
| What is available during a run: the **assignment** (id, status `pending / paired / running / reported`, device, code expiry). The review page polls it every 4 s. | `lib/headset-link.ts`, `SendToHeadset.tsx` |
| **The assignment becomes `running` only when a non-completed report is ingested** (an abandoned or in-progress one). During a normal run it stays `paired`, so the review page says "Headset connected" for the whole operation and never "in progress". The wording "Case in progress on the headset" exists in the code but is not reachable by a run that is going well. | `connect_service.py:521`, `lib/headset-link.ts` `assignmentStatusText` |
| `GET /results` returns the scorer's output only. The headset's own record of the run (`run_reports.payload`: every step with its time, warnings, committed value) is stored verbatim and **never sent to the dashboard**. | `backend/services/results_service.py:125-159` |
| `coverage` and `scoring_note` (which scenes were not performed, which parameters were not measured, why a report is waiting) are not referenced by `lib/report.ts` or `lib/data/results.ts`. | grep, both files |
| The dashboard has **no route handlers** (`app/api` does not exist). All server calls are server actions. | `ls dashboard/src/app` |
| The dashboard's `AGENTS.md` says this Next.js has breaking changes and the docs in `node_modules/next/dist/docs/` must be read before writing code. | `dashboard/AGENTS.md` |

Not verified: how the report page looks with a real headset run (never opened in a browser for this note); the Unity
project (not on this PC, so every statement about it comes from `handoff.md` and the VR brief and is passed to the VR team
as "verify first").

---

## 2. What "see what the resident is doing" can mean, and what is recommended

Three different things, in rising cost. They are separable: A is useful alone.

| Level | What the viewer sees | Delay | Cost on the headset | Cost to run |
|---|---|---|---|---|
| **A. Live state** | The running order moves: current part, step and scene, steps done, warnings as they happen, live values against the plan, elapsed clock, paused / offline | 1 to 2 s | Tiny (a few small JSON posts) | None beyond the existing backend |
| **B. Snapshots** | A picture of what the resident sees, refreshed about once a second (not video) | 1 to 3 s | Small but real: a low-resolution capture and JPEG encode; must be measured on a Quest 3 | One small row, overwritten |
| **C. Video** | Moving picture and sound | under 1 s | High on a headset that is already performance-bound (Unity changelog 2026-10-30) | A media server (WebRTC), TURN, an operator |

**Recommendation: build A and B together now; do not start C.** Reasons: A and B run on the existing backend over
outbound HTTPS on port 443, which is the only thing every hospital network lets through (`24_...` section 2); WebRTC
needs UDP or a TURN relay, which is exactly what managed networks block. B answers "what is the resident looking at" well
enough to teach from. If the owner later judges that snapshots are not enough, C is a separate project and A is not
wasted (the running order and the warnings stay).

Two honest limits to state on screen, not hide: B is a snapshot (the page says "Snapshot, about once a second"), and
"live" means a second or two behind. Meta's own casting to a TV or browser is a separate product feature, not
embeddable in the dashboard, and is not part of this design.

---

## 3. Architecture

The headset and the dashboard still never talk. Both talk to the backend (`24_...` section 1). Live view adds two small
uploads from the headset and three small reads for the dashboard.

```text
 QUEST 3                               BACKEND                                DASHBOARD (browser)
 ───────                               ───────                                ───────────────────
 every state change, batched  ──►  POST /assignments/{a}/runs/{r}/events   ──► run_events, live_runs (latest state)
 heartbeat every 5 s (carries the full current state)
 reply tells the headset:      ◄──  { live: { watchers, wantFrames, frameIntervalMs } }
 only while wantFrames:
 JPEG ~640x360, ~1 per second ──►  PUT  /assignments/{a}/runs/{r}/frame   ──► live_frames (newest only)

                                      GET /assignments/{a}/live?after=seq  ◄── page polls once a second
                                      GET /assignments/{a}/live/frame      ◄── <img>, through a Next route handler
                                      GET /live/active                      ◄── "Live now" lists
 at the end: PUT .../report (unchanged) ──► scored result ──► the live page hands over to the report
```

Design decisions, each with its reason:

1. **Polling, not WebSocket or SSE, to start.** Plain HTTPS GETs once a second pass proxies, TLS inspection and load
   balancers that buffer or kill long-lived streams. The read endpoint takes `after=<seq>`, so it can be moved to SSE later
   without changing the data. This is the same reasoning as `24_...` section 2.
2. **Keyed on the assignment and run id, not the session.** There is no session or attempt during a run (section 1). When the
   report lands, `run_reports.attempt_id` gives the session, and the live page links to its report.
3. **Frames are sent only while someone is watching.** Every dashboard read stamps `live_runs.last_viewed_at`. The backend
   tells the headset `wantFrames: true` only if that stamp is under 10 s old. Nobody watching means no capture cost, no
   upload. The stamp is in the database, not in memory, so it works with more than one backend instance.
4. **Every heartbeat carries the full state** (part, step, scene, steps done and total, paused, elapsed). A lost event
   therefore never leaves the dashboard wrong for more than 5 s. Events add the detail (warnings, per-step results), the
   heartbeat keeps the picture true.
5. **Live is advisory; the report is the record.** Nothing live is scored. If events are missing, duplicated or the
   network drops, the report path (outbox, retries, scoring) is untouched. The headset must never let live traffic delay
   or reorder a report upload.
6. **Same authentication as the report**: the device bearer token. A headset may post only for its own paired assignment
   (403 otherwise), and only while the assignment is `paired` or `running`.
7. **Frames hold no patient data** (cases are synthetic) but they do show a trainee at work: the same people may watch
   as may open the report (section 4.4).

---

## 4. The contract

Base `/api/v1`, JSON, HTTPS. Field rules carry over from `core/connect/contract.py`: enums are strings, no NaN, optional
numbers travel as `hasX` + `x`. **Unity's `JsonUtility` cannot omit a field, so every event carries every field, and the
backend ignores the fields that do not belong to the event's type (an empty string and a zero are "not given").**

### 4.1 Headset to backend

`POST /assignments/{assignmentId}/runs/{runId}/events`, `Authorization: Bearer <device token>`

```json
{
  "schemaVersion": 1,
  "deviceId": "string",
  "events": [ { "seq": 12, "type": "step_completed", "tUtc": "2026-11-05T10:15:03Z", "elapsedS": 184.2, "...": "see table" } ]
}
```

Up to 50 events per request, at most one request per second. `seq` starts at 1 for each run id, rises by 1 for every event
the headset creates (heartbeats included), and is kept across a pause and resume of the same run. The backend deduplicates
on (assignment, run, seq).

| `type` | Sent when | Fields used (all others empty/zero) |
|---|---|---|
| `run_started` | the run begins | `mode`, `appVersion`, `stepsTotal` |
| `part_started` | a part (P1 to P11) begins | `partId`, `partName` |
| `step_started` | a step begins | `stepId`, `sceneId`, `label` |
| `step_completed` | a step ends | `stepId`, `sceneId`, `status` (`Done` / `Skipped` / `Failed`), `timeSeconds`, `warnings`, `hasValue`, `value`, `planKey` |
| `warning` | something goes wrong in a step | `stepId`, `sceneId`, `code`, `text` (one short sentence, no scores) |
| `value` | a judged value changes (knob moved, exam meter) | `planKey`, `hasValue`, `value`, `committed` (bool). At most 2 per second per key, only on change |
| `run_paused` / `run_resumed` | the wearer pauses or resumes | none |
| `run_ended` | the run finishes or is abandoned | `outcome` (`Completed` / `Abandoned`). A hint only; the report is authoritative |
| `heartbeat` | every 5 s while nothing else was sent | `partId`, `stepId`, `sceneId`, `stepsDone`, `stepsTotal`, `paused`, `elapsedS` |

Common fields on every event: `seq`, `type`, `tUtc` (ISO 8601, `Z`), `elapsedS` (seconds on the **same clock as the report's
`durationSeconds`**, so the live clock and the report agree). `sceneId` must be the same dashboard scene id the report
uses (`"4.2"`), from the headset's existing `StepSceneMap`.

Response `200`:

```json
{ "accepted": 12, "duplicates": 0, "lastSeq": 12, "serverTimeUtc": "...",
  "live": { "watchers": 1, "wantFrames": true, "frameIntervalMs": 1000 } }
```

| Status | Meaning | Headset does |
|---|---|---|
| 401 | token invalid or expired | stop live traffic until re-paired (reports hold the same way) |
| 403 | not this headset's assignment | stop live traffic for this run |
| 404 | live view not set up (016 not applied) or unknown assignment | switch live off for 10 minutes, no error shown to the wearer |
| 409 / 410 | the run is already finished, or the assignment is spent | stop live traffic for this run |
| 413 / 422 | too large / bad shape | drop that batch, log it, continue |
| 429 | too fast | honour `Retry-After` |

`PUT /assignments/{assignmentId}/runs/{runId}/frame`: body is the raw JPEG. Headers: `Content-Type: image/jpeg`,
`X-Frame-Seq` (integer, rising), `X-Captured-At` (ISO 8601), `X-Frame-Width`, `X-Frame-Height`. Limits: 640 x 360 or
smaller, at most 150 KB (413 above), no more than one per `frameIntervalMs` (never faster than 500 ms). Reply is the same
`live` block. Sent only while the last reply said `wantFrames: true`.

### 4.2 Backend to dashboard

| Call | Returns |
|---|---|
| `GET /assignments/{id}/live?after=<seq>` | `{ liveState, state, events[after seq, max 200], frame: { seq, capturedAt } or null, resident, caseTitle, planId, attemptId }`. Stamps `last_viewed_at` (the write is skipped if the stamp is under 3 s old). |
| `GET /assignments/{id}/live/frame` | the newest JPEG, `Cache-Control: no-store`, 404 if none |
| `GET /live/active` | the runs live now that the viewer may watch (for the "Live now" lists) |

`liveState`, decided by the backend from `last_event_at` and the report, so every screen says the same thing:

| `liveState` | Rule | Shown as |
|---|---|---|
| `waiting` | assignment `pending` or `paired`, no event yet | "Waiting for the headset" / "Headset connected, case not started" |
| `live` | last event under 15 s ago, not ended | "Live" |
| `paused` | `state.paused` is true | "Paused on the headset" |
| `stale` | 15 s to 2 min since the last event | "Headset not responding" (it may be a network drop; the run continues on the headset) |
| `lost` | more than 2 min | "Connection lost. The run continues on the headset and its report arrives when it reconnects." |
| `ended` | `run_ended` received or a report exists | "Finished", then the report link |

### 4.3 Storage

`proposals/016_live_view.proposed.sql`: `live_runs` (one row per assignment: latest state, `last_event_at`,
`last_viewed_at`), `run_events` (the trail; heartbeats are not stored there), `live_frames` (newest JPEG per assignment,
overwritten, deleted when the run ends). All backend-only (RLS on, no policy), additive, rollback is three `DROP TABLE`s.
The JPEG is kept in the database for simplicity; at one frame a second it rewrites one row, which is fine for a pilot. If
many runs are watched at once, move frames to Storage with an overwritten object (same API, different store).

### 4.4 Who may watch (recommended; owner to confirm)

The resident (their own run), the instructor who supervises the resident (the existing rule that already guards
`POST /assignments`), and administrators of the institution. **Other residents may not**, because a run in exam mode is
an assessment. A "classroom view" for a whole cohort would be a deliberate later feature, not a side effect.

---

## 5. Dashboard: the live page and where it is reached

New page `/live/[assignmentId]` (the existing `/sessions/[id]` stays for finished sessions and redirects there for a run
that is still in progress).

Layout, using the existing `live.module.css` scene list and tokens (no new colours, no new fonts; `PRODUCT.md` rule):

1. **Status banner**: the `liveState` wording above, case title, resident, mode, elapsed clock (counts on from `elapsedS`,
   resyncs to every heartbeat), "Last update 2 s ago".
2. **What the resident sees**: the snapshot, labelled "Snapshot, about once a second". Empty state when nobody is
   running: "No picture yet. It appears when the case starts."
3. **Running order**: the scenes, each `pending / current / done / skipped / needs attention`. The current step is named.
   Warnings appear in a short feed under it, with the scene they belong to.
4. **Live values against the plan**: for each plan key the headset sends, the planned value, the live value and whether it
   is committed. No verdict colours before the value is committed (the scorer decides verdicts, not the live page).
5. **Actions**: Back to plan, Open case. When the run ends: "Finished. The report is being prepared", then **View report**.

Polling: once a second while the tab is visible, every 5 s while hidden, stops at `ended`. The `<img>` swaps only when the
next image has loaded (no flicker). Because the dashboard has no route handlers and the browser's `<img>` cannot send an
authorization header, the page reads through two new Next route handlers that authenticate exactly as the existing server
actions do. **Before writing them, read the route-handler guide in `node_modules/next/dist/docs/`** (`AGENTS.md`).

Reached from, so nobody has to know a URL:

| Where | What is shown |
|---|---|
| Plan review page (the Send to headset box) | When the status is `running`: **Watch live** |
| Instructor dashboard | **Live now** card: each running resident, case, scene, time, Watch live |
| Sessions list | **Live now** strip above the table |
| Cohort page, learner rows | a "Live" chip with Watch live while that learner is running |
| Resident's own Sessions list | "Your run in progress", Watch live (a second screen or a projector) |

---

## 6. Backend work, and the stand-in

- `core/connect/live_contract.py`: validation of an event batch and of the frame headers; the `liveState` rule as a pure
  function; the event-to-state reducer as a pure function (all unit-testable without a database).
- `services/live_service.py` and endpoints in `api/v1/endpoints/connect.py` (headset side) and a new `live.py`
  (dashboard side). Authorization reuses the connectivity checks. Every endpoint answers 404 "not set up" until 016 is
  applied, as the other connectivity endpoints do. Throttle per device so a faulty build cannot flood the table.
- A `run_started` event moves the assignment from `paired` to `running` (today that happens only for a non-completed report,
  `connect_service.py:521`, which is why a good run reads "Headset connected" throughout). Keep the existing rule that a
  Completed report moves it to `reported`; `running` must not move backwards. `run_ended` and the report ingest end the
  live run and delete its frame.
- Extend `scripts/fake_headset.py` with `--live`: it emits a realistic event sequence and a test JPEG, so the whole path
  can be exercised with no headset, as the report path was on 2026-11-04.
- Tests in the same guarded style as `tests/test_connect_endpoint.py` (each class patches `get_db_conn` to raise, so a
  test cannot reach a database).

---

## 7. The screens after a run: what is wrong, and the fix

### 7.1 What the audit found (verified, section 1)

1. **The headset's record of the run never reaches a screen.** Steps, their times, skipped or failed status, warnings and the
   committed values are stored and not read back. The report can show only what the scorer computed.
2. **"Not performed" and "not measured" are not explained.** A headset that does not model four parameters and five scenes
   produces a result with gaps (`coverage`), and the dashboard has no wording for why. A user sees a dash and has to guess.
3. **Between "code sent" and "report ready" the only place to look is the plan's review page, and it reads "Headset
   connected" throughout** (the status does not change to running, section 1). No session exists until the report arrives,
   so Sessions, the learner's dashboard and the instructor's views are silent for the whole run.
4. **The report is a scoring document.** Its sections are Read first, Score ledger, Marks lost, Planned versus achieved,
   Pace, Scenes and a scoring audit. None of them tells the story in order: what happened, when, and what was skipped.
5. **States are worded differently in different places** (assignment status, scoring status, attempt status, session
   status). The same moment reads one way on the review page and another in Sessions.

### 7.2 Changes

| # | Change | Data needed |
|---|---|---|
| 1 | **"What happened" becomes the first tab of the report.** An outcome banner (Completed / Stopped part-way, device, app version, started, ended, length), then a step log in the order performed: step, scene, status, time, warnings, committed value against the plan. Skipped and failed steps are marked, not hidden. | New `GET /results/{attemptId}/run` returning a summary of `run_reports.payload` and `scoring_note`, same access rule as `/results` |
| 2 | **A "Not scored on" panel** listing each scene not performed and each parameter not measured, each with one sentence: "The headset does not measure tray size yet", "This scene was not reached". It also states how this changes the total, in the scorer's own words (`coverage`). | `coverage`, `scoring_note` |
| 3 | **Run states appear everywhere the run matters**: the same status chip on the review page, the Sessions list ("In progress" rows from assignments), the learner and instructor dashboards. One function decides the wording (section 8.3). | `GET /live/active`, assignments |
| 4 | **The report's scoring tabs stay as they are, after "What happened".** Nothing is removed; the order becomes what happened, how it scored, what to work on. | none |
| 5 | **Every empty state says what to do next** (for example "No runs yet. Plan a case, lock it and send it to the headset" with the button). | none |

Wording of a step log row needs the real stored shape. **Before building, read the stored report of the 2026-11-04 run**
(`%APPDATA%\..\LocalLow\Mediver\ArticulusVR\Connect\reports\ae157748acec48b29adc3ee1b62ee161.json` on the Unity PC, or
`run_reports.payload` for it) rather than relying on the field list in `core/connect/contract.py`, which only validates
the fields it needs.

---

## 8. The path, and how users are guided

### 8.1 The journey

One path, seven stages, the same for every user. Each stage has one next action.

| # | Stage | Where | What the user sees | Next action |
|---|---|---|---|---|
| 1 | Choose a case | Content Library, Case Library | cases by procedure | Open a case, Start plan |
| 2 | Plan | Planner: Assessment, Tibial, Femoral, Review | the four planner steps, saved as you go | Finish the review |
| 3 | Lock | Review page | "Ready to lock"; implant design and fixation asked here | Lock plan |
| 4 | Send | Review page, Send to headset | a 6-digit code, 10-minute countdown | Type the code on the headset |
| 5 | Perform | Headset; **Live page** here | connected, then live state and snapshot | Watch live (instructor), Start case (resident) |
| 6 | Report | Session report | "What happened", then the scoring | Read the report |
| 7 | Improve | Report, Progress | what to work on, instructor feedback | Plan a new case |

An instructor's path differs at 1 (assign through a session or a cohort) and 5 (Watch live) and 7 (leave feedback).

### 8.2 How the app keeps the user on the path

1. **A journey bar** (a small component, five labelled stages: Plan, Lock, Send, Perform, Review) on the planner's review
   page, the live page, the report and the plan list rows. The current stage is marked, completed ones are checked, and a single
   sentence below says where things stand and what to do next. It never offers two primary actions.
2. **One status vocabulary** (8.3) from one pure function, used by every screen, so the same moment reads the same everywhere.
3. **A pre-send checklist** in the Send to headset box, before the code: headset charged and on the internet, the MediVeR app
   open at the code screen, code must be typed within 10 minutes. After a failed or expired code, the exact next step.
4. **Start-here card** on the first visit of each role (a learner's dashboard, an instructor's dashboard), showing the seven
   stages and the user's own next one. It disappears once the first report exists. It is derived from data (has a plan,
   has an assignment, has a report), not from a stored "dismissed" flag, so it can never be stale.
5. **Empty states that point forward** (7.2 #5) and error text that says what to do ("The code expired. Send it again for
   a new one").
6. **Help**: one Support article, "How a run works", using the same seven stages and the same words, linked from the
   journey bar. The existing Support articles about pairing are checked against it.

### 8.3 One vocabulary

Built on the codes that already exist (`lib/headset-link.ts`), not new ones. One pure function
`journeyState(assignment, live, report)` returns the stage, a short label, one sentence and the next action; every screen
uses it, and a table test pins each row.

| Facts | Stage | Label | Sentence | Next action |
|---|---|---|---|---|
| plan not locked | Lock | Not locked | "Lock the plan to send it." | Lock plan |
| `pending`, code live | Send | Code ready | "Type 123 456 on the headset. It expires in 9 min." | (wait) |
| `pending`, code expired, or `expired` | Send | Code expired | "The code was not used in time." | Send again |
| `paired` | Perform | Headset connected | "The plan is loaded. Start the case on the headset." | (wait) |
| `running`, `liveState` live | Perform | Live | "Scene 4.2, step 14 of 61." | Watch live |
| `running`, paused | Perform | Paused | "Paused on the headset." | (wait) |
| `running`, stale or lost | Perform | Connection lost | "The run continues on the headset. The report arrives when it reconnects." | (wait) |
| `running`, `lastOutcome` Abandoned | Perform | Stopped part-way | "It can be resumed on the headset." | (resume on headset) |
| `reported`, scored | Review | Report ready | "The run is finished and scored." | View report |
| `reported`, `awaiting_inputs` | Review | Report waiting for data | "The headset did not send everything the scorer needs. What is missing is listed." | View what happened |
| `reported`, `not_scored` | Review | Finished, not scored | the stored reason | View what happened |
| `cancelled` | Send | Replaced | "A newer code replaced this one." | (see the newer one) |

---

## 9. Build order

Each step is testable on its own; none needs the headset until step 6.

| Step | Work | Needs |
|---|---|---|
| 0 | This note, `016` proposal, the VR prompt. **Done in this change.** | none |
| 1 | The VR team builds events and frames against section 4 (their prompt) | VR team |
| 2 | Backend: contract, reducer, endpoints, stand-in `--live`, tests (no database) | none |
| 3 | Owner reviews and applies 016, restarts the backend without `--reload` | owner |
| 4 | Dashboard: route handlers, live page, Live now surfaces | step 2 |
| 5 | Report: run summary endpoint, "What happened" tab, "Not scored on" panel, one vocabulary, journey bar, checklist, Start-here, Support article | steps 2 and 4 |
| 6 | First real run: a Quest, the dashboard on another device and network (`24_...` Phase 1) | steps 1 to 5 |

Acceptance (run at step 6 and again at every rollout phase):

1. Start a case on the headset; within 3 s the live page shows "Live", the scene and the elapsed clock.
2. Complete a step; the running order moves within 2 s. Skip a step; it shows as skipped.
3. Close the dashboard tab: within 15 s the headset stops sending frames (`wantFrames` false); reopen it: frames resume within 3 s.
4. Turn Wi-Fi off on the headset mid-run: the page says "Headset not responding", then "Connection lost" at 2 min; turn it on:
   the page returns to "Live" without a reload and the report still arrives and scores.
5. The headset's frame time stays inside its budget with the frame upload on (measured by the VR team, reported to us).
6. A learner opens another learner's live page: 404. A supervising instructor opens it: works.
7. Finish the run: the live page says "Finished", the report link works, "What happened" lists every step performed,
   the "Not scored on" panel lists the unperformed scenes and unmeasured parameters, and the numbers agree with the
   headset's own report file.
8. An old headset build with no live code still pairs and reports exactly as before.

---

## 10. Decisions for the owner

1. **Level**: A and B now, C (video) not started? (Recommended, section 2.)
2. **Who may watch**: the resident, the supervising instructor, administrators; not other residents? (Section 4.4.)
3. **Apply 016** when the backend work is reviewed (I copy it into `backend/migrations/`, you apply it).
4. **Retention**: `run_events` for 90 days (it is the replay), frames deleted when the run ends.
5. **The reading of "post"** (the top of this note).

## 11. Risks, stated

- Snapshot capture on a Quest 3 is the one piece nobody here has measured. The prompt makes the VR team measure it and
  gives them a fallback (lower resolution, longer interval, skip when over budget). If it cannot meet the budget,
  A still ships and B waits.
- Not verified against Unity: the event names the headset's `ProcedureEngine` raises, and whether the run clock and the
  report's `durationSeconds` are the same clock. The prompt asks the VR team to confirm both before building.
- The contract is untested with a real headset. The stand-in headset proves the backend and dashboard, not Unity.
