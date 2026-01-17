"""
Case Study Schemas
For AI-generated treatment case studies
"""

from typing import Optional, List
from uuid import UUID
from datetime import date, datetime
from pydantic import BaseModel, Field, UUID4


# ============================================================================
# Base Schemas
# ============================================================================

class CaseStudyBase(BaseModel):
    """Base schema for case study"""
    title: str = Field(..., min_length=1, max_length=500)
    chief_complaint: str = Field(..., min_length=1)

    # Optional AI-generated content
    pre_treatment_summary: Optional[str] = None
    initial_diagnosis: Optional[str] = None
    treatment_goals: Optional[str] = None

    treatment_summary: Optional[str] = None
    procedures_performed: Optional[str] = None

    outcome_summary: Optional[str] = None
    success_metrics: Optional[str] = None
    patient_feedback: Optional[str] = None

    full_narrative: Optional[str] = None

    # Timeline
    treatment_start_date: Optional[date] = None
    treatment_end_date: Optional[date] = None

    # Status
    status: str = Field(default="draft", pattern="^(draft|finalized|archived)$")


# ============================================================================
# Create Schemas
# ============================================================================

class CaseStudyCreate(BaseModel):
    """Schema for creating a new case study (manual or LLM trigger)"""
    # Multi-tenancy support
    tenant_id: Optional[UUID] = Field(None, description="Tenant ID for multi-tenancy")

    # Patient identification (composite key)
    patient_mobile_number: str = Field(..., min_length=10, max_length=15)
    patient_first_name: str = Field(..., min_length=1, max_length=100)

    # Title and chief complaint (required)
    title: str = Field(..., min_length=1, max_length=500)
    chief_complaint: str = Field(..., min_length=1)

    # Optional: Specific entities to include in case study
    appointment_ids: Optional[List[UUID4]] = None
    prescription_ids: Optional[List[UUID4]] = None
    procedure_ids: Optional[List[UUID4]] = None
    observation_ids: Optional[List[UUID4]] = None

    # Optional: Date range filter
    treatment_start_date: Optional[date] = None
    treatment_end_date: Optional[date] = None


class CaseStudyGenerateRequest(BaseModel):
    """
    Schema for triggering LLM case study generation
    This will be used in Phase 2
    """
    # Multi-tenancy support
    tenant_id: Optional[UUID] = Field(None, description="Tenant ID for multi-tenancy")

    # Patient identification
    patient_mobile_number: str = Field(..., min_length=10, max_length=15)
    patient_first_name: str = Field(..., min_length=1, max_length=100)

    # Optional: Custom title (if not provided, LLM will generate)
    title: Optional[str] = Field(None, max_length=500)

    # Optional: Specific entities to include
    appointment_ids: Optional[List[UUID4]] = None
    prescription_ids: Optional[List[UUID4]] = None
    procedure_ids: Optional[List[UUID4]] = None
    observation_ids: Optional[List[UUID4]] = None

    # Optional: Date range filter
    treatment_start_date: Optional[date] = None
    treatment_end_date: Optional[date] = None


# ============================================================================
# Update Schemas
# ============================================================================

class CaseStudyUpdate(BaseModel):
    """Schema for updating a case study (allow editing AI-generated content)"""
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    chief_complaint: Optional[str] = Field(None, min_length=1)

    pre_treatment_summary: Optional[str] = None
    initial_diagnosis: Optional[str] = None
    treatment_goals: Optional[str] = None

    treatment_summary: Optional[str] = None
    procedures_performed: Optional[str] = None

    outcome_summary: Optional[str] = None
    success_metrics: Optional[str] = None
    patient_feedback: Optional[str] = None

    full_narrative: Optional[str] = None

    treatment_start_date: Optional[date] = None
    treatment_end_date: Optional[date] = None

    status: Optional[str] = Field(None, pattern="^(draft|finalized|archived)$")


# ============================================================================
# Response Schemas
# ============================================================================

class CaseStudyResponse(CaseStudyBase):
    """Full case study response"""
    id: UUID4
    case_study_number: str

    # Patient reference
    patient_mobile_number: str
    patient_first_name: str
    patient_uuid: UUID4

    # Doctor reference
    doctor_id: UUID4

    # Related entities (JSON arrays as strings)
    appointment_ids: Optional[str] = None
    prescription_ids: Optional[str] = None
    procedure_ids: Optional[str] = None
    observation_ids: Optional[str] = None

    # Metadata
    generation_prompt: Optional[str] = None
    generation_model: Optional[str] = None

    # Export info
    is_exported: bool
    exported_format: Optional[str] = None
    exported_at: Optional[datetime] = None

    # Audit fields
    created_at: datetime
    updated_at: datetime
    created_by: Optional[UUID4] = None
    is_active: bool

    class Config:
        from_attributes = True


class CaseStudySummary(BaseModel):
    """Lightweight case study summary for list views"""
    id: UUID4
    case_study_number: str
    title: str
    status: str
    treatment_start_date: Optional[date] = None
    treatment_end_date: Optional[date] = None
    created_at: datetime
    updated_at: datetime
    is_active: bool

    class Config:
        from_attributes = True


class CaseStudyList(BaseModel):
    """Paginated list of case studies"""
    case_studies: List[CaseStudySummary]
    total: int
    page: int
    per_page: int
    pages: int
