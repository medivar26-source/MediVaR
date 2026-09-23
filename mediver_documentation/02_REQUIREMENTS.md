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

### Instructor Cohort Management
- Instructors directly provision Learner accounts and enroll them in Cohorts, replacing self-registration or invite-links.
- A single permanent learner account (Learner ID) supports many-to-many cohort memberships across different programs.
- Duplicate membership within the same cohort is prevented.
- A learner cannot simultaneously belong to multiple active cohorts within the same program.

### Learner Account & Credential Management
- Learners receive their permanent Learner ID and an instructor-generated temporary password upon initial provisioning.
- Initial sign-in is performed using the Learner ID and temporary password.
- Learners can update their password at any time from their Account Settings interface (`/settings`).
- Plaintext passwords are never logged, stored in application tables, or exposed in client state.

### Case Library & Content Authoring
- Explicit draft vs published version pointers: `cases` maintains separate `draft_version_id` and `published_version_id` pointers.
- Version mutability rules: Draft versions are mutable (`is_immutable = false`); published versions are permanently frozen immutable snapshots (`is_immutable = true`).
- Traceability: Practice and assessment attempts link directly to the exact `case_version_id` utilized during simulation.
- Strict layer separation: The learner presentation layer strictly excludes reference plans, answer keys, scoring criteria, and instructor notes at the SQL/service boundary.
- Program-scoped access: Learners only access published cases belonging to programs they are actively enrolled in via cohorts.
- Private radiograph storage: Radiographs are stored in a private Supabase Storage bucket (`imaging`), with access restricted to short-lived signed URLs generated at retrieval time.
- Dynamic derived calibration: Radiograph pixel scales are dynamically derived ($\text{scale} = \frac{\text{physical\_mm}}{\text{detected\_px}}$) and validated against physical limits (0.05–1.5 mm/px).
- Pre-flight checklist validation: Freezing a draft into a published version requires passing the pre-flight checklist (metadata, FLAP + KLAT imaging, valid calibration, 6 canonical measurements, component sizing, and rubric criteria).
- Canonical backend calculations: All 6 measurements, component sizing catalogs (Tibial 1–6, Femoral 1–8), and clinical fit metrics (coverage $\ge 90\%$, overhang $\le 1.0$mm, caution $> 1.5$mm, anterior condylar flush $0.0$mm) reside strictly in the backend calculation engine.

