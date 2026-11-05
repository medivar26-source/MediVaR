# API Contracts

## Style

Use REST/JSON for domain operations and WebSocket for live session updates. Version the API, for example `/api/v1`.

## Auth
```text
POST /api/v1/auth/login
GET  /api/v1/auth/me
POST /api/v1/auth/logout
POST /api/v1/auth/change-password
```

- `POST /api/v1/auth/change-password`
  - Requires Bearer token (`Authorization: Bearer <token>`).
  - Request body:
    ```json
    {
      "current_password": "string",
      "new_password": "string (min 8 chars)",
      "confirm_password": "string (min 8 chars)"
    }
    ```
  - Response (`200 OK`):
    ```json
    {
      "message": "Password changed successfully"
    }
    ```
  - Error responses: `400 Bad Request` (invalid current password, mismatched confirmation, short password), `401 Unauthorized`.


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
GET    /api/v1/cases                    (Instructors: institution cases with draft/published version pointers; Learners: program-scoped published cases)
POST   /api/v1/cases                    (Instructor/Admin: creates case with initial draft version)
GET    /api/v1/cases/{id}               (Instructors: full detail with reference plan; Learners: sanitized view without reference plan)
PUT    /api/v1/cases/{id}               (Instructor/Admin: mutates draft version or branches new draft from published)
POST   /api/v1/cases/{id}/publish       (Instructor/Admin: pre-flight checklist validation, freezes draft to immutable published version)
POST   /api/v1/cases/{id}/deactivate    (Instructor/Admin: deactivates case)
GET    /api/v1/cases/{id}/preview       (Instructor/Admin: previews exact sanitized learner view)
POST   /api/v1/cases/{id}/upload-radiograph (Instructor/Admin: multipart upload to private storage + dynamic calibration derivation)
```

**Case list response (`GET /cases`) — card metadata (Learner Mode review, 2026-10-20):** each item carries, besides its id, name, difficulty, description, status, version, version pointers and `program_ids`, three optional fields and the procedure's name:

| Field | Type | Source | When null |
|---|---|---|---|
| `procedure_id` | UUID \| null | `cases.procedure_id` | never for a case created through the API; null only for legacy rows |
| `procedure_name` | string \| null | `procedures.name` | when `procedure_id` is null. Included because learners cannot call `GET /procedures` (instructor/admin only) but still need to group cases by procedure |
| `pathology_label` | string \| null | `case_versions.pathology_label` | the version records none |
| `side` | `"left"` \| `"right"` \| null | `case_versions.side` | the version records none |

Which version is read: for a **learner**, the case's published version (the list already returns only cases that have one); for an **instructor/admin**, the published version, else the draft they are working on. A client must treat null as "not recorded" and show it as unavailable. It must never substitute a default (the dashboard's `lib/case-meta.ts` does this). The change is additive: existing fields, filters, permissions and ordering are unchanged, and no new endpoint, table or migration is involved.

**Case detail and the procedure.** `GET /cases/{id}` returns `procedure_id` but not the procedure's name. The dashboard takes the name from the case list (`procedure_name`, above), which lists the same case, and shows "Procedure not recorded" if it cannot. It never assumes a procedure. The planner implements the V1 total knee arthroplasty workflow only, so a case whose procedure is unknown or is not total knee replacement is not planned (`procedureBlocker`, `lib/case-meta.ts`).

**Implementation status & Notes:** `GET /cases`, `POST /cases`,
`GET /cases/{id}`, `PUT /cases/{id}`, `PATCH /cases/{id}`, and `POST /cases/{id}/publish` are implemented
(`backend/api/v1/endpoints/cases.py`), plus `GET /procedures` for procedure catalog and picker.
Supports multi-table versioned Case Library, full pre-operative planning, and soft-delete/archival.


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

## As built (2026-11-03)

Base `/api/v1`. Implemented in `backend/api/v1/endpoints/results.py`, `plans.py` (2026-11-05) and `connect.py`.

| Method | Path | Caller | Does |
|---|---|---|---|
| GET | `/health` | anyone | `{status, service, apiVersion, serverTimeUtc}` |
| GET | `/results` | signed in | Every attempt and report the caller may read (own; a cohort owner's learners; an admin's institution). 404 if 013 is missing |
| POST | `/plans` | signed in | Start a draft for a library or personal case: `{case_id, session_config:{mode, difficulty, implant_design?, fixation?}}` (2026-11-05; needs 013) |
| GET | `/plans` | signed in | My plans (`?case_id=`); `?supervised=true` for an instructor (their learners) or admin (their institution) |
| GET | `/plans/{id}` | owner, supervising instructor, institution admin | One plan with its sealed snapshot; anyone else gets 404, never 403 |
| PATCH | `/plans/{id}` | owner | Save planner work into a draft: `{payload:{v1_assessment, assessment_landmarks, scan_calibration, v1_tibial, tibial_planning, v1_femoral, femoral_planning}}`, merged in the database. 409 when locked, or when the assessment keys are sent after the assessment exists |
| POST | `/plans/{id}/lock` | owner | Seal a draft: `{vr_payload, session_config:{implant_design?, fixation?}}`. Freezes the stored payload; design and fixation can be supplied here when the plan never had them |
| POST | `/plans/locked` | signed in | Older one-call "store an already sealed plan" (case visibility and V1 payload checked; idempotent on `locked_version_id`). The dashboard no longer uses it |
| POST | `/assignments` | signed in (owner or supervising instructor) | "Send to headset": returns a one-time 6-digit code, shown once |
| GET | `/assignments?plan_id=` | signed in | Status of what was sent; never the code |
| POST | `/devices/pair` | headset, no token | `{code, deviceId, deviceName, appVersion, schemaVersion}` → `{assignmentId, token, tokenExpiresAt, casePlan}`; 404 / 410 / 429 |
| GET | `/assignments/{id}/plan` | headset (bearer) | The CasePlan again |
| PUT | `/assignments/{id}/runs/{runId}/report` | headset (bearer) | Store a RunReport; idempotent on `runId`, a higher `reportRevision` replaces; 401 re-pair, 422 poison, 409 another run |

The connectivity calls answer 404 "not set up" while 015 is missing. Full contract: `23_VR_CONNECTIVITY_DESIGN.md`
section 4. The planned `/vr/attempts` endpoints in the sections above were replaced by the headset team's
`pair` / `plan` / `report` contract.
