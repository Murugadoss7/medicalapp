"""
Dental Attachments Schemas
Handles validation for file uploads (X-rays, photos, test results, documents)
"""

from __future__ import annotations

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Literal
from datetime import date, datetime
from uuid import UUID

from app.models.dental import ATTACHMENT_FILE_TYPES


# Enums
AttachmentFileTypeEnum = Literal["xray", "photo_before", "photo_after", "test_result", "document", "other"]


# ==================== Dental Attachment Schemas ====================

class DentalAttachmentBase(BaseModel):
    """Base schema for dental attachments"""
    file_type: AttachmentFileTypeEnum = Field(..., description="Type of file")
    caption: Optional[str] = Field(None, max_length=1000, description="Optional description")
    taken_date: Optional[datetime] = Field(None, description="When photo/xray was taken")


class DentalAttachmentCreate(DentalAttachmentBase):
    """Schema for creating a new attachment (used after file upload)"""
    observation_id: Optional[UUID] = Field(None, description="Link to observation")
    procedure_id: Optional[UUID] = Field(None, description="Link to procedure")
    case_study_id: Optional[UUID] = Field(None, description="Link to case study")
    patient_mobile_number: str = Field(..., min_length=10, max_length=20)
    patient_first_name: str = Field(..., min_length=1, max_length=100)

    # File metadata (filled by upload service)
    file_name: str = Field(..., max_length=255)
    file_path: str = Field(..., description="Cloud storage path or URL")
    file_size: int = Field(..., gt=0, description="File size in bytes")
    mime_type: str = Field(..., max_length=100, description="MIME type")

    @field_validator('file_size')
    @classmethod
    def validate_file_size(cls, v: int) -> int:
        """Validate file size (max 10MB)"""
        max_size = 10 * 1024 * 1024  # 10MB
        if v > max_size:
            raise ValueError(f"File size {v} bytes exceeds maximum allowed size of {max_size} bytes (10MB)")
        return v

    @field_validator('mime_type')
    @classmethod
    def validate_mime_type(cls, v: str) -> str:
        """Validate MIME type"""
        allowed_types = [
            'image/jpeg', 'image/jpg', 'image/png',
            'application/pdf',
            'application/dicom', 'application/x-dicom'
        ]
        if v.lower() not in allowed_types:
            raise ValueError(f"MIME type '{v}' not allowed. Allowed: {', '.join(allowed_types)}")
        return v


class DentalAttachmentUpdate(BaseModel):
    """Schema for updating attachment metadata"""
    file_type: Optional[AttachmentFileTypeEnum] = None
    caption: Optional[str] = Field(None, max_length=1000)
    taken_date: Optional[datetime] = None


class DentalAttachmentResponse(DentalAttachmentBase):
    """Schema for attachment responses"""
    id: UUID
    observation_id: Optional[UUID] = None
    procedure_id: Optional[UUID] = None
    case_study_id: Optional[UUID] = None
    patient_mobile_number: str
    patient_first_name: str
    file_name: str
    file_path: str  # This will be the cloud URL
    file_size: int
    mime_type: str
    created_at: datetime
    updated_at: datetime
    uploaded_by: Optional[UUID] = None
    is_active: bool

    model_config = {"from_attributes": True}


class DentalAttachmentListResponse(BaseModel):
    """Schema for paginated attachment list"""
    attachments: List[DentalAttachmentResponse]
    total: int
    page: int = 1
    per_page: int = 50


class DentalAttachmentUploadResponse(BaseModel):
    """Schema for file upload success response"""
    attachment_id: UUID
    file_name: str
    file_url: str
    file_size: int
    message: str = "File uploaded successfully"
