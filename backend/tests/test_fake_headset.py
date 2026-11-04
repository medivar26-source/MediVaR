"""The fake headset builds reports the backend accepts: a full one scores, a headset-plan-only one waits."""
import importlib.util
import random
import unittest
from pathlib import Path

from core.calculations.session_scoring import score_attempt
from core.connect.contract import validate_run_report
from core.connect.report_bridge import to_attempt_input
from tests.test_connect_core import CONFIG, CRITERIA, PLANNED_MEASUREMENTS, plan

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "fake_headset.py"
spec = importlib.util.spec_from_file_location("fake_headset", SCRIPT)
fake = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fake)


def bridge(report, cp, **over):
    return to_attempt_input(report, case_plan=cp, session_config=CONFIG,
                            planned_measurements=PLANNED_MEASUREMENTS, planning_criteria=CRITERIA, **over)


class TestFakeHeadset(unittest.TestCase):
    def build(self, **kw):
        cp = plan()
        args = dict(assignment_id="a-1", device_id="fake-quest-001", keys="all", outcome="Completed", level=0.85,
                    rng=random.Random(7))
        args.update(kw)
        return cp, fake.build_report(cp, **args)

    def test_reports_are_valid_contract_json(self):
        for keys in ("all", "headset"):
            for outcome in ("Completed", "Abandoned"):
                _, r = self.build(keys=keys, outcome=outcome)
                self.assertEqual(validate_run_report(r), [], (keys, outcome))

    def test_a_full_report_scores(self):
        cp, r = self.build()
        res = bridge(r, cp)
        self.assertEqual(res.missing, [])
        self.assertIn("overall_score", score_attempt(res.attempt_input))

    def test_a_perfect_run_passes_and_a_poor_run_scores_lower(self):
        cp, good = self.build(level=1.0)
        _, poor = self.build(level=0.3, rng=random.Random(3))
        g = score_attempt(bridge(good, cp).attempt_input)
        p = score_attempt(bridge(poor, cp).attempt_input)
        self.assertTrue(g["passed"])
        self.assertLess(p["overall_score"], g["overall_score"])

    def test_a_headset_plan_only_report_waits_for_inputs(self):
        # `--keys headset` sends neither scene ids nor the requested keys: with no scene timed there is
        # nothing to score, in partial mode as in strict.
        cp, r = self.build(keys="headset")
        res = bridge(r, cp)
        self.assertIsNone(res.attempt_input)
        self.assertTrue(any("no time recorded" in m for m in res.missing))
        strict = bridge(r, cp, partial=False)
        self.assertTrue(any("P5.hkaDeg" in m for m in strict.missing))


if __name__ == "__main__":
    unittest.main()
