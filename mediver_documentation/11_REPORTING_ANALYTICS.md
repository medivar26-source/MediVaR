# Reporting and Analytics

## Report types

### Resident
- competency
- progression
- completion
- case history
- attempt history
- skill performance
- recurring errors
- recommendations
- instructor feedback

### Cohort
- size
- completion
- competency distribution
- skill distribution
- at-risk learners
- case performance
- assessment activity

### Case
- attempts
- pass/fail
- average score
- common errors
- skill impact
- trend

### Skill
- population score
- resident distribution
- weak areas
- progress trend

## Derived metrics

Possible metrics:
- completion rate
- assessment completion rate
- average attempts per case
- repeat-error rate
- skill improvement delta
- time-to-completion
- case pass rate

Every metric must define source tables, inclusion rules, time window, denominator, and missing-data handling.

## Competency history

Never overwrite history when a new assessment is completed. Store the observation and calculate the current view from historical observations.

## Performance strategy

Start with SQL queries and indexes. Add caching/materialized views or separate analytics infrastructure only when justified by observed workload.

## Export

Exports should run server-side, honor authorization, record the requesting user, include generated-at time, and identify the reporting period.

## Confirmed Current Model Updates (2026-09-15)

## Confirmed post-operative review inputs

Reporting shall continue to distinguish source data from derived metrics. For TKR review, the source chain includes:

```text
Locked pre-op plan
-> VR execution events / measurements
-> plan-vs-execution comparison
-> deviations / errors
-> assessment result
-> resident + instructor review
-> instructor feedback
```

The post-operative review surface must support the established comparison of planned values and executed values, including match/adherence percentage where configured, location/context of mistakes, step-level evidence and instructor feedback. Both resident and instructor are permitted to view results; instructor feedback remains reusable by the resident before a later attempt.
