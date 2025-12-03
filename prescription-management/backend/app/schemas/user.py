"""
User Pydantic schemas
Handles user profile and management operations
"""

from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class UserBase(BaseModel):
    """Base user schema with common fields"""
    email: EmailStr = Field(..., description="User email address")
    first_name: str = Field(..., min_length=2, max_length=100, description="First name")
    last_name: str = Field(..., min_length=2, max_length=100, description="Last name")
    role: str = Field(..., description="User role")
    
    @validator('role')
    def validate_role(cls, v):
        allowed_roles = ['super_admin', 'admin', 'doctor', 'nurse', 'receptionist', 'patient']
        if v not in allowed_roles:
            raise ValueError(f'Role must be one of: {", ".join(allowed_roles)}')
        return v


class UserCreate(UserBase):
    """User creation schema"""
    password: str = Field(..., min_length=8, max_length=100, description="User password")
    keycloak_id: Optional[str] = Field(None, description="Keycloak user ID if using Keycloak")
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "securepassword123",
                "first_name": "John",
                "last_name": "Doe",
                "role": "doctor",
                "keycloak_id": "keycloak-uuid-here"
            }
        }


class UserUpdate(BaseModel):
    """User update schema"""
    email: Optional[EmailStr] = Field(None, description="Updated email address")
    first_name: Optional[str] = Field(None, min_length=2, max_length=100, description="Updated first name")
    last_name: Optional[str] = Field(None, min_length=2, max_length=100, description="Updated last name")
    role: Optional[str] = Field(None, description="Updated user role")
    is_active: Optional[bool] = Field(None, description="Active status")
    
    @validator('role')
    def validate_role(cls, v):
        if v is not None:
            allowed_roles = ['super_admin', 'admin', 'doctor', 'nurse', 'receptionist', 'patient']
            if v not in allowed_roles:
                raise ValueError(f'Role must be one of: {", ".join(allowed_roles)}')
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "first_name": "John",
                "last_name": "Smith",
                "email": "john.smith@example.com",
                "is_active": True
            }
        }


class UserResponse(UserBase):
    """User response schema"""
    id: UUID = Field(..., description="User UUID")
    keycloak_id: Optional[str] = Field(None, description="Keycloak user ID")
    is_active: bool = Field(..., description="Whether user is active")
    last_login: Optional[datetime] = Field(None, description="Last login timestamp")
    created_at: datetime = Field(..., description="User creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    # Additional computed fields
    full_name: Optional[str] = Field(None, description="Computed full name")
    permissions: List[str] = Field(default_factory=list, description="User permissions based on role")
    specialization: Optional[str] = Field(None, description="Doctor's specialization (e.g., Dental, Cardiology)")
    doctor_id: Optional[UUID] = Field(None, description="Doctor ID from doctors table (for doctor role only)")
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "email": "doctor@example.com",
                "first_name": "John",
                "last_name": "Smith",
                "role": "doctor",
                "keycloak_id": "keycloak-uuid-here",
                "is_active": True,
                "last_login": "2024-01-15T10:30:00Z",
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-15T10:30:00Z",
                "full_name": "John Smith",
                "permissions": ["read:patients", "write:prescriptions", "read:appointments"]
            }
        }


class UserProfile(UserResponse):
    """Extended user profile with additional details"""
    # Extended fields for profile page
    profile_image_url: Optional[str] = Field(None, description="Profile image URL")
    phone: Optional[str] = Field(None, description="Contact phone number")
    timezone: Optional[str] = Field(None, description="User timezone")
    language: Optional[str] = Field(None, description="Preferred language")
    
    # Statistics
    total_logins: int = Field(default=0, description="Total login count")
    last_activity: Optional[datetime] = Field(None, description="Last activity timestamp")
    
    class Config:
        from_attributes = True


class UserList(BaseModel):
    """User list response with pagination"""
    users: List[UserResponse] = Field(..., description="List of users")
    total: int = Field(..., description="Total number of users")
    page: int = Field(..., description="Current page number")
    limit: int = Field(..., description="Number of users per page")
    has_more: bool = Field(..., description="Whether there are more users")
    
    class Config:
        json_schema_extra = {
            "example": {
                "users": [
                    {
                        "id": "123e4567-e89b-12d3-a456-426614174000",
                        "email": "doctor@example.com",
                        "first_name": "John",
                        "last_name": "Smith",
                        "role": "doctor",
                        "is_active": True,
                        "created_at": "2024-01-01T00:00:00Z",
                        "updated_at": "2024-01-15T10:30:00Z",
                        "full_name": "John Smith",
                        "permissions": ["read:patients", "write:prescriptions"]
                    }
                ],
                "total": 25,
                "page": 1,
                "limit": 10,
                "has_more": True
            }
        }


class UserFilters(BaseModel):
    """User filtering and search parameters"""
    role: Optional[str] = Field(None, description="Filter by user role")
    is_active: Optional[bool] = Field(None, description="Filter by active status")
    search: Optional[str] = Field(None, description="Search in name or email")
    created_after: Optional[datetime] = Field(None, description="Filter users created after date")
    created_before: Optional[datetime] = Field(None, description="Filter users created before date")
    
    # Pagination
    page: int = Field(default=1, ge=1, description="Page number")
    limit: int = Field(default=10, ge=1, le=100, description="Items per page")
    
    # Sorting
    sort_by: str = Field(default="created_at", description="Sort field")
    sort_order: str = Field(default="desc", description="Sort order (asc/desc)")
    
    @validator('role')
    def validate_role(cls, v):
        if v is not None:
            allowed_roles = ['super_admin', 'admin', 'doctor', 'nurse', 'receptionist', 'patient']
            if v not in allowed_roles:
                raise ValueError(f'Role must be one of: {", ".join(allowed_roles)}')
        return v
    
    @validator('sort_by')
    def validate_sort_by(cls, v):
        allowed_fields = ['created_at', 'updated_at', 'email', 'first_name', 'last_name', 'role']
        if v not in allowed_fields:
            raise ValueError(f'Sort field must be one of: {", ".join(allowed_fields)}')
        return v
    
    @validator('sort_order')
    def validate_sort_order(cls, v):
        if v not in ['asc', 'desc']:
            raise ValueError('Sort order must be "asc" or "desc"')
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "role": "doctor",
                "is_active": True,
                "search": "john",
                "page": 1,
                "limit": 10,
                "sort_by": "created_at",
                "sort_order": "desc"
            }
        }


class RolePermissions(BaseModel):
    """Role-based permissions mapping"""
    role: str = Field(..., description="User role")
    permissions: List[str] = Field(..., description="List of permissions for this role")
    description: str = Field(..., description="Role description")
    
    class Config:
        json_schema_extra = {
            "example": {
                "role": "doctor",
                "permissions": [
                    "read:patients", "write:patients",
                    "read:prescriptions", "write:prescriptions",
                    "read:appointments", "write:appointments"
                ],
                "description": "Medical doctor with patient care permissions"
            }
        }


class UserActivity(BaseModel):
    """User activity tracking"""
    user_id: UUID = Field(..., description="User UUID")
    action: str = Field(..., description="Action performed")
    resource: str = Field(..., description="Resource accessed")
    timestamp: datetime = Field(..., description="Activity timestamp")
    ip_address: Optional[str] = Field(None, description="IP address")
    user_agent: Optional[str] = Field(None, description="User agent")
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "user_id": "123e4567-e89b-12d3-a456-426614174000",
                "action": "VIEW",
                "resource": "patient:9876543210:John",
                "timestamp": "2024-01-15T10:30:00Z",
                "ip_address": "192.168.1.100",
                "user_agent": "Mozilla/5.0..."
            }
        }