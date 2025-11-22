"""
Authentication Pydantic schemas
Handles login, registration, and token management
"""

from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime


class LoginRequest(BaseModel):
    """Login request schema"""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=6, max_length=100, description="User password")
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "doctor@example.com",
                "password": "securepassword123"
            }
        }


class TokenData(BaseModel):
    """Token payload data"""
    user_id: str = Field(..., description="User UUID")
    email: str = Field(..., description="User email")
    role: str = Field(..., description="User role")
    permissions: List[str] = Field(default_factory=list, description="User permissions")
    exp: int = Field(..., description="Token expiration timestamp")


class TokenResponse(BaseModel):
    """Token response schema"""
    access_token: str = Field(..., description="JWT access token")
    refresh_token: str = Field(..., description="JWT refresh token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(..., description="Token expiration in seconds")
    
    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "expires_in": 3600
            }
        }


class LoginResponse(BaseModel):
    """Complete login response with user info and tokens"""
    user: 'UserResponse'
    tokens: TokenResponse
    permissions: List[str] = Field(default_factory=list, description="User permissions")
    
    class Config:
        json_schema_extra = {
            "example": {
                "user": {
                    "id": "123e4567-e89b-12d3-a456-426614174000",
                    "email": "doctor@example.com",
                    "role": "doctor",
                    "first_name": "John",
                    "last_name": "Smith",
                    "is_active": True
                },
                "tokens": {
                    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                    "token_type": "bearer",
                    "expires_in": 3600
                },
                "permissions": ["read:patients", "write:prescriptions"]
            }
        }


class RegisterRequest(BaseModel):
    """User registration request schema"""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=8, max_length=100, description="User password")
    confirm_password: str = Field(..., description="Password confirmation")
    first_name: str = Field(..., min_length=2, max_length=100, description="First name")
    last_name: str = Field(..., min_length=2, max_length=100, description="Last name")
    role: str = Field(..., description="User role")
    phone: Optional[str] = Field(None, description="Phone number")

    # Doctor-specific fields (optional, all can be provided during registration)
    license_number: Optional[str] = Field(None, description="Medical license number for doctors")
    specialization: Optional[str] = Field(None, description="Medical specialization")
    qualification: Optional[str] = Field(None, description="Educational qualifications")
    experience_years: Optional[int] = Field(None, ge=0, le=70, description="Years of experience")
    clinic_address: Optional[str] = Field(None, description="Clinic/hospital address")
    consultation_fee: Optional[str] = Field(None, description="Consultation fee amount")
    consultation_duration: Optional[int] = Field(30, ge=10, le=240, description="Consultation duration in minutes")
    availability_schedule: Optional[dict] = Field(None, description="Weekly availability schedule")
    
    @validator('confirm_password')
    def passwords_match(cls, v, values, **kwargs):
        if 'password' in values and v != values['password']:
            raise ValueError('Passwords do not match')
        return v
    
    @validator('role')
    def validate_role(cls, v):
        allowed_roles = ['admin', 'doctor', 'nurse', 'receptionist', 'patient']
        if v not in allowed_roles:
            raise ValueError(f'Role must be one of: {", ".join(allowed_roles)}')
        return v
    
    @validator('license_number')
    def validate_license_for_doctor(cls, v, values, **kwargs):
        if values.get('role') == 'doctor' and not v:
            raise ValueError('License number is required for doctors')
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "doctor@example.com",
                "password": "securepassword123",
                "confirm_password": "securepassword123",
                "first_name": "John",
                "last_name": "Smith",
                "role": "doctor",
                "license_number": "MED123456",
                "specialization": "General Medicine"
            }
        }


class RefreshTokenRequest(BaseModel):
    """Refresh token request schema"""
    refresh_token: str = Field(..., description="Valid refresh token")
    
    class Config:
        json_schema_extra = {
            "example": {
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            }
        }


class LogoutRequest(BaseModel):
    """Logout request schema"""
    refresh_token: Optional[str] = Field(None, description="Refresh token to invalidate")
    
    class Config:
        json_schema_extra = {
            "example": {
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            }
        }


class PasswordResetRequest(BaseModel):
    """Password reset request schema"""
    email: EmailStr = Field(..., description="User email address")
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com"
            }
        }


class PasswordResetConfirm(BaseModel):
    """Password reset confirmation schema"""
    token: str = Field(..., description="Password reset token")
    new_password: str = Field(..., min_length=8, max_length=100, description="New password")
    confirm_password: str = Field(..., description="New password confirmation")
    
    @validator('confirm_password')
    def passwords_match(cls, v, values, **kwargs):
        if 'new_password' in values and v != values['new_password']:
            raise ValueError('Passwords do not match')
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "token": "password-reset-token-here",
                "new_password": "newsecurepassword123",
                "confirm_password": "newsecurepassword123"
            }
        }


class PasswordChangeRequest(BaseModel):
    """Password change request schema"""
    current_password: str = Field(..., description="Current password")
    new_password: str = Field(..., min_length=8, max_length=100, description="New password")
    confirm_password: str = Field(..., description="New password confirmation")
    
    @validator('confirm_password')
    def passwords_match(cls, v, values, **kwargs):
        if 'new_password' in values and v != values['new_password']:
            raise ValueError('Passwords do not match')
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "current_password": "oldpassword123",
                "new_password": "newsecurepassword123",
                "confirm_password": "newsecurepassword123"
            }
        }


# Import here to avoid circular imports
from .user import UserResponse