"""
Dental Schemas for Dental Observations and Procedures
Handles validation for tooth-level observations and dental procedures
Uses FDI notation system for tooth numbering
"""

from pydantic import BaseModel, Field, validator, field_validator
from typing import Optional, List, Literal, Dict, Any
from datetime import date, datetime
from uuid import UUID
from decimal import Decimal

from app.models.dental import (
    DENTAL_CONDITION_TYPES,
    TOOTH_SURFACES,
    is_valid_tooth_number,
    get_tooth_type
)


# Enums for dental data
DentalSeverityEnum = Literal["none", "mild", "moderate", "severe"]
DentalProcedureStatusEnum = Literal["planned", "in_progress", "completed", "cancelled"]


# ==================== Dental Observation Schemas ====================

class DentalObservationBase(BaseModel):
    """Base schema for dental observations"""
    tooth_number: str = Field(..., min_length=2, max_length=3, description="FDI tooth number (e.g., 11, 51)")
    tooth_surface: Optional[str] = Field(None, description="Tooth surface (Occlusal, Mesial, etc.)")
    condition_type: str = Field(..., description="Type of condition (Cavity, Decay, etc.)")
    severity: Optional[str] = Field(None, description="Severity of condition")
    observation_notes: Optional[str] = Field(None, description="Additional notes")
    treatment_required: bool = Field(True, description="Whether treatment is required")
    treatment_done: bool = Field(False, description="Whether treatment is completed")
    treatment_date: Optional[date] = Field(None, description="Date treatment was done")

    @field_validator('tooth_number')
    @classmethod
    def validate_tooth_number(cls, v: str) -> str:
        """Validate FDI tooth numbering"""
        if not is_valid_tooth_number(v):
            raise ValueError(
                f"Invalid tooth number '{v}'. Must be valid FDI notation "
                "(Permanent: 11-48, Primary: 51-85)"
            )
        return v

    @field_validator('tooth_surface')
    @classmethod
    def validate_tooth_surface(cls, v: Optional[str]) -> Optional[str]:
        """Validate tooth surface"""
        if v and v not in TOOTH_SURFACES:
            raise ValueError(
                f"Invalid tooth surface '{v}'. "
                f"Must be one of: {', '.join(TOOTH_SURFACES)}"
            )
        return v

    @field_validator('severity')
    @classmethod
    def validate_severity(cls, v: Optional[str]) -> Optional[str]:
        """Validate severity"""
        if v:
            v_lower = v.lower()
            if v_lower not in ["none", "mild", "moderate", "severe"]:
                raise ValueError("Severity must be: none, mild, moderate, or severe")
            return v_lower.capitalize() if v_lower != "none" else "none"
        return v

    model_config = {
        "json_schema_extra": {
            "example": {
                "tooth_number": "11",
                "tooth_surface": "Occlusal",
                "condition_type": "Cavity",
                "severity": "Moderate",
                "observation_notes": "Deep cavity requiring filling",
                "treatment_required": True,
                "treatment_done": False
            }
        }
    }


class DentalObservationCreate(DentalObservationBase):
    """Schema for creating dental observation"""
    prescription_id: Optional[UUID] = Field(None, description="Related prescription ID")
    appointment_id: Optional[UUID] = Field(None, description="Related appointment ID")
    patient_mobile_number: str = Field(..., description="Patient mobile number")
    patient_first_name: str = Field(..., description="Patient first name")


class DentalObservationUpdate(BaseModel):
    """Schema for updating dental observation"""
    tooth_surface: Optional[str] = None
    condition_type: Optional[str] = None
    severity: Optional[str] = None
    observation_notes: Optional[str] = None
    treatment_required: Optional[bool] = None
    treatment_done: Optional[bool] = None
    treatment_date: Optional[date] = None


class DentalObservationResponse(DentalObservationBase):
    """Schema for dental observation response"""
    id: UUID
    prescription_id: Optional[UUID]
    appointment_id: Optional[UUID]
    patient_mobile_number: str
    patient_first_name: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DentalObservationListResponse(BaseModel):
    """Schema for list of dental observations"""
    observations: List[DentalObservationResponse]
    total: int
    tooth_type: Optional[str] = Field(None, description="Permanent or Primary dentition")


# ==================== Dental Procedure Schemas ====================

class DentalProcedureBase(BaseModel):
    """Base schema for dental procedures"""
    procedure_code: str = Field(..., max_length=20, description="CDT code or custom code")
    procedure_name: str = Field(..., max_length=200, description="Procedure name")
    tooth_numbers: Optional[str] = Field(None, description="Comma-separated tooth numbers")
    description: Optional[str] = Field(None, description="Procedure description")
    estimated_cost: Optional[Decimal] = Field(None, ge=0, description="Estimated cost")
    actual_cost: Optional[Decimal] = Field(None, ge=0, description="Actual cost")
    duration_minutes: Optional[int] = Field(None, ge=1, le=480, description="Duration in minutes")
    status: str = Field("planned", description="Procedure status")
    procedure_date: Optional[date] = Field(None, description="Planned/actual procedure date")
    completed_date: Optional[date] = Field(None, description="Completion date")
    procedure_notes: Optional[str] = Field(None, description="Procedure notes")
    complications: Optional[str] = Field(None, description="Any complications")

    @field_validator('status')
    @classmethod
    def validate_status(cls, v: str) -> str:
        """Validate procedure status"""
        v_lower = v.lower()
        if v_lower not in ["planned", "in_progress", "completed", "cancelled"]:
            raise ValueError("Status must be: planned, in_progress, completed, or cancelled")
        return v_lower

    @field_validator('tooth_numbers')
    @classmethod
    def validate_tooth_numbers(cls, v: Optional[str]) -> Optional[str]:
        """Validate comma-separated tooth numbers"""
        if v:
            tooth_list = [t.strip() for t in v.split(',')]
            for tooth in tooth_list:
                if tooth and not is_valid_tooth_number(tooth):
                    raise ValueError(f"Invalid tooth number '{tooth}' in list")
        return v

    model_config = {
        "json_schema_extra": {
            "example": {
                "procedure_code": "D2140",
                "procedure_name": "Amalgam Filling",
                "tooth_numbers": "11,12",
                "description": "Two-surface amalgam filling",
                "estimated_cost": 150.00,
                "duration_minutes": 45,
                "status": "planned",
                "procedure_date": "2025-11-20"
            }
        }
    }


class DentalProcedureCreate(DentalProcedureBase):
    """Schema for creating dental procedure"""
    observation_id: Optional[UUID] = Field(None, description="Related observation ID")
    prescription_id: Optional[UUID] = Field(None, description="Related prescription ID")
    appointment_id: Optional[UUID] = Field(None, description="Related appointment ID")


class DentalProcedureUpdate(BaseModel):
    """Schema for updating dental procedure"""
    procedure_code: Optional[str] = None
    procedure_name: Optional[str] = None
    tooth_numbers: Optional[str] = None
    description: Optional[str] = None
    estimated_cost: Optional[Decimal] = None
    actual_cost: Optional[Decimal] = None
    duration_minutes: Optional[int] = None
    status: Optional[str] = None
    procedure_date: Optional[date] = None
    completed_date: Optional[date] = None
    procedure_notes: Optional[str] = None
    complications: Optional[str] = None


class DentalProcedureResponse(DentalProcedureBase):
    """Schema for dental procedure response"""
    id: UUID
    observation_id: Optional[UUID]
    prescription_id: Optional[UUID]
    appointment_id: Optional[UUID]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DentalProcedureListResponse(BaseModel):
    """Schema for list of dental procedures"""
    procedures: List[DentalProcedureResponse]
    total: int


# ==================== Dental Chart Schemas ====================

class ToothStatusResponse(BaseModel):
    """Schema for individual tooth status"""
    tooth_number: str
    observations: List[DentalObservationResponse] = []
    procedures: List[DentalProcedureResponse] = []
    has_active_issues: bool = False
    last_treatment_date: Optional[date] = None


class DentalChartResponse(BaseModel):
    """Schema for complete dental chart"""
    patient_mobile_number: str
    patient_first_name: str
    dentition_type: str = Field(..., description="permanent, primary, or mixed")
    teeth: List[ToothStatusResponse]
    total_observations: int
    total_procedures: int
    active_treatments: int


# ==================== Bulk Operations ====================

class BulkDentalObservationCreate(BaseModel):
    """Schema for creating multiple observations at once"""
    observations: List[DentalObservationCreate] = Field(..., min_length=1, max_length=32)


class BulkDentalProcedureCreate(BaseModel):
    """Schema for creating multiple procedures at once"""
    procedures: List[DentalProcedureCreate] = Field(..., min_length=1, max_length=20)


# ==================== Search and Filter Schemas ====================

class DentalSearchParams(BaseModel):
    """Search parameters for dental records"""
    patient_mobile_number: Optional[str] = None
    patient_first_name: Optional[str] = None
    tooth_number: Optional[str] = None
    condition_type: Optional[str] = None
    status: Optional[str] = None
    from_date: Optional[date] = None
    to_date: Optional[date] = None
    treatment_required: Optional[bool] = None
    treatment_done: Optional[bool] = None


# ==================== Statistics Schemas ====================

class DentalStatistics(BaseModel):
    """Schema for dental statistics"""
    total_observations: int
    total_procedures: int
    observations_by_condition: Dict[str, int]
    procedures_by_status: Dict[str, int]
    most_affected_teeth: List[Dict[str, Any]]
    treatment_completion_rate: float


# ==================== Procedure Templates ====================

class DentalProcedureTemplate(BaseModel):
    """Schema for procedure template"""
    code: str
    name: str
    duration_minutes: int
    estimated_cost: Optional[Decimal] = None


class DentalProcedureTemplateListResponse(BaseModel):
    """Schema for list of procedure templates"""
    templates: List[DentalProcedureTemplate]
    total: int
