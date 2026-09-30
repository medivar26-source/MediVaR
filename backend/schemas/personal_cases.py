from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID

class LearnerPersonalCaseImagingBase(BaseModel):
    view_type: str
    label: str
    storage_path: str
    filename: Optional[str] = None
    mimetype: Optional[str] = None
    file_size: Optional[int] = None
    width: Optional[int] = None
    height: Optional[int] = None
    laterality: Optional[str] = None
    calibration: Dict[str, Any] = Field(default_factory=dict)

class LearnerPersonalCaseImaging(LearnerPersonalCaseImagingBase):
    id: UUID
    personal_case_id: UUID
    created_at: datetime

class LearnerPersonalCaseBase(BaseModel):
    title: str = Field(..., min_length=1)
    pathology: Optional[str] = None
    pathology_label: Optional[str] = None
    side: Optional[str] = None
    difficulty: str = Field(..., description="beginner, intermediate, or expert")
    description: Optional[str] = None
    patient: Dict[str, Any] = Field(default_factory=dict)
    objectives: List[str] = Field(default_factory=list)

class LearnerPersonalCaseCreate(LearnerPersonalCaseBase):
    pass

class LearnerPersonalCaseUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1)
    pathology: Optional[str] = None
    pathology_label: Optional[str] = None
    side: Optional[str] = None
    difficulty: Optional[str] = None
    description: Optional[str] = None
    patient: Optional[Dict[str, Any]] = None
    objectives: Optional[List[str]] = None

class LearnerPersonalCaseDetail(LearnerPersonalCaseBase):
    id: UUID
    owner_user_id: UUID
    created_at: datetime
    updated_at: datetime
    imaging: List[LearnerPersonalCaseImaging] = []
