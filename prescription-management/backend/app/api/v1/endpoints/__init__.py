"""
API v1 endpoints
"""

# Import only implemented endpoint modules
from . import auth
from . import users
from . import doctors

# TODO: Import other endpoint modules as they are implemented
# from . import patients
# from . import medicines
# from . import prescriptions
# from . import appointments

__all__ = [
    "auth",
    "users",
    "doctors"
    # TODO: Add other endpoint modules as they are implemented
]