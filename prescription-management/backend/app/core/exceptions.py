"""
Custom Exceptions for Prescription Management System
Provides specific error types for better error handling and API responses
"""

from typing import Any, Dict, Optional


class PrescriptionManagementError(Exception):
    """Base exception for all prescription management errors"""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        self.message = message
        self.details = details or {}
        super().__init__(self.message)


class ValidationError(PrescriptionManagementError):
    """Raised when data validation fails"""
    pass


class BusinessRuleError(PrescriptionManagementError):
    """Raised when business rule validation fails"""
    pass


class NotFoundError(PrescriptionManagementError):
    """Base class for not found errors"""
    pass


class AuthenticationError(PrescriptionManagementError):
    """Raised when authentication fails"""
    pass


class AuthorizationError(PrescriptionManagementError):
    """Raised when user lacks required permissions"""
    pass


class DuplicateError(PrescriptionManagementError):
    """Raised when trying to create duplicate records"""
    pass


class ConflictError(PrescriptionManagementError):
    """Raised when there's a conflict with existing data or state"""
    pass


# User-related exceptions
class UserNotFoundError(NotFoundError):
    """Raised when user is not found"""
    pass


class UserAlreadyExistsError(DuplicateError):
    """Raised when trying to create a user that already exists"""
    pass


# Doctor-related exceptions
class DoctorNotFoundError(NotFoundError):
    """Raised when doctor is not found"""
    pass


class DoctorAlreadyExistsError(DuplicateError):
    """Raised when trying to create a doctor that already exists"""
    pass


# Patient-related exceptions
class PatientNotFoundError(NotFoundError):
    """Raised when patient is not found"""
    pass


class PatientAlreadyExistsError(DuplicateError):
    """Raised when trying to create a patient that already exists"""
    pass


class FamilyLimitExceededError(BusinessRuleError):
    """Raised when family size limit is exceeded"""
    pass


class PrimaryFamilyMemberRequiredError(BusinessRuleError):
    """Raised when trying to add family member without primary member"""
    pass


# Appointment-related exceptions
class AppointmentNotFoundError(NotFoundError):
    """Raised when appointment is not found"""
    pass


class AppointmentConflictError(BusinessRuleError):
    """Raised when appointment conflicts with existing schedule"""
    pass


class AppointmentSlotUnavailableError(BusinessRuleError):
    """Raised when appointment slot is not available"""
    pass


# Prescription-related exceptions
class PrescriptionNotFoundError(NotFoundError):
    """Raised when prescription is not found"""
    pass


class InvalidPrescriptionError(ValidationError):
    """Raised when prescription data is invalid"""
    pass


# Medicine-related exceptions
class MedicineNotFoundError(NotFoundError):
    """Raised when medicine is not found"""
    pass


class MedicineInteractionError(BusinessRuleError):
    """Raised when medicine interaction is detected"""
    pass


# System-related exceptions
class DatabaseError(PrescriptionManagementError):
    """Raised when database operation fails"""
    pass


class ExternalServiceError(PrescriptionManagementError):
    """Raised when external service call fails"""
    pass


class ConfigurationError(PrescriptionManagementError):
    """Raised when system configuration is invalid"""
    pass