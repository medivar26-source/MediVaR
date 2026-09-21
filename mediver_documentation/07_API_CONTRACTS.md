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
GET    /programs            (Instructors: institution programs; Learners: enrolled programs with cohort metadata)
GET    /programs/enrolled   (Learner's enrolled programs with associated cohort metadata)
POST   /programs            (Instructor/Admin only)
GET    /programs/{id}       (Program detail; for learners, verified against active enrollment with cohort metadata)
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
