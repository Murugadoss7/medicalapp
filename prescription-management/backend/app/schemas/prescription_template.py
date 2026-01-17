"""
Prescription Template Schemas for Customizable Prescription Layouts
Supports multi-tenancy with tenant defaults and doctor overrides
"""

from __future__ import annotations

from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any, List, Literal
from datetime import datetime
from uuid import UUID


class LayoutConfigHeader(BaseModel):
    """Header layout configuration"""
    logo: Optional[Dict[str, Any]] = Field(default={"position": "left", "size": "medium", "maxWidth": 80})
    clinicName: Optional[Dict[str, Any]] = Field(default={"position": "center", "fontSize": 20, "fontWeight": "bold"})
    clinicAddress: Optional[Dict[str, Any]] = Field(default={"position": "center", "fontSize": 11})
    clinicPhone: Optional[Dict[str, Any]] = Field(default={"show": True, "position": "center", "fontSize": 10})
    accentColor: Optional[str] = Field(None, description="Accent color for header")
    showDivider: Optional[bool] = Field(True, description="Show divider below header")


class LayoutConfigDoctorInfo(BaseModel):
    """Doctor info layout configuration"""
    position: Optional[str] = Field("below-header", description="Position: below-header, inline-header")
    showLicense: Optional[bool] = Field(True, description="Show license number")
    showSpecialization: Optional[bool] = Field(True, description="Show specialization")
    fontSize: Optional[int] = Field(11, description="Font size")
    useAccentColor: Optional[bool] = Field(False, description="Use accent color")
    compact: Optional[bool] = Field(False, description="Compact mode")


class LayoutConfigPatientSection(BaseModel):
    """Patient section layout configuration"""
    layout: Optional[str] = Field("two-column", description="Layout: two-column, single-row, compact")
    fields: Optional[List[str]] = Field(
        default=["name", "age", "gender", "date", "rxNumber"],
        description="Fields to show"
    )
    fontSize: Optional[int] = Field(11, description="Font size")
    showBorder: Optional[bool] = Field(False, description="Show border around section")


class LayoutConfigPrescriptionTable(BaseModel):
    """Prescription table layout configuration"""
    columns: Optional[List[str]] = Field(
        default=["medicine", "dosage", "frequency", "duration", "instructions"],
        description="Columns to show"
    )
    showQuantity: Optional[bool] = Field(False, description="Show quantity column")
    showPrice: Optional[bool] = Field(False, description="Show price column")
    headerFontSize: Optional[int] = Field(11, description="Header font size")
    bodyFontSize: Optional[int] = Field(10, description="Body font size")
    alternateRowColor: Optional[bool] = Field(False, description="Alternate row colors")
    compact: Optional[bool] = Field(False, description="Compact mode")


class LayoutConfigFooter(BaseModel):
    """Footer layout configuration"""
    signature: Optional[Dict[str, Any]] = Field(default={"position": "right", "type": "text"})
    showDate: Optional[bool] = Field(True, description="Show date in footer")
    fontSize: Optional[int] = Field(10, description="Font size")
    compact: Optional[bool] = Field(False, description="Compact mode")


class LayoutConfig(BaseModel):
    """Complete layout configuration for prescription template"""
    header: Optional[LayoutConfigHeader] = Field(default_factory=LayoutConfigHeader)
    doctorInfo: Optional[LayoutConfigDoctorInfo] = Field(default_factory=LayoutConfigDoctorInfo)
    patientSection: Optional[LayoutConfigPatientSection] = Field(default_factory=LayoutConfigPatientSection)
    prescriptionTable: Optional[LayoutConfigPrescriptionTable] = Field(default_factory=LayoutConfigPrescriptionTable)
    footer: Optional[LayoutConfigFooter] = Field(default_factory=LayoutConfigFooter)


class PrescriptionTemplateBase(BaseModel):
    """Base schema for prescription template"""
    name: str = Field(..., min_length=1, max_length=100, description="Template name")
    description: Optional[str] = Field(None, max_length=1000, description="Template description")
    paper_size: str = Field("a4", description="Paper size: a4, a5, letter")
    orientation: str = Field("portrait", description="Orientation: portrait, landscape")
    margin_top: int = Field(15, ge=0, le=50, description="Top margin in mm")
    margin_bottom: int = Field(15, ge=0, le=50, description="Bottom margin in mm")
    margin_left: int = Field(15, ge=0, le=50, description="Left margin in mm")
    margin_right: int = Field(15, ge=0, le=50, description="Right margin in mm")
    layout_config: Dict[str, Any] = Field(default_factory=dict, description="Layout configuration")
    signature_text: Optional[str] = Field(None, max_length=200, description="Text signature")
    is_default: bool = Field(False, description="Is default template")

    @validator('paper_size')
    def validate_paper_size(cls, v):
        """Validate paper size"""
        valid_sizes = ['a4', 'a5', 'letter']
        if v.lower() not in valid_sizes:
            raise ValueError(f"Paper size must be one of: {', '.join(valid_sizes)}")
        return v.lower()

    @validator('orientation')
    def validate_orientation(cls, v):
        """Validate orientation"""
        valid_orientations = ['portrait', 'landscape']
        if v.lower() not in valid_orientations:
            raise ValueError(f"Orientation must be one of: {', '.join(valid_orientations)}")
        return v.lower()

    @validator('name')
    def validate_name(cls, v):
        """Validate template name"""
        if not v or not v.strip():
            raise ValueError("Template name is required")
        return v.strip()


class PrescriptionTemplateCreate(PrescriptionTemplateBase):
    """Schema for creating a new prescription template"""
    tenant_id: Optional[UUID] = Field(None, description="Tenant ID (auto-set from context)")
    doctor_id: Optional[UUID] = Field(None, description="Doctor ID for doctor-specific template")
    office_id: Optional[UUID] = Field(None, description="Office ID for office-specific template")
    preset_type: Optional[str] = Field(None, description="Preset type: classic, modern, minimal")

    model_config = {
        "json_schema_extra": {
            "example": {
                "name": "My Clinic Template",
                "description": "Custom template for my clinic",
                "paper_size": "a4",
                "orientation": "portrait",
                "margin_top": 15,
                "margin_bottom": 15,
                "margin_left": 15,
                "margin_right": 15,
                "layout_config": {
                    "header": {
                        "logo": {"position": "left", "size": "medium"},
                        "clinicName": {"position": "center", "fontSize": 20}
                    }
                },
                "signature_text": "Dr. John Doe",
                "is_default": True
            }
        }
    }


class PrescriptionTemplateCreateFromPreset(BaseModel):
    """Schema for creating a template from a preset"""
    preset_type: Literal["classic", "modern", "minimal"] = Field(..., description="Preset type")
    name: Optional[str] = Field(None, description="Custom name (uses preset name if not provided)")
    doctor_id: Optional[UUID] = Field(None, description="Doctor ID for doctor-specific template")
    office_id: Optional[UUID] = Field(None, description="Office ID for office-specific template")
    is_default: bool = Field(False, description="Set as default template")

    model_config = {
        "json_schema_extra": {
            "example": {
                "preset_type": "classic",
                "name": "My Classic Template",
                "is_default": True
            }
        }
    }


class PrescriptionTemplateUpdate(BaseModel):
    """Schema for updating a prescription template"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=1000)
    paper_size: Optional[str] = Field(None)
    orientation: Optional[str] = Field(None)
    margin_top: Optional[int] = Field(None, ge=0, le=50)
    margin_bottom: Optional[int] = Field(None, ge=0, le=50)
    margin_left: Optional[int] = Field(None, ge=0, le=50)
    margin_right: Optional[int] = Field(None, ge=0, le=50)
    layout_config: Optional[Dict[str, Any]] = Field(None)
    logo_url: Optional[str] = Field(None)
    signature_url: Optional[str] = Field(None)
    signature_text: Optional[str] = Field(None, max_length=200)
    is_default: Optional[bool] = Field(None)
    doctor_id: Optional[str] = Field(None)  # null = clinic default, uuid = doctor-specific
    office_id: Optional[str] = Field(None)  # null = doctor default, uuid = office-specific

    @validator('paper_size')
    def validate_paper_size(cls, v):
        """Validate paper size if provided"""
        if v is not None:
            valid_sizes = ['a4', 'a5', 'letter']
            if v.lower() not in valid_sizes:
                raise ValueError(f"Paper size must be one of: {', '.join(valid_sizes)}")
            return v.lower()
        return v

    @validator('orientation')
    def validate_orientation(cls, v):
        """Validate orientation if provided"""
        if v is not None:
            valid_orientations = ['portrait', 'landscape']
            if v.lower() not in valid_orientations:
                raise ValueError(f"Orientation must be one of: {', '.join(valid_orientations)}")
            return v.lower()
        return v


class PrescriptionTemplateResponse(BaseModel):
    """Schema for prescription template response"""
    id: UUID
    tenant_id: UUID
    doctor_id: Optional[UUID]
    office_id: Optional[UUID]
    name: str
    description: Optional[str]
    paper_size: str
    orientation: str
    margin_top: int
    margin_bottom: int
    margin_left: int
    margin_right: int
    layout_config: Dict[str, Any]
    logo_url: Optional[str]
    signature_url: Optional[str]
    signature_text: Optional[str]
    is_default: bool
    preset_type: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    # Computed fields
    margins: Optional[Dict[str, int]] = Field(None, description="All margins as object")
    paper_dimensions_mm: Optional[Dict[str, int]] = Field(None, description="Paper dimensions in mm")

    model_config = {
        "from_attributes": True,
        "json_encoders": {
            datetime: lambda v: v.isoformat(),
            UUID: lambda v: str(v)
        }
    }


class PrescriptionTemplateListResponse(BaseModel):
    """Schema for paginated template list response"""
    templates: List[PrescriptionTemplateResponse]
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


class PresetTemplateInfo(BaseModel):
    """Schema for preset template information"""
    type: str = Field(..., description="Preset type: classic, modern, minimal")
    name: str = Field(..., description="Preset name")
    description: str = Field(..., description="Preset description")
    paper_size: str = Field(..., description="Default paper size")
    preview_config: Dict[str, Any] = Field(..., description="Layout config for preview")

    model_config = {
        "json_schema_extra": {
            "example": {
                "type": "classic",
                "name": "Classic",
                "description": "Traditional formal layout with logo on left",
                "paper_size": "a4",
                "preview_config": {}
            }
        }
    }


class PresetTemplateListResponse(BaseModel):
    """Schema for list of available presets"""
    presets: List[PresetTemplateInfo]


class EffectiveTemplateRequest(BaseModel):
    """Schema for getting effective template"""
    doctor_id: Optional[UUID] = Field(None, description="Doctor ID to check for doctor-specific template")
    office_id: Optional[UUID] = Field(None, description="Office ID to check for office-specific template")


class FileUploadResponse(BaseModel):
    """Schema for file upload response"""
    url: str = Field(..., description="URL to the uploaded file")
    filename: str = Field(..., description="Original filename")
    content_type: str = Field(..., description="File content type")
    size: int = Field(..., description="File size in bytes")


class TemplateSearchParams(BaseModel):
    """Schema for template search parameters"""
    query: Optional[str] = Field(None, description="Search in name and description")
    doctor_id: Optional[UUID] = Field(None, description="Filter by doctor")
    office_id: Optional[UUID] = Field(None, description="Filter by office")
    preset_type: Optional[str] = Field(None, description="Filter by preset type")
    is_default: Optional[bool] = Field(None, description="Filter by default status")
    is_active: Optional[bool] = Field(True, description="Filter by active status")

    # Pagination
    page: int = Field(1, ge=1, description="Page number")
    page_size: int = Field(20, ge=1, le=100, description="Page size")

    # Sorting
    sort_by: Optional[str] = Field("created_at", description="Sort field")
    sort_order: Optional[Literal["asc", "desc"]] = Field("desc", description="Sort order")
