"""
Treatment Service
Business logic for Treatment Dashboard feature
Provides patient list, treatment timeline, and procedure summary
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_, desc
from uuid import UUID

from app.models import (
    Patient, Doctor, Appointment, Prescription,
    DentalObservation, DentalProcedure, User
)


class TreatmentService:
    """
    Service for Treatment Dashboard
    Provides patient treatment data for doctors and admins
    """

    @staticmethod
    def get_patients_with_treatment_summary(
        db: Session,
        doctor_id: Optional[UUID] = None,
        status_filter: Optional[str] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        search_query: Optional[str] = None,
        page: int = 1,
        per_page: int = 20
    ) -> Dict[str, Any]:
        """
        Get list of patients with treatment summary
        Role-based filtering:
        - Doctor: Only their consulted patients
        - Admin: All patients (filter by doctor_id optional)

        Args:
            db: Database session
            doctor_id: Filter by doctor (required for doctor role, optional for admin)
            status_filter: 'active', 'completed', 'planned' (optional)
            date_from: Filter appointments from date (optional)
            date_to: Filter appointments to date (optional)
            search_query: Search by patient name/mobile (optional)
            page: Page number (default 1)
            per_page: Items per page (default 20)

        Returns:
            Dict with patients list and pagination info
        """

        # Base query: Get distinct patients who have appointments
        base_query = db.query(Patient).join(
            Appointment,
            and_(
                Appointment.patient_mobile_number == Patient.mobile_number,
                Appointment.patient_first_name == Patient.first_name,
                Appointment.is_active == True
            )
        ).filter(Patient.is_active == True)

        # Doctor filter (required for doctors, optional for admins)
        if doctor_id:
            base_query = base_query.filter(Appointment.doctor_id == doctor_id)

        # Date range filter
        if date_from:
            base_query = base_query.filter(Appointment.appointment_date >= date_from)
        if date_to:
            base_query = base_query.filter(Appointment.appointment_date <= date_to)

        # Search filter (patient name or mobile)
        if search_query:
            search_pattern = f"%{search_query}%"
            base_query = base_query.filter(
                or_(
                    Patient.first_name.ilike(search_pattern),
                    Patient.last_name.ilike(search_pattern),
                    Patient.mobile_number.ilike(search_pattern)
                )
            )

        # Get distinct patients
        base_query = base_query.distinct()

        # Pagination
        total = base_query.count()
        pages = (total + per_page - 1) // per_page

        patients = base_query.order_by(Patient.created_at.desc()).offset(
            (page - 1) * per_page
        ).limit(per_page).all()

        # Build patient summaries
        patient_summaries = []
        for patient in patients:
            summary = TreatmentService._build_patient_summary(
                db, patient, doctor_id, status_filter
            )
            patient_summaries.append(summary)

        return {
            "patients": patient_summaries,
            "pagination": {
                "total": total,
                "page": page,
                "per_page": per_page,
                "pages": pages
            }
        }

    @staticmethod
    def _build_patient_summary(
        db: Session,
        patient: Patient,
        doctor_id: Optional[UUID] = None,
        status_filter: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Build treatment summary for a single patient

        Args:
            db: Database session
            patient: Patient model instance
            doctor_id: Optional doctor filter
            status_filter: Optional status filter

        Returns:
            Dictionary with patient info and treatment summary
        """

        # Base appointment query
        apt_query = db.query(Appointment).filter(
            Appointment.patient_mobile_number == patient.mobile_number,
            Appointment.patient_first_name == patient.first_name,
            Appointment.is_active == True
        )
        if doctor_id:
            apt_query = apt_query.filter(Appointment.doctor_id == doctor_id)

        # Get appointment counts by status
        total_appointments = apt_query.count()
        completed_appointments = apt_query.filter(
            Appointment.status == "completed"
        ).count()
        scheduled_appointments = apt_query.filter(
            Appointment.status.in_(["scheduled", "confirmed"])
        ).count()

        # Last consultation date
        last_appointment = apt_query.filter(
            Appointment.status == "completed"
        ).order_by(desc(Appointment.appointment_date)).first()

        last_consultation_date = None
        if last_appointment:
            last_consultation_date = last_appointment.appointment_date.isoformat()

        # Get primary doctor (most recent appointment)
        recent_appointment = apt_query.order_by(
            desc(Appointment.appointment_date)
        ).first()

        primary_doctor = None
        if recent_appointment:
            doctor = db.query(Doctor).filter(
                Doctor.id == recent_appointment.doctor_id
            ).first()
            if doctor:
                user = db.query(User).filter(User.id == doctor.user_id).first()
                primary_doctor = {
                    "id": str(doctor.id),
                    "name": f"Dr. {user.first_name} {user.last_name}" if user else "Unknown",
                    "specialization": doctor.specialization
                }

        # Get dental procedures
        proc_query = db.query(DentalProcedure).join(
            Appointment,
            DentalProcedure.appointment_id == Appointment.id
        ).filter(
            Appointment.patient_mobile_number == patient.mobile_number,
            Appointment.patient_first_name == patient.first_name,
            DentalProcedure.is_active == True
        )
        if doctor_id:
            proc_query = proc_query.filter(Appointment.doctor_id == doctor_id)

        total_procedures = proc_query.count()
        pending_procedures = proc_query.filter(
            DentalProcedure.status.in_(["planned", "in_progress"])
        ).count()
        completed_procedures = proc_query.filter(
            DentalProcedure.status == "completed"
        ).count()

        # Get active prescriptions
        presc_query = db.query(Prescription).filter(
            Prescription.patient_mobile_number == patient.mobile_number,
            Prescription.patient_first_name == patient.first_name,
            Prescription.is_active == True,
            Prescription.status == "active"
        )
        if doctor_id:
            presc_query = presc_query.filter(Prescription.doctor_id == doctor_id)

        active_prescriptions = presc_query.count()

        # Determine treatment status
        treatment_status = "completed"
        if pending_procedures > 0 or scheduled_appointments > 0:
            treatment_status = "active"
        elif total_appointments == 0 and total_procedures == 0:
            treatment_status = "planned"

        # Apply status filter
        if status_filter and status_filter != treatment_status:
            return None  # Skip this patient

        return {
            "patient": {
                "mobile_number": patient.mobile_number,
                "first_name": patient.first_name,
                "last_name": patient.last_name,
                "uuid": str(patient.id),
                "age": patient.age,
                "gender": patient.gender,
                "email": patient.email
            },
            "summary": {
                "last_consultation_date": last_consultation_date,
                "primary_doctor": primary_doctor,
                "total_appointments": total_appointments,
                "completed_appointments": completed_appointments,
                "scheduled_appointments": scheduled_appointments,
                "pending_procedures": pending_procedures,
                "completed_procedures": completed_procedures,
                "total_procedures": total_procedures,
                "active_prescriptions": active_prescriptions,
                "treatment_status": treatment_status
            }
        }

    @staticmethod
    def get_patient_treatment_timeline(
        db: Session,
        patient_mobile: str,
        patient_first_name: str,
        doctor_id: Optional[UUID] = None
    ) -> List[Dict[str, Any]]:
        """
        Get chronological treatment timeline for a patient
        Includes: appointments, prescriptions, observations, procedures

        Args:
            db: Database session
            patient_mobile: Patient mobile number
            patient_first_name: Patient first name
            doctor_id: Optional doctor filter (for doctor role)

        Returns:
            List of timeline events sorted by date (most recent first)
        """

        timeline_events = []

        # Get appointments
        apt_query = db.query(Appointment).filter(
            Appointment.patient_mobile_number == patient_mobile,
            Appointment.patient_first_name == patient_first_name,
            Appointment.is_active == True
        )
        if doctor_id:
            apt_query = apt_query.filter(Appointment.doctor_id == doctor_id)

        appointments = apt_query.all()
        for apt in appointments:
            doctor = db.query(Doctor).filter(Doctor.id == apt.doctor_id).first()
            doctor_user = db.query(User).filter(User.id == doctor.user_id).first() if doctor else None
            doctor_name = f"Dr. {doctor_user.first_name} {doctor_user.last_name}" if doctor_user else "Unknown"

            timeline_events.append({
                "date": apt.appointment_date.isoformat(),
                "time": apt.appointment_time.strftime("%H:%M") if apt.appointment_time else None,
                "type": "appointment",
                "event": {
                    "id": str(apt.id),
                    "title": f"{apt.status.replace('_', ' ').title()} Appointment",
                    "doctor": doctor_name,
                    "description": apt.reason_for_visit,
                    "status": apt.status,
                    "appointment_number": apt.appointment_number
                }
            })

        # Get prescriptions
        presc_query = db.query(Prescription).filter(
            Prescription.patient_mobile_number == patient_mobile,
            Prescription.patient_first_name == patient_first_name,
            Prescription.is_active == True
        )
        if doctor_id:
            presc_query = presc_query.filter(Prescription.doctor_id == doctor_id)

        prescriptions = presc_query.all()
        for presc in prescriptions:
            doctor = db.query(Doctor).filter(Doctor.id == presc.doctor_id).first()
            doctor_user = db.query(User).filter(User.id == doctor.user_id).first() if doctor else None
            doctor_name = f"Dr. {doctor_user.first_name} {doctor_user.last_name}" if doctor_user else "Unknown"

            timeline_events.append({
                "date": presc.visit_date.isoformat() if presc.visit_date else presc.created_at.date().isoformat(),
                "time": None,
                "type": "prescription",
                "event": {
                    "id": str(presc.id),
                    "title": "Prescription Issued",
                    "doctor": doctor_name,
                    "description": f"Diagnosis: {presc.diagnosis}",
                    "chief_complaint": presc.chief_complaint,
                    "status": presc.status,
                    "prescription_number": presc.prescription_number
                }
            })

        # Get dental observations
        obs_query = db.query(DentalObservation).filter(
            DentalObservation.patient_mobile_number == patient_mobile,
            DentalObservation.patient_first_name == patient_first_name,
            DentalObservation.is_active == True
        )

        observations = obs_query.all()
        for obs in observations:
            timeline_events.append({
                "date": obs.created_at.date().isoformat(),
                "time": obs.created_at.strftime("%H:%M"),
                "type": "observation",
                "event": {
                    "id": str(obs.id),
                    "title": f"Dental Observation - Tooth #{obs.tooth_number}",
                    "description": f"{obs.condition_type} ({obs.severity})",
                    "tooth_number": obs.tooth_number,
                    "condition": obs.condition_type,
                    "severity": obs.severity,
                    "treatment_required": obs.treatment_required,
                    "treatment_done": obs.treatment_done
                }
            })

        # Get dental procedures
        proc_query = db.query(DentalProcedure).join(
            Appointment,
            DentalProcedure.appointment_id == Appointment.id
        ).filter(
            DentalProcedure.is_active == True
        )

        # Filter by patient through appointment
        proc_query = proc_query.filter(
            Appointment.patient_mobile_number == patient_mobile,
            Appointment.patient_first_name == patient_first_name
        )

        if doctor_id:
            proc_query = proc_query.filter(Appointment.doctor_id == doctor_id)

        procedures = proc_query.all()
        for proc in procedures:
            proc_date = proc.procedure_date or proc.created_at.date()

            timeline_events.append({
                "date": proc_date.isoformat(),
                "time": None,
                "type": "procedure",
                "event": {
                    "id": str(proc.id),
                    "title": proc.procedure_name,
                    "description": proc.description or f"Tooth: {proc.tooth_numbers}",
                    "procedure_code": proc.procedure_code,
                    "tooth_numbers": proc.tooth_numbers,
                    "status": proc.status,
                    "estimated_cost": float(proc.estimated_cost) if proc.estimated_cost else None,
                    "actual_cost": float(proc.actual_cost) if proc.actual_cost else None
                }
            })

        # Sort timeline by date (most recent first)
        timeline_events.sort(key=lambda x: (x["date"], x["time"] or "00:00"), reverse=True)

        return timeline_events

    @staticmethod
    def get_patient_procedures(
        db: Session,
        patient_mobile: str,
        patient_first_name: str,
        doctor_id: Optional[UUID] = None
    ) -> Dict[str, List[Dict[str, Any]]]:
        """
        Get patient procedures grouped by status

        Args:
            db: Database session
            patient_mobile: Patient mobile number
            patient_first_name: Patient first name
            doctor_id: Optional doctor filter

        Returns:
            Dictionary with procedures grouped by status (upcoming, completed, cancelled)
        """

        proc_query = db.query(DentalProcedure).join(
            Appointment,
            DentalProcedure.appointment_id == Appointment.id
        ).filter(
            Appointment.patient_mobile_number == patient_mobile,
            Appointment.patient_first_name == patient_first_name,
            DentalProcedure.is_active == True
        )

        if doctor_id:
            proc_query = proc_query.filter(Appointment.doctor_id == doctor_id)

        procedures = proc_query.all()

        grouped = {
            "upcoming": [],
            "completed": [],
            "cancelled": []
        }

        for proc in procedures:
            proc_data = {
                "id": str(proc.id),
                "procedure_name": proc.procedure_name,
                "procedure_code": proc.procedure_code,
                "tooth_numbers": proc.tooth_numbers,
                "description": proc.description,
                "status": proc.status,
                "procedure_date": proc.procedure_date.isoformat() if proc.procedure_date else None,
                "completed_date": proc.completed_date.isoformat() if proc.completed_date else None,
                "estimated_cost": float(proc.estimated_cost) if proc.estimated_cost else None,
                "actual_cost": float(proc.actual_cost) if proc.actual_cost else None,
                "duration_minutes": proc.duration_minutes,
                "procedure_notes": proc.procedure_notes
            }

            if proc.status in ["planned", "in_progress"]:
                grouped["upcoming"].append(proc_data)
            elif proc.status == "completed":
                grouped["completed"].append(proc_data)
            elif proc.status == "cancelled":
                grouped["cancelled"].append(proc_data)

        # Sort upcoming by procedure_date
        grouped["upcoming"].sort(key=lambda x: x["procedure_date"] or "9999-12-31")

        # Sort completed by completed_date (most recent first)
        grouped["completed"].sort(key=lambda x: x["completed_date"] or "0000-01-01", reverse=True)

        return grouped

    @staticmethod
    def verify_doctor_patient_access(
        db: Session,
        doctor_id: UUID,
        patient_mobile: str,
        patient_first_name: str
    ) -> bool:
        """
        Verify that a doctor has consulted this patient
        (Has at least one appointment with them)

        Args:
            db: Database session
            doctor_id: Doctor UUID
            patient_mobile: Patient mobile number
            patient_first_name: Patient first name

        Returns:
            True if doctor has consulted this patient, False otherwise
        """

        appointment = db.query(Appointment).filter(
            Appointment.doctor_id == doctor_id,
            Appointment.patient_mobile_number == patient_mobile,
            Appointment.patient_first_name == patient_first_name,
            Appointment.is_active == True
        ).first()

        return appointment is not None
