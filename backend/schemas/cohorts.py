from typing import Optional, List, Literal
from datetime import datetime
from pydantic import BaseModel, Field


class CohortSummary(BaseModel):
    id: str
    program_id: str
    name: str
    owner_id: str
    created_at: datetime
    learners: int = 0
    mean_score: Optional[float] = None
    below_pass: int = 0
    preset_id: Optional[str] = None
    preset_name: Optional[str] = None


class CohortCreate(BaseModel):
    name: str = Field(..., min_length=2)
    # If program_id is not provided, we will create/use a default program for the instructor's institution
    program_id: Optional[str] = None


class LearnerSummary(BaseModel):
    id: str
    display_name: str
    role: str
    sessions: int = 0
    assessments: int = 0
    mean_score: Optional[float] = None
    critical_errors: int = 0
    weakest_category: Optional[str] = None
    last_active_at: Optional[datetime] = None
    
    # Membership info
    joined_at: datetime


class CohortDetail(BaseModel):
    cohort: CohortSummary
    learners: List[LearnerSummary]
    # For future extensions (categories, hotspots, presets)
    categories: List[dict] = []
    hotspots: List[dict] = []
    presets: List[dict] = []


class CreateLearnerRequest(BaseModel):
    first_name: str = Field(..., min_length=1)
    last_name: str = Field(..., min_length=1)
    role: str = "resident"


class CreateLearnerResponse(BaseModel):
    id: str
    learner_id: str
    display_name: str
    temporary_password: str
    joined_at: datetime


class AddExistingLearnerRequest(BaseModel):
    learner_id: str = Field(..., min_length=1)


class AddExistingLearnerResponse(BaseModel):
    id: str
    learner_id: str
    display_name: str
    joined_at: datetime


class CaseAssignmentRequest(BaseModel):
    case_ids: List[str]


class CaseSummary(BaseModel):
    id: str
    name: str
    difficulty: str | None = None


class CohortCasesResponse(BaseModel):
    cohort_id: str
    cases: List[CaseSummary]


class SessionCreate(BaseModel):
    name: str
    scheduled_at: datetime
    duration: int
    description: Optional[str] = None
    case_id: str = Field(..., min_length=1)
    mode: Literal["training", "assessment"] = "training"
    # Residents this session is assigned to. Omitted/empty -> every current
    # member of the cohort (resolved server-side at creation time).
    resident_ids: Optional[List[str]] = None


class SessionUpdate(BaseModel):
    """Session edits after creation: schedule/description only.

    Deliberately excludes case_id/mode/resident_ids — like a case version
    pinned to a session, the assignment target shouldn't silently change
    underneath residents who were already given the task.
    """
    name: str
    scheduled_at: datetime
    duration: int
    description: Optional[str] = None


class SessionSummary(BaseModel):
    id: str
    cohort_id: str
    name: str
    scheduled_at: datetime
    duration: int
    description: Optional[str] = None
    status: str
    created_at: datetime
    case_id: Optional[str] = None
    case_name: Optional[str] = None
    mode: str = "training"
    instructor_id: Optional[str] = None
    resident_count: int = 0
    completed_count: int = 0


class SessionResidentSummary(BaseModel):
    id: str
    resident_id: str
    display_name: str
    status: str
    joined_at: datetime
    completed_at: Optional[datetime] = None


class SessionRosterResponse(BaseModel):
    session_id: str
    residents: List[SessionResidentSummary]