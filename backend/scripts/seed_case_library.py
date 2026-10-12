"""
Seed script for the MediVeR-XR Case Library.

Each case is two calibrated radiographs (full-leg AP "FLAP" and knee lateral "KLAT") plus the clinical
detail, reference plan and assessment criteria that go with them. The scans and their scale come from
`scan_manifest.json`, which `make_calibrated_scans.py` writes: every scan carries a marker of known size
(a 25 mm sphere, or the printed 10 cm ruler on the real demo film) and the scale stored here is that
marker's size divided by its MEASURED pixel diameter. Nothing is shared between scans: a full-leg film and a
knee close-up have very different millimetres-per-pixel.

Usage (from the backend folder):
    python scripts/seed_case_library.py                    add or refresh the three demo cases
    python scripts/seed_case_library.py --wipe             first remove EVERY case in the library
    python scripts/seed_case_library.py --wipe --sessions detach|delete

`--wipe` always writes a JSON backup of the case tables first. Sessions that point at a case block its
removal, so --wipe needs --sessions: `detach` keeps the sessions and clears their case, `delete` removes them.
Image binaries already in storage are left alone.
"""

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from uuid import UUID

import psycopg2.extras
from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))
load_dotenv(BACKEND_DIR / ".env")

from db.session import get_db_conn, get_service_client  # noqa: E402
from core.calculations import calculate_calibration  # noqa: E402

WORKSPACE_ROOT = BACKEND_DIR.parent
PUBLIC_DIR = WORKSPACE_ROOT / "dashboard" / "public"
MANIFEST = Path(__file__).resolve().parent / "scan_manifest.json"

CASE_TABLES = [
    "cases", "case_versions", "case_imaging", "case_version_reference_plan",
    "assessment_criteria", "case_programs", "cohort_case_assignments",
]

# ---------------------------------------------------------------------------------------------------
# The three demo cases. Reference measurements and sizes are chosen to agree with the scans: the bone
# sizes follow from each scan's calibrated scale (condyle depth, tibial width), so the reference
# component sizes fit the marked bone.
# ---------------------------------------------------------------------------------------------------
CASES = [
    dict(
        key="varus", case_id=UUID("c1111111-1111-4111-a111-111111111111"), version_id=UUID("ba111111-1111-4111-a111-111111111111"),
        name="Severe Varus Knee Osteoarthritis (Right)", difficulty="intermediate", side="right",
        pathology="osteoarthritis", pathology_label="Tricompartmental Osteoarthritis with Severe Varus Deformity",
        description="68yo male with severe right medial compartment pain, fixed flexion contracture 5 deg, Ahlback grade IV.",
        learning_objective="Execute mechanical alignment total knee replacement, restore joint line within 2mm, achieve symmetric flexion/extension gaps.",
        patient=dict(age=68, gender="Male", bmi=29.4,
                     clinical_notes="Tricompartmental osteoarthritis with severe varus deformity. Ahlback Grade IV. Medial joint space collapse, large medial osteophytes.",
                     history="Right knee pain progressive over 6 years. Failed conservative therapy."),
        objectives=[
            "Accurately calculate Mechanical Axis Deviation (MAD) and mHKA from the full-leg radiograph.",
            "Select the tibial baseplate (Size 3) avoiding medial/lateral overhang > 1.0 mm.",
            "Select the femoral component (Size 4) with a flush anterior flange and no anterior cortical notching.",
            "Establish balanced flexion and extension gaps in VR execution.",
        ],
        scans=dict(FLAP="varus_flap", KLAT="varus_klat"),
        assessment=dict(MAD_mm=12.0, AMA_deg=5.8, mHKA_deg=174.0, MPTA_deg=85.5, LDFA_deg=87.0, PTS_deg=7.0, alignment_type="VARUS"),
        tibial=dict(implant_size=3, position_2d=dict(x_offset_mm=1.2, y_offset_mm=-0.4, rotation_deg=0.5), ap_dimension_mm=42.5, ml_dimension_mm=68.2,
                    cortical_coverage_pct=91.5, medial_overhang_mm=0.4, lateral_overhang_mm=0.6, fit_status="ACCEPTABLE FIT", is_confirmed=True),
        femoral=dict(implant_size=4, position_2d=dict(x_offset_mm=0.0, y_offset_mm=0.0, rotation_deg=3.0), ap_dimension_mm=58.4, ml_dimension_mm=64.1,
                     ap_coverage_pct=92.0, ml_coverage_pct=91.2, notching_risk_mm=0.0, fit_status="ACCEPTABLE FIT", is_confirmed=True),
        notes="Target neutral mechanical axis 180 deg +/- 2. Resect proximal tibia perpendicular to the mechanical axis.",
        sizes=dict(tibial_size=3.0, femoral_size=4.0),
    ),
    dict(
        key="valgus", case_id=UUID("c2222222-2222-4222-a222-222222222222"), version_id=UUID("ba222222-2222-4222-a222-222222222222"),
        name="Moderate Valgus Knee Osteoarthritis (Left)", difficulty="expert", side="left",
        pathology="osteoarthritis", pathology_label="Lateral Compartment Osteoarthritis with Moderate Valgus Deformity",
        description="72yo female with lateral compartment pain, 5 deg valgus, lateral femoral condyle hypoplasia.",
        learning_objective="Plan a valgus knee: avoid over-resecting the distal lateral femur and verify flexion gap symmetry.",
        patient=dict(age=72, gender="Female", bmi=26.2,
                     clinical_notes="Lateral compartment osteoarthritis with moderate valgus deformity and a hypoplastic lateral femoral condyle.",
                     history="Left knee lateral pain for 8 years. Failed injections and bracing."),
        objectives=[
            "Measure MAD, mHKA and LDFA on the full-leg radiograph and recognise a valgus pattern.",
            "Select the femoral component (Size 3) for a small distal femur without notching the anterior cortex.",
            "Select the tibial baseplate (Size 2) with acceptable coverage.",
            "Verify flexion gap symmetry in VR execution.",
        ],
        scans=dict(FLAP="valgus_flap", KLAT="valgus_klat"),
        assessment=dict(MAD_mm=8.5, AMA_deg=6.2, mHKA_deg=185.5, MPTA_deg=89.0, LDFA_deg=83.5, PTS_deg=8.0, alignment_type="VALGUS"),
        tibial=dict(implant_size=2, position_2d=dict(x_offset_mm=0.5, y_offset_mm=0.0, rotation_deg=0.0), ap_dimension_mm=40.0, ml_dimension_mm=64.5,
                    cortical_coverage_pct=90.8, medial_overhang_mm=0.2, lateral_overhang_mm=0.5, fit_status="ACCEPTABLE FIT", is_confirmed=True),
        femoral=dict(implant_size=3, position_2d=dict(x_offset_mm=-0.5, y_offset_mm=0.0, rotation_deg=3.0), ap_dimension_mm=56.2, ml_dimension_mm=62.0,
                     ap_coverage_pct=91.5, ml_coverage_pct=90.5, notching_risk_mm=0.0, fit_status="ACCEPTABLE FIT", is_confirmed=True),
        notes="Avoid over-resecting the distal lateral femur. Verify flexion gap symmetry.",
        sizes=dict(tibial_size=2.0, femoral_size=3.0),
    ),
    dict(
        key="mild", case_id=UUID("c3333333-3333-4333-a333-333333333333"), version_id=UUID("ba333333-3333-4333-a333-333333333333"),
        name="Early Osteoarthritis with Mild Varus (Right)", difficulty="beginner", side="right",
        pathology="osteoarthritis", pathology_label="Medial Compartment Osteoarthritis with Mild Varus",
        description="61yo female with medial knee pain, 3 deg varus, Kellgren-Lawrence grade 3. The full-leg film carries a printed 10 cm ruler.",
        learning_objective="Learn the planning workflow on a near-neutral leg and calibrate a scan from a printed ruler.",
        patient=dict(age=61, gender="Female", bmi=25.1,
                     clinical_notes="Medial compartment osteoarthritis, Kellgren-Lawrence grade 3, mild varus, no flexion contracture.",
                     history="Right medial knee pain for 3 years, partial relief with physiotherapy."),
        objectives=[
            "Calibrate the full-leg film from the printed 10 cm ruler (two clicks on its ends).",
            "Measure MAD and mHKA and confirm a near-neutral mechanical axis.",
            "Select tibial Size 2 and femoral Size 3 and check the fit on both scans.",
        ],
        scans=dict(FLAP="mild_flap", KLAT="mild_klat"),
        assessment=dict(MAD_mm=5.0, AMA_deg=5.6, mHKA_deg=177.5, MPTA_deg=87.0, LDFA_deg=88.0, PTS_deg=6.0, alignment_type="VARUS"),
        tibial=dict(implant_size=2, position_2d=dict(x_offset_mm=0.0, y_offset_mm=0.0, rotation_deg=0.0), ap_dimension_mm=40.0, ml_dimension_mm=64.5,
                    cortical_coverage_pct=92.0, medial_overhang_mm=0.2, lateral_overhang_mm=0.3, fit_status="ACCEPTABLE FIT", is_confirmed=True),
        femoral=dict(implant_size=3, position_2d=dict(x_offset_mm=0.0, y_offset_mm=0.0, rotation_deg=1.0), ap_dimension_mm=56.2, ml_dimension_mm=62.0,
                     ap_coverage_pct=92.5, ml_coverage_pct=91.0, notching_risk_mm=0.0, fit_status="ACCEPTABLE FIT", is_confirmed=True),
        notes="Near-neutral alignment. Calibrate from the ruler before measuring anything.",
        sizes=dict(tibial_size=2.0, femoral_size=3.0),
    ),
]

VIEW_LABEL = {"FLAP": "Full Leg Anteroposterior (FLAP)", "KLAT": "Knee Lateral (KLAT)"}

# (name, parameter, unit, tolerance, severity rule)
DEG = "°"
CRITERIA = [
    ("Mechanical Axis Deviation (MAD)", "MAD_mm", "mm", 2.0, {"minor": 2.0, "major": 4.0, "critical": 6.0}),
    ("Mechanical HKA Angle", "mHKA_deg", DEG, 1.5, {"minor": 1.5, "major": 3.0, "critical": 5.0}),
    ("Medial Proximal Tibial Angle", "MPTA_deg", DEG, 2.0, {"minor": 2.0, "major": 3.5, "critical": 5.0}),
    ("Lateral Distal Femoral Angle", "LDFA_deg", DEG, 2.0, {"minor": 2.0, "major": 3.5, "critical": 5.0}),
    ("Posterior Tibial Slope", "PTS_deg", DEG, 2.0, {"minor": 2.0, "major": 3.5, "critical": 5.0}),
]
SIZE_CRITERIA = [
    ("Tibial Component Sizing", "tibial_size"),
    ("Femoral Component Sizing", "femoral_size"),
]


def load_manifest() -> dict:
    return json.loads(MANIFEST.read_text(encoding="utf-8"))


def calibration_for(scan: dict) -> dict:
    """The calibration stored with a scan: the backend's own derivation from the marker, plus what it was measured on."""
    cal = calculate_calibration(scan["marker_mm"], scan["marker_px"], scan["marker_type"])
    if not cal["is_valid"]:
        raise SystemExit(f"Calibration for {scan['file']} is not valid: {cal['validation_error']}")
    cal.update(
        image_width_px=scan["width_px"],
        image_height_px=scan["height_px"],
        marker_centre_px=scan["marker_centre_px"],
        calibrated_at=datetime.now(timezone.utc).isoformat(),
        source="marker_in_image",
        basis=scan["basis"],
    )
    return cal


def upload_image(client, local: Path, storage_path: str) -> None:
    if not local.exists():
        raise SystemExit(f"Scan file not found: {local}  (run scripts/make_calibrated_scans.py first)")
    try:
        client.storage.from_("imaging").upload(
            path=storage_path, file=local.read_bytes(), file_options={"content-type": "image/jpeg", "upsert": "true"}
        )
        print(f"  uploaded {local.name} -> imaging/{storage_path}")
    except Exception as e:  # an existing object is fine: upsert is requested but some clients still raise
        print(f"  [info] upload result for {storage_path}: {e}")


# ---------------------------------------------------------------------------------------------------
# Wipe
# ---------------------------------------------------------------------------------------------------
def backup_case_tables(cur) -> Path:
    out = {}
    for table in CASE_TABLES:
        cur.execute(f"SELECT * FROM {table}")
        out[table] = cur.fetchall()
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    path = BACKEND_DIR / f"db_backup_case_library_{stamp}.json"
    path.write_text(json.dumps(out, indent=2, default=str), encoding="utf-8")
    return path


def wipe_case_library(cur, sessions: str) -> None:
    cur.execute("SELECT count(*) AS n FROM public.sessions WHERE case_id IS NOT NULL")
    linked = cur.fetchone()["n"]
    print(f"Sessions pointing at a case: {linked} -> {sessions}")
    if sessions == "delete":
        cur.execute("DELETE FROM public.sessions WHERE case_id IS NOT NULL")
    else:
        cur.execute("UPDATE public.sessions SET case_id = NULL WHERE case_id IS NOT NULL")
    # cases <-> case_versions point at each other; break that first
    cur.execute("UPDATE cases SET draft_version_id = NULL, published_version_id = NULL")
    cur.execute("DELETE FROM assessment_criteria")
    cur.execute("DELETE FROM case_versions")  # cascades imaging and reference plans
    cur.execute("DELETE FROM cases")  # cascades case_programs and cohort assignments
    for table in ("cases", "case_versions", "case_imaging", "assessment_criteria", "case_programs", "cohort_case_assignments"):
        cur.execute(f"SELECT count(*) AS n FROM {table}")
        print(f"  {table}: {cur.fetchone()['n']} rows left")


# ---------------------------------------------------------------------------------------------------
# Seed
# ---------------------------------------------------------------------------------------------------
def seed_case(cur, client, manifest: dict, case: dict, ctx: dict) -> None:
    cid, vid = str(case["case_id"]), str(case["version_id"])
    now = datetime.now(timezone.utc)
    print(f"\nSeeding {case['name']}")

    cur.execute(
        """
        INSERT INTO cases (id, institution_id, procedure_id, name, difficulty, description, learning_objective,
                           status, version, draft_version_id, published_version_id, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, 'active', 1, NULL, NULL, %s, %s)
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, difficulty = EXCLUDED.difficulty,
            description = EXCLUDED.description, learning_objective = EXCLUDED.learning_objective,
            draft_version_id = NULL, status = 'active', updated_at = EXCLUDED.updated_at
        """,
        (cid, ctx["institution_id"], ctx["procedure_id"], case["name"], case["difficulty"],
         case["description"], case["learning_objective"], now, now),
    )
    cur.execute(
        """
        INSERT INTO case_versions (id, case_id, version_number, title, pathology, pathology_label, side, difficulty,
                                   description, patient, objectives, status, is_immutable, created_by, created_at, published_at)
        VALUES (%s, %s, 1, %s, %s, %s, %s, %s, %s, %s, %s, 'published', true, %s, %s, %s)
        ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, pathology_label = EXCLUDED.pathology_label,
            side = EXCLUDED.side, difficulty = EXCLUDED.difficulty, description = EXCLUDED.description,
            patient = EXCLUDED.patient, objectives = EXCLUDED.objectives, status = 'published',
            is_immutable = true, published_at = EXCLUDED.published_at
        """,
        (vid, cid, case["name"], case["pathology"], case["pathology_label"], case["side"], case["difficulty"],
         case["description"], json.dumps(case["patient"]), json.dumps(case["objectives"]),
         ctx["instructor_id"], now, now),
    )
    cur.execute("UPDATE cases SET published_version_id = %s, draft_version_id = NULL WHERE id = %s", (vid, cid))

    # Imaging: one row per view, each with ITS OWN scale.
    cur.execute("DELETE FROM case_imaging WHERE case_version_id = %s", (vid,))
    scales = {}
    for view, scan_key in case["scans"].items():
        scan = manifest[scan_key]
        storage_path = f"cases/{cid}/{view.lower()}.jpg"
        local = PUBLIC_DIR / scan["file"]
        upload_image(client, local, storage_path)
        cal = calibration_for(scan)
        scales[view] = cal["calculated_scale_mm_per_px"]
        print(f"  {view}: {scan['width_px']}x{scan['height_px']}  marker {scan['marker_px']} px = {scan['marker_mm']} mm -> {scales[view]} mm/px")
        cur.execute(
            """
            INSERT INTO case_imaging (case_version_id, view_type, label, storage_path, filename, mimetype, file_size,
                                      width, height, laterality, calibration)
            VALUES (%s, %s, %s, %s, %s, 'image/jpeg', %s, %s, %s, %s, %s)
            """,
            (vid, view, VIEW_LABEL[view], storage_path, local.name, local.stat().st_size,
             scan["width_px"], scan["height_px"], case["side"], json.dumps(cal)),
        )

    cur.execute("DELETE FROM case_version_reference_plan WHERE case_version_id = %s", (vid,))
    cur.execute(
        """
        INSERT INTO case_version_reference_plan (case_version_id, assessment, tibial_component, femoral_component,
                                                 instructor_notes, calculation_metadata)
        VALUES (%s, %s, %s, %s, %s, %s)
        """,
        (vid, json.dumps(case["assessment"]), json.dumps(case["tibial"]), json.dumps(case["femoral"]), case["notes"],
         json.dumps({"method": "radio_opaque_marker", "version": "1.0.0", "calibrated_scale_mm_per_px": scales})),
    )

    cur.execute("DELETE FROM assessment_criteria WHERE case_version_id = %s", (vid,))
    rows = [
        (cid, vid, ctx["skills"]["bone"], name, param, case["assessment"][param], tol, tol, unit, json.dumps(rule))
        for name, param, unit, tol, rule in CRITERIA
    ]
    for name, param in SIZE_CRITERIA:
        rows.append((cid, vid, ctx["skills"]["trial"], name, param, case["sizes"][param], 0.0, 0.0, "size",
                     json.dumps({"minor": 1.0, "major": 2.0, "critical": 3.0})))
    for r in rows:
        cur.execute(
            """
            INSERT INTO assessment_criteria (case_id, case_version_id, skill_id, name, parameter, target_value,
                                             tolerance_min, tolerance_max, unit, severity_rule, version)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 1)
            """,
            r,
        )
    for pid in ctx["program_ids"]:
        cur.execute("INSERT INTO case_programs (case_id, program_id) VALUES (%s, %s) ON CONFLICT DO NOTHING", (cid, str(pid)))


def context(cur) -> dict:
    cur.execute("SELECT id FROM institutions LIMIT 1")
    inst = cur.fetchone()
    if not inst:
        raise SystemExit("No institution found in the database.")
    cur.execute("SELECT id FROM procedures LIMIT 1")
    proc = cur.fetchone()
    cur.execute("SELECT id FROM users WHERE role = 'instructor' LIMIT 1")
    instr = cur.fetchone()
    cur.execute("SELECT id FROM programs WHERE institution_id = %s", (str(inst["id"]),))
    program_ids = [r["id"] for r in cur.fetchall()]
    cur.execute("SELECT id, name FROM skills WHERE program_id = %s", (str(program_ids[0]),) if program_ids else (None,))
    skills = {r["name"]: r["id"] for r in cur.fetchall()}
    if not skills:
        cur.execute("SELECT id, name FROM skills LIMIT 10")
        skills = {r["name"]: r["id"] for r in cur.fetchall()}
    if not skills:
        raise SystemExit("No skills found to attach the assessment criteria to.")
    first = list(skills.values())[0]
    return dict(
        institution_id=str(inst["id"]),
        procedure_id=str(proc["id"]) if proc else None,
        instructor_id=str(instr["id"]) if instr else None,
        program_ids=program_ids,
        skills=dict(bone=str(skills.get("Bone cuts & alignment") or first), trial=str(skills.get("Trialling & stability") or first)),
    )


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--wipe", action="store_true", help="remove every case from the library first (writes a backup)")
    ap.add_argument("--sessions", choices=["detach", "delete"], help="what to do with sessions that point at a case (required with --wipe)")
    args = ap.parse_args()
    if args.wipe and not args.sessions:
        ap.error("--wipe needs --sessions detach|delete")

    manifest = load_manifest()
    client = get_service_client()
    conn = get_db_conn()
    try:
        with conn.cursor() as cur:
            if args.wipe:
                print("Backup written to", backup_case_tables(cur))
                wipe_case_library(cur, args.sessions)
            ctx = context(cur)
            for case in CASES:
                seed_case(cur, client, manifest, case, ctx)
        conn.commit()
        print("\nSeeded", len(CASES), "cases.")
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
