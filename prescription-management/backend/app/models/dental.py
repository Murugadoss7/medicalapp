"""
Dental module models for tooth observations and procedures
Implements FDI notation system for dental charting
"""

from sqlalchemy import Column, String, Text, Boolean, Integer, DECIMAL, Date, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import date as date_type

from app.models.base import Base, UUIDMixin, TimestampMixin, AuditMixin, ActiveMixin


class DentalObservationTemplate(Base, UUIDMixin, TimestampMixin, AuditMixin, ActiveMixin):
    """
    Pre-defined observation note templates for dental conditions.
    Doctors can quickly select these based on condition/surface/severity.
    NULL values act as wildcards (match all).
    """
    __tablename__ = "dental_observation_templates"

    # Matching criteria (NULL = wildcard, matches all)
    condition_type = Column(String(50), nullable=True)  # e.g., "Cavity", NULL = all conditions
    tooth_surface = Column(String(10), nullable=True)   # e.g., "Occlusal", NULL = all surfaces
    severity = Column(String(20), nullable=True)        # e.g., "Moderate", NULL = all severities

    # Template content
    template_text = Column(Text, nullable=False)        # The pre-defined note text
    short_code = Column(String(20), nullable=True)      # Optional quick code like "CAV01"

    # Metadata
    display_order = Column(Integer, default=0)          # Sort order for display
    is_global = Column(Boolean, default=False)          # Available to doctors with same specialization
    specialization = Column(String(200), nullable=True) # Filter by doctor specialty (e.g., "Dental")

    # Ownership
    created_by_doctor = Column(UUID(as_uuid=True), ForeignKey("doctors.id"), nullable=True)

    # Relationships
    creator = relationship("Doctor", foreign_keys=[created_by_doctor])

    # Indexes
    __table_args__ = (
        Index('idx_dental_template_condition', 'condition_type'),
        Index('idx_dental_template_surface', 'tooth_surface'),
        Index('idx_dental_template_severity', 'severity'),
        Index('idx_dental_template_specialization', 'specialization'),
        Index('idx_dental_template_global', 'is_global'),
        Index('idx_dental_template_creator', 'created_by_doctor'),
    )

    def __repr__(self):
        return f"<DentalObservationTemplate(condition={self.condition_type}, text={self.template_text[:30]}...)>"


class DentalObservation(Base, UUIDMixin, TimestampMixin, AuditMixin, ActiveMixin):
    """
    Dental observations for individual teeth
    Tracks conditions, findings, and treatment requirements per tooth

    Uses FDI notation:
    - Adult teeth: 11-18, 21-28, 31-38, 41-48 (32 teeth)
    - Primary teeth: 51-55, 61-65, 71-75, 81-85 (20 teeth)
    """
    __tablename__ = "dental_observations"

    # Foreign key relationships
    prescription_id = Column(UUID(as_uuid=True), ForeignKey("prescriptions.id"), nullable=True)
    appointment_id = Column(UUID(as_uuid=True), ForeignKey("appointments.id"), nullable=True)

    # Patient composite key (following ERD pattern)
    patient_mobile_number = Column(String(20), nullable=False)
    patient_first_name = Column(String(100), nullable=False)

    # Tooth information (FDI notation)
    tooth_number = Column(String(3), nullable=False)  # e.g., '11', '51', '48'
    tooth_surface = Column(String(10), nullable=True)  # Occlusal, Mesial, Distal, Buccal, Lingual, Multiple

    # Observation details
    condition_type = Column(String(50), nullable=False)  # Cavity, Fracture, Decay, Discoloration, etc.
    severity = Column(String(20), nullable=True)  # Mild, Moderate, Severe
    observation_notes = Column(Text, nullable=True)  # Combined: template_notes + custom_notes

    # Template notes support
    selected_template_ids = Column(Text, nullable=True)  # Comma-separated UUIDs of selected templates
    custom_notes = Column(Text, nullable=True)           # Doctor's additional custom notes

    # Treatment tracking
    treatment_required = Column(Boolean, default=True, nullable=False)
    treatment_done = Column(Boolean, default=False, nullable=False)
    treatment_date = Column(Date, nullable=True)

    # Relationships
    prescription = relationship("Prescription", back_populates="dental_observations")
    appointment = relationship("Appointment", back_populates="dental_observations")
    procedures = relationship("DentalProcedure", back_populates="observation", cascade="all, delete-orphan")

    # Indexes for performance
    __table_args__ = (
        Index('idx_dental_obs_prescription', 'prescription_id'),
        Index('idx_dental_obs_appointment', 'appointment_id'),
        Index('idx_dental_obs_tooth', 'tooth_number'),
        Index('idx_dental_obs_patient', 'patient_mobile_number', 'patient_first_name'),
        Index('idx_dental_obs_condition', 'condition_type'),
    )

    def __repr__(self):
        return f"<DentalObservation(tooth={self.tooth_number}, condition={self.condition_type})>"


class DentalProcedure(Base, UUIDMixin, TimestampMixin, AuditMixin, ActiveMixin):
    """
    Dental procedures and treatments
    Tracks planned, in-progress, and completed dental procedures
    Can be linked to observations or stand alone
    """
    __tablename__ = "dental_procedures"

    # Foreign key relationships
    observation_id = Column(UUID(as_uuid=True), ForeignKey("dental_observations.id"), nullable=True)
    prescription_id = Column(UUID(as_uuid=True), ForeignKey("prescriptions.id"), nullable=True)
    appointment_id = Column(UUID(as_uuid=True), ForeignKey("appointments.id"), nullable=True)

    # Procedure information
    procedure_code = Column(String(20), nullable=False)  # CDT code or custom code
    procedure_name = Column(String(200), nullable=False)  # Root Canal, Filling, Extraction, etc.
    tooth_numbers = Column(Text, nullable=True)  # Comma-separated list of teeth (e.g., "11,12,13")

    # Procedure details
    description = Column(Text, nullable=True)
    estimated_cost = Column(DECIMAL(10, 2), nullable=True)
    actual_cost = Column(DECIMAL(10, 2), nullable=True)
    duration_minutes = Column(Integer, nullable=True)

    # Status and dates
    status = Column(
        String(20),
        nullable=False,
        default='planned'
    )  # planned, in_progress, completed, cancelled
    procedure_date = Column(Date, nullable=True)
    completed_date = Column(Date, nullable=True)

    # Notes
    procedure_notes = Column(Text, nullable=True)
    complications = Column(Text, nullable=True)

    # Relationships
    observation = relationship("DentalObservation", back_populates="procedures")
    prescription = relationship("Prescription", back_populates="dental_procedures")
    appointment = relationship("Appointment", back_populates="dental_procedures")

    # Indexes
    __table_args__ = (
        Index('idx_dental_proc_prescription', 'prescription_id'),
        Index('idx_dental_proc_appointment', 'appointment_id'),
        Index('idx_dental_proc_observation', 'observation_id'),
        Index('idx_dental_proc_status', 'status'),
        Index('idx_dental_proc_code', 'procedure_code'),
    )

    def __repr__(self):
        return f"<DentalProcedure(name={self.procedure_name}, status={self.status})>"


# Common dental condition types
DENTAL_CONDITION_TYPES = [
    "Cavity",
    "Decay",
    "Fracture",
    "Crack",
    "Discoloration",
    "Wear",
    "Erosion",
    "Abscess",
    "Gum Disease",
    "Root Exposure",
    "Sensitivity",
    "Missing",
    "Impacted",
    "Other"
]

# Common dental procedures
DENTAL_PROCEDURE_TEMPLATES = {
    # Restorative
    "FILL_AMG": {"name": "Amalgam Filling", "code": "D2140", "duration": 45},
    "FILL_COM": {"name": "Composite Filling", "code": "D2330", "duration": 60},
    "CROWN": {"name": "Crown", "code": "D2740", "duration": 90},
    "BRIDGE": {"name": "Bridge", "code": "D6240", "duration": 120},
    "INLAY": {"name": "Inlay", "code": "D2510", "duration": 75},

    # Endodontic
    "RCT_SINGLE": {"name": "Root Canal - Single Canal", "code": "D3310", "duration": 90},
    "RCT_MULTI": {"name": "Root Canal - Multiple Canals", "code": "D3320", "duration": 120},
    "PULPOTOMY": {"name": "Pulpotomy", "code": "D3220", "duration": 45},

    # Surgical
    "EXT_SIMPLE": {"name": "Simple Extraction", "code": "D7140", "duration": 30},
    "EXT_SURGICAL": {"name": "Surgical Extraction", "code": "D7210", "duration": 60},
    "IMPACTION": {"name": "Impaction Removal", "code": "D7230", "duration": 90},

    # Preventive
    "SCALING": {"name": "Scaling & Polishing", "code": "D1110", "duration": 45},
    "FLUORIDE": {"name": "Fluoride Treatment", "code": "D1206", "duration": 15},
    "SEALANT": {"name": "Sealant", "code": "D1351", "duration": 20},
    "PROPHYLAXIS": {"name": "Oral Prophylaxis", "code": "D1110", "duration": 30},

    # Orthodontic
    "BRACES_ADJ": {"name": "Braces Adjustment", "code": "D8080", "duration": 30},
    "RETAINER": {"name": "Retainer Fitting", "code": "D8680", "duration": 45},
}

# Tooth surfaces
TOOTH_SURFACES = [
    "Occlusal",  # Chewing surface
    "Mesial",    # Surface toward front of mouth
    "Distal",    # Surface toward back of mouth
    "Buccal",    # Cheek side
    "Lingual",   # Tongue side
    "Palatal",   # Roof of mouth side (upper teeth)
    "Incisal",   # Cutting edge (front teeth)
    "Multiple"   # Multiple surfaces
]

# FDI notation helpers
def is_valid_tooth_number(tooth_number: str) -> bool:
    """Validate FDI tooth number"""
    try:
        num = int(tooth_number)
        # Adult permanent teeth: 11-18, 21-28, 31-38, 41-48
        # Primary teeth: 51-55, 61-65, 71-75, 81-85
        if 11 <= num <= 18 or 21 <= num <= 28 or 31 <= num <= 38 or 41 <= num <= 48:
            return True  # Permanent teeth
        if 51 <= num <= 55 or 61 <= num <= 65 or 71 <= num <= 75 or 81 <= num <= 85:
            return True  # Primary teeth
        return False
    except ValueError:
        return False


def get_tooth_type(tooth_number: str) -> str:
    """Get tooth type (Permanent or Primary)"""
    try:
        num = int(tooth_number)
        if 11 <= num <= 48:
            return "permanent"
        if 51 <= num <= 85:
            return "primary"
        return "unknown"
    except ValueError:
        return "unknown"


def get_quadrant(tooth_number: str) -> int:
    """Get quadrant number (1-8)"""
    try:
        num = int(tooth_number)
        return num // 10
    except ValueError:
        return 0
