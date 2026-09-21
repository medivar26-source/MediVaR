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
