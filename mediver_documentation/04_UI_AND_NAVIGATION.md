# UI and Navigation

## Instructor Environment

### Dashboard
- Cohorts
- Residents
- Sessions
- Alerts
- Overall performance

### Programs
- Curriculum
- Cases
- Skills
- Assessments
- Cohort assignment

### Cohorts
- Residents
- Progress
- Completion
- Performance
- At-risk learners

### Residents
- Individual profile
- Case history
- Skill performance
- Errors
- Progression
- Recommendations

### Sessions
- Upcoming
- Live
- Completed
- Session details

### Reports
- Resident reports
- Cohort reports
- Case reports
- Skill reports
- Export/share

### Content / Case Library
- Cases
- Procedures
- Difficulty
- Learning objectives
- Assessment criteria

### Settings
- Program settings
- Assessment settings
- User management
- Institution settings

## Dashboard example data

- Residents: 24
- Active cases: 8
- Sessions this week: 6
- Completion: 68%
- Overall competency: 72%
- Bone cuts & alignment: 68%
- Gap assessment: 74%
- Trialling & stability: 79%
- Implantation: 70%

## Resident example

Arun Kumar:
- Competency: 54%
- Status: At risk
- Previous competency: 62%
- Completion: 42%
- Cases: 5/12
- Assessments: 3/8

## UI behavior

Every data screen supports loading, empty, error, unauthorized and not-found states.

Deep links should resolve directly and browser back/forward should work.

Important destructive operations should use explicit confirmation, with archival/soft-delete preferred for important configuration.

## Review screen

An attempt review should expose:
- score
- pass/fail
- skill breakdown
- plan vs execution
- errors
- relevant evidence
- instructor feedback

## Visual direction

The existing prototype uses a clean clinical SaaS style: light neutral background, white rounded cards, strong typography hierarchy, restrained accent actions, readable tables, and clear status treatment.

## Confirmed Current Model Updates (2026-09-15)

## Confirmed TKR Planning Workspace

The pre-operative planning UI shall retain the existing MediVeR visual language while providing an interactive X-ray workspace.

### Canvas
- X-ray scan displayed directly on the planning canvas.
- Landmarks placed and adjusted on the image.
- Measurement geometry drawn over the X-ray.
- Dependent geometry and measurements update in real time after landmark movement.
- FLAP/KLAT toggle switches views without losing placed work.

### Measurement panel
- Numeric values displayed separately from the X-ray geometry.
- HKA, mLDFA, mPTA and VCA each have independent Confirm/Edit actions.
- Edit supports direct numeric entry or landmark adjustment.
- Confirmed/edited state is visible per measurement.

### Femoral and tibial planning
- Keep the prior functional requirements.
- Show the implant overlay against the anatomy on the X-ray.
- Preserve the established planning controls for sizing, positioning, alignment/resection settings and other existing parameters.
- Use the current MediVeR UI/UX system rather than copying the supplied reference screen design.

### Review & Send
Retain the established assessment, tibial and femoral summary information and final transfer action.

### Post-operative review
Both resident and instructor can view the result. The review exposes the planned configuration, actual execution, match/adherence information, deviations and mistakes. Instructor feedback is attached to specific mistakes or steps and remains available to the resident later.
