"""
Comprehensive test suite for MediVeR-XR Case Authoring, Calculations, and Layer Separation.
"""

import unittest
from uuid import UUID
from core.calculations.geometry import (
    Vector2D,
    vector_magnitude,
    angle_between_vectors_deg,
    perpendicular_distance_point_to_line,
    calculate_calibration,
)
from core.calculations.planning import (
    calculate_mad,
    calculate_ama,
    calculate_mhka,
    calculate_mpta,
    calculate_ldfa,
    calculate_pts,
    suggest_tibial_size,
    suggest_femoral_size,
    evaluate_tibial_fit,
    evaluate_femoral_fit,
    TIBIAL_SIZES_CATALOG,
    FEMORAL_SIZES_CATALOG,
)
from core.calculations.assessment import (
    evaluate_measurement_criterion,
    classify_error_severity,
    aggregate_skill_scores,
)
from services.cases_service import (
    validate_case_version_for_publishing,
    get_instructor_case_detail,
    get_learner_case_detail,
)


class TestCaseAuthoringAndCalculations(unittest.TestCase):

    # -----------------------------------------------------------------------
    # 1. Geometry & Calibration Tests
    # -----------------------------------------------------------------------
    def test_vector_operations(self):
        v1 = Vector2D(0, 0)
        v2 = Vector2D(3, 4)
        self.assertEqual(vector_magnitude(v2), 5.0)

        # 90 degree angle
        va = Vector2D(1, 0)
        vb = Vector2D(0, 1)
        self.assertAlmostEqual(angle_between_vectors_deg(va, vb), 90.0, places=4)

        # Point to line perpendicular distance
        # Line from (0, 0) to (10, 0) -> horizontal line y=0. Point at (5, 3) -> dist is 3.0
        p = Vector2D(5, 3)
        dist = perpendicular_distance_point_to_line(p, Vector2D(0, 0), Vector2D(10, 0))
        self.assertAlmostEqual(dist, 3.0, places=4)

    def test_dynamic_calibration_derivation(self):
        # Valid 25mm sphere with ~94.7 px detected
        cal = calculate_calibration(25.0, 94.7, "sphere_25mm")
        self.assertTrue(cal["is_valid"])
        self.assertAlmostEqual(cal["calculated_scale_mm_per_px"], 0.26399, places=3)
        self.assertIsNone(cal["validation_error"])

        # Invalid: zero or negative pixel diameter
        cal_inv = calculate_calibration(25.0, 0.0)
        self.assertFalse(cal_inv["is_valid"])
        self.assertIn("greater than zero", cal_inv["validation_error"])

        # Unrealistic scale (e.g. 500mm / 10px = 50 mm/px)
        cal_unreal = calculate_calibration(50.0, 10.0)
        self.assertFalse(cal_unreal["is_valid"])
        self.assertIn("clinically unrealistic", cal_unreal["validation_error"])

    # -----------------------------------------------------------------------
    # 2. Planning Calculations & Fit Metrics (V1 Spec)
    # -----------------------------------------------------------------------
    def test_six_measurements(self):
        # MAD test: right knee center shifted medially (higher x on AP radiograph) -> VARUS
        hip = Vector2D(100, 0)
        ankle = Vector2D(100, 1000)
        knee = Vector2D(120, 500)
        mad = calculate_mad(knee, hip, ankle, scale_mm_per_px=0.5, side="RIGHT")
        self.assertEqual(mad["mad_mm"], 10.0)
        self.assertEqual(mad["alignment_type"], "VARUS")


        # AMA test
        prox_shaft = Vector2D(100, 200)
        dist_shaft = Vector2D(100, 450)
        hip_c = Vector2D(110, 100)
        knee_c = Vector2D(100, 500)
        ama = calculate_ama(prox_shaft, dist_shaft, hip_c, knee_c)
        self.assertGreater(ama, 0.0)

        # mHKA test: collinear should be 180°
        mhka = calculate_mhka(Vector2D(100, 0), Vector2D(100, 500), Vector2D(100, 1000))
        self.assertAlmostEqual(mhka, 180.0, places=1)

    def test_implant_sizing_and_fit(self):
        # Sizing suggestions
        self.assertEqual(suggest_tibial_size(68.0), 3)
        self.assertEqual(suggest_femoral_size(58.0), 4)

        # Tibial fit - acceptable
        fit_ok = evaluate_tibial_fit(3, 0.5, 0.0, patient_ap_mm=43.0, patient_ml_mm=69.0)
        self.assertEqual(fit_ok["fit_status"], "ACCEPTABLE FIT")
        self.assertGreaterEqual(fit_ok["coverage_pct"], 85.0)

        # Tibial fit - caution on overhang > 1.5mm
        fit_overhang = evaluate_tibial_fit(6, 0.0, 0.0, patient_ap_mm=40.0, patient_ml_mm=64.0)
        self.assertEqual(fit_overhang["fit_status"], "CAUTION: Overhang > 1.5mm")

        # Femoral fit - acceptable
        fem_ok = evaluate_femoral_fit(4, 0.0, 0.0, patient_ap_mm=59.0, patient_ml_mm=65.0)
        self.assertEqual(fem_ok["fit_status"], "ACCEPTABLE FIT")

        # Femoral fit - caution on posterior notch risk
        fem_notch = evaluate_femoral_fit(4, 0.0, -2.0, patient_ap_mm=59.0, patient_ml_mm=65.0)
        self.assertEqual(fem_notch["fit_status"], "CAUTION: Anterior Notch Risk")

    # -----------------------------------------------------------------------
    # 3. Assessment & Rubric Evaluation
    # -----------------------------------------------------------------------
    def test_assessment_tolerances_and_severity(self):
        # Within tolerance
        ev1 = evaluate_measurement_criterion(
            parameter="MAD_mm",
            actual_value=12.5,
            target_value=12.0,
            tolerance_min=1.0,
            tolerance_max=1.0,
            severity_rule={"minor": 1.5, "major": 3.0, "critical": 5.0},
        )
        self.assertTrue(ev1["is_within_tolerance"])
        self.assertEqual(ev1["severity"], "NONE")
        self.assertEqual(ev1["criterion_score"], 100.0)

        # Critical error
        ev_crit = evaluate_measurement_criterion(
            parameter="mHKA_deg",
            actual_value=165.0,
            target_value=174.0,  # 9 deg deviation
            tolerance_min=1.5,
            tolerance_max=1.5,
            severity_rule={"minor": 1.5, "major": 3.0, "critical": 5.0},
        )
        self.assertFalse(ev_crit["is_within_tolerance"])
        self.assertEqual(ev_crit["severity"], "CRITICAL")
        self.assertTrue(ev_crit["is_critical"])
        self.assertEqual(ev_crit["criterion_score"], 0.0)

    def test_skill_aggregation_and_auto_fail(self):
        skills_map = {
            "s1": {"name": "Bone cuts & alignment", "weight": 0.5},
            "s2": {"name": "Trialling & stability", "weight": 0.5},
        }

        # Perfect evaluation
        evals_pass = [
            {"skill_id": "s1", "criterion_score": 100.0, "is_critical": False},
            {"skill_id": "s2", "criterion_score": 90.0, "is_critical": False},
        ]
        res_pass = aggregate_skill_scores(evals_pass, skills_map, pass_threshold=70.0)
        self.assertTrue(res_pass["passed"])
        self.assertEqual(res_pass["overall_score"], 95.0)

        # Evaluation with a critical failure -> must fail overall even if score is high
        evals_fail = [
            {"skill_id": "s1", "criterion_score": 90.0, "is_critical": False},
            {"skill_id": "s2", "criterion_score": 75.0, "is_critical": True},
        ]
        res_fail = aggregate_skill_scores(evals_fail, skills_map, pass_threshold=70.0)
        self.assertFalse(res_fail["passed"])
        self.assertTrue(res_fail["has_critical_failure"])

    # -----------------------------------------------------------------------
    # 4. Pre-flight Validation Checklist
    # -----------------------------------------------------------------------
    def test_preflight_validation(self):
        # Incomplete draft
        valid, errors = validate_case_version_for_publishing(
            version_row={"title": ""},
            imaging_rows=[],
            reference_plan_row=None,
            criteria_rows=[],
        )
        self.assertFalse(valid)
        self.assertIn("Case title is required.", errors)
        self.assertTrue(any("Full Leg Anteroposterior" in e for e in errors))
        self.assertTrue(any("Knee Lateral" in e for e in errors))
        self.assertTrue(any("reference plan is required" in e for e in errors))

    # -----------------------------------------------------------------------
    # 5. Database Seeded Cases & Strict Layer Separation
    # -----------------------------------------------------------------------
    def test_seeded_case_retrieval_and_layer_separation(self):
        varus_id = UUID("c1111111-1111-4111-a111-111111111111")

        # Instructor detail: contains reference_plan and assessment_criteria
        instructor_case = get_instructor_case_detail(varus_id)
        self.assertIsNotNone(instructor_case)
        self.assertEqual(instructor_case["status"], "active")
        self.assertIsNotNone(instructor_case["reference_plan"])
        self.assertEqual(instructor_case["reference_plan"]["assessment"]["MAD_mm"], 12.0)
        self.assertGreaterEqual(len(instructor_case["imaging"]), 2)
        self.assertGreaterEqual(len(instructor_case["criteria"]), 5)

        # Learner detail: MUST NOT contain reference_plan or criteria!
        learner_case = get_learner_case_detail(varus_id, user_id=None)
        self.assertIsNotNone(learner_case)
        self.assertNotIn("reference_plan", learner_case)
        self.assertNotIn("criteria", learner_case)
        self.assertNotIn("instructor_notes", learner_case)
        self.assertIn("patient", learner_case)
        self.assertIn("imaging", learner_case)
        # Check signed URLs exist for imaging
        for img in learner_case["imaging"]:
            self.assertIn("storage_path", img)

    def test_create_case_draft_foreign_key_resolution(self):
        from schemas.cases import CaseCreate
        from services.cases_service import create_case
        from db.session import get_db_conn

        conn = get_db_conn()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT id FROM institutions LIMIT 1")
                inst_row = cur.fetchone()
                institution_id = inst_row["id"] if inst_row else UUID("00000000-0000-0000-0000-000000000001")

                cur.execute("SELECT id FROM users WHERE role IN ('instructor', 'admin') LIMIT 1")
                usr_row = cur.fetchone()
                instructor_id = usr_row["id"] if usr_row else UUID("00000000-0000-0000-0000-000000000002")
        finally:
            conn.close()

        case_in = CaseCreate(
            name="Test FK Resolution Case",
            difficulty="intermediate",
            description="Testing foreign key constraint resolution",
            pathology="osteoarthritis",
            pathology_label="Varus Deformity",
            side="right",
            patient={"age": 65, "gender": "Female", "bmi": 28.5},
            objectives=["Validate foreign key draft linkage"],
        )

        created = create_case(case_in, instructor_id, institution_id)
        self.assertIsNotNone(created)
        self.assertEqual(created["name"], "Test FK Resolution Case")
        self.assertEqual(created["status"], "draft")
        self.assertIsNotNone(created["draft_version_id"])

        # Clean up created test case
        conn = get_db_conn()
        try:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM cases WHERE id = %s", (str(created["id"]),))
            conn.commit()
        finally:
            conn.close()


if __name__ == "__main__":
    unittest.main()
