"""
Pydantic schemas for the Resident Detail / Case Review page.

Mirrors mediver_documentation/06_DATABASE_SCHEMA.md: instructor_notes,
instructor_feedback. Performance figures (competency, skill breakdown,
recent cases) have no backing table yet — see resident_service.py — so
there is no schema for them here; the frontend sources those from the
existing seed-backed session/report accessors, same as /performance and
/sessions/[id]/report already do.
"""
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


class ResidentSummary(BaseModel):
    id: str
    display_name: str
    role: str
    cohort_id: Optional[str] = None
    cohort_name: Optional[str] = None
    joined_at: Optional[datetime] = None


class InstructorNote(BaseModel):
    id: str
    resident_id: str
    instructor_id: str
    instructor_name: str
    note: str
    created_at: datetime
    updated_at: datetime


class InstructorNoteCreate(BaseModel):
    note: str = Field(..., min_length=1, max_length=4000)


class InstructorFeedback(BaseModel):
    id: str
    resident_id: str
    attempt_id: Optional[str] = None
    instructor_id: str
    instructor_name: str
    feedback: str
    created_at: datetime


class InstructorFeedbackCreate(BaseModel):
    attempt_id: Optional[str] = None
    feedback: str = Field(..., min_length=1, max_length=4000)


class TrainingAssignment(BaseModel):
    id: str
    resident_id: str
    case_id: str
    case_title: str
    mode: str
    status: str
    assigned_by: str
    assigned_by_name: str
    due_at: Optional[datetime] = None
    created_at: datetime
    completed_at: Optional[datetime] = None


class TrainingAssignmentCreate(BaseModel):
    case_id: str = Field(..., min_length=1)
    case_title: str = Field(..., min_length=1, max_length=200)
    mode: Literal["training", "assessment"] = "training"
    due_at: Optional[datetime] = None
