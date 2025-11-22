"""
Medicine Service for Drug Catalog Management
Handles medicine CRUD operations, search, and drug interaction checking
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc, asc
from typing import Optional, List, Dict, Any, Tuple
from uuid import UUID
from decimal import Decimal
import logging

from app.models.medicine import Medicine, search_medicines, find_medicine_by_name, get_medicines_by_category, check_drug_interactions, validate_medicine_data
from app.schemas.medicine import MedicineCreate, MedicineUpdate, MedicineSearchParams
from app.core.exceptions import (
    MedicineNotFoundError, 
    ValidationError, 
    BusinessRuleError,
    DuplicateError
)

logger = logging.getLogger(__name__)


class MedicineService:
    """Service class for medicine management"""
    
    def __init__(self):
        pass
    
    # Core CRUD Operations
    
    def create_medicine(self, db: Session, medicine_data: MedicineCreate, created_by: Optional[UUID] = None) -> Medicine:
        """
        Create a new medicine in the catalog
        """
        # Check for duplicate medicine name
        existing_medicine = find_medicine_by_name(db, medicine_data.name, exact_match=True)
        if existing_medicine and existing_medicine.is_active:
            raise DuplicateError(f"Medicine with name '{medicine_data.name}' already exists")
        
        # Validate medicine data
        validation_errors = validate_medicine_data(medicine_data.dict())
        if validation_errors:
            raise ValidationError(f"Validation failed: {', '.join(validation_errors)}")
        
        # Create medicine instance
        medicine = Medicine(
            name=medicine_data.name,
            generic_name=medicine_data.generic_name,
            composition=medicine_data.composition,
            manufacturer=medicine_data.manufacturer,
            strength=medicine_data.strength,
            drug_category=medicine_data.drug_category,
            price=medicine_data.price,
            requires_prescription=medicine_data.requires_prescription,
            atc_code=medicine_data.atc_code,
            storage_conditions=medicine_data.storage_conditions,
            contraindications=medicine_data.contraindications,
            side_effects=medicine_data.side_effects,
            created_by=created_by
        )
        
        # Set dosage forms
        if medicine_data.dosage_forms:
            medicine.set_dosage_forms(medicine_data.dosage_forms)
        
        try:
            db.add(medicine)
            db.commit()
            db.refresh(medicine)
            
            logger.info(f"Created medicine: {medicine.name}")
            return medicine
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error creating medicine: {str(e)}")
            raise BusinessRuleError(f"Failed to create medicine: {str(e)}")
    
    def get_medicine_by_id(self, db: Session, medicine_id: UUID) -> Optional[Medicine]:
        """Get medicine by ID"""
        return db.query(Medicine).filter(
            Medicine.id == medicine_id,
            Medicine.is_active == True
        ).first()
    
    def get_medicine_by_name(self, db: Session, name: str, exact_match: bool = False) -> Optional[Medicine]:
        """Get medicine by name"""
        return find_medicine_by_name(db, name, exact_match)
    
    def update_medicine(self, db: Session, medicine_id: UUID, medicine_data: MedicineUpdate) -> Optional[Medicine]:
        """
        Update medicine information
        """
        medicine = self.get_medicine_by_id(db, medicine_id)
        if not medicine:
            raise MedicineNotFoundError(f"Medicine not found: {medicine_id}")
        
        # Check for name conflicts if name is being updated
        if medicine_data.name and medicine_data.name != medicine.name:
            existing_medicine = find_medicine_by_name(db, medicine_data.name, exact_match=True)
            if existing_medicine and existing_medicine.id != medicine_id and existing_medicine.is_active:
                raise DuplicateError(f"Medicine with name '{medicine_data.name}' already exists")
        
        update_data = medicine_data.dict(exclude_unset=True)
        
        # Handle dosage forms specially
        if 'dosage_forms' in update_data:
            dosage_forms = update_data.pop('dosage_forms')
            if dosage_forms is not None:
                medicine.set_dosage_forms(dosage_forms)
        
        # Update other fields
        for field, value in update_data.items():
            if hasattr(medicine, field):
                setattr(medicine, field, value)
        
        try:
            db.commit()
            db.refresh(medicine)
            
            logger.info(f"Updated medicine: {medicine.name}")
            return medicine
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error updating medicine: {str(e)}")
            raise BusinessRuleError(f"Failed to update medicine: {str(e)}")
    
    def deactivate_medicine(self, db: Session, medicine_id: UUID) -> bool:
        """Deactivate medicine (soft delete)"""
        medicine = self.get_medicine_by_id(db, medicine_id)
        if not medicine:
            raise MedicineNotFoundError(f"Medicine not found: {medicine_id}")
        
        medicine.is_active = False
        
        try:
            db.commit()
            logger.info(f"Deactivated medicine: {medicine.name}")
            return True
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error deactivating medicine: {str(e)}")
            raise BusinessRuleError(f"Failed to deactivate medicine: {str(e)}")
    
    def reactivate_medicine(self, db: Session, medicine_id: UUID) -> Optional[Medicine]:
        """Reactivate a deactivated medicine"""
        medicine = db.query(Medicine).filter(
            Medicine.id == medicine_id,
            Medicine.is_active == False
        ).first()
        
        if not medicine:
            raise MedicineNotFoundError(f"Inactive medicine not found: {medicine_id}")
        
        # Check for name conflicts before reactivating
        existing_medicine = find_medicine_by_name(db, medicine.name, exact_match=True)
        if existing_medicine and existing_medicine.id != medicine_id and existing_medicine.is_active:
            raise DuplicateError(f"Cannot reactivate: Medicine with name '{medicine.name}' already exists")
        
        medicine.is_active = True
        
        try:
            db.commit()
            db.refresh(medicine)
            logger.info(f"Reactivated medicine: {medicine.name}")
            return medicine
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error reactivating medicine: {str(e)}")
            raise BusinessRuleError(f"Failed to reactivate medicine: {str(e)}")
    
    # Search and Query Operations
    
    def search_medicines(self, db: Session, search_params: MedicineSearchParams) -> Tuple[List[Medicine], int]:
        """
        Search medicines with filtering, sorting, and pagination
        Returns (medicines, total_count)
        """
        query = db.query(Medicine)
        
        # Apply active filter
        if search_params.is_active is not None:
            query = query.filter(Medicine.is_active == search_params.is_active)
        
        # Apply text search
        if search_params.query:
            search_filter = or_(
                Medicine.name.ilike(f"%{search_params.query}%"),
                Medicine.generic_name.ilike(f"%{search_params.query}%"),
                Medicine.composition.ilike(f"%{search_params.query}%")
            )
            query = query.filter(search_filter)
        
        # Apply category filter
        if search_params.category:
            query = query.filter(Medicine.drug_category.ilike(f"%{search_params.category}%"))
        
        # Apply manufacturer filter
        if search_params.manufacturer:
            query = query.filter(Medicine.manufacturer.ilike(f"%{search_params.manufacturer}%"))
        
        # Apply prescription requirement filter
        if search_params.requires_prescription is not None:
            query = query.filter(Medicine.requires_prescription == search_params.requires_prescription)
        
        # Apply dosage form filter
        if search_params.dosage_form:
            query = query.filter(Medicine.dosage_forms.any(search_params.dosage_form.lower()))
        
        # Apply price filters
        if search_params.min_price is not None:
            query = query.filter(Medicine.price >= search_params.min_price)
        
        if search_params.max_price is not None:
            query = query.filter(Medicine.price <= search_params.max_price)
        
        # Get total count before pagination
        total_count = query.count()
        
        # Apply sorting
        sort_column = getattr(Medicine, search_params.sort_by, Medicine.name)
        if search_params.sort_order == "desc":
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(asc(sort_column))
        
        # Apply pagination
        offset = (search_params.page - 1) * search_params.page_size
        medicines = query.offset(offset).limit(search_params.page_size).all()
        
        return medicines, total_count
    
    def get_medicines_by_category(self, db: Session, category: str) -> List[Medicine]:
        """Get medicines by category"""
        return get_medicines_by_category(db, category)
    
    def get_medicines_by_manufacturer(self, db: Session, manufacturer: str) -> List[Medicine]:
        """Get medicines by manufacturer"""
        return db.query(Medicine).filter(
            Medicine.manufacturer.ilike(f"%{manufacturer}%"),
            Medicine.is_active == True
        ).order_by(Medicine.name).all()
    
    def search_medicines_simple(self, db: Session, query: str, limit: int = 20) -> List[Medicine]:
        """Simple medicine search for autocomplete"""
        return search_medicines(db, query=query, limit=limit)
    
    # Drug Interaction Operations
    
    def check_drug_interactions(self, db: Session, medicine_ids: List[UUID]) -> List[Dict[str, Any]]:
        """
        Check for drug interactions between medicines
        Returns list of potential interactions
        """
        if len(medicine_ids) < 2:
            return []
        
        # Get medicines
        medicines = db.query(Medicine).filter(
            Medicine.id.in_(medicine_ids),
            Medicine.is_active == True
        ).all()
        
        if len(medicines) < 2:
            return []
        
        # Convert UUIDs to strings for the helper function
        medicine_id_strings = [str(mid) for mid in medicine_ids]
        
        return check_drug_interactions(db, medicine_id_strings)
    
    def get_contraindicated_medicines(self, db: Session, condition: str) -> List[Medicine]:
        """Get medicines contraindicated for a specific condition"""
        return db.query(Medicine).filter(
            Medicine.contraindications.ilike(f"%{condition}%"),
            Medicine.is_active == True
        ).all()
    
    # Statistics and Analytics
    
    def get_medicine_statistics(self, db: Session) -> Dict[str, Any]:
        """Get medicine catalog statistics"""
        total_medicines = db.query(Medicine).count()
        active_medicines = db.query(Medicine).filter(Medicine.is_active == True).count()
        inactive_medicines = total_medicines - active_medicines
        
        prescription_required = db.query(Medicine).filter(
            Medicine.requires_prescription == True,
            Medicine.is_active == True
        ).count()
        
        over_the_counter = active_medicines - prescription_required
        
        # Category distribution
        category_stats = db.query(
            Medicine.drug_category,
            func.count(Medicine.id).label('count')
        ).filter(
            Medicine.is_active == True,
            Medicine.drug_category.isnot(None)
        ).group_by(Medicine.drug_category).all()
        
        # Manufacturer distribution
        manufacturer_stats = db.query(
            Medicine.manufacturer,
            func.count(Medicine.id).label('count')
        ).filter(
            Medicine.is_active == True,
            Medicine.manufacturer.isnot(None)
        ).group_by(Medicine.manufacturer).limit(10).all()
        
        # Price range distribution
        price_ranges = {
            'under_10': db.query(Medicine).filter(
                Medicine.price < 10,
                Medicine.is_active == True,
                Medicine.price.isnot(None)
            ).count(),
            '10_50': db.query(Medicine).filter(
                and_(Medicine.price >= 10, Medicine.price < 50),
                Medicine.is_active == True
            ).count(),
            '50_100': db.query(Medicine).filter(
                and_(Medicine.price >= 50, Medicine.price < 100),
                Medicine.is_active == True
            ).count(),
            'over_100': db.query(Medicine).filter(
                Medicine.price >= 100,
                Medicine.is_active == True
            ).count()
        }
        
        # Dosage forms distribution (simplified since dosage_forms is an array)
        dosage_forms = {
            'tablet': 0,
            'capsule': 0,
            'syrup': 0,
            'injection': 0,
            'other': 0
        }
        
        # Note: This is a simplified implementation since dosage_forms is stored as an array
        # In a real system, you might want to use PostgreSQL array functions
        all_medicines = db.query(Medicine).filter(Medicine.is_active == True).all()
        for medicine in all_medicines:
            if medicine.dosage_forms:
                for form in medicine.dosage_forms:
                    form_lower = form.lower()
                    if form_lower in dosage_forms:
                        dosage_forms[form_lower] += 1
                    else:
                        dosage_forms['other'] += 1
        
        return {
            'total_medicines': total_medicines,
            'active_medicines': active_medicines,
            'inactive_medicines': inactive_medicines,
            'prescription_required': prescription_required,
            'over_the_counter': over_the_counter,
            'categories': {row.drug_category: row.count for row in category_stats},
            'manufacturers': {row.manufacturer: row.count for row in manufacturer_stats},
            'dosage_forms': dosage_forms,
            'price_ranges': price_ranges
        }
    
    def get_popular_medicines(self, db: Session, limit: int = 10) -> List[Medicine]:
        """Get most popular medicines (based on prescription usage)"""
        # This would require prescription data to be accurate
        # For now, return medicines by name alphabetically
        return db.query(Medicine).filter(
            Medicine.is_active == True
        ).order_by(Medicine.name).limit(limit).all()
    
    # Bulk Operations
    
    def bulk_update_medicines(self, db: Session, medicine_ids: List[UUID], operation: str) -> Dict[str, Any]:
        """Perform bulk operations on medicines"""
        result = {
            'operation': operation,
            'total_requested': len(medicine_ids),
            'successful': 0,
            'failed': 0,
            'errors': [],
            'processed_ids': []
        }
        
        for medicine_id in medicine_ids:
            try:
                if operation == 'activate':
                    medicine = self.reactivate_medicine(db, medicine_id)
                    if medicine:
                        result['successful'] += 1
                        result['processed_ids'].append(medicine_id)
                
                elif operation == 'deactivate':
                    success = self.deactivate_medicine(db, medicine_id)
                    if success:
                        result['successful'] += 1
                        result['processed_ids'].append(medicine_id)
                
                elif operation == 'delete':
                    # Hard delete (use with caution)
                    medicine = db.query(Medicine).filter(Medicine.id == medicine_id).first()
                    if medicine:
                        db.delete(medicine)
                        db.commit()
                        result['successful'] += 1
                        result['processed_ids'].append(medicine_id)
                
            except Exception as e:
                result['failed'] += 1
                result['errors'].append(f"Medicine {medicine_id}: {str(e)}")
                logger.error(f"Bulk operation failed for medicine {medicine_id}: {str(e)}")
        
        return result
    
    # Import/Export Operations
    
    def import_medicines(self, db: Session, medicines_data: List[MedicineCreate], created_by: UUID, overwrite: bool = False) -> Dict[str, Any]:
        """Import medicines from external data"""
        result = {
            'total': len(medicines_data),
            'successful': 0,
            'failed': 0,
            'errors': [],
            'created_ids': []
        }
        
        for medicine_data in medicines_data:
            try:
                # Check if medicine exists
                existing = find_medicine_by_name(db, medicine_data.name, exact_match=True)
                
                if existing and existing.is_active and not overwrite:
                    result['failed'] += 1
                    result['errors'].append(f"Medicine '{medicine_data.name}' already exists")
                    continue
                
                if existing and overwrite:
                    # Update existing medicine
                    update_data = MedicineUpdate(**medicine_data.dict(exclude_unset=True))
                    medicine = self.update_medicine(db, existing.id, update_data)
                else:
                    # Create new medicine
                    medicine = self.create_medicine(db, medicine_data, created_by)
                
                result['successful'] += 1
                result['created_ids'].append(medicine.id)
                
            except Exception as e:
                result['failed'] += 1
                result['errors'].append(f"Medicine '{medicine_data.name}': {str(e)}")
                logger.error(f"Import failed for medicine {medicine_data.name}: {str(e)}")
        
        return result
    
    def export_medicines(self, db: Session, filters: Optional[MedicineSearchParams] = None) -> List[Medicine]:
        """Export medicines data"""
        if filters:
            medicines, _ = self.search_medicines(db, filters)
            return medicines
        else:
            return db.query(Medicine).filter(Medicine.is_active == True).order_by(Medicine.name).all()
    
    # Validation Helpers
    
    def validate_medicine_name_unique(self, db: Session, name: str, exclude_id: Optional[UUID] = None) -> bool:
        """Validate that medicine name is unique"""
        query = db.query(Medicine).filter(
            Medicine.name == name,
            Medicine.is_active == True
        )
        
        if exclude_id:
            query = query.filter(Medicine.id != exclude_id)
        
        return query.first() is None
    
    # Recommendation System
    
    def get_medicine_recommendations(self, db: Session, condition: str, limit: int = 5) -> List[Medicine]:
        """Get medicine recommendations for a condition"""
        # This is a simplified implementation
        # In a real system, you'd have a sophisticated recommendation engine
        
        condition_keywords = condition.lower().split()
        medicines = []
        
        # Search by category first
        for keyword in condition_keywords:
            category_medicines = self.get_medicines_by_category(db, keyword)
            medicines.extend(category_medicines)
        
        # Search by composition/name
        search_results = self.search_medicines_simple(db, condition, limit=limit*2)
        medicines.extend(search_results)
        
        # Remove duplicates and limit results
        seen_ids = set()
        unique_medicines = []
        for medicine in medicines:
            if medicine.id not in seen_ids:
                unique_medicines.append(medicine)
                seen_ids.add(medicine.id)
            if len(unique_medicines) >= limit:
                break
        
        return unique_medicines