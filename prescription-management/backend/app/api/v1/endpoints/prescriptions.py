"""
Prescription API Endpoints
Comprehensive REST API for prescription management with PDF generation support
Integrates with patients, doctors, medicines, and short keys modules
"""

from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path, Body
from sqlalchemy.orm import Session

from app.api.deps.database import get_db
from app.api.deps.auth import get_current_active_user, require_staff, require_admin
from app.models.user import User
from app.schemas.prescription import (
    PrescriptionCreate, PrescriptionUpdate, PrescriptionResponse,
    PrescriptionListResponse, PrescriptionSearchParams,
    PrescriptionItemCreate, PrescriptionItemUpdate, PrescriptionItemResponse,
    ShortKeyPrescriptionCreate, PrescriptionValidationRequest,
    ValidationErrorResponse, BulkPrescriptionRequest, BulkOperationResponse,
    PrescriptionStatsResponse, PrescriptionPrintRequest
)
from app.services.prescription_service import get_prescription_service
from app.core.exceptions import (
    PrescriptionNotFoundError, PatientNotFoundError, DoctorNotFoundError,
    MedicineNotFoundError, ValidationError, BusinessRuleError
)

router = APIRouter()


@router.post("/", response_model=PrescriptionResponse, status_code=status.HTTP_201_CREATED)
async def create_prescription(
    prescription_data: PrescriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Create a new prescription
    
    **Requirements:**
    - Staff level access (doctor, nurse, admin)
    - Valid patient (composite key validation)
    - Valid doctor
    - At least one prescription item or short key code
    
    **Features:**
    - Automatic prescription number generation
    - Short key support for quick prescription creation
    - Medicine validation and duplicate checking
    - Integration with appointment system
    """
    try:
        service = get_prescription_service(db)
        prescription = service.create_prescription(prescription_data, current_user.id)
        return PrescriptionResponse.model_validate(prescription)
    except (PatientNotFoundError, DoctorNotFoundError, MedicineNotFoundError) as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except (ValidationError, BusinessRuleError) as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/short-key", response_model=PrescriptionResponse, status_code=status.HTTP_201_CREATED)
async def create_prescription_from_short_key(
    short_key_data: ShortKeyPrescriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Create prescription from short key
    
    **Requirements:**
    - Staff level access
    - Valid short key code
    - Valid patient and doctor
    
    **Features:**
    - Quick prescription creation using predefined medicine combinations
    - Automatic medicine selection from short key
    - Usage tracking for short key analytics
    """
    try:
        service = get_prescription_service(db)
        prescription = service.create_from_short_key(short_key_data, current_user.id)
        return PrescriptionResponse.model_validate(prescription)
    except (PatientNotFoundError, DoctorNotFoundError, ValidationError) as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except BusinessRuleError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/", response_model=PrescriptionListResponse)
async def list_prescriptions(
    # Search filters
    patient_mobile_number: Optional[str] = Query(None, description="Filter by patient mobile"),
    patient_first_name: Optional[str] = Query(None, description="Filter by patient first name"),
    patient_uuid: Optional[UUID] = Query(None, description="Filter by patient UUID"),
    doctor_id: Optional[UUID] = Query(None, description="Filter by doctor"),
    status: Optional[str] = Query(None, description="Filter by status"),
    is_printed: Optional[bool] = Query(None, description="Filter by print status"),
    visit_date_from: Optional[date] = Query(None, description="Visit date from"),
    visit_date_to: Optional[date] = Query(None, description="Visit date to"),
    diagnosis: Optional[str] = Query(None, description="Search in diagnosis"),
    prescription_number: Optional[str] = Query(None, description="Search by prescription number"),
    created_from: Optional[date] = Query(None, description="Created date from"),
    created_to: Optional[date] = Query(None, description="Created date to"),
    
    # Pagination
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Page size"),
    
    # Sorting
    sort_by: Optional[str] = Query("visit_date", description="Sort field"),
    sort_order: Optional[str] = Query("desc", regex="^(asc|desc)$", description="Sort order"),
    
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    List prescriptions with filtering, searching, and pagination
    
    **Features:**
    - Comprehensive filtering by patient, doctor, dates, status
    - Text search in diagnosis and prescription number
    - Pagination support
    - Multiple sorting options
    - Role-based access (staff can see all, doctors see own)
    """
    search_params = PrescriptionSearchParams(
        patient_mobile_number=patient_mobile_number,
        patient_first_name=patient_first_name,
        patient_uuid=patient_uuid,
        doctor_id=doctor_id,
        status=status,
        is_printed=is_printed,
        visit_date_from=visit_date_from,
        visit_date_to=visit_date_to,
        diagnosis=diagnosis,
        prescription_number=prescription_number,
        created_from=created_from,
        created_to=created_to,
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    # If user is doctor (not admin/nurse), filter to their prescriptions only
    if current_user.role == 'doctor' and not doctor_id:
        # Get doctor ID from user
        from app.models.doctor import Doctor
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if doctor:
            search_params.doctor_id = doctor.id
    
    service = get_prescription_service(db)
    prescriptions, total = service.search_prescriptions(search_params)
    
    total_pages = (total + page_size - 1) // page_size
    
    return PrescriptionListResponse(
        prescriptions=[PrescriptionResponse.model_validate(p) for p in prescriptions],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_prev=page > 1
    )


@router.get("/{prescription_id}", response_model=PrescriptionResponse)
async def get_prescription(
    prescription_id: UUID = Path(..., description="Prescription ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Get prescription by ID
    
    **Returns:**
    - Complete prescription details
    - Patient and doctor information
    - All prescription items with medicine details
    - Computed fields (total amount, expiry status, etc.)
    """
    service = get_prescription_service(db)
    prescription = service.get_prescription_by_id(prescription_id)
    
    if not prescription:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription not found")
    
    # Check access permissions (doctors can only see their own prescriptions)
    if current_user.role == 'doctor':
        from app.models.doctor import Doctor
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if not doctor or str(prescription.doctor_id) != str(doctor.id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    return PrescriptionResponse.model_validate(prescription)


@router.get("/number/{prescription_number}", response_model=PrescriptionResponse)
async def get_prescription_by_number(
    prescription_number: str = Path(..., description="Prescription number"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Get prescription by prescription number
    
    **Use case:**
    - Quick prescription lookup using printed prescription number
    - Pharmacy dispensing workflow
    - Patient prescription history lookup
    """
    service = get_prescription_service(db)
    prescription = service.get_prescription_by_number(prescription_number)
    
    if not prescription:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription not found")
    
    # Check access permissions
    if current_user.role == 'doctor':
        from app.models.doctor import Doctor
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if not doctor or str(prescription.doctor_id) != str(doctor.id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    return PrescriptionResponse.model_validate(prescription)


@router.put("/{prescription_id}", response_model=PrescriptionResponse)
async def update_prescription(
    prescription_id: UUID = Path(..., description="Prescription ID"),
    prescription_data: PrescriptionUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Update prescription information
    
    **Allowed updates:**
    - Clinical information (diagnosis, symptoms, notes)
    - Doctor instructions
    - Status changes
    - Template information
    
    **Restrictions:**
    - Can only modify draft or active prescriptions
    - Doctors can only update their own prescriptions
    """
    try:
        service = get_prescription_service(db)
        
        # Check access permissions
        prescription = service.get_prescription_by_id(prescription_id)
        if not prescription:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription not found")
        
        if current_user.role == 'doctor':
            from app.models.doctor import Doctor
            doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
            if not doctor or str(prescription.doctor_id) != str(doctor.id):
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
        updated_prescription = service.update_prescription(prescription_id, prescription_data, current_user.id)
        return PrescriptionResponse.model_validate(updated_prescription)
    except PrescriptionNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription not found")
    except BusinessRuleError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/{prescription_id}/status", response_model=PrescriptionResponse)
async def update_prescription_status(
    prescription_id: UUID = Path(..., description="Prescription ID"),
    status: str = Body(..., description="New status"),
    notes: Optional[str] = Body(None, description="Status change notes"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Update prescription status
    
    **Valid status transitions:**
    - draft → active, cancelled
    - active → dispensed, completed, cancelled, expired
    - dispensed → completed
    - expired → active (reactivation)
    
    **Use cases:**
    - Pharmacy dispensing workflow
    - Treatment completion tracking
    - Prescription cancellation
    """
    try:
        service = get_prescription_service(db)
        
        # Check access permissions
        prescription = service.get_prescription_by_id(prescription_id)
        if not prescription:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription not found")
        
        if current_user.role == 'doctor':
            from app.models.doctor import Doctor
            doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
            if not doctor or str(prescription.doctor_id) != str(doctor.id):
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
        updated_prescription = service.update_prescription_status(prescription_id, status, current_user.id, notes)
        return PrescriptionResponse.model_validate(updated_prescription)
    except PrescriptionNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription not found")
    except BusinessRuleError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{prescription_id}/items", response_model=PrescriptionItemResponse, status_code=status.HTTP_201_CREATED)
async def add_prescription_item(
    prescription_id: UUID = Path(..., description="Prescription ID"),
    item_data: PrescriptionItemCreate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Add item to existing prescription
    
    **Requirements:**
    - Prescription must be in draft or active status
    - Valid medicine ID
    - No duplicate medicines in same prescription
    """
    try:
        service = get_prescription_service(db)
        
        # Check access permissions
        prescription = service.get_prescription_by_id(prescription_id)
        if not prescription:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription not found")
        
        if current_user.role == 'doctor':
            from app.models.doctor import Doctor
            doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
            if not doctor or str(prescription.doctor_id) != str(doctor.id):
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
        item = service.add_prescription_item(prescription_id, item_data, current_user.id)
        return PrescriptionItemResponse.model_validate(item)
    except PrescriptionNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription not found")
    except MedicineNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medicine not found")
    except BusinessRuleError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/items/{item_id}", response_model=PrescriptionItemResponse)
async def update_prescription_item(
    item_id: UUID = Path(..., description="Prescription item ID"),
    item_data: PrescriptionItemUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Update prescription item
    
    **Updatable fields:**
    - Dosage, frequency, duration
    - Instructions and quantity
    - Pricing information
    - Generic substitution preference
    """
    try:
        service = get_prescription_service(db)
        item = service.update_prescription_item(item_id, item_data, current_user.id)
        return PrescriptionItemResponse.model_validate(item)
    except ValidationError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription item not found")
    except BusinessRuleError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_prescription_item(
    item_id: UUID = Path(..., description="Prescription item ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Remove prescription item (soft delete)
    
    **Requirements:**
    - Prescription must be modifiable (draft/active status)
    - At least one item must remain in prescription
    """
    try:
        service = get_prescription_service(db)
        success = service.remove_prescription_item(item_id)
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription item not found")
    except BusinessRuleError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/patient/{mobile_number}/{first_name}", response_model=List[PrescriptionResponse])
async def get_patient_prescriptions(
    mobile_number: str = Path(..., description="Patient mobile number"),
    first_name: str = Path(..., description="Patient first name"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of prescriptions"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Get prescriptions for a patient using composite key
    
    **Returns:**
    - Patient's prescription history
    - Most recent prescriptions first
    - Complete prescription details with items
    
    **Use cases:**
    - Patient history review
    - Treatment pattern analysis
    - Medication history for new prescriptions
    """
    service = get_prescription_service(db)
    prescriptions = service.get_patient_prescriptions(mobile_number, first_name, limit)
    
    return [PrescriptionResponse.model_validate(p) for p in prescriptions]


@router.get("/doctor/{doctor_id}", response_model=List[PrescriptionResponse])
async def get_doctor_prescriptions(
    doctor_id: UUID = Path(..., description="Doctor ID"),
    start_date: Optional[date] = Query(None, description="Start date filter"),
    end_date: Optional[date] = Query(None, description="End date filter"),
    limit: int = Query(100, ge=1, le=200, description="Maximum number of prescriptions"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Get prescriptions created by a doctor
    
    **Filters:**
    - Date range filtering
    - Limit results
    
    **Access control:**
    - Doctors can only see their own prescriptions
    - Admin/nurses can see any doctor's prescriptions
    """
    # Check access permissions
    if current_user.role == 'doctor':
        from app.models.doctor import Doctor
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if not doctor or str(doctor_id) != str(doctor.id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    service = get_prescription_service(db)
    prescriptions = service.get_doctor_prescriptions(doctor_id, start_date, end_date, limit)
    
    return [PrescriptionResponse.model_validate(p) for p in prescriptions]


@router.post("/{prescription_id}/print", response_model=PrescriptionResponse)
async def print_prescription(
    prescription_id: UUID = Path(..., description="Prescription ID"),
    print_request: PrescriptionPrintRequest = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Mark prescription as printed and generate PDF
    
    **Features:**
    - Multiple template support
    - PDF generation
    - Print tracking
    - Custom formatting options
    
    **Note:** This endpoint marks as printed but PDF generation
    would be handled by a separate service in production
    """
    try:
        service = get_prescription_service(db)
        prescription = service.mark_as_printed(prescription_id, print_request.template)
        
        if not prescription:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription not found")
        
        return PrescriptionResponse.model_validate(prescription)
    except PrescriptionNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription not found")


@router.post("/validate", response_model=ValidationErrorResponse)
async def validate_prescription(
    validation_request: PrescriptionValidationRequest = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Validate prescription data before creation
    
    **Validations:**
    - Patient existence
    - Doctor validity
    - Medicine availability
    - Drug interaction checking
    - Duplicate medicine detection
    
    **Returns:**
    - Validation status
    - Error messages
    - Warning messages
    """
    service = get_prescription_service(db)
    result = service.validate_prescription(validation_request)
    
    return ValidationErrorResponse(**result)


@router.post("/bulk", response_model=BulkOperationResponse)
async def bulk_prescription_operations(
    bulk_request: BulkPrescriptionRequest = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)  # Admin only for bulk operations
):
    """
    Perform bulk operations on multiple prescriptions
    
    **Operations:**
    - cancel: Cancel multiple prescriptions
    - complete: Mark prescriptions as completed
    - print: Mark prescriptions as printed
    - activate: Reactivate expired prescriptions
    
    **Requirements:**
    - Admin access only
    - Maximum 100 prescriptions per operation
    """
    service = get_prescription_service(db)
    result = service.bulk_operation(bulk_request, current_user.id)
    
    return BulkOperationResponse(**result)


@router.get("/statistics/overview", response_model=PrescriptionStatsResponse)
async def get_prescription_statistics(
    doctor_id: Optional[UUID] = Query(None, description="Filter by doctor (optional)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Get prescription statistics and analytics
    
    **Metrics:**
    - Total prescriptions by status
    - Recent activity (today, week, month)
    - Print statistics
    - Top diagnoses
    - Doctor performance metrics
    
    **Access control:**
    - Doctors see only their own stats
    - Admin/nurses see system-wide or filtered stats
    """
    # If user is doctor, force filter to their prescriptions
    if current_user.role == 'doctor':
        from app.models.doctor import Doctor
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if doctor:
            doctor_id = doctor.id
    
    service = get_prescription_service(db)
    stats = service.get_prescription_statistics(doctor_id)
    
    return PrescriptionStatsResponse(**stats)


@router.delete("/{prescription_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_prescription(
    prescription_id: UUID = Path(..., description="Prescription ID"),
    reason: Optional[str] = Body(None, description="Cancellation reason"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Cancel prescription (soft delete)
    
    **Requirements:**
    - Prescription must be cancellable (not completed/dispensed)
    - Appropriate permissions
    
    **Effect:**
    - Changes status to 'cancelled'
    - Adds cancellation reason to notes
    - Maintains audit trail
    """
    try:
        service = get_prescription_service(db)
        
        # Check access permissions
        prescription = service.get_prescription_by_id(prescription_id)
        if not prescription:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription not found")
        
        if current_user.role == 'doctor':
            from app.models.doctor import Doctor
            doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
            if not doctor or str(prescription.doctor_id) != str(doctor.id):
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
        service.update_prescription_status(prescription_id, "cancelled", current_user.id, reason)
    except PrescriptionNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription not found")
    except BusinessRuleError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))