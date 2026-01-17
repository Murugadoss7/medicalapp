"""
Medicine Schemas for Drug Catalog Management
Handles medicine data validation, search, and drug interaction checking
"""

from __future__ import annotations

from pydantic import BaseModel, Field, validator, model_validator, computed_field
from typing import Optional, Dict, Any, List, Literal
from datetime import datetime
from uuid import UUID
from decimal import Decimal
import re


# Common dosage forms for validation
COMMON_DOSAGE_FORMS = [
    "tablet", "capsule", "syrup", "injection", "cream", "ointment",
    "drops", "spray", "inhaler", "suppository", "gel", "lotion",
    "powder", "solution", "suspension", "patch", "foam"
]


class MedicineBase(BaseModel):
    """Base medicine schema with common fields"""
    name: str = Field(..., min_length=2, max_length=255, description="Medicine brand name")
    generic_name: Optional[str] = Field(None, max_length=255, description="Generic/scientific name")
    composition: str = Field(..., min_length=5, max_length=1000, description="Active ingredients and composition")
    manufacturer: Optional[str] = Field(None, max_length=255, description="Manufacturing company")
    dosage_forms: Optional[List[str]] = Field(None, description="Available dosage forms")
    strength: Optional[str] = Field(None, max_length=100, description="Medicine strength")
    drug_category: Optional[str] = Field(None, max_length=100, description="Drug category")
    price: Optional[Decimal] = Field(None, ge=0, le=999999.99, description="Price per unit")
    requires_prescription: bool = Field(True, description="Whether prescription is required")
    atc_code: Optional[str] = Field(None, max_length=20, description="ATC classification code")
    storage_conditions: Optional[str] = Field(None, max_length=500, description="Storage requirements")
    contraindications: Optional[str] = Field(None, max_length=1000, description="Contraindications")
    side_effects: Optional[str] = Field(None, max_length=1000, description="Common side effects")

    @validator('name', 'generic_name')
    def validate_names(cls, v):
        """Validate medicine names"""
        if v:
            v = v.strip()
            if len(v) < 2:
                raise ValueError("Name must be at least 2 characters long")
        return v

    @validator('dosage_forms')
    def validate_dosage_forms(cls, v):
        """Validate dosage forms"""
        if v:
            validated_forms = []
            for form in v:
                form_clean = form.strip().lower()
                if form_clean and (form_clean in COMMON_DOSAGE_FORMS or len(form_clean) > 2):
                    validated_forms.append(form_clean)
            return validated_forms if validated_forms else None
        return v

    @validator('strength')
    def validate_strength(cls, v):
        """Validate strength format"""
        if v:
            v = v.strip()
            # Basic validation for common strength formats
            pattern = r'^[\d\.\s]+(mg|g|ml|l|iu|mcg|%|units?|tabs?)'
            if not re.match(pattern, v.lower()):
                # Still allow other formats but log warning
                pass
        return v

    @validator('atc_code')
    def validate_atc_code(cls, v):
        """Validate ATC code format - accepts any alphanumeric code"""
        if v:
            v = v.strip().upper()
            # Accept any alphanumeric code (relaxed validation)
            # Standard ATC format is: Letter + 2 digits + Letter + Letter + 2 digits (e.g., N02BE01)
            # But we allow custom codes for flexibility
        return v


class MedicineCreate(MedicineBase):
    """Schema for creating a new medicine"""
    tenant_id: Optional[UUID] = Field(None, description="Tenant ID - NULL for global medicines")

    model_config = {
        "json_encoders": {
            Decimal: lambda v: float(v),
            datetime: lambda v: v.isoformat()
        },
        "json_schema_extra": {
            "example": {
                "name": "Paracetamol",
                "generic_name": "Acetaminophen",
                "composition": "Paracetamol 500mg",
                "manufacturer": "ABC Pharmaceuticals",
                "dosage_forms": ["tablet", "syrup"],
                "strength": "500mg",
                "drug_category": "analgesic",
                "price": 25.50,
                "requires_prescription": False,
                "atc_code": "N02BE01",
                "storage_conditions": "Store below 30°C in dry place",
                "contraindications": "Hypersensitivity to paracetamol",
                "side_effects": "Rare: skin rash, nausea"
            }
        }
    }


class MedicineUpdate(BaseModel):
    """Schema for updating medicine information"""
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    generic_name: Optional[str] = Field(None, max_length=255)
    composition: Optional[str] = Field(None, min_length=5, max_length=1000)
    manufacturer: Optional[str] = Field(None, max_length=255)
    dosage_forms: Optional[List[str]] = Field(None)
    strength: Optional[str] = Field(None, max_length=100)
    drug_category: Optional[str] = Field(None, max_length=100)
    price: Optional[Decimal] = Field(None, ge=0, le=999999.99)
    requires_prescription: Optional[bool] = Field(None)
    atc_code: Optional[str] = Field(None, max_length=20)
    storage_conditions: Optional[str] = Field(None, max_length=500)
    contraindications: Optional[str] = Field(None, max_length=1000)
    side_effects: Optional[str] = Field(None, max_length=1000)
    is_active: Optional[bool] = Field(None)

    @validator('name', 'generic_name')
    def validate_names(cls, v):
        """Validate medicine names if provided"""
        if v:
            v = v.strip()
            if len(v) < 2:
                raise ValueError("Name must be at least 2 characters long")
        return v

    @validator('dosage_forms')
    def validate_dosage_forms(cls, v):
        """Validate dosage forms if provided"""
        if v:
            validated_forms = []
            for form in v:
                form_clean = form.strip().lower()
                if form_clean and (form_clean in COMMON_DOSAGE_FORMS or len(form_clean) > 2):
                    validated_forms.append(form_clean)
            return validated_forms if validated_forms else None
        return v


class MedicineResponse(BaseModel):
    """Schema for medicine response with computed fields"""
    id: UUID
    name: str
    generic_name: Optional[str]
    composition: str
    manufacturer: Optional[str]
    dosage_forms: Optional[List[str]]
    strength: Optional[str]
    drug_category: Optional[str]
    price: Optional[Decimal]
    requires_prescription: bool
    atc_code: Optional[str]
    storage_conditions: Optional[str]
    contraindications: Optional[str]
    side_effects: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    created_by: Optional[UUID]
    
    @computed_field
    @property
    def display_name(self) -> str:
        """Get formatted display name"""
        if self.generic_name and self.generic_name != self.name:
            return f"{self.name} ({self.generic_name})"
        return self.name
    
    @computed_field
    @property
    def full_description(self) -> str:
        """Get full medicine description"""
        parts = [self.name]
        
        if self.strength:
            parts.append(f"{self.strength}")
        
        if self.composition:
            parts.append(f"- {self.composition}")
            
        if self.manufacturer:
            parts.append(f"by {self.manufacturer}")
            
        return " ".join(parts)
    
    @computed_field
    @property 
    def is_over_the_counter(self) -> bool:
        """Check if medicine is available over the counter"""
        return not self.requires_prescription
    
    @computed_field
    @property
    def price_formatted(self) -> str:
        """Get formatted price string"""
        if self.price:
            return f"₹{self.price:.2f}"
        return "Price not available"

    model_config = {
        "from_attributes": True,
        "json_encoders": {
            Decimal: lambda v: float(v),
            datetime: lambda v: v.isoformat(),
            UUID: lambda v: str(v)
        }
    }


class MedicineSearchParams(BaseModel):
    """Schema for medicine search parameters"""
    query: Optional[str] = Field(None, description="Search in name, generic name, or composition")
    category: Optional[str] = Field(None, description="Filter by drug category")
    manufacturer: Optional[str] = Field(None, description="Filter by manufacturer")
    requires_prescription: Optional[bool] = Field(None, description="Filter by prescription requirement")
    dosage_form: Optional[str] = Field(None, description="Filter by dosage form")
    min_price: Optional[Decimal] = Field(None, ge=0, description="Minimum price filter")
    max_price: Optional[Decimal] = Field(None, ge=0, description="Maximum price filter")
    is_active: Optional[bool] = Field(True, description="Filter by active status")
    
    # Pagination
    page: int = Field(1, ge=1, description="Page number")
    page_size: int = Field(20, ge=1, le=100, description="Page size")
    
    # Sorting
    sort_by: Optional[str] = Field("name", description="Sort field")
    sort_order: Optional[Literal["asc", "desc"]] = Field("asc", description="Sort order")

    @validator('max_price')
    def validate_price_range(cls, v, values):
        """Validate price range"""
        min_price = values.get('min_price')
        if min_price is not None and v is not None and v < min_price:
            raise ValueError("Maximum price must be greater than minimum price")
        return v


class MedicineListResponse(BaseModel):
    """Schema for paginated medicine list response"""
    medicines: List[MedicineResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_prev: bool

    model_config = {
        "json_encoders": {
            Decimal: lambda v: float(v),
            datetime: lambda v: v.isoformat(),
            UUID: lambda v: str(v)
        }
    }


class DrugInteractionRequest(BaseModel):
    """Schema for drug interaction checking request"""
    medicine_ids: List[UUID] = Field(..., min_items=2, max_items=10, description="Medicine IDs to check")

    @validator('medicine_ids')
    def validate_unique_medicines(cls, v):
        """Ensure medicine IDs are unique"""
        if len(v) != len(set(v)):
            raise ValueError("Medicine IDs must be unique")
        return v


class DrugInteraction(BaseModel):
    """Schema for drug interaction response"""
    severity: Literal["low", "moderate", "high", "severe"] = Field(..., description="Interaction severity")
    description: str = Field(..., description="Interaction description")
    recommendation: str = Field(..., description="Clinical recommendation")
    medicines_involved: List[str] = Field(..., description="Names of medicines involved")


class DrugInteractionResponse(BaseModel):
    """Schema for drug interaction check response"""
    has_interactions: bool = Field(..., description="Whether interactions were found")
    interactions: List[DrugInteraction] = Field(default=[], description="List of interactions")
    checked_medicines: List[MedicineResponse] = Field(..., description="Medicines that were checked")
    
    model_config = {
        "json_encoders": {
            Decimal: lambda v: float(v),
            datetime: lambda v: v.isoformat(),
            UUID: lambda v: str(v)
        }
    }


class MedicineStatistics(BaseModel):
    """Schema for medicine statistics"""
    total_medicines: int
    active_medicines: int
    inactive_medicines: int
    prescription_required: int
    over_the_counter: int
    categories: Dict[str, int]
    manufacturers: Dict[str, int]
    dosage_forms: Dict[str, int]
    price_ranges: Dict[str, int]


class MedicineBulkOperation(BaseModel):
    """Schema for bulk medicine operations"""
    medicine_ids: List[UUID] = Field(..., min_items=1, max_items=100, description="Medicine IDs")
    operation: Literal["activate", "deactivate", "delete"] = Field(..., description="Bulk operation type")
    
    @validator('medicine_ids')
    def validate_unique_medicines(cls, v):
        """Ensure medicine IDs are unique"""
        if len(v) != len(set(v)):
            raise ValueError("Medicine IDs must be unique")
        return v


class MedicineBulkResponse(BaseModel):
    """Schema for bulk operation response"""
    operation: str
    total_requested: int
    successful: int
    failed: int
    errors: List[str] = Field(default=[])
    processed_ids: List[UUID] = Field(default=[])


class MedicineImport(BaseModel):
    """Schema for medicine import from external sources"""
    source: Literal["csv", "api", "manual"] = Field(..., description="Import source")
    medicines: List[MedicineCreate] = Field(..., min_items=1, max_items=1000, description="Medicines to import")
    overwrite_existing: bool = Field(False, description="Whether to overwrite existing medicines")
    
    @validator('medicines')
    def validate_medicines_data(cls, v):
        """Validate imported medicines data"""
        names = [m.name.lower() for m in v]
        if len(names) != len(set(names)):
            raise ValueError("Duplicate medicine names found in import data")
        return v


class MedicineExport(BaseModel):
    """Schema for medicine export configuration"""
    format: Literal["csv", "json", "excel"] = Field(..., description="Export format")
    filters: Optional[MedicineSearchParams] = Field(None, description="Export filters")
    include_inactive: bool = Field(False, description="Include inactive medicines")
    fields: Optional[List[str]] = Field(None, description="Specific fields to export")


class PrescriptionTemplate(BaseModel):
    """Schema for prescription template with medicine defaults"""
    medicine_id: UUID = Field(..., description="Medicine ID")
    default_dosage: str = Field(..., min_length=1, max_length=100, description="Default dosage")
    default_frequency: str = Field(..., min_length=1, max_length=100, description="Default frequency")
    default_duration: str = Field(..., min_length=1, max_length=100, description="Default duration")
    default_instructions: Optional[str] = Field(None, max_length=500, description="Default instructions")

    @validator('default_dosage', 'default_frequency', 'default_duration')
    def validate_prescription_fields(cls, v):
        """Validate prescription template fields"""
        if not v or not v.strip():
            raise ValueError("Field cannot be empty")
        return v.strip()


class MedicineRecommendation(BaseModel):
    """Schema for medicine recommendations based on symptoms/conditions"""
    condition: str = Field(..., description="Medical condition or symptoms")
    recommended_medicines: List[MedicineResponse] = Field(..., description="Recommended medicines")
    alternatives: List[MedicineResponse] = Field(default=[], description="Alternative medicines")
    warnings: List[str] = Field(default=[], description="Important warnings")
    
    model_config = {
        "json_encoders": {
            Decimal: lambda v: float(v),
            datetime: lambda v: v.isoformat(),
            UUID: lambda v: str(v)
        }
    }