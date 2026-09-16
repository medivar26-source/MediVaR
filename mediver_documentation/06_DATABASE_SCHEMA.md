# Database Schema

## Database platform
Supabase, using PostgreSQL as the underlying relational database.

The schema below is the logical application data model. It remains part of the technical documentation even though the team is intentionally not making database/schema implementation the first delivery step.

## Identity

### institutions
```text
id UUID PK
name TEXT NOT NULL
address TEXT
created_at TIMESTAMP
updated_at TIMESTAMP
```

### users
```text
id UUID PK
institution_id UUID FK -> institutions.id
first_name TEXT
last_name TEXT
email TEXT UNIQUE
password_hash TEXT
role TEXT
status TEXT
created_at TIMESTAMP
updated_at TIMESTAMP
```

## Training

### programs
```text
id UUID PK
institution_id UUID FK
name TEXT
description TEXT
status TEXT
created_at TIMESTAMP
updated_at TIMESTAMP
```

### cohorts
```text
id UUID PK
program_id UUID FK
name TEXT
year INTEGER
status TEXT
start_date DATE
end_date DATE
created_at TIMESTAMP
updated_at TIMESTAMP
```

### cohort_members
```text
id UUID PK
cohort_id UUID FK
resident_id UUID FK -> users.id
status TEXT
joined_at TIMESTAMP
completed_at TIMESTAMP
UNIQUE(cohort_id, resident_id)
```

## Cases and procedures

### cases
```text
id UUID PK
program_id UUID FK
procedure_id UUID FK
name TEXT
difficulty TEXT
description TEXT
learning_objective TEXT
status TEXT
version INTEGER
created_at TIMESTAMP
updated_at TIMESTAMP
```

### procedures
```text
id UUID PK
name TEXT
description TEXT
version INTEGER
created_at TIMESTAMP
updated_at TIMESTAMP
```

### procedure_steps
```text
id UUID PK
procedure_id UUID FK
step_number INTEGER
name TEXT
description TEXT
required BOOLEAN
created_at TIMESTAMP
updated_at TIMESTAMP
UNIQUE(procedure_id, step_number)
```

## Skills

### skills
```text
id UUID PK
program_id UUID FK
name TEXT
description TEXT
weight NUMERIC
created_at TIMESTAMP
updated_at TIMESTAMP
```

### skill_items
```text
id UUID PK
skill_id UUID FK
name TEXT
description TEXT
created_at TIMESTAMP
updated_at TIMESTAMP
```

## Assessment configuration

### assessment_settings
```text
id UUID PK
program_id UUID FK
version INTEGER
passing_score NUMERIC
critical_auto_fail BOOLEAN
incomplete_auto_fail BOOLEAN
guidance_enabled BOOLEAN
created_at TIMESTAMP
updated_at TIMESTAMP
```

### assessment_criteria
```text
id UUID PK
case_id UUID FK
skill_id UUID FK
name TEXT
parameter TEXT
target_value NUMERIC
tolerance_min NUMERIC
tolerance_max NUMERIC
unit TEXT
severity_rule JSONB
version INTEGER
created_at TIMESTAMP
updated_at TIMESTAMP
```

## Sessions

### sessions
```text
id UUID PK
cohort_id UUID FK
case_id UUID FK
instructor_id UUID FK -> users.id
name TEXT
mode TEXT
scheduled_at TIMESTAMP
started_at TIMESTAMP
ended_at TIMESTAMP
status TEXT
created_at TIMESTAMP
updated_at TIMESTAMP
```

### session_residents
```text
id UUID PK
session_id UUID FK
resident_id UUID FK
status TEXT
joined_at TIMESTAMP
completed_at TIMESTAMP
UNIQUE(session_id, resident_id)
```

## Attempts and execution

### attempts
```text
id UUID PK
resident_id UUID FK
session_id UUID FK NULL
case_id UUID FK
attempt_number INTEGER
case_version INTEGER
assessment_settings_version INTEGER NULL
started_at TIMESTAMP
completed_at TIMESTAMP NULL
status TEXT
created_at TIMESTAMP
updated_at TIMESTAMP
```

### vr_events
```text
id UUID PK
attempt_id UUID FK
event_timestamp TIMESTAMP
procedure_step_id UUID NULL
event_type TEXT
parameter_name TEXT NULL
planned_value NUMERIC NULL
actual_value NUMERIC NULL
unit TEXT NULL
metadata JSONB
sequence_number BIGINT
```

Indexes:
- `(attempt_id, sequence_number)`
- `(attempt_id, event_timestamp)`
- `(event_type)`
- optional `(parameter_name)`

### clinical_measurements
```text
id UUID PK
attempt_id UUID FK
parameter TEXT
planned_value NUMERIC
actual_value NUMERIC
deviation NUMERIC
unit TEXT
plane TEXT NULL
metadata JSONB
created_at TIMESTAMP
```

## Assessment results

### errors
```text
id UUID PK
attempt_id UUID FK
skill_id UUID FK
criterion_id UUID FK
severity TEXT
error_type TEXT
description TEXT
planned_value NUMERIC NULL
actual_value NUMERIC NULL
deviation NUMERIC NULL
detected_at TIMESTAMP
```

### assessment_results
```text
id UUID PK
attempt_id UUID FK UNIQUE
overall_score NUMERIC
result TEXT
critical_error BOOLEAN
completed BOOLEAN
assessment_config_version INTEGER
assessed_at TIMESTAMP
explanation JSONB
```

### skill_scores
```text
id UUID PK
assessment_id UUID FK
skill_id UUID FK
score NUMERIC
weight NUMERIC
weighted_score NUMERIC NULL
```

## Learning loop

### recommendations
```text
id UUID PK
resident_id UUID FK
skill_id UUID FK
case_id UUID FK NULL
reason TEXT
priority TEXT
status TEXT
created_at TIMESTAMP
completed_at TIMESTAMP NULL
```

### instructor_feedback
```text
id UUID PK
resident_id UUID FK
attempt_id UUID FK NULL
instructor_id UUID FK
feedback TEXT
created_at TIMESTAMP
```

### instructor_notes
```text
id UUID PK
resident_id UUID FK
instructor_id UUID FK
note TEXT
created_at TIMESTAMP
updated_at TIMESTAMP
```

## Training assignments

The product needs persisted assignments even if the initial prototype uses a simpler assignment UI.

```text
training_assignments
id UUID PK
resident_id UUID FK
case_id UUID FK
cohort_id UUID FK NULL
mode TEXT
due_at TIMESTAMP NULL
status TEXT
assigned_by UUID FK
created_at TIMESTAMP
completed_at TIMESTAMP NULL
```

## Audit logs

Recommended:
```text
audit_logs
id UUID PK
institution_id UUID FK
actor_id UUID FK
action TEXT
entity_type TEXT
entity_id UUID
before JSONB
after JSONB
created_at TIMESTAMP
```

## Relationship map

```text
Institution
 -> Program
 -> Cohort
 -> Cohort Members
 -> Residents

Program
 -> Cases
 -> Procedures
 -> Skills
 -> Assessment Settings

Cohort
 -> Sessions
 -> Training Assignments

Session
 -> Session Residents
 -> Attempts

Attempt
 -> VR Events
 -> Clinical Measurements
 -> Errors
 -> Assessment Result
 -> Skill Scores

Resident
 -> Recommendations
 -> Feedback
 -> Notes
```

## Scoring caveat

The displayed skill weights are 30/25/25/20, but the example dashboard/ resident scores do not establish one formula that reproduces every displayed overall competency. Final scoring must therefore be explicitly specified and approved before production use.

## Confirmed Current Model Updates (2026-09-15)

## Confirmed planning data requirements

The previous relational model remains the baseline. The implementation shall persist enough planning information to reproduce the resident's pre-operative work without overwriting historical values.

Planning persistence must support, at minimum:
- case and plan identity/version
- planning view (FLAP/KLAT)
- X-ray/image reference and calibration metadata where available
- anatomical landmarks and their coordinates
- derived measurement values and units
- original calculated/suggested value
- resident-confirmed value
- override reason when a suggested value is changed
- component sizing and established planning parameters for femoral and tibial planning
- plan readiness/lock state
- the exact plan version transferred to VR

The existing `clinical_measurements` model can support plan-vs-actual data, but pre-operative planning records must remain distinguishable from post-operative execution measurements.

## Confirmed feedback linkage

`instructor_feedback` shall support attachment to a specific attempt and, where applicable, a specific procedural step, event or error so that instructor corrections can be shown in context to the resident later. Existing general resident notes remain supported.
