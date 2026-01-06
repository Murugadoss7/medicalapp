"""
Tenant model for multi-tenancy support
Manages organizations, subscriptions, and limits
"""

from sqlalchemy import Column, String, Integer, Boolean, TIMESTAMP, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship, validates
from typing import Dict, Any
from datetime import datetime, timedelta

from app.models.base import BaseModel


class Tenant(BaseModel):
    """
    Tenant model representing an organization/clinic group
    Supports subscription management and resource limits
    """
    __tablename__ = "tenants"

    # Basic Information
    tenant_name = Column(
        String(200),
        nullable=False,
        comment="Organization or clinic group name"
    )

    tenant_code = Column(
        String(50),
        nullable=False,
        unique=True,
        comment="Unique tenant identifier code"
    )

    # Subscription Management
    subscription_plan = Column(
        String(50),
        nullable=False,
        server_default='trial',
        comment="Subscription plan: trial, basic, premium, enterprise"
    )

    subscription_status = Column(
        String(50),
        nullable=False,
        server_default='active',
        comment="Subscription status: active, suspended, cancelled"
    )

    trial_ends_at = Column(
        TIMESTAMP(timezone=True),
        nullable=True,
        comment="Trial period expiration date"
    )

    subscription_ends_at = Column(
        TIMESTAMP(timezone=True),
        nullable=True,
        comment="Subscription expiration date"
    )

    # Resource Limits
    max_clinics = Column(
        Integer,
        nullable=False,
        server_default='1',
        comment="Maximum number of clinics/offices allowed"
    )

    max_doctors = Column(
        Integer,
        nullable=False,
        server_default='5',
        comment="Maximum number of doctors allowed"
    )

    max_patients = Column(
        Integer,
        nullable=False,
        server_default='1000',
        comment="Maximum number of patients allowed"
    )

    max_storage_mb = Column(
        Integer,
        nullable=False,
        server_default='1000',
        comment="Maximum storage in megabytes"
    )

    # Contact Information
    billing_email = Column(
        String(255),
        nullable=True,
        comment="Billing contact email"
    )

    support_email = Column(
        String(255),
        nullable=True,
        comment="Support contact email"
    )

    phone = Column(
        String(20),
        nullable=True,
        comment="Primary contact phone number"
    )

    # Tenant Settings (flexible JSONB)
    settings = Column(
        JSONB,
        nullable=True,
        server_default='{}',
        comment="Tenant-specific settings and preferences"
    )

    # Relationships
    users = relationship(
        "User",
        back_populates="tenant",
        cascade="all, delete-orphan",
        lazy="dynamic"
    )

    doctors = relationship(
        "Doctor",
        back_populates="tenant",
        cascade="all, delete-orphan",
        lazy="dynamic"
    )

    patients = relationship(
        "Patient",
        back_populates="tenant",
        cascade="all, delete-orphan",
        lazy="dynamic"
    )

    # Indexes
    __table_args__ = (
        Index('idx_tenants_code', 'tenant_code'),
        Index('idx_tenants_status', 'subscription_status', 'is_active'),
        Index('idx_tenants_plan', 'subscription_plan'),
    )

    @validates('tenant_code')
    def validate_tenant_code(self, key, tenant_code):
        """Validate tenant code format"""
        if not tenant_code:
            raise ValueError("Tenant code is required")

        tenant_code = tenant_code.strip().upper()

        if len(tenant_code) < 3:
            raise ValueError("Tenant code must be at least 3 characters")

        # Allow only alphanumeric and underscores
        import re
        if not re.match(r'^[A-Z0-9_]+$', tenant_code):
            raise ValueError("Tenant code can only contain letters, numbers, and underscores")

        return tenant_code

    @validates('subscription_plan')
    def validate_subscription_plan(self, key, plan):
        """Validate subscription plan"""
        valid_plans = ['trial', 'basic', 'premium', 'enterprise']
        if plan not in valid_plans:
            raise ValueError(f"Invalid subscription plan. Must be one of: {', '.join(valid_plans)}")
        return plan

    @validates('subscription_status')
    def validate_subscription_status(self, key, status):
        """Validate subscription status"""
        valid_statuses = ['active', 'suspended', 'cancelled', 'expired']
        if status not in valid_statuses:
            raise ValueError(f"Invalid status. Must be one of: {', '.join(valid_statuses)}")
        return status

    def is_trial_expired(self) -> bool:
        """Check if trial period has expired"""
        if not self.trial_ends_at:
            return False
        return datetime.now() > self.trial_ends_at

    def is_subscription_expired(self) -> bool:
        """Check if subscription has expired"""
        if not self.subscription_ends_at:
            return False
        return datetime.now() > self.subscription_ends_at

    def days_until_expiry(self) -> int:
        """Get days until subscription expires"""
        if self.subscription_plan == 'trial' and self.trial_ends_at:
            delta = self.trial_ends_at - datetime.now()
            return max(0, delta.days)
        elif self.subscription_ends_at:
            delta = self.subscription_ends_at - datetime.now()
            return max(0, delta.days)
        return -1  # No expiry set

    def can_add_doctor(self, current_count: int) -> bool:
        """Check if tenant can add more doctors"""
        if self.max_doctors == -1:  # Unlimited
            return True
        return current_count < self.max_doctors

    def can_add_patient(self, current_count: int) -> bool:
        """Check if tenant can add more patients"""
        if self.max_patients == -1:  # Unlimited
            return True
        return current_count < self.max_patients

    def get_plan_limits(self) -> Dict[str, Any]:
        """Get all plan limits as dictionary"""
        return {
            'max_clinics': self.max_clinics if self.max_clinics != -1 else 'unlimited',
            'max_doctors': self.max_doctors if self.max_doctors != -1 else 'unlimited',
            'max_patients': self.max_patients if self.max_patients != -1 else 'unlimited',
            'max_storage_mb': self.max_storage_mb if self.max_storage_mb != -1 else 'unlimited',
        }

    def get_settings(self) -> Dict[str, Any]:
        """Get tenant settings as dictionary"""
        return dict(self.settings) if self.settings else {}

    def update_settings(self, new_settings: Dict[str, Any]) -> None:
        """Update tenant settings"""
        current_settings = self.get_settings()
        current_settings.update(new_settings)
        self.settings = current_settings

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary with additional computed fields"""
        data = super().to_dict()

        data.update({
            'is_trial_expired': self.is_trial_expired(),
            'is_subscription_expired': self.is_subscription_expired(),
            'days_until_expiry': self.days_until_expiry(),
            'plan_limits': self.get_plan_limits(),
            'settings_dict': self.get_settings(),
        })

        return data

    def __repr__(self) -> str:
        return f"<Tenant(code='{self.tenant_code}', name='{self.tenant_name}', plan='{self.subscription_plan}')>"

    def __str__(self) -> str:
        return f"{self.tenant_name} ({self.tenant_code})"


# Subscription plan definitions
SUBSCRIPTION_PLANS = {
    "trial": {
        "name": "Trial",
        "duration_days": 30,
        "price": 0,
        "limits": {
            "max_clinics": 1,
            "max_doctors": 5,
            "max_patients": 1000,
            "max_storage_mb": 1000,  # 1 GB
        },
        "features": [
            "Basic appointment scheduling",
            "Prescription management",
            "Patient records",
            "Single clinic location"
        ]
    },
    "basic": {
        "name": "Basic",
        "price": 2999,  # ₹2999/month
        "limits": {
            "max_clinics": 3,
            "max_doctors": 20,
            "max_patients": 10000,
            "max_storage_mb": 10000,  # 10 GB
        },
        "features": [
            "Everything in Trial",
            "Multiple clinic locations (3)",
            "Advanced analytics",
            "Email reminders",
            "WhatsApp integration"
        ]
    },
    "premium": {
        "name": "Premium",
        "price": 9999,  # ₹9999/month
        "limits": {
            "max_clinics": 10,
            "max_doctors": 100,
            "max_patients": -1,  # Unlimited
            "max_storage_mb": 100000,  # 100 GB
        },
        "features": [
            "Everything in Basic",
            "Unlimited patients",
            "Multiple clinic locations (10)",
            "Priority support",
            "Custom integrations",
            "API access"
        ]
    },
    "enterprise": {
        "name": "Enterprise",
        "price": "Custom",
        "limits": {
            "max_clinics": -1,  # Unlimited
            "max_doctors": -1,  # Unlimited
            "max_patients": -1,  # Unlimited
            "max_storage_mb": -1,  # Unlimited
        },
        "features": [
            "Everything in Premium",
            "Unlimited everything",
            "Dedicated support",
            "Custom development",
            "SLA guarantee"
        ]
    }
}


def generate_tenant_code(tenant_name: str) -> str:
    """Generate unique tenant code from name"""
    import re
    import secrets

    # Clean and uppercase
    code = tenant_name.upper()

    # Keep only alphanumeric and spaces
    code = re.sub(r'[^A-Z0-9\s]', '', code)

    # Replace spaces with underscores
    code = re.sub(r'\s+', '_', code)

    # Take first 8 characters
    code = code[:8]

    # Add random suffix for uniqueness
    suffix = secrets.token_hex(2).upper()
    code = f"{code}_{suffix}"

    return code


def create_trial_tenant(db, tenant_name: str) -> Tenant:
    """
    Create new trial tenant with default settings
    """
    from datetime import datetime, timedelta

    plan_config = SUBSCRIPTION_PLANS['trial']

    tenant = Tenant(
        tenant_name=tenant_name,
        tenant_code=generate_tenant_code(tenant_name),
        subscription_plan='trial',
        subscription_status='active',
        trial_ends_at=datetime.now() + timedelta(days=plan_config['duration_days']),
        max_clinics=plan_config['limits']['max_clinics'],
        max_doctors=plan_config['limits']['max_doctors'],
        max_patients=plan_config['limits']['max_patients'],
        max_storage_mb=plan_config['limits']['max_storage_mb'],
    )

    db.add(tenant)
    db.flush()
    return tenant
