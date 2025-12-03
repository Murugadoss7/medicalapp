"""
Appointment Schemas for Doctor-Patient Scheduling
Handles appointment management with composite key support
"""

from __future__ import annotations

from pydantic import BaseModel, Field, validator, model_validator, computed_field
from typing import Optional, Dict, Any, List, Literal
from datetime import datetime, date, time
from uuid import UUID
import re


class AppointmentBase(BaseModel):
    """Base appointment schema with common fields"""
    # Patient reference using composite key
    patient_mobile_number: str = Field(..., min_length=10, max_length=15, description="Patient mobile number")
    patient_first_name: str = Field(..., min_length=2, max_length=100, description="Patient first name")
    patient_uuid: UUID = Field(..., description="Patient UUID for internal reference")

    # Doctor and scheduling
    doctor_id: UUID = Field(..., description="Assigned doctor ID")
    office_id: Optional[str] = Field(None, max_length=50, description="Office ID from doctor's offices array")
    appointment_date: date = Field(..., description="Appointment date")
    appointment_time: time = Field(..., description="Appointment time")

    # Appointment details
    reason_for_visit: str = Field(..., min_length=3, max_length=1000, description="Reason for visit")
    notes: Optional[str] = Field(None, max_length=2000, description="Additional notes")
    duration_minutes: int = Field(30, ge=10, le=480, description="Duration in minutes")
    contact_number: Optional[str] = Field(None, max_length=20, description="Contact number")

    @validator('patient_mobile_number')
    def validate_mobile_number(cls, v):
        """Validate Indian mobile number format"""
        if not v:
            raise ValueError("Mobile number is required")
        
        # Remove any spaces or special characters
        mobile = re.sub(r'[^0-9]', '', v)
        
        # Check Indian mobile number pattern
        if not re.match(r'^[6-9]\d{9}$', mobile):
            raise ValueError("Invalid Indian mobile number format")
        
        return mobile

    @validator('patient_first_name')
    def validate_first_name(cls, v):
        """Validate patient first name"""
        if not v or not v.strip():
            raise ValueError("Patient first name is required")
        
        v = v.strip().title()
        if len(v) < 2:
            raise ValueError("First name must be at least 2 characters")
        
        return v

    @validator('reason_for_visit')
    def validate_reason(cls, v):
        """Validate reason for visit"""
        if not v or not v.strip():
            raise ValueError("Reason for visit is required")
        
        v = v.strip()
        if len(v) < 3:
            raise ValueError("Reason must be at least 3 characters")
        
        return v

    @validator('appointment_date')
    def validate_appointment_date(cls, v):
        """Validate appointment date is not in the past"""
        if v < date.today():
            raise ValueError("Appointment date cannot be in the past")
        
        return v

    @validator('contact_number')
    def validate_contact_number(cls, v):
        """Validate contact number if provided"""
        if v:
            mobile = re.sub(r'[^0-9]', '', v)
            if not re.match(r'^[6-9]\d{9}$', mobile):
                raise ValueError("Invalid contact number format")
            return mobile
        return v


class AppointmentCreate(AppointmentBase):
    """Schema for creating a new appointment"""
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "patient_mobile_number": "9876543210",
                "patient_first_name": "John",
                "patient_uuid": "123e4567-e89b-12d3-a456-426614174000",
                "doctor_id": "123e4567-e89b-12d3-a456-426614174001",
                "appointment_date": "2025-11-15",
                "appointment_time": "10:30:00",
                "reason_for_visit": "Regular checkup and consultation",
                "notes": "Patient prefers morning appointments",
                "duration_minutes": 30,
                "contact_number": "9876543210"
            }
        }
    }


class AppointmentUpdate(BaseModel):
    """Schema for updating appointment"""
    appointment_date: Optional[date] = Field(None, description="New appointment date")
    appointment_time: Optional[time] = Field(None, description="New appointment time")
    reason_for_visit: Optional[str] = Field(None, min_length=3, max_length=1000)
    notes: Optional[str] = Field(None, max_length=2000)
    duration_minutes: Optional[int] = Field(None, ge=10, le=480)
    contact_number: Optional[str] = Field(None, max_length=20)

    @validator('appointment_date')
    def validate_date_if_provided(cls, v):
        """Validate date if provided"""
        if v is not None and v < date.today():
            raise ValueError("Appointment date cannot be in the past")
        return v

    @validator('reason_for_visit')
    def validate_reason_if_provided(cls, v):
        """Validate reason if provided"""
        if v is not None:
            v = v.strip()
            if len(v) < 3:
                raise ValueError("Reason must be at least 3 characters")
        return v

    @validator('contact_number')
    def validate_contact_if_provided(cls, v):
        """Validate contact number if provided"""
        if v:
            mobile = re.sub(r'[^0-9]', '', v)
            if not re.match(r'^[6-9]\d{9}$', mobile):
                raise ValueError("Invalid contact number format")
            return mobile
        return v


class AppointmentReschedule(BaseModel):
    """Schema for rescheduling appointment"""
    appointment_date: date = Field(..., description="New appointment date")
    appointment_time: time = Field(..., description="New appointment time")
    reason: Optional[str] = Field(None, max_length=500, description="Reason for rescheduling")

    @validator('appointment_date')
    def validate_reschedule_date(cls, v):
        """Validate reschedule date"""
        if v < date.today():
            raise ValueError("Appointment date cannot be in the past")
        return v


class AppointmentStatusUpdate(BaseModel):
    """Schema for updating appointment status"""
    status: Literal["scheduled", "confirmed", "in_progress", "completed", "cancelled", "no_show"] = Field(..., description="New status")
    notes: Optional[str] = Field(None, max_length=1000, description="Status update notes")


class AppointmentResponse(BaseModel):
    """Schema for appointment response"""
    id: UUID
    appointment_number: str
    
    # Patient details
    patient_mobile_number: str
    patient_first_name: str
    patient_uuid: UUID
    
    # Doctor and scheduling
    doctor_id: UUID
    office_id: Optional[str] = Field(None, description="Office ID from doctor's offices array")
    appointment_date: date
    appointment_time: time
    
    # Status and details
    status: str
    reason_for_visit: str
    notes: Optional[str]
    duration_minutes: int
    contact_number: Optional[str]
    
    # Timestamps
    created_at: datetime
    updated_at: datetime
    is_active: bool
    
    # Related data (populated by service)
    patient_details: Optional[Dict[str, Any]] = Field(default=None)
    doctor_details: Optional[Dict[str, Any]] = Field(default=None)
    
    @computed_field
    @property
    def appointment_datetime(self) -> datetime:
        """Get appointment as datetime"""
        return datetime.combine(self.appointment_date, self.appointment_time)
    
    @computed_field
    @property
    def end_datetime(self) -> datetime:
        """Get appointment end datetime"""
        from datetime import timedelta
        return self.appointment_datetime + timedelta(minutes=self.duration_minutes)
    
    @computed_field
    @property
    def is_today(self) -> bool:
        """Check if appointment is today"""
        return self.appointment_date == date.today()
    
    @computed_field
    @property
    def is_upcoming(self) -> bool:
        """Check if appointment is upcoming"""
        return self.appointment_datetime > datetime.now()
    
    @computed_field
    @property
    def is_past(self) -> bool:
        """Check if appointment is in the past"""
        return self.appointment_datetime < datetime.now()
    
    @computed_field
    @property
    def can_be_cancelled(self) -> bool:
        """Check if appointment can be cancelled"""
        return self.status in ['scheduled', 'confirmed'] and self.is_upcoming
    
    @computed_field
    @property
    def can_be_rescheduled(self) -> bool:
        """Check if appointment can be rescheduled"""
        return self.status in ['scheduled', 'confirmed'] and self.is_upcoming
    
    @computed_field
    @property
    def status_display(self) -> str:
        """Get human-readable status"""
        status_map = {
            'scheduled': 'Scheduled',
            'confirmed': 'Confirmed',
            'in_progress': 'In Progress',
            'completed': 'Completed',
            'cancelled': 'Cancelled',
            'no_show': 'No Show',
            'rescheduled': 'Rescheduled'
        }
        return status_map.get(self.status, self.status)
    
    model_config = {
        "from_attributes": True,
        "json_encoders": {
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat(),
            time: lambda v: v.isoformat(),
            UUID: lambda v: str(v)
        }
    }


class AppointmentListResponse(BaseModel):
    """Schema for paginated appointment list response"""
    appointments: List[AppointmentResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_prev: bool
    
    model_config = {
        "json_encoders": {
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat(),
            time: lambda v: v.isoformat(),
            UUID: lambda v: str(v)
        }
    }


class AppointmentSearchParams(BaseModel):
    """Schema for appointment search parameters"""
    # Patient filters
    patient_mobile: Optional[str] = Field(None, description="Filter by patient mobile")
    patient_name: Optional[str] = Field(None, description="Filter by patient name")
    patient_uuid: Optional[UUID] = Field(None, description="Filter by patient UUID")
    
    # Doctor filter
    doctor_id: Optional[UUID] = Field(None, description="Filter by doctor")
    
    # Date filters
    start_date: Optional[date] = Field(None, description="Start date filter")
    end_date: Optional[date] = Field(None, description="End date filter")
    appointment_date: Optional[date] = Field(None, description="Specific date filter")
    
    # Status filters
    status: Optional[str] = Field(None, description="Filter by status")
    status_list: Optional[List[str]] = Field(None, description="Filter by multiple statuses")
    
    # Time filters
    is_today: Optional[bool] = Field(None, description="Today's appointments")
    is_upcoming: Optional[bool] = Field(None, description="Upcoming appointments")
    is_past: Optional[bool] = Field(None, description="Past appointments")
    
    # Text search
    query: Optional[str] = Field(None, description="Search in reason, notes, appointment number")
    
    # Pagination
    page: int = Field(1, ge=1, description="Page number")
    page_size: int = Field(20, ge=1, le=100, description="Page size")
    
    # Sorting
    sort_by: Optional[str] = Field("appointment_date", description="Sort field")
    sort_order: Optional[Literal["asc", "desc"]] = Field("asc", description="Sort order")


class AppointmentConflictCheck(BaseModel):
    """Schema for checking appointment conflicts"""
    doctor_id: UUID = Field(..., description="Doctor ID")
    appointment_date: date = Field(..., description="Appointment date")
    appointment_time: time = Field(..., description="Appointment time")
    duration_minutes: int = Field(30, ge=10, le=480, description="Duration in minutes")
    exclude_appointment_id: Optional[UUID] = Field(None, description="Exclude this appointment from conflict check")


class AppointmentConflictResponse(BaseModel):
    """Schema for appointment conflict response"""
    has_conflict: bool
    conflicting_appointments: List[AppointmentResponse] = Field(default=[])
    suggested_times: List[Dict[str, Any]] = Field(default=[])
    
    model_config = {
        "json_encoders": {
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat(),
            time: lambda v: v.isoformat(),
            UUID: lambda v: str(v)
        }
    }


class DoctorScheduleResponse(BaseModel):
    """Schema for doctor's daily schedule"""
    doctor_id: UUID
    schedule_date: date
    appointments: List[AppointmentResponse] = Field(default=[])
    available_slots: List[Dict[str, Any]] = Field(default=[])
    total_appointments: int = Field(default=0)
    
    @computed_field
    @property
    def working_hours_start(self) -> time:
        """Default working hours start"""
        return time(9, 0)  # 9:00 AM
    
    @computed_field
    @property
    def working_hours_end(self) -> time:
        """Default working hours end"""
        return time(17, 0)  # 5:00 PM
    
    model_config = {
        "json_encoders": {
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat(),
            time: lambda v: v.isoformat(),
            UUID: lambda v: str(v)
        }
    }


class AppointmentStatistics(BaseModel):
    """Schema for appointment statistics"""
    total_appointments: int
    scheduled_appointments: int
    confirmed_appointments: int
    completed_appointments: int
    cancelled_appointments: int
    no_show_appointments: int
    
    today_appointments: int
    upcoming_appointments: int
    overdue_appointments: int
    
    appointments_by_status: Dict[str, int] = Field(default={})
    appointments_by_doctor: Dict[str, int] = Field(default={})
    weekly_trend: List[Dict[str, Any]] = Field(default=[])
    peak_hours: List[Dict[str, Any]] = Field(default=[])


class AppointmentBulkOperation(BaseModel):
    """Schema for bulk appointment operations"""
    appointment_ids: List[UUID] = Field(..., min_items=1, max_items=50, description="Appointment IDs")
    operation: Literal["cancel", "confirm", "complete", "reschedule"] = Field(..., description="Bulk operation")
    
    # For reschedule operations
    new_date: Optional[date] = Field(None, description="New date for reschedule operation")
    new_time: Optional[time] = Field(None, description="New time for reschedule operation")
    
    # General
    notes: Optional[str] = Field(None, max_length=500, description="Operation notes")
    
    @validator('appointment_ids')
    def validate_unique_ids(cls, v):
        """Ensure appointment IDs are unique"""
        if len(v) != len(set(v)):
            raise ValueError("Appointment IDs must be unique")
        return v

    @model_validator(mode='after')
    def validate_reschedule_fields(self):
        """Validate reschedule operation fields"""
        if self.operation == 'reschedule':
            if not self.new_date or not self.new_time:
                raise ValueError("New date and time required for reschedule operation")
            
            if self.new_date < date.today():
                raise ValueError("New date cannot be in the past")
        
        return self


class AppointmentBulkResponse(BaseModel):
    """Schema for bulk operation response"""
    operation: str
    total_requested: int
    successful: int
    failed: int
    errors: List[str] = Field(default=[])
    processed_ids: List[UUID] = Field(default=[])


class PatientAppointmentHistory(BaseModel):
    """Schema for patient appointment history"""
    patient_mobile_number: str
    patient_first_name: str
    patient_uuid: UUID
    appointments: List[AppointmentResponse] = Field(default=[])
    total_appointments: int = Field(default=0)
    last_visit: Optional[datetime] = Field(None)
    next_appointment: Optional[AppointmentResponse] = Field(None)
    
    @computed_field
    @property
    def patient_composite_key(self) -> str:
        """Get patient composite key"""
        return f"{self.patient_mobile_number}:{self.patient_first_name}"
    
    model_config = {
        "json_encoders": {
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat(),
            time: lambda v: v.isoformat(),
            UUID: lambda v: str(v)
        }
    }


class TimeSlot(BaseModel):
    """Schema for available time slots"""
    start_time: time
    end_time: time
    duration_minutes: int
    is_available: bool = True
    
    model_config = {
        "json_encoders": {
            time: lambda v: v.isoformat()
        }
    }


class AvailableTimeSlotsResponse(BaseModel):
    """Schema for available time slots response"""
    doctor_id: UUID
    date: date
    available_slots: List[TimeSlot] = Field(default=[])
    working_hours_start: time
    working_hours_end: time
    slot_duration: int = Field(30, description="Default slot duration in minutes")
    
    model_config = {
        "json_encoders": {
            date: lambda v: v.isoformat(),
            time: lambda v: v.isoformat(),
            UUID: lambda v: str(v)
        }
    }