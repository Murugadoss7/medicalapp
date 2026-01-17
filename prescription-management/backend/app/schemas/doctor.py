"""
Doctor Pydantic schemas for API validation
Following ERD specifications and business requirements
"""

from __future__ import annotations

from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime


class OfficeLocation(BaseModel):
    """Schema for office location"""
    id: str = Field(..., description="Unique office ID (UUID string)")
    name: str = Field(..., max_length=200, description="Office name (e.g., 'Main Clinic')")
    address: str = Field(..., description="Full office address")
    is_primary: bool = Field(False, description="Whether this is the primary office")
    is_tenant_default: bool = Field(False, description="Whether this is the tenant's registered clinic (non-deletable)")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "office-123",
                "name": "Main Clinic",
                "address": "123 Medical Center, Chrompet, Chennai",
                "is_primary": True,
                "is_tenant_default": False
            }
        }


class DoctorBase(BaseModel):
    """Base doctor schema with common fields"""
    license_number: str = Field(..., min_length=5, max_length=100, description="Medical license number")
    specialization: Optional[str] = Field(None, max_length=255, description="Medical specialization")
    qualification: Optional[str] = Field(None, description="Educational qualifications and certifications")
    experience_years: Optional[int] = Field(None, ge=0, le=70, description="Years of medical experience")
    clinic_address: Optional[str] = Field(None, description="Clinic or hospital address (deprecated - use offices)")
    offices: Optional[List[OfficeLocation]] = Field(None, description="List of office locations")
    phone: Optional[str] = Field(None, max_length=20, description="Professional contact number")
    consultation_fee: Optional[str] = Field(None, max_length=20, description="Consultation fee")
    consultation_duration: Optional[int] = Field(30, ge=10, le=240, description="Default consultation duration in minutes")


class DoctorCreate(DoctorBase):
    """Schema for creating a new doctor profile"""
    user_id: UUID = Field(..., description="Reference to user account")
    tenant_id: Optional[UUID] = Field(None, description="Tenant ID for multi-tenancy")
    availability_schedule: Optional[Dict[str, List[Dict[str, str]]]] = Field(
        None,
        description="Weekly availability schedule"
    )
    
    @validator('license_number')
    def validate_license_number(cls, v):
        if not v or not v.strip():
            raise ValueError('License number is required')
        return v.strip().upper()
    
    @validator('availability_schedule')
    def validate_availability_schedule(cls, v):
        if v is None:
            return v
        
        valid_days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        
        for day, slots in v.items():
            if day.lower() not in valid_days:
                raise ValueError(f'Invalid day: {day}')
            
            if not isinstance(slots, list):
                raise ValueError(f'Slots for {day} must be a list')
            
            for slot in slots:
                if not isinstance(slot, dict) or 'start_time' not in slot or 'end_time' not in slot:
                    raise ValueError(f'Invalid slot format for {day}. Must have start_time and end_time')
                
                # Basic time format validation
                start_time = slot['start_time']
                end_time = slot['end_time']
                
                if not isinstance(start_time, str) or not isinstance(end_time, str):
                    raise ValueError(f'Time values must be strings')
                
                # Simple time format check (HH:MM)
                import re
                time_pattern = r'^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
                if not re.match(time_pattern, start_time) or not re.match(time_pattern, end_time):
                    raise ValueError(f'Time format must be HH:MM (24-hour format)')
        
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "123e4567-e89b-12d3-a456-426614174000",
                "license_number": "DOC123456",
                "specialization": "Cardiology",
                "qualification": "MBBS, MD (Cardiology), Fellowship in Interventional Cardiology",
                "experience_years": 10,
                "clinic_address": "123 Medical Center, Healthcare District",
                "phone": "+1-555-0123",
                "consultation_fee": "100",
                "consultation_duration": 30,
                "availability_schedule": {
                    "monday": [{"start_time": "09:00", "end_time": "17:00"}],
                    "tuesday": [{"start_time": "09:00", "end_time": "17:00"}],
                    "wednesday": [{"start_time": "09:00", "end_time": "17:00"}],
                    "thursday": [{"start_time": "09:00", "end_time": "17:00"}],
                    "friday": [{"start_time": "09:00", "end_time": "17:00"}],
                    "saturday": [{"start_time": "09:00", "end_time": "13:00"}],
                    "sunday": []
                }
            }
        }


class DoctorUpdate(BaseModel):
    """Schema for updating doctor profile"""
    license_number: Optional[str] = Field(None, min_length=5, max_length=100)
    specialization: Optional[str] = Field(None, max_length=255)
    qualification: Optional[str] = Field(None)
    experience_years: Optional[int] = Field(None, ge=0, le=70)
    clinic_address: Optional[str] = Field(None)
    offices: Optional[List[OfficeLocation]] = Field(None, description="List of office locations")
    phone: Optional[str] = Field(None, max_length=20)
    consultation_fee: Optional[str] = Field(None, max_length=20)
    consultation_duration: Optional[int] = Field(None, ge=10, le=240)
    availability_schedule: Optional[Dict[str, List[Dict[str, str]]]] = Field(None)
    
    @validator('license_number')
    def validate_license_number(cls, v):
        if v is not None:
            if not v.strip():
                raise ValueError('License number cannot be empty')
            return v.strip().upper()
        return v
    
    @validator('availability_schedule')
    def validate_availability_schedule(cls, v):
        if v is None:
            return v
        
        valid_days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        
        for day, slots in v.items():
            if day.lower() not in valid_days:
                raise ValueError(f'Invalid day: {day}')
            
            if not isinstance(slots, list):
                raise ValueError(f'Slots for {day} must be a list')
            
            for slot in slots:
                if not isinstance(slot, dict) or 'start_time' not in slot or 'end_time' not in slot:
                    raise ValueError(f'Invalid slot format for {day}. Must have start_time and end_time')
        
        return v


class DoctorResponse(DoctorBase):
    """Schema for doctor response"""
    id: UUID
    user_id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime
    availability_schedule: Optional[Dict[str, List[Dict[str, str]]]]
    
    # User information
    user_email: Optional[str] = Field(None, description="User email address")
    first_name: Optional[str] = Field(None, description="Doctor's first name")
    last_name: Optional[str] = Field(None, description="Doctor's last name")
    user_role: Optional[str] = Field(None, description="User role")
    
    # Computed fields
    full_name: Optional[str] = Field(None, description="Doctor's full name with title")
    specializations_list: Optional[List[str]] = Field(None, description="List of specializations")
    experience_range: Optional[str] = Field(None, description="Experience range description")
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "user_id": "123e4567-e89b-12d3-a456-426614174001",
                "license_number": "DOC123456",
                "specialization": "Cardiology",
                "qualification": "MBBS, MD (Cardiology)",
                "experience_years": 10,
                "clinic_address": "123 Medical Center",
                "phone": "+1-555-0123",
                "consultation_fee": "100",
                "consultation_duration": 30,
                "is_active": True,
                "created_at": "2025-10-30T12:00:00Z",
                "updated_at": "2025-10-30T12:00:00Z",
                "availability_schedule": {
                    "monday": [{"start_time": "09:00", "end_time": "17:00"}],
                    "tuesday": [{"start_time": "09:00", "end_time": "17:00"}]
                },
                "user_email": "doctor@example.com",
                "first_name": "John",
                "last_name": "Doe",
                "user_role": "doctor",
                "full_name": "Dr. John Doe",
                "specializations_list": ["Cardiology"],
                "experience_range": "10-20 years"
            }
        }


class DoctorListResponse(BaseModel):
    """Schema for doctor list response with pagination"""
    doctors: List[DoctorResponse]
    total: int
    page: int
    per_page: int
    total_pages: int
    
    class Config:
        json_schema_extra = {
            "example": {
                "doctors": [
                    {
                        "id": "123e4567-e89b-12d3-a456-426614174000",
                        "license_number": "DOC123456",
                        "specialization": "Cardiology",
                        "full_name": "Dr. John Doe",
                        "experience_years": 10,
                        "is_active": True
                    }
                ],
                "total": 1,
                "page": 1,
                "per_page": 10,
                "total_pages": 1
            }
        }


class DoctorSearchQuery(BaseModel):
    """Schema for doctor search parameters"""
    query: Optional[str] = Field(None, max_length=255, description="Search by name or license number")
    specialization: Optional[str] = Field(None, max_length=255, description="Filter by specialization")
    min_experience: Optional[int] = Field(None, ge=0, description="Minimum years of experience")
    is_active: Optional[bool] = Field(True, description="Filter by active status")
    page: Optional[int] = Field(1, ge=1, description="Page number")
    per_page: Optional[int] = Field(10, ge=1, le=100, description="Items per page")
    
    class Config:
        json_schema_extra = {
            "example": {
                "query": "john",
                "specialization": "cardiology",
                "min_experience": 5,
                "is_active": True,
                "page": 1,
                "per_page": 10
            }
        }


class DoctorScheduleUpdate(BaseModel):
    """Schema for updating doctor availability schedule"""
    availability_schedule: Dict[str, List[Dict[str, str]]] = Field(
        ..., 
        description="Weekly availability schedule"
    )
    
    @validator('availability_schedule')
    def validate_availability_schedule(cls, v):
        valid_days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        
        for day, slots in v.items():
            if day.lower() not in valid_days:
                raise ValueError(f'Invalid day: {day}')
            
            if not isinstance(slots, list):
                raise ValueError(f'Slots for {day} must be a list')
            
            for slot in slots:
                if not isinstance(slot, dict) or 'start_time' not in slot or 'end_time' not in slot:
                    raise ValueError(f'Invalid slot format for {day}. Must have start_time and end_time')
                
                # Basic time format validation
                start_time = slot['start_time']
                end_time = slot['end_time']
                
                if not isinstance(start_time, str) or not isinstance(end_time, str):
                    raise ValueError(f'Time values must be strings')
                
                # Simple time format check (HH:MM)
                import re
                time_pattern = r'^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
                if not re.match(time_pattern, start_time) or not re.match(time_pattern, end_time):
                    raise ValueError(f'Time format must be HH:MM (24-hour format)')
        
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "availability_schedule": {
                    "monday": [
                        {"start_time": "09:00", "end_time": "12:00"},
                        {"start_time": "14:00", "end_time": "17:00"}
                    ],
                    "tuesday": [{"start_time": "09:00", "end_time": "17:00"}],
                    "wednesday": [{"start_time": "09:00", "end_time": "17:00"}],
                    "thursday": [{"start_time": "09:00", "end_time": "17:00"}],
                    "friday": [{"start_time": "09:00", "end_time": "17:00"}],
                    "saturday": [{"start_time": "09:00", "end_time": "13:00"}],
                    "sunday": []
                }
            }
        }


class DoctorScheduleResponse(BaseModel):
    """Schema for doctor schedule response"""
    doctor_id: UUID
    full_name: str
    availability_schedule: Dict[str, List[Dict[str, str]]]
    consultation_duration: int
    
    class Config:
        json_schema_extra = {
            "example": {
                "doctor_id": "123e4567-e89b-12d3-a456-426614174000",
                "full_name": "Dr. John Doe",
                "availability_schedule": {
                    "monday": [{"start_time": "09:00", "end_time": "17:00"}],
                    "tuesday": [{"start_time": "09:00", "end_time": "17:00"}]
                },
                "consultation_duration": 30
            }
        }


class DoctorStats(BaseModel):
    """Schema for doctor statistics"""
    total_doctors: int
    active_doctors: int
    specialization_counts: Dict[str, int]
    experience_distribution: Dict[str, int]
    
    class Config:
        json_schema_extra = {
            "example": {
                "total_doctors": 10,
                "active_doctors": 9,
                "specialization_counts": {
                    "Cardiology": 3,
                    "Neurology": 2,
                    "General Practice": 4
                },
                "experience_distribution": {
                    "0-5 years": 3,
                    "5-10 years": 4,
                    "10+ years": 2
                }
            }
        }