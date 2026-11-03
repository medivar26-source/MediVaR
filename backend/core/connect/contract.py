"""
The wire contract between the headset and this backend: names, enumerations and the structural check of a run
report. Mirrors Docs/Connectivity of the headset repository (openapi.yaml); a change here is a contract change.

JsonUtility on the headset writes enums as ints, so every enum travels as a string. Numbers that may be absent
travel as `hasX` + `x`, never NaN (a bare NaN token is not JSON).
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional

SCHEMA_VERSION = 1
# The backend accepts the current schema and the one before it.
ACCEPTED_SCHEMA_VERSIONS = (SCHEMA_VERSION, SCHEMA_VERSION - 1)

# Headset modes. Guided and Practice both record as an attempt of mode `training`; Exam is `assessment`.
MODES = ("Guided", "Practice", "Exam")
ATTEMPT_MODE = {"Guided": "training", "Practice": "training", "Exam": "assessment"}
# What the dashboard calls a mode (sessions, plans) -> what is sent to the headset.
HEADSET_MODE_FOR = {"training": "Practice", "assessment": "Exam"}

OUTCOMES = ("Completed", "Abandoned", "InProgress")
# outcome -> attempts.status (013). An abandoned run may be resumed, so it is `paused`, not `cancelled`.
ATTEMPT_STATUS_FOR_OUTCOME = {"Completed": "submitted", "Abandoned": "paused", "InProgress": "in_progress"}


@dataclass(frozen=True)
class PlanKey:
    key: str
    label: str
    unit: str
    # The scorer parameter (core.calculations.session_scoring.PARAMETERS) this key feeds; None = display only.
    parameter: Optional[str]
    # True for the keys the headset plan of 2026-10-23 lists; False for the ones this backend asks it to add so
    # that every parameter the scorer judges has a source (see the design note, section 6).
    in_headset_plan: bool = True


PLAN_KEYS: List[PlanKey] = [
    PlanKey("P1.flexionDeg", "Knee flexion reached", "deg", None),
    PlanKey("P2.tibialDepthMm", "Proximal tibial resection", "mm", "tibial_resection_mm"),
    PlanKey("P2.tibialVarusValgusDeg", "Tibial cut angle to the mechanical axis", "deg", "tibial_coronal_deg"),
    PlanKey("P2.tibialSlopeDeg", "Posterior tibial slope", "deg", "tibial_slope_deg"),
    PlanKey("P3.femoralDepthMm", "Distal femoral resection", "mm", "distal_femur_mm"),
    PlanKey("P3.femoralValgusDeg", "Distal femoral valgus", "deg", "femoral_valgus_deg"),
    PlanKey("P4.implantSize", "Implant size", "size", None),
    # Requested additions: without them the sample scoring rules cannot be applied to a headset run.
    PlanKey("P3.femoralSize", "Femoral component size", "size", "femoral_size", in_headset_plan=False),
    PlanKey("P3.femoralRotationDeg", "Femoral rotation to the epicondylar axis", "deg", "femoral_rotation_deg", in_headset_plan=False),
    PlanKey("P5.gapDifferenceMm", "Flexion-extension gap difference", "mm", "gap_difference_mm", in_headset_plan=False),
    PlanKey("P5.hkaDeg", "Hip-knee-ankle axis", "deg", "hka_deg", in_headset_plan=False),
    PlanKey("P4.tibialTraySize", "Tibial tray size", "size", "tibial_tray_size", in_headset_plan=False),
    PlanKey("P4.trayRotationDeg", "Tibial tray rotation", "deg", "tray_rotation_deg", in_headset_plan=False),
]
PLAN_KEY_BY_NAME = {k.key: k for k in PLAN_KEYS}
KEY_FOR_PARAMETER = {k.parameter: k.key for k in PLAN_KEYS if k.parameter}


def _is_number(value: Any) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and value == value and abs(value) != float("inf")


def validate_run_report(report: Any) -> List[str]:
    """Structural problems with a run report; empty when it can be stored. A report with problems is *poison*
    (HTTP 422): retrying it can never help, so the headset parks it and shows the reason."""
    problems: List[str] = []
    if not isinstance(report, dict):
        return ["the report is not a JSON object"]

    if report.get("schemaVersion") not in ACCEPTED_SCHEMA_VERSIONS:
        problems.append(f"schemaVersion must be one of {list(ACCEPTED_SCHEMA_VERSIONS)}")
    for name in ("runId", "assignmentId", "deviceId"):
        if not isinstance(report.get(name), str) or not report[name].strip():
            problems.append(f"{name} is required")
    revision = report.get("reportRevision")
    if not isinstance(revision, int) or isinstance(revision, bool) or revision < 1:
        problems.append("reportRevision must be an integer of 1 or more")
    if report.get("mode") not in MODES:
        problems.append(f"mode must be one of {list(MODES)}")
    if report.get("outcome") not in OUTCOMES:
        problems.append(f"outcome must be one of {list(OUTCOMES)}")

    steps = report.get("steps")
    if not isinstance(steps, list):
        problems.append("steps must be a list")
        steps = []
    for i, step in enumerate(steps):
        if not isinstance(step, dict) or not isinstance(step.get("stepId"), str) or not step["stepId"]:
            problems.append(f"steps[{i}].stepId is required")
            continue
        for n in ("timeSeconds", "plannedValue", "tolerance", "committedValue", "points"):
            if n in step and not _is_number(step[n]):
                problems.append(f"steps[{i}].{n} must be a finite number")
        if step.get("hasCommittedValue") and not _is_number(step.get("committedValue")):
            problems.append(f"steps[{i}] says it has a committed value but committedValue is not a number")

    measurements = report.get("measurements", [])
    if not isinstance(measurements, list):
        problems.append("measurements must be a list")
    else:
        for i, m in enumerate(measurements):
            if not isinstance(m, dict) or not isinstance(m.get("key"), str) or not _is_number(m.get("value")):
                problems.append(f"measurements[{i}] needs a key and a finite numeric value")

    for name in ("totalScore", "maxScore", "durationSeconds"):
        if name in report and not _is_number(report[name]):
            problems.append(f"{name} must be a finite number")
    return problems


def plan_values_by_key(case_plan: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
    """A CasePlan's keyed list as a dict, for lookups."""
    return {v["key"]: v for v in case_plan.get("values", []) if isinstance(v, dict) and "key" in v}


ASSESSMENT_KEYS = ("MAD_mm", "AMA_deg", "mHKA_deg", "MPTA_deg", "LDFA_deg", "PTS_deg")


def validate_vr_payload(payload: Any) -> List[str]:
    """The V1 VR transfer payload (docs/10_VR_INTEGRATION.md, PDF p.6-7): exactly these keys. Problems, or []."""
    if not isinstance(payload, dict):
        return ["vr_payload must be a JSON object"]
    problems: List[str] = []
    if not isinstance(payload.get("patient_id"), str) or not payload["patient_id"].strip():
        problems.append("vr_payload.patient_id is required")
    if payload.get("knee_side") not in ("LEFT", "RIGHT"):
        problems.append("vr_payload.knee_side must be LEFT or RIGHT")
    assessment = payload.get("assessment")
    if not isinstance(assessment, dict):
        problems.append("vr_payload.assessment is required")
    else:
        for k in ASSESSMENT_KEYS:
            if not _is_number(assessment.get(k)):
                problems.append(f"vr_payload.assessment.{k} must be a number")
    for part in ("tibial_component", "femoral_component"):
        comp = payload.get(part)
        if not isinstance(comp, dict):
            problems.append(f"vr_payload.{part} is required")
            continue
        size = comp.get("implant_size")
        if not isinstance(size, int) or isinstance(size, bool) or size < 1:
            problems.append(f"vr_payload.{part}.implant_size must be a whole number of 1 or more")
        pos = comp.get("position_2d")
        if not isinstance(pos, dict) or not all(_is_number(pos.get(k)) for k in ("x_offset_mm", "y_offset_mm", "rotation_deg")):
            problems.append(f"vr_payload.{part}.position_2d needs x_offset_mm, y_offset_mm and rotation_deg")
    return problems
