"""
Pydantic schemas for request/response models
Following ERD specifications for data validation
"""

from .auth import *
from .user import *

# TODO: Import other schemas as they are implemented
from .patient import *
from .doctor import *
from .medicine import *
from .short_key import *
from .appointment import *
from .dental import *
from .prescription_template import *
# from .prescription import *

__all__ = [
    "LoginRequest", "LoginResponse", "TokenResponse", "RegisterRequest",
    "UserResponse", "UserCreate", "UserUpdate", "UserList", "UserFilters",
    "UserProfile", "RolePermissions", "UserActivity"
    # TODO: Add other schema exports as they are implemented
]