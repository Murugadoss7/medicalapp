"""
User management API endpoints
Handles user CRUD operations, role management, and user administration
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Any, Optional
from uuid import UUID

from app.api.deps import (
    get_db, get_current_active_user, require_admin, 
    require_permission, require_admin_access
)
from app.models.user import User
from app.schemas.user import (
    UserResponse, UserCreate, UserUpdate, UserList, 
    UserFilters, UserProfile, RolePermissions
)
from app.services.user_service import UserService
from app.services.auth_service import AuthService


router = APIRouter()


@router.get("/", response_model=UserList)
async def get_users(
    role: Optional[str] = Query(None, description="Filter by role"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    search: Optional[str] = Query(None, description="Search in name or email"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    sort_by: str = Query("created_at", description="Sort field"),
    sort_order: str = Query("desc", description="Sort order"),
    current_user: User = Depends(require_admin_access()),
    db: Session = Depends(get_db)
) -> Any:
    """
    Get paginated list of users (Admin only)
    
    - **role**: Filter by user role
    - **is_active**: Filter by active status
    - **search**: Search in name or email
    - **page**: Page number (default: 1)
    - **limit**: Items per page (default: 10, max: 100)
    - **sort_by**: Sort field (default: created_at)
    - **sort_order**: Sort order - asc/desc (default: desc)
    
    Returns paginated list of users
    """
    user_service = UserService()
    
    filters = UserFilters(
        role=role,
        is_active=is_active,
        search=search,
        page=page,
        limit=limit,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    users, total = user_service.get_users_list(db, filters)
    
    # Convert to response schema
    user_responses = []
    auth_service = AuthService()
    
    for user in users:
        user_response = UserResponse(
            id=user.id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            role=user.role,
            keycloak_id=user.keycloak_id,
            is_active=user.is_active,
            last_login=user.last_login,
            created_at=user.created_at,
            updated_at=user.updated_at,
            full_name=user.get_full_name(),
            permissions=auth_service.get_role_permissions(user.role)
        )
        user_responses.append(user_response)
    
    return UserList(
        users=user_responses,
        total=total,
        page=page,
        limit=limit,
        has_more=(page * limit) < total
    )


@router.get("/me", response_model=UserProfile)
async def get_my_profile(
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get current user's profile
    
    Returns detailed profile information for the authenticated user
    """
    auth_service = AuthService()
    
    return UserProfile(
        id=current_user.id,
        email=current_user.email,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        role=current_user.role,
        keycloak_id=current_user.keycloak_id,
        is_active=current_user.is_active,
        last_login=current_user.last_login,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at,
        full_name=current_user.get_full_name(),
        permissions=auth_service.get_role_permissions(current_user.role)
    )


@router.put("/me", response_model=UserResponse)
async def update_my_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Update current user's profile
    
    - **first_name**: Updated first name
    - **last_name**: Updated last name
    - **email**: Updated email address
    
    Note: Role and active status cannot be changed by the user
    """
    user_service = UserService()
    
    # Remove role and is_active from user updates (users can't change these)
    update_data = user_update.dict(exclude_unset=True)
    if "role" in update_data:
        del update_data["role"]
    if "is_active" in update_data:
        del update_data["is_active"]
    
    # Validate email uniqueness if being updated
    if "email" in update_data:
        if not user_service.validate_user_email_unique(db, update_data["email"], current_user.id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email address already exists"
            )
    
    filtered_update = UserUpdate(**update_data)
    updated_user = user_service.update_user(db, current_user.id, filtered_update)
    
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    auth_service = AuthService()
    return UserResponse(
        id=updated_user.id,
        email=updated_user.email,
        first_name=updated_user.first_name,
        last_name=updated_user.last_name,
        role=updated_user.role,
        keycloak_id=updated_user.keycloak_id,
        is_active=updated_user.is_active,
        last_login=updated_user.last_login,
        created_at=updated_user.created_at,
        updated_at=updated_user.updated_at,
        full_name=updated_user.get_full_name(),
        permissions=auth_service.get_role_permissions(updated_user.role)
    )


@router.get("/{user_id}", response_model=UserResponse)
async def get_user_by_id(
    user_id: UUID,
    current_user: User = Depends(require_admin_access()),
    db: Session = Depends(get_db)
) -> Any:
    """
    Get user by ID (Admin only)
    
    - **user_id**: User UUID
    
    Returns user information
    """
    user_service = UserService()
    user = user_service.get_user_by_id(db, user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    auth_service = AuthService()
    return UserResponse(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        role=user.role,
        keycloak_id=user.keycloak_id,
        is_active=user.is_active,
        last_login=user.last_login,
        created_at=user.created_at,
        updated_at=user.updated_at,
        full_name=user.get_full_name(),
        permissions=auth_service.get_role_permissions(user.role)
    )


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: UUID,
    user_update: UserUpdate,
    current_user: User = Depends(require_admin_access()),
    db: Session = Depends(get_db)
) -> Any:
    """
    Update user by ID (Admin only)
    
    - **user_id**: User UUID
    - **first_name**: Updated first name
    - **last_name**: Updated last name
    - **email**: Updated email address
    - **role**: Updated user role
    - **is_active**: Updated active status
    
    Returns updated user information
    """
    user_service = UserService()
    
    # Validate email uniqueness if being updated
    if user_update.email:
        if not user_service.validate_user_email_unique(db, user_update.email, user_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email address already exists"
            )
    
    updated_user = user_service.update_user(db, user_id, user_update)
    
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    auth_service = AuthService()
    return UserResponse(
        id=updated_user.id,
        email=updated_user.email,
        first_name=updated_user.first_name,
        last_name=updated_user.last_name,
        role=updated_user.role,
        keycloak_id=updated_user.keycloak_id,
        is_active=updated_user.is_active,
        last_login=updated_user.last_login,
        created_at=updated_user.created_at,
        updated_at=updated_user.updated_at,
        full_name=updated_user.get_full_name(),
        permissions=auth_service.get_role_permissions(updated_user.role)
    )


@router.delete("/{user_id}", status_code=status.HTTP_200_OK)
async def deactivate_user(
    user_id: UUID,
    current_user: User = Depends(require_admin_access()),
    db: Session = Depends(get_db)
) -> Any:
    """
    Deactivate user (soft delete) (Admin only)
    
    - **user_id**: User UUID
    
    Returns success message
    """
    user_service = UserService()
    
    # Prevent self-deactivation
    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account"
        )
    
    success = user_service.deactivate_user(db, user_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {"message": "User deactivated successfully"}


@router.post("/{user_id}/activate", status_code=status.HTTP_200_OK)
async def activate_user(
    user_id: UUID,
    current_user: User = Depends(require_admin_access()),
    db: Session = Depends(get_db)
) -> Any:
    """
    Activate user (Admin only)
    
    - **user_id**: User UUID
    
    Returns success message
    """
    user_service = UserService()
    
    success = user_service.activate_user(db, user_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {"message": "User activated successfully"}


@router.get("/search/by-email/{email}", response_model=UserResponse)
async def get_user_by_email(
    email: str,
    current_user: User = Depends(require_admin_access()),
    db: Session = Depends(get_db)
) -> Any:
    """
    Get user by email (Admin only)
    
    - **email**: User email address
    
    Returns user information
    """
    user_service = UserService()
    user = user_service.get_user_by_email(db, email)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    auth_service = AuthService()
    return UserResponse(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        role=user.role,
        keycloak_id=user.keycloak_id,
        is_active=user.is_active,
        last_login=user.last_login,
        created_at=user.created_at,
        updated_at=user.updated_at,
        full_name=user.get_full_name(),
        permissions=auth_service.get_role_permissions(user.role)
    )


@router.get("/roles/{role}", response_model=list[UserResponse])
async def get_users_by_role(
    role: str,
    current_user: User = Depends(require_admin_access()),
    db: Session = Depends(get_db)
) -> Any:
    """
    Get all users with specific role (Admin only)
    
    - **role**: User role to filter by
    
    Returns list of users with the specified role
    """
    user_service = UserService()
    users = user_service.get_users_by_role(db, role)
    
    # Convert to response schema
    auth_service = AuthService()
    user_responses = []
    
    for user in users:
        user_response = UserResponse(
            id=user.id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            role=user.role,
            keycloak_id=user.keycloak_id,
            is_active=user.is_active,
            last_login=user.last_login,
            created_at=user.created_at,
            updated_at=user.updated_at,
            full_name=user.get_full_name(),
            permissions=auth_service.get_role_permissions(user.role)
        )
        user_responses.append(user_response)
    
    return user_responses


@router.get("/search/query", response_model=list[UserResponse])
async def search_users(
    q: str = Query(..., min_length=2, description="Search query"),
    limit: int = Query(10, ge=1, le=50, description="Maximum results"),
    current_user: User = Depends(require_admin_access()),
    db: Session = Depends(get_db)
) -> Any:
    """
    Search users by name or email (Admin only)
    
    - **q**: Search query (minimum 2 characters)
    - **limit**: Maximum number of results (default: 10, max: 50)
    
    Returns list of matching users
    """
    user_service = UserService()
    users = user_service.search_users(db, q, limit)
    
    # Convert to response schema
    auth_service = AuthService()
    user_responses = []
    
    for user in users:
        user_response = UserResponse(
            id=user.id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            role=user.role,
            keycloak_id=user.keycloak_id,
            is_active=user.is_active,
            last_login=user.last_login,
            created_at=user.created_at,
            updated_at=user.updated_at,
            full_name=user.get_full_name(),
            permissions=auth_service.get_role_permissions(user.role)
        )
        user_responses.append(user_response)
    
    return user_responses


@router.get("/statistics/overview", response_model=dict)
async def get_user_statistics(
    current_user: User = Depends(require_admin_access()),
    db: Session = Depends(get_db)
) -> Any:
    """
    Get user statistics overview (Admin only)
    
    Returns user statistics including counts by role, recent registrations, etc.
    """
    user_service = UserService()
    return user_service.get_user_statistics(db)


@router.get("/roles/permissions/list", response_model=list[RolePermissions])
async def get_role_permissions(
    current_user: User = Depends(require_admin_access())
) -> Any:
    """
    Get permissions for all roles (Admin only)
    
    Returns list of roles and their associated permissions
    """
    auth_service = AuthService()
    
    roles = [
        {
            "role": "super_admin",
            "description": "Super administrator with full system access"
        },
        {
            "role": "admin", 
            "description": "Administrator with system management access"
        },
        {
            "role": "doctor",
            "description": "Medical doctor with patient care permissions"
        },
        {
            "role": "nurse",
            "description": "Nurse with patient care support permissions"
        },
        {
            "role": "receptionist",
            "description": "Receptionist with appointment and patient management"
        },
        {
            "role": "patient",
            "description": "Patient with access to own medical data"
        }
    ]
    
    role_permissions = []
    for role_info in roles:
        permissions = auth_service.get_role_permissions(role_info["role"])
        role_permissions.append(RolePermissions(
            role=role_info["role"],
            permissions=permissions,
            description=role_info["description"]
        ))
    
    return role_permissions