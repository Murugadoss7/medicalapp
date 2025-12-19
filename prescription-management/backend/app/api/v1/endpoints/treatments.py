"""
Treatment Dashboard API Endpoints
Provides patient list, treatment timeline, and procedure data
"""

from typing import Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models import User
from app.services.treatment_service import TreatmentService


router = APIRouter()


# ============================================================================
# Helper: Get current doctor ID
# ============================================================================

def get_current_doctor_id(current_user: User = Depends(get_current_active_user)) -> Optional[UUID]:
    """
    Get doctor ID from current user
    Returns None if user is not a doctor
    """
    if current_user.role != "doctor":
        return None

    # Need to get doctor_id from database
    # (UserResponse includes doctor_id for doctor role)
    from app.models import Doctor
    from app.core.database import SessionLocal

    db = SessionLocal()
    try:
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        return doctor.id if doctor else None
    finally:
        db.close()


# ============================================================================
# GET /treatments/patients - Get patient list with treatment summary
# ============================================================================

@router.get("/patients")
def get_patients_with_treatment_summary(
    doctor_id: Optional[str] = Query(None, description="Filter by doctor ID (admin only)"),
    status: Optional[str] = Query(None, description="Filter by treatment status (active, completed, planned)"),
    date_from: Optional[date] = Query(None, description="Filter appointments from date"),
    date_to: Optional[date] = Query(None, description="Filter appointments to date"),
    search: Optional[str] = Query(None, description="Search by patient name or mobile"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get list of patients with treatment summary

    **Role-based Access:**
    - **Doctor**: Only their consulted patients
    - **Admin**: All patients (can filter by doctor_id)

    **Query Parameters:**
    - `doctor_id`: Filter by specific doctor (admin only)
    - `status`: Filter by treatment status (active, completed, planned)
    - `date_from`: Filter appointments from date
    - `date_to`: Filter appointments to date
    - `search`: Search by patient name or mobile
    - `page`: Page number (default 1)
    - `per_page`: Items per page (default 20, max 100)

    **Returns:**
    - List of patients with treatment summary
    - Pagination info
    """

    # Authorization check
    if current_user.role not in ["doctor", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors and admins can access treatment dashboard"
        )

    # Determine doctor filter
    filter_doctor_id = None

    if current_user.role == "doctor":
        # Doctor: Must filter by their own ID
        from app.models import Doctor
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if not doctor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Doctor profile not found"
            )
        filter_doctor_id = doctor.id

    elif current_user.role == "admin":
        # Admin: Optional filter by doctor_id
        if doctor_id:
            try:
                filter_doctor_id = UUID(doctor_id)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid doctor_id format"
                )

    # Get patients with treatment summary
    result = TreatmentService.get_patients_with_treatment_summary(
        db=db,
        doctor_id=filter_doctor_id,
        status_filter=status,
        date_from=date_from,
        date_to=date_to,
        search_query=search,
        page=page,
        per_page=per_page
    )

    # Filter out None values (from status filter mismatch)
    result["patients"] = [p for p in result["patients"] if p is not None]
    result["pagination"]["total"] = len(result["patients"])

    return result


# ============================================================================
# GET /treatments/patients/{mobile}/{first_name}/timeline - Get treatment timeline
# ============================================================================

@router.get("/patients/{mobile}/{first_name}/timeline")
def get_patient_treatment_timeline(
    mobile: str,
    first_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get chronological treatment timeline for a patient

    Includes:
    - Appointments
    - Prescriptions
    - Dental observations
    - Dental procedures

    **Authorization:**
    - Doctor: Can only access their own consulted patients
    - Admin: Can access all patients

    **Path Parameters:**
    - `mobile`: Patient mobile number
    - `first_name`: Patient first name

    **Returns:**
    - List of timeline events sorted by date (most recent first)
    """

    # Authorization check
    if current_user.role not in ["doctor", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors and admins can access treatment dashboard"
        )

    # For doctors: Verify they have consulted this patient
    if current_user.role == "doctor":
        from app.models import Doctor
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if not doctor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Doctor profile not found"
            )

        has_access = TreatmentService.verify_doctor_patient_access(
            db=db,
            doctor_id=doctor.id,
            patient_mobile=mobile,
            patient_first_name=first_name
        )

        if not has_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this patient's records"
            )

        doctor_filter = doctor.id
    else:
        doctor_filter = None

    # Get timeline
    timeline = TreatmentService.get_patient_treatment_timeline(
        db=db,
        patient_mobile=mobile,
        patient_first_name=first_name,
        doctor_id=doctor_filter
    )

    return {"timeline": timeline}


# ============================================================================
# GET /treatments/patients/{mobile}/{first_name}/procedures - Get procedures
# ============================================================================

@router.get("/patients/{mobile}/{first_name}/procedures")
def get_patient_procedures(
    mobile: str,
    first_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get patient procedures grouped by status

    **Authorization:**
    - Doctor: Can only access their own consulted patients
    - Admin: Can access all patients

    **Path Parameters:**
    - `mobile`: Patient mobile number
    - `first_name`: Patient first name

    **Returns:**
    - Procedures grouped by status:
      - `upcoming`: Planned and in-progress procedures
      - `completed`: Completed procedures
      - `cancelled`: Cancelled procedures
    """

    # Authorization check
    if current_user.role not in ["doctor", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors and admins can access treatment dashboard"
        )

    # For doctors: Verify they have consulted this patient
    if current_user.role == "doctor":
        from app.models import Doctor
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if not doctor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Doctor profile not found"
            )

        has_access = TreatmentService.verify_doctor_patient_access(
            db=db,
            doctor_id=doctor.id,
            patient_mobile=mobile,
            patient_first_name=first_name
        )

        if not has_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this patient's records"
            )

        doctor_filter = doctor.id
    else:
        doctor_filter = None

    # Get procedures
    procedures = TreatmentService.get_patient_procedures(
        db=db,
        patient_mobile=mobile,
        patient_first_name=first_name,
        doctor_id=doctor_filter
    )

    return procedures
