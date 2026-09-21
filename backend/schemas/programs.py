from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID


class ProgramBase(BaseModel):
    name: str
    description: Optional[str] = None
    status: Optional[str] = "active"


class ProgramCreate(ProgramBase):
    pass


class ProgramSummary(ProgramBase):
    id: UUID
    institution_id: UUID
    created_at: datetime
    updated_at: datetime
    cohort_id: Optional[UUID] = None
    cohort_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ProgramDetail(ProgramSummary):
    pass

