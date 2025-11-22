"""
User model for Keycloak integration
Following ERD user management specifications
"""

from sqlalchemy import Column, String, Boolean, Index, DateTime
from sqlalchemy.dialects.postgresql import UUID, ENUM
from sqlalchemy.orm import relationship, validates
from typing import List, Dict, Any
import uuid

from app.models.base import BaseModel
from app.core.config import settings


# User role enum as per ERD
USER_ROLE_ENUM = ENUM(
    'super_admin', 'admin', 'doctor', 'nurse', 'receptionist', 'patient',
    name='user_role',
    create_type=True
)


class User(BaseModel):
    """
    User model integrated with Keycloak
    Manages authentication and role-based access control
    """
    __tablename__ = "users"
    
    # Keycloak integration (optional for local development)
    keycloak_id = Column(
        String(255), 
        unique=True, 
        nullable=True,  # Made nullable for local authentication
        comment="Keycloak user identifier"
    )
    
    # Local authentication support
    hashed_password = Column(
        String(255),
        nullable=True,  # Nullable when using Keycloak
        comment="Hashed password for local authentication"
    )
    
    # Basic user information
    email = Column(
        String(255), 
        unique=True, 
        nullable=False,
        comment="User email address"
    )
    
    # Role-based access control (as per ERD)
    role = Column(
        USER_ROLE_ENUM, 
        nullable=False,
        comment="User role for permissions"
    )
    
    # Additional user properties
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=True)
    
    # Status tracking
    is_email_verified = Column(Boolean, default=False)
    is_phone_verified = Column(Boolean, default=False)
    last_login_at = Column(String, nullable=True)  # Match existing database schema
    
    # Relationships (as per ERD)
    doctor_profile = relationship(
        "Doctor", 
        back_populates="user", 
        uselist=False,
        cascade="all, delete-orphan"
    )
    
    created_patients = relationship(
        "Patient",
        foreign_keys="Patient.created_by",
        lazy="dynamic"
    )
    
    created_short_keys = relationship(
        "ShortKey",
        back_populates="creator",
        lazy="dynamic"
    )
    
    audit_logs = relationship(
        "AuditLog",
        back_populates="performed_by_user",
        lazy="dynamic"
    )
    
    # Indexes for performance
    __table_args__ = (
        Index('idx_users_keycloak_id', 'keycloak_id'),
        Index('idx_users_email', 'email'),
        Index('idx_users_role', 'role'),
        Index('idx_users_active', 'is_active'),
    )
    
    @validates('email')
    def validate_email(self, key, email):
        """Validate email format"""
        if not email:
            raise ValueError("Email is required")
        
        email = email.strip().lower()
        import re
        if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
            raise ValueError("Invalid email format")
        
        return email
    
    @validates('keycloak_id')
    def validate_keycloak_id(self, key, keycloak_id):
        """Validate Keycloak ID (optional for local development)"""
        if keycloak_id:
            return keycloak_id.strip()
        return keycloak_id  # Allow None/empty for local testing
    
    @validates('role')
    def validate_role(self, key, role):
        """Validate user role"""
        valid_roles = ['super_admin', 'admin', 'doctor', 'nurse', 'receptionist', 'patient']
        if role not in valid_roles:
            raise ValueError(f"Invalid role. Must be one of: {valid_roles}")
        return role
    
    def get_full_name(self) -> str:
        """Get user's full name"""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        elif self.first_name:
            return self.first_name
        else:
            return self.email.split('@')[0]
    
    def has_permission(self, permission: str) -> bool:
        """
        Check if user has specific permission
        Based on ERD role permissions
        """
        user_permissions = settings.ROLE_PERMISSIONS.get(self.role, [])
        return "*" in user_permissions or permission in user_permissions
    
    def get_permissions(self) -> List[str]:
        """Get all permissions for user role"""
        return settings.ROLE_PERMISSIONS.get(self.role, [])
    
    def is_doctor(self) -> bool:
        """Check if user is a doctor"""
        return self.role == 'doctor'
    
    def is_admin(self) -> bool:
        """Check if user is an admin"""
        return self.role in ['super_admin', 'admin']
    
    def is_patient(self) -> bool:
        """Check if user is a patient"""
        return self.role == 'patient'
    
    def is_healthcare_provider(self) -> bool:
        """Check if user is a healthcare provider"""
        return self.role in ['doctor', 'nurse']
    
    def can_manage_patients(self) -> bool:
        """Check if user can manage patients"""
        return self.has_permission('manage_patients') or self.has_permission('register_patients')
    
    def can_create_prescriptions(self) -> bool:
        """Check if user can create prescriptions"""
        return self.has_permission('create_prescriptions')
    
    def can_manage_medicines(self) -> bool:
        """Check if user can manage medicine catalog"""
        return self.has_permission('manage_medicines')
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary with additional fields"""
        data = super().to_dict()
        data.update({
            'full_name': self.get_full_name(),
            'permissions': self.get_permissions(),
            'is_doctor': self.is_doctor(),
            'is_admin': self.is_admin(),
            'is_patient': self.is_patient(),
            'is_healthcare_provider': self.is_healthcare_provider(),
        })
        return data
    
    def __repr__(self) -> str:
        return f"<User(email='{self.email}', role='{self.role}')>"
    
    def __str__(self) -> str:
        return f"{self.get_full_name()} ({self.role})"


# Helper functions for user management

def create_user_from_keycloak(
    db, 
    keycloak_id: str, 
    email: str, 
    role: str,
    first_name: str = None,
    last_name: str = None,
    **kwargs
) -> User:
    """
    Create user from Keycloak registration
    """
    user = User(
        keycloak_id=keycloak_id,
        email=email,
        role=role,
        first_name=first_name,
        last_name=last_name,
        **kwargs
    )
    
    db.add(user)
    db.flush()
    return user


def find_user_by_keycloak_id(db, keycloak_id: str) -> User:
    """Find user by Keycloak ID"""
    return db.query(User).filter(
        User.keycloak_id == keycloak_id,
        User.is_active == True
    ).first()


def find_user_by_email(db, email: str) -> User:
    """Find user by email"""
    return db.query(User).filter(
        User.email == email.lower(),
        User.is_active == True
    ).first()


def get_users_by_role(db, role: str) -> List[User]:
    """Get all users with specific role"""
    return db.query(User).filter(
        User.role == role,
        User.is_active == True
    ).all()


def validate_role_permissions(role: str, required_permissions: List[str]) -> bool:
    """
    Validate if role has required permissions
    """
    role_permissions = settings.ROLE_PERMISSIONS.get(role, [])
    if "*" in role_permissions:
        return True
    
    return all(perm in role_permissions for perm in required_permissions)