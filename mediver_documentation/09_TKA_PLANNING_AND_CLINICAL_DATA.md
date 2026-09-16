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

## Preoperative flow

```text
Assessment Page
-> Femoral Planning
-> Tibial Planning
-> Review & OR Transfer
-> lock plan
-> export plan
-> VR consumes locked plan
```

## Clinical safety boundary

This document records source-supported workflow concepts. It does not authorize new clinical thresholds, implant recommendations, or surgical decisions.

Any tolerance, correction target, sizing algorithm, or automated clinical rule not explicitly supplied must be clinically reviewed before production.

## Confirmed Current Model Updates (2026-09-15)

## Confirmed TKR planning interaction model

The supplied TKA planning workflow remains the clinical/function baseline. The new implementation must add the following interaction requirements without changing the established planning parameters:

```text
Load X-ray
-> interactive canvas
-> FLAP/KLAT toggle
-> place landmarks directly on image
-> calculate measurements
-> confirm/edit each value
-> femoral planning
-> tibial planning
-> review summary
-> lock and transfer to VR
```

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
