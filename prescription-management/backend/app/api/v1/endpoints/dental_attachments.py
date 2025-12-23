"""
Dental Attachments API Endpoints
File upload/download endpoints for observations and procedures
"""

import logging
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.orm import Session

from app.api.deps.database import get_db
from app.api.deps.auth import get_current_active_user, require_staff
from app.models.user import User
from app.schemas.dental_attachments import (
    DentalAttachmentResponse,
    DentalAttachmentListResponse,
    DentalAttachmentUpdate
)
from app.services.attachment_service import get_attachment_service

logger = logging.getLogger(__name__)

router = APIRouter()


# ==================== File Upload Endpoints ====================

@router.post("/observations/{observation_id}/attachments", response_model=DentalAttachmentResponse, status_code=status.HTTP_201_CREATED)
async def upload_observation_attachment(
    observation_id: UUID,
    file: UploadFile = File(...),
    file_type: str = Form(...),  # xray, photo_before, photo_after, test_result, document, other
    caption: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Upload file attachment for dental observation

    **File Types:**
    - xray: X-ray images
    - photo_before: Before treatment photos
    - photo_after: After treatment photos
    - test_result: Test results (PDF, images)
    - document: Other documents
    - other: Miscellaneous files

    **Allowed Formats:** JPG, PNG, PDF, DICOM
    **Max Size:** 10MB
    """
    service = get_attachment_service(db)

    try:
        attachment = await service.upload_observation_attachment(
            observation_id=observation_id,
            file=file,
            file_type=file_type,
            caption=caption,
            user_id=current_user.id
        )
        return attachment
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading observation attachment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload attachment"
        )


@router.post("/procedures/{procedure_id}/attachments", response_model=DentalAttachmentResponse, status_code=status.HTTP_201_CREATED)
async def upload_procedure_attachment(
    procedure_id: UUID,
    file: UploadFile = File(...),
    file_type: str = Form(...),
    caption: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Upload file attachment for dental procedure

    **File Types:**
    - photo_before: Before treatment photos
    - photo_after: After treatment photos
    - test_result: Test results
    - document: Procedure documentation
    - other: Miscellaneous files

    **Allowed Formats:** JPG, PNG, PDF, DICOM
    **Max Size:** 10MB
    """
    service = get_attachment_service(db)

    try:
        attachment = await service.upload_procedure_attachment(
            procedure_id=procedure_id,
            file=file,
            file_type=file_type,
            caption=caption,
            user_id=current_user.id
        )
        return attachment
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading procedure attachment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload attachment"
        )


# ==================== File Retrieval Endpoints ====================

@router.get("/observations/{observation_id}/attachments", response_model=List[DentalAttachmentResponse])
async def get_observation_attachments(
    observation_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Get all attachments for a dental observation

    **Note:** observation_id must be a valid UUID format.
    Temporary frontend IDs (e.g., obs_timestamp_random) will be rejected.
    """
    service = get_attachment_service(db)

    try:
        attachments = service.get_observation_attachments(observation_id)
        return attachments
    except Exception as e:
        logger.error(f"Error getting observation attachments for {observation_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve attachments"
        )


@router.get("/procedures/{procedure_id}/attachments", response_model=List[DentalAttachmentResponse])
async def get_procedure_attachments(
    procedure_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Get all attachments for a dental procedure"""
    service = get_attachment_service(db)

    try:
        attachments = service.get_procedure_attachments(procedure_id)
        return attachments
    except Exception as e:
        logger.error(f"Error getting procedure attachments: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve attachments"
        )


@router.get("/patients/{mobile}/{first_name}/attachments", response_model=List[DentalAttachmentResponse])
async def get_patient_attachments(
    mobile: str,
    first_name: str,
    file_type: Optional[str] = Query(None, description="Filter by file type"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Get all attachments for a patient

    **Optional Filters:**
    - file_type: Filter by file type (xray, photo_before, photo_after, etc.)
    """
    service = get_attachment_service(db)

    try:
        attachments = service.get_patient_attachments(mobile, first_name, file_type)
        return attachments
    except Exception as e:
        logger.error(f"Error getting patient attachments: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve attachments"
        )


# ==================== File Management Endpoints ====================

@router.put("/attachments/{attachment_id}", response_model=DentalAttachmentResponse)
async def update_attachment(
    attachment_id: UUID,
    update_data: DentalAttachmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Update attachment metadata (caption, file_type, taken_date)

    **Note:** This does not replace the file, only updates metadata
    """
    service = get_attachment_service(db)

    try:
        attachment = service.update_attachment(attachment_id, update_data)
        return attachment
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating attachment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update attachment"
        )


@router.delete("/attachments/{attachment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_attachment(
    attachment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Delete attachment (soft delete in database + remove from cloud storage)

    **Note:** This action cannot be undone
    """
    service = get_attachment_service(db)

    try:
        service.delete_attachment(attachment_id, current_user.id)
        return None
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting attachment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete attachment"
        )
