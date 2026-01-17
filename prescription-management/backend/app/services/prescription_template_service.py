"""
Prescription Template Service for Customizable Prescription Layouts
Handles template CRUD operations with fallback logic for multi-tenancy
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc, asc
from typing import Optional, List, Dict, Any, Tuple
from uuid import UUID
import logging

from app.models.prescription_template import (
    PrescriptionTemplate,
    PRESET_TEMPLATES,
    create_template_from_preset
)
from app.schemas.prescription_template import (
    PrescriptionTemplateCreate,
    PrescriptionTemplateUpdate,
    PrescriptionTemplateCreateFromPreset,
    TemplateSearchParams
)
from app.core.exceptions import (
    NotFoundError,
    ValidationError,
    BusinessRuleError,
    DuplicateError
)

logger = logging.getLogger(__name__)


class PrescriptionTemplateService:
    """Service class for prescription template management"""

    def __init__(self):
        pass

    # Core CRUD Operations

    def create_template(
        self,
        db: Session,
        template_data: PrescriptionTemplateCreate,
        tenant_id: UUID,
        created_by: UUID
    ) -> PrescriptionTemplate:
        """
        Create a new prescription template.
        Ensures only one default template per scope (tenant/doctor).
        """
        # If setting as default, unset existing defaults
        if template_data.is_default:
            self._unset_existing_defaults(
                db,
                tenant_id,
                template_data.doctor_id
            )

        # Create template instance
        template = PrescriptionTemplate(
            tenant_id=tenant_id,
            doctor_id=template_data.doctor_id,
            office_id=template_data.office_id,
            name=template_data.name,
            description=template_data.description,
            paper_size=template_data.paper_size,
            orientation=template_data.orientation,
            margin_top=template_data.margin_top,
            margin_bottom=template_data.margin_bottom,
            margin_left=template_data.margin_left,
            margin_right=template_data.margin_right,
            layout_config=template_data.layout_config or {},
            signature_text=template_data.signature_text,
            is_default=template_data.is_default,
            preset_type=template_data.preset_type,
            created_by=created_by
        )

        try:
            db.add(template)
            db.commit()
            # Don't refresh after commit - RLS blocks it

            logger.info(f"Created prescription template: {template.name} for tenant {tenant_id}")
            return template

        except Exception as e:
            db.rollback()
            logger.error(f"Error creating template: {str(e)}")
            raise BusinessRuleError(f"Failed to create template: {str(e)}")

    def create_from_preset(
        self,
        db: Session,
        preset_data: PrescriptionTemplateCreateFromPreset,
        tenant_id: UUID,
        created_by: UUID
    ) -> PrescriptionTemplate:
        """
        Create a template from a preset (classic, modern, minimal).
        """
        preset_type = preset_data.preset_type

        if preset_type not in PRESET_TEMPLATES:
            raise ValidationError(f"Invalid preset type: {preset_type}. Valid: {list(PRESET_TEMPLATES.keys())}")

        # Get preset config
        preset = PRESET_TEMPLATES[preset_type]

        # If setting as default, unset existing defaults
        if preset_data.is_default:
            self._unset_existing_defaults(
                db,
                tenant_id,
                preset_data.doctor_id
            )

        # Create template from preset
        template = PrescriptionTemplate(
            tenant_id=tenant_id,
            doctor_id=preset_data.doctor_id,
            office_id=preset_data.office_id,
            name=preset_data.name or preset["name"],
            description=preset["description"],
            paper_size=preset["paper_size"],
            orientation=preset["orientation"],
            margin_top=preset["margin_top"],
            margin_bottom=preset["margin_bottom"],
            margin_left=preset["margin_left"],
            margin_right=preset["margin_right"],
            layout_config=preset["layout_config"],
            preset_type=preset_type,
            is_default=preset_data.is_default,
            created_by=created_by
        )

        try:
            db.add(template)
            db.commit()

            logger.info(f"Created template from preset '{preset_type}' for tenant {tenant_id}")
            return template

        except Exception as e:
            db.rollback()
            logger.error(f"Error creating template from preset: {str(e)}")
            raise BusinessRuleError(f"Failed to create template from preset: {str(e)}")

    def get_template_by_id(
        self,
        db: Session,
        template_id: UUID
    ) -> Optional[PrescriptionTemplate]:
        """Get template by ID"""
        return db.query(PrescriptionTemplate).filter(
            PrescriptionTemplate.id == template_id,
            PrescriptionTemplate.is_active == True
        ).first()

    def get_effective_template(
        self,
        db: Session,
        tenant_id: UUID,
        doctor_id: Optional[UUID] = None,
        office_id: Optional[UUID] = None
    ) -> Optional[PrescriptionTemplate]:
        """
        Get the effective template for printing prescriptions.

        Fallback logic (most specific to least specific):
        1. Doctor + Office specific template (if both provided)
        2. Doctor's default template (if doctor_id provided)
        3. Tenant's default template
        4. Any tenant template
        5. None (use system default in frontend)
        """
        # 1. Try doctor + office specific template
        if doctor_id and office_id:
            template = db.query(PrescriptionTemplate).filter(
                PrescriptionTemplate.tenant_id == tenant_id,
                PrescriptionTemplate.doctor_id == doctor_id,
                PrescriptionTemplate.office_id == office_id,
                PrescriptionTemplate.is_active == True
            ).first()

            if template:
                logger.debug(f"Using doctor+office template: {template.id}")
                return template

        # 2. Try doctor's default template (no office specified)
        if doctor_id:
            template = db.query(PrescriptionTemplate).filter(
                PrescriptionTemplate.tenant_id == tenant_id,
                PrescriptionTemplate.doctor_id == doctor_id,
                PrescriptionTemplate.office_id.is_(None),
                PrescriptionTemplate.is_default == True,
                PrescriptionTemplate.is_active == True
            ).first()

            if template:
                logger.debug(f"Using doctor's default template: {template.id}")
                return template

            # Try any doctor template (no office)
            template = db.query(PrescriptionTemplate).filter(
                PrescriptionTemplate.tenant_id == tenant_id,
                PrescriptionTemplate.doctor_id == doctor_id,
                PrescriptionTemplate.office_id.is_(None),
                PrescriptionTemplate.is_active == True
            ).first()

            if template:
                logger.debug(f"Using doctor's template: {template.id}")
                return template

        # 3. Try tenant's default template
        template = db.query(PrescriptionTemplate).filter(
            PrescriptionTemplate.tenant_id == tenant_id,
            PrescriptionTemplate.doctor_id.is_(None),
            PrescriptionTemplate.office_id.is_(None),
            PrescriptionTemplate.is_default == True,
            PrescriptionTemplate.is_active == True
        ).first()

        if template:
            logger.debug(f"Using tenant's default template: {template.id}")
            return template

        # 4. Try any tenant template
        template = db.query(PrescriptionTemplate).filter(
            PrescriptionTemplate.tenant_id == tenant_id,
            PrescriptionTemplate.doctor_id.is_(None),
            PrescriptionTemplate.office_id.is_(None),
            PrescriptionTemplate.is_active == True
        ).first()

        if template:
            logger.debug(f"Using tenant's template: {template.id}")
            return template

        # 5. No template found
        logger.debug(f"No template found for tenant {tenant_id}")
        return None

    def list_templates(
        self,
        db: Session,
        tenant_id: UUID,
        params: Optional[TemplateSearchParams] = None
    ) -> Tuple[List[PrescriptionTemplate], int]:
        """
        List templates with filtering and pagination.
        """
        query = db.query(PrescriptionTemplate).filter(
            PrescriptionTemplate.tenant_id == tenant_id
        )

        if params:
            # Filter by active status
            if params.is_active is not None:
                query = query.filter(PrescriptionTemplate.is_active == params.is_active)

            # Filter by doctor
            if params.doctor_id is not None:
                query = query.filter(PrescriptionTemplate.doctor_id == params.doctor_id)

            # Filter by office
            if params.office_id is not None:
                query = query.filter(PrescriptionTemplate.office_id == params.office_id)

            # Filter by preset type
            if params.preset_type is not None:
                query = query.filter(PrescriptionTemplate.preset_type == params.preset_type)

            # Filter by default status
            if params.is_default is not None:
                query = query.filter(PrescriptionTemplate.is_default == params.is_default)

            # Search in name and description
            if params.query:
                search_term = f"%{params.query}%"
                query = query.filter(
                    or_(
                        PrescriptionTemplate.name.ilike(search_term),
                        PrescriptionTemplate.description.ilike(search_term)
                    )
                )

            # Sorting
            sort_field = getattr(PrescriptionTemplate, params.sort_by, PrescriptionTemplate.created_at)
            if params.sort_order == "asc":
                query = query.order_by(asc(sort_field))
            else:
                query = query.order_by(desc(sort_field))

        else:
            query = query.filter(PrescriptionTemplate.is_active == True)
            query = query.order_by(desc(PrescriptionTemplate.created_at))

        # Get total count
        total = query.count()

        # Pagination
        if params:
            offset = (params.page - 1) * params.page_size
            query = query.offset(offset).limit(params.page_size)
        else:
            query = query.limit(20)

        templates = query.all()

        return templates, total

    def update_template(
        self,
        db: Session,
        template_id: UUID,
        template_data: PrescriptionTemplateUpdate,
        tenant_id: UUID
    ) -> Optional[PrescriptionTemplate]:
        """
        Update a prescription template.
        """
        template = db.query(PrescriptionTemplate).filter(
            PrescriptionTemplate.id == template_id,
            PrescriptionTemplate.tenant_id == tenant_id,
            PrescriptionTemplate.is_active == True
        ).first()

        if not template:
            raise NotFoundError(f"Template not found: {template_id}")

        # If setting as default, unset existing defaults
        if template_data.is_default:
            self._unset_existing_defaults(
                db,
                tenant_id,
                template.doctor_id,
                exclude_id=template_id
            )

        # Update fields
        update_data = template_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if hasattr(template, field):
                setattr(template, field, value)

        try:
            db.commit()

            logger.info(f"Updated template: {template.name}")
            return template

        except Exception as e:
            db.rollback()
            logger.error(f"Error updating template: {str(e)}")
            raise BusinessRuleError(f"Failed to update template: {str(e)}")

    def delete_template(
        self,
        db: Session,
        template_id: UUID,
        tenant_id: UUID,
        hard_delete: bool = False
    ) -> bool:
        """
        Delete a prescription template (soft delete by default).
        """
        template = db.query(PrescriptionTemplate).filter(
            PrescriptionTemplate.id == template_id,
            PrescriptionTemplate.tenant_id == tenant_id
        ).first()

        if not template:
            raise NotFoundError(f"Template not found: {template_id}")

        try:
            if hard_delete:
                db.delete(template)
            else:
                template.is_active = False

            db.commit()

            logger.info(f"Deleted template: {template_id}")
            return True

        except Exception as e:
            db.rollback()
            logger.error(f"Error deleting template: {str(e)}")
            raise BusinessRuleError(f"Failed to delete template: {str(e)}")

    def set_default_template(
        self,
        db: Session,
        template_id: UUID,
        tenant_id: UUID
    ) -> PrescriptionTemplate:
        """
        Set a template as the default for its scope (tenant/doctor).
        """
        template = db.query(PrescriptionTemplate).filter(
            PrescriptionTemplate.id == template_id,
            PrescriptionTemplate.tenant_id == tenant_id,
            PrescriptionTemplate.is_active == True
        ).first()

        if not template:
            raise NotFoundError(f"Template not found: {template_id}")

        # Unset existing defaults for the same scope
        self._unset_existing_defaults(
            db,
            tenant_id,
            template.doctor_id,
            exclude_id=template_id
        )

        template.is_default = True

        try:
            db.commit()

            logger.info(f"Set default template: {template_id}")
            return template

        except Exception as e:
            db.rollback()
            logger.error(f"Error setting default template: {str(e)}")
            raise BusinessRuleError(f"Failed to set default template: {str(e)}")

    def update_logo_url(
        self,
        db: Session,
        template_id: UUID,
        logo_url: str,
        tenant_id: UUID
    ) -> PrescriptionTemplate:
        """
        Update template logo URL after file upload.
        """
        template = db.query(PrescriptionTemplate).filter(
            PrescriptionTemplate.id == template_id,
            PrescriptionTemplate.tenant_id == tenant_id,
            PrescriptionTemplate.is_active == True
        ).first()

        if not template:
            raise NotFoundError(f"Template not found: {template_id}")

        template.logo_url = logo_url

        try:
            db.commit()

            logger.info(f"Updated logo for template: {template_id}")
            return template

        except Exception as e:
            db.rollback()
            logger.error(f"Error updating logo: {str(e)}")
            raise BusinessRuleError(f"Failed to update logo: {str(e)}")

    def update_signature_url(
        self,
        db: Session,
        template_id: UUID,
        signature_url: str,
        tenant_id: UUID
    ) -> PrescriptionTemplate:
        """
        Update template signature URL after file upload.
        """
        template = db.query(PrescriptionTemplate).filter(
            PrescriptionTemplate.id == template_id,
            PrescriptionTemplate.tenant_id == tenant_id,
            PrescriptionTemplate.is_active == True
        ).first()

        if not template:
            raise NotFoundError(f"Template not found: {template_id}")

        template.signature_url = signature_url

        try:
            db.commit()

            logger.info(f"Updated signature for template: {template_id}")
            return template

        except Exception as e:
            db.rollback()
            logger.error(f"Error updating signature: {str(e)}")
            raise BusinessRuleError(f"Failed to update signature: {str(e)}")

    def get_available_presets(self) -> List[Dict[str, Any]]:
        """
        Get list of available preset templates.
        """
        presets = []
        for preset_type, config in PRESET_TEMPLATES.items():
            presets.append({
                "type": preset_type,
                "name": config["name"],
                "description": config["description"],
                "paper_size": config["paper_size"],
                "preview_config": config["layout_config"]
            })
        return presets

    # Helper Methods

    def _unset_existing_defaults(
        self,
        db: Session,
        tenant_id: UUID,
        doctor_id: Optional[UUID],
        exclude_id: Optional[UUID] = None
    ) -> None:
        """
        Unset is_default for existing templates in the same scope.
        """
        query = db.query(PrescriptionTemplate).filter(
            PrescriptionTemplate.tenant_id == tenant_id,
            PrescriptionTemplate.is_default == True,
            PrescriptionTemplate.is_active == True
        )

        if doctor_id:
            query = query.filter(PrescriptionTemplate.doctor_id == doctor_id)
        else:
            query = query.filter(PrescriptionTemplate.doctor_id.is_(None))

        if exclude_id:
            query = query.filter(PrescriptionTemplate.id != exclude_id)

        existing_defaults = query.all()
        for template in existing_defaults:
            template.is_default = False


# Create singleton instance
prescription_template_service = PrescriptionTemplateService()
