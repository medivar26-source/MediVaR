# Mediver Clinical & Assessment Calculations Specification

## Purpose

This document is the calculation source-of-truth for implementing MediVeR's TKA preplanning, VR assessment, competency, and reporting calculations.

**Clinical safety rule:** A mathematical formula does not by itself authorize a clinical decision rule. The implementation must not invent targets, tolerances, implant sizing tables, correction limits, or score curves. Anything marked **[CLINICAL APPROVAL REQUIRED]** must remain configurable until approved by the clinical owner.

## 1. Calculation architecture

```text
IMAGE / DICOM / 3D LANDMARKS
        ↓
RAW LANDMARKS + CALIBRATION
        ↓
GEOMETRIC DERIVATION
        ↓
PREOPERATIVE PLAN / TARGETS
        ↓
LOCKED PLAN VERSION
        ↓
VR EXECUTION
        ↓
PLAN vs ACTUAL
        ↓
ASSESSMENT CRITERIA
        ↓
ERRORS + SKILLS + SCORE
        ↓
COMPETENCY + RECOMMENDATIONS + REPORTS
```

Every derived clinical value must preserve the raw landmarks, method, unit, sign convention, algorithm version, and confidence used to obtain it.

## 2. Coordinate and sign conventions

Define one project-wide convention for:
- left/right
- coronal/sagittal/axial planes
- degrees/mm
- internal/external rotation
- varus/neutral/valgus

Do not mix an included HKA near 180° with a signed HKA deviation without explicitly converting between them.

Recommended stored fields:

```text
hka_included_angle_deg
hka_deviation_deg
alignment_label
sign_convention_version
```

Published literature commonly expresses mHKA as a signed deviation with negative for varus and positive for valgus, while other clinical representations show the included angle. citeturn591726search5turn420687search6

## 3. Mechanical axes

### Femoral mechanical axis

From hip centre `H` to knee centre `K`:

```text
F = K - H
```

### Tibial mechanical axis

From knee centre `K` to ankle centre `A`:

```text
T = A - K
```

The lower-limb mechanical axis is conventionally defined from femoral head centre to ankle centre, passing through the knee in neutral alignment. citeturn420687search7

### Generic angle between two vectors

```text
angle(F,T) = acos( dot(F,T) / (|F||T|) )
```

Clamp the cosine into `[-1,1]` before `acos()` to avoid floating-point errors.

When direction/sign is needed, prefer a signed `atan2` formulation rather than an unsigned `acos`.

## 4. HKA / mHKA

### Included HKA

```text
HKA = angle(FMA, TMA)
```

where FMA and TMA are the femoral and tibial mechanical axes.

### Deviation from 180°

For an included-angle representation:

```text
HKA_deviation = 180° - HKA
```

Example:

```text
HKA = 174°
HKA_deviation = 180 - 174 = 6°
```

The supplied product example describes HKA 174° as approximately 6° varus. Preserve this as a product example rather than treating the display convention as universal.

## 5. MAD / mechanical-axis position

The supplied planning specification says MAD quantifies overall limb deformity and projects the target weight-bearing vector in VR. fileciteturn5file8L965-L970

### Mechanical axis

```text
MA = H → A
```

### Perpendicular point-to-line distance

For line through `A(x1,y1)` and `B(x2,y2)` and point `P(x0,y0)`:

```text
MAD_distance =
abs((x2-x1)(y1-y0) - (x1-x0)(y2-y1))
------------------------------------------------
sqrt((x2-x1)^2 + (y2-y1)^2)
```

The exact clinical definition of MAD can vary by workflow, so Mediver must store the definition/version, not only the number.

Recommended:

```text
mad_value
mad_unit
mad_reference_point
mad_definition_version
```

## 6. Weight-bearing-line position / WBL ratio

When the mechanical/weight-bearing line intersects the tibial plateau:

```text
M = medial plateau reference
L = lateral plateau reference
W = WBL intersection
```

Then:

```text
WBL_ratio_% = 100 * distance(M,W) / distance(M,L)
```

This is a geometric representation. The exact landmark orientation and reporting direction are **[CLINICAL APPROVAL REQUIRED]**.

## 7. MPTA / mMPTA

MPTA is the medial angle between the tibial mechanical axis and the proximal tibial joint line. citeturn420687search0turn420687search8

Let:

```text
T = tibial mechanical-axis vector
Jt = proximal tibial joint-line vector
```

Calculate the geometric angle:

```text
raw_angle = angle(T,Jt)
```

For a signed angle:

```text
signed_angle(T,Jt) = atan2(cross(T,Jt), dot(T,Jt))
```

Convert the raw/signed angle into the project's clinical medial-angle convention. Do not assume the unsigned result alone is MPTA.

## 8. mLDFA / LDFA

mLDFA is the lateral angle between the femoral mechanical axis and the distal femoral joint line. citeturn420687search6turn420687search8

Let:

```text
F = femoral mechanical-axis vector
Jf = distal femoral joint-line vector
```

```text
mLDFA = clinical_orientation_of(angle(F,Jf))
```

Use signed `atan2` internally when orientation matters.

## 9. Arithmetic HKA (aHKA)

A published formula is:

```text
aHKA = MPTA - mLDFA
```

This is a bony geometric measure and does not include joint-line convergence. citeturn420687search5turn420687search12

Example:

```text
MPTA = 89°
mLDFA = 84°
aHKA = 89 - 84 = +5°
```

Common interpretation under the cited convention:

```text
negative -> varus tendency
near zero -> neutral
positive -> valgus tendency
```

## 10. Joint-line convergence angle (JLCA)

JLCA is the angle between the distal femoral and proximal tibial joint lines. Sign conventions differ between papers, so define one project convention explicitly. citeturn591726search1

```text
JLCA = signed_angle(Jf,Jt)
```

### Relationship to mHKA

One published geometric derivation gives:

```text
mHKA = 180° + aHKA - JLCA
```

and therefore:

```text
JLCA = 180° + aHKA - mHKA
```

This formula is valid only with the cited paper's angle/sign convention. citeturn591726search0

**Implementation rule:** Store the convention/version together with the values.

## 11. Joint-line obliquity (JLO)

A commonly reported arithmetic formulation is:

```text
arithmetic_JLO = MPTA + mLDFA
```

If expressed as deviation from a 180° sum:

```text
JLO_deviation = (MPTA + mLDFA) - 180°
```

Recent literature distinguishes bony arithmetic alignment from joint-space convergence and reports multiple JLO formulations, so the software must store the selected reporting convention. citeturn420687search5turn591726search3

## 12. AMA / VCA / femoral anatomical-mechanical angle

The supplied specification associates AMA/VCA with distal femoral resection guide positioning relative to the intramedullary rod trajectory. fileciteturn5file8L971-L974

Let:

```text
Af = femoral anatomical axis
Mf = femoral mechanical axis
```

Then:

```text
AMA = signed_angle(Af,Mf)
```

Literature defines the femoral anatomical-mechanical angle as the angle between the anatomical and mechanical axes and shows substantial patient-to-patient variation. citeturn420687search3turn420687search4

**Do not hard-code 5° as a universal patient value.** Published data demonstrate that a fixed value can differ materially from patient anatomy. citeturn420687search3

## 13. Posterior tibial slope (PTS)

The supplied planning specification uses posterior tibial slope to set the backward tilt of the tibial cutting jig in VR. fileciteturn5file8L986-L988

There is no single universally accepted radiographic reference axis. Studies compare mechanical, anatomical, proximal anatomical, anterior cortical, posterior cortical and fibular axes. citeturn327342search3turn327342search10

### Generic calculation

```text
J = tibial plateau line in sagittal plane
R = selected tibial reference axis
```

```text
raw_angle = angle(J,R)
```

If the selected technique defines slope relative to the perpendicular axis:

```text
PTS = 90° - raw_angle
```

A published stepwise method uses a perpendicular reference and subtracts the measured angle from 90°. citeturn591726search6

Recent evidence shows that PTS values can change depending on the reference axis used, so the method must be stored with the measurement. citeturn327342search5turn327342search6

Recommended fields:

```text
pts_value
pts_reference_axis
pts_measurement_method
pts_view
```

## 14. Femoral distal resection depth

For a planned cut plane, the geometric depth is the perpendicular distance from the selected bone landmark/reference to the cut plane.

For a 2D line:

```text
d = |a*x0 + b*y0 + c| / sqrt(a²+b²)
```

For a 3D plane:

```text
d = | n · (P - P0) |
```

where `n` is the unit normal of the resection plane.

The supplied specification describes resection thickness as the saw-guide position relative to bone landmarks and provides example values, not universal rules. fileciteturn5file8L989-L991

## 15. Tibial resection depth

Generic geometric representation:

```text
resection_depth = perpendicular_distance(reference_landmark, planned_cut_plane)
```

A published planning technique sets the proximal tibial resection perpendicular to the tibial mechanical axis and measures the resection thickness to a reference surface. citeturn591726search2

Published techniques also use different values depending on implant and alignment philosophy. citeturn591726search2turn591726search11

Therefore:

```text
Do NOT hard-code 8 mm
Do NOT hard-code 9 mm
Do NOT hard-code 10 mm
```

unless the selected clinical/implant protocol explicitly supplies the value.

## 16. AP and ML dimensions

The supplied planning specification says AP/ML bone dimensions support component sizing and help avoid overhang or undersizing. fileciteturn5file8L992-L994

Euclidean distance between 2D points:

```text
D = sqrt((x2-x1)^2 + (y2-y1)^2)
```

3D:

```text
D = sqrt(dx² + dy² + dz²)
```

Therefore:

```text
AP = distance(anterior_landmark, posterior_landmark)
ML = distance(medial_landmark, lateral_landmark)
```

### Coverage

```text
AP_coverage_ratio = implant_AP / bone_AP
ML_coverage_ratio = implant_ML / bone_ML
```

Potential overhang:

```text
overhang = implant_extent - bone_extent
```

The acceptable range is implant/protocol-specific and **[CLINICAL APPROVAL REQUIRED]**.

## 17. Image calibration

For a calibration marker with known length:

```text
mm_per_pixel = known_marker_length_mm / marker_length_pixels
```

Then:

```text
distance_mm = distance_pixels * mm_per_pixel
```

When DICOM physical spacing is available and valid, prefer DICOM metadata instead of manual visual scale estimation.

Store:

```text
pixel_spacing
source_image_id
calibration_method
calibration_confidence
```

## 18. Rotation calculations

### Generic signed 2D rotation

For reference vector `A` and component vector `B`:

```text
rotation = atan2(cross(A,B), dot(A,B))
```

Normalize the result to a documented range such as `[-180°,180°]`.

### Tibial rotation

Akagi's line is one published tibial AP reference. Definitions use landmarks around the PCL attachment and tibial tubercle; measurement variability between reference methods has been reported. citeturn327342search0turn327342search1

```text
tibial_rotation = signed_angle(tibial_reference, baseplate_axis)
```

Do not silently flip internal/external rotation signs.

### Femoral rotation

Possible references include the transepicondylar axis and posterior condylar axis. A common surgical technique can use a posterior-condylar-based external rotation offset, but the appropriate value is technique/anatomy-dependent. citeturn327342search9

```text
femoral_rotation = signed_angle(femoral_reference, component_axis)
```

Do not hard-code a universal 3° offset.

## 19. Plan-vs-actual deviation

For scalar quantities:

```text
deviation = actual - planned
absolute_deviation = abs(actual - planned)
```

Example:

```text
planned tibial angle = 3°
actual tibial angle = 6°
deviation = +3°
absolute deviation = 3°
```

Percentage deviation, only where clinically meaningful:

```text
percentage_deviation = 100 * (actual - planned) / planned
```

Do not use percentage deviation near zero without an approved definition.

## 20. Angular deviation normalization

Angles wrap around 360°.

```text
delta = ((actual - planned + 180) % 360) - 180
absolute_angular_error = abs(delta)
```

Use this for axial/rotational quantities where wraparound exists.

## 21. Vector and plane errors

3D position error:

```text
error_vector = actual_position - planned_position
position_error = sqrt(dx² + dy² + dz²)
```

Perpendicular plane error:

```text
plane_error = perpendicular_distance(actual_point, planned_plane)
```

## 22. Tolerance evaluation

Each criterion should define:

```text
target_value
warning_range
acceptable_range
major_range
critical_rule
unit
```

Generic range evaluation:

```text
if acceptable_min <= actual <= acceptable_max:
    criterion_status = PASS
else:
    criterion_status = OUTSIDE_TARGET
```

Generic error magnitude:

```text
error = abs(actual - target)
```

**Do not invent the numerical tolerance.**

## 23. Error severity

Current Mediver terminology:

```text
Minor
Major
Critical
```

The prototype describes:
- Minor: deviation within warning range
- Major: deviation outside target
- Critical: unsafe or clinically significant error

These descriptions do not supply numeric thresholds. Those values must be configured and clinically approved.

## 24. Criterion score

The engine should support a configurable scoring strategy.

### Binary

```text
score = 100 if within approved tolerance else 0
```

### Linear degradation

```text
score = max(0, 100 * (1 - error / max_allowed_error))
```

### Piecewise

```text
warning or better -> 100 or configured score
major range       -> configured degradation
critical range    -> configured score/override
```

These are implementation options, not clinical rules. Select one through an approved assessment configuration.

## 25. Skill score

Current Mediver skill weights:

```text
Bone Cuts & Alignment    30%
Gap Assessment           25%
Trialling & Stability    25%
Implantation             20%
```

If each skill contains criterion weights:

```text
skill_score =
Σ(criterion_score_i * criterion_weight_i)
/
Σ(criterion_weight_i)
```

If equally weighted:

```text
skill_score = average(criterion_scores)
```

## 26. Overall assessment score

With skill scores `S1..S4` and weights:

```text
0.30, 0.25, 0.25, 0.20
```

```text
overall_score =
S1*0.30 +
S2*0.25 +
S3*0.25 +
S4*0.20
```

General normalized version:

```text
overall_score = Σ(Si*Wi) / Σ(Wi)
```

**Important:** The current prototype examples do not prove that this is the final clinical scoring algorithm. The software must keep aggregation configurable until the final formula is approved.

## 27. Automatic failure

Current product configuration:

```text
critical_auto_fail = TRUE
incomplete_auto_fail = TRUE
```

Generic final-result logic:

```text
if critical_error and critical_auto_fail:
    FAIL
elif incomplete and incomplete_auto_fail:
    FAIL
elif overall_score >= passing_score:
    PASS
else:
    FAIL
```

Current example passing threshold:

```text
70%
```

Store machine-readable reason codes such as:

```json
{"result":"FAIL","reason_codes":["CRITICAL_ERROR"]}
```

## 28. Assessment explanation

Every finalized assessment should preserve enough intermediate data to reproduce the decision:

```json
{
  "criteria": [
    {
      "criterion": "tibial_angle",
      "planned": 3,
      "actual": 6,
      "deviation": 3,
      "severity": "major",
      "score": 40
    }
  ],
  "skill_scores": {
    "bone_cuts_alignment": 48
  },
  "overall_score": 54,
  "result": "FAIL",
  "automatic_failure": true,
  "reason_codes": ["CRITICAL_ERROR"]
}
```

## 29. Competency calculation

Do not assume:

```text
competency = latest_attempt_score
```

unless explicitly approved.

Supported aggregation architectures can include:

### Latest valid assessment

```text
competency = latest_valid_assessment
```

### Rolling average

```text
competency = average(last_N_valid_assessments)
```

### Recency weighted

```text
competency = Σ(score_i * weight_i) / Σ(weight_i)
```

The final longitudinal competency method is **[CLINICAL / PRODUCT APPROVAL REQUIRED]**.

## 30. Completion calculations

Assignment completion:

```text
completion_rate = 100 * completed_assignments / total_assignments
```

Assessment completion:

```text
assessment_completion = 100 * completed_assessments / assigned_assessments
```

Cohort completion:

```text
cohort_completion =
100 * residents_completed_required_training /
residents_required_to_complete
```

The denominator must be explicitly defined for each dashboard metric.

## 31. Trend calculations

Simple score change:

```text
delta = current_score - previous_score
```

Percentage change:

```text
percentage_change =
100 * (current_score - previous_score) / previous_score
```

Only use percentage change when baseline is non-zero.

A time-series slope can be calculated with linear regression if a quantitative trend is needed:

```text
score = a + b*time
```

where `b` is the trend slope.

Do not label a trend improving/stable/declining without configured thresholds.

## 32. Error rate and repeated errors

Criterion error rate:

```text
error_rate =
100 * attempts_with_error / assessed_attempts
```

Repeated error count:

```text
repeat_error_count = count(errors for resident + criterion/error_type)
```

A recommendation can be triggered from configurable repetition thresholds.

## 33. Case pass rate

```text
case_pass_rate =
100 * passed_attempts / completed_assessed_attempts
```

Normally exclude abandoned/incomplete attempts from the denominator unless the report explicitly defines otherwise.

## 34. Attempts per case

One definition:

```text
average_attempts_per_case = total_valid_attempts / distinct_completed_cases
```

Another possible definition is the mean of per-case attempt counts. They are not always identical. The displayed metric must have one documented definition.

## 35. Time calculations

Attempt:

```text
duration = completed_at - started_at
```

Session:

```text
duration = ended_at - started_at
```

Procedure step:

```text
step_duration = step_completed_at - step_started_at
```

Store server timestamps for authoritative ordering where feasible, while keeping VR client timestamps for diagnostics.

## 36. Missing-data rules

Distinguish:

```text
NULL / missing
not_applicable
not_measured
invalid
zero
```

Do not turn missing measurements into zero.

A missing required value must follow an explicit assessment policy.

## 37. Measurement accuracy pipeline

For automated image measurement:

```text
DICOM/X-ray
  ↓
image-quality check
  ↓
calibration
  ↓
bone segmentation
  ↓
landmark detection
  ↓
landmark confidence
  ↓
axis construction
  ↓
angle/distance calculations
  ↓
plausibility checks
  ↓
suggested measurement
  ↓
human review
  ↓
confirmed planning value
```

The user should see:
- suggested value
- confidence
- landmarks used
- measurement method
- source view
- accept/edit/reject controls

## 38. Suggested-value workflow

The requested Mediver behavior should be:

```text
Software calculates
      ↓
Suggested value
+ confidence
+ method/version
      ↓
Instructor/clinician reviews
      ↓
Accept / Edit / Reject / Recalculate
      ↓
Confirmed value
      ↓
Plan lock
```

Never overwrite the original suggestion when the clinician edits it.

## 39. Calculation audit trail

Store:

```text
raw_measurement
suggested_value
confirmed_value
calculation_name
calculation_version
measurement_method
source_image_id
source_landmarks
algorithm_version
confidence
changed_by
changed_at
```

Recommended `calculation_runs` table:

```text
id
entity_type
entity_id
calculation_name
calculation_version
inputs JSONB
outputs JSONB
warnings JSONB
executed_at
executed_by
```

Recommended `clinical_rules` table:

```text
id
program_id
case_id
rule_name
rule_type
configuration JSONB
version
approval_status
approved_by
approved_at
effective_from
effective_to
```

## 40. Plausibility and confidence

Every automated measurement should have a confidence/quality record.

Potential validation states:

```text
VALID
WARNING
REQUIRES_REVIEW
INVALID
```

Examples of triggers:
- missing landmark
- low landmark confidence
- missing calibration
- impossible geometry
- inconsistent axes
- numerical range error

The system should flag suspicious values rather than silently correcting them.

## 41. Formula registry for Antigravity

Implement calculations as named, tested services/functions:

```text
calculate_line_vector()
calculate_angle_between_vectors()
calculate_signed_angle()
calculate_point_line_distance()
calculate_distance()
calculate_scale()
calculate_hka()
calculate_mad()
calculate_wbl_ratio()
calculate_mpta()
calculate_mldfa()
calculate_ahka()
calculate_jlca()
calculate_jlo()
calculate_ama_vca()
calculate_posterior_tibial_slope()
calculate_resection_depth()
calculate_ap_dimension()
calculate_ml_dimension()
calculate_tibial_rotation()
calculate_femoral_rotation()
calculate_scalar_deviation()
calculate_angular_deviation()
evaluate_tolerance()
classify_error()
calculate_criterion_score()
calculate_skill_score()
calculate_overall_score()
apply_automatic_failure()
calculate_competency()
calculate_completion()
calculate_trend()
calculate_error_rate()
calculate_case_pass_rate()
calculate_attempt_duration()
```

Every calculation function must document:
- inputs
- units
- formula
- sign convention
- output
- error conditions
- test cases
- calculation version

## 42. Calculation classification

Tag every rule as one of:

```text
SOURCE_VERIFIED
PROJECT_RULE
ENGINEERING_DERIVATION
CLINICAL_APPROVAL_REQUIRED
```

Examples:

```text
aHKA = MPTA - mLDFA
→ SOURCE_VERIFIED

mHKA = 180 + aHKA - JLCA
→ SOURCE_VERIFIED FOR THE CITED SIGN CONVENTION

passing score = 70%
→ PROJECT CONFIGURATION

critical error -> automatic failure
→ PROJECT CONFIGURATION

universal tibial tolerance ±X°
→ DO NOT INVENT
```

## 43. Golden test scenarios

The implementation must have deterministic tests for:

### Geometry
- parallel lines
- perpendicular lines
- 45° lines
- signed rotations
- 180° included HKA
- near-zero angular values

### Clinical derivations
- HKA = 174°
- MPTA = 89°, mLDFA = 84° -> aHKA = +5°
- known synthetic JLCA and mHKA relationships
- known PTS synthetic geometry
- AP/ML distances

### Assessment
- perfect execution
- score exactly 70
- score below 70
- critical auto-fail
- incomplete auto-fail
- major error without critical error
- duplicate event
- missing required measurement
- out-of-order event
- VR reconnect

## 44. Example complete calculation

Example values:

```text
HKA included = 174°
MPTA = 89°
mLDFA = 84°
native PTS = 7°
planned PTS = 3°
planned tibial angle = 3°
actual tibial angle = 6°
```

Derived:

```text
HKA deviation = 180 - 174 = 6°

aHKA = 89 - 84 = +5°

PTS deviation = 3 - 7 = -4°

tibial angle deviation = 6 - 3 = +3°
```

Then the assessment engine continues:

```text
+3° deviation
   ↓
criterion rule lookup
   ↓
tolerance evaluation
   ↓
severity
   ↓
criterion score
   ↓
skill score
   ↓
overall score
   ↓
automatic-failure rules
   ↓
final PASS/FAIL
```

Do not treat `+3°` as automatically failed unless the configured criterion says so.

## 45. Antigravity implementation directives

### MUST

```text
- Read this file before implementing clinical calculations.
- Read the product planning specification.
- Use explicit landmark definitions.
- Store measurement units.
- Store sign conventions.
- Version calculation methods.
- Preserve raw values and suggested values.
- Allow clinician confirmation/editing.
- Keep clinical rules configurable.
- Produce deterministic tests.
- Make assessment explanations reproducible.
```

### MUST NOT

```text
- Hard-code 5° as universal femoral correction.
- Hard-code one PTS reference axis for all patients.
- Hard-code one resection depth for all implants.
- Assume one sizing algorithm for every implant system.
- Invent tolerance values.
- Invent severity thresholds.
- Invent the final competency formula.
- Mix sign conventions.
- Overwrite clinician-confirmed values.
- Let VR alone determine authoritative pass/fail.
```

## 46. Sources reviewed

### Product source
The supplied planning specification defines a four-page preoperative planning workflow with target alignment, estimated component size/position, resection plane depth/angle, and locked-plan transfer into VR. fileciteturn5file8L954-L963

It specifically maps MAD, AMA, mHKA, MPTA, LDFA, PTS, resection thickness, and AP/ML dimensions to planning/VR use. fileciteturn5file8L965-L994

The supplied Articulus material identifies FLAP measurements as HKA, mPTA, mLDFA and VCA, and KLAT for approximate tibial/femoral component sizing. fileciteturn5file0L22-L36

### Web/medical literature
- Mechanical axis and HKA: citeturn420687search7turn420687search12
- LDFA/MPTA definitions: citeturn420687search0turn420687search8
- aHKA: citeturn420687search5turn591726search5
- JLCA and mHKA relationship: citeturn591726search0turn591726search1
- femoral anatomical-mechanical angle/VCA variability: citeturn420687search3turn420687search4
- posterior tibial slope measurement/reference axes: citeturn327342search3turn327342search5turn327342search6
- tibial rotation/Akagi references: citeturn327342search0turn327342search1
- resection planning examples: citeturn591726search2turn591726search11

This document is an implementation specification, not a substitute for clinical validation. Final surgical targets, tolerances, implant-specific sizing, and assessment policies require the designated clinical owner to approve them before production use.

## Confirmed Current Model Updates (2026-09-15)

## Confirmed 2026-09-15 pre-operative interaction layer

The existing formulas and clinical-calculation architecture remain the baseline. The resident performs the pre-operative work on an interactive X-ray canvas.

```text
X-ray image
   ↓
FLAP / KLAT view
   ↓
landmarks placed on canvas
   ↓
geometric calculation
   ↓
calculated/suggested measurement
   ↓
resident Confirm/Edit
   ↓
confirmed planning value
   ↓
locked plan
   ↓
VR
```

The four assessment measurements presented in the current TKR planning workflow are **HKA, mLDFA, mPTA and VCA**. Each is independently confirmed or edited. Numeric editing and landmark-based editing are both supported; when a suggested value is overridden, the system preserves the original value, final value and reason for the override.

FLAP and KLAT are switchable views. Landmark and measurement state is preserved when returning to a view, and dependent calculations update in real time after landmark movement. Geometry remains on the X-ray while numeric values are shown in the side panel.

The established femoral and tibial planning calculations, component planning functions and plan-vs-actual assessment formulas in this document are otherwise unchanged.
