"""
Short Key Schemas for Quick Prescription Creation
Handles short key management and medicine group validation
"""

from __future__ import annotations

from pydantic import BaseModel, Field, validator, model_validator, computed_field
from typing import Optional, Dict, Any, List, Literal
from datetime import datetime
from uuid import UUID
import re

from app.schemas.medicine import MedicineResponse


class ShortKeyBase(BaseModel):
    """Base short key schema with common fields"""
    code: str = Field(..., min_length=2, max_length=20, description="Unique short key code")
    name: str = Field(..., min_length=3, max_length=255, description="Descriptive name")
    description: Optional[str] = Field(None, max_length=1000, description="Detailed description")
    is_global: bool = Field(False, description="Available to all doctors")

    @validator('code')
    def validate_code(cls, v):
        """Validate short key code format"""
        if not v:
            raise ValueError("Short key code is required")
        
        v = v.strip().upper()
        
        # Validate format: alphanumeric, 2-20 characters
        if not re.match(r'^[A-Z0-9]{2,20}$', v):
            raise ValueError("Code must be 2-20 alphanumeric characters")
        
        # Check for reserved codes
        reserved_codes = ['ALL', 'NONE', 'NULL', 'ADMIN', 'TEST', 'DELETE', 'CREATE', 'UPDATE']
        if v in reserved_codes:
            raise ValueError(f"'{v}' is a reserved code")
        
        return v

    @validator('name')
    def validate_name(cls, v):
        """Validate short key name"""
        if not v or not v.strip():
            raise ValueError("Short key name is required")
        
        v = v.strip()
        if len(v) < 3:
            raise ValueError("Name must be at least 3 characters")
        
        return v


class ShortKeyMedicineBase(BaseModel):
    """Base schema for short key medicine association"""
    medicine_id: UUID = Field(..., description="Medicine ID")
    default_dosage: str = Field(..., min_length=1, max_length=100, description="Default dosage")
    default_frequency: str = Field(..., min_length=1, max_length=100, description="Default frequency")
    default_duration: str = Field(..., min_length=1, max_length=100, description="Default duration")
    default_instructions: Optional[str] = Field(None, max_length=500, description="Default instructions")
    sequence_order: int = Field(1, ge=1, description="Order in short key")

    @validator('default_dosage', 'default_frequency', 'default_duration')
    def validate_required_fields(cls, v):
        """Validate required prescription fields"""
        if not v or not v.strip():
            raise ValueError("Field cannot be empty")
        return v.strip()


class ShortKeyMedicineCreate(ShortKeyMedicineBase):
    """Schema for adding medicine to short key"""
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "medicine_id": "123e4567-e89b-12d3-a456-426614174000",
                "default_dosage": "500mg",
                "default_frequency": "Twice daily",
                "default_duration": "5 days",
                "default_instructions": "Take with food",
                "sequence_order": 1
            }
        }
    }


class ShortKeyMedicineUpdate(BaseModel):
    """Schema for updating short key medicine"""
    default_dosage: Optional[str] = Field(None, min_length=1, max_length=100)
    default_frequency: Optional[str] = Field(None, min_length=1, max_length=100)
    default_duration: Optional[str] = Field(None, min_length=1, max_length=100)
    default_instructions: Optional[str] = Field(None, max_length=500)
    sequence_order: Optional[int] = Field(None, ge=1)

    @validator('default_dosage', 'default_frequency', 'default_duration')
    def validate_fields_if_provided(cls, v):
        """Validate fields if provided"""
        if v is not None:
            if not v or not v.strip():
                raise ValueError("Field cannot be empty")
            return v.strip()
        return v


class ShortKeyMedicineResponse(BaseModel):
    """Schema for short key medicine response"""
    id: UUID
    medicine_id: UUID
    default_dosage: str
    default_frequency: str
    default_duration: str
    default_instructions: Optional[str]
    sequence_order: int
    created_at: datetime
    updated_at: datetime
    
    # Medicine details
    medicine: Optional[MedicineResponse] = None
    
    model_config = {
        "from_attributes": True,
        "json_encoders": {
            datetime: lambda v: v.isoformat(),
            UUID: lambda v: str(v)
        }
    }


class ShortKeyCreate(ShortKeyBase):
    """Schema for creating a new short key"""
    tenant_id: Optional[UUID] = Field(None, description="Tenant ID for multi-tenancy")
    medicines: Optional[List[ShortKeyMedicineCreate]] = Field(default=[], description="Initial medicines")

    @validator('medicines')
    def validate_medicines(cls, v):
        """Validate medicines list"""
        if v:
            # Check for duplicate medicine IDs
            medicine_ids = [m.medicine_id for m in v]
            if len(medicine_ids) != len(set(medicine_ids)):
                raise ValueError("Duplicate medicines are not allowed")
            
            # Validate sequence orders
            sequence_orders = [m.sequence_order for m in v]
            if len(sequence_orders) != len(set(sequence_orders)):
                raise ValueError("Duplicate sequence orders are not allowed")
        
        return v

    model_config = {
        "json_schema_extra": {
            "example": {
                "code": "FLU",
                "name": "Common Flu Treatment",
                "description": "Standard treatment for common flu symptoms",
                "is_global": True,
                "medicines": [
                    {
                        "medicine_id": "123e4567-e89b-12d3-a456-426614174000",
                        "default_dosage": "500mg",
                        "default_frequency": "Three times daily",
                        "default_duration": "3-5 days",
                        "default_instructions": "Take with food",
                        "sequence_order": 1
                    }
                ]
            }
        }
    }


class ShortKeyUpdate(BaseModel):
    """Schema for updating short key"""
    name: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    is_global: Optional[bool] = Field(None)
    is_active: Optional[bool] = Field(None)

    @validator('name')
    def validate_name_if_provided(cls, v):
        """Validate name if provided"""
        if v is not None:
            v = v.strip()
            if len(v) < 3:
                raise ValueError("Name must be at least 3 characters")
        return v


class ShortKeyResponse(BaseModel):
    """Schema for short key response with medicines"""
    id: UUID
    code: str
    name: str
    description: Optional[str]
    created_by: UUID
    is_global: bool
    usage_count: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    # Medicines in this short key
    medicines: List[ShortKeyMedicineResponse] = Field(default=[])
    
    @computed_field
    @property
    def medicine_count(self) -> int:
        """Get count of medicines in this short key"""
        return len(self.medicines)
    
    model_config = {
        "from_attributes": True,
        "json_encoders": {
            datetime: lambda v: v.isoformat(),
            UUID: lambda v: str(v)
        }
    }


class ShortKeyListResponse(BaseModel):
    """Schema for paginated short key list response"""
    short_keys: List[ShortKeyResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_prev: bool

    model_config = {
        "json_encoders": {
            datetime: lambda v: v.isoformat(),
            UUID: lambda v: str(v)
        }
    }


class ShortKeySearchParams(BaseModel):
    """Schema for short key search parameters"""
    query: Optional[str] = Field(None, description="Search in code, name, or description")
    created_by: Optional[UUID] = Field(None, description="Filter by creator")
    is_global: Optional[bool] = Field(None, description="Filter by global status")
    include_personal: bool = Field(True, description="Include personal short keys")
    include_global: bool = Field(True, description="Include global short keys")
    is_active: Optional[bool] = Field(True, description="Filter by active status")
    
    # Pagination
    page: int = Field(1, ge=1, description="Page number")
    page_size: int = Field(20, ge=1, le=100, description="Page size")
    
    # Sorting
    sort_by: Optional[str] = Field("code", description="Sort field")
    sort_order: Optional[Literal["asc", "desc"]] = Field("asc", description="Sort order")


class ShortKeyUsageResponse(BaseModel):
    """Schema for short key usage response"""
    short_key: ShortKeyResponse
    prescription_items: List[Dict[str, Any]] = Field(default=[], description="Generated prescription items")
    
    model_config = {
        "json_encoders": {
            datetime: lambda v: v.isoformat(),
            UUID: lambda v: str(v)
        }
    }


class ShortKeyStatistics(BaseModel):
    """Schema for short key statistics"""
    total_short_keys: int
    personal_short_keys: int
    global_short_keys: int
    active_short_keys: int
    most_used: List[Dict[str, Any]] = Field(default=[])
    usage_by_creator: Dict[str, int] = Field(default={})
    recent_activity: List[Dict[str, Any]] = Field(default=[])


class ShortKeyValidationRequest(BaseModel):
    """Schema for short key validation request"""
    code: str = Field(..., description="Short key code to validate")
    exclude_id: Optional[UUID] = Field(None, description="Short key ID to exclude from uniqueness check")

    @validator('code')
    def validate_code_format(cls, v):
        """Validate code format"""
        if not v:
            raise ValueError("Code is required")
        
        v = v.strip().upper()
        
        if not re.match(r'^[A-Z0-9]{2,20}$', v):
            raise ValueError("Code must be 2-20 alphanumeric characters")
        
        return v


class ShortKeyValidationResponse(BaseModel):
    """Schema for short key validation response"""
    is_valid: bool
    code: str
    errors: List[str] = Field(default=[])
    suggestions: List[str] = Field(default=[])


class ShortKeyBulkOperation(BaseModel):
    """Schema for bulk short key operations"""
    short_key_ids: List[UUID] = Field(..., min_items=1, max_items=50, description="Short key IDs")
    operation: Literal["activate", "deactivate", "delete", "make_global", "make_personal"] = Field(..., description="Bulk operation")
    
    @validator('short_key_ids')
    def validate_unique_ids(cls, v):
        """Ensure short key IDs are unique"""
        if len(v) != len(set(v)):
            raise ValueError("Short key IDs must be unique")
        return v


class ShortKeyBulkResponse(BaseModel):
    """Schema for bulk operation response"""
    operation: str
    total_requested: int
    successful: int
    failed: int
    errors: List[str] = Field(default=[])
    processed_ids: List[UUID] = Field(default=[])


class ShortKeyTemplate(BaseModel):
    """Schema for short key template creation"""
    category: str = Field(..., description="Medical condition category")
    templates: List[ShortKeyCreate] = Field(..., description="Template short keys")


class DefaultShortKeysRequest(BaseModel):
    """Schema for creating default short keys"""
    categories: Optional[List[str]] = Field(None, description="Specific categories to create")
    overwrite_existing: bool = Field(False, description="Overwrite existing codes")


class ShortKeyExport(BaseModel):
    """Schema for short key export configuration"""
    format: Literal["csv", "json", "excel"] = Field(..., description="Export format")
    include_medicines: bool = Field(True, description="Include medicine details")
    include_usage_stats: bool = Field(False, description="Include usage statistics")
    filters: Optional[ShortKeySearchParams] = Field(None, description="Export filters")


class ShortKeyImport(BaseModel):
    """Schema for short key import"""
    source: Literal["csv", "json", "template"] = Field(..., description="Import source")
    short_keys: List[ShortKeyCreate] = Field(..., min_items=1, max_items=100, description="Short keys to import")
    overwrite_existing: bool = Field(False, description="Overwrite existing short keys")
    
    @validator('short_keys')
    def validate_import_data(cls, v):
        """Validate imported short keys"""
        codes = [sk.code.upper() for sk in v]
        if len(codes) != len(set(codes)):
            raise ValueError("Duplicate short key codes found in import data")
        return v


class ShortKeyRecommendation(BaseModel):
    """Schema for short key recommendations"""
    condition: str = Field(..., description="Medical condition")
    recommended_short_keys: List[ShortKeyResponse] = Field(..., description="Recommended short keys")
    custom_combinations: List[Dict[str, Any]] = Field(default=[], description="Custom medicine combinations")
    
    model_config = {
        "json_encoders": {
            datetime: lambda v: v.isoformat(),
            UUID: lambda v: str(v)
        }
    }