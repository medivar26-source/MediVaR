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

All scans include a standard radio-opaque calibration marker (25.0 mm sphere). The scale is calibrated to **0.264 mm / pixel** (~3.788 px / mm). All physical dimensions (MAD, AP/ML dimensions, CAD templates, overhang) are computed using this calibration.

## Six Core Assessment Measurements

1. **MAD (Mechanical Axis Deviation)**: Perpendicular distance from knee joint center to mechanical axis (in mm) with Varus/Valgus designation.
2. **AMA (Anatomical-Mechanical Angle)**: Angle between femoral anatomical axis and femoral mechanical axis (in °).
3. **mHKA (Mechanical Hip-Knee-Ankle Angle)**: Coronal alignment angle with Varus/Valgus designation (in °).
4. **MPTA (Medial Proximal Tibial Angle)**: Medial angle between tibial mechanical axis and proximal tibial plateau line (in °).
5. **LDFA (Lateral Distal Femoral Angle)**: Lateral angle between femoral mechanical axis and distal femoral condylar line (in °).
6. **PTS (Posterior Tibial Slope)**: Slope of tibial plateau relative to proximal tibial anterior cortex on KLAT (in °).

## Component Planning & Tolerances

### Tibial Component (Page 2)
- Discrete Sizes: 1 to 6 (Size 3 suggested).
- 2D CAD Template: Translation ($x, y$ in mm) and rotation handles.
- Cortical Coverage: Target $\ge 90.0\%$.
- Medial / Lateral Overhang: Target $\le 1.0\text{ mm}$ (Overhang $>1.5\text{ mm}$ triggers Caution warning).
- Fit Verdict: `ACCEPTABLE FIT` vs `CAUTION: Overhang > 1.5mm` vs `POOR FIT`.

### Femoral Component (Page 3)
- Discrete Sizes: 1 to 8 (Size 4 suggested).
- 2D CAD Template: Translation ($x, y$ in mm) and rotation handles.
- AP / ML Coverage: Target $\ge 90.0\%$.
- Anterior Condylar Flush / Notching Risk: Tangent alignment to anterior femoral cortex on KLAT ($0.0\text{ mm}$ flush). Posterior shift triggers notching risk warning.
- Fit Verdict: `ACCEPTABLE FIT` vs `CAUTION: Anterior Notch Risk` vs `POOR FIT`.

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
