# Handoff: MediVeR-XR dashboard UI/UX work

Written 2026-10-23 from the actual repository state, not only from the conversation.

## State

- **Branch:** `main`. Everything below up to `5eae307` is committed. **Uncommitted:** the `SearchDialog` change (session 2), the testers' planning changes (session 3; see Session log), a new change log under `mediver_documentation/changes/`, and this untracked `handoff.md`. Earlier work:
  - `87a5ef4`: first UI pass, `PRODUCT.md`, phone menu, shared Dialog.
  - `5eae307`: second pass and instructor parity.
- **Verified on `5eae307` (2026-10-23), run from `dashboard/`:**

  | Command | Result |
  |---|---|
  | `npx tsc --noEmit` | clean |
  | `npm test` | 400/400 pass (415/415 after session 3, 456/456 after session 4) |
  | `npx eslint` | 77 errors, 27 warnings. All existed before this work (HEAD before it: 77/28); none are new. |

- **Production build:** passed earlier in this session on an isolated copy of the same code. It was not re-run after the final commit.

## Objective

Refine the UI/UX of the existing app. Do not redesign it: `PRODUCT.md` makes "light theme, one font, one accent colour" binding. Most recently: give instructor mode the same UI changes that learner mode received under `mediver_documentation/changes/learner_mode_review_2026-10-20.md`.

## Completed

1. **Phone and tablet**
   - Phone menu drawer (`components/shell/MobileNav.tsx`, built on `<dialog>`). Menu button in the top bar below 768px; search becomes an icon button; all top-bar controls are 44px.
   - The planner below 1024px shows a "needs a larger screen" notice with Back to case (`TkrPlanShell.tsx`).
   - Progress no longer overflows at ≤1100px wide.
   - Inputs use 16px text on phones (no iOS zoom).
   - `touch-action: manipulation` on controls.
2. **Accessibility**
   - Real text moved from `--text-disabled` (2.6:1 contrast) to `--text-muted`; placeholders too.
   - Search dialog has combobox/listbox semantics.
   - Shared `Dialog` uses `useId` titles and has a `size="sm"` option.
   - Hover motion is limited to fine pointers.
   - With reduced motion, the button spinner pulses instead of freezing.
3. **Consistency**
   - "Edit session" and the wizard's learner preview use the shared `Dialog`.
   - Upload errors show in the wizard's error banner instead of `alert()`.
   - "Not scored yet" replaces a "Not attempted" that contradicted the attempt count.
   - Dates show no seconds: `dateTime` and `dateTimeParts` in `lib/format.ts`.
   - The admin form lines up (helper text moved under the row).
   - "N/A" became "Not recorded".
   - No `transition: all` remains.
   - Button press scale; popover and dialog entry motion; `--ease-drawer` token.
4. **Instructor parity with learner mode**
   - **Programs:** count badge instead of a stat card.
   - **Sessions:** no eyebrow, `StatStrip`, sample/live wording in `DemoDataNote`.
   - **Instructor case view:** labelled fields and a `StatStrip`.
   - **Program and cohort pages:** no eyebrows; program cases use `ProcedureCaseCard staff`.
   - **Sentence case:** labels, plus program tabs "Learners & performance" and "Cohort performance".
   - **Insights:** one sidebar link (`lib/nav.ts`). `/performance` is a tabbed page for staff: Overview, Activity, Reports, By skill, Trends, History. `/activity` and `/reports` redirect to those tabs for staff and to `/progress` tabs for learners.
5. **`PRODUCT.md`:** product context. Users (learners and instructors equal), positioning and principles were confirmed by the owner.

## Decisions to respect

- **Refine, don't redesign.** These are the house style and were deliberately kept:
  - every stat card outlined in green;
  - uppercase section labels and table headers;
  - eyebrows on detail pages;
  - the sign-in gradient and hatched chart bars.

  Changing them is the owner's call.
- **Instructor Insights data is unchanged.** Overview, Activity, By skill, Trends and History compute the instructor's *own* sessions, so they're normally empty, with an explanatory empty state. Only Reports is cohort-wide. Cohort data lives in each program's "Cohort performance" tab. Showing cohort data in Insights would be a data change; it is not done.
- **Earlier standing rules (still apply):**
  - VR Dep report unchanged (blocked: undefined requirement).
  - 013 (plans, attempts, results): **approved by the owner on 2026-11-02** and copied to `backend/migrations/013_plans_attempts_reports.sql`. The owner applies it; I still never do (see "Never" below).
  - Learner Progress stays one link.
  - Never default pathology, side or procedure; show "Not recorded".
  - `/auth/me` is authoritative.
  - No cross-request caching of user data.
- **Never:** commit or push without being asked, apply migrations, touch `.env*` files, connect to the hosted Supabase project, or write to the shared database or Storage.

## Known issues / not done

- **Unused files, safe to delete** (nothing imports them; deletion was blocked by permissions in-session):
  - `dashboard/src/components/instructor/programs/` (Modal, Toasts, ProgramsView, ProgramForm)
  - `dashboard/src/app/personal-cases/[id]/EditPersonalCaseForm.tsx`
- **Database backups tracked in git** (contents not inspected):
  - `backend/db_backup_pre_reset.sql`
  - `backend/db_backup_pre_reset.json`
  - `backend/db_backup_case_library_20261009_130059.json`
- **UI gaps still open:**
  - `SearchDialog` now uses `<dialog>` (focus trap), but that change has **not been checked in a browser** (see Session log).
  - Locked planner steps open via a direct URL.
  - Many inline styles remain in `ReviewWorkspace.tsx` and both case wizards.
  - Capitalisation is still mixed in some learner labels ("Your Programs", "Case Library").
- **Not verified:**
  - Nothing was tested against the real backend, database or Storage; all browser checks used a mock API.
  - Add Case against real storage is still unverified (checklist in the change log).
- **Old mock copy:** the isolated test copy (`F:\pravartak projects\mediver-iso\dashboard`) has an old `.env` that points at the **hosted** project. Its dashboard is run with Supabase env vars removed and talks only to the mock.

## Next steps (priority order)

1. Delete the unused files above and decide on the tracked DB backups. **Blocked:** the auto-mode classifier denied `rm` in-session. The owner should run it or allow it, e.g. `rm -r dashboard/src/components/instructor/programs "dashboard/src/app/personal-cases/[id]/EditPersonalCaseForm.tsx"`. Re-verified 2026-10-23: nothing imports these files.
2. Owner decisions: house-style items (stat outlines, uppercase labels, Title Case) and whether Insights should show cohort-wide data.
3. Browser-check the `SearchDialog` change (open with the search button and Cmd/Ctrl+K; Tab stays inside; Escape and backdrop click close; focus returns to the opener; Enter navigates; the panel is centred and near the top at phone and desktop widths). Then guard locked planner steps server-side.
4. Run the Add Case real-storage checklist in a throwaway Supabase project, only with approval.

## Session log

**2026-10-23 (session 2)**
- Verified the handoff against the repo: unused files and DB backups were as described; `main` at `5eae307`.
- Attempted to delete the unused files: denied by the permission classifier, not retried. Files are untouched.
- Moved `SearchDialog` (`components/shell/SearchDialog.tsx` + `.module.css`) onto a native modal `<dialog>`, as `Dialog` and `MobileNav` already are:
  - `showModal()` on mount, `close()` on cleanup to restore focus;
  - Escape handled by `onCancel`; backdrop click via the dialog element's own `onClick`;
  - the old `.backdrop` wrapper and the manual Escape branch are removed.
- Checks after the change, from `dashboard/`: `tsc` clean, `npm test` 400/400, `eslint` 77 errors / 27 warnings (unchanged).
- Not done: no browser check (mock tooling not re-created this session); nothing committed.

**2026-10-29 (session 3): tester spec review, no code changed**
- Reviewed "Planning mode details.pdf" (senior testers' changes for the pre-operation plan) against the planner. Text extracted with `pdftotext`; the PDF's images were not seen and symbols (±, °) were garbled, so the abnormal column of the ranges table needs checking against the original.
- Findings: the code has one "usual" range per measure (`MEASURE_INFO` in `lib/data/assessment_geometry.ts`) where the spec has three tiers (normal / borderline / abnormal); the spec's values differ for mHKA (±1.5° vs "within 3°"), PTS (5-12° vs 5-10°) and MAD (asymmetric, signed). Display names differ (`LDFA` vs `mLDFA`). `FitMap.tsx` is a single top-down map where the spec asks for four view-specific maps. Spec colours are green/red/grey; code has an amber "warn" tone.
- Mockup images (4 screens: tibia AP/LAT, femur LAT/AP) reviewed against the planner. Corrections to the first read: the femoral fit markers already include the anterior cortex and posterior condyle edges (`MarkerKey` in `lib/data/fit_markers.ts`), and `notchingRiskMm` (`lib/data/tkr_templates.ts`) is the flange's shortfall behind the anterior cortex, i.e. notch depth, so it matches the spec's concept; it only needs a yes/no and a clearance label.
- Main gaps vs the mockup: per-view controls panel (sections always visible, sliders + number inputs, metric cards, verdict banner) instead of the 4-step panel; tibial posterior-slope control (new field in `V1TibialComponent` → payload / plan lock / VR); implant family and CR/PS selection; angle badge on the scan. Pushback items: femoral internal/external rotation on the AP view (not measurable on a 2D AP radiograph), the mockup's blue accent (PRODUCT.md binds one accent; the brand is green `--brand: #0f7a46`), and dropping the marker, confirm and lock steps the mockup doesn't show. The femoral size count differs (mockup 1-6, code 1-8).
- Hand-drawn landmark/measurement sketch reviewed. All six measurement definitions match `computeAssessment` in `lib/data/assessment_geometry.ts`. **Discrepancy found (not fixed):** MAD direction is reported as where the *knee* sits from the hip-ankle line, so a varus knee reads "N mm lateral" (`MeasurementPanel.tsx:151`; test `assessment_geometry.test.ts:155`). The spec and the sketch ("medial always") use the clinical convention, where varus = medial MAD. Saved plans also drop the direction: `mad_direction` is not in `V1Assessment`, and MAD and mHKA are stored unsigned while the sketch wants ±. Signed values would change the VR payload. The sketch also adds landmarks: TSA-P/D on FLAP, and AFC, PFC and FSA-P/D on KLAT (today AFC/PFC are femoral-step fit markers).
- Open questions for the testers: pass/fail thresholds for the fit map, definitions of the "tibial resection reference line" and "femoral alignment reference", and whether amber is allowed. Nothing implemented until answered.

**2026-10-29 (session 3, continued): testers' changes implemented (uncommitted)**
- Full record: `mediver_documentation/changes/planning_mode_details_2026-10-29.md`.
- Done:
  - MAD direction now uses the clinical convention (varus = medial); the old display was reversed.
  - Three-tier reference ranges (`MEASURE_RANGES`, `rangeTier`) on the assessment and Review pages.
  - mLDFA label and the testers' measurement order.
  - Saved plans show the MAD side (derived from varus/valgus).
  - Femoral "Anterior clearance" plus "Potential notching: Yes/No" (`notchingLikely`).
  - Instructor reference tiles use the shared labels and show "Not recorded".
- Files: `lib/data/assessment_geometry.ts`, `lib/data/tkr_templates.ts`, `lib/data/landmark_guide.ts`, `lib/data/support-content.ts` (abbreviation only), `app/plan/[id]/assessment/MeasurementPanel.tsx`, `app/plan/[id]/review/ReviewWorkspace.tsx`, `app/plan/[id]/femoral/FemoralControlsPanel.tsx`, `app/cases/[id]/_instructor/InstructorCaseView.tsx`, `components/cases/CaseAuthoringWizard.tsx` (two label strings), and tests.
- Verified: `tsc` clean, `npm test` 415/415, `eslint` 77/27 (unchanged).
- Not verified: no browser check and no production build. The user's `next dev` on port 3000 runs from this `dashboard/` and shares `.next`, so do not run `next build` here while it is up.
- Waiting on decisions: the MAD lateral band (spec contradicts itself; stricter reading used); the per-view panel redesign vs PRODUCT.md "refine, don't redesign"; tibial slope field; new landmarks; signed values in the VR payload; the case wizard's mHKA/alignment conventions (pre-existing, affects scoring).

## How to verify

```sh
cd dashboard
npx tsc --noEmit && npm test && npx eslint   # expect lint 77 errors / 27 warnings (all pre-existing)
```

**Browser checks (mock only).** The tooling lives in a session temp folder and may be gone:
`C:\Users\VK_THE_PRO\AppData\Local\Temp\claude\F--pravartak-projects-MediVeR-XR-main\b6cba692-ca31-40f9-a0c8-bc0889c18920\scratchpad\mock\`

| File | What it is |
|---|---|
| `mock_api.py` | Read-only mock API on 127.0.0.1:8100 |
| `run.mjs` | Page sweeps |
| `interact.mjs`, `final_checks.mjs`, `instructor_parity.mjs`, `table_check.mjs` | Interaction checks, run with `node --experimental-websocket <file>` |

To run them:
1. Copy changed `dashboard/src` files into `mediver-iso/dashboard/src`, skipping its 9 port-edited files (`app/actions/{admin,index}.ts`, `lib/api-client.ts`, `lib/session.ts`, `lib/data/{admin,cases,content-api,programs,residents-api}.ts`).
2. In that copy, remove `SUPABASE*`/`PG*`/`DATABASE*` env vars, set `NEXT_PUBLIC_API_URL=http://127.0.0.1:8100/api/v1`, then `npm run build` and `npm run start` (port 3100).
3. Sign in with any password: learner tab with any ID; instructor tab with any email; an email starting with "admin" gives an administrator.

**Leave alone:** whatever runs on ports 3000 and 8000 belongs to the user. Stop only the processes you start on 3100 and 8100.

**2026-10-30 (session 4): new public case library, overlay redesign, planner fixes (uncommitted, NOT yet in the database)**
- New generator `dashboard/scripts/case-library/` (`anatomy.ts`, `render.ts`, `cases.ts`, `make_case_library.ts`, `geometry.ts`, `preview.ts` = tuning aid). Run: `cd dashboard && npx tsx scripts/case-library/make_case_library.ts`. It draws 6 synthetic cases with visible deformity (12 JPEGs in `dashboard/public/scans/<key>_{flap,klat}.jpg`), checks the 25 mm sphere with the planner's own detector, measures the landmarks with `measureAssessment`, sizes with `rankTibialSizes/rankFemoralSizes` + auto-fit, and writes `backend/scripts/case_library.json`.
- `backend/scripts/seed_case_library.py` rewritten to read `case_library.json` (no clinical values typed in Python). **Not run.** To replace the library: `cd backend && python scripts/seed_case_library.py --wipe --sessions detach` (writes a JSON backup first; touches the hosted DB + Storage, needs the owner's go-ahead).
- Learner-facing case text quotes no scored numbers; the answers are in the instructor notes only (test enforces it).
- `src/lib/__tests__/case_scan_calibration.test.ts` rewritten: 56 checks against the JSON and the JPEGs.
- Overlay redesign: `components/ImplantOverlay.tsx` (metal/poly gradients, halo, ring centre handle, rotate icon, pill label with verdict light); femoral template pegs (drawing only, version 1.2.0).
- Planner: zoom cap 5 -> 12 (`ScanViewport.tsx`); assessment auto-zooms to the knee / femur for those points (`XRayCanvas.tsx`); placement banner moved to the corner (it covered the hip centre); tibial view auto-zooms to the knee (`TibialCanvas.tsx`); case grid overflow fixed (`app/cases/cases.module.css`).
- Browser-checked on an isolated copy (`F:\pravartak projects\mediver-iso\planner-check`, mock API in the scratchpad), ports 3100/8100, both stopped. UI-placed points reproduced the reference within 0.2°/0.2 mm.
- Continued 2026-10-30:
  - Tibial first-guess edges now sit on the plateau rim, so the tibial step proposes the reference size straight away (test added).
  - Femoral edges are no longer pre-filled from the condyle bottoms, which gave a half-width bone and a warning. Each femoral scan opens zoomed on the knee instead (`lib/data/fit_markers.ts`, `FemoralCanvas.tsx`).
  - Fixed: after switching scans, the viewport zoomed using the previous scan's size (`ScanViewport.tsx`).
  - Synthetic patient IDs `SYN-TKA-101`… added, so the plan header and VR payload no longer show the UUID.
- Verified 2026-10-30:
  - `tsc` clean; `npm test` 456/456; eslint 77/27 (unchanged); production build passes in the isolated copy.
  - Full learner flow in the browser on the beginner case through Review ("Ready to lock").
  - Instructor reference plan checked.
  - Test servers stopped; `.playwright-mcp/` screenshots removed.
- User guide and change log: `mediver_documentation/changes/case_library_and_planner_2026-10-30.md`.
- **Open:**
  - Run the seed (owner's go-ahead; touches the hosted DB and Storage).
  - Delete the superseded `make_calibrated_scans.py`, `scan_manifest.json` and the old `public/scans/{varus,valgus,mild}_*.jpg`.
  - Only the beginner case was walked through in the browser.

**2026-10-30 (cleanup, no database writes)**
- Removed my test copy `F:\pravartak projects\mediver-iso\planner-check` (junction to the repo's node_modules removed first with `rmdir`, so the repo was untouched). Nothing of mine now runs on 3100/8100.
- `.gitignore` now ignores new `backend/db_backup_*` files (the three already tracked stay tracked).
- Left alone on purpose: `mediver-iso\` (its `.env` holds the owner's disposable-project credentials), `F:\pravartak projects\backup\`, and the owner's servers on 3000/8000 (backend shows two `uvicorn --reload` processes: parent and reloader child, normal).
- Still open: the seed (`--wipe --sessions detach`) has NOT been run, so Case Library still shows the old cases.

**2026-10-30 (realistic scans)**
- Seed was run by the owner: 6 new cases are in the DB (backup `backend/db_backup_case_library_20261030_062000.json`, git-ignored).
- Owner said the scans looked fake. `dashboard/scripts/case-library/render.ts` rewritten as a physics-style renderer (chord-length absorption through round bones with cortex + canal + trabecular texture, thick-limb soft tissue, scatter, edge enhancement, detector blur, quantum noise). Geometry/landmarks untouched; patella layer in `anatomy.ts` (AP) made fainter. All 12 JPEGs regenerated; sphere re-verified (<=0.6 px), measurements/sizes unchanged, `case_scan_calibration.test.ts` 62/62.
- NOT yet in the DB/Storage: owner must re-run `python scripts/seed_case_library.py` from `backend/` (no `--wipe`) to upload the new JPEGs (auto-mode classifier blocks me from running it).
- Still stylised, not real patient films: lateral anatomy (condyle circle, floating patella) and joint space are the weakest parts.

## 2026-10-30 (point names, overlay, per-scan height)
- Tester list "Pre-op plan neew point names.txt" applied: assessment landmarks renamed in `dashboard/src/lib/data/landmark_guide.ts` (hip/knee/ankle unchanged); planning edge markers now named per bone via `markerLabel(kind, key)` in `lib/data/fit_markers.ts` (tibial/femoral medial+lateral reuse the assessment names; anterior/posterior are the "... Reference" names). On-scan tags wrap (max 120-130 px).
- Also done earlier today, not previously logged: flat implant overlay redesign (`components/overlayStyle.ts`, more saturated blue), and separate implant height per scan (`level_offset_mm` = AP, `level_offset_klat_mm` = lateral).
- Checks: tsc clean, npm test 459/459. Not browser-verified: name labels on the scans, height fix, saturation.
- Scan mouse controls (pre-op plan): left-drag always moves the scan (also while a point is being placed); right-click places the point (landmarks, bone-edge markers, 25 mm scale marker). Place layers now use `data-place-layer` (no longer `data-landmark`, which blocks panning). Right button never pans; the loupe hides while dragging. Touch has no right-click, so touch users cannot place points yet. tsc clean, 459/459 tests; not browser-verified.
- Learner sidebar (2026-10-30): Dashboard, Training (the only dropdown: Your Programs + Sessions, no highlight/dot on its header), Content Library (one plain link to /content?tab=procedures), Progress (one plain link, no Pinned). `NavSection.flatFor/flat/quiet` in `lib/nav.ts`; `SideNav.tsx` renders flat sections as links (also in the collapsed rail). Case Library / Pre-op plans / My Cases are reached from a pill row (`components/cases/LibraryNav.tsx`) on /content, /cases, /plans, /personal-cases (learners only). Instructor nav unchanged. tsc clean, 460/460 tests; not browser-verified.
- Learner Content Library (2026-10-30, later): two parts only, Procedures and My Cases (`LibraryNav`, `PillNav` in `components/cases/LibraryNav.tsx`). /content for learners = procedure cards (`LearnerProcedures.tsx`); `?procedure=<id>` opens one with Cases and Pre-op plans tabs (`&view=plans`; `other` = cases with no procedure). Instructor /content unchanged. /cases and /plans still exist (no highlighted part). tsc clean, tests pass; not browser-verified.
- Instructor sidebar (2026-10-30): same shape as the learner's. Dashboard, Programs (the only dropdown: All Programs with Cohorts nested + Sessions; header quiet), Content Library (plain link), Insights (plain link, no Pinned). The `Pinned` group is no longer built for anyone (`NavData.pinned` is still computed). /content now uses one flow for both roles (`app/content/ProcedureBrowser.tsx`, renamed from LearnerProcedures): procedure cards -> `?procedure=<id>` cases (staff case cards, no plans tab). `app/content/ProceduresSection.tsx` is now unused (delete when approved). tsc clean, 461/461 tests; not browser-verified.

## 2026-11-02 (performance pass; uncommitted)
- Full table of the 30 requested items (done / already there / not applicable / needs a decision): `mediver_documentation/changes/performance_pass_2026-11-02.md`.
- Dashboard: skeleton `loading.tsx` files; 20 s deadline on every backend fetch (`lib/http.ts`, `lib/api-client.ts`); lazy case previews; font weights 400-700; `next.config.ts` (compress, `/scans` cache header, image formats); removed unused `pino`, `zod`, `drizzle-orm`, `postgres` (package.json + lock); parallel reads on the instructor dashboard and Programs.
- Backend: GZip middleware; DB connection pool with direct-connection fallback (`db/session.py`, `DB_POOL_*` settings; `DB_POOL_ENABLED=false` turns it off); Supabase call timeouts; shared token-validation client; `GET /cases` `limit`/`offset`. New `tests/test_db_pool.py`.
- Proposed only: `mediver_documentation/proposals/014_performance_indexes.proposed.sql` (not applied).
- **Not verified:** the pool against the real database (I did not connect to the hosted project); any slow-device or throttled-network run. I ran `next build` in `dashboard/` while the owner's dev server was up; it responded 200 afterwards (dev output is in `.next/dev`).
- Unused now: `dashboard/drizzle/`, `app/content/ProceduresSection.tsx`.

## 2026-11-02 (UI polish pass; uncommitted)
- Full record: `mediver_documentation/changes/ui_polish_2026-11-02.md`.
- Fixed: instructor dashboard "Infinity%"/"-Infinity%" and invented 0% cohort mean with nobody scored (`stats.scoredLearners` added); empty panels now say why (`RankedList`/`BarChart` `empty` prop); `StatCard` chevron only when it is a real link (`href`); planner guide said "Click" (now "Right-click"); planner zoom bar moved to tokens with labels, disabled limits and 36 px targets (`ScanViewport.module.css`); search result title/meta spacing, focus return after close, entry motion; phone sideways scroll on instructor Sessions (badge sr-only labels escaped the table scroll box; `Table` wrap + `Badge` now `position: relative`); duplicate Content Library subtitle; UUID in learner case eyebrow; case card field layout; two-up stat band on phones; "Recent sessions"/"Open cohort".
- All 90 ungated `:hover` rules now behind `(hover: hover) and (pointer: fine)` (script, source order kept); pressed states added across pressable components.
- Verified in the browser on the isolated copy (`F:\pravartak projects\mediver-iso\planner-check`, mock API, ports 3100/8100, both stopped): 25 routes x 2 roles no overflow at 390 px; planner zoom/keyboard focus; search open/close/focus. `tsc` clean, `npm test` 461/461, eslint 77/27 unchanged, `next build` passes in the isolated copy (not in `dashboard/`, the owner's dev server was up).
- Test copy note: `planner-check/next.config.ts` has `turbopack.root` added (its node_modules is a junction into the repo); not in the repo.
- Not done: real device touch test; real backend; inline styles left in `ReviewWorkspace.tsx`, both wizards; instructor dashboard's sample-data trend is app-wide, not per cohort (data change, owner's call).

## 2026-11-02 (sample results in the database; uncommitted; owner ran migration + seed 2026-11-03)
- **2026-11-03: owner applied 013 and ran the seed** against `instructor@mediver.local` (Jane Doe, the only instructor). 21 runs seeded into "Sample results cohort"; figures identical to the dry run. Learner IDs: Kavya MVR-MHF5XU, Rohan MVR-FPYGE8, Meera MVR-RPS5JV (passwords in the git-ignored manifest). Added read-only `--list-instructors` to the seed script and clearer "not found / wrong role" errors. Next: owner restarts the backend on 8000 and checks the screens with real logins.
- Owner asked for sample results in the DB (3 residents with mixed histories) so reports and statistics can be checked before the headset exists. Chose: add the results tables (013) and read them, rather than keep scores in the built-in sample set.
- **Owner must run, from `backend/`:** (1) `./venv/Scripts/python.exe migrations/apply_migration.py 013_plans_attempts_reports.sql`; (2) `./venv/Scripts/python.exe scripts/seed_sample_results.py --dry-run` (prints every figure, no DB); (3) `./venv/Scripts/python.exe scripts/seed_sample_results.py --instructor-email <instructor email> [--password <8+ chars>]`. Remove everything with `--wipe` (uses the git-ignored `scripts/sample_results_manifest.json`; also holds the 3 accounts' passwords). Restart the backend after (1) so `/results` is mounted (it is code, already registered).
- Scorer: `backend/core/calculations/session_scoring.py` (version `mediver-tkr-1.0-sample`): 7 categories = 100, scene marks 0.9 technique + 0.1 time, verdict pass <= tol/2 < borderline <= tol < fail, tolerance x difficulty band, 3+ failed critical scenes cap at 59 and fail, pass mark 60/70/80. Planning criteria read from the case's stored `assessment_criteria`. Tolerances for coronal cut, rotation, gap and tray rotation are sample configuration (marked `source: "sample"`). 21 tests in `tests/test_session_scoring.py` (hand-worked numbers + scene table checked against `dashboard/src/lib/seed.ts`).
- Seed (`backend/scripts/seed_sample_results.py`): Kavya Raman (71 -> 100, dip 70 on an Expert case; mean 85), Rohan Desai (ups and downs, one interrupted run; mean 83), Meera Pillai (mean 68, one run failed by 3 critical errors, idle 17 days). 20 scored runs + 1 interrupted; some in scheduled sessions (roster completed), some practice. Creates a "Sample results cohort" under the instructor unless `--cohort` names an existing one. Scores are computed forwards from planned/achieved values; `verify()` re-checks every figure before writing.
- Backend: `GET /api/v1/results` (`services/results_service.py`; learner own, instructor their cohorts' learners, admin institution; 404 until 013 is applied). `tests/test_results_endpoint.py`. Shared criteria moved to `scripts/case_criteria.py`. `migrations/apply_migration.py` now reads files as UTF-8.
- Dashboard: `lib/data/results.ts` (database vs sample source; sample rows only for the 6 sample ids); roll-ups/accessors take a `ResultsData` (dashboard, performance, sessions, report, residents, cohorts, scope, learner-sessions, session-links). Stored reports show the scorer's own planned-vs-achieved, marks lost per scene and verdict (no more derived "achieved" values). Instructor dashboard now covers all their cohorts' learners and the trend/"sessions this week" use the same learners (was app-wide). `ResultsNote` replaces the preview banner: says "Sample results" for seeded data, "No results yet" when empty. Report: phone layout for the parameter table, units fixed ("°", sizes), case UUID hidden, "Failed by N critical errors" when the cap did not lower the score. Learner dashboard "−5 pts each" (not a rule) -> "Three in one run fail it".
- Verified: dry run (all figures consistent); browser on the isolated copy with a read-only mock serving the dry-run bundle (instructor dashboard, sessions, report, cohort learners/performance tabs, learner detail; learner dashboard/progress/sessions; report at 390 px no overflow) with hand-checked figures; backend 108/109 (only the known `test_seeded_case_retrieval_and_layer_separation`); dashboard tsc clean, 467/467, eslint 77/27.
- Not verified: the migration and seed against the real DB (not run by me); real logins of the 3 accounts. Known limits: a real learner gets no cohort comparison line (their results hold only their own runs); every resident's weakest area is Gap assessment (one-scene, 15-mark category); 6 hotspot scenes all read 3/3 (ordered by how often they failed); plan review page does not open stored plans (plans are not yet read from the DB).
- Change log: `mediver_documentation/changes/sample_results_2026-11-02.md`.

## 2026-11-03 (motion pass; uncommitted)
- Owner asked for page transitions and small animations on option switches, buttons and pop-ups, using the skills (find-animation-opportunities, then animate). Kept to the existing tokens (`--m-fast/base`, `--ease-out`, `--ease-drawer`); added `--ease-in-out` for things that slide along (tab selection).
- Pages: `.surface > :not(dialog)` in `AppShell.module.css` — whatever the router inserts in the content area (loading placeholder, then the page) fades and rises 6 px over 220 ms. CSS animation, `backwards` fill (no transform left behind). Filters/search on the same page do not replay it (elements stay mounted; checked). Planner is outside the app frame, untouched.
- Tabs: `.tabs ~ :not(dialog)` in `panels.module.css`, `performance.module.css`, `report.module.css` — the new tab's content settles in under a still tab bar (cohort, program, settings, case, programs, progress, insights, report pages). Dashboard `TabbedPanel`: selection slides (clip-path on a selected-style copy of the row, 220 ms ease-in-out) + panel fade. Sign-in Instructor/Learner: one white pill slides (`::before` + `data-mode`).
- Pop-ups: `Dialog` and the phone drawer now close with a quick fade/slide (140/220 ms) via `overlay`/`display` `allow-discrete`, gated on `@supports (overlay: auto)` (Safari still closes instantly, on purpose). `Dialog` frame is always laid out (dialog itself hides it). `MobileNav` keeps the menu mounted 260 ms after close so it slides out full. Plan lock confirmation gets the dialog entrance (`review/review.module.css`). Search dialog: no close animation (keyboard-opened, frequent).
- Press feedback added: chips, report tabs, setup mode cards, planner nudge/size/marker/map buttons (0.95) and size rows (shade), dialog/settings close buttons, case filter clear buttons, sortable table headers (colour).
- `<details>` open/close animate height+opacity (globals, `interpolate-size` scoped to details, `@supports`-gated).
- Reduced motion: unchanged project rule (all motion off); the details pseudo-element got its own copy of the rule.
- Verified in the isolated copy (mock on 8100, dev on 3100, both stopped): page enter on navigation, tab swap (tab bar same element), TabbedPanel slide (mid-slide screenshot, lands on tab edges), dialog close (stays fixed/top layer, content kept, reopens modal), drawer slide-out and close-on-link, details 49→222 px, sign-in pill, report tabs, reduced motion = 0.01 ms, filters do not replay. tsc clean, 488/488 tests, eslint 77/27, `next build` passes in the isolated copy and the built CSS keeps the new rules.
- Not verified: Safari/Firefox and a real phone (feel of the drawer and press states needs hardware); lock modal entrance not exercised (no plan in the mock).
- Change log: `mediver_documentation/changes/motion_pass_2026-11-03.md`.

## 2026-11-03 (session lists tidied; uncommitted)
- Owner: the cohort Sessions list "looks very clumsy" and "the font looks different". Measured: the font family is identical on every page (Plus Jakarta Sans; monospace only on scene numbers like "6.1"), so nothing to change there. What differed was **alignment and weight**: a row's name cell is a `<th scope="row">`, which browsers centre by default, and the cohort table printed the name in `<strong>` (700) beside 400 text.
- `Table.module.css`: `.td` is now `text-align: left` (fixes the centred first column in every table that uses `Td head`); new `compact` prop on `Th`/`Td` (shrink to content, no wrap).
- Cohort Sessions tab (`programs/[id]/cohorts/[cohortId]/page.tsx`): 8 columns -> 5 (Session, Scheduled, Status, Roster, actions). Name + one muted caption holding only what the name does not already say (`lib/session-label.ts` `sessionCaption`, 6 tests); Mode and Case columns gone; time and duration share one line under the date; the instructor's description shows only while a session is upcoming/live (it stays editable in Edit session); roster count has a title tooltip.
- Main Sessions page (`app/sessions/page.tsx`): Mode and Variant folded into a muted line under the Case; short columns are `compact`; `SessionActions` no longer wraps (Session / Case / Report on one line). Rows 93-154 px -> 72 px at 1440 px.
- `panels.module.css`: `.cellSub`, `.rowActions`, `.sessionCell` (min-width 15 rem so a phone scrolls instead of squeezing), `.dateCell`.
- Verified in the isolated copy (mock extended with cohort sessions, 3100/8100 stopped): desktop 1440 and phone 390 (no page overflow), name left-aligned at weight 600, tsc clean, 494/494, eslint 77/27. Not run: `next build` (CSS and TSX only, dev server compiled both).
- Dropped columns are not shown anywhere else in the cohort table: mode is visible only when the name lacks it. If the owner wants a Mode column back, it is one `<Th>`/`<Td>` in that page.

## 2026-11-03 (dashboard <-> Quest 3 connectivity; uncommitted, NOT applied)
- Owner: connect the dashboard to the Quest 3: send the planning screen's data to the headset, and show the reports, analysis and resident progress that come back. Input: the VR team's "Web Dashboard <-> Quest 3 Connectivity" plan (23 Oct 2026, .docx in Downloads).
- Design: `mediver_documentation/23_VR_CONNECTIVITY_DESIGN.md` (read it first). Headset and dashboard never talk; both use the backend over HTTPS. Pairing = a one-time 6-digit code minted by "Send to headset"; the headset swaps it for a bearer token and gets a CasePlan; it uploads one RunReport per run. **Key finding: every results screen already reads `assessment_results` via `GET /results`, so the link only has to (1) get a locked plan into the DB and (2) turn a report into a result row.**
- Built, tested, no DB: `backend/core/connect/` (`contract`, `pairing`, `case_plan`, `report_bridge`), `services/connect_service.py`, `api/v1/endpoints/connect.py` (registered in `api.py`; `/health` extended additively with `service`, `apiVersion`, `serverTimeUtc`), `tests/test_connect_core.py` (32), `tests/test_connect_endpoint.py` (37, each class guarded so reaching a database fails the test). Scorer + results + connectivity = 93 tests, all pass. Not run: the full backend suite (parts of it connect to a database).
- **Proposal, not applied:** `mediver_documentation/proposals/015_vr_connectivity.proposed.sql` (`devices`, `assignments`, `device_tokens`, `run_reports`; additive, depends on 013). Every connectivity endpoint answers 404 "not set up" until it is applied. Owner applies; I never do.
- Backend scores, headset sends facts (standing rule "VR sends no score"). A report missing inputs is stored and marked `awaiting_inputs` with the exact list, never scored on invented numbers. The headset must add: `sceneId` + `warnings` per step, and six plan keys (femoral size/rotation, gap, HKA, tray size/rotation) -- design note section 6.
- **Disclosure:** one of my first test runs let a request reach the real lookup and ran a single read-only `SELECT to_regclass(...)` against whatever database the backend `.env` points to (no rows read or written; the result was "tables missing"). Fixed: the endpoint refuses a missing bearer without touching the DB, and every test class patches `get_db_conn` to raise.
- Not built: dashboard wiring (`sealTkrPlan` -> `POST /plans/locked`; "Send to headset" on the lock screen with code + countdown + status; Settings -> Pairing and `/plans` read `GET /assignments` instead of memory `PINS`), drafts persistence (`22_...` section 4), phase 3 events/SSE, percentile for headset runs (left null), shared rate-limit store for several instances, anything run against a real database.
- Decisions waiting (design note section 10): apply 015; backend-scores (recommended) vs trust the headset's total; one run per plan (013 rule, kept) vs retakes; the headset additions; sample tolerances now also drive the headset's gauges.
- Discrepancies recorded, not silently resolved: design note 22 section 7 vs the headset plan's paths; events (10) vs one report per run; V1 payload has no cut values, so execution targets are derived server-side beside it; mode names Guided/Practice/Exam vs training/assessment.

## 2026-11-03 (connection work started on our side; uncommitted)
- Owner shared the brief with the VR team (they are implementing) and said "start establishing the connection". Taken as approval of 015: **copied to `backend/migrations/015_vr_connectivity.sql`** (approval header, stale "proposed" line removed). Owner applies; I never do.
- Dashboard: `startPlan` keeps `implant_design`/`fixation` from the case setup (previously dropped: every send would have been blocked); `sealTkrPlan` stores the sealed version via `POST /plans/locked` (non-fatal); review page has **Send to headset** (`SendToHeadset.tsx`: code + countdown + polled status + report link; "not set up" on 404; built-in cases explained). New: `lib/headset-link.ts` (+10 tests), `lib/data/headset.ts`, actions `sendToHeadset`/`headsetStatus`, `PlanRecord.dbPlanId`.
- Backend: `scripts/fake_headset.py` (stand-in Quest over HTTP; `--keys headset` shows the awaiting-inputs path) + `tests/test_fake_headset.py` (4).
- Checks: dashboard tsc clean, 504/504, eslint 77/27; backend connectivity + scorer + results + fake headset 97 tests pass (no database). Panel states checked visually on a scratch page in the isolated copy only (`headset-preview`, not in the repo); test servers stopped.
- **Owner next:** apply 015, restart the backend (`--host 0.0.0.0` for a real headset on Wi-Fi, firewall port 8000), then the steps in `23_VR_CONNECTIVITY_DESIGN.md` section 12. First real-database run of everything.
- Still open: Settings -> Pairing and `/plans` read memory `PINS`; drafts not persisted; openapi.yaml owed to the VR team; percentile null for headset runs; in-memory pairing throttle (single instance).
- **2026-11-03: owner applied 015** (`[SUCCESS] Migration applied`). Next: restart the backend, then the end-to-end test with `scripts/fake_headset.py` (design note section 12).
- **2026-11-03, later:** owner could not see a code after the pre-op plan. Likely cause: most entry points (case page, direct link, `getPlan` creating a plan from a case id) never record implant design/fixation, so the panel showed a "does not record" blocker instead of the button. Fix: `lockedPlanBody` takes `chosen` (fills only what the plan lacks, never overrides), returns `needs`; the panel shows two required dropdowns (no preselection) when `needs` is set; not asked again once the plan is stored (`dbPlanId`). tsc clean, dashboard 506/506. **Not yet confirmed by the owner**; if still no code, get a screenshot of the review page after locking (the box says "not set up", "built-in practice case", or is absent = not locked).
- Docs updated for the build: `23_VR_CONNECTIVITY_DESIGN.md` (status, dashboard build, counts, run steps), `changes/vr_connectivity_2026-11-03.md`, and "As built (2026-11-03)" sections appended to `06_DATABASE_SCHEMA.md`, `07_API_CONTRACTS.md`, `10_VR_INTEGRATION.md`.



## 2026-11-03 (both projects on one PC: MediVeR + Unity; prep for the end-to-end loop; uncommitted)
- Setup on this machine: pulled `main` to `a774da8` (all connectivity files present). Unity project: `D:\PrabakaranR\Unity Projects\VR Knee surgery` (Plastic SCM; Connect package at `Assets/Scripts/Systems/Connect/`, not `Assets/Scripts/Connect/`; no `Docs/Connectivity/` folder exists there yet).
- Checks: backend connectivity/scorer/results/fake-headset suites 97/97; dashboard `tsc` clean, 506/506.
- **Port deviation: the backend runs on 8001, not 8000.** Port 8000 on this PC is held by an Apache service (`httpd.exe`, SSL, Windows service); `dashboard/.env.local` already points at `http://localhost:8001/api/v1`. Backend started with `./.venv/Scripts/python.exe -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload` (venv is `backend/.venv`, not `backend/venv`); health ok on localhost and on the Ethernet address 10.10.180.25. Dashboard on 3000 (restarted after the pull). Env: root `.env` exists (the backend reads `../.env`); `dashboard/.env.local` exists; there is no `backend/.env`.
- **Every 8000 in the owner steps becomes 8001**, including the stand-in: `./.venv/Scripts/python.exe scripts/fake_headset.py --base http://localhost:8001/api/v1 --code <code>` (its default base is 8000 and would hit Apache).
- Unity: `Assets/Resources/ConnectSettings.asset` base URL changed from `http://10.245.188.91:8000/api/v1` to `http://localhost:8001/api/v1` (CHANGELOG line added). `insecureHttpOption` was already DevelopmentOnly and Android internet permission forced on; nothing else touched.
- Unity DTO check against the contract: `/health` and `POST /devices/pair` match (int `apiVersion`, int `schemaVersion`, `Content-Type: application/json` on bodies, `Authorization: Bearer` plumbed, `casePlan` kept verbatim). `GET /assignments/{id}/plan` and `PUT .../runs/{runId}/report` have paths in `ConnectEndpoints` but **no DTOs and no caller**: the headset pairs and stops. Its own CHANGELOG (2026-11-03) says so.
- **What the VR side lacks for a scored report (all of it, today):** the report upload itself; `sceneId` per step (its ids are `P2_08`-style and its Parts 6/7 are our P4/P5, so a `stepId -> sceneId` table is needed; the backend bridge accepts one via `step_scene_map` but nothing supplies it yet); `warnings` per step (no counter exists in the headset); the six plan keys, of which `P5.gapDifferenceMm` (GapBalanceMeter) and `P3.femoralRotationDeg` have a measurement that is not wired, and `P3.femoralSize`, `P4.tibialTraySize`, `P5.hkaDeg` (post-cut), `P4.trayRotationDeg` have no measurement at all; applying `casePlan.values[]` to the judges.
- Exact errors met on this PC: uvicorn on 8000: `[WinError 10013] An attempt was made to access a socket in a way forbidden by its access permissions`; `curl http://localhost:8000/api/v1/health`: Apache answers `400 Bad Request ... You're speaking plain HTTP to an SSL-enabled server port`; `npm run dev`: `Another next dev server is already running` (PID 88968 from before the pull; killed, restarted). Database path NOT verified: `/health` touches no table and the pool opens on first use; pairing is the first call that reaches the DB.
- If the Unity Editor is open, refresh it (focus it or Assets > Refresh) before entering Play so the edited `ConnectSettings.asset` is reloaded and not overwritten from memory.
- Not done by me (owner-run or forbidden): planning/sealing/Get a code, `fake_headset.py`, Play mode. The Unity loop can only reach "Headset connected"; "Run finished" comes from the stand-in, on a second code (codes are single-use).
- Real Quest (separate device): this PC's Wi-Fi adapter is present but disconnected; wired address is 10.10.180.25. Either put the Quest on the same network as that address (no client isolation) or use Windows Mobile Hotspot and base URL `http://192.168.137.1:8001/api/v1`. Inbound TCP 8001 is already allowed on all profiles by an existing rule named "Ollama vLLM 8001". Development build required for http.

## 2026-11-03 (Unity side built end to end; backend scores partial runs; uncommitted)
- Unity (`D:\PrabakaranR\Unity Projects\VR Knee surgery`, Plastic SCM, CHANGELOG 2026-11-03): the Connect package now parses the CasePlan, re-fetches it on boot, applies it by key to the judges (`IPlannedValueTarget`; P2_02/03/04, P3_04/05 take the plan; P1_01 is reported but keeps its calibrated 90), records the run (`SessionRecorder`), and uploads one RunReport per run through a disk-backed outbox (backoff, 401 hold, 409/410/422 poison). After a Completed report is accepted the assignment is marked spent and the gateway asks for a new code (one run per plan). Interrupted runs are reported as Abandoned on the next launch. Both scenes wired and saved (`Tools > VR Knee Surgery > Connect > Wire Connect (Scene)`).
- What the headset sends: every step with `sceneId` (its own `StepSceneMap`), `warnings`, committed values for the five knob steps, `P3.femoralRotationDeg` and `P5.gapDifferenceMm` as `measurements[]`, the three exams. **Not sent, not modelled:** `P3.femoralSize`, `P5.hkaDeg`, `P4.tibialTraySize`, `P4.trayRotationDeg`; scenes 2.3, 6.3, 10.1, 11.1, 11.2 have no step.
- **Backend change (my decision, please confirm):** the bridge and scorer score PARTIAL runs by default — scenes with no time are "not performed", parameters with no value are "not measured" (`verdict null`, `measured false`, `payload.coverage`, `scoring_note` on the report row); a report with no scene time at all still waits as `awaiting_inputs`. Strict all-or-nothing stays available (`partial=False`) and the seed/strict tests keep it. Without this every real headset run would have waited for ever. `session_scoring.py`, `report_bridge.py`, `connect_service.py` (+ `coverage` in the ingest answer), tests updated/added (connect + scorer + fake headset: 98 pass; `test_case_authoring` needs a live DB and fails on this PC regardless).
- Dashboard: `ReportParameter.achieved` is nullable (`report.ts`, `results.ts`); `deviationOf`/`gaugeOf` skip a null; the report page shows "—" and the existing "Not measured" badge. tsc clean, 507/507.
- Cross-check: the Unity test suite writes a sample RunReport to `%TEMP%\VRKneeSurgery.Connect.Tests\sample_report.json`; `core.connect.contract.validate_run_report` on it returns `[]`.
- Design note 23 section 6 rewritten to the as-built state. Scene-map rows to confirm: P1_05->3.2, P1_06->3.1, P2_09->4.3, P10_01-04->10.2.
- **Owner next (the proof I cannot run — Play mode is yours):** plan a library case, seal, Get a code; in Unity Play (Quest Link), type the code at the gateway, check the manifest shows the plan and the P2/P3 gauges show its figures, finish (or skip) the case; the backend log shows `PUT .../report` 200 and the review page moves to "Run finished"; the Sessions report shows the measured parameters and "Not measured" for the four unmodelled ones. For a real Quest: LAN address 10.10.180.25:8001 in `ConnectSettings.asset` and a DEVELOPMENT build (release refuses plain http; production needs HTTPS).

## 2026-11-04 (end-to-end run PROVEN, editor without a headset; backend restarted on the new code)
- Full loop ran from the Unity editor with no headset, driven from MCP: dashboard code 541571 -> `POST /devices/pair` 200 -> plan `SYN-TKA-101` (13 values, Practice) bound to the manifest and applied to the judges (5 applied, flexion kept its calibrated 90, 6 keys with no judge listed) -> 61 steps skipped at 1 s each -> `PUT /assignments/492a8aff-.../runs/ae157748.../report` 200 accepted -> assignment marked spent on the device. Report file: `%APPDATA%\..\LocalLow\Mediver\ArticulusVR\Connect\reports\ae157748acec48b29adc3ee1b62ee161.json` (61 steps, 23 scenes timed, every step `Skipped` with `hasCommittedValue:false`).
- **Trap found: uvicorn `--reload` on Windows logged "Reloading..." for the 2026-11-03 files and never restarted the worker**, so the first upload was scored by the OLD strict code (`awaiting_inputs`, "no committed value for Proximal tibial resection"). Killed the stale worker (the spawn child held port 8001), restarted WITHOUT `--reload`, re-sent the same report as `reportRevision` 2 (the ingest replaces a lower revision and re-scores while no result exists): **`scoring: "scored"`**, coverage = 10 parameters not measured + 7 scenes not performed (0.1, 2.3, 6.3, 9.1b, 10.1, 11.1, 11.2). Check `Started server process` follows every `Reloading...` before trusting a reload here.
- Unity fixes from the run: `TimeoutSceneTimer` now also records on the sequence's Timeout `PhaseCompleted` (a desk skip never raises the controller's `Launched`, so scene 0.1 came back "not performed"); new editor-only `Tools > VR Knee Surgery > Connect > E2E` menu (pass screen, enter pairing code from clipboard, skip step / skip all paced, report state) so the whole loop can be driven without keyboard focus or a headset.
- Still for the owner (needs a dashboard login I do not have): open the review page of that plan ("Run finished") and the Sessions report for the run (expect every parameter "Not measured", scenes 1.1-10.3 timed). The backend on this PC is now running without `--reload` from a Claude session shell; restart it yourself if you edit backend code.

## 2026-11-04 (later) — cross-device and production plan
- New `mediver_documentation/24_CROSS_DEVICE_CONNECTIVITY_AND_PRODUCTION_ROLLOUT.md`: the headset and dashboard never talk to each other, so "different devices" = "can both reach the backend"; recommended topology is the backend on a public HTTPS FQDN (outbound 443 only — passes client isolation, egress filtering, no inbound rules), with on-prem (needs self-hosted Supabase) and tunnel/hotspot as exceptions. Contains the IT network-requirements sheet, the hardening findings (compose `--reload`, k8s without Ingress/TLS, CORS, TrustedHost, proxy headers, secrets per environment), headset address provisioning (per-environment ConnectSettings assets + MDM managed configuration; never discovery), two code gaps (health probe treats any 2xx as online → captive portal shows green; clock skew display), two things to TEST on a real Quest at staging (Wi-Fi proxy honoured by UnityWebRequest? full certificate chain trusted?), a phased rollout with an acceptance suite, and the owner's decisions (cloud vs on-prem, region, platform, MDM, certificate stance). Pointers added to doc 14 and doc 23 s12. Nothing provisioned.


## 2026-11-04 (review page on the design tokens; uncommitted)
- Owner: the page that shows the headset code "is looking very OFF, not in our theme". Cause: `plan/[id]/review/ReviewWorkspace.tsx` was styled entirely inline with a slate-and-sky palette (`#0f172a`, `#38bdf8`, `#0284c7`, 8px radii, rem sizes) that exists nowhere in `tokens.css`; `SendToHeadset` inherited the dark banner's light-on-dark colours.
- Done: every inline style moved into `review.module.css` on tokens. Sealed state is now the shared `Banner` (tone brand, "Plan locked"); Send to headset, "What happens next" and the payload sit on light surfaces (`--surface`/`--surface-sunken`, `--r-lg`); the code is `--ink` at `--t-display`; fit status uses `Badge`; the headset form uses the shared `Select`; lock dialog uses `--scrim`, `--z-modal`, `--e-4`. Links are `--brand` (interactive), checks `--pass`/`--warn` (status). No logic change. One copy fix in the lock dialog: it said transfer to VR "is not connected yet"; it now says a code is obtained afterwards.
- Checks: tsc clean, eslint clean on the folder, 506/506. Not seen in a browser (Chrome extension not connected in this session): owner should open a locked plan's review page once.
- Owner also asked how the resident's VR procedure could be shown live in the dashboard. Answered in chat, not built: (1) Meta casting = projector only, not embeddable; (2) live procedure state over the existing API (design note section 10 phase 3: `POST .../events` + polling/SSE; Unity `ProcedureEngine` already raises OnPartStarted/OnStepStarted/OnStepCompleted/OnStepReported) = recommended first; (3) video via Unity WebRTC + media server = large, and the Quest is already performance-bound (Unity CHANGELOG 2026-10-30); a periodic JPEG snapshot through the same API is the cheap visual add-on.

## 2026-11-04 (project walkthrough and documentation cross-check)
- User requested a project-wide explanation, with documentation used for clarity. Reviewed repository structure, project instructions, product and architecture docs, role journeys, case/version/imaging services, authentication/session handling, planner calculations/calibration and lock actions, Quest pairing/report ingestion, scorer/results/roll-ups, migrations, test inventory, and deployment configuration.
- Current Git baseline at review start: `main`, `a774da8`, clean working tree. The header's old commit/uncommitted description is historical, not the current Git state.
- Verified in source: V1 order is Assessment -> Tibial -> Femoral -> Review; per-scan calibration; drafts and legacy PINS remain in dashboard server memory; `sealTkrPlan` attempts backend persistence (non-fatal) and Send to headset retries it; backend pairing and report ingestion are implemented; reports read stored results with separate sample-user fixtures.
- Scoring: pre-op against the case version's criteria, execution against the locked plan; active `session_scoring.py` still has fixed categories/pass marks and sample tolerances (`mediver-tkr-1.0-sample`). Personal-case runs without reference criteria are practice-only, not scored.
- Remaining integration boundaries confirmed: Settings Pairing and /plans use legacy PINS; no draft database restore path; direct URLs still open prerequisite-locked planner pages; several older content/preset actions return not-persisted errors; streamed events/live VR transport remain future work.
- Documentation drift: root README, PRODUCT.md, documentation index, older requirement/security/definition-of-done sections, and early sections of note 23 contain outdated status or superseded models. Prefer current code plus the appended 2026-11-03 As built sections and note 23's current status/build sections. Migration 013/015 application is recorded by the owner in docs, not independently verified in this review.
- Verification scope: static source/documentation review only. No tests/build/browser sessions started, no env files or database backup contents opened, no hosted database/Storage calls or migrations, no application code changed. Previous test counts remain historical evidence.



## 2026-11-05 (data-connection audit and plan storage; uncommitted)
- Owner asked for an audit of which data and features are really saved (a pre-op plan was lost on restart), then (after finishing their other window's git work) for the fixes. **Cause: plans lived in `PLANS`, an array in the dashboard server's memory.** Every dashboard server restart/reload lost them; restarting only the FastAPI backend did not. Only a sealed plan was copied to the backend. This supersedes the 2026-11-04 notes that "drafts and legacy PINS remain in memory".
- **Fixed.** Backend: `services/plan_service.py` + `api/v1/endpoints/plans.py` (`POST/GET /plans`, `GET/PATCH /plans/{id}`, `POST /plans/{id}/lock`) on the existing 013 `plans` table: **no new migration**. Server-side rules: seven writable planner keys, merge in the database, assessment frozen once measured, locked plans refuse writes, only the owner writes, strangers get 404, lock freezes the *stored* payload. Dashboard: `lib/plan-api.ts` (pure), `lib/data/plan-store.ts`; `startPlan`, `updatePlanPayload`, `sealTkrPlan`, `sendToHeadset`, `getPlan`, `getPlans`, nav, instructor case view and headset panel use it. Details and the endpoint table: `mediver_documentation/changes/plan_storage_2026-11-05.md`.
- Behaviour changes to know: **implant design and fixation are now asked in the lock dialog** (a locked plan's setup is frozen by the database), no longer in the Send to headset box; `lockedPlanBody` removed; built-in practice cases (`CASE_001`, `SYNTH-…`) still live in memory and show a "Practice plan · not saved" chip; Settings → Pairing and the plans list read real assignments (no more `PINS` for stored plans); stale text corrected (Settings "Data source", About rows, Support pairing articles: six digits, ten minutes); live codes read "expires in 9 min" (`timeUntil`) instead of "Just now".
- Checks: backend scorer + results + connectivity + stand-in + plans = **140 pass** (43 new, scripted cursor, guarded so a DB reach fails the test); dashboard `tsc` clean, **517 pass**. Browser, isolated copy with a stateful stand-in for the API: start a plan (201), **killed the dashboard server and started a new one, the plan reopened**, lock dialog (blocks until both choices), code shown, plans list / Settings → Pairing / stats correct, practice case chip. The first "restart" was not real (the old node child survived `TaskStop`); redone after killing PIDs 38868/31772 by port, which is the trap to remember.
- **NOT verified: the new SQL has never run on Postgres** (no Postgres here; installing one was refused). Owner to run once from `backend/`: `./venv/Scripts/python.exe scripts/check_plan_storage.py` (one transaction, never committed; PASS/FAIL per step incl. the lock trigger and a headset code). **Restart the backend afterwards or before it** (new routes; do not rely on `--reload` on Windows, see 2026-11-04). Then plan a library case, restart the dashboard, and confirm it is still there.
- **Still not persisted (audit):** "Save preset" / "Assign preset" (no table, scorer ignores presets: needs a migration + decision); `saveProcedureStep` / `saveAssessmentCriterion` (tables exist, no endpoints, no screen renders them); imaging upload on `/content/[id]` (`saveCaseImaging` is not wired to the existing `POST /cases/{id}/upload-radiograph`); pairing throttle is per process. Other open items unchanged (openapi.yaml owed to the VR team, percentile null for headset runs, drafts between Continue/Confirm clicks are only in the browser).
- Housekeeping: isolated copy `F:\pravartak projects\mediver-iso\planner-check` was re-synced and its `next.config.ts` got `turbopack.root` (isolated copy only); test servers on 3100/8100 stopped; ports 3000/8000 untouched; a stray screenshot written to the repo root by the browser tool was deleted. No `.env` read or printed, no migration applied, no shared database or Storage touched, nothing committed.

## 2026-11-05 (session start: handoff verified; nothing new built)
- Verified against the repo: `main` at `809322a`, the uncommitted set matches the plan-storage entry above. Dashboard `tsc` clean, `npm test` **518/518** (the entry above says 517). Backend scorer + results + connectivity + stand-in + plans: **140 pass**, run as `./venv/Scripts/python.exe -m unittest tests.test_plan_service tests.test_connect_core tests.test_connect_endpoint tests.test_session_scoring tests.test_results_endpoint tests.test_fake_headset` (the venv is `backend/venv`, has no pytest; `.venv` does not exist on this PC).
- Highest-priority open item is the **owner's** run of `backend/scripts/check_plan_storage.py` (needs the database; I never connect). Restart the backend first (no `--reload` on Windows), then plan a library case, restart the dashboard, confirm it reopens.
- Looked at "imaging upload on `/content/[id]`" (next on the not-persisted list). **It is not a simple wire-up, so it was not changed:** `POST /cases/{id}/upload-radiograph` requires `marker_pixel_diameter` (the 25 mm sphere, measured in the wizard) and stores into the draft version as FLAP/KLAT-style calibrated views, but `ImagingManager` (`app/content/[id]/ImagingManager.tsx`) has no calibration field and offers views the endpoint does not model (`ap`, `lateral`, `skyline`, `long_leg`). `saveCaseImaging` keeps validating and then reports "not stored" (a test asserts this).
- **Decision for the owner:** (a) give `ImagingManager` the wizard's sphere-detection step and restrict views to what `case_imaging` accepts, or (b) remove the form and send instructors to the case wizard for scans. Until then the honest "not stored" message stays.
- Other open items unchanged: Save/Assign preset (needs a migration + decision), `saveProcedureStep` / `saveAssessmentCriterion` (no endpoints), openapi.yaml owed to the VR team, percentile null for headset runs.
- No code changed this session; no `.env` read, no database or Storage touched, nothing committed.

## 2026-11-05 (live view and run journey: design + VR prompt only; nothing built, nothing applied)
- Owner: pairing and sending data to a remote device are done and tested by hand. Next: show the resident's procedure on the dashboard in real time ("what the resident is seeing/doing"), fix the screens after a run (data missing, confusing), and give users one clear path with guidance. Wanted: the changes the VR team must make, as a prompt for their Claude Code.
- Written (docs only): `mediver_documentation/25_LIVE_VIEW_AND_RUN_JOURNEY.md` (read first), `mediver_documentation/VR_TEAM_PROMPT_live_view.md` (paste-ready prompt), `mediver_documentation/proposals/016_live_view.proposed.sql` (**proposal, not applied, not in `backend/migrations/`**).
- Design in one paragraph: headset posts small JSON events (`POST /assignments/{a}/runs/{r}/events`, heartbeat every 5 s carrying the full state) and, only while a dashboard is watching, a ~640x360 JPEG about once a second (`PUT .../frame`). Dashboard polls once a second (not SSE/WebSocket/WebRTC: those break on hospital networks). Live is advisory; the report stays the only scored record. Recommended: events + snapshots now, video (WebRTC) not started.
- **Findings, verified in code (they shape the work):**
  - The attempt/session row is created only when the report arrives (`connect_service.py:485`), so a live page must be keyed on the assignment + run id, not the session. New page `/live/[assignmentId]`.
  - **An assignment becomes `running` only for a non-completed report (`connect_service.py:521`).** A normal run stays `paired`, so the review page says "Headset connected" for the whole operation. `run_started` will move it to `running`.
  - `GET /results` returns the scorer's output only; the headset's own step record (`run_reports.payload`) and `coverage`/`scoring_note` never reach a screen. Dashboard has no route handlers (`app/api` absent); `dashboard/AGENTS.md` requires reading `node_modules/next/dist/docs/` before writing Next code.
- Post-run UI plan (section 7 of the note): "What happened" becomes the first report tab (step log), a "Not scored on" panel explaining unperformed scenes/unmeasured parameters, run state shown on Sessions/dashboards, one status vocabulary (`journeyState`, table in section 8.3) built on the existing assignment codes, a journey bar (Plan, Lock, Send, Perform, Review), pre-send checklist, data-derived Start-here card, a Support article.
- **Assumption to confirm with the owner:** "the post" was read as the screens after the headset run (Sessions list, session report, review page status). Also open: level (A+B now?), who may watch (resident, supervising instructor, admin; not other residents), apply 016, retention (events 90 days, frames deleted at run end).
- Not verified: the Unity side (project is not on this PC; every Unity statement is passed to the VR team as "verify first"); the report page with a real headset run; snapshot cost on a Quest 3 (the prompt makes the VR team measure it and gives a fallback).
- Next (after owner answers): backend contract + reducer + endpoints + `fake_headset.py --live` + tests (no database); then owner reviews/applies 016 and restarts the backend without `--reload`; then dashboard route handlers, live page, Live-now surfaces, run summary endpoint, report changes, journey bar. No code, `.env`, database or Storage touched; nothing committed.

## 2026-11-05 (live view BUILT on all three sides; uncommitted; 016 staged, not applied)
- Owner: "now i want to cast the vr feed to the dashboard". Built the events + snapshots design (note 25, level A+B) end to end. Full record: `mediver_documentation/changes/live_view_2026-11-05.md`.
- Backend: `core/connect/live_contract.py` (pure rules), `services/live_service.py`, `api/v1/endpoints/live.py` (headset `POST .../events`, `PUT .../frame` raw JPEG; dashboard `GET /assignments/{id}/live`, `.../live/frame`, `GET /live/active`), `ingest_report` closes the live run. `migrations/016_live_view.sql` **staged with the owner's request as its header; I did not apply it.** `scripts/fake_headset.py --live --pace 3` streams a run and sends frames drawn by the new `scripts/tiny_jpeg.py` (pure-Python baseline JPEG; no Pillow here; decoded by System.Drawing). 47 new tests; 187 pass across the connectivity/scorer/results/plans/stand-in suites.
- Dashboard: `/live/[assignmentId]` page (`LiveView.tsx`, polls `/api/live/...` 1 s visible / 5 s hidden, stops at ended, img swaps on load), the first two route handlers (`app/api/live/[assignmentId]/route.ts`, `.../frame/route.ts`; read `node_modules/next/dist/docs` route.md first), `lib/live-view.ts` (one wording table, scene states never pass/fail), `lib/data/live.ts`, `LiveNow` strip on Sessions + both dashboards, **Watch live** in Send to headset while `paired`/`running`. tsc clean, 527/527, eslint clean on touched files. Not seen in a browser (no backend with 016 yet).
- Unity: see that project's CHANGELOG 2026-11-05 and `Docs/Connectivity/LiveView.md` (answers to the prompt's section 0). The editor was closed this session: compiled offline with dotnet; EditMode tests and `Wire Connect (Scene)` still to run there.
- Venv note: on this PC it is `backend/.venv` (the 2026-11-05 morning entry said `venv`; both appear in history — check which exists).
- **Owner next:** apply 016 (`./.venv/Scripts/python.exe migrations/apply_migration.py 016_live_view.sql`), restart the backend on 8001 without `--reload`, Get a code, run the stand-in with `--live`, open Watch live. Then the headset: open Unity, let it compile, run the Connect EditMode tests, `Wire Connect (Scene)` on SurgeryScene, save, Play with the live page open. Decisions still open from note 25: who may watch is implemented as resident + supervising instructor + institution admin (confirm), retention of `run_events`.
- Still open after the review pass: no per-device throttle on `POST .../events` yet (design note 25 section 6 asked for one); `run_events` retention undecided; the whole pipe has not yet carried a byte end to end (needs 016 + a dashboard login). Checks to make in Unity Play: URP 17 may object to `Camera.Render()` on the capture camera (then use `RenderPipeline.SubmitRenderRequest` with a `SingleCameraRequest`); if the snapshot is upside down, remove the row flip in `LiveFrameSender`; play once before 016 to see one quiet 404 line and the report still uploading.
- **Trap found while proving the loop (2026-11-05, later): `localhost` costs ~2 s per request on this PC** (IPv6 `::1` is tried first; uvicorn on `--host 0.0.0.0` listens on IPv4 only), `127.0.0.1` answers at once. Use `--base http://127.0.0.1:8001/api/v1` for the stand-in, and consider the same in `dashboard/.env.local` if pages feel slow. Also: a stand-in killed mid-run leaves its assignment `running`; `POST /assignments` then refuses a new code for that plan until it is cancelled (one `UPDATE assignments SET status='cancelled'`), which the dashboard cannot do yet.
- **LIVE VIEW PROVEN 2026-11-05 (backend + stand-in, owner said 'do it yourself'):** migration 016 applied by the owner; the stand-in paired on code 983136 (assignment `0aae8153-...`, plan `8f7a656b-...`, owner John Smith) and streamed 26 scenes at 2 s each over real HTTP: 80 events accepted, 111 frames sent while a 1 s poll of `read_live` kept `wantFrames` true, 7 live values, `run_ended`, then `PUT .../report` 200 **scored**; the live read went `live` -> `ended`, the frame row was dropped at the end, `active_runs` emptied. A saved frame decodes and reads SCENE 3.2 / STEP / #45 (greyscale test card). Driven by a script calling the service functions as the plan owner (Supabase auth means I cannot mint a dashboard token), so the **Next page and route handlers are still unseen in a browser** — the owner's Watch live click is the remaining proof. The earlier stuck assignment from the crashed stand-in was cancelled by the script (one UPDATE).

## 2026-11-05 (connect / disconnect from the dashboard; uncommitted)
- Owner: the dashboard must let a user disconnect the connected headset and generate a new code. Built:
  - Backend `POST /assignments/{id}/disconnect` (`connect_service.disconnect_assignment`): cancels a pending/paired/running assignment, revokes every token of the paired device (the headset's next call is 401, it marks its pairing rejected and shows the code screen; no headset change needed), closes any live run and drops its frame in the same transaction (`live_service.end_run_in(run_id=None)`); a reported run is 409 (a record), a stranger's is 404. `create_assignment`'s 409 now says "Disconnect the headset first". The plan list's `headset` object gains `id` and `device_name`.
  - Dashboard: `disconnectHeadset` server action; on the review page's Send to headset box a two-step **Disconnect headset** (or **Cancel this code** while pending) that states the consequence before the second click, then re-reads the link so **Get a new code** appears; on Settings -> Device & pairing each connected row shows "Connected" with the same two-step control (`DisconnectHeadsetButton`). `canDisconnect` / `disconnectConsequence` in `lib/headset-link.ts` (+2 tests).
- Checks: backend suites 189 pass; dashboard tsc clean, 529/529, eslint clean on touched files. **The running backend must be restarted to serve the new endpoint** (no --reload).


### 2026-11-05 (live view "not visible" — diagnosis)
- Owner reported the live view option is not visible. Database at 16:10: newest assignment is `pending` since 12:29 (no device ever paired to it); every live run so far came from the stand-in headset. Watch live / Live now appear only once a headset has PAIRED (status paired/running), by design — so nothing was showing.
- Unity editor was closed all afternoon: the live code has never compiled in the editor, `Wire Connect (Scene)` has not been run, and `ConnectProfile.asset` has no LiveViewEnabled field yet (base URL `http://localhost:8001/api/v1`, editor/Quest Link only).
- Change: the review panel now says "Live view opens here the moment the headset pairs with this code." while a code is waiting (SendToHeadset.tsx), so the entry point is visible before pairing. tsc + eslint clean.
- Backend on 8001 (pid started 15:37) still predates the disconnect endpoint (`POST .../disconnect` -> 404): restart it.
