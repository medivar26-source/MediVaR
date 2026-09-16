# Requirements

## Functional requirements

### Identity
- Users can authenticate.
- Users belong to an institution.
- Users have roles.
- Access is checked server-side.
- Authentication implementation is an early delivery priority.
- The exact authentication provider/mode remains to be finalized.

### Programs
- Instructor can create and manage a program.
- Program status can be managed.
- Program contains curriculum, cases, skills and assessment configuration.

### Cohorts
- Instructor can create a cohort.
- Residents can be added to a cohort.
- Cohort progress and performance are visible.
- At-risk residents can be identified from defined rules.

### Cases
A case supports name, difficulty, description, learning objective, procedure, status, version, and assessment criteria.

### Skills
Current framework:
- Bone Cuts & Alignment: 30%
- Gap Assessment: 25%
- Trialling & Stability: 25%
- Implantation: 20%

The weights are product configuration, not a universal clinical rule.

### Assessment settings
Current example configuration:
- Passing score: 70%
- Critical error -> automatic failure: ON
- Incomplete procedure -> automatic failure: ON
- Guidance during assessment -> OFF

These are configurable values.

### Sessions
Instructor can create, schedule, assign residents, choose a case/mode, start/end a session, and observe live state.

### Attempts
An attempt records resident, session, case, attempt number, start/completion times, status, raw execution data, and assessment result.

### Feedback
Instructor can attach feedback to an attempt and notes to a resident.

### Reports
Minimum report families: resident, cohort, case, skill, export/share.

## Non-functional requirements

### Reliability
No completed assessment may disappear because a UI session ends.

### Security
Every protected resource must be authorized on the backend.

### Auditability
Changes to clinically relevant configuration and assessment results should be traceable.

### Performance
Use efficient queries and indexes first. Add dedicated analytics infrastructure only when justified by measured need.

### Maintainability
Clinical rules should live in versioned/configurable backend structures rather than frontend code.

### Extensibility
Additional procedures/cases/skills should be addable without redesigning the entire schema.

## Current implementation sequencing note

Authentication is intended to be addressed first during implementation. This document does not prescribe the full implementation phase order. The exact authentication provider/configuration and the detailed build sequence remain separate team decisions.

## Confirmed Current Model Updates (2026-09-15)

### TKR pre-operative planning
- X-ray scans shall be displayed on an interactive planning canvas.
- Residents shall place and adjust anatomical landmarks directly on the canvas.
- The planning workspace shall support FLAP and KLAT view switching with a toggle.
- Landmarks and measurements placed in either view shall persist when switching between views.
- Measurements dependent on a moved landmark shall recalculate in real time.
- Geometry shall remain visualized on the X-ray while numeric measurement values are presented in a side panel.
- The four assessment measurements are HKA, mLDFA, mPTA and VCA.
- Each assessment measurement shall have an independent Confirm/Edit action.
- Editing shall support direct numeric editing and landmark adjustment.
- Overridden calculated values shall preserve the original suggestion, final value and reason for modification.
- After assessment confirmation, the resident shall explicitly proceed to the next planning stage.
- Existing femoral and tibial planning functions shall be retained, including viewing the implant on the X-ray and configuring the established planning parameters.
- The Review & Send stage shall retain the established summary/verification content and transfer the locked plan to VR.

### Post-operative review
- After VR completion, the application shall return to MediVeR for review of the operation.
- Both residents and instructors shall be able to view the results.
- Review shall expose plan vs execution, match/adherence information, deviations and mistakes.
- Instructor feedback may be attached to specific mistakes or procedural steps.
- Residents shall be able to revisit instructor feedback before a subsequent practice attempt.
