"""
Cloud Storage Service
Abstract interface with implementations for Local FileSystem, Cloudflare R2 and Google Cloud Storage
"""

import logging
import os
import shutil
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Optional, BinaryIO
from datetime import datetime, timedelta

from app.core.config import settings

# Lazy imports for cloud providers (only import when needed)
# boto3 is only required for Cloudflare R2, not for local storage

logger = logging.getLogger(__name__)


class CloudStorageService(ABC):
    """Abstract base class for cloud storage operations"""

    @abstractmethod
    def upload_file(self, file_obj: BinaryIO, file_path: str, content_type: str) -> str:
        """Upload file and return public URL"""
        pass

    @abstractmethod
    def delete_file(self, file_path: str) -> bool:
        """Delete file from storage"""
        pass

    @abstractmethod
    def get_signed_url(self, file_path: str, expires_in: int = 3600) -> str:
        """Get temporary signed URL for file access"""
        pass

    @abstractmethod
    def file_exists(self, file_path: str) -> bool:
        """Check if file exists"""
        pass


class CloudflareR2Service(CloudStorageService):
    """Cloudflare R2 storage implementation using S3-compatible API"""

    def __init__(self):
        """Initialize Cloudflare R2 client"""
        # Lazy import boto3 only when Cloudflare is used
        try:
            import boto3
            from botocore.client import Config
        except ImportError:
            raise ImportError(
                "boto3 is required for Cloudflare R2 storage. "
                "Install it with: pip install boto3"
            )

        if not settings.CLOUDFLARE_R2_ACCESS_KEY or not settings.CLOUDFLARE_R2_SECRET_KEY:
            raise ValueError("Cloudflare R2 credentials not configured")

        if not settings.CLOUDFLARE_R2_ENDPOINT:
            raise ValueError("Cloudflare R2 endpoint not configured")

        # Create S3 client with R2 endpoint
        self.client = boto3.client(
            's3',
            endpoint_url=settings.CLOUDFLARE_R2_ENDPOINT,
            aws_access_key_id=settings.CLOUDFLARE_R2_ACCESS_KEY,
            aws_secret_access_key=settings.CLOUDFLARE_R2_SECRET_KEY,
            config=Config(signature_version='s3v4'),
            region_name='auto'  # R2 uses 'auto' as region
        )
        self.bucket = settings.CLOUDFLARE_R2_BUCKET
        self.public_url = settings.CLOUDFLARE_R2_PUBLIC_URL

        # Ensure bucket exists
        self._ensure_bucket_exists()

    def _ensure_bucket_exists(self):
        """Create bucket if it doesn't exist"""
        from botocore.exceptions import ClientError
        try:
            self.client.head_bucket(Bucket=self.bucket)
            logger.info(f"Bucket '{self.bucket}' exists")
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == '404':
                logger.info(f"Bucket '{self.bucket}' not found, creating...")
                try:
                    self.client.create_bucket(Bucket=self.bucket)
                    logger.info(f"Bucket '{self.bucket}' created successfully")
                except ClientError as create_error:
                    logger.error(f"Failed to create bucket: {create_error}")
                    raise
            else:
                logger.error(f"Error checking bucket: {e}")
                raise

    def upload_file(self, file_obj: BinaryIO, file_path: str, content_type: str) -> str:
        """
        Upload file to Cloudflare R2

        Args:
            file_obj: File object to upload
            file_path: Path in bucket (e.g., "patients/123/xray_2025.jpg")
            content_type: MIME type (e.g., "image/jpeg")

        Returns:
            Public URL of uploaded file
        """
        from botocore.exceptions import ClientError
        try:
            # Upload file
            self.client.upload_fileobj(
                file_obj,
                self.bucket,
                file_path,
                ExtraArgs={
                    'ContentType': content_type,
                    'CacheControl': 'max-age=31536000',  # 1 year cache
                }
            )

            logger.info(f"File uploaded successfully: {file_path}")

            # Return public URL
            if self.public_url:
                return f"{self.public_url}/{file_path}"
            else:
                # Fallback to endpoint URL
                return f"{settings.CLOUDFLARE_R2_ENDPOINT}/{self.bucket}/{file_path}"

        except ClientError as e:
            logger.error(f"Failed to upload file {file_path}: {e}")
            raise

    def delete_file(self, file_path: str) -> bool:
        """
        Delete file from Cloudflare R2

        Args:
            file_path: Path in bucket

        Returns:
            True if successful, False otherwise
        """
        from botocore.exceptions import ClientError
        try:
            self.client.delete_object(Bucket=self.bucket, Key=file_path)
            logger.info(f"File deleted successfully: {file_path}")
            return True
        except ClientError as e:
            logger.error(f"Failed to delete file {file_path}: {e}")
            return False

    def get_signed_url(self, file_path: str, expires_in: int = 3600) -> str:
        """
        Generate temporary signed URL for file access

        Args:
            file_path: Path in bucket
            expires_in: Expiration time in seconds (default 1 hour)

        Returns:
            Signed URL
        """
        from botocore.exceptions import ClientError
        try:
            url = self.client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket, 'Key': file_path},
                ExpiresIn=expires_in
            )
            return url
        except ClientError as e:
            logger.error(f"Failed to generate signed URL for {file_path}: {e}")
            raise

    def file_exists(self, file_path: str) -> bool:
        """
        Check if file exists in Cloudflare R2

        Args:
            file_path: Path in bucket

        Returns:
            True if file exists, False otherwise
        """
        from botocore.exceptions import ClientError
        try:
            self.client.head_object(Bucket=self.bucket, Key=file_path)
            return True
        except ClientError as e:
            if e.response['Error']['Code'] == '404':
                return False
            else:
                logger.error(f"Error checking file existence for {file_path}: {e}")
                raise


class LocalFileSystemService(CloudStorageService):
    """Local filesystem storage implementation for development/testing"""

    def __init__(self):
        """Initialize local file storage"""
        self.base_dir = Path(settings.UPLOAD_DIR)
        self.base_url = settings.BASE_URL or "http://localhost:8000"

        # Create upload directory if it doesn't exist
        self.base_dir.mkdir(parents=True, exist_ok=True)
        logger.info(f"Local file storage initialized at: {self.base_dir}")

    def upload_file(self, file_obj: BinaryIO, file_path: str, content_type: str) -> str:
        """
        Upload file to local filesystem

        Args:
            file_obj: File object to upload
            file_path: Relative path (e.g., "patients/123/xray_2025.jpg")
            content_type: MIME type (e.g., "image/jpeg")

        Returns:
            Public URL of uploaded file
        """
        try:
            # Create full file path
            full_path = self.base_dir / file_path

            # Create parent directories if they don't exist
            full_path.parent.mkdir(parents=True, exist_ok=True)

            # Write file to disk
            with open(full_path, 'wb') as f:
                file_obj.seek(0)  # Ensure we're at the start
                shutil.copyfileobj(file_obj, f)

            logger.info(f"File uploaded successfully to: {full_path}")

            # Return public URL
            return f"{self.base_url}/uploads/{file_path}"

        except Exception as e:
            logger.error(f"Failed to upload file {file_path}: {e}")
            raise

    def delete_file(self, file_path: str) -> bool:
        """
        Delete file from local filesystem

        Args:
            file_path: Relative path in storage

        Returns:
            True if successful, False otherwise
        """
        try:
            full_path = self.base_dir / file_path

            if full_path.exists():
                full_path.unlink()
                logger.info(f"File deleted successfully: {full_path}")
                return True
            else:
                logger.warning(f"File not found for deletion: {full_path}")
                return False

        except Exception as e:
            logger.error(f"Failed to delete file {file_path}: {e}")
            return False

    def get_signed_url(self, file_path: str, expires_in: int = 3600) -> str:
        """
        Get URL for file access (no signing needed for local files)

        Args:
            file_path: Relative path in storage
            expires_in: Ignored for local storage

        Returns:
            Public URL
        """
        return f"{self.base_url}/uploads/{file_path}"

    def file_exists(self, file_path: str) -> bool:
        """
        Check if file exists in local filesystem

        Args:
            file_path: Relative path in storage

        Returns:
            True if file exists, False otherwise
        """
        full_path = self.base_dir / file_path
        return full_path.exists()


class GoogleCloudStorageService(CloudStorageService):
    """Google Cloud Storage implementation (placeholder for future)"""

    def __init__(self):
        """Initialize GCS client"""
        raise NotImplementedError("Google Cloud Storage not yet implemented. Use Cloudflare R2.")

    def upload_file(self, file_obj: BinaryIO, file_path: str, content_type: str) -> str:
        raise NotImplementedError()

    def delete_file(self, file_path: str) -> bool:
        raise NotImplementedError()

    def get_signed_url(self, file_path: str, expires_in: int = 3600) -> str:
        raise NotImplementedError()

    def file_exists(self, file_path: str) -> bool:
        raise NotImplementedError()


def get_cloud_storage_service() -> CloudStorageService:
    """
    Factory function to get appropriate cloud storage service based on config

    Returns:
        CloudStorageService instance
    """
    provider = settings.CLOUD_STORAGE_PROVIDER.lower()

    if provider == "local":
        return LocalFileSystemService()
    elif provider == "cloudflare":
        return CloudflareR2Service()
    elif provider == "gcs":
        return GoogleCloudStorageService()
    else:
        raise ValueError(f"Unsupported cloud storage provider: {provider}")
