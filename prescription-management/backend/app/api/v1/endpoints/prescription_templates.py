"""
Prescription Template REST API Endpoints
Provides CRUD operations for customizable prescription templates
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
import logging

from app.api.deps.database import get_db
from app.api.deps.auth import get_current_active_user, require_admin, require_staff
from app.services.cloud_storage_service import get_cloud_storage_service
from app.core.exceptions import (
    NotFoundError,
    ValidationError,
    BusinessRuleError
)
from app.models.user import User
from app.services.prescription_template_service import prescription_template_service
from app.schemas.prescription_template import (
    PrescriptionTemplateCreate,
    PrescriptionTemplateUpdate,
    PrescriptionTemplateResponse,
    PrescriptionTemplateListResponse,
    PrescriptionTemplateCreateFromPreset,
    PresetTemplateInfo,
    PresetTemplateListResponse,
    TemplateSearchParams,
    FileUploadResponse
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/presets", response_model=PresetTemplateListResponse)
async def get_preset_templates(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get available preset templates (classic, modern, minimal).

    Returns preview configurations for each preset.
    """
    presets = prescription_template_service.get_available_presets()
    return PresetTemplateListResponse(presets=[PresetTemplateInfo(**p) for p in presets])


@router.get("/effective", response_model=Optional[PrescriptionTemplateResponse])
async def get_effective_template(
    doctor_id: Optional[UUID] = Query(None, description="Doctor ID for doctor-specific template"),
    office_id: Optional[UUID] = Query(None, description="Office ID for office-specific template"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get the effective template for printing prescriptions.

    Fallback order:
    1. Doctor + Office specific template (if both provided)
    2. Doctor's default template (if doctor_id provided)
    3. Tenant's default template
    4. Any tenant template
    5. None (use system default)
    """
    template = prescription_template_service.get_effective_template(
        db=db,
        tenant_id=current_user.tenant_id,
        doctor_id=doctor_id,
        office_id=office_id
    )

    if template:
        return _template_to_response(template)
    return None


@router.get("/", response_model=PrescriptionTemplateListResponse)
async def list_templates(
    query: Optional[str] = Query(None, description="Search in name and description"),
    doctor_id: Optional[UUID] = Query(None, description="Filter by doctor"),
    office_id: Optional[UUID] = Query(None, description="Filter by office"),
    preset_type: Optional[str] = Query(None, description="Filter by preset type"),
    is_default: Optional[bool] = Query(None, description="Filter by default status"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Page size"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    List prescription templates with filtering and pagination.
    """
    params = TemplateSearchParams(
        query=query,
        doctor_id=doctor_id,
        office_id=office_id,
        preset_type=preset_type,
        is_default=is_default,
        page=page,
        page_size=page_size
    )

    templates, total = prescription_template_service.list_templates(
        db=db,
        tenant_id=current_user.tenant_id,
        params=params
    )

    total_pages = (total + page_size - 1) // page_size

    return PrescriptionTemplateListResponse(
        templates=[_template_to_response(t) for t in templates],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_prev=page > 1
    )


@router.get("/{template_id}", response_model=PrescriptionTemplateResponse)
async def get_template(
    template_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get a specific prescription template by ID.
    """
    template = prescription_template_service.get_template_by_id(
        db=db,
        template_id=template_id
    )

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template not found: {template_id}"
        )

    # Verify tenant access
    if template.tenant_id != current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this template"
        )

    return _template_to_response(template)


@router.post("/", response_model=PrescriptionTemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_template(
    template_data: PrescriptionTemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Create a new prescription template.

    **Staff access required.**
    """
    try:
        template = prescription_template_service.create_template(
            db=db,
            template_data=template_data,
            tenant_id=current_user.tenant_id,
            created_by=current_user.id
        )
        logger.info(f"Template created: {template.name} by user {current_user.id}")
        return _template_to_response(template)

    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except BusinessRuleError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error creating template: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create template"
        )


@router.post("/from-preset/{preset_type}", response_model=PrescriptionTemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_from_preset(
    preset_type: str,
    preset_data: PrescriptionTemplateCreateFromPreset,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Create a template from a preset (classic, modern, minimal).

    **Staff access required.**
    """
    try:
        # Override preset_type from path parameter
        preset_data.preset_type = preset_type

        template = prescription_template_service.create_from_preset(
            db=db,
            preset_data=preset_data,
            tenant_id=current_user.tenant_id,
            created_by=current_user.id
        )
        logger.info(f"Template created from preset '{preset_type}' by user {current_user.id}")
        return _template_to_response(template)

    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except BusinessRuleError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error creating template from preset: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create template from preset"
        )


@router.put("/{template_id}", response_model=PrescriptionTemplateResponse)
async def update_template(
    template_id: UUID,
    template_data: PrescriptionTemplateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Update a prescription template.

    **Staff access required.**
    """
    try:
        template = prescription_template_service.update_template(
            db=db,
            template_id=template_id,
            template_data=template_data,
            tenant_id=current_user.tenant_id
        )
        logger.info(f"Template updated: {template_id} by user {current_user.id}")
        return _template_to_response(template)

    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except BusinessRuleError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error updating template: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update template"
        )


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(
    template_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Delete a prescription template (soft delete).

    **Admin access required.**
    """
    try:
        prescription_template_service.delete_template(
            db=db,
            template_id=template_id,
            tenant_id=current_user.tenant_id
        )
        logger.info(f"Template deleted: {template_id} by user {current_user.id}")

    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except BusinessRuleError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error deleting template: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete template"
        )


@router.post("/{template_id}/set-default", response_model=PrescriptionTemplateResponse)
async def set_default_template(
    template_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Set a template as the default for its scope (tenant/doctor).

    **Staff access required.**
    """
    try:
        template = prescription_template_service.set_default_template(
            db=db,
            template_id=template_id,
            tenant_id=current_user.tenant_id
        )
        logger.info(f"Template set as default: {template_id} by user {current_user.id}")
        return _template_to_response(template)

    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except BusinessRuleError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error setting default template: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to set default template"
        )


@router.post("/{template_id}/logo", response_model=PrescriptionTemplateResponse)
async def upload_logo(
    template_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Upload a logo for a prescription template.

    **Staff access required.**

    Accepts: PNG, JPG, JPEG, WebP (max 2MB)
    """
    # Validate file type
    allowed_types = ["image/png", "image/jpeg", "image/jpg", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_types)}"
        )

    # Validate file size (max 2MB)
    content = await file.read()
    if len(content) > 2 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large. Maximum size: 2MB"
        )

    try:
        # Upload to cloud storage
        from datetime import datetime
        from io import BytesIO
        from PIL import Image

        # Resize image to max 200x200 pixels while maintaining aspect ratio
        img = Image.open(BytesIO(content))
        max_size = (200, 200)
        img.thumbnail(max_size, Image.Resampling.LANCZOS)

        # Save resized image to buffer
        resized_buffer = BytesIO()
        img_format = 'PNG' if file.content_type == 'image/png' else 'JPEG'
        img.save(resized_buffer, format=img_format, quality=90)
        resized_buffer.seek(0)

        # Generate file path: templates/{tenant_id}/{template_id}/logo_{timestamp}.{ext}
        ext = 'png' if img_format == 'PNG' else 'jpg'
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_path = f"templates/{current_user.tenant_id}/{template_id}/logo_{timestamp}.{ext}"
        content_type = 'image/png' if img_format == 'PNG' else 'image/jpeg'

        # Upload resized file
        storage = get_cloud_storage_service()
        logo_url = storage.upload_file(resized_buffer, file_path, content_type)

        template = prescription_template_service.update_logo_url(
            db=db,
            template_id=template_id,
            logo_url=logo_url,
            tenant_id=current_user.tenant_id
        )

        logger.info(f"Logo uploaded for template: {template_id}")
        return _template_to_response(template)

    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error uploading logo: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload logo"
        )


@router.post("/{template_id}/signature", response_model=PrescriptionTemplateResponse)
async def upload_signature(
    template_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Upload a signature image for a prescription template.

    **Staff access required.**

    Accepts: PNG, JPG, JPEG, WebP (max 1MB)
    """
    # Validate file type
    allowed_types = ["image/png", "image/jpeg", "image/jpg", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_types)}"
        )

    # Validate file size (max 1MB)
    content = await file.read()
    if len(content) > 1 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large. Maximum size: 1MB"
        )

    try:
        # Upload to cloud storage
        from datetime import datetime
        from io import BytesIO
        from PIL import Image

        # Resize image to max 150x60 pixels while maintaining aspect ratio
        img = Image.open(BytesIO(content))
        max_size = (150, 60)
        img.thumbnail(max_size, Image.Resampling.LANCZOS)

        # Save resized image to buffer
        resized_buffer = BytesIO()
        img_format = 'PNG' if file.content_type == 'image/png' else 'JPEG'
        img.save(resized_buffer, format=img_format, quality=90)
        resized_buffer.seek(0)

        # Generate file path: templates/{tenant_id}/{template_id}/signature_{timestamp}.{ext}
        ext = 'png' if img_format == 'PNG' else 'jpg'
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_path = f"templates/{current_user.tenant_id}/{template_id}/signature_{timestamp}.{ext}"
        content_type = 'image/png' if img_format == 'PNG' else 'image/jpeg'

        # Upload resized file
        storage = get_cloud_storage_service()
        signature_url = storage.upload_file(resized_buffer, file_path, content_type)

        template = prescription_template_service.update_signature_url(
            db=db,
            template_id=template_id,
            signature_url=signature_url,
            tenant_id=current_user.tenant_id
        )

        logger.info(f"Signature uploaded for template: {template_id}")
        return _template_to_response(template)

    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error uploading signature: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload signature"
        )


def _template_to_response(template) -> PrescriptionTemplateResponse:
    """Convert template model to response schema"""
    return PrescriptionTemplateResponse(
        id=template.id,
        tenant_id=template.tenant_id,
        doctor_id=template.doctor_id,
        office_id=template.office_id,
        name=template.name,
        description=template.description,
        paper_size=template.paper_size,
        orientation=template.orientation,
        margin_top=template.margin_top,
        margin_bottom=template.margin_bottom,
        margin_left=template.margin_left,
        margin_right=template.margin_right,
        layout_config=template.layout_config or {},
        logo_url=template.logo_url,
        signature_url=template.signature_url,
        signature_text=template.signature_text,
        is_default=template.is_default,
        preset_type=template.preset_type,
        is_active=template.is_active,
        created_at=template.created_at,
        updated_at=template.updated_at,
        margins=template.get_margins(),
        paper_dimensions_mm=template.get_paper_dimensions_mm()
    )
