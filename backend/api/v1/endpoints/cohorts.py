from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from core.security import get_current_active_user as get_current_user
from schemas.auth import UserProfile
from schemas.cohorts import (
    CohortSummary, CohortCreate, CohortDetail,
    CreateLearnerRequest, CreateLearnerResponse,
    AddExistingLearnerRequest, AddExistingLearnerResponse,
    CaseAssignmentRequest, CaseSummary, CohortCasesResponse,
    SessionCreate, SessionUpdate, SessionSummary, SessionRosterResponse,
)
from services import cohorts_service

router = APIRouter()


@router.get("/", response_model=List[CohortSummary])
def list_cohorts(current_user: UserProfile = Depends(get_current_user)):
    """List cohorts accessible to the authenticated instructor."""
    if current_user.role not in ("instructor", "admin"):
        raise HTTPException(status_code=403, detail="Not authorized to manage cohorts.")
    return cohorts_service.get_instructor_cohorts(current_user.id)


@router.post("/", response_model=CohortSummary, status_code=status.HTTP_201_CREATED)
def create_cohort(
    cohort_in: CohortCreate,
    current_user: UserProfile = Depends(get_current_user)
):
    """Create a new cohort."""
    if current_user.role not in ("instructor", "admin"):
        raise HTTPException(status_code=403, detail="Not authorized to create cohorts.")
        
    try:
        return cohorts_service.create_cohort(
            name=cohort_in.name,
            owner_id=current_user.id,
            institution_id=current_user.institution_id,
            program_id=cohort_in.program_id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{cohort_id}", response_model=CohortDetail)
def get_cohort(cohort_id: str, current_user: UserProfile = Depends(get_current_user)):
    """Get cohort details and enrolled learners."""
    if current_user.role not in ("instructor", "admin"):
        raise HTTPException(status_code=403, detail="Not authorized.")
        
    cohort = cohorts_service.get_cohort_detail(cohort_id, current_user.id)
    if not cohort:
        raise HTTPException(status_code=404, detail="Cohort not found or unauthorized.")
    return cohort


@router.post("/{cohort_id}/learners/new", response_model=CreateLearnerResponse, status_code=status.HTTP_201_CREATED)
def create_learner_in_cohort(
    cohort_id: str,
    learner_in: CreateLearnerRequest,
    current_user: UserProfile = Depends(get_current_user)
):
    """Create a new learner account and enroll them in the cohort."""
    if current_user.role not in ("instructor", "admin"):
        raise HTTPException(status_code=403, detail="Not authorized.")
        
    try:
        return cohorts_service.enroll_new_learner(
            cohort_id=cohort_id,
            first_name=learner_in.first_name,
            last_name=learner_in.last_name,
            role=learner_in.role,
            institution_id=current_user.institution_id,
            owner_id=current_user.id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{cohort_id}/learners/existing", response_model=AddExistingLearnerResponse)
def add_existing_learner_to_cohort(
    cohort_id: str,
    req: AddExistingLearnerRequest,
    current_user: UserProfile = Depends(get_current_user)
):
    """Add an existing learner to the cohort."""
    if current_user.role not in ("instructor", "admin"):
        raise HTTPException(status_code=403, detail="Not authorized.")
        
    try:
        return cohorts_service.add_existing_learner(
            cohort_id=cohort_id,
            learner_id=req.learner_id,
            owner_id=current_user.id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{cohort_id}/cases", response_model=CohortCasesResponse)
def assign_cases(
    cohort_id: str,
    payload: CaseAssignmentRequest,
    current_user: UserProfile = Depends(get_current_user)
):
    """Replace the full set of cases assigned to a cohort."""
    if current_user.role not in ("instructor", "admin"):
        raise HTTPException(status_code=403, detail="Not authorized to assign cases.")

    try:
        return cohorts_service.set_cohort_cases(
            cohort_id=cohort_id,
            case_ids=payload.case_ids,
            owner_id=current_user.id,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{cohort_id}/cases", response_model=CohortCasesResponse)
def list_cohort_cases(
    cohort_id: str,
    current_user: UserProfile = Depends(get_current_user)
):
    """List cases currently assigned to a cohort."""
    if current_user.role not in ("instructor", "admin"):
        raise HTTPException(status_code=403, detail="Not authorized to view cohort cases.")

    try:
        return cohorts_service.get_cohort_cases(
            cohort_id=cohort_id,
            owner_id=current_user.id,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post(
    "/{cohort_id}/sessions",
    response_model=SessionSummary,
    status_code=status.HTTP_201_CREATED
)
def create_session(
    cohort_id: str,
    session_in: SessionCreate,
    current_user: UserProfile = Depends(get_current_user)
):
    """Create a session under a cohort."""

    if current_user.role not in ("instructor", "admin"):
        raise HTTPException(
            status_code=403,
            detail="Not authorized to create sessions."
        )

    try:
        return cohorts_service.create_session(
            cohort_id=cohort_id,
            name=session_in.name,
            scheduled_at=session_in.scheduled_at,
            duration=session_in.duration,
            description=session_in.description,
            case_id=session_in.case_id,
            mode=session_in.mode,
            resident_ids=session_in.resident_ids,
            owner_id=current_user.id,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )


@router.get(
    "/{cohort_id}/sessions",
    response_model=List[SessionSummary]
)
def list_cohort_sessions(
    cohort_id: str,
    current_user: UserProfile = Depends(get_current_user)
):
    """List sessions scheduled under a cohort."""

    if current_user.role not in ("instructor", "admin"):
        raise HTTPException(
            status_code=403,
            detail="Not authorized to view sessions."
        )

    try:
        return cohorts_service.get_cohort_sessions(
            cohort_id=cohort_id,
            owner_id=current_user.id,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )


@router.put(
    "/sessions/{session_id}",
    response_model=SessionSummary
)
def update_session(
    session_id: str,
    session_in: SessionUpdate,
    current_user: UserProfile = Depends(get_current_user)
):
    """Update a session."""

    if current_user.role not in ("instructor", "admin"):
        raise HTTPException(
            status_code=403,
            detail="Not authorized to update sessions."
        )

    try:
        return cohorts_service.update_session(
            session_id=session_id,
            name=session_in.name,
            scheduled_at=session_in.scheduled_at,
            duration=session_in.duration,
            description=session_in.description,
            owner_id=current_user.id,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )


@router.post(
    "/sessions/{session_id}/cancel",
    response_model=SessionSummary
)
def cancel_session(
    session_id: str,
    current_user: UserProfile = Depends(get_current_user)
):
    """Cancel a session."""

    if current_user.role not in ("instructor", "admin"):
        raise HTTPException(
            status_code=403,
            detail="Not authorized to cancel sessions."
        )

    try:
        return cohorts_service.cancel_session(
            session_id=session_id,
            owner_id=current_user.id,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


@router.get(
    "/sessions/{session_id}/residents",
    response_model=SessionRosterResponse
)
def get_session_roster(
    session_id: str,
    current_user: UserProfile = Depends(get_current_user)
):
    """List the residents assigned to a session and their status."""

    if current_user.role not in ("instructor", "admin"):
        raise HTTPException(
            status_code=403,
            detail="Not authorized to view the session roster."
        )

    try:
        return cohorts_service.get_session_roster(
            session_id=session_id,
            owner_id=current_user.id,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )