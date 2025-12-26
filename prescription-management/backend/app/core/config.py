"""
Configuration settings for Prescription Management System
Based on Entity_Relationship_Diagram.md requirements
"""

from typing import List, Optional, Any, Dict
from pydantic import validator, AnyHttpUrl
from pydantic_settings import BaseSettings
import secrets


class Settings(BaseSettings):
    """Application settings following ERD specifications"""
    
    # Project Information
    PROJECT_NAME: str = "Prescription Management System"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "Healthcare Prescription Management API"
    API_V1_STR: str = "/api/v1"
    
    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Database Configuration (PostgreSQL as per ERD)
    DATABASE_HOST: str = "localhost"
    DATABASE_PORT: int = 5432
    DATABASE_NAME: str = "prescription_management"
    DATABASE_USER: str = "prescription_user"
    DATABASE_PASSWORD: str = "prescription_password"
    DATABASE_URL: Optional[str] = None
    
    @validator("DATABASE_URL", pre=True)
    def assemble_db_connection(cls, v: Optional[str], values: Dict[str, Any]) -> Any:
        if isinstance(v, str):
            return v
        # Construct PostgreSQL URL manually for Pydantic v2 compatibility
        user = values.get("DATABASE_USER")
        password = values.get("DATABASE_PASSWORD")
        host = values.get("DATABASE_HOST")
        port = values.get("DATABASE_PORT")
        database = values.get("DATABASE_NAME")
        
        return f"postgresql://{user}:{password}@{host}:{port}/{database}"
    
    # Redis Configuration
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: Optional[str] = None
    REDIS_URL: str = "redis://localhost:6379"
    
    # Keycloak Configuration (as per ERD authentication requirements)
    KEYCLOAK_URL: str = "http://localhost:8080"
    KEYCLOAK_REALM: str = "prescription-management"
    KEYCLOAK_CLIENT_ID: str = "prescription-app"
    KEYCLOAK_CLIENT_SECRET: str = "your-client-secret"
    KEYCLOAK_ADMIN_USERNAME: str = "admin"
    KEYCLOAK_ADMIN_PASSWORD: str = "admin123"
    
    # JWT Configuration
    JWT_SECRET_KEY: str = secrets.token_urlsafe(32)
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Security
    SECRET_KEY: str = secrets.token_urlsafe(32)
    BCRYPT_ROUNDS: int = 12
    
    # CORS Configuration
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "http://localhost:5176",
        "http://127.0.0.1:5176"
    ]
    ALLOWED_METHODS: List[str] = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    ALLOWED_HEADERS: List[str] = ["*"]
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_BURST: int = 100
    
    # File Upload Configuration
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    UPLOAD_DIR: str = "./uploads"
    ALLOWED_FILE_TYPES: List[str] = ["pdf", "jpg", "jpeg", "png", "dcm", "dicom"]

    # Base URL for file access
    BASE_URL: Optional[str] = "http://localhost:8000"  # Override in production

    # Cloud Storage Configuration
    # Use "local" for development/testing, "cloudflare" for production
    CLOUD_STORAGE_PROVIDER: str = "local"  # Options: "local", "cloudflare", "gcs"

    # Cloudflare R2 Settings (only needed when CLOUD_STORAGE_PROVIDER = "cloudflare")
    CLOUDFLARE_R2_ACCESS_KEY: Optional[str] = None
    CLOUDFLARE_R2_SECRET_KEY: Optional[str] = None
    CLOUDFLARE_R2_BUCKET: str = "dental-attachments"
    CLOUDFLARE_R2_ENDPOINT: Optional[str] = None  # e.g., https://xxxxx.r2.cloudflarestorage.com
    CLOUDFLARE_R2_PUBLIC_URL: Optional[str] = None  # Public URL for accessing files

    # Google Cloud Storage (Alternative)
    GCS_PROJECT_ID: Optional[str] = None
    GCS_BUCKET: str = "dental-attachments"
    GCS_CREDENTIALS_PATH: Optional[str] = None

    # OpenAI Configuration (for AI Case Study Generation)
    # Get your API key from: https://platform.openai.com/api-keys
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o-mini"  # Fast and affordable: $0.15/1M input, $0.60/1M output
    OPENAI_MAX_TOKENS: int = 4000
    OPENAI_TEMPERATURE: float = 0.7
    AI_MAX_COST_PER_CASE_STUDY: float = 1.0  # USD limit per case study
    
    # PDF Generation (for prescriptions as per ERD)
    PDF_TEMPLATE_DIR: str = "./templates/pdf"
    PDF_OUTPUT_DIR: str = "./generated/pdf"
    
    # Audit Logging (required by ERD for HIPAA compliance)
    ENABLE_AUDIT_LOGGING: bool = True
    AUDIT_LOG_RETENTION_DAYS: int = 2555  # 7 years for medical records
    
    # Logging Configuration
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"
    
    # Email Configuration
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_EMAIL: Optional[str] = None
    
    # Celery Configuration (for background tasks)
    CELERY_BROKER_URL: str = "redis://localhost:6379"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379"
    
    # Monitoring
    SENTRY_DSN: Optional[str] = None
    ENABLE_METRICS: bool = True
    METRICS_PORT: int = 9090
    
    # Patient Registration Settings (based on ERD composite key requirements)
    MOBILE_NUMBER_REGEX: str = r"^[6-9]\d{9}$"  # Indian mobile format
    ALLOW_INTERNATIONAL_MOBILE: bool = False
    MAX_FAMILY_MEMBERS_PER_MOBILE: int = 10
    
    # Prescription Settings (based on ERD)
    MAX_PRESCRIPTION_ITEMS: int = 20
    PRESCRIPTION_VALIDITY_DAYS: int = 30
    ENABLE_DRUG_INTERACTION_CHECK: bool = True
    
    # Medicine Catalog Settings
    ENABLE_MEDICINE_SEARCH_CACHE: bool = True
    MEDICINE_SEARCH_CACHE_TTL: int = 300  # 5 minutes
    
    # Appointment Settings
    DEFAULT_APPOINTMENT_DURATION: int = 30  # minutes
    MAX_APPOINTMENTS_PER_DAY: int = 50
    
    # User Role Permissions (based on ERD user roles)
    ROLE_PERMISSIONS: Dict[str, List[str]] = {
        "super_admin": ["*"],
        "admin": [
            "manage_users", "manage_doctors", "manage_medicines",
            "view_all_prescriptions", "system_config"
        ],
        "doctor": [
            "manage_patients", "create_prescriptions", "view_own_prescriptions",
            "schedule_appointments", "manage_short_keys"
        ],
        "nurse": [
            "register_patients", "schedule_appointments", "view_prescriptions"
        ],
        "receptionist": [
            "register_patients", "schedule_appointments", "basic_patient_info"
        ],
        "patient": [
            "view_own_records", "view_own_prescriptions", "view_appointments"
        ]
    }
    
    model_config = {"env_file": ".env", "case_sensitive": True}


# Global settings instance
settings = Settings()


# Database configuration for SQLAlchemy
DATABASE_CONFIG = {
    "url": str(settings.DATABASE_URL),
    "echo": settings.DEBUG,
    "pool_size": 20,
    "max_overflow": 30,
    "pool_timeout": 30,
    "pool_recycle": 3600,
}

# Redis configuration
REDIS_CONFIG = {
    "host": settings.REDIS_HOST,
    "port": settings.REDIS_PORT,
    "password": settings.REDIS_PASSWORD,
    "decode_responses": True,
    "health_check_interval": 30,
}

# Keycloak configuration
KEYCLOAK_CONFIG = {
    "server_url": settings.KEYCLOAK_URL,
    "realm_name": settings.KEYCLOAK_REALM,
    "client_id": settings.KEYCLOAK_CLIENT_ID,
    "client_secret_key": settings.KEYCLOAK_CLIENT_SECRET,
    "admin_username": settings.KEYCLOAK_ADMIN_USERNAME,
    "admin_password": settings.KEYCLOAK_ADMIN_PASSWORD,
}