"""
Case library service for MediVeR-XR.

Implements:
- Explicit draft vs published version management (draft = mutable, published = immutable).
- Learner presentation layer isolation (reference plan and answer key strictly excluded).
- Program-scoped access for learners.
- On-demand signed URL generation for private Supabase imaging storage.
- Pre-flight validation checklist for case publishing.
"""

from typing import List, Dict, Any, Optional, Tuple
from uuid import UUID, uuid4
from datetime import datetime, timezone
import json

from db.session import get_db_conn, get_service_client
from core.calculations import (
    calculate_calibration,
    evaluate_tibial_fit,
    evaluate_femoral_fit,
    suggest_tibial_size,
    suggest_femoral_size,
    TIBIAL_SIZES_CATALOG,
    FEMORAL_SIZES_CATALOG,
)
from schemas.cases import (
    CaseCreate,
    CaseUpdate,
    ReferencePlan,
    CaseImagingCreate,
    AssessmentCriterionItem,
)


def _generate_signed_url(storage_path: str, expires_in: int = 3600) -> Optional[str]:
    """Generates a temporary signed URL for private Supabase storage at retrieval time."""
    if not storage_path:
        return None
    try:
        service_client = get_service_client()
        res = service_client.storage.from_("imaging").create_signed_url(storage_path, expires_in)
        if isinstance(res, dict) and "signedURL" in res:
            return res["signedURL"]
        elif hasattr(res, "signed_url"):
            return res.signed_url
        return None
    except Exception as e:
        # If storage path cannot be resolved or offline, return None gracefully
        return None


def validate_case_version_for_publishing(
    version_row: Dict[str, Any],
    imaging_rows: List[Dict[str, Any]],
    reference_plan_row: Optional[Dict[str, Any]],
    criteria_rows: List[Dict[str, Any]],
) -> Tuple[bool, List[str]]:
    """
    Pre-flight checklist validation before a draft version can be published.
    """
    errors: List[str] = []

    # 1. Metadata check
    if not version_row.get("title") or not str(version_row.get("title")).strip():
        errors.append("Case title is required.")
    side_val = str(version_row.get("side") or "").upper()
    if side_val not in ("RIGHT", "LEFT"):
        errors.append("Operative side (RIGHT or LEFT) is required.")
    if not version_row.get("pathology"):
        errors.append("Pathology classification is required.")

    # 2. Imaging check: must have both FLAP and KLAT
    has_flap = any(img.get("view_type") == "FLAP" for img in imaging_rows)
    has_klat = any(img.get("view_type") == "KLAT" for img in imaging_rows)
    if not has_flap:
        errors.append("At least one Full Leg Anteroposterior (FLAP) radiograph is required.")
    if not has_klat:
        errors.append("At least one Knee Lateral (KLAT) radiograph is required.")

    # 3. Dynamic calibration check
    for img in imaging_rows:
        cal = img.get("calibration") or {}
        if not cal.get("is_valid"):
            view = img.get("view_type", "Image")
            err_msg = cal.get("validation_error") or "Missing or invalid calibration scale."
            errors.append(f"{view} calibration error: {err_msg}")

    # 4. Reference plan check
    if not reference_plan_row:
        errors.append("An authoritative reference plan is required before publishing.")
    else:
        assess = reference_plan_row.get("assessment") or {}
        required_measurements = ["MAD_mm", "AMA_deg", "mHKA_deg", "MPTA_deg", "LDFA_deg", "PTS_deg"]
        for m in required_measurements:
            if m not in assess or assess[m] is None:
                errors.append(f"Reference assessment measurement '{m}' is missing.")

        tibial = reference_plan_row.get("tibial_component") or {}
        if not tibial.get("implant_size") or tibial.get("implant_size") < 1 or tibial.get("implant_size") > 6:
            errors.append("Valid tibial component sizing (Sizes 1-6) is required.")

        femoral = reference_plan_row.get("femoral_component") or {}
        if not femoral.get("implant_size") or femoral.get("implant_size") < 1 or femoral.get("implant_size") > 8:
            errors.append("Valid femoral component sizing (Sizes 1-8) is required.")

    # 5. Assessment criteria check
    if not criteria_rows:
        errors.append("At least one assessment criterion must be linked to an institutional skill.")

    return len(errors) == 0, errors


# ---------------------------------------------------------------------------
# Instructor Queries (Full Detail)
# ---------------------------------------------------------------------------

def get_institution_cases(institution_id: UUID) -> List[Dict[str, Any]]:
    """Lists all cases for an institution with draft/published version IDs and linked programs."""
    conn = get_db_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT 
                    c.id, c.name, c.difficulty, c.description, c.learning_objective,
                    c.status, c.version, c.institution_id, c.draft_version_id, c.published_version_id,
                    c.created_at, c.updated_at,
                    COALESCE(
                        json_agg(cp.program_id) FILTER (WHERE cp.program_id IS NOT NULL),
                        '[]'::json
                    ) AS program_ids
                FROM cases c
                LEFT JOIN case_programs cp ON cp.case_id = c.id
                WHERE c.institution_id = %s
                GROUP BY c.id
                ORDER BY c.updated_at DESC
                """,
                (str(institution_id),)
            )
            rows = cur.fetchall()
            return [dict(r) for r in rows]
    finally:
        conn.close()


def get_instructor_case_detail(case_id: UUID, institution_id: Optional[UUID] = None) -> Optional[Dict[str, Any]]:
    """
    Returns full instructor-facing case details including:
    - Active draft or published version
    - Radiographs with dynamically generated signed URLs
    - Authoritative Reference Plan
    - Assessment Criteria linked to rubric
    - Pre-flight checklist status
    """
    conn = get_db_conn()
    try:
        with conn.cursor() as cur:
            # 1. Fetch case row
            cur.execute(
                """
                SELECT id, institution_id, program_id, procedure_id, name, difficulty,
                       description, learning_objective, status, version, draft_version_id,
                       published_version_id, created_at, updated_at
                FROM cases
                WHERE id = %s
                """,
                (str(case_id),)
            )
            case_row = cur.fetchone()
            if not case_row:
                return None
            case_data = dict(case_row)

            # Check institution if specified
            if institution_id and case_data["institution_id"] and str(case_data["institution_id"]) != str(institution_id):
                return None

            # 2. Fetch associated programs
            cur.execute("SELECT program_id FROM case_programs WHERE case_id = %s", (str(case_id),))
            case_data["program_ids"] = [r["program_id"] for r in cur.fetchall()]

            # Determine active version to display: prefer draft if editing, otherwise published
            active_version_id = case_data["draft_version_id"] or case_data["published_version_id"]
            if not active_version_id:
                # Fallback to newest version for this case
                cur.execute(
                    "SELECT id FROM case_versions WHERE case_id = %s ORDER BY version_number DESC LIMIT 1",
                    (str(case_id),)
                )
                v_res = cur.fetchone()
                if v_res:
                    active_version_id = v_res["id"]

            active_version = None
            imaging_list = []
            ref_plan = None
            criteria_list = []

            if active_version_id:
                # 3. Fetch version row
                cur.execute(
                    """
                    SELECT id, case_id, version_number, title, pathology, pathology_label,
                           side, difficulty, description, patient, objectives, status,
                           is_immutable, created_at, published_at
                    FROM case_versions
                    WHERE id = %s
                    """,
                    (str(active_version_id),)
                )
                v_row = cur.fetchone()
                if v_row:
                    active_version = dict(v_row)

                # 4. Fetch imaging rows
                cur.execute(
                    """
                    SELECT id, case_version_id, view_type, label, storage_path,
                           filename, mimetype, file_size, width, height, laterality,
                           calibration, created_at
                    FROM case_imaging
                    WHERE case_version_id = %s
                    ORDER BY created_at ASC
                    """,
                    (str(active_version_id),)
                )
                for img_row in cur.fetchall():
                    img_dict = dict(img_row)
                    img_dict["signed_url"] = _generate_signed_url(img_dict["storage_path"])
                    imaging_list.append(img_dict)

                # 5. Fetch reference plan
                cur.execute(
                    """
                    SELECT id, case_version_id, assessment, tibial_component, femoral_component,
                           scoring_criteria, instructor_notes, calculation_metadata, created_at
                    FROM case_version_reference_plan
                    WHERE case_version_id = %s
                    """,
                    (str(active_version_id),)
                )
                rp_row = cur.fetchone()
                if rp_row:
                    ref_plan = dict(rp_row)

                # 6. Fetch criteria
                cur.execute(
                    """
                    SELECT id, skill_id, name, parameter, target_value,
                           tolerance_min, tolerance_max, unit, severity_rule
                    FROM assessment_criteria
                    WHERE case_version_id = %s
                    ORDER BY name ASC
                    """,
                    (str(active_version_id),)
                )
                criteria_list = [dict(c) for c in cur.fetchall()]

            # 7. Evaluate pre-flight publish checklist
            is_publishable, val_errors = validate_case_version_for_publishing(
                active_version or {},
                imaging_list,
                ref_plan,
                criteria_list,
            )

            case_data["active_version"] = active_version
            case_data["imaging"] = imaging_list
            case_data["reference_plan"] = ref_plan
            case_data["criteria"] = criteria_list
            case_data["validation_errors"] = val_errors
            case_data["is_publishable"] = is_publishable

            return case_data
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Learner Queries (Sanitized Presentation Layer)
# ---------------------------------------------------------------------------

def get_learner_cases(user_id: UUID) -> List[Dict[str, Any]]:
    """
    Lists published/active cases that the learner is authorized to access
    via enrolled programs or direct cohort assignments.
    """
    conn = get_db_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT DISTINCT
                    c.id, c.name, c.difficulty, c.description, c.learning_objective,
                    c.status, c.version, c.published_version_id, c.created_at, c.updated_at
                FROM cases c
                JOIN case_programs cp ON cp.case_id = c.id
                JOIN cohorts co ON co.program_id = cp.program_id
                JOIN cohort_members cm ON cm.cohort_id = co.id
                WHERE cm.user_id = %s
                  AND c.status = 'active'
                  AND c.published_version_id IS NOT NULL
                ORDER BY c.name ASC
                """,
                (str(user_id),)
            )
            return [dict(r) for r in cur.fetchall()]
    finally:
        conn.close()


def get_learner_case_detail(case_id: UUID, user_id: Optional[UUID] = None) -> Optional[Dict[str, Any]]:
    """
    Sanitized case view for learners.
    STRICT SECURITY RULE:
    The reference plan, answer keys, scoring criteria, and instructor notes
    are completely omitted from the query and response.
    """
    conn = get_db_conn()
    try:
        with conn.cursor() as cur:
            # Check authorization if user_id is provided
            if user_id:
                cur.execute(
                    """
                    SELECT 1
                    FROM cases c
                    JOIN case_programs cp ON cp.case_id = c.id
                    JOIN cohorts co ON co.program_id = cp.program_id
                    JOIN cohort_members cm ON cm.cohort_id = co.id
                    WHERE c.id = %s AND cm.user_id = %s
                      AND c.status = 'active'
                      AND c.published_version_id IS NOT NULL
                    """,
                    (str(case_id), str(user_id))
                )
                if not cur.fetchone():
                    return None

            # Fetch case and published version
            cur.execute(
                """
                SELECT c.id, c.name, c.difficulty, c.description, c.learning_objective,
                       c.status, c.version, c.procedure_id, c.published_version_id,
                       cv.title, cv.pathology, cv.pathology_label, cv.side, cv.patient, cv.objectives
                FROM cases c
                JOIN case_versions cv ON cv.id = c.published_version_id
                WHERE c.id = %s
                """,
                (str(case_id),)
            )
            row = cur.fetchone()
            if not row:
                return None
            data = dict(row)

            # Fetch imaging with signed URLs
            cur.execute(
                """
                SELECT id, case_version_id, view_type, label, storage_path,
                       filename, mimetype, file_size, width, height, laterality,
                       calibration, created_at
                FROM case_imaging
                WHERE case_version_id = %s
                ORDER BY created_at ASC
                """,
                (str(data["published_version_id"]),)
            )
            imaging_list = []
            for img_row in cur.fetchall():
                img_dict = dict(img_row)
                img_dict["signed_url"] = _generate_signed_url(img_dict["storage_path"])
                imaging_list.append(img_dict)

            data["imaging"] = imaging_list
            return data
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Authoring Operations (CRUD & Publishing)
# ---------------------------------------------------------------------------

def create_case(case_in: CaseCreate, instructor_id: UUID, institution_id: UUID) -> Dict[str, Any]:
    """
    Creates a new case with an initial draft version (v1).
    Draft versions are mutable (is_immutable = False).
    """
    conn = get_db_conn()
    try:
        with conn.cursor() as cur:
            # 1. Resolve procedure_id if not supplied (default to TKR procedure)
            proc_id = case_in.procedure_id
            if not proc_id:
                cur.execute("SELECT id FROM procedures LIMIT 1")
                proc_row = cur.fetchone()
                proc_id = proc_row["id"] if proc_row else None

            case_id = uuid4()
            version_id = uuid4()

            # 2. Insert case record with NULL draft_version_id to satisfy foreign key
            cur.execute(
                """
                INSERT INTO cases (
                    id, institution_id, procedure_id, name, difficulty,
                    description, learning_objective, status, version, draft_version_id
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, 'draft', 1, NULL)
                RETURNING id, name, status, draft_version_id, published_version_id
                """,
                (
                    str(case_id), str(institution_id), str(proc_id), case_in.name,
                    case_in.difficulty, case_in.description, case_in.learning_objective
                )
            )

            # 3. Insert initial draft case_version
            cur.execute(
                """
                INSERT INTO case_versions (
                    id, case_id, version_number, title, pathology, pathology_label,
                    side, difficulty, description, patient, objectives, status,
                    is_immutable, created_by
                ) VALUES (%s, %s, 1, %s, %s, %s, %s, %s, %s, %s, %s, 'draft', false, %s)
                """,
                (
                    str(version_id), str(case_id), case_in.name, case_in.pathology,
                    case_in.pathology_label, case_in.side, case_in.difficulty,
                    case_in.description, json.dumps(case_in.patient or {}),
                    json.dumps(case_in.objectives or []), str(instructor_id)
                )
            )

            # 3b. Point cases.draft_version_id to the created case_version
            cur.execute(
                "UPDATE cases SET draft_version_id = %s WHERE id = %s",
                (str(version_id), str(case_id))
            )

            # 4. Insert program curriculum associations
            if case_in.program_ids:
                for p_id in case_in.program_ids:
                    cur.execute(
                        "INSERT INTO case_programs (case_id, program_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                        (str(case_id), str(p_id))
                    )

            # 5. Insert imaging
            if case_in.imaging:
                for img in case_in.imaging:
                    cur.execute(
                        """
                        INSERT INTO case_imaging (
                            case_version_id, view_type, label, storage_path,
                            filename, mimetype, file_size, width, height, laterality, calibration
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        (
                            str(version_id), img.view_type, img.label, img.storage_path,
                            img.filename, img.mimetype, img.file_size, img.width, img.height,
                            img.laterality, json.dumps(img.calibration or {})
                        )
                    )

            # 6. Insert reference plan
            if case_in.reference_plan:
                rp = case_in.reference_plan
                cur.execute(
                    """
                    INSERT INTO case_version_reference_plan (
                        case_version_id, assessment, tibial_component, femoral_component,
                        scoring_criteria, instructor_notes, calculation_metadata
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        str(version_id),
                        json.dumps(rp.assessment.model_dump()),
                        json.dumps(rp.tibial_component.model_dump()),
                        json.dumps(rp.femoral_component.model_dump()),
                        json.dumps(rp.scoring_criteria or {}),
                        rp.instructor_notes,
                        json.dumps(rp.calculation_metadata or {"version": "1.0.0"})
                    )
                )

            # 7. Insert assessment criteria
            if case_in.criteria:
                for c in case_in.criteria:
                    cur.execute(
                        """
                        INSERT INTO assessment_criteria (
                            case_id, case_version_id, skill_id, name, parameter,
                            target_value, tolerance_min, tolerance_max, unit, severity_rule, version
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 1)
                        """,
                        (
                            str(case_id), str(version_id), str(c.skill_id), c.name,
                            c.parameter, c.target_value, c.tolerance_min, c.tolerance_max,
                            c.unit, json.dumps(c.severity_rule or {})
                        )
                    )

            conn.commit()
            return get_instructor_case_detail(case_id, institution_id)
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def update_case(case_id: UUID, case_in: CaseUpdate, instructor_id: UUID, institution_id: UUID) -> Dict[str, Any]:
    """
    Updates a case.
    RULE 2: Draft versions are mutable. Published versions are immutable.
    If no draft exists (e.g. editing an already published version), branches into a new mutable draft version.
    """
    conn = get_db_conn()
    try:
        with conn.cursor() as cur:
            # 1. Fetch current case record
            cur.execute(
                "SELECT id, draft_version_id, published_version_id, version FROM cases WHERE id = %s",
                (str(case_id),)
            )
            c_row = cur.fetchone()
            if not c_row:
                raise ValueError("Case not found.")

            draft_id = c_row["draft_version_id"]

            if not draft_id:
                # Branch new draft version from published or last version
                cur.execute(
                    "SELECT MAX(version_number) as max_v FROM case_versions WHERE case_id = %s",
                    (str(case_id),)
                )
                max_v = cur.fetchone()["max_v"] or 1
                new_v_num = max_v + 1
                draft_id = uuid4()

                # Source data from published version
                cur.execute(
                    """
                    SELECT title, pathology, pathology_label, side, difficulty, description, patient, objectives
                    FROM case_versions WHERE id = %s
                    """,
                    (str(c_row["published_version_id"]),)
                )
                source_v = cur.fetchone() or {}

                cur.execute(
                    """
                    INSERT INTO case_versions (
                        id, case_id, version_number, title, pathology, pathology_label,
                        side, difficulty, description, patient, objectives, status,
                        is_immutable, created_by
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'draft', false, %s)
                    """,
                    (
                        str(draft_id), str(case_id), new_v_num,
                        case_in.name or source_v.get("title", "Draft"),
                        case_in.pathology or source_v.get("pathology"),
                        case_in.pathology_label or source_v.get("pathology_label"),
                        case_in.side or source_v.get("side"),
                        case_in.difficulty or source_v.get("difficulty", "intermediate"),
                        case_in.description or source_v.get("description"),
                        json.dumps(case_in.patient if case_in.patient is not None else source_v.get("patient", {})),
                        json.dumps(case_in.objectives if case_in.objectives is not None else source_v.get("objectives", [])),
                        str(instructor_id)
                    )
                )

                # Point case to new draft version
                cur.execute(
                    "UPDATE cases SET draft_version_id = %s, updated_at = NOW() WHERE id = %s",
                    (str(draft_id), str(case_id))
                )
            else:
                # Mutate existing draft version
                cur.execute(
                    """
                    UPDATE case_versions
                    SET title = COALESCE(%s, title),
                        pathology = COALESCE(%s, pathology),
                        pathology_label = COALESCE(%s, pathology_label),
                        side = COALESCE(%s, side),
                        difficulty = COALESCE(%s, difficulty),
                        description = COALESCE(%s, description),
                        patient = CASE WHEN %s IS NOT NULL THEN %s::jsonb ELSE patient END,
                        objectives = CASE WHEN %s IS NOT NULL THEN %s::jsonb ELSE objectives END
                    WHERE id = %s AND is_immutable = false
                    """,
                    (
                        case_in.name, case_in.pathology, case_in.pathology_label, case_in.side,
                        case_in.difficulty, case_in.description,
                        json.dumps(case_in.patient) if case_in.patient is not None else None,
                        json.dumps(case_in.patient) if case_in.patient is not None else None,
                        json.dumps(case_in.objectives) if case_in.objectives is not None else None,
                        json.dumps(case_in.objectives) if case_in.objectives is not None else None,
                        str(draft_id)
                    )
                )

            # Update top-level case info
            cur.execute(
                """
                UPDATE cases
                SET name = COALESCE(%s, name),
                    difficulty = COALESCE(%s, difficulty),
                    description = COALESCE(%s, description),
                    learning_objective = COALESCE(%s, learning_objective),
                    updated_at = NOW()
                WHERE id = %s
                """,
                (case_in.name, case_in.difficulty, case_in.description, case_in.learning_objective, str(case_id))
            )

            # Update programs if supplied
            if case_in.program_ids is not None:
                cur.execute("DELETE FROM case_programs WHERE case_id = %s", (str(case_id),))
                for p_id in case_in.program_ids:
                    cur.execute(
                        "INSERT INTO case_programs (case_id, program_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                        (str(case_id), str(p_id))
                    )

            # Update imaging if provided
            if case_in.imaging is not None:
                cur.execute("DELETE FROM case_imaging WHERE case_version_id = %s", (str(draft_id),))
                for img in case_in.imaging:
                    cur.execute(
                        """
                        INSERT INTO case_imaging (
                            case_version_id, view_type, label, storage_path,
                            filename, mimetype, file_size, width, height, laterality, calibration
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        (
                            str(draft_id), img.view_type, img.label, img.storage_path,
                            img.filename, img.mimetype, img.file_size, img.width, img.height,
                            img.laterality, json.dumps(img.calibration or {})
                        )
                    )

            # Update reference plan if provided
            if case_in.reference_plan is not None:
                rp = case_in.reference_plan
                cur.execute("DELETE FROM case_version_reference_plan WHERE case_version_id = %s", (str(draft_id),))
                cur.execute(
                    """
                    INSERT INTO case_version_reference_plan (
                        case_version_id, assessment, tibial_component, femoral_component,
                        scoring_criteria, instructor_notes, calculation_metadata
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        str(draft_id),
                        json.dumps(rp.assessment.model_dump()),
                        json.dumps(rp.tibial_component.model_dump()),
                        json.dumps(rp.femoral_component.model_dump()),
                        json.dumps(rp.scoring_criteria or {}),
                        rp.instructor_notes,
                        json.dumps(rp.calculation_metadata or {"version": "1.0.0"})
                    )
                )

            # Update criteria if provided
            if case_in.criteria is not None:
                cur.execute("DELETE FROM assessment_criteria WHERE case_version_id = %s", (str(draft_id),))
                for c in case_in.criteria:
                    cur.execute(
                        """
                        INSERT INTO assessment_criteria (
                            case_id, case_version_id, skill_id, name, parameter,
                            target_value, tolerance_min, tolerance_max, unit, severity_rule, version
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 1)
                        """,
                        (
                            str(case_id), str(draft_id), str(c.skill_id), c.name,
                            c.parameter, c.target_value, c.tolerance_min, c.tolerance_max,
                            c.unit, json.dumps(c.severity_rule or {})
                        )
                    )

            conn.commit()
            return get_instructor_case_detail(case_id, institution_id)
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def publish_case_version(case_id: UUID, institution_id: Optional[UUID] = None) -> Dict[str, Any]:
    """
    Validates draft version against pre-flight checklist.
    On success:
    - Marks version as published, immutable (is_immutable = true).
    - Sets cases.published_version_id = draft_version_id.
    - Sets cases.status = 'active'.
    - Clears cases.draft_version_id = NULL.
    """
    conn = get_db_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, draft_version_id, status FROM cases WHERE id = %s",
                (str(case_id),)
            )
            c_row = cur.fetchone()
            if not c_row:
                raise ValueError("Case not found.")

            draft_id = c_row["draft_version_id"]
            if not draft_id:
                raise ValueError("No active draft version to publish.")

            # Fetch draft data for validation
            cur.execute("SELECT * FROM case_versions WHERE id = %s", (str(draft_id),))
            v_row = cur.fetchone()
            cur.execute("SELECT * FROM case_imaging WHERE case_version_id = %s", (str(draft_id),))
            img_rows = [dict(r) for r in cur.fetchall()]
            cur.execute("SELECT * FROM case_version_reference_plan WHERE case_version_id = %s", (str(draft_id),))
            rp_row = cur.fetchone()
            cur.execute("SELECT * FROM assessment_criteria WHERE case_version_id = %s", (str(draft_id),))
            crit_rows = [dict(r) for r in cur.fetchall()]

            is_valid, errors = validate_case_version_for_publishing(
                dict(v_row) if v_row else {},
                img_rows,
                dict(rp_row) if rp_row else None,
                crit_rows,
            )

            if not is_valid:
                raise ValueError(f"Publish validation failed: {'; '.join(errors)}")

            now = datetime.now(timezone.utc)

            # Freeze version
            cur.execute(
                """
                UPDATE case_versions
                SET status = 'published',
                    is_immutable = true,
                    published_at = %s
                WHERE id = %s
                """,
                (now, str(draft_id))
            )

            # Update case pointers
            cur.execute(
                """
                UPDATE cases
                SET published_version_id = %s,
                    draft_version_id = NULL,
                    status = 'active',
                    version = version + 1,
                    updated_at = %s
                WHERE id = %s
                """,
                (str(draft_id), now, str(case_id))
            )

            conn.commit()
            return get_instructor_case_detail(case_id, institution_id)
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def deactivate_case(case_id: UUID, institution_id: Optional[UUID] = None) -> Dict[str, Any]:
    """Deactivates an active case (status = 'inactive') without deleting data."""
    conn = get_db_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE cases SET status = 'inactive', updated_at = NOW() WHERE id = %s RETURNING id",
                (str(case_id),)
            )
            if not cur.fetchone():
                raise ValueError("Case not found.")
            conn.commit()
            return get_instructor_case_detail(case_id, institution_id)
    finally:
        conn.close()
