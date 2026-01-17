"""
Appointment Management REST API Endpoints
Provides comprehensive appointment scheduling and management operations
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import date, time, datetime
import logging

from app.api.deps.database import get_db
from app.api.deps.auth import get_current_active_user, require_admin, require_staff
from app.core.exceptions import (
    NotFoundError,
    ValidationError,
    BusinessRuleError,
    ConflictError
)
from app.models.user import User
from app.services.appointment_service import AppointmentService
from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentUpdate,
    AppointmentReschedule,
    AppointmentStatusUpdate,
    AppointmentResponse,
    AppointmentListResponse,
    AppointmentSearchParams,
    AppointmentConflictCheck,
    AppointmentConflictResponse,
    DoctorScheduleResponse,
    AvailableTimeSlotsResponse,
    AppointmentStatistics,
    AppointmentBulkOperation,
    AppointmentBulkResponse,
    PatientAppointmentHistory,
    TimeSlot
)

logger = logging.getLogger(__name__)

router = APIRouter()
appointment_service = AppointmentService()


@router.post("/", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
async def create_appointment(
    appointment_data: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Create a new appointment.
    
    **Staff access required.**
    """
    try:
        # Set tenant_id from current user for multi-tenancy
        appointment_data.tenant_id = current_user.tenant_id

        appointment = appointment_service.create_appointment(
            db=db,
            appointment_data=appointment_data,
            created_by=current_user.id
        )
        logger.info(f"Appointment created: {appointment.appointment_number} by user {current_user.id}")
        return appointment
        
    except ConflictError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e)
        )
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error creating appointment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create appointment"
        )


@router.get("/", response_model=AppointmentListResponse)
async def list_appointments(
    # Patient filters
    patient_mobile: Optional[str] = Query(None, description="Filter by patient mobile"),
    patient_name: Optional[str] = Query(None, description="Filter by patient name"),
    patient_uuid: Optional[UUID] = Query(None, description="Filter by patient UUID"),
    
    # Doctor filter
    doctor_id: Optional[UUID] = Query(None, description="Filter by doctor"),
    
    # Date filters
    start_date: Optional[date] = Query(None, description="Start date filter"),
    end_date: Optional[date] = Query(None, description="End date filter"),
    appointment_date: Optional[date] = Query(None, description="Specific date filter"),
    
    # Status filters
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    
    # Time filters
    is_today: Optional[bool] = Query(None, description="Today's appointments"),
    is_upcoming: Optional[bool] = Query(None, description="Upcoming appointments"),
    is_past: Optional[bool] = Query(None, description="Past appointments"),
    
    # Text search
    query: Optional[str] = Query(None, description="Search in reason, notes, appointment number"),
    
    # Pagination
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Page size"),
    
    # Sorting
    sort_by: Optional[str] = Query("appointment_date", description="Sort field"),
    sort_order: Optional[str] = Query("asc", regex="^(asc|desc)$", description="Sort order"),
    
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Get paginated list of appointments with filtering and search.
    
    **Staff access required.**
    """
    try:
        search_params = AppointmentSearchParams(
            patient_mobile=patient_mobile,
            patient_name=patient_name,
            patient_uuid=patient_uuid,
            doctor_id=doctor_id,
            start_date=start_date,
            end_date=end_date,
            appointment_date=appointment_date,
            status=status_filter,
            is_today=is_today,
            is_upcoming=is_upcoming,
            is_past=is_past,
            query=query,
            page=page,
            page_size=page_size,
            sort_by=sort_by,
            sort_order=sort_order
        )
        
        appointments, total_count = appointment_service.search_appointments(db, search_params)
        
        total_pages = (total_count + page_size - 1) // page_size
        
        return AppointmentListResponse(
            appointments=appointments,
            total=total_count,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_prev=page > 1
        )
        
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error listing appointments: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve appointments"
        )


@router.get("/{appointment_id}", response_model=AppointmentResponse)
async def get_appointment(
    appointment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Get appointment details by ID with patient and doctor details populated.

    **Staff access required.**
    """
    try:
        appointment = appointment_service.get_appointment_by_id(db, appointment_id)
        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Appointment not found: {appointment_id}"
            )

        # Enrich appointment with patient and doctor details
        from app.models.patient import Patient
        from app.models.doctor import Doctor

        # Get patient details
        patient = db.query(Patient).filter(
            Patient.mobile_number == appointment.patient_mobile_number,
            Patient.first_name == appointment.patient_first_name,
            Patient.is_active == True
        ).first()

        patient_details = None
        if patient:
            patient_details = {
                'mobile_number': patient.mobile_number,
                'first_name': patient.first_name,
                'last_name': patient.last_name,
                'age': patient.get_age(),
                'gender': patient.gender,
                'address': patient.address,
            }

        # Get doctor details
        doctor = db.query(Doctor).join(Doctor.user).filter(
            Doctor.id == appointment.doctor_id,
            Doctor.is_active == True
        ).first()

        doctor_details = None
        if doctor:
            doctor_details = {
                'id': str(doctor.id),
                'first_name': doctor.user.first_name,
                'last_name': doctor.user.last_name,
                'specialization': doctor.specialization or ''
            }

        # Convert to dict and add details
        appointment_dict = {
            'id': appointment.id,
            'appointment_number': appointment.appointment_number,
            'patient_mobile_number': appointment.patient_mobile_number,
            'patient_first_name': appointment.patient_first_name,
            'patient_uuid': appointment.patient_uuid,
            'doctor_id': appointment.doctor_id,
            'appointment_date': appointment.appointment_date,
            'appointment_time': appointment.appointment_time,
            'status': appointment.status,
            'reason_for_visit': appointment.reason_for_visit,
            'notes': appointment.notes,
            'duration_minutes': appointment.duration_minutes,
            'contact_number': appointment.contact_number,
            'created_at': appointment.created_at,
            'updated_at': appointment.updated_at,
            'is_active': appointment.is_active,
            'patient_details': patient_details,
            'doctor_details': doctor_details
        }

        return appointment_dict

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving appointment {appointment_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve appointment"
        )


@router.get("/{appointment_id}/patient")
async def get_patient_by_appointment(
    appointment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Get patient details for a specific appointment.
    Returns patient information associated with the appointment.
    """
    try:
        appointment = appointment_service.get_appointment_by_id(db, appointment_id)
        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Appointment not found: {appointment_id}"
            )

        # Get patient details
        from app.models.patient import Patient

        patient = db.query(Patient).filter(
            Patient.mobile_number == appointment.patient_mobile_number,
            Patient.first_name == appointment.patient_first_name,
            Patient.is_active == True
        ).first()

        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found for this appointment"
            )

        # Return patient details
        return {
            'mobile_number': patient.mobile_number,
            'first_name': patient.first_name,
            'last_name': patient.last_name,
            'date_of_birth': patient.date_of_birth.isoformat() if patient.date_of_birth else None,
            'age': patient.get_age(),
            'gender': patient.gender,
            'email': patient.email,
            'address': patient.address,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving patient for appointment {appointment_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve patient details"
        )


@router.get("/number/{appointment_number}", response_model=AppointmentResponse)
async def get_appointment_by_number(
    appointment_number: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Get appointment details by appointment number.
    
    **Staff access required.**
    """
    try:
        appointment = appointment_service.get_appointment_by_number(db, appointment_number)
        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Appointment not found: {appointment_number}"
            )
        
        return appointment
        
    except Exception as e:
        logger.error(f"Error retrieving appointment {appointment_number}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve appointment"
        )


@router.put("/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment(
    appointment_id: UUID,
    appointment_data: AppointmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Update appointment information.
    
    **Staff access required.**
    """
    try:
        appointment = appointment_service.update_appointment(
            db, appointment_id, appointment_data, current_user.id
        )
        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Appointment not found: {appointment_id}"
            )
        
        logger.info(f"Appointment updated: {appointment.appointment_number} by user {current_user.id}")
        return appointment
        
    except ConflictError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e)
        )
    except NotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Appointment not found: {appointment_id}"
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error updating appointment {appointment_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update appointment"
        )


@router.post("/{appointment_id}/reschedule", response_model=AppointmentResponse)
async def reschedule_appointment(
    appointment_id: UUID,
    reschedule_data: AppointmentReschedule,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Reschedule appointment to new date and time.
    
    **Staff access required.**
    """
    try:
        appointment = appointment_service.reschedule_appointment(
            db, appointment_id, reschedule_data, current_user.id
        )
        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Appointment not found: {appointment_id}"
            )
        
        logger.info(f"Appointment rescheduled: {appointment.appointment_number} by user {current_user.id}")
        return appointment
        
    except ConflictError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e)
        )
    except NotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Appointment not found: {appointment_id}"
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error rescheduling appointment {appointment_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reschedule appointment"
        )


@router.put("/{appointment_id}/status", response_model=AppointmentResponse)
async def update_appointment_status(
    appointment_id: UUID,
    status_data: AppointmentStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Update appointment status.
    
    **Staff access required.**
    """
    try:
        appointment = appointment_service.update_appointment_status(
            db, appointment_id, status_data, current_user.id
        )
        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Appointment not found: {appointment_id}"
            )
        
        logger.info(f"Appointment status updated: {appointment.appointment_number} to {status_data.status} by user {current_user.id}")
        return appointment
        
    except NotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Appointment not found: {appointment_id}"
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error updating appointment status {appointment_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update appointment status"
        )


@router.delete("/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_appointment(
    appointment_id: UUID,
    reason: Optional[str] = Query(None, description="Cancellation reason"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Cancel appointment.
    
    **Staff access required.**
    """
    try:
        success = appointment_service.cancel_appointment(
            db, appointment_id, reason, current_user.id
        )
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Appointment not found: {appointment_id}"
            )
        
        logger.info(f"Appointment cancelled: {appointment_id} by user {current_user.id}")
        
    except NotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Appointment not found: {appointment_id}"
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error cancelling appointment {appointment_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cancel appointment"
        )


@router.get("/doctor/{doctor_id}", response_model=AppointmentListResponse)
async def get_doctor_appointments(
    doctor_id: UUID,
    appointment_date: Optional[date] = Query(None, description="Filter by date"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Page size"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Get doctor's appointments with optional filters.
    
    **Staff access required.**
    """
    try:
        search_params = AppointmentSearchParams(
            doctor_id=doctor_id,
            appointment_date=appointment_date,
            status=status_filter,
            page=page,
            page_size=page_size,
            sort_by="appointment_date",
            sort_order="asc"
        )
        
        appointments, total_count = appointment_service.search_appointments(db, search_params)
        
        total_pages = (total_count + page_size - 1) // page_size
        
        return AppointmentListResponse(
            appointments=appointments,
            total=total_count,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_prev=page > 1
        )
        
    except Exception as e:
        logger.error(f"Error retrieving doctor appointments: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve doctor appointments"
        )


@router.get("/patient/{mobile_number}/{first_name}", response_model=PatientAppointmentHistory)
async def get_patient_appointments(
    mobile_number: str,
    first_name: str,
    limit: int = Query(50, ge=1, le=100, description="Number of appointments to retrieve"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Get patient appointments using composite key.
    
    **Staff access required.**
    """
    try:
        appointments = appointment_service.get_patient_appointments(
            db, mobile_number, first_name, limit
        )
        
        # Find next upcoming appointment
        now = datetime.now()
        next_appointment = None
        for appt in appointments:
            if appt.get_appointment_datetime() > now and appt.status in ['scheduled', 'confirmed']:
                next_appointment = appt
                break
        
        # Find last completed visit
        last_visit = None
        for appt in reversed(appointments):
            if appt.status == 'completed':
                last_visit = appt.get_appointment_datetime()
                break
        
        return PatientAppointmentHistory(
            patient_mobile_number=mobile_number,
            patient_first_name=first_name,
            patient_uuid=appointments[0].patient_uuid if appointments else None,
            appointments=appointments,
            total_appointments=len(appointments),
            last_visit=last_visit,
            next_appointment=next_appointment
        )
        
    except Exception as e:
        logger.error(f"Error retrieving patient appointments: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve patient appointments"
        )


@router.get("/schedule/{doctor_id}/{schedule_date}", response_model=DoctorScheduleResponse)
async def get_doctor_schedule(
    doctor_id: UUID,
    schedule_date: date,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Get doctor's daily schedule.
    
    **Staff access required.**
    """
    try:
        appointments = appointment_service.get_doctor_daily_schedule(db, doctor_id, schedule_date)
        available_slots = appointment_service.get_available_time_slots(db, doctor_id, schedule_date)
        
        return DoctorScheduleResponse(
            doctor_id=doctor_id,
            schedule_date=schedule_date,
            appointments=appointments,
            available_slots=available_slots,
            total_appointments=len(appointments)
        )
        
    except Exception as e:
        logger.error(f"Error retrieving doctor schedule: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve doctor schedule"
        )


@router.get("/doctor/{doctor_id}/office-stats", response_model=Dict[str, Any])
async def get_doctor_office_stats(
    doctor_id: UUID,
    stats_date: Optional[date] = Query(None, description="Date to get stats for (default: today)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Get appointment counts by office for a doctor on a specific date.

    **Staff access required.**

    Returns:
    - office_stats: List of {office_id, office_name, appointment_count}
    - total: Total appointments for the day
    """
    try:
        from app.models.appointment import Appointment
        from app.models.doctor import Doctor
        from sqlalchemy import func

        target_date = stats_date or date.today()

        # Get doctor to access offices data
        doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
        if not doctor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Doctor not found"
            )

        # Get appointments for the date grouped by office_id
        office_counts = db.query(
            Appointment.office_id,
            func.count(Appointment.id).label('count')
        ).filter(
            Appointment.doctor_id == doctor_id,
            Appointment.appointment_date == target_date,
            Appointment.is_active == True,
            Appointment.status.notin_(['cancelled', 'no_show'])
        ).group_by(Appointment.office_id).all()

        # Build response with office names
        offices_map = {}
        if doctor.offices:
            for office in doctor.offices:
                offices_map[office.get('id')] = office.get('name', 'Unknown Office')

        office_stats = []
        total = 0
        for office_id, count in office_counts:
            office_name = offices_map.get(office_id, 'No Office Assigned') if office_id else 'No Office Assigned'
            office_stats.append({
                'office_id': office_id,
                'office_name': office_name,
                'appointment_count': count
            })
            total += count

        return {
            'doctor_id': str(doctor_id),
            'date': target_date.isoformat(),
            'office_stats': office_stats,
            'total': total
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving office stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve office statistics"
        )


@router.get("/availability/{doctor_id}/{schedule_date}", response_model=AvailableTimeSlotsResponse)
async def get_available_time_slots(
    doctor_id: UUID,
    schedule_date: date,
    slot_duration: int = Query(30, ge=15, le=120, description="Slot duration in minutes"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Get available time slots for a doctor on a specific date.
    
    **Staff access required.**
    """
    try:
        slots = appointment_service.get_available_time_slots(db, doctor_id, schedule_date, slot_duration)
        
        # Convert to TimeSlot objects
        time_slots = [
            TimeSlot(
                start_time=slot['start_time'],
                end_time=slot['end_time'],
                duration_minutes=slot['duration_minutes'],
                is_available=slot['is_available']
            )
            for slot in slots
        ]
        
        return AvailableTimeSlotsResponse(
            doctor_id=doctor_id,
            date=schedule_date,
            available_slots=time_slots,
            working_hours_start=time(9, 0),
            working_hours_end=time(17, 0),
            slot_duration=slot_duration
        )
        
    except Exception as e:
        import traceback
        error_detail = f"{type(e).__name__}: {str(e)}"
        logger.error(f"Error retrieving available time slots: {error_detail}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve available time slots: {error_detail}"
        )


@router.post("/conflicts/check", response_model=AppointmentConflictResponse)
async def check_appointment_conflicts(
    conflict_data: AppointmentConflictCheck,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Check for appointment time conflicts.
    
    **Staff access required.**
    """
    try:
        result = appointment_service.check_appointment_conflict(db, conflict_data)
        
        return AppointmentConflictResponse(
            has_conflict=result['has_conflict'],
            conflicting_appointments=result['conflicting_appointments'],
            suggested_times=result['suggested_times']
        )
        
    except Exception as e:
        logger.error(f"Error checking appointment conflicts: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to check appointment conflicts"
        )


@router.get("/statistics/overview", response_model=AppointmentStatistics)
async def get_appointment_statistics(
    doctor_id: Optional[UUID] = Query(None, description="Filter by doctor"),
    start_date: Optional[date] = Query(None, description="Start date filter"),
    end_date: Optional[date] = Query(None, description="End date filter"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Get appointment statistics.
    
    **Staff access required.**
    """
    try:
        stats = appointment_service.get_appointment_statistics(
            db, doctor_id, start_date, end_date
        )
        return AppointmentStatistics(**stats)
        
    except Exception as e:
        logger.error(f"Error retrieving appointment statistics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve statistics"
        )


@router.post("/bulk", response_model=AppointmentBulkResponse)
async def bulk_appointment_operations(
    operation_request: AppointmentBulkOperation,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Perform bulk operations on appointments.
    
    **Staff access required.**
    """
    try:
        kwargs = {
            'notes': operation_request.notes
        }
        
        if operation_request.operation == 'reschedule':
            kwargs['new_date'] = operation_request.new_date
            kwargs['new_time'] = operation_request.new_time
        
        result = appointment_service.bulk_update_appointments(
            db, operation_request.appointment_ids, operation_request.operation, current_user.id, **kwargs
        )
        
        logger.info(f"Bulk operation {operation_request.operation} performed by user {current_user.id}: {result['successful']}/{result['total_requested']} successful")
        
        return AppointmentBulkResponse(**result)
        
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error in bulk appointment operation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to perform bulk operation"
        )