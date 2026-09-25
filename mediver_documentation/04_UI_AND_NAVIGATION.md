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

Implemented at `/content` (instructor/admin only), distinct from two screens it is
often confused with:
- `/cases` is the learner-facing case browser — what a resident may attempt.
  `/content` is where that catalogue is authored, and it is the only screen
  that shows an inactive/draft case.
- `/plan/[id]` is the TKR pre-operative planning workspace. `/content`
  manages the case a plan is built from; it does not contain planning
  controls itself.

### Settings
- Program settings
- Assessment settings
- User management
- Institution settings

## Learner Environment

### Navigation Model
- **Primary Unit**: Programs (`/programs`). Learners navigate through their enrolled Programs rather than Cohorts.
- **Contextual Cohort Metadata**: The associated cohort name (e.g., `Cohort: March 2026`) is displayed strictly as secondary, read-only contextual metadata inside the program listing (`/programs`), program detail (`/programs/[id]`), and main dashboard (`/`).
- **No Cohort Administration**: Learners never see cohort-selection, cohort-switching, or administrative controls.
- **Program Detail** (`/programs/[id]`): Shows the learner's own curriculum cases, readiness, session history, and assessment records. Excludes instructor cohort analytics (cohort mean, below pass, other learners, hotspots).

### Learner Training Dashboard (`/`)
The learner dashboard is structured as an action-first personal training cockpit answering: *"What do I do next, and where am I weak?"*.
1. **Welcome & Context Header**: Personalized greeting, learner level, pass mark threshold, session completion count, and enrolled program name with secondary cohort metadata (`Cohort: <Name>`).
2. **Next Action Hero Banner**: Dynamically resolves the highest-priority next clinical action based on real persisted state:
   - Priority 1: Active live headset simulation (`/sessions/[id]`)
   - Priority 2: Interrupted session ready to resume (`/sessions/[id]`)
   - Priority 3: Draft pre-operative plan in progress (`/plan/[id]`)
   - Priority 4: Sealed/paired plan ready for VR headset transfer (`/plan/[id]/review`)
   - Priority 5: Assigned unattempted curriculum case (`/cases/[id]`)
   - Priority 6: Latest assessment report review (`/sessions/[id]/report`)
   - Priority 7: Case catalogue exploration fallback (`/cases`)
3. **Your Programs**: Enrolled program cards displaying title, description, cohort metadata, and real curriculum progress metrics (`X of Y cases completed`, `% complete`).
4. **Assigned Cases**: Clinical cases in the active program curriculum displaying accurate individual lifecycle status chips (`Not started`, `In planning`, `Ready for VR`, `Completed`, `Needs retry`) and contextual direct planning action links.
5. **Active Simulation & Latest Assessment**: 2-column operational status displaying active headset state (`LiveDial`) alongside the learner's most recent score, duration, and direct debrief link.
6. **Personal Progress**: Overall readiness score (/100), pass rate %, best score, completed sessions count, total training time, and critical error penalties.
7. **Focus Area**: Targeted recommendation highlighting the learner's lowest-scoring clinical competency domain (e.g., Bone cuts & alignment) with average mark percentage and direct practice link.
8. **Recent Activity**: Chronological list of completed attempts with scores, mode, date, duration, and report access.
9. **Detailed Analytics**: Secondary supporting analytics drawer containing historical score dynamics vs. cohort benchmark, points/time lost rankings, and weekly training cadence.

### Learner Account Settings (`/settings`)
- **Account Details**: Editable profile settings (display name, training level, default difficulty).
- **Security & Password Management**: Dedicated password change section. Learners can update their temporary credentials to a private personal password. Verifies current password before applying changes.
- **Administered Metadata**: Displays learner account identity, including permanent Learner ID (`MVR-XXXXXX`), enrolled cohort, role, and account creation timestamp.

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

## Confirmed V1 TKA Preoperative Planning Workspace

The pre-operative planning UI adheres to **Mediver User Planning Workflow V1.pdf**:

$$\text{MEASURE} \longrightarrow \text{SIZE} \longrightarrow \text{SEND}$$

### Strict 4-Page Sequence
1. **Page 1: Assessment** (`/plan/[id]/assessment`)
   - Interactive zoom/pan X-ray viewport (FLAP and KLAT toggle with preserved landmark state).
   - Placement of shared anatomical landmarks for 6 clinical measurements: MAD (mm), AMA (°), mHKA (°), MPTA (°), LDFA (°), PTS (°).
   - Radio-opaque 25mm spherical calibration scale (0.264 mm/px).
   - Forward link: `[ Continue to Tibial Planning → ]`.
2. **Page 2: Tibial Planning** (`/plan/[id]/tibial`)
   - 2D CAD template overlay (Sizes 1 to 6) with translation and rotation handles.
   - Sizing toolbar with discrete buttons (Size 3 suggested).
   - Live clinical fit metrics: Cortical Coverage $\ge 90\%$, Medial & Lateral Overhang $\le 1.0\text{ mm}$, Overall Status `ACCEPTABLE FIT`.
   - Forward link: `[ Continue to Femoral Planning → ]`.
3. **Page 3: Femoral Planning** (`/plan/[id]/femoral`)
   - 2D CAD template overlay (Sizes 1 to 8) with translation and rotation handles (Size 4 suggested).
   - Live clinical fit metrics: AP Coverage, ML Coverage, Anterior Condylar Flush / Notching Risk verification ($0.0\text{ mm}$ flush).
   - Forward link: `[ Continue to Review → ]`.
4. **Page 4: Review & Send to VR** (`/plan/[id]/review`)
   - 3 structured summary cards: Patient & Radiographs, Assessment Measurements, Component Selections & Fit.
   - Non-destructive backward editing: `[ ← Back to Planning ]`.
   - `[ LOCK PLAN & SEND TO VR → ]` modal confirmation.
   - Irreversible seal to immutable V1 VR Payload schema (Pages 6-7 PDF).
   - Truthful VR transport message ("VR transport unavailable / not implemented").
   - Read-only locking of entire planning software once sealed.

### Strict Exclusions from 2D Planning
Resection depths, cut angles (varus/valgus, flexion/extension), posterior slope cutting controls, poly thickness sliders, gap balancing previews, and 3D cut planes are excluded from desktop planning and deferred to intraoperative VR execution.
