"""
Pydantic schemas for the Content / Case Library API (cases, procedures).

Mirrors the `cases` / `procedures` tables in
mediver_documentation/06_DATABASE_SCHEMA.md.
"""
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field

Difficulty = Literal["beginner", "intermediate", "expert"]
CaseStatus = Literal["active", "inactive"]


class ProcedureSummary(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    version: int
    step_count: int = 0


class CaseSummary(BaseModel):
    id: str
    program_id: str
    procedure_id: str
    procedure_name: str
    name: str
    difficulty: Difficulty
    description: Optional[str] = None
    learning_objective: Optional[str] = None
    status: CaseStatus
    version: int
    created_at: datetime
    updated_at: datetime


class CaseCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=120)
    procedure_id: str
    difficulty: Difficulty
    description: Optional[str] = Field(default=None, max_length=1000)
    learning_objective: str = Field(..., min_length=10, max_length=1000)
    # Omitted -> the caller's institution default program, as cohorts do.
    program_id: Optional[str] = None


class CaseUpdate(BaseModel):
    """PATCH body. Only the fields sent are changed."""
    name: Optional[str] = Field(default=None, min_length=3, max_length=120)
    procedure_id: Optional[str] = None
    difficulty: Optional[Difficulty] = None
    description: Optional[str] = Field(default=None, max_length=1000)
    learning_objective: Optional[str] = Field(default=None, min_length=10, max_length=1000)
    status: Optional[CaseStatus] = None
