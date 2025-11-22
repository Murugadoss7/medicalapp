"""
Authentication API endpoints
Handles login, registration, token refresh, and password management
"""

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from typing import Any

from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.schemas.auth import (
    LoginRequest, LoginResponse, TokenResponse, RegisterRequest,
    RefreshTokenRequest, LogoutRequest, PasswordResetRequest, 
    PasswordResetConfirm, PasswordChangeRequest
)
from app.schemas.user import UserResponse
from app.services.auth_service import AuthService


router = APIRouter()
security = HTTPBearer()


@router.post("/login", response_model=LoginResponse)
async def login(
    login_request: LoginRequest,
    db: Session = Depends(get_db)
) -> Any:
    """
    Login user and return access/refresh tokens
    
    - **email**: User email address
    - **password**: User password
    
    Returns user information and JWT tokens
    """
    auth_service = AuthService()
    
    login_response = await auth_service.login(db, login_request)
    
    if not login_response:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return login_response


@router.post("/register", response_model=UserResponse)
async def register(
    register_request: RegisterRequest,
    db: Session = Depends(get_db)
) -> Any:
    """
    Register a new user
    
    - **email**: User email address (must be unique)
    - **password**: User password (minimum 8 characters)
    - **confirm_password**: Password confirmation
    - **first_name**: User first name
    - **last_name**: User last name
    - **role**: User role (admin, doctor, nurse, receptionist, patient)
    - **license_number**: Medical license number (required for doctors)
    - **specialization**: Medical specialization (optional for doctors)
    
    Returns created user information
    """
    auth_service = AuthService()
    
    try:
        user = await auth_service.register(db, register_request)

        # Get doctor_id if user is a doctor
        doctor_id = None
        if user.role == 'doctor':
            from app.models.doctor import Doctor
            doctor = db.query(Doctor).filter(Doctor.user_id == user.id).first()
            if doctor:
                doctor_id = doctor.id

        return UserResponse(
            id=user.id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            role=user.role,
            keycloak_id=user.keycloak_id,
            is_active=user.is_active,
            last_login=user.last_login_at,
            created_at=user.created_at,
            updated_at=user.updated_at,
            full_name=user.get_full_name(),
            permissions=auth_service.get_role_permissions(user.role),
            doctor_id=doctor_id
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        print(f"Registration error: {str(e)}")  # Debug logging
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    refresh_request: RefreshTokenRequest,
    db: Session = Depends(get_db)
) -> Any:
    """
    Refresh access token using refresh token
    
    - **refresh_token**: Valid refresh token
    
    Returns new access and refresh tokens
    """
    auth_service = AuthService()
    
    tokens = auth_service.refresh_access_token(refresh_request.refresh_token, db)
    
    if not tokens:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return tokens


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(
    logout_request: LogoutRequest,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Logout user and invalidate tokens
    
    - **refresh_token**: Refresh token to invalidate (optional)
    
    Returns success message
    """
    # TODO: Implement token blacklisting
    # For now, we just return success since tokens will expire naturally
    
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Get current user information from JWT token

    Returns current user profile data
    """
    auth_service = AuthService()

    # Get doctor specialization and ID if user is a doctor
    specialization = None
    doctor_id = None
    if current_user.role == 'doctor':
        from app.models.doctor import Doctor
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if doctor:
            specialization = doctor.specialization
            doctor_id = doctor.id

    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        role=current_user.role,
        keycloak_id=current_user.keycloak_id,
        is_active=current_user.is_active,
        last_login=current_user.last_login_at,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at,
        full_name=current_user.get_full_name(),
        permissions=auth_service.get_role_permissions(current_user.role),
        specialization=specialization,
        doctor_id=doctor_id
    )


@router.post("/change-password", status_code=status.HTTP_200_OK)
async def change_password(
    password_change: PasswordChangeRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Change user password
    
    - **current_password**: Current password for verification
    - **new_password**: New password (minimum 8 characters)
    - **confirm_password**: New password confirmation
    
    Returns success message
    """
    auth_service = AuthService()
    
    # Verify current password
    if not auth_service.verify_password(password_change.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Hash new password and update
    new_hashed_password = auth_service.hash_password(password_change.new_password)
    
    from app.services.user_service import UserService
    user_service = UserService()
    
    success = user_service.change_user_password(db, current_user.id, new_hashed_password)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to change password"
        )
    
    return {"message": "Password changed successfully"}


@router.post("/request-password-reset", status_code=status.HTTP_200_OK)
async def request_password_reset(
    reset_request: PasswordResetRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
) -> Any:
    """
    Request password reset email
    
    - **email**: User email address
    
    Returns success message (always, for security)
    """
    auth_service = AuthService()
    from app.services.user_service import UserService
    
    user_service = UserService()
    user = user_service.get_user_by_email(db, reset_request.email)
    
    if user:
        # Generate reset token
        reset_token = auth_service.generate_password_reset_token(user)
        
        # TODO: Send email with reset token
        # background_tasks.add_task(send_password_reset_email, user.email, reset_token)
        
        # For now, we'll just log the token (remove in production)
        print(f"Password reset token for {user.email}: {reset_token}")
    
    # Always return success for security (don't reveal if email exists)
    return {"message": "If the email exists, a password reset link has been sent"}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(
    reset_confirm: PasswordResetConfirm,
    db: Session = Depends(get_db)
) -> Any:
    """
    Reset password using reset token
    
    - **token**: Password reset token from email
    - **new_password**: New password (minimum 8 characters)
    - **confirm_password**: New password confirmation
    
    Returns success message
    """
    auth_service = AuthService()
    
    # Verify reset token
    email = auth_service.verify_password_reset_token(reset_confirm.token)
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    # Reset password
    success = auth_service.reset_password(db, email, reset_confirm.new_password)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reset password"
        )
    
    return {"message": "Password reset successfully"}


@router.get("/permissions", response_model=dict)
async def get_user_permissions(
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get current user's permissions
    
    Returns list of permissions for current user's role
    """
    auth_service = AuthService()
    permissions = auth_service.get_role_permissions(current_user.role)
    
    return {
        "user_id": str(current_user.id),
        "role": current_user.role,
        "permissions": permissions
    }


@router.get("/validate-token", status_code=status.HTTP_200_OK)
async def validate_token(
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Validate JWT token
    
    Returns token validation status and user basic info
    """
    return {
        "valid": True,
        "user_id": str(current_user.id),
        "email": current_user.email,
        "role": current_user.role,
        "is_active": current_user.is_active
    }


# Keycloak integration endpoints (placeholder for future implementation)
@router.post("/keycloak/login", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def keycloak_login() -> Any:
    """
    Login with Keycloak (not implemented yet)
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Keycloak integration not implemented"
    )


@router.post("/keycloak/sync", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def sync_with_keycloak() -> Any:
    """
    Sync user data with Keycloak (not implemented yet)
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Keycloak integration not implemented"
    )