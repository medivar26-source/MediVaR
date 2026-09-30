# MediVaR Dashboard — Learner Interface Plan

Scope: **learner interface** (roles student, intern, resident, surgeon — all one "learner" persona in the UI).
Approach is the same as the instructor round: keep the existing layout and design, make the **paths** clear, fix wiring.
Status: **implemented on the front end (see §8).** `backend/` was never modified; backend gaps are listed in §5.
Audit date: 2026-09-29. Legend: ⬜ to do · 🚫 needs backend work.

---

## 1. The learner's journey (what the product is for)

```
Enrolled in a program ──► sees assigned cases ──► opens a case ──► Start planning (pre-op plan on the scan)
      ──► Assessment → Tibial → Femoral → Review ──► send to headset ──► run the session ──► read the report ──► improve
```

Everything on the sidebar should be a step on this line, or a place to check progress on it.

---

## 2. What a learner sees today

**Sidebar (two levels)**
- Dashboard section: Dashboard · Activity · Performance · Reports · *By skill* (4 links) · Pinned
- Programs section: Your Programs · Sessions · My Plans
- Content Library section: Simulations · Practice Cases · Library
- Footer: Help · Settings

**Pages they can reach:** `/` · `/programs` · `/programs/[id]` · `/cases` · `/cases/[id]` · `/plans` · `/plan/[id]/…` · `/sessions` · `/sessions/[id]` · `/sessions/[id]/report` · `/performance` · `/performance/[skill]` · `/activity` · `/reports` · `/simulations` · `/simulations/[procedure]` · `/setup` · `/library` · `/help` · `/settings`

---

## 3. Findings

### L1 — Two planning flows exist side by side
- **New TKR flow (4 steps):** `assessment → tibial → femoral → review`. `startPlan` creates only this flow.
- **Legacy flow (7 steps):** `/plan/[id]/step/1…7` (`Steps.tsx`, `PlanShell.tsx`, `Step7.tsx`) plus `/plan/[id]/saved` with the pairing PIN panel.
- The TKR flow ends at **Review** with the notice "VR headset transfer transport is not yet connected". The PIN screen belongs to the legacy flow, so a learner finishing the new flow has no visible "what happens next".
- **Plan:** decide one flow. Recommended: TKR flow only; add a clear "Plan sealed — next: headset" end screen; keep legacy routes as redirects until removed.

### L2 — Four different ways to "start"
"Start simulation" (`/setup` → `/cases` with filters), "Simulations" (`/simulations` → `/simulations/[procedure]`), "Practice Cases" (`/cases`), the program page "Start" button (`/setup`), the dashboard "Continue".
- **Plan:** one path: **Program → assigned case → Start planning**. Practice Cases stays for free practice. `/setup` and `/simulations` stop being nav destinations (routes remain).

### L3 — Five overlapping "history" pages
Activity, Performance, Reports, Sessions, Plans, plus analytics inside the dashboard. A learner cannot tell where "my results" live.
- **Plan (same pages, clearer grouping):**
  - **Training:** Programs · Cases · Plans · Sessions (with its reports)
  - **Progress:** Performance · Activity
  - Reports becomes a link from each session row plus a "Reports" filter on Sessions; the `/reports` page stays reachable.

### L4 — "By skill" lists 4 of 7 skills
Sidebar shows bone cuts, gaps, trialling, implantation. The pages also exist for **pre-op planning, patella, exposure** (`lib/skills.ts`). Pre-op planning is the learner's main activity and is missing.
- **Plan:** list all seven, in the order of the operation.

### L5 — Dashboard is one very long page
`LearnerDashboard.tsx` (914 lines) stacks about ten blocks: welcome, next action, programs, scheduled sessions, assigned cases, current simulation, latest assessment, progress, recent sessions, detailed analytics.
- **Plan (same components, reordered):** top = **one "What to do next"** card; then assigned cases + scheduled sessions; progress and recent sessions next; analytics collapsed by default.

### L6 — Program and case pages don't point to the next action
- Program page "Start" goes to `/setup` instead of the next assigned case.
- Case page: `Start planning` exists, but status (not started / in progress / sealed / performed) is not shown next to it, and plan pages have no "back to case" trail.
- **Plan:** the primary button always says the true next step ("Start planning", "Resume plan", "View report"), with breadcrumbs `Programs › Program › Case › Plan`.

### L7 — Cases list mixes assigned and practice cases
- **Plan:** two tabs on `/cases`: **Assigned to me** · **Practice**. Same cards, same filters.

### L8 — Vocabulary
Plans, Sessions, Simulations, Cases, Practice Cases, Reports — used loosely.
- **Plan (glossary):**
  - **Case** = a patient scenario
  - **Plan** = the pre-operative planning work on a case (rename in UI to "Pre-op plans")
  - **Session** = a run in the headset
  - **Report** = the score for one session
  - Drop "Simulations" from learner navigation.

### L9 — Planning workspace
- Falls back silently to `/knee_xray_ap.jpg` or `/klat.jpg` when a case has no imaging. The exact case scan (e.g. `images(cases)/TKA Calibration & Implant Scaling Validation – Right Knee/…`) must be what the learner sees; show a visible warning if a fallback is used.
- Desktop-only notice; tools have no shortcut hints; locked steps do not say why.
- **Plan:** "why is this locked" text on each locked step, a "Back to case" link, and the placeholder-scan warning.

### L10 — Help and reference
`Library` (nav) and `Help` (footer) both hold guides. **Plan:** one entry labelled "Help & guides" with Library as a section; routes unchanged.

### L11 — Notifications and counts
Sidebar badges/notifications are built from the seed sessions store only. For learners they should include: new case assigned, session scheduled today, report ready. 🚫 partly needs backend (§5).

---

## 4. Proposed learner sidebar (same layout, regrouped)

| Section | Items |
|---|---|
| **Home** | Dashboard |
| **Training** | Your Programs · Cases (Assigned / Practice) · Pre-op Plans · Sessions |
| **Progress** | Performance (+ all 7 skills) · Activity · Reports |
| **Help & guides** | Library · Help |
| Footer | Settings |

The two-tier rail/panel stays. Only the grouping, labels and the seven skill links change. `Simulations` and `Start simulation` (`/setup`) leave the navigation but their URLs keep working.

---

## 5. Data and backend reality (read before promising features)

- **Plans are stored in memory** (`PLANS` array in `lib/data/plans.ts`, written by `startPlan` and `updatePlanPayload` in `app/actions/index.ts`). They are lost when the server restarts and are not shared between instances. `startPlan` also falls back to a **seed user** when no session user is found.
- **Sessions, reports, performance, activity, dashboard analytics** read seed data. The backend sessions router is commented out (`backend/api/v1/api.py:13`).
- The backend **does** provide for learners: `/programs/enrolled`, `/cases` (list, detail, preview), `/auth/*`. It has **no** endpoints for plans, attempts/sessions, reports, scoring, notifications or pairing.
- 🚫 **Therefore** the learner's core work (planning, sessions, results) cannot be truly saved until the backend adds those endpoints. This is the single biggest risk for the learner interface and needs a decision separate from the UI work (see §7).
- Until then the UI plan below only fixes *paths and wording*; it does not fake persistence.

---

## 6. Work plan (front end only) — status

**Phase 1 — Wayfinding**
1. ✅ Learner sidebar regrouped (Training · Help & guides · Overview); all seven skills listed; Simulations and Start simulation removed from navigation (routes still work).
2. ✅ "Help & guides" section (Library, Help).
3. ✅ Glossary: "Pre-op Plans" (nav, page title), "Cases" (was "Practice Cases"), "Start next case" (was "Start simulation"). ✅ Session/report/cases wording aligned (dashboard "Current Session", reports and program copy). "Simulation" remains where it describes the product itself (e.g. the site description).
4. ✅ `learner_program_nav.test.ts` updated (5/5 pass).

**Phase 2 — One obvious journey**
5. ✅ Program page: primary button opens the next unattempted case.
6. ✅ Case page: breadcrumbs; the button reads Start planning / Resume planning / View sealed plan / View report from the learner's real plan state.
7. ✅ Plan pages: "Back to case"; locked steps say "Finish the previous step first"; a visible "Placeholder scan" badge when a case has no image; one shared scan resolver (see bug B below).
8. ✅ Review screen: "What happens next" block; buttons "Back to case" and "All pre-op plans".
9. ✅ Legacy 7-step flow retired: `/plan/[id]/step/*` and `/plan/[id]/saved` redirect into the 4-step flow, and the unused components (`Steps`, `Step7`, `StepForm`, `Controls`, `PlanShell`, `TkrSummaryPanel`, `VisualVerificationCanvas`, `PinPanel`, two stylesheets) are **deleted** (recoverable from git).

**Phase 3 — Screen tidy**
10. ✅ Dashboard: "Detailed analytics" collapsed by default; Scheduled Sessions and Assigned Cases now come before Enrolled Programs (the next action stays at the top).
11. 🟡 Cases: **To do / Attempted / All cases** tabs (uses the existing attempted filter). "Assigned vs Practice" was **not** built: no front-end field separates them.
12. ✅ Cross-links: Sessions ↔ Pre-op plans, Plans → Sessions & reports.

**Phase 4 — Wiring**
13. ✅ A "Preview data" note on every screen that still reads sample data (dashboards, sessions, plans, performance, activity, reports).
14. 🚫 Persist plans and sessions in the backend — not done (backend untouched).
15. 🚫 Learner notifications — not done (needs backend).

**Guardrails kept:** no visual redesign; no changes under `backend/`; planning maths untouched.

---

## 7. Decisions (defaults used)

1. **Legacy 7-step planning flow:** retired via redirects (recommended default used).
2. **Simulations / Start simulation:** removed from learner navigation (default used).
3. **Backend persistence for plans and sessions:** still open. UI stays on preview data and says so.
4. **Exact scan:** still open. The case's own imaging always wins; the fallback is now `/flap.jpg` and `/klat.jpg` for every step. Confirm whether the seeded case should point at the `images(cases)/` PNGs.
5. **Order:** Phases 1–4 done in one pass.

---

## 8. Implementation notes

**Extra bugs found and fixed while doing this**
- **A. Plans were filed under one user and listed under another.** `startPlan` saves a plan for the signed-in user, but `getPlans()` listed only the seed user's plans, so a real learner's new plan never appeared on Pre-op Plans (or in the dashboard). `getPlans(state, userId)` now takes the signed-in user.
- **B. Planning steps showed different scans for the same view.** Assessment fell back to `/flap.jpg` for the full-leg view, while Tibial and Femoral fell back to `/knee_xray_ap.jpg`, so landmarks placed in step 1 were then drawn over a different image. All three now use `lib/plan-scans.ts`.

**Files changed:** `lib/nav.ts` · `lib/plan-scans.ts` (new) · `lib/data/plans.ts` · `components/ui/DemoDataNote.tsx` (new) + `ui/index.ts` · `components/dashboard/{LearnerDashboard,InstructorDashboard}.tsx` · `app/page.tsx` · `app/cases/page.tsx`, `cases/[id]/page.tsx`, `cases/[id]/StartPlanning.tsx` · `app/programs/[id]/page.tsx` · `app/plans/page.tsx` · `app/sessions/page.tsx` · `app/performance/page.tsx` · `app/activity/page.tsx` · `app/reports/page.tsx` · `app/plan/[id]/{page,step/[step]/page,saved/page}.tsx` · `plan/[id]/components/TkrPlanShell.tsx` · `plan/[id]/{assessment,tibial,femoral}/*Workspace.tsx` · `plan/[id]/review/ReviewWorkspace.tsx` · `lib/__tests__/learner_program_nav.test.ts`.

**Verification:** `npm test` (27/27), nav (5), learner dashboard (11), case authoring (7), change password (8) all pass. `tsc` shows no new errors; the errors that remain are in code that was not edited (`lib/seed.ts`, `lib/data/plans.ts` seed block, `activity`/`reports` `criticalErrors`, `LearnerDashboard` seed-typed lines). Not run in a browser signed in as a learner.

**Left for later:** delete the retired legacy plan components; the next-action subtitle still says "N of 6 steps answered" (a test locks it and TKR plans count differently); reorder dashboard blocks; deeper "simulation" wording; backend persistence for plans and sessions.

---

## 9. Round 3 (remaining front-end items)

- ✅ Legacy plan files deleted.
- ✅ Progress counts follow the plan's workflow: `PlanRow` gained `stepsTotal` (4 for TKR, 6 for the retired flow). The Plans table shows "n / 4", and the dashboard subtitle reads "2 of 4 steps complete". New test added (learner dashboard: 12 pass).
- ✅ Dashboard block order; session wording.
- ✅ Loading skeletons and empty-state actions (shared with the instructor side).

Still open (need backend or a decision): plan/session persistence, learner notifications, exact-scan image set for the seeded case, wizard autosave.

---

## 10. Upcoming sessions fix (learner)

**Reported:** upcoming sessions showed on the dashboard but not on the Sessions page.

**Causes found (dev-server log + real data):**
1. `getSessionList` (Sessions page) used `personaFor` without importing it → `ReferenceError` on every visit, swallowed by a `try/catch` that only logged a warning, so a learner's API sessions were silently dropped. (Present in the original file.)
2. The dashboard's "Scheduled Sessions" panel used raw API rows: it read `caseName` / `scheduledAt` from snake_case data, so it showed "No case" and an invalid date, and it listed cancelled and completed sessions under the heading "Scheduled".
3. The mapper never set `caseName`, so the instructor's cohort sessions table also showed "—" in its case column.
4. The API's statuses (`in_progress`, `cancelled`) did not match the page's filter/badge vocabulary, and rows were not ordered, so an upcoming session could sit below old ones.

**Fixes:** import added; the mapper fills `caseName`; the dashboard maps the API rows and shows **Upcoming Sessions** only (scheduled or in progress, soonest first, max 5); the Sessions page orders live → upcoming (soonest first) → history (newest first), treats `in_progress` as live, and labels cancelled sessions "Cancelled" (with a Cancelled filter). The rules live in `lib/data/session-order.ts` with 9 tests (`session_order.test.ts`).

**Good to know:** a learner only sees sessions they are on the roster of (`session_residents`). Sessions 1–5 were created before rosters existed, so no learner sees them (all are in the past). Right now no session is in the future, so the Upcoming panel is empty until an instructor schedules one with the learner on its roster.
