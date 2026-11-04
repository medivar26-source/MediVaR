# Dashboard ↔ Quest 3 connectivity — design and structure

Status (2026-11-03): **backend and the dashboard's send flow are built and tested. The owner applied migration 015 on
2026-11-03.** The first end-to-end run (dashboard → stand-in headset → report) is in progress (section 12).
Counts: backend 97 tests (scorer, results, connectivity, stand-in headset), dashboard 506, none needing a database.
Date: 2026-11-03. Headset side: the "Web Dashboard ↔ Quest 3 Connectivity" plan of 2026-10-23.

## 1. In one page

The headset and the dashboard never talk to each other. Both talk to the backend over HTTPS, and the backend is
the meeting point.

```text
 DASHBOARD (browser)                BACKEND (FastAPI + Postgres)                 QUEST 3 (standalone)
 ───────────────────                ────────────────────────────                 ────────────────────
 1 plan the case, seal it   ──►     plans (locked, vr_payload)
 2 "Send to headset"        ──►     assignments  ──► one-time 6-digit code
   (shows the code, 10 min)
                                                                          3 trainee types the code ──►  POST /devices/pair
                                    token + CasePlan  ◄──────────────────────────────────────────────  (plan comes down)
                                                                          4 runs the case against the plan
                                                                          5 uploads a RunReport      ──►  PUT …/report
                                    run_reports (verbatim)
                                    scorer ──► attempts + assessment_results
 6 Reports, Insights,       ◄──     GET /results   (already built)
   resident progress
```

**The key finding:** steps 1, 2 and 6 of the dashboard already exist or are one small change away. Step 6 (reports,
analysis, resident progress, cohort statistics) already reads `assessment_results` through `GET /results`. So
connecting the headset needs only two things: get a *locked plan* into the database, and get a *run report* turned
into an `assessment_results` row. Everything on the dashboard that shows results then lights up unchanged.

## 2. What exists, what is new

| Piece | State |
|---|---|
| Planner, V1 VR payload (`buildV1VrPayload`), seal action | Exists. Plans live in dashboard **server memory** (`lib/data/plans.ts`), so nothing sealed reaches the database. |
| `plans`, `attempts`, `assessment_results` | Exist (013, applied). Hold the sample results. |
| Scorer `mediver-tkr-1.0-sample`, `GET /results`, every results screen | Exist. |
| Pairing PINs | Exist only as memory (`PINS`) and a stub action. Replaced by `assignments`. |
| Headset endpoints, pairing, tokens, report ingest, the plan builder, the report→scorer bridge | **New (this change).** |
| Dashboard wiring: persist on seal, "Send to headset", assignment status | **Not done** (section 9). |

## 3. Data model (proposal 015, on top of 013)

```text
plans (013) ──< assignments >── devices ──< device_tokens
                    │
                    └──< run_reports >── attempts (013) ── assessment_results (013)
```

| Table | Holds | Rules |
|---|---|---|
| `devices` | One row per headset that has paired (`device_id` is the headset's own id) | — |
| `assignments` | "Send to headset": one locked plan → one trainee, mode, status, the **hash** of the code, its expiry | Live codes are unique; a plan is out for performance at most once at a time; the code is stored only as a hash |
| `device_tokens` | The headset's bearer token, hashed, 30 days, revocable | Pairing again revokes the device's earlier token |
| `run_reports` | Every uploaded report **verbatim** (`payload`), its revision, and whether it has been scored | `UNIQUE (assignment_id, run_id)`; a higher `reportRevision` replaces |

Assignment status: `pending → paired → running → reported`, or `expired` / `cancelled`.
No existing table is altered. Rollback is four `DROP TABLE`s while empty.

## 4. The API (base `/api/v1`)

Headset paths and shapes follow the headset plan exactly, so the two sides can be built independently.

| Caller | Call | Result |
|---|---|---|
| Headset | `GET /health` | `{status, service, apiVersion, serverTimeUtc}` (drives the gateway chip and the clock offset; no auth) |
| Headset | `POST /devices/pair` `{code, deviceId, deviceName, appVersion, schemaVersion}` | `{assignmentId, token, tokenExpiresAt, casePlan}`. **404** unknown · **410** expired or already used · **429** too many wrong codes (`Retry-After`) |
| Headset | `GET /assignments/{id}/plan` | The CasePlan again (resume, restart). 403 if not this headset's assignment |
| Headset | `PUT /assignments/{id}/runs/{runId}/report` | `{accepted, receivedAtUtc, scoring, missing}`. Idempotent on `runId`; **401** → re-pair; **422** → poison, never retried; **409** → the plan already has another run |
| Dashboard | `POST /plans/locked` | Keep a sealed plan (the server checks the case and the V1 payload) |
| Dashboard | `POST /assignments` `{plan_id, mode?}` | `{id, code, code_expires_at, …}` **The code is shown once.** |
| Dashboard | `GET /assignments?plan_id=` | Status of what was sent, never the code |

Every call returns **404 "not set up"** until 015 is applied, so the dashboard can hide the button instead of failing.

## 5. Plan down: from the planning screen to the headset

The CasePlan is built **on the server from the locked plan**, never from what a browser sends at assignment time,
so the headset runs exactly what was sealed. No patient identifier is included: a synthetic label and the trainee's
display name only.

| CasePlan field | Comes from |
|---|---|
| `patient.label`, `side` | locked V1 payload `patient_id`, `knee_side` (a plan with no side is **refused**, never defaulted) |
| `patient.deformity` | the case's own wording ("varus"/"valgus"); empty if it does not say, shown as "Not recorded" |
| `trainee`, `instructor` | the plan's owner, their cohort and institution, the cohort's owning instructor |
| `mode` | the plan's mode (training → Practice, assessment → Exam) unless the sender picks Guided/Practice/Exam |
| `values[]` (key, value, tolerance, unit) | see below |

| Plan key | Value | Source |
|---|---|---|
| `P2.tibialDepthMm` | 9 mm | execution target |
| `P2.tibialVarusValgusDeg` | 0° | execution target |
| `P2.tibialSlopeDeg` | CR 3°, PS 1° | execution target |
| `P3.femoralDepthMm` | 9 mm (10 with a fixed flexion ≥ 10°) | execution target + the case's `fixed_flexion_deg` |
| `P3.femoralValgusDeg` | **the plan's AMA** | locked V1 payload |
| `P3.femoralSize`, `P4.tibialTraySize`, `P4.implantSize` | **the plan's implant sizes** | locked V1 payload |
| `P1.flexionDeg` | 90° ± 5° | headset constant (not planned on the 2D screen) |
| rotation, gap, HKA, tray rotation | 0 | execution target |

The plan's own `execution_targets`, when it has them, win over these rules. **Tolerances are the scorer's own,
already scaled by the session's difficulty** (Beginner ×1.5, Intermediate ×1, Expert ×0.7; sizes ±1, unscaled), so
the gauge the trainee watches and the verdict they get agree about what "in tolerance" means.

## 6. Results up: from the headset to the report

The headset reports **facts**: the value committed at each judged step, seconds per scene, warnings per scene.
It does not decide a score, a pass or a competency (`10_VR_INTEGRATION.md`, "Client authority boundary"). The backend:

1. validates the report's shape (bad shape → 422 poison);
2. stores it **verbatim** in `run_reports`, and creates or advances the `attempt`;
3. for a *Completed* report, feeds the facts to the scorer **against the plan the server locked**, not the snapshot the
   headset echoes back (a test pins this), and writes the one `assessment_results` row;
4. scores what the headset performed and measured, and records what it did not (`payload.coverage`,
   `scoring_note`): a scene with no time is "not performed", a parameter with no committed value is "not measured"
   (no verdict, no share in its scene's outcome). A report with no scene time at all is stored and marked
   `awaiting_inputs`. **It never scores on invented numbers.** Category marks are shared among the scenes the run
   visited, so a simulator without a closure scene still reaches 100 on what it does have.

The headset's own `totalScore`/`grade` are kept in the stored payload for comparison and are never shown or used.

### What the headset sends (as built on the Unity side, 2026-11-03)

The Unity simulator now applies the plan to its judges and uploads a report per run (`Assets/Scripts/Systems/Connect/`).
Against the table this section used to carry:

| Requested | Status |
|---|---|
| `sceneId` on each step | **Sent.** One table in the headset (`StepSceneMap`) files every simulator step under a dashboard scene; its test refuses a step with no row. Rows the owner should confirm: P1_05 joint exposure → 3.2 (critical Hohmann scene), P1_06 patellar subluxation → 3.1, P2_09 block removal → 4.3, P10_01–04 component placement → 10.2. The time-out screen's seconds go to 0.1. |
| `warnings` on each step | **Sent.** One stated rule: each failed attempt, a skip, and a step done with a quality below 1 (a red gap) are one warning each. |
| `P3.femoralRotationDeg` | **Sent as a measurement**: the AP sizer's dial when the reference holes commit it (positive assumed = external, the gap module's assumption). |
| `P5.gapDifferenceMm` | **Sent as a measurement**: flexion gap minus extension gap, from the two recorded gap readings. |
| `P3.femoralSize`, `P5.hkaDeg`, `P4.tibialTraySize`, `P4.trayRotationDeg` | **Not sent — not modelled.** The simulator has one tray and one femoral component, no post-cut alignment measure. Rather than invent them, the backend now scores the run on the eight parameters it has and shows these four as "Not measured". |
| Scenes 2.3, 6.3, 10.1, 11.1, 11.2 | **Not performed** by the simulator today (no release/eversion step, no post-cut alignment, no lavage, Part 11 unauthored); listed as such in the result. |

The headset marks an assignment **spent** once its Completed report is accepted (or on 409/410) and asks for a new
code; its token stays valid so a backlog still uploads. `P1.flexionDeg` is reported but the headset keeps its own 90°
(a calibration of its knee model), as the headset plan said it would.

## 7. Reports, analysis, resident progress

Nothing new to build on the display side. `assessment_results` is what the dashboard already reads:

| Screen | Reads |
|---|---|
| Sessions list, session report | `attempts` + `assessment_results` (the report shows planned vs achieved, marks lost per scene, verdict) |
| Insights / Progress (instructor and learner): trends, categories, hotspots, pass rate | the same rows through the roll-ups |
| Cohort page, resident detail | the same rows, scoped by the existing supervision rule |

Display of in-between states already works: `paused` (an abandoned run) shows "Interrupted"; `submitted` with no
result shows "No report" until it can be scored. The "Sample results" banner appears only for rows whose scorer
version ends in `-sample`; a headset run scored by this scorer carries the same version, so it stays labelled until
clinically approved tolerances replace the sample ones.

**Not done:** the percentile is left empty for headset runs (the dashboard already handles null); computing it needs the
cohort roll-up to run at ingest.

## 8. Security and failure modes

| Concern | Handling |
|---|---|
| Code guessing (6 digits) | one-time, 10-minute life, hashed at rest, wrong guesses throttled per address + device (10 per 10 min → 429). **The throttle is in memory:** fine for one backend instance; several instances need a shared store before launch |
| Token theft | opaque, hashed at rest, 30 days, revoked when the device pairs again; "Forget pairing" on the headset |
| Someone else's plan | an assignment can be made only by the plan's owner or the instructor who supervises them; others see 404 |
| A forged plan in a report | ignored: scoring uses the server's own plan |
| Another headset's assignment | 403: the token's device must be the one paired to that assignment |
| No PHI | synthetic label + display names only |
| Network drops mid-case | the headset saves on pause and queues reports on disk; retries are harmless (idempotent on `runId`) |
| Abandoned, then resumed | the abandoned report is provisional; a later *Completed* one with a higher `reportRevision` replaces it, and scoring runs once |
| Report for an already-scored attempt | stored, not re-scored (a result is immutable; a re-score is a new attempt) |

## 9. What is built, and what is not

Built and tested (no database; at the time 93 backend tests, now 97 with the stand-in headset):

- `backend/core/connect/` — `contract.py` (keys, enums, report and payload validation), `pairing.py` (codes, hashes, throttle, redeem rules), `case_plan.py` (the plan builder), `report_bridge.py` (report → scorer)
- `backend/services/connect_service.py`, `backend/api/v1/endpoints/connect.py`, `/health` extended (additive)
- `tests/test_connect_core.py` (32), `tests/test_connect_endpoint.py` (37; scripted-cursor tests prove the flow, **not** that Postgres accepts the SQL)
- `proposals/015_vr_connectivity.proposed.sql`

Built since (dashboard):

- `startPlan` now keeps the implant design and fixation chosen on the case setup (they were dropped, which would have
  blocked every send).
- Most ways into the planner (a case page, a direct link) never ask for implant design and fixation. Instead of refusing
  such a plan, the **Send to headset** panel asks for both, as two required dropdowns with nothing preselected (never
  defaulted). The choice goes into the stored plan's `session_config` and is not asked again for that plan. A choice
  never overrides a value the plan already recorded.
- `sealTkrPlan` also stores the sealed version (`POST /plans/locked`); not fatal if the link is not set up.
- The review page's sealed banner has **Send to headset** (`app/plan/[id]/review/SendToHeadset.tsx`): a one-time code in
  large digits with a 10-minute countdown, then the status (waiting → connected → in progress → report ready / awaiting
  inputs / expired), polled every 4 s while the headset may still act, with a link to the report once scored. It says
  "not set up" on a 404 and explains why a built-in practice case cannot be sent.
- `lib/headset-link.ts` (pure, 12 tests), `lib/data/headset.ts`, actions `sendToHeadset` and `headsetStatus`.
- `backend/scripts/fake_headset.py`: a stand-in Quest that speaks the contract over HTTP (4 tests).

Not built:

1. `Settings → Pairing` and `/plans` still read the in-memory `PINS`; they should read `GET /assignments`.
2. **Plans are still memory-only for drafts.** Only *sealed* plans go to the database; the full draft persistence in
   `22_PERSISTENT_PLANS…` §4 is a separate step. Built-in demo cases (`CASE_001`…) are not database rows and cannot be sent.
3. **Phase 3:** `POST …/events` and the live stream (Server-Sent Events).
4. **Run against a real database.** Nothing here has touched one.

## 10. Decisions needed

1. **Apply 015?** Copy the proposal into `backend/migrations/` (I will, when you say) and you apply it yourself.
2. **Who scores? Recommended: the backend**, as built, because the standing rule says the headset never sends a score
   and the dashboard must show only stored results. The alternative (trust `totalScore` from the headset) is a
   different design: tell me and I will change the bridge.
3. **One run per plan, or several?** 013 says a plan backs one performance (`UNIQUE(plan_id)`), kept here. Consequence: a
   trainee who finishes and wants another go needs a new plan. If you want retakes on the same plan, 015 would replace
   that constraint with "one *non-cancelled* attempt per plan".
4. **Ask the headset team** for the section 6 additions, and for `P4.implantSize`: the headset shows one size; I send the
   femoral size. Confirm.
5. **Tolerances.** Coronal cut, rotation, gap, tray rotation and the sizes are *sample* configuration. They now also
   drive the headset's gauges. Replace them with clinically approved values before real use.

## 11. Discrepancies found (not silently resolved)

- `22_…` §7 sketches `POST /vr/attempts` and `…/complete`; the headset plan defines `pair` / `plan` / `report`. I followed the
  headset plan (the headset team will build to it) and kept `10_VR_INTEGRATION.md`'s rule that the headset sends no score.
- `10_…` describes streamed events with sequence numbers; the headset plan sends one report per run (events are phase 3).
- The V1 VR payload deliberately has no cut or resection values; the headset plan's `values[]` are exactly those. They are
  added **beside** the payload, derived server-side, so the sealed V1 JSON stays as the PDF specifies.
- Mode names differ: the dashboard has `training`/`assessment`; the headset has Guided/Practice/Exam. Guided and Practice
  record as `training`, Exam as `assessment`.
- The plan's slope, rotation and gap targets are rules, not fields the planner records today (the tibial-slope field is
  still an open decision in the handoff).

## 12. Running it (owner)

> **Scope (2026-11-04):** this recipe is the same-PC / trusted-LAN pilot (Phase 0–1). It does not survive an
> organisation's Wi-Fi (client isolation, egress filtering to 443, TLS inspection, captive portals). For two devices on
> different networks and for production, read `24_CROSS_DEVICE_CONNECTIVITY_AND_PRODUCTION_ROLLOUT.md`.

From `backend/`:

1. ~~Apply the migration~~ **Done 2026-11-03** (`015_vr_connectivity.sql`; 013 was already applied).
2. Restart the backend so the new routes load. **For a real headset on the Wi-Fi**, listen on the network, not only on
   this PC: `./venv/Scripts/python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000`, allow port 8000 through the
   Windows firewall (private networks), and give the VR team `http://<this PC's Wi-Fi IP>:8000/api/v1`. Plain HTTP works
   only in their *development* builds; a release build needs HTTPS (a deployed backend with a public certificate).
3. Prove the chain with the stand-in headset before the real one is ready:
   - in the dashboard, plan a **library** case (not a built-in practice case), seal it on the review page (step 4,
     **Lock plan**), then in the **Send to headset** box choose the implant design and fixation if it asks and press
     **Get a code**;
   - `./venv/Scripts/python.exe scripts/fake_headset.py --code <the code>`
     (add `--keys headset` to see what happens with a headset build that lacks the requested additions);
   - the review page moves to "Run finished. The report is ready.", and the run appears in Sessions, Insights and the
     resident's progress.

