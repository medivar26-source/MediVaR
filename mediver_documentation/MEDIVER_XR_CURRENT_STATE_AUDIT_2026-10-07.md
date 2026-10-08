# MediVeR-XR — Current-State Audit

| | |
|---|---|
| **Report date** | 2026-10-07 |
| **Repository root** | `F:\pravartak projects\MediVeR-XR-main` |
| **Branch / HEAD** | `main` @ `f5732d3b55a08bad8659f917c5f4c6a74e49369c` |
| **Working tree** | **DIRTY** — 31 modified tracked files + 16 untracked files (47 entries). Nothing staged. The local working tree is treated as the implementation source of truth. |
| **Audit type** | READ-ONLY. No source/config/migration file was modified, committed, pushed, reset or deleted. The only file created is this report. |
| **Auditor** | Claude Code (model `claude-sonnet-5-5`) |

> **Secrets policy.** This report names files, lines and *kinds* of credentials, never their values. Where a hard-coded secret was found it is described as "a value" and must be **rotated**, not merely removed.

---

## 0. Executive summary

MediVeR-XR is a web platform (Next.js dashboard + FastAPI backend + Supabase) for TKA (total knee arthroplasty) residency training. A learner plans a case on 2-D radiographs, performs it in a VR headset, and reviews the result against the plan. **Only the first third of that loop exists in this repository.**

| Layer | Reality |
|---|---|
| Identity, institutions, programs, cohorts, learner provisioning, scheduled sessions, case library (versioned, publishable), personal cases, instructor notes/feedback | **Real** — backed by FastAPI + Postgres (Supabase). |
| Pre-operative 2-D planning (assessment → tibial → femoral → review) | **Real UI and real maths, but the plan itself lives in Node process memory** (`PLANS` array, `dashboard/src/lib/data/plans.ts:103`). Lost on restart; shared by all users of the process; lock is advisory (not enforced server-side). |
| VR hand-off, event ingestion, attempts, assessment scoring, analytics, reports, recommendations, audit logs | **Not implemented.** Every screen that shows scores, sessions, reports or performance is rendered from a static seed file (`dashboard/src/lib/seed.ts`, 1 201 lines). |

**Three findings need action before any shared or networked deployment:**

1. **Authentication back-door (CRITICAL).** `backend/services/auth_service.py:108` hard-codes three "sync" passwords; on a failed sign-in, if the supplied password is one of them, the server **resets the target account's password to it via the admin API and signs the caller in** (lines 111-160 instructors/admins, 164-205 learners). Anyone who knows one of the strings and any email/Learner-ID can take over any account, including administrators.
2. **Database credential committed to Git (CRITICAL).** `backend/test_db.py:3` contains a full Postgres connection string including the password, present in history since the initial commit (`3ba38ea`, 2026-09-16). The same password is present in the local, git-ignored `backend/.env`, so it should be presumed live. A Supabase *publishable* key is likewise hard-coded in `backend/test_supabase_http.py:4`.
3. **Plan "lock" is not a lock (HIGH).** `updatePlanPayload` (`dashboard/src/app/actions/index.ts:321`) never checks `isReadyForVr`/`lockedVersion`, and `sealTkrPlan` (`:376`) can be re-run; all plan values are client-authored and trusted. The documented "immutable once sealed" rule (`18_OPEN_DECISIONS.md` §7) is enforced only by React `isReadOnly` flags.

**Health at a glance** (details §36): Architecture 🟡 · Frontend 🟡 · Backend 🟡 · Database 🟡 · Authentication 🔴 · Security 🔴 · Case authoring 🟡 · TKA planning 🟡 · Calibration 🟡 · Geometry 🔴 (not clinically sourced) · Fit/sizing 🟡 · Persistence 🔴 · VR 🔴 · Testing 🟡 · Documentation 🟡 · Deployment 🔴.

**Build / test status (this machine, 2026-10-07):** `tsc --noEmit` ✅ exit 0 · dashboard unit tests ✅ 214/214 (run with an explicit file list — `npm test` itself ❌ fails on Windows, see §27) · backend safe tests ✅ 48/48 (2 DB-writing tests deliberately **not run**) · ESLint ❌ 81 errors / 30 warnings · `next build` not run (would overwrite the git-ignored `.next/`).

---

## How to read this report

### Evidence & status vocabulary
* **Code / config / migrations win** over documentation for *actual* behaviour; documentation is used for *intended* behaviour and conflicts are reported, not silently reconciled.
* Items I could not verify are marked **UNKNOWN**. Static evidence that something is broken but that I did **not** reproduce at runtime is marked *(static evidence)*.
* Clinical rule classification (§12, §34): `SOURCE_VERIFIED` (traceable to the authoritative PDF) · `PROJECT_RULE` (written down in project docs but not in the PDF) · `ENGINEERING_DERIVATION` (chosen by developers to make the software work) · `CLINICAL_APPROVAL_REQUIRED` · `UNKNOWN`.

### Reading depth / limitations (honest scope statement)
* **Read in full:** all backend Python (`main.py`, `core/`, `db/`, `api/`, `services/`, `schemas/`, `scripts/`, `tests/` headers), all 12 SQL migrations, the dashboard planning/calibration/geometry/fit modules, server actions, session/proxy/api-client, `plans.ts`, `plan.ts`, seed file structure, and documentation files 05, 06 (headings + planning section), 07, 09, 10, 12, 13, 14, 17, 18, 19, `CONTENT_SCHEMA_PLAN.md`, root `README.md`.
* **Read selectively (headings + "confirmed updates" + targeted sections):** docs 01, 02, 03, 04, 08, 11, 20 (1 241 lines), 21 (787 lines), `LEARNER_FLOW_PLAN.md`, `UI_REDESIGN_SUGGESTIONS.md`.
* **Catalogued but not analysed:** `wireframe/` (13 static HTML files), `.agents/skills/` (40 third-party Supabase skill files), `codebase_context.md` (931 KB, dated 2026-09-10 — a stale generated dump; only its header was read), `mediver_documentation.zip` (listing only).
* **Not executable from here:** the live Supabase project (no connection made — the tool's Supabase MCP was unauthenticated and the audit rule is read-only), so **live RLS state, applied-migration state, bucket policies and real data are UNKNOWN**. VR client is not in the repository.
* The authoritative PDF was text-extracted (7 pages); layout/images were not inspected.
* Large React workspace components (`Tibial*`, `Femoral*`, `FitMarkerLayer`, `FitMap`, `ScanViewport`, `XRayCanvas`, ~9 400 lines of plan UI) were inspected through their shared hooks, pure modules and by targeted search, not line-by-line.

---

## 1. Repository baseline

| Item | Finding |
|---|---|
| Repository root / CWD | `F:/pravartak projects/MediVeR-XR-main` (single Git repo; no nested repos or extra worktrees; `git worktree list` → one entry; stash empty) |
| Branch / HEAD | `main` / `f5732d3` — "feat: refactor surgical planning workflows, auth services, and instructor views" (2026-10-05) |
| Commits | 35 total; authors: 3 identities (19 / 13 / 3 "unknown"). Last 5: `f5732d3`, `fdfdd65`, `72ebac3`, `27fbdfd`, `1c06568`. |
| Tracked files | 642 (of which 190 under `images(cases)/`, 40 under `.agents/`, 13 under `wireframe/`) |
| Staged | none |
| **Unstaged (31 files, +3 176 / −2 004 lines)** | `dashboard/src/app/actions/index.ts`; plan UI: `assessment/{AssessmentWorkspace,MeasurementPanel,XRayCanvas,page}`, `components/{PlanControls,ScanViewport,TkrPlanShell,planControls.module.css,planHooks}`, `femoral/{FemoralCanvas,FemoralControlsPanel,FemoralWorkspace,page}`, `tibial/{TibialCanvas,TibialControlsPanel,TibialWorkspace,page}`, `review/{ReviewWorkspace,page}`, `plan.module.css`; tests `plan/__tests__/{calibration_pipeline,v1_workflow}.test.ts`, `lib/__tests__/case_authoring.test.ts`; `components/cases/CaseAuthoringWizard.tsx`; libs `lib/data/{coordinates,plans,tibial_geometry,tkr_templates}.ts`, `lib/plan.ts`; doc `mediver_documentation/09_TKA_PLANNING_AND_CLINICAL_DATA.md` |
| **Untracked (16 files)** | `plan/[id]/components/{FitMap,FitMarkerLayer,FitPanels}.tsx`, `{useFitSession,useScanCalibration}.ts`; `lib/data/{assessment_geometry,fit_advice,fit_map,fit_markers,landmark_guide,scan_scale}.ts`; tests `lib/__tests__/{assessment_geometry,fit_advice,fit_map,fit_markers,scan_scale}.test.ts` |
| Git-ignored but present | `.env`, `backend/.env`, `dashboard/.env.local` (secrets — **contents not read/reproduced**), `backend/venv/` (Python 3.14.6), `dashboard/node_modules/`, `dashboard/.next/`, `dashboard/tsconfig.tsbuildinfo`, `scratch/` (2 helper scripts), `__pycache__/` |
| Generated / legacy artefacts that **are** committed | `backend/db_backup_pre_reset.{json,sql}` (DB snapshot, 2026-09-22; 5 users, names/emails/Learner IDs — PII, no password hashes), `codebase_context.md` (stale dump), `mediver_documentation.zip` (stale 2026-09-10 copy of the docs incl. removed files `15_ANTIGRAVITY_BUILD_PLAN.md`, `16_ANTIGRAVITY_PHASE_PROMPTS.md`, `PHASE_CHECKLIST.md`), `images(cases)/` (107 MB; 186 DICOM + 2 PNG + 2 XLSX), `dashboard/drizzle/` (orphaned Drizzle migrations, §24) |

**Classification of the working-tree change set.** It is a coherent unit of work ("bone-edge-marker fit engine + calibration hardening"): new geometry/fit modules and tests (untracked) plus rewrites of every plan workspace (modified). It was **not** reviewed by tests-in-CI (none exist). The doc `09_…` edit documents it. Key before/after is in §29.

---

## 2 & 3. Documentation discovery and inventory

Searched recursively for `*.md/mdx/txt/pdf/docx`, READMEs and notes (excluding `node_modules`, `venv`, `.agents`, `.next`). Found: **22** files in `mediver_documentation/` (21 Markdown + 1 PDF), **6** root/dashboard documents, **1** archive, **13** wireframe files, **40** third-party skill files.

| # | Document | Type | Purpose / major topics | Date | Class | Relationship to current code |
|---|---|---|---|---|---|---|
| 1 | `mediver_documentation/Mediver User Planning Workflow V1.pdf` | PDF, 7 pp | Click-level spec of the 4-page pre-op planner; 6 measurements; fit examples; VR JSON payload | v1.0.0 | **AUTHORITATIVE** (declared by docs 09, 18, 21) | Followed in structure and payload; diverges in landmark definitions, thresholds and calibration method (§4, §12, §17) |
| 2 | `README.md` (root) | MD | Run instructions, "state of play" | 2026-10-06 | **CURRENT** | Accurate; admits plans are in server memory |
| 3 | `mediver_documentation/README.md` | MD | Doc map, team split, tech direction, confirmed updates | – | CURRENT/SUPPORTING | Matches stack; ownership text is process, not code |
| 4 | `01_PRODUCT_VISION.md` | MD | Product goal, MVP boundary | 2026-09-15 upd. | SUPPORTING | Intent only |
| 5 | `02_REQUIREMENTS.md` | MD | Functional/non-functional reqs + 2026-09-15 updates | – | **POSSIBLY OUTDATED** (still says four measurements, 0.264 mm/px, backend-authoritative maths) | Conflicts: DC-02, DC-03 |
| 6 | `03_USER_JOURNEYS.md` | MD | Journeys | – | POSSIBLY OUTDATED (0.264 mm/px) | DC-01 |
| 7 | `04_UI_AND_NAVIGATION.md` | MD | IA, learner dashboard, V1 planner pages | – | CURRENT for planner; POSSIBLY OUTDATED for dashboards ("real persisted state") | DC-19 |
| 8 | `05_SYSTEM_ARCHITECTURE.md` | MD | Logical architecture, WebSocket, planning subsystem | – | SUPPORTING; part **aspirational** | WebSocket/attempts/assessment absent |
| 9 | `06_DATABASE_SCHEMA.md` | MD (478 l) | Logical data model (29 tables) | – | **POSSIBLY OUTDATED** (documents `users.password_hash`; omits 3 real tables; documents 8 tables that do not exist) | DC-16 |
| 10 | `07_API_CONTRACTS.md` | MD | REST/WS contract | – | PARTLY CURRENT (auth/programs/cases accurate) | DC-18 |
| 11 | `08_ASSESSMENT_ENGINE.md` | MD | Scoring pipeline | – | SUPPORTING (target design) | Not implemented |
| 12 | `09_TKA_PLANNING_AND_CLINICAL_DATA.md` | MD | TKA planning spec incl. fit rules | edited in working tree | **CURRENT** (most recently updated; contains one stale "four measurements" block) | Closest doc to code |
| 13 | `10_VR_INTEGRATION.md` | MD | Event envelope, attempt states, V1 payload | – | SUPPORTING; payload section **matches code** | Transport not implemented |
| 14 | `11_REPORTING_ANALYTICS.md` | MD | Reports | – | SUPPORTING (target) | Not implemented |
| 15 | `12_SECURITY_AUDIT_AND_COMPLIANCE.md` | MD | Auth, tenancy, audit | – | CURRENT for auth text; audit-log part aspirational | DC-23 |
| 16 | `13_TESTING_STRATEGY.md` | MD | Test levels; says "28/28" | 2026-09-21 | POSSIBLY OUTDATED | Now 214 dashboard tests |
| 17 | `14_DEPLOYMENT_AND_OPERATIONS.md` | MD | Envs, health checks, persistence requirement | – | SUPPORTING | `/ready` is a stub |
| 18 | `17_SEED_DATA_AND_DEMO.md` | MD | Demo data | – | SUPPORTING | Seed file matches in spirit |
| 19 | `18_OPEN_DECISIONS.md` | MD | Open/confirmed decisions (§7 plan locking "resolved") | – | CURRENT | Decision #7 not enforced in code (DC-12) |
| 20 | `19_DEFINITION_OF_DONE.md` | MD | Gates; status of `/content` | 2026-09-21 | **POSSIBLY OUTDATED** (database gate "not met" etc.) | DC-15 |
| 21 | `20_CLINICAL_AND_ASSESSMENT_CALCULATIONS.md` | MD (1 241 l) | Formula registry, conventions, scoring, audit trail | – | SUPPORTING / reference; **states clinical rules must stay configurable** | Several formulas implemented; scoring not |
| 22 | `21_CASE_LIBRARY_AND_AUTHORING.md` | MD (787 l) | Case authoring spec | – | **CURRENT** (implementation reference) | Largely implemented; gaps in §4 |
| 23 | `CONTENT_SCHEMA_PLAN.md` | MD | Pre-migration plan for 7 content tables | 2026-09-21 | **LEGACY** (describes `004_content_tables.sql`, "not applied") | DC-14/15 |
| 24 | `LEARNER_FLOW_PLAN.md` | MD | Learner flow findings L1…; says "implemented on the front end" | 2026-09-29 | POSSIBLY OUTDATED (cites deleted `Steps.tsx`, `PlanShell.tsx`, `Step7.tsx`) | DC-20 |
| 25 | `UI_REDESIGN_SUGGESTIONS.md` | MD | Instructor-flow audit | 2026-09-29 | POSSIBLY OUTDATED | – |
| 26 | `codebase_context.md` | generated dump | Directory + code listing | 2026-09-10 | **LEGACY** | Do not use |
| 27 | `mediver_documentation.zip` | archive | Old copy of docs | 2026-09-10 | **LEGACY** | – |
| 28 | `dashboard/AGENTS.md`, `dashboard/CLAUDE.md` | MD | Auto-generated "this is not the Next.js you know" rules | – | SUPPORTING | Tooling note |
| 29 | `.env.example` | env template | Config contract | 2026-10-06 | CURRENT | Matches `core/config.py` |
| 30 | Code-embedded docs: migration headers, service docstrings, `[...slug]` PLANNED list | – | – | – | CURRENT/mixed | Migration headers carry stale numbers (DC-14) |
| – | `wireframe/*.html` (13), `.agents/skills/**` (40) | – | Sketches; third-party agent skills | – | UNKNOWN / not analysed | – |

**Doc-vs-doc conflicts that should be resolved by the documentation owner** (not reconciled here): (a) *0.264 mm/px as "the" calibration* in docs 02/03/04/09 vs doc 21 §6 "must not treat 0.264 as a universal constant"; (b) *four* assessment measurements with confirm/edit/override-reason (docs 02, 08, 13, 18 §14, 19, and the trailing block of 09) vs *six* measurements (PDF, 04, 09 main body, 21); (c) *backend-authoritative calculation engine* (02, 05, 07) vs the frontend engine that actually runs; (d) PDF "included angle" for mHKA vs doc 20 "deviation from 180°" vs doc 09 "coronal alignment angle".

---

## 4. Documentation vs code (per subsystem)

Legend: **MATCH** · **PARTIAL** · **CONFLICT** (doc/code disagree) · **DOC-ONLY** (documented, not implemented) · **CODE-ONLY** (implemented, undocumented) · **UNKNOWN**.

| Subsystem | Documented intent | Actual implementation | Status |
|---|---|---|---|
| Authentication | Supabase Auth; Learner ID `MVR-XXXXXX` + temp password; instructors by email; change password re-verifies current | `/auth/login|me|logout|change-password|forgot-password|reset-password`; httpOnly cookie `mediver-token` (1 h, no refresh); Learner-ID ↔ synthetic email `@learner.mediver.local`. **Plus undocumented hard-coded password back-door.** | **PARTIAL (security defect)** |
| Authorization | Roles instructor/resident/admin; tenant isolation on backend | `require_role`, per-endpoint role checks, institution scoping by joins; cohort ownership via `owner_id`. Gaps in §8/§26 | **PARTIAL** |
| Institutions | Tenant boundary | `institutions` table; admin creates/reuses by name; users/programs/cases carry `institution_id` | MATCH |
| Programs | CRUD incl. PATCH/DELETE | list/create/get/enrolled/cohorts only; no update/delete | **PARTIAL** (doc 07 lists PATCH/DELETE) |
| Cohorts | CRUD, residents, performance, assignments | create/list/get; enrol new/existing learner; assign cases; no PATCH, no performance endpoint; `mean_score` always `None` | **PARTIAL** |
| Learners | Instructor-provisioned; many-to-many cohorts; one cohort per program | `provision_learner`; rule enforced in app code only (`add_existing_learner`), not by DB constraint | MATCH (app-layer) |
| Instructors | Provisioned by admin | `/admin/instructors` + `scripts/provision_instructor.py` | MATCH / CODE-ONLY (admin API undocumented in 07) |
| Cases | Versioned library | `cases`, `case_versions`, pointers, `case_programs` | MATCH |
| Case authoring | 5-step wizard, dynamic imaging, per-case rubric | 1 830-line wizard; FLAP/KLAT-centred imaging; criteria linked to program skills; reference values typed by hand | **PARTIAL** (§10) |
| Publishing | Pre-flight checklist; immutable versions | `validate_case_version_for_publishing` + freeze; immutable flag | MATCH (gate trusts client calibration flag) |
| Imaging | Private bucket, signed URLs, multi-image, order | Bucket `imaging`, signed URL 1 h at read; no display order / learner-visible persistence | **PARTIAL** |
| DICOM | Prefer DICOM pixel spacing | cornerstone viewer; wizard reads a DICOM tag but **the fallback tag (0028,0100) is BitsAllocated, not spacing** | **PARTIAL (defect)** |
| Calibration | Derived per image; never a universal constant | Derived in 3 places; seeds use 0.264 for both views; fallbacks flagged invalid | **PARTIAL** (§13) |
| TKA assessment | 6 measurements from placed points | `assessment_geometry.ts` — 13 points → 6 values | **PARTIAL/CONFLICT** (definitions §12) |
| Tibial planning | Size 1-6, 2-D overlay, coverage ≥90 %, overhang ≤1.0 mm | Bone-edge markers → generic plateau contour → polygon fit; extra rules (85 %, 4-edge overhang) | **PARTIAL** (extra thresholds not in PDF) |
| Femoral planning | Size 1-8, AP/ML coverage, notching | Bounding-box span fit; 0.5 mm notch limit | **PARTIAL** |
| Fit/sizing | "Real-time polygon intersection with annotated bone border" | Tibia: polygon intersection vs *scaled generic contour*; femur: rectangle | **PARTIAL** |
| Review / send | Lock → immutable payload → VR | Lock = in-memory flag + snapshot; payload JSON shown/copyable; **transport not built** (UI says so) | **PARTIAL** |
| Persistence | Plans persisted, locked version recoverable | **In-memory only** | **DOC-ONLY** (doc 14, 09) |
| VR | REST/WS, attempts, events, idempotency | Nothing in repo | **DOC-ONLY** |
| Assessment / scoring | Deterministic engine, versioned | `core/calculations/assessment.py` exists but is **unused** by any endpoint; UI scores are seed | **DOC-ONLY** (dead code) |
| Analytics / reports | Resident/cohort/case/skill reports | Screens render seed; no queries | **DOC-ONLY** (UI-only) |
| Deployment | local compose, k8s, health, staging/prod | compose (dev, `--reload`), 2 k8s deployments (dev server image), `/ready` stub, **no CI/CD** | **PARTIAL** |
| Security | Tenant isolation, audit logs, secrets hygiene | See §26 | **PARTIAL** |

---

## 5. Repository map

| Path | Purpose | Key files | Status |
|---|---|---|---|
| `backend/` | FastAPI API | `main.py`, `api/v1/endpoints/*.py` (9 routers), `services/*.py` (7), `schemas/*.py` (7), `core/{config,security}.py`, `core/calculations/*` (unused engine), `db/session.py` (psycopg2 + supabase-py), `migrations/` (12 SQL + runner), `scripts/` (provision, seed), `tests/` (5 files) | **ACTIVE** |
| `backend/venv/` | Local Python 3.14.6 env (ignored) | – | environment |
| `backend/db_backup_pre_reset.*`, `backend/test_db.py`, `backend/test_supabase_http.py` | Snapshot + ad-hoc connectivity scripts | – | **LEGACY / hazardous** (credentials, PII) |
| `dashboard/` | Next.js 16 app | `src/app/**` (≈45 routes), `src/components/**`, `src/lib/**` | **ACTIVE** |
| `dashboard/src/app/plan/[id]/**` | TKA planner (4 steps) | see §11 | ACTIVE, **uncommitted rewrite** |
| `dashboard/src/lib/data/**` | Data seam: some real API clients, many seed accessors | see §22 | MIXED |
| `dashboard/src/lib/seed.ts` | 13 cases, 7 profiles, 2 cohorts, 22 sessions, 20 reports, 530 scene results | – | **MOCK/SEED** |
| `dashboard/src/lib/server/calculations/` | `engine.ts`, `engine.test.ts` — **both 0 bytes**, but `engine.test.ts` is listed in `npm test` | – | **EMPTY STUBS** |
| `dashboard/drizzle/` | `0000_amusing_jackal.sql` (159 l; different schema: `plan_measurements`, `attempts`, `assessment_results`…), `0001_*.sql` (0 bytes), journal | no `drizzle.config`, no schema source, 0 imports of `drizzle-orm` | **ORPHANED LEGACY** |
| `dashboard/public/` | 8 JPEGs (real-looking AP/lateral + 4 synthetic varus/valgus) used as fallback scans | – | demo assets |
| `docker-compose.yml`, `backend/Dockerfile`, `dashboard/Dockerfile`, `k8s/**` | Dev containers / k8s | – | DEV-ONLY |
| `mediver_documentation/` | Doc pack | §3 | – |
| `wireframe/` | Static sketches | – | legacy |
| `images(cases)/` | 186 CT DICOM + PNGs + XLSX ("SPINE DEMO PATIENT") | referenced by no code; only mentioned in two planning docs | **UNUSED, large, possible PHI (provenance UNKNOWN)** |
| `scratch/` (ignored) | `run_migration.py` (prints the DB URL incl. password to stdout), `check_tables.py` | – | local helpers |
| `.agents/`, `skills-lock.json` | Third-party Supabase agent skills | – | tooling |

No Kubernetes secrets, ingress, DB or storage manifests exist; no GitHub Actions or other CI definition exists.

---

## 6. Technology stack (from configuration, not documentation)

**Frontend** — Next.js **16.3.0** (App Router, Server Components + **Server Actions**; `proxy.ts` replaces middleware), React **19.2.8**, TypeScript ^5 (`strict`), CSS Modules (no Tailwind), `lucide-react`, `@base-ui/react` (2 files), `cornerstone-core` 2.6.1 + `cornerstone-wado-image-loader` 4.13.2 + `dicom-parser` for DICOM, ESLint 9 + `eslint-config-next` 16.3.0, `tsx` test runner (Node `--test`). **Declared but unused:** `drizzle-orm`, `postgres`, `pino`, `zod` (0 imports each). No client state library; no forms library; no client-side data fetching library (all fetches are server-side). Env: `NEXT_PUBLIC_API_URL` (read server-side).

**Backend** — FastAPI **0.141.1** / Starlette 1.6.0 / Pydantic **2.13.5** (venv; `requirements.txt` is *unpinned* `>=`), Python **3.14.6** locally vs `python:3.11-slim` in the Dockerfile (mismatch), `supabase` 2.31.0 (Auth + Storage), `psycopg2-binary` direct SQL (a new connection per call, no pool), `httpx`. `PyJWT` is in requirements but **unused** (tokens are validated by calling Supabase `auth.get_user`, `core/security.py:26`; `SUPABASE_JWT_SECRET` is configured but never read). No ORM, no background jobs, **no WebSockets**, no rate limiting, no structured logging beyond `logging.basicConfig(INFO)`.

**Database** — Supabase-hosted PostgreSQL; 24 tables from 12 hand-written SQL files with no migration-tracking table; RLS enabled on 18 of 24 tables but **policies exist on only 3** (§24).

**Infrastructure** — `docker-compose.yml` (backend `--reload`, frontend `npm run dev`, bind mounts), `k8s/` (1 replica each; backend probes `/api/v1/health` and `/api/v1/ready`; frontend image runs the **dev server**), no CI/CD, no observability stack.

**AI/ML** — none (no LLM/RAG/embedding code; `.agents/` only holds developer-tooling skills).

**VR** — none in this repository (no Unity project, no client SDK, no transport).

---

## 7. Actual architecture (reconstructed from code)

```
Browser ──(RSC + Server Actions)──► Next.js server (dashboard)
   │                                   │  cookie mediver-token (httpOnly, 1 h)
   │                                   ├─ lib/data/*  ──► FastAPI /api/v1  ──► psycopg2 ──► Supabase Postgres
   │                                   │                       │
   │                                   │                       └─ supabase-py (service-role) ─► Supabase Auth + Storage('imaging')
   │                                   └─ lib/data/plans.ts : PLANS[] in process memory  (planner state, PIN stubs)
   │                                   └─ lib/seed.ts       : sessions, reports, performance, dashboards (static)
   └─ DICOM/JPEG viewer + planner canvases (client components; maths in lib/data/*.ts)

(VR headset) ── not present ──  (WebSocket / attempts / events / assessment / reports ── not present)
```

Flow table (only flows backed by code):

| Flow | Entry → path → persistence | Authorization | Errors |
|---|---|---|---|
| Sign-in | `/login` → `signIn` action → `POST /auth/login` → Supabase `sign_in_with_password` → cookie | public; **back-door §8** | generic message; 503 on unexpected |
| Provision learner | `programs/[id]` UI → `createLearner` → `POST /cohorts/{id}/learners/new` → `auth.admin.create_user` + `users` + `cohort_members` | instructor/admin; cohort `owner_id` | ValueError→400; **no rollback of the Auth user if the `cohort_members` insert fails** (`cohorts_service.py:193-252`) |
| Author & publish case | `/cases/new` wizard → `createCaseAction` → `POST /cases` → `cases`+`case_versions`+`case_programs`+`case_imaging`+`case_version_reference_plan`+`assessment_criteria` → `POST /cases/{id}/publish` | instructor/admin; institution scope (gaps §26) | 400/422 with raw messages |
| Radiograph upload | wizard → `uploadAssetAction` → `POST /cases/upload-asset` → Storage `imaging/cases/assets/<hex>_<name>`; or `POST /cases/{id}/upload-radiograph` (derives calibration) | instructor/admin/resident | 500 with raw storage error text |
| Schedule session | `createSession` → `POST /cohorts/{id}/sessions` → `sessions`+`session_residents` | cohort owner | 404/400 |
| Plan a case | `startPlan` → `PLANS.push` → `/plan/{id}/assessment` → `updatePlanPayload` (memory) → `sealTkrPlan` (memory) | session user; owner check only if plan exists | `{success:false}` objects |
| Learner views case | `/cases/[id]` → `GET /cases/{id}` (sanitized) + seed merge | enrolled via `case_programs`+`cohort_members` | 404 |

State machine for a plan (from code, **not** documented as such): `draft` (no assessment) → *assessment saved* (`v1_assessment`) → *tibial confirmed* (`v1_tibial.is_confirmed`) → *femoral confirmed* → `locked` (`isReadyForVr=true`, `lockedVersion` snapshot) → *sent* **(does not exist)**; derived list states `draft|ready|paired|performed` in `plans.ts` where `paired` needs a PIN row that only exists in seed.

---

## 8. Authentication & authorization

| Topic | Finding | Evidence |
|---|---|---|
| Login | One endpoint for both identities; tolerant cross-type fallback (email typed on Learner tab and vice-versa) | `api/v1/endpoints/auth.py:30-100` |
| **Back-door passwords** | `SUPPORTED_SYNC_PASSWORDS` = 3 literals. On Supabase sign-in failure, if input ∈ set **and** the user exists, the service-role client calls `update_user_by_id(..., {"password": password})` then signs in. Introduced `d65b449` (2026-09-29). **CRITICAL** | `services/auth_service.py:108`, `:111-160`, `:164-205` |
| Logout | `admin.sign_out(token)` best-effort; cookie deleted | `auth.py` `/logout`; `actions/index.ts` `signOut` |
| Session/cookie | `mediver-token`, httpOnly, `secure` only in production, `SameSite=lax`, `maxAge` 3 600 s; **no refresh** (backend returns only `access_token`) → hard sign-out hourly | `actions/index.ts:92` |
| Token validation | Per request: network call to Supabase `get_user` (supports revocation; adds latency/availability coupling) then DB lookup | `core/security.py:26-70` |
| Route protection | `proxy.ts` checks cookie *presence only*; real validation happens in `getCurrentUser()` (`/auth/me`) and on every API call; per-page persona redirects (`/admin/*`, `/content`, `/learners/[id]`) | `proxy.ts:27-56` |
| Password change / reset | Re-verifies current password via sign-in; reset requires a recovery-method token (`amr` ≠ password, ≤15 min) after Supabase validation | `auth_service.py:209-260`, `:328-370` |
| Temp passwords / Learner IDs | Generated with Python `random` (not `secrets`): temp password 12 chars (`cohorts_service.py:190`), Learner ID 6 chars (`auth_service.py:597`). Admin-created instructor passwords use `secrets` (`admin.py`) | – |
| Provisioning | Instructors only via admin API / script; learners only by instructors; `CreateLearnerRequest.role` restricted to learner roles | `schemas/cohorts.py:52` |
| Roles | DB CHECK: `instructor, student, intern, resident, surgeon, admin`. UI persona collapses to learner/instructor/admin. **`/personal-cases/*` and `/cases/upload-asset` accept only `"resident"`** (not student/intern/surgeon) | `personal_cases.py:23`, `cases.py:197` |
| Institution isolation | Programs/cases filtered by `institution_id`; cohorts/residents by `cohorts.owner_id` (so *instructor-level*, stricter than institution); tests exist (`test_institution_isolation.py`, 10 tests with a fake DB) | see §26 for holes |
| Cohort membership | `cohort_members` UNIQUE(cohort,user); one-cohort-per-program rule only in `add_existing_learner` | – |
| API protection | All routers except `/health`, `/ready`, `/auth/login`, `/auth/forgot-password`, `/auth/reset-password` require `get_current_active_user` | – |
| **DB RLS** | The backend connects with the pooler `postgres.<ref>` role (bypasses RLS), so RLS is defence-in-depth only. Policies exist for `sessions`, `cohort_case_assignments`, `session_residents` only; **six tables have no RLS at all** | §24 |
| Search for bypasses | Found: the back-door above; committed DB credential; docstring example password in `scripts/provision_instructor.py`; `README`/docs contain no credentials | `git grep` |
| Obsolete systems | Invite/join flow retired (doc 02) — only a "planned" stub for `/join` in `[...slug]/page.tsx`; `request-access` is a `mailto:` link | – |

---

## 9. Domain model (as implemented)

```
institutions 1──* users (role, status, learner_id | email)
institutions 1──* programs 1──* cohorts(owner_id → users) *──* users   [cohort_members]
cohorts *──* cases                                             [cohort_case_assignments  (not in doc 06)]
programs *──* cases                                            [case_programs  = curriculum availability]
cases(institution_id, procedure_id, status draft|active|inactive, version int,
      draft_version_id → case_versions, published_version_id → case_versions)
  1──* case_versions(version_number, is_immutable, patient JSONB, objectives JSONB, side, pathology)
        1──* case_imaging(view_type, storage_path, calibration JSONB)
        1──1 case_version_reference_plan(assessment JSONB, tibial_component JSONB, femoral_component JSONB)
        1──* assessment_criteria(case_id, case_version_id, skill_id → skills(program))
procedures 1──* procedure_steps          cases → procedures
cohorts 1──* sessions(case_id, instructor_id, mode, is_cancelled, duration) 1──* session_residents(status)
users 1──* training_assignments(case_id TEXT !, case_title, cohort_id)       users 1──* instructor_notes / instructor_feedback(attempt_id loose UUID)
users 1──* learner_personal_cases 1──* learner_personal_case_imaging          (private, unversioned)
```

**Not in the database at all:** plan, plan version/lock snapshot, attempt, VR event, clinical measurement, error, assessment result, skill score, recommendation, audit log, report. `training_assignments.case_id` is `TEXT` because the UI assigns seed ids (`CASE_001`), not real `cases.id` (documented in migration 010). The word **"session"** means two different things: a *scheduled event* (backend `sessions`) vs a *performed simulation record* (seed `SESSIONS`/reports in the dashboard).

---

## 10. Case system

| Capability | Status | Trace |
|---|---|---|
| Create / draft | **Real** | wizard → `POST /cases` → `cases_service.create_case` (`:405`) inserts case (status `draft`) + draft version v1 + associations in one transaction |
| Edit | **Real** | `PUT|PATCH /cases/{id}` → `update_case` (`:533`): mutates draft if present else **branches a new draft** — but the branch copies **only metadata**; imaging, reference plan and criteria are **not carried over** unless re-sent (`:554-600`) *(static evidence)* |
| Versions / immutability | **Real** | `case_versions.is_immutable`; publish sets `published_version_id`, clears `draft_version_id`, bumps `cases.version` (`:717-796`) |
| Publish checklist | **Real** (server) | `validate_case_version_for_publishing` (`:53`): title, side, pathology, FLAP+KLAT images, `calibration.is_valid` **as supplied by the client**, six reference values present, tibial 1-6 / femoral 1-8, ≥1 criterion |
| Duplicate case | **Not implemented** | – |
| Assignment | Two separate mechanisms: *availability* `case_programs` (learner visibility) and *cohort assignment* `cohort_case_assignments` (used to schedule sessions). Matches doc 21 §10 intent. `set_cohort_cases` does **not** require the case to be published/active | `cohorts_service.py:339` |
| Learner projection | **Real** — separate query omitting reference plan, criteria, notes; Pydantic `LearnerCaseDetailResponse` | `cases_service.py:332`, `schemas/cases.py` |
| Instructor-only reference plan | **Real storage**, but values are **typed by hand** in the wizard (defaults 12.0 / 5.8 / **174.0** / 85.5 / 87.0 / 7.0) | `CaseAuthoringWizard.tsx:189-199` |
| Preview as learner | Endpoint exists; **not tenant-scoped** (§26) | `cases.py:89` |
| Patient data | Free-form JSONB; no schema validation | – |
| Storage | Bucket `imaging`; learner/instructor URLs are signed (3 600 s) at read | `cases_service.py:36` |
| Deactivate | **Real** (`POST /cases/{id}/deactivate`) | – |
| **Legacy `/content` UI** | Still present; its "set active/inactive" and "procedure" edits call `PATCH /cases/{id}` with `status`/`procedure_id`, which `cases_service.update_case` **silently ignores**; its list expects `procedure_name`/`program_id` that the new list endpoint no longer returns *(static evidence)*; `content_service.{list,get,create,update}_case` are **dead code** | `actions/index.ts:965`, `content.ts:100`, `content_service.py` |
| Wizard defects *(static evidence)* | (a) difficulty option `"advanced"` (`:730`) violates DB CHECK (`beginner|intermediate|expert`) → insert fails with a raw SQL error; (b) `alignment_type` heuristic `side==="right" && MAD>0 ? VARUS : VALGUS` (`:1203`) is wrong for left knees and ignores MAD direction; (c) default imaging rows pre-filled with `storage_path:"cases/synth/flap.jpg"` and marker diameter **94.7 px** (`:158-185`) so an author can publish a "calibrated" case with no real scan; (d) hard-coded fallback `skill_id` UUID (`:200`); (e) the extra tags/fit metrics are computed client-side and stored | – |

---

## 11. TKA pre-operative planning — deep audit

### 11.1 Component inventory

| Area | Files (all under `dashboard/src/`) | Role | Git state |
|---|---|---|---|
| Plan shell / routing | `app/plan/[id]/page.tsx`, `components/TkrPlanShell.tsx` (205 l) | Resolves plan → redirects to the first open step or to `review` once locked; step chips, header | shell modified |
| Step 1 Assessment | `assessment/{page,AssessmentWorkspace(268),MeasurementPanel(326),XRayCanvas(288)}.tsx` | 13-point landmark placement, live 6 values, accept | modified |
| Step 2 Tibial | `tibial/{TibialWorkspace(212),TibialCanvas(319),TibialControlsPanel(381)}.tsx` | Size 1-6, drag/rotate overlay, fit gauges, confirm | modified |
| Step 3 Femoral | `femoral/{FemoralWorkspace(214),FemoralCanvas(311),FemoralControlsPanel(381)}.tsx` | Size 1-8, overlay, notching, confirm | modified |
| Step 4 Review/Lock | `review/{page,ReviewWorkspace(560)}.tsx` | Summary cards, readiness checks, lock, payload JSON viewer/copy | modified |
| Shared fit UI | `components/{FitMap,FitMarkerLayer,FitPanels,PlanControls,ScanViewport}.tsx`, `useFitSession.ts`, `useScanCalibration.ts`, `planHooks.ts` | Top-down fit map, bone-edge markers, save status, nudge keys, scan size loader | 5 **new** (untracked) |
| Pure maths | `lib/data/{assessment_geometry,scan_scale,coordinates,calibration,fit_markers,fit_advice,fit_map,landmark_guide,tibial_geometry,femoral_geometry,tkr_templates}.ts` | Measurements, scale, geometry, fit engine, size ranking, advice text | 6 **new**, 4 modified |
| State/persistence | `lib/data/{plans,plan}.ts`, `lib/plan.ts`, `app/actions/index.ts` (`startPlan`, `updatePlanPayload`, `sealTkrPlan`) | In-memory store + server actions | modified |
| Tests | `app/plan/__tests__/*` (3), `lib/__tests__/{assessment_geometry,fit_*,scan_scale}.test.ts` | 214 test cases pass | partly new |

### 11.2 Stage-by-stage verdict

| Stage | Verdict |
|---|---|
| 1 Assessment | **Works** end-to-end in the browser. Values are computed client-side from real image pixel dimensions; nothing is defaulted (`assessment_geometry.ts` header contract). Per-measurement confirm/edit/override-reason (documented 2026-09-15) is **not** implemented — one Accept for all six. Placing a point outside the image clamps to the edge rather than rejecting (`XRayCanvas.tsx:59`). |
| 2 Calibration | **Per-scan** two-click scale or case-supplied scale; estimates are flagged and block locking. See §13. |
| 3 Tibial | **Works** against *marked bone edges*; patient bone is a generic scaled contour (§15). Confirmation is withdrawn when marker, scale or placement changes; a confirmation records the scales it was made at (stale-scale detection, `TibialWorkspace.tsx:44-50`). |
| 4 Femoral | **Works** against a rectangular bone box (§15). |
| 5 Review | Summary + readiness checklist; locking disabled until assessment measured, both components confirmed and both scans' scales verified. |
| 6 Lock | `sealTkrPlan` stores `lockedVersion {versionId, sealedBy, sealedAt, payload deep copy}` in memory. **Not enforced** against later `updatePlanPayload`; can be re-sealed (§18). |
| 7 Persistence | **Memory only** (§18). |
| 8 VR transfer | **UI text only**: "VR headset transfer transport is not yet connected; payload is cached for pairing" (`ReviewWorkspace.tsx:362`). `mintPin`/`sealPlan`/`savePlanStep` server actions are explicit stubs that return error strings (`actions/index.ts:351,363,459`). |

---

## 12. Assessment measurements (MAD, AMA, mHKA, MPTA, LDFA, PTS)

All six are computed in `dashboard/src/lib/data/assessment_geometry.ts::measureAssessment` (`:175`). **Coordinate system:** landmarks are stored as **percentages of the image** (0-100, origin top-left, y down) and converted to *natural image pixels* (`x/100·width`, `y/100·height`) before any maths, so anisotropic aspect ratios cannot distort angles. **Units:** angles in degrees (1 dp), MAD in mm (1 dp) via the FLAP scan's `mm_per_px`. Angles assume square pixels (DICOM anisotropic spacing is not handled — **UNKNOWN impact**). Calculation location: **client only** (re-computation on the server before locking does **not** happen).

| Measure | Points used (view) | Formula as coded | Sign / convention | Plausibility flag (never alters value) | Provenance |
|---|---|---|---|---|---|
| **MAD** (`:202`) | hip, knee, ankle centres (FLAP) | perpendicular distance knee→line(hip,ankle) × `mmPerPx(FLAP)` | unsigned magnitude; direction (medial/lateral) from the surgeon's lateral/medial marks (tibia first, else femur), else case knee side, assuming "patient's right = viewer's left" (`:213-225`) | 0-80 mm | *Definition* **SOURCE_VERIFIED** (PDF p.2). *Direction rule & bounds* **ENGINEERING_DERIVATION / CLINICAL_APPROVAL_REQUIRED** |
| **AMA** (`:250`) | hip, knee + `femurCanalProximal/Distal` (FLAP) | unsigned angle between (distal−proximal canal) and (knee−hip) | unsigned | 0-12° | **SOURCE_VERIFIED** (PDF) for definition; sign **ENGINEERING_DERIVATION** |
| **mHKA** (`:207`) | hip, knee, ankle (FLAP) | `|signedAngle(knee−hip, ankle−knee)|` = **deviation from straight** (0° = neutral); `NEUTRAL` if <0.5°, else `VARUS` when knee bows lateral, `VALGUS` medial | deviation, not "included angle ≈180°" | 0-30° | **PROJECT_RULE / CLINICAL_APPROVAL_REQUIRED** — the PDF says "included angle" yet its example is "7.0° Varus"; doc 20 gives both forms; the backend engine and the wizard defaults (174°) use the 180° convention (§17, DC-04) |
| **MPTA** (`:245`) | knee, ankle, `tibiaProximalLateral/Medial` (FLAP) | unsigned angle between (ankle−knee) and (medial−lateral) = **medial** angle | medial side by vector construction | 70-110° | Definition **SOURCE_VERIFIED**; **axis definition differs from PDF** (PDF: two tibial *shaft* points; code: knee→ankle centre) → **PROJECT_RULE** |
| **LDFA** (`:239`) | hip, knee, `femurDistalLateral/Medial` (FLAP) | unsigned angle between (hip−knee) and (lateral−medial) = **lateral** angle | lateral | 70-110° | **SOURCE_VERIFIED** (matches PDF) |
| **PTS** (`:260`) | `tibiaPlateauAnterior/Posterior`, `tibiaShaftProximal/Distal` (KLAT) | `asin( plateau·shaft / (|plateau||shaft|) )` | **signed**; positive when the posterior plateau point is lower down the shin than the anterior | −10…25° | Concept **SOURCE_VERIFIED**; **point set differs from PDF** (PDF: 2 points on the anterior cortex + 1 on plateau tangent = 3 clicks; code & doc 09: 4 points) → **PROJECT_RULE** |

* **Total points:** 13 (9 FLAP + 4 KLAT), fixed order (`REQUIRED_LANDMARKS`), listed in `landmark_guide.ts`. PDF's click lists imply fewer points; doc 09 documents 13 (code matches doc 09, not the PDF).
* **Completion criteria:** all 13 points placed, **both scan sizes known**, and every value present → `complete`. `toV1Assessment` additionally requires `alignment_type`. Accept is the only gate to Step 2.
* **Persistence:** on Accept the client calls `updatePlanPayload` with `v1_assessment` (+ landmarks with legacy aliases `femoral_head_center`, …). Server stores the object as sent.
* **Lock behaviour:** UI goes read-only when `isReadyForVr || lockedVersion`; server does not check.
* **Provenance recorded:** only `scale_estimated`. Original-vs-edited value, override reasons and "who changed what" (docs 12, 18 §14, 19) are **not recorded**.
* **Seed anomaly:** the seeded synthetic plans (`plans.ts` ids …905/906) carry hand-typed assessment values (12.0, 6.0, 7.0, 89.0, 88.0, 7.0 — identical to the PDF's example) that cannot be re-derived from their stored landmark subset; the UI shows the stored values until a point is moved (`AssessmentWorkspace.tsx` `usingSaved`).

---

## 13. Calibration

**Pipeline (as coded).** marker placement → *either* (a) learner clicks two points a known distance apart (`useScanCalibration.completeCalibration` → `scaleFromTwoPoints`, `scan_scale.ts:92`: rejects distance <4 px or scale outside **0.05-1.5 mm/px**) *or* (b) the case's stored calibration (`normalizeCalibration`, `coordinates.ts:68`) → resolved per scan by `resolveScanScale` (`scan_scale.ts:41`) in the order **plan-measured > case > estimate** → used by assessment (MAD only), bone-size derivation (`deriveBone`), fit, and drawing → persisted in `payload.scan_calibration` → **lock requires `calibrated === true` for both scans** (`sealTkrPlan`, re-checked on Review). Changing a scale withdraws confirmations (`onScaleChanged`). Marker detection is **manual** — the PDF's "calibration markers are automatically detected" is not implemented.

**Can invalid calibration fabricate measurements or fits?** *Displayed numbers: yes, but labelled.* With no verified scale the screens still compute MAD/fit using a placeholder (0.769 mm/px for FLAP-named views; 0.264 mm/px otherwise) and mark them `scale_estimated`; a learner may "accept the estimate" (`estimated_scale_accepted`) to continue to confirmation. *Reaching VR: no* — `sealTkrPlan` refuses unless both scales are verified. **But "verified" means "a number in range was supplied by a client"**: case-level `is_valid` is client-written (`CaseAuthoringWizard.tsx:468-482`; backend `create_case` stores it unchecked, `cases_service.py:469-484`), and the two-click scale trusts the typed marker size. No code detects a marker or cross-checks scale against DICOM spacing.

### Full occurrence list (`0.264`, `mm/px`, `px/mm`, `DEFAULT_MM_PER_PX`, calibration fallbacks)

| Location | What it is | Classification |
|---|---|---|
| `lib/data/calibration.ts:11` `DEFAULT_MM_PER_PX = 0.264`; `:13-20` `DEFAULT_CALIBRATION` (`isValid:false`) | Sample value from the PDF turned into a constant + placeholder | **UNSAFE-IF-MISUSED fallback** (guarded: `pxToMm`/`mmToPx` return `NaN` unless `isValid===true`); `pxToMm`, `mmToPx`, `formatCalibration` have **no production callers** (dead code); `formatCalibration` would print "0.264 mm/px (25mm marker)" for an uncalibrated scan |
| `lib/data/coordinates.ts:109,118` | `normalizeCalibration` returns `DEFAULT_CALIBRATION` for non-FLAP views with no data; `:91-107` FLAP/long-leg hint returns 25/32.5 = 0.769 mm/px (`isValid:false`) | **Estimate, flagged invalid** — acceptable, but hint is derived from the *file name* of the view |
| `lib/data/coordinates.ts:133,139` `mmToImagePx`/`imagePxToMm` | `scale>0 ? scale : DEFAULT_MM_PER_PX` | **UNSAFE silent fallback** (callers currently pass a resolved scale, so unreachable in practice) |
| `lib/data/coordinates.ts:37` `REALISTIC_SCALE_MM_PER_PX = [0.05,1.5]` | Range gate | **ENGINEERING_DERIVATION** (also in backend `geometry.py` and docs) — needs clinical approval |
| `lib/data/scan_scale.ts` | Resolution + two-point scale | Valid (current) |
| `lib/data/plans.ts:179,252` `mm_per_px: 0.264` in seeded plans' `payload.calibration` | Plan-level calibration field | **SYNTHETIC seed**; field is **legacy** (no reader in the new pipeline) |
| `lib/seed.ts:880,928` `mm_per_px: 25/94.7` on both views of both synthetic cases | Seed case imaging | **SYNTHETIC but marked valid** — one 94.7 px marker is applied to a full-leg FLAP and a knee KLAT (the file's own comment says FLAP ≈0.769 mm/px) |
| `backend/scripts/seed_case_library.py:114-115,296-297` (+ `:255,433` `"calibrated_scale": 0.264`) | DB seeding of the same two cases | **SYNTHETIC but marked valid** |
| `backend/core/calculations/geometry.py:85-138` `calculate_calibration` | Derives `mm/px = marker/pixels`; validity ranges: marker 5-100 mm, 10-3 000 px, scale 0.05-1.5 | Valid derivation; **inputs are client-typed**; used by upload endpoints only |
| `components/cases/CaseAuthoringWizard.tsx:158-185,292-301,468-482`; `PersonalCaseAuthoringWizard.tsx` | Pre-filled `94.7` px; `scale = 25/px`; `is_valid` computed in the browser | **Unsafe default** (a fabricated calibration can be published) |
| `…/CaseAuthoringWizard.tsx:385-393` DICOM spacing | Reads tag `(0028,0030)` **or `(0028,0100)`** (BitsAllocated — wrong tag), then fakes a "marker diameter" `25/spacing` | **Defect**; also PixelSpacing in projection radiography may be detector-relative (UNKNOWN) |
| Tests: `app/plan/__tests__/calibration_pipeline.test.ts`, `v1_workflow.test.ts`, `lib/__tests__/case_authoring.test.ts`, `scan_scale.test.ts`, `backend/tests/test_case_authoring.py` | Fixtures | **TEST-ONLY** |
| Docs 02, 03, 04, 09 (`0.264` as the standard); doc 21 §6 (forbids it) | – | **Documentation conflict** (DC-01) |

---

## 14. Coordinate system

| Space | Definition | Code |
|---|---|---|
| Screen | `clientX/clientY` | pointer events |
| Stage (CSS) | `<div>` that holds the fitted image; zoom 0.5-5.0, pan via CSS transform in `ScanViewport.tsx` | `ScanViewport.tsx:37-131` |
| **Stored landmark/marker space** | **% of stage width/height**, computed from `getBoundingClientRect()` of the *transformed* stage, so it is invariant to zoom/pan; clamped 0-100 | `XRayCanvas.tsx:53-60`, `FitMarkerLayer.tsx:52-56` |
| Natural image pixels | `% / 100 × naturalWidth|Height` (pre-loaded by `useImageDims`; DICOM sizes reported by the viewer) | `assessment_geometry.ts`, `fit_markers.ts` |
| Physical mm | `px × mm_per_px(scan)`; MAD, bone ML (FLAP) and AP (KLAT) | `scan_scale.ts`, `fit_markers.ts:144` |
| Implant/model frame | origin = middle of the marked bone edges; **x → image right on the AP scan, y positive posterior**; offsets in mm; rotation degrees clockwise ±45° on the fit map; rounding 0.1 mm / 0.1-0.5° | `fit_markers.ts`, `fit_map.ts` |

Notes: `imageToScreen`, `screenToImage`, `screenDeltaToPhysicalMm` etc. in `coordinates.ts` are exercised by tests but **not used by the canvases** (only `screenDeltaToImageDelta` is) — two parallel transform implementations. Rotation is applied about the component centre; the *bone* is never rotated. Left/right knees are handled by letting the surgeon's own "medial/lateral" marks define orientation (`FitOrientation`), not by the case side. Level (up/down) offset is drawing-only (`level_offset_mm`).

---

## 15. Patient anatomical geometry — what is *actually* represented

| Bone | Representation | Precisely | Source |
|---|---|---|---|
| **Tibia** | **Generic contour, scaled** | 16-point *normalised plateau outline* (`NORMALIZED_TIBIAL_PLATEAU_CONTOUR`, `tibial_geometry.ts:30`) stretched to ½·ML × ½·AP where ML = distance between the two AP-scan edge markers and AP = distance between the two lateral-scan edge markers (`generateTibialBoneBoundary`, `:53`). **Not** a traced or segmented anatomical outline. | ENGINEERING_DERIVATION |
| **Femur** | **Rectangle** | Box of width ML × depth AP centred on the origin (`evaluateFemoralFit`, `tkr_templates.ts:319`); coverage = overlap of the component's *bounding extents* with the box | ENGINEERING_DERIVATION |

Neither is "anatomically accurate"; both are engineering approximations driven by four clicked edge points. The coronal/sagittal bone *edges* are located by the surgeon (assessment landmarks `tibiaProximal*`, `femurDistal*` seed the markers once the assessment is accepted — `fit_markers.ts:seedMarkers`), and the resulting plausibility test compares to the implant catalogue ±(0.75×/1.3×) — i.e. **bone sizes are judged against the implants being fitted** (`PLAUSIBLE`, `fit_markers.ts:133`).

---

## 16. Implant geometry

| Item | Finding |
|---|---|
| Tibial catalogue | Sizes 1-6, AP×ML mm: 38.0×61.0, 40.0×64.5, **42.5×68.2**, 45.0×72.0, 48.0×76.5, 51.0×81.0 |
| Femoral catalogue | Sizes 1-8: 52.0×58.0 … **58.4×64.1** (size 4) … 70.0×77.0 |
| Where defined | **Three copies** of the tibial table (`tkr_templates.ts:37`, `tibial_geometry.ts:16`, `backend/core/calculations/planning.py:27`) and three of the femoral (`tkr_templates.ts:46`, `femoral_geometry.ts` per-size, `planning.py:38`) |
| Provenance | **Hard-coded, no manufacturer source.** The PDF gives only *one* example pair per component and labels them **radiographic patient dimensions** ("Radiographic AP 42.5 / ML 68.2"; femoral 58.4 / 64.1). The code uses exactly those numbers as the **implant** dimensions of size 3 and size 4 and interpolates the other sizes. → **ENGINEERING_DERIVATION; CLINICAL_APPROVAL_REQUIRED** |
| Tibial footprint | The *same* normalised plateau contour scaled to the implant AP/ML (`transverseTrayPolygon`, `tibial_geometry.ts` `generateTibialSizeGeometry`) — a tray that is by construction a scaled copy of the bone contour. Side-view polygons (`flapPolygon`, `klatPolygon`, insert/baseplate/keel/stem) are schematic: insert 6 mm, tray 4 mm, stem 36 mm, keel width `min(36, 0.52·ML)` |
| Femoral footprint | Pre-computed 68-point condylar outline (flap) + 16-point sagittal outline per size (`femoral_geometry.ts`, 750 l, generated numbers; no generator script in repo) |
| Positioning | `x_offset_mm`, `y_offset_mm` (+ posterior), `rotation_deg`; ML on AP scan, AP on lateral scan; no varus/valgus or flexion/slope (explicitly out of V1 scope per PDF) |
| Configurable? | No: neither DB-driven, case-driven nor admin-configurable. Thresholds are `DEFAULT_TIBIAL_FIT_THRESHOLDS` constants with an injectable parameter that no caller overrides |

---

## 17. Fit & sizing

### 17.1 Frontend engine (the one that runs) — `dashboard/src/lib/data/tkr_templates.ts`

**Tibial** (`evaluateTibialFit`, `:229`): coverage = area(tray ∩ bone)/area(bone) (Sutherland-Hodgman clipping, `tibial_geometry.ts`). Overhang per edge = max distance of any densified tray point (1 mm spacing) lying outside the bone to the bone boundary, bucketed to medial/lateral/anterior/posterior by direction (`outlineOverhang`, `:195`). Tones: coverage ≥90 % pass, 85-90 % warn, <85 % fail; overhang ≤1.0 mm pass, ≤1.5 warn, >1.5 fail. Verdict = worst of five → `ACCEPTABLE FIT | BORDERLINE FIT | POOR FIT` (legacy stored string `CAUTION: Overhang > 1.5mm` still read).

**Femoral** (`evaluateFemoralFit`, `:319`): AP/ML coverage = overlap of the component's bounding extents with the bone box ÷ bone dimension; notching = anterior gap `max(0, …)` with limit `FEMORAL_NOTCH_LIMIT_MM = 0.5`; verdict `ACCEPTABLE | BORDERLINE | CAUTION: Anterior Notch Risk | POOR`. Medial/lateral/posterior overhang is reported but ignored in the verdict (no approved limit).

**Sizing helpers** (`fit_markers.ts`): `rankTibialSizes/rankFemoralSizes` score every size at the origin, `autoFitTibial/Femoral` grid-search ±4 mm at 0.2 mm; `fit_advice.ts` turns results into text. `suggestTibialSize` (nearest ML) / `suggestFemoralSize` (nearest AP) also exist.

### 17.2 Backend engine (dead code) — `backend/core/calculations/planning.py`

`evaluate_tibial_fit` (`:90`) is a **parametric model, not geometry**: `coverage = (impl_AP/patient_AP)·(impl_ML/patient_ML)·100 − 0.8·(|x|+|y|)`, clamped to **[60, 99.5]**, defaults for the patient bone (43 × 69 mm) when omitted; verdict set `CAUTION > 1.5 mm | POOR (<85 %) | ACCEPTABLE`. `evaluate_femoral_fit` (`:137`) similarly synthetic (`−0.5·|offset|`, clamped 60-100; notching from posterior shift/undersize). `calculate_mhka` returns the **included** angle (≈180°); `calculate_pts` returns **|90 − included|** (unsigned). **No endpoint calls any of it** (only `calculate_calibration` is used); it is covered by 7 backend unit tests. It *conflicts* with the frontend engine in formulas, thresholds, vocabulary and angle conventions (DC-03/DC-04/DC-08/DC-09) and is the engine docs 02/05/07 name as authoritative.

### 17.3 Threshold provenance

| Threshold | In PDF? | Where else | Class |
|---|---|---|---|
| Tibial coverage ≥ 90 % | **Yes** | doc 09, 21 | SOURCE_VERIFIED |
| Medial/lateral overhang ≤ 1.0 mm | **Yes** | doc 09, 21 | SOURCE_VERIFIED |
| Overhang > 1.5 mm = caution | **Yes** ("amber/red … CAUTION: Medial Overhang > 1.5mm") | doc 09 | SOURCE_VERIFIED |
| Coverage < 85 % = poor | No | doc 09 ("below 85 %") | PROJECT_RULE → CLINICAL_APPROVAL_REQUIRED |
| Anterior/posterior overhang tolerances (tibial) | No (PDF lists medial & lateral only) | code reuses 1.0/1.5 | ENGINEERING_DERIVATION |
| Femoral AP/ML coverage ≥ 90 % | **Yes** (examples 97.1 %/95.8 %; "acceptable" ≥ 90 % is implied by reuse of Page 2 model) | doc 09 | PROJECT_RULE (implied) |
| Femoral notching "0.0 mm flush" | **Yes** (value shown) | – | SOURCE_VERIFIED |
| Femoral notching limit 0.5 mm | No | doc 09 | PROJECT_RULE → CLINICAL_APPROVAL_REQUIRED |
| `PLAUSIBLE` bone-size window (0.75×-1.3× catalogue) | No | code | ENGINEERING_DERIVATION |

Doc 21 §13 forbids generalising thresholds "beyond approved configuration"; the engine does (DC-08).

---

## 18. Plan state & persistence

| Question | Answer |
|---|---|
| Where is a plan stored? | `PLANS: PlanRecord[]` + `PLAN_BY_ID: Map` — module-level arrays in the Next.js server process (`lib/data/plans.ts:103`, seeded with 6 + one-per-seed-session plans) |
| Survives page refresh? | Yes (server memory) — *unless* the dev server hot-reloads the module |
| Survives restart / redeploy / second replica / serverless? | **No** (README says so explicitly) |
| Survives logout? | Yes, same process; keyed by `userId` |
| Shared between users? | One global array; access by `userId` filter in `getPlan` — **but staff (`instructor`/`admin`) can open any plan in the process regardless of institution** (`lib/data/plan.ts:133-140`) |
| Lock (`isReadyForVr`, `lockedVersion`) | Set by `sealTkrPlan` (`actions/index.ts:376`): requires owner, measured assessment, confirmed tibial & femoral, verified scales; builds payload from stored `v1_*` (no re-computation) and `patient_id` from a hard-coded map (`SYNTH-VARUS-001→P-0247`, `SYNTH-VALGUS-001→P-0891`, else the case id); knee side from the case; stores a JSON deep copy |
| **Post-lock mutation** | **Allowed**: `updatePlanPayload` (`:321`) merges any `updates` into `plan.payload` with only an owner check; `lockedVersion` snapshot stays unchanged but `payload` and flags diverge; **re-sealing overwrites `lockedVersion`** (no `if (plan.isReadyForVr) return` guard) |
| Sent-plan mutation | "Sent" does not exist |
| Client-authored values | `updatePlanPayload(planId, updates: Record<string,unknown>)` accepts arbitrary keys (`v1_assessment`, `scan_calibration`, `v1_tibial`…) with **no schema validation** |
| Deletion/versioning | none; plans can be created on demand for any case id the user can read (`getPlan` "planId may be a case id" branch) |
| Next.js behaviour | A server action cannot be skipped by hiding a button; both actions call `getCurrentUser()` (good), but mutation rules above are absent |

The `dirty`/`beforeunload` guard in `planHooks.ts:useSaveStatus` exists *because* persistence is memory-only.

---

## 19. VR integration

| Capability | Status | Evidence |
|---|---|---|
| Plan serialisation | **IMPLEMENTED (shape only)** | `V1VrPayload` (`lib/plan.ts`) + builder in `sealTkrPlan`; matches the PDF/doc 10 JSON exactly (patient_id, knee_side, 6 assessment values, 2 components × size + `position_2d`) |
| JSON schema (formal) | **NOT IMPLEMENTED** | TypeScript type only; no JSON-Schema, no backend model; the backend `ReferencePlan` model has a *different* shape |
| Plan transfer | **PLACEHOLDER** | UI banner; `mintPin` returns "not running yet"; no endpoint |
| REST for VR | **NOT IMPLEMENTED** | no `/attempts`, `/plans`, pairing |
| WebSocket | **NOT IMPLEMENTED** | no `@router.websocket`, no client sockets (`LiveMirror.tsx` documents that it "subscribes to nothing") |
| Event ingestion / idempotency / sequence numbers / retries / reconnection | **NOT IMPLEMENTED** | doc 10 only |
| Assessment results, acknowledgements | **NOT IMPLEMENTED** | scoring functions in `core/calculations/assessment.py` are not wired |
| VR client | **Outside repository** | – |

---

## 20. Learner workflow (real routes)

`/login` (Learner ID + password) → `/` learner dashboard → `/programs` (real, enrolled via cohort) → `/programs/[id]` → `/cases` (**real published cases for enrolled programs + the 13 seed cases for everyone**, `lib/data/cases.ts:214`) → `/cases/[id]` (real or seed) → **Start planning** (`startPlan`) → `/plan/[id]/assessment → tibial → femoral → review` → *(lock)* → **dead end** (VR pairing "not connected") → `/sessions`, `/sessions/[id]/report`, `/performance`, `/activity`, `/reports` (all **seed**; a real learner's id has no seed sessions, so these render empty/"not tracked") → `/personal-cases` (real; resident role only) → `/settings` (real profile + password change; PIN panel seed) → `/plans` (in-memory plans + seed PINs).
Instructor feedback written about a learner's session is **not readable by the learner** — `GET /residents/{id}/feedback` is instructor-only and the report page loads it only for instructor/admin personas, contradicting the documented "revisit feedback" loop.

## 21. Instructor workflow

| Area | Reality |
|---|---|
| Dashboard `/` | `InstructorDashboard` built from seed cohorts/sessions (`dashboard.ts`) — **not** the instructor's real cohorts |
| Programs / Cohorts / Learners / Sessions (scheduling) | **Real**: `/programs`, `/programs/[id]` (tabs Cohorts/Learners/Activities/Performance*), `/programs/[id]/cohorts/[cohortId]`; create program/cohort/learner, add existing learner, assign cases, create/edit/cancel session, roster. (*Performance tab is seed.) `/cohorts`, `/learners` redirect to `/programs` |
| Case authoring/publishing | **Real** (`/cases/new`, `/cases/[id]/edit`) + legacy `/content` (partly broken, §10) |
| Resident detail `/learners/[id]` | Identity/cohort/notes/assignments/feedback **real**; performance **seed/"Not tracked yet"** |
| Reports / analytics / monitoring | **Seed/UI-only** |
| Admin | **Real**: `/admin/instructors`, `/admin/institutions` |
| Stability | *Recently changed:* programs/cohorts tabs (`f5732d3`), case authoring (`72ebac3`, `f5732d3`), admin (`27fbdfd`). *Stable:* auth, cohorts service (isolation tests). No rewrite is recommended by evidence |

---

## 22. Frontend data truth

| Screen / route | Data comes from |
|---|---|
| `/login`, `/forgot-password`, `/reset-password`, `/settings` (profile, password) | **REAL BACKEND / DB** (Supabase Auth) |
| `/programs*`, cohort pages, learner provisioning, case assignment, session scheduling | **REAL BACKEND / DB** |
| `/cases`, `/cases/[id]` (+edit/new) | **REAL DB + STORAGE** *merged with* **SEED** (13 cases appear for everyone) |
| `/personal-cases*` | **REAL DB + STORAGE** |
| `/learners/[id]` notes/assignments/feedback | **REAL DB**; performance block **SEED** (renders "not tracked") |
| `/admin/*` | **REAL** |
| `/plan/[id]/*`, `/plans` | **LOCAL SERVER STATE** (in-memory) + seed plans + seed PINs; case content from seed or DB |
| `/` (both dashboards), `/activity`, `/performance*`, `/reports`, `/sessions*`, `/sessions/[id]/report` scores | **SEED** (`lib/seed.ts`, `rollups.ts`, `performance.ts`, `sessions.ts`); `CURRENT_USER = PROFILES[0]` is the default identity for seed scopes (`scope.ts`) |
| `/simulations*`, `/setup`, `/library*`, `/help`, `/content` Procedures/Criteria tabs | **SEED / HARD-CODED** (`catalogue.ts`, `support-content.ts`, `planning-content.ts`) |
| `/kit` | design kit (404 in production) |
| `/[...slug]` | "Not built yet" for `telemetry`, `replay`, `assessments`, `presets`, `join` |
| Actions that validate then **refuse to save** | `assignPreset`, `saveInstructorConfig`, `saveProcedureStep`, `saveAssessmentCriterion`, `saveCaseImaging` (legacy `/content`), `savePlanStep` — each returns an explicit "not connected" message |
| `localStorage`/`sessionStorage` | none |

Seed volume: 13 cases (11 `CASE_xxx` + 2 synthetic), 7 profiles, 2 cohorts, 22 sessions, 20 reports, 530 scene results, 4 procedures, 12 parts, 31 scenes. The seed also states "Authentication is not wired up yet" (`seed.ts:184`) — stale.

---

## 23. Backend API inventory

Base `/api/v1`. "Auth" = valid active user via `get_current_active_user` (Supabase `get_user` + `users` row). 55 route/method pairs (trailing-slash aliases excluded). Error handling pattern: `ValueError → 400/404`, many handlers return `detail=str(exc)` (leaks SQL/Storage text); a global handler converts anything else to a generic 500 (`main.py:32`). No pagination anywhere; ordering fixed per query. **Tested** = covered by a backend test that runs without a database.

| Method + path | Auth / role | Scope check | Service → tables | Tested |
|---|---|---|---|---|
| GET `/health`, `/ready` | none | – | stub (`/ready` never checks DB) | – |
| POST `/auth/login` | public | – | `auth_service.authenticate_*` → Supabase Auth, `users` | – (**back-door**) |
| GET `/auth/me`; PATCH `/auth/me` | any | self | `users` | – |
| POST `/auth/logout` | any | self | Supabase admin sign-out | – |
| POST `/auth/change-password` | any | self | Supabase | ✔ service (7) |
| POST `/auth/forgot-password`; `/auth/reset-password` | public | recovery token | Supabase | – |
| GET/POST `/programs`; GET `/programs/enrolled`; GET `/programs/{id}`; GET `/programs/{id}/cohorts` | any / instructor+admin for write | `institution_id`; learner via enrolment | `programs`, `cohorts`, `cohort_members` | – |
| GET/POST `/cohorts/`; GET `/cohorts/{id}` | instructor/admin | `cohorts.owner_id` | `cohorts`, `cohort_members`, `users` | partly ✔ (isolation) |
| POST `/cohorts/{id}/learners/new` | instructor/admin | owner | Supabase Auth + `users` + `cohort_members` | – |
| POST `/cohorts/{id}/learners/existing` | instructor/admin | owner + same institution | `cohort_members` | ✔ |
| PUT/GET `/cohorts/{id}/cases` | instructor/admin | owner + case institution | `cohort_case_assignments` | ✔ |
| POST/GET `/cohorts/{id}/sessions`; PUT `/cohorts/sessions/{sid}`; POST `/cohorts/sessions/{sid}/cancel`; GET `/cohorts/sessions/{sid}/residents` | instructor/admin | owner | `sessions`, `session_residents` | ✔ schema/status only |
| GET/POST `/cases`; GET `/cases/{id}`; PUT+PATCH `/cases/{id}`; POST `/cases/{id}/publish`, `/deactivate` | instructor/admin (learner: GET only) | `cases.institution_id` (learner: enrolment) | `cases_service` → 7 case tables | ✔ isolation (service level); publish checklist ✔ |
| GET `/cases/{id}/preview` | instructor/admin | **none for published cases** (§26 S-05) | `get_learner_case_detail(user_id=None)` | – |
| POST `/cases/upload-asset` | instructor/admin/**resident** | none (no case) | Storage `imaging/cases/assets/…` | – |
| POST `/cases/{id}/upload-radiograph` | instructor/admin | institution | Storage + `case_imaging` | – |
| GET `/procedures` | instructor/admin | shared reference data | `procedures`, `procedure_steps` | – |
| GET `/residents/{id}` ; GET/POST `…/notes`, `…/assignments`, `…/feedback` | instructor/admin | resident must be in a cohort the caller owns | `instructor_notes`, `training_assignments`, `instructor_feedback` | – |
| GET `/residents/{id}/sessions` | self or supervising instructor | supervised check | `sessions`, `session_residents` | ✔ |
| GET `/admin/institutions`; GET/POST `/admin/instructors` | **admin only** | cross-institution by design | Supabase Auth + `users`, `institutions` | ✔ (14) |
| GET/POST `/personal-cases`; GET/PUT/PATCH/DELETE `/personal-cases/{id}`; POST `…/upload-radiograph` | **role == "resident"** only | `owner_user_id` | `learner_personal_cases`, `…_imaging`, Storage | – |

**Documented but absent** (doc 07): `PATCH/DELETE /programs/{id}`, `PATCH /cohorts/{id}`, `GET /cohorts/{id}/residents|performance`, `POST /cohorts/{id}/assignments`, `GET /residents`, `/residents/{id}/cases|attempts|skills|recommendations`, `GET/POST /sessions*`, all `/attempts*`, `/assessment/*`, WebSocket. **Present but undocumented:** admin API, personal cases, session management under `/cohorts`, training assignments, notes/feedback, `PATCH /auth/me`, forgot/reset password, `upload-asset`.
**Duplicate/dead:** `content_service.{list,get,create,update}_case` (superseded by `cases_service`); PUT and PATCH on `/cases/{id}` and `/personal-cases/{id}` map to the same handler; `core/calculations/{planning,assessment}.py` have no route.

---

## 24. Database audit

**Source of truth for schema = `backend/migrations/001…012`** (hand-written SQL, no migration-tracking table). The Supabase project's real state is **UNKNOWN**.

| # | File | Creates / alters |
|---|---|---|
| 001 | `001_auth_tables.sql` | `institutions`, `users`, `set_updated_at()`, triggers |
| 002 | `002_cohort_tables.sql` | drops `users.cohort_id`; `programs`, `cohorts`, `cohort_members` |
| 003 | `003_programs_metadata.sql` | `programs.description`, `programs.status` (no CHECK) |
| 004 | `004_case_library.sql` | **ALTERs `cases`, `assessment_criteria`, reads `skills`/`programs`** — but those tables are created in **005**; adds `case_programs`, `case_versions`, `case_imaging`, `case_version_reference_plan`, version pointers; backfills; seeds 4 skills per existing program |
| 005 | `005_content_tables.sql` (header says "004") | `procedures`, `procedure_steps`, `cases`, `skills`, `skill_items`, `assessment_settings`, `assessment_criteria` |
| 006 | `006_seed_tkr_procedure.sql` (header "005") | TKR procedure + 12 steps (idempotent) |
| 007 | `007_sessions_and_case_assignments.sql` | `sessions`, `cohort_case_assignments`, 4 **non-idempotent** policies |
| 008 | `008_sessions_update.sql` | `sessions.duration INTEGER NOT NULL` (**no default** → fails if rows exist), `description`, `is_cancelled`; drops `status` |
| 009 | `009_instructor_notes_and_feedback.sql` (header "006") | `instructor_notes`, `instructor_feedback` |
| 010 | `010_training_assignments.sql` (header "007") | `training_assignments` (`case_id TEXT`) |
| 011 | `011_session_case_and_roster.sql` | `sessions.case_id/instructor_id/mode`, `session_residents`, idempotent policies |
| 012 | `012_learner_personal_cases.sql` | `learner_personal_cases`, `learner_personal_case_imaging` |

### Current schema map (24 tables)

| Table | PK / key FKs (delete rule) | Unique | Notable columns & CHECKs | Indexes | RLS |
|---|---|---|---|---|---|
| `institutions` | id | – | name | name | on / 0 policies |
| `users` | id (= `auth.users.id`) → `institutions` RESTRICT | email, learner_id | role ∈ {instructor, student, intern, resident, surgeon, admin}; status ∈ {active, inactive, suspended}; default_difficulty ∈ {beginner, intermediate, expert}; **no `password_hash`** | institution, role, partial email/learner_id | on / 0 |
| `programs` | → `institutions` CASCADE | – | description, status (free text) | institution | on / 0 |
| `cohorts` | → `programs` CASCADE; owner → `users` RESTRICT | – | – | program, owner | on / 0 |
| `cohort_members` | cohort CASCADE, user CASCADE | (cohort, user) | joined_at | cohort, user | on / 0 |
| `procedures`, `procedure_steps` | steps → procedures CASCADE | (procedure, step_number) | version, required | name | on / 0 |
| `cases` | institution CASCADE; program (nullable after 004) RESTRICT; procedure RESTRICT; draft/published version SET NULL | – | status ∈ {draft, active, inactive}; difficulty CHECK; `version` int | program, procedure, status, difficulty — **no index on `institution_id`** (filter in every query) | on / 0 |
| `case_programs` | case CASCADE, program CASCADE | (case, program) | – | case, program | **OFF** |
| `case_versions` | case CASCADE; created_by SET NULL | (case, version_number) | side ∈ {left, right} (lowercase); difficulty CHECK; status ∈ {draft, published, archived}; `is_immutable` (**no trigger/constraint prevents UPDATE of an immutable row**) | case, status | **OFF** |
| `case_imaging` | version CASCADE | – | `view_type` TEXT (no CHECK); `calibration` JSONB; laterality ∈ {left,right}; no display_order / learner_visible | version | **OFF** |
| `case_version_reference_plan` | version CASCADE | version | JSONB blobs, no shape CHECK | version | **OFF** |
| `skills` | program CASCADE | – | weight NUMERIC CHECK 0-100 (seeded as 0.30/0.25 → two scales) | program | on / 0 |
| `skill_items`, `assessment_settings` | – | settings: program | **no code reads or writes either** | – | on / 0 |
| `assessment_criteria` | case RESTRICT; skill RESTRICT; case_version CASCADE | – | tolerance_min ≤ tolerance_max | case, skill, case_version | on / 0 |
| `sessions` | cohort CASCADE; case SET NULL; instructor SET NULL | – | mode ∈ {training, assessment}; **status derived at read time from `scheduled_at+duration`, not stored** | cohort, case | on / **2** |
| `cohort_case_assignments` | cohort CASCADE, case CASCADE | (cohort, case) | due_date, required, "order" (unused) | cohort, case | on / **2** |
| `session_residents` | session CASCADE, resident CASCADE | (session, resident) | status ∈ {assigned, in_progress, completed, cancelled} | session, resident | on / **2** |
| `instructor_notes`, `instructor_feedback` | resident CASCADE; instructor RESTRICT | – | `attempt_id` is an unconstrained UUID | resident (+instructor/attempt) | on / 0 |
| `training_assignments` | resident CASCADE; cohort SET NULL; assigned_by RESTRICT | – | `case_id TEXT` (seed ids) | resident, status | on / 0 |
| `learner_personal_cases`, `…_imaging` | owner CASCADE; imaging → case CASCADE | – | unversioned | owner / case | **OFF** |

Functions/triggers: `set_updated_at()` + `trg_*_updated_at` on most tables (001, 002, 005, 007). Enums: none (CHECK constraints). **Policies** (007, 011) use `auth.uid()`; they protect only direct PostgREST access, which the app does not use. RLS-enabled-without-policy ≡ deny-all for `anon`/`authenticated`; the six **OFF** tables are readable/writable by those roles *if* Supabase exposes `public` through PostgREST and default grants are unchanged — **live state UNKNOWN, must be verified**.

### Defects & drift

1. **Migration chain not replayable on an empty database** *(static evidence)*: 004 requires 005's tables; 008 `NOT NULL` without default; 007 policies not idempotent; headers of 005/006/009/010 state wrong numbers (renumbering commit `19a01c2`); no ledger of what is applied (`apply_migration.py` runs a single file; imports `backend.core.config`, which only works from the repo root).
2. Orphaned schema: `skill_items`, `assessment_settings`, `cohort_case_assignments."order"`, `procedure_steps` (counted only), `cases.program_id` (legacy; `create_case` no longer sets it — `get_instructor_case_detail` still selects it).
3. Duplicate concepts: *two* notions of "session" (scheduled vs performed); *two* case catalogues (DB vs seed); `training_assignments` vs `cohort_case_assignments` vs `session_residents`; `cases.status` vs `case_versions.status`; `cases.version` vs `case_versions.version_number`.
4. Missing integrity: `programs.status` unchecked; `case_imaging.view_type` unchecked; `case_versions` immutability enforced only in application SQL (`WHERE is_immutable = false` on one UPDATE); `training_assignments.case_id` not an FK; one-cohort-per-program rule not constrained.
5. **Orphaned Drizzle history** in `dashboard/drizzle/` describes a *different* schema (`cases(title, procedure, pathology, side, …)`, `plan_measurements`, `attempts`, `assessment_results`, …); `0001` is empty; nothing imports Drizzle. Do not apply.
6. `backend/db_backup_pre_reset.{json,sql}` shows only 5 users / 4 programs / 3 cohorts existed at 2026-09-22.

---

## 25. Storage / upload audit

| Check | Finding |
|---|---|
| Endpoints | `POST /cases/upload-asset`, `POST /cases/{id}/upload-radiograph`, `POST /personal-cases/{id}/upload-radiograph`; Next server-action body limit `10mb` (`next.config.ts`) and wizard-side 10 MB check only in the legacy `saveCaseImaging` |
| File-size limit (backend) | **None** — `await file.read()` loads the whole file into memory (`cases.py:189-250`) |
| MIME / magic-byte validation | **None.** Content type is taken from the client header and stored with the object; extension is only used to *choose a suffix* (`.jpg/.jpeg/.png/.dcm/.dcim`, else forced `.jpg`) |
| Filename/path handling | `upload-asset`: `os.path.basename`, spaces→`_`, 8-hex prefix; radiograph: `cases/{case_id}/{view}_{8hex}{ext}`; `view_type` unvalidated and used in the path (lower-cased) |
| Bucket / signed URLs | Single bucket `imaging` (existence, privacy, policies **UNKNOWN**); service-role upload; 3 600 s signed URL generated on read (`cases_service.py:36`, `personal_cases_service.py`) |
| Authorization | Upload-radiograph checks institution; **`upload-asset` has no ownership concept** (any instructor/admin/resident) |
| **Path trust** | `CaseImagingCreate.storage_path` and personal-case `imaging[].storage_path` come from the client and are later signed with the service key — a caller who learns another tenant's object path can obtain a signed URL (S-06) |
| Cleanup / duplicates | None: replaced/removed images (`DELETE FROM case_imaging …`) leave Storage objects behind; failed DB insert after a successful upload leaves an orphan object |
| DICOM | `.dcm/.dcim` accepted; parsed client-side with `dicom-parser`; viewer loads codec/worker from `https://unpkg.com/...@4.13.2` at run time (`DicomViewer.tsx:32`) |
| Excel | No Excel upload or parser exists in the application (two `.xlsx` files sit in `images(cases)/` unused) |
| Error handling | Raw storage exception text returned in 500 `detail` |

---

## 26. Security audit (read-only)

| ID | Sev | Finding | Evidence | Consequence |
|---|---|---|---|---|
| S-01 | **CRITICAL** | Hard-coded "sync" passwords reset any account's password on a failed login | `auth_service.py:108,111-160,164-205` | Full account takeover incl. admin; needs only an email/Learner ID |
| S-02 | **CRITICAL** | Postgres connection string with password committed since the first commit; same password present in local `backend/.env`; publishable Supabase key hard-coded | `backend/test_db.py:3` (`3ba38ea`), `backend/test_supabase_http.py:4` | Database compromise if repo/history is shared; **rotate + purge** |
| S-03 | HIGH | Plan lock/validation not server-enforced; plan payload client-authored; in-memory store | `actions/index.ts:321,376`; `plans.ts:103` | Falsified/mutated "locked" plans; data loss on restart |
| S-04 | HIGH | 6 tables lack RLS (`case_versions`, `case_imaging`, `case_version_reference_plan` — the instructor-only answer key — `case_programs`, both personal-case tables); live state UNKNOWN | `004_…sql`, `012_…sql` | Possible direct PostgREST read/write with the public anon key |
| S-05 | HIGH | Cross-tenant gaps: (a) `GET /cases/{id}/preview` returns any *published* case to any instructor/admin (`cases.py:89` → `get_learner_case_detail(user_id=None)`, `cases_service.py:332-396` has no institution filter); (b) `program_ids` on create/update are inserted without checking they belong to the caller's institution (`:462,642`); (c) `assessment_criteria.skill_id` unchecked and the UI uses **hard-coded skill UUIDs** from one database (`app/cases/new/page.tsx:22-26`, `[id]/edit/page.tsx:31`); (d) staff can open any in-memory plan (`plan.ts:133`) | – | A cross-institution case becomes visible to another institution's learners; reference data can be previewed across tenants |
| S-06 | MEDIUM | Client-supplied `storage_path` is signed with the service role | `cases_service.py` create/update imaging; `personal_cases_service.py:76` | Cross-tenant object read if path known (paths contain a UUID + 8 hex) |
| S-07 | MEDIUM | Uploads: no size/type/magic checks; whole file in memory; client content-type stored; orphan objects | §25 | DoS, stored-content abuse |
| S-08 | MEDIUM | No rate limiting/lockout/CAPTCHA on login/reset; temp passwords & Learner IDs from non-CSPRNG `random`; fixed 1 h session without refresh; `secure` cookie only in production; tolerant cross-type login fallbacks | `cohorts_service.py:190`, `auth_service.py:597`, `actions/index.ts:92` | Brute force / predictability |
| S-09 | MEDIUM | Verbose errors: many handlers return `detail=str(exc)` (SQL, storage) | `cases.py`, `personal_cases.py`, `cohorts.py` | Information disclosure |
| S-10 | MEDIUM | No audit trail for logins, password changes, role/case/publish/lock actions (doc 12 requires one) | no table / no logging | Cannot attribute changes |
| S-11 | LOW | Personal-case & upload routes accept only `role == "resident"` (3 of 4 learner roles locked out) — an authorization *inconsistency*, not an exposure | `personal_cases.py:23`, `cases.py:197` | Functional bug |
| S-12 | LOW | Runtime scripts from `unpkg.com`; no CSP/security headers in `next.config.ts`; dev servers inside container images | `DicomViewer.tsx:32`, Dockerfiles | Supply-chain / hardening |
| S-13 | LOW | 186 CT DICOMs with populated PatientName/PatientID tags and a DB snapshot with names/emails committed; provenance of the DICOMs UNKNOWN; `scratch/run_migration.py` prints the DB URL | `images(cases)/`, `backend/db_backup_*` | Possible PHI/PII in VCS |
| S-14 | INFO | **Positive controls**: parameterised SQL everywhere (two f-string SQL sites use whitelisted/model-derived column names: `content_service.py:179`, `personal_cases_service.py:147`); no `dangerouslySetInnerHTML`/`eval`/subprocess; open-redirect guard on `next` (`actions/index.ts:102`); learner projection strips reference data in SQL; recovery-token method/age check; service-role key never in the browser (`NEXT_PUBLIC_*` only carries the API URL); CORS origins configured, not `*`; password-reset always 202; admin API cannot create learners; tenant-isolation tests exist | – | – |
| S-15 | INFO | `.env`, `backend/.env`, `dashboard/.env.local` exist and are git-ignored; **two divergent backend env files** (`env_file="../.env"` vs scripts using `backend/.env`) | `core/config.py`, `scripts/*` | Config drift |

No SQL injection, XSS sink, command execution, debug endpoint, or CORS wildcard was found. OpenAPI JSON/docs are served by default.

---

## 27. Testing audit

| Suite | Framework | Count | Result | Notes |
|---|---|---|---|---|
| Dashboard unit tests | `node:test` via `tsx --test` | **214** results reported by the runner (44 top-level; 14 files). Static `it()/test()` declarations per file — calibration pipeline 19, content 30, assessment geometry 6, fit markers 8, fit advice 4, fit map 3, scan scale 4, V1 workflow 5, demo cases 3, learner dashboard 2, program nav 3, session order 3, password change 2, case authoring 1 — under-count data-driven cases | **PASS 214/214**, 0 skipped | Pure logic only (no React rendering, no server actions, no HTTP) |
| `npm test` as defined | `package.json` → quoted globs + `src/lib/server/calculations/engine.test.ts` (**0-byte file**) | – | **FAIL** on Windows: "Could not find '…\*.test.ts'" (shell does not expand globs) — ENVIRONMENTAL/tooling; passes when files are listed explicitly | doc 13's "28/28" is stale |
| Backend unit/integration (DB-free) | `unittest` + FastAPI `TestClient` with patched services/fake cursor | admin 14, change-password 7, isolation 10, sessions 10, calculations 7 = **48** | **PASS 48/48** | 2 further tests in `test_case_authoring.py` (`test_seeded_case_retrieval_and_layer_separation`, `test_create_case_draft_foreign_key_resolution`) connect to the **live** database (the latter inserts and deletes a case) — **deliberately NOT run** |
| API tests vs real DB / RLS tests / migration tests | – | **NOT AVAILABLE** | – | – |
| E2E / browser | – | **NOT AVAILABLE** | – | – |
| VR contract | – | **NOT AVAILABLE** | – | – |
| CI | – | none (no workflow files) | – | – |

**Gaps vs documentation** (doc 13/19): no tests for lock/seal server actions, plan persistence, override audit, locked-plan transfer, FLAP/KLAT toggle UI, review completeness, post-op review, instructor feedback visibility to residents; no golden assessment tests; no VR contract tests; backend fit/assessment functions are tested although unused, while the **frontend engine that actually runs is tested only at function level**.

---

## 28. Build / type / lint health

| Check | Command (read-only) | Result | Classification |
|---|---|---|---|
| TypeScript | `npx tsc --noEmit` (strict) | **exit 0, no errors** | – |
| ESLint | `npx eslint src -f json` | **81 errors, 30 warnings** over 242 files; rules: `no-explicit-any` 72, `no-unused-vars` 22 (warn), `react-hooks/set-state-in-effect` 5, `no-img-element` 4, `ban-ts-comment` 2, `no-require-imports` 2, `role-has-required-aria-props` 2, `exhaustive-deps` 1 | **65 errors are in files unchanged since HEAD → PRE-EXISTING** (e.g. `actions/cases.ts` 13, `actions/personal-cases.ts` 7, `personal-cases/**` 6, `lib/data/cohorts.ts` 6, `lib/api-client.ts` 5, `lib/data/cases.ts` 5). **16 are in files modified/created in the working tree** (`CaseAuthoringWizard.tsx` 6, `actions/index.ts` 3, `calibration_pipeline.test.ts` 2, and 1 each in `XRayCanvas`, `FitMarkerLayer`, `ScanViewport`, `planHooks`, `coordinates`) → RECENT-or-PRE-EXISTING **UNKNOWN per line** |
| Frontend tests | explicit file list | 214/214 pass | – |
| Backend tests | safe subset | 48/48 pass | – |
| Next.js build | **not run** (it rewrites git-ignored `.next/`, which a running dev server may use) | SKIPPED | UNKNOWN |
| Migration check | none available; static review only | NOT AVAILABLE | – |

Running `tsc` may have refreshed the git-ignored `tsconfig.tsbuildinfo`; no tracked file changed (`git status` count unchanged at 47 entries before the report was added).

---

## 29. Git history & recent changes

Timeline (35 commits, 2026-09-16 → 2026-10-05): initial auth/dashboard/backend (`3ba38ea`) → cohorts (`284d458`) → V1 TKA planner + synthetic cases (`480b983`) → content/case library (`4620b62`…`0359467`, `2beabf9`) → Supabase auth/password change (`ca08d29`) → case library/authoring backend (`60123b4`, `2d49bf3`) → resident detail/feedback (`80f4045`) → learner dashboard (`bb50c36`) → migration renumbering (`19a01c2`) → session case+roster (`8fd107f`) → admin instructors (`27fbdfd`) → personal cases (`72ebac3`) → DICOM sample images (`fdfdd65`, +186 files) → planning/auth/instructor refactor (`f5732d3`).

| Change | Previous behaviour | Current behaviour | Files | Impact / limitation |
|---|---|---|---|---|
| **Seal no longer fabricates data** *(uncommitted)* | `sealTkrPlan` fell back to the PDF's sample assessment/components when none existed and guessed knee side from the case id (`includes("VALGUS")`) | Requires measured assessment, confirmed components, verified scales on both scans; knee side from the case | `actions/index.ts` | Closes a clinically dangerous default. Still trusts client values and has no lock guard (§18) |
| **Fit engine rewritten** *(uncommitted)* | Tibial fit used bone width from a patient ML/AP input, overhang from tray *bounding box* ML only; verdict `ACCEPTABLE / CAUTION >1.5 / POOR`; femoral notch = anterior gap | Four bone-edge markers → bone ML/AP → generic contour; polygon intersection and 4-edge overhang; 3-level verdict; size ranking; auto-fit; fit map | `tkr_templates.ts`, `tibial_geometry.ts`, new `fit_*`, `FitMap*`, `useFitSession` | Adds thresholds absent from the PDF (§17.3); doc 09 updated accordingly |
| **Calibration hardened** *(uncommitted)* | `normalizeCalibration` returned `isValid:true` for any stored scale and silently defaulted to 0.264 | Valid only if realistic (0.05-1.5) and not flagged invalid; per-scan plan-measured scale; stale-confirmation detection | `coordinates.ts`, new `scan_scale.ts`, `useScanCalibration.ts` | Backend/seed still mark synthetic 0.264 as valid |
| **Assessment from 13 landmarks** *(uncommitted)* | Landmark-set subset with defaults | `assessment_geometry.ts` (no defaults, pixel-space maths, side-aware angles) + guide | new files | Definitions differ from PDF (§12) |
| Auth: forgot/reset password, profile PATCH (`f5732d3`, `ca08d29`) | – | Implemented | `auth.py`, `auth_service.py`, `(auth)/*` | – |
| **Back-door passwords** (`d65b449`, 2026-09-29) | – | Present at HEAD | `auth_service.py` | **S-01** |
| Case authoring + personal cases (`60123b4`, `2d49bf3`, `72ebac3`) | – | Versioned case library; learner private cases | `cases*`, `personal_cases*`, migrations 004/012 | Dual UI/legacy `/content` remains |
| Planning "retire seven-step flow" (`1c06568`, `f5732d3`) | 7-step planner with PIN panel | 4-step TKR planner; legacy routes redirect | `plan/[id]/step/*`, `saved` | `LEARNER_FLOW_PLAN.md` still describes the old files |
| Instructor programs/cohort tabs refactor (`f5732d3`) | Monolithic pages | `_instructor/*Tab.tsx` | `programs/[id]/**` | – |
| DICOM sample import (`fdfdd65`) | – | 186 CT files (107 MB) | `images(cases)/` | Unused; PHI question |

---

## 30. Legacy / duplicate code (candidates — nothing deleted)

| Candidate | Why |
|---|---|
| `backend/core/calculations/{planning,assessment}.py` (+ 7 tests) | Unused by any route; conflicting formulas vs frontend |
| `backend/services/content_service.py` case functions; `/content` page + `content-api.ts` + legacy actions (`saveProcedureStep`, `saveAssessmentCriterion`, `saveCaseImaging`, `setCaseStatus`, `updateCase`, `createCase`) | Superseded by `/cases`; partly broken |
| `dashboard/drizzle/**`; deps `drizzle-orm`, `postgres`, `pino`, `zod` | Orphaned |
| `lib/server/calculations/engine.{ts,test.ts}` (0 bytes) | Empty stubs referenced by `npm test` |
| `lib/data/calibration.ts` `pxToMm`/`mmToPx`/`formatCalibration`; `coordinates.ts` `imageToScreen`/`screenToImage`/`physicalToImage`… | No production callers |
| `lib/plan.ts` 7-step vocabulary (`PLAN_STEPS`, `MEASUREMENTS`, `gateFor`, `furthestOpenStep`), `planning-content.ts`, `STEP_OPTIONS`, `gatesFor` legacy branch | Retired flow |
| Server actions `sealPlan`, `mintPin`, `savePlanStep`, `assignPreset`, `saveInstructorConfig` | Stubs that only return "not connected" |
| `lib/seed.ts` (1 201 l), `PINS`, seed `PLANS`, seed sessions/reports | Mock data used as production source of truth |
| Three copies of each implant table (§16) | Drift risk |
| `backend/test_db.py`, `test_supabase_http.py`, `db_backup_pre_reset.*`, `scratch/`, `codebase_context.md`, `mediver_documentation.zip` | Ad-hoc / stale / hazardous |
| `wireframe/` | Static sketches |
| Obsolete auth systems | invite/join flow → only a "planned" stub in `[...slug]/page.tsx`; `request-access` is a `mailto:` |

---

## 31. Feature matrix

| Feature | Status | Evidence | Data source | Persistence | Tests | Docs | Risk |
|---|---|---|---|---|---|---|---|
| Authentication | **IMPLEMENTED BUT RISKY** | §8 | Supabase + `users` | DB | change-pw ✔ | doc 12 ✔ | **Critical** (back-door) |
| Authorization | PARTIALLY IMPLEMENTED | role checks, owner joins | DB | – | isolation ✔ | ✔ | High (S-05) |
| Institution isolation | PARTIALLY IMPLEMENTED | joins + tests | DB | – | ✔ | ✔ | High |
| Programs | IMPLEMENTED | `programs*` | DB | ✔ | – | 07 partial | Low |
| Cohorts | IMPLEMENTED | `cohorts*` | DB | ✔ | partial | partial | Low |
| Learners (provision/enrol) | IMPLEMENTED | `learners/new|existing` | Supabase + DB | ✔ | partial | ✔ | Med (orphan auth user on failure; weak RNG) |
| Instructor dashboard | **MOCK/SEED** | `InstructorDashboard` | seed | – | – | claims real | Med |
| Learner dashboard | **MOCK/SEED** (enrolments real) | `dashboard.ts` | seed + API | – | 2 | claims real | Med |
| Case management | IMPLEMENTED | `/cases` | DB | ✔ | partial | ✔ | Med |
| Case authoring | PARTIALLY IMPLEMENTED | wizard | DB/Storage | ✔ | 1 | ✔ | **High** (defects §10) |
| Case versioning | IMPLEMENTED (branch loses attachments) | `cases_service` | DB | ✔ | – | ✔ | Med |
| Publishing | IMPLEMENTED BUT RISKY | checklist trusts client calibration | DB | ✔ | ✔ pure | ✔ | Med |
| Imaging | PARTIALLY IMPLEMENTED | upload endpoints | Storage | ✔ | – | partial | Med |
| DICOM | PARTIALLY IMPLEMENTED | viewer; wrong tag | – | – | – | ✔ | Med |
| Calibration | PARTIALLY IMPLEMENTED | §13 | client/DB | partial | 19+4 | conflict | Med |
| Assessment (6 values) | PARTIALLY IMPLEMENTED | `assessment_geometry` | client | memory | 6 | conflict | Med |
| MAD / AMA / mHKA / MPTA / LDFA / PTS | PARTIALLY IMPLEMENTED each | §12 | client | memory | ✔ | conflict (definitions) | Med; mHKA/PTS conventions High |
| Tibial planning | PARTIALLY IMPLEMENTED | §11 | client | memory | ✔ | ✔ | High (clinical sourcing) |
| Femoral planning | PARTIALLY IMPLEMENTED | §11 | client | memory | ✔ | ✔ | High |
| Implant sizing | IMPLEMENTED BUT RISKY | synthetic catalogue | hard-coded | – | ✔ | partial | High |
| Fit calculation | IMPLEMENTED BUT RISKY | §17 | client | – | ✔ | partial | High |
| Review | IMPLEMENTED | `ReviewWorkspace` | memory | – | – | ✔ | Low |
| Plan locking | **IMPLEMENTED BUT RISKY** | §18 | memory | **no** | – | conflict | **High** |
| Plan persistence | **NOT IMPLEMENTED** (memory) | `plans.ts` | memory | no | – | required | **High** |
| VR transfer | NOT IMPLEMENTED (payload shape only) | §19 | – | – | – | ✔ | High |
| VR event ingestion | NOT IMPLEMENTED | – | – | – | – | ✔ | High |
| Assessment persistence | NOT IMPLEMENTED | no tables | – | – | – | ✔ | High |
| Scoring | NOT IMPLEMENTED (dead functions + seed numbers) | `assessment.py` | seed | – | 7 (unused code) | ✔ | High |
| Analytics / Reports | **MOCK/SEED** | `rollups.ts`, `reports/page.tsx` | seed | – | – | ✔ | Med |
| Recommendations | **MOCK/SEED** | seed focus areas | seed | – | – | ✔ | Med |
| Audit logs | NOT IMPLEMENTED | – | – | – | – | ✔ | Med |
| Security | see §26 | – | – | – | – | – | **Critical** |
| Testing | PARTIALLY IMPLEMENTED | §27 | – | – | – | – | Med |
| CI/CD | NOT IMPLEMENTED | none | – | – | – | – | Med |

---

## 32. Documentation consistency matrix and conflict register

| Subsystem | Documentation | Code | Match | Authority | Notes |
|---|---|---|---|---|---|
| Planning flow (4 pages) | PDF, 04, 09 | 4 routes | ✔ | PDF | Legacy 7-step routes redirect |
| VR JSON payload | PDF p.6-7, 10 | `V1VrPayload` | ✔ | PDF | `patient_id` mapping hard-coded |
| Fit thresholds | PDF (90 %, 1.0, 1.5) | + 85 %, 0.5, A/P overhang | partial | PDF | DC-08 |
| Calibration | 02/03/04/09 vs 21 | derived, flagged, seeds use 0.264 | ✘ doc-vs-doc | undecided | DC-01 |
| Measurements (4 vs 6) | 02, 08, 13, 18, 19 vs PDF/04/09/21 | 6 | ✘ | PDF | DC-02 |
| Calculation engine location | 02, 05, 07 (backend) | frontend | ✘ | – | DC-03 |
| mHKA convention | PDF + 20 | frontend deviation / backend included | ✘ | PDF ambiguous | DC-04 |
| Schema | 06 | 24 tables | partial | migrations | DC-16 |
| API | 07 | 55 routes | partial | code | DC-18 |
| Security / audit | 12 | no audit table | partial | – | DC-23 |
| Deployment | 14 | dev-only | partial | – | – |

**Conflict register (documentation ↔ code, plus doc ↔ doc) — 24 items**

| ID | Conflict |
|---|---|
| DC-01 | 0.264 mm/px presented as the V1 calibration (02, 03, 04, 09) vs "never a universal constant" (21 §6) vs code that derives per scan but seeds both views at 0.264 |
| DC-02 | Four measurements + per-value confirm/edit/override-reason (02, 08, 13, 18, 19, tail of 09) vs six measurements with a single Accept (PDF, code); override audit not implemented |
| DC-03 | "Canonical backend calculation engine" (02, 05, 07) vs unused backend engine with different maths; frontend is authoritative in practice |
| DC-04 | mHKA: PDF "included angle" + example 7.0° Varus; backend ≈180°; frontend deviation; wizard default 174° |
| DC-05 | PTS: PDF 3 clicks (2 anterior cortex + plateau tangent) vs doc 09/code 4 points; backend unsigned vs frontend signed |
| DC-06 | MPTA tibial axis: PDF two shaft points vs code knee→ankle |
| DC-07 | Number of landmarks: PDF implied fewer vs doc 09/code 13 |
| DC-08 | Extra thresholds (85 %, 0.5 mm notch, A/P overhang, plausibility windows) not in PDF; doc 21 §13 forbids unapproved generalisation |
| DC-09 | Fit-verdict vocabulary differs (PDF ACCEPTABLE/CAUTION; code + doc 09 ACCEPTABLE/BORDERLINE/POOR/CAUTION; backend CAUTION/POOR) |
| DC-10 | "Manufacturer sizes" (PDF) vs synthetic catalogue built from the PDF's example patient dimensions |
| DC-11 | Planning work must survive navigation/lifecycle (14, 09) vs in-memory store |
| DC-12 | "Sealed plan is immutable / read-only" (18 §7, 04) vs no server-side lock |
| DC-13 | "Lock … checked on the server as well as on Review" (09) vs flag/scale check only, no recomputation |
| DC-14 | Migration numbers/headers (`004_content_tables` in docs vs `004_case_library` + `005_content_tables`) and 004→005 dependency order |
| DC-15 | `CONTENT_SCHEMA_PLAN.md` / doc 19 ("tables not applied", "no imaging table", "program_id NOT NULL") vs migrations 004+ |
| DC-16 | Doc 06 `users.password_hash`, 8 documented tables absent, 3 real tables undocumented |
| DC-17 | Doc 18 §14 "Supabase Auth not confirmed" vs 02/12/code using it |
| DC-18 | API contract drift (§23) |
| DC-19 | Dashboards described as "real persisted state" (04) vs seed |
| DC-20 | `LEARNER_FLOW_PLAN.md` / `UI_REDESIGN_SUGGESTIONS.md` cite files and a PIN panel that no longer exist |
| DC-21 | "Learners only access published cases in enrolled programs" (02, 04) vs seed catalogue merged for every user |
| DC-22 | Doc 13 test counts ("28/28") and `/content` API description stale |
| DC-23 | Doc 12 audit requirements vs no audit capability |
| DC-24 | PDF "calibration markers automatically detected" vs manual two-click / typed pixel diameter; doc 20 §17 "prefer DICOM spacing" vs wrong-tag implementation |

---

## 33. End-to-end flow matrix

| Flow | Status | Evidence | Missing piece |
|---|---|---|---|
| Instructor creates learner | **END-TO-END** | `learners/new` → Auth + `users` + `cohort_members` | rollback of Auth user on membership failure; CSPRNG |
| Instructor creates case | **END-TO-END** (with defects) | wizard → `POST /cases` | difficulty "advanced"; hard-coded skill ids |
| Uploads imaging | **PARTIAL** | `upload-asset`/`upload-radiograph` | validation, DICOM tag fix, cleanup |
| Defines reference plan | **PARTIAL** | typed values stored | derive/verify from landmarks; mHKA convention |
| Publishes | **END-TO-END** | `/publish` | server-side calibration validation |
| Learner login | **END-TO-END** | Learner ID + temp password | back-door removal; refresh |
| Learner program / case | **END-TO-END** (DB cases) | `/programs`, `/cases` | remove seed merge |
| Learner planning | **PARTIAL** | 4 steps | persistence |
| Learner lock | **PARTIAL** | in-memory | server enforcement, DB snapshot |
| Learner → VR | **NOT IMPLEMENTED** | PIN stub | transport, pairing |
| VR receives plan / executes / sends events | **NOT IMPLEMENTED** | not in repo | everything |
| Assessment | **NOT IMPLEMENTED** (seed numbers only) | – | tables, engine wiring |
| Results / reports | **NOT IMPLEMENTED** (seed) | – | data pipeline |

---

## 34. Clinical / engineering boundary

| Rule | Implementation | Source | Classification | Risk |
|---|---|---|---|---|
| Six measurement definitions | `assessment_geometry.ts` | PDF + doc 20 | SOURCE_VERIFIED for names/concepts; point sets & axis choices PROJECT_RULE | Med |
| mHKA sign/convention | deviation, NEUTRAL <0.5° | PDF ambiguous | CLINICAL_APPROVAL_REQUIRED | High |
| Varus/valgus from clicked lateral/medial marks | `assessment_geometry.ts:213-225` | project | ENGINEERING_DERIVATION | Med |
| Plausibility windows | `IMPLAUSIBLE` | none | ENGINEERING_DERIVATION | Low (non-mutating) |
| Scale range 0.05-1.5 mm/px | 3 places | none | ENGINEERING_DERIVATION | Med |
| Calibration marker 25 mm sphere | typed/assumed | PDF | SOURCE_VERIFIED (value); detection absent | Med |
| Patient tibia/femur geometry | scaled generic contour / box | none | ENGINEERING_DERIVATION | **High** |
| Implant dimensions & shapes | hard-coded | none | ENGINEERING_DERIVATION | **High** |
| Fit thresholds 90 %, 1.0, 1.5 | constants | PDF | SOURCE_VERIFIED | Low |
| Thresholds 85 %, 0.5 mm, A/P overhang | constants | docs/code | PROJECT_RULE / ENGINEERING_DERIVATION | **High** |
| Size recommendation / auto-fit | scoring weights `20·overhang`, `10·…`, `15·notch` | none | ENGINEERING_DERIVATION | Med |
| Correction rules, resections, slopes | **not implemented** (explicitly V1 out of scope) | PDF | – | – |
| Competency / scoring / pass mark | `PASS_MARK` const + seed; backend scoring formulae (`85`, `75`, `40`, `0` per severity) | none | ENGINEERING_DERIVATION; doc 18 §1-3 say **open** | **High** if surfaced |
| Banner "DEMO / SYNTHETIC — Not for clinical use" | shown on every TKR plan | – | safeguard | – |

**No clinical validation is claimed or evidenced anywhere in the repository.** Every number the planner displays is an engineering result on user-clicked points.

---

## 35. Data truth audit (features that may only *look* implemented)

| Feature | UI | API | DB | Real data | Mock/seed | Complete |
|---|---|---|---|---|---|---|
| Sign-in / password change | ✔ | ✔ | ✔ (Supabase) | ✔ | – | ✔ (security defect) |
| Program/cohort/learner mgmt | ✔ | ✔ | ✔ | ✔ | – | ✔ |
| Session scheduling | ✔ | ✔ | ✔ | ✔ | – | ✔ (status derived) |
| Case library | ✔ | ✔ | ✔ | ✔ | merged seed | ✔ with defects |
| Personal cases | ✔ | ✔ | ✔ | ✔ | – | ✔ (resident only) |
| Planning workspace | ✔ | ✘ (server actions only) | ✘ | session-memory | seed plans | ✘ |
| Plan lock / "sent" | ✔ | ✘ | ✘ | – | – | ✘ |
| Pairing PIN, `/plans` "paired" | ✔ | ✘ | ✘ | – | ✔ | ✘ |
| Instructor dashboard / cohort KPIs | ✔ | partial | partial | – | ✔ | ✘ |
| Learner dashboard / next action | ✔ | partial | partial | enrolment | ✔ | ✘ |
| Sessions list, live mirror, report, scene results | ✔ | ✘ | ✘ | – | ✔ | ✘ |
| Performance / skills / activity / reports | ✔ | ✘ | ✘ | – | ✔ | ✘ |
| Resident detail performance | ✔ ("Not tracked yet") | ✘ | ✘ | – | – | honest empty |
| Instructor feedback | ✔ | ✔ | ✔ | ✔ | keyed to seed session ids | ✘ (resident cannot read) |
| Assessment criteria / procedure steps editing | ✔ | ✘ | tables exist | – | – | ✘ (explicit refusal) |
| Presets, assignments to presets | ✔ | ✘ | ✘ | – | – | ✘ |
| Reports PDF (`reports.pdf_path`) | text only | ✘ | ✘ | – | – | ✘ |

---

## 36. Project health

| Area | Rating | Evidence |
|---|---|---|
| Architecture | 🟡 | Clean data-seam intent, but two parallel truths (seed vs API), 2 case UIs, dead engine |
| Frontend | 🟡 | tsc clean, 214 tests, but 81 lint errors, large untested components, uncommitted rewrite |
| Backend | 🟡 | Clear layering, parameterised SQL, tested isolation; unused engine, verbose errors, no pooling |
| Database | 🟡 | Sensible model; migration chain not replayable, 6 tables without RLS, orphan tables |
| Authentication | 🔴 | S-01 back-door; no rate limit; no refresh |
| Security | 🔴 | S-01, S-02, S-04, S-05 |
| Case authoring | 🟡 | Versioning solid; wizard/legacy defects |
| TKA planning | 🟡 | Good UX/maths discipline (no defaults); memory-only, definitions diverge from PDF |
| Calibration | 🟡 | Per-scan, flagged, blocks lock; manual, client-trusted, synthetic seeds |
| Geometry | 🔴 | Synthetic anatomy and implants, no source |
| Fit/sizing | 🟡 | Real polygon maths; thresholds partly unsourced; duplicate engines |
| Persistence | 🔴 | Plans in RAM |
| VR | 🔴 | Absent |
| Testing | 🟡 | Strong unit tests on pure logic; no CI/E2E/API-DB |
| Documentation | 🟡 | Rich but several stale/conflicting docs |
| Deployment | 🔴 | Dev images, no CI/CD, no secrets/ingress/DB manifests |

---

## 37. Top 20 risks

| # | Sev | Area | Evidence | Consequence | Production impact | Priority |
|---|---|---|---|---|---|---|
| 1 | CRITICAL | Auth | `auth_service.py:108-205` | Account takeover | Blocks any deployment | P0 |
| 2 | CRITICAL | Secrets | `backend/test_db.py:3`, history | DB compromise | Blocks sharing the repo | P0 |
| 3 | HIGH | Plan integrity | `actions/index.ts:321,376` | Falsified/mutated locked plans | Invalidates "immutable" | P0 |
| 4 | HIGH | Persistence | `plans.ts:103` | Plans lost on restart; multi-replica incoherence | Learner work loss | P1 |
| 5 | HIGH | DB security | 6 tables w/o RLS | Direct API exposure of answer keys (if exposed) | Data leak | P0 (verify) |
| 6 | HIGH | Tenancy | preview, `program_ids`, skill ids, staff plan access | Cross-institution exposure | Compliance | P0 |
| 7 | HIGH | VR | none implemented | Core product loop incomplete | Product not usable end-to-end | P1/P2 |
| 8 | HIGH | Clinical | synthetic geometry/implants/thresholds | Misread as validated fit | Patient-safety/regulatory narrative | P1 |
| 9 | MED-HIGH | Calibration | client-supplied validity, 94.7 px defaults, wrong DICOM tag | Fabricated "verified" scale | Wrong mm in plans | P1 |
| 10 | MED | Authoring defects | `advanced` difficulty, alignment heuristic, mHKA 174 default, hard-coded skill ids | Failed saves, wrong reference keys | Instructor trust | P1 |
| 11 | MED | Legacy `/content` | ignored PATCH fields, shape drift | Silent no-ops | Confusing UX | P2 |
| 12 | MED | Migrations | 004→005, 008 | Cannot rebuild DB from repo | Environment setup/DR | P1 |
| 13 | MED | Audit | none | No accountability | Compliance | P2 |
| 14 | MED | Uploads | no limits/validation | DoS, orphan objects | Cost/availability | P2 |
| 15 | MED | Auth hardening | no throttling, weak RNG | Brute force | Security | P1 |
| 16 | MED | Seed bleed | seed catalogue/dashboards for real users | Misleading data, tenant-agnostic | Trust | P2 |
| 17 | MED | Conflicting engines/definitions | DC-03…09 | Inconsistent numbers if backend ever used | Rework | P1 |
| 18 | MED | Testing/CI | `npm test` broken, DB-writing tests, no CI | Regressions undetected | Quality | P2 |
| 19 | LOW-MED | Deployment | dev servers in images, unpinned deps, Python 3.11 vs 3.14 | Non-reproducible builds | Ops | P3 |
| 20 | LOW | Repo hygiene/PII | 107 MB DICOM, DB snapshot, stale docs | Repo bloat, possible PHI | Compliance | P3 |

---

## 38. What is actually done

* **Definitely implemented:** Supabase-backed sign-in, change/reset password; institutions/admin-created instructors; programs; cohorts; learner provisioning & enrolment (one-cohort-per-program rule in code); cohort case assignment; scheduled sessions with rosters; versioned case library (draft/publish/immutable flag/learner-safe projection, signed image URLs); personal cases; instructor notes/feedback/assignments; the 4-step planner UI with 13-point assessment, per-scan calibration, polygon-based tibial fit and span-based femoral fit, review, lock snapshot (in memory); 214 passing unit tests.
* **Partially implemented:** authorization/tenancy, case authoring, imaging/DICOM, calibration, publishing gate, plan lock, review "send".
* **UI-only / simulated:** pairing PINs, "paired" plan state, live mirror, preset assignment, procedure-step/criteria editing, report PDFs.
* **Mock / seed:** both dashboards' analytics, sessions, reports, performance, activity, recommendations, catalogue (`/simulations`, `/setup`, `/library`, `/help`), 13 seed cases.
* **Not implemented:** plan persistence, VR transport/events/attempts, assessment engine wiring and persistence, audit logs, WebSockets, rate limiting, CI/CD, E2E tests, per-measurement override audit, resident access to instructor feedback.
* **Unknown:** live DB schema/RLS/bucket policies; whether synthetic cases were seeded into the live DB; Supabase email/redirect configuration; VR client behaviour.

---

## 39. Recommended development order (from repository evidence only)

| Pri | Task | Why | Depends on | Likely files | Acceptance criteria | Risk |
|---|---|---|---|---|---|---|
| **P0** | Remove the password back-door and rotate every account that ever signed in with a fallback value | S-01 | – | `auth_service.py`, `auth.py`; add test | Login with former fallback values fails; no code path calls `update_user_by_id` during login; affected passwords rotated | Low |
| **P0** | Rotate DB/Supabase credentials; delete `test_db.py`/`test_supabase_http.py`; purge history; secret scanning; unify env loading | S-02, S-15 | repo owner | `backend/*.py`, `.gitignore`, `core/config.py` | `git log -S` finds no credentials; scripts read env only | Med (history rewrite) |
| **P0** | Verify live RLS/grants/bucket privacy; enable RLS on the 6 tables; add deny-by-default policies | S-04 | DB owner | new migration | Anonymous REST calls to those tables return 401/empty; test script passes | Low |
| **P0** | Close tenant gaps: scope preview, validate `program_ids`/skills against institution, signed-URL only for owned paths, scope `getPlan` for staff | S-05, S-06 | – | `cases.py`, `cases_service.py`, `personal_cases_service.py`, `plan.ts` | New isolation tests fail before / pass after | Low |
| **P1** | Persist plans: `plans`, `plan_versions` (snapshot), `plan_events/audit` tables + API; server-side lock (immutable after seal, idempotent seal), server-side validation/recompute of values | S-03, DC-11/12/13 | DB design | new migration, `backend/api/v1/endpoints/plans.py`, `actions/index.ts`, `plans.ts` | Restart-safe; post-lock `update` rejected; re-seal rejected; payload equals recomputation | Med-High |
| **P1** | Repair migration chain (re-sequence or squash a baseline), add ledger, test on empty DB | DC-14 | – | `backend/migrations/**` | Empty DB → full schema via one command in CI | Med |
| **P1** | Fix authoring defects (difficulty enum, alignment heuristic, mHKA convention, no pre-filled "valid" calibration, real skills API, server-side calibration validation, DICOM tag) | §10, §13 | – | wizard, `app/cases/*`, `cases_service.py` | Wizard creates/publishes on a clean DB; invalid calibration cannot publish | Low-Med |
| **P1** | Clinical sign-off package: freeze definitions (mHKA, PTS, MPTA axis), thresholds, implant dimensions with sources; one engine (spec → shared module); retire/replace the other | DC-03…10 | clinical owner | `assessment_geometry.ts`, `tkr_templates.ts`, `backend/core/calculations` | Every rule has owner/source/version; golden tests | Med |
| **P2** | Define VR contract implementation: pairing/plan fetch, `attempts`, event ingestion with sequence/idempotency, results | doc 10 | P1 plans | new endpoints/tables | Contract tests; reconnect test | High |
| **P2** | Assessment pipeline & reports persisted; learner access to feedback; remove seed from real-user paths | DC-19/21 | VR | services, `lib/data/*` | Dashboards reflect DB; seed only behind a demo flag | Med |
| **P3** | CI (lint/tsc/tests), fix `npm test`, DB-isolated API tests, E2E for the core loop; upload hardening; audit log; auth throttling; pooled DB access | §27 | – | `.github/workflows`, tests | Green pipeline; coverage of lock/tenancy | Med |
| **P4** | Docs refresh (retire DC items), remove dead code/legacy `/content`, deps, DICOM sample set, containers for production | §30 | – | docs, repo | Doc conflicts = 0 | Low |

---

## 40. Canonical current-state snapshot

```
# MEDIVER-XR CURRENT STATE SNAPSHOT

Project:        MediVeR-XR — VR TKA training platform (web side)
Repository:     F:\pravartak projects\MediVeR-XR-main
Branch:         main
HEAD:           f5732d3b55a08bad8659f917c5f4c6a74e49369c (2026-10-05)
Working Tree:   DIRTY — 31 modified + 16 untracked (planning/fit/calibration rewrite + doc 09); nothing staged

Frontend:       Next.js 16.3.0 / React 19.2.8 / TS strict; tsc clean; ESLint 81 errors / 30 warnings
Backend:        FastAPI 0.141.1 + Pydantic 2.13.5; psycopg2 direct SQL; 55 routes; no WebSockets
Database:       Supabase Postgres; 24 tables / 12 migrations (chain not replayable); 6 tables without RLS; live state UNKNOWN
Authentication: Supabase Auth, httpOnly 1 h cookie, no refresh; **hard-coded password back-door (CRITICAL)**
Authorization:  Role + owner/institution joins; gaps: case preview, program_ids, storage paths, staff plan access
Case System:    Versioned draft/publish library + learner-safe projection; legacy /content partly broken
TKA Planning:   4-step planner works in-browser; plan state in server memory only; lock not server-enforced
Calibration:    Per-scan (two-click or case), flagged estimates block lock; client-trusted; synthetic seeds at 0.264
Patient Geometry: Generic tibial plateau contour scaled to 4 clicked edges; femur = rectangle
Implant Geometry: Hard-coded synthetic catalogue (tibial 1-6, femoral 1-8), 3 duplicate copies
Fit Engine:     Frontend polygon/span engine runs; backend parametric engine is unused dead code
Persistence:    Core data in Postgres; plans/VR/assessment NOT persisted
VR:             Not implemented (payload shape + UI banner only)
Testing:        214 dashboard + 48 safe backend tests pass; no CI/E2E; `npm test` broken on Windows
Build:          tsc OK; next build not run
Security:       2 CRITICAL, 3 HIGH open (§26)
Deployment:     Dev compose + 2 k8s dev deployments; no CI/CD

## CURRENTLY WORKING
Sign-in/out, password change & reset; admin-provisioned instructors; programs, cohorts, learner provisioning & enrolment; cohort case assignment; session scheduling with rosters; case authoring → publish → learner-safe view; personal cases; instructor notes/feedback; the 4-step planner in a single server process.

## PARTIALLY WORKING
Tenant isolation, imaging/DICOM, calibration, plan lock, review "send to VR", resident detail, learner/instructor dashboards (enrolment real, performance seed).

## MOCK / SEED
Analytics, sessions, reports, performance, activity, recommendations, simulations catalogue, pairing PINs, 13 seed cases, live mirror.

## NOT IMPLEMENTED
Plan persistence, VR transport/events/attempts, assessment engine & storage, audit logs, WebSockets, rate limiting, CI/CD, E2E tests, resident access to feedback, per-measurement override audit.

## CRITICAL RISKS
(1) password back-door; (2) committed DB credential; (3) unenforced plan lock + in-memory plans; (4) RLS/tenancy gaps; (5) unsourced clinical geometry/thresholds.

## CURRENT BLOCKER
The planner's output cannot leave a single server process (no persistence, no transfer), and the security P0s above block any shared deployment.

## RECOMMENDED NEXT TASK
Remove the login back-door and rotate credentials (P0), then design `plans`/`plan_versions` persistence with a server-enforced lock.
```

---

## Appendix A — Commands executed (all read-only)

`git status/log/diff/show/grep/ls-files/worktree list/stash list/rev-list`; `npx tsc --noEmit`; `npx tsx --test <explicit files>`; `npm test` (failed, tooling); `npx eslint src -f json`; `./venv/Scripts/python.exe -m unittest` on 4 DB-free modules + 7 pure tests; PDF text extraction with PyMuPDF to a scratch file; Python/Node one-off scripts to count seed rows, DICOM tag presence (counts only), migration RLS coverage, and to compare (not print) the committed DB password with local env files. Not run: `next build`, the two DB-writing tests, any network call to Supabase/Storage.

## Appendix B — Items needing an owner decision (UNKNOWN today)

Live Supabase RLS/grants and bucket policy; whether all 12 migrations were applied in the real order; whether `images(cases)/` DICOMs contain real patient data; which mHKA/PTS convention the clinical owner approves; manufacturer source for implant dimensions; intended long-term home of the case-authoring "advanced" difficulty; whether the legacy `/content` UI should be retired.

*This report was generated from the local working tree on 2026-10-07 and does not modify the application.*
