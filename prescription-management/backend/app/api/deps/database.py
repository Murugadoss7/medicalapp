"""
Database dependency for FastAPI endpoints
Provides database session management with multi-tenancy support
"""

from typing import Generator, Optional
import logging
from sqlalchemy.orm import Session
from sqlalchemy import text
from fastapi import Request

from app.core.database import SessionLocal

logger = logging.getLogger(__name__)


def get_db(request: Request) -> Generator[Session, None, None]:
    """
    Database dependency that provides a database session.
    Automatically sets tenant context from JWT token for RLS.
    Handles session cleanup on request completion.

    NOTE: Request parameter is required - FastAPI will inject it automatically.
    The TenantMiddleware sets request.state.tenant_id from JWT.
    """
    db = SessionLocal()
    try:
        # Set tenant context if available from request state (set by TenantMiddleware)
        if hasattr(request.state, 'tenant_id') and request.state.tenant_id:
            try:
                # Use SET (session-level) so it persists across transactions
                db.execute(text(f"SET app.current_tenant_id = '{request.state.tenant_id}'"))
                logger.debug(f"Tenant context set: {request.state.tenant_id}")
            except Exception as e:
                logger.error(f"Failed to set tenant context: {e}")

        yield db
    finally:
        db.close()