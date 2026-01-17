"""
Short Key Service for Quick Prescription Creation
Handles short key CRUD operations and medicine group management
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc, asc
from typing import Optional, List, Dict, Any, Tuple
from uuid import UUID
import logging

from app.models.short_key import ShortKey, ShortKeyMedicine, find_short_key_by_code, get_short_keys_for_user, search_short_keys, validate_short_key_code_uniqueness
from app.models.medicine import Medicine
from app.schemas.short_key import ShortKeyCreate, ShortKeyUpdate, ShortKeySearchParams, ShortKeyMedicineCreate, ShortKeyMedicineUpdate
from app.core.exceptions import (
    NotFoundError, 
    ValidationError, 
    BusinessRuleError,
    DuplicateError
)

logger = logging.getLogger(__name__)


class ShortKeyService:
    """Service class for short key management"""
    
    def __init__(self):
        pass
    
    # Core CRUD Operations
    
    def create_short_key(self, db: Session, short_key_data: ShortKeyCreate, created_by: UUID) -> ShortKey:
        """
        Create a new short key with optional medicines
        """
        # Check for duplicate code
        if not validate_short_key_code_uniqueness(db, short_key_data.code):
            raise DuplicateError(f"Short key code '{short_key_data.code}' already exists")
        
        # Create short key instance
        short_key = ShortKey(
            code=short_key_data.code.upper(),
            name=short_key_data.name,
            description=short_key_data.description,
            created_by=created_by,
            is_global=short_key_data.is_global,
            tenant_id=getattr(short_key_data, 'tenant_id', None)  # Multi-tenancy
        )
        
        try:
            db.add(short_key)
            db.flush()  # Get the ID
            
            # Add medicines if provided
            if short_key_data.medicines:
                for medicine_data in short_key_data.medicines:
                    # Verify medicine exists
                    medicine = db.query(Medicine).filter(
                        Medicine.id == medicine_data.medicine_id,
                        Medicine.is_active == True
                    ).first()
                    
                    if not medicine:
                        raise ValidationError(f"Medicine with ID {medicine_data.medicine_id} not found")
                    
                    short_key_medicine = ShortKeyMedicine(
                        tenant_id=short_key.tenant_id,  # Inherit tenant_id from short_key
                        short_key_id=short_key.id,
                        medicine_id=medicine_data.medicine_id,
                        default_dosage=medicine_data.default_dosage,
                        default_frequency=medicine_data.default_frequency,
                        default_duration=medicine_data.default_duration,
                        default_instructions=medicine_data.default_instructions,
                        sequence_order=medicine_data.sequence_order
                    )
                    db.add(short_key_medicine)
            
            db.commit()
            # Don't refresh after commit - RLS blocks it

            logger.info(f"Created short key: {short_key.code} - {short_key.name}")
            return short_key
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error creating short key: {str(e)}")
            raise BusinessRuleError(f"Failed to create short key: {str(e)}")
    
    def get_short_key_by_id(self, db: Session, short_key_id: UUID, user_id: Optional[UUID] = None) -> Optional[ShortKey]:
        """Get short key by ID with permission check"""
        query = db.query(ShortKey).filter(
            ShortKey.id == short_key_id,
            ShortKey.is_active == True
        )
        
        if user_id:
            # User can access global short keys or their own
            query = query.filter(
                or_(
                    ShortKey.is_global == True,
                    ShortKey.created_by == user_id
                )
            )
        
        return query.first()
    
    def get_short_key_by_code(self, db: Session, code: str, user_id: Optional[UUID] = None) -> Optional[ShortKey]:
        """Get short key by code with permission check"""
        return find_short_key_by_code(db, code, user_id)
    
    def update_short_key(self, db: Session, short_key_id: UUID, short_key_data: ShortKeyUpdate, user_id: UUID) -> Optional[ShortKey]:
        """
        Update short key information
        Only creator can update (unless admin)
        """
        short_key = db.query(ShortKey).filter(
            ShortKey.id == short_key_id,
            ShortKey.is_active == True
        ).first()
        
        if not short_key:
            raise NotFoundError(f"Short key not found: {short_key_id}")
        
        # Check permissions (only creator can update)
        if short_key.created_by != user_id:
            raise ValidationError("Only the creator can update this short key")
        
        update_data = short_key_data.dict(exclude_unset=True)
        
        # Update fields
        for field, value in update_data.items():
            if hasattr(short_key, field):
                setattr(short_key, field, value)
        
        try:
            db.commit()
            # Don't refresh after commit - RLS blocks it

            logger.info(f"Updated short key: {short_key.code}")
            return short_key
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error updating short key: {str(e)}")
            raise BusinessRuleError(f"Failed to update short key: {str(e)}")
    
    def deactivate_short_key(self, db: Session, short_key_id: UUID, user_id: UUID) -> bool:
        """Deactivate short key (soft delete)"""
        short_key = db.query(ShortKey).filter(
            ShortKey.id == short_key_id,
            ShortKey.is_active == True
        ).first()
        
        if not short_key:
            raise NotFoundError(f"Short key not found: {short_key_id}")
        
        # Check permissions
        if short_key.created_by != user_id:
            raise ValidationError("Only the creator can deactivate this short key")
        
        short_key.is_active = False
        
        try:
            db.commit()
            logger.info(f"Deactivated short key: {short_key.code}")
            return True
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error deactivating short key: {str(e)}")
            raise BusinessRuleError(f"Failed to deactivate short key: {str(e)}")
    
    def reactivate_short_key(self, db: Session, short_key_id: UUID, user_id: UUID) -> Optional[ShortKey]:
        """Reactivate a deactivated short key"""
        short_key = db.query(ShortKey).filter(
            ShortKey.id == short_key_id,
            ShortKey.is_active == False
        ).first()
        
        if not short_key:
            raise NotFoundError(f"Inactive short key not found: {short_key_id}")
        
        # Check permissions
        if short_key.created_by != user_id:
            raise ValidationError("Only the creator can reactivate this short key")
        
        # Check for code conflicts
        if not validate_short_key_code_uniqueness(db, short_key.code, exclude_id=short_key_id):
            raise DuplicateError(f"Cannot reactivate: Short key code '{short_key.code}' already exists")
        
        short_key.is_active = True
        
        try:
            db.commit()
            # Don't refresh after commit - RLS blocks it
            logger.info(f"Reactivated short key: {short_key.code}")
            return short_key
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error reactivating short key: {str(e)}")
            raise BusinessRuleError(f"Failed to reactivate short key: {str(e)}")
    
    # Medicine Management within Short Keys
    
    def add_medicine_to_short_key(self, db: Session, short_key_id: UUID, medicine_data: ShortKeyMedicineCreate, user_id: UUID) -> ShortKeyMedicine:
        """Add medicine to short key"""
        short_key = self.get_short_key_by_id(db, short_key_id, user_id)
        if not short_key:
            raise NotFoundError(f"Short key not found: {short_key_id}")
        
        # Check permissions
        if short_key.created_by != user_id:
            raise ValidationError("Only the creator can modify this short key")
        
        # Verify medicine exists
        medicine = db.query(Medicine).filter(
            Medicine.id == medicine_data.medicine_id,
            Medicine.is_active == True
        ).first()
        
        if not medicine:
            raise ValidationError(f"Medicine with ID {medicine_data.medicine_id} not found")
        
        # Check if medicine already exists in short key
        existing = db.query(ShortKeyMedicine).filter(
            ShortKeyMedicine.short_key_id == short_key_id,
            ShortKeyMedicine.medicine_id == medicine_data.medicine_id
        ).first()
        
        if existing:
            raise DuplicateError("Medicine already exists in this short key")
        
        # Check sequence order conflicts
        sequence_conflict = db.query(ShortKeyMedicine).filter(
            ShortKeyMedicine.short_key_id == short_key_id,
            ShortKeyMedicine.sequence_order == medicine_data.sequence_order
        ).first()
        
        if sequence_conflict:
            # Auto-adjust sequence order
            max_order = db.query(func.max(ShortKeyMedicine.sequence_order)).filter(
                ShortKeyMedicine.short_key_id == short_key_id
            ).scalar() or 0
            medicine_data.sequence_order = max_order + 1
        
        short_key_medicine = ShortKeyMedicine(
            tenant_id=short_key.tenant_id,  # Inherit tenant_id from short_key
            short_key_id=short_key_id,
            medicine_id=medicine_data.medicine_id,
            default_dosage=medicine_data.default_dosage,
            default_frequency=medicine_data.default_frequency,
            default_duration=medicine_data.default_duration,
            default_instructions=medicine_data.default_instructions,
            sequence_order=medicine_data.sequence_order
        )

        try:
            db.add(short_key_medicine)
            db.commit()
            # Don't refresh after commit - RLS blocks it

            logger.info(f"Added medicine to short key {short_key.code}: {medicine.name}")
            return short_key_medicine
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error adding medicine to short key: {str(e)}")
            raise BusinessRuleError(f"Failed to add medicine to short key: {str(e)}")
    
    def update_short_key_medicine(self, db: Session, short_key_id: UUID, medicine_id: UUID, medicine_data: ShortKeyMedicineUpdate, user_id: UUID) -> Optional[ShortKeyMedicine]:
        """Update medicine settings in short key"""
        short_key = self.get_short_key_by_id(db, short_key_id, user_id)
        if not short_key:
            raise NotFoundError(f"Short key not found: {short_key_id}")
        
        # Check permissions
        if short_key.created_by != user_id:
            raise ValidationError("Only the creator can modify this short key")
        
        short_key_medicine = db.query(ShortKeyMedicine).filter(
            ShortKeyMedicine.short_key_id == short_key_id,
            ShortKeyMedicine.medicine_id == medicine_id
        ).first()
        
        if not short_key_medicine:
            raise NotFoundError("Medicine not found in short key")
        
        update_data = medicine_data.dict(exclude_unset=True)
        
        # Check sequence order conflicts if being updated
        if 'sequence_order' in update_data:
            sequence_conflict = db.query(ShortKeyMedicine).filter(
                ShortKeyMedicine.short_key_id == short_key_id,
                ShortKeyMedicine.sequence_order == update_data['sequence_order'],
                ShortKeyMedicine.id != short_key_medicine.id
            ).first()
            
            if sequence_conflict:
                raise ValidationError("Sequence order already taken")
        
        # Update fields
        for field, value in update_data.items():
            if hasattr(short_key_medicine, field):
                setattr(short_key_medicine, field, value)
        
        try:
            db.commit()
            # Don't refresh after commit - RLS blocks it

            logger.info(f"Updated medicine in short key {short_key.code}")
            return short_key_medicine
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error updating short key medicine: {str(e)}")
            raise BusinessRuleError(f"Failed to update medicine in short key: {str(e)}")
    
    def remove_medicine_from_short_key(self, db: Session, short_key_id: UUID, medicine_id: UUID, user_id: UUID) -> bool:
        """Remove medicine from short key"""
        short_key = self.get_short_key_by_id(db, short_key_id, user_id)
        if not short_key:
            raise NotFoundError(f"Short key not found: {short_key_id}")
        
        # Check permissions
        if short_key.created_by != user_id:
            raise ValidationError("Only the creator can modify this short key")
        
        short_key_medicine = db.query(ShortKeyMedicine).filter(
            ShortKeyMedicine.short_key_id == short_key_id,
            ShortKeyMedicine.medicine_id == medicine_id
        ).first()
        
        if not short_key_medicine:
            raise NotFoundError("Medicine not found in short key")
        
        try:
            db.delete(short_key_medicine)
            db.commit()
            
            logger.info(f"Removed medicine from short key {short_key.code}")
            return True
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error removing medicine from short key: {str(e)}")
            raise BusinessRuleError(f"Failed to remove medicine from short key: {str(e)}")
    
    # Search and Query Operations
    
    def search_short_keys(self, db: Session, search_params: ShortKeySearchParams, user_id: Optional[UUID] = None) -> Tuple[List[ShortKey], int]:
        """
        Search short keys with filtering, sorting, and pagination
        Returns (short_keys, total_count)
        """
        query = db.query(ShortKey)
        
        # Apply active filter
        if search_params.is_active is not None:
            query = query.filter(ShortKey.is_active == search_params.is_active)
        
        # Apply permission filters
        if user_id:
            permission_filters = []
            
            if search_params.include_global:
                permission_filters.append(ShortKey.is_global == True)
            
            if search_params.include_personal:
                permission_filters.append(ShortKey.created_by == user_id)
            
            if permission_filters:
                query = query.filter(or_(*permission_filters))
            else:
                # If no permissions included, return empty result
                return [], 0
        
        # Apply creator filter
        if search_params.created_by:
            query = query.filter(ShortKey.created_by == search_params.created_by)
        
        # Apply global filter
        if search_params.is_global is not None:
            query = query.filter(ShortKey.is_global == search_params.is_global)
        
        # Apply text search
        if search_params.query:
            search_filter = or_(
                ShortKey.code.ilike(f"%{search_params.query}%"),
                ShortKey.name.ilike(f"%{search_params.query}%"),
                ShortKey.description.ilike(f"%{search_params.query}%")
            )
            query = query.filter(search_filter)
        
        # Get total count before pagination
        total_count = query.count()
        
        # Apply sorting
        sort_column = getattr(ShortKey, search_params.sort_by, ShortKey.code)
        if search_params.sort_order == "desc":
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(asc(sort_column))
        
        # Apply pagination
        offset = (search_params.page - 1) * search_params.page_size
        short_keys = query.offset(offset).limit(search_params.page_size).all()
        
        return short_keys, total_count
    
    def get_short_keys_for_user(self, db: Session, user_id: UUID, include_global: bool = True) -> List[ShortKey]:
        """Get all short keys available to a user"""
        return get_short_keys_for_user(db, user_id, include_global)
    
    def get_popular_short_keys(self, db: Session, user_id: Optional[UUID] = None, limit: int = 10) -> List[ShortKey]:
        """Get most popular short keys by usage count"""
        query = db.query(ShortKey).filter(ShortKey.is_active == True)
        
        if user_id:
            query = query.filter(
                or_(
                    ShortKey.is_global == True,
                    ShortKey.created_by == user_id
                )
            )
        
        return query.order_by(desc(ShortKey.usage_count)).limit(limit).all()
    
    # Usage Tracking
    
    def use_short_key(self, db: Session, short_key_id: UUID, user_id: UUID) -> Optional[ShortKey]:
        """Track short key usage and return the short key with medicines"""
        short_key = self.get_short_key_by_id(db, short_key_id, user_id)
        if not short_key:
            raise NotFoundError(f"Short key not found: {short_key_id}")
        
        # Increment usage count
        short_key.increment_usage()
        
        try:
            db.commit()
            # Don't refresh after commit - RLS blocks it

            logger.info(f"Used short key: {short_key.code} (usage: {short_key.usage_count})")
            return short_key
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error tracking short key usage: {str(e)}")
            raise BusinessRuleError(f"Failed to track usage: {str(e)}")
    
    def use_short_key_by_code(self, db: Session, code: str, user_id: UUID) -> Optional[ShortKey]:
        """Track short key usage by code"""
        short_key = self.get_short_key_by_code(db, code, user_id)
        if not short_key:
            raise NotFoundError(f"Short key not found: {code}")
        
        return self.use_short_key(db, short_key.id, user_id)
    
    # Statistics and Analytics
    
    def get_short_key_statistics(self, db: Session, user_id: Optional[UUID] = None) -> Dict[str, Any]:
        """Get short key statistics"""
        base_query = db.query(ShortKey).filter(ShortKey.is_active == True)
        
        if user_id:
            # User-specific stats
            personal_query = base_query.filter(ShortKey.created_by == user_id)
            global_query = base_query.filter(ShortKey.is_global == True)
            
            personal_count = personal_query.count()
            accessible_global = global_query.count()
            
            # Most used by user
            most_used = base_query.filter(
                or_(
                    ShortKey.created_by == user_id,
                    ShortKey.is_global == True
                )
            ).order_by(desc(ShortKey.usage_count)).limit(5).all()
            
            return {
                'total_short_keys': personal_count + accessible_global,
                'personal_short_keys': personal_count,
                'global_short_keys': accessible_global,
                'active_short_keys': personal_count + accessible_global,  # All accessible are active
                'most_used': [{'code': sk.code, 'name': sk.name, 'usage_count': sk.usage_count} for sk in most_used],
                'usage_by_creator': {},  # Not applicable for user-specific stats
                'recent_activity': []  # Not implemented yet
            }
        else:
            # System-wide stats
            total_short_keys = base_query.count()
            global_short_keys = base_query.filter(ShortKey.is_global == True).count()
            personal_short_keys = total_short_keys - global_short_keys
            
            # Usage statistics
            most_used = base_query.order_by(desc(ShortKey.usage_count)).limit(10).all()
            
            # Creator statistics
            creator_stats = db.query(
                ShortKey.created_by,
                func.count(ShortKey.id).label('count')
            ).filter(ShortKey.is_active == True).group_by(ShortKey.created_by).all()
            
            return {
                'total_short_keys': total_short_keys,
                'personal_short_keys': personal_short_keys,
                'global_short_keys': global_short_keys,
                'active_short_keys': total_short_keys,  # All queried are active
                'most_used': [{'code': sk.code, 'name': sk.name, 'usage_count': sk.usage_count} for sk in most_used],
                'usage_by_creator': {str(row.created_by): row.count for row in creator_stats},
                'recent_activity': []  # Not implemented yet
            }
    
    # Validation Helpers
    
    def validate_code_unique(self, db: Session, code: str, exclude_id: Optional[UUID] = None) -> bool:
        """Validate that short key code is unique"""
        return validate_short_key_code_uniqueness(db, code, exclude_id)
    
    # Bulk Operations
    
    def bulk_update_short_keys(self, db: Session, short_key_ids: List[UUID], operation: str, user_id: UUID) -> Dict[str, Any]:
        """Perform bulk operations on short keys"""
        result = {
            'operation': operation,
            'total_requested': len(short_key_ids),
            'successful': 0,
            'failed': 0,
            'errors': [],
            'processed_ids': []
        }
        
        for short_key_id in short_key_ids:
            try:
                if operation == 'activate':
                    short_key = self.reactivate_short_key(db, short_key_id, user_id)
                    if short_key:
                        result['successful'] += 1
                        result['processed_ids'].append(short_key_id)
                
                elif operation == 'deactivate':
                    success = self.deactivate_short_key(db, short_key_id, user_id)
                    if success:
                        result['successful'] += 1
                        result['processed_ids'].append(short_key_id)
                
                elif operation == 'make_global':
                    short_key = db.query(ShortKey).filter(
                        ShortKey.id == short_key_id,
                        ShortKey.created_by == user_id
                    ).first()
                    if short_key:
                        short_key.is_global = True
                        db.commit()
                        result['successful'] += 1
                        result['processed_ids'].append(short_key_id)
                
                elif operation == 'make_personal':
                    short_key = db.query(ShortKey).filter(
                        ShortKey.id == short_key_id,
                        ShortKey.created_by == user_id
                    ).first()
                    if short_key:
                        short_key.is_global = False
                        db.commit()
                        result['successful'] += 1
                        result['processed_ids'].append(short_key_id)
                
            except Exception as e:
                result['failed'] += 1
                result['errors'].append(f"Short key {short_key_id}: {str(e)}")
                logger.error(f"Bulk operation failed for short key {short_key_id}: {str(e)}")
        
        return result