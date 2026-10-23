# System Architecture

## Logical architecture

```text
                 Instructor Web App
                        |
                      HTTPS
                        v
                   Backend API
             /       |       |       \
          Auth   Training  Session  Assessment
            |        |        |         |
            +--------+--------+---------+
                        |
                    Supabase
                    (PostgreSQL)
                        ^
                        |
                 VR HTTPS / WS
                        |
                  Resident VR App
```

## Backend boundaries

### Auth
Identity, role, institution scope, sessions/tokens.

### Training
Programs, cohorts, assignments, cases, procedures, skills.

### Sessions
Scheduled/live/completed sessions, participants and live state.

### Attempts
Attempt lifecycle, event ingestion, measurements.

### Assessment
Criteria, error classification, score calculation, result persistence, recommendations.

### Reporting
Read/query layer for resident, cohort, case and skill reporting.

## Source of truth

### Source-of-truth
- configuration
- raw VR event stream
- measurements
- finalized assessment results
- instructor feedback

### Derived
- dashboard KPIs
- trends
- risk flags
- competency summaries
- report aggregates

Derived values may be cached later but must be reproducible from source data.

## Versioning

Clinical content that can affect assessment should be versioned:
- procedure version
- case version
- assessment configuration version
- assessment criteria version

A completed attempt references the versions used at execution time.

**Confirmed (2026-09-21):** the Instructor Content / Case Library UI
(`/content`) reads `cases.version` as reported by the data layer and defaults
every row to `1` — the schema's own default — rather than tracking edit
history itself. Real version increments belong to the backend once the
`cases` table and its update path exist; the frontend must not invent that
bookkeeping locally.

## Multi-tenancy

Institution scope must be enforced on backend queries. Client-provided IDs must never bypass tenant authorization.

## Technology direction

Recommended starting point:
- React/Next.js frontend
- FastAPI or equivalent backend
- Supabase (managed PostgreSQL)
- WebSocket for live monitoring
- Unity or selected VR stack

Keep the stack replaceable behind clear contracts.

## Confirmed Current Model Updates (2026-09-15)

## Confirmed planning architecture addition

Add a TKR planning subsystem between training/session selection and VR execution:

```text
Existing Next.js UI
        |
        v
TKA Planning Workspace
  - X-ray canvas
  - FLAP/KLAT views
  - landmark state
  - measurement calculation
  - plan configuration
        |
        v
Backend planning services
        |
        v
Supabase PostgreSQL / versioned plan data
        |
        v
Locked plan transfer contract
        |
        v
VR execution module
```

The planning canvas is interactive; the backend remains authoritative for persisted planning records and later assessment data. Supabase is the database platform for the project, with PostgreSQL as the underlying relational database. The existing Instructor Web App, Resident VR App and Backend Platform remain the three primary products.

### Planning state requirements
- Preserve landmark state per view.
- Recalculate dependent measurements when landmarks move.
- Preserve calculated, edited and confirmed values.
- Preserve reasons for value overrides.
- Persist the final locked plan version used by VR.

### Post-operative review
The existing Assessment and Reporting boundaries continue to own plan-vs-execution comparison, errors, scores and feedback.

## Dashboard rendering and data access (Learner Mode review, 2026-10-20)

**The app frame is a layout, not a page.** The side navigation and top bar are mounted once in the root layout (`app/layout.tsx` -> `AppFrame`). A layout is not re-rendered when the user moves between pages inside it, so the chrome keeps its state and is not rebuilt, or its data re-read, on each navigation. `AppShell` is kept as a pass-through so pages did not have to change. Which screens are framed is one rule (`lib/shell-routes.ts`): sign-in and recovery, the planner (`/plan/...`), the headset launcher and the settings modal (`?embed=1`) are not. The layout calls `getNavData` (counts, pinned links, notifications), which is read on a full page load and after the actions that change it (`revalidatePath("/", "layout")` after sign-in, sign-out, saving the account, starting a plan and sealing a plan). **Known limit:** sidebar badges, pinned links and notifications are not re-read on every click between pages, so they can lag a change made elsewhere (for example another tab or the headset) until the next page load.

**Identity is checked on every navigation.** The proxy (`proxy.ts`) only checks that a token cookie exists. Each page calls `getCurrentUser()`, which asks `/auth/me`; the result is shared only within one request (`React.cache`, and Next's per-request `fetch` de-duplication), never across requests, so a revoked or expired session is noticed on the next click. No user-specific data is cached across requests (`cache: "no-store"` throughout).

**Independent reads run together.** `listCases` fetches the case list and the learner's sessions in parallel; `getCase` fetches the case, the sessions and the case list (for the procedure name) in parallel. They used to run one after the other, adding a full round trip.

**Learner sessions have one source.** `lib/data/learner-sessions.ts` (see `LEARNER_FLOW_PLAN.md`).

**Navigation feedback and prefetching.**
- Route-level `loading.tsx` skeletons were removed. React keeps a revealed Suspense fallback on screen for at least 300 ms, so on a fast backend each click paid that delay for nothing (measured 329 ms down to 47-70 ms per navigation). The frame shows a progress bar from the click until the address changes instead (`useNavigationPending` in `AppFrame`).
- Without a loading boundary, Next prefetches every visible link as a full server render, and the result is discarded for dynamic pages (`staleTimes.dynamic` defaults to 0). Links that appear in bulk (sidebar, buttons, cards, table rows, tabs) therefore use `prefetch={false}`. Landing on Sessions used to trigger 9 backend calls from prefetches alone.

**Early reads (second-round reduction).** A page needs `/auth/me` to know who is asking, then reads its data, so Procedures, Pre-op Plans and Progress took two backend rounds. They now call `startEarlyReads()` (`lib/data/early-reads.ts`) before `await getCurrentUser()`: it starts the user-independent `GET /cases`, the learner's `/personal-cases` and the learner's `/residents/{id}/sessions` while the identity check runs. These are the same requests the page makes a moment later, so Next's per-render `fetch` de-duplication joins them: the backend sees the same number of calls (Procedures 3, Pre-op Plans 4, Progress 2) in one round instead of two. The sessions request is addressed to the token's own `sub` (the backend maps `sub` to `users.id`), read from the JWT without verifying it, purely as a hint; the backend verifies the token and refuses any other id (checked: a token whose `sub` is not the caller's gets a 403 on the early request, which is swallowed, and the page makes its own correct request). The page still waits for `/auth/me` and uses sessions only for the id that call returns. Nothing is kept between requests (a second request for the same page made its calls again). **Cost:** an instructor or administrator also makes the speculative sessions call on these pages (one extra parallel request that returns nothing useful), because the role is not known before the identity check; a small role-hint cookie could avoid it and is proposed in the change log, not built.

**Measured effect and its cost** (headless Chrome, production build, synthetic stub API, six sidebar clicks, three runs, original HEAD vs final): sidebar and top bar kept 0/6 -> 6/6; 326 ms -> 74 ms per click with an instant backend; browser RSC/fetch requests 36 -> 6. With 300 ms added to every backend call: 503 ms -> 663 ms per click. The difference is real and comes from the features, not the optimisations: Procedures, Pre-op Plans and Progress used to render from built-in data after one identity call (one backend round); they now read the case list and the learner's sessions, which need the user id first (two rounds). Identity is deliberately re-checked on each click. A page can only avoid the second round by starting the user-independent fetch (for example the case list) at the same time as `/auth/me`; that was not done, to keep the change small. Perceived responsiveness is better throughout (the page chrome stays and a progress bar appears at once), but time to the new page against a slow backend is longer on those three pages.

**Backend reads per page.** One `/auth/me` plus the page's own data, for example `/programs`: 2 calls, `/sessions`: 2, `/cases`: 3 (auth, cases, sessions), `/plans`: 4 (auth, personal cases, cases, sessions).
