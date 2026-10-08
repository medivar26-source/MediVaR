# TKA Planning and Clinical Data

## Source basis

The supplied TKA planning specification describes a preoperative planning suite before VR simulation. It covers FLAP and KLAT views, target alignment, component sizing/position, resection plane depth/angle, and transferring a locked plan into VR.

## Planning views

### FLAP
The supplied Articulus material identifies HKA, mPTA, mLDFA and VCA under FLAP.

### KLAT
The supplied material identifies approximate tibial and femoral component sizing under KLAT.

## Planning parameters recorded by the supplied specification

### MAD
Overall mechanical-axis/deformity information used to project a target weight-bearing vector in VR.

### AMA / VCA
Anatomic-to-mechanical/femoral correction angle information associated with distal femoral resection guide positioning relative to the intramedullary rod trajectory.

### mHKA / HKA
Baseline coronal deformity and target-threshold information for post-operative correction.

### MPTA / mPTA
Tibial proximal cut orientation relative to the mechanical axis.

### LDFA / mLDFA
Distal femoral deformity contribution.

### Posterior tibial slope
Backward tilt angle of the tibial cutting jig in VR.

### Resection thickness
Femoral/tibial resection thickness used to position saw guides relative to bone landmarks.

### AP/ML bone dimensions
Dimensions used to support component sizing and help prevent overhang or undersizing.

## Suggested data representation

```text
measurement
- parameter
- plane
- source_view
- planned_value
- actual_value
- deviation
- unit
- metadata
```

## Source basis & Authoritative Specification

The authoritative V1 specification for the Pre-operative TKA Planning workflow is **"Mediver User Planning Workflow V1.pdf"**.
The core mental model is:

$$\text{MEASURE} \longrightarrow \text{SIZE} \longrightarrow \text{SEND}$$

## Strict 4-Page Preoperative Sequence

```text
Step 1: Assessment (/plan/[id]/assessment)
  -> Landmark placement & measurement of 6 clinical angles/offsets on FLAP and KLAT
Step 2: Tibial Planning (/plan/[id]/tibial)
  -> Discrete sizing (Sizes 1 to 6) & 2D CAD template overlay on FLAP/KLAT
Step 3: Femoral Planning (/plan/[id]/femoral)
  -> Discrete sizing (Sizes 1 to 8) & 2D CAD template overlay + anterior notching verification
Step 4: Review & Send to VR (/plan/[id]/review)
  -> 3-card summary inspection & irreversible seal to immutable V1 VR Payload
```

*(Note: Tibial is Page 2; Femoral is Page 3. The old inverted sequence is strictly prohibited).*

## Radio-Opaque Calibration

All scans include a standard radio-opaque calibration marker (25.0 mm sphere). Each scan (AP and lateral) has **its own scale in mm per pixel**, taken from that scan's marker. All physical dimensions (MAD, AP/ML dimensions, templates, overhang) are computed from the scan they were measured on.

- **0.264 mm/px is not a clinical constant.** It is only the placeholder the demo seeds carry. A scale that has not been measured on the plan is shown as "estimated, not verified" and the plan cannot be locked until both scans are verified.
- **How the scale is set.** *Find marker* looks for a bright round blob on the scan and proposes it; it reports `found`, `ambiguous` or `none`, and never accepts anything by itself. The surgeon confirms the proposal, or sets the scale by clicking the two sides of the marker. The 25.0 mm value is the marker's known diameter (V1 PDF p.2).
- Zoom and pan are screen-only; they never change a stored coordinate or a scale.

## Six Core Assessment Measurements

1. **MAD (Mechanical Axis Deviation)**: Perpendicular distance from knee joint center to mechanical axis (in mm) with Varus/Valgus designation.
2. **AMA (Anatomical-Mechanical Angle)**: Angle between femoral anatomical axis and femoral mechanical axis (in °).
3. **mHKA (Mechanical Hip-Knee-Ankle Angle)**: Coronal alignment angle with Varus/Valgus designation (in °).
4. **MPTA (Medial Proximal Tibial Angle)**: Medial angle between tibial mechanical axis and proximal tibial plateau line (in °).
5. **LDFA (Lateral Distal Femoral Angle)**: Lateral angle between femoral mechanical axis and distal femoral condylar line (in °).
6. **PTS (Posterior Tibial Slope)**: Slope of tibial plateau relative to proximal tibial anterior cortex on KLAT (in °).

### How the six measurements are made

- **Thirteen points** are placed, one click each, in a fixed order: nine on the AP scan (hip, knee, ankle, outer and inner edge of the femur, outer and inner edge of the tibia, two points down the thigh bone's canal) and four on the lateral scan (front and back edge of the tibial plateau, two points down the shin). A measurement exists only once every point it needs is placed; nothing is filled in from a default and no value is clamped into a believable range.
- Everything is computed in real image pixels (a percentage of width is not the same length as a percentage of height); millimetres come from that scan's own scale. MAD is flagged as an estimate when the AP scale is unverified.
- **MPTA** is the angle on the medial side between the shin's mechanical axis (knee centre to ankle centre) and the tibial joint line. **LDFA** is the angle on the lateral side between the thigh's mechanical axis (knee to hip) and the distal femoral joint line. They are measured on the side they are named for, so 85° and 95° are different answers.
- **Varus or valgus** comes from which way the knee centre sits from the hip-ankle line relative to the outer (lateral) edge the surgeon marked: toward it is varus, away from it valgus. Left and right knees therefore both read correctly. Only when neither the tibial nor the femoral outer/inner pair is placed does the case's knee side decide, on the standard view (the patient's right is the viewer's left).
- **PTS** is signed: positive when the back of the plateau sits lower down the shin than the front.
- Each value is shown with the range usually seen in a healthy knee, for orientation only. A value far outside any real knee is flagged so a misplaced point is noticed; it is never changed.
- The assessment can be continued only when all thirteen points are placed (or the plan already carries a saved assessment that has not been changed). A step counts as done only when its result exists: a measured assessment, a confirmed component.
- **Locking** requires a measured assessment, a confirmed tibial tray, a confirmed femoral component and verified scales for both scans, and is checked on the server as well as on the Review screen. The knee side sent to the headset comes from the case.

## Component Planning & Tolerances

### Tibial Component (Page 2)
- Discrete Sizes: 1 to 6 (Size 3 suggested).
- 2D CAD Template: Translation ($x, y$ in mm) and rotation handles.
- Bone edges: the surgeon marks the medial and lateral edges on the AP scan and the anterior and posterior edges on the lateral scan. The tray is measured against that bone; offsets are measured from the middle of the four marks. All four marks must be placed and confirmed before the component can be confirmed.
- Cortical Coverage: Target $\ge 90.0\%$ (**V1 PDF**). Below $85\%$ is a poor fit (project rule, not in the V1 PDF).
- Medial / Lateral Overhang: Target $\le 1.0\text{ mm}$ (**V1 PDF**). Beyond $1.5\text{ mm}$ the screen shows `CAUTION: Medial Overhang > 1.5mm` / `CAUTION: Lateral Overhang > 1.5mm` (**V1 PDF**, exact wording).
- Anterior / Posterior overhang reuses the same limits. This is an engineering choice: the V1 PDF lists medial and lateral only. It is listed separately as "Project rules (not in V1)" on the confirm step.
- Fit Verdict: the worst of the numbers above: `ACCEPTABLE FIT`, `BORDERLINE FIT`, `POOR FIT`. A poor fit is shown clearly and the button reads "Confirm Tibial Component (poor fit)"; V1 does not block it.
- **Coverage is an estimate.** The uncovered area is measured against an *estimated* plateau outline (a rounded superellipse sized from the four marks), not a tracing of the patient's bone. The Fit map says so.
- Every threshold's origin is kept in one table (`FIT_RULES` in `tkr_templates.ts`), each tagged SOURCE_VERIFIED, PROJECT_RULE, ENGINEERING_DERIVATION, CLINICAL_APPROVAL_REQUIRED or UNKNOWN.

### Moving the component (tibial and femoral)
- The component is free to move: drag it on either scan, or on the **Fit map**, a top-down view of the bone and the component. On a scan, sideways is the direction that scan measures (medial/lateral on the AP scan, anterior/posterior on the lateral scan); up and down only changes the height it is drawn at (`level_offset_mm`) and never changes the fit numbers. On the map it moves in both directions at once, and the round handle turns it.
- Arrow keys follow the picture on screen (left/right, up/down); `[` and `]` rotate. Any move withdraws an earlier confirmation.
- The Fit map shades covered bone green, uncovered bone red and any component past the bone with hatching, and prints the gap or overhang at each edge. The femoral fit is span-based, so its map shows the marked bone area in neutral grey and only the overhang in red.

### Implant templates and rotation
- The blue overlay on both scans is drawn from a **generic, size-specific template** (`GENERIC_TKA_TEMPLATE`): every tibial size 1–6 and femoral size 1–8 has its own AP-view drawing, lateral-view drawing and top-down footprint, built from the size's millimetre dimensions. It is an engineering construction. It is **not** a manufacturer's implant, not a CAD export, and the sizes are not an approved catalogue (clinical approval required).
- The overlay is semi-transparent blue vector art with a centre handle (drag) and a rotation handle, placed in real millimetres using that scan's own scale.
- **Rotation (`rotation_deg`) is the in-plane rotation on the AP scan, limited to ±15°.** It is not axial (internal/external) rotation and not a cutting angle. Whether this is the rotation the product wants needs clinical confirmation (the V1 PDF does not define it). It is sent as `position_2d.rotation_deg` exactly as before.
- A loupe magnifies the area under the pointer while a point or the overlay is being placed.

### Femoral Component (Page 3)
- Discrete Sizes: 1 to 8 (Size 4 suggested).
- 2D CAD Template: Translation ($x, y$ in mm) and rotation handles.
- Bone edges: marked on the scans exactly as for the tibial component (distal femur), and required before confirming.
- AP / ML Coverage: Target $\ge 90.0\%$ (below $85\%$ is a poor fit). The V1 PDF shows only example values (97.1% / 95.8%); both limits are project rules.
- Anterior Condylar Flush / Notching Risk: Tangent alignment to anterior femoral cortex on KLAT ($0.0\text{ mm}$ flush). A gap to the anterior cortex above $0.5\text{ mm}$ triggers the notching caution.
- Medial / lateral / posterior edge overhang is shown but has no approved limit, so it does not change the verdict.
- Fit Verdict: the worst of the checks. `ACCEPTABLE FIT`, `BORDERLINE FIT` (coverage between $85\%$ and $90\%$), `CAUTION: Anterior Notch Risk`, or `POOR FIT` (coverage below $85\%$).

## Strict Exclusions from 2D Planning
- Resection depths (distal femur / proximal tibia)
- Cut angles (varus/valgus, flexion/extension)
- Posterior slope cutting controls
- Polyethylene thickness selection
- Gap balancing / joint line previews
- 3D cut planes

All bone cutting, resection adjustments, and ligament balancing decisions are deferred to the intraoperative VR simulation.

### X-ray canvas
- The X-ray is the primary measurement workspace.
- FLAP and KLAT remain separate views accessible through a toggle.
- Work placed in a view remains when the resident returns to that view.
- Moving a landmark triggers real-time recalculation of dependent measurements.
- Measurement geometry remains on the X-ray.
- Numeric values are displayed in the side measurement panel.

### Assessment values
The four assessment measurements remain:
- HKA
- mLDFA
- mPTA
- VCA / Femoral Mechanical-Anatomical Axis Angle

Each value has an independent Confirm/Edit action. Edit supports both direct numeric editing and landmark adjustment. When the resident overrides a calculated value, preserve the original calculated value, final value and reason.

### Femoral and tibial planning
Retain the established planning functions from the supplied specification. The resident must be able to see how the femoral and tibial components sit on the X-ray anatomy and configure the established component/planning parameters. The visual UI may differ from the source reference while the functions remain.

### Review & Send
Retain the previous review content, including assessment, tibial and femoral planning summaries, verification/readiness information and final transfer action. The final plan sent to VR is the locked planning version.
