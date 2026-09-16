# Definition of Done

A feature is not complete because the UI renders.

## Product
- Requirement documented
- User journey documented
- Acceptance criteria defined

## Frontend
- UI implemented
- loading/empty/error/unauthorized states
- validation
- accessibility basics

## Backend
- API
- authorization
- validation
- structured errors
- logging
- tests

## Database
- migration
- constraints
- indexes
- seed/update path where needed

## Assessment features
- deterministic
- explainable
- versioned
- raw evidence preserved
- clinical rules sourced/configured
- historical result not silently overwritten

## VR
- contract documented
- event schema validated
- retry/idempotency
- reconnect handling
- attempt lifecycle tested

## Reporting
- source and formula documented
- authorization enforced
- export tested

## Operations
- monitoring/logging
- backup implications considered
- failure modes documented

## Phase gate

A phase is complete only when implementation works, tests pass, documentation is updated, unresolved assumptions are written down, and no critical security/clinical issue is hidden.

## Production gate

Production/pilot additionally requires clinical validation, security review, recovery test, assessment golden tests, VR integration tests, and stakeholder acceptance.

## Confirmed Current Model Updates (2026-09-15)

## Confirmed TKR planning completion checks

A TKR planning feature is not complete until:
- X-ray canvas interaction works for FLAP and KLAT.
- Landmark state persists correctly across view switching.
- Dependent calculations update in real time after landmark changes.
- HKA, mLDFA, mPTA and VCA each support independent confirmation/editing.
- Numeric and landmark editing paths are tested.
- Override audit data is stored.
- Femoral and tibial planning functions are preserved with visible implant overlays.
- Review & Send exposes the required summary content.
- The final plan can be locked and transferred to VR.
- Post-operative plan-vs-execution review is available to both resident and instructor.
- Instructor step/error-specific feedback can be stored and later viewed by the resident.
