"""
Doctor model following ERD specifications
Links to User model and manages medical practice information
"""

from sqlalchemy import Column, String, Integer, Text, Boolean, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship, validates
from typing import Dict, Any, List
import uuid

from app.models.base import BaseModel


class Doctor(BaseModel):
    """
    Doctor model extending User with medical practice information
    Following ERD doctor entity specifications
    """
    __tablename__ = "doctors"
    
    # Foreign key to User (as per ERD)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        comment="Reference to user account"
    )
    
    # Medical license information
    license_number = Column(
        String(100), 
        unique=True, 
        nullable=False,
        comment="Medical license number"
    )
    
    # Professional information
    specialization = Column(
        String(255), 
        nullable=True,
        comment="Medical specialization"
    )
    
    qualification = Column(
        Text, 
        nullable=True,
        comment="Educational qualifications and certifications"
    )
    
    experience_years = Column(
        Integer, 
        nullable=True,
        comment="Years of medical experience"
    )
    
    # Practice information
    clinic_address = Column(
        Text, 
        nullable=True,
        comment="Clinic or hospital address"
    )
    
    phone = Column(
        String(20), 
        nullable=True,
        comment="Professional contact number"
    )
    
    # Availability schedule (JSON format for flexibility)
    availability_schedule = Column(
        JSONB,
        nullable=True,
        comment="Weekly availability schedule in JSON format"
    )
    
    # Professional settings
    consultation_fee = Column(
        String(20), 
        nullable=True,
        comment="Consultation fee"
    )
    
    consultation_duration = Column(
        Integer, 
        default=30,
        comment="Default consultation duration in minutes"
    )
    
    # Relationships (as per ERD)
    user = relationship(
        "User", 
        back_populates="doctor_profile"
    )
    
    appointments = relationship(
        "Appointment",
        back_populates="doctor",
        cascade="all, delete-orphan",
        lazy="dynamic"
    )
    
    prescriptions = relationship(
        "Prescription",
        back_populates="doctor",
        cascade="all, delete-orphan",
        lazy="dynamic"
    )
    
    # patient_visits = relationship(
    #     "PatientVisit",
    #     back_populates="doctor",
    #     cascade="all, delete-orphan",
    #     lazy="dynamic"
    # )
    
    # referrals = relationship(
    #     "Referral",
    #     back_populates="doctor",
    #     cascade="all, delete-orphan",
    #     lazy="dynamic"
    # )
    
    # short_keys = relationship(
    #     "ShortKey",
    #     back_populates="doctor",
    #     lazy="dynamic"
    # )
    
    # Indexes for performance
    __table_args__ = (
        Index('idx_doctors_user_id', 'user_id'),
        Index('idx_doctors_license_number', 'license_number'),
        Index('idx_doctors_specialization', 'specialization'),
        Index('idx_doctors_active', 'is_active'),
    )
    
    @validates('license_number')
    def validate_license_number(self, key, license_number):
        """Validate medical license number"""
        if not license_number:
            raise ValueError("License number is required")
        
        license_number = license_number.strip().upper()
        
        # Basic format validation (can be customized per country/state)
        if len(license_number) < 5:
            raise ValueError("License number must be at least 5 characters")
        
        return license_number
    
    @validates('experience_years')
    def validate_experience_years(self, key, experience_years):
        """Validate experience years"""
        if experience_years is not None:
            if experience_years < 0:
                raise ValueError("Experience years cannot be negative")
            if experience_years > 70:
                raise ValueError("Experience years seems unrealistic")
        
        return experience_years
    
    @validates('consultation_duration')
    def validate_consultation_duration(self, key, duration):
        """Validate consultation duration"""
        if duration is not None:
            if duration < 10:
                raise ValueError("Consultation duration must be at least 10 minutes")
            if duration > 240:
                raise ValueError("Consultation duration cannot exceed 4 hours")
        
        return duration
    
    def get_full_name(self) -> str:
        """Get doctor's full name with title"""
        if self.user:
            base_name = self.user.get_full_name()
            return f"Dr. {base_name}"
        return "Dr. Unknown"
    
    def get_availability_schedule(self) -> Dict[str, Any]:
        """Get availability schedule as dictionary"""
        if self.availability_schedule:
            return dict(self.availability_schedule)
        return self.get_default_schedule()
    
    def set_availability_schedule(self, schedule: Dict[str, Any]) -> None:
        """Set availability schedule"""
        # Validate schedule format
        valid_days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        
        for day, slots in schedule.items():
            if day not in valid_days:
                raise ValueError(f"Invalid day: {day}")
            
            if not isinstance(slots, list):
                raise ValueError(f"Slots for {day} must be a list")
            
            for slot in slots:
                if not isinstance(slot, dict) or 'start_time' not in slot or 'end_time' not in slot:
                    raise ValueError(f"Invalid slot format for {day}")
        
        self.availability_schedule = schedule
    
    def get_default_schedule(self) -> Dict[str, Any]:
        """Get default availability schedule"""
        return {
            'monday': [{'start_time': '09:00', 'end_time': '17:00'}],
            'tuesday': [{'start_time': '09:00', 'end_time': '17:00'}],
            'wednesday': [{'start_time': '09:00', 'end_time': '17:00'}],
            'thursday': [{'start_time': '09:00', 'end_time': '17:00'}],
            'friday': [{'start_time': '09:00', 'end_time': '17:00'}],
            'saturday': [{'start_time': '09:00', 'end_time': '13:00'}],
            'sunday': []
        }
    
    def is_available_on_day(self, day: str) -> bool:
        """Check if doctor is available on specific day"""
        schedule = self.get_availability_schedule()
        return len(schedule.get(day.lower(), [])) > 0
    
    def get_available_slots(self, day: str) -> List[Dict[str, str]]:
        """Get available time slots for specific day"""
        schedule = self.get_availability_schedule()
        return schedule.get(day.lower(), [])
    
    def get_specializations_list(self) -> List[str]:
        """Get specializations as list (if multiple stored as comma-separated)"""
        if self.specialization:
            return [spec.strip() for spec in self.specialization.split(',')]
        return []
    
    def add_specialization(self, specialization: str) -> None:
        """Add a specialization"""
        current_specs = self.get_specializations_list()
        if specialization not in current_specs:
            current_specs.append(specialization)
            self.specialization = ', '.join(current_specs)
    
    def get_years_of_experience_range(self) -> str:
        """Get experience range as string"""
        if not self.experience_years:
            return "Experience not specified"
        
        if self.experience_years < 2:
            return "Less than 2 years"
        elif self.experience_years < 5:
            return "2-5 years"
        elif self.experience_years < 10:
            return "5-10 years"
        elif self.experience_years < 20:
            return "10-20 years"
        else:
            return "20+ years"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary with additional computed fields"""
        data = super().to_dict()
        
        # Include user information
        if self.user:
            data.update({
                'user_email': self.user.email,
                'user_role': self.user.role,
                'first_name': self.user.first_name,
                'last_name': self.user.last_name,
            })
        
        # Add computed fields
        data.update({
            'full_name': self.get_full_name(),
            'availability_schedule_dict': self.get_availability_schedule(),
            'specializations_list': self.get_specializations_list(),
            'experience_range': self.get_years_of_experience_range(),
        })
        
        return data
    
    def __repr__(self) -> str:
        return f"<Doctor(license='{self.license_number}', specialization='{self.specialization}')>"
    
    def __str__(self) -> str:
        return f"{self.get_full_name()} - {self.specialization or 'General Practice'}"


# Helper functions for doctor management

def create_doctor_profile(
    db,
    user_id: uuid.UUID,
    license_number: str,
    specialization: str = None,
    **kwargs
) -> Doctor:
    """
    Create doctor profile for existing user
    """
    doctor = Doctor(
        user_id=user_id,
        license_number=license_number,
        specialization=specialization,
        **kwargs
    )
    
    db.add(doctor)
    db.flush()
    return doctor


def find_doctor_by_license(db, license_number: str) -> Doctor:
    """Find doctor by license number"""
    return db.query(Doctor).filter(
        Doctor.license_number == license_number.upper(),
        Doctor.is_active == True
    ).first()


def find_doctor_by_user_id(db, user_id: uuid.UUID) -> Doctor:
    """Find doctor by user ID"""
    return db.query(Doctor).filter(
        Doctor.user_id == user_id,
        Doctor.is_active == True
    ).first()


def get_doctors_by_specialization(db, specialization: str) -> List[Doctor]:
    """Get all doctors with specific specialization"""
    return db.query(Doctor).filter(
        Doctor.specialization.ilike(f"%{specialization}%"),
        Doctor.is_active == True
    ).all()


def search_doctors(
    db, 
    query: str = None, 
    specialization: str = None,
    min_experience: int = None
) -> List[Doctor]:
    """
    Search doctors with various filters
    """
    query_obj = db.query(Doctor).filter(Doctor.is_active == True)
    
    if query:
        query_obj = query_obj.join(Doctor.user).filter(
            db.or_(
                Doctor.user.first_name.ilike(f"%{query}%"),
                Doctor.user.last_name.ilike(f"%{query}%"),
                Doctor.license_number.ilike(f"%{query}%")
            )
        )
    
    if specialization:
        query_obj = query_obj.filter(
            Doctor.specialization.ilike(f"%{specialization}%")
        )
    
    if min_experience:
        query_obj = query_obj.filter(
            Doctor.experience_years >= min_experience
        )
    
    return query_obj.all()


def validate_doctor_license_uniqueness(db, license_number: str, exclude_id: uuid.UUID = None) -> bool:
    """
    Validate that license number is unique
    """
    query = db.query(Doctor).filter(
        Doctor.license_number == license_number.upper(),
        Doctor.is_active == True
    )
    
    if exclude_id:
        query = query.filter(Doctor.id != exclude_id)
    
    return query.first() is None