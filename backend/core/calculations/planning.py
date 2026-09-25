"""
Planning calculation module for MediVeR-XR.

Implements canonical TKA planning mathematics:
- Six assessment measurements: MAD, AMA, mHKA, MPTA, LDFA, PTS.
- Implant sizing catalogs: Tibial (Sizes 1-6), Femoral (Sizes 1-8).
- Component fit evaluation (coverage, overhang, notching risk).

All formulas conform to MediVeR-XR V1 Clinical Planning Specification.
"""

from typing import Dict, Any, List, Optional
import math
from .geometry import (
    Vector2D,
    vector_magnitude,
    dot_product,
    angle_between_vectors_deg,
    perpendicular_distance_point_to_line,
    signed_point_to_line_offset,
)

# ---------------------------------------------------------------------------
# Sizing Catalogs (Authoritative V1 Specification)
# ---------------------------------------------------------------------------

TIBIAL_SIZES_CATALOG: List[Dict[str, Any]] = [
    {"size": 1, "ap_mm": 38.0, "ml_mm": 61.0, "label": "Size 1 (38.0 × 61.0 mm)"},
    {"size": 2, "ap_mm": 40.0, "ml_mm": 64.5, "label": "Size 2 (40.0 × 64.5 mm)"},
    {"size": 3, "ap_mm": 42.5, "ml_mm": 68.2, "label": "Size 3 (42.5 × 68.2 mm) - Suggested"},
    {"size": 4, "ap_mm": 45.0, "ml_mm": 72.0, "label": "Size 4 (45.0 × 72.0 mm)"},
    {"size": 5, "ap_mm": 48.0, "ml_mm": 76.5, "label": "Size 5 (48.0 × 76.5 mm)"},
    {"size": 6, "ap_mm": 51.0, "ml_mm": 81.0, "label": "Size 6 (51.0 × 81.0 mm)"},
]

FEMORAL_SIZES_CATALOG: List[Dict[str, Any]] = [
    {"size": 1, "ap_mm": 52.0, "ml_mm": 58.0, "label": "Size 1 (52.0 × 58.0 mm)"},
    {"size": 2, "ap_mm": 54.0, "ml_mm": 60.0, "label": "Size 2 (54.0 × 60.0 mm)"},
    {"size": 3, "ap_mm": 56.2, "ml_mm": 62.0, "label": "Size 3 (56.2 × 62.0 mm)"},
    {"size": 4, "ap_mm": 58.4, "ml_mm": 64.1, "label": "Size 4 (58.4 × 64.1 mm) - Suggested"},
    {"size": 5, "ap_mm": 61.0, "ml_mm": 67.0, "label": "Size 5 (61.0 × 67.0 mm)"},
    {"size": 6, "ap_mm": 63.5, "ml_mm": 70.0, "label": "Size 6 (63.5 × 70.0 mm)"},
    {"size": 7, "ap_mm": 66.5, "ml_mm": 73.0, "label": "Size 7 (66.5 × 73.0 mm)"},
    {"size": 8, "ap_mm": 70.0, "ml_mm": 77.0, "label": "Size 8 (70.0 × 77.0 mm)"},
]


def get_tibial_template(size: int) -> Dict[str, Any]:
    for t in TIBIAL_SIZES_CATALOG:
        if t["size"] == size:
            return t
    return TIBIAL_SIZES_CATALOG[2]  # Default to Size 3


def get_femoral_template(size: int) -> Dict[str, Any]:
    for t in FEMORAL_SIZES_CATALOG:
        if t["size"] == size:
            return t
    return FEMORAL_SIZES_CATALOG[3]  # Default to Size 4


def suggest_tibial_size(patient_ml_mm: float) -> int:
    """Suggest tibial size closest to measured patient mediolateral plateau width."""
    closest = TIBIAL_SIZES_CATALOG[0]
    min_diff = abs(closest["ml_mm"] - patient_ml_mm)
    for t in TIBIAL_SIZES_CATALOG:
        diff = abs(t["ml_mm"] - patient_ml_mm)
        if diff < min_diff:
            min_diff = diff
            closest = t
    return closest["size"]


def suggest_femoral_size(patient_ap_mm: float) -> int:
    """Suggest femoral size closest to measured patient anteroposterior condylar length."""
    closest = FEMORAL_SIZES_CATALOG[0]
    min_diff = abs(closest["ap_mm"] - patient_ap_mm)
    for t in FEMORAL_SIZES_CATALOG:
        diff = abs(t["ap_mm"] - patient_ap_mm)
        if diff < min_diff:
            min_diff = diff
            closest = t
    return closest["size"]


# ---------------------------------------------------------------------------
# Fit Evaluation (Conforms to V1 Specification Thresholds)
# ---------------------------------------------------------------------------

def evaluate_tibial_fit(
    size: int,
    x_offset_mm: float,
    y_offset_mm: float,
    patient_ap_mm: float = 43.0,
    patient_ml_mm: float = 69.0,
) -> Dict[str, Any]:
    """
    Evaluates tibial component fit against cortical boundary.
    - Coverage target: >= 90%
    - Overhang target: <= 1.0 mm
    - Caution trigger: Overhang > 1.5 mm
    - Poor fit trigger: Coverage < 85%
    """
    template = get_tibial_template(size)

    ratio_ap = min(1.0, template["ap_mm"] / max(1.0, patient_ap_mm))
    ratio_ml = min(1.0, template["ml_mm"] / max(1.0, patient_ml_mm))
    base_coverage = ratio_ap * ratio_ml * 100.0

    offset_penalty = abs(x_offset_mm) * 0.8 + abs(y_offset_mm) * 0.8
    coverage_pct = round(max(60.0, min(99.5, base_coverage - offset_penalty)), 1)

    half_patient_ml = patient_ml_mm / 2.0
    half_implant_ml = template["ml_mm"] / 2.0

    medial_bound = half_implant_ml - x_offset_mm
    lateral_bound = half_implant_ml + x_offset_mm

    medial_overhang_mm = round(max(0.0, medial_bound - half_patient_ml), 1)
    lateral_overhang_mm = round(max(0.0, lateral_bound - half_patient_ml), 1)

    if medial_overhang_mm > 1.5 or lateral_overhang_mm > 1.5:
        fit_status = "CAUTION: Overhang > 1.5mm"
    elif coverage_pct < 85.0:
        fit_status = "POOR FIT"
    else:
        fit_status = "ACCEPTABLE FIT"

    return {
        "coverage_pct": coverage_pct,
        "medial_overhang_mm": medial_overhang_mm,
        "lateral_overhang_mm": lateral_overhang_mm,
        "fit_status": fit_status,
    }


def evaluate_femoral_fit(
    size: int,
    x_offset_mm: float,
    y_offset_mm: float,
    patient_ap_mm: float = 59.0,
    patient_ml_mm: float = 65.0,
) -> Dict[str, Any]:
    """
    Evaluates femoral component fit against distal femoral condyles and anterior cortex.
    - AP and ML coverage target: >= 90%
    - Anterior condylar flush: 0.0 mm flush with anterior cortex.
    - Notching risk trigger: posterior shift > 0.5 mm into anterior cortex.
    - Poor fit trigger: AP or ML coverage < 85%
    """
    template = get_femoral_template(size)

    ap_coverage_pct = round(
        min(100.0, max(60.0, (template["ap_mm"] / max(1.0, patient_ap_mm)) * 100.0 - abs(y_offset_mm) * 0.5)),
        1,
    )
    ml_coverage_pct = round(
        min(100.0, max(60.0, (template["ml_mm"] / max(1.0, patient_ml_mm)) * 100.0 - abs(x_offset_mm) * 0.5)),
        1,
    )

    undersize_gap = max(0.0, patient_ap_mm - template["ap_mm"])
    posterior_shift = max(0.0, -y_offset_mm)
    if posterior_shift > 0.2:
        notching_risk_mm = round(posterior_shift, 1)
    elif undersize_gap > 4.0:
        notching_risk_mm = round((undersize_gap - 4.0) * 0.5, 1)
    else:
        notching_risk_mm = 0.0

    if notching_risk_mm > 0.5:
        fit_status = "CAUTION: Anterior Notch Risk"
    elif ap_coverage_pct < 85.0 or ml_coverage_pct < 85.0:
        fit_status = "POOR FIT"
    else:
        fit_status = "ACCEPTABLE FIT"

    return {
        "ap_coverage_pct": ap_coverage_pct,
        "ml_coverage_pct": ml_coverage_pct,
        "notching_risk_mm": notching_risk_mm,
        "fit_status": fit_status,
    }


# ---------------------------------------------------------------------------
# Six Canonical Assessment Measurements
# ---------------------------------------------------------------------------

def calculate_mad(
    knee_center: Vector2D,
    hip_center: Vector2D,
    ankle_center: Vector2D,
    scale_mm_per_px: float = 1.0,
    side: str = "RIGHT",
) -> Dict[str, Any]:
    """
    Calculates Mechanical Axis Deviation (MAD).
    MAD is the perpendicular distance from the knee joint center to the mechanical axis line (hip -> ankle).
    Varus vs Valgus is determined by whether the mechanical axis falls medial or lateral to knee center.
    """
    dist_px = perpendicular_distance_point_to_line(knee_center, hip_center, ankle_center)
    signed_offset_px = signed_point_to_line_offset(knee_center, hip_center, ankle_center)
    dist_mm = round(dist_px * scale_mm_per_px, 2)
    signed_offset_mm = round(signed_offset_px * scale_mm_per_px, 2)

    # In coronal limb alignment, for a Right knee:
    # A positive offset (to the anatomical lateral side) means valgus deviation;
    # A negative offset (medial) means varus deviation.
    if abs(dist_mm) < 1.0:
        alignment_type = "NEUTRAL"
    elif side.upper() == "RIGHT":
        alignment_type = "VALGUS" if signed_offset_mm > 0 else "VARUS"
    else:  # LEFT
        alignment_type = "VARUS" if signed_offset_mm > 0 else "VALGUS"

    return {
        "mad_mm": dist_mm,
        "signed_offset_mm": signed_offset_mm,
        "unit": "mm",
        "alignment_type": alignment_type,
        "definition_version": "1.0.0",
    }


def calculate_ama(
    femur_proximal_shaft: Vector2D,
    femur_distal_shaft: Vector2D,
    hip_center: Vector2D,
    knee_center: Vector2D,
) -> float:
    """
    Calculates Anatomical-Mechanical Angle (AMA) of the femur in degrees.
    Angle between femoral anatomical axis (proximal shaft -> distal shaft)
    and femoral mechanical axis (hip center -> knee center).
    Typically 5.0° - 7.0°.
    """
    anat_vec = femur_distal_shaft - femur_proximal_shaft
    mech_vec = knee_center - hip_center
    angle = angle_between_vectors_deg(anat_vec, mech_vec)
    return round(angle, 2)


def calculate_mhka(
    hip_center: Vector2D,
    knee_center: Vector2D,
    ankle_center: Vector2D,
) -> float:
    """
    Calculates Mechanical Hip-Knee-Ankle (mHKA) angle in degrees.
    Included angle between the femoral mechanical axis (hip -> knee)
    and the tibial mechanical axis (knee -> ankle).
    Neutral is exactly 180.0°.
    Values < 180° represent varus (e.g. 174° = 6° varus).
    Values > 180° represent valgus.
    """
    femur_mech = hip_center - knee_center
    tibia_mech = ankle_center - knee_center
    angle = angle_between_vectors_deg(femur_mech, tibia_mech)
    return round(angle, 2)


def calculate_mpta(
    knee_center: Vector2D,
    ankle_center: Vector2D,
    medial_tibial_plateau: Vector2D,
    lateral_tibial_plateau: Vector2D,
) -> float:
    """
    Calculates Medial Proximal Tibial Angle (MPTA) in degrees.
    Medial angle between the tibial mechanical axis and the proximal tibial joint line.
    Normal is approximately 87.0° (ranging 85° - 90°).
    """
    tibia_axis = knee_center - ankle_center
    joint_line = medial_tibial_plateau - lateral_tibial_plateau
    angle = angle_between_vectors_deg(tibia_axis, joint_line)
    return round(angle, 2)


def calculate_ldfa(
    hip_center: Vector2D,
    knee_center: Vector2D,
    medial_femoral_condyle: Vector2D,
    lateral_femoral_condyle: Vector2D,
) -> float:
    """
    Calculates Lateral Distal Femoral Angle (mLDFA / LDFA) in degrees.
    Lateral angle between the femoral mechanical axis and the distal femoral joint line.
    Normal is approximately 87.0° - 88.0° (ranging 85° - 90°).
    """
    femur_axis = hip_center - knee_center
    joint_line = lateral_femoral_condyle - medial_femoral_condyle
    angle = angle_between_vectors_deg(femur_axis, joint_line)
    return round(angle, 2)


def calculate_pts(
    tibial_proximal_shaft: Vector2D,
    tibial_distal_shaft: Vector2D,
    anterior_plateau: Vector2D,
    posterior_plateau: Vector2D,
) -> float:
    """
    Calculates Posterior Tibial Slope (PTS) in degrees on sagittal radiograph (KLAT).
    Angle between the tibial plateau tangent and the perpendicular to the tibial longitudinal axis.
    Normal native slope is typically 7.0° - 10.0°.
    """
    tibial_shaft = tibial_distal_shaft - tibial_proximal_shaft
    plateau_vec = posterior_plateau - anterior_plateau
    included_angle = angle_between_vectors_deg(tibial_shaft, plateau_vec)
    # The slope is the deviation from the perpendicular (90°)
    slope = abs(90.0 - included_angle)
    return round(slope, 2)
