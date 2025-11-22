"""
Business logic services for the prescription management system
Following clean architecture principles
"""

from .auth_service import AuthService
from .user_service import UserService
from .dental_service import DentalService, get_dental_service

# TODO: Import other services as they are implemented
# from .patient_service import PatientService
# from .doctor_service import DoctorService
# from .medicine_service import MedicineService
# from .prescription_service import PrescriptionService
# from .appointment_service import AppointmentService

__all__ = [
    "AuthService",
    "UserService",
    "DentalService",
    "get_dental_service"
    # TODO: Add other service exports as they are implemented
]