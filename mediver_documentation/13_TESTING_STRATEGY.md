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

## Confirmed Content / Case Library tests (2026-09-21)

`dashboard/src/app/content/__tests__/content.test.ts` covers the authoring
read model (list/search/filter, case/procedure/criteria detail, synthetic
demo case flagging) and every write action's validation, success-shaped and
failure-shaped, per `node:test`.

While implementing this, `npm test` in `dashboard/` had no working runner —
`node --test` on the existing `.test.ts` files failed on plain Node's ESM
resolution (no file extensions). Added `tsx` as a dev dependency and a
`"test": "tsx --test src/**/__tests__/*.test.ts"` script; both the
pre-existing demo-case/V1-workflow tests and the new content tests pass
under it (28/28 at the time of writing). This is a tooling fix, not a
behavior change — no test's assertions were altered.

## Learner Mode review tests (2026-10-20)

Run from `dashboard/` with `npm test` (Git Bash: `npx tsx --test src/app/plan/__tests__/*.test.ts src/lib/__tests__/*.test.ts src/lib/server/calculations/engine.test.ts src/app/content/__tests__/content.test.ts`; the glob does not expand in `cmd`). Backend, from `backend/` with its virtualenv: `venv/Scripts/python.exe -m unittest tests.test_case_authoring tests.test_sessions tests.test_case_list_metadata ...`.

New dashboard suites (`src/lib/__tests__/`): `learner_copy` (wording, planning step labels), `session_links` (which sessions have run, link rules, who may open a session), `planning_help` (the four-page Help article), `case_meta` (case-card metadata, populated and missing), `procedure_cases` (cases under procedures), `planning_side` (no defaults for pathology, side or procedure; the planner blocker), `case_creation` (role permissions, dialog keeps its form, `onDone` versus navigation, validation), `progress_skills` (skills by procedure, one Progress destination), `shell_frame` (which routes are framed, search hints), `early_reads` (token subject used for the early reads). Backend: `test_case_list_metadata.py` (case-list queries, schema with populated and missing metadata).

**Browser checks.** Unit tests cannot cover layout, the dialog or navigation, so these were checked in headless Chrome against a production build and a synthetic stub API (no credentials or real data): the planner at 1366x768, 1280x720 and 1920x1080 (window never scrolls; scan area measured); the Add case dialog (opens with the wizard, Escape closes it, reopening keeps typed text, centred); and client-side navigation (shell kept, requests and backend calls per click, time per click). The harness lives outside the repository. Method: mark the sidebar and top-bar DOM nodes, click sidebar links, record whether the nodes survive, the Network events and the stub API's request log.

**Not covered by automated tests:** a real file upload and publish through the Add case dialog; behaviour against the real backend, database and storage; visual regression. See "Open verification gap: Add case against the real backend and storage" in the change log for the checklist.
