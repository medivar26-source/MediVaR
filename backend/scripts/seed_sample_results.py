"""
Sample results: three resident accounts with a believable training history, scored by the real scorer.

The VR headset is not connected yet, so no real run has ever produced a report. This script stands in for
it, so the report, statistics and dashboard screens can be checked with data before the headset exists:

  * three resident accounts in a cohort owned by the instructor you name (created with the same service the
    "Add learner" button uses, so they can sign in with a Learner ID and password);
  * for every run: a locked pre-operative plan on a real library case, the attempt that performed it, and
    the stored report;
  * some runs belong to instructor-scheduled sessions (the roster is marked completed), others are practice;
  * one interrupted run with no report.

Every score is computed forwards by `core/calculations/session_scoring.py` from the inputs it stores:
planned values (the plan) against the case's reference and configured criteria, and planned against
achieved values (the run). Nothing is typed in as a score. What varies between runs is how precise the
resident was (a "level" from 0 to 1) and which parameters were their weak spot; the totals follow from that.

    Kavya Raman   improves steadily, with one dip on an Expert case; passes most runs
    Rohan Desai   ups and downs around the pass mark; one interrupted run
    Meera Pillai  mostly below the pass mark, one run capped by three critical errors, idle for over two weeks

Usage (from the backend folder):
    python scripts/seed_sample_results.py --dry-run                     compute and print everything; no database
    python scripts/seed_sample_results.py --dry-run --bundle-out x.json  also write what GET /results would return
    python scripts/seed_sample_results.py --instructor-email you@example.com [--password Secret123]
    python scripts/seed_sample_results.py --wipe                         remove everything a previous run created

Needs migration 013 (`plans`, `attempts`, `assessment_results`). Writes a manifest of every row it created to
`scripts/sample_results_manifest.json` (git-ignored), which is what `--wipe` removes, and nothing else.
"""

from __future__ import annotations

import argparse
import json
import random
import sys
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

BACKEND_DIR = Path(__file__).resolve().parent.parent
SCRIPTS_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND_DIR))
sys.path.insert(0, str(SCRIPTS_DIR))

from core.calculations.session_scoring import (  # noqa: E402
    PARAMETER_BY_KEY,
    PARAMETERS,
    SCENE_BY_ID,
    SCORING_VERSION,
    AttemptInput,
    percentile_in,
    round_half_up,
    scenes_for_variant,
    score_attempt,
    tolerance_for,
)
from case_criteria import CRITERIA, SIZE_CRITERIA  # noqa: E402

LIBRARY = SCRIPTS_DIR / "case_library.json"
MANIFEST = SCRIPTS_DIR / "sample_results_manifest.json"
DEFAULT_COHORT = "Sample results cohort"
NAMESPACE = uuid.UUID("6f1c2a4e-1d0b-4c55-9a51-5a3e7d2b9c10")  # dry-run ids only
SEED = 20261102

# ---------------------------------------------------------------------------------------------------------
# Who did what. level: 0 (imprecise) .. 1 (precise). weak: parameters that run went worst on.
# ---------------------------------------------------------------------------------------------------------
RESIDENTS = [
    {
        "first": "Kavya", "last": "Raman", "story": "improves steadily, one dip on an Expert case",
        "runs": [
            dict(days=52, case="moderate_varus_right", mode="training", design="CR", fixation="cemented", level=0.50, weak=["tibial_slope_deg"], session=True),
            dict(days=45, case="moderate_valgus_right", mode="training", design="CR", fixation="cemented", level=0.60, weak=["gap_difference_mm"]),
            dict(days=38, case="severe_varus_left", mode="training", design="PS", fixation="cemented", level=0.70, weak=[], session=True),
            dict(days=30, case="varus_steep_slope_right", mode="assessment", design="CR", fixation="cemented", level=0.78, weak=["tibial_slope_deg"], session=True),
            dict(days=22, case="severe_valgus_left", mode="training", design="PS", fixation="cementless", level=0.48, weak=["femoral_rotation_deg"]),
            dict(days=13, case="post_traumatic_varus_left", mode="training", design="CR", fixation="cemented", level=0.83, weak=[], session=True),
            dict(days=5, case="severe_valgus_left", mode="assessment", design="PS", fixation="cemented", level=0.87, weak=[]),
        ],
    },
    {
        "first": "Rohan", "last": "Desai", "story": "ups and downs around the pass mark",
        "runs": [
            dict(days=55, case="moderate_varus_right", mode="training", design="CR", fixation="cemented", level=0.66, weak=[], session=True),
            dict(days=48, case="severe_varus_left", mode="training", design="CR", fixation="cemented", level=0.76, weak=[]),
            dict(days=41, case="moderate_valgus_right", mode="assessment", design="CR", fixation="cemented", level=0.55, weak=["gap_difference_mm", "tray_rotation_deg"], session=True),
            dict(days=34, case="varus_steep_slope_right", mode="training", design="PS", fixation="cemented", level=0.78, weak=[]),
            dict(days=27, case="severe_varus_left", mode="training", design="CR", fixation="cemented", level=0.60, weak=[], interrupted_at="5.2"),
            dict(days=20, case="post_traumatic_varus_left", mode="training", design="CR", fixation="cementless", level=0.58, weak=["femoral_valgus_deg"], session=True),
            dict(days=11, case="moderate_valgus_right", mode="assessment", design="CR", fixation="cemented", level=0.80, weak=[], session=True),
            dict(days=4, case="severe_valgus_left", mode="training", design="PS", fixation="cemented", level=0.62, weak=["femoral_rotation_deg"]),
        ],
    },
    {
        "first": "Meera", "last": "Pillai", "story": "mostly below the pass mark; one run capped by three critical errors",
        "runs": [
            dict(days=58, case="moderate_varus_right", mode="training", design="CR", fixation="cemented", level=0.40, weak=[], session=True),
            dict(days=50, case="moderate_varus_right", mode="training", design="CR", fixation="cemented", level=0.54, weak=["gap_difference_mm"]),
            dict(days=43, case="severe_varus_left", mode="training", design="PS", fixation="cemented", level=0.30, weak=["tibial_slope_deg", "femoral_valgus_deg", "femoral_rotation_deg"], session=True),
            dict(days=35, case="moderate_valgus_right", mode="assessment", design="CR", fixation="cemented", level=0.45, weak=["gap_difference_mm"], session=True),
            dict(days=26, case="varus_steep_slope_right", mode="training", design="CR", fixation="cemented", level=0.50, weak=["tibial_slope_deg"]),
            dict(days=17, case="severe_varus_left", mode="assessment", design="CR", fixation="cemented", level=0.50, weak=[], session=True),
        ],
    },
]

# Notes the headset attaches to a warning in a scene without measured parameters.
WARNING_NOTES = {
    "0.1": "Time Out started before the implant check was read back.",
    "2.1": "Incision extended past the planned length.",
    "2.2": "Arthrotomy strayed off the medial border of the patella.",
    "2.3": "Patella everted before the lateral release was adequate.",
    "3.1": "ACL stump left on the tibia.",
    "3.2": "Retractor placed against the collateral ligament.",
    "3.3": "Posterior osteophyte left in place.",
    "4.1": "Jig not checked against the ankle centre before pinning.",
    "4.3": "Cut surface not checked with the angel wing.",
    "5.1": "Entry point placed medial to the notch.",
    "5.1b": "PCL stump left posteriorly.",
    "6.2": "Trial inserted without checking the insert thickness.",
    "7.2": "Keel punch not aligned with the tray rotation.",
    "7.2b": "Broach seated off axis.",
    "8.1": "Box cut started before the block was pinned.",
    "9.1": "Patellar thickness not measured before the cut.",
    "9.1b": "Button not medialised.",
    "10.1": "Bone surfaces not dried before cementing.",
    "10.2": "Cement applied outside its working time.",
    "10.3": "Cement left posteriorly.",
    "11.1": "Capsule closed with the knee extended.",
    "11.2": "Post-operative alignment not checked on the film.",
}


# ---------------------------------------------------------------------------------------------------------
# Building a run's inputs from a level
# ---------------------------------------------------------------------------------------------------------
def error_fraction(level: float, rng: random.Random, weak: bool) -> float:
    """How far off, as a fraction of the tolerance: ~0.29 at level 0.9 (a pass), ~0.67 at 0.7 (borderline),
    ~1.24 at 0.4 (a fail); a weak spot is 1.7 times worse."""
    base = 1.9 * (1.0 - level) + 0.1
    return base * rng.uniform(0.8, 1.15) * (1.7 if weak else 1.0)


def planned_targets(case: dict, design: str, planned_sizes: Dict[str, int]) -> Dict[str, float]:
    """What the learner's plan sets out to do in theatre. The V1 VR payload carries only the assessment and
    the component sizes/positions; these execution targets travel in the plan payload beside it."""
    ref = case["reference"]["assessment"]
    fixed_flexion = case["patient"].get("fixed_flexion_deg") or 0
    return {
        "tibial_resection_mm": 9.0,                        # off the less-worn plateau
        "tibial_coronal_deg": 0.0,                         # perpendicular to the tibial mechanical axis
        "tibial_slope_deg": 3.0 if design == "CR" else 1.0,
        "distal_femur_mm": 10.0 if fixed_flexion >= 10 else 9.0,  # an extra millimetre for a fixed flexion
        "femoral_valgus_deg": float(ref["AMA_deg"]),       # cut at the anatomical-mechanical angle
        "femoral_size": planned_sizes["femoral_size"],
        "femoral_rotation_deg": 0.0,                       # parallel to the epicondylar axis
        "gap_difference_mm": 0.0,                          # rectangular, equal gaps
        "hka_deg": 0.0,                                    # neutral mechanical alignment (case notes: 0 ± 3)
        "tibial_tray_size": planned_sizes["tibial_size"],
        "tray_rotation_deg": 0.0,                          # medial third of the tubercle
    }


def build_run(case: dict, run: dict, rng: random.Random, criteria: List[dict]) -> Dict[str, Any]:
    level, weak = run["level"], set(run["weak"])
    difficulty = case["difficulty"]

    # 1. The plan: reference plus a planning error the size of the resident's level.
    planned_measurements: Dict[str, float] = {}
    for crit in criteria:
        p = crit["parameter"]
        ref = float(crit["target_value"])
        if crit["unit"] == "size":
            off = 1 if (1.0 - level) * rng.random() > 0.3 else 0
            planned_measurements[p] = int(ref + (off if rng.random() < 0.5 else -off)) if ref > 1 else int(ref + off)
        else:
            frac = error_fraction(level, rng, False) * 0.8
            sign = 1 if rng.random() < 0.5 else -1
            planned_measurements[p] = round_half_up(ref + sign * frac * float(crit["tolerance"]), 1)
    sizes = {"tibial_size": int(planned_measurements["tibial_size"]), "femoral_size": int(planned_measurements["femoral_size"])}
    planned = planned_targets(case, run["design"], sizes)

    # 2. The run: achieved = planned + an execution error, per parameter.
    achieved: Dict[str, float] = {}
    for p in PARAMETERS:
        if p.key == "hka_deg":
            continue
        if p.unit == "":
            frac = error_fraction(level, rng, p.key in weak)
            off = 0 if frac < 0.8 else (1 if frac < 1.6 else 2)
            achieved[p.key] = int(planned[p.key] + (off if rng.random() < 0.6 else -off))
            continue
        tol = tolerance_for(p, difficulty)
        frac = error_fraction(level, rng, p.key in weak)
        if SCENE_BY_ID[p.scene].critical and p.key not in weak:
            # Residents slow down at the cuts that can damage a structure: outside their weak spot they may be
            # borderline there, but a critical step fails only where the run lists it as the weak spot.
            frac = min(frac, 0.97)
        sign = 1 if rng.random() < 0.5 else -1
        achieved[p.key] = round_half_up(planned[p.key] + sign * frac * tol, 1)
    # The limb's final axis follows from the two coronal cuts (varus positive), plus a little soft-tissue play.
    coronal = (achieved["tibial_coronal_deg"] - planned["tibial_coronal_deg"]) + (
        achieved["femoral_valgus_deg"] - planned["femoral_valgus_deg"])
    achieved["hka_deg"] = round_half_up(planned["hka_deg"] + coronal + rng.uniform(-0.5, 0.5) * (1.0 - level), 1)

    # 3. Time and warnings per scene.
    visited = scenes_for_variant(run["design"], run["fixation"])
    durations, warnings, notes = {}, {}, {}
    for sc in visited:
        pace = (0.85 + 1.1 * (1.0 - level)) * rng.uniform(0.92, 1.08)
        durations[sc.scene] = int(min(sc.max_s + 20, round(sc.par_s * pace)))
        if sc.scene in {p.scene for p in PARAMETERS}:
            continue
        r = rng.random()
        count = 2 if r < (1.0 - level) * 0.06 else (1 if r < (1.0 - level) * 0.25 else 0)
        if sc.critical and sc.scene not in weak:
            count = min(count, 1)  # same care at a critical step without measured parameters
        if count:
            warnings[sc.scene] = count
            notes[sc.scene] = WARNING_NOTES.get(sc.scene, "")

    inp = AttemptInput(
        difficulty=difficulty, design=run["design"], fixation=run["fixation"],
        planning_criteria=criteria, planned_measurements=planned_measurements,
        planned=planned, achieved=achieved, durations=durations, warnings=warnings, notes=notes,
    )
    return {"input": inp, "planned_measurements": planned_measurements, "planned": planned, "achieved": achieved, "sizes": sizes}


def criteria_from_library(case: dict) -> List[dict]:
    """The case's planning criteria exactly as seed_case_library.py stores them (used without a database)."""
    ref = case["reference"]["assessment"]
    rows = [
        {"name": n, "parameter": p, "unit": u, "target_value": ref[p], "tolerance": t, "severity_rule": rule}
        for n, p, u, t, rule in CRITERIA
    ]
    rows += [
        {"name": n, "parameter": p, "unit": "size", "target_value": case["sizes"][p], "tolerance": 0.0,
         "severity_rule": {"minor": 1.0, "major": 2.0, "critical": 3.0}}
        for n, p in SIZE_CRITERIA
    ]
    return rows


def plan_payload(case: dict, run: dict, built: dict) -> Dict[str, Any]:
    """The plan as the planner stores it (PlanPayload), with the learner's own planned values."""
    ref = case["reference"]
    pm = built["planned_measurements"]
    assessment = dict(ref["assessment"])
    for key in ("MAD_mm", "mHKA_deg", "MPTA_deg", "LDFA_deg", "PTS_deg"):
        assessment[key] = pm[key]
    tibial = dict(ref["tibial_component"], implant_size=built["sizes"]["tibial_size"])
    femoral = dict(ref["femoral_component"], implant_size=built["sizes"]["femoral_size"])
    pos = lambda c: {k: c["position_2d"][k] for k in ("x_offset_mm", "y_offset_mm", "rotation_deg")}  # noqa: E731
    vr = {
        "patient_id": case["patient"]["patient_id"],
        "knee_side": case["side"].upper(),
        "assessment": {k: assessment[k] for k in ("MAD_mm", "AMA_deg", "mHKA_deg", "MPTA_deg", "LDFA_deg", "PTS_deg")},
        "tibial_component": {"implant_size": tibial["implant_size"], "position_2d": pos(tibial)},
        "femoral_component": {"implant_size": femoral["implant_size"], "position_2d": pos(femoral)},
    }
    t = built["planned"]
    payload = {
        "workflow": "tkr",
        "case_id": case["case_id"],
        "session_config": {"mode": run["mode"], "difficulty": case["difficulty"], "implant_design": run["design"], "fixation": run["fixation"]},
        "v1_assessment": assessment,
        "v1_tibial": tibial,
        "v1_femoral": femoral,
        "alignment_plan": {"target_hka_deg": t["hka_deg"]},
        "resections": {
            "distal_femur_mm": t["distal_femur_mm"],
            "posterior_tibial_slope_deg": t["tibial_slope_deg"],
            "distal_femur_valgus_deg": t["femoral_valgus_deg"],
        },
        "implants": {"design": run["design"], "femoral_size": t["femoral_size"], "tibial_tray_size": t["tibial_tray_size"]},
        "execution_targets": t,
        "sample_data": True,
    }
    return payload, vr


# ---------------------------------------------------------------------------------------------------------
# The whole history, computed (no database)
# ---------------------------------------------------------------------------------------------------------
def compute_history(cases: Dict[str, dict], criteria_for, now: datetime) -> List[Dict[str, Any]]:
    rng = random.Random(SEED)
    out = []
    for ri, res in enumerate(RESIDENTS):
        for ni, run in enumerate(res["runs"]):
            case = cases[run["case"]]
            criteria = criteria_for(case)
            built = build_run(case, run, rng, criteria)
            started = (now - timedelta(days=run["days"])).replace(hour=9 + ri * 2, minute=10 + ni * 3, second=0, microsecond=0)
            entry = {"resident": ri, "n": ni, "run": run, "case": case, "built": built, "started_at": started}
            if run.get("interrupted_at"):
                cut = list(SCENE_BY_ID).index(run["interrupted_at"])
                done = [sc for sc in scenes_for_variant(run["design"], run["fixation"]) if list(SCENE_BY_ID).index(sc.scene) < cut]
                entry["result"] = None
                entry["completed_at"] = None
                entry["partial_s"] = sum(built["input"].durations[sc.scene] for sc in done)
            else:
                result = score_attempt(built["input"])
                entry["result"] = result
                entry["completed_at"] = started + timedelta(seconds=result["duration_s"])
            out.append(entry)

    # Percentile at the moment each report was written: this cohort's results up to then.
    scored = sorted([e for e in out if e["result"]], key=lambda e: e["completed_at"])
    for i, e in enumerate(scored):
        pool = scored[: i + 1]
        e["result"]["percentile"] = percentile_in(
            [p["result"]["overall_score"] for p in pool], e["result"]["overall_score"], len({p["resident"] for p in pool}))
    return out


def verify(history: List[Dict[str, Any]]) -> List[str]:
    """Independent checks on every stored figure. Returns the problems found (none expected)."""
    problems = []
    for e in history:
        r = e["result"]
        if not r:
            continue
        tag = f"{RESIDENTS[e['resident']]['first']} run {e['n'] + 1}"
        cats = sum(c["score"] for c in r["categories"])
        if cats != r["earned_score"]:
            problems.append(f"{tag}: categories add to {cats}, earned {r['earned_score']}")
        if not r["capped"] and r["overall_score"] != cats:
            problems.append(f"{tag}: total {r['overall_score']} is not the category sum {cats}")
        if r["capped"] and r["overall_score"] > 59:
            problems.append(f"{tag}: capped but scored {r['overall_score']}")
        if r["passed"] != ((not r["capped"]) and r["overall_score"] >= r["pass_mark"]):
            problems.append(f"{tag}: verdict does not follow from score and pass mark")
        crit = sum(1 for s in r["scene_results"] if s["critical"] and s["outcome"] == "fail")
        if crit != r["critical_errors"]:
            problems.append(f"{tag}: {crit} failed critical scenes but {r['critical_errors']} critical errors")
        for c in r["categories"]:
            if not 0 <= c["score"] <= c["max"]:
                problems.append(f"{tag}: {c['key']} {c['score']} outside 0..{c['max']}")
        for p in r["parameters"]:
            if p["planned"] is not None and abs(round_half_up(p["achieved"] - p["planned"], 2) - p["deviation"]) > 1e-9:
                problems.append(f"{tag}: {p['key']} deviation wrong")
        again = score_attempt(e["built"]["input"])
        if again["overall_score"] != r["overall_score"]:
            problems.append(f"{tag}: re-scoring the stored inputs gives {again['overall_score']}")
    return problems


def print_history(history: List[Dict[str, Any]]) -> None:
    for ri, res in enumerate(RESIDENTS):
        print(f"\n{res['first']} {res['last']} — {res['story']}")
        print(f"  {'date':10} {'case':28} {'diff':12} {'mode':10} {'score':>5} {'pass':>4} {'result':7} {'crit':>4}  categories (pre/cuts/gaps/trial/impl/pat/exp)")
        for e in [h for h in history if h["resident"] == ri]:
            run, r = e["run"], e["result"]
            date = e["started_at"].strftime("%Y-%m-%d")
            if not r:
                print(f"  {date:10} {run['case']:28} {e['case']['difficulty']:12} {run['mode']:10} {'—':>5} {'':>4} {'stopped':7} {'':>4}  interrupted at scene {run['interrupted_at']}")
                continue
            cats = "/".join(str(c["score"]) for c in r["categories"])
            verdict = ("PASS" if r["passed"] else "FAIL") + (" cap" if r["capped"] else "")
            print(f"  {date:10} {run['case']:28} {e['case']['difficulty']:12} {run['mode']:10} {r['overall_score']:>5} {r['pass_mark']:>4} {verdict:7} {r['critical_errors']:>4}  {cats}")
        scores = [h["result"]["overall_score"] for h in history if h["resident"] == ri and h["result"]]
        if scores:
            passed = sum(1 for h in history if h["resident"] == ri and h["result"] and h["result"]["passed"])
            mean = int(round_half_up(sum(scores) / len(scores)))
            print(f"  mean {mean} · best {max(scores)} · passed {passed} of {len(scores)}")


# ---------------------------------------------------------------------------------------------------------
# What GET /results returns (dry-run bundle for the mock API)
# ---------------------------------------------------------------------------------------------------------
def result_json(r: Dict[str, Any], assessed_at: datetime) -> Dict[str, Any]:
    return {
        "overall_score": r["overall_score"], "max_score": r["max_score"], "pass_mark": r["pass_mark"],
        "passed": r["passed"], "critical_errors": r["critical_errors"], "capped": r["capped"],
        "percentile": r.get("percentile"), "categories": r["categories"], "parameters": r["parameters"],
        "scene_results": r["scene_results"], "feedback": r["feedback"],
        "reason_codes": r["payload"]["reason_codes"], "scoring_version": r["scoring_version"],
        "assessed_at": assessed_at.isoformat(),
    }


def dry_bundle(history: List[Dict[str, Any]], cohort_id: str, owner_id: str) -> Dict[str, Any]:
    ids = lambda *parts: str(uuid.uuid5(NAMESPACE, "/".join(map(str, parts))))  # noqa: E731
    learners, attempts, last = [], [], {}
    for e in history:
        rid = ids("resident", e["resident"])
        run, case, r = e["run"], e["case"], e["result"]
        attempts.append({
            "id": ids("attempt", e["resident"], e["n"]), "resident_id": rid,
            "session_id": ids("session", e["resident"], e["n"]) if run.get("session") else None,
            "plan_id": ids("plan", e["resident"], e["n"]), "case_id": case["case_id"], "case_title": case["title"],
            "procedure_name": "Total Knee Replacement", "mode": run["mode"], "difficulty": case["difficulty"],
            "implant_design": run["design"], "fixation": run["fixation"],
            "status": "assessed" if r else "cancelled", "current_scene": None if r else run["interrupted_at"],
            "started_at": e["started_at"].isoformat(),
            "completed_at": e["completed_at"].isoformat() if e["completed_at"] else None,
            "result": result_json(r, e["completed_at"] + timedelta(seconds=14)) if r else None,
        })
        at = (e["completed_at"] or e["started_at"]).isoformat()
        last[rid] = max(last.get(rid, ""), at)
    for ri, res in enumerate(RESIDENTS):
        rid = ids("resident", ri)
        learners.append({"id": rid, "display_name": f"{res['first']} {res['last']}", "role": "resident",
                         "cohort_id": cohort_id, "cohort_name": DEFAULT_COHORT, "last_active_at": last.get(rid)})
    return {
        "learners": learners,
        "cohorts": [{"id": cohort_id, "name": DEFAULT_COHORT, "owner_id": owner_id,
                     "created_at": (datetime.now(timezone.utc) - timedelta(days=60)).isoformat()}],
        "attempts": sorted(attempts, key=lambda a: a["started_at"], reverse=True),
    }


# ---------------------------------------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------------------------------------
def criteria_from_db(cur, case: dict) -> List[dict]:
    cur.execute(
        """SELECT name, parameter, unit, target_value, tolerance_max, severity_rule
           FROM assessment_criteria WHERE case_version_id = %s ORDER BY name""",
        (case["version_id"],),
    )
    rows = [
        {"name": r["name"], "parameter": r["parameter"], "unit": r["unit"], "target_value": float(r["target_value"]),
         "tolerance": float(r["tolerance_max"] or 0), "severity_rule": r["severity_rule"] or {}}
        for r in cur.fetchall()
    ]
    wanted = {c[1] for c in CRITERIA} | {c[1] for c in SIZE_CRITERIA}
    if {r["parameter"] for r in rows} != wanted:
        raise SystemExit(f"Case {case['title']}: its stored criteria are not the library's; re-run seed_case_library.py first.")
    order = [c[1] for c in CRITERIA] + [c[1] for c in SIZE_CRITERIA]
    return sorted(rows, key=lambda r: order.index(r["parameter"]))


def write_manifest(data: dict) -> None:
    MANIFEST.write_text(json.dumps(data, indent=2, default=str), encoding="utf-8")


def seed(args, cases: Dict[str, dict]) -> None:
    from db.session import get_db_conn, get_service_client
    from services.cohorts_service import _get_or_create_default_program, enroll_new_learner
    from services.results_service import tables_exist

    if MANIFEST.exists():
        raise SystemExit(f"{MANIFEST.name} exists: sample results were already seeded. Run with --wipe first.")

    conn = get_db_conn()
    cur = conn.cursor()
    if not tables_exist(cur):
        raise SystemExit("Migration 013 is not applied (no attempts / assessment_results tables). Apply it first.")
    cur.execute("SELECT id, institution_id, role FROM users WHERE lower(email) = lower(%s)", (args.instructor_email,))
    instructor = cur.fetchone()
    if not instructor:
        raise SystemExit(f"No account with the email {args.instructor_email}. "
                         "Run with --list-instructors to see the instructor emails.")
    if instructor["role"] != "instructor":
        raise SystemExit(f"{args.instructor_email} is a {instructor['role']} account, not an instructor. "
                         "Run with --list-instructors to see the instructor emails.")
    owner_id, institution_id = str(instructor["id"]), str(instructor["institution_id"])

    for case in cases.values():
        cur.execute("SELECT published_version_id FROM cases WHERE id = %s", (case["case_id"],))
        row = cur.fetchone()
        if not row or str(row["published_version_id"]) != case["version_id"]:
            raise SystemExit(f"Case {case['title']} is not in the database as published; run seed_case_library.py first.")
    criteria_cache = {key: criteria_from_db(cur, case) for key, case in cases.items()}

    cur.execute("SELECT id FROM cohorts WHERE owner_id = %s AND name = %s", (owner_id, args.cohort))
    row = cur.fetchone()
    manifest: Dict[str, Any] = {"created_at": datetime.now(timezone.utc).isoformat(), "instructor_id": owner_id,
                                "cohort_created": False, "users": [], "sessions": [], "plans": [], "attempts": [],
                                "case_assignments": []}
    if row:
        cohort_id = str(row["id"])
    else:
        program_id = _get_or_create_default_program(institution_id)
        cur.execute("INSERT INTO cohorts (program_id, name, owner_id) VALUES (%s, %s, %s) RETURNING id", (program_id, args.cohort, owner_id))
        cohort_id = str(cur.fetchone()["id"])
        conn.commit()
        manifest["cohort_created"] = True
    manifest["cohort_id"] = cohort_id
    write_manifest(manifest)

    # Accounts first (each commits on its own, as the Add learner button does), then the history in one transaction.
    client = get_service_client()
    accounts = []
    for res in RESIDENTS:
        created = enroll_new_learner(cohort_id, res["first"], res["last"], "resident", institution_id, owner_id)
        password = created.temporary_password
        if args.password:
            client.auth.admin.update_user_by_id(created.id, {"password": args.password})
            password = args.password
        accounts.append({"id": created.id, "name": created.display_name, "learner_id": created.learner_id, "password": password})
        manifest["users"].append({"id": created.id, "name": created.display_name, "learner_id": created.learner_id})
        write_manifest(manifest)

    now = datetime.now(timezone.utc)
    history = compute_history(cases, lambda c: criteria_cache[c["key"]], now)
    problems = verify(history)
    if problems:
        raise SystemExit("Refusing to write: " + "; ".join(problems))

    try:
        for case in cases.values():
            cur.execute(
                """INSERT INTO cohort_case_assignments (cohort_id, case_id, required) VALUES (%s, %s, false)
                   ON CONFLICT (cohort_id, case_id) DO NOTHING RETURNING id""",
                (cohort_id, case["case_id"]),
            )
            got = cur.fetchone()
            if got:
                manifest["case_assignments"].append(str(got["id"]))

        for e in history:
            user = accounts[e["resident"]]
            run, case, built, r = e["run"], e["case"], e["built"], e["result"]
            payload, vr = plan_payload(case, run, built)
            started = e["started_at"]
            locked_at = started - timedelta(hours=20)
            version_id = str(uuid.uuid4())
            snapshot = {"payload": payload, "locked_at": locked_at.isoformat(), "case_version_id": case["version_id"]}
            cur.execute(
                """INSERT INTO plans (owner_id, case_id, case_version_id, workflow, session_config, payload, step_timings,
                                      preset_name, status, locked_version_id, locked_at, locked_by, locked_snapshot,
                                      vr_payload, created_at, updated_at)
                   VALUES (%s, %s, %s, 'tkr', %s, %s, %s, %s, 'locked', %s, %s, %s, %s, %s, %s, %s) RETURNING id""",
                (user["id"], case["case_id"], case["version_id"], json.dumps(payload["session_config"]), json.dumps(payload),
                 json.dumps({}), "sample-results", version_id, locked_at, user["id"], json.dumps(snapshot), json.dumps(vr),
                 locked_at - timedelta(hours=2), locked_at),
            )
            plan_id = str(cur.fetchone()["id"])
            manifest["plans"].append(plan_id)

            session_id = None
            if run.get("session"):
                cur.execute(
                    """INSERT INTO sessions (cohort_id, name, scheduled_at, duration, description, case_id, instructor_id, mode)
                       VALUES (%s, %s, %s, 60, %s, %s, %s, %s) RETURNING id""",
                    (cohort_id, f"{'Assessment' if run['mode'] == 'assessment' else 'Training'}: {case['title']}",
                     started - timedelta(minutes=5), "Sample results: a scheduled run with a stored report.",
                     case["case_id"], owner_id, run["mode"]),
                )
                session_id = str(cur.fetchone()["id"])
                manifest["sessions"].append(session_id)
                cur.execute(
                    """INSERT INTO session_residents (session_id, resident_id, status, joined_at, completed_at)
                       VALUES (%s, %s, %s, %s, %s)""",
                    (session_id, user["id"], "completed" if r else "cancelled", started - timedelta(minutes=5), e["completed_at"]),
                )

            cur.execute(
                """INSERT INTO attempts (resident_id, session_id, plan_id, plan_version_id, mode, difficulty, implant_design,
                                         fixation, status, current_scene, started_at, completed_at, created_at, updated_at)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id""",
                (user["id"], session_id, plan_id, version_id, run["mode"], case["difficulty"], run["design"], run["fixation"],
                 "assessed" if r else "cancelled", None if r else run["interrupted_at"], started, e["completed_at"],
                 started, e["completed_at"] or started + timedelta(seconds=e.get("partial_s", 0))),
            )
            attempt_id = str(cur.fetchone()["id"])
            manifest["attempts"].append(attempt_id)

            if r:
                payload_out = dict(r["payload"], inputs={
                    "planned_measurements": built["planned_measurements"], "planned": built["planned"],
                    "achieved": built["achieved"], "durations": built["input"].durations,
                    "warnings": built["input"].warnings, "notes": built["input"].notes,
                    "level": run["level"], "weak": run["weak"], "sample_data": True,
                })
                cur.execute(
                    """INSERT INTO assessment_results (attempt_id, overall_score, max_score, pass_mark, passed, critical_errors,
                                                      capped, percentile, categories, parameters, scene_results, feedback,
                                                      payload, scoring_version, assessed_at)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                    (attempt_id, r["overall_score"], r["max_score"], r["pass_mark"], r["passed"], r["critical_errors"],
                     r["capped"], r.get("percentile"), json.dumps(r["categories"]), json.dumps(r["parameters"]),
                     json.dumps(r["scene_results"]), json.dumps(r["feedback"]), json.dumps(payload_out),
                     r["scoring_version"], e["completed_at"] + timedelta(seconds=14)),
                )
        conn.commit()
    except Exception:
        conn.rollback()
        write_manifest(manifest)
        raise
    finally:
        conn.close()

    write_manifest(dict(manifest, accounts=accounts))
    print_history(history)
    print(f"\nSeeded {len(history)} runs into the cohort '{args.cohort}'. Sign in with a Learner ID and password:")
    for a in accounts:
        print(f"  {a['name']:14} {a['learner_id']}  password: {a['password']}")
    print(f"\nManifest: {MANIFEST} (git-ignored). Remove everything with --wipe.")


def wipe() -> None:
    from db.session import get_db_conn, get_service_client

    if not MANIFEST.exists():
        raise SystemExit("No manifest: nothing seeded by this script to remove.")
    m = json.loads(MANIFEST.read_text(encoding="utf-8"))
    conn = get_db_conn()
    cur = conn.cursor()
    try:
        if m.get("attempts"):
            cur.execute("DELETE FROM attempts WHERE id = ANY(%s::uuid[])", (m["attempts"],))  # results cascade
        if m.get("plans"):
            cur.execute("DELETE FROM plans WHERE id = ANY(%s::uuid[]) AND preset_name = 'sample-results'", (m["plans"],))
        if m.get("sessions"):
            cur.execute("DELETE FROM sessions WHERE id = ANY(%s::uuid[])", (m["sessions"],))  # roster cascades
        if m.get("case_assignments"):
            cur.execute("DELETE FROM cohort_case_assignments WHERE id = ANY(%s::uuid[])", (m["case_assignments"],))
        user_ids = [u["id"] for u in m.get("users", [])]
        if user_ids:
            cur.execute("DELETE FROM users WHERE id = ANY(%s::uuid[])", (user_ids,))  # memberships cascade
        if m.get("cohort_created") and m.get("cohort_id"):
            cur.execute("DELETE FROM cohorts WHERE id = %s", (m["cohort_id"],))
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
    client = get_service_client()
    for uid in user_ids:
        try:
            client.auth.admin.delete_user(uid)
        except Exception as exc:  # the database rows are gone either way; say so rather than stop
            print(f"  could not delete sign-in account {uid}: {exc}")
    MANIFEST.unlink()
    print(f"Removed {len(m.get('attempts', []))} runs, {len(m.get('sessions', []))} sessions and {len(user_ids)} accounts"
          + (" and the sample cohort." if m.get("cohort_created") else "."))


def main() -> None:
    # The tables print dashes and degree signs; a Windows console defaults to a narrower code page.
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8")
        except (AttributeError, ValueError):
            pass
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--dry-run", action="store_true", help="compute and print everything; touch no database")
    ap.add_argument("--bundle-out", help="with --dry-run: write the GET /results response to this file")
    ap.add_argument("--instructor-email", help="the instructor who owns the cohort the residents join")
    ap.add_argument("--cohort", default=DEFAULT_COHORT, help=f"cohort name (created if missing; default '{DEFAULT_COHORT}')")
    ap.add_argument("--password", help="give all three accounts this password instead of generated ones")
    ap.add_argument("--wipe", action="store_true", help="remove everything a previous run created (from the manifest)")
    ap.add_argument("--list-instructors", action="store_true", help="print the instructor accounts' emails (read-only)")
    args = ap.parse_args()

    if args.list_instructors:
        from db.session import get_db_conn
        cur = get_db_conn().cursor()
        cur.execute("SELECT email, first_name, last_name, status FROM users "
                    "WHERE role = 'instructor' ORDER BY email")
        rows = cur.fetchall()
        if not rows:
            print("No instructor accounts in this database.")
        for r in rows:
            print(f"{r['email']}  ({r['first_name']} {r['last_name']}, {r['status']})")
        return

    cases = {c["key"]: c for c in json.loads(LIBRARY.read_text(encoding="utf-8"))["cases"]}
    if args.wipe:
        wipe()
        return
    if args.dry_run:
        history = compute_history(cases, criteria_from_library, datetime.now(timezone.utc))
        print_history(history)
        problems = verify(history)
        print("\nChecks:", "all figures consistent" if not problems else "\n  " + "\n  ".join(problems))
        print("Scoring:", SCORING_VERSION)
        if args.bundle_out:
            bundle = dry_bundle(history, str(uuid.uuid5(NAMESPACE, "cohort")), args.instructor_email or "instructor")
            Path(args.bundle_out).write_text(json.dumps(bundle, indent=1), encoding="utf-8")
            print("Bundle written to", args.bundle_out)
        return
    if not args.instructor_email:
        ap.error("--instructor-email is required (or use --dry-run)")
    if args.password and len(args.password) < 8:
        ap.error("--password must be at least 8 characters")
    seed(args, cases)


if __name__ == "__main__":
    main()
