# Security, Audit and Clinical-Safety Controls

## Authentication

Authentication is an early implementation priority. The project will use the chosen authentication mechanism to provide secure sign-in, session/token handling, logout/revocation, password reset if required, account-status checks, and server-side authorization. The authentication provider and exact configuration are not yet locked by this documentation.

If Supabase Auth is selected later, its JWT/session model and integration with database authorization must be documented before implementation is treated as final.

## Authorization

Initial roles:
- Instructor
- Resident
- Admin/Institution if required

Examples:
- resident cannot edit assessment criteria
- resident cannot access another resident's private record
- instructor cannot cross institution boundary
- only permitted roles can delete configuration

## Tenant isolation

Enforce institution scope on the backend and, where Supabase/Postgres access is exposed to clients, use appropriate database authorization such as Row Level Security. Never rely only on frontend visibility.

## Confirmed Content / Case Library authorization (2026-09-21)

`/content` (Instructor Content / Case Library) redirects a `learner` persona
server-side before rendering — the navigation entry being hidden from that
persona is a convenience, not the boundary, matching the rule above. The
real boundary is the backend: `/cases` and `/procedures` require an
instructor or admin who belongs to an institution, and every case query
joins `cases → programs` and filters on that institution, so a case id from
another institution reads as "not found" rather than "forbidden". `cases`
has no institution column of its own, which is why `cases.program_id` is
`NOT NULL`. `procedures` are shared reference data with no program in the
documented schema, so they are readable by any instructor and are not
editable through this API. Verified with a stubbed database layer only; the
scoping SQL has not yet run against real tables.

## Audit

Audit user/role changes, assessment configuration changes, case/procedure changes, skill weight changes, deletion/archive actions, finalized assessments, and report exports.

## Immutable assessment history

After finalization:
- raw events remain preserved
- configuration versions remain referenced
- finalized results are not silently overwritten

Corrections should create an explicit audit trail.

## Data minimization

Do not introduce real patient identifiers unless required and formally approved.

## Secrets

Never commit passwords, API keys, production tokens, certificates or private keys.

## Clinical safety

Mediver is a training/assessment platform. It should not silently behave as an autonomous clinical decision-maker.

Every clinical rule should have a named owner, version, source/rationale, and approval status.

## Failure cases

Design detectable recovery paths for:
- failed assessment calculation
- lost VR connection
- duplicate events
- database failure
- unauthorized access
- corrupt content/configuration

## Confirmed Current Model Updates (2026-09-15)

## Confirmed planning audit controls

Planning edits are clinically relevant and therefore should be auditable. For any calculated value that the resident overrides, persist the original calculation, final value and reason.

Landmark changes, plan changes, plan lock/transfer and instructor feedback should be attributable to the acting user and remain traceable to the affected case/attempt.

The exact locked plan version used for VR must be preserved so that post-operative assessment can be reproduced against the same plan.
