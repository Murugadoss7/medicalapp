"""
Patient Service for Composite Key Management
Handles family registration with same mobile number
Implements business logic for (mobile_number + first_name) composite key
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc, asc
from typing import Optional, List, Dict, Any, Tuple
from uuid import UUID
from datetime import date
import logging

from app.models.patient import Patient, get_family_members, check_family_limit, find_primary_family_member, validate_family_registration
from app.schemas.patient import PatientCreate, PatientUpdate, PatientCreateFamily, PatientSearchParams, CompositeKey
from app.core.config import settings
from app.core.exceptions import PatientNotFoundError, ValidationError, BusinessRuleError

logger = logging.getLogger(__name__)


class PatientService:
    """Service class for patient management with composite key support"""
    
    def __init__(self):
        self.max_family_members = getattr(settings, 'MAX_FAMILY_MEMBERS_PER_MOBILE', 10)
    
    # Core CRUD Operations with Composite Key
    
    def create_patient(self, db: Session, patient_data: PatientCreate, created_by: Optional[UUID] = None) -> Patient:
        """
        Create a new patient with composite key validation
        Handles primary family member and family member creation
        """
        # Validate family registration constraints
        validation_result = validate_family_registration(
            db=db,
            mobile_number=patient_data.mobile_number,
            first_name=patient_data.first_name,
            relationship=patient_data.relationship_to_primary
        )
        
        if not validation_result['is_valid']:
            raise ValidationError(f"Validation failed: {', '.join(validation_result['errors'])}")
        
        # Create patient instance
        patient = Patient(
            mobile_number=patient_data.mobile_number,
            first_name=patient_data.first_name,
            last_name=patient_data.last_name,
            date_of_birth=patient_data.date_of_birth,
            gender=patient_data.gender,
            email=patient_data.email,
            address=patient_data.address,
            relationship_to_primary=patient_data.relationship_to_primary,
            primary_contact_mobile=patient_data.primary_contact_mobile,
            notes=patient_data.notes,
            created_by=created_by,
            tenant_id=patient_data.tenant_id  # Multi-tenancy: set tenant_id
        )
        
        # Set emergency contact if provided
        if patient_data.emergency_contact:
            patient.set_emergency_contact(
                name=patient_data.emergency_contact.name,
                phone=patient_data.emergency_contact.phone,
                relationship=patient_data.emergency_contact.relationship
            )
        
        try:
            db.add(patient)
            db.commit()
            # Don't refresh after commit - RLS blocks it

            logger.info(f"Created patient: {patient.mobile_number} - {patient.get_full_name()}")
            return patient
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error creating patient: {str(e)}")
            raise BusinessRuleError(f"Failed to create patient: {str(e)}")
    
    def create_family_member(
        self, 
        db: Session, 
        family_mobile: str, 
        member_data: PatientCreateFamily, 
        created_by: Optional[UUID] = None
    ) -> Patient:
        """
        Create a family member for an existing family
        Automatically sets mobile_number and validates family constraints
        """
        # Validate that primary family member exists
        primary_member = find_primary_family_member(db, family_mobile)
        if not primary_member:
            raise ValidationError("Primary family member must be registered first")

        # Create full patient data - inherit tenant_id from primary member
        patient_data = PatientCreate(
            mobile_number=family_mobile,
            first_name=member_data.first_name,
            last_name=member_data.last_name,
            date_of_birth=member_data.date_of_birth,
            gender=member_data.gender,
            email=member_data.email,
            address=member_data.address,
            relationship_to_primary=member_data.relationship_to_primary,
            primary_contact_mobile=member_data.primary_contact_mobile or family_mobile,
            emergency_contact=member_data.emergency_contact,
            notes=member_data.notes,
            tenant_id=primary_member.tenant_id  # Inherit tenant from primary member
        )
        
        return self.create_patient(db, patient_data, created_by)
    
    def get_patient_by_composite_key(self, db: Session, mobile_number: str, first_name: str) -> Optional[Patient]:
        """Get patient by composite key (mobile_number + first_name)"""
        return db.query(Patient).filter(
            Patient.mobile_number == mobile_number,
            Patient.first_name == first_name,
            Patient.is_active == True
        ).first()
    
    def get_patient_by_id(self, db: Session, patient_id: UUID) -> Optional[Patient]:
        """Get patient by UUID (for internal references)"""
        return db.query(Patient).filter(
            Patient.id == patient_id,
            Patient.is_active == True
        ).first()
    
    def update_patient(
        self, 
        db: Session, 
        mobile_number: str, 
        first_name: str, 
        patient_data: PatientUpdate
    ) -> Optional[Patient]:
        """
        Update patient by composite key
        Note: Cannot update composite key fields (mobile_number, first_name)
        """
        patient = self.get_patient_by_composite_key(db, mobile_number, first_name)
        if not patient:
            raise PatientNotFoundError(f"Patient not found: {mobile_number} - {first_name}")
        
        update_data = patient_data.dict(exclude_unset=True)
        
        for field, value in update_data.items():
            if field == 'emergency_contact' and value:
                patient.set_emergency_contact(
                    name=value.name,
                    phone=value.phone,
                    relationship=value.relationship
                )
            else:
                setattr(patient, field, value)
        
        try:
            db.commit()
            # Don't refresh after commit - RLS blocks it

            logger.info(f"Updated patient: {patient.mobile_number} - {patient.get_full_name()}")
            return patient
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error updating patient: {str(e)}")
            raise BusinessRuleError(f"Failed to update patient: {str(e)}")
    
    def deactivate_patient(self, db: Session, mobile_number: str, first_name: str) -> bool:
        """Deactivate patient (soft delete)"""
        patient = self.get_patient_by_composite_key(db, mobile_number, first_name)
        if not patient:
            raise PatientNotFoundError(f"Patient not found: {mobile_number} - {first_name}")
        
        patient.is_active = False
        
        try:
            db.commit()
            logger.info(f"Deactivated patient: {patient.mobile_number} - {patient.get_full_name()}")
            return True
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error deactivating patient: {str(e)}")
            raise BusinessRuleError(f"Failed to deactivate patient: {str(e)}")
    
    def reactivate_patient(self, db: Session, mobile_number: str, first_name: str) -> Optional[Patient]:
        """Reactivate a deactivated patient"""
        patient = db.query(Patient).filter(
            Patient.mobile_number == mobile_number,
            Patient.first_name == first_name,
            Patient.is_active == False
        ).first()
        
        if not patient:
            raise PatientNotFoundError(f"Inactive patient not found: {mobile_number} - {first_name}")
        
        patient.is_active = True
        
        try:
            db.commit()
            # Don't refresh after commit - RLS blocks it
            logger.info(f"Reactivated patient: {patient.mobile_number} - {patient.get_full_name()}")
            return patient
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error reactivating patient: {str(e)}")
            raise BusinessRuleError(f"Failed to reactivate patient: {str(e)}")
    
    # Family Management Operations
    
    def get_family_members(self, db: Session, mobile_number: str) -> List[Patient]:
        """Get all family members for a mobile number"""
        return get_family_members(db, mobile_number)
    
    def get_family_with_details(self, db: Session, mobile_number: str) -> Dict[str, Any]:
        """Get complete family information with primary member details"""
        family_members = self.get_family_members(db, mobile_number)
        primary_member = find_primary_family_member(db, mobile_number)
        
        return {
            'family_mobile': mobile_number,
            'primary_member': primary_member,
            'family_members': family_members,
            'total_members': len(family_members)
        }
    
    def check_family_registration_eligibility(self, db: Session, mobile_number: str) -> Dict[str, Any]:
        """Check if new family member can be registered"""
        validation_result = {
            'can_register': True,
            'reasons': [],
            'current_count': 0,
            'max_allowed': self.max_family_members
        }
        
        current_count = db.query(Patient).filter(
            Patient.mobile_number == mobile_number,
            Patient.is_active == True
        ).count()
        
        validation_result['current_count'] = current_count
        
        if current_count >= self.max_family_members:
            validation_result['can_register'] = False
            validation_result['reasons'].append(f"Maximum {self.max_family_members} family members allowed")
        
        # Check if primary member exists
        primary_member = find_primary_family_member(db, mobile_number)
        if not primary_member and current_count > 0:
            validation_result['can_register'] = False
            validation_result['reasons'].append("No primary family member found")
        
        return validation_result
    
    # Search and Query Operations
    
    def search_patients(self, db: Session, search_params: PatientSearchParams) -> Tuple[List[Patient], int]:
        """
        Search patients with filtering, sorting, and pagination
        Returns (patients, total_count)
        """
        query = db.query(Patient)
        
        # Apply filters
        if search_params.mobile_number:
            query = query.filter(Patient.mobile_number.ilike(f"%{search_params.mobile_number}%"))
        
        if search_params.first_name:
            query = query.filter(Patient.first_name.ilike(f"%{search_params.first_name}%"))
        
        if search_params.last_name:
            query = query.filter(Patient.last_name.ilike(f"%{search_params.last_name}%"))
        
        if search_params.email:
            query = query.filter(Patient.email.ilike(f"%{search_params.email}%"))
        
        if search_params.gender:
            query = query.filter(Patient.gender == search_params.gender)
        
        if search_params.relationship:
            query = query.filter(Patient.relationship_to_primary == search_params.relationship)
        
        if search_params.is_active is not None:
            query = query.filter(Patient.is_active == search_params.is_active)
        
        # Age filtering (requires calculation)
        if search_params.age_min is not None or search_params.age_max is not None:
            today = date.today()
            
            if search_params.age_min is not None:
                max_birth_date = date(today.year - search_params.age_min, today.month, today.day)
                query = query.filter(Patient.date_of_birth <= max_birth_date)
            
            if search_params.age_max is not None:
                min_birth_date = date(today.year - search_params.age_max - 1, today.month, today.day)
                query = query.filter(Patient.date_of_birth >= min_birth_date)
        
        # Get total count before pagination
        total_count = query.count()
        
        # Apply sorting
        sort_column = getattr(Patient, search_params.sort_by, Patient.first_name)
        if search_params.sort_order == "desc":
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(asc(sort_column))
        
        # Apply pagination
        offset = (search_params.page - 1) * search_params.page_size
        patients = query.offset(offset).limit(search_params.page_size).all()
        
        return patients, total_count
    
    def get_patients_by_mobile(self, db: Session, mobile_number: str) -> List[Patient]:
        """Get all patients (family members) for a mobile number"""
        return db.query(Patient).filter(
            Patient.mobile_number == mobile_number,
            Patient.is_active == True
        ).order_by(Patient.relationship_to_primary, Patient.first_name).all()
    
    def get_patients_by_email(self, db: Session, email: str) -> List[Patient]:
        """Get patients by email address"""
        return db.query(Patient).filter(
            Patient.email == email,
            Patient.is_active == True
        ).all()
    
    # Statistics and Analytics
    
    def get_patient_statistics(self, db: Session, tenant_id: str = None) -> Dict[str, Any]:
        """Get patient statistics filtered by tenant_id"""
        # Base query with tenant filter
        base_query = db.query(Patient).filter(Patient.is_active == True)
        if tenant_id:
            base_query = base_query.filter(Patient.tenant_id == tenant_id)

        total_patients = base_query.count()

        # Total families
        families_query = db.query(Patient.mobile_number).filter(Patient.is_active == True)
        if tenant_id:
            families_query = families_query.filter(Patient.tenant_id == tenant_id)
        total_families = families_query.distinct().count()

        # Gender distribution
        gender_query = db.query(
            Patient.gender,
            func.count(Patient.id).label('count')
        ).filter(Patient.is_active == True)
        if tenant_id:
            gender_query = gender_query.filter(Patient.tenant_id == tenant_id)
        gender_stats = gender_query.group_by(Patient.gender).all()

        # Relationship distribution
        relationship_query = db.query(
            Patient.relationship_to_primary,
            func.count(Patient.id).label('count')
        ).filter(Patient.is_active == True)
        if tenant_id:
            relationship_query = relationship_query.filter(Patient.tenant_id == tenant_id)
        relationship_stats = relationship_query.group_by(Patient.relationship_to_primary).all()

        # Age groups (approximate)
        today = date.today()
        children_query = base_query.filter(
            Patient.date_of_birth >= date(today.year - 18, today.month, today.day)
        )
        adults_query = base_query.filter(
            Patient.date_of_birth < date(today.year - 18, today.month, today.day),
            Patient.date_of_birth >= date(today.year - 65, today.month, today.day)
        )
        seniors_query = base_query.filter(
            Patient.date_of_birth < date(today.year - 65, today.month, today.day)
        )

        age_groups = {
            'children': children_query.count(),
            'adults': adults_query.count(),
            'seniors': seniors_query.count()
        }
        
        return {
            'total_patients': total_patients,
            'total_families': total_families,
            'average_family_size': round(total_patients / total_families, 2) if total_families > 0 else 0,
            'gender_distribution': {row.gender: row.count for row in gender_stats},
            'relationship_distribution': {row.relationship_to_primary: row.count for row in relationship_stats},
            'age_groups': age_groups
        }
    
    # Validation Helpers
    
    def validate_composite_key_exists(self, db: Session, mobile_number: str, first_name: str) -> bool:
        """Check if patient exists by composite key"""
        return db.query(Patient).filter(
            Patient.mobile_number == mobile_number,
            Patient.first_name == first_name,
            Patient.is_active == True
        ).first() is not None
    
    def validate_family_member_creation(
        self, 
        db: Session, 
        mobile_number: str, 
        first_name: str, 
        relationship: str
    ) -> Dict[str, Any]:
        """Validate family member creation constraints"""
        return validate_family_registration(db, mobile_number, first_name, relationship)
    
    # Data Export and Bulk Operations
    
    def get_all_patients(self, db: Session, include_inactive: bool = False) -> List[Patient]:
        """Get all patients (for admin/export purposes)"""
        query = db.query(Patient)
        if not include_inactive:
            query = query.filter(Patient.is_active == True)
        return query.order_by(Patient.mobile_number, Patient.first_name).all()
    
    def bulk_update_family_contact(self, db: Session, old_mobile: str, new_mobile: str) -> int:
        """Bulk update primary contact mobile for family members"""
        updated_count = db.query(Patient).filter(
            Patient.primary_contact_mobile == old_mobile
        ).update({'primary_contact_mobile': new_mobile})
        
        db.commit()
        return updated_count