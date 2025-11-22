"""
Medicine model following ERD specifications
Supports medicine catalog and drug interaction checking
"""

from sqlalchemy import Column, String, Text, Boolean, Numeric, Index, ARRAY, or_
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, validates
from typing import Dict, Any, List
from decimal import Decimal
import re

from app.models.base import BaseModel


class Medicine(BaseModel):
    """
    Medicine model for catalog management
    Following ERD medicine entity specifications
    """
    __tablename__ = "medicines"
    
    # Basic medicine information
    name = Column(
        String(255), 
        nullable=False,
        comment="Brand name of the medicine"
    )
    
    generic_name = Column(
        String(255), 
        nullable=True,
        comment="Generic/scientific name"
    )
    
    composition = Column(
        Text, 
        nullable=False,
        comment="Active ingredients and composition"
    )
    
    manufacturer = Column(
        String(255), 
        nullable=True,
        comment="Manufacturing company"
    )
    
    # Dosage and strength information
    dosage_forms = Column(
        ARRAY(String),
        nullable=True,
        comment="Available dosage forms (tablet, syrup, injection, etc.)"
    )
    
    strength = Column(
        String(100), 
        nullable=True,
        comment="Medicine strength (e.g., 500mg, 10ml)"
    )
    
    # Classification and category
    drug_category = Column(
        String(100), 
        nullable=True,
        comment="Drug category (antibiotic, analgesic, etc.)"
    )
    
    # Pricing information
    price = Column(
        Numeric(10, 2), 
        nullable=True,
        comment="Price per unit"
    )
    
    # Regulatory information
    requires_prescription = Column(
        Boolean, 
        default=True,
        comment="Whether medicine requires prescription"
    )
    
    # Drug classification codes (for interaction checking)
    atc_code = Column(
        String(20), 
        nullable=True,
        comment="Anatomical Therapeutic Chemical code"
    )
    
    # Storage and handling
    storage_conditions = Column(
        Text, 
        nullable=True,
        comment="Storage requirements"
    )
    
    # Contraindications and warnings
    contraindications = Column(
        Text, 
        nullable=True,
        comment="Contraindications and warnings"
    )
    
    side_effects = Column(
        Text, 
        nullable=True,
        comment="Common side effects"
    )
    
    # Relationships (as per ERD)
    prescription_items = relationship(
        "PrescriptionItem",
        back_populates="medicine",
        lazy="dynamic"
    )
    
    short_key_medicines = relationship(
        "ShortKeyMedicine",
        back_populates="medicine",
        lazy="dynamic"
    )
    
    # Indexes for performance (as per ERD)
    __table_args__ = (
        Index('idx_medicines_name', 'name'),
        Index('idx_medicines_generic_name', 'generic_name'),
        Index('idx_medicines_category', 'drug_category'),
        Index('idx_medicines_manufacturer', 'manufacturer'),
        Index('idx_medicines_active', 'is_active'),
        Index('idx_medicines_prescription_required', 'requires_prescription'),
        Index('idx_medicines_atc_code', 'atc_code'),
        # Full-text search index (commented out for basic setup)
        # Index('idx_medicines_search', 'name', 'generic_name', postgresql_using='gin'),
    )
    
    @validates('name')
    def validate_name(self, key, name):
        """Validate medicine name"""
        if not name or not name.strip():
            raise ValueError("Medicine name is required")
        
        name = name.strip()
        if len(name) < 2:
            raise ValueError("Medicine name must be at least 2 characters")
        
        return name
    
    @validates('composition')
    def validate_composition(self, key, composition):
        """Validate composition"""
        if not composition or not composition.strip():
            raise ValueError("Medicine composition is required")
        
        return composition.strip()
    
    @validates('price')
    def validate_price(self, key, price):
        """Validate price"""
        if price is not None:
            if price < 0:
                raise ValueError("Price cannot be negative")
            if price > 999999.99:
                raise ValueError("Price is too high")
        
        return price
    
    @validates('strength')
    def validate_strength(self, key, strength):
        """Validate strength format"""
        if strength:
            strength = strength.strip()
            # Basic validation for strength format
            if not re.match(r'^[\d\.\s]+(mg|g|ml|l|iu|mcg|%)', strength.lower()):
                # Allow various formats but warn
                pass
        
        return strength
    
    def get_display_name(self) -> str:
        """Get formatted display name"""
        if self.generic_name and self.generic_name != self.name:
            return f"{self.name} ({self.generic_name})"
        return self.name
    
    def get_full_description(self) -> str:
        """Get full medicine description"""
        parts = [self.name]
        
        if self.strength:
            parts.append(f"{self.strength}")
        
        if self.dosage_forms:
            parts.append(f"[{', '.join(self.dosage_forms)}]")
        
        return " ".join(parts)
    
    def get_dosage_forms_list(self) -> List[str]:
        """Get dosage forms as list"""
        return self.dosage_forms or []
    
    def set_dosage_forms(self, forms: List[str]) -> None:
        """Set dosage forms from list"""
        # Validate and clean dosage forms
        valid_forms = []
        common_forms = [
            'tablet', 'capsule', 'syrup', 'injection', 'cream', 'ointment',
            'drops', 'spray', 'inhaler', 'suppository', 'gel', 'lotion'
        ]
        
        for form in forms:
            form = form.strip().lower()
            if form and (form in common_forms or len(form) > 2):
                valid_forms.append(form)
        
        self.dosage_forms = valid_forms if valid_forms else None
    
    def is_over_the_counter(self) -> bool:
        """Check if medicine is available over the counter"""
        return not self.requires_prescription
    
    def has_contraindication(self, condition: str) -> bool:
        """Check if medicine has contraindication for specific condition"""
        if self.contraindications:
            return condition.lower() in self.contraindications.lower()
        return False
    
    def get_price_formatted(self) -> str:
        """Get formatted price string"""
        if self.price:
            return f"₹{self.price:.2f}"
        return "Price not available"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary with additional computed fields"""
        data = super().to_dict()
        data.update({
            'display_name': self.get_display_name(),
            'full_description': self.get_full_description(),
            'dosage_forms_list': self.get_dosage_forms_list(),
            'is_over_the_counter': self.is_over_the_counter(),
            'price_formatted': self.get_price_formatted(),
        })
        return data
    
    def __repr__(self) -> str:
        return f"<Medicine(name='{self.name}', strength='{self.strength}')>"
    
    def __str__(self) -> str:
        return self.get_full_description()


# Helper functions for medicine management

def search_medicines(
    db, 
    query: str = None, 
    category: str = None,
    requires_prescription: bool = None,
    limit: int = 50
) -> List[Medicine]:
    """
    Search medicines with various filters
    """
    query_obj = db.query(Medicine).filter(Medicine.is_active == True)
    
    if query:
        search_filter = or_(
            Medicine.name.ilike(f"%{query}%"),
            Medicine.generic_name.ilike(f"%{query}%"),
            Medicine.composition.ilike(f"%{query}%")
        )
        query_obj = query_obj.filter(search_filter)
    
    if category:
        query_obj = query_obj.filter(
            Medicine.drug_category.ilike(f"%{category}%")
        )
    
    if requires_prescription is not None:
        query_obj = query_obj.filter(
            Medicine.requires_prescription == requires_prescription
        )
    
    return query_obj.limit(limit).all()


def find_medicine_by_name(db, name: str, exact_match: bool = False) -> Medicine:
    """Find medicine by name"""
    if exact_match:
        return db.query(Medicine).filter(
            Medicine.name == name,
            Medicine.is_active == True
        ).first()
    else:
        return db.query(Medicine).filter(
            Medicine.name.ilike(f"%{name}%"),
            Medicine.is_active == True
        ).first()


def get_medicines_by_category(db, category: str) -> List[Medicine]:
    """Get medicines by category"""
    return db.query(Medicine).filter(
        Medicine.drug_category.ilike(f"%{category}%"),
        Medicine.is_active == True
    ).all()


def check_drug_interactions(db, medicine_ids: List[str]) -> List[Dict[str, Any]]:
    """
    Check for drug interactions between medicines
    Returns list of potential interactions
    """
    # This is a simplified implementation
    # In a real system, you'd have a drug interaction database
    interactions = []
    
    medicines = db.query(Medicine).filter(
        Medicine.id.in_(medicine_ids),
        Medicine.is_active == True
    ).all()
    
    # Example interaction checking logic
    medicine_categories = [m.drug_category for m in medicines if m.drug_category]
    
    # Check for known dangerous combinations
    dangerous_combinations = [
        ['anticoagulant', 'antibiotic'],
        ['sedative', 'alcohol'],
        # Add more combinations
    ]
    
    for combo in dangerous_combinations:
        if all(any(cat in category for category in medicine_categories) for cat in combo):
            interactions.append({
                'severity': 'high',
                'description': f"Potential interaction between {' and '.join(combo)}",
                'recommendation': 'Consult doctor before combining these medicines'
            })
    
    return interactions


def validate_medicine_data(data: Dict[str, Any]) -> List[str]:
    """
    Validate medicine data
    Returns list of validation errors
    """
    errors = []
    
    if not data.get('name'):
        errors.append("Medicine name is required")
    
    if not data.get('composition'):
        errors.append("Medicine composition is required")
    
    price = data.get('price')
    if price is not None:
        try:
            price_decimal = Decimal(str(price))
            if price_decimal < 0:
                errors.append("Price cannot be negative")
        except (ValueError, TypeError):
            errors.append("Invalid price format")
    
    return errors