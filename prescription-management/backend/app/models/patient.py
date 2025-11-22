"""
Patient model implementing ERD composite key structure
Primary Key: (mobile_number, first_name)
Supports family registration with same mobile number
"""

from sqlalchemy import Column, String, Date, Text, Boolean, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB, ENUM
from sqlalchemy.orm import relationship, validates
from datetime import date
from typing import Dict, Any, List
import uuid
import re

from app.models.base import Base, TimestampMixin, CompositeKeyMixin, AuditMixin
from app.core.config import settings


# Enums for patient data (as per ERD)
GENDER_ENUM = ENUM(
    'male', 'female', 'other', 'prefer_not_to_say',
    name='gender_enum',
    create_type=True
)

RELATIONSHIP_ENUM = ENUM(
    'self', 'spouse', 'child', 'parent', 'sibling', 
    'grandparent', 'grandchild', 'other',
    name='relationship_enum',
    create_type=True
)


class Patient(Base, TimestampMixin, CompositeKeyMixin, AuditMixin):
    """
    Patient model with composite primary key (mobile_number + first_name)
    Implements ERD family registration requirements
    """
    __tablename__ = "patients"
    
    # Composite Primary Key as per ERD
    mobile_number = Column(
        String(15), 
        primary_key=True, 
        nullable=False,
        comment="Mobile number - part of composite key"
    )
    first_name = Column(
        String(100), 
        primary_key=True, 
        nullable=False,
        comment="First name - part of composite key"
    )
    
    # Additional UUID for internal references (as per ERD)
    id = Column(
        UUID(as_uuid=True),
        unique=True,
        nullable=False,
        default=uuid.uuid4,
        comment="Unique identifier for internal references"
    )
    
    # Basic patient information
    last_name = Column(String(100), nullable=False)
    date_of_birth = Column(Date, nullable=False)
    gender = Column(GENDER_ENUM, nullable=False)
    email = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)
    
    # Family relationship support (ERD requirement)
    relationship_to_primary = Column(
        RELATIONSHIP_ENUM, 
        nullable=False, 
        default='self',
        comment="Relationship to primary account holder"
    )
    primary_contact_mobile = Column(
        String(15), 
        nullable=True,
        comment="Mobile number of primary family contact"
    )
    
    # Emergency contact information
    emergency_contact = Column(
        JSONB,
        nullable=True,
        comment="Emergency contact details in JSON format"
    )
    
    # Additional information
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    
    # Audit fields
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Relationships (as per ERD)
    prescriptions = relationship(
        "Prescription", 
        back_populates="patient",
        cascade="all, delete-orphan",
        lazy="dynamic"
    )
    
    appointments = relationship(
        "Appointment", 
        back_populates="patient",
        cascade="all, delete-orphan",
        lazy="dynamic"
    )
    
    # patient_visits = relationship(
    #     "PatientVisit", 
    #     back_populates="patient",
    #     cascade="all, delete-orphan",
    #     lazy="dynamic"
    # )
    
    # allergies = relationship(
    #     "Allergy", 
    #     back_populates="patient",
    #     cascade="all, delete-orphan",
    #     lazy="dynamic"
    # )
    
    # medical_history = relationship(
    #     "MedicalHistory", 
    #     back_populates="patient",
    #     cascade="all, delete-orphan",
    #     lazy="dynamic"
    # )
    
    # referrals = relationship(
    #     "Referral", 
    #     back_populates="patient",
    #     cascade="all, delete-orphan",
    #     lazy="dynamic"
    # )
    
    # Indexes for performance (as per ERD indexing strategy)
    __table_args__ = (
        Index('idx_patients_mobile_number', 'mobile_number'),
        Index('idx_patients_id', 'id'),
        Index('idx_patients_primary_contact', 'primary_contact_mobile'),
        Index('idx_patients_family', 'mobile_number', 'relationship_to_primary'),
        Index('idx_patients_active', 'is_active'),
        Index('idx_patients_name_search', 'first_name', 'last_name'),
        Index('idx_patients_email', 'email'),
    )
    
    @classmethod
    def get_composite_key_fields(cls) -> List[str]:
        """Return composite key fields for this model"""
        return ['mobile_number', 'first_name']
    
    @validates('mobile_number')
    def validate_mobile_number(self, key, mobile_number):
        """Validate mobile number format"""
        if not mobile_number:
            raise ValueError("Mobile number is required")
        
        # Clean mobile number (remove spaces, dashes, etc.)
        cleaned = re.sub(r'[^\d+]', '', mobile_number)
        
        # Validate Indian mobile format (as per ERD business rules)
        if not settings.ALLOW_INTERNATIONAL_MOBILE:
            if not re.match(settings.MOBILE_NUMBER_REGEX, cleaned):
                raise ValueError("Invalid mobile number format. Must be 10 digits starting with 6-9")
        
        return cleaned
    
    @validates('first_name', 'last_name')
    def validate_names(self, key, name):
        """Validate name fields"""
        if not name or not name.strip():
            raise ValueError(f"{key} is required")
        
        # Clean and validate name (only letters and spaces)
        cleaned_name = name.strip()
        if not re.match(r'^[a-zA-Z\s]+$', cleaned_name):
            raise ValueError(f"{key} should contain only letters and spaces")
        
        if len(cleaned_name) < 2:
            raise ValueError(f"{key} should be at least 2 characters long")
        
        return cleaned_name.title()  # Capitalize properly
    
    @validates('email')
    def validate_email(self, key, email):
        """Validate email format"""
        if email:
            email = email.strip().lower()
            if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
                raise ValueError("Invalid email format")
        return email
    
    @validates('date_of_birth')
    def validate_date_of_birth(self, key, dob):
        """Validate date of birth"""
        if not dob:
            raise ValueError("Date of birth is required")
        
        if dob > date.today():
            raise ValueError("Date of birth cannot be in the future")
        
        return dob
    
    def get_age(self) -> int:
        """Calculate patient age"""
        today = date.today()
        return today.year - self.date_of_birth.year - (
            (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
        )
    
    def get_full_name(self) -> str:
        """Get patient's full name"""
        return f"{self.first_name} {self.last_name}"
    
    def is_family_member(self) -> bool:
        """Check if patient is a family member (not primary)"""
        return self.relationship_to_primary != 'self'
    
    def get_family_primary_mobile(self) -> str:
        """Get primary family contact mobile"""
        return self.primary_contact_mobile if self.is_family_member() else self.mobile_number
    
    def get_emergency_contact_dict(self) -> Dict[str, Any]:
        """Get emergency contact as dictionary"""
        if self.emergency_contact:
            return dict(self.emergency_contact)
        return {}
    
    def set_emergency_contact(self, name: str, phone: str, relationship: str) -> None:
        """Set emergency contact information"""
        self.emergency_contact = {
            'name': name,
            'phone': phone,
            'relationship': relationship
        }
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary with additional computed fields"""
        data = super().to_dict() if hasattr(super(), 'to_dict') else {}
        
        # Basic fields
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, date):
                data[column.name] = value.isoformat()
            elif isinstance(value, uuid.UUID):
                data[column.name] = str(value)
            else:
                data[column.name] = value
        
        # Computed fields
        data.update({
            'full_name': self.get_full_name(),
            'age': self.get_age(),
            'is_family_member': self.is_family_member(),
            'emergency_contact_dict': self.get_emergency_contact_dict(),
        })
        
        return data
    
    def __repr__(self) -> str:
        return f"<Patient(mobile='{self.mobile_number}', name='{self.get_full_name()}')>"
    
    def __str__(self) -> str:
        return f"{self.get_full_name()} ({self.mobile_number})"


# Helper functions for family management

def get_family_members(db, mobile_number: str) -> List[Patient]:
    """
    Get all family members for a mobile number
    Returns list of patients with same mobile number
    """
    return db.query(Patient).filter(
        Patient.mobile_number == mobile_number,
        Patient.is_active == True
    ).order_by(
        Patient.relationship_to_primary,
        Patient.first_name
    ).all()


def check_family_limit(db, mobile_number: str) -> bool:
    """
    Check if family size limit is reached
    Prevents too many registrations per mobile
    """
    count = db.query(Patient).filter(
        Patient.mobile_number == mobile_number,
        Patient.is_active == True
    ).count()
    
    return count < settings.MAX_FAMILY_MEMBERS_PER_MOBILE


def find_primary_family_member(db, mobile_number: str) -> Patient:
    """
    Find the primary family member (relationship = 'self')
    """
    return db.query(Patient).filter(
        Patient.mobile_number == mobile_number,
        Patient.relationship_to_primary == 'self',
        Patient.is_active == True
    ).first()


def validate_family_registration(
    db, 
    mobile_number: str, 
    first_name: str, 
    relationship: str
) -> Dict[str, Any]:
    """
    Validate family registration constraints
    Returns validation result with any errors
    """
    errors = []
    
    # Check if patient already exists
    existing = db.query(Patient).filter(
        Patient.mobile_number == mobile_number,
        Patient.first_name == first_name,
        Patient.is_active == True
    ).first()
    
    if existing:
        errors.append("Patient with this mobile number and name already exists")
    
    # Check family size limit
    if not check_family_limit(db, mobile_number):
        errors.append(f"Maximum {settings.MAX_FAMILY_MEMBERS_PER_MOBILE} family members allowed per mobile number")
    
    # If not primary member, check if primary exists
    if relationship != 'self':
        primary = find_primary_family_member(db, mobile_number)
        if not primary:
            errors.append("Primary family member (self) must be registered first")
    
    return {
        'is_valid': len(errors) == 0,
        'errors': errors
    }