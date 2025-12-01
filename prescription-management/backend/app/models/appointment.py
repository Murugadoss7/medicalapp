"""
Appointment models following ERD specifications
Supports patient composite key references and scheduling
"""

from sqlalchemy import Column, String, Date, Time, Integer, Text, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID, ENUM
from sqlalchemy.orm import relationship, validates
from datetime import date, time, datetime, timedelta
from typing import Dict, Any, List
import uuid

from app.models.base import BaseModel


# Appointment status enum as per ERD
APPOINTMENT_STATUS_ENUM = ENUM(
    'scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled',
    name='appointment_status',
    create_type=True
)


class Appointment(BaseModel):
    """
    Appointment model with composite key patient reference
    Following ERD appointment entity specifications
    """
    __tablename__ = "appointments"
    
    # Unique appointment identifier
    appointment_number = Column(
        String(100), 
        unique=True, 
        nullable=False,
        comment="Unique appointment number"
    )
    
    # Patient reference using composite key (as per ERD)
    patient_mobile_number = Column(
        String(15), 
        nullable=False,
        comment="Patient mobile number (part of composite key)"
    )
    
    patient_first_name = Column(
        String(100), 
        nullable=False,
        comment="Patient first name (part of composite key)"
    )
    
    # Also maintain UUID reference for easier queries (as per ERD)
    patient_uuid = Column(
        UUID(as_uuid=True),
        ForeignKey("patients.id"),
        nullable=False,
        comment="Patient UUID for internal references"
    )
    
    # Doctor reference
    doctor_id = Column(
        UUID(as_uuid=True),
        ForeignKey("doctors.id"),
        nullable=False,
        comment="Assigned doctor"
    )

    # Office location reference (ID from doctor's offices JSONB array)
    office_id = Column(
        String(50),
        nullable=True,
        comment="Office ID from doctor's offices array"
    )

    # Appointment scheduling
    appointment_date = Column(
        Date, 
        nullable=False,
        comment="Date of appointment"
    )
    
    appointment_time = Column(
        Time, 
        nullable=False,
        comment="Time of appointment"
    )
    
    # Appointment details
    status = Column(
        APPOINTMENT_STATUS_ENUM, 
        default='scheduled',
        comment="Current appointment status"
    )
    
    reason_for_visit = Column(
        Text, 
        nullable=False,
        comment="Reason for the appointment"
    )
    
    notes = Column(
        Text, 
        nullable=True,
        comment="Additional notes or instructions"
    )
    
    duration_minutes = Column(
        Integer, 
        default=30,
        comment="Expected duration in minutes"
    )
    
    # Contact information
    contact_number = Column(
        String(20), 
        nullable=True,
        comment="Contact number for this appointment"
    )
    
    # Relationships (as per ERD)
    patient = relationship(
        "Patient",
        back_populates="appointments",
        foreign_keys=[patient_uuid]
    )
    
    doctor = relationship(
        "Doctor",
        back_populates="appointments"
    )
    
    prescription = relationship(
        "Prescription",
        back_populates="appointment",
        uselist=False
    )

    # Dental relationships
    dental_observations = relationship(
        "DentalObservation",
        back_populates="appointment",
        cascade="all, delete-orphan",
        lazy="select"
    )

    dental_procedures = relationship(
        "DentalProcedure",
        back_populates="appointment",
        cascade="all, delete-orphan",
        lazy="select"
    )

    # patient_visit = relationship(
    #     "PatientVisit",
    #     back_populates="appointment",
    #     uselist=False
    # )
    
    # Indexes and constraints
    __table_args__ = (
        Index('idx_appointments_patient_composite', 'patient_mobile_number', 'patient_first_name'),
        Index('idx_appointments_doctor_id', 'doctor_id'),
        Index('idx_appointments_date', 'appointment_date'),
        Index('idx_appointments_status', 'status'),
        Index('idx_appointments_number', 'appointment_number'),
        Index('idx_appointments_datetime', 'appointment_date', 'appointment_time'),
    )
    
    @validates('appointment_number')
    def validate_appointment_number(self, key, number):
        """Validate appointment number format"""
        if not number:
            raise ValueError("Appointment number is required")
        
        return number.strip().upper()
    
    @validates('reason_for_visit')
    def validate_reason_for_visit(self, key, reason):
        """Validate reason for visit"""
        if not reason or not reason.strip():
            raise ValueError("Reason for visit is required")
        
        reason = reason.strip()
        if len(reason) < 3:
            raise ValueError("Reason for visit must be at least 3 characters")
        
        return reason
    
    @validates('appointment_date')
    def validate_appointment_date(self, key, appointment_date):
        """Validate appointment date"""
        if not appointment_date:
            raise ValueError("Appointment date is required")
        
        if appointment_date < date.today():
            raise ValueError("Appointment date cannot be in the past")
        
        return appointment_date
    
    @validates('duration_minutes')
    def validate_duration(self, key, duration):
        """Validate appointment duration"""
        if duration is not None:
            if duration < 10:
                raise ValueError("Appointment duration must be at least 10 minutes")
            if duration > 480:  # 8 hours
                raise ValueError("Appointment duration cannot exceed 8 hours")
        
        return duration
    
    def generate_appointment_number(self) -> str:
        """Generate unique appointment number"""
        today = date.today()
        prefix = f"APT{today.strftime('%Y%m%d')}"
        
        # This would typically be handled at the service level
        import random
        suffix = f"{random.randint(1000, 9999)}"
        
        return f"{prefix}{suffix}"
    
    def get_patient_composite_key(self) -> tuple:
        """Get patient composite key"""
        return (self.patient_mobile_number, self.patient_first_name)
    
    def get_appointment_datetime(self) -> datetime:
        """Get appointment as datetime object"""
        return datetime.combine(self.appointment_date, self.appointment_time)
    
    def get_end_datetime(self) -> datetime:
        """Get appointment end datetime"""
        start_datetime = self.get_appointment_datetime()
        return start_datetime + timedelta(minutes=self.duration_minutes)
    
    def is_today(self) -> bool:
        """Check if appointment is today"""
        return self.appointment_date == date.today()
    
    def is_upcoming(self) -> bool:
        """Check if appointment is upcoming"""
        now = datetime.now()
        appointment_datetime = self.get_appointment_datetime()
        return appointment_datetime > now
    
    def is_past(self) -> bool:
        """Check if appointment is in the past"""
        now = datetime.now()
        appointment_datetime = self.get_appointment_datetime()
        return appointment_datetime < now
    
    def can_be_cancelled(self) -> bool:
        """Check if appointment can be cancelled"""
        return self.status in ['scheduled', 'confirmed'] and self.is_upcoming()
    
    def can_be_rescheduled(self) -> bool:
        """Check if appointment can be rescheduled"""
        return self.status in ['scheduled', 'confirmed'] and self.is_upcoming()
    
    def mark_as_completed(self) -> None:
        """Mark appointment as completed"""
        self.status = 'completed'
    
    def mark_as_cancelled(self) -> None:
        """Mark appointment as cancelled"""
        self.status = 'cancelled'
    
    def mark_as_no_show(self) -> None:
        """Mark appointment as no show"""
        self.status = 'no_show'
    
    def reschedule(self, new_date: date, new_time: time) -> None:
        """Reschedule appointment"""
        self.appointment_date = new_date
        self.appointment_time = new_time
        self.status = 'rescheduled'
    
    def get_status_display(self) -> str:
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
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary with additional computed fields"""
        data = super().to_dict()
        data.update({
            'patient_composite_key': self.get_patient_composite_key(),
            'appointment_datetime': self.get_appointment_datetime().isoformat(),
            'end_datetime': self.get_end_datetime().isoformat(),
            'is_today': self.is_today(),
            'is_upcoming': self.is_upcoming(),
            'is_past': self.is_past(),
            'can_be_cancelled': self.can_be_cancelled(),
            'can_be_rescheduled': self.can_be_rescheduled(),
            'status_display': self.get_status_display(),
        })
        
        # Include patient and doctor details
        if self.patient:
            data['patient_details'] = {
                'full_name': self.patient.get_full_name(),
                'age': self.patient.get_age(),
                'mobile_number': self.patient.mobile_number
            }
        
        if self.doctor:
            data['doctor_details'] = {
                'full_name': self.doctor.get_full_name(),
                'specialization': self.doctor.specialization
            }
        
        return data
    
    def __repr__(self) -> str:
        return f"<Appointment(number='{self.appointment_number}', date='{self.appointment_date}', time='{self.appointment_time}')>"


# Helper functions for appointment management

def generate_appointment_number(db) -> str:
    """Generate unique appointment number"""
    today = date.today()
    prefix = f"APT{today.strftime('%Y%m%d')}"
    
    # Get count of appointments created today
    count = db.query(Appointment).filter(
        Appointment.appointment_number.like(f"{prefix}%")
    ).count()
    
    return f"{prefix}{count + 1:04d}"


def find_appointment_by_number(db, appointment_number: str) -> Appointment:
    """Find appointment by number"""
    return db.query(Appointment).filter(
        Appointment.appointment_number == appointment_number.upper(),
        Appointment.is_active == True
    ).first()


def get_patient_appointments(
    db, 
    mobile_number: str, 
    first_name: str,
    start_date: date = None,
    end_date: date = None,
    limit: int = 50
) -> List[Appointment]:
    """Get appointments for patient using composite key"""
    query = db.query(Appointment).filter(
        Appointment.patient_mobile_number == mobile_number,
        Appointment.patient_first_name == first_name,
        Appointment.is_active == True
    )
    
    if start_date:
        query = query.filter(Appointment.appointment_date >= start_date)
    
    if end_date:
        query = query.filter(Appointment.appointment_date <= end_date)
    
    return query.order_by(Appointment.appointment_date.desc(), Appointment.appointment_time.desc()).limit(limit).all()


def get_doctor_appointments(
    db, 
    doctor_id: uuid.UUID,
    appointment_date: date = None,
    status: str = None,
    limit: int = 100
) -> List[Appointment]:
    """Get appointments for doctor"""
    query = db.query(Appointment).filter(
        Appointment.doctor_id == doctor_id,
        Appointment.is_active == True
    )
    
    if appointment_date:
        query = query.filter(Appointment.appointment_date == appointment_date)
    
    if status:
        query = query.filter(Appointment.status == status)
    
    return query.order_by(Appointment.appointment_date, Appointment.appointment_time).limit(limit).all()


def get_daily_schedule(db, doctor_id: uuid.UUID, date_obj: date) -> List[Appointment]:
    """Get doctor's daily schedule"""
    return db.query(Appointment).filter(
        Appointment.doctor_id == doctor_id,
        Appointment.appointment_date == date_obj,
        Appointment.status.in_(['scheduled', 'confirmed', 'in_progress']),
        Appointment.is_active == True
    ).order_by(Appointment.appointment_time).all()


def check_appointment_conflict(
    db, 
    doctor_id: uuid.UUID, 
    appointment_date: date, 
    appointment_time: time,
    duration_minutes: int = 30,
    exclude_appointment_id: uuid.UUID = None
) -> bool:
    """Check for appointment time conflicts"""
    start_datetime = datetime.combine(appointment_date, appointment_time)
    end_datetime = start_datetime + timedelta(minutes=duration_minutes)
    
    # Query for overlapping appointments
    query = db.query(Appointment).filter(
        Appointment.doctor_id == doctor_id,
        Appointment.appointment_date == appointment_date,
        Appointment.status.in_(['scheduled', 'confirmed', 'in_progress']),
        Appointment.is_active == True
    )
    
    if exclude_appointment_id:
        query = query.filter(Appointment.id != exclude_appointment_id)
    
    existing_appointments = query.all()
    
    for existing in existing_appointments:
        existing_start = datetime.combine(existing.appointment_date, existing.appointment_time)
        existing_end = existing_start + timedelta(minutes=existing.duration_minutes)
        
        # Check for overlap
        if (start_datetime < existing_end) and (end_datetime > existing_start):
            return True  # Conflict found
    
    return False  # No conflict


def validate_appointment_data(data: Dict[str, Any]) -> List[str]:
    """Validate appointment data"""
    errors = []
    
    required_fields = [
        'patient_mobile_number', 'patient_first_name', 
        'doctor_id', 'appointment_date', 'appointment_time', 'reason_for_visit'
    ]
    
    for field in required_fields:
        if not data.get(field):
            errors.append(f"{field} is required")
    
    # Validate date
    appointment_date = data.get('appointment_date')
    if appointment_date and isinstance(appointment_date, str):
        try:
            appointment_date = datetime.strptime(appointment_date, '%Y-%m-%d').date()
            if appointment_date < date.today():
                errors.append("Appointment date cannot be in the past")
        except ValueError:
            errors.append("Invalid appointment date format (YYYY-MM-DD)")
    
    # Validate duration
    duration = data.get('duration_minutes', 30)
    if duration < 10 or duration > 480:
        errors.append("Duration must be between 10 and 480 minutes")
    
    return errors