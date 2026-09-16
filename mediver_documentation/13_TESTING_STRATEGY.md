# Testing Strategy

## Test levels

```text
E2E
 |
Integration + VR Contract
 |
Unit
```

## Unit tests

Test criterion evaluation, deviation calculations, severity classification, score aggregation, automatic failure, recommendations, permissions, and state transitions.

## Integration tests

Test API + DB, transaction behavior, event ingestion, assessment persistence, institution isolation, and session lifecycle.

## Contract tests

Test that VR and backend agree on event shape, IDs, sequence behavior, units, optional/required fields, acknowledgments, and version fields.

## E2E minimum

1. Instructor login
2. Create/select cohort
3. Assign case
4. Create session
5. Resident starts attempt
6. Events arrive
7. Attempt completes
8. Assessment generated
9. Instructor reviews
10. Feedback saved
11. Recommendation appears

## Assessment golden tests

Fixtures should include:
- perfect execution
- warning deviation
- major deviation
- critical error
- incomplete procedure
- duplicate event
- out-of-order event
- missing measurement
- reconnect
- no data

## Clinical validation

Clinical SMEs should validate terminology, planning workflow, parameter definitions, tolerances, severity mapping, scoring and recommendations.

Software tests cannot substitute for clinical approval.

## Regression

Every phase runs lint, type checks, unit tests and relevant integration tests. Keep the main branch green.

## Confirmed Current Model Updates (2026-09-15)

## Confirmed TKR planning tests

Add test coverage for:
- FLAP/KLAT toggle preserving per-view landmark/measurement state
- landmark movement triggering dependent recalculation
- four assessment measurements: HKA, mLDFA, mPTA and VCA
- independent measurement confirm/edit behavior
- numeric editing and landmark-based editing
- mandatory override reason capture
- preservation of original and final values
- femoral/tibial implant overlay and planning-control behavior
- review summary completeness
- locked-plan transfer to VR
- post-operative plan-vs-execution review visibility for both roles
- instructor feedback linked to a specific error or step and visible later to the resident

Existing geometry, clinical calculation, assessment and VR contract tests remain required.
