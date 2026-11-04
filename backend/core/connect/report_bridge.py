"""
From a headset RunReport to the scorer's input.

The headset reports *facts*: what value it committed at each judged step, how long each scene took, how many
warnings a scene raised. It does not decide a score, a verdict or a pass (docs/10_VR_INTEGRATION.md, "Client
authority boundary"). This module reads those facts and hands them to `core.calculations.session_scoring`,
against the plan the *server* locked, not the snapshot the headset echoes back in the report.

A run is never scored on invented numbers. In the default PARTIAL mode (the real headset's case since
2026-11-03: it models eight of the eleven parameters and has no closure, lavage or alignment scene) the run is
scored on the scenes it timed and the parameters it committed, and `coverage` lists what it did not perform or
measure, for the result to show. A report with no scene time at all is `missing`, stored and not scored. Strict
mode (`partial=False`) keeps the old all-or-nothing rule for the seed and the tests that pin it.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from core.calculations.session_scoring import (
    PARAMETERS,
    AttemptInput,
    scenes_for_variant,
)
from core.connect.contract import KEY_FOR_PARAMETER, PLAN_KEY_BY_NAME, plan_values_by_key


@dataclass
class BridgeResult:
    attempt_input: Optional[AttemptInput]
    missing: List[str] = field(default_factory=list)   # human-readable, one line each; non-empty = not scorable
    reported: Dict[str, Any] = field(default_factory=dict)  # what the headset claimed about itself (not used to score)
    coverage: List[str] = field(default_factory=list)  # scored, but these were not performed / not measured


def _num(value: Any) -> Optional[float]:
    return float(value) if isinstance(value, (int, float)) and not isinstance(value, bool) and value == value else None


def achieved_values(report: Dict[str, Any]) -> Dict[str, float]:
    """parameter key -> the value the headset committed, from steps first, then from measurements."""
    out: Dict[str, float] = {}
    for step in report.get("steps", []):
        pk = PLAN_KEY_BY_NAME.get(step.get("planKey") or "")
        if pk is None or pk.parameter is None or not step.get("hasCommittedValue"):
            continue
        v = _num(step.get("committedValue"))
        if v is not None:
            out[pk.parameter] = v          # a step re-done later overwrites the earlier value
    for m in report.get("measurements", []):
        pk = PLAN_KEY_BY_NAME.get(m.get("key") or "")
        if pk is not None and pk.parameter is not None and pk.parameter not in out:
            v = _num(m.get("value"))
            if v is not None:
                out[pk.parameter] = v
    return out


def scene_durations(report: Dict[str, Any], step_scene_map: Optional[Dict[str, str]] = None) -> Dict[str, int]:
    """scene id -> seconds. A step names its scene in `sceneId` (requested field); `step_scene_map` is the
    fallback for a headset that only sends its own step ids."""
    out: Dict[str, int] = {}
    for step in report.get("steps", []):
        scene = step.get("sceneId") or (step_scene_map or {}).get(step.get("stepId"))
        seconds = _num(step.get("timeSeconds"))
        if scene and seconds is not None:
            out[scene] = out.get(scene, 0) + int(round(seconds))
    return out


def scene_warnings(report: Dict[str, Any], step_scene_map: Optional[Dict[str, str]] = None) -> Dict[str, int]:
    out: Dict[str, int] = {}
    for step in report.get("steps", []):
        scene = step.get("sceneId") or (step_scene_map or {}).get(step.get("stepId"))
        n = step.get("warnings")
        if scene and isinstance(n, int) and not isinstance(n, bool) and n > 0:
            out[scene] = out.get(scene, 0) + n
    return out


def to_attempt_input(
    report: Dict[str, Any],
    *,
    case_plan: Dict[str, Any],
    session_config: Dict[str, Any],
    planned_measurements: Dict[str, float],
    planning_criteria: List[Dict[str, Any]],
    step_scene_map: Optional[Dict[str, str]] = None,
    partial: bool = True,
) -> BridgeResult:
    """`case_plan` is the server-built CasePlan of the assignment. Returns the scorer input, or what is missing.
    `partial` (default) scores what the headset performed and lists the rest in `coverage`."""
    reported = {k: report.get(k) for k in ("totalScore", "maxScore", "grade") if k in report}
    if report.get("outcome") != "Completed":
        return BridgeResult(None, ["the run did not finish, so it is not scored"], reported)

    design, fixation = session_config.get("implant_design"), session_config.get("fixation")
    difficulty = session_config.get("difficulty")
    visited = scenes_for_variant(design, fixation)
    scenes = {sc.scene for sc in visited}

    planned_by_key = plan_values_by_key(case_plan)
    planned: Dict[str, float] = {}
    for parameter, plan_key in KEY_FOR_PARAMETER.items():
        entry = planned_by_key.get(plan_key)
        if entry is not None:
            planned[parameter] = float(entry["value"])

    achieved = achieved_values(report)
    durations = scene_durations(report, step_scene_map)
    warnings = scene_warnings(report, step_scene_map)

    unmeasured = [p for p in PARAMETERS if p.scene in scenes and p.key not in achieved]
    unperformed = [sc for sc in visited if sc.scene not in durations]

    missing: List[str] = []
    coverage: List[str] = []
    if partial:
        if not any(sc.scene in durations for sc in visited):
            missing.append("no time recorded for any scene (no sceneId on any step, and no step map)")
        # Only parameters of scenes the run actually performed are "not measured"; a parameter of a scene the
        # run never reached is covered by that scene's own line.
        performed = {sc.scene for sc in visited if sc.scene in durations}
        coverage += [f"not measured: {p.label} ({KEY_FOR_PARAMETER[p.key]})" for p in unmeasured if p.scene in performed]
        coverage += [f"not performed: scene {sc.scene} ({sc.name})" for sc in unperformed]
    else:
        missing += [f"no committed value for {p.label} ({KEY_FOR_PARAMETER[p.key]})" for p in unmeasured]
        missing += [f"no time recorded for scene {sc.scene} ({sc.name})" for sc in unperformed]

    if missing:
        return BridgeResult(None, missing, reported)
    return BridgeResult(
        AttemptInput(
            difficulty=difficulty, design=design, fixation=fixation,
            planning_criteria=planning_criteria, planned_measurements=planned_measurements,
            planned=planned, achieved=achieved, durations=durations, warnings=warnings, partial=partial,
        ),
        [],
        reported,
        coverage,
    )
