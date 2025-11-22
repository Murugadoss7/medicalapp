"""
Audit Log model following ERD specifications
HIPAA compliance requirement for tracking all data modifications
"""

from sqlalchemy import Column, String, Text, ForeignKey, Index, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB, ENUM
from sqlalchemy.orm import relationship, validates
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
import uuid

from app.models.base import Base, TimestampMixin


# Audit action enum as per ERD
AUDIT_ACTION_ENUM = ENUM(
    'INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW',
    name='audit_action',
    create_type=True
)


class AuditLog(Base, TimestampMixin):
    """
    Audit log model for HIPAA compliance
    Tracks all data modifications and access
    Following ERD audit_logs entity specifications
    """
    __tablename__ = "audit_logs"
    
    # Primary key
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False
    )
    
    # What was modified
    table_name = Column(
        String(100), 
        nullable=False,
        comment="Name of the table that was modified"
    )
    
    record_id = Column(
        String(255), 
        nullable=False,
        comment="ID of the record that was modified"
    )
    
    # What action was performed
    action = Column(
        AUDIT_ACTION_ENUM, 
        nullable=False,
        comment="Type of action performed"
    )
    
    # Data changes
    old_values = Column(
        JSONB,
        nullable=True,
        comment="Previous values before modification"
    )
    
    new_values = Column(
        JSONB,
        nullable=True,
        comment="New values after modification"
    )
    
    # Who performed the action
    performed_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
        comment="User who performed the action"
    )
    
    # Session and request information
    session_id = Column(
        String(255),
        nullable=True,
        comment="Session identifier"
    )
    
    ip_address = Column(
        String(45),  # IPv6 compatible
        nullable=True,
        comment="IP address of the user"
    )
    
    user_agent = Column(
        Text,
        nullable=True,
        comment="User agent string"
    )
    
    # Additional context
    reason = Column(
        Text,
        nullable=True,
        comment="Reason for the action (if provided)"
    )
    
    additional_info = Column(
        JSONB,
        nullable=True,
        comment="Additional context information"
    )
    
    # Timestamp override for created_at to ensure precision
    created_at = Column(
        DateTime(timezone=True), 
        nullable=False, 
        default=datetime.utcnow,
        comment="Exact timestamp when action occurred"
    )
    
    # Relationships
    performed_by_user = relationship(
        "User",
        back_populates="audit_logs"
    )
    
    # Indexes for performance and compliance reporting
    __table_args__ = (
        Index('idx_audit_logs_table_name', 'table_name'),
        Index('idx_audit_logs_record_id', 'record_id'),
        Index('idx_audit_logs_action', 'action'),
        Index('idx_audit_logs_performed_by', 'performed_by'),
        Index('idx_audit_logs_created_at', 'created_at'),
        Index('idx_audit_logs_table_record', 'table_name', 'record_id'),
        Index('idx_audit_logs_user_action', 'performed_by', 'action'),
        Index('idx_audit_logs_date_range', 'created_at', 'table_name'),
    )
    
    @validates('table_name')
    def validate_table_name(self, key, table_name):
        """Validate table name"""
        if not table_name:
            raise ValueError("Table name is required")
        
        return table_name.lower()
    
    @validates('record_id')
    def validate_record_id(self, key, record_id):
        """Validate record ID"""
        if not record_id:
            raise ValueError("Record ID is required")
        
        return str(record_id)
    
    @validates('ip_address')
    def validate_ip_address(self, key, ip_address):
        """Validate IP address format"""
        if ip_address:
            # Basic IP validation (IPv4 and IPv6)
            import ipaddress
            try:
                ipaddress.ip_address(ip_address)
            except ValueError:
                raise ValueError("Invalid IP address format")
        
        return ip_address
    
    def get_changes_summary(self) -> str:
        """Get human-readable summary of changes"""
        if self.action == 'INSERT':
            return f"Created new {self.table_name} record"
        elif self.action == 'UPDATE':
            if self.old_values and self.new_values:
                changed_fields = []
                for key in self.new_values.keys():
                    if key in self.old_values and self.old_values[key] != self.new_values[key]:
                        changed_fields.append(key)
                return f"Updated {self.table_name}: {', '.join(changed_fields)}"
            return f"Updated {self.table_name} record"
        elif self.action == 'DELETE':
            return f"Deleted {self.table_name} record"
        elif self.action == 'VIEW':
            return f"Viewed {self.table_name} record"
        elif self.action in ['LOGIN', 'LOGOUT']:
            return f"User {self.action.lower()}"
        else:
            return f"{self.action} on {self.table_name}"
    
    def get_changed_fields(self) -> List[str]:
        """Get list of fields that were changed"""
        if self.action == 'UPDATE' and self.old_values and self.new_values:
            changed = []
            for key in self.new_values.keys():
                if key in self.old_values and self.old_values[key] != self.new_values[key]:
                    changed.append(key)
            return changed
        return []
    
    def is_sensitive_operation(self) -> bool:
        """Check if this is a sensitive operation requiring special attention"""
        sensitive_tables = ['patients', 'prescriptions', 'medical_history', 'allergies']
        sensitive_actions = ['DELETE', 'VIEW']
        
        return (
            self.table_name in sensitive_tables or 
            self.action in sensitive_actions or
            (self.action == 'UPDATE' and 'is_active' in self.get_changed_fields())
        )
    
    def get_user_display(self) -> str:
        """Get user display name"""
        if self.performed_by_user:
            return self.performed_by_user.get_full_name()
        return "System"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            'id': str(self.id),
            'table_name': self.table_name,
            'record_id': self.record_id,
            'action': self.action,
            'old_values': self.old_values,
            'new_values': self.new_values,
            'performed_by': str(self.performed_by) if self.performed_by else None,
            'session_id': self.session_id,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'reason': self.reason,
            'additional_info': self.additional_info,
            'created_at': self.created_at.isoformat(),
            'changes_summary': self.get_changes_summary(),
            'changed_fields': self.get_changed_fields(),
            'is_sensitive_operation': self.is_sensitive_operation(),
            'user_display': self.get_user_display(),
        }
    
    def __repr__(self) -> str:
        return f"<AuditLog(action='{self.action}', table='{self.table_name}', record='{self.record_id}')>"


# Helper functions for audit logging

def create_audit_log(
    db,
    table_name: str,
    record_id: str,
    action: str,
    performed_by: Optional[uuid.UUID] = None,
    old_values: Optional[Dict[str, Any]] = None,
    new_values: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    session_id: Optional[str] = None,
    reason: Optional[str] = None,
    additional_info: Optional[Dict[str, Any]] = None
) -> AuditLog:
    """Create audit log entry"""
    
    # Filter sensitive data from audit logs
    if old_values:
        old_values = filter_sensitive_data(old_values)
    
    if new_values:
        new_values = filter_sensitive_data(new_values)
    
    audit_log = AuditLog(
        table_name=table_name,
        record_id=record_id,
        action=action,
        performed_by=performed_by,
        old_values=old_values,
        new_values=new_values,
        ip_address=ip_address,
        user_agent=user_agent,
        session_id=session_id,
        reason=reason,
        additional_info=additional_info
    )
    
    db.add(audit_log)
    db.flush()
    return audit_log


def filter_sensitive_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """Filter out sensitive data from audit logs"""
    sensitive_fields = [
        'password', 'password_hash', 'secret', 'token', 
        'api_key', 'private_key', 'ssn', 'credit_card'
    ]
    
    filtered_data = {}
    for key, value in data.items():
        if any(sensitive_field in key.lower() for sensitive_field in sensitive_fields):
            filtered_data[key] = '[REDACTED]'
        else:
            filtered_data[key] = value
    
    return filtered_data


def get_audit_trail(
    db,
    table_name: str = None,
    record_id: str = None,
    user_id: uuid.UUID = None,
    start_date: datetime = None,
    end_date: datetime = None,
    action: str = None,
    limit: int = 100
) -> List[AuditLog]:
    """Get audit trail with filters"""
    
    query = db.query(AuditLog)
    
    if table_name:
        query = query.filter(AuditLog.table_name == table_name)
    
    if record_id:
        query = query.filter(AuditLog.record_id == record_id)
    
    if user_id:
        query = query.filter(AuditLog.performed_by == user_id)
    
    if start_date:
        query = query.filter(AuditLog.created_at >= start_date)
    
    if end_date:
        query = query.filter(AuditLog.created_at <= end_date)
    
    if action:
        query = query.filter(AuditLog.action == action)
    
    return query.order_by(AuditLog.created_at.desc()).limit(limit).all()


def get_user_activity(
    db,
    user_id: uuid.UUID,
    start_date: datetime = None,
    end_date: datetime = None,
    limit: int = 50
) -> List[AuditLog]:
    """Get user activity logs"""
    
    query = db.query(AuditLog).filter(AuditLog.performed_by == user_id)
    
    if start_date:
        query = query.filter(AuditLog.created_at >= start_date)
    
    if end_date:
        query = query.filter(AuditLog.created_at <= end_date)
    
    return query.order_by(AuditLog.created_at.desc()).limit(limit).all()


def get_sensitive_operations(
    db,
    start_date: datetime = None,
    end_date: datetime = None,
    limit: int = 100
) -> List[AuditLog]:
    """Get sensitive operations for security monitoring"""
    
    sensitive_tables = ['patients', 'prescriptions', 'medical_history', 'allergies']
    sensitive_actions = ['DELETE', 'VIEW']
    
    query = db.query(AuditLog).filter(
        db.or_(
            AuditLog.table_name.in_(sensitive_tables),
            AuditLog.action.in_(sensitive_actions)
        )
    )
    
    if start_date:
        query = query.filter(AuditLog.created_at >= start_date)
    
    if end_date:
        query = query.filter(AuditLog.created_at <= end_date)
    
    return query.order_by(AuditLog.created_at.desc()).limit(limit).all()


def cleanup_old_audit_logs(db, retention_days: int = 2555) -> int:
    """
    Clean up old audit logs based on retention policy
    Default: 2555 days (7 years) for medical records compliance
    """
    cutoff_date = datetime.utcnow() - timedelta(days=retention_days)
    
    # Only delete non-sensitive operations beyond retention period
    deleted_count = db.query(AuditLog).filter(
        AuditLog.created_at < cutoff_date,
        AuditLog.table_name.notin_(['patients', 'prescriptions', 'medical_history']),
        AuditLog.action.notin_(['DELETE'])
    ).delete()
    
    return deleted_count


# Audit logging decorators and context managers

class AuditContext:
    """Context manager for audit logging"""
    
    def __init__(
        self, 
        db, 
        user_id: Optional[uuid.UUID] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        session_id: Optional[str] = None
    ):
        self.db = db
        self.user_id = user_id
        self.ip_address = ip_address
        self.user_agent = user_agent
        self.session_id = session_id
    
    def log(
        self,
        table_name: str,
        record_id: str,
        action: str,
        old_values: Optional[Dict[str, Any]] = None,
        new_values: Optional[Dict[str, Any]] = None,
        reason: Optional[str] = None
    ):
        """Log an audit entry"""
        return create_audit_log(
            self.db,
            table_name=table_name,
            record_id=record_id,
            action=action,
            performed_by=self.user_id,
            old_values=old_values,
            new_values=new_values,
            ip_address=self.ip_address,
            user_agent=self.user_agent,
            session_id=self.session_id,
            reason=reason
        )


def audit_data_access(
    db,
    table_name: str,
    record_id: str,
    user_id: Optional[uuid.UUID] = None,
    ip_address: Optional[str] = None
):
    """Log data access for HIPAA compliance"""
    return create_audit_log(
        db,
        table_name=table_name,
        record_id=record_id,
        action='VIEW',
        performed_by=user_id,
        ip_address=ip_address
    )