"""
Prescription Schemas for Comprehensive Prescription Management
Handles validation for prescriptions and prescription items with PDF generation support
Integrates with existing patients, doctors, medicines, and short keys modules
"""

from __future__ import annotations

from pydantic import BaseModel, Field, validator, model_validator, computed_field
from typing import Optional, Dict, Any, List, Literal
from datetime import date, datetime, time
from uuid import UUID
from decimal import Decimal
import re

from app.core.config import settings


# Enums for prescription data
PrescriptionStatusEnum = Literal["draft", "active", "dispensed", "completed", "cancelled", "expired"]
FrequencyEnum = Literal["once_daily", "twice_daily", "three_times_daily", "four_times_daily", "as_needed", "custom"]
DurationUnitEnum = Literal["days", "weeks", "months", "as_directed"]


class PrescriptionItemBase(BaseModel):
    """Base prescription item schema"""
    medicine_id: UUID = Field(..., description="Medicine ID")
    dosage: str = Field(..., min_length=1, max_length=100, description="Medicine dosage (e.g., 500mg)")
    frequency: str = Field(..., min_length=1, max_length=100, description="Frequency of intake")
    duration: str = Field(..., min_length=1, max_length=100, description="Duration of treatment")
    instructions: Optional[str] = Field(None, max_length=500, description="Special instructions")
    quantity: int = Field(1, ge=1, le=1000, description="Number of units prescribed")
    unit_price: Optional[Decimal] = Field(None, ge=0, le=999999.99, description="Price per unit")
    is_generic_substitution_allowed: bool = Field(True, description="Allow generic substitution")
    sequence_order: Optional[int] = Field(None, ge=1, description="Order in prescription")

    @validator('dosage', 'frequency', 'duration')
    def validate_required_fields(cls, v):
        """Validate required prescription fields"""
        if not v or not v.strip():
            raise ValueError("Field is required and cannot be empty")
        return v.strip()

    @validator('unit_price')
    def validate_unit_price(cls, v):
        """Validate unit price"""
        if v is not None and v < 0:
            raise ValueError("Unit price cannot be negative")
        return v

    model_config = {
        "json_schema_extra": {
            "example": {
                "medicine_id": "123e4567-e89b-12d3-a456-426614174000",
                "dosage": "500mg",
                "frequency": "Twice daily",
                "duration": "5 days",
                "instructions": "Take after meals",
                "quantity": 10,
                "unit_price": 25.50,
                "is_generic_substitution_allowed": True,
                "sequence_order": 1
            }
        }
    }


class PrescriptionItemCreate(PrescriptionItemBase):
    """Schema for creating prescription items"""
    pass


class PrescriptionItemUpdate(BaseModel):
    """Schema for updating prescription items"""
    dosage: Optional[str] = Field(None, min_length=1, max_length=100)
    frequency: Optional[str] = Field(None, min_length=1, max_length=100)
    duration: Optional[str] = Field(None, min_length=1, max_length=100)
    instructions: Optional[str] = Field(None, max_length=500)
    quantity: Optional[int] = Field(None, ge=1, le=1000)
    unit_price: Optional[Decimal] = Field(None, ge=0, le=999999.99)
    is_generic_substitution_allowed: Optional[bool] = Field(None)
    sequence_order: Optional[int] = Field(None, ge=1)

    @validator('dosage', 'frequency', 'duration')
    def validate_required_fields(cls, v):
        """Validate fields if provided"""
        if v is not None and (not v or not v.strip()):
            raise ValueError("Field cannot be empty if provided")
        return v.strip() if v else v


class PrescriptionItemResponse(BaseModel):
    """Schema for prescription item response"""
    id: UUID
    prescription_id: UUID
    medicine_id: UUID
    medicine_name: Optional[str] = Field(None, description="Medicine name (populated from medicine table)")
    dosage: str
    frequency: str
    duration: str
    instructions: Optional[str]
    quantity: int
    unit_price: Optional[Decimal]
    total_amount: Optional[Decimal]
    is_generic_substitution_allowed: bool
    sequence_order: int

    # Audit fields
    created_at: datetime
    updated_at: datetime
    created_by: Optional[UUID]
    is_active: bool

    @computed_field
    @property
    def formatted_instruction(self) -> str:
        """Get formatted instruction for display"""
        parts = []
        
        if self.dosage:
            parts.append(f"Dosage: {self.dosage}")
        
        if self.frequency:
            parts.append(f"Frequency: {self.frequency}")
        
        if self.duration:
            parts.append(f"Duration: {self.duration}")
        
        if self.instructions:
            parts.append(f"Instructions: {self.instructions}")
        
        return " | ".join(parts)

    @computed_field
    @property
    def calculated_total(self) -> float:
        """Calculate total amount"""
        if self.unit_price and self.quantity:
            return float(self.unit_price) * self.quantity
        return 0.0

    model_config = {
        "from_attributes": True,
        "json_encoders": {
            datetime: lambda v: v.isoformat(),
            UUID: lambda v: str(v),
            Decimal: lambda v: float(v)
        }
    }


class PrescriptionBase(BaseModel):
    """Base prescription schema"""
    # Patient identification (composite key)
    patient_mobile_number: str = Field(..., min_length=10, max_length=15, description="Patient mobile number")
    patient_first_name: str = Field(..., min_length=2, max_length=100, description="Patient first name")
    patient_uuid: UUID = Field(..., description="Patient UUID for internal reference")
    
    # Doctor and appointment
    doctor_id: UUID = Field(..., description="Prescribing doctor ID")
    appointment_id: Optional[UUID] = Field(None, description="Related appointment if any")
    
    # Visit information
    visit_date: date = Field(default_factory=date.today, description="Date of visit/consultation")
    
    # Clinical information
    chief_complaint: Optional[str] = Field(None, max_length=1000, description="Patient's main complaint")
    diagnosis: str = Field(..., min_length=3, max_length=1000, description="Medical diagnosis")
    symptoms: Optional[str] = Field(None, max_length=1000, description="Observed symptoms")
    clinical_notes: Optional[str] = Field(None, max_length=2000, description="Doctor's clinical notes")
    doctor_instructions: Optional[str] = Field(None, max_length=1000, description="Special instructions for patient")
    
    # Status
    status: PrescriptionStatusEnum = Field(default="active", description="Prescription status")

    @validator('patient_mobile_number')
    def validate_mobile_number(cls, v):
        """Validate patient mobile number format"""
        cleaned = re.sub(r'[^\d+]', '', v)
        if not re.match(r'^[6-9]\d{9}$', cleaned):
            raise ValueError("Invalid mobile number format")
        return cleaned

    @validator('patient_first_name')
    def validate_first_name(cls, v):
        """Validate patient first name"""
        if not v or not v.strip():
            raise ValueError("First name is required")
        
        cleaned_name = v.strip()
        if not re.match(r'^[a-zA-Z\s]+$', cleaned_name):
            raise ValueError("First name should contain only letters and spaces")
        
        return cleaned_name.title()

    @validator('diagnosis')
    def validate_diagnosis(cls, v):
        """Validate diagnosis"""
        if not v or not v.strip():
            raise ValueError("Diagnosis is required")
        
        diagnosis = v.strip()
        if len(diagnosis) < 3:
            raise ValueError("Diagnosis must be at least 3 characters")
        
        return diagnosis

    @validator('visit_date')
    def validate_visit_date(cls, v):
        """Validate visit date"""
        if v > date.today():
            raise ValueError("Visit date cannot be in the future")
        return v


class PrescriptionCreate(PrescriptionBase):
    """Schema for creating prescriptions"""
    tenant_id: Optional[UUID] = Field(None, description="Tenant ID for multi-tenancy")
    items: List[PrescriptionItemCreate] = Field(default=[], description="Prescription items")

    # Optional fields for quick creation
    short_key_code: Optional[str] = Field(None, min_length=2, max_length=20, description="Short key for quick prescription")
    template_id: Optional[UUID] = Field(None, description="Prescription template ID")

    @model_validator(mode='after')
    def validate_prescription_data(self):
        """Validate prescription data integrity"""
        # Ensure at least one prescription method (items or short_key)
        if (not self.items or len(self.items) == 0) and not self.short_key_code:
            raise ValueError("Either prescription items or short key code is required")
        
        return self

    model_config = {
        "json_schema_extra": {
            "example": {
                "patient_mobile_number": "9876543210",
                "patient_first_name": "John",
                "patient_uuid": "123e4567-e89b-12d3-a456-426614174000",
                "doctor_id": "456e7890-e89b-12d3-a456-426614174000",
                "visit_date": "2024-01-15",
                "chief_complaint": "Headache and fever for 2 days",
                "diagnosis": "Viral fever with headache",
                "symptoms": "High temperature, body ache, headache",
                "clinical_notes": "Patient appears dehydrated. Advised rest and fluids.",
                "doctor_instructions": "Take complete rest for 3 days. Drink plenty of fluids.",
                "items": [
                    {
                        "medicine_id": "789e1234-e89b-12d3-a456-426614174000",
                        "dosage": "500mg",
                        "frequency": "Twice daily",
                        "duration": "5 days",
                        "instructions": "Take after meals",
                        "quantity": 10
                    }
                ]
            }
        }
    }


class PrescriptionUpdate(BaseModel):
    """Schema for updating prescriptions"""
    # Clinical information updates
    chief_complaint: Optional[str] = Field(None, max_length=1000)
    diagnosis: Optional[str] = Field(None, min_length=3, max_length=1000)
    symptoms: Optional[str] = Field(None, max_length=1000)
    clinical_notes: Optional[str] = Field(None, max_length=2000)
    doctor_instructions: Optional[str] = Field(None, max_length=1000)
    
    # Status updates
    status: Optional[PrescriptionStatusEnum] = Field(None)
    
    # Template information
    template_used: Optional[str] = Field(None, max_length=100)

    @validator('diagnosis')
    def validate_diagnosis(cls, v):
        """Validate diagnosis if provided"""
        if v is not None:
            if not v or not v.strip():
                raise ValueError("Diagnosis cannot be empty if provided")
            
            diagnosis = v.strip()
            if len(diagnosis) < 3:
                raise ValueError("Diagnosis must be at least 3 characters")
            
            return diagnosis
        return v


class PrescriptionResponse(BaseModel):
    """Schema for prescription response with computed fields"""
    # Basic prescription information
    id: UUID
    prescription_number: str

    # Patient information (composite key)
    patient_mobile_number: str
    patient_first_name: str
    patient_uuid: UUID

    # Doctor and appointment
    doctor_id: UUID
    appointment_id: Optional[UUID]

    # Visit information
    visit_date: date

    # Clinical information
    chief_complaint: Optional[str]
    diagnosis: str
    symptoms: Optional[str]
    clinical_notes: Optional[str]
    doctor_instructions: Optional[str]

    # Status and metadata
    status: PrescriptionStatusEnum
    is_printed: bool
    printed_at: Optional[datetime]
    template_used: Optional[str]

    # Prescription items
    items: Optional[List[PrescriptionItemResponse]] = Field(default=[], description="Prescription items")

    # Clinic details (from doctor's offices via appointment)
    clinic_name: Optional[str] = Field(None, description="Clinic name where appointment was booked")
    clinic_address: Optional[str] = Field(None, description="Clinic address where appointment was booked")

    # Doctor details (from doctor relationship)
    doctor_name: Optional[str] = Field(None, description="Doctor's full name")
    doctor_specialization: Optional[str] = Field(None, description="Doctor's specialization")

    # Audit fields
    created_by: Optional[UUID]
    created_at: datetime
    updated_at: datetime
    is_active: bool

    @computed_field
    @property
    def patient_composite_key(self) -> tuple:
        """Get patient composite key"""
        return (self.patient_mobile_number, self.patient_first_name)

    @computed_field
    @property
    def total_medicines(self) -> int:
        """Get total number of medicines prescribed"""
        return len(self.items)

    @computed_field
    @property
    def total_amount(self) -> float:
        """Calculate total prescription amount"""
        total = 0.0
        for item in self.items:
            if item.total_amount:
                total += float(item.total_amount)
        return total

    @computed_field
    @property
    def can_be_modified(self) -> bool:
        """Check if prescription can still be modified"""
        return self.status in ['draft', 'active']

    @computed_field
    @property
    def is_expired(self) -> bool:
        """Check if prescription is expired"""
        if self.status == 'expired':
            return True
        
        # Check if prescription is older than validity period
        from datetime import timedelta
        validity_days = getattr(settings, 'PRESCRIPTION_VALIDITY_DAYS', 30)
        expiry_date = self.visit_date + timedelta(days=validity_days)
        
        return date.today() > expiry_date

    @computed_field
    @property
    def days_until_expiry(self) -> int:
        """Get days until prescription expires"""
        from datetime import timedelta
        validity_days = getattr(settings, 'PRESCRIPTION_VALIDITY_DAYS', 30)
        expiry_date = self.visit_date + timedelta(days=validity_days)
        
        days_left = (expiry_date - date.today()).days
        return max(0, days_left)

    model_config = {
        "from_attributes": True,
        "json_encoders": {
            date: lambda v: v.isoformat(),
            datetime: lambda v: v.isoformat(),
            UUID: lambda v: str(v),
            Decimal: lambda v: float(v)
        }
    }


class PrescriptionListResponse(BaseModel):
    """Schema for paginated prescription list response"""
    prescriptions: List[PrescriptionResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_prev: bool

    model_config = {
        "json_encoders": {
            date: lambda v: v.isoformat(),
            datetime: lambda v: v.isoformat(),
            UUID: lambda v: str(v)
        }
    }


class PrescriptionSearchParams(BaseModel):
    """Schema for prescription search parameters"""
    # Patient search
    patient_mobile_number: Optional[str] = Field(None, description="Search by patient mobile")
    patient_first_name: Optional[str] = Field(None, description="Search by patient name")
    patient_uuid: Optional[UUID] = Field(None, description="Search by patient UUID")
    
    # Doctor search
    doctor_id: Optional[UUID] = Field(None, description="Filter by doctor")

    # Appointment search
    appointment_id: Optional[UUID] = Field(None, description="Filter by appointment")

    # Date filters
    visit_date_from: Optional[date] = Field(None, description="Visit date from")
    visit_date_to: Optional[date] = Field(None, description="Visit date to")
    
    # Status filters
    status: Optional[PrescriptionStatusEnum] = Field(None, description="Filter by status")
    is_printed: Optional[bool] = Field(None, description="Filter by print status")
    
    # Text search
    diagnosis: Optional[str] = Field(None, description="Search in diagnosis")
    prescription_number: Optional[str] = Field(None, description="Search by prescription number")
    
    # Date range filters
    created_from: Optional[date] = Field(None, description="Created date from")
    created_to: Optional[date] = Field(None, description="Created date to")
    
    # Pagination
    page: int = Field(1, ge=1, description="Page number")
    page_size: int = Field(20, ge=1, le=100, description="Page size")
    
    # Sorting
    sort_by: Optional[str] = Field("visit_date", description="Sort field")
    sort_order: Optional[Literal["asc", "desc"]] = Field("desc", description="Sort order")

    @validator('visit_date_to')
    def validate_date_range(cls, v, values):
        """Validate date range"""
        visit_date_from = values.get('visit_date_from')
        if visit_date_from and v and v < visit_date_from:
            raise ValueError("Visit date 'to' must be after 'from' date")
        return v


class ShortKeyPrescriptionCreate(BaseModel):
    """Schema for creating prescription from short key"""
    # Multi-tenancy
    tenant_id: Optional[UUID] = Field(None, description="Tenant ID for multi-tenancy")

    # Patient identification
    patient_mobile_number: str = Field(..., min_length=10, max_length=15)
    patient_first_name: str = Field(..., min_length=2, max_length=100)
    patient_uuid: UUID = Field(...)

    # Doctor
    doctor_id: UUID = Field(...)
    
    # Short key
    short_key_code: str = Field(..., min_length=2, max_length=20)
    
    # Visit information
    visit_date: date = Field(default_factory=date.today)
    diagnosis: str = Field(..., min_length=3, max_length=1000)
    
    # Optional clinical information
    chief_complaint: Optional[str] = Field(None, max_length=1000)
    symptoms: Optional[str] = Field(None, max_length=1000)
    clinical_notes: Optional[str] = Field(None, max_length=2000)
    doctor_instructions: Optional[str] = Field(None, max_length=1000)

    @validator('patient_mobile_number')
    def validate_mobile_number(cls, v):
        """Validate patient mobile number format"""
        cleaned = re.sub(r'[^\d+]', '', v)
        if not re.match(r'^[6-9]\d{9}$', cleaned):
            raise ValueError("Invalid mobile number format")
        return cleaned

    @validator('patient_first_name')
    def validate_first_name(cls, v):
        """Validate patient first name"""
        cleaned_name = v.strip()
        if not re.match(r'^[a-zA-Z\s]+$', cleaned_name):
            raise ValueError("First name should contain only letters and spaces")
        return cleaned_name.title()


class PrescriptionPrintRequest(BaseModel):
    """Schema for prescription print request"""
    template: Optional[str] = Field("default", description="Print template to use")
    include_prices: bool = Field(False, description="Include medicine prices")
    include_instructions: bool = Field(True, description="Include detailed instructions")
    format: Literal["pdf", "html"] = Field("pdf", description="Output format")


class PrescriptionStatsResponse(BaseModel):
    """Schema for prescription statistics response"""
    total_prescriptions: int
    active_prescriptions: int
    completed_prescriptions: int
    draft_prescriptions: int
    cancelled_prescriptions: int
    expired_prescriptions: int
    printed_prescriptions: int
    
    # Recent activity
    prescriptions_today: int
    prescriptions_this_week: int
    prescriptions_this_month: int
    
    # Top diagnoses
    top_diagnoses: List[Dict[str, Any]] = Field(default=[])
    
    # Doctor performance
    top_prescribing_doctors: List[Dict[str, Any]] = Field(default=[])

    model_config = {
        "json_schema_extra": {
            "example": {
                "total_prescriptions": 1250,
                "active_prescriptions": 89,
                "completed_prescriptions": 1100,
                "draft_prescriptions": 15,
                "cancelled_prescriptions": 25,
                "expired_prescriptions": 21,
                "printed_prescriptions": 1180,
                "prescriptions_today": 12,
                "prescriptions_this_week": 65,
                "prescriptions_this_month": 245
            }
        }
    }


class PrescriptionValidationRequest(BaseModel):
    """Schema for prescription validation request"""
    patient_mobile_number: str = Field(..., description="Patient mobile number")
    patient_first_name: str = Field(..., description="Patient first name")
    doctor_id: UUID = Field(..., description="Doctor ID")
    items: List[PrescriptionItemCreate] = Field(..., min_items=1)

    @validator('patient_mobile_number')
    def validate_mobile_number(cls, v):
        """Validate mobile number format"""
        cleaned = re.sub(r'[^\d+]', '', v)
        if not re.match(r'^[6-9]\d{9}$', cleaned):
            raise ValueError("Invalid mobile number format")
        return cleaned


class ValidationErrorResponse(BaseModel):
    """Schema for validation error responses"""
    is_valid: bool = False
    errors: List[str]
    warnings: List[str] = Field(default=[])


class BulkPrescriptionRequest(BaseModel):
    """Schema for bulk prescription operations"""
    prescription_ids: List[UUID] = Field(..., min_items=1, max_items=100)
    operation: Literal["cancel", "complete", "print", "activate"] = Field(...)
    reason: Optional[str] = Field(None, max_length=500)
    template: Optional[str] = Field(None, description="Template for print operations")


class BulkOperationResponse(BaseModel):
    """Schema for bulk operation response"""
    total_requested: int
    successful: int
    failed: int
    results: List[Dict[str, Any]] = Field(default=[])
    errors: List[str] = Field(default=[])