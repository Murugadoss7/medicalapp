"""
Base model classes following ERD specifications
Implements audit logging and common patterns for all entities
"""

from sqlalchemy import Column, String, DateTime, Boolean, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declared_attr
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Any, Dict
import uuid

from app.core.database import Base


class TimestampMixin:
    """
    Mixin for created_at and updated_at timestamps
    Required by ERD for all entities
    """
    created_at = Column(
        DateTime(timezone=True), 
        nullable=False, 
        default=datetime.utcnow,
        server_default=text("CURRENT_TIMESTAMP")
    )
    updated_at = Column(
        DateTime(timezone=True), 
        nullable=False, 
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        server_default=text("CURRENT_TIMESTAMP")
    )


class UUIDMixin:
    """
    Mixin for UUID primary key
    Used by most entities except patients (which use composite key)
    """
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
        nullable=False
    )


class ActiveMixin:
    """
    Mixin for soft delete functionality
    ERD requirement for maintaining data integrity
    """
    is_active = Column(Boolean, nullable=False, default=True)


class AuditMixin:
    """
    Mixin for audit trail functionality
    HIPAA compliance requirement from ERD
    """
    @declared_attr
    def created_by(cls):
        return Column(
            UUID(as_uuid=True),
            nullable=True,  # Can be null for system-created records
            comment="User who created this record"
        )


class BaseModel(Base, TimestampMixin, UUIDMixin, ActiveMixin, AuditMixin):
    """
    Base model class for all entities following ERD patterns
    Includes common functionality required across all tables
    """
    __abstract__ = True
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Convert model instance to dictionary
        Useful for API responses and caching
        """
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, datetime):
                result[column.name] = value.isoformat()
            elif isinstance(value, uuid.UUID):
                result[column.name] = str(value)
            else:
                result[column.name] = value
        return result
    
    def update_from_dict(self, data: Dict[str, Any]) -> None:
        """
        Update model instance from dictionary
        Used for PATCH operations
        """
        for key, value in data.items():
            if hasattr(self, key) and key not in ['id', 'created_at']:
                setattr(self, key, value)
        
        # Always update the timestamp
        self.updated_at = datetime.utcnow()
    
    @classmethod
    def create(cls, db: Session, **kwargs) -> "BaseModel":
        """
        Create a new instance and save to database
        Includes audit logging
        """
        instance = cls(**kwargs)
        db.add(instance)
        db.flush()  # Get ID without committing
        return instance
    
    def save(self, db: Session) -> "BaseModel":
        """
        Save instance to database
        """
        db.add(self)
        db.flush()
        return self
    
    def delete(self, db: Session, hard_delete: bool = False) -> None:
        """
        Delete instance (soft delete by default for audit trail)
        Hard delete only for non-sensitive data
        """
        if hard_delete:
            db.delete(self)
        else:
            self.is_active = False
            self.updated_at = datetime.utcnow()
            db.add(self)
        db.flush()
    
    def __repr__(self) -> str:
        """String representation for debugging"""
        return f"<{self.__class__.__name__}(id={self.id})>"


class CompositeKeyMixin:
    """
    Mixin for entities using composite keys (like patients)
    Special handling for ERD composite key requirements
    """
    
    @classmethod
    def get_composite_key_fields(cls) -> list:
        """Override in subclasses to specify composite key fields"""
        raise NotImplementedError("Subclasses must implement get_composite_key_fields")
    
    def get_composite_key_values(self) -> tuple:
        """Get values of composite key fields"""
        fields = self.get_composite_key_fields()
        return tuple(getattr(self, field) for field in fields)
    
    def composite_key_dict(self) -> Dict[str, Any]:
        """Get composite key as dictionary"""
        fields = self.get_composite_key_fields()
        return {field: getattr(self, field) for field in fields}


class EntityNotFoundError(Exception):
    """
    Custom exception for entity not found errors
    Provides context for ERD entity relationships
    """
    def __init__(self, entity_name: str, identifier: Any):
        self.entity_name = entity_name
        self.identifier = identifier
        super().__init__(f"{entity_name} not found: {identifier}")


class ValidationError(Exception):
    """
    Custom exception for validation errors
    Used for ERD business rule violations
    """
    def __init__(self, field: str, message: str, value: Any = None):
        self.field = field
        self.message = message
        self.value = value
        super().__init__(f"Validation error for {field}: {message}")


class BusinessRuleViolation(Exception):
    """
    Custom exception for business rule violations
    Used when ERD constraints are violated
    """
    def __init__(self, rule: str, message: str, context: Dict[str, Any] = None):
        self.rule = rule
        self.message = message
        self.context = context or {}
        super().__init__(f"Business rule violation ({rule}): {message}")


# Utility functions for ERD compliance

def validate_composite_key_uniqueness(
    db: Session, 
    model_class: type, 
    key_values: Dict[str, Any],
    exclude_id: uuid.UUID = None
) -> bool:
    """
    Validate that composite key values are unique
    Essential for patients table ERD requirements
    """
    query = db.query(model_class)
    
    # Apply composite key filters
    for field, value in key_values.items():
        query = query.filter(getattr(model_class, field) == value)
    
    # Exclude current record if updating
    if exclude_id and hasattr(model_class, 'id'):
        query = query.filter(model_class.id != exclude_id)
    
    # Check active records only
    if hasattr(model_class, 'is_active'):
        query = query.filter(model_class.is_active == True)
    
    return query.first() is None


def create_audit_entry(
    db: Session,
    table_name: str,
    record_id: str,
    action: str,
    old_values: Dict[str, Any] = None,
    new_values: Dict[str, Any] = None,
    performed_by: uuid.UUID = None
) -> None:
    """
    Create audit log entry
    Required by ERD for HIPAA compliance
    """
    from app.models.audit_log import AuditLog
    
    audit_entry = AuditLog(
        table_name=table_name,
        record_id=record_id,
        action=action,
        old_values=old_values,
        new_values=new_values,
        performed_by=performed_by
    )
    
    db.add(audit_entry)
    db.flush()