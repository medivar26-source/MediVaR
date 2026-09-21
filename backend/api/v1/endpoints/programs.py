from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from core.security import get_current_active_user as get_current_user
from schemas.auth import UserProfile
from schemas.programs import ProgramSummary, ProgramCreate, ProgramDetail
from schemas.cohorts import CohortSummary
from services import programs_service, cohorts_service

router = APIRouter()

@router.get("", response_model=List[ProgramSummary])
@router.get("/", response_model=List[ProgramSummary], include_in_schema=False)
def list_programs(current_user: UserProfile = Depends(get_current_user)):
    """List programs accessible to the authenticated user."""
    if current_user.role in ("instructor", "admin"):
        return programs_service.get_institution_programs(current_user.institution_id)
    # For learners, return the programs they are enrolled in, including associated cohort metadata
    return programs_service.get_learner_programs(current_user.id)


@router.get("/enrolled", response_model=List[ProgramSummary])
def list_enrolled_programs(current_user: UserProfile = Depends(get_current_user)):
    """List programs the authenticated learner is enrolled in."""
    return programs_service.get_learner_programs(current_user.id)


@router.post("", response_model=ProgramSummary, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=ProgramSummary, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def create_program(
    program_in: ProgramCreate,
    current_user: UserProfile = Depends(get_current_user)
):
    """Create a new program."""
    if current_user.role not in ("instructor", "admin"):
        raise HTTPException(status_code=403, detail="Not authorized to create programs.")
        
    try:
        return programs_service.create_program(
            institution_id=current_user.institution_id,
            name=program_in.name,
            description=program_in.description,
            status=program_in.status
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{program_id}", response_model=ProgramDetail)
def get_program(program_id: str, current_user: UserProfile = Depends(get_current_user)):
    """Get program details."""
    if current_user.role in ("instructor", "admin"):
        program = programs_service.get_program_detail(program_id, current_user.institution_id)
        if not program:
            raise HTTPException(status_code=404, detail="Program not found or unauthorized.")
        return program
        
    # Learner role: only returns program if the learner is an enrolled member
    program = programs_service.get_learner_program_detail(program_id, current_user.id)
    if not program:
        raise HTTPException(status_code=404, detail="Program not found or unauthorized.")
    return program



@router.get("/{program_id}/cohorts", response_model=List[CohortSummary])
def list_program_cohorts(program_id: str, current_user: UserProfile = Depends(get_current_user)):
    """Get all cohorts under a specific program."""
    if current_user.role not in ("instructor", "admin"):
        raise HTTPException(status_code=403, detail="Not authorized.")
        
    # We should verify program belongs to institution
    program = programs_service.get_program_detail(program_id, current_user.institution_id)
    if not program:
        raise HTTPException(status_code=404, detail="Program not found or unauthorized.")
        
    # Get cohorts for this instructor in this program. 
    # For now, get_instructor_cohorts returns all cohorts for the instructor.
    # We will filter them by program_id.
    all_cohorts = cohorts_service.get_instructor_cohorts(current_user.id)
    program_cohorts = [c for c in all_cohorts if str(c.program_id) == program_id]
    return program_cohorts

