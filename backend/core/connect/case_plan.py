"""
CasePlan: the one case model the headset receives.

Built on the server from a *locked* plan, never from anything the browser sends at assignment time, so the
headset runs exactly the plan that was sealed. Three sources, in this order of authority:

1. the plan's own `execution_targets` (what the learner's plan set out to do in theatre), when it has them;
2. the locked V1 VR payload: operative side, AMA, assessment, implant sizes and positions;
3. the scorer's fixed rules for the rest (see `execution_targets_from`).

Tolerances are the scorer's own, already scaled by the session's difficulty, so the headset's gauge and the
backend's verdict agree about what "in tolerance" means. No patient identifier is ever included: the plan
carries a synthetic label, and the trainee a display name only.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from core.calculations.session_scoring import PARAMETER_BY_KEY, tolerance_for
from core.connect.contract import (
    HEADSET_MODE_FOR,
    PLAN_KEYS,
    SCHEMA_VERSION,
)

# Not planned on the 2D screen: the sagittal exam's target, authored on the headset (flexion 90 +/- 5).
FLEXION_TARGET_DEG = 90.0
FLEXION_TOLERANCE_DEG = 5.0

_SIDE = {"LEFT": "Left", "RIGHT": "Right"}


def deformity_from(*texts: Optional[str]) -> str:
    """"Varus" or "Valgus" when the case's own wording says so, otherwise "" (never a default: an unrecorded
    pathology is shown as "Not recorded", not guessed)."""
    blob = " ".join(t for t in texts if t).lower()
    has_varus, has_valgus = "varus" in blob, "valgus" in blob
    if has_varus == has_valgus:      # neither, or both: the wording does not settle it
        return ""
    return "Varus" if has_varus else "Valgus"


class PlanNotSendable(ValueError):
    """The locked plan lacks something the headset must not guess (side, assessment, sizes)."""


def execution_targets_from(vr_payload: Dict[str, Any], design: str, fixed_flexion_deg: float = 0.0) -> Dict[str, float]:
    """What a plan with no stored execution targets sets out to do. The same rules the scorer was verified
    against (scripts/seed_sample_results.py `planned_targets`); a test pins the two together."""
    try:
        ama = float(vr_payload["assessment"]["AMA_deg"])
        tibial_size = int(vr_payload["tibial_component"]["implant_size"])
        femoral_size = int(vr_payload["femoral_component"]["implant_size"])
    except (KeyError, TypeError, ValueError) as exc:
        raise PlanNotSendable(f"the locked plan has no usable {exc}") from exc
    return {
        "tibial_resection_mm": 9.0,
        "tibial_coronal_deg": 0.0,
        "tibial_slope_deg": 3.0 if design == "CR" else 1.0,
        "distal_femur_mm": 10.0 if fixed_flexion_deg >= 10 else 9.0,
        "femoral_valgus_deg": ama,
        "femoral_size": femoral_size,
        "femoral_rotation_deg": 0.0,
        "gap_difference_mm": 0.0,
        "hka_deg": 0.0,
        "tibial_tray_size": tibial_size,
        "tray_rotation_deg": 0.0,
    }


def build_case_plan(
    *,
    assignment_id: str,
    case_id: str,
    issued_at_utc: str,
    vr_payload: Dict[str, Any],
    session_config: Dict[str, Any],
    execution_targets: Optional[Dict[str, float]] = None,
    headset_mode: Optional[str] = None,
    trainee: Dict[str, Any],
    instructor_name: str = "",
    deformity: str = "",
    deformity_deg: Optional[float] = None,
    summary: str = "",
    fixed_flexion_deg: float = 0.0,
) -> Dict[str, Any]:
    """The CasePlan for one assignment. Raises PlanNotSendable rather than fill anything in."""
    side = _SIDE.get(str(vr_payload.get("knee_side", "")).upper())
    if side is None:
        raise PlanNotSendable("the operative side is not recorded")
    label = str(vr_payload.get("patient_id") or "").strip()
    if not label:
        raise PlanNotSendable("the plan has no synthetic patient label")

    difficulty = session_config.get("difficulty")
    design = session_config.get("implant_design")
    if difficulty not in ("beginner", "intermediate", "expert") or design not in ("CR", "PS"):
        raise PlanNotSendable("the plan has no difficulty or implant design")

    targets = dict(execution_targets_from(vr_payload, design, fixed_flexion_deg))
    for k, v in (execution_targets or {}).items():  # the plan's own targets win
        if k in targets and isinstance(v, (int, float)) and not isinstance(v, bool):
            targets[k] = float(v) if k not in ("femoral_size", "tibial_tray_size") else int(v)

    values: List[Dict[str, Any]] = []
    for pk in PLAN_KEYS:
        if pk.key == "P1.flexionDeg":
            value, tol = FLEXION_TARGET_DEG, FLEXION_TOLERANCE_DEG
        elif pk.key == "P4.implantSize":
            # Display only: the manifest shows one size, the femoral component's.
            value, tol = targets["femoral_size"], 0.0
        else:
            param = PARAMETER_BY_KEY[pk.parameter]
            value, tol = targets[pk.parameter], tolerance_for(param, difficulty)
        values.append({"key": pk.key, "value": value, "tolerance": tol, "unit": pk.unit, "label": pk.label})

    mode = headset_mode or HEADSET_MODE_FOR.get(session_config.get("mode", "training"), "Practice")
    return {
        "schemaVersion": SCHEMA_VERSION,
        "assignmentId": assignment_id,
        "caseId": case_id,
        "issuedAtUtc": issued_at_utc,
        "patient": {
            "label": label,
            "side": side,
            # Never defaulted: an unrecorded deformity is empty and the headset shows "Not recorded".
            "deformity": deformity,
            "deformityDeg": deformity_deg if deformity_deg is not None else 0.0,
            "summary": summary,
        },
        "trainee": {
            "id": trainee["id"],
            "displayName": trainee["display_name"],
            "cohort": trainee.get("cohort") or "",
            "institution": trainee.get("institution") or "",
        },
        "instructor": {"displayName": instructor_name},
        "mode": mode,
        "difficulty": difficulty,
        "design": design,
        "fixation": session_config.get("fixation", ""),
        "values": values,
    }
