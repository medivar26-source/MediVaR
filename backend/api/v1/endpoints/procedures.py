from typing import List

from fastapi import APIRouter, Depends, HTTPException

from core.security import get_current_active_user as get_current_user
from schemas.auth import UserProfile
from schemas.content import ProcedureSummary
from services import content_service
from services.content_service import ContentStorageUnavailable

router = APIRouter()


@router.get("", response_model=List[ProcedureSummary])
@router.get("/", response_model=List[ProcedureSummary], include_in_schema=False)
def list_procedures(current_user: UserProfile = Depends(get_current_user)):
    """Procedures a case can be built on."""
    if current_user.role not in ("instructor", "admin"):
        raise HTTPException(status_code=403, detail="Not authorized to manage content.")
    try:
        return content_service.list_procedures()
    except ContentStorageUnavailable:
        raise HTTPException(
            status_code=503,
            detail="Content storage is not set up yet. Try again once the database migration has been applied.",
        )
