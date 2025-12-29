"""
Attachment Service
Business logic for managing dental file attachments
"""

import logging
import mimetypes
from typing import List, Optional, BinaryIO
from uuid import UUID
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException, status, UploadFile
import os

from app.models.dental import DentalAttachment, DentalObservation, DentalProcedure
from app.models.appointment import Appointment
from app.schemas.dental_attachments import (
    DentalAttachmentCreate,
    DentalAttachmentUpdate,
    DentalAttachmentResponse
)
from app.services.cloud_storage_service import get_cloud_storage_service
from app.core.config import settings

logger = logging.getLogger(__name__)


class AttachmentService:
    """Service for managing dental attachments"""

    def __init__(self, db: Session):
        self.db = db
        self.storage = get_cloud_storage_service()

    def validate_file(self, file: UploadFile) -> tuple[str, int]:
        """
        Validate file type and size

        Returns:
            Tuple of (mime_type, file_size)
        """
        # Read file to get size
        file_content = file.file.read()
        file_size = len(file_content)
        file.file.seek(0)  # Reset file pointer

        # Validate size
        if file_size > settings.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File size {file_size} bytes exceeds maximum allowed size of {settings.MAX_FILE_SIZE} bytes (10MB)"
            )

        # Detect MIME type from filename extension (no system dependencies)
        mime_type, _ = mimetypes.guess_type(file.filename or "")

        # Fallback mapping for common extensions
        extension_mime_map = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.pdf': 'application/pdf',
            '.dcm': 'application/dicom',
            '.dicom': 'application/dicom',
        }

        if not mime_type and file.filename:
            ext = os.path.splitext(file.filename.lower())[1]
            mime_type = extension_mime_map.get(ext, 'application/octet-stream')

        if not mime_type:
            mime_type = file.content_type or 'application/octet-stream'

        # Validate MIME type
        allowed_types = [
            'image/jpeg', 'image/jpg', 'image/png',
            'application/pdf',
            'application/dicom', 'application/x-dicom',
            'application/octet-stream'  # Allow unknown for flexibility
        ]

        if mime_type not in allowed_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type '{mime_type}' not allowed. Allowed types: JPG, PNG, PDF, DICOM"
            )

        return mime_type, file_size

    def generate_file_path(
        self,
        patient_mobile: str,
        patient_first_name: str,
        file_type: str,
        filename: str
    ) -> str:
        """
        Generate cloud storage path for file

        Format: patients/{mobile}_{firstname}/{file_type}/{timestamp}_{filename}
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_filename = filename.replace(" ", "_")

        return f"patients/{patient_mobile}_{patient_first_name}/{file_type}/{timestamp}_{safe_filename}"

    async def upload_observation_attachment(
        self,
        observation_id: UUID,
        file: UploadFile,
        file_type: str,
        caption: Optional[str],
        user_id: UUID
    ) -> DentalAttachmentResponse:
        """Upload file attachment for observation"""

        # Validate observation exists
        observation = self.db.query(DentalObservation).filter(
            DentalObservation.id == observation_id,
            DentalObservation.is_active == True
        ).first()

        if not observation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Observation not found"
            )

        # Validate file
        mime_type, file_size = self.validate_file(file)

        # Generate storage path
        file_path = self.generate_file_path(
            observation.patient_mobile_number,
            observation.patient_first_name,
            file_type,
            file.filename
        )

        # Upload to cloud storage
        try:
            file_url = self.storage.upload_file(
                file.file,
                file_path,
                mime_type
            )
        except Exception as e:
            logger.error(f"Failed to upload file to cloud storage: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to upload file to cloud storage"
            )

        # Create attachment record
        attachment = DentalAttachment(
            observation_id=observation_id,
            patient_mobile_number=observation.patient_mobile_number,
            patient_first_name=observation.patient_first_name,
            file_type=file_type,
            file_name=file.filename,
            file_path=file_url,
            file_size=file_size,
            mime_type=mime_type,
            caption=caption,
            uploaded_by=user_id
        )

        self.db.add(attachment)
        self.db.commit()
        self.db.refresh(attachment)

        logger.info(f"Attachment uploaded for observation {observation_id}: {file.filename}")

        return DentalAttachmentResponse.model_validate(attachment)

    async def upload_procedure_attachment(
        self,
        procedure_id: UUID,
        file: UploadFile,
        file_type: str,
        caption: Optional[str],
        user_id: UUID
    ) -> DentalAttachmentResponse:
        """Upload file attachment for procedure"""

        # Validate procedure exists
        procedure = self.db.query(DentalProcedure).filter(
            DentalProcedure.id == procedure_id,
            DentalProcedure.is_active == True
        ).first()

        if not procedure:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Procedure not found"
            )

        # Get patient info from procedure's observation or appointment
        patient_mobile = None
        patient_first_name = None

        # Try to get patient info from observation first
        if procedure.observation_id:
            observation = self.db.query(DentalObservation).filter(
                DentalObservation.id == procedure.observation_id
            ).first()
            if observation:
                patient_mobile = observation.patient_mobile_number
                patient_first_name = observation.patient_first_name

        # If no observation, get from appointment
        if not patient_mobile and procedure.appointment_id:
            appointment = self.db.query(Appointment).filter(
                Appointment.id == procedure.appointment_id
            ).first()
            if appointment:
                patient_mobile = appointment.patient_mobile_number
                patient_first_name = appointment.patient_first_name

        # If still no patient info, raise error
        if not patient_mobile or not patient_first_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot upload attachment: procedure has no associated patient info"
            )

        # Validate file
        mime_type, file_size = self.validate_file(file)

        # Generate storage path
        file_path = self.generate_file_path(
            patient_mobile,
            patient_first_name,
            file_type,
            file.filename
        )

        # Upload to cloud storage
        try:
            file_url = self.storage.upload_file(
                file.file,
                file_path,
                mime_type
            )
        except Exception as e:
            logger.error(f"Failed to upload file to cloud storage: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to upload file to cloud storage"
            )

        # Create attachment record
        attachment = DentalAttachment(
            procedure_id=procedure_id,
            patient_mobile_number=patient_mobile,
            patient_first_name=patient_first_name,
            file_type=file_type,
            file_name=file.filename,
            file_path=file_url,
            file_size=file_size,
            mime_type=mime_type,
            caption=caption,
            uploaded_by=user_id
        )

        self.db.add(attachment)
        self.db.commit()
        self.db.refresh(attachment)

        logger.info(f"Attachment uploaded for procedure {procedure_id}: {file.filename}")

        return DentalAttachmentResponse.model_validate(attachment)

    def get_observation_attachments(self, observation_id: UUID) -> List[DentalAttachmentResponse]:
        """Get all attachments for an observation"""
        attachments = self.db.query(DentalAttachment).filter(
            DentalAttachment.observation_id == observation_id,
            DentalAttachment.is_active == True
        ).order_by(DentalAttachment.created_at.desc()).all()

        return [DentalAttachmentResponse.model_validate(a) for a in attachments]

    def get_procedure_attachments(self, procedure_id: UUID) -> List[DentalAttachmentResponse]:
        """Get all attachments for a procedure"""
        attachments = self.db.query(DentalAttachment).filter(
            DentalAttachment.procedure_id == procedure_id,
            DentalAttachment.is_active == True
        ).order_by(DentalAttachment.created_at.desc()).all()

        return [DentalAttachmentResponse.model_validate(a) for a in attachments]

    def get_patient_attachments(
        self,
        mobile: str,
        first_name: str,
        file_type: Optional[str] = None
    ) -> List[DentalAttachmentResponse]:
        """Get all attachments for a patient, optionally filtered by type"""
        query = self.db.query(DentalAttachment).filter(
            DentalAttachment.patient_mobile_number == mobile,
            DentalAttachment.patient_first_name == first_name,
            DentalAttachment.is_active == True
        )

        if file_type:
            query = query.filter(DentalAttachment.file_type == file_type)

        attachments = query.order_by(DentalAttachment.created_at.desc()).all()

        return [DentalAttachmentResponse.model_validate(a) for a in attachments]

    def delete_attachment(self, attachment_id: UUID, user_id: UUID) -> bool:
        """Soft delete attachment and remove from cloud storage"""
        attachment = self.db.query(DentalAttachment).filter(
            DentalAttachment.id == attachment_id,
            DentalAttachment.is_active == True
        ).first()

        if not attachment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Attachment not found"
            )

        # Delete from cloud storage
        try:
            # Extract file path from URL (last part after bucket name)
            file_path_parts = attachment.file_path.split('/')
            # Get path after bucket: patients/mobile_name/type/filename
            file_path = '/'.join(file_path_parts[-4:])

            self.storage.delete_file(file_path)
        except Exception as e:
            logger.error(f"Failed to delete file from cloud storage: {e}")
            # Continue with soft delete even if cloud deletion fails

        # Soft delete in database
        attachment.is_active = False
        attachment.updated_at = datetime.now()

        self.db.commit()

        logger.info(f"Attachment deleted: {attachment_id}")

        return True

    def update_attachment(
        self,
        attachment_id: UUID,
        update_data: DentalAttachmentUpdate
    ) -> DentalAttachmentResponse:
        """Update attachment metadata (caption, file_type, etc.)"""
        attachment = self.db.query(DentalAttachment).filter(
            DentalAttachment.id == attachment_id,
            DentalAttachment.is_active == True
        ).first()

        if not attachment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Attachment not found"
            )

        # Update fields
        update_dict = update_data.model_dump(exclude_unset=True)
        for field, value in update_dict.items():
            setattr(attachment, field, value)

        attachment.updated_at = datetime.now()

        self.db.commit()
        self.db.refresh(attachment)

        logger.info(f"Attachment updated: {attachment_id}")

        return DentalAttachmentResponse.model_validate(attachment)


def get_attachment_service(db: Session) -> AttachmentService:
    """Dependency injection for attachment service"""
    return AttachmentService(db)
