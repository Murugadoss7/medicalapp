"""
Centralized Date Validation Utilities
Standardized date handling for all modules across the system
"""

from datetime import date, datetime, time, timedelta
from typing import Optional, Union, Literal
from pydantic import validator, Field
import re
try:
    from zoneinfo import ZoneInfo
except ImportError:
    from backports.zoneinfo import ZoneInfo

# System timezone configuration
SYSTEM_TIMEZONE = ZoneInfo("Asia/Kolkata")  # Indian Standard Time

# Date validation constants
MIN_BIRTH_YEAR = 1900
MAX_FUTURE_APPOINTMENT_DAYS = 365  # 1 year in future
MIN_APPOINTMENT_ADVANCE_HOURS = 1  # Minimum 1 hour advance booking


class DateValidationError(ValueError):
    """Custom exception for date validation errors"""
    pass


def validate_date_of_birth(birth_date: date) -> date:
    """
    Standardized date of birth validation
    Used across: Patient registration, appointments, prescriptions
    """
    if not birth_date:
        raise DateValidationError("Date of birth is required")
    
    # Cannot be in the future
    if birth_date > date.today():
        raise DateValidationError("Date of birth cannot be in the future")
    
    # Reasonable minimum year check
    if birth_date.year < MIN_BIRTH_YEAR:
        raise DateValidationError(f"Date of birth cannot be before {MIN_BIRTH_YEAR}")
    
    # Maximum age check (150 years)
    age = date.today().year - birth_date.year
    if age > 150:
        raise DateValidationError("Invalid date of birth (age cannot exceed 150 years)")
    
    return birth_date


def validate_appointment_date(appointment_date: date, allow_past: bool = False) -> date:
    """
    Standardized appointment date validation
    Used across: Appointment booking, rescheduling, calendar views
    """
    if not appointment_date:
        raise DateValidationError("Appointment date is required")
    
    today = date.today()
    
    # Check if past dates are allowed
    if not allow_past and appointment_date < today:
        raise DateValidationError("Appointment date cannot be in the past")
    
    # Check maximum future booking limit
    max_future_date = today.replace(year=today.year + 1)  # 1 year max
    if appointment_date > max_future_date:
        raise DateValidationError(f"Appointment cannot be scheduled more than 1 year in advance")
    
    return appointment_date


def validate_appointment_datetime(
    appointment_date: date, 
    appointment_time: time,
    allow_past: bool = False
) -> tuple[date, time]:
    """
    Standardized appointment date-time validation
    Used across: Appointment booking, scheduling, conflict checking
    """
    # Validate date first
    validated_date = validate_appointment_date(appointment_date, allow_past)
    
    if not appointment_time:
        raise DateValidationError("Appointment time is required")
    
    # If appointment is today, check time is in future
    if not allow_past and validated_date == date.today():
        now = datetime.now(SYSTEM_TIMEZONE)
        appointment_datetime = datetime.combine(validated_date, appointment_time)
        appointment_datetime = appointment_datetime.replace(tzinfo=SYSTEM_TIMEZONE)
        
        min_advance = now.replace(microsecond=0) + timedelta(hours=MIN_APPOINTMENT_ADVANCE_HOURS)
        if appointment_datetime < min_advance:
            raise DateValidationError(
                f"Appointment must be scheduled at least {MIN_APPOINTMENT_ADVANCE_HOURS} hour(s) in advance"
            )
    
    return validated_date, appointment_time


def validate_prescription_date(prescription_date: date, allow_past: bool = True) -> date:
    """
    Standardized prescription date validation
    Used across: Prescription creation, medical history
    """
    if not prescription_date:
        raise DateValidationError("Prescription date is required")
    
    today = date.today()
    
    # Prescriptions can be backdated (for medical history)
    if not allow_past and prescription_date > today:
        raise DateValidationError("Prescription date cannot be in the future")
    
    # Reasonable limit for backdating (5 years)
    min_date = today.replace(year=today.year - 5)
    if prescription_date < min_date:
        raise DateValidationError("Prescription date cannot be more than 5 years old")
    
    return prescription_date


def validate_visit_date(visit_date: date) -> date:
    """
    Standardized visit date validation
    Used across: Patient visits, medical records
    """
    if not visit_date:
        raise DateValidationError("Visit date is required")
    
    today = date.today()
    
    # Visits can be today or in the past
    if visit_date > today:
        raise DateValidationError("Visit date cannot be in the future")
    
    return visit_date


def parse_date_string(date_string: str, date_format: str = "%Y-%m-%d") -> date:
    """
    Standardized date string parsing
    Used across: API endpoints, form submissions
    """
    if not date_string:
        raise DateValidationError("Date string is required")
    
    try:
        # Handle ISO format strings
        if 'T' in date_string:
            date_string = date_string.split('T')[0]
        
        parsed_date = datetime.strptime(date_string, date_format).date()
        return parsed_date
    except ValueError as e:
        raise DateValidationError(f"Invalid date format. Expected {date_format}, got: {date_string}")


def format_date_for_api(date_obj: date) -> str:
    """
    Standardized date formatting for API responses
    Used across: All API endpoints returning dates
    """
    if not date_obj:
        return None
    
    return date_obj.isoformat()  # Returns YYYY-MM-DD format


def calculate_age(birth_date: date, reference_date: Optional[date] = None) -> int:
    """
    Standardized age calculation
    Used across: Patient records, appointment booking, analytics
    """
    if not birth_date:
        raise DateValidationError("Birth date is required for age calculation")
    
    if reference_date is None:
        reference_date = date.today()
    
    age = reference_date.year - birth_date.year
    
    # Adjust if birthday hasn't occurred this year
    if (reference_date.month, reference_date.day) < (birth_date.month, birth_date.day):
        age -= 1
    
    return age


def get_date_range_for_age(age: int, reference_date: Optional[date] = None) -> tuple[date, date]:
    """
    Get date range for a specific age
    Used across: Patient search, age filtering
    """
    if reference_date is None:
        reference_date = date.today()
    
    # Latest possible birth date for this age
    latest_birth_date = reference_date.replace(year=reference_date.year - age)
    
    # Earliest possible birth date for this age  
    earliest_birth_date = reference_date.replace(year=reference_date.year - age - 1) + timedelta(days=1)
    
    return earliest_birth_date, latest_birth_date


def is_working_day(check_date: date, working_days: list = None) -> bool:
    """
    Check if a date is a working day
    Used across: Appointment scheduling, doctor availability
    """
    if working_days is None:
        working_days = [0, 1, 2, 3, 4, 5]  # Monday to Saturday (0=Monday)
    
    return check_date.weekday() in working_days


def get_next_working_day(start_date: date, working_days: list = None) -> date:
    """
    Get next working day from a given date
    Used across: Appointment suggestions, scheduling
    """
    current_date = start_date
    while not is_working_day(current_date, working_days):
        current_date += timedelta(days=1)
    
    return current_date


# Pydantic field validators for common use cases

def DateOfBirthField(**kwargs):
    """Pydantic field for date of birth with validation"""
    return Field(
        ...,
        description="Date of birth in YYYY-MM-DD format",
        **kwargs
    )


def AppointmentDateField(**kwargs):
    """Pydantic field for appointment date with validation"""
    return Field(
        ...,
        description="Appointment date in YYYY-MM-DD format",
        **kwargs
    )


def PrescriptionDateField(**kwargs):
    """Pydantic field for prescription date with validation"""
    return Field(
        ...,
        description="Prescription date in YYYY-MM-DD format",
        **kwargs
    )


# Common validator decorators

def date_of_birth_validator(cls, v):
    """Reusable validator for date of birth fields"""
    if isinstance(v, str):
        v = parse_date_string(v)
    return validate_date_of_birth(v)


def appointment_date_validator(cls, v):
    """Reusable validator for appointment date fields"""
    if isinstance(v, str):
        v = parse_date_string(v)
    return validate_appointment_date(v)


def prescription_date_validator(cls, v):
    """Reusable validator for prescription date fields"""
    if isinstance(v, str):
        v = parse_date_string(v)
    return validate_prescription_date(v)


# Export commonly used validators
__all__ = [
    'validate_date_of_birth',
    'validate_appointment_date', 
    'validate_appointment_datetime',
    'validate_prescription_date',
    'validate_visit_date',
    'parse_date_string',
    'format_date_for_api',
    'calculate_age',
    'get_date_range_for_age',
    'is_working_day',
    'get_next_working_day',
    'DateOfBirthField',
    'AppointmentDateField', 
    'PrescriptionDateField',
    'date_of_birth_validator',
    'appointment_date_validator',
    'prescription_date_validator',
    'DateValidationError'
]