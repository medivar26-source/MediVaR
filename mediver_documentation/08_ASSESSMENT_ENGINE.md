# Assessment Engine

## Purpose

Convert execution evidence into criterion outcomes, errors, skill scores, final score/pass-fail, and recommendations.

## Pipeline

```text
Raw VR events
-> normalize
-> derive clinical measurements
-> select applicable criteria
-> compare target vs actual
-> calculate deviation
-> classify severity
-> aggregate criterion outcomes
-> aggregate skill scores
-> apply automatic-failure rules
-> calculate final score/result
-> persist immutable assessment
-> generate recommendation
```

## Example

```text
Planned tibial angle = 3°
Actual tibial angle = 6°
Deviation = +3°
-> tolerance check
-> outside configured tolerance
-> error classification
-> bone alignment skill impact
-> score impact
-> possible automatic failure depending on configured severity rule
```

The exact tolerance and severity thresholds must come from configured assessment criteria or an approved clinical specification.

## Current configuration examples

- Passing score: 70%
- Critical error -> automatic failure: ON
- Incomplete procedure -> automatic failure: ON
- Guidance during assessment: OFF

## Scoring architecture

Use explicit steps:
1. Criterion score
2. Skill aggregation
3. Skill weighting
4. Overall score
5. Rule-based overrides
6. Final result

Store enough intermediate values to explain the result.

## Explainability

Instructor should be able to answer:
- What was planned?
- What happened?
- How far was it from target?
- Which criterion was affected?
- Which skill was affected?
- How did it affect the score?
- Did an automatic-failure rule trigger?
- Which assessment configuration version was used?

## Attempt score vs competency

Attempt score is one performance observation. Competency is a longitudinal state derived from multiple observations. The aggregation policy for competency must be explicitly defined.

## Recommendations

Potential inputs:
- low skill score
- repeated major/critical errors
- repeated failure on one criterion
- inactivity/overdue training
- improvement trend

Recommendations should be traceable to evidence.

## Confirmed Current Model Updates (2026-09-15)

## Confirmed pre-operative plan provenance

Assessment remains based on the existing plan-vs-actual architecture. For TKR pre-operative planning, the engine must distinguish:
- raw landmark placement
- calculated/suggested measurement
- resident-confirmed or edited measurement
- final planned value used for VR
- actual execution value from VR

Post-operative comparison must use the exact locked plan version transferred to VR.

## Confirmed review and feedback

Assessment results remain visible to both resident and instructor. Instructor feedback can be tied to a particular error or procedural step. Resident-facing review should expose the evidence needed to understand what was planned, what was executed, where deviations occurred, and how the instructor corrected the issue.
