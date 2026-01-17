"""
Tenant Middleware for Multi-Tenancy Support
Extracts tenant_id from JWT and stores in request state
"""

import jwt
import logging
from typing import Optional
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings

logger = logging.getLogger(__name__)


class TenantMiddleware(BaseHTTPMiddleware):
    """
    Lightweight middleware to extract tenant_id from JWT token
    The actual database context is set in get_db() dependency
    """

    def __init__(self, app):
        super().__init__(app)
        self.secret_key = settings.JWT_SECRET_KEY
        self.algorithm = settings.JWT_ALGORITHM

    async def dispatch(self, request: Request, call_next):
        """
        Extract tenant_id from JWT and store in request state
        """
        tenant_id = None

        # Extract tenant_id from JWT token
        try:
            auth_header = request.headers.get("Authorization")

            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header.replace("Bearer ", "")

                try:
                    payload = jwt.decode(
                        token,
                        self.secret_key,
                        algorithms=[self.algorithm]
                    )
                    tenant_id = payload.get("tenant_id")

                    if tenant_id:
                        logger.debug(f"Tenant ID extracted: {tenant_id}")

                except jwt.ExpiredSignatureError:
                    logger.debug("JWT token expired")
                except jwt.InvalidTokenError:
                    logger.debug("Invalid JWT token")

        except Exception as e:
            logger.error(f"Error extracting tenant_id: {e}")

        # Store tenant_id in request state
        # The get_db() dependency will use this to set database context
        request.state.tenant_id = tenant_id

        # Continue processing
        response = await call_next(request)
        return response


def get_tenant_id_from_request(request: Request) -> Optional[str]:
    """
    Get tenant_id from request state
    """
    return getattr(request.state, "tenant_id", None)


def require_tenant_context(request: Request) -> str:
    """
    Ensure tenant context exists, raise error if not
    """
    tenant_id = get_tenant_id_from_request(request)

    if not tenant_id:
        raise ValueError("Tenant context required")

    return tenant_id
