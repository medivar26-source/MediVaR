"""
Case schemas for MediVeR-XR.

Implements strict layer separation between:
- Instructor authoring & reference layer (contains reference plan, assessment criteria, answer keys)
- Learner presentation layer (strictly sanitized, reference plan excluded at database/service boundary)
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, model_validator, field_validator


# ---------------------------------------------------------------------------
# Component & Assessment Geometries (V1 Spec)
# ---------------------------------------------------------------------------

class V1Position2D(BaseModel):
    x_offset_mm: float = 0.0
    y_offset_mm: float = 0.0
    rotation_deg: float = 0.0


class V1TibialComponent(BaseModel):
    implant_size: int = 3
    position_2d: V1Position2D = Field(default_factory=V1Position2D)
    ap_dimension_mm: Optional[float] = None
    ml_dimension_mm: Optional[float] = None
    cortical_coverage_pct: Optional[float] = None
    medial_overhang_mm: Optional[float] = None
    lateral_overhang_mm: Optional[float] = None
    fit_status: Optional[str] = "ACCEPTABLE FIT"
    is_confirmed: Optional[bool] = True


class V1FemoralComponent(BaseModel):
    implant_size: int = 4
    position_2d: V1Position2D = Field(default_factory=V1Position2D)
    ap_dimension_mm: Optional[float] = None
    ml_dimension_mm: Optional[float] = None
    ap_coverage_pct: Optional[float] = None
    ml_coverage_pct: Optional[float] = None
    notching_risk_mm: Optional[float] = None
    fit_status: Optional[str] = "ACCEPTABLE FIT"
    is_confirmed: Optional[bool] = True


class V1Assessment(BaseModel):
    MAD_mm: float
    AMA_deg: float
    mHKA_deg: float
    MPTA_deg: float
    LDFA_deg: float
    PTS_deg: float
    alignment_type: Optional[str] = "VARUS"


# ---------------------------------------------------------------------------
# Imaging & Calibration
# ---------------------------------------------------------------------------

class CaseImagingBase(BaseModel):
    view_type: str  # 'FLAP' or 'KLAT'
    label: str
    storage_path: str
    filename: Optional[str] = None
    mimetype: Optional[str] = "image/jpeg"
    file_size: Optional[int] = None
    width: Optional[int] = None
    height: Optional[int] = None
    laterality: Optional[str] = None
    calibration: Dict[str, Any] = Field(default_factory=dict)


class CaseImagingCreate(CaseImagingBase):
    pass


class CaseImagingSummary(CaseImagingBase):
    id: UUID
    case_version_id: UUID
    signed_url: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Assessment Criteria & Reference Plan (Instructor-Only Layer)
# ---------------------------------------------------------------------------

class AssessmentCriterionItem(BaseModel):
    id: Optional[UUID] = None
    skill_id: UUID
    name: str
    parameter: str
    target_value: float
    tolerance_min: Optional[float] = None
    tolerance_max: Optional[float] = None
    unit: Optional[str] = None
    severity_rule: Optional[Dict[str, float]] = None

    model_config = ConfigDict(from_attributes=True)


class ReferencePlan(BaseModel):
    id: Optional[UUID] = None
    case_version_id: Optional[UUID] = None
    assessment: V1Assessment
    tibial_component: V1TibialComponent
    femoral_component: V1FemoralComponent
    scoring_criteria: Optional[Dict[str, Any]] = None
    instructor_notes: Optional[str] = None
    calculation_metadata: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Case Versions
# ---------------------------------------------------------------------------

class CaseVersionSummary(BaseModel):
    id: UUID
    case_id: UUID
    version_number: int
    title: str
    pathology: Optional[str] = None
    pathology_label: Optional[str] = None
    side: Optional[str] = None
    difficulty: str
    description: Optional[str] = None
    patient: Dict[str, Any] = Field(default_factory=dict)
    objectives: List[str] = Field(default_factory=list)
    status: str
    is_immutable: bool
    created_at: datetime
    published_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Case Creation & Updating
# ---------------------------------------------------------------------------

class CaseCreate(BaseModel):
    name: str
    difficulty: str = "intermediate"
    description: Optional[str] = None
    learning_objective: Optional[str] = None
    procedure_id: Optional[UUID] = None
    program_ids: Optional[List[UUID]] = Field(default_factory=list)
    pathology: Optional[str] = None
    pathology_label: Optional[str] = None
    side: Optional[str] = None
    patient: Optional[Dict[str, Any]] = Field(default_factory=dict)
    objectives: Optional[List[str]] = Field(default_factory=list)
    imaging: Optional[List[CaseImagingCreate]] = Field(default_factory=list)
    reference_plan: Optional[ReferencePlan] = None
    criteria: Optional[List[AssessmentCriterionItem]] = Field(default_factory=list)
    assessment_rubric: Optional[List[AssessmentCriterionItem]] = None

    @model_validator(mode="before")
    @classmethod
    def populate_criteria(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if not data.get("criteria") and data.get("assessment_rubric"):
                data["criteria"] = data["assessment_rubric"]
        return data


class CaseUpdate(BaseModel):
    name: Optional[str] = None
    difficulty: Optional[str] = None
    description: Optional[str] = None
    learning_objective: Optional[str] = None
    program_ids: Optional[List[UUID]] = None
    pathology: Optional[str] = None
    pathology_label: Optional[str] = None
    side: Optional[str] = None
    patient: Optional[Dict[str, Any]] = None
    objectives: Optional[List[str]] = None
    imaging: Optional[List[CaseImagingCreate]] = None
    reference_plan: Optional[ReferencePlan] = None
    criteria: Optional[List[AssessmentCriterionItem]] = None
    assessment_rubric: Optional[List[AssessmentCriterionItem]] = None

    @model_validator(mode="before")
    @classmethod
    def populate_criteria(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if not data.get("criteria") and data.get("assessment_rubric"):
                data["criteria"] = data["assessment_rubric"]
        return data


# ---------------------------------------------------------------------------
# Presentation Responses (Layer Separation)
# ---------------------------------------------------------------------------

class CaseListItem(BaseModel):
    id: UUID
    name: str
    difficulty: str
    description: Optional[str] = None
    learning_objective: Optional[str] = None
    status: str
    version: int
    institution_id: Optional[UUID] = None
    draft_version_id: Optional[UUID] = None
    published_version_id: Optional[UUID] = None
    program_ids: List[UUID] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    @field_validator("program_ids", mode="before")
    @classmethod
    def parse_program_ids(cls, v):
        if isinstance(v, str):
            v = v.strip("{}")
            if not v:
                return []
            return [x.strip() for x in v.split(",") if x.strip()]
        return v or []

    model_config = ConfigDict(from_attributes=True)


class CaseDetailResponse(BaseModel):
    """Full instructor view with reference plan, criteria, and version pointers."""
    id: UUID
    name: str
    difficulty: str
    description: Optional[str] = None
    learning_objective: Optional[str] = None
    status: str
    version: int
    procedure_id: UUID
    institution_id: Optional[UUID] = None
    draft_version_id: Optional[UUID] = None
    published_version_id: Optional[UUID] = None
    program_ids: List[UUID] = Field(default_factory=list)

    @field_validator("program_ids", mode="before")
    @classmethod
    def parse_detail_program_ids(cls, v):
        if isinstance(v, str):
            v = v.strip("{}")
            if not v:
                return []
            return [x.strip() for x in v.split(",") if x.strip()]
        return v or []

    active_version: Optional[CaseVersionSummary] = None
    imaging: List[CaseImagingSummary] = Field(default_factory=list)
    reference_plan: Optional[ReferencePlan] = None
    criteria: List[AssessmentCriterionItem] = Field(default_factory=list)
    validation_errors: Optional[List[str]] = Field(default_factory=list)
    is_publishable: Optional[bool] = False
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LearnerCaseDetailResponse(BaseModel):
    """
    Sanitized learner view.
    CRITICAL: Does NOT contain reference plan, answers, or scoring thresholds.
    """
    id: UUID
    name: str
    difficulty: str
    description: Optional[str] = None
    learning_objective: Optional[str] = None
    status: str
    version: int
    procedure_id: UUID
    published_version_id: UUID
    title: str
    pathology: Optional[str] = None
    pathology_label: Optional[str] = None
    side: Optional[str] = None
    patient: Dict[str, Any] = Field(default_factory=dict)
    objectives: List[str] = Field(default_factory=list)
    imaging: List[CaseImagingSummary] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
