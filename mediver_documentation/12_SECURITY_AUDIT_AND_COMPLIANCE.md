# Security, Audit and Clinical-Safety Controls

## Authentication & Credential Management

- **Instructor-Provisioned Accounts**: Learners are provisioned with permanent Learner IDs (`MVR-XXXXXX`) and temporary passwords by their instructors.
- **Self-Service Password Update**: Authenticated learners can change their password at any time via Account Settings.
- **Verification Before Update**: Changing credentials requires re-authenticating the current password before any modification is applied.
- **Ownership Scoping**: Users may only update credentials for their own authenticated account (`current_user.id`). Cross-user password modifications are rejected.
- **Complexity Requirements**: Minimum 8 characters, confirmation match, and different from the current password.
- **Zero Exposure**: Plaintext passwords are never logged, stored in application tables, or transmitted in unencrypted formats. Supabase Auth manages hashing and credential storage.

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
