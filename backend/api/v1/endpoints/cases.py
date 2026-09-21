from typing import List

from fastapi import APIRouter, Depends, HTTPException, status

from core.security import get_current_active_user as get_current_user
from schemas.auth import UserProfile
from schemas.content import CaseCreate, CaseSummary, CaseUpdate
from services import content_service
from services.content_service import ContentStorageUnavailable

router = APIRouter()

_UNAVAILABLE = "Content storage is not set up yet. Try again once the database migration has been applied."


def _require_author(user: UserProfile) -> None:
    if user.role not in ("instructor", "admin"):
        raise HTTPException(status_code=403, detail="Not authorized to manage content.")
    if not user.institution_id:
        raise HTTPException(status_code=403, detail="Your account is not linked to an institution.")


@router.get("", response_model=List[CaseSummary])
@router.get("/", response_model=List[CaseSummary], include_in_schema=False)
def list_cases(current_user: UserProfile = Depends(get_current_user)):
    """Every case in the caller's institution, active and inactive."""
    _require_author(current_user)
    try:
        return content_service.list_cases(current_user.institution_id)
    except ContentStorageUnavailable:
        raise HTTPException(status_code=503, detail=_UNAVAILABLE)


@router.post("", response_model=CaseSummary, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=CaseSummary, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def create_case(case_in: CaseCreate, current_user: UserProfile = Depends(get_current_user)):
    _require_author(current_user)
    try:
        return content_service.create_case(
            institution_id=current_user.institution_id,
            name=case_in.name.strip(),
            procedure_id=case_in.procedure_id,
            difficulty=case_in.difficulty,
            learning_objective=case_in.learning_objective.strip(),
            description=case_in.description,
            program_id=case_in.program_id,
        )
    except ContentStorageUnavailable:
        raise HTTPException(status_code=503, detail=_UNAVAILABLE)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{case_id}", response_model=CaseSummary)
def get_case(case_id: str, current_user: UserProfile = Depends(get_current_user)):
    _require_author(current_user)
    try:
        case = content_service.get_case(case_id, current_user.institution_id)
    except ContentStorageUnavailable:
        raise HTTPException(status_code=503, detail=_UNAVAILABLE)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found.")
    return case


@router.patch("/{case_id}", response_model=CaseSummary)
def update_case(
    case_id: str,
    case_in: CaseUpdate,
    current_user: UserProfile = Depends(get_current_user),
):
    """Edit a case or change its status. There is deliberately no DELETE —
    a case is retired by setting status to 'inactive'."""
    _require_author(current_user)
    changes = case_in.model_dump(exclude_unset=True)
    try:
        case = content_service.update_case(case_id, current_user.institution_id, changes)
    except ContentStorageUnavailable:
        raise HTTPException(status_code=503, detail=_UNAVAILABLE)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not case:
        raise HTTPException(status_code=404, detail="Case not found.")
    return case
