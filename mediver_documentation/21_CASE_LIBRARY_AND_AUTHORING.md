# MediVeR-XR Case Library & Case Authoring Specification

## Document Status

- Product area: Instructor Content Library / Case Authoring
- Scope: `/cases`, `/cases/new`, `/cases/[id]`, `/cases/[id]/edit`
- Primary users: Instructor / Faculty
- Learner-facing output: published case version and learner-safe case projection
- Status: Implementation reference
- Design principle: extend MediVeR-XR's existing UI/UX and architecture; do not create a separate design language

---

## 1. Purpose

The Case Library is the instructor-facing content authoring system for creating, reviewing, publishing, and editing training cases used by learners in MediVeR-XR.

An instructor must be able to author the full learner-visible case scenario, attach a flexible set of imaging assets, configure instructor-only reference/ground-truth data, and define a case-specific assessment/marking scheme.

A case must not be forced into a single generalized scoring rubric. Each case may have its own assessment criteria, marks, weighting, tolerances, severity rules, mandatory criteria, and passing configuration, subject to the application's approved assessment engine and clinical/product governance.

The authoring model is versioned. Drafts may be edited. Published versions are immutable for historical reproducibility. Learner attempts must remain tied to the exact case/reference/assessment configuration version they consumed.

---

## 2. Non-Negotiable UI/UX Rules

The Case Library must look and behave like the existing MediVeR-XR application.

### Reuse existing design system

Use the current MediVeR-XR design tokens and existing UI/shell components exactly as implemented.

Reuse existing components from `@/components/ui`, including as applicable:

- `Card`
- `CardHeader`
- `Field`
- `Input`
- `Select`
- `Textarea`
- `Checkbox`
- `Segmented`
- `Button`
- `Chip`
- `Badge`
- `Banner`
- `Table`
- `Stepper`
- `EmptyState`

Reuse existing shell components:

- `AppShell`
- `PageHeader`
- `SectionHeader`
- `SideNav`
- `TopBar`

### Shared files that MUST NOT be modified

- `dashboard/src/app/tokens.css`
- `dashboard/src/app/globals.css`
- `dashboard/src/components/dashboard/dashboard.module.css`
- `dashboard/src/components/dashboard/InstructorDashboard.tsx`
- `dashboard/src/components/ui/Stepper.tsx`

Do not change shared component APIs or shared design-system behavior merely to make Case Library easier to implement.

### Visual language

Use the existing light clinical SaaS language already present in MediVeR-XR:

- warm light page canvas
- white surfaces
- existing green brand color
- existing semantic status colors
- existing typography
- existing spacing scale
- existing border/radius system
- existing button hierarchy
- existing responsive behavior

Do NOT introduce:

- dark GitHub-style colors
- new color palettes
- gradients
- glassmorphism
- oversized marketing cards
- decorative backgrounds
- new typography families
- large unrelated shadows
- a separate Case Library visual language

Case Library should look native to the existing `/cases`, `/plans`, `/kit`, and `/settings` pages.

---

## 3. High-Level Authoring Workflow

Instructor authoring uses five authoring steps:

1. Case Information
2. Patient & Clinical Scenario
3. Imaging & Calibration
4. Reference Plan & Assessment Configuration
5. Review & Publish

This is the instructor authoring workflow. It is separate from the learner's TKA V1 planning workflow.

The authoritative TKA V1 learner workflow is:

`Assessment → Tibial Planning → Femoral Planning → Review & Send to VR`

The learner planning scope is governed by `MEASURE → SIZE → SEND` and must not be expanded by the case authoring UI into unsupported intraoperative controls such as bone-cut depths, resection planes, or soft-tissue balancing unless they are separately approved as future scope.

---

# 4. Step 1 — Case Information

## Required fields

### Case identity

- Case Title — required
- Procedure — required
- Pathology Type — required
- Pathology Diagnosis Label — required
- Knee Laterality — required: Left / Right
- Difficulty Level — required
- Case Status — Draft / Published / Archived as supported by the product
- Version — system-controlled version number

### Description

- Clinical Summary / Description — optional in the current UI, but supported by the authoring model

### Curriculum

- Curriculum Programs — multi-select
- A case may be associated with multiple programs
- Curriculum association describes where the case is available in a program; it is not the same thing as learner assignment

### Learning objectives

Support a dynamic list of case-specific learning objectives.

The current UI may show a primary learning objective plus a detailed objective list. Preserve both concepts if the existing data contract requires them:

- Primary Learning Objective — optional or required according to current form validation
- Case-Specific Learning Objectives — dynamic array

Instructor controls:

- Add objective
- Edit objective
- Remove objective
- Reorder objective where useful

---

# 5. Step 2 — Patient & Clinical Scenario

The authoring UI must support the complete patient scenario rather than reducing it to only age, sex, and BMI.

## Patient demographics

- Patient ID / synthetic case identifier
- Patient Age — required
- Sex / Gender — required
- BMI — required
- Occupation
- Activity level
- Walking distance (m)

## Clinical presentation

- Chief Complaint
- Medical History / History of Present Illness
- Past Management / Conservative Therapy
- Clinical Examination Notes
- Fixed Flexion (degrees)
- Range of Motion
- Deformity

The existing MediVeR case model already represents fields including age, sex, BMI, occupation, activity, complaint, history, past management, walking distance, fixed flexion, ROM, and deformity. These fields must not be silently dropped from the case authoring model.

## Learning objectives

Repeat/display the editable case-specific objective list here when the current authoring UX places objectives in Step 2. Avoid maintaining two separate conflicting objective stores. There must be one authoritative case objective list in the data model.

---

# 6. Step 3 — Imaging & Calibration

## Core rule

FLAP and KLAT are important predefined TKA V1 planning views, but they are NOT the complete imaging model.

An instructor must be able to add different image types and multiple images per case.

Examples include, but are not limited to:

- FLAP — Full-Length Standing AP
- KLAT — Knee Lateral
- AP
- Lateral
- Skyline / Patellar view
- Oblique
- Stress view
- MRI
- CT
- Ultrasound
- Other / Custom type

The list must be extensible without changing the database schema for every new modality.

## Dynamic imaging asset fields

Each image entry should support:

- Image Type
- Custom Image Type when `Other` is selected
- Display Label
- Clinical / Context Description
- Image File
- Learner Visible — Yes / No
- Required for Case — Yes / No
- Calibration Required — Yes / No
- Laterality when relevant
- Display Order
- Replace Image
- Remove Image

Multiple images of the same type must be supported.

Example:

- FLAP — Preoperative Full-Length Standing AP
- FLAP — Weight-Bearing Follow-up
- KLAT — Neutral Lateral
- KLAT — Flexion Lateral
- Skyline — Patellar View
- MRI — Sagittal
- MRI — Coronal
- CT — Axial

## Image metadata

Store, where supported:

- storage path
- filename
- MIME type
- file size
- width
- height
- laterality
- display order
- metadata

Do not store permanent signed URLs. Generate authorized short-lived URLs for retrieval.

## Calibration

Calibration must be attached to an image when calibration is required.

Recommended data:

- Marker type
- Physical marker diameter (mm)
- Detected marker diameter (px)
- Calculated scale
- Scale unit
- Detection method
- Validity state
- Calibration/reference version

The scale is DERIVED from physical marker size and detected pixel size. It must not be represented as a manually typed universal constant.

For example:

`physical marker diameter / detected pixel diameter = derived mm/px`

The product must not treat a sample value such as `0.264 mm/px` as a universal calibration constant.

## V1 calibration behavior

For the TKA V1 learner planner, the calibrated radiographs required by the planning workflow use radio-opaque calibration markers and dynamic scaling.

The authoring system must still allow non-calibrated images where calibration is not applicable.

---

# 7. Step 4 — Reference Plan & Assessment Configuration

This step contains instructor-only information.

Learners must not receive the reference plan or hidden answer-key values in learner-facing payloads.

## 7.1 Protected Faculty Reference Plan

Display a clear existing MediVeR semantic information banner indicating that the configuration is instructor-only and hidden from learners.

### Six canonical TKA V1 assessment measurements

Support:

- MAD (Mechanical Axis Deviation)
- AMA (Anatomical-Mechanical Angle)
- mHKA (Mechanical Hip-Knee-Ankle Angle)
- MPTA (Medial Proximal Tibial Angle)
- LDFA (Lateral Distal Femoral Angle)
- PTS (Posterior Tibial Slope)

For each measurement preserve, where applicable:

- reference value
- unit
- alignment label
- sign convention
- calculation/reference version
- optional clinical metadata

Do not silently convert between included HKA and signed HKA without an explicit convention.

The V1 product example represents the mHKA/HKA relationship using an included angle and a separate varus/valgus designation. The implementation must preserve the project's explicit sign/display convention rather than mixing representations.

## 7.2 Tibial Reference Plan

Support:

- Tibial AP dimension
- Tibial ML dimension
- Reference / Recommended Tibial Size, V1 sizes 1–6
- X offset
- Y offset
- Rotation
- Cortical coverage
- Medial overhang
- Lateral overhang
- Fit status
- Calculation/reference metadata

## 7.3 Femoral Reference Plan

Support:

- Femoral AP dimension
- Femoral ML dimension
- Reference / Recommended Femoral Size, V1 sizes 1–8
- X offset
- Y offset
- Rotation / positioning metadata
- Flexion only when explicitly supported by the approved product contract
- AP coverage
- ML coverage
- Anterior notching risk
- Fit status
- Calculation/reference metadata

Do not invent a clinical femoral flexion target simply because a UI field exists.

## 7.4 Assessment / Marking Scheme

Every case must have its own assessment configuration.

There is NO universal marking scheme forced across all cases.

An instructor must be able to create, edit, remove, and reorder case-specific criteria.

### Scoring overview

The instructor must be able to configure, as supported by the assessment engine:

- Total marks / score normalization
- Passing score or passing rule
- Scoring strategy
- Timing contribution if timing is part of the approved assessment configuration
- Critical-error behavior
- Incomplete-case behavior

### Case-specific assessment criteria

Provide a dynamic `+ Add Criterion` workflow.

Each criterion may contain:

- Criterion name
- Criterion description
- Criterion type
- Maximum marks
- Weight
- Target value, when applicable
- Unit, when applicable
- Acceptable range / tolerance, when applicable
- Warning / minor range, when configured
- Major range, when configured
- Critical rule, when configured
- Scoring behavior / score mapping
- Mandatory flag
- Critical flag
- Ordering
- Optional skill/category association

### Criterion types

The system should support flexible criterion types appropriate to the assessment engine, for example:

- Measurement
- Component / size selection
- Fit / coverage
- Position / rotation
- Completion
- Procedural action
- Checklist / decision
- Other configured type

Do not hard-code the above list if the existing backend already defines an authoritative criterion taxonomy. Extend the existing taxonomy where possible.

### Scoring strategy

The architecture should support configurable strategies such as:

- Binary
- Linear degradation
- Piecewise
- Other approved strategy implemented by the assessment engine

These are engine capabilities, not medical rules. Numerical values, tolerances, severity boundaries, or final scoring curves must come from the configured case assessment rules or approved product/clinical configuration.

### Flexible marks and weights

The instructor must be able to make two cases structurally different.

Example Case A:

- Radiographic measurements — 20
- Tibial sizing — 30
- Femoral sizing — 30
- Final plan — 20

Example Case B:

- Assessment — 40
- Tibial plan — 25
- Femoral plan — 25
- Final submission — 10

These are examples of flexibility only. Do not treat them as clinical defaults.

### Severity

Use the existing project terminology where configured:

- Minor
- Major
- Critical

The application must not invent universal numeric thresholds for these severity classes.

### Automatic failure

If a case requires it, the instructor must be able to configure approved automatic-failure conditions such as critical-error or incomplete-case behavior through the assessment configuration.

Do not hard-code these as immutable universal rules unless the existing product contract explicitly requires that behavior.

## 7.5 Instructor Notes

Provide an instructor-only free-text field for:

- case-specific assessment notes
- rationale
- faculty guidance
- debrief notes
- reference-plan notes

---

# 8. Step 5 — Review & Publish

The final authoring step is a pre-flight validation and publication screen.

## Validation categories

### Case information

- Required metadata complete
- Procedure present
- Pathology present
- Laterality present
- Difficulty present
- Program associations valid

### Patient scenario

- Required demographic fields complete
- Required scenario fields complete according to validation contract

### Imaging

- Required images uploaded
- Each required image has valid metadata
- Required calibration exists and is valid where applicable
- Unsupported / invalid file states are surfaced clearly

### Reference plan

- Six V1 assessment values complete when the case uses the V1 TKA planning assessment
- Tibial reference complete where tibial planning is enabled
- Femoral reference complete where femoral planning is enabled

### Assessment configuration

- At least one assessment configuration exists when the case is assessable
- Marks and weights are internally valid
- Weight totals are valid according to the selected scoring strategy
- Required target/tolerance fields exist for criteria that need them
- No unresolved critical configuration errors

### Learner safety check

- Reference plan excluded from learner payload
- Instructor-only notes excluded from learner payload
- Learner-visible images correctly flagged
- Learner preview matches actual learner projection

## Preview as Learner

The instructor must be able to preview the case using the actual learner-facing case presentation / projection.

Do not create a separate visual theme for preview.

The preview must NOT expose:

- canonical reference measurements
- instructor marking scheme
- hidden tolerances
- instructor notes
- hidden assessment rules
- internal answer keys

---

# 9. Versioning and Historical Reproducibility

Published case versions are immutable.

Draft versions are editable.

A case may have:

- logical case identity
- draft version pointer
- published version pointer

Recommended structure:

```text
cases
  logical identity
  institution_id
  draft_version_id
  published_version_id
  status

case_versions
  case_id
  version_number
  learner-visible case data
  patient/scenario data
  objectives
  created_by
  status
  published_at

case_imaging
  case_version_id
  image manifest and metadata

case_version_reference_plan
  case_version_id
  reference measurements
  tibial reference
  femoral reference
  assessment configuration snapshot
  instructor notes
```

Historical learner attempts must reference the exact case/reference/assessment configuration version used at the time of the attempt.

Editing a case after learners have already used it must create a new editable/publishable version rather than silently changing the historical configuration.

---

# 10. Program Association vs Learner Assignment

`case_programs` represents curriculum availability.

It does NOT represent a learner assignment.

Actual learner/cohort case assignment must remain a separate relationship.

Do not implement “Assigned Cases” by assuming that every case in a program is automatically assigned to every learner.

---

# 11. Security and Learner Projection

The backend is authoritative.

Instructor-only reference data must be protected server-side.

Never send the hidden reference plan to the browser under the learner role and hide it only with CSS or UI conditionals.

The learner API/projection should expose only what the learner needs:

- case metadata intended for learners
- patient/scenario data intended for learners
- learner-visible imaging
- learning objectives intended for learners
- other explicitly learner-safe data

It must exclude:

- reference measurements
- target values
- marking scheme
- assessment weights
- hidden tolerances
- severity rules
- instructor notes
- answer keys
- internal scoring configuration not intended for learners

---

# 12. Data Model Guidance

Prefer the existing versioned architecture:

```text
cases
case_versions
case_imaging
case_version_reference_plan
case_programs
```

Do not collapse all authoring data into one oversized `cases` row if the existing migration/model architecture already supports the versioned design.

Do not create one fixed DB column per image type.

Use a flexible imaging manifest.

Do not create a global scoring table that forces every case to share the same marking scheme. Assessment configuration must be case-version-specific.

Do not duplicate canonical global skills/categories unnecessarily. When existing assessment entities already exist, reference them where appropriate and snapshot the exact configuration needed for historical reproducibility.

---

# 13. Clinical / Product Guardrails

The authoritative V1 TKA planning scope is:

`MEASURE → SIZE → SEND`

The V1 learner workflow is four pages:

`Assessment → Tibial Planning → Femoral Planning → Review & Send to VR`

The six assessment measurements are:

`MAD, AMA, mHKA, MPTA, LDFA, PTS`

Tibial V1 sizing uses AP/ML dimensions, sizes 1–6, 2D positioning, and fit metrics including cortical coverage and medial/lateral overhang.

Femoral V1 sizing uses AP/ML dimensions, sizes 1–8, 2D positioning, AP/ML coverage, and anterior notching verification.

The V1 source provides explicit tibial fit examples/thresholds, including cortical coverage ≥90% and medial/lateral overhang ≤1 mm. Do not generalize additional thresholds beyond approved configuration.

Do not introduce unsupported intraoperative variables into the V1 planning flow.

Do not invent:

- universal correction values
- universal implant sizing algorithms
- universal tolerances
- universal severity thresholds
- universal passing scores
- universal competency formulas

All clinical or scoring rules must remain configurable and traceable to the approved source/configuration.

---

# 14. Current UI Gaps That Must Be Corrected

The implementation must specifically correct the following known deficiencies:

1. Case authoring is currently missing several previously planned patient fields as first-class inputs. Restore support for Patient ID, Occupation, Activity, Walking Distance, Fixed Flexion, ROM, and Deformity in the authoring data model and expose them in an appropriate part of the UI.

2. Imaging is currently too rigid around FLAP/KLAT. Replace the fixed two-image assumption with a dynamic image list where the instructor can add multiple image types and multiple images per type.

3. Calibration must be image-specific and derived when calibration is required. Do not use one hard-coded scale for all cases.

4. The marking scheme is currently presented as a generalized rubric. Replace this with a case-specific assessment configuration that the instructor can create and edit per case.

5. The assessment criteria must support dynamic add/edit/remove behavior, marks, weights, target values, tolerances, severity configuration, mandatory/critical flags, and scoring behavior as supported by the backend assessment engine.

6. The scoring configuration must be editable after creation through `/cases/[id]/edit`, while preserving historical versions for existing attempts.

7. Learner Preview must use the real learner-facing projection and must never expose instructor-only reference or assessment configuration.

8. All UI changes must use the existing MediVeR-XR visual system. Do not create a new Case Library theme.

---

# 15. Acceptance Criteria

A feature is complete only when all of the following are true:

- Instructor can create a case through the five-step authoring workflow.
- All required case fields are represented in the data model and appropriate UI.
- Patient scenario includes the richer existing case fields.
- Instructor can add any number of image assets.
- Instructor can choose predefined image types and add custom image types.
- Multiple images of the same type are supported.
- Image order is controllable.
- Calibration is configurable per image where applicable.
- Calibration scale is derived and stored with metadata.
- Instructor can author six TKA V1 reference measurements.
- Instructor can author tibial reference configuration.
- Instructor can author femoral reference configuration.
- Instructor can author a case-specific marking scheme.
- Instructor can add/remove/edit/reorder assessment criteria.
- Marks and weights are configurable per case.
- Target/tolerance/severity configuration is available where the criterion requires it.
- Passing and automatic-failure behavior is configurable through approved assessment mechanisms.
- Case scoring is not forced into one universal rubric.
- Instructor can edit scoring configuration later.
- Published configuration is versioned and historical attempts remain reproducible.
- Learner projection excludes instructor-only data server-side.
- Learner Preview reflects the learner-safe projection.
- Existing `/cases`, `/plans`, `/kit`, and `/settings` visual language is preserved.
- Shared design-system files and protected dashboard files remain untouched.
- Next.js build passes.
- Relevant frontend/backend tests pass.
- Browser verification covers create, edit, preview, publish, imaging addition, calibration, scoring configuration, and learner-safe projection.

---

# 16. Implementation Notes for Antigravity

Before modifying code:

1. Inspect the existing repository implementation.
2. Inspect current `/cases` pages and styles.
3. Inspect existing UI primitives and their actual prop APIs.
4. Inspect current case data contracts and migrations.
5. Inspect existing assessment/scoring entities and services before introducing duplicates.
6. Inspect how learner and instructor authorization is enforced.
7. Inspect current migrations before selecting a migration number.
8. Preserve existing functionality unless explicitly superseded by this specification.

Do not guess component APIs.

Do not rebuild existing pages from scratch when extension is sufficient.

Do not modify shared design-system components to compensate for an authoring-page implementation issue.

Do not create a parallel frontend component library.

When a requirement is not supported by an existing backend contract, implement the smallest versioned/configurable extension required and document the change.

---

# 17. Source and Authority

This specification should be read together with the authoritative `Mediver User Planning Workflow V1.pdf` for the learner-side TKA planning workflow.

The V1 specification establishes the four-page learner planning flow, the six structural assessment measurements, radio-opaque calibration requirement, tibial/femoral sizing scope, and Review & Send behavior.

The MediVeR project calculation/assessment documentation establishes that clinical values, tolerances, severity boundaries, scoring curves, and competency formulas not explicitly approved must remain configurable and must not be invented.

This document defines the Case Library authoring requirements around those existing product boundaries.
