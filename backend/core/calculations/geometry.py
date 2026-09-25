"""
Geometry module for MediVeR-XR.

Implements pure mathematical and geometric calculations:
- 2D vector operations (dot product, magnitude, angle)
- Perpendicular point-to-line distance
- Radiographic radio-opaque marker calibration derivation
"""

from dataclasses import dataclass
import math
from typing import Dict, Any, Tuple


@dataclass(frozen=True)
class Vector2D:
    x: float
    y: float

    def __sub__(self, other: "Vector2D") -> "Vector2D":
        return Vector2D(self.x - other.x, self.y - other.y)

    def __add__(self, other: "Vector2D") -> "Vector2D":
        return Vector2D(self.x + other.x, self.y + other.y)


def dot_product(v1: Vector2D, v2: Vector2D) -> float:
    return v1.x * v2.x + v1.y * v2.y


def vector_magnitude(v: Vector2D) -> float:
    return math.sqrt(v.x * v.x + v.y * v.y)


def angle_between_vectors_deg(v1: Vector2D, v2: Vector2D) -> float:
    """
    Calculate the angle between two 2D vectors in degrees.
    Cosine is clamped to [-1.0, 1.0] to prevent floating-point domain errors in acos.
    """
    mag1 = vector_magnitude(v1)
    mag2 = vector_magnitude(v2)
    if mag1 == 0.0 or mag2 == 0.0:
        return 0.0

    cos_val = dot_product(v1, v2) / (mag1 * mag2)
    cos_val = max(-1.0, min(1.0, cos_val))
    return math.degrees(math.acos(cos_val))


def perpendicular_distance_point_to_line(
    point: Vector2D, line_pt1: Vector2D, line_pt2: Vector2D
) -> float:
    """
    Calculate perpendicular distance from a point P(x0, y0) to line passing through A(x1, y1) and B(x2, y2).
    Formula from MediVeR Clinical & Assessment Calculations Specification (Section 5):
    MAD_distance = abs((x2-x1)(y1-y0) - (x1-x0)(y2-y1)) / sqrt((x2-x1)^2 + (y2-y1)^2)
    """
    dx = line_pt2.x - line_pt1.x
    dy = line_pt2.y - line_pt1.y
    line_len = math.sqrt(dx * dx + dy * dy)
    if line_len == 0.0:
        return vector_magnitude(point - line_pt1)

    numerator = abs(dx * (line_pt1.y - point.y) - (line_pt1.x - point.x) * dy)
    return numerator / line_len


def signed_point_to_line_offset(
    point: Vector2D, line_pt1: Vector2D, line_pt2: Vector2D
) -> float:
    """
    Signed perpendicular offset.
    Positive indicates right/lateral side relative to vector line_pt1 -> line_pt2;
    negative indicates left/medial side.
    """
    dx = line_pt2.x - line_pt1.x
    dy = line_pt2.y - line_pt1.y
    line_len = math.sqrt(dx * dx + dy * dy)
    if line_len == 0.0:
        return 0.0
    cross = (line_pt2.x - line_pt1.x) * (point.y - line_pt1.y) - (line_pt2.y - line_pt1.y) * (point.x - line_pt1.x)
    return cross / line_len


def calculate_calibration(
    physical_marker_diameter_mm: float,
    detected_marker_pixel_diameter: float,
    marker_type: str = "sphere_25mm",
) -> Dict[str, Any]:
    """
    Derives pixel-to-millimeter radiographic calibration.
    Scale is calculated: mm_per_px = physical_marker_diameter_mm / detected_marker_pixel_diameter.
    
    Calibration validity is derived dynamically from physical and mathematical constraints,
    rather than blindly assuming constant validity.
    """
    errors = []
    if physical_marker_diameter_mm <= 0:
        errors.append("Physical marker diameter must be greater than zero.")
    elif physical_marker_diameter_mm < 5.0 or physical_marker_diameter_mm > 100.0:
        errors.append(f"Physical marker diameter {physical_marker_diameter_mm} mm is outside expected range [5-100 mm].")

    if detected_marker_pixel_diameter <= 0:
        errors.append("Detected marker pixel diameter must be greater than zero.")
    elif detected_marker_pixel_diameter < 10.0 or detected_marker_pixel_diameter > 3000.0:
        errors.append(f"Detected pixel diameter {detected_marker_pixel_diameter} px is outside expected range [10-3000 px].")

    if errors:
        return {
            "marker_type": marker_type,
            "physical_marker_diameter_mm": physical_marker_diameter_mm,
            "detected_marker_pixel_diameter": detected_marker_pixel_diameter,
            "calculated_scale_mm_per_px": None,
            "unit": "mm/px",
            "method": "radio_opaque_marker",
            "version": "1.0.0",
            "is_valid": False,
            "validation_error": "; ".join(errors),
        }

    scale = round(physical_marker_diameter_mm / detected_marker_pixel_diameter, 5)

    # Standard digital radiography scales typically range from 0.05 to 1.5 mm/px
    is_scale_realistic = 0.05 <= scale <= 1.5
    if not is_scale_realistic:
        errors.append(f"Derived scale {scale} mm/px is clinically unrealistic for standard radiographs (expected 0.05-1.5 mm/px).")

    return {
        "marker_type": marker_type,
        "physical_marker_diameter_mm": float(physical_marker_diameter_mm),
        "detected_marker_pixel_diameter": float(detected_marker_pixel_diameter),
        "calculated_scale_mm_per_px": float(scale),
        "unit": "mm/px",
        "method": "radio_opaque_marker",
        "version": "1.0.0",
        "is_valid": len(errors) == 0,
        "validation_error": "; ".join(errors) if errors else None,
    }
