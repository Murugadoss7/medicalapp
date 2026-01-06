"""
Pydantic schemas for Tenant model
Validation and serialization for multi-tenancy
"""

from pydantic import BaseModel, Field, validator, root_validator
from typing import Optional, Dict, Any, List
from datetime import datetime
from uuid import UUID


# ================== Base Schemas ==================

class TenantBase(BaseModel):
    """Base tenant schema with common fields"""
    tenant_name: str = Field(..., min_length=3, max_length=200, description="Organization/clinic name")
    phone: Optional[str] = Field(None, max_length=20, description="Primary contact phone")
    billing_email: Optional[str] = Field(None, description="Billing contact email")
    support_email: Optional[str] = Field(None, description="Support contact email")


# ================== Create Schemas ==================

class TenantCreate(TenantBase):
    """
    Schema for creating a new tenant during clinic registration
    NOTE: tenant_code is auto-generated, not provided by user
    """
    subscription_plan: Optional[str] = Field('trial', description="Initial subscription plan")

    @validator('subscription_plan')
    def validate_plan(cls, v):
        valid_plans = ['trial', 'basic', 'premium', 'enterprise']
        if v not in valid_plans:
            raise ValueError(f"Invalid plan. Must be one of: {', '.join(valid_plans)}")
        return v


class ClinicRegistrationRequest(BaseModel):
    """
    Complete clinic registration request
    Creates: Tenant + Admin User + Optional Doctor Profile
    """
    # Clinic Information
    clinic_name: str = Field(..., min_length=3, description="Clinic name")
    clinic_phone: str = Field(..., description="Clinic phone number")
    clinic_address: str = Field(..., description="Clinic address")

    # Owner/Admin Information
    owner_first_name: str = Field(..., min_length=2, description="Owner first name")
    owner_last_name: str = Field(..., min_length=2, description="Owner last name")
    owner_email: str = Field(..., description="Owner email (login credential)")
    owner_phone: str = Field(..., description="Owner phone number")
    password: str = Field(..., min_length=8, description="Account password")

    # Role Selection
    role: str = Field(..., description="Role: 'admin' or 'admin_doctor'")

    # Doctor Details (required if role='admin_doctor')
    license_number: Optional[str] = Field(None, description="Medical license number")
    specialization: Optional[str] = Field(None, description="Medical specialization")
    qualification: Optional[str] = Field(None, description="Educational qualifications")
    experience_years: Optional[int] = Field(None, ge=0, le=70, description="Years of experience")

    # Subscription
    subscription_plan: Optional[str] = Field('trial', description="Initial subscription plan")

    @validator('role')
    def validate_role(cls, v):
        if v not in ['admin', 'admin_doctor']:
            raise ValueError("Role must be 'admin' or 'admin_doctor'")
        return v

    @root_validator
    def validate_doctor_fields(cls, values):
        """Validate doctor fields if role is admin_doctor"""
        role = values.get('role')
        if role == 'admin_doctor':
            required_fields = ['license_number', 'specialization', 'qualification']
            for field in required_fields:
                if not values.get(field):
                    raise ValueError(f"{field} is required for admin_doctor role")
        return values


class ClinicRegistrationResponse(BaseModel):
    """Response after successful clinic registration"""
    success: bool
    tenant_id: UUID
    user_id: UUID
    doctor_id: Optional[UUID] = None
    access_token: str
    token_type: str = "bearer"
    subscription: Dict[str, Any]
    message: str


# ================== Update Schemas ==================

class TenantUpdate(BaseModel):
    """Schema for updating tenant information"""
    tenant_name: Optional[str] = Field(None, min_length=3, max_length=200)
    phone: Optional[str] = Field(None, max_length=20)
    billing_email: Optional[str] = None
    support_email: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None


class TenantSubscriptionUpdate(BaseModel):
    """Schema for updating subscription details"""
    subscription_plan: str = Field(..., description="New subscription plan")
    subscription_ends_at: Optional[datetime] = None

    @validator('subscription_plan')
    def validate_plan(cls, v):
        valid_plans = ['trial', 'basic', 'premium', 'enterprise']
        if v not in valid_plans:
            raise ValueError(f"Invalid plan. Must be one of: {', '.join(valid_plans)}")
        return v


# ================== Response Schemas ==================

class TenantLimits(BaseModel):
    """Tenant resource limits"""
    max_clinics: int
    max_doctors: int
    max_patients: int
    max_storage_mb: int


class TenantResponse(TenantBase):
    """Full tenant response with all details"""
    id: UUID
    tenant_code: str
    subscription_plan: str
    subscription_status: str
    trial_ends_at: Optional[datetime] = None
    subscription_ends_at: Optional[datetime] = None

    # Limits
    max_clinics: int
    max_doctors: int
    max_patients: int
    max_storage_mb: int

    # Computed fields
    is_trial_expired: bool = False
    is_subscription_expired: bool = False
    days_until_expiry: int = -1
    plan_limits: Dict[str, Any] = {}

    # Audit
    created_at: datetime
    updated_at: datetime
    is_active: bool

    class Config:
        orm_mode = True


class TenantSummary(BaseModel):
    """Lightweight tenant summary for listings"""
    id: UUID
    tenant_name: str
    tenant_code: str
    subscription_plan: str
    subscription_status: str
    days_until_expiry: int
    is_active: bool

    class Config:
        orm_mode = True


class TenantStats(BaseModel):
    """Tenant usage statistics"""
    tenant_id: UUID
    tenant_name: str
    total_doctors: int
    total_patients: int
    total_appointments: int
    total_prescriptions: int
    storage_used_mb: float

    # Limits and usage percentage
    doctor_limit: int
    doctor_usage_percent: float
    patient_limit: int
    patient_usage_percent: float


# ================== Admin Create Doctor Schema ==================

class AdminCreateDoctorRequest(BaseModel):
    """
    Schema for admin creating a new doctor account
    Tenant ID is automatically taken from logged-in admin
    """
    # Basic Information
    first_name: str = Field(..., min_length=2, description="Doctor first name")
    last_name: str = Field(..., min_length=2, description="Doctor last name")
    email: str = Field(..., description="Doctor email (login credential)")
    phone: str = Field(..., description="Doctor phone number")

    # Medical Information
    license_number: str = Field(..., description="Medical license number")
    specialization: str = Field(..., description="Medical specialization")
    qualification: str = Field(..., description="Educational qualifications")
    experience_years: int = Field(..., ge=0, le=70, description="Years of experience")

    # Office Assignment
    office_ids: List[str] = Field(default_factory=list, description="List of office IDs from doctor's offices array")
    primary_office_id: Optional[str] = Field(None, description="Primary office ID")

    @validator('email')
    def validate_email(cls, v):
        import re
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, v):
            raise ValueError("Invalid email format")
        return v.lower()


class AdminCreateDoctorResponse(BaseModel):
    """Response after admin creates doctor"""
    success: bool
    doctor_id: UUID
    user_id: UUID
    temp_password: str
    message: str


# ================== Subscription Plan Info ==================

class SubscriptionPlanInfo(BaseModel):
    """Detailed subscription plan information"""
    plan_id: str
    name: str
    price: Any  # Can be int or "Custom"
    duration_days: Optional[int] = None
    limits: TenantLimits
    features: List[str]


class SubscriptionPlansResponse(BaseModel):
    """All available subscription plans"""
    plans: Dict[str, SubscriptionPlanInfo]


# ================== Settings Schemas ==================

class TenantSettingsUpdate(BaseModel):
    """Update tenant settings"""
    timezone: Optional[str] = Field(None, description="Tenant timezone")
    language: Optional[str] = Field(None, description="Default language")
    date_format: Optional[str] = Field(None, description="Date format preference")
    currency: Optional[str] = Field(None, description="Currency code")
    notifications_enabled: Optional[bool] = Field(None, description="Enable notifications")
    custom_settings: Optional[Dict[str, Any]] = Field(None, description="Custom settings")
