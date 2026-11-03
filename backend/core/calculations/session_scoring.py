"""
Scoring of one TKR headset run (an "attempt") into the stored report (`assessment_results`).

This is the one place a score is decided. The dashboard reads what this writes and derives nothing of its
own, so every rule is stated here once and recorded in the result's `payload.rules`, which makes a stored
report reproducible from its own inputs.

Pipeline (08_ASSESSMENT_ENGINE.md, 20_CLINICAL_AND_ASSESSMENT_CALCULATIONS.md §19-28):

    planned values (the locked plan)  ->  planning criteria vs the case's reference      -> Pre-operative planning
    planned vs achieved (headset)     ->  deviation -> verdict per parameter -> scene outcome
    scene outcome + time against par  ->  scene marks -> category marks -> total
    failed critical scenes            ->  critical errors -> cap -> pass / fail

The rules, all of which the report screens already state to the learner:

* Seven categories worth 100 marks (`CATEGORIES`). Pre-operative planning is scored from the plan; the other
  six from the scenes mapped to them. A category's marks are shared equally by the scenes the run visited.
* A scene's marks are nine tenths technique and one tenth time against par. Technique credit is 1 for a pass,
  0.5 for a borderline and 0 for a fail. Time credit is 1 at or under par, falling linearly to 0 at the
  scene's maximum time.
* A measured parameter passes within half its tolerance, is borderline within its tolerance, and fails beyond
  it. Tolerances are widened (Beginner) or narrowed (Expert) by `TOLERANCE_BAND`, as the case pages say.
  A scene with measured parameters takes its worst parameter's verdict. A scene without one is judged on the
  warnings the headset logged: none is a pass, one a borderline, two or more a fail.
* A failed critical scene (one that damages a named structure) is a critical error. Three or more cap the
  total at `CRITICAL_ERROR_CAP` and fail the run whatever the marks say; the categories still show what the
  technique earned.
* Pass mark by difficulty: Beginner 60, Intermediate 70, Expert 80.

Category marks are rounded half-up to whole marks and the total is their sum, so the parts always add up to
the headline figure (except when the cap applies, which the report says in words).

The numeric tolerances for the execution parameters that the dashboard did not already state (coronal cut
angle, rotation, gap difference, tray rotation) are **sample configuration**, not clinically approved values;
`SCORING_VERSION` names them as such. Replace them with the approved criteria before real use.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from decimal import ROUND_HALF_UP, Decimal
from typing import Any, Dict, List, Optional

from core.calculations.assessment import evaluate_measurement_criterion

SCORING_VERSION = "mediver-tkr-1.0-sample"

# key, label, short, max marks. Must total 100. Mirrors CATEGORY_META in dashboard/src/lib/seed.ts.
CATEGORIES: List[tuple] = [
    ("preop_planning", "Pre-operative planning", "Pre-op", 20),
    ("bone_cuts", "Bone cuts & alignment", "Cuts", 25),
    ("gap_assessment", "Gap assessment", "Gaps", 15),
    ("trialling", "Trialling & stability", "Trial", 15),
    ("implantation", "Implantation & cementation", "Implant", 15),
    ("patellar", "Patellar management", "Patella", 5),
    ("exposure_closure", "Exposure & closure", "Exposure", 5),
]
CATEGORY_MAX = {key: mx for key, _l, _s, mx in CATEGORIES}

PASS_MARK = {"beginner": 60, "intermediate": 70, "expert": 80}
TOLERANCE_BAND = {"beginner": 1.5, "intermediate": 1.0, "expert": 0.7}

TECHNIQUE_SHARE = 0.9
TIMING_SHARE = 0.1
TECHNIQUE_CREDIT = {"pass": 1.0, "borderline": 0.5, "fail": 0.0}

CRITICAL_ERROR_LIMIT = 3
CRITICAL_ERROR_CAP = 59


@dataclass(frozen=True)
class Scene:
    scene: str
    part: str
    name: str
    category: Optional[str]
    par_s: int
    max_s: int
    critical: bool = False
    variant: Optional[str] = None  # "PS only" | "Cemented only" | "Cementless only" | "If resurfaced" | "To be authored"


def _cat(part: str, scene: str) -> Optional[str]:
    # Same mapping as categoryForScene() in dashboard/src/lib/seed.ts.
    if part in ("P2", "P3", "P11"):
        return "exposure_closure"
    if part in ("P4", "P5", "P8"):
        return "bone_cuts"
    if scene == "6.1":
        return "gap_assessment"
    if scene in ("6.2", "6.3"):
        return "trialling"
    if part in ("P7", "P10"):
        return "implantation"
    if part == "P9":
        return "patellar"
    return None


_CRITICAL = {"3.2", "4.2", "5.2", "5.4"}

# scene, part, name, par, max, variant. Mirrors SCENE_SEED / SCENE_TIMES in dashboard/src/lib/seed.ts
# (tests/test_session_scoring.py checks that the two agree).
_SCENE_ROWS = [
    ("0.1", "P0", "Time Out", 60, 150, None),
    ("1.1", "P1", "Patient positioning", 60, 150, "To be authored"),
    ("1.2", "P1", "Clinical examination", 60, 150, "To be authored"),
    ("2.1", "P2", "Skin incision", 45, 120, None),
    ("2.2", "P2", "Medial parapatellar arthrotomy", 60, 150, None),
    ("2.3", "P2", "Release & patellar eversion", 75, 180, None),
    ("3.1", "P3", "ACL resection & subluxation", 45, 120, None),
    ("3.2", "P3", "Hohmann retractors & sleeve", 60, 150, None),
    ("3.3", "P3", "Osteophyte removal", 75, 180, None),
    ("4.1", "P4", "Tibial jig alignment", 90, 210, None),
    ("4.2", "P4", "Tibial cut execution", 75, 180, None),
    ("4.3", "P4", "Cut surface assessment", 45, 120, None),
    ("5.1", "P5", "Femoral landmarks", 60, 150, None),
    ("5.1b", "P5", "PCL resection", 40, 100, "PS only"),
    ("5.2", "P5", "Distal femur cut", 75, 180, None),
    ("5.3", "P5", "Femoral sizing", 60, 150, None),
    ("5.4", "P5", "4-in-1 block & four cuts", 90, 210, None),
    ("6.1", "P6", "Flexion/extension gaps", 90, 210, None),
    ("6.2", "P6", "Trial components", 75, 180, None),
    ("6.3", "P6", "Alignment, ROM & tracking", 60, 150, None),
    ("7.1", "P7", "Tray sizing & rotation", 60, 150, None),
    ("7.2", "P7", "Keel preparation", 60, 150, None),
    ("7.2b", "P7", "Cementless broach", 50, 130, "Cementless only"),
    ("8.1", "P8", "PS box cut", 60, 150, "PS only"),
    ("9.1", "P9", "Patellar preparation", 50, 130, None),
    ("9.1b", "P9", "Patellar resurfacing", 60, 150, "If resurfaced"),
    ("10.1", "P10", "Lavage & cement preparation", 60, 150, "Cemented only"),
    ("10.2", "P10", "Cementation", 90, 210, "Cemented only"),
    ("10.3", "P10", "Cement removal & assessment", 60, 150, "Cemented only"),
    ("11.1", "P11", "Wound closure", 75, 180, None),
    ("11.2", "P11", "Post-op X-rays & debrief", 60, 150, None),
]

SCENES: List[Scene] = [
    Scene(s, p, n, _cat(p, s), par, mx, s in _CRITICAL, v) for s, p, n, par, mx, v in _SCENE_ROWS
]
SCENE_BY_ID = {sc.scene: sc for sc in SCENES}


def scenes_for_variant(design: str, fixation: str) -> List[Scene]:
    """The scenes a run visits, after the variant gates. Same rule as scenesForVariant() in seed.ts."""
    out = []
    for sc in SCENES:
        v = sc.variant
        if v == "To be authored":
            continue
        if v == "PS only" and design != "PS":
            continue
        if v == "Cemented only" and fixation != "cemented":
            continue
        if v == "Cementless only" and fixation != "cementless":
            continue
        out.append(sc)
    return out


@dataclass(frozen=True)
class Parameter:
    key: str
    label: str
    unit: str
    scene: str
    tolerance: float
    scales_with_difficulty: bool = True
    # "dashboard" for tolerances the report already stated; "sample" for sample configuration.
    source: str = "dashboard"


# The planned-versus-achieved table. Planned values come from the locked plan; achieved values from the headset.
PARAMETERS: List[Parameter] = [
    Parameter("tibial_resection_mm", "Proximal tibial resection", "mm", "4.2", 2.0),
    Parameter("tibial_coronal_deg", "Tibial cut angle to the mechanical axis", "°", "4.2", 2.0, source="sample"),
    Parameter("tibial_slope_deg", "Posterior tibial slope", "°", "4.2", 2.0),
    Parameter("distal_femur_mm", "Distal femoral resection", "mm", "5.2", 2.0),
    Parameter("femoral_valgus_deg", "Distal femoral valgus", "°", "5.2", 1.5),
    Parameter("femoral_size", "Femoral component size", "", "5.3", 1.0, scales_with_difficulty=False, source="sample"),
    Parameter("femoral_rotation_deg", "Femoral rotation to the epicondylar axis", "°", "5.4", 3.0, source="sample"),
    Parameter("gap_difference_mm", "Flexion–extension gap difference", "mm", "6.1", 2.0, source="sample"),
    Parameter("hka_deg", "Hip–knee–ankle axis", "°", "6.3", 3.0),
    Parameter("tibial_tray_size", "Tibial tray size", "", "7.1", 1.0, scales_with_difficulty=False, source="sample"),
    Parameter("tray_rotation_deg", "Tibial tray rotation", "°", "7.1", 5.0, source="sample"),
]
PARAMETER_BY_KEY = {p.key: p for p in PARAMETERS}
SCENES_WITH_PARAMETERS = {p.scene for p in PARAMETERS}


def round_half_up(value: float, places: int = 0) -> float:
    q = Decimal(1).scaleb(-places)
    return float(Decimal(str(value)).quantize(q, rounding=ROUND_HALF_UP))


def tolerance_for(param: Parameter, difficulty: str) -> float:
    band = TOLERANCE_BAND[difficulty] if param.scales_with_difficulty else 1.0
    return round_half_up(param.tolerance * band, 2)


def verdict_for(abs_deviation: float, tolerance: float) -> str:
    """Pass within half the tolerance, borderline within it, fail beyond. Same rule as the report screen."""
    if abs_deviation <= tolerance * 0.5 + 1e-9:
        return "pass"
    if abs_deviation <= tolerance + 1e-9:
        return "borderline"
    return "fail"


def verdict_from_warnings(warnings: int) -> str:
    if warnings <= 0:
        return "pass"
    if warnings == 1:
        return "borderline"
    return "fail"


def timing_credit(duration_s: float, par_s: float, max_s: float) -> float:
    """1 at or under par, linear to 0 at the scene's maximum time, never negative."""
    if duration_s <= par_s:
        return 1.0
    if max_s <= par_s:
        return 0.0
    return max(0.0, 1.0 - (duration_s - par_s) / (max_s - par_s))


_WORST = {"pass": 0, "borderline": 1, "fail": 2}


@dataclass
class AttemptInput:
    difficulty: str
    design: str
    fixation: str
    # Planning: the case's configured criteria and what the learner's locked plan says.
    planning_criteria: List[Dict[str, Any]]  # {name, parameter, unit, target_value, tolerance, severity_rule}
    planned_measurements: Dict[str, float]    # parameter -> planned value (MAD_mm, mHKA_deg, ..., tibial_size, femoral_size)
    # Execution: planned and achieved per parameter key in PARAMETERS.
    planned: Dict[str, float]
    achieved: Dict[str, float]
    # Scenes: seconds spent, and warnings logged in scenes without measured parameters.
    durations: Dict[str, int]
    warnings: Dict[str, int] = field(default_factory=dict)
    # Free-text notes the headset attached to a warning, per scene.
    notes: Dict[str, str] = field(default_factory=dict)


def _fmt(value: float, unit: str) -> str:
    if unit == "":
        return f"{value:g}"
    text = f"{value:.1f}"
    return f"{text}{unit}" if unit == "°" else f"{text} {unit}"


def score_planning(inp: AttemptInput) -> Dict[str, Any]:
    """Pre-operative planning: each configured criterion through the backend's criterion evaluator."""
    band = TOLERANCE_BAND[inp.difficulty]
    rows = []
    for crit in inp.planning_criteria:
        param = crit["parameter"]
        planned = inp.planned_measurements.get(param)
        if planned is None:
            # Missing is not zero (§36): the criterion is unanswered and earns nothing, and says so.
            rows.append({**crit, "planned": None, "deviation": None, "severity": "NOT_ANSWERED", "score": 0.0})
            continue
        is_size = crit["unit"] == "size"
        scale = 1.0 if is_size else band
        tol = round_half_up(float(crit["tolerance"]) * scale, 2)
        rule = {k: round_half_up(float(v) * scale, 2) for k, v in (crit.get("severity_rule") or {}).items()}
        ev = evaluate_measurement_criterion(param, float(planned), float(crit["target_value"]), tol, tol, rule)
        rows.append({
            "name": crit["name"],
            "parameter": param,
            "unit": crit["unit"],
            "reference": float(crit["target_value"]),
            "planned": float(planned),
            "deviation": ev["deviation"],
            "tolerance": tol,
            "severity": ev["severity"],
            "score": ev["criterion_score"],
        })
    mean = sum(r["score"] for r in rows) / len(rows) if rows else 0.0
    return {"criteria": rows, "mean_criterion_score": round_half_up(mean, 2)}


def score_attempt(inp: AttemptInput) -> Dict[str, Any]:
    """Score one completed run. Returns the stored report's fields (see assessment_results in migration 013)."""
    if inp.difficulty not in PASS_MARK:
        raise ValueError(f"unknown difficulty {inp.difficulty!r}")

    visited = scenes_for_variant(inp.design, inp.fixation)
    missing = [sc.scene for sc in visited if sc.scene not in inp.durations]
    if missing:
        raise ValueError(f"no duration recorded for scenes {missing}: an incomplete run is not scored here")

    # 1. Parameters: deviation and verdict.
    parameters = []
    by_scene_verdicts: Dict[str, List[str]] = {}
    for p in PARAMETERS:
        if p.scene not in {sc.scene for sc in visited}:
            continue
        planned = inp.planned.get(p.key)
        achieved = inp.achieved.get(p.key)
        if achieved is None:
            raise ValueError(f"no achieved value for {p.key}")
        tol = tolerance_for(p, inp.difficulty)
        if planned is None:
            deviation, verdict = None, None
        else:
            deviation = round_half_up(achieved - planned, 2)
            verdict = verdict_for(abs(deviation), tol)
            by_scene_verdicts.setdefault(p.scene, []).append(verdict)
        parameters.append({
            "key": p.key, "label": p.label, "unit": p.unit, "scene": p.scene,
            "planned": planned, "achieved": achieved, "deviation": deviation,
            "tolerance": tol, "verdict": verdict, "tolerance_source": p.source,
        })

    # 2. Scenes: outcome, time credit, marks.
    per_category_scenes: Dict[str, List[Scene]] = {}
    for sc in visited:
        if sc.category:
            per_category_scenes.setdefault(sc.category, []).append(sc)

    scene_results = []
    for sc in visited:
        duration = int(inp.durations[sc.scene])
        warnings = int(inp.warnings.get(sc.scene, 0))
        if sc.scene in by_scene_verdicts:
            outcome = max(by_scene_verdicts[sc.scene], key=lambda v: _WORST[v])
            warnings = sum(1 for v in by_scene_verdicts[sc.scene] if v != "pass")
        else:
            outcome = verdict_from_warnings(warnings)
        timing = timing_credit(duration, sc.par_s, sc.max_s)
        if sc.category:
            scene_max = CATEGORY_MAX[sc.category] / len(per_category_scenes[sc.category])
            earned = scene_max * (TECHNIQUE_SHARE * TECHNIQUE_CREDIT[outcome] + TIMING_SHARE * timing)
        else:
            scene_max, earned = 0.0, 0.0
        scene_results.append({
            "scene": sc.scene, "part": sc.part, "label": sc.name, "category": sc.category,
            "critical": sc.critical, "outcome": outcome, "warnings": warnings,
            "duration_s": duration, "par_s": sc.par_s, "max_s": sc.max_s,
            "timing_credit": round_half_up(timing, 4),
            "max_points": round_half_up(scene_max, 4),
            "points": round_half_up(earned, 4),
            "points_lost": round_half_up(scene_max - earned, 4),
            "notes": [],
        })

    # 3. Feedback, one line per scene that did not pass, traceable to its parameter or warning.
    feedback = []
    for row in scene_results:
        if row["outcome"] == "pass":
            continue
        lines = []
        for p in parameters:
            if p["scene"] != row["scene"] or p["verdict"] in (None, "pass"):
                continue
            sign = "+" if p["deviation"] > 0 else ""
            lines.append(
                f"{p['label']}: {_fmt(p['achieved'], p['unit'])} against {_fmt(p['planned'], p['unit'])} planned "
                f"({sign}{_fmt(p['deviation'], p['unit'])}, tolerance ±{_fmt(p['tolerance'], p['unit'])})."
            )
        if not lines:
            note = inp.notes.get(row["scene"])
            count = row["warnings"]
            lines.append((note + " " if note else "") + f"{count} warning{'s' if count != 1 else ''} logged.")
        row["notes"] = lines
        feedback.append({
            "scene": row["scene"], "label": row["label"], "category": row["category"] or "",
            "text": " ".join(lines),
            "points": round_half_up(row["points_lost"], 1),
            "severity": "fail" if row["outcome"] == "fail" else "warning",
            "critical": row["critical"] and row["outcome"] == "fail",
        })

    # 4. Categories.
    planning = score_planning(inp)
    categories = []
    for key, label, short, mx in CATEGORIES:
        if key == "preop_planning":
            raw = mx * planning["mean_criterion_score"] / 100.0
            accuracy = planning["mean_criterion_score"]
            timing_pct = None  # planning is not timed against a par
        else:
            rows = [r for r in scene_results if r["category"] == key]
            raw = sum(r["points"] for r in rows)
            total_max = sum(r["max_points"] for r in rows) or 1.0
            accuracy = 100.0 * sum(r["max_points"] * TECHNIQUE_CREDIT[r["outcome"]] for r in rows) / total_max
            timing_pct = 100.0 * sum(r["max_points"] * r["timing_credit"] for r in rows) / total_max
        score = int(min(mx, max(0, round_half_up(raw))))
        categories.append({
            "key": key, "label": label, "short": short, "max": mx, "score": score,
            "raw": round_half_up(raw, 2),
            "accuracy": int(round_half_up(accuracy)),
            "timing": None if timing_pct is None else int(round_half_up(timing_pct)),
        })

    # 5. Total, critical errors, cap, verdict.
    earned_total = sum(c["score"] for c in categories)
    critical_errors = sum(1 for r in scene_results if r["critical"] and r["outcome"] == "fail")
    capped = critical_errors >= CRITICAL_ERROR_LIMIT
    overall = min(earned_total, CRITICAL_ERROR_CAP) if capped else earned_total
    pass_mark = PASS_MARK[inp.difficulty]
    passed = (not capped) and overall >= pass_mark
    reason_codes = []
    if capped:
        reason_codes.append("CRITICAL_ERROR_CAP")
    if overall < pass_mark:
        reason_codes.append("BELOW_PASS_MARK")

    return {
        "overall_score": overall,
        "earned_score": earned_total,
        "max_score": 100,
        "pass_mark": pass_mark,
        "passed": passed,
        "critical_errors": critical_errors,
        "capped": capped,
        "categories": categories,
        "parameters": parameters,
        "scene_results": scene_results,
        "feedback": feedback,
        "duration_s": sum(int(inp.durations[sc.scene]) for sc in visited),
        "payload": {
            "result": "PASS" if passed else "FAIL",
            "reason_codes": reason_codes,
            "planning": planning,
            "rules": {
                "scoring_version": SCORING_VERSION,
                "categories": {k: mx for k, _l, _s, mx in CATEGORIES},
                "pass_mark": PASS_MARK,
                "tolerance_band": TOLERANCE_BAND[inp.difficulty],
                "technique_share": TECHNIQUE_SHARE,
                "timing_share": TIMING_SHARE,
                "technique_credit": TECHNIQUE_CREDIT,
                "critical_error_limit": CRITICAL_ERROR_LIMIT,
                "critical_error_cap": CRITICAL_ERROR_CAP,
                "verdict": "pass <= tolerance/2 < borderline <= tolerance < fail",
                "warnings_verdict": "0 pass, 1 borderline, 2+ fail",
                "rounding": "category marks rounded half-up; total = sum of category marks",
            },
        },
        "scoring_version": SCORING_VERSION,
    }


def percentile_in(pool_scores: List[float], score: float, distinct_peers: int) -> Optional[int]:
    """Share of the cohort's results (this one included) at or below this score. None below three peers."""
    if distinct_peers < 3 or not pool_scores:
        return None
    at_or_below = sum(1 for s in pool_scores if s <= score)
    return int(round_half_up(100.0 * at_or_below / len(pool_scores)))
