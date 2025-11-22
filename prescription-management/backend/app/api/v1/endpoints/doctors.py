"""
Doctor API endpoints
Handles doctor management operations with role-based access control
Following ERD specifications and business requirements
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
import math

from app.core.database import get_db
from app.api.deps.auth import get_current_active_user, require_admin, require_staff
from app.models.user import User
from app.models.doctor import Doctor
from app.services.doctor_service import DoctorService
from app.schemas.doctor import (
    DoctorCreate, DoctorUpdate, DoctorResponse, DoctorListResponse,
    DoctorSearchQuery, DoctorScheduleUpdate, DoctorScheduleResponse,
    DoctorStats
)

router = APIRouter()
doctor_service = DoctorService()


@router.post("/", response_model=DoctorResponse, status_code=status.HTTP_201_CREATED)
async def create_doctor_profile(
    doctor_data: DoctorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)  # Only admins can create doctor profiles
) -> DoctorResponse:
    """
    Create a new doctor profile.
    
    Requires admin privileges.
    Links to an existing user account with 'doctor' role.
    """
    try:
        doctor = doctor_service.create_doctor(db, doctor_data)
        
        # Convert to response format with computed fields
        response_data = doctor_service.convert_to_response_format(doctor)
        return DoctorResponse(**response_data)
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create doctor profile: {str(e)}"
        )


@router.get("/", response_model=DoctorListResponse)
async def list_doctors(
    query: Optional[str] = Query(None, description="Search by name or license number"),
    specialization: Optional[str] = Query(None, description="Filter by specialization"),
    min_experience: Optional[int] = Query(None, ge=0, description="Minimum years of experience"),
    is_active: Optional[bool] = Query(True, description="Filter by active status"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(10, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> DoctorListResponse:
    """
    List doctors with optional search and filtering.
    
    Supports pagination, text search, and filters.
    Role-based access: All authenticated users can view active doctors.
    """
    try:
        # Create search parameters
        search_params = DoctorSearchQuery(
            query=query,
            specialization=specialization,
            min_experience=min_experience,
            is_active=is_active,
            page=page,
            per_page=per_page
        )
        
        # Get doctors based on user role
        doctors, total = doctor_service.search_doctors(db, search_params)
        
        # Convert to response format
        doctor_responses = []
        for doctor in doctors:
            response_data = doctor_service.convert_to_response_format(doctor)
            doctor_responses.append(DoctorResponse(**response_data))
        
        # Calculate pagination info
        total_pages = math.ceil(total / per_page) if total > 0 else 1
        
        return DoctorListResponse(
            doctors=doctor_responses,
            total=total,
            page=page,
            per_page=per_page,
            total_pages=total_pages
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve doctors: {str(e)}"
        )


@router.get("/{doctor_id}", response_model=DoctorResponse)
async def get_doctor_by_id(
    doctor_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> DoctorResponse:
    """
    Get doctor details by ID.
    
    Role-based access: All authenticated users can view doctor details.
    """
    doctor = doctor_service.get_doctor_by_id(db, doctor_id)
    
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )
    
    # Convert to response format
    response_data = doctor_service.convert_to_response_format(doctor)
    return DoctorResponse(**response_data)


@router.put("/{doctor_id}", response_model=DoctorResponse)
async def update_doctor_profile(
    doctor_id: UUID,
    doctor_update: DoctorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> DoctorResponse:
    """
    Update doctor profile.
    
    Role-based access:
    - Admins can update any doctor profile
    - Doctors can update their own profile
    """
    # Check if doctor exists
    doctor = doctor_service.get_doctor_by_id(db, doctor_id)
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )
    
    # Check permissions
    if current_user.role not in ["admin", "super_admin"]:
        # Check if doctor is updating their own profile
        if current_user.role == "doctor":
            current_doctor = doctor_service.get_doctor_by_user_id(db, current_user.id)
            if not current_doctor or current_doctor.id != doctor_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You can only update your own profile"
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to update doctor profile"
            )
    
    try:
        updated_doctor = doctor_service.update_doctor(db, doctor_id, doctor_update)
        
        if not updated_doctor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Doctor not found"
            )
        
        # Convert to response format
        response_data = doctor_service.convert_to_response_format(updated_doctor)
        return DoctorResponse(**response_data)
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update doctor profile: {str(e)}"
        )


@router.delete("/{doctor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_doctor(
    doctor_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)  # Only admins can deactivate doctors
):
    """
    Deactivate doctor profile (soft delete).
    
    Requires admin privileges.
    """
    success = doctor_service.deactivate_doctor(db, doctor_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )


@router.put("/{doctor_id}/reactivate", response_model=DoctorResponse)
async def reactivate_doctor(
    doctor_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)  # Only admins can reactivate doctors
) -> DoctorResponse:
    """
    Reactivate doctor profile.
    
    Requires admin privileges.
    """
    success = doctor_service.reactivate_doctor(db, doctor_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )
    
    # Get updated doctor
    doctor = doctor_service.get_doctor_by_id(db, doctor_id)
    response_data = doctor_service.convert_to_response_format(doctor)
    return DoctorResponse(**response_data)


@router.get("/{doctor_id}/schedule", response_model=DoctorScheduleResponse)
async def get_doctor_schedule(
    doctor_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> DoctorScheduleResponse:
    """
    Get doctor availability schedule.
    
    Role-based access: All authenticated users can view doctor schedules.
    """
    schedule_data = doctor_service.get_doctor_schedule(db, doctor_id)
    
    if not schedule_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )
    
    return DoctorScheduleResponse(**schedule_data)


@router.put("/{doctor_id}/schedule", response_model=DoctorScheduleResponse)
async def update_doctor_schedule(
    doctor_id: UUID,
    schedule_update: DoctorScheduleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> DoctorScheduleResponse:
    """
    Update doctor availability schedule.
    
    Role-based access:
    - Admins can update any doctor schedule
    - Doctors can update their own schedule
    """
    # Check if doctor exists
    doctor = doctor_service.get_doctor_by_id(db, doctor_id)
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )
    
    # Check permissions
    if current_user.role not in ["admin", "super_admin"]:
        if current_user.role == "doctor":
            current_doctor = doctor_service.get_doctor_by_user_id(db, current_user.id)
            if not current_doctor or current_doctor.id != doctor_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You can only update your own schedule"
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to update doctor schedule"
            )
    
    try:
        updated_doctor = doctor_service.update_doctor_schedule(
            db, doctor_id, schedule_update.availability_schedule
        )
        
        if not updated_doctor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Doctor not found"
            )
        
        # Get updated schedule
        schedule_data = doctor_service.get_doctor_schedule(db, doctor_id)
        return DoctorScheduleResponse(**schedule_data)
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update doctor schedule: {str(e)}"
        )


@router.get("/specializations/{specialization}", response_model=List[DoctorResponse])
async def get_doctors_by_specialization(
    specialization: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> List[DoctorResponse]:
    """
    Get doctors by specialization.
    
    Role-based access: All authenticated users can view doctors by specialization.
    """
    doctors = doctor_service.get_doctors_by_specialization(db, specialization)
    
    # Convert to response format
    doctor_responses = []
    for doctor in doctors:
        response_data = doctor_service.convert_to_response_format(doctor)
        doctor_responses.append(DoctorResponse(**response_data))
    
    return doctor_responses


@router.get("/availability/{day}", response_model=List[DoctorResponse])
async def get_available_doctors_for_day(
    day: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> List[DoctorResponse]:
    """
    Get doctors available on a specific day.
    
    Day format: monday, tuesday, wednesday, thursday, friday, saturday, sunday
    Role-based access: All authenticated users can view available doctors.
    """
    valid_days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    
    if day.lower() not in valid_days:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid day. Must be one of: {', '.join(valid_days)}"
        )
    
    doctors = doctor_service.get_available_doctors_for_day(db, day.lower())
    
    # Convert to response format
    doctor_responses = []
    for doctor in doctors:
        response_data = doctor_service.convert_to_response_format(doctor)
        doctor_responses.append(DoctorResponse(**response_data))
    
    return doctor_responses


@router.get("/statistics/overview", response_model=DoctorStats)
async def get_doctor_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)  # Staff and above can view statistics
) -> DoctorStats:
    """
    Get doctor statistics overview.
    
    Requires staff privileges (nurse, admin, super_admin).
    """
    try:
        stats = doctor_service.get_doctor_statistics(db)
        return DoctorStats(**stats)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve doctor statistics: {str(e)}"
        )


@router.get("/license/{license_number}", response_model=DoctorResponse)
async def get_doctor_by_license(
    license_number: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)  # Staff and above can search by license
) -> DoctorResponse:
    """
    Get doctor by license number.
    
    Requires staff privileges (nurse, admin, super_admin).
    """
    doctor = doctor_service.get_doctor_by_license(db, license_number)
    
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found with this license number"
        )
    
    # Convert to response format
    response_data = doctor_service.convert_to_response_format(doctor)
    return DoctorResponse(**response_data)


@router.get("/user/{user_id}", response_model=DoctorResponse)
async def get_doctor_by_user_id(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> DoctorResponse:
    """
    Get doctor profile by user ID.
    
    Role-based access:
    - Admins can view any doctor by user ID
    - Doctors can view their own profile
    - Other roles: forbidden
    """
    # Check permissions
    if current_user.role not in ["admin", "super_admin"]:
        if current_user.role == "doctor" and current_user.id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view your own profile"
            )
        elif current_user.role not in ["doctor"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
    
    doctor = doctor_service.get_doctor_by_user_id(db, user_id)
    
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor profile not found for this user"
        )
    
    # Convert to response format
    response_data = doctor_service.convert_to_response_format(doctor)
    return DoctorResponse(**response_data)