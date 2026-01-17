"""
PrescriptionTemplate model for customizable prescription layouts
Supports multi-tenancy with tenant defaults and doctor overrides
"""

from sqlalchemy import Column, String, Integer, Boolean, Text, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from typing import Dict, Any, Optional

from app.models.base import BaseModel


class PrescriptionTemplate(BaseModel):
    """
    Prescription template for customizable prescription layouts.

    Supports:
    - Tenant-level defaults (doctor_id=NULL)
    - Doctor-specific overrides (doctor_id set)
    - Multiple paper sizes (A4, A5, Letter)
    - Flexible layout configuration via JSONB
    - Logo and signature uploads
    """
    __tablename__ = "prescription_templates"

    # Multi-tenancy
    tenant_id = Column(
        UUID(as_uuid=True),
        ForeignKey('tenants.id', ondelete='CASCADE'),
        nullable=False,
        comment="Tenant this template belongs to"
    )

    doctor_id = Column(
        UUID(as_uuid=True),
        ForeignKey('doctors.id', ondelete='CASCADE'),
        nullable=True,
        comment="Doctor this template belongs to (NULL = tenant default)"
    )

    # Office/Clinic ID (references doctor's offices JSONB array id field)
    office_id = Column(
        UUID(as_uuid=True),
        nullable=True,
        comment="Office ID from doctor's offices array (NULL = doctor/tenant default)"
    )

    # Template metadata
    name = Column(
        String(100),
        nullable=False,
        comment="Template name for identification"
    )

    description = Column(
        Text,
        nullable=True,
        comment="Optional description of the template"
    )

    # Paper configuration
    paper_size = Column(
        String(20),
        nullable=False,
        default='a4',
        comment="Paper size: a4, a5, letter"
    )

    orientation = Column(
        String(20),
        nullable=False,
        default='portrait',
        comment="Page orientation: portrait, landscape"
    )

    # Margins in millimeters
    margin_top = Column(
        Integer,
        nullable=False,
        default=15,
        comment="Top margin in mm"
    )

    margin_bottom = Column(
        Integer,
        nullable=False,
        default=15,
        comment="Bottom margin in mm"
    )

    margin_left = Column(
        Integer,
        nullable=False,
        default=15,
        comment="Left margin in mm"
    )

    margin_right = Column(
        Integer,
        nullable=False,
        default=15,
        comment="Right margin in mm"
    )

    # Layout configuration (JSONB for flexibility)
    layout_config = Column(
        JSONB,
        nullable=False,
        default=dict,
        server_default='{}',
        comment="JSON configuration for layout elements"
    )

    # Branding (using Text for base64 data URLs)
    logo_url = Column(
        Text,
        nullable=True,
        comment="URL or base64 data URL for clinic logo image"
    )

    signature_url = Column(
        Text,
        nullable=True,
        comment="URL or base64 data URL for signature image"
    )

    signature_text = Column(
        String(200),
        nullable=True,
        comment="Text signature (used when no image)"
    )

    # Settings
    is_default = Column(
        Boolean,
        nullable=False,
        default=False,
        comment="Whether this is the default template"
    )

    preset_type = Column(
        String(50),
        nullable=True,
        comment="Preset type: classic, modern, minimal"
    )

    # Relationships
    tenant = relationship(
        "Tenant",
        backref="prescription_templates",
        lazy="joined"
    )

    doctor = relationship(
        "Doctor",
        backref="prescription_templates",
        lazy="joined"
    )

    # Indexes
    __table_args__ = (
        Index('idx_prescription_templates_tenant', 'tenant_id'),
        Index('idx_prescription_templates_doctor', 'doctor_id'),
        Index('idx_prescription_templates_office', 'office_id'),
        Index('idx_prescription_templates_tenant_default', 'tenant_id', 'is_default'),
        Index('idx_prescription_templates_doctor_default', 'doctor_id', 'is_default'),
        Index('idx_prescription_templates_doctor_office', 'doctor_id', 'office_id'),
    )

    def get_layout_config(self) -> Dict[str, Any]:
        """Get layout configuration as dictionary"""
        return dict(self.layout_config) if self.layout_config else {}

    def update_layout_config(self, new_config: Dict[str, Any]) -> None:
        """Update layout configuration"""
        current_config = self.get_layout_config()
        current_config.update(new_config)
        self.layout_config = current_config

    def get_margins(self) -> Dict[str, int]:
        """Get all margins as dictionary"""
        return {
            'top': self.margin_top,
            'bottom': self.margin_bottom,
            'left': self.margin_left,
            'right': self.margin_right,
        }

    def get_paper_dimensions_mm(self) -> Dict[str, int]:
        """Get paper dimensions in millimeters"""
        dimensions = {
            'a4': {'width': 210, 'height': 297},
            'a5': {'width': 148, 'height': 210},
            'letter': {'width': 216, 'height': 279},
        }
        size = dimensions.get(self.paper_size.lower(), dimensions['a4'])

        # Swap for landscape
        if self.orientation == 'landscape':
            return {'width': size['height'], 'height': size['width']}
        return size

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary with computed fields"""
        data = super().to_dict()
        data.update({
            'margins': self.get_margins(),
            'paper_dimensions_mm': self.get_paper_dimensions_mm(),
        })
        return data

    def __repr__(self) -> str:
        return f"<PrescriptionTemplate(id={self.id}, name='{self.name}', tenant_id={self.tenant_id})>"

    def __str__(self) -> str:
        scope = "doctor" if self.doctor_id else "tenant"
        return f"{self.name} ({scope} template)"


# Default preset configurations
PRESET_TEMPLATES = {
    "classic": {
        "name": "Classic",
        "description": "Traditional formal layout with logo on left",
        "paper_size": "a4",
        "orientation": "portrait",
        "margin_top": 15,
        "margin_bottom": 15,
        "margin_left": 15,
        "margin_right": 15,
        "layout_config": {
            "header": {
                "logo": {"position": "left", "size": "medium", "maxWidth": 80},
                "clinicName": {"position": "center", "fontSize": 20, "fontWeight": "bold"},
                "clinicAddress": {"position": "center", "fontSize": 11},
                "clinicPhone": {"show": True, "position": "center", "fontSize": 10},
            },
            "doctorInfo": {
                "position": "below-header",
                "showLicense": True,
                "showSpecialization": True,
                "fontSize": 11,
            },
            "patientSection": {
                "layout": "two-column",
                "fields": ["name", "age", "gender", "date", "rxNumber"],
                "fontSize": 11,
            },
            "prescriptionTable": {
                "columns": ["medicine", "dosage", "frequency", "duration", "instructions"],
                "showQuantity": False,
                "showPrice": False,
                "headerFontSize": 11,
                "bodyFontSize": 10,
            },
            "footer": {
                "signature": {"position": "right", "type": "text"},
                "showDate": True,
                "fontSize": 10,
            },
        },
    },
    "modern": {
        "name": "Modern",
        "description": "Clean minimalist design with centered elements",
        "paper_size": "a4",
        "orientation": "portrait",
        "margin_top": 20,
        "margin_bottom": 20,
        "margin_left": 20,
        "margin_right": 20,
        "layout_config": {
            "header": {
                "logo": {"position": "center", "size": "large", "maxWidth": 120},
                "clinicName": {"position": "center", "fontSize": 24, "fontWeight": "bold"},
                "clinicAddress": {"position": "center", "fontSize": 12},
                "clinicPhone": {"show": True, "position": "center", "fontSize": 11},
                "accentColor": "#667eea",
                "showDivider": True,
            },
            "doctorInfo": {
                "position": "below-header",
                "showLicense": True,
                "showSpecialization": True,
                "fontSize": 12,
                "useAccentColor": True,
            },
            "patientSection": {
                "layout": "single-row",
                "fields": ["name", "age", "gender", "date", "rxNumber"],
                "fontSize": 12,
                "showBorder": True,
            },
            "prescriptionTable": {
                "columns": ["medicine", "dosage", "frequency", "duration", "instructions"],
                "showQuantity": False,
                "showPrice": False,
                "headerFontSize": 12,
                "bodyFontSize": 11,
                "alternateRowColor": True,
            },
            "footer": {
                "signature": {"position": "right", "type": "image"},
                "showDate": True,
                "fontSize": 11,
            },
        },
    },
    "minimal": {
        "name": "Minimal",
        "description": "Compact A5-optimized design with essential info only",
        "paper_size": "a5",
        "orientation": "portrait",
        "margin_top": 10,
        "margin_bottom": 10,
        "margin_left": 10,
        "margin_right": 10,
        "layout_config": {
            "header": {
                "logo": {"position": "left", "size": "small", "maxWidth": 50},
                "clinicName": {"position": "right", "fontSize": 14, "fontWeight": "bold"},
                "clinicAddress": {"position": "right", "fontSize": 9},
                "clinicPhone": {"show": True, "position": "right", "fontSize": 9},
            },
            "doctorInfo": {
                "position": "inline-header",
                "showLicense": False,
                "showSpecialization": True,
                "fontSize": 9,
                "compact": True,
            },
            "patientSection": {
                "layout": "compact",
                "fields": ["name", "age", "date"],
                "fontSize": 9,
            },
            "prescriptionTable": {
                "columns": ["medicine", "dosage", "frequency", "duration"],
                "showQuantity": False,
                "showPrice": False,
                "headerFontSize": 9,
                "bodyFontSize": 9,
                "compact": True,
            },
            "footer": {
                "signature": {"position": "right", "type": "text"},
                "showDate": False,
                "fontSize": 9,
                "compact": True,
            },
        },
    },
}


def create_template_from_preset(
    preset_type: str,
    tenant_id: str,
    doctor_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Create template data from a preset.
    Returns dictionary suitable for creating PrescriptionTemplate.
    """
    if preset_type not in PRESET_TEMPLATES:
        raise ValueError(f"Unknown preset type: {preset_type}. Valid: {list(PRESET_TEMPLATES.keys())}")

    preset = PRESET_TEMPLATES[preset_type]

    return {
        "tenant_id": tenant_id,
        "doctor_id": doctor_id,
        "name": preset["name"],
        "description": preset["description"],
        "paper_size": preset["paper_size"],
        "orientation": preset["orientation"],
        "margin_top": preset["margin_top"],
        "margin_bottom": preset["margin_bottom"],
        "margin_left": preset["margin_left"],
        "margin_right": preset["margin_right"],
        "layout_config": preset["layout_config"],
        "preset_type": preset_type,
        "is_default": False,
    }
