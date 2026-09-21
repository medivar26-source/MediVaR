# Seed Data and Demo Scenarios

## Demo institution

`Mediver Demo Hospital`

## Demo program

`Total Knee Arthroplasty - Residency Training`

## Cohort 2026A
- residents: 24
- progress: 68%
- average competency: 72%
- completion: 16/24
- at risk: 3
- next session: Today, 2:00 PM

## Cohort 2026B
- residents: 18
- progress: 42%
- average competency: 65%
- completion: 7/18
- at risk: 5
- next session: Tomorrow, 10:00 AM

## Resident example

Arun Kumar:
- competency 54%
- status At risk
- previous competency 62%
- completion 42%
- cases 5/12
- assessments 3/8

Skill examples:
- Bone cuts & alignment 48%
- Gap assessment 61%
- Trialling & stability 72%
- Implantation 55%

Weaknesses:
1. Tibial cut execution
2. Femoral alignment
3. Gap assessment

## Case example

`Varus OA - Right Knee`

- Difficulty: Intermediate
- Objective: Practice alignment + bone cuts
- Assessment criteria: mechanical alignment, tibial cut, femoral cut, gap balance

## Attempt example

```text
Tibial angle planned: 3°
Tibial angle executed: 6°
Difference: +3°
Result: FAILED
```

This is demo/test data, not a universal clinical rule.

## Authentication demo

Authentication fixtures should include at least one resident account, one instructor account, valid login, invalid login, inactive account, unauthorized resource access, and role-isolation scenarios. The exact identity provider and credential bootstrap mechanism remain open.

## Test fixtures

Create deterministic fixtures for pass, fail, critical failure, incomplete, duplicate event, missing event, reconnect and no-data cases.

## Confirmed Current Model Updates (2026-09-15)

## Confirmed planning demo requirements

The deterministic demo should include at least one TKR case whose seed scenario supports:
- FLAP and KLAT X-ray views
- HKA, mLDFA, mPTA and VCA assessment
- example landmark placement with recalculation
- a resident-confirmed measurement set
- femoral and tibial component planning
- a locked plan transferred to a simulated VR attempt
- a post-operative review showing planned vs executed values and a mistake
- instructor feedback tied to that mistake and visible to the resident on later review

Existing pass/fail, critical error, incomplete, duplicate-event and reconnect fixtures remain unchanged.

## Confirmed Content / Case Library demo handling (2026-09-21)

`SYNTH-VARUS-001` and `SYNTH-VALGUS-001` appear in `/content`'s case
catalogue like any other authored case — searchable, filterable, openable —
but every surface carries a `DEMO / SYNTHETIC` badge and the case detail
screen adds a standing "not for clinical use" notice. Their TKR planning
data and image references are untouched; the Content page only adds an
authoring projection on top of the same seed rows `/cases` and `/plan`
already read.
