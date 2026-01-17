"""
Authentication and Authorization Dependencies
"""

from typing import Generator, Optional
import logging
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.database import SessionLocal
from app.models.user import User
from app.services.auth_service import AuthService

logger = logging.getLogger(__name__)

# Security scheme
security = HTTPBearer()


def get_db(request: Request) -> Generator:
    """
    Database session dependency with multi-tenancy support.
    Automatically sets tenant context from JWT token for RLS.

    NOTE: Request parameter is required - FastAPI will inject it automatically.
    The TenantMiddleware sets request.state.tenant_id from JWT.
    """
    db = SessionLocal()
    try:
        # Set tenant context if available from request state (set by TenantMiddleware)
        if hasattr(request.state, 'tenant_id') and request.state.tenant_id:
            try:
                db.execute(text(f"SET app.current_tenant_id = '{request.state.tenant_id}'"))
                logger.debug(f"Tenant context set: {request.state.tenant_id}")
            except Exception as e:
                logger.error(f"Failed to set tenant context: {e}")
        yield db
    finally:
        db.close()


def get_current_user(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    """Get current authenticated user from JWT token"""
    auth_service = AuthService()
    
    # Extract token from credentials
    token = credentials.credentials
    
    # Get user from token
    user = auth_service.get_current_user(db, token)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Get current active user"""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user


def require_permission(permission: str):
    """Dependency factory to require specific permission"""
    def permission_checker(current_user: User = Depends(get_current_active_user)) -> User:
        auth_service = AuthService()
        
        if not auth_service.check_permission(current_user.role, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission required: {permission}"
            )
        
        return current_user
    
    return permission_checker


def require_role(allowed_roles: list):
    """Dependency factory to require specific role(s)"""
    def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role required: one of {allowed_roles}"
            )
        
        return current_user
    
    return role_checker


# Common role dependencies
require_admin = require_role(["super_admin", "admin"])
require_doctor = require_role(["super_admin", "admin", "doctor"])
require_staff = require_role(["super_admin", "admin", "doctor", "nurse", "receptionist"])


# Common permission dependencies
def require_read_patients():
    """Require permission to read patient data"""
    return require_permission("read:patients")


def require_write_patients():
    """Require permission to write patient data"""
    return require_permission("write:patients")


def require_read_prescriptions():
    """Require permission to read prescriptions"""
    return require_permission("read:prescriptions")


def require_write_prescriptions():
    """Require permission to write prescriptions"""
    return require_permission("write:prescriptions")


def require_read_appointments():
    """Require permission to read appointments"""
    return require_permission("read:appointments")


def require_write_appointments():
    """Require permission to write appointments"""
    return require_permission("write:appointments")


def require_admin_access():
    """Require admin access"""
    return require_permission("admin:system")


# Optional authentication for public endpoints
def get_current_user_optional(
    db: Session = Depends(get_db),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[User]:
    """Get current user if authenticated, None otherwise"""
    if not credentials:
        return None
    
    auth_service = AuthService()
    token = credentials.credentials
    
    try:
        user = auth_service.get_current_user(db, token)
        return user if user and user.is_active else None
    except:
        return None


# Doctor-specific dependencies
def get_current_doctor(current_user: User = Depends(require_doctor)) -> User:
    """Get current user ensuring they are a doctor"""
    return current_user


def require_doctor_or_admin():
    """Require doctor role or admin access"""
    return require_role(["super_admin", "admin", "doctor"])


def require_staff_or_admin():
    """Require staff role or admin access"""
    return require_role(["super_admin", "admin", "doctor", "nurse", "receptionist"])


# Patient data access dependencies
def require_patient_data_access(current_user: User = Depends(get_current_active_user)) -> User:
    """Require access to patient data (doctors, staff, or the patient themselves)"""
    auth_service = AuthService()
    
    # Allow if user has read:patients permission
    if auth_service.check_permission(current_user.role, "read:patients"):
        return current_user
    
    # Allow if user has read:own_data permission (for patients)
    if auth_service.check_permission(current_user.role, "read:own_data"):
        return current_user
    
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Access to patient data not allowed"
    )


# Prescription access dependencies
def require_prescription_access(current_user: User = Depends(get_current_active_user)) -> User:
    """Require access to prescriptions"""
    auth_service = AuthService()
    
    # Allow doctors and staff
    if auth_service.check_permission(current_user.role, "read:prescriptions"):
        return current_user
    
    # Allow patients to read their own prescriptions
    if auth_service.check_permission(current_user.role, "read:own_prescriptions"):
        return current_user
    
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Access to prescriptions not allowed"
    )


# Medicine access dependencies
def require_medicine_read():
    """Require permission to read medicine data"""
    return require_permission("read:medicines")


def require_medicine_write():
    """Require permission to write medicine data"""
    return require_permission("write:medicines")


# Audit and logging dependencies
def log_user_activity(
    action: str,
    resource: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Log user activity for audit purposes"""
    # TODO: Implement activity logging
    # This would create an audit log entry
    pass


# Rate limiting dependency (placeholder)
def rate_limit(requests_per_minute: int = 60):
    """Rate limiting dependency"""
    def rate_limiter():
        # TODO: Implement rate limiting
        # This would check and enforce rate limits
        pass
    
    return rate_limiter