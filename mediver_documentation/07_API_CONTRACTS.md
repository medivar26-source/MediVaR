# API Contracts

## Style

Use REST/JSON for domain operations and WebSocket for live session updates. Version the API, for example `/api/v1`.

## Auth
```text
POST /api/v1/auth/login
GET  /api/v1/auth/me
POST /api/v1/auth/logout
```

These are the application-level authentication contracts. The underlying authentication provider is not yet fixed. Supabase is the database platform, but Supabase Auth is not yet a confirmed authentication choice. If Supabase Auth is selected later, the FastAPI layer must validate the provider-issued access token/session context and map it to the MediVeR user/institution/role model.

## Programs
```text
GET    /programs
POST   /programs
GET    /programs/{id}
PATCH  /programs/{id}
DELETE /programs/{id}
```

## Cohorts
```text
GET    /cohorts
POST   /cohorts
GET    /cohorts/{id}
PATCH  /cohorts/{id}
GET    /cohorts/{id}/residents
GET    /cohorts/{id}/performance
POST   /cohorts/{id}/assignments
```

## Residents
```text
GET  /residents
GET  /residents/{id}
GET  /residents/{id}/cases
GET  /residents/{id}/attempts
GET  /residents/{id}/skills
GET  /residents/{id}/recommendations
POST /residents/{id}/notes
```

## Cases
```text
GET    /cases
POST   /cases
GET    /cases/{id}
PATCH  /cases/{id}
DELETE /cases/{id}
```

**Implementation status (2026-09-21):** `GET /cases`, `POST /cases`,
`GET /cases/{id}` and `PATCH /cases/{id}` are implemented
(`backend/api/v1/endpoints/cases.py`), plus `GET /procedures` for the case
form's procedure picker. Instructor/admin only; every query joins
`cases → programs` and filters on the caller's institution, so a
client-supplied id is never trusted alone. `POST` without a `program_id`
uses the institution's default program, as cohorts do.

**`DELETE /cases/{id}` is deliberately not implemented.** A case is retired
with `PATCH { "status": "inactive" }` — the "prefer archival/soft-delete"
rule in 04_UI_AND_NAVIGATION.md, and the reason `cases.program_id` /
`assessment_criteria.case_id` are `ON DELETE RESTRICT`.

Editing `name`, `procedure_id`, `difficulty`, `description` or
`learning_objective` increments `version`; a no-op save or a status flip
does not, so attempts already run keep the version they ran against.

If migration `004_content_tables.sql` has not been applied, these endpoints
answer `503` with a plain-language message rather than a database error.

Procedure steps, skills and assessment criteria have tables in migration
004 but no API yet. That is an open dependency, not an oversight — the
Procedures and Assessment Criteria tabs still read the seed reference data
`/plan` already uses, so nothing is fabricated, and nothing on them is
persisted. Imaging and per-case usage have no table at all (there is no
`case_images` and no `sessions` yet); the case detail page says so instead of
showing zeros.

## Sessions
```text
GET  /sessions
POST /sessions
GET  /sessions/{id}
POST /sessions/{id}/start
POST /sessions/{id}/end
GET  /sessions/{id}/participants
```

## Attempts
```text
POST /attempts
GET  /attempts/{id}
POST /attempts/{id}/events
POST /attempts/{id}/measurements
POST /attempts/{id}/complete
GET  /attempts/{id}/assessment
```

## Assessment
```text
POST /assessment/attempts/{attempt_id}/evaluate
GET  /assessment/attempts/{attempt_id}/result
```

The client must never be authoritative for final score or pass/fail.

## Live WebSocket
Conceptual channel:
```text
/ws/sessions/{session_id}
```

Example event:
```json
{
  "type": "resident_progress",
  "session_id": "uuid",
  "resident_id": "uuid",
  "attempt_id": "uuid",
  "procedure_step": "uuid",
  "status": "in_progress",
  "timestamp": "ISO-8601"
}
```

## API rules

- Validate all payloads.
- Authorize every resource access.
- Use stable IDs.
- Use idempotency for retryable operations.
- Return structured errors.
- Never expose password hashes.
- Never let clients directly set assessment results.

## Confirmed Current Model Updates (2026-09-15)

## Confirmed TKR planning API responsibilities

The existing REST/JSON + WebSocket approach remains the baseline. The planning API shall expose operations sufficient to:
- load a case's X-ray planning context
- save/update X-ray landmarks for FLAP/KLAT
- calculate/recalculate dependent measurements
- store calculated/suggested and resident-confirmed values
- store override reasons
- save femoral and tibial planning configuration
- validate and lock a plan
- transfer the locked plan through the existing VR contract
- retrieve post-operative plan-vs-execution review data
- create/update instructor feedback linked to an attempt, error or procedural step

The exact route/resource names should follow the existing API conventions rather than introducing a parallel API style.

## Confirmed authorization
Residents can access their own planning, attempts, results and feedback. Instructors can access the residents and attempts within their authorized training scope, including review and feedback.
