"""
Models package for Prescription Management System
Following ERD specifications and relationships
"""

# Import all models to ensure they are registered with SQLAlchemy
from app.models.base import BaseModel, CompositeKeyMixin, TimestampMixin, UUIDMixin
from app.models.user import User
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.medicine import Medicine
from app.models.short_key import ShortKey, ShortKeyMedicine
from app.models.prescription import Prescription, PrescriptionItem
from app.models.appointment import Appointment
from app.models.audit_log import AuditLog
from app.models.dental import DentalObservation, DentalProcedure, DentalObservationTemplate
from app.models.case_study import CaseStudy

# Import helper functions
from app.models.patient import (
    get_family_members,
    check_family_limit,
    find_primary_family_member,
    validate_family_registration
)

from app.models.medicine import (
    search_medicines,
    find_medicine_by_name,
    check_drug_interactions
)

from app.models.short_key import (
    find_short_key_by_code,
    get_short_keys_for_user,
    create_default_short_keys
)

from app.models.prescription import (
    generate_prescription_number,
    find_prescription_by_number,
    get_patient_prescriptions,
    get_doctor_prescriptions
)

from app.models.appointment import (
    generate_appointment_number,
    find_appointment_by_number,
    get_patient_appointments,
    get_doctor_appointments,
    check_appointment_conflict
)

from app.models.audit_log import (
    create_audit_log,
    get_audit_trail,
    get_user_activity,
    audit_data_access,
    AuditContext
)

# All models for easy import
__all__ = [
    # Base classes
    "BaseModel",
    "CompositeKeyMixin", 
    "TimestampMixin",
    "UUIDMixin",
    
    # Core models
    "User",
    "Patient",
    "Doctor",
    "Medicine",
    "ShortKey",
    "ShortKeyMedicine",
    "Prescription",
    "PrescriptionItem",
    "Appointment",
    "AuditLog",
    "DentalObservation",
    "DentalProcedure",
    "DentalObservationTemplate",
    "CaseStudy",

    # Helper functions
    "get_family_members",
    "check_family_limit",
    "find_primary_family_member",
    "validate_family_registration",
    "search_medicines",
    "find_medicine_by_name", 
    "check_drug_interactions",
    "find_short_key_by_code",
    "get_short_keys_for_user",
    "create_default_short_keys",
    "generate_prescription_number",
    "find_prescription_by_number",
    "get_patient_prescriptions",
    "get_doctor_prescriptions",
    "generate_appointment_number",
    "find_appointment_by_number",
    "get_patient_appointments", 
    "get_doctor_appointments",
    "check_appointment_conflict",
    "create_audit_log",
    "get_audit_trail",
    "get_user_activity",
    "audit_data_access",
    "AuditContext",
]