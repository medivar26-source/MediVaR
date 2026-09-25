from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from core.security import get_current_active_user as get_current_user
from schemas.auth import UserProfile
from schemas.resident import (
    InstructorFeedback,
    InstructorFeedbackCreate,
    InstructorNote,
    InstructorNoteCreate,
    ResidentSummary,
    TrainingAssignment,
    TrainingAssignmentCreate,
)
from services import resident_service

router = APIRouter()


def _require_instructor(user: UserProfile) -> None:
    if user.role not in ("instructor", "admin"):
        raise HTTPException(status_code=403, detail="Not authorized to view resident detail.")


@router.get("/{resident_id}", response_model=ResidentSummary)
def get_resident(resident_id: str, current_user: UserProfile = Depends(get_current_user)):
    """Identity + cohort for a resident the caller supervises."""
    _require_instructor(current_user)
    resident = resident_service.get_resident_summary(resident_id, current_user.id)
    if not resident:
        raise HTTPException(status_code=404, detail="Resident not found, or not in a cohort you supervise.")
    return resident


@router.get("/{resident_id}/notes", response_model=List[InstructorNote])
def list_notes(resident_id: str, current_user: UserProfile = Depends(get_current_user)):
    _require_instructor(current_user)
    return resident_service.list_notes(resident_id, current_user.id)


@router.post("/{resident_id}/notes", response_model=InstructorNote, status_code=201)
def add_note(
    resident_id: str,
    note_in: InstructorNoteCreate,
    current_user: UserProfile = Depends(get_current_user),
):
    _require_instructor(current_user)
    try:
        return resident_service.add_note(resident_id, current_user.id, note_in.note.strip())
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{resident_id}/assignments", response_model=List[TrainingAssignment])
def list_assignments(resident_id: str, current_user: UserProfile = Depends(get_current_user)):
    _require_instructor(current_user)
    return resident_service.list_assignments(resident_id, current_user.id)


@router.post("/{resident_id}/assignments", response_model=TrainingAssignment, status_code=201)
def add_assignment(
    resident_id: str,
    assignment_in: TrainingAssignmentCreate,
    current_user: UserProfile = Depends(get_current_user),
):
    """Assign a case for practice. No update/delete: cancelling or completing
    an assignment isn't built yet — see mediver_documentation/CONTENT_SCHEMA_PLAN.md
    for the status column this would use once that lands."""
    _require_instructor(current_user)
    try:
        return resident_service.add_assignment(
            resident_id,
            current_user.id,
            assignment_in.case_id,
            assignment_in.case_title,
            assignment_in.mode,
            assignment_in.due_at.isoformat() if assignment_in.due_at else None,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{resident_id}/feedback", response_model=List[InstructorFeedback])
def list_feedback(
    resident_id: str,
    attempt_id: Optional[str] = Query(default=None),
    current_user: UserProfile = Depends(get_current_user),
):
    _require_instructor(current_user)
    return resident_service.list_feedback(resident_id, current_user.id, attempt_id)


@router.post("/{resident_id}/feedback", response_model=InstructorFeedback, status_code=201)
def add_feedback(
    resident_id: str,
    feedback_in: InstructorFeedbackCreate,
    current_user: UserProfile = Depends(get_current_user),
):
    _require_instructor(current_user)
    try:
        return resident_service.add_feedback(
            resident_id, current_user.id, feedback_in.feedback.strip(), feedback_in.attempt_id
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
