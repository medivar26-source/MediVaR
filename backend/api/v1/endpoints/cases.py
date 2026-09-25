"""
Case endpoints for MediVeR-XR.

Exposes REST APIs for:
- Instructor authoring workflow (drafting, editing, image uploading, checklist validation, publishing, previewing)
- Learner presentation layer (strictly sanitized, program-scoped case access)
"""

from typing import List, Optional, Union
from uuid import UUID, uuid4
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from core.security import get_current_active_user as get_current_user
from core.calculations import calculate_calibration
from db.session import get_service_client, get_db_conn
from schemas.auth import UserProfile
from schemas.cases import (
    CaseListItem,
    CaseDetailResponse,
    LearnerCaseDetailResponse,
    CaseCreate,
    CaseUpdate,
)
from services import cases_service

router = APIRouter()


@router.get("", response_model=List[CaseListItem])
@router.get("/", response_model=List[CaseListItem], include_in_schema=False)
def list_cases(current_user: UserProfile = Depends(get_current_user)):
    """
    List cases accessible to authenticated user:
    - Instructors/Admins: All cases in their institution with versioning pointers.
    - Learners: Published/active cases assigned to their enrolled programs.
    """
    if current_user.role in ("instructor", "admin"):
        return cases_service.get_institution_cases(current_user.institution_id)
    return cases_service.get_learner_cases(current_user.id)


@router.post("", response_model=CaseDetailResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=CaseDetailResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def create_case(
    case_in: CaseCreate,
    current_user: UserProfile = Depends(get_current_user),
):
    """Creates a new case with an initial draft version (Instructor/Admin only)."""
    if current_user.role not in ("instructor", "admin"):
        raise HTTPException(status_code=403, detail="Not authorized to create cases.")

    try:
        case = cases_service.create_case(
            case_in=case_in,
            instructor_id=current_user.id,
            institution_id=current_user.institution_id,
        )
        if not case:
            raise HTTPException(status_code=500, detail="Failed to create case.")
        return case
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{case_id}", response_model=Union[CaseDetailResponse, LearnerCaseDetailResponse])
def get_case(
    case_id: UUID,
    current_user: UserProfile = Depends(get_current_user),
):
    """
    Retrieves case details:
    - Instructors/Admins receive full CaseDetailResponse including reference plan and criteria.
    - Learners receive LearnerCaseDetailResponse (strictly sanitized, reference plan excluded).
    """
    if current_user.role in ("instructor", "admin"):
        case = cases_service.get_instructor_case_detail(case_id, current_user.institution_id)
        if not case:
            raise HTTPException(status_code=404, detail="Case not found or unauthorized.")
        return case

    # Learner access: program-scoped and strictly sanitized
    case = cases_service.get_learner_case_detail(case_id, current_user.id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found or unauthorized.")
    return case


@router.get("/{case_id}/preview", response_model=LearnerCaseDetailResponse)
def preview_case_as_learner(
    case_id: UUID,
    current_user: UserProfile = Depends(get_current_user),
):
    """
    Allows instructors to preview the exact sanitized learner view before or after publishing.
    """
    if current_user.role not in ("instructor", "admin"):
        raise HTTPException(status_code=403, detail="Only instructors can preview cases.")

    case = cases_service.get_learner_case_detail(case_id, user_id=None)
    if not case:
        # If not published yet, generate preview from active draft
        full_case = cases_service.get_instructor_case_detail(case_id, current_user.institution_id)
        if not full_case or not full_case.get("active_version"):
            raise HTTPException(status_code=404, detail="Case draft not found.")
        v = full_case["active_version"]
        return {
            "id": full_case["id"],
            "name": full_case["name"],
            "difficulty": full_case["difficulty"],
            "description": full_case["description"],
            "learning_objective": full_case["learning_objective"],
            "status": full_case["status"],
            "version": full_case["version"],
            "procedure_id": full_case["procedure_id"],
            "published_version_id": v["id"],
            "title": v.get("title") or full_case["name"],
            "pathology": v.get("pathology"),
            "pathology_label": v.get("pathology_label"),
            "side": v.get("side"),
            "patient": v.get("patient") or {},
            "objectives": v.get("objectives") or [],
            "imaging": full_case.get("imaging") or [],
        }
    return case


@router.put("/{case_id}", response_model=CaseDetailResponse)
def update_case(
    case_id: UUID,
    case_in: CaseUpdate,
    current_user: UserProfile = Depends(get_current_user),
):
    """
    Updates a case. Mutates draft version if present, or branches a new draft version
    if updating a published version (Instructor/Admin only).
    """
    if current_user.role not in ("instructor", "admin"):
        raise HTTPException(status_code=403, detail="Not authorized to edit cases.")

    try:
        case = cases_service.update_case(
            case_id=case_id,
            case_in=case_in,
            instructor_id=current_user.id,
            institution_id=current_user.institution_id,
        )
        return case
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{case_id}/publish", response_model=CaseDetailResponse)
def publish_case(
    case_id: UUID,
    current_user: UserProfile = Depends(get_current_user),
):
    """
    Validates pre-flight checklist and freezes active draft into an immutable published version.
    """
    if current_user.role not in ("instructor", "admin"):
        raise HTTPException(status_code=403, detail="Not authorized to publish cases.")

    try:
        case = cases_service.publish_case_version(case_id, current_user.institution_id)
        return case
    except ValueError as ve:
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{case_id}/deactivate", response_model=CaseDetailResponse)
def deactivate_case(
    case_id: UUID,
    current_user: UserProfile = Depends(get_current_user),
):
    """Deactivates a case (Instructor/Admin only)."""
    if current_user.role not in ("instructor", "admin"):
        raise HTTPException(status_code=403, detail="Not authorized.")

    try:
        return cases_service.deactivate_case(case_id, current_user.institution_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/upload-asset")
async def upload_asset(
    file: UploadFile = File(...),
    current_user: UserProfile = Depends(get_current_user),
):
    """
    Generic upload for Case Library assets to Supabase Storage 'imaging' bucket.
    Returns the storage path for the frontend to include in the case payload.
    """
    if current_user.role not in ("instructor", "admin"):
        raise HTTPException(status_code=403, detail="Not authorized to upload assets.")

    contents = await file.read()
    filename = file.filename or "asset.jpg"
    mimetype = file.content_type or "image/jpeg"
    
    # Store in a generic 'temp' or 'assets' path since case_id might not exist yet
    # The storage rules must allow this path. We'll use 'cases/assets/'
    storage_path = f"cases/assets/{uuid4().hex[:8]}_{filename}"

    try:
        service_client = get_service_client()
        service_client.storage.from_("imaging").upload(
            path=storage_path,
            file=contents,
            file_options={"content-type": mimetype}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Storage upload failed: {str(e)}")

    return {"storage_path": storage_path, "filename": filename, "mimetype": mimetype, "file_size": len(contents)}


@router.post("/{case_id}/upload-radiograph", response_model=CaseDetailResponse)
async def upload_radiograph(
    case_id: UUID,
    file: UploadFile = File(...),
    view_type: str = Form(...),  # 'FLAP' or 'KLAT'
    label: str = Form(...),
    marker_diameter_mm: float = Form(25.0),
    marker_pixel_diameter: float = Form(...),
    laterality: Optional[str] = Form(None),
    current_user: UserProfile = Depends(get_current_user),
):
    """
    Uploads a radiograph to private Supabase storage bucket 'imaging', derives calibration,
    and attaches to the case's draft version.
    """
    if current_user.role not in ("instructor", "admin"):
        raise HTTPException(status_code=403, detail="Not authorized to upload radiographs.")

    # Validate calibration calculation dynamically
    cal_result = calculate_calibration(
        physical_marker_diameter_mm=marker_diameter_mm,
        detected_marker_pixel_diameter=marker_pixel_diameter,
    )
    if not cal_result.get("is_valid"):
        raise HTTPException(
            status_code=422,
            detail=f"Calibration validation failed: {cal_result.get('validation_error')}"
        )

    # Read file content
    contents = await file.read()
    file_size = len(contents)
    filename = file.filename or f"{view_type.lower()}.jpg"
    mimetype = file.content_type or "image/jpeg"

    # Destination in private storage bucket: cases/{case_id}/{view_type}_{uuid}.jpg
    storage_path = f"cases/{case_id}/{view_type.lower()}_{uuid4().hex[:8]}.jpg"

    # Upload to Supabase Storage
    try:
        service_client = get_service_client()
        service_client.storage.from_("imaging").upload(
            path=storage_path,
            file=contents,
            file_options={"content-type": mimetype}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Storage upload failed: {str(e)}")

    # Fetch case draft version ID
    conn = get_db_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT draft_version_id FROM cases WHERE id = %s", (str(case_id),))
            c_row = cur.fetchone()
            if not c_row or not c_row["draft_version_id"]:
                raise HTTPException(status_code=400, detail="No active draft version found for this case.")
            draft_id = c_row["draft_version_id"]

            import json
            cur.execute(
                """
                INSERT INTO case_imaging (
                    case_version_id, view_type, label, storage_path, filename,
                    mimetype, file_size, laterality, calibration
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
                """,
                (
                    str(draft_id), view_type.upper(), label, storage_path, filename,
                    mimetype, file_size, laterality, json.dumps(cal_result)
                )
            )
            conn.commit()
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()

    return cases_service.get_instructor_case_detail(case_id, current_user.institution_id)
