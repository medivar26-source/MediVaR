"""
Assessment calculation module for MediVeR-XR.

Evaluates learner plan/execution attempts against reference standards:
- Evaluates individual criteria against tolerances and severity thresholds.
- Classifies deviations into error severities: NONE, MINOR, MAJOR, CRITICAL.
- Aggregates weighted scores across skills defined in the institutional program.
- Implements safety rules (e.g. automatic failure on critical clinical errors).

Fully connected to the existing assessment_criteria and skills database schema.
"""

from typing import Dict, Any, List, Optional
from decimal import Decimal


def classify_error_severity(
    abs_deviation: float,
    severity_rule: Optional[Dict[str, float]] = None,
) -> str:
    """
    Classifies error severity based on deviation magnitude and rule thresholds:
    Rule format: {"minor": 2.0, "major": 4.0, "critical": 6.0}
    """
    if not severity_rule:
        return "NONE"

    critical_thresh = severity_rule.get("critical", float("inf"))
    major_thresh = severity_rule.get("major", float("inf"))
    minor_thresh = severity_rule.get("minor", float("inf"))

    if abs_deviation >= critical_thresh:
        return "CRITICAL"
    elif abs_deviation >= major_thresh:
        return "MAJOR"
    elif abs_deviation >= minor_thresh:
        return "MINOR"
    return "NONE"


def evaluate_measurement_criterion(
    parameter: str,
    actual_value: float,
    target_value: float,
    tolerance_min: Optional[float] = None,
    tolerance_max: Optional[float] = None,
    severity_rule: Optional[Dict[str, float]] = None,
) -> Dict[str, Any]:
    """
    Evaluates a single clinical measurement parameter against reference target and tolerance.
    """
    deviation = round(actual_value - target_value, 2)
    abs_dev = abs(deviation)

    # Use specified tolerances or default symmetric tolerance
    tol_min = tolerance_min if tolerance_min is not None else (severity_rule.get("minor", 1.0) if severity_rule else 1.0)
    tol_max = tolerance_max if tolerance_max is not None else (severity_rule.get("minor", 1.0) if severity_rule else 1.0)

    is_within_tolerance = (-tol_min <= deviation <= tol_max)

    if is_within_tolerance:
        severity = "NONE"
        criterion_score = 100.0
    else:
        severity = classify_error_severity(abs_dev, severity_rule)
        if severity == "CRITICAL":
            criterion_score = 0.0
        elif severity == "MAJOR":
            criterion_score = 40.0
        elif severity == "MINOR":
            criterion_score = 75.0
        else:
            criterion_score = 85.0

    return {
        "parameter": parameter,
        "actual_value": actual_value,
        "target_value": target_value,
        "deviation": deviation,
        "abs_deviation": abs_dev,
        "is_within_tolerance": is_within_tolerance,
        "severity": severity,
        "criterion_score": criterion_score,
        "is_critical": severity == "CRITICAL",
    }


def aggregate_skill_scores(
    evaluations: List[Dict[str, Any]],
    skills_map: Dict[str, Dict[str, Any]],  # skill_id -> {"name": ..., "weight": float}
    pass_threshold: float = 70.0,
) -> Dict[str, Any]:
    """
    Aggregates evaluated criteria into skill-level scores and an overall score.
    Automatically flags failure if any critical clinical error occurred.
    """
    # Group evaluations by skill_id
    skill_groups: Dict[str, List[float]] = {}
    has_critical_failure = False

    for ev in evaluations:
        if ev.get("is_critical", False):
            has_critical_failure = True
        skill_id = str(ev.get("skill_id", "default"))
        if skill_id not in skill_groups:
            skill_groups[skill_id] = []
        skill_groups[skill_id].append(ev.get("criterion_score", 100.0))

    skill_breakdown = []
    total_weighted_score = 0.0
    total_weights = 0.0

    for s_id, scores in skill_groups.items():
        skill_meta = skills_map.get(s_id, {"name": f"Skill {s_id}", "weight": 0.25})
        raw_weight = skill_meta.get("weight", 0.25)
        weight = float(raw_weight) if isinstance(raw_weight, (int, float, Decimal)) else 0.25
        avg_score = sum(scores) / len(scores) if scores else 100.0

        total_weighted_score += avg_score * weight
        total_weights += weight

        skill_breakdown.append({
            "skill_id": s_id,
            "skill_name": skill_meta.get("name", "Unknown Skill"),
            "weight": weight,
            "score": round(avg_score, 1),
            "passed": avg_score >= pass_threshold,
        })

    # Normalize overall score if total weights > 0
    if total_weights > 0:
        overall_score = round(total_weighted_score / total_weights, 1)
    else:
        overall_score = 100.0

    # Critical failure overrides overall score to fail
    final_passed = (overall_score >= pass_threshold) and not has_critical_failure

    return {
        "overall_score": overall_score,
        "passed": final_passed,
        "pass_threshold": pass_threshold,
        "has_critical_failure": has_critical_failure,
        "skill_breakdown": skill_breakdown,
    }
