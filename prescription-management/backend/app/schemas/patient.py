"""
Patient Schemas for Composite Key Implementation
Handles validation for mobile_number + first_name composite primary key
Supports family registration with same mobile number
"""

from __future__ import annotations

from pydantic import BaseModel, Field, EmailStr, validator, model_validator, computed_field
from typing import Optional, Dict, Any, List, Literal
from datetime import date, datetime
from uuid import UUID
import re

from app.core.config import settings
from app.utils.date_validators import (
    validate_date_of_birth,
    parse_date_string,
    DateValidationError
)


# Enums for patient data
GenderEnum = Literal["male", "female", "other", "prefer_not_to_say"]
RelationshipEnum = Literal["self", "spouse", "child", "parent", "sibling", "grandparent", "grandchild", "other"]


class EmergencyContact(BaseModel):
    """Emergency contact information schema"""
    name: str = Field(..., min_length=2, max_length=100, description="Emergency contact name")
    phone: str = Field(..., min_length=10, max_length=15, description="Emergency contact phone")
    relationship: str = Field(..., min_length=1, max_length=50, description="Relationship to patient")

    @validator('phone')
    def validate_phone(cls, v):
        """Validate emergency contact phone format"""
        cleaned = re.sub(r'[^\d+]', '', v)
        if not re.match(r'^\+?[6-9]\d{9}$', cleaned):
            raise ValueError("Invalid phone number format")
        return cleaned


class PatientBase(BaseModel):
    """Base patient schema with common fields"""
    first_name: str = Field(
        ..., 
        min_length=2, 
        max_length=100,
        description="First name (part of composite key)"
    )
    last_name: str = Field(
        ..., 
        min_length=2, 
        max_length=100,
        description="Last name"
    )
    date_of_birth: date = Field(..., description="Date of birth")
    gender: GenderEnum = Field(..., description="Gender")
    email: Optional[EmailStr] = Field(None, description="Email address")
    address: Optional[str] = Field(None, max_length=500, description="Address")
    relationship_to_primary: RelationshipEnum = Field(
        default="self", 
        description="Relationship to primary family member"
    )
    primary_contact_mobile: Optional[str] = Field(
        None, 
        min_length=10, 
        max_length=15,
        description="Primary family contact mobile (for family members)"
    )
    emergency_contact: Optional[EmergencyContact] = Field(
        None, 
        description="Emergency contact information"
    )
    notes: Optional[str] = Field(None, max_length=1000, description="Additional notes")

    @validator('first_name', 'last_name')
    def validate_names(cls, v):
        """Validate name fields"""
        if not v or not v.strip():
            raise ValueError("Name is required")
        
        cleaned_name = v.strip()
        if not re.match(r'^[a-zA-Z\s]+$', cleaned_name):
            raise ValueError("Name should contain only letters and spaces")
        
        if len(cleaned_name) < 2:
            raise ValueError("Name should be at least 2 characters long")
        
        return cleaned_name.title()

    @validator('date_of_birth', pre=True)
    def validate_date_of_birth(cls, v):
        """Standardized date of birth validation"""
        if isinstance(v, str):
            v = parse_date_string(v)
        return validate_date_of_birth(v)

    @validator('primary_contact_mobile')
    def validate_primary_contact_mobile(cls, v):
        """Validate primary contact mobile format"""
        if v:
            cleaned = re.sub(r'[^\d+]', '', v)
            if not re.match(r'^\+?[6-9]\d{9}$', cleaned):
                raise ValueError("Invalid primary contact mobile format")
            return cleaned
        return v

    @model_validator(mode='after')
    def validate_family_relationship(self):
        """Validate family relationship constraints"""
        relationship = self.relationship_to_primary
        primary_contact_mobile = self.primary_contact_mobile
        
        # If not self, primary contact mobile should be provided
        if relationship != 'self' and not primary_contact_mobile:
            raise ValueError("Primary contact mobile is required for family members")
        
        # If self, primary contact mobile should not be provided
        if relationship == 'self' and primary_contact_mobile:
            raise ValueError("Primary contact mobile should not be provided for primary member")
        
        return self


class PatientCreate(PatientBase):
    """Schema for creating a new patient"""
    mobile_number: str = Field(
        ...,
        min_length=10,
        max_length=15,
        description="Mobile number (part of composite key)"
    )
    tenant_id: Optional[UUID] = Field(None, description="Tenant ID for multi-tenancy")

    @validator('mobile_number')
    def validate_mobile_number(cls, v):
        """Validate mobile number format"""
        if not v:
            raise ValueError("Mobile number is required")
        
        # Clean mobile number
        cleaned = re.sub(r'[^\d+]', '', v)
        
        # Validate Indian mobile format
        if not settings.ALLOW_INTERNATIONAL_MOBILE:
            if not re.match(settings.MOBILE_NUMBER_REGEX, cleaned):
                raise ValueError("Invalid mobile number format. Must be 10 digits starting with 6-9")
        
        return cleaned

    model_config = {
        "json_encoders": {
            date: lambda v: v.isoformat() if v else None,
            datetime: lambda v: v.isoformat() if v else None
        },
        "json_schema_extra": {
            "example": {
                "mobile_number": "9876543210",
                "first_name": "John",
                "last_name": "Doe",
                "date_of_birth": "1990-01-15",
                "gender": "male",
                "email": "john.doe@example.com",
                "address": "123 Main Street, City, State",
                "relationship_to_primary": "self",
                "emergency_contact": {
                    "name": "Jane Doe",
                    "phone": "9876543211",
                    "relationship": "spouse"
                },
                "notes": "No known allergies"
            }
        }
    }


class PatientCreateFamily(PatientBase):
    """Schema for creating a family member (mobile_number inherited from family)"""
    pass

    model_config = {
        "json_encoders": {
            date: lambda v: v.isoformat() if v else None,
            datetime: lambda v: v.isoformat() if v else None
        },
        "json_schema_extra": {
            "example": {
                "first_name": "Jane",
                "last_name": "Doe",
                "date_of_birth": "1992-05-20",
                "gender": "female",
                "email": "jane.doe@example.com",
                "relationship_to_primary": "spouse",
                "primary_contact_mobile": "9876543210",
                "emergency_contact": {
                    "name": "John Doe",
                    "phone": "9876543210",
                    "relationship": "spouse"
                }
            }
        }
    }


class PatientUpdate(BaseModel):
    """Schema for updating patient information"""
    last_name: Optional[str] = Field(None, min_length=2, max_length=100)
    date_of_birth: Optional[date] = Field(None)
    gender: Optional[GenderEnum] = Field(None)
    email: Optional[EmailStr] = Field(None)
    address: Optional[str] = Field(None, max_length=500)
    emergency_contact: Optional[EmergencyContact] = Field(None)
    notes: Optional[str] = Field(None, max_length=1000)
    is_active: Optional[bool] = Field(None)

    @validator('last_name')
    def validate_last_name(cls, v):
        """Validate last name if provided"""
        if v:
            cleaned_name = v.strip()
            if not re.match(r'^[a-zA-Z\s]+$', cleaned_name):
                raise ValueError("Last name should contain only letters and spaces")
            return cleaned_name.title()
        return v

    @validator('date_of_birth')
    def validate_date_of_birth(cls, v):
        """Validate date of birth if provided"""
        if v:
            today = date.today()
            if v > today:
                raise ValueError("Date of birth cannot be in the future")
            age = today.year - v.year - ((today.month, today.day) < (v.month, v.day))
            if age > 150:
                raise ValueError("Invalid date of birth (age > 150 years)")
        return v

    model_config = {
        "json_encoders": {
            date: lambda v: v.isoformat() if v else None,
            datetime: lambda v: v.isoformat() if v else None
        }
    }


class CompositeKey(BaseModel):
    """Schema for composite key parameters"""
    mobile_number: str = Field(..., description="Mobile number part of composite key")
    first_name: str = Field(..., description="First name part of composite key")

    @validator('mobile_number')
    def validate_mobile_number(cls, v):
        """Validate mobile number format"""
        cleaned = re.sub(r'[^\d+]', '', v)
        if not re.match(r'^\+?[6-9]\d{9}$', cleaned):
            raise ValueError("Invalid mobile number format")
        return cleaned

    @validator('first_name')
    def validate_first_name(cls, v):
        """Validate first name"""
        cleaned_name = v.strip()
        if not re.match(r'^[a-zA-Z\s]+$', cleaned_name):
            raise ValueError("First name should contain only letters and spaces")
        return cleaned_name.title()


class PatientResponse(BaseModel):
    """Schema for patient response with computed fields"""
    # Composite key fields
    mobile_number: str
    first_name: str
    
    # UUID for internal references
    id: UUID
    
    # Basic information
    last_name: str
    date_of_birth: date
    gender: GenderEnum
    email: Optional[str]
    address: Optional[str]
    
    # Family relationship
    relationship_to_primary: RelationshipEnum
    primary_contact_mobile: Optional[str]
    
    # Additional information
    emergency_contact: Optional[Dict[str, Any]]
    notes: Optional[str]
    is_active: bool
    
    # Audit fields
    created_by: Optional[UUID]
    created_at: datetime
    updated_at: datetime
    
    @computed_field
    @property
    def full_name(self) -> str:
        """Get patient's full name"""
        return f"{self.first_name} {self.last_name}".strip()
    
    @computed_field
    @property
    def age(self) -> int:
        """Calculate patient's age"""
        from datetime import date as date_module
        today = date_module.today()
        return today.year - self.date_of_birth.year - (
            (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
        )
    
    @computed_field
    @property
    def is_family_member(self) -> bool:
        """Check if patient is a family member (not primary)"""
        return self.relationship_to_primary != 'self'

    model_config = {
        "from_attributes": True,
        "json_encoders": {
            date: lambda v: v.isoformat() if v else None,
            datetime: lambda v: v.isoformat() if v else None,
            UUID: lambda v: str(v) if v else None
        }
    }


class FamilyResponse(BaseModel):
    """Schema for family members response"""
    family_mobile: str = Field(..., description="Family mobile number")
    primary_member: Optional[PatientResponse] = Field(None, description="Primary family member")
    family_members: List[PatientResponse] = Field(default=[], description="All family members")
    total_members: int = Field(..., description="Total family members count")
    
    model_config = {
        "json_encoders": {
            date: lambda v: v.isoformat() if v else None,
            datetime: lambda v: v.isoformat() if v else None,
            UUID: lambda v: str(v) if v else None
        }
    }


class PatientSearchParams(BaseModel):
    """Schema for patient search parameters"""
    mobile_number: Optional[str] = Field(None, description="Search by mobile number")
    first_name: Optional[str] = Field(None, description="Search by first name")
    last_name: Optional[str] = Field(None, description="Search by last name")
    email: Optional[str] = Field(None, description="Search by email")
    gender: Optional[GenderEnum] = Field(None, description="Filter by gender")
    relationship: Optional[RelationshipEnum] = Field(None, description="Filter by relationship")
    is_active: Optional[bool] = Field(True, description="Filter by active status")
    age_min: Optional[int] = Field(None, ge=0, le=150, description="Minimum age")
    age_max: Optional[int] = Field(None, ge=0, le=150, description="Maximum age")
    
    # Pagination
    page: int = Field(1, ge=1, description="Page number")
    page_size: int = Field(20, ge=1, le=100, description="Page size")
    
    # Sorting
    sort_by: Optional[str] = Field("first_name", description="Sort field")
    sort_order: Optional[Literal["asc", "desc"]] = Field("asc", description="Sort order")

    @validator('age_max')
    def validate_age_range(cls, v, values):
        """Validate age range"""
        age_min = values.get('age_min')
        if age_min is not None and v is not None and v < age_min:
            raise ValueError("Maximum age must be greater than minimum age")
        return v


class PatientListResponse(BaseModel):
    """Schema for paginated patient list response"""
    patients: List[PatientResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_prev: bool

    model_config = {
        "json_encoders": {
            date: lambda v: v.isoformat() if v else None,
            datetime: lambda v: v.isoformat() if v else None,
            UUID: lambda v: str(v) if v else None
        }
    }


class ValidationErrorResponse(BaseModel):
    """Schema for validation error responses"""
    is_valid: bool = False
    errors: List[str]


class FamilyValidationRequest(BaseModel):
    """Schema for family registration validation"""
    mobile_number: str = Field(..., description="Family mobile number")
    first_name: str = Field(..., description="New member first name")
    relationship: RelationshipEnum = Field(..., description="Relationship to primary member")

    @validator('mobile_number')
    def validate_mobile_number(cls, v):
        """Validate mobile number format"""
        cleaned = re.sub(r'[^\d+]', '', v)
        if not re.match(r'^\+?[6-9]\d{9}$', cleaned):
            raise ValueError("Invalid mobile number format")
        return cleaned

    @validator('first_name')
    def validate_first_name(cls, v):
        """Validate first name"""
        cleaned_name = v.strip()
        if not re.match(r'^[a-zA-Z\s]+$', cleaned_name):
            raise ValueError("First name should contain only letters and spaces")
        return cleaned_name.title()