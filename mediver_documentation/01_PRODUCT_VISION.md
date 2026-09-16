# Product Vision

## Product goal

Mediver should provide an end-to-end training loop for TKA residents:

```text
Configure curriculum
-> configure cases
-> define skills and assessment rules
-> create cohort
-> add residents
-> assign training
-> schedule session
-> resident performs procedure in VR
-> VR sends execution data
-> assessment engine evaluates execution
-> instructor reviews results
-> recommendation is generated
-> resident practices again
-> progression is tracked
```

## Primary products

### Instructor Web Application
Used to plan programs, manage cohorts/residents, configure cases and assessments, assign training, run sessions, review attempts, provide feedback, and generate reports.

### Resident VR Application
Used to receive assignments, perform simulated procedures, generate structured execution events, complete attempts, and receive the result appropriate to the configured mode.

### Backend Platform
Owns authentication, authorization, domain rules, persistence, assessment execution, recommendations, reporting data, and real-time state.

## MVP boundary

### In scope
- Multi-institution data model
- Instructor and resident roles
- Programs and cohorts
- Cases and procedures
- Skills and skill items
- Assessment settings
- Training assignments
- Sessions
- Attempts
- VR events and clinical measurements
- Error records
- Assessment results
- Skill scores
- Recommendations
- Instructor feedback and notes
- Basic reporting
- Real-time session state

### Not assumed as MVP
- Automated clinical decision-making
- Production patient-data workflows
- AI-based assessment
- Complex EHR integration
- Autonomous clinical certification

## Quality principles

- Explainable assessment
- Configuration over hard-coded clinical rules
- Immutable historical assessment results
- Institution-level data isolation
- Traceability from dashboard metric to raw attempt
- Safe failure behavior
- Deterministic scoring for identical inputs

## Confirmed Current Model Updates (2026-09-15)

The end-to-end training loop is unchanged and remains the product goal.

The TKR planning stage is explicitly the pre-operative desktop stage before VR: residents work directly on X-ray views to assess alignment and configure the operative plan, then transfer the confirmed plan into VR. The post-VR learning loop returns to MediVeR for review, comparison of plan vs execution, instructor feedback, and subsequent practice.

### Confirmed product interaction model
- Interactive X-ray canvas is the resident's planning workspace.
- FLAP and KLAT are switchable views within the same planning session.
- Planning is assistive: MediVeR calculates/suggests values, while the resident confirms or edits them.
- The resident's confirmed plan is transferred to the separate VR execution product surface.
