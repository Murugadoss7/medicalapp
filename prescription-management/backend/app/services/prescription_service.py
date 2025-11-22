"""
Prescription Service
Comprehensive business logic for prescription management with PDF generation support
Integrates with patients, doctors, medicines, and short keys modules
"""

from typing import List, Optional, Dict, Any, Tuple
from uuid import UUID, uuid4
from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, desc, asc, func, text
from decimal import Decimal

from app.models.prescription import Prescription, PrescriptionItem, generate_prescription_number
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.medicine import Medicine
from app.models.short_key import ShortKey, ShortKeyMedicine
from app.models.appointment import Appointment
from app.schemas.prescription import (
    PrescriptionCreate, PrescriptionUpdate, PrescriptionSearchParams,
    PrescriptionItemCreate, PrescriptionItemUpdate,
    ShortKeyPrescriptionCreate, PrescriptionValidationRequest,
    BulkPrescriptionRequest
)
from app.core.exceptions import (
    PrescriptionNotFoundError, PatientNotFoundError, DoctorNotFoundError,
    MedicineNotFoundError, ValidationError, BusinessRuleError,
    InvalidPrescriptionError, ConflictError
)
from app.core.config import settings


class PrescriptionService:
    """Service class for prescription management operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_prescription(
        self, 
        prescription_data: PrescriptionCreate, 
        created_by: UUID
    ) -> Prescription:
        """Create a new prescription with validation"""
        
        # Validate patient exists
        patient = self._get_patient_by_composite_key(
            prescription_data.patient_mobile_number,
            prescription_data.patient_first_name
        )
        
        if not patient or str(patient.id) != str(prescription_data.patient_uuid):
            raise PatientNotFoundError("Patient not found or UUID mismatch")
        
        # Validate doctor exists
        doctor = self._get_doctor_by_id(prescription_data.doctor_id)
        if not doctor:
            raise DoctorNotFoundError("Doctor not found")
        
        # Validate appointment if provided
        if prescription_data.appointment_id:
            appointment = self._get_appointment_by_id(prescription_data.appointment_id)
            if not appointment:
                raise ValidationError("Appointment not found")
            
            # Validate appointment belongs to patient and doctor
            if (appointment.patient_mobile_number != prescription_data.patient_mobile_number or
                appointment.patient_first_name != prescription_data.patient_first_name or
                str(appointment.doctor_id) != str(prescription_data.doctor_id)):
                raise ValidationError("Appointment does not match patient and doctor")
        
        # Handle short key prescription
        prescription_items = []
        if prescription_data.short_key_code:
            try:
                prescription_items = self._get_items_from_short_key(prescription_data.short_key_code)
            except ValidationError:
                # If short key doesn't exist, fall back to regular items
                prescription_items = prescription_data.items
        else:
            prescription_items = prescription_data.items
        
        # Validate prescription items
        self._validate_prescription_items(prescription_items)
        
        # Create prescription
        prescription = Prescription(
            id=uuid4(),
            prescription_number=generate_prescription_number(self.db),
            patient_mobile_number=prescription_data.patient_mobile_number,
            patient_first_name=prescription_data.patient_first_name,
            patient_uuid=prescription_data.patient_uuid,
            doctor_id=prescription_data.doctor_id,
            appointment_id=prescription_data.appointment_id,
            visit_date=prescription_data.visit_date,
            chief_complaint=prescription_data.chief_complaint,
            diagnosis=prescription_data.diagnosis,
            symptoms=prescription_data.symptoms,
            clinical_notes=prescription_data.clinical_notes,
            doctor_instructions=prescription_data.doctor_instructions,
            status=prescription_data.status,
            created_by=created_by,
            is_active=True
        )
        
        self.db.add(prescription)
        self.db.flush()  # Get prescription ID
        
        # Add prescription items
        for i, item_data in enumerate(prescription_items):
            medicine = self._get_medicine_by_id(item_data.medicine_id)
            if not medicine:
                raise MedicineNotFoundError(f"Medicine not found: {item_data.medicine_id}")
            
            item = PrescriptionItem(
                id=uuid4(),
                prescription_id=prescription.id,
                medicine_id=item_data.medicine_id,
                dosage=item_data.dosage,
                frequency=item_data.frequency,
                duration=item_data.duration,
                instructions=item_data.instructions,
                quantity=item_data.quantity,
                unit_price=item_data.unit_price,
                is_generic_substitution_allowed=item_data.is_generic_substitution_allowed,
                sequence_order=item_data.sequence_order or (i + 1),
                created_by=created_by,
                is_active=True
            )
            
            # Calculate total amount if unit price is provided
            if item.unit_price:
                item.total_amount = item.unit_price * item.quantity
            
            self.db.add(item)
        
        # Track short key usage if applicable
        if prescription_data.short_key_code:
            self._track_short_key_usage(prescription_data.short_key_code, created_by)
        
        self.db.commit()
        
        # Reload with relationships
        return self._get_prescription_with_relationships(prescription.id)
    
    def create_from_short_key(
        self, 
        short_key_data: ShortKeyPrescriptionCreate, 
        created_by: UUID
    ) -> Prescription:
        """Create prescription from short key"""
        
        # Convert to standard prescription create
        prescription_data = PrescriptionCreate(
            patient_mobile_number=short_key_data.patient_mobile_number,
            patient_first_name=short_key_data.patient_first_name,
            patient_uuid=short_key_data.patient_uuid,
            doctor_id=short_key_data.doctor_id,
            visit_date=short_key_data.visit_date,
            diagnosis=short_key_data.diagnosis,
            chief_complaint=short_key_data.chief_complaint,
            symptoms=short_key_data.symptoms,
            clinical_notes=short_key_data.clinical_notes,
            doctor_instructions=short_key_data.doctor_instructions,
            short_key_code=short_key_data.short_key_code,
            items=[]  # Will be populated from short key
        )
        
        return self.create_prescription(prescription_data, created_by)
    
    def get_prescription_by_id(self, prescription_id: UUID) -> Optional[Prescription]:
        """Get prescription by ID with relationships"""
        return self._get_prescription_with_relationships(prescription_id)
    
    def get_prescription_by_number(self, prescription_number: str) -> Optional[Prescription]:
        """Get prescription by prescription number"""
        prescription = self.db.query(Prescription).options(
            joinedload(Prescription.patient),
            joinedload(Prescription.doctor),
            joinedload(Prescription.appointment)
        ).filter(
            Prescription.prescription_number == prescription_number.upper(),
            Prescription.is_active == True
        ).first()
        
        return prescription
    
    def update_prescription(
        self, 
        prescription_id: UUID, 
        update_data: PrescriptionUpdate, 
        updated_by: UUID
    ) -> Optional[Prescription]:
        """Update prescription information"""
        prescription = self.get_prescription_by_id(prescription_id)
        if not prescription:
            raise PrescriptionNotFoundError("Prescription not found")
        
        # Check if prescription can be modified
        if not prescription.can_be_modified():
            raise BusinessRuleError("Prescription cannot be modified in current status")
        
        # Update fields
        update_dict = update_data.dict(exclude_unset=True)
        for field, value in update_dict.items():
            setattr(prescription, field, value)
        
        prescription.updated_at = datetime.utcnow()
        prescription.updated_by = updated_by
        
        self.db.commit()
        return self.get_prescription_by_id(prescription_id)
    
    def add_prescription_item(
        self, 
        prescription_id: UUID, 
        item_data: PrescriptionItemCreate, 
        created_by: UUID
    ) -> PrescriptionItem:
        """Add item to existing prescription"""
        prescription = self.get_prescription_by_id(prescription_id)
        if not prescription:
            raise PrescriptionNotFoundError("Prescription not found")
        
        if not prescription.can_be_modified():
            raise BusinessRuleError("Cannot add items to prescription in current status")
        
        # Validate medicine exists
        medicine = self._get_medicine_by_id(item_data.medicine_id)
        if not medicine:
            raise MedicineNotFoundError("Medicine not found")
        
        # Get next sequence order
        max_order = self.db.query(func.max(PrescriptionItem.sequence_order)).filter(
            PrescriptionItem.prescription_id == prescription_id,
            PrescriptionItem.is_active == True
        ).scalar() or 0
        
        item = PrescriptionItem(
            id=uuid4(),
            prescription_id=prescription_id,
            medicine_id=item_data.medicine_id,
            dosage=item_data.dosage,
            frequency=item_data.frequency,
            duration=item_data.duration,
            instructions=item_data.instructions,
            quantity=item_data.quantity,
            unit_price=item_data.unit_price,
            is_generic_substitution_allowed=item_data.is_generic_substitution_allowed,
            sequence_order=max_order + 1,
            created_by=created_by,
            is_active=True
        )
        
        if item.unit_price:
            item.total_amount = item.unit_price * item.quantity
        
        self.db.add(item)
        self.db.commit()
        
        return item
    
    def update_prescription_item(
        self, 
        item_id: UUID, 
        item_data: PrescriptionItemUpdate, 
        updated_by: UUID
    ) -> Optional[PrescriptionItem]:
        """Update prescription item"""
        item = self.db.query(PrescriptionItem).filter(
            PrescriptionItem.id == item_id,
            PrescriptionItem.is_active == True
        ).first()
        
        if not item:
            raise ValidationError("Prescription item not found")
        
        # Check if prescription can be modified
        prescription = self.get_prescription_by_id(item.prescription_id)
        if not prescription.can_be_modified():
            raise BusinessRuleError("Cannot modify items in current prescription status")
        
        # Update fields
        update_dict = item_data.dict(exclude_unset=True)
        for field, value in update_dict.items():
            setattr(item, field, value)
        
        # Recalculate total if price or quantity changed
        if item.unit_price and item.quantity:
            item.total_amount = item.unit_price * item.quantity
        
        item.updated_at = datetime.utcnow()
        item.updated_by = updated_by
        
        self.db.commit()
        return item
    
    def remove_prescription_item(self, item_id: UUID) -> bool:
        """Remove prescription item (soft delete)"""
        item = self.db.query(PrescriptionItem).filter(
            PrescriptionItem.id == item_id,
            PrescriptionItem.is_active == True
        ).first()
        
        if not item:
            return False
        
        # Check if prescription can be modified
        prescription = self.get_prescription_by_id(item.prescription_id)
        if not prescription.can_be_modified():
            raise BusinessRuleError("Cannot remove items in current prescription status")
        
        item.is_active = False
        item.updated_at = datetime.utcnow()
        
        self.db.commit()
        return True
    
    def search_prescriptions(self, search_params: PrescriptionSearchParams) -> Tuple[List[Prescription], int]:
        """Search prescriptions with filtering and pagination"""
        query = self.db.query(Prescription).options(
            joinedload(Prescription.patient),
            joinedload(Prescription.doctor),
            joinedload(Prescription.appointment)
        ).filter(Prescription.is_active == True)
        
        # Apply filters
        if search_params.patient_mobile_number:
            query = query.filter(Prescription.patient_mobile_number == search_params.patient_mobile_number)
        
        if search_params.patient_first_name:
            query = query.filter(Prescription.patient_first_name.ilike(f"%{search_params.patient_first_name}%"))
        
        if search_params.patient_uuid:
            query = query.filter(Prescription.patient_uuid == search_params.patient_uuid)
        
        if search_params.doctor_id:
            query = query.filter(Prescription.doctor_id == search_params.doctor_id)
        
        if search_params.status:
            query = query.filter(Prescription.status == search_params.status)
        
        if search_params.is_printed is not None:
            query = query.filter(Prescription.is_printed == search_params.is_printed)
        
        if search_params.visit_date_from:
            query = query.filter(Prescription.visit_date >= search_params.visit_date_from)
        
        if search_params.visit_date_to:
            query = query.filter(Prescription.visit_date <= search_params.visit_date_to)
        
        if search_params.created_from:
            query = query.filter(func.date(Prescription.created_at) >= search_params.created_from)
        
        if search_params.created_to:
            query = query.filter(func.date(Prescription.created_at) <= search_params.created_to)
        
        if search_params.diagnosis:
            query = query.filter(Prescription.diagnosis.ilike(f"%{search_params.diagnosis}%"))
        
        if search_params.prescription_number:
            query = query.filter(Prescription.prescription_number.ilike(f"%{search_params.prescription_number}%"))
        
        # Get total count
        total = query.count()
        
        # Apply sorting
        sort_field = getattr(Prescription, search_params.sort_by, Prescription.visit_date)
        if search_params.sort_order == "asc":
            query = query.order_by(asc(sort_field))
        else:
            query = query.order_by(desc(sort_field))
        
        # Apply pagination
        offset = (search_params.page - 1) * search_params.page_size
        prescriptions = query.offset(offset).limit(search_params.page_size).all()
        
        return prescriptions, total
    
    def get_patient_prescriptions(
        self, 
        mobile_number: str, 
        first_name: str, 
        limit: int = 50
    ) -> List[Prescription]:
        """Get prescriptions for a patient"""
        return self.db.query(Prescription).options(
            joinedload(Prescription.doctor)
        ).filter(
            Prescription.patient_mobile_number == mobile_number,
            Prescription.patient_first_name == first_name,
            Prescription.is_active == True
        ).order_by(desc(Prescription.visit_date)).limit(limit).all()
    
    def get_doctor_prescriptions(
        self, 
        doctor_id: UUID, 
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        limit: int = 100
    ) -> List[Prescription]:
        """Get prescriptions created by a doctor"""
        query = self.db.query(Prescription).options(
            joinedload(Prescription.patient)
        ).filter(
            Prescription.doctor_id == doctor_id,
            Prescription.is_active == True
        )
        
        if start_date:
            query = query.filter(Prescription.visit_date >= start_date)
        
        if end_date:
            query = query.filter(Prescription.visit_date <= end_date)
        
        return query.order_by(desc(Prescription.visit_date)).limit(limit).all()
    
    def update_prescription_status(
        self, 
        prescription_id: UUID, 
        status: str, 
        updated_by: UUID,
        notes: Optional[str] = None
    ) -> Optional[Prescription]:
        """Update prescription status"""
        prescription = self.get_prescription_by_id(prescription_id)
        if not prescription:
            raise PrescriptionNotFoundError("Prescription not found")
        
        # Validate status transition
        valid_transitions = {
            'draft': ['active', 'cancelled'],
            'active': ['dispensed', 'completed', 'cancelled', 'expired'],
            'dispensed': ['completed'],
            'completed': [],  # Terminal state
            'cancelled': [],  # Terminal state
            'expired': ['active']  # Can be reactivated
        }
        
        if status not in valid_transitions.get(prescription.status, []):
            raise BusinessRuleError(f"Invalid status transition from {prescription.status} to {status}")
        
        prescription.status = status
        prescription.updated_at = datetime.utcnow()
        prescription.updated_by = updated_by
        
        if notes:
            prescription.clinical_notes = f"{prescription.clinical_notes or ''}\n[{datetime.utcnow()}] Status changed to {status}: {notes}".strip()
        
        self.db.commit()
        return self.get_prescription_by_id(prescription_id)
    
    def mark_as_printed(
        self, 
        prescription_id: UUID, 
        template: str = "default"
    ) -> Optional[Prescription]:
        """Mark prescription as printed"""
        prescription = self.get_prescription_by_id(prescription_id)
        if not prescription:
            raise PrescriptionNotFoundError("Prescription not found")
        
        prescription.is_printed = True
        prescription.printed_at = datetime.utcnow()
        prescription.template_used = template
        
        self.db.commit()
        return prescription
    
    def validate_prescription(self, validation_request: PrescriptionValidationRequest) -> Dict[str, Any]:
        """Validate prescription data"""
        errors = []
        warnings = []
        
        # Validate patient
        patient = self._get_patient_by_composite_key(
            validation_request.patient_mobile_number,
            validation_request.patient_first_name
        )
        if not patient:
            errors.append("Patient not found")
        
        # Validate doctor
        doctor = self._get_doctor_by_id(validation_request.doctor_id)
        if not doctor:
            errors.append("Doctor not found")
        
        # Validate items
        if not validation_request.items:
            errors.append("At least one prescription item is required")
        else:
            medicine_ids = []
            for i, item in enumerate(validation_request.items):
                medicine = self._get_medicine_by_id(item.medicine_id)
                if not medicine:
                    errors.append(f"Medicine not found for item {i + 1}")
                else:
                    if medicine.id in medicine_ids:
                        warnings.append(f"Duplicate medicine in prescription: {medicine.name}")
                    medicine_ids.append(medicine.id)
        
        return {
            "is_valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings
        }
    
    def bulk_operation(
        self, 
        bulk_request: BulkPrescriptionRequest, 
        performed_by: UUID
    ) -> Dict[str, Any]:
        """Perform bulk operations on prescriptions"""
        results = []
        successful = 0
        failed = 0
        
        for prescription_id in bulk_request.prescription_ids:
            try:
                if bulk_request.operation == "cancel":
                    self.update_prescription_status(
                        prescription_id, 
                        "cancelled", 
                        performed_by, 
                        bulk_request.reason
                    )
                elif bulk_request.operation == "complete":
                    self.update_prescription_status(
                        prescription_id, 
                        "completed", 
                        performed_by, 
                        bulk_request.reason
                    )
                elif bulk_request.operation == "print":
                    self.mark_as_printed(
                        prescription_id, 
                        bulk_request.template or "default"
                    )
                elif bulk_request.operation == "activate":
                    self.update_prescription_status(
                        prescription_id, 
                        "active", 
                        performed_by, 
                        bulk_request.reason
                    )
                
                results.append({
                    "prescription_id": str(prescription_id),
                    "success": True
                })
                successful += 1
                
            except Exception as e:
                results.append({
                    "prescription_id": str(prescription_id),
                    "success": False,
                    "error": str(e)
                })
                failed += 1
        
        return {
            "total_requested": len(bulk_request.prescription_ids),
            "successful": successful,
            "failed": failed,
            "results": results
        }
    
    def get_prescription_statistics(self, doctor_id: Optional[UUID] = None) -> Dict[str, Any]:
        """Get prescription statistics"""
        base_query = self.db.query(Prescription).filter(Prescription.is_active == True)
        
        if doctor_id:
            base_query = base_query.filter(Prescription.doctor_id == doctor_id)
        
        total = base_query.count()
        
        status_counts = {}
        for status in ['draft', 'active', 'dispensed', 'completed', 'cancelled', 'expired']:
            count = base_query.filter(Prescription.status == status).count()
            status_counts[f"{status}_prescriptions"] = count
        
        printed_count = base_query.filter(Prescription.is_printed == True).count()
        
        today = date.today()
        prescriptions_today = base_query.filter(
            func.date(Prescription.created_at) == today
        ).count()
        
        week_start = today - timedelta(days=today.weekday())
        prescriptions_this_week = base_query.filter(
            func.date(Prescription.created_at) >= week_start
        ).count()
        
        month_start = today.replace(day=1)
        prescriptions_this_month = base_query.filter(
            func.date(Prescription.created_at) >= month_start
        ).count()
        
        return {
            "total_prescriptions": total,
            "printed_prescriptions": printed_count,
            "prescriptions_today": prescriptions_today,
            "prescriptions_this_week": prescriptions_this_week,
            "prescriptions_this_month": prescriptions_this_month,
            **status_counts
        }
    
    # Private helper methods
    
    def _get_patient_by_composite_key(self, mobile_number: str, first_name: str) -> Optional[Patient]:
        """Get patient by composite key"""
        return self.db.query(Patient).filter(
            Patient.mobile_number == mobile_number,
            Patient.first_name == first_name,
            Patient.is_active == True
        ).first()
    
    def _get_doctor_by_id(self, doctor_id: UUID) -> Optional[Doctor]:
        """Get doctor by ID"""
        print(f"[DEBUG] Looking for doctor with ID: {doctor_id}")
        doctor = self.db.query(Doctor).filter(
            Doctor.id == doctor_id,
            Doctor.is_active == True
        ).first()
        if doctor:
            print(f"[DEBUG] Found doctor: {doctor.id}, active={doctor.is_active}")
        else:
            print(f"[DEBUG] Doctor not found or not active")
            # Check if doctor exists but is inactive
            inactive = self.db.query(Doctor).filter(Doctor.id == doctor_id).first()
            if inactive:
                print(f"[DEBUG] Doctor exists but is_active={inactive.is_active}")
            else:
                print(f"[DEBUG] Doctor ID does not exist in database at all")
        return doctor
    
    def _get_medicine_by_id(self, medicine_id: UUID) -> Optional[Medicine]:
        """Get medicine by ID"""
        return self.db.query(Medicine).filter(
            Medicine.id == medicine_id,
            Medicine.is_active == True
        ).first()
    
    def _get_appointment_by_id(self, appointment_id: UUID) -> Optional[Appointment]:
        """Get appointment by ID"""
        return self.db.query(Appointment).filter(
            Appointment.id == appointment_id,
            Appointment.is_active == True
        ).first()
    
    def _get_prescription_with_relationships(self, prescription_id: UUID) -> Optional[Prescription]:
        """Get prescription with all relationships loaded"""
        return self.db.query(Prescription).options(
            joinedload(Prescription.patient),
            joinedload(Prescription.doctor),
            joinedload(Prescription.appointment)
        ).filter(
            Prescription.id == prescription_id,
            Prescription.is_active == True
        ).first()
    
    def _get_items_from_short_key(self, short_key_code: str) -> List[PrescriptionItemCreate]:
        """Get prescription items from short key"""
        short_key = self.db.query(ShortKey).filter(
            ShortKey.code == short_key_code.upper(),
            ShortKey.is_active == True
        ).first()
        
        if not short_key:
            raise ValidationError(f"Short key not found: {short_key_code}")
        
        # Get medicines separately to avoid eager loading issues
        sk_medicines = self.db.query(ShortKeyMedicine).filter(
            ShortKeyMedicine.short_key_id == short_key.id,
            ShortKeyMedicine.is_active == True
        ).order_by(ShortKeyMedicine.sequence_order).all()
        
        items = []
        for sk_medicine in sk_medicines:
            item = PrescriptionItemCreate(
                medicine_id=sk_medicine.medicine_id,
                dosage=sk_medicine.default_dosage,
                frequency=sk_medicine.default_frequency,
                duration=sk_medicine.default_duration,
                instructions=sk_medicine.instructions,
                quantity=sk_medicine.default_quantity or 1,
                sequence_order=sk_medicine.sequence_order
            )
            items.append(item)
        
        return items
    
    def _validate_prescription_items(self, items: List[PrescriptionItemCreate]) -> None:
        """Validate prescription items"""
        if not items:
            raise ValidationError("At least one prescription item is required")
        
        medicine_ids = set()
        for item in items:
            if item.medicine_id in medicine_ids:
                raise ValidationError("Duplicate medicines in prescription")
            medicine_ids.add(item.medicine_id)
            
            # Validate medicine exists
            medicine = self._get_medicine_by_id(item.medicine_id)
            if not medicine:
                raise MedicineNotFoundError(f"Medicine not found: {item.medicine_id}")
    
    def _track_short_key_usage(self, short_key_code: str, used_by: UUID) -> None:
        """Track short key usage for analytics"""
        short_key = self.db.query(ShortKey).filter(
            ShortKey.code == short_key_code.upper(),
            ShortKey.is_active == True
        ).first()
        
        if short_key:
            short_key.usage_count = (short_key.usage_count or 0) + 1
            short_key.last_used_at = datetime.utcnow()
            self.db.commit()


def get_prescription_service(db: Session) -> PrescriptionService:
    """Factory function to get prescription service instance"""
    return PrescriptionService(db)