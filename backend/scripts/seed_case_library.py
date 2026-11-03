"""
Seed script for the MediVeR-XR Case Library.

Each case is two calibrated radiographs (full-leg AP "FLAP" and knee lateral "KLAT") plus the clinical
detail, reference plan and assessment criteria that go with them. All of it comes from
`case_library.json`, which `dashboard/scripts/case-library/make_case_library.ts` writes:

  * the scans are synthetic films drawn from a geometric leg model, each with a 25 mm sphere drawn at
    exactly 25 mm through the film's own scale (and checked on the saved JPEG with the planner's detector);
  * the reference measurements are the planner's own measurement of the constructed landmarks, so a correct
    plan reproduces them exactly;
  * the reference implant sizes and fit are the planner's own ranking and auto-fit on the constructed bone.

Nothing clinical is typed in this file. To change a case, edit `cases.ts` and run the generator.

Usage (from the backend folder):
    python scripts/seed_case_library.py                         add or refresh the library cases
    python scripts/seed_case_library.py --wipe --sessions detach   first remove EVERY library case
    python scripts/seed_case_library.py --wipe --sessions delete

`--wipe` always writes a JSON backup first (case tables, the sessions that point at a case, and the training
assignments that name one). Sessions that point at a case block its removal, so --wipe needs --sessions:
`detach` keeps the sessions and clears their case, `delete` removes them. Training assignments that name a
removed case are deleted with `--sessions delete` and kept (pointing at nothing) with `detach`.
Learners' personal cases are a different table and are never touched. Image binaries already in storage are
left alone.
"""

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))
load_dotenv(BACKEND_DIR / ".env")

from db.session import get_db_conn, get_service_client  # noqa: E402
from core.calculations import calculate_calibration  # noqa: E402

WORKSPACE_ROOT = BACKEND_DIR.parent
PUBLIC_DIR = WORKSPACE_ROOT / "dashboard" / "public"
LIBRARY = Path(__file__).resolve().parent / "case_library.json"

CASE_TABLES = [
    "cases", "case_versions", "case_imaging", "case_version_reference_plan",
    "assessment_criteria", "case_programs", "cohort_case_assignments",
]

VIEW_LABEL = {"FLAP": "Full Leg Anteroposterior (FLAP)", "KLAT": "Knee Lateral (KLAT)"}

from case_criteria import CRITERIA, DEG, SIZE_CRITERIA  # noqa: E402,F401


def load_library() -> list:
    doc = json.loads(LIBRARY.read_text(encoding="utf-8"))
    return doc["cases"]


def calibration_for(scan: dict) -> dict:
    """The generator's calibration record, checked against the backend's own derivation from the marker."""
    cal = dict(scan["calibration"])
    own = calculate_calibration(cal["physical_marker_diameter_mm"], cal["detected_marker_pixel_diameter"], cal["marker_type"])
    if not own["is_valid"]:
        raise SystemExit(f"Calibration for {scan['file']} is not valid: {own['validation_error']}")
    if abs(own["calculated_scale_mm_per_px"] - scan["mm_per_px"]) > 1e-6:
        raise SystemExit(
            f"Calibration for {scan['file']} disagrees: backend {own['calculated_scale_mm_per_px']} vs drawn {scan['mm_per_px']} mm/px"
        )
    cal["calculated_scale_mm_per_px"] = own["calculated_scale_mm_per_px"]
    cal["calibrated_at"] = datetime.now(timezone.utc).isoformat()
    return cal


def upload_image(client, local: Path, storage_path: str) -> None:
    if not local.exists():
        raise SystemExit(f"Scan file not found: {local}  (run dashboard/scripts/case-library/make_case_library.ts first)")
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
    cur.execute("SELECT * FROM public.sessions WHERE case_id IS NOT NULL")
    out["sessions_with_case"] = cur.fetchall()
    cur.execute("SELECT * FROM training_assignments WHERE case_id IN (SELECT id::text FROM cases)")
    out["training_assignments_with_case"] = cur.fetchall()
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    path = BACKEND_DIR / f"db_backup_case_library_{stamp}.json"
    path.write_text(json.dumps(out, indent=2, default=str), encoding="utf-8")
    return path


def wipe_case_library(cur, sessions: str) -> None:
    cur.execute("SELECT count(*) AS n FROM public.sessions WHERE case_id IS NOT NULL")
    linked = cur.fetchone()["n"]
    print(f"Sessions pointing at a case: {linked} -> {sessions}")
    cur.execute("SELECT count(*) AS n FROM training_assignments WHERE case_id IN (SELECT id::text FROM cases)")
    assigned = cur.fetchone()["n"]
    if sessions == "delete":
        cur.execute("DELETE FROM public.sessions WHERE case_id IS NOT NULL")
        cur.execute("DELETE FROM training_assignments WHERE case_id IN (SELECT id::text FROM cases)")
        print(f"Training assignments naming a library case: {assigned} -> deleted")
    else:
        cur.execute("UPDATE public.sessions SET case_id = NULL WHERE case_id IS NOT NULL")
        print(f"Training assignments naming a library case: {assigned} -> kept (they will name a removed case)")
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
def seed_case(cur, client, case: dict, ctx: dict) -> None:
    cid, vid = case["case_id"], case["version_id"]
    now = datetime.now(timezone.utc)
    print(f"\nSeeding {case['title']}")

    cur.execute(
        """
        INSERT INTO cases (id, institution_id, procedure_id, name, difficulty, description, learning_objective,
                           status, version, draft_version_id, published_version_id, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, 'active', 1, NULL, NULL, %s, %s)
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, difficulty = EXCLUDED.difficulty,
            description = EXCLUDED.description, learning_objective = EXCLUDED.learning_objective,
            draft_version_id = NULL, status = 'active', updated_at = EXCLUDED.updated_at
        """,
        (cid, ctx["institution_id"], ctx["procedure_id"], case["title"], case["difficulty"],
         case["description"], case["learning_objective"], now, now),
    )
    cur.execute(
        """
        INSERT INTO case_versions (id, case_id, version_number, title, pathology, pathology_label, side, difficulty,
                                   description, patient, objectives, status, is_immutable, created_by, created_at, published_at)
        VALUES (%s, %s, 1, %s, %s, %s, %s, %s, %s, %s, %s, 'published', true, %s, %s, %s)
        ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, pathology = EXCLUDED.pathology,
            pathology_label = EXCLUDED.pathology_label, side = EXCLUDED.side, difficulty = EXCLUDED.difficulty,
            description = EXCLUDED.description, patient = EXCLUDED.patient, objectives = EXCLUDED.objectives,
            status = 'published', is_immutable = true, published_at = EXCLUDED.published_at
        """,
        (vid, cid, case["title"], case["pathology"], case["pathology_label"], case["side"], case["difficulty"],
         case["description"], json.dumps(case["patient"]), json.dumps(case["objectives"]),
         ctx["instructor_id"], now, now),
    )
    cur.execute("UPDATE cases SET published_version_id = %s, draft_version_id = NULL WHERE id = %s", (vid, cid))

    # Imaging: one row per view, each with ITS OWN scale.
    cur.execute("DELETE FROM case_imaging WHERE case_version_id = %s", (vid,))
    scales = {}
    for view in ("FLAP", "KLAT"):
        scan = case["scans"][view]
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

    ref = case["reference"]
    cur.execute("DELETE FROM case_version_reference_plan WHERE case_version_id = %s", (vid,))
    cur.execute(
        """
        INSERT INTO case_version_reference_plan (case_version_id, assessment, tibial_component, femoral_component,
                                                 instructor_notes, calculation_metadata)
        VALUES (%s, %s, %s, %s, %s, %s)
        """,
        (vid, json.dumps(ref["assessment"]), json.dumps(ref["tibial_component"]), json.dumps(ref["femoral_component"]),
         case["notes"],
         json.dumps({
             "method": "radio_opaque_marker",
             "version": "1.0.0",
             "calibrated_scale_mm_per_px": scales,
             "source": "synthetic leg model (dashboard/scripts/case-library)",
             "mad_direction": ref.get("mad_direction"),
             "reference_landmarks": case["landmarks"],
         })),
    )

    cur.execute("DELETE FROM assessment_criteria WHERE case_version_id = %s", (vid,))
    rows = [
        (cid, vid, ctx["skills"]["bone"], name, param, ref["assessment"][param], tol, tol, unit, json.dumps(rule))
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
    ap.add_argument("--wipe", action="store_true", help="remove every library case first (writes a backup)")
    ap.add_argument("--sessions", choices=["detach", "delete"], help="what to do with sessions that point at a case (required with --wipe)")
    args = ap.parse_args()
    if args.wipe and not args.sessions:
        ap.error("--wipe needs --sessions detach|delete")

    cases = load_library()
    client = get_service_client()
    conn = get_db_conn()
    try:
        with conn.cursor() as cur:
            if args.wipe:
                print("Backup written to", backup_case_tables(cur))
                wipe_case_library(cur, args.sessions)
            ctx = context(cur)
            for case in cases:
                seed_case(cur, client, case, ctx)
        conn.commit()
        print("\nSeeded", len(cases), "cases.")
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
