"""
Prescription models following ERD specifications
Supports composite key patient references and prescription items
"""

from sqlalchemy import Column, String, Text, Date, Boolean, Integer, Numeric, ForeignKey, Index, DateTime
from sqlalchemy.dialects.postgresql import UUID, ENUM
from sqlalchemy.orm import relationship, validates
from datetime import date, datetime
from typing import Dict, Any, List
import uuid

from app.models.base import BaseModel


# Prescription status enum as per ERD
PRESCRIPTION_STATUS_ENUM = ENUM(
    'draft', 'active', 'dispensed', 'completed', 'cancelled', 'expired',
    name='prescription_status',
    create_type=True
)


class Prescription(BaseModel):
    """
    Prescription model with composite key patient reference
    Following ERD prescription entity specifications
    """
    __tablename__ = "prescriptions"
    
    # Unique prescription identifier
    prescription_number = Column(
        String(100), 
        unique=True, 
        nullable=False,
        comment="Unique prescription number"
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
        comment="Prescribing doctor"
    )
    
    # Appointment reference (optional)
    appointment_id = Column(
        UUID(as_uuid=True),
        ForeignKey("appointments.id"),
        nullable=True,
        comment="Related appointment if any"
    )
    
    # Visit information
    visit_date = Column(
        Date, 
        nullable=False,
        default=date.today,
        comment="Date of visit/consultation"
    )
    
    # Clinical information
    chief_complaint = Column(
        Text, 
        nullable=True,
        comment="Patient's main complaint"
    )
    
    diagnosis = Column(
        Text, 
        nullable=False,
        comment="Medical diagnosis"
    )
    
    symptoms = Column(
        Text, 
        nullable=True,
        comment="Observed symptoms"
    )
    
    clinical_notes = Column(
        Text, 
        nullable=True,
        comment="Doctor's clinical notes"
    )
    
    doctor_instructions = Column(
        Text, 
        nullable=True,
        comment="Special instructions for patient"
    )
    
    # Prescription status and metadata
    status = Column(
        PRESCRIPTION_STATUS_ENUM, 
        default='active',
        comment="Current prescription status"
    )
    
    # Printing and template information
    is_printed = Column(
        Boolean, 
        default=False,
        comment="Whether prescription has been printed"
    )
    
    printed_at = Column(
        DateTime, 
        nullable=True,
        comment="When prescription was printed"
    )
    
    template_used = Column(
        String(100), 
        nullable=True,
        comment="Template used for printing"
    )
    
    # Relationships (as per ERD)
    patient = relationship(
        "Patient",
        back_populates="prescriptions",
        foreign_keys=[patient_uuid]
    )
    
    doctor = relationship(
        "Doctor",
        back_populates="prescriptions"
    )
    
    appointment = relationship(
        "Appointment",
        back_populates="prescription"
    )
    
    items = relationship(
        "PrescriptionItem",
        back_populates="prescription",
        cascade="all, delete-orphan",
        lazy="select"
    )

    # Dental relationships
    dental_observations = relationship(
        "DentalObservation",
        back_populates="prescription",
        cascade="all, delete-orphan",
        lazy="select"
    )

    dental_procedures = relationship(
        "DentalProcedure",
        back_populates="prescription",
        cascade="all, delete-orphan",
        lazy="select"
    )

    # referrals = relationship(
    #     "Referral",
    #     back_populates="prescription",
    #     cascade="all, delete-orphan",
    #     lazy="dynamic"
    # )
    
    # Indexes and constraints
    __table_args__ = (
        Index('idx_prescriptions_patient_composite', 'patient_mobile_number', 'patient_first_name'),
        Index('idx_prescriptions_doctor_id', 'doctor_id'),
        Index('idx_prescriptions_visit_date', 'visit_date'),
        Index('idx_prescriptions_status', 'status'),
        Index('idx_prescriptions_number', 'prescription_number'),
        Index('idx_prescriptions_patient_uuid', 'patient_uuid'),
    )
    
    @validates('prescription_number')
    def validate_prescription_number(self, key, number):
        """Validate prescription number format"""
        if not number:
            raise ValueError("Prescription number is required")
        
        return number.strip().upper()
    
    @validates('diagnosis')
    def validate_diagnosis(self, key, diagnosis):
        """Validate diagnosis"""
        if not diagnosis or not diagnosis.strip():
            raise ValueError("Diagnosis is required")
        
        diagnosis = diagnosis.strip()
        if len(diagnosis) < 3:
            raise ValueError("Diagnosis must be at least 3 characters")
        
        return diagnosis
    
    @validates('visit_date')
    def validate_visit_date(self, key, visit_date):
        """Validate visit date"""
        if not visit_date:
            raise ValueError("Visit date is required")
        
        if visit_date > date.today():
            raise ValueError("Visit date cannot be in the future")
        
        return visit_date
    
    def generate_prescription_number(self) -> str:
        """Generate unique prescription number"""
        today = date.today()
        prefix = f"RX{today.strftime('%Y%m%d')}"
        
        # This would typically be handled at the service level
        # with proper sequence generation
        import random
        suffix = f"{random.randint(1000, 9999)}"
        
        return f"{prefix}{suffix}"
    
    def get_patient_composite_key(self) -> tuple:
        """Get patient composite key"""
        return (self.patient_mobile_number, self.patient_first_name)
    
    def get_items_list(self) -> List[Dict[str, Any]]:
        """Get prescription items as list"""
        sorted_items = sorted(self.items, key=lambda x: x.sequence_order)
        return [item.to_dict() for item in sorted_items]
    
    def get_total_medicines(self) -> int:
        """Get total number of medicines prescribed"""
        return len([item for item in self.items if item.is_active])
    
    def get_total_amount(self) -> float:
        """Calculate total prescription amount"""
        total = 0.0
        for item in self.items:
            if item.is_active and item.total_amount:
                total += float(item.total_amount)
        return total
    
    def add_item(
        self,
        medicine_id: uuid.UUID,
        dosage: str,
        frequency: str,
        duration: str,
        instructions: str = None,
        quantity: int = 1,
        **kwargs
    ) -> "PrescriptionItem":
        """Add item to prescription"""
        # Get next sequence order
        max_order = max([item.sequence_order for item in self.items if item.is_active], default=0)
        sequence_order = max_order + 1
        
        item = PrescriptionItem(
            prescription_id=self.id,
            medicine_id=medicine_id,
            dosage=dosage,
            frequency=frequency,
            duration=duration,
            instructions=instructions,
            quantity=quantity,
            sequence_order=sequence_order,
            **kwargs
        )
        
        return item
    
    def mark_as_printed(self, template: str = None) -> None:
        """Mark prescription as printed"""
        self.is_printed = True
        self.printed_at = datetime.utcnow()
        if template:
            self.template_used = template
    
    def can_be_modified(self) -> bool:
        """Check if prescription can still be modified"""
        return self.status in ['draft', 'active']
    
    def is_expired(self) -> bool:
        """Check if prescription is expired"""
        if self.status == 'expired':
            return True
        
        # Check if prescription is older than validity period
        from datetime import timedelta
        from app.core.config import settings
        
        validity_days = getattr(settings, 'PRESCRIPTION_VALIDITY_DAYS', 30)
        expiry_date = self.visit_date + timedelta(days=validity_days)
        
        return date.today() > expiry_date
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary with additional computed fields"""
        data = super().to_dict()
        data.update({
            'patient_composite_key': self.get_patient_composite_key(),
            'items_list': self.get_items_list(),
            'total_medicines': self.get_total_medicines(),
            'total_amount': self.get_total_amount(),
            'can_be_modified': self.can_be_modified(),
            'is_expired': self.is_expired(),
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
                'specialization': self.doctor.specialization,
                'license_number': self.doctor.license_number
            }
        
        return data
    
    def __repr__(self) -> str:
        return f"<Prescription(number='{self.prescription_number}', patient='{self.patient_mobile_number}-{self.patient_first_name}')>"


class PrescriptionItem(BaseModel):
    """
    Individual medicine item in a prescription
    Following ERD prescription_items entity specifications
    """
    __tablename__ = "prescription_items"
    
    # Foreign keys
    prescription_id = Column(
        UUID(as_uuid=True),
        ForeignKey("prescriptions.id", ondelete="CASCADE"),
        nullable=False,
        comment="Reference to prescription"
    )
    
    medicine_id = Column(
        UUID(as_uuid=True),
        ForeignKey("medicines.id"),
        nullable=False,
        comment="Reference to medicine"
    )
    
    # Prescription details
    dosage = Column(
        String(100), 
        nullable=False,
        comment="Medicine dosage (e.g., 500mg)"
    )
    
    frequency = Column(
        String(100), 
        nullable=False,
        comment="Frequency of intake (e.g., 'Twice daily')"
    )
    
    duration = Column(
        String(100), 
        nullable=False,
        comment="Duration of treatment (e.g., '5 days')"
    )
    
    instructions = Column(
        Text, 
        nullable=True,
        comment="Special instructions for this medicine"
    )
    
    # Quantity and pricing
    quantity = Column(
        Integer, 
        nullable=False,
        default=1,
        comment="Number of units/tablets prescribed"
    )
    
    unit_price = Column(
        Numeric(10, 2), 
        nullable=True,
        comment="Price per unit"
    )
    
    total_amount = Column(
        Numeric(10, 2), 
        nullable=True,
        comment="Total amount for this item"
    )
    
    # Generic substitution
    is_generic_substitution_allowed = Column(
        Boolean, 
        default=True,
        comment="Whether generic substitution is allowed"
    )
    
    # Ordering
    sequence_order = Column(
        Integer, 
        nullable=False,
        default=1,
        comment="Order of medicine in prescription"
    )
    
    # Relationships
    prescription = relationship(
        "Prescription",
        back_populates="items"
    )

    medicine = relationship(
        "Medicine",
        back_populates="prescription_items",
        lazy="joined"  # Eagerly load medicine data
    )

    # Indexes
    __table_args__ = (
        Index('idx_prescription_items_prescription_id', 'prescription_id'),
        Index('idx_prescription_items_medicine_id', 'medicine_id'),
        Index('idx_prescription_items_sequence', 'prescription_id', 'sequence_order'),
    )

    @property
    def medicine_name(self) -> str:
        """Get medicine name from relationship"""
        return self.medicine.name if self.medicine else "Unknown Medicine"
    
    @validates('dosage', 'frequency', 'duration')
    def validate_prescription_details(self, key, value):
        """Validate prescription details"""
        if not value or not value.strip():
            raise ValueError(f"{key} is required")
        
        return value.strip()
    
    @validates('quantity')
    def validate_quantity(self, key, quantity):
        """Validate quantity"""
        if quantity is None or quantity < 1:
            raise ValueError("Quantity must be at least 1")
        
        if quantity > 1000:
            raise ValueError("Quantity seems too high")
        
        return quantity
    
    @validates('unit_price', 'total_amount')
    def validate_pricing(self, key, price):
        """Validate pricing fields"""
        if price is not None:
            if price < 0:
                raise ValueError(f"{key} cannot be negative")
            if price > 999999.99:
                raise ValueError(f"{key} is too high")
        
        return price
    
    def calculate_total_amount(self) -> None:
        """Calculate total amount based on unit price and quantity"""
        if self.unit_price:
            self.total_amount = self.unit_price * self.quantity
    
    def get_formatted_instruction(self) -> str:
        """Get formatted instruction for display"""
        parts = []
        
        if self.dosage:
            parts.append(f"Dosage: {self.dosage}")
        
        if self.frequency:
            parts.append(f"Frequency: {self.frequency}")
        
        if self.duration:
            parts.append(f"Duration: {self.duration}")
        
        if self.instructions:
            parts.append(f"Instructions: {self.instructions}")
        
        return " | ".join(parts)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary with medicine details"""
        data = super().to_dict()
        
        if self.medicine:
            data['medicine_details'] = self.medicine.to_dict()
        
        data.update({
            'formatted_instruction': self.get_formatted_instruction(),
            'calculated_total': float(self.total_amount) if self.total_amount else 0.0
        })
        
        return data
    
    def __repr__(self) -> str:
        return f"<PrescriptionItem(prescription_id='{self.prescription_id}', medicine_id='{self.medicine_id}')>"


# Helper functions for prescription management

def generate_prescription_number(db) -> str:
    """Generate unique prescription number"""
    today = date.today()
    prefix = f"RX{today.strftime('%Y%m%d')}"
    
    # Get count of prescriptions created today
    count = db.query(Prescription).filter(
        Prescription.prescription_number.like(f"{prefix}%")
    ).count()
    
    return f"{prefix}{count + 1:04d}"


def find_prescription_by_number(db, prescription_number: str) -> Prescription:
    """Find prescription by number"""
    return db.query(Prescription).filter(
        Prescription.prescription_number == prescription_number.upper(),
        Prescription.is_active == True
    ).first()


def get_patient_prescriptions(
    db, 
    mobile_number: str, 
    first_name: str,
    limit: int = 50
) -> List[Prescription]:
    """Get prescriptions for patient using composite key"""
    return db.query(Prescription).filter(
        Prescription.patient_mobile_number == mobile_number,
        Prescription.patient_first_name == first_name,
        Prescription.is_active == True
    ).order_by(Prescription.visit_date.desc()).limit(limit).all()


def get_doctor_prescriptions(
    db, 
    doctor_id: uuid.UUID,
    start_date: date = None,
    end_date: date = None,
    limit: int = 100
) -> List[Prescription]:
    """Get prescriptions created by doctor"""
    query = db.query(Prescription).filter(
        Prescription.doctor_id == doctor_id,
        Prescription.is_active == True
    )
    
    if start_date:
        query = query.filter(Prescription.visit_date >= start_date)
    
    if end_date:
        query = query.filter(Prescription.visit_date <= end_date)
    
    return query.order_by(Prescription.visit_date.desc()).limit(limit).all()


def validate_prescription_data(data: Dict[str, Any]) -> List[str]:
    """Validate prescription data"""
    errors = []
    
    required_fields = ['patient_mobile_number', 'patient_first_name', 'doctor_id', 'diagnosis']
    for field in required_fields:
        if not data.get(field):
            errors.append(f"{field} is required")
    
    # Validate items
    items = data.get('items', [])
    if not items:
        errors.append("At least one medicine item is required")
    
    for i, item in enumerate(items):
        item_errors = []
        required_item_fields = ['medicine_id', 'dosage', 'frequency', 'duration']
        for field in required_item_fields:
            if not item.get(field):
                item_errors.append(f"{field} is required")
        
        if item_errors:
            errors.append(f"Item {i+1}: {', '.join(item_errors)}")
    
    return errors