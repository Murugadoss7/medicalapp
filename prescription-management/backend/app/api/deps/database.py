"""
Database dependency for FastAPI endpoints
Provides database session management
"""

from typing import Generator
from sqlalchemy.orm import Session

from app.core.database import SessionLocal


def get_db() -> Generator[Session, None, None]:
    """
    Database dependency that provides a database session.
    Automatically handles session cleanup on request completion.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()