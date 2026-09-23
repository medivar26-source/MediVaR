"""
Seed script for MediVeR-XR Case Library.

Separates SQL and binary image seeding:
- Reads synthetic FLAP and KLAT radiographs from dashboard/public
- Uploads images to private Supabase storage bucket 'imaging'
- Derives dynamic pixel calibration (scale = physical_mm / detected_px)
- Seeds authoritative clinical cases:
    1. SYNTH-VARUS-001 (Severe Varus Knee Osteoarthritis - Right)
    2. SYNTH-VALGUS-001 (Moderate Valgus Knee Osteoarthritis - Left)
- Connects assessment criteria directly to existing skills and rubric framework
- Assigns cases to programs so enrolled learners have immediate, secure access.
"""

import os
import sys
from pathlib import Path
import json
from uuid import UUID, uuid4
from datetime import datetime, timezone
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

# Ensure backend root is on PYTHONPATH
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

load_dotenv(BACKEND_DIR / ".env")

from db.session import get_service_client, get_db_conn
from core.calculations import calculate_calibration

WORKSPACE_ROOT = BACKEND_DIR.parent
PUBLIC_IMG_DIR = WORKSPACE_ROOT / "dashboard" / "public"

SYNTH_VARUS_ID = UUID("c1111111-1111-4111-a111-111111111111")
SYNTH_VALGUS_ID = UUID("c2222222-2222-4222-a222-222222222222")

VARUS_VERSION_ID = UUID("ba111111-1111-4111-a111-111111111111")
VALGUS_VERSION_ID = UUID("ba222222-2222-4222-a222-222222222222")



def upload_binary_image(supabase_client, local_path: Path, storage_path: str) -> None:
    if not local_path.exists():
        print(f"  [WARN] Local image file not found: {local_path}")
        return

    with open(local_path, "rb") as f:
        file_bytes = f.read()

    try:
        supabase_client.storage.from_("imaging").upload(
            path=storage_path,
            file=file_bytes,
            file_options={"content-type": "image/jpeg", "upsert": "true"},
        )
        print(f"  [SUCCESS] Uploaded {local_path.name} -> imaging/{storage_path}")
    except Exception as e:
        print(f"  [INFO] Upload result for {storage_path}: {e}")


def seed_case_library():
    print("=== SEEDING MEDIVER-XR CASE LIBRARY ===")

    service_client = get_service_client()
    conn = get_db_conn()

    try:
        with conn.cursor() as cur:
            # 1. Fetch institution, procedure, instructor, programs, skills
            cur.execute("SELECT id FROM institutions LIMIT 1;")
            inst_row = cur.fetchone()
            if not inst_row:
                print("[ERROR] No institution found in database.")
                return
            institution_id = inst_row["id"]

            cur.execute("SELECT id FROM procedures LIMIT 1;")
            proc_row = cur.fetchone()
            procedure_id = proc_row["id"] if proc_row else None

            cur.execute("SELECT id FROM users WHERE role = 'instructor' LIMIT 1;")
            inst_user = cur.fetchone()
            instructor_id = inst_user["id"] if inst_user else None

            cur.execute("SELECT id FROM programs WHERE institution_id = %s;", (str(institution_id),))
            program_ids = [r["id"] for r in cur.fetchall()]

            cur.execute("SELECT id, name FROM skills WHERE program_id = %s;", (str(program_ids[0]),) if program_ids else (None,))
            skills = {r["name"]: r["id"] for r in cur.fetchall()}

            # Fallback if no skills in first program
            if not skills:
                cur.execute("SELECT id, name FROM skills LIMIT 10;")
                skills = {r["name"]: r["id"] for r in cur.fetchall()}

            bone_skill_id = skills.get("Bone cuts & alignment") or list(skills.values())[0]
            trial_skill_id = skills.get("Trialling & stability") or list(skills.values())[0]

            now = datetime.now(timezone.utc)

            # -------------------------------------------------------------
            # CASE 1: SYNTH-VARUS-001
            # -------------------------------------------------------------
            print("\nSeeding SYNTH-VARUS-001...")
            varus_flap_path = f"cases/{SYNTH_VARUS_ID}/flap.jpg"
            varus_klat_path = f"cases/{SYNTH_VARUS_ID}/klat.jpg"

            upload_binary_image(service_client, PUBLIC_IMG_DIR / "synth_varus_flap.jpg", varus_flap_path)
            upload_binary_image(service_client, PUBLIC_IMG_DIR / "synth_varus_klat.jpg", varus_klat_path)

            cal_varus_flap = calculate_calibration(25.0, 94.7, "sphere_25mm")
            cal_varus_klat = calculate_calibration(25.0, 94.7, "sphere_25mm")

            # 1. Upsert case record (without published_version_id initially to satisfy FK)
            cur.execute(
                """
                INSERT INTO cases (
                    id, institution_id, procedure_id, name, difficulty,
                    description, learning_objective, status, version,
                    draft_version_id, published_version_id, created_at, updated_at
                ) VALUES (
                    %s, %s, %s, %s, %s,
                    %s, %s, 'active', 1,
                    NULL, NULL, %s, %s
                )
                ON CONFLICT (id) DO UPDATE SET
                    draft_version_id = NULL,
                    status = 'active',
                    updated_at = EXCLUDED.updated_at;
                """,
                (
                    str(SYNTH_VARUS_ID), str(institution_id), str(procedure_id),
                    "Severe Varus Knee Osteoarthritis (Right)", "intermediate",
                    "68yo male with severe right medial compartment pain, fixed flexion contracture 5 deg, Ahlback grade IV.",
                    "Execute mechanical alignment total knee replacement, restore joint line within 2mm, achieve symmetric flexion/extension gaps.",
                    now, now
                )
            )


            # Upsert case_version record
            patient_varus = {
                "age": 68,
                "gender": "Male",
                "bmi": 29.4,
                "clinical_notes": "Tricompartmental osteoarthritis with severe varus deformity. Ahlbäck Grade IV. Medial joint space collapse, large medial osteophytes.",
                "history": "Right knee pain progressive over 6 years. Failed conservative therapy.",
            }
            objectives_varus = [
                "Accurately calculate Mechanical Axis Deviation (MAD) and mHKA from full-leg radiograph.",
                "Select optimal tibial baseplate (Size 3) avoiding medial/lateral overhang > 1.0 mm.",
                "Select optimal femoral component (Size 4) ensuring flush anterior resection without anterior cortical notching.",
                "Establish balanced flexion and extension gaps in VR execution.",
            ]

            cur.execute(
                """
                INSERT INTO case_versions (
                    id, case_id, version_number, title, pathology, pathology_label,
                    side, difficulty, description, patient, objectives, status,
                    is_immutable, created_by, created_at, published_at
                ) VALUES (
                    %s, %s, 1, %s, %s, %s,
                    %s, %s, %s, %s, %s, 'published',
                    true, %s, %s, %s
                )
                ON CONFLICT (id) DO UPDATE SET
                    is_immutable = true,
                    status = 'published',
                    published_at = EXCLUDED.published_at;
                """,
                (
                    str(VARUS_VERSION_ID), str(SYNTH_VARUS_ID),
                    "Severe Varus Knee Osteoarthritis (Right)", "osteoarthritis",
                    "Tricompartmental Osteoarthritis with Severe Varus Deformity",
                    "right", "intermediate",
                    "68yo male with severe right medial compartment pain, Ahlbäck Grade IV.",
                    json.dumps(patient_varus), json.dumps(objectives_varus),
                    str(instructor_id) if instructor_id else None, now, now
                )
            )

            # Set published_version_id now that version row exists
            cur.execute(
                "UPDATE cases SET published_version_id = %s, draft_version_id = NULL, status = 'active' WHERE id = %s;",
                (str(VARUS_VERSION_ID), str(SYNTH_VARUS_ID))
            )

            # Insert imaging
            cur.execute("DELETE FROM case_imaging WHERE case_version_id = %s;", (str(VARUS_VERSION_ID),))
            cur.execute(
                """
                INSERT INTO case_imaging (case_version_id, view_type, label, storage_path, filename, mimetype, laterality, calibration)
                VALUES 
                    (%s, 'FLAP', 'Full Leg Anteroposterior (FLAP)', %s, 'synth_varus_flap.jpg', 'image/jpeg', 'right', %s),
                    (%s, 'KLAT', 'Knee Lateral (KLAT)', %s, 'synth_varus_klat.jpg', 'image/jpeg', 'right', %s);
                """,
                (
                    str(VARUS_VERSION_ID), varus_flap_path, json.dumps(cal_varus_flap),
                    str(VARUS_VERSION_ID), varus_klat_path, json.dumps(cal_varus_klat)
                )
            )


            # Insert Reference Plan
            ref_assessment_varus = {
                "MAD_mm": 12.0,
                "AMA_deg": 5.8,
                "mHKA_deg": 174.0,
                "MPTA_deg": 85.5,
                "LDFA_deg": 87.0,
                "PTS_deg": 7.0,
                "alignment_type": "VARUS",
            }
            ref_tibial_varus = {
                "implant_size": 3,
                "position_2d": {"x_offset_mm": 1.2, "y_offset_mm": -0.4, "rotation_deg": 0.5},
                "ap_dimension_mm": 42.5,
                "ml_dimension_mm": 68.2,
                "cortical_coverage_pct": 91.5,
                "medial_overhang_mm": 0.4,
                "lateral_overhang_mm": 0.6,
                "fit_status": "ACCEPTABLE FIT",
                "is_confirmed": True,
            }
            ref_femoral_varus = {
                "implant_size": 4,
                "position_2d": {"x_offset_mm": 0.0, "y_offset_mm": 0.0, "rotation_deg": 3.0},
                "ap_dimension_mm": 58.4,
                "ml_dimension_mm": 64.1,
                "ap_coverage_pct": 92.0,
                "ml_coverage_pct": 91.2,
                "notching_risk_mm": 0.0,
                "fit_status": "ACCEPTABLE FIT",
                "is_confirmed": True,
            }

            cur.execute("DELETE FROM case_version_reference_plan WHERE case_version_id = %s;", (str(VARUS_VERSION_ID),))
            cur.execute(
                """
                INSERT INTO case_version_reference_plan (
                    case_version_id, assessment, tibial_component, femoral_component,
                    instructor_notes, calculation_metadata
                ) VALUES (%s, %s, %s, %s, %s, %s);
                """,
                (
                    str(VARUS_VERSION_ID),
                    json.dumps(ref_assessment_varus),
                    json.dumps(ref_tibial_varus),
                    json.dumps(ref_femoral_varus),
                    "Target neutral mechanical axis 180° ± 2°. Resect proximal tibia perpendicular to mechanical axis.",
                    json.dumps({"method": "radio_opaque_marker", "version": "1.0.0", "calibrated_scale": 0.264})
                )
            )

            # Insert Assessment Criteria
            cur.execute("DELETE FROM assessment_criteria WHERE case_version_id = %s;", (str(VARUS_VERSION_ID),))
            criteria_varus = [
                (str(SYNTH_VARUS_ID), str(VARUS_VERSION_ID), str(bone_skill_id), "Mechanical Axis Deviation (MAD)", "MAD_mm", 12.0, 2.0, 2.0, "mm", {"minor": 2.0, "major": 4.0, "critical": 6.0}),
                (str(SYNTH_VARUS_ID), str(VARUS_VERSION_ID), str(bone_skill_id), "Mechanical HKA Angle", "mHKA_deg", 174.0, 1.5, 1.5, "°", {"minor": 1.5, "major": 3.0, "critical": 5.0}),
                (str(SYNTH_VARUS_ID), str(VARUS_VERSION_ID), str(bone_skill_id), "Medial Proximal Tibial Angle", "MPTA_deg", 85.5, 2.0, 2.0, "°", {"minor": 2.0, "major": 3.5, "critical": 5.0}),
                (str(SYNTH_VARUS_ID), str(VARUS_VERSION_ID), str(bone_skill_id), "Lateral Distal Femoral Angle", "LDFA_deg", 87.0, 2.0, 2.0, "°", {"minor": 2.0, "major": 3.5, "critical": 5.0}),
                (str(SYNTH_VARUS_ID), str(VARUS_VERSION_ID), str(bone_skill_id), "Posterior Tibial Slope", "PTS_deg", 7.0, 2.0, 2.0, "°", {"minor": 2.0, "major": 3.5, "critical": 5.0}),
                (str(SYNTH_VARUS_ID), str(VARUS_VERSION_ID), str(trial_skill_id), "Tibial Component Sizing", "tibial_size", 3.0, 0.0, 0.0, "size", {"minor": 1.0, "major": 2.0, "critical": 3.0}),
                (str(SYNTH_VARUS_ID), str(VARUS_VERSION_ID), str(trial_skill_id), "Femoral Component Sizing", "femoral_size", 4.0, 0.0, 0.0, "size", {"minor": 1.0, "major": 2.0, "critical": 3.0}),
            ]
            for c in criteria_varus:
                cur.execute(
                    """
                    INSERT INTO assessment_criteria (case_id, case_version_id, skill_id, name, parameter, target_value, tolerance_min, tolerance_max, unit, severity_rule, version)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 1);
                    """,
                    (c[0], c[1], c[2], c[3], c[4], c[5], c[6], c[7], c[8], json.dumps(c[9]))
                )

            # Link to programs
            for p_id in program_ids:
                cur.execute(
                    "INSERT INTO case_programs (case_id, program_id) VALUES (%s, %s) ON CONFLICT DO NOTHING;",
                    (str(SYNTH_VARUS_ID), str(p_id))
                )

            # -------------------------------------------------------------
            # CASE 2: SYNTH-VALGUS-001
            # -------------------------------------------------------------
            print("\nSeeding SYNTH-VALGUS-001...")
            valgus_flap_path = f"cases/{SYNTH_VALGUS_ID}/flap.jpg"
            valgus_klat_path = f"cases/{SYNTH_VALGUS_ID}/klat.jpg"

            upload_binary_image(service_client, PUBLIC_IMG_DIR / "synth_valgus_flap.jpg", valgus_flap_path)
            upload_binary_image(service_client, PUBLIC_IMG_DIR / "synth_valgus_klat.jpg", valgus_klat_path)

            cal_valgus_flap = calculate_calibration(25.0, 94.7, "sphere_25mm")
            cal_valgus_klat = calculate_calibration(25.0, 94.7, "sphere_25mm")

            cur.execute(
                """
                INSERT INTO cases (
                    id, institution_id, procedure_id, name, difficulty,
                    description, learning_objective, status, version,
                    draft_version_id, published_version_id, created_at, updated_at
                ) VALUES (
                    %s, %s, %s, %s, %s,
                    %s, %s, 'active', 1,
                    NULL, NULL, %s, %s
                )
                ON CONFLICT (id) DO UPDATE SET
                    draft_version_id = NULL,
                    status = 'active',
                    updated_at = EXCLUDED.updated_at;
                """,
                (
                    str(SYNTH_VALGUS_ID), str(institution_id), str(procedure_id),
                    "Moderate Valgus Knee Osteoarthritis (Left)", "expert",
                    "62yo female with progressive left knee lateral pain, Ahlback grade III, lateral compartment collapse.",
                    "Plan precise distal femoral resection, avoid lateral joint line elevation, select Size 3 femur and Size 2 tibia.",
                    now, now
                )
            )

            patient_valgus = {
                "age": 62,
                "gender": "Female",
                "bmi": 27.8,
                "clinical_notes": "Lateral compartment osteoarthritis with moderate valgus deformity. Ahlbäck Grade III. Lateral femoral condyle hypoplasia.",
                "history": "Left knee lateral pain on weight-bearing, progressive over 4 years.",
            }
            objectives_valgus = [
                "Identify valgus deformity alignment parameters (mHKA 185.5°, MAD 8.5 mm valgus).",
                "Select correct tibial baseplate (Size 2) with balanced mediolateral fit.",
                "Select femoral component (Size 3) preserving posterior condylar offset and anterior flush.",
                "Execute lateral release and gap balancing in VR simulation.",
            ]

            cur.execute(
                """
                INSERT INTO case_versions (
                    id, case_id, version_number, title, pathology, pathology_label,
                    side, difficulty, description, patient, objectives, status,
                    is_immutable, created_by, created_at, published_at
                ) VALUES (
                    %s, %s, 1, %s, %s, %s,
                    %s, %s, %s, %s, %s, 'published',
                    true, %s, %s, %s
                )
                ON CONFLICT (id) DO UPDATE SET
                    is_immutable = true,
                    status = 'published',
                    published_at = EXCLUDED.published_at;
                """,
                (
                    str(VALGUS_VERSION_ID), str(SYNTH_VALGUS_ID),
                    "Moderate Valgus Knee Osteoarthritis (Left)", "osteoarthritis",
                    "Lateral Compartment Osteoarthritis with Valgus Deformity",
                    "left", "expert",
                    "62yo female with progressive left knee lateral pain, Ahlbäck Grade III.",
                    json.dumps(patient_valgus), json.dumps(objectives_valgus),
                    str(instructor_id) if instructor_id else None, now, now
                )
            )

            cur.execute(
                "UPDATE cases SET published_version_id = %s, draft_version_id = NULL, status = 'active' WHERE id = %s;",
                (str(VALGUS_VERSION_ID), str(SYNTH_VALGUS_ID))
            )


            cur.execute("DELETE FROM case_imaging WHERE case_version_id = %s;", (str(VALGUS_VERSION_ID),))
            cur.execute(
                """
                INSERT INTO case_imaging (case_version_id, view_type, label, storage_path, filename, mimetype, laterality, calibration)
                VALUES 
                    (%s, 'FLAP', 'Full Leg Anteroposterior (FLAP)', %s, 'synth_valgus_flap.jpg', 'image/jpeg', 'left', %s),
                    (%s, 'KLAT', 'Knee Lateral (KLAT)', %s, 'synth_valgus_klat.jpg', 'image/jpeg', 'left', %s);
                """,
                (
                    str(VALGUS_VERSION_ID), valgus_flap_path, json.dumps(cal_valgus_flap),
                    str(VALGUS_VERSION_ID), valgus_klat_path, json.dumps(cal_valgus_klat)
                )
            )



            ref_assessment_valgus = {
                "MAD_mm": 8.5,
                "AMA_deg": 6.2,
                "mHKA_deg": 185.5,
                "MPTA_deg": 89.0,
                "LDFA_deg": 83.5,
                "PTS_deg": 8.0,
                "alignment_type": "VALGUS",
            }
            ref_tibial_valgus = {
                "implant_size": 2,
                "position_2d": {"x_offset_mm": 0.5, "y_offset_mm": 0.0, "rotation_deg": 0.0},
                "ap_dimension_mm": 40.0,
                "ml_dimension_mm": 64.5,
                "cortical_coverage_pct": 90.8,
                "medial_overhang_mm": 0.2,
                "lateral_overhang_mm": 0.5,
                "fit_status": "ACCEPTABLE FIT",
                "is_confirmed": True,
            }
            ref_femoral_valgus = {
                "implant_size": 3,
                "position_2d": {"x_offset_mm": -0.5, "y_offset_mm": 0.0, "rotation_deg": 3.0},
                "ap_dimension_mm": 56.2,
                "ml_dimension_mm": 62.0,
                "ap_coverage_pct": 91.5,
                "ml_coverage_pct": 90.5,
                "notching_risk_mm": 0.0,
                "fit_status": "ACCEPTABLE FIT",
                "is_confirmed": True,
            }

            cur.execute("DELETE FROM case_version_reference_plan WHERE case_version_id = %s;", (str(VALGUS_VERSION_ID),))
            cur.execute(
                """
                INSERT INTO case_version_reference_plan (
                    case_version_id, assessment, tibial_component, femoral_component,
                    instructor_notes, calculation_metadata
                ) VALUES (%s, %s, %s, %s, %s, %s);
                """,
                (
                    str(VALGUS_VERSION_ID),
                    json.dumps(ref_assessment_valgus),
                    json.dumps(ref_tibial_valgus),
                    json.dumps(ref_femoral_valgus),
                    "Avoid over-resecting distal lateral femur. Verify flexion gap symmetry.",
                    json.dumps({"method": "radio_opaque_marker", "version": "1.0.0", "calibrated_scale": 0.264})
                )
            )

            cur.execute("DELETE FROM assessment_criteria WHERE case_version_id = %s;", (str(VALGUS_VERSION_ID),))
            criteria_valgus = [
                (str(SYNTH_VALGUS_ID), str(VALGUS_VERSION_ID), str(bone_skill_id), "Mechanical Axis Deviation (MAD)", "MAD_mm", 8.5, 2.0, 2.0, "mm", {"minor": 2.0, "major": 4.0, "critical": 6.0}),
                (str(SYNTH_VALGUS_ID), str(VALGUS_VERSION_ID), str(bone_skill_id), "Mechanical HKA Angle", "mHKA_deg", 185.5, 1.5, 1.5, "°", {"minor": 1.5, "major": 3.0, "critical": 5.0}),
                (str(SYNTH_VALGUS_ID), str(VALGUS_VERSION_ID), str(bone_skill_id), "Medial Proximal Tibial Angle", "MPTA_deg", 89.0, 2.0, 2.0, "°", {"minor": 2.0, "major": 3.5, "critical": 5.0}),
                (str(SYNTH_VALGUS_ID), str(VALGUS_VERSION_ID), str(bone_skill_id), "Lateral Distal Femoral Angle", "LDFA_deg", 83.5, 2.0, 2.0, "°", {"minor": 2.0, "major": 3.5, "critical": 5.0}),
                (str(SYNTH_VALGUS_ID), str(VALGUS_VERSION_ID), str(bone_skill_id), "Posterior Tibial Slope", "PTS_deg", 8.0, 2.0, 2.0, "°", {"minor": 2.0, "major": 3.5, "critical": 5.0}),
                (str(SYNTH_VALGUS_ID), str(VALGUS_VERSION_ID), str(trial_skill_id), "Tibial Component Sizing", "tibial_size", 2.0, 0.0, 0.0, "size", {"minor": 1.0, "major": 2.0, "critical": 3.0}),
                (str(SYNTH_VALGUS_ID), str(VALGUS_VERSION_ID), str(trial_skill_id), "Femoral Component Sizing", "femoral_size", 3.0, 0.0, 0.0, "size", {"minor": 1.0, "major": 2.0, "critical": 3.0}),
            ]
            for c in criteria_valgus:
                cur.execute(
                    """
                    INSERT INTO assessment_criteria (case_id, case_version_id, skill_id, name, parameter, target_value, tolerance_min, tolerance_max, unit, severity_rule, version)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 1);
                    """,
                    (c[0], c[1], c[2], c[3], c[4], c[5], c[6], c[7], c[8], json.dumps(c[9]))
                )

            for p_id in program_ids:
                cur.execute(
                    "INSERT INTO case_programs (case_id, program_id) VALUES (%s, %s) ON CONFLICT DO NOTHING;",
                    (str(SYNTH_VALGUS_ID), str(p_id))
                )

            conn.commit()
            print("\n[SUCCESS] Successfully seeded Case Library with SYNTH-VARUS-001 and SYNTH-VALGUS-001!")
    except Exception as e:
        conn.rollback()
        print(f"\n[ERROR] Seeding failed: {e}")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    seed_case_library()
