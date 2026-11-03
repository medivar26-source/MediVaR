from fastapi import APIRouter, Depends, HTTPException

from core.security import get_current_active_user as get_current_user
from schemas.auth import UserProfile
from services import results_service

router = APIRouter()


@router.get("")
def list_results(current_user: UserProfile = Depends(get_current_user)):
    """
    Every stored attempt and report the caller may read: their own (learner), their cohorts' learners
    (instructor), their institution's learners (administrator). 404 when migration 013 is not applied,
    which the dashboard reads as "results storage is not set up yet".
    """
    try:
        return results_service.results_for(current_user)
    except results_service.ResultsUnavailable:
        raise HTTPException(status_code=404, detail="Results storage is not set up (migration 013 not applied).")
