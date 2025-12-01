"""
Dental Service Layer
Comprehensive business logic for dental observations and procedures
Integrates with FDI notation system, appointments, and prescriptions
"""

from typing import List, Optional, Dict, Any, Tuple
from uuid import UUID, uuid4
from datetime import date, datetime
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, desc, asc, func

from app.models.dental import (
    DentalObservation, DentalProcedure,
    is_valid_tooth_number, get_tooth_type,
    DENTAL_CONDITION_TYPES, TOOTH_SURFACES
)
from app.models.patient import Patient
from app.models.prescription import Prescription
from app.models.appointment import Appointment
from app.schemas.dental import (
    DentalObservationCreate, DentalObservationUpdate,
    DentalProcedureCreate, DentalProcedureUpdate,
    DentalSearchParams, BulkDentalObservationCreate,
    BulkDentalProcedureCreate
)
from app.core.exceptions import (
    ValidationError, BusinessRuleError, ConflictError
)


class DentalService:
    """Service class for dental observations and procedures"""

    def __init__(self, db: Session):
        self.db = db

    # ==================== Dental Observation Operations ====================

    def create_observation(
        self,
        observation_data: DentalObservationCreate,
        created_by: UUID
    ) -> DentalObservation:
        """Create a new dental observation with validation"""

        # Validate patient exists
        patient = self._get_patient_by_composite_key(
            observation_data.patient_mobile_number,
            observation_data.patient_first_name
        )
        if not patient:
            raise ValidationError("Patient not found")

        # Validate tooth number using FDI notation
        if not is_valid_tooth_number(observation_data.tooth_number):
            raise ValidationError(
                f"Invalid tooth number '{observation_data.tooth_number}'. "
                "Must be valid FDI notation (Permanent: 11-48, Primary: 51-85)"
            )

        # Validate tooth surface if provided
        if observation_data.tooth_surface and observation_data.tooth_surface not in TOOTH_SURFACES:
            raise ValidationError(
                f"Invalid tooth surface '{observation_data.tooth_surface}'. "
                f"Must be one of: {', '.join(TOOTH_SURFACES)}"
            )

        # Validate condition type
        if observation_data.condition_type not in DENTAL_CONDITION_TYPES:
            raise ValidationError(
                f"Invalid condition type '{observation_data.condition_type}'. "
                f"Must be one of: {', '.join(DENTAL_CONDITION_TYPES)}"
            )

        # Validate prescription if provided
        if observation_data.prescription_id:
            prescription = self._get_prescription_by_id(observation_data.prescription_id)
            if not prescription:
                raise ValidationError("Prescription not found")

            # Validate prescription belongs to patient
            if (prescription.patient_mobile_number != observation_data.patient_mobile_number or
                prescription.patient_first_name != observation_data.patient_first_name):
                raise ValidationError("Prescription does not match patient")

        # Validate appointment if provided
        if observation_data.appointment_id:
            appointment = self._get_appointment_by_id(observation_data.appointment_id)
            if not appointment:
                raise ValidationError("Appointment not found")

            # Validate appointment belongs to patient
            if (appointment.patient_mobile_number != observation_data.patient_mobile_number or
                appointment.patient_first_name != observation_data.patient_first_name):
                raise ValidationError("Appointment does not match patient")

        # Create observation
        observation = DentalObservation(
            id=uuid4(),
            prescription_id=observation_data.prescription_id,
            appointment_id=observation_data.appointment_id,
            patient_mobile_number=observation_data.patient_mobile_number,
            patient_first_name=observation_data.patient_first_name,
            tooth_number=observation_data.tooth_number,
            tooth_surface=observation_data.tooth_surface,
            condition_type=observation_data.condition_type,
            severity=observation_data.severity,
            observation_notes=observation_data.observation_notes,
            treatment_required=observation_data.treatment_required,
            treatment_done=observation_data.treatment_done,
            treatment_date=observation_data.treatment_date,
            created_by=created_by,
        )

        self.db.add(observation)
        self.db.commit()
        self.db.refresh(observation)

        return observation

    def get_observation_by_id(self, observation_id: UUID) -> Optional[DentalObservation]:
        """Get dental observation by ID"""
        return self.db.query(DentalObservation).filter(
            DentalObservation.id == observation_id,
        ).first()

    def update_observation(
        self,
        observation_id: UUID,
        update_data: DentalObservationUpdate,
        updated_by: UUID
    ) -> Optional[DentalObservation]:
        """Update dental observation"""
        observation = self.get_observation_by_id(observation_id)
        if not observation:
            raise ValidationError("Dental observation not found")

        # Update fields
        update_dict = update_data.dict(exclude_unset=True)
        for field, value in update_dict.items():
            # Validate tooth surface if being updated
            if field == 'tooth_surface' and value and value not in TOOTH_SURFACES:
                raise ValidationError(f"Invalid tooth surface: {value}")

            # Validate condition type if being updated
            if field == 'condition_type' and value and value not in DENTAL_CONDITION_TYPES:
                raise ValidationError(f"Invalid condition type: {value}")

            setattr(observation, field, value)

        observation.updated_at = datetime.utcnow()
        observation.updated_by = updated_by

        self.db.commit()
        self.db.refresh(observation)

        return observation

    def delete_observation(self, observation_id: UUID) -> bool:
        """Soft delete dental observation"""
        observation = self.get_observation_by_id(observation_id)
        if not observation:
            return False

        observation.updated_at = datetime.utcnow()

        self.db.commit()
        return True

    def get_patient_observations(
        self,
        mobile_number: str,
        first_name: str,
        tooth_number: Optional[str] = None,
        limit: int = 100
    ) -> List[DentalObservation]:
        """Get dental observations for a patient"""
        query = self.db.query(DentalObservation).filter(
            DentalObservation.patient_mobile_number == mobile_number,
            DentalObservation.patient_first_name == first_name
        )

        if tooth_number:
            query = query.filter(DentalObservation.tooth_number == tooth_number)

        return query.order_by(desc(DentalObservation.created_at)).limit(limit).all()

    def get_observations_by_prescription(
        self,
        prescription_id: UUID
    ) -> List[DentalObservation]:
        """Get dental observations for a prescription"""
        return self.db.query(DentalObservation).filter(
            DentalObservation.prescription_id == prescription_id,
        ).order_by(DentalObservation.tooth_number).all()

    def get_observations_by_appointment(
        self,
        appointment_id: UUID
    ) -> List[DentalObservation]:
        """Get dental observations for an appointment"""
        return self.db.query(DentalObservation).filter(
            DentalObservation.appointment_id == appointment_id,
        ).order_by(DentalObservation.tooth_number).all()

    def get_tooth_history(
        self,
        mobile_number: str,
        first_name: str,
        tooth_number: str
    ) -> List[DentalObservation]:
        """Get complete history for a specific tooth"""
        if not is_valid_tooth_number(tooth_number):
            raise ValidationError(f"Invalid tooth number: {tooth_number}")

        return self.db.query(DentalObservation).filter(
            DentalObservation.patient_mobile_number == mobile_number,
            DentalObservation.patient_first_name == first_name,
            DentalObservation.tooth_number == tooth_number,
        ).order_by(desc(DentalObservation.created_at)).all()

    def bulk_create_observations(
        self,
        bulk_data: BulkDentalObservationCreate,
        created_by: UUID
    ) -> List[DentalObservation]:
        """Create multiple dental observations at once"""
        observations = []

        for obs_data in bulk_data.observations:
            try:
                observation = self.create_observation(obs_data, created_by)
                observations.append(observation)
            except Exception as e:
                # Rollback and re-raise
                self.db.rollback()
                raise ValidationError(f"Failed to create observation: {str(e)}")

        return observations

    # ==================== Dental Procedure Operations ====================

    def create_procedure(
        self,
        procedure_data: DentalProcedureCreate,
        created_by: UUID
    ) -> DentalProcedure:
        """Create a new dental procedure with validation"""

        # Validate observation if provided
        if procedure_data.observation_id:
            observation = self.get_observation_by_id(procedure_data.observation_id)
            if not observation:
                raise ValidationError("Observation not found")

        # Validate prescription if provided
        if procedure_data.prescription_id:
            prescription = self._get_prescription_by_id(procedure_data.prescription_id)
            if not prescription:
                raise ValidationError("Prescription not found")

        # Validate appointment if provided
        if procedure_data.appointment_id:
            appointment = self._get_appointment_by_id(procedure_data.appointment_id)
            if not appointment:
                raise ValidationError("Appointment not found")

        # Validate tooth numbers if provided
        if procedure_data.tooth_numbers:
            tooth_list = [t.strip() for t in procedure_data.tooth_numbers.split(',')]
            for tooth in tooth_list:
                if tooth and not is_valid_tooth_number(tooth):
                    raise ValidationError(f"Invalid tooth number in list: {tooth}")

        # Create procedure
        procedure = DentalProcedure(
            id=uuid4(),
            observation_id=procedure_data.observation_id,
            prescription_id=procedure_data.prescription_id,
            appointment_id=procedure_data.appointment_id,
            procedure_code=procedure_data.procedure_code,
            procedure_name=procedure_data.procedure_name,
            tooth_numbers=procedure_data.tooth_numbers,
            description=procedure_data.description,
            estimated_cost=procedure_data.estimated_cost,
            actual_cost=procedure_data.actual_cost,
            duration_minutes=procedure_data.duration_minutes,
            status=procedure_data.status,
            procedure_date=procedure_data.procedure_date,
            completed_date=procedure_data.completed_date,
            procedure_notes=procedure_data.procedure_notes,
            complications=procedure_data.complications,
            created_by=created_by,
        )

        self.db.add(procedure)
        self.db.commit()
        self.db.refresh(procedure)

        return procedure

    def get_procedure_by_id(self, procedure_id: UUID) -> Optional[DentalProcedure]:
        """Get dental procedure by ID"""
        return self.db.query(DentalProcedure).filter(
            DentalProcedure.id == procedure_id,
        ).first()

    def update_procedure(
        self,
        procedure_id: UUID,
        update_data: DentalProcedureUpdate,
        updated_by: UUID
    ) -> Optional[DentalProcedure]:
        """Update dental procedure"""
        procedure = self.get_procedure_by_id(procedure_id)
        if not procedure:
            raise ValidationError("Dental procedure not found")

        # Update fields
        update_dict = update_data.dict(exclude_unset=True)
        for field, value in update_dict.items():
            # Validate tooth numbers if being updated
            if field == 'tooth_numbers' and value:
                tooth_list = [t.strip() for t in value.split(',')]
                for tooth in tooth_list:
                    if tooth and not is_valid_tooth_number(tooth):
                        raise ValidationError(f"Invalid tooth number in list: {tooth}")

            setattr(procedure, field, value)

        procedure.updated_at = datetime.utcnow()
        procedure.updated_by = updated_by

        self.db.commit()
        self.db.refresh(procedure)

        return procedure

    def delete_procedure(self, procedure_id: UUID) -> bool:
        """Soft delete dental procedure"""
        procedure = self.get_procedure_by_id(procedure_id)
        if not procedure:
            return False

        procedure.updated_at = datetime.utcnow()

        self.db.commit()
        return True

    def get_procedures_by_observation(
        self,
        observation_id: UUID
    ) -> List[DentalProcedure]:
        """Get procedures for an observation"""
        return self.db.query(DentalProcedure).filter(
            DentalProcedure.observation_id == observation_id,
        ).order_by(DentalProcedure.created_at).all()

    def get_procedures_by_prescription(
        self,
        prescription_id: UUID
    ) -> List[DentalProcedure]:
        """Get procedures for a prescription"""
        return self.db.query(DentalProcedure).filter(
            DentalProcedure.prescription_id == prescription_id,
        ).order_by(DentalProcedure.created_at).all()

    def get_procedures_by_appointment(
        self,
        appointment_id: UUID
    ) -> List[DentalProcedure]:
        """Get procedures for an appointment"""
        return self.db.query(DentalProcedure).filter(
            DentalProcedure.appointment_id == appointment_id,
        ).order_by(DentalProcedure.created_at).all()

    def get_doctor_today_procedures(
        self,
        doctor_id: UUID
    ) -> List[DentalProcedure]:
        """
        Get today's dental procedures for a specific doctor.
        Procedures are linked to doctor via appointments.
        Returns all active procedures for today (planned, in_progress, and completed).
        """
        today = date.today()
        return self.db.query(DentalProcedure).join(
            Appointment,
            DentalProcedure.appointment_id == Appointment.id
        ).filter(
            Appointment.doctor_id == doctor_id,
            DentalProcedure.procedure_date == today,
            DentalProcedure.status.in_(['planned', 'in_progress', 'completed'])
        ).order_by(DentalProcedure.created_at).all()

    def update_procedure_status(
        self,
        procedure_id: UUID,
        status: str,
        updated_by: UUID,
        notes: Optional[str] = None
    ) -> Optional[DentalProcedure]:
        """Update procedure status"""
        procedure = self.get_procedure_by_id(procedure_id)
        if not procedure:
            raise ValidationError("Procedure not found")

        # Validate status
        valid_statuses = ['planned', 'in_progress', 'completed', 'cancelled']
        if status not in valid_statuses:
            raise ValidationError(f"Invalid status. Must be one of: {', '.join(valid_statuses)}")

        # Validate status transitions
        valid_transitions = {
            'planned': ['in_progress', 'cancelled'],
            'in_progress': ['completed', 'cancelled'],
            'completed': [],  # Terminal state
            'cancelled': []   # Terminal state
        }

        if status not in valid_transitions.get(procedure.status, []):
            raise BusinessRuleError(
                f"Invalid status transition from {procedure.status} to {status}"
            )

        procedure.status = status

        # Set completed date if status is completed
        if status == 'completed' and not procedure.completed_date:
            procedure.completed_date = date.today()

        if notes:
            current_notes = procedure.procedure_notes or ""
            procedure.procedure_notes = f"{current_notes}\n[{datetime.utcnow()}] Status: {status} - {notes}".strip()

        procedure.updated_at = datetime.utcnow()
        procedure.updated_by = updated_by

        self.db.commit()
        self.db.refresh(procedure)

        return procedure

    def bulk_create_procedures(
        self,
        bulk_data: BulkDentalProcedureCreate,
        created_by: UUID
    ) -> List[DentalProcedure]:
        """Create multiple dental procedures at once"""
        procedures = []

        for proc_data in bulk_data.procedures:
            try:
                procedure = self.create_procedure(proc_data, created_by)
                procedures.append(procedure)
            except Exception as e:
                # Rollback and re-raise
                self.db.rollback()
                raise ValidationError(f"Failed to create procedure: {str(e)}")

        return procedures

    # ==================== Dental Chart Operations ====================

    def get_dental_chart(
        self,
        mobile_number: str,
        first_name: str
    ) -> Dict[str, Any]:
        """Get complete dental chart for a patient"""

        # Validate patient exists
        patient = self._get_patient_by_composite_key(mobile_number, first_name)
        if not patient:
            raise ValidationError("Patient not found")

        # Get all observations
        observations = self.get_patient_observations(mobile_number, first_name)

        # Get all procedures (not linked to observations)
        procedures = self.db.query(DentalProcedure).join(
            Appointment,
            DentalProcedure.appointment_id == Appointment.id
        ).filter(
            Appointment.patient_mobile_number == mobile_number,
            Appointment.patient_first_name == first_name,
        ).all()

        # Organize by tooth number
        teeth_data = {}

        for obs in observations:
            tooth_num = obs.tooth_number
            if tooth_num not in teeth_data:
                teeth_data[tooth_num] = {
                    'tooth_number': tooth_num,
                    'tooth_type': get_tooth_type(tooth_num),
                    'observations': [],
                    'procedures': [],
                    'has_active_issues': False,
                    'last_treatment_date': None
                }

            teeth_data[tooth_num]['observations'].append(obs)

            # Check for active issues
            if obs.treatment_required and not obs.treatment_done:
                teeth_data[tooth_num]['has_active_issues'] = True

            # Track last treatment date
            if obs.treatment_date:
                if (teeth_data[tooth_num]['last_treatment_date'] is None or
                    obs.treatment_date > teeth_data[tooth_num]['last_treatment_date']):
                    teeth_data[tooth_num]['last_treatment_date'] = obs.treatment_date

        # Add procedures
        for proc in procedures:
            if proc.tooth_numbers:
                tooth_list = [t.strip() for t in proc.tooth_numbers.split(',')]
                for tooth_num in tooth_list:
                    if tooth_num in teeth_data:
                        teeth_data[tooth_num]['procedures'].append(proc)

        # Determine dentition type
        tooth_types = [get_tooth_type(t) for t in teeth_data.keys()]
        if all(t == 'permanent' for t in tooth_types):
            dentition_type = 'permanent'
        elif all(t == 'primary' for t in tooth_types):
            dentition_type = 'primary'
        else:
            dentition_type = 'mixed'

        # Count active treatments
        active_treatments = sum(1 for t in teeth_data.values() if t['has_active_issues'])

        return {
            'patient_mobile_number': mobile_number,
            'patient_first_name': first_name,
            'dentition_type': dentition_type,
            'teeth': list(teeth_data.values()),
            'total_observations': len(observations),
            'total_procedures': len(procedures),
            'active_treatments': active_treatments
        }

    # ==================== Search and Statistics ====================

    def search_observations(
        self,
        search_params: DentalSearchParams
    ) -> Tuple[List[DentalObservation], int]:
        """Search dental observations with filtering"""
        query = self.db.query(DentalObservation).filter(
        )

        # Apply filters
        if search_params.patient_mobile_number:
            query = query.filter(
                DentalObservation.patient_mobile_number == search_params.patient_mobile_number
            )

        if search_params.patient_first_name:
            query = query.filter(
                DentalObservation.patient_first_name.ilike(f"%{search_params.patient_first_name}%")
            )

        if search_params.tooth_number:
            query = query.filter(DentalObservation.tooth_number == search_params.tooth_number)

        if search_params.condition_type:
            query = query.filter(DentalObservation.condition_type == search_params.condition_type)

        if search_params.treatment_required is not None:
            query = query.filter(
                DentalObservation.treatment_required == search_params.treatment_required
            )

        if search_params.treatment_done is not None:
            query = query.filter(DentalObservation.treatment_done == search_params.treatment_done)

        if search_params.from_date:
            query = query.filter(DentalObservation.created_at >= search_params.from_date)

        if search_params.to_date:
            query = query.filter(DentalObservation.created_at <= search_params.to_date)

        # Get total count
        total = query.count()

        # Get results
        observations = query.order_by(desc(DentalObservation.created_at)).all()

        return observations, total

    def get_dental_statistics(
        self,
        mobile_number: Optional[str] = None,
        first_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get dental statistics"""
        obs_query = self.db.query(DentalObservation).filter(
        )
        proc_query = self.db.query(DentalProcedure).filter(
        )

        # Filter by patient if specified
        if mobile_number and first_name:
            obs_query = obs_query.filter(
                DentalObservation.patient_mobile_number == mobile_number,
                DentalObservation.patient_first_name == first_name
            )
            # Join with appointments for procedure filtering
            proc_query = proc_query.join(
                Appointment,
                DentalProcedure.appointment_id == Appointment.id
            ).filter(
                Appointment.patient_mobile_number == mobile_number,
                Appointment.patient_first_name == first_name
            )

        total_observations = obs_query.count()
        total_procedures = proc_query.count()

        # Observations by condition type
        obs_by_condition = {}
        for condition in DENTAL_CONDITION_TYPES:
            count = obs_query.filter(DentalObservation.condition_type == condition).count()
            if count > 0:
                obs_by_condition[condition] = count

        # Procedures by status
        proc_by_status = {}
        for status in ['planned', 'in_progress', 'completed', 'cancelled']:
            count = proc_query.filter(DentalProcedure.status == status).count()
            if count > 0:
                proc_by_status[status] = count

        # Most affected teeth
        most_affected = self.db.query(
            DentalObservation.tooth_number,
            func.count(DentalObservation.id).label('count')
        ).filter(
        ).group_by(
            DentalObservation.tooth_number
        ).order_by(
            desc('count')
        ).limit(10).all()

        most_affected_teeth = [
            {'tooth_number': tooth, 'count': count}
            for tooth, count in most_affected
        ]

        # Treatment completion rate
        total_treatments = obs_query.filter(
            DentalObservation.treatment_required == True
        ).count()
        completed_treatments = obs_query.filter(
            DentalObservation.treatment_required == True,
            DentalObservation.treatment_done == True
        ).count()

        completion_rate = (completed_treatments / total_treatments * 100) if total_treatments > 0 else 0

        return {
            'total_observations': total_observations,
            'total_procedures': total_procedures,
            'observations_by_condition': obs_by_condition,
            'procedures_by_status': proc_by_status,
            'most_affected_teeth': most_affected_teeth,
            'treatment_completion_rate': round(completion_rate, 2)
        }

    # ==================== Private Helper Methods ====================

    def _get_patient_by_composite_key(
        self,
        mobile_number: str,
        first_name: str
    ) -> Optional[Patient]:
        """Get patient by composite key"""
        return self.db.query(Patient).filter(
            Patient.mobile_number == mobile_number,
            Patient.first_name == first_name,
            Patient.is_active == True
        ).first()

    def _get_prescription_by_id(self, prescription_id: UUID) -> Optional[Prescription]:
        """Get prescription by ID"""
        return self.db.query(Prescription).filter(
            Prescription.id == prescription_id,
            Prescription.is_active == True
        ).first()

    def _get_appointment_by_id(self, appointment_id: UUID) -> Optional[Appointment]:
        """Get appointment by ID"""
        return self.db.query(Appointment).filter(
            Appointment.id == appointment_id,
            Appointment.is_active == True
        ).first()


def get_dental_service(db: Session) -> DentalService:
    """Factory function to get dental service instance"""
    return DentalService(db)
