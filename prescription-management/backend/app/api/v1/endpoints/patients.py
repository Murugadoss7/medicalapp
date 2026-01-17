"""
Patient Management API Endpoints with Composite Key Support
Handles mobile_number + first_name composite primary key
Supports family registration and management
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from uuid import UUID
import logging

from app.api.deps import get_db, get_current_active_user, require_admin, require_staff
from app.models.user import User
from app.services.patient_service import PatientService
from app.schemas.patient import (
    PatientCreate, 
    PatientUpdate, 
    PatientCreateFamily,
    PatientResponse, 
    PatientListResponse,
    FamilyResponse,
    PatientSearchParams,
    ValidationErrorResponse,
    FamilyValidationRequest,
    CompositeKey
)
from app.core.exceptions import (
    PatientNotFoundError, 
    ValidationError, 
    BusinessRuleError,
    FamilyLimitExceededError,
    PrimaryFamilyMemberRequiredError
)

logger = logging.getLogger(__name__)
router = APIRouter()
patient_service = PatientService()


@router.post("/", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
async def create_patient(
    patient_data: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
) -> PatientResponse:
    """
    Create a new patient with composite key (mobile_number + first_name)
    
    - **mobile_number**: Part of composite primary key
    - **first_name**: Part of composite primary key  
    - **relationship_to_primary**: For family registration ('self' for primary member)
    - **primary_contact_mobile**: Required for family members (not primary)
    
    **Permissions**: Staff, Doctor, Admin, Super Admin
    """
    try:
        # Set tenant_id from current user for multi-tenancy
        patient_data.tenant_id = current_user.tenant_id
        patient = patient_service.create_patient(db, patient_data, current_user.id)
        return PatientResponse.model_validate(patient)
    
    except ValidationError as e:
        logger.warning(f"Patient creation validation failed: {e.message}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.message
        )
    except BusinessRuleError as e:
        logger.warning(f"Patient creation business rule failed: {e.message}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=e.message
        )
    except Exception as e:
        logger.error(f"Error creating patient: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create patient"
        )


@router.get("/", response_model=PatientListResponse)
async def list_patients(
    mobile_number: Optional[str] = Query(None, description="Filter by mobile number"),
    first_name: Optional[str] = Query(None, description="Filter by first name"),
    last_name: Optional[str] = Query(None, description="Filter by last name"),
    email: Optional[str] = Query(None, description="Filter by email"),
    gender: Optional[str] = Query(None, description="Filter by gender"),
    relationship: Optional[str] = Query(None, description="Filter by relationship"),
    is_active: Optional[bool] = Query(True, description="Filter by active status"),
    age_min: Optional[int] = Query(None, ge=0, le=150, description="Minimum age"),
    age_max: Optional[int] = Query(None, ge=0, le=150, description="Maximum age"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Page size"),
    sort_by: Optional[str] = Query("first_name", description="Sort field"),
    sort_order: Optional[str] = Query("asc", description="Sort order"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
) -> PatientListResponse:
    """
    List patients with search, filtering, and pagination
    
    **Search & Filter Options**:
    - Mobile number (partial match)
    - Name fields (partial match)
    - Gender, relationship, active status
    - Age range filtering
    
    **Permissions**: Staff, Doctor, Admin, Super Admin
    """
    try:
        search_params = PatientSearchParams(
            mobile_number=mobile_number,
            first_name=first_name,
            last_name=last_name,
            email=email,
            gender=gender,
            relationship=relationship,
            is_active=is_active,
            age_min=age_min,
            age_max=age_max,
            page=page,
            page_size=page_size,
            sort_by=sort_by,
            sort_order=sort_order
        )
        
        patients, total_count = patient_service.search_patients(db, search_params)
        
        total_pages = (total_count + page_size - 1) // page_size
        
        return PatientListResponse(
            patients=[PatientResponse.model_validate(p) for p in patients],
            total=total_count,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_prev=page > 1
        )
        
    except Exception as e:
        logger.error(f"Error listing patients: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve patients"
        )


# Statistics and Analytics (MUST BE BEFORE DYNAMIC ROUTES)

@router.get("/statistics/overview", response_model=Dict[str, Any])
async def get_patient_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
) -> Dict[str, Any]:
    """
    Get patient statistics and analytics

    **Analytics**: Patient counts, demographics, family statistics

    **Staff access required** (admin, doctor, nurse, receptionist)
    """
    try:
        logger.info(f"Getting patient stats for user {current_user.email} with tenant_id: {current_user.tenant_id}")
        stats = patient_service.get_patient_statistics(db, tenant_id=current_user.tenant_id)
        return stats

    except Exception as e:
        logger.error(f"Error retrieving patient statistics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve statistics"
        )


# Family Management Endpoints (MOVED BEFORE COMPOSITE KEY ROUTES TO FIX ROUTING CONFLICT)

@router.get("/families/{mobile_number}", response_model=FamilyResponse)
async def get_family_members(
    mobile_number: str = Path(..., description="Family mobile number"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
) -> FamilyResponse:
    """
    Get all family members for a mobile number
    
    **Family Registration**: Lists all patients with same mobile number
    
    **Permissions**: Staff, Doctor, Admin, Super Admin
    """
    try:
        family_info = patient_service.get_family_with_details(db, mobile_number)
        
        return FamilyResponse(
            family_mobile=family_info['family_mobile'],
            primary_member=PatientResponse.model_validate(family_info['primary_member']) if family_info['primary_member'] else None,
            family_members=[PatientResponse.model_validate(member) for member in family_info['family_members']],
            total_members=family_info['total_members']
        )
        
    except Exception as e:
        logger.error(f"Error retrieving family members: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve family members"
        )


@router.post("/families/{mobile_number}", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
async def add_family_member(
    mobile_number: str = Path(..., description="Family mobile number"),
    member_data: PatientCreateFamily = ...,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
) -> PatientResponse:
    """
    Add a new family member to existing family
    
    **Family Registration**: Automatically inherits mobile number from family
    
    **Requirements**:
    - Primary family member must exist
    - Family size limit not exceeded
    - Unique first_name within family
    
    **Permissions**: Staff, Doctor, Admin, Super Admin
    """
    try:
        patient = patient_service.create_family_member(db, mobile_number, member_data, current_user.id)
        return PatientResponse.model_validate(patient)
        
    except ValidationError as e:
        logger.warning(f"Family member creation validation failed: {e.message}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.message
        )
    except BusinessRuleError as e:
        logger.warning(f"Family member creation business rule failed: {e.message}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=e.message
        )
    except Exception as e:
        logger.error(f"Error adding family member: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add family member"
        )


@router.get("/families/{mobile_number}/eligibility")
async def check_family_eligibility(
    mobile_number: str = Path(..., description="Family mobile number"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
) -> Dict[str, Any]:
    """
    Check family registration eligibility for new members
    
    **Business Rules Validation**:
    - Family size limit
    - Primary member exists
    - Registration constraints
    
    **Permissions**: Staff, Doctor, Admin, Super Admin
    """
    try:
        eligibility = patient_service.check_family_registration_eligibility(db, mobile_number)
        return eligibility
        
    except Exception as e:
        logger.error(f"Error checking family eligibility: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to check family eligibility"
        )


@router.post("/validate-family", response_model=ValidationErrorResponse)
async def validate_family_registration(
    validation_request: FamilyValidationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
) -> ValidationErrorResponse:
    """
    Validate family member registration before creation
    
    **Pre-validation**: Check constraints without creating record
    
    **Permissions**: Staff, Doctor, Admin, Super Admin
    """
    try:
        validation_result = patient_service.validate_family_member_creation(
            db=db,
            mobile_number=validation_request.mobile_number,
            first_name=validation_request.first_name,
            relationship=validation_request.relationship
        )
        
        return ValidationErrorResponse(
            is_valid=validation_result['is_valid'],
            errors=validation_result['errors']
        )
        
    except Exception as e:
        logger.error(f"Error validating family registration: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to validate family registration"
        )


# Composite Key Routes (MOVED AFTER FAMILY ROUTES TO PREVENT ROUTING CONFLICT)

@router.get("/{mobile_number}/{first_name}", response_model=PatientResponse)
async def get_patient_by_composite_key(
    mobile_number: str = Path(..., description="Mobile number (part of composite key)"),
    first_name: str = Path(..., description="First name (part of composite key)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
) -> PatientResponse:
    """
    Get patient by composite key (mobile_number + first_name)
    
    **Composite Key Route**: Unique patient identification
    
    **Permissions**: Staff, Doctor, Admin, Super Admin
    """
    try:
        patient = patient_service.get_patient_by_composite_key(db, mobile_number, first_name)
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Patient not found: {mobile_number} - {first_name}"
            )
        
        return PatientResponse.model_validate(patient)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving patient: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve patient"
        )


@router.put("/{mobile_number}/{first_name}", response_model=PatientResponse)
async def update_patient(
    mobile_number: str = Path(..., description="Mobile number (part of composite key)"),
    first_name: str = Path(..., description="First name (part of composite key)"),
    patient_data: PatientUpdate = ...,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
) -> PatientResponse:
    """
    Update patient by composite key
    
    **Note**: Cannot update composite key fields (mobile_number, first_name)
    
    **Permissions**: Staff, Doctor, Admin, Super Admin
    """
    try:
        patient = patient_service.update_patient(db, mobile_number, first_name, patient_data)
        return PatientResponse.model_validate(patient)
        
    except PatientNotFoundError as e:
        logger.warning(f"Patient not found for update: {e.message}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.message
        )
    except ValidationError as e:
        logger.warning(f"Patient update validation failed: {e.message}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.message
        )
    except Exception as e:
        logger.error(f"Error updating patient: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update patient"
        )


@router.delete("/{mobile_number}/{first_name}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_patient(
    mobile_number: str = Path(..., description="Mobile number (part of composite key)"),
    first_name: str = Path(..., description="First name (part of composite key)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
) -> None:
    """
    Deactivate patient (soft delete)
    
    **Admin Only**: Patient deactivation requires admin privileges
    """
    try:
        success = patient_service.deactivate_patient(db, mobile_number, first_name)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Patient not found: {mobile_number} - {first_name}"
            )
            
    except PatientNotFoundError as e:
        logger.warning(f"Patient not found for deactivation: {e.message}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.message
        )
    except Exception as e:
        logger.error(f"Error deactivating patient: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to deactivate patient"
        )


@router.put("/{mobile_number}/{first_name}/reactivate", response_model=PatientResponse)
async def reactivate_patient(
    mobile_number: str = Path(..., description="Mobile number (part of composite key)"),
    first_name: str = Path(..., description="First name (part of composite key)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
) -> PatientResponse:
    """
    Reactivate a deactivated patient
    
    **Admin Only**: Patient reactivation requires admin privileges
    """
    try:
        patient = patient_service.reactivate_patient(db, mobile_number, first_name)
        return PatientResponse.model_validate(patient)
        
    except PatientNotFoundError as e:
        logger.warning(f"Inactive patient not found for reactivation: {e.message}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.message
        )
    except Exception as e:
        logger.error(f"Error reactivating patient: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reactivate patient"
        )



# Search and Query Endpoints

@router.get("/search/mobile/{mobile_number}", response_model=List[PatientResponse])
async def get_patients_by_mobile(
    mobile_number: str = Path(..., description="Mobile number to search"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
) -> List[PatientResponse]:
    """
    Get all patients with specific mobile number
    
    **Family Search**: Returns all family members
    
    **Permissions**: Staff, Doctor, Admin, Super Admin
    """
    try:
        patients = patient_service.get_patients_by_mobile(db, mobile_number)
        return [PatientResponse.model_validate(patient) for patient in patients]
        
    except Exception as e:
        logger.error(f"Error searching patients by mobile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to search patients"
        )


@router.get("/search/email/{email}", response_model=List[PatientResponse])
async def get_patients_by_email(
    email: str = Path(..., description="Email address to search"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
) -> List[PatientResponse]:
    """
    Get patients by email address
    
    **Email Search**: May return multiple patients with same email
    
    **Permissions**: Staff, Doctor, Admin, Super Admin
    """
    try:
        patients = patient_service.get_patients_by_email(db, email)
        return [PatientResponse.model_validate(patient) for patient in patients]
        
    except Exception as e:
        logger.error(f"Error searching patients by email: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to search patients"
        )


@router.get("/id/{patient_id}", response_model=PatientResponse)
async def get_patient_by_id(
    patient_id: UUID = Path(..., description="Patient UUID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
) -> PatientResponse:
    """
    Get patient by internal UUID
    
    **Internal Reference**: For system integration (appointments, prescriptions)
    
    **Permissions**: Staff, Doctor, Admin, Super Admin
    """
    try:
        patient = patient_service.get_patient_by_id(db, patient_id)
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Patient not found with ID: {patient_id}"
            )
        
        return PatientResponse.model_validate(patient)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving patient by ID: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve patient"
        )