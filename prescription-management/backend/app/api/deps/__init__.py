"""
API Dependencies
Handles authentication, authorization, and common dependencies
"""

from .auth import (
    get_current_user,
    get_current_active_user,
    require_permission,
    require_role,
    require_admin,
    require_doctor,
    require_staff,
    require_admin_access,
    get_db
)

__all__ = [
    "get_current_user",
    "get_current_active_user", 
    "require_permission",
    "require_role",
    "require_admin",
    "require_doctor", 
    "require_staff",
    "require_admin_access",
    "get_db"
]