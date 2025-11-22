"""
Appointment Service for Doctor-Patient Scheduling
Handles appointment CRUD operations and conflict detection
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc, asc, text
from typing import Optional, List, Dict, Any, Tuple
from uuid import UUID
from datetime import date, time, datetime, timedelta
import logging

from app.models.appointment import (
    Appointment, 
    generate_appointment_number,
    find_appointment_by_number,
    get_patient_appointments,
    get_doctor_appointments,
    get_daily_schedule,
    check_appointment_conflict
)
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.schemas.appointment import (
    AppointmentCreate, 
    AppointmentUpdate, 
    AppointmentReschedule,
    AppointmentStatusUpdate,
    AppointmentSearchParams,
    AppointmentConflictCheck
)
from app.core.exceptions import (
    NotFoundError, 
    ValidationError, 
    BusinessRuleError,
    ConflictError
)

logger = logging.getLogger(__name__)


class AppointmentService:
    """Service class for appointment management"""
    
    def __init__(self):
        pass
    
    # Core CRUD Operations
    
    def create_appointment(self, db: Session, appointment_data: AppointmentCreate, created_by: UUID) -> Appointment:
        """
        Create a new appointment with conflict checking
        """
        # Verify patient exists with composite key
        patient = db.query(Patient).filter(
            Patient.mobile_number == appointment_data.patient_mobile_number,
            Patient.first_name == appointment_data.patient_first_name,
            Patient.id == appointment_data.patient_uuid,
            Patient.is_active == True
        ).first()
        
        if not patient:
            raise NotFoundError(f"Patient not found with mobile {appointment_data.patient_mobile_number} and name {appointment_data.patient_first_name}")
        
        # Verify doctor exists
        doctor = db.query(Doctor).filter(
            Doctor.id == appointment_data.doctor_id,
            Doctor.is_active == True
        ).first()
        
        if not doctor:
            raise NotFoundError(f"Doctor not found: {appointment_data.doctor_id}")
        
        # Check for time conflicts
        has_conflict = check_appointment_conflict(
            db=db,
            doctor_id=appointment_data.doctor_id,
            appointment_date=appointment_data.appointment_date,
            appointment_time=appointment_data.appointment_time,
            duration_minutes=appointment_data.duration_minutes
        )
        
        if has_conflict:
            raise ConflictError("Appointment time conflicts with existing appointment")
        
        # Generate unique appointment number
        appointment_number = generate_appointment_number(db)
        
        # Create appointment
        appointment = Appointment(
            appointment_number=appointment_number,
            patient_mobile_number=appointment_data.patient_mobile_number,
            patient_first_name=appointment_data.patient_first_name,
            patient_uuid=appointment_data.patient_uuid,
            doctor_id=appointment_data.doctor_id,
            appointment_date=appointment_data.appointment_date,
            appointment_time=appointment_data.appointment_time,
            reason_for_visit=appointment_data.reason_for_visit,
            notes=appointment_data.notes,
            duration_minutes=appointment_data.duration_minutes,
            contact_number=appointment_data.contact_number,
            status='scheduled',
            created_by=created_by
        )
        
        try:
            db.add(appointment)
            db.commit()
            db.refresh(appointment)
            
            logger.info(f"Created appointment: {appointment.appointment_number} for patient {appointment.patient_mobile_number}")
            return appointment
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error creating appointment: {str(e)}")
            raise BusinessRuleError(f"Failed to create appointment: {str(e)}")
    
    def get_appointment_by_id(self, db: Session, appointment_id: UUID) -> Optional[Appointment]:
        """Get appointment by ID"""
        return db.query(Appointment).filter(
            Appointment.id == appointment_id,
            Appointment.is_active == True
        ).first()
    
    def get_appointment_by_number(self, db: Session, appointment_number: str) -> Optional[Appointment]:
        """Get appointment by appointment number"""
        return find_appointment_by_number(db, appointment_number)
    
    def update_appointment(self, db: Session, appointment_id: UUID, appointment_data: AppointmentUpdate, updated_by: UUID) -> Optional[Appointment]:
        """
        Update appointment information with conflict checking
        """
        appointment = self.get_appointment_by_id(db, appointment_id)
        if not appointment:
            raise NotFoundError(f"Appointment not found: {appointment_id}")
        
        # Check if appointment can be updated
        if appointment.status in ['completed', 'cancelled', 'no_show']:
            raise ValidationError("Cannot update completed, cancelled, or no-show appointments")
        
        update_data = appointment_data.dict(exclude_unset=True)
        
        # Check for time conflicts if date/time is being updated
        if 'appointment_date' in update_data or 'appointment_time' in update_data:
            new_date = update_data.get('appointment_date', appointment.appointment_date)
            new_time = update_data.get('appointment_time', appointment.appointment_time)
            new_duration = update_data.get('duration_minutes', appointment.duration_minutes)
            
            has_conflict = check_appointment_conflict(
                db=db,
                doctor_id=appointment.doctor_id,
                appointment_date=new_date,
                appointment_time=new_time,
                duration_minutes=new_duration,
                exclude_appointment_id=appointment_id
            )
            
            if has_conflict:
                raise ConflictError("Updated appointment time conflicts with existing appointment")
        
        # Update fields
        for field, value in update_data.items():
            if hasattr(appointment, field):
                setattr(appointment, field, value)
        
        try:
            db.commit()
            db.refresh(appointment)
            
            logger.info(f"Updated appointment: {appointment.appointment_number}")
            return appointment
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error updating appointment: {str(e)}")
            raise BusinessRuleError(f"Failed to update appointment: {str(e)}")
    
    def reschedule_appointment(self, db: Session, appointment_id: UUID, reschedule_data: AppointmentReschedule, updated_by: UUID) -> Optional[Appointment]:
        """Reschedule appointment to new date and time"""
        appointment = self.get_appointment_by_id(db, appointment_id)
        if not appointment:
            raise NotFoundError(f"Appointment not found: {appointment_id}")
        
        # Check if appointment can be rescheduled
        if not appointment.can_be_rescheduled():
            raise ValidationError("Appointment cannot be rescheduled")
        
        # Check for conflicts
        has_conflict = check_appointment_conflict(
            db=db,
            doctor_id=appointment.doctor_id,
            appointment_date=reschedule_data.appointment_date,
            appointment_time=reschedule_data.appointment_time,
            duration_minutes=appointment.duration_minutes,
            exclude_appointment_id=appointment_id
        )
        
        if has_conflict:
            raise ConflictError("Rescheduled appointment time conflicts with existing appointment")
        
        # Update appointment
        appointment.reschedule(reschedule_data.appointment_date, reschedule_data.appointment_time)
        
        if reschedule_data.reason:
            current_notes = appointment.notes or ""
            appointment.notes = f"{current_notes}\nRescheduled: {reschedule_data.reason}".strip()
        
        try:
            db.commit()
            db.refresh(appointment)
            
            logger.info(f"Rescheduled appointment: {appointment.appointment_number} to {reschedule_data.appointment_date} {reschedule_data.appointment_time}")
            return appointment
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error rescheduling appointment: {str(e)}")
            raise BusinessRuleError(f"Failed to reschedule appointment: {str(e)}")
    
    def update_appointment_status(self, db: Session, appointment_id: UUID, status_data: AppointmentStatusUpdate, updated_by: UUID) -> Optional[Appointment]:
        """Update appointment status"""
        appointment = self.get_appointment_by_id(db, appointment_id)
        if not appointment:
            raise NotFoundError(f"Appointment not found: {appointment_id}")
        
        # Validate status transitions
        valid_transitions = {
            'scheduled': ['confirmed', 'cancelled', 'no_show'],
            'confirmed': ['in_progress', 'cancelled', 'no_show'],
            'in_progress': ['completed', 'cancelled'],
            'completed': [],  # Final state
            'cancelled': [],  # Final state
            'no_show': [],   # Final state
            'rescheduled': ['scheduled', 'confirmed', 'cancelled']
        }
        
        if status_data.status not in valid_transitions.get(appointment.status, []):
            raise ValidationError(f"Cannot transition from {appointment.status} to {status_data.status}")
        
        # Update status
        appointment.status = status_data.status
        
        if status_data.notes:
            current_notes = appointment.notes or ""
            appointment.notes = f"{current_notes}\nStatus update: {status_data.notes}".strip()
        
        try:
            db.commit()
            db.refresh(appointment)
            
            logger.info(f"Updated appointment status: {appointment.appointment_number} to {status_data.status}")
            return appointment
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error updating appointment status: {str(e)}")
            raise BusinessRuleError(f"Failed to update appointment status: {str(e)}")
    
    def cancel_appointment(self, db: Session, appointment_id: UUID, reason: Optional[str], cancelled_by: UUID) -> bool:
        """Cancel appointment"""
        appointment = self.get_appointment_by_id(db, appointment_id)
        if not appointment:
            raise NotFoundError(f"Appointment not found: {appointment_id}")
        
        if not appointment.can_be_cancelled():
            raise ValidationError("Appointment cannot be cancelled")
        
        appointment.mark_as_cancelled()
        
        if reason:
            current_notes = appointment.notes or ""
            appointment.notes = f"{current_notes}\nCancelled: {reason}".strip()
        
        try:
            db.commit()
            logger.info(f"Cancelled appointment: {appointment.appointment_number}")
            return True
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error cancelling appointment: {str(e)}")
            raise BusinessRuleError(f"Failed to cancel appointment: {str(e)}")
    
    def delete_appointment(self, db: Session, appointment_id: UUID, deleted_by: UUID) -> bool:
        """Soft delete appointment"""
        appointment = self.get_appointment_by_id(db, appointment_id)
        if not appointment:
            raise NotFoundError(f"Appointment not found: {appointment_id}")
        
        appointment.is_active = False
        
        try:
            db.commit()
            logger.info(f"Deleted appointment: {appointment.appointment_number}")
            return True
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error deleting appointment: {str(e)}")
            raise BusinessRuleError(f"Failed to delete appointment: {str(e)}")
    
    # Search and Query Operations
    
    def search_appointments(self, db: Session, search_params: AppointmentSearchParams) -> Tuple[List[Appointment], int]:
        """
        Search appointments with filtering, sorting, and pagination
        Returns (appointments, total_count)
        """
        query = db.query(Appointment).filter(Appointment.is_active == True)
        
        # Apply patient filters
        if search_params.patient_mobile:
            query = query.filter(Appointment.patient_mobile_number == search_params.patient_mobile)
        
        if search_params.patient_name:
            query = query.filter(Appointment.patient_first_name.ilike(f"%{search_params.patient_name}%"))
        
        if search_params.patient_uuid:
            query = query.filter(Appointment.patient_uuid == search_params.patient_uuid)
        
        # Apply doctor filter
        if search_params.doctor_id:
            query = query.filter(Appointment.doctor_id == search_params.doctor_id)
        
        # Apply date filters
        if search_params.appointment_date:
            query = query.filter(Appointment.appointment_date == search_params.appointment_date)
        
        if search_params.start_date:
            query = query.filter(Appointment.appointment_date >= search_params.start_date)
        
        if search_params.end_date:
            query = query.filter(Appointment.appointment_date <= search_params.end_date)
        
        # Apply status filters
        if search_params.status:
            query = query.filter(Appointment.status == search_params.status)
        
        if search_params.status_list:
            query = query.filter(Appointment.status.in_(search_params.status_list))
        
        # Apply time-based filters
        if search_params.is_today:
            query = query.filter(Appointment.appointment_date == date.today())
        
        if search_params.is_upcoming:
            now = datetime.now()
            query = query.filter(
                or_(
                    Appointment.appointment_date > now.date(),
                    and_(
                        Appointment.appointment_date == now.date(),
                        Appointment.appointment_time > now.time()
                    )
                )
            )
        
        if search_params.is_past:
            now = datetime.now()
            query = query.filter(
                or_(
                    Appointment.appointment_date < now.date(),
                    and_(
                        Appointment.appointment_date == now.date(),
                        Appointment.appointment_time < now.time()
                    )
                )
            )
        
        # Apply text search
        if search_params.query:
            search_filter = or_(
                Appointment.appointment_number.ilike(f"%{search_params.query}%"),
                Appointment.reason_for_visit.ilike(f"%{search_params.query}%"),
                Appointment.notes.ilike(f"%{search_params.query}%")
            )
            query = query.filter(search_filter)
        
        # Get total count before pagination
        total_count = query.count()
        
        # Apply sorting
        sort_column = getattr(Appointment, search_params.sort_by, Appointment.appointment_date)
        if search_params.sort_order == "desc":
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(asc(sort_column))
        
        # Secondary sort by time for same dates
        query = query.order_by(Appointment.appointment_time)
        
        # Apply pagination
        offset = (search_params.page - 1) * search_params.page_size
        appointments = query.offset(offset).limit(search_params.page_size).all()
        
        return appointments, total_count
    
    def get_patient_appointments(self, db: Session, mobile_number: str, first_name: str, limit: int = 50) -> List[Appointment]:
        """Get appointments for patient using composite key"""
        return get_patient_appointments(db, mobile_number, first_name, limit=limit)
    
    def get_doctor_appointments(self, db: Session, doctor_id: UUID, appointment_date: Optional[date] = None, status: Optional[str] = None, limit: int = 100) -> List[Appointment]:
        """Get appointments for doctor"""
        return get_doctor_appointments(db, doctor_id, appointment_date, status, limit)
    
    def get_doctor_daily_schedule(self, db: Session, doctor_id: UUID, schedule_date: date) -> List[Appointment]:
        """Get doctor's daily schedule"""
        return get_daily_schedule(db, doctor_id, schedule_date)
    
    # Conflict Detection and Availability
    
    def check_appointment_conflict(self, db: Session, conflict_data: AppointmentConflictCheck) -> Dict[str, Any]:
        """Check for appointment conflicts and return details"""
        has_conflict = check_appointment_conflict(
            db=db,
            doctor_id=conflict_data.doctor_id,
            appointment_date=conflict_data.appointment_date,
            appointment_time=conflict_data.appointment_time,
            duration_minutes=conflict_data.duration_minutes,
            exclude_appointment_id=conflict_data.exclude_appointment_id
        )
        
        result = {
            'has_conflict': has_conflict,
            'conflicting_appointments': [],
            'suggested_times': []
        }
        
        if has_conflict:
            # Get conflicting appointments
            start_datetime = datetime.combine(conflict_data.appointment_date, conflict_data.appointment_time)
            end_datetime = start_datetime + timedelta(minutes=conflict_data.duration_minutes)
            
            conflicts = db.query(Appointment).filter(
                Appointment.doctor_id == conflict_data.doctor_id,
                Appointment.appointment_date == conflict_data.appointment_date,
                Appointment.status.in_(['scheduled', 'confirmed', 'in_progress']),
                Appointment.is_active == True
            ).all()
            
            conflicting = []
            for appt in conflicts:
                if conflict_data.exclude_appointment_id and appt.id == conflict_data.exclude_appointment_id:
                    continue
                
                appt_start = datetime.combine(appt.appointment_date, appt.appointment_time)
                appt_end = appt_start + timedelta(minutes=appt.duration_minutes)
                
                if (start_datetime < appt_end) and (end_datetime > appt_start):
                    conflicting.append(appt)
            
            result['conflicting_appointments'] = conflicting
            
            # Generate suggested times (simple implementation)
            suggested_times = self._generate_suggested_times(
                db, conflict_data.doctor_id, conflict_data.appointment_date, conflict_data.duration_minutes
            )
            result['suggested_times'] = suggested_times
        
        return result
    
    def get_available_time_slots(self, db: Session, doctor_id: UUID, date_obj: date, slot_duration: int = 30) -> List[Dict[str, Any]]:
        """Get available time slots for a doctor on a specific date"""
        # Get doctor's working hours (simplified - using default 9 AM to 5 PM)
        working_start = time(9, 0)
        working_end = time(17, 0)
        
        # Get existing appointments
        existing_appointments = self.get_doctor_daily_schedule(db, doctor_id, date_obj)
        
        # Generate time slots
        slots = []
        current_time = datetime.combine(date_obj, working_start)
        end_time = datetime.combine(date_obj, working_end)
        
        while current_time + timedelta(minutes=slot_duration) <= end_time:
            slot_end = current_time + timedelta(minutes=slot_duration)
            
            # Check if this slot conflicts with existing appointments
            is_available = True
            for appt in existing_appointments:
                appt_start = datetime.combine(appt.appointment_date, appt.appointment_time)
                appt_end = appt_start + timedelta(minutes=appt.duration_minutes)
                
                if (current_time < appt_end) and (slot_end > appt_start):
                    is_available = False
                    break
            
            slots.append({
                'start_time': current_time.time(),
                'end_time': slot_end.time(),
                'duration_minutes': slot_duration,
                'is_available': is_available
            })
            
            current_time += timedelta(minutes=slot_duration)
        
        return slots
    
    def _generate_suggested_times(self, db: Session, doctor_id: UUID, date_obj: date, duration_minutes: int) -> List[Dict[str, Any]]:
        """Generate suggested alternative appointment times"""
        suggestions = []
        
        # Get available slots for the same day
        available_slots = self.get_available_time_slots(db, doctor_id, date_obj, duration_minutes)
        
        for slot in available_slots[:3]:  # Limit to 3 suggestions
            if slot['is_available']:
                suggestions.append({
                    'date': date_obj,
                    'time': slot['start_time'],
                    'duration_minutes': duration_minutes
                })
        
        # If not enough suggestions for the same day, try next few days
        if len(suggestions) < 3:
            for days_ahead in range(1, 8):  # Try next 7 days
                future_date = date_obj + timedelta(days=days_ahead)
                future_slots = self.get_available_time_slots(db, doctor_id, future_date, duration_minutes)
                
                for slot in future_slots[:2]:  # Limit to 2 per day
                    if slot['is_available'] and len(suggestions) < 5:
                        suggestions.append({
                            'date': future_date,
                            'time': slot['start_time'],
                            'duration_minutes': duration_minutes
                        })
        
        return suggestions
    
    # Statistics and Analytics
    
    def get_appointment_statistics(self, db: Session, doctor_id: Optional[UUID] = None, start_date: Optional[date] = None, end_date: Optional[date] = None) -> Dict[str, Any]:
        """Get appointment statistics"""
        query = db.query(Appointment).filter(Appointment.is_active == True)
        
        if doctor_id:
            query = query.filter(Appointment.doctor_id == doctor_id)
        
        if start_date:
            query = query.filter(Appointment.appointment_date >= start_date)
        
        if end_date:
            query = query.filter(Appointment.appointment_date <= end_date)
        
        # Basic counts
        total_appointments = query.count()
        
        status_counts = db.query(
            Appointment.status,
            func.count(Appointment.id).label('count')
        ).filter(Appointment.is_active == True)
        
        if doctor_id:
            status_counts = status_counts.filter(Appointment.doctor_id == doctor_id)
        
        if start_date:
            status_counts = status_counts.filter(Appointment.appointment_date >= start_date)
        
        if end_date:
            status_counts = status_counts.filter(Appointment.appointment_date <= end_date)
        
        status_counts = status_counts.group_by(Appointment.status).all()
        
        # Calculate specific counts
        today = date.today()
        now = datetime.now()
        
        today_appointments = query.filter(Appointment.appointment_date == today).count()
        
        upcoming_appointments = query.filter(
            or_(
                Appointment.appointment_date > today,
                and_(
                    Appointment.appointment_date == today,
                    Appointment.appointment_time > now.time()
                )
            ),
            Appointment.status.in_(['scheduled', 'confirmed'])
        ).count()
        
        overdue_appointments = query.filter(
            or_(
                Appointment.appointment_date < today,
                and_(
                    Appointment.appointment_date == today,
                    Appointment.appointment_time < now.time()
                )
            ),
            Appointment.status.in_(['scheduled', 'confirmed'])
        ).count()
        
        return {
            'total_appointments': total_appointments,
            'scheduled_appointments': sum(row.count for row in status_counts if row.status == 'scheduled'),
            'confirmed_appointments': sum(row.count for row in status_counts if row.status == 'confirmed'),
            'completed_appointments': sum(row.count for row in status_counts if row.status == 'completed'),
            'cancelled_appointments': sum(row.count for row in status_counts if row.status == 'cancelled'),
            'no_show_appointments': sum(row.count for row in status_counts if row.status == 'no_show'),
            'today_appointments': today_appointments,
            'upcoming_appointments': upcoming_appointments,
            'overdue_appointments': overdue_appointments,
            'appointments_by_status': {row.status: row.count for row in status_counts},
            'appointments_by_doctor': {},  # Could be implemented if needed
            'weekly_trend': [],  # Could be implemented for trend analysis
            'peak_hours': []     # Could be implemented for peak time analysis
        }
    
    # Bulk Operations
    
    def bulk_update_appointments(self, db: Session, appointment_ids: List[UUID], operation: str, updated_by: UUID, **kwargs) -> Dict[str, Any]:
        """Perform bulk operations on appointments"""
        result = {
            'operation': operation,
            'total_requested': len(appointment_ids),
            'successful': 0,
            'failed': 0,
            'errors': [],
            'processed_ids': []
        }
        
        for appointment_id in appointment_ids:
            try:
                if operation == 'cancel':
                    success = self.cancel_appointment(
                        db, appointment_id, kwargs.get('notes'), updated_by
                    )
                    if success:
                        result['successful'] += 1
                        result['processed_ids'].append(appointment_id)
                
                elif operation == 'confirm':
                    status_data = AppointmentStatusUpdate(status='confirmed', notes=kwargs.get('notes'))
                    appointment = self.update_appointment_status(db, appointment_id, status_data, updated_by)
                    if appointment:
                        result['successful'] += 1
                        result['processed_ids'].append(appointment_id)
                
                elif operation == 'complete':
                    status_data = AppointmentStatusUpdate(status='completed', notes=kwargs.get('notes'))
                    appointment = self.update_appointment_status(db, appointment_id, status_data, updated_by)
                    if appointment:
                        result['successful'] += 1
                        result['processed_ids'].append(appointment_id)
                
                elif operation == 'reschedule':
                    if not kwargs.get('new_date') or not kwargs.get('new_time'):
                        raise ValidationError("New date and time required for reschedule")
                    
                    reschedule_data = AppointmentReschedule(
                        appointment_date=kwargs['new_date'],
                        appointment_time=kwargs['new_time'],
                        reason=kwargs.get('notes')
                    )
                    appointment = self.reschedule_appointment(db, appointment_id, reschedule_data, updated_by)
                    if appointment:
                        result['successful'] += 1
                        result['processed_ids'].append(appointment_id)
                
            except Exception as e:
                result['failed'] += 1
                result['errors'].append(f"Appointment {appointment_id}: {str(e)}")
                logger.error(f"Bulk operation failed for appointment {appointment_id}: {str(e)}")
        
        return result