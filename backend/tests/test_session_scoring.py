"""
The session scorer: every rule checked by hand-worked numbers, and the scene table checked against the
dashboard's own copy so the two can never disagree about which scenes a run visits.
"""
import re
import unittest
from pathlib import Path

from core.calculations.session_scoring import (
    CATEGORIES,
    CRITICAL_ERROR_CAP,
    PARAMETERS,
    SCENES,
    AttemptInput,
    percentile_in,
    round_half_up,
    scenes_for_variant,
    score_attempt,
    timing_credit,
    tolerance_for,
    verdict_for,
    PARAMETER_BY_KEY,
)

SEED_TS = Path(__file__).resolve().parents[2] / "dashboard" / "src" / "lib" / "seed.ts"

CRITERIA = [
    {"name": "MAD", "parameter": "MAD_mm", "unit": "mm", "target_value": 27.7, "tolerance": 2.0,
     "severity_rule": {"minor": 2.0, "major": 4.0, "critical": 6.0}},
    {"name": "mHKA", "parameter": "mHKA_deg", "unit": "°", "target_value": 8.0, "tolerance": 1.5,
     "severity_rule": {"minor": 1.5, "major": 3.0, "critical": 5.0}},
    {"name": "Tibial size", "parameter": "tibial_size", "unit": "size", "target_value": 3, "tolerance": 0.0,
     "severity_rule": {"minor": 1.0, "major": 2.0, "critical": 3.0}},
]
PLANNED_EXACT = {"MAD_mm": 27.7, "mHKA_deg": 8.0, "tibial_size": 3}

PLANNED = {
    "tibial_resection_mm": 8.0, "tibial_coronal_deg": 0.0, "tibial_slope_deg": 3.0,
    "distal_femur_mm": 9.0, "femoral_valgus_deg": 6.0, "femoral_size": 3, "femoral_rotation_deg": 3.0,
    "gap_difference_mm": 0.0, "hka_deg": 0.0, "tibial_tray_size": 3, "tray_rotation_deg": 0.0,
}


def perfect_input(design="CR", fixation="cemented", difficulty="intermediate") -> AttemptInput:
    visited = scenes_for_variant(design, fixation)
    return AttemptInput(
        difficulty=difficulty, design=design, fixation=fixation,
        planning_criteria=CRITERIA, planned_measurements=dict(PLANNED_EXACT),
        planned=dict(PLANNED), achieved=dict(PLANNED),
        durations={sc.scene: sc.par_s for sc in visited},
    )


class TestRules(unittest.TestCase):
    def test_categories_total_100(self):
        self.assertEqual(sum(c[3] for c in CATEGORIES), 100)

    def test_verdict_thresholds(self):
        self.assertEqual(verdict_for(1.0, 2.0), "pass")        # exactly half the tolerance
        self.assertEqual(verdict_for(1.01, 2.0), "borderline")
        self.assertEqual(verdict_for(2.0, 2.0), "borderline")  # exactly the tolerance
        self.assertEqual(verdict_for(2.01, 2.0), "fail")

    def test_size_verdicts(self):
        tol = tolerance_for(PARAMETER_BY_KEY["femoral_size"], "expert")
        self.assertEqual(tol, 1.0)  # sizes are whole numbers; difficulty does not scale them
        self.assertEqual(verdict_for(0, tol), "pass")
        self.assertEqual(verdict_for(1, tol), "borderline")
        self.assertEqual(verdict_for(2, tol), "fail")

    def test_tolerance_band(self):
        p = PARAMETER_BY_KEY["tibial_slope_deg"]
        self.assertEqual(tolerance_for(p, "beginner"), 3.0)
        self.assertEqual(tolerance_for(p, "intermediate"), 2.0)
        self.assertEqual(tolerance_for(p, "expert"), 1.4)

    def test_timing_credit(self):
        self.assertEqual(timing_credit(60, 60, 150), 1.0)
        self.assertAlmostEqual(timing_credit(105, 60, 150), 0.5)
        self.assertEqual(timing_credit(150, 60, 150), 0.0)
        self.assertEqual(timing_credit(400, 60, 150), 0.0)

    def test_round_half_up(self):
        self.assertEqual(round_half_up(2.5), 3)   # Python's round() would give 2
        self.assertEqual(round_half_up(3.5), 4)
        self.assertEqual(round_half_up(1.25, 1), 1.3)

    def test_percentile(self):
        self.assertIsNone(percentile_in([70, 80], 80, distinct_peers=2))
        self.assertEqual(percentile_in([50, 60, 70, 80], 70, distinct_peers=3), 75)


class TestScoring(unittest.TestCase):
    def test_perfect_run_scores_100(self):
        r = score_attempt(perfect_input())
        self.assertEqual(r["overall_score"], 100)
        self.assertTrue(r["passed"])
        self.assertEqual(r["critical_errors"], 0)
        self.assertEqual(r["feedback"], [])
        for c in r["categories"]:
            self.assertEqual(c["score"], c["max"], c["key"])

    def test_every_variant_can_reach_full_marks(self):
        for design in ("CR", "PS"):
            for fixation in ("cemented", "cementless"):
                self.assertEqual(score_attempt(perfect_input(design, fixation))["overall_score"], 100)

    def test_categories_sum_to_total(self):
        inp = perfect_input()
        inp.achieved["tibial_slope_deg"] = 4.5   # +1.5 against tol 2 -> borderline
        inp.achieved["gap_difference_mm"] = 3.0  # fail
        inp.durations["6.1"] = 150               # half the time credit
        inp.warnings["2.3"] = 1
        r = score_attempt(inp)
        self.assertEqual(r["overall_score"], sum(c["score"] for c in r["categories"]))

    def test_hand_worked_gap_scene(self):
        # Gap assessment has one scene (6.1) worth all 15 marks. A fail run at par:
        # 15 * (0.9 * 0 + 0.1 * 1) = 1.5 -> rounds half-up to 2.
        inp = perfect_input()
        inp.achieved["gap_difference_mm"] = 2.5
        r = score_attempt(inp)
        gap = next(c for c in r["categories"] if c["key"] == "gap_assessment")
        self.assertEqual(gap["raw"], 1.5)
        self.assertEqual(gap["score"], 2)
        self.assertEqual(r["overall_score"], 87)
        row = next(s for s in r["scene_results"] if s["scene"] == "6.1")
        self.assertEqual(row["outcome"], "fail")
        self.assertAlmostEqual(row["points_lost"], 13.5)

    def test_hand_worked_planning(self):
        # MAD off by 3 mm against tol 2 (minor 2, major 4) -> MINOR 75; mHKA exact 100; size off by 1 -> MINOR 75.
        inp = perfect_input()
        inp.planned_measurements = {"MAD_mm": 30.7, "mHKA_deg": 8.0, "tibial_size": 4}
        r = score_attempt(inp)
        pre = next(c for c in r["categories"] if c["key"] == "preop_planning")
        # mean (75 + 100 + 75) / 3 = 83.33 -> 20 * 0.8333 = 16.67 -> 17
        self.assertEqual(pre["score"], 17)
        self.assertEqual(r["overall_score"], 97)

    def test_beginner_band_widens_planning_tolerance(self):
        inp = perfect_input(difficulty="beginner")
        inp.planned_measurements = {"MAD_mm": 30.7, "mHKA_deg": 8.0, "tibial_size": 3}  # 3 mm within 2*1.5
        r = score_attempt(inp)
        self.assertEqual(next(c for c in r["categories"] if c["key"] == "preop_planning")["score"], 20)

    def test_three_critical_errors_cap_and_fail(self):
        inp = perfect_input()
        inp.achieved["tibial_slope_deg"] = 9.0       # 4.2 fails (critical)
        inp.achieved["femoral_valgus_deg"] = 10.0    # 5.2 fails (critical)
        inp.achieved["femoral_rotation_deg"] = 9.0   # 5.4 fails (critical)
        r = score_attempt(inp)
        self.assertEqual(r["critical_errors"], 3)
        self.assertTrue(r["capped"])
        self.assertFalse(r["passed"])
        self.assertLessEqual(r["overall_score"], CRITICAL_ERROR_CAP)
        self.assertIn("CRITICAL_ERROR_CAP", r["payload"]["reason_codes"])

    def test_two_critical_errors_do_not_cap(self):
        inp = perfect_input()
        inp.achieved["tibial_slope_deg"] = 9.0
        inp.achieved["femoral_valgus_deg"] = 10.0
        r = score_attempt(inp)
        self.assertEqual(r["critical_errors"], 2)
        self.assertFalse(r["capped"])
        self.assertEqual(r["overall_score"], r["earned_score"])

    def test_pass_mark_by_difficulty(self):
        inp = perfect_input(difficulty="expert")
        r = score_attempt(inp)
        self.assertEqual(r["pass_mark"], 80)

    def test_incomplete_run_is_refused(self):
        inp = perfect_input()
        del inp.durations["6.1"]
        with self.assertRaises(ValueError):
            score_attempt(inp)

    def test_missing_planned_measurement_is_not_zero(self):
        inp = perfect_input()
        inp.planned_measurements = {"MAD_mm": 27.7, "tibial_size": 3}  # mHKA unanswered
        r = score_attempt(inp)
        crit = next(c for c in r["payload"]["planning"]["criteria"] if c["parameter"] == "mHKA_deg")
        self.assertEqual(crit["severity"], "NOT_ANSWERED")
        self.assertIsNone(crit["planned"])

    def test_feedback_names_the_deviation(self):
        inp = perfect_input()
        inp.achieved["tibial_slope_deg"] = 6.2
        r = score_attempt(inp)
        line = next(f for f in r["feedback"] if f["scene"] == "4.2")
        self.assertIn("6.2° against 3.0° planned (+3.2°, tolerance ±2.0°)", line["text"])
        self.assertEqual(line["severity"], "fail")
        self.assertTrue(line["critical"])


class TestMatchesDashboard(unittest.TestCase):
    """The scene catalogue is duplicated in dashboard/src/lib/seed.ts; the two must agree."""

    def test_scene_table_matches_seed_ts(self):
        if not SEED_TS.exists():
            self.skipTest("dashboard not present")
        text = SEED_TS.read_text(encoding="utf-8")
        times = dict(
            (m.group(1), (int(m.group(2)), int(m.group(3))))
            for m in re.finditer(r'"([\d.]+b?)":\s*\[(\d+),\s*(\d+)\]', text)
        )
        seeds = re.findall(r'scene: "([\d.]+b?)", part: "(P\d+)", name: "([^"]+)"', text)
        self.assertEqual(len(seeds), len(SCENES))
        for (scene, part, name), sc in zip(seeds, SCENES):
            self.assertEqual((scene, part, name), (sc.scene, sc.part, sc.name))
            self.assertEqual(times[scene], (sc.par_s, sc.max_s), scene)

    def test_every_parameter_scene_exists(self):
        ids = {sc.scene for sc in SCENES}
        for p in PARAMETERS:
            self.assertIn(p.scene, ids)


if __name__ == "__main__":
    unittest.main()
