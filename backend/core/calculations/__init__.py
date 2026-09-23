"""
Modular calculation package for MediVeR-XR.

Separates concerns:
- geometry: Vector math, perpendicular distances, angles, calibration derivation.
- planning: Six TKA assessment measurements, component sizing catalogs, fit metrics.
- assessment: Reference comparison, criteria tolerance checks, severity classification, skill scoring.
"""

from .geometry import (
    Vector2D,
    dot_product,
    vector_magnitude,
    angle_between_vectors_deg,
    perpendicular_distance_point_to_line,
    calculate_calibration,
)
from .planning import (
    calculate_mad,
    calculate_ama,
    calculate_mhka,
    calculate_mpta,
    calculate_ldfa,
    calculate_pts,
    suggest_tibial_size,
    suggest_femoral_size,
    evaluate_tibial_fit,
    evaluate_femoral_fit,
    TIBIAL_SIZES_CATALOG,
    FEMORAL_SIZES_CATALOG,
)
from .assessment import (
    evaluate_measurement_criterion,
    classify_error_severity,
    aggregate_skill_scores,
)

__all__ = [
    "Vector2D",
    "dot_product",
    "vector_magnitude",
    "angle_between_vectors_deg",
    "perpendicular_distance_point_to_line",
    "calculate_calibration",
    "calculate_mad",
    "calculate_ama",
    "calculate_mhka",
    "calculate_mpta",
    "calculate_ldfa",
    "calculate_pts",
    "suggest_tibial_size",
    "suggest_femoral_size",
    "evaluate_tibial_fit",
    "evaluate_femoral_fit",
    "TIBIAL_SIZES_CATALOG",
    "FEMORAL_SIZES_CATALOG",
    "evaluate_measurement_criterion",
    "classify_error_severity",
    "aggregate_skill_scores",
]
