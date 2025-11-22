"""
ShortKey models following ERD specifications
Enables quick prescription creation with predefined medicine groups
"""

from sqlalchemy import Column, String, Text, Boolean, Integer, ForeignKey, Index, or_
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, validates
from typing import Dict, Any, List
import uuid

from app.models.base import BaseModel


class ShortKey(BaseModel):
    """
    ShortKey model for grouping medicines with quick access codes
    Following ERD short_keys entity specifications
    """
    __tablename__ = "short_keys"
    
    # Short key identifier
    code = Column(
        String(20), 
        unique=True, 
        nullable=False,
        comment="Unique short key code (e.g., FLU, DIAB)"
    )
    
    # Descriptive information
    name = Column(
        String(255), 
        nullable=False,
        comment="Descriptive name for the short key"
    )
    
    description = Column(
        Text, 
        nullable=True,
        comment="Detailed description of the medicine group"
    )
    
    # Creator and scope
    created_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
        comment="User who created this short key"
    )
    
    is_global = Column(
        Boolean, 
        default=False,
        comment="Whether short key is available to all doctors"
    )
    
    # Usage tracking
    usage_count = Column(
        Integer, 
        default=0,
        comment="Number of times this short key has been used"
    )
    
    # Relationships (as per ERD)
    creator = relationship(
        "User",
        back_populates="created_short_keys"
    )
    
    # doctor = relationship(
    #     "Doctor",
    #     back_populates="short_keys",
    #     foreign_keys="ShortKey.created_by"
    # )
    
    medicines = relationship(
        "ShortKeyMedicine",
        back_populates="short_key",
        cascade="all, delete-orphan",
        lazy="dynamic"
    )
    
    # Indexes for performance
    __table_args__ = (
        Index('idx_short_keys_code', 'code'),
        Index('idx_short_keys_created_by', 'created_by'),
        Index('idx_short_keys_global', 'is_global'),
        Index('idx_short_keys_active', 'is_active'),
    )
    
    @validates('code')
    def validate_code(self, key, code):
        """Validate short key code"""
        if not code or not code.strip():
            raise ValueError("Short key code is required")
        
        code = code.strip().upper()
        
        # Validate format: alphanumeric, 2-20 characters
        import re
        if not re.match(r'^[A-Z0-9]{2,20}$', code):
            raise ValueError("Code must be 2-20 alphanumeric characters")
        
        # Check for reserved codes
        reserved_codes = ['ALL', 'NONE', 'NULL', 'ADMIN', 'TEST']
        if code in reserved_codes:
            raise ValueError(f"'{code}' is a reserved code")
        
        return code
    
    @validates('name')
    def validate_name(self, key, name):
        """Validate short key name"""
        if not name or not name.strip():
            raise ValueError("Short key name is required")
        
        name = name.strip()
        if len(name) < 3:
            raise ValueError("Name must be at least 3 characters")
        
        return name
    
    def get_medicines_list(self) -> List[Dict[str, Any]]:
        """Get medicines in this short key with their settings"""
        return [
            {
                'medicine': skm.medicine.to_dict() if skm.medicine else None,
                'default_dosage': skm.default_dosage,
                'default_frequency': skm.default_frequency,
                'default_duration': skm.default_duration,
                'default_instructions': skm.default_instructions,
                'sequence_order': skm.sequence_order
            }
            for skm in self.medicines.order_by('sequence_order').all()
        ]
    
    def add_medicine(
        self, 
        medicine_id: uuid.UUID,
        default_dosage: str,
        default_frequency: str,
        default_duration: str,
        default_instructions: str = None,
        sequence_order: int = None
    ) -> "ShortKeyMedicine":
        """Add medicine to short key"""
        if sequence_order is None:
            # Get next sequence order
            max_order = max([skm.sequence_order for skm in self.medicines.all()], default=0)
            sequence_order = max_order + 1
        
        short_key_medicine = ShortKeyMedicine(
            short_key_id=self.id,
            medicine_id=medicine_id,
            default_dosage=default_dosage,
            default_frequency=default_frequency,
            default_duration=default_duration,
            default_instructions=default_instructions,
            sequence_order=sequence_order
        )
        
        return short_key_medicine
    
    def remove_medicine(self, medicine_id: uuid.UUID) -> bool:
        """Remove medicine from short key"""
        skm = self.medicines.filter_by(medicine_id=medicine_id).first()
        if skm:
            # Note: We'll handle the actual deletion in the service layer
            return True
        return False
    
    def increment_usage(self) -> None:
        """Increment usage count"""
        self.usage_count = (self.usage_count or 0) + 1
    
    def can_be_used_by(self, user_id: uuid.UUID) -> bool:
        """Check if short key can be used by specific user"""
        return self.is_global or self.created_by == user_id
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary with medicine list"""
        data = super().to_dict()
        data.update({
            'medicines_list': self.get_medicines_list(),
            'medicine_count': self.medicines.count(),
        })
        return data
    
    def __repr__(self) -> str:
        return f"<ShortKey(code='{self.code}', name='{self.name}')>"
    
    def __str__(self) -> str:
        return f"{self.code} - {self.name}"


class ShortKeyMedicine(BaseModel):
    """
    Association table between ShortKey and Medicine with default settings
    Following ERD short_key_medicines entity specifications
    """
    __tablename__ = "short_key_medicines"
    
    # Foreign keys
    short_key_id = Column(
        UUID(as_uuid=True),
        ForeignKey("short_keys.id", ondelete="CASCADE"),
        nullable=False,
        comment="Reference to short key"
    )
    
    medicine_id = Column(
        UUID(as_uuid=True),
        ForeignKey("medicines.id", ondelete="CASCADE"),
        nullable=False,
        comment="Reference to medicine"
    )
    
    # Default prescription settings
    default_dosage = Column(
        String(100), 
        nullable=False,
        comment="Default dosage for this medicine in this short key"
    )
    
    default_frequency = Column(
        String(100), 
        nullable=False,
        comment="Default frequency (e.g., 'Twice daily')"
    )
    
    default_duration = Column(
        String(100), 
        nullable=False,
        comment="Default duration (e.g., '5 days')"
    )
    
    default_instructions = Column(
        Text, 
        nullable=True,
        comment="Default special instructions"
    )
    
    # Ordering
    sequence_order = Column(
        Integer, 
        nullable=False,
        default=1,
        comment="Order of medicine in the short key"
    )
    
    # Relationships
    short_key = relationship(
        "ShortKey",
        back_populates="medicines"
    )
    
    medicine = relationship(
        "Medicine",
        back_populates="short_key_medicines"
    )
    
    # Indexes
    __table_args__ = (
        Index('idx_skm_short_key_id', 'short_key_id'),
        Index('idx_skm_medicine_id', 'medicine_id'),
        Index('idx_skm_sequence', 'short_key_id', 'sequence_order'),
    )
    
    @validates('default_dosage', 'default_frequency', 'default_duration')
    def validate_defaults(self, key, value):
        """Validate default prescription values"""
        if not value or not value.strip():
            raise ValueError(f"{key} is required")
        
        return value.strip()
    
    @validates('sequence_order')
    def validate_sequence_order(self, key, sequence_order):
        """Validate sequence order"""
        if sequence_order is None or sequence_order < 1:
            raise ValueError("Sequence order must be a positive integer")
        
        return sequence_order
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary with medicine details"""
        data = super().to_dict()
        if self.medicine:
            data['medicine_details'] = self.medicine.to_dict()
        if self.short_key:
            data['short_key_code'] = self.short_key.code
            data['short_key_name'] = self.short_key.name
        
        return data
    
    def __repr__(self) -> str:
        return f"<ShortKeyMedicine(short_key_id='{self.short_key_id}', medicine_id='{self.medicine_id}')>"


# Helper functions for short key management

def find_short_key_by_code(db, code: str, user_id: uuid.UUID = None) -> ShortKey:
    """Find short key by code, considering user permissions"""
    query = db.query(ShortKey).filter(
        ShortKey.code == code.upper(),
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


def get_short_keys_for_user(db, user_id: uuid.UUID, include_global: bool = True) -> List[ShortKey]:
    """Get all short keys available to a user"""
    query = db.query(ShortKey).filter(ShortKey.is_active == True)
    
    if include_global:
        query = query.filter(
            or_(
                ShortKey.created_by == user_id,
                ShortKey.is_global == True
            )
        )
    else:
        query = query.filter(ShortKey.created_by == user_id)
    
    return query.order_by(ShortKey.code).all()


def search_short_keys(
    db, 
    query: str = None, 
    user_id: uuid.UUID = None,
    include_global: bool = True
) -> List[ShortKey]:
    """Search short keys by code or name"""
    query_obj = db.query(ShortKey).filter(ShortKey.is_active == True)
    
    if query:
        search_filter = or_(
            ShortKey.code.ilike(f"%{query}%"),
            ShortKey.name.ilike(f"%{query}%"),
            ShortKey.description.ilike(f"%{query}%")
        )
        query_obj = query_obj.filter(search_filter)
    
    if user_id:
        if include_global:
            query_obj = query_obj.filter(
                or_(
                    ShortKey.created_by == user_id,
                    ShortKey.is_global == True
                )
            )
        else:
            query_obj = query_obj.filter(ShortKey.created_by == user_id)
    
    return query_obj.order_by(ShortKey.usage_count.desc()).all()


def validate_short_key_code_uniqueness(db, code: str, exclude_id: uuid.UUID = None) -> bool:
    """Validate that short key code is unique"""
    query = db.query(ShortKey).filter(
        ShortKey.code == code.upper(),
        ShortKey.is_active == True
    )
    
    if exclude_id:
        query = query.filter(ShortKey.id != exclude_id)
    
    return query.first() is None


def create_default_short_keys(db, creator_id: uuid.UUID) -> List[ShortKey]:
    """Create default short keys for common conditions"""
    default_short_keys = [
        {
            'code': 'FLU',
            'name': 'Common Flu Treatment',
            'description': 'Standard treatment for common flu symptoms',
            'is_global': True,
            'medicines': [
                {
                    'medicine_name': 'Paracetamol',
                    'default_dosage': '500mg',
                    'default_frequency': 'Three times daily',
                    'default_duration': '3-5 days',
                    'default_instructions': 'Take with food'
                }
            ]
        },
        {
            'code': 'FEVER',
            'name': 'Fever Management',
            'description': 'Basic fever reduction treatment',
            'is_global': True,
            'medicines': [
                {
                    'medicine_name': 'Paracetamol',
                    'default_dosage': '650mg',
                    'default_frequency': 'Every 6 hours',
                    'default_duration': '2-3 days',
                    'default_instructions': 'As needed for fever'
                }
            ]
        }
    ]
    
    created_keys = []
    for sk_data in default_short_keys:
        if not find_short_key_by_code(db, sk_data['code']):
            short_key = ShortKey(
                code=sk_data['code'],
                name=sk_data['name'],
                description=sk_data['description'],
                created_by=creator_id,
                is_global=sk_data['is_global']
            )
            db.add(short_key)
            db.flush()
            created_keys.append(short_key)
    
    return created_keys