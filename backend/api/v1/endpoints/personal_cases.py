import os
from typing import List
from uuid import UUID, uuid4
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form

from core.security import get_current_active_user as get_current_user
from core.calculations import calculate_calibration
from db.session import get_service_client, get_db_conn
from schemas.auth import UserProfile
from schemas.personal_cases import (
    LearnerPersonalCaseCreate,
    LearnerPersonalCaseUpdate,
    LearnerPersonalCaseDetail,
)
from services import personal_cases_service

router = APIRouter()

@router.get("", response_model=List[LearnerPersonalCaseDetail])
@router.get("/", response_model=List[LearnerPersonalCaseDetail], include_in_schema=False)
def list_personal_cases(current_user: UserProfile = Depends(get_current_user)):
    """List all personal cases owned by the current learner."""
    if current_user.role != "resident":
        raise HTTPException(status_code=403, detail="Only learners can access personal cases.")
    return personal_cases_service.get_learner_personal_cases(current_user.id)

@router.post("", response_model=LearnerPersonalCaseDetail, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=LearnerPersonalCaseDetail, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def create_personal_case(
    case_in: LearnerPersonalCaseCreate,
    current_user: UserProfile = Depends(get_current_user),
):
    """Creates a new personal case for the learner."""
    if current_user.role != "resident":
        raise HTTPException(status_code=403, detail="Only learners can create personal cases.")
    try:
        case = personal_cases_service.create_personal_case(owner_user_id=current_user.id, case_in=case_in)
        return case
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{case_id}", response_model=LearnerPersonalCaseDetail)
def get_personal_case(
    case_id: UUID,
    current_user: UserProfile = Depends(get_current_user),
):
    """Get a specific personal case."""
    if current_user.role != "resident":
        raise HTTPException(status_code=403, detail="Only learners can access personal cases.")
    
    case = personal_cases_service.get_personal_case_detail(case_id, current_user.id)
    if not case:
        raise HTTPException(status_code=404, detail="Personal case not found.")
    return case

@router.put("/{case_id}", response_model=LearnerPersonalCaseDetail)
@router.patch("/{case_id}", response_model=LearnerPersonalCaseDetail)
def update_personal_case(
    case_id: UUID,
    case_in: LearnerPersonalCaseUpdate,
    current_user: UserProfile = Depends(get_current_user),
):
    """Update a specific personal case."""
    if current_user.role != "resident":
        raise HTTPException(status_code=403, detail="Only learners can edit personal cases.")
    
    case = personal_cases_service.update_personal_case(case_id, current_user.id, case_in)
    if not case:
        raise HTTPException(status_code=404, detail="Personal case not found.")
    return case

@router.delete("/{case_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_personal_case(
    case_id: UUID,
    current_user: UserProfile = Depends(get_current_user),
):
    """Delete a specific personal case."""
    if current_user.role != "resident":
        raise HTTPException(status_code=403, detail="Only learners can delete personal cases.")
    
    success = personal_cases_service.delete_personal_case(case_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Personal case not found.")
    return None

@router.post("/{case_id}/upload-radiograph", response_model=LearnerPersonalCaseDetail)
async def upload_personal_radiograph(
    case_id: UUID,
    file: UploadFile = File(...),
    view_type: str = Form(...),
    label: str = Form(...),
    marker_diameter_mm: float = Form(25.0),
    marker_pixel_diameter: float = Form(...),
    laterality: str = Form(None),
    current_user: UserProfile = Depends(get_current_user),
):
    """Uploads a radiograph to private Supabase storage and attaches to the personal case."""
    if current_user.role != "resident":
        raise HTTPException(status_code=403, detail="Only learners can upload radiographs to personal cases.")

    case = personal_cases_service.get_personal_case_detail(case_id, current_user.id)
    if not case:
        raise HTTPException(status_code=404, detail="Personal case not found.")

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

    # Destination in private storage bucket: personal_cases/{case_id}/{view_type}_{uuid}.jpg
    # Keep the original extension so DICOM (.dcm) scans are still recognised as DICOM downstream.
    ext = os.path.splitext(filename)[1].lower()
    if ext not in (".jpg", ".jpeg", ".png", ".dcm", ".dcim"):
        ext = ".jpg"
    storage_path = f"personal_cases/{case_id}/{view_type.lower()}_{uuid4().hex[:8]}{ext}"

    try:
        service_client = get_service_client()
        service_client.storage.from_("imaging").upload(
            path=storage_path,
            file=contents,
            file_options={"content-type": mimetype}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Storage upload failed: {str(e)}")

    conn = get_db_conn()
    try:
        with conn.cursor() as cur:
            import json
            cur.execute(
                """
                INSERT INTO learner_personal_case_imaging (
                    personal_case_id, view_type, label, storage_path, filename,
                    mimetype, file_size, laterality, calibration
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
                """,
                (
                    str(case_id), view_type.upper(), label, storage_path, filename,
                    mimetype, file_size, laterality, json.dumps(cal_result)
                )
            )
            conn.commit()
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()

    return personal_cases_service.get_personal_case_detail(case_id, current_user.id)
