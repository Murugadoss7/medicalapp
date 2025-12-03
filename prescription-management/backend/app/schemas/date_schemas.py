"""
Standardized Date Schemas
Centralized Pydantic schemas for consistent date validation across all modules
"""

from __future__ import annotations

from pydantic import BaseModel, Field, validator, root_validator
from datetime import date, datetime, time
from typing import Optional, Union

from app.utils.date_validators import (
    validate_date_of_birth,
    validate_appointment_date,
    validate_prescription_date,
    validate_visit_date,
    parse_date_string,
    DateValidationError
)


class DateOfBirthSchema(BaseModel):
    """Standardized schema for date of birth validation"""
    date_of_birth: date = Field(
        ...,
        description="Date of birth in YYYY-MM-DD format",
        example="1990-01-15"
    )
    
    @validator('date_of_birth', pre=True)
    def validate_date_of_birth(cls, v):
        """Standardized date of birth validation"""
        if isinstance(v, str):
            v = parse_date_string(v)
        return validate_date_of_birth(v)


class AppointmentDateSchema(BaseModel):
    """Standardized schema for appointment date validation"""
    appointment_date: date = Field(
        ...,
        description="Appointment date in YYYY-MM-DD format",
        example="2024-12-15"
    )
    
    @validator('appointment_date', pre=True)
    def validate_appointment_date(cls, v):
        """Standardized appointment date validation"""
        if isinstance(v, str):
            v = parse_date_string(v)
        return validate_appointment_date(v)


class AppointmentDateTimeSchema(BaseModel):
    """Standardized schema for appointment date and time validation"""
    appointment_date: date = Field(
        ...,
        description="Appointment date in YYYY-MM-DD format",
        example="2024-12-15"
    )
    appointment_time: time = Field(
        ...,
        description="Appointment time in HH:MM format",
        example="14:30"
    )
    
    @validator('appointment_date', pre=True)
    def validate_appointment_date(cls, v):
        """Standardized appointment date validation"""
        if isinstance(v, str):
            v = parse_date_string(v)
        return validate_appointment_date(v)
    
    @validator('appointment_time', pre=True)
    def validate_appointment_time(cls, v):
        """Standardized appointment time validation"""
        if isinstance(v, str):
            try:
                v = datetime.strptime(v, "%H:%M").time()
            except ValueError:
                raise DateValidationError("Invalid time format. Expected HH:MM")
        return v


class PrescriptionDateSchema(BaseModel):
    """Standardized schema for prescription date validation"""
    prescription_date: date = Field(
        ...,
        description="Prescription date in YYYY-MM-DD format",
        example="2024-11-02"
    )
    
    @validator('prescription_date', pre=True)
    def validate_prescription_date(cls, v):
        """Standardized prescription date validation"""
        if isinstance(v, str):
            v = parse_date_string(v)
        return validate_prescription_date(v)


class VisitDateSchema(BaseModel):
    """Standardized schema for visit date validation"""
    visit_date: date = Field(
        ...,
        description="Visit date in YYYY-MM-DD format",
        example="2024-11-02"
    )
    
    @validator('visit_date', pre=True)
    def validate_visit_date(cls, v):
        """Standardized visit date validation"""
        if isinstance(v, str):
            v = parse_date_string(v)
        return validate_visit_date(v)


class DateRangeSchema(BaseModel):
    """Standardized schema for date range validation"""
    start_date: date = Field(
        ...,
        description="Start date in YYYY-MM-DD format",
        example="2024-01-01"
    )
    end_date: date = Field(
        ...,
        description="End date in YYYY-MM-DD format",
        example="2024-12-31"
    )
    
    @validator('start_date', 'end_date', pre=True)
    def validate_dates(cls, v):
        """Parse date strings"""
        if isinstance(v, str):
            v = parse_date_string(v)
        return v
    
    @root_validator
    def validate_date_range(cls, values):
        """Ensure start date is before end date"""
        start_date = values.get('start_date')
        end_date = values.get('end_date')
        
        if start_date and end_date and start_date > end_date:
            raise DateValidationError("Start date must be before end date")
        
        return values


class OptionalDateRangeSchema(BaseModel):
    """Standardized schema for optional date range validation"""
    start_date: Optional[date] = Field(
        None,
        description="Start date in YYYY-MM-DD format",
        example="2024-01-01"
    )
    end_date: Optional[date] = Field(
        None,
        description="End date in YYYY-MM-DD format", 
        example="2024-12-31"
    )
    
    @validator('start_date', 'end_date', pre=True)
    def validate_dates(cls, v):
        """Parse date strings"""
        if v is None:
            return v
        if isinstance(v, str):
            v = parse_date_string(v)
        return v
    
    @root_validator
    def validate_date_range(cls, values):
        """Ensure start date is before end date if both provided"""
        start_date = values.get('start_date')
        end_date = values.get('end_date')
        
        if start_date and end_date and start_date > end_date:
            raise DateValidationError("Start date must be before end date")
        
        return values


# Mixins for easy inclusion in other schemas

class DateOfBirthMixin(DateOfBirthSchema):
    """Mixin for schemas that need date of birth validation"""
    class Config:
        extra = "ignore"


class AppointmentDateMixin(AppointmentDateSchema):
    """Mixin for schemas that need appointment date validation"""
    class Config:
        extra = "ignore"


class AppointmentDateTimeMixin(AppointmentDateTimeSchema):
    """Mixin for schemas that need appointment date-time validation"""
    class Config:
        extra = "ignore"


class PrescriptionDateMixin(PrescriptionDateSchema):
    """Mixin for schemas that need prescription date validation"""
    class Config:
        extra = "ignore"


class VisitDateMixin(VisitDateSchema):
    """Mixin for schemas that need visit date validation"""
    class Config:
        extra = "ignore"


class DateRangeMixin(OptionalDateRangeSchema):
    """Mixin for schemas that need date range validation"""
    class Config:
        extra = "ignore"


# Common configuration for all date schemas
class DateSchemaConfig:
    """Common configuration for date schemas"""
    json_encoders = {
        date: lambda v: v.isoformat() if v else None,
        datetime: lambda v: v.isoformat() if v else None,
        time: lambda v: v.strftime("%H:%M") if v else None,
    }
    
    schema_extra = {
        "example": {
            "note": "All dates should be in YYYY-MM-DD format",
            "timezone": "Asia/Kolkata (Indian Standard Time)"
        }
    }


# Apply common config to all schemas
for schema_class in [
    DateOfBirthSchema,
    AppointmentDateSchema, 
    AppointmentDateTimeSchema,
    PrescriptionDateSchema,
    VisitDateSchema,
    DateRangeSchema,
    OptionalDateRangeSchema
]:
    schema_class.Config = type('Config', (DateSchemaConfig,), {})


# Export all schemas
__all__ = [
    'DateOfBirthSchema',
    'AppointmentDateSchema',
    'AppointmentDateTimeSchema', 
    'PrescriptionDateSchema',
    'VisitDateSchema',
    'DateRangeSchema',
    'OptionalDateRangeSchema',
    'DateOfBirthMixin',
    'AppointmentDateMixin',
    'AppointmentDateTimeMixin',
    'PrescriptionDateMixin', 
    'VisitDateMixin',
    'DateRangeMixin',
    'DateSchemaConfig'
]