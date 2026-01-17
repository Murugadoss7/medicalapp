"""
Tenant Service
Handles multi-tenant clinic registration and management
"""

from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.tenant import Tenant
from app.models.user import User
from app.models.doctor import Doctor
from app.schemas.tenant import TenantCreate, TenantUpdate


class TenantService:
    """Tenant management service"""

    def create_tenant(
        self,
        db: Session,
        tenant_data: TenantCreate,
        auto_commit: bool = True
    ) -> Tenant:
        """
        Create a new tenant

        Args:
            db: Database session
            tenant_data: Tenant creation data
            auto_commit: Whether to automatically commit

        Returns:
            Created tenant object
        """
        # Generate unique tenant code if not provided
        if not tenant_data.tenant_code:
            tenant_code = self._generate_tenant_code(db, tenant_data.tenant_name)
        else:
            tenant_code = tenant_data.tenant_code

        tenant = Tenant(
            tenant_name=tenant_data.tenant_name,
            tenant_code=tenant_code,
            subscription_plan=tenant_data.subscription_plan or 'trial',
            subscription_status='active',
            trial_ends_at=datetime.utcnow() + timedelta(days=30),
            max_clinics=tenant_data.max_clinics or 1,
            max_doctors=tenant_data.max_doctors or 5,
            max_patients=tenant_data.max_patients or 1000,
            max_storage_mb=tenant_data.max_storage_mb or 1000,
            is_active=True
        )

        db.add(tenant)

        if auto_commit:
            db.commit()
            # Don't refresh after commit - RLS blocks it
        else:
            db.flush()

        return tenant

    def get_tenant_by_id(self, db: Session, tenant_id: UUID) -> Optional[Tenant]:
        """Get tenant by ID"""
        return db.query(Tenant).filter(
            Tenant.id == tenant_id,
            Tenant.is_active == True
        ).first()

    def get_tenant_by_code(self, db: Session, tenant_code: str) -> Optional[Tenant]:
        """Get tenant by code"""
        return db.query(Tenant).filter(
            Tenant.tenant_code == tenant_code,
            Tenant.is_active == True
        ).first()

    def update_tenant(
        self,
        db: Session,
        tenant_id: UUID,
        tenant_update: TenantUpdate
    ) -> Optional[Tenant]:
        """Update tenant information"""
        tenant = self.get_tenant_by_id(db, tenant_id)
        if not tenant:
            return None

        update_data = tenant_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(tenant, field, value)

        tenant.updated_at = datetime.utcnow()
        db.commit()
        # Don't refresh after commit - RLS blocks it
        return tenant

    def check_tenant_limits(
        self,
        db: Session,
        tenant_id: UUID
    ) -> Dict[str, Any]:
        """
        Check current usage against tenant limits

        Returns dict with current counts and limits
        """
        tenant = self.get_tenant_by_id(db, tenant_id)
        if not tenant:
            return None

        # Count current doctors
        doctor_count = db.query(func.count(Doctor.id)).filter(
            Doctor.tenant_id == tenant_id,
            Doctor.is_active == True
        ).scalar()

        # Count current patients
        from app.models.patient import Patient
        patient_count = db.query(func.count(Patient.id)).filter(
            Patient.tenant_id == tenant_id,
            Patient.is_active == True
        ).scalar()

        # Count current users
        user_count = db.query(func.count(User.id)).filter(
            User.tenant_id == tenant_id,
            User.is_active == True
        ).scalar()

        return {
            'tenant_id': str(tenant_id),
            'tenant_name': tenant.tenant_name,
            'subscription_plan': tenant.subscription_plan,
            'doctors': {
                'current': doctor_count,
                'max': tenant.max_doctors,
                'can_add': tenant.can_add_doctor(doctor_count)
            },
            'patients': {
                'current': patient_count,
                'max': tenant.max_patients,
                'can_add': tenant.can_add_patient(patient_count)
            },
            'users': {
                'current': user_count
            },
            'trial_status': {
                'is_trial': tenant.subscription_plan == 'trial',
                'trial_ends_at': tenant.trial_ends_at.isoformat() if tenant.trial_ends_at else None,
                'is_expired': tenant.is_trial_expired()
            }
        }

    def can_add_doctor(self, db: Session, tenant_id: UUID) -> bool:
        """Check if tenant can add more doctors"""
        tenant = self.get_tenant_by_id(db, tenant_id)
        if not tenant:
            return False

        current_count = db.query(func.count(Doctor.id)).filter(
            Doctor.tenant_id == tenant_id,
            Doctor.is_active == True
        ).scalar()

        return tenant.can_add_doctor(current_count)

    def can_add_patient(self, db: Session, tenant_id: UUID) -> bool:
        """Check if tenant can add more patients"""
        tenant = self.get_tenant_by_id(db, tenant_id)
        if not tenant:
            return False

        from app.models.patient import Patient
        current_count = db.query(func.count(Patient.id)).filter(
            Patient.tenant_id == tenant_id,
            Patient.is_active == True
        ).scalar()

        return tenant.can_add_patient(current_count)

    def upgrade_subscription(
        self,
        db: Session,
        tenant_id: UUID,
        new_plan: str
    ) -> Optional[Tenant]:
        """Upgrade tenant subscription plan"""
        tenant = self.get_tenant_by_id(db, tenant_id)
        if not tenant:
            return None

        from app.models.tenant import SUBSCRIPTION_PLANS
        if new_plan not in SUBSCRIPTION_PLANS:
            raise ValueError(f"Invalid subscription plan: {new_plan}")

        plan_config = SUBSCRIPTION_PLANS[new_plan]

        tenant.subscription_plan = new_plan
        tenant.max_doctors = plan_config['max_doctors']
        tenant.max_patients = plan_config['max_patients']
        tenant.subscription_status = 'active'

        # Remove trial expiry if upgrading from trial
        if tenant.trial_ends_at:
            tenant.trial_ends_at = None

        tenant.updated_at = datetime.utcnow()
        db.commit()
        # Don't refresh after commit - RLS blocks it

        return tenant

    def deactivate_tenant(self, db: Session, tenant_id: UUID) -> bool:
        """Deactivate tenant (soft delete)"""
        tenant = self.get_tenant_by_id(db, tenant_id)
        if not tenant:
            return False

        tenant.is_active = False
        tenant.subscription_status = 'cancelled'
        tenant.updated_at = datetime.utcnow()
        db.commit()
        return True

    def _generate_tenant_code(self, db: Session, tenant_name: str) -> str:
        """
        Generate unique tenant code from tenant name
        Format: UPPERCASE_001, UPPERCASE_002, etc.
        """
        # Clean and format base code
        base_code = tenant_name.upper().replace(' ', '_')[:20]

        # Find existing codes with same prefix
        existing = db.query(Tenant.tenant_code).filter(
            Tenant.tenant_code.like(f"{base_code}%")
        ).all()

        if not existing:
            return f"{base_code}_001"

        # Find highest number
        max_num = 0
        for (code,) in existing:
            try:
                num = int(code.split('_')[-1])
                max_num = max(max_num, num)
            except ValueError:
                continue

        return f"{base_code}_{str(max_num + 1).zfill(3)}"
