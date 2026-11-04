"""
Dashboard <-> headset connectivity, the pure rules: pairing, the CasePlan built from a locked plan, the
structural check of a run report, and the bridge from a report to the scorer. No database, no network.
"""
import importlib.util
import sys
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

from core.calculations.session_scoring import PARAMETERS, score_attempt, scenes_for_variant, tolerance_for, PARAMETER_BY_KEY
from core.connect import pairing
from core.connect.case_plan import PlanNotSendable, build_case_plan, deformity_from, execution_targets_from
from core.connect.contract import (
    KEY_FOR_PARAMETER,
    PLAN_KEYS,
    plan_values_by_key,
    validate_run_report,
)
from core.connect.report_bridge import achieved_values, to_attempt_input

NOW = datetime(2026, 11, 3, 10, 0, tzinfo=timezone.utc)

VR = {
    "patient_id": "SYN-TKA-101",
    "knee_side": "LEFT",
    "assessment": {"MAD_mm": 25.0, "AMA_deg": 6.5, "mHKA_deg": 8.0, "MPTA_deg": 85.0, "LDFA_deg": 88.0, "PTS_deg": 7.0},
    "tibial_component": {"implant_size": 4, "position_2d": {"x_offset_mm": 0.0, "y_offset_mm": 0.0, "rotation_deg": 0.0}},
    "femoral_component": {"implant_size": 5, "position_2d": {"x_offset_mm": 0.0, "y_offset_mm": 0.0, "rotation_deg": 0.0}},
}
CONFIG = {"mode": "training", "difficulty": "intermediate", "implant_design": "CR", "fixation": "cemented"}
TRAINEE = {"id": "u-1", "display_name": "Meera Pillai", "cohort": "Sample results cohort", "institution": "Demo"}


def plan(**over):
    args = dict(
        assignment_id="a-1", case_id="c-1", issued_at_utc="2026-11-03T10:00:00Z", vr_payload=VR, session_config=CONFIG,
        trainee=TRAINEE, instructor_name="Jane Doe", deformity="Varus", deformity_deg=8.0, summary="Severe varus",
    )
    args.update(over)
    return build_case_plan(**args)


class TestPairing(unittest.TestCase):
    def test_codes_are_six_digits_and_keep_leading_zeros(self):
        for _ in range(200):
            code = pairing.generate_code()
            self.assertEqual(len(code), 6)
            self.assertTrue(code.isdigit())

    def test_a_typed_code_is_reduced_to_digits(self):
        self.assertEqual(pairing.normalise_code(" 004 217 "), "004217")
        self.assertEqual(pairing.normalise_code("004-217"), "004217")
        self.assertIsNone(pairing.normalise_code("12345"))
        self.assertIsNone(pairing.normalise_code("1234567"))
        self.assertIsNone(pairing.normalise_code(""))

    def test_hashes_are_stable_and_distinct(self):
        self.assertEqual(pairing.hash_code("004217"), pairing.hash_code("004217"))
        self.assertNotEqual(pairing.hash_code("004217"), pairing.hash_code("004218"))
        self.assertNotEqual(pairing.hash_code("004217"), pairing.hash_token("004217"))

    def test_tokens_are_long_and_unique(self):
        a, b = pairing.new_token(), pairing.new_token()
        self.assertNotEqual(a, b)
        self.assertGreaterEqual(len(a), 40)

    def test_redeem_decisions(self):
        live = {"status": "pending", "code_expires_at": NOW + timedelta(minutes=5), "code_consumed_at": None}
        self.assertTrue(pairing.decide_redeem(live, NOW).ok)
        d = pairing.decide_redeem(None, NOW)
        self.assertEqual((d.ok, d.status), (False, 404))
        d = pairing.decide_redeem(dict(live, code_expires_at=NOW - timedelta(seconds=1)), NOW)
        self.assertEqual((d.ok, d.status), (False, 410))
        self.assertIn("expired", d.reason)
        d = pairing.decide_redeem(dict(live, code_consumed_at=NOW), NOW)
        self.assertEqual((d.ok, d.status), (False, 410))
        self.assertIn("already used", d.reason)
        d = pairing.decide_redeem(dict(live, status="cancelled"), NOW)
        self.assertEqual((d.ok, d.status), (False, 410))
        # Exactly at the expiry moment the code is already dead.
        self.assertFalse(pairing.decide_redeem(dict(live, code_expires_at=NOW), NOW).ok)

    def test_throttle_blocks_after_the_limit_and_recovers(self):
        t = [0.0]
        th = pairing.FailureThrottle(limit=3, window_s=100, clock=lambda: t[0])
        for _ in range(3):
            self.assertEqual(th.retry_after("dev"), 0)
            th.record_failure("dev")
        self.assertGreater(th.retry_after("dev"), 0)
        self.assertEqual(th.retry_after("other"), 0)          # another client is unaffected
        t[0] = 101.0
        self.assertEqual(th.retry_after("dev"), 0)            # the window moved on
        th.record_failure("dev"); th.reset("dev")
        self.assertEqual(th.retry_after("dev"), 0)


class TestCasePlan(unittest.TestCase):
    def test_every_plan_key_is_present_once_with_the_scorers_own_tolerance(self):
        p = plan()
        keys = [v["key"] for v in p["values"]]
        self.assertEqual(keys, [k.key for k in PLAN_KEYS])
        self.assertEqual(len(set(keys)), len(keys))
        by = plan_values_by_key(p)
        # Intermediate: band 1.0, so the scorer's base tolerances come through unchanged.
        self.assertEqual(by["P2.tibialDepthMm"]["tolerance"], 2.0)
        self.assertEqual(by["P3.femoralValgusDeg"]["tolerance"], 1.5)
        self.assertEqual(by["P3.femoralSize"]["tolerance"], 1.0)

    def test_tolerances_follow_difficulty_but_sizes_do_not(self):
        expert = plan(session_config=dict(CONFIG, difficulty="expert"))
        by = plan_values_by_key(expert)
        self.assertEqual(by["P2.tibialDepthMm"]["tolerance"], tolerance_for(PARAMETER_BY_KEY["tibial_resection_mm"], "expert"))
        self.assertLess(by["P2.tibialDepthMm"]["tolerance"], 2.0)
        self.assertEqual(by["P3.femoralSize"]["tolerance"], 1.0)

    def test_values_come_from_the_locked_plan(self):
        by = plan_values_by_key(plan())
        self.assertEqual(by["P3.femoralValgusDeg"]["value"], 6.5)       # the plan's AMA
        self.assertEqual(by["P3.femoralSize"]["value"], 5)
        self.assertEqual(by["P4.tibialTraySize"]["value"], 4)
        self.assertEqual(by["P2.tibialSlopeDeg"]["value"], 3.0)         # CR
        ps = plan_values_by_key(plan(session_config=dict(CONFIG, implant_design="PS")))
        self.assertEqual(ps["P2.tibialSlopeDeg"]["value"], 1.0)
        self.assertEqual(by["P1.flexionDeg"]["value"], 90.0)

    def test_the_plans_own_execution_targets_win(self):
        by = plan_values_by_key(plan(execution_targets={"tibial_slope_deg": 5.0, "femoral_size": 6, "ignored": 1}))
        self.assertEqual(by["P2.tibialSlopeDeg"]["value"], 5.0)
        self.assertEqual(by["P3.femoralSize"]["value"], 6)

    def test_a_fixed_flexion_adds_a_millimetre_to_the_distal_femur(self):
        self.assertEqual(execution_targets_from(VR, "CR", 12.0)["distal_femur_mm"], 10.0)
        self.assertEqual(execution_targets_from(VR, "CR", 0.0)["distal_femur_mm"], 9.0)

    def test_same_rules_as_the_seed_that_the_scorer_was_verified_with(self):
        scripts = Path(__file__).resolve().parents[1] / "scripts"
        sys.path.insert(0, str(scripts))
        try:
            spec = importlib.util.spec_from_file_location("seed_sample_results", scripts / "seed_sample_results.py")
            seed = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(seed)
        finally:
            sys.path.remove(str(scripts))
        case = {"reference": {"assessment": VR["assessment"]}, "patient": {"fixed_flexion_deg": 12}}
        for design in ("CR", "PS"):
            theirs = seed.planned_targets(case, design, {"femoral_size": 5, "tibial_size": 4})
            ours = execution_targets_from(VR, design, 12)
            self.assertEqual(theirs, ours, design)

    def test_what_must_not_be_guessed_stops_the_plan(self):
        with self.assertRaises(PlanNotSendable):
            plan(vr_payload=dict(VR, knee_side=""))
        with self.assertRaises(PlanNotSendable):
            plan(vr_payload=dict(VR, patient_id=""))
        with self.assertRaises(PlanNotSendable):
            plan(session_config={"mode": "training"})
        broken = dict(VR, femoral_component={})
        with self.assertRaises(PlanNotSendable):
            plan(vr_payload=broken)

    def test_nothing_about_the_patient_but_a_synthetic_label(self):
        p = plan()
        self.assertEqual(p["patient"]["label"], "SYN-TKA-101")
        self.assertEqual(p["patient"]["side"], "Left")
        self.assertEqual(set(p["trainee"]), {"id", "displayName", "cohort", "institution"})

    def test_an_unrecorded_deformity_is_left_empty_not_defaulted(self):
        self.assertEqual(plan(deformity="")["patient"]["deformity"], "")

    def test_deformity_comes_from_the_cases_own_words_and_is_never_defaulted(self):
        self.assertEqual(deformity_from("Medial osteoarthritis with moderate varus (right knee)"), "Varus")
        self.assertEqual(deformity_from("", "Lateral OA, severe VALGUS deformity"), "Valgus")
        self.assertEqual(deformity_from("Post-traumatic arthritis", None), "")
        self.assertEqual(deformity_from("varus-valgus instability"), "")   # both words: not settled
        self.assertEqual(deformity_from(None, None), "")

    def test_mode_follows_the_session_unless_overridden(self):
        self.assertEqual(plan()["mode"], "Practice")
        self.assertEqual(plan(session_config=dict(CONFIG, mode="assessment"))["mode"], "Exam")
        self.assertEqual(plan(headset_mode="Guided")["mode"], "Guided")


def complete_report(case_plan, *, drift=None, scene_id=True):
    """A finished run that hits every planned value (plus `drift` per parameter), at par time."""
    drift = drift or {}
    by_key = plan_values_by_key(case_plan)
    visited = scenes_for_variant(CONFIG["implant_design"], CONFIG["fixation"])
    steps = []
    for sc in visited:
        step = {"stepId": f"step-{sc.scene}", "result": "Pass", "timeSeconds": sc.par_s, "warnings": 0}
        if scene_id:
            step["sceneId"] = sc.scene
        steps.append(step)
    for p in PARAMETERS:
        if p.scene not in {s.scene for s in visited}:
            continue
        key = KEY_FOR_PARAMETER[p.key]
        value = by_key[key]["value"] + drift.get(p.key, 0.0)
        for step in steps:
            if step.get("sceneId") == p.scene and "planKey" not in step:
                step.update({"planKey": key, "plannedValue": by_key[key]["value"], "tolerance": by_key[key]["tolerance"],
                             "hasCommittedValue": True, "committedValue": value})
                break
        else:
            steps.append({"stepId": f"extra-{p.key}", "planKey": key, "hasCommittedValue": True, "committedValue": value,
                          "timeSeconds": 0})
    return {
        "schemaVersion": 1, "reportRevision": 1, "assignmentId": "a-1", "runId": "run-1", "caseId": "c-1",
        "deviceId": "quest-1", "appVersion": "0.9", "mode": "Practice", "outcome": "Completed",
        "startedAtUtc": "2026-11-03T10:00:00Z", "endedAtUtc": "2026-11-03T10:40:00Z", "durationSeconds": 2400,
        "totalScore": 77, "maxScore": 100, "grade": "B", "steps": steps, "measurements": [],
    }


CRITERIA = [
    {"name": "MAD", "parameter": "MAD_mm", "unit": "mm", "target_value": 25.0, "tolerance": 2.0,
     "severity_rule": {"minor": 2.0, "major": 4.0, "critical": 6.0}},
]
PLANNED_MEASUREMENTS = {"MAD_mm": 25.0}


class TestRunReport(unittest.TestCase):
    def test_a_complete_report_is_valid(self):
        self.assertEqual(validate_run_report(complete_report(plan())), [])

    def test_the_problems_are_named(self):
        bad = complete_report(plan())
        bad.update({"schemaVersion": 7, "mode": "Easy", "outcome": "Done", "reportRevision": 0, "runId": ""})
        problems = " | ".join(validate_run_report(bad))
        for needle in ("schemaVersion", "mode", "outcome", "reportRevision", "runId"):
            self.assertIn(needle, problems)

    def test_nan_and_infinity_are_not_numbers(self):
        r = complete_report(plan())
        r["steps"][0]["timeSeconds"] = float("nan")
        r["totalScore"] = float("inf")
        problems = " | ".join(validate_run_report(r))
        self.assertIn("steps[0].timeSeconds", problems)
        self.assertIn("totalScore", problems)

    def test_a_claimed_committed_value_must_be_a_number(self):
        r = complete_report(plan())
        r["steps"][0].update({"hasCommittedValue": True, "committedValue": "six"})
        self.assertTrue(any("committed" in p for p in validate_run_report(r)))

    def test_not_an_object_is_one_problem(self):
        self.assertEqual(len(validate_run_report([1, 2])), 1)


class TestBridge(unittest.TestCase):
    def bridge(self, report, **over):
        args = dict(case_plan=plan(), session_config=CONFIG, planned_measurements=PLANNED_MEASUREMENTS, planning_criteria=CRITERIA)
        args.update(over)
        return to_attempt_input(report, **args)

    def test_a_perfect_complete_report_scores_through_the_scorer(self):
        cp = plan()
        res = self.bridge(complete_report(cp), case_plan=cp)
        self.assertEqual(res.missing, [])
        scored = score_attempt(res.attempt_input)
        # Every parameter exactly on plan, at par time: every judged scene passes, nothing is critical.
        self.assertEqual(scored["critical_errors"], 0)
        self.assertTrue(all(p["verdict"] == "pass" for p in scored["parameters"]))
        self.assertTrue(scored["passed"])
        # Planning had one criterion, answered exactly: full planning marks.
        self.assertEqual(next(c for c in scored["categories"] if c["key"] == "preop_planning")["score"], 20)

    def test_the_headsets_own_score_is_kept_aside_and_never_used(self):
        cp = plan()
        res = self.bridge(complete_report(cp), case_plan=cp)
        self.assertEqual(res.reported, {"totalScore": 77, "maxScore": 100, "grade": "B"})
        self.assertNotEqual(score_attempt(res.attempt_input)["overall_score"], 77)

    def test_a_drifted_cut_is_judged_against_the_servers_plan(self):
        cp = plan()
        report = complete_report(cp, drift={"tibial_slope_deg": 5.0})   # 5 degrees over a 2 degree tolerance
        scored = score_attempt(self.bridge(report, case_plan=cp).attempt_input)
        slope = next(p for p in scored["parameters"] if p["key"] == "tibial_slope_deg")
        self.assertEqual((slope["deviation"], slope["verdict"]), (5.0, "fail"))

    def test_a_forged_snapshot_in_the_report_changes_nothing(self):
        cp = plan()
        report = complete_report(cp)
        report["plan"] = plan(vr_payload=dict(VR, assessment=dict(VR["assessment"], AMA_deg=1.0)))
        planned = self.bridge(report, case_plan=cp).attempt_input.planned
        self.assertEqual(planned["femoral_valgus_deg"], 6.5)

    def test_in_strict_mode_missing_inputs_are_listed_not_invented(self):
        cp = plan()
        report = complete_report(cp)
        report["steps"] = [s for s in report["steps"] if s.get("planKey") != "P3.femoralRotationDeg"]
        res = self.bridge(report, case_plan=cp, partial=False)
        self.assertIsNone(res.attempt_input)
        self.assertTrue(any("P3.femoralRotationDeg" in m for m in res.missing), res.missing)

    def test_a_partial_run_is_scored_on_what_it_measured_and_says_what_it_did_not(self):
        cp = plan()
        report = complete_report(cp)
        # The real headset: no closure scenes, and a tray scene performed without a tray rotation measurement.
        report["steps"] = [s for s in report["steps"] if s.get("sceneId") not in ("11.1", "11.2")]
        for s in report["steps"]:
            if s.get("planKey") == "P4.trayRotationDeg":
                s.update({"hasCommittedValue": False, "committedValue": 0})
        res = self.bridge(report, case_plan=cp)
        self.assertIsNotNone(res.attempt_input)
        self.assertEqual(res.missing, [])
        self.assertTrue(any("P4.trayRotationDeg" in c for c in res.coverage), res.coverage)
        self.assertTrue(any("scene 11.1" in c for c in res.coverage), res.coverage)
        scored = score_attempt(res.attempt_input)
        tray = next(p for p in scored["parameters"] if p["key"] == "tray_rotation_deg")
        self.assertEqual((tray["achieved"], tray["verdict"], tray["measured"]), (None, None, False))
        self.assertNotIn("11.1", [r["scene"] for r in scored["scene_results"]])
        self.assertEqual(scored["payload"]["coverage"]["scenes_not_performed"], ["11.1", "11.2"])
        self.assertIn("tray_rotation_deg", scored["payload"]["coverage"]["parameters_not_measured"])
        # Nothing invented: every other parameter still on plan, so the measured ones all pass.
        self.assertTrue(all(p["verdict"] == "pass" for p in scored["parameters"] if p["measured"]))

    def test_a_headset_without_scene_ids_cannot_be_timed(self):
        cp = plan()
        res = self.bridge(complete_report(cp, scene_id=False), case_plan=cp)
        self.assertIsNone(res.attempt_input)
        self.assertTrue(any("no time recorded" in m for m in res.missing))

    def test_a_step_map_can_stand_in_for_scene_ids(self):
        cp = plan()
        report = complete_report(cp, scene_id=False)
        step_map = {f"step-{sc.scene}": sc.scene for sc in scenes_for_variant("CR", "cemented")}
        res = self.bridge(report, case_plan=cp, step_scene_map=step_map)
        # Values hang off planKey, not scenes, so timing is the only thing the map had to supply.
        self.assertEqual(res.missing, [])

    def test_an_unfinished_run_is_not_scored(self):
        cp = plan()
        report = dict(complete_report(cp), outcome="Abandoned")
        res = self.bridge(report, case_plan=cp)
        self.assertIsNone(res.attempt_input)
        self.assertIn("did not finish", res.missing[0])

    def test_a_step_done_twice_keeps_the_last_value(self):
        report = {"steps": [
            {"planKey": "P2.tibialDepthMm", "hasCommittedValue": True, "committedValue": 12.0},
            {"planKey": "P2.tibialDepthMm", "hasCommittedValue": True, "committedValue": 9.5},
        ], "measurements": [{"key": "P2.tibialDepthMm", "value": 3.0}]}
        self.assertEqual(achieved_values(report)["tibial_resection_mm"], 9.5)

    def test_measurements_fill_in_only_what_no_step_committed(self):
        report = {"steps": [], "measurements": [{"key": "P5.hkaDeg", "value": 0.8, "unit": "deg", "atSeconds": 9}]}
        self.assertEqual(achieved_values(report), {"hka_deg": 0.8})


if __name__ == "__main__":
    unittest.main()
