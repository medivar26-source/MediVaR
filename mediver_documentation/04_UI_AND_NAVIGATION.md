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
- **Program Detail** (`/programs/[id]`): Shows the learner's own cases, readiness, session history, and assessment records. Excludes instructor cohort analytics (cohort mean, below pass, other learners, hotspots).
- **Headings and subtext (Learner Mode review, 2026-10-20)**: Headings carry no "Curriculum" or "Pathways" wording and no eyebrow line, because the navigation already provides context. Subtext is one line of guidance ("Open a program to see its cases and start planning."). `/programs` shows the enrolled count as a small circular badge beside the title (`PageHeader count`) instead of a stat card.
- **Case cards on Program Detail**: A card shows the title, the best score (only once attempted), a one-paragraph summary and the attempt count. Pathology, side and difficulty are not shown as tags there (they stay in the data and are shown as labelled fields on Procedures). Each card has one action, **Open case →**; the former "Not attempted", "Unattempted" and "Plan case" labels all led to the same page and are removed.
- **Sessions** (`/sessions`): the learner view uses the same compact heading (no eyebrow) and a single-band totals strip (`StatStrip`) instead of four stat cards. The "Preview data" banner names which figures are sample data and which are live (see `DemoDataNote`).
- **Case page, learner view** (`/cases/[id]`): one column in a fixed order: case name and one-paragraph description; the case's metadata as labelled fields (Pathology, Side, Difficulty, Cohort), not tags; Patient snapshot; Scans; Scoring; then Plans & attempts (the journey strip, a compact totals strip, the learner's plans, the attempt history). Learning objectives are kept in the case data (and in instructor authoring) but are no longer displayed to learners. Attempt rows carry Session and Report buttons; the instructor case view is unchanged.
- **Sessions and reports**: a learner has one session list, used by every screen; sample sessions are labelled "Sample" and are visible only to the sample accounts that own them. Session, Case and Report are separate buttons, and the Session page keeps a finished session on the session (with Back to case, Open plan, View report, All sessions).
- **Procedures** (`/content?tab=procedures`): one list of procedures, each expandable. An expanded procedure shows its cases as cards, then its workflow steps (P0–P11) under "Workflow and steps". The first published procedure that has cases opens by default. A card shows the case title, a short description and four labelled fields: Pathology, Side, Difficulty and, for a learner, Attempts (for an instructor, Version and a Published/Draft badge). A field the record does not have reads **Not recorded**; a default is never shown. The whole card opens the case. Cases that match no listed procedure are kept under "Other cases". There is no separate Cases tab or "View cases" button; `?tab=cases` still redirects to the Case Library, which stays in the side navigation and keeps instructor case management.
- **Add case (Procedures)**: an **Add case** button in the Procedures header opens the existing case-creation workflow for the signed-in role in a dialog, instead of navigating to a separate page. Instructors and administrators get the institutional wizard (the same steps, validation, uploads and publishing as `/cases/new`, with the programs and skills it needs); learners get the personal-case wizard (as `/personal-cases/new`). The dialog is the platform `<dialog>` (focus trapped, Escape closes it, backdrop click closes it). Its form is created on first open and kept, so closing the dialog by accident does not lose what was typed. When a case is saved or published the dialog closes, the Procedures list refreshes so the new case appears, and a "Case saved. Open the case" link is shown; the user stays on Procedures. `/cases/new` and `/personal-cases/new` still work and behave as before. The API enforces who may create what; the button only chooses the matching workflow.
- **Missing case metadata and planning**: a case detail page shows **Not recorded** for a pathology or side the record does not have; nothing is defaulted. Pathology is display-only. The **operative side** is required to plan: with no recorded side, Start/Resume planning is disabled with the reason, no plan is created on the fly (`/plan/<case id>`), a plan that already exists shows a notice instead of the planner pages, and a plan cannot be sealed for the headset. A plan already sealed keeps the side in its VR payload. When editing a case that records no side, the wizard does not preselect one: the author must choose Left or Right before saving or publishing.
- **Pre-op Plans, planning mode** (`/plans`): a compact totals strip, then a case list on the left and the selected case on the right (`?case=<id>`; default is the case worked on most recently). The right side shows the case's description and labelled fields, Start/Resume planning, the learner's plans on it, and its sessions and reports with Session / Case / Report buttons. Cases listed are the Case Library as the learner sees it plus their own cases. Below, "All your plans" keeps the state filter, the full plans table and the PIN note exactly as before.
- **Help article "Pre-operative planning"** (`/library/preoperative-planning`): describes the four V1 planning pages (measurements, points, definitions, fit thresholds, what unlocks the next page) from the V1 specification. The P0–P11 operative sequence is the separate "TKR walkthrough" article.
- **Planning workflow wording**: wherever the planning steps are named for a learner they are the four V1 pages: Assessment → Tibial Planning → Femoral Planning → Review & Send to VR (`V1_TKR_STEPS`, source: *Mediver User Planning Workflow V1.pdf*). A draft plan on the case page reads "Step 2 of 4 · Tibial Planning" (`planStepLabel`). The P0–P11 operative sequence shown on Procedures is the headset sequence and is a separate list.

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

### Learner navigation and Progress (Learner Mode review, 2026-10-20)

```text
Sidebar (learner)                           Where each old address goes
  Dashboard  (logo)  /
  Training            Your Programs  /programs        /performance            -> /progress
                      Sessions       /sessions        /performance?tab=<t>    -> /progress?tab=<t>
  Content Library     Procedures     /content?tab=procedures   (cases live here, with Add case)
                      Case Library   /cases           /activity               -> /progress?tab=activity
                      Pre-op plans   /plans           /reports                -> /progress?tab=reports
                      My Cases       /personal-cases  /performance/<skill>    unchanged (opened from By skill)
  Progress            Progress       /progress  tabs: Overview | Activity | Reports | By skill | Trends | History
```

- **Progress** (`/progress`, learners): one page with six tabs. Overview, Activity and Reports were separate pages, By skill was a group of seven sidebar links, and Trends and History were tabs of Performance. The tabs reuse the same view components as before (`app/performance/PerformanceViews.tsx`, `app/activity/ActivityView.tsx`, `app/reports/ReportsView.tsx`), so a figure reads the same wherever it appears, and report links, session links and the permission scope are unchanged. The selected tab is in the URL (`?tab=`); only that tab's data is read. The old learner addresses redirect to it, keeping the tab. **Instructors and administrators keep their own Performance, Activity and Reports pages and the "Insights" section**; `/progress` redirects them to `/performance`.
- **By skill**: grouped by procedure (`getSkillGroups`). A group appears for each published procedure the learner has a scored session on, listing the report categories averaged over those sessions; a category opens its scene breakdown (`/performance/<skill>`). Only total knee replacement has a scoring model today, so it is the only group that has categories; a procedure without one says so rather than showing invented categories.
- **Navigation chrome**: the sidebar and top bar are drawn once, in the root layout (`components/shell/AppFrame.tsx`), and stay mounted between pages; see `05_SYSTEM_ARCHITECTURE.md`. A thin progress bar under the top edge shows while a page is being fetched. There are no route-level loading skeletons.
- **Planner** (`/plan/[id]/*`): the four step buttons share the header row with the back link and title; the title and its one-line guidance share a line and carry the "deferred to VR" note; the patient bar sits at the top of the card. The window never scrolls. Measured at 1366×768, the space above the scan went from 251 px to 170 px and the scan area from 409 px to 516 px (1280×720: 468 px; 1920×1080: 828 px). Measurement, fit, validation and step gating are unchanged.

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

Every data screen supports loading, empty, error, unauthorized and not-found states. Loading is shown as a progress bar under the top edge from the click until the page arrives (there are no per-route skeletons; see `05_SYSTEM_ARCHITECTURE.md`).

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
   - Radio-opaque 25mm spherical calibration scale (scale measured per scan; 0.264 mm/px is only a seed placeholder).
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
