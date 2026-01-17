"""
Doctor Service
Handles business logic for doctor management
Following ERD specifications and business requirements
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import Optional, List, Dict, Any, Tuple
from uuid import UUID
from datetime import datetime
import math

from app.models.doctor import Doctor
from app.models.user import User
from app.schemas.doctor import DoctorCreate, DoctorUpdate, DoctorSearchQuery
from app.core.database import get_db_context


class DoctorService:
    """Service class for doctor management operations"""
    
    def create_doctor(self, db: Session, doctor_data: DoctorCreate, auto_commit: bool = True) -> Doctor:
        """
        Create a new doctor profile

        Args:
            db: Database session
            doctor_data: Doctor creation data
            auto_commit: Whether to automatically commit the transaction (default: True)
                        Set to False when using external transaction management

        Returns:
            Created doctor object
        """
        # Check if user exists and has doctor role
        user = db.query(User).filter(
            User.id == doctor_data.user_id,
            User.is_active == True
        ).first()

        if not user:
            raise ValueError("User not found or inactive")

        if user.role != "doctor":
            raise ValueError("User must have 'doctor' role to create doctor profile")

        # Check if doctor profile already exists for this user
        existing_doctor = db.query(Doctor).filter(
            Doctor.user_id == doctor_data.user_id,
            Doctor.is_active == True
        ).first()

        if existing_doctor:
            raise ValueError("Doctor profile already exists for this user")

        # Check license number uniqueness
        existing_license = db.query(Doctor).filter(
            Doctor.license_number == doctor_data.license_number.upper(),
            Doctor.is_active == True
        ).first()

        if existing_license:
            raise ValueError(f"License number {doctor_data.license_number} already exists")

        # Convert offices to dicts for JSONB storage
        offices_data = []
        if doctor_data.offices:
            for office in doctor_data.offices:
                if hasattr(office, 'dict'):
                    offices_data.append(office.dict())
                elif isinstance(office, dict):
                    offices_data.append(office)
                else:
                    offices_data.append(dict(office))

        # Create doctor profile
        doctor = Doctor(
            user_id=doctor_data.user_id,
            tenant_id=doctor_data.tenant_id,  # Multi-tenancy: set tenant_id
            license_number=doctor_data.license_number.upper(),
            specialization=doctor_data.specialization,
            qualification=doctor_data.qualification,
            experience_years=doctor_data.experience_years,
            clinic_address=doctor_data.clinic_address,
            offices=offices_data,
            phone=doctor_data.phone,
            consultation_fee=doctor_data.consultation_fee,
            consultation_duration=doctor_data.consultation_duration,
            is_active=True
        )

        # Set availability schedule
        if doctor_data.availability_schedule:
            doctor.set_availability_schedule(doctor_data.availability_schedule)
        else:
            # Set default schedule
            doctor.set_availability_schedule(doctor.get_default_schedule())

        db.add(doctor)

        if auto_commit:
            db.commit()
            # Don't refresh after commit - RLS blocks it
        else:
            db.flush()  # Flush to validate constraints without committing

        return doctor
    
    def get_doctor_by_id(self, db: Session, doctor_id: UUID) -> Optional[Doctor]:
        """Get doctor by ID"""
        return db.query(Doctor).filter(
            Doctor.id == doctor_id,
            Doctor.is_active == True
        ).first()
    
    def get_doctor_by_user_id(self, db: Session, user_id: UUID) -> Optional[Doctor]:
        """Get doctor by user ID"""
        return db.query(Doctor).filter(
            Doctor.user_id == user_id,
            Doctor.is_active == True
        ).first()
    
    def get_doctor_by_license(self, db: Session, license_number: str) -> Optional[Doctor]:
        """Get doctor by license number"""
        return db.query(Doctor).filter(
            Doctor.license_number == license_number.upper(),
            Doctor.is_active == True
        ).first()
    
    def update_doctor(self, db: Session, doctor_id: UUID, doctor_update: DoctorUpdate) -> Optional[Doctor]:
        """Update doctor profile"""
        doctor = self.get_doctor_by_id(db, doctor_id)
        if not doctor:
            return None
        
        # Check license number uniqueness if being updated
        if doctor_update.license_number:
            existing_license = db.query(Doctor).filter(
                Doctor.license_number == doctor_update.license_number.upper(),
                Doctor.is_active == True,
                Doctor.id != doctor_id
            ).first()
            
            if existing_license:
                raise ValueError(f"License number {doctor_update.license_number} already exists")
        
        # Update fields
        update_data = doctor_update.dict(exclude_unset=True)

        # Handle availability schedule separately
        availability_schedule = update_data.pop('availability_schedule', None)

        # Handle offices separately - convert to dicts for JSONB storage
        offices = update_data.pop('offices', None)
        if offices is not None:
            offices_data = []
            for office in offices:
                if hasattr(office, 'dict'):
                    offices_data.append(office.dict())
                elif isinstance(office, dict):
                    offices_data.append(office)
                else:
                    offices_data.append(dict(office))
            doctor.offices = offices_data

        for field, value in update_data.items():
            if hasattr(doctor, field):
                setattr(doctor, field, value)
        
        # Update availability schedule if provided
        if availability_schedule is not None:
            doctor.set_availability_schedule(availability_schedule)
        
        doctor.updated_at = datetime.utcnow()
        db.commit()
        # Don't refresh after commit - RLS blocks it

        return doctor

    def deactivate_doctor(self, db: Session, doctor_id: UUID) -> bool:
        """Deactivate doctor (soft delete)"""
        doctor = self.get_doctor_by_id(db, doctor_id)
        if not doctor:
            return False
        
        doctor.is_active = False
        doctor.updated_at = datetime.utcnow()
        db.commit()
        
        return True
    
    def reactivate_doctor(self, db: Session, doctor_id: UUID) -> bool:
        """Reactivate doctor"""
        doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
        if not doctor:
            return False
        
        doctor.is_active = True
        doctor.updated_at = datetime.utcnow()
        db.commit()
        
        return True
    
    def search_doctors(
        self, 
        db: Session, 
        search_params: DoctorSearchQuery
    ) -> Tuple[List[Doctor], int]:
        """Search doctors with filters and pagination"""
        
        # Base query with joins
        query = db.query(Doctor).join(Doctor.user)
        
        # Apply filters
        if search_params.is_active is not None:
            query = query.filter(Doctor.is_active == search_params.is_active)
        else:
            query = query.filter(Doctor.is_active == True)
        
        # Text search (name or license)
        if search_params.query:
            search_term = f"%{search_params.query}%"
            query = query.filter(
                or_(
                    User.first_name.ilike(search_term),
                    User.last_name.ilike(search_term),
                    Doctor.license_number.ilike(search_term)
                )
            )
        
        # Specialization filter
        if search_params.specialization:
            query = query.filter(
                Doctor.specialization.ilike(f"%{search_params.specialization}%")
            )
        
        # Experience filter
        if search_params.min_experience is not None:
            query = query.filter(
                Doctor.experience_years >= search_params.min_experience
            )
        
        # Get total count before pagination
        total = query.count()
        
        # Apply pagination
        offset = (search_params.page - 1) * search_params.per_page
        doctors = query.offset(offset).limit(search_params.per_page).all()
        
        return doctors, total
    
    def get_doctors_by_specialization(self, db: Session, specialization: str) -> List[Doctor]:
        """Get all doctors with specific specialization"""
        return db.query(Doctor).filter(
            Doctor.specialization.ilike(f"%{specialization}%"),
            Doctor.is_active == True
        ).all()
    
    def update_doctor_schedule(
        self, 
        db: Session, 
        doctor_id: UUID, 
        schedule: Dict[str, List[Dict[str, str]]]
    ) -> Optional[Doctor]:
        """Update doctor availability schedule"""
        doctor = self.get_doctor_by_id(db, doctor_id)
        if not doctor:
            return None
        
        doctor.set_availability_schedule(schedule)
        doctor.updated_at = datetime.utcnow()
        db.commit()
        # Don't refresh after commit - RLS blocks it

        return doctor

    def get_doctor_schedule(self, db: Session, doctor_id: UUID) -> Optional[Dict[str, Any]]:
        """Get doctor availability schedule"""
        doctor = self.get_doctor_by_id(db, doctor_id)
        if not doctor:
            return None
        
        return {
            "doctor_id": doctor.id,
            "full_name": doctor.get_full_name(),
            "availability_schedule": doctor.get_availability_schedule(),
            "consultation_duration": doctor.consultation_duration
        }
    
    def get_available_doctors_for_day(self, db: Session, day: str) -> List[Doctor]:
        """Get doctors available on a specific day"""
        doctors = db.query(Doctor).filter(Doctor.is_active == True).all()
        available_doctors = []
        
        for doctor in doctors:
            if doctor.is_available_on_day(day):
                available_doctors.append(doctor)
        
        return available_doctors
    
    def get_doctor_statistics(self, db: Session, tenant_id: str = None) -> Dict[str, Any]:
        """Get doctor statistics filtered by tenant_id"""
        # Base query with tenant filter
        base_query = db.query(Doctor)
        if tenant_id:
            base_query = base_query.filter(Doctor.tenant_id == tenant_id)

        # Total and active doctors
        total_doctors = base_query.count()
        active_doctors = base_query.filter(Doctor.is_active == True).count()

        # Specialization counts
        specialization_query = base_query.filter(
            Doctor.is_active == True,
            Doctor.specialization.isnot(None)
        )
        specializations = specialization_query.all()
        specializations = [(d.specialization,) for d in specializations]
        
        specialization_counts = {}
        for (spec,) in specializations:
            if spec:
                # Handle comma-separated specializations
                specs = [s.strip() for s in spec.split(',')]
                for s in specs:
                    if s:
                        specialization_counts[s] = specialization_counts.get(s, 0) + 1
        
        # Experience distribution
        experience_query = base_query.filter(
            Doctor.is_active == True,
            Doctor.experience_years.isnot(None)
        )
        experience_doctors = [(d.experience_years,) for d in experience_query.all()]
        
        experience_distribution = {
            "0-2 years": 0,
            "2-5 years": 0,
            "5-10 years": 0,
            "10-20 years": 0,
            "20+ years": 0
        }
        
        for (years,) in experience_doctors:
            if years is not None:
                if years < 2:
                    experience_distribution["0-2 years"] += 1
                elif years < 5:
                    experience_distribution["2-5 years"] += 1
                elif years < 10:
                    experience_distribution["5-10 years"] += 1
                elif years < 20:
                    experience_distribution["10-20 years"] += 1
                else:
                    experience_distribution["20+ years"] += 1
        
        return {
            "total_doctors": total_doctors,
            "active_doctors": active_doctors,
            "specialization_counts": specialization_counts,
            "experience_distribution": experience_distribution
        }
    
    def validate_license_uniqueness(
        self, 
        db: Session, 
        license_number: str, 
        exclude_doctor_id: UUID = None
    ) -> bool:
        """Check if license number is unique"""
        query = db.query(Doctor).filter(
            Doctor.license_number == license_number.upper(),
            Doctor.is_active == True
        )
        
        if exclude_doctor_id:
            query = query.filter(Doctor.id != exclude_doctor_id)
        
        return query.first() is None
    
    def get_doctors_for_user_role(self, db: Session, user_role: str, user_id: UUID = None) -> List[Doctor]:
        """Get doctors based on user role permissions"""
        query = db.query(Doctor).join(Doctor.user).filter(Doctor.is_active == True)
        
        if user_role in ["patient", "receptionist"]:
            # Patients and receptionists can see all active doctors
            return query.all()
        elif user_role == "doctor" and user_id:
            # Doctors can see their own profile and other doctors
            return query.all()
        elif user_role in ["admin", "super_admin"]:
            # Admins can see all doctors including inactive ones
            return db.query(Doctor).join(Doctor.user).all()
        else:
            # Default: only active doctors
            return query.all()
    
    def convert_to_response_format(self, doctor: Doctor) -> Dict[str, Any]:
        """Convert doctor model to response format with computed fields"""
        response_data = doctor.to_dict()
        
        # Ensure all computed fields are included
        response_data.update({
            'full_name': doctor.get_full_name(),
            'availability_schedule': doctor.get_availability_schedule(),
            'specializations_list': doctor.get_specializations_list(),
            'experience_range': doctor.get_years_of_experience_range(),
        })
        
        return response_data