"""
Tenant API endpoints
Handles clinic registration and tenant management for multi-tenancy
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Any
from uuid import UUID

from app.api.deps import get_db, get_current_active_user, require_admin
from app.models.user import User
from app.schemas.tenant import (
    ClinicRegistrationRequest,
    ClinicRegistrationResponse,
    AdminCreateDoctorRequest,
    TenantResponse,
    TenantLimitsResponse
)
from app.schemas.user import UserResponse
from app.services.tenant_service import TenantService
from app.services.auth_service import AuthService
from app.services.user_service import UserService
from app.services.doctor_service import DoctorService
from app.schemas.tenant import TenantCreate
from app.schemas.doctor import DoctorCreate


router = APIRouter()


@router.post("/register-clinic", response_model=ClinicRegistrationResponse)
async def register_clinic(
    registration: ClinicRegistrationRequest,
    db: Session = Depends(get_db)
) -> Any:
    """
    Register a new clinic with multi-tenant support

    Creates:
    - Tenant (clinic organization)
    - Admin or Admin+Doctor user
    - Doctor profile (if role is admin_doctor)

    **Flow:**
    1. Create tenant with subscription plan (default: trial)
    2. Create user with admin or doctor role
    3. Link user to tenant
    4. If admin_doctor, create doctor profile

    Returns tenant and user information with JWT tokens
    """
    tenant_service = TenantService()
    auth_service = AuthService()

    try:
        # 1. Check if email already exists
        existing_user = db.query(User).filter(User.email == registration.owner_email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        # 2. Check if clinic phone already exists
        from app.models.tenant import Tenant
        existing_tenant = db.query(Tenant).filter(
            Tenant.phone == registration.clinic_phone
        ).first()
        if existing_tenant:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Clinic phone number already registered"
            )

        # 3. Create tenant (clinic)
        tenant_data = TenantCreate(
            tenant_name=registration.clinic_name,
            subscription_plan='trial',  # Start with trial
            max_clinics=1,
            max_doctors=5,  # Trial plan limit
            max_patients=1000,
            max_storage_mb=1000  # 1 GB storage
        )
        tenant = tenant_service.create_tenant(db, tenant_data, auto_commit=False)

        # 3.2 Store clinic address and phone in tenant settings for prescriptions
        tenant.settings = {
            'clinic_address': registration.clinic_address,
            'clinic_phone': registration.clinic_phone,
            'clinic_name': registration.clinic_name,
        }

        # 3.5 Set tenant context for RLS - required before creating user/doctor
        # Since this is a public endpoint (no JWT), we manually set the context
        db.execute(text(f"SET app.current_tenant_id = '{tenant.id}'"))

        # 4. Determine user role
        if registration.role == 'admin_doctor':
            user_role = 'doctor'  # Doctor with admin privileges
        elif registration.role == 'admin':
            user_role = 'admin'  # Pure admin (non-medical)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role must be 'admin' or 'admin_doctor'"
            )

        # 5. Create user
        hashed_password = auth_service.hash_password(registration.password)
        user = User(
            email=registration.owner_email,
            hashed_password=hashed_password,
            first_name=registration.owner_first_name,
            last_name=registration.owner_last_name,
            role=user_role,
            tenant_id=tenant.id,
            is_active=True
        )
        db.add(user)
        db.flush()  # Get user.id without committing

        # 6. Create doctor profile if admin_doctor
        doctor = None
        if registration.role == 'admin_doctor':
            if not registration.license_number:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="License number required for admin_doctor role"
                )

            doctor_service = DoctorService()
            doctor_data = DoctorCreate(
                user_id=user.id,
                license_number=registration.license_number,
                specialization=registration.specialization or "General Practice",
                tenant_id=tenant.id,
                # Set first office as clinic address
                offices=[{
                    "id": str(tenant.id),
                    "name": registration.clinic_name,
                    "address": registration.clinic_address,
                    "phone": registration.clinic_phone,
                    "is_primary": True
                }]
            )
            doctor = doctor_service.create_doctor(db, doctor_data, auto_commit=False)

        # 7. Commit all changes
        db.commit()
        # Don't refresh after commit - RLS might block SELECT
        # We already have all data we need from the objects

        # 8. Generate JWT tokens
        access_token = auth_service.create_access_token(user)
        refresh_token = auth_service.create_refresh_token(user)

        # 9. Build response
        user_response = UserResponse(
            id=user.id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            role=user.role,
            tenant_id=user.tenant_id,
            is_active=user.is_active,
            created_at=user.created_at,
            updated_at=user.updated_at,
            full_name=user.get_full_name(),
            permissions=auth_service.get_role_permissions(user.role),
            doctor_id=doctor.id if doctor else None
        )

        tenant_response = TenantResponse(
            id=tenant.id,
            tenant_name=tenant.tenant_name,
            tenant_code=tenant.tenant_code,
            subscription_plan=tenant.subscription_plan,
            subscription_status=tenant.subscription_status,
            trial_ends_at=tenant.trial_ends_at,
            max_clinics=tenant.max_clinics,
            max_doctors=tenant.max_doctors,
            max_patients=tenant.max_patients,
            max_storage_mb=tenant.max_storage_mb,
            is_active=tenant.is_active,
            created_at=tenant.created_at,
            updated_at=tenant.updated_at
        )

        return ClinicRegistrationResponse(
            message="Clinic registered successfully",
            tenant=tenant_response,
            user=user_response,
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer"
        )

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to register clinic: {str(e)}"
        )


@router.post("/doctors", response_model=UserResponse)
async def admin_create_doctor(
    request: Request,
    doctor_data: AdminCreateDoctorRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
) -> Any:
    """
    Admin creates a new doctor within their tenant

    **Admin Only** - Creates doctor with automatic tenant_id inheritance

    - **tenant_id**: Automatically inherited from admin's token
    - **email**: Doctor's email (must be unique)
    - **first_name**: Doctor's first name
    - **license_number**: Medical license number
    - **specialization**: Medical specialization
    - **office_ids**: List of office IDs from tenant's offices

    Returns created doctor user information
    """
    auth_service = AuthService()
    tenant_service = TenantService()
    doctor_service = DoctorService()

    try:
        # 1. Get tenant_id from current user
        if not current_user.tenant_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User not associated with any tenant"
            )

        # 2. Check tenant limits
        if not tenant_service.can_add_doctor(db, current_user.tenant_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Tenant doctor limit reached. Please upgrade subscription."
            )

        # 3. Check if email already exists
        existing_user = db.query(User).filter(User.email == doctor_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        # 4. Generate temporary password (admin should share this)
        import secrets
        temp_password = secrets.token_urlsafe(12)
        hashed_password = auth_service.hash_password(temp_password)

        # 5. Create user
        user = User(
            email=doctor_data.email,
            hashed_password=hashed_password,
            first_name=doctor_data.first_name,
            last_name=doctor_data.last_name,
            role='doctor',
            tenant_id=current_user.tenant_id,  # Inherit from admin
            is_active=True
        )
        db.add(user)
        db.flush()

        # 6. Get tenant's registered clinic to add as default office
        from app.models.tenant import Tenant
        tenant = db.query(Tenant).filter(Tenant.id == current_user.tenant_id).first()

        # Build offices list with tenant's clinic as primary
        offices_list = []
        if tenant and tenant.settings:
            tenant_clinic_name = tenant.settings.get('clinic_name', tenant.tenant_name)
            tenant_clinic_address = tenant.settings.get('clinic_address', '')
            if tenant_clinic_address:
                import uuid
                offices_list.append({
                    'id': f'tenant-{tenant.id}',  # Special ID to identify tenant's default clinic
                    'name': tenant_clinic_name,
                    'address': tenant_clinic_address,
                    'is_primary': True,
                    'is_tenant_default': True  # Mark as tenant's default (non-deletable)
                })

        # Add any additional offices from request (none should be primary if tenant clinic exists)
        if doctor_data.offices:
            for office in doctor_data.offices:
                office_dict = office.dict() if hasattr(office, 'dict') else office
                office_dict['is_primary'] = False  # Tenant clinic is primary
                office_dict['is_tenant_default'] = False
                offices_list.append(office_dict)

        # 7. Create doctor profile
        doctor_create = DoctorCreate(
            user_id=user.id,
            license_number=doctor_data.license_number,
            specialization=doctor_data.specialization,
            tenant_id=current_user.tenant_id,
            offices=offices_list
        )
        doctor = doctor_service.create_doctor(db, doctor_create, auto_commit=False)

        # 7. Commit - don't refresh as RLS might block SELECT after commit
        db.commit()
        # Note: We already have all the data we need from the objects
        # Refresh would require re-setting tenant context after commit

        # 8. Return response with temporary password
        return UserResponse(
            id=user.id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            role=user.role,
            tenant_id=user.tenant_id,
            is_active=user.is_active,
            created_at=user.created_at,
            updated_at=user.updated_at,
            full_name=user.get_full_name(),
            permissions=auth_service.get_role_permissions(user.role),
            doctor_id=doctor.id,
            # Include temporary password in response (admin should share this securely)
            temporary_password=temp_password
        )

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create doctor: {str(e)}"
        )


@router.get("/limits", response_model=TenantLimitsResponse)
async def get_tenant_limits(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Get current tenant usage and limits

    Returns:
    - Current doctor/patient counts
    - Maximum allowed by subscription
    - Trial status
    """
    if not current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not associated with any tenant"
        )

    tenant_service = TenantService()
    limits = tenant_service.check_tenant_limits(db, current_user.tenant_id)

    if not limits:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )

    return limits


@router.get("/me", response_model=TenantResponse)
async def get_my_tenant(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Get current user's tenant information
    """
    if not current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not associated with any tenant"
        )

    tenant_service = TenantService()
    tenant = tenant_service.get_tenant_by_id(db, current_user.tenant_id)

    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )

    return TenantResponse(
        id=tenant.id,
        tenant_name=tenant.tenant_name,
        tenant_code=tenant.tenant_code,
        subscription_plan=tenant.subscription_plan,
        subscription_status=tenant.subscription_status,
        trial_ends_at=tenant.trial_ends_at,
        max_clinics=tenant.max_clinics,
        max_doctors=tenant.max_doctors,
        max_patients=tenant.max_patients,
        max_storage_mb=tenant.max_storage_mb,
        is_active=tenant.is_active,
        created_at=tenant.created_at,
        updated_at=tenant.updated_at
    )


@router.get("/offices")
async def get_tenant_offices(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Get all offices/clinics in the tenant

    Lists all unique offices across all doctors in the tenant,
    including which doctors practice at each office.
    Accessible by any authenticated user in the tenant.
    """
    from app.models.doctor import Doctor

    if not current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not associated with any tenant"
        )

    # Get all doctors in the tenant
    doctors = db.query(Doctor).filter(Doctor.tenant_id == current_user.tenant_id).all()

    # Aggregate offices with doctor info
    offices_map = {}  # office_id -> office_info

    for doctor in doctors:
        if not doctor.offices:
            continue

        # Get doctor's user info
        doctor_user = db.query(User).filter(User.id == doctor.user_id).first()
        doctor_name = f"Dr. {doctor_user.first_name} {doctor_user.last_name}" if doctor_user else "Unknown"

        for office in doctor.offices:
            office_id = office.get('id')
            if office_id not in offices_map:
                offices_map[office_id] = {
                    'id': office_id,
                    'name': office.get('name', ''),
                    'address': office.get('address', ''),
                    'is_tenant_default': office.get('is_tenant_default', False),
                    'doctors': []
                }

            offices_map[office_id]['doctors'].append({
                'id': str(doctor.id),
                'name': doctor_name,
                'specialization': doctor.specialization,
                'is_primary': office.get('is_primary', False)
            })

    # Convert to list and sort (tenant default first)
    offices_list = list(offices_map.values())
    offices_list.sort(key=lambda x: (not x['is_tenant_default'], x['name']))

    return {
        'offices': offices_list,
        'total': len(offices_list)
    }
