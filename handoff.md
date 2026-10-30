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
  - `proposals/013_plans_attempts_reports.proposed.sql` stays **unapplied**.
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
