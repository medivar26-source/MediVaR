# MediVaR Dashboard — Instructor Flow Audit & Corrections

Scope: **instructor interface**, front end only (`dashboard/`). `backend/` was read, never modified.
The learner interface is planned after this round.
Audit date: 2026-09-29. Status legend: ✅ done · 🟡 partly done · ⬜ not done · 🚫 needs backend work (out of scope).

Approach: keep the existing layout and design; fix the *paths* so every feature is reachable without guessing.

---

## 1. Instructor map — before and after

**Before**
- Dashboard: `/`, `/activity`, `/performance`
- Programs: All Programs, Learners (`/cohorts/learners`). No Sessions, no Cohorts link.
- Content Library: Case Library, Library. `/content` (procedures, criteria) unreachable.
- Reports: its own section with one item.

**After**
- **Overview**: Dashboard · Activity · Performance · **Reports**
- **Programs**: All Programs · **Cohorts** (`/programs?tab=cohorts`) · **Learners** (`/learners`) · **Sessions**
- **Content Library**: Case Library · **Procedures** · **Assessment Criteria** · Library
- Help · Settings (footer)

Core paths: Program → Cohort (Learners · Sessions · Reports · Case access · Enrolment) → Learner → Session report.

---

## 2. Findings and status

### A. Structural problems

| # | Finding | Status |
|---|---|---|
| A1 | Instructor dashboard reads **seed data** and only the first cohort (`lib/data/dashboard.ts:326`); cohort pages read the API, so numbers can disagree. | 🟡 Added a "Your cohorts" panel from the cohorts API (all cohorts, real counts). The dashboard's own stats, activity, performance, reports and sessions remain seed-backed. 🚫 Real sessions need the backend sessions router (commented out at `backend/api/v1/api.py:13`). |
| A2 | Two case-management systems (`/cases` wizard vs `/content` form + detail). | ✅ One library: `/cases`. `/content` now only holds Procedures and Assessment Criteria (Cases tab and bare `/content` go to `/cases`). `/cases/[id]` gained a **Status & imaging** button to `/content/[id]`, whose back link returns to the Case Library. Both used the same API, so no data moved. |
| A3 | Learner-only actions shown to instructors ("Start simulation" → `/setup`). | ✅ Hidden for instructors on `/cases`. |
| A4 | Dashboard "Manage cohort" → `/cohorts` → redirect to `/programs` (never reached a cohort). | ✅ Now "All cohorts" → `/programs?tab=cohorts`. |
| A5 | No clear starting point to schedule a session (only inside a cohort tab). | ✅ `/sessions` has a **Schedule a session** button plus a line explaining the path (cohort → Sessions tab). |

### B. Navigation and wayfinding

| # | Finding | Status |
|---|---|---|
| B1 | Instructors had no Sessions link; Content pages unreachable; Reports a lone section. | ✅ See map above. |
| B2 | Cohorts had no sidebar entry. | ✅ Cohorts entry and "All cohorts" tab on Programs. |
| B3 | Learners lived at `/cohorts/learners`. | ✅ Moved to `/learners` and `/learners/[id]`; old URLs redirect; all links and cache refreshes updated. |
| B4 | Sidebar badges/notifications only counted the user's own sessions (empty for instructors). | ✅ Instructors get notifications from the cohorts API ("N learners below the pass mark", per cohort). 🚫 Live-session and report notifications need the sessions backend. |
| B5 | Search placeholder promised cases/sessions/reports but only searches sidebar pages. | ✅ Now says "Jump to a page". ✅ Ctrl+K now also finds cases, programs, cohorts and (for instructors) learners by name, using a read-only server action (`app/actions/search.ts`) built on the existing data accessors. |
| B6 | `/kit` (developer style guide) reachable in production. | ✅ Returns 404 in production builds. |
| B7 | No `not-found` page. | ✅ Added `app/not-found.tsx`. |
| B8 | Two-level sidebar (rail + panel, 312px). | ⬜ Kept on purpose: you asked for the same layout. |
| B9 | Legacy `/cohorts/*`, `/launch` redirect routes remain. | ⬜ Kept: old bookmarks still work. |

### C. Wording

| # | Finding | Status |
|---|---|---|
| C1 | Same person called Resident / Learner / Surgeon / Student. | 🟡 Instructor screens now say **Learner(s)** (tab, headings, tables, breadcrumbs, banners, case forms). URLs (`?tab=residents`), role names and API identifiers unchanged. Some placeholder examples on the request-access form still say "resident". |
| C2 | Learner page breadcrumb said "Supervised Residents". | ✅ "Learners". |
| C3 | Top-bar display menu said "Planned, not built". | ✅ "Coming soon". |

### D. Dead ends and placeholders (left visible, not faked)

| # | Finding | Status |
|---|---|---|
| D1 | Request access, SSO and forgot-password are placeholders (browser alert / no endpoint). | 🚫 Needs backend endpoints. |
| D2 | Learner profile: "Assign training" and "Message" buttons disabled. | ✅ "Assign a case" is now a working form on the learner page (case picker → `POST /residents/{id}/assignments` via the existing `assignPractice` action). 🚫 "Message" stays disabled and now says "(coming soon)": no backend. |
| D3 | Assessment Criteria not editable. | 🚫 No store. |
| D4 | Some case images are flagged placeholders (`lib/seed.ts`). | ⬜ Content, not code. |
| D5 | Sealing a plan / VR transfer says the headset pipeline isn't built. | 🚫 |
| D6 | Instructors cannot review learner plans (`/plans` shows the signed-in user's own plans only). | 🚫 Needs a backend endpoint. |

### E. Case wizard and planning

| # | Finding | Status |
|---|---|---|
| E1 | Publish checklist only visible at step 5; no autosave. | 🟡 A "Ready to publish: N of 6 checks" panel with each pending item now shows on steps 1–4. ⬜ Autosave not added (it would create/update backend records on a timer; needs a decision). |
| E2 | Planning falls back to `/knee_xray_ap.jpg` / `/klat.jpg` when a case has no imaging, silently. | ⬜ Recommended: show a "placeholder scan" banner. The case scans in `images(cases)/` are the exact images to use; confirm which set the seeded case points to. |
| E3 | Planning screens use many inline styles / hard-coded colours. | ⬜ Visual refresh item. |

### F. Smaller items

| # | Finding | Status |
|---|---|---|
| F1 | Only a root `loading.tsx`. | ✅ List-shaped skeletons (`PageSkeleton`) for programs, cases, learners, sessions and plans. |
| F2 | Some empty states don't say what to do next. | ✅ Added next-step buttons to the main ones (learners, cohorts, activity, reports, program cases). Detail-level empties (e.g. "No notes yet") left as they are. |

---

## 3. Back-end wiring check

Every API path the front end calls was compared with the routes in `backend/api/v1/endpoints/*`.

**Matches (all present in the backend):** `/programs` (list, enrolled, detail, cohorts) · `/cohorts` (list, create, detail, cases get/put, learners new/existing, sessions list/create, `sessions/{id}`, `sessions/{id}/cancel`, `sessions/{id}/residents`) · `/cases` (list, create, detail, preview, put/patch, publish, deactivate, upload-asset, upload-radiograph) · `/residents/{id}` (detail, notes, assignments, feedback, sessions) · `/procedures` · `/auth/*` · `/health`, `/ready`.

**Fixed in the front end**
- ✅ **Stale cache refresh.** After enrolling learners, assigning cases or scheduling/cancelling sessions the app refreshed `/cohorts/{id}`, which is now only a redirect, so cohort pages could show old data. Now refreshes the `/programs` tree. Creating a cohort or program refreshes it too.
- ✅ **Case changes** now refresh both `/content` and `/cases` pages.
- ✅ **Trailing slash.** `GET/POST /cohorts` returned a 307 to `/cohorts/`; the calls now use `/cohorts/` directly (one round trip, no reliance on redirect handling).

**Not wired (backend gaps, listed not built)**
- Sessions router disabled in the backend, so sessions, activity, performance, reports and their counts stay seed-backed.
- Learners list is assembled by fetching each cohort in turn (N+1 calls); a "list residents" endpoint would remove this.
- No endpoint for instructors to list learner plans, send messages, edit assessment criteria, request access or reset passwords.
- The `/residents/{id}/assignments` endpoints exist but the "Assign training" button is still disabled.

---

## 4. Files changed (front end only)

`src/lib/nav.ts` · `src/lib/data/nav.ts` · `src/lib/data/cohorts.ts` · `src/components/shell/{SideNav,SearchDialog,AppShell,TopBar}.tsx` · `src/components/dashboard/InstructorDashboard.tsx` · `src/app/page.tsx` · `src/app/programs/page.tsx` · `src/app/learners/**` (moved from `app/cohorts/learners`) · `src/app/cohorts/learners/**` (redirects) · `src/app/cases/page.tsx`, `cases/[id]/page.tsx` · `src/app/content/**` · `src/app/sessions/page.tsx` · `src/app/actions/index.ts` · `src/app/kit/page.tsx` · `src/app/not-found.tsx` (new) · wording edits in cohort/program pages · `src/lib/__tests__/learner_program_nav.test.ts`.

## 5. Verification

- `npx tsx --test src/lib/__tests__/learner_program_nav.test.ts`: 5 of 5 pass.
- `tsc --noEmit`: no errors in touched files. Pre-existing errors remain in files not edited (`lib/data/sessions.ts`, `lib/seed.ts`, several report pages).
- Signed-out smoke test: all routes redirect to `/login`. Signed-in pages have **not** been opened in a browser.

## 6. Suggested next steps

1. Sign in as an instructor and click through: sidebar → Programs → All cohorts → cohort → learner → session report.
2. Decide whether to enable the backend sessions router (unlocks A1/B4 for real).
3. Show a placeholder-scan warning on planning pages (E2) and confirm the exact scan set.
4. Wizard: show the publish checklist on every step (E1).
5. Then plan the **learner interface** with the same "clear paths" approach.

---

## 7. Round 3 additions

- Legacy 7-step planning components deleted (see `LEARNER_FLOW_PLAN.md`).
- Search by name, "Assign a case", wizard readiness panel, loading skeletons, empty-state actions (above).
- Plans list and the dashboard now count progress against the plan's own workflow (4 steps for TKR) instead of always "/ 6".

Still open: 🚫 real sessions/plans in the backend · 🚫 Message, request-access, SSO, password reset · ⬜ wizard autosave · ⬜ placeholder example text on the request-access form.

---

## 8. Administrator: instructor accounts (new)

**What it is:** `/admin/instructors` (sidebar: Admin → Instructor accounts, administrators only). The administrator is the platform administrator: pick an **institution** (or "+ Add a new institution…"), enter first name, last name and email; the temporary password is generated (or typed) and shown once with a Copy button. Below it, a table lists every instructor and admin with their institution.

**Backend change (additive; the only one):**
- `backend/api/v1/endpoints/admin.py` (new): `GET /api/v1/admin/instructors`, `POST /api/v1/admin/instructors`. Both require the `admin` role; new accounts are created in the admin's own institution; the password is returned once and never logged.
- `backend/api/v1/api.py`: registers the router.
- `backend/services/auth_service.py`: `provision_instructor` gained an optional `role` (default `"instructor"`), plus `list_staff` and `get_institution_name`.
- `backend/scripts/provision_instructor.py`: new `--role admin` option (for the one-time bootstrap below).
- `backend/tests/test_admin_instructors.py`: 9 tests (non-admins refused, unauthenticated refused, institution not client-supplied, duplicate email 409, bad input 422, list scoped to the institution). All pass.

**One-time bootstrap (no admin exists yet).** From `backend/`:
`python scripts/provision_instructor.py --role admin --email you@example.org --first-name Ada --last-name Admin --institution "Demo Hospital" --password <choose one>`
Use the same institution name as your existing instructor ("Demo Hospital"), because an admin only sees and creates accounts in their own institution. Sign in on the Instructor tab.

**Security note found while doing this:** `SUPPORTED_SYNC_PASSWORDS` in `backend/services/auth_service.py` hard-codes three passwords. If a login fails and the password entered is one of them, the code resets that account's password to it and signs in. Anyone who knows an email address (including an administrator's) could take over the account. It should be removed before the admin screen is used for real.

### 8.1 Institution isolation (multi-institution)

Requirement: instructors (and the learners they create) belong to one institution and are never visible to another.

**How it works:** an instructor's institution is set when the admin creates them; every learner they create takes that institution; instructors only reach residents in cohorts they own, programs and cases of their institution.

**Audit of the existing backend found five cross-institution gaps, all now fixed** (each with a test, and each test was verified to fail when its guard is removed):

| Gap | Fix |
|---|---|
| Adding an *existing* learner by Learner ID searched all institutions, so a known ID from another institution could be pulled into your cohort and then read. | Lookup is restricted to the cohort's institution; a foreign ID returns the same "not found" message. |
| `GET /residents/{id}/sessions` returned any resident's sessions to any instructor. | Requires the resident to be in a cohort the caller owns (404 otherwise). |
| Creating a cohort accepted any `program_id`. | The program must belong to the caller's institution. |
| Assigning cases to a cohort accepted any case id. | Cases must belong to the cohort's institution (or be shared, institution-less cases). |
| Case update / publish / deactivate / radiograph upload wrote first and checked institution afterwards, or not at all. | Institution is checked **before** any write. |

**Tests:** `backend/tests/test_institution_isolation.py` (10) and `test_admin_instructors.py` (13); full backend suite 50 of 50. The new SQL was also run read-only against the real database to confirm it is valid.

**Still open (not changed):**
- Cases with no institution (seed cases) are shared by every institution by design of the current data.
- `add_assignment` stores a case id and title without checking the case's institution (low impact: it is a label on the learner's own record).
- 🚫 `SUPPORTED_SYNC_PASSWORDS` in `auth_service.py` (see above) is still a takeover risk.
- Existing data is all in "Demo Hospital"; a new institution starts empty.
