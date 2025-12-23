"""
API v1 router configuration
Includes all endpoint modules with proper prefixes and tags
"""

from fastapi import APIRouter

from app.api.v1.endpoints import auth, users, doctors, patients, medicines, short_keys, appointments, prescriptions, dental, dental_attachments, treatments, case_studies

# Main API router
api_router = APIRouter()

# Authentication endpoints
api_router.include_router(
    auth.router, 
    prefix="/auth", 
    tags=["Authentication"]
)

# User management endpoints
api_router.include_router(
    users.router, 
    prefix="/users", 
    tags=["User Management"]
)

# Doctor management endpoints
api_router.include_router(
    doctors.router, 
    prefix="/doctors", 
    tags=["Doctor Management"]
)

# Patient management endpoints
api_router.include_router(
    patients.router, 
    prefix="/patients", 
    tags=["Patient Management"]
)

# Medicine management endpoints
api_router.include_router(
    medicines.router, 
    prefix="/medicines", 
    tags=["Medicine Management"]
)

# Short key management endpoints
api_router.include_router(
    short_keys.router, 
    prefix="/short-keys", 
    tags=["Short Key Management"]
)

# Appointment management endpoints
api_router.include_router(
    appointments.router, 
    prefix="/appointments", 
    tags=["Appointment Management"]
)

# Prescription management endpoints
api_router.include_router(
    prescriptions.router,
    prefix="/prescriptions",
    tags=["Prescription Management"]
)

# Dental management endpoints
api_router.include_router(
    dental.router,
    prefix="/dental",
    tags=["Dental Management"]
)

# Dental attachments endpoints (file uploads)
api_router.include_router(
    dental_attachments.router,
    prefix="/dental",
    tags=["Dental Attachments"]
)

# Treatment dashboard endpoints
api_router.include_router(
    treatments.router,
    prefix="/treatments",
    tags=["Treatment Dashboard"]
)

# Case study endpoints (AI-powered)
api_router.include_router(
    case_studies.router,
    prefix="/case-studies",
    tags=["Case Studies"]
)

# Temporary endpoint for testing
@api_router.get("/")
async def api_root():
    """API v1 root endpoint"""
    return {
        "message": "Prescription Management System API v1",
        "endpoints": {
            "auth": "/auth",
            "patients": "/patients",
            "doctors": "/doctors",
            "medicines": "/medicines",
            "short-keys": "/short-keys",
            "appointments": "/appointments",
            "prescriptions": "/prescriptions",
            "dental": "/dental",
            "treatments": "/treatments",
            "case-studies": "/case-studies"
        }
    }