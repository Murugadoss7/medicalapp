"""
Dental API Endpoints
Comprehensive REST API for dental observations and procedures
Supports FDI notation system, tooth charting, and procedure management
"""

import logging
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path, Body, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.api.deps.database import get_db
from app.api.deps.auth import get_current_active_user, require_staff, require_admin
from app.models.user import User
from app.models.appointment import Appointment
from app.schemas.dental import (
    DentalObservationCreate, DentalObservationUpdate, DentalObservationResponse,
    DentalObservationListResponse, DentalProcedureCreate, DentalProcedureUpdate,
    DentalProcedureResponse, DentalProcedureListResponse, DentalChartResponse,
    BulkDentalObservationCreate, BulkDentalProcedureCreate, DentalSearchParams,
    DentalStatistics,
    # Observation Template schemas
    DentalObservationTemplateCreate, DentalObservationTemplateUpdate,
    DentalObservationTemplateResponse, DentalObservationTemplateListResponse
)
from app.services.dental_service import get_dental_service
from app.services.dental_template_service import dental_template_service
from app.models.doctor import Doctor
from app.core.exceptions import ValidationError, BusinessRuleError

logger = logging.getLogger(__name__)

router = APIRouter()


# ==================== Dental Observation Endpoints ====================

@router.post("/observations", response_model=DentalObservationResponse, status_code=status.HTTP_201_CREATED)
async def create_dental_observation(
    observation_data: DentalObservationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Create a new dental observation

    **Requirements:**
    - Staff level access (doctor, nurse, admin)
    - Valid patient (composite key)
    - Valid FDI tooth number (11-48 permanent, 51-85 primary)
    - Valid tooth surface (optional)
    - Valid condition type

    **Features:**
    - FDI notation validation
    - Integration with prescriptions and appointments
    - Tooth surface and severity tracking
    - Treatment requirement tracking
    """
    try:
        service = get_dental_service(db)
        observation = service.create_observation(observation_data, current_user.id)
        return DentalObservationResponse.model_validate(observation)
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/observations/{observation_id}", response_model=DentalObservationResponse)
async def get_dental_observation(
    observation_id: UUID = Path(..., description="Observation ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Get dental observation by ID

    **Returns:**
    - Complete observation details including tooth information
    """
    service = get_dental_service(db)
    observation = service.get_observation_by_id(observation_id)

    if not observation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dental observation not found"
        )

    return DentalObservationResponse.model_validate(observation)


@router.put("/observations/{observation_id}", response_model=DentalObservationResponse)
async def update_dental_observation(
    observation_id: UUID = Path(..., description="Observation ID"),
    update_data: DentalObservationUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Update dental observation

    **Features:**
    - Update treatment status
    - Modify observation notes
    - Change severity levels
    - Update treatment dates
    """
    try:
        service = get_dental_service(db)
        observation = service.update_observation(observation_id, update_data, current_user.id)

        if not observation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dental observation not found"
            )

        return DentalObservationResponse.model_validate(observation)
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/observations/{observation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_dental_observation(
    observation_id: UUID = Path(..., description="Observation ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Delete (soft delete) dental observation

    **Note:** This is a soft delete - the record remains in database but is marked inactive
    """
    service = get_dental_service(db)
    success = service.delete_observation(observation_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dental observation not found"
        )

    return None


@router.get("/observations/patient/{mobile_number}/{first_name}", response_model=DentalObservationListResponse)
async def get_patient_observations(
    mobile_number: str = Path(..., description="Patient mobile number"),
    first_name: str = Path(..., description="Patient first name"),
    tooth_number: Optional[str] = Query(None, description="Filter by tooth number"),
    limit: int = Query(100, ge=1, le=500, description="Max results"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Get all dental observations for a patient

    **Features:**
    - Filter by specific tooth number
    - Complete observation history
    - Sorted by most recent first
    """
    service = get_dental_service(db)
    observations = service.get_patient_observations(
        mobile_number, first_name, tooth_number, limit
    )

    return DentalObservationListResponse(
        observations=[DentalObservationResponse.model_validate(obs) for obs in observations],
        total=len(observations),
        tooth_type=None
    )


@router.get("/observations/prescription/{prescription_id}", response_model=DentalObservationListResponse)
async def get_prescription_observations(
    prescription_id: UUID = Path(..., description="Prescription ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Get dental observations for a specific prescription
    """
    service = get_dental_service(db)
    observations = service.get_observations_by_prescription(prescription_id)

    return DentalObservationListResponse(
        observations=[DentalObservationResponse.model_validate(obs) for obs in observations],
        total=len(observations),
        tooth_type=None
    )


@router.get("/observations/appointment/{appointment_id}", response_model=DentalObservationListResponse)
async def get_appointment_observations(
    appointment_id: UUID = Path(..., description="Appointment ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Get dental observations for a specific appointment
    """
    service = get_dental_service(db)
    observations = service.get_observations_by_appointment(appointment_id)

    return DentalObservationListResponse(
        observations=[DentalObservationResponse.model_validate(obs) for obs in observations],
        total=len(observations),
        tooth_type=None
    )


@router.get("/observations/tooth/{mobile_number}/{first_name}/{tooth_number}", response_model=DentalObservationListResponse)
async def get_tooth_history(
    mobile_number: str = Path(..., description="Patient mobile number"),
    first_name: str = Path(..., description="Patient first name"),
    tooth_number: str = Path(..., description="FDI tooth number"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Get complete history for a specific tooth

    **Features:**
    - All observations for the specified tooth
    - Chronological history
    - Treatment progression tracking
    """
    try:
        service = get_dental_service(db)
        observations = service.get_tooth_history(mobile_number, first_name, tooth_number)

        return DentalObservationListResponse(
            observations=[DentalObservationResponse.model_validate(obs) for obs in observations],
            total=len(observations),
            tooth_type=None
        )
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/observations/bulk", response_model=List[DentalObservationResponse], status_code=status.HTTP_201_CREATED)
async def bulk_create_observations(
    bulk_data: BulkDentalObservationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Create multiple dental observations at once

    **Use Cases:**
    - Full mouth examination documentation
    - Batch entry from dental chart
    - Comprehensive initial assessments

    **Limits:**
    - Maximum 32 observations per request (full permanent dentition)
    """
    try:
        service = get_dental_service(db)
        observations = service.bulk_create_observations(bulk_data, current_user.id)
        return [DentalObservationResponse.model_validate(obs) for obs in observations]
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ==================== Dental Procedure Endpoints ====================

@router.post("/procedures", response_model=DentalProcedureResponse, status_code=status.HTTP_201_CREATED)
async def create_dental_procedure(
    procedure_data: DentalProcedureCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Create a new dental procedure

    **Requirements:**
    - Staff level access
    - Valid procedure code (CDT or custom)
    - Valid tooth numbers (comma-separated FDI notation)

    **Features:**
    - Link to observations, prescriptions, or appointments
    - Cost estimation and tracking
    - Status management (planned, in_progress, completed, cancelled)
    - Procedure duration tracking
    """
    try:
        service = get_dental_service(db)
        procedure = service.create_procedure(procedure_data, current_user.id)
        return DentalProcedureResponse.model_validate(procedure)
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/procedures/{procedure_id}", response_model=DentalProcedureResponse)
async def get_dental_procedure(
    procedure_id: UUID = Path(..., description="Procedure ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Get dental procedure by ID
    """
    service = get_dental_service(db)
    procedure = service.get_procedure_by_id(procedure_id)

    if not procedure:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dental procedure not found"
        )

    return DentalProcedureResponse.model_validate(procedure)


@router.put("/procedures/{procedure_id}", response_model=DentalProcedureResponse)
async def update_dental_procedure(
    procedure_id: UUID = Path(..., description="Procedure ID"),
    update_data: DentalProcedureUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Update dental procedure

    **Features:**
    - Update costs and duration
    - Modify procedure details
    - Add notes and complications
    - Update completion dates
    """
    try:
        service = get_dental_service(db)
        procedure = service.update_procedure(procedure_id, update_data, current_user.id)

        if not procedure:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dental procedure not found"
            )

        return DentalProcedureResponse.model_validate(procedure)
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/procedures/{procedure_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_dental_procedure(
    procedure_id: UUID = Path(..., description="Procedure ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Delete (soft delete) dental procedure
    """
    service = get_dental_service(db)
    success = service.delete_procedure(procedure_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dental procedure not found"
        )

    return None


@router.put("/procedures/{procedure_id}/status", response_model=DentalProcedureResponse)
async def update_procedure_status(
    procedure_id: UUID = Path(..., description="Procedure ID"),
    status: str = Body(..., embed=True, description="New status"),
    notes: Optional[str] = Body(None, embed=True, description="Status change notes"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Update procedure status

    **Valid Status Transitions:**
    - planned → in_progress, cancelled
    - in_progress → completed, cancelled
    - completed → (terminal state)
    - cancelled → (terminal state)

    **Features:**
    - Automatic completion date setting
    - Status change audit trail in notes
    """
    try:
        service = get_dental_service(db)
        procedure = service.update_procedure_status(
            procedure_id, status, current_user.id, notes
        )

        if not procedure:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dental procedure not found"
            )

        return DentalProcedureResponse.model_validate(procedure)
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except BusinessRuleError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/procedures/observation/{observation_id}", response_model=DentalProcedureListResponse)
async def get_observation_procedures(
    observation_id: UUID = Path(..., description="Observation ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Get procedures for a specific observation
    """
    service = get_dental_service(db)
    procedures = service.get_procedures_by_observation(observation_id)

    return DentalProcedureListResponse(
        procedures=[DentalProcedureResponse.model_validate(proc) for proc in procedures],
        total=len(procedures)
    )


@router.get("/procedures/prescription/{prescription_id}", response_model=DentalProcedureListResponse)
async def get_prescription_procedures(
    prescription_id: UUID = Path(..., description="Prescription ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Get procedures for a specific prescription
    """
    service = get_dental_service(db)
    procedures = service.get_procedures_by_prescription(prescription_id)

    return DentalProcedureListResponse(
        procedures=[DentalProcedureResponse.model_validate(proc) for proc in procedures],
        total=len(procedures)
    )


@router.get("/procedures/appointment/{appointment_id}", response_model=DentalProcedureListResponse)
async def get_appointment_procedures(
    appointment_id: UUID = Path(..., description="Appointment ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Get procedures for a specific appointment
    """
    service = get_dental_service(db)
    procedures = service.get_procedures_by_appointment(appointment_id)

    return DentalProcedureListResponse(
        procedures=[DentalProcedureResponse.model_validate(proc) for proc in procedures],
        total=len(procedures)
    )


@router.get("/procedures/doctor/{doctor_id}/today", response_model=DentalProcedureListResponse)
async def get_doctor_today_procedures(
    doctor_id: UUID = Path(..., description="Doctor ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Get dental procedures scheduled for today for a specific doctor.

    **Features:**
    - Filters by procedure_date = today
    - Only returns procedures from appointments belonging to this doctor
    - Includes planned and in_progress procedures
    - Includes patient_name from linked appointment

    **Use Cases:**
    - Doctor dashboard to show today's procedure count
    - Dental doctor overview
    - Sidebar procedures list with patient names
    """
    service = get_dental_service(db)
    procedures = service.get_doctor_today_procedures(doctor_id)

    # Build response with patient_name from appointment
    procedure_responses = []
    for proc in procedures:
        proc_dict = DentalProcedureResponse.model_validate(proc).model_dump()
        # Get patient name from appointment if available
        if proc.appointment_id:
            appointment = db.query(Appointment).filter(Appointment.id == proc.appointment_id).first()
            if appointment:
                # Appointment table has patient_first_name (not last_name or full_name)
                proc_dict['patient_name'] = appointment.patient_first_name or 'Unknown Patient'
        procedure_responses.append(DentalProcedureResponse(**proc_dict))

    return DentalProcedureListResponse(
        procedures=procedure_responses,
        total=len(procedures)
    )


@router.post("/procedures/bulk", response_model=List[DentalProcedureResponse], status_code=status.HTTP_201_CREATED)
async def bulk_create_procedures(
    bulk_data: BulkDentalProcedureCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Create multiple dental procedures at once

    **Use Cases:**
    - Treatment plan creation
    - Multi-tooth procedures
    - Batch procedure scheduling

    **Limits:**
    - Maximum 20 procedures per request
    """
    try:
        service = get_dental_service(db)
        procedures = service.bulk_create_procedures(bulk_data, current_user.id)
        return [DentalProcedureResponse.model_validate(proc) for proc in procedures]
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ==================== Dental Chart Endpoints ====================

@router.get("/chart/{mobile_number}/{first_name}", response_model=DentalChartResponse)
async def get_dental_chart(
    mobile_number: str = Path(..., description="Patient mobile number"),
    first_name: str = Path(..., description="Patient first name"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get complete dental chart for a patient

    **Features:**
    - All observations organized by tooth
    - Associated procedures for each tooth
    - Active issues identification
    - Dentition type determination (permanent/primary/mixed)
    - Treatment history tracking
    - Last treatment dates

    **Returns:**
    - Comprehensive dental chart with tooth-level details
    - Summary statistics
    - Active treatment count
    """
    logger.info(f"=== DENTAL CHART REQUEST ===")
    logger.info(f"Mobile: {mobile_number}, First Name: {first_name}")
    logger.info(f"Current User: {current_user.email}, Role: {current_user.role}")

    try:
        service = get_dental_service(db)
        chart_data = service.get_dental_chart(mobile_number, first_name)
        logger.info(f"Chart data retrieved successfully")
        return DentalChartResponse(**chart_data)
    except ValidationError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in get_dental_chart: {str(e)}")
        raise


# ==================== Search and Statistics Endpoints ====================

@router.get("/search", response_model=DentalObservationListResponse)
async def search_observations(
    patient_mobile_number: Optional[str] = Query(None),
    patient_first_name: Optional[str] = Query(None),
    tooth_number: Optional[str] = Query(None),
    condition_type: Optional[str] = Query(None),
    treatment_required: Optional[bool] = Query(None),
    treatment_done: Optional[bool] = Query(None),
    from_date: Optional[date] = Query(None),
    to_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Search dental observations with multiple filters

    **Available Filters:**
    - Patient identification (mobile, name)
    - Tooth number (FDI notation)
    - Condition type
    - Treatment status
    - Date range
    """
    search_params = DentalSearchParams(
        patient_mobile_number=patient_mobile_number,
        patient_first_name=patient_first_name,
        tooth_number=tooth_number,
        condition_type=condition_type,
        treatment_required=treatment_required,
        treatment_done=treatment_done,
        from_date=from_date,
        to_date=to_date
    )

    service = get_dental_service(db)
    observations, total = service.search_observations(search_params)

    return DentalObservationListResponse(
        observations=[DentalObservationResponse.model_validate(obs) for obs in observations],
        total=total,
        tooth_type=None
    )


@router.get("/statistics", response_model=DentalStatistics)
async def get_dental_statistics(
    mobile_number: Optional[str] = Query(None, description="Filter by patient mobile"),
    first_name: Optional[str] = Query(None, description="Filter by patient first name"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Get dental statistics

    **Features:**
    - Total observations and procedures count
    - Breakdown by condition type
    - Procedures by status
    - Most affected teeth
    - Treatment completion rate

    **Optional Filtering:**
    - Global statistics (no patient specified)
    - Patient-specific statistics (with patient composite key)
    """
    service = get_dental_service(db)
    stats = service.get_dental_statistics(mobile_number, first_name)
    return DentalStatistics(**stats)


# ==================== Observation Note Template Endpoints ====================

@router.get("/templates/match", response_model=DentalObservationTemplateListResponse)
async def get_matching_templates(
    condition: str = Query(..., description="Condition type to match"),
    surface: Optional[str] = Query(None, description="Tooth surface to match"),
    severity: Optional[str] = Query(None, description="Severity to match"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Get observation note templates matching the given criteria.

    **Matching Logic (Wildcard Support):**
    - Exact match on all fields = score 3
    - Match on 2 fields + wildcard = score 2
    - Match on 1 field + wildcards = score 1

    **Returns:**
    - Templates sorted by match score (highest first)
    - Includes global templates for same specialization + own templates
    """
    # Get doctor's specialization
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    doctor_id = doctor.id if doctor else None
    specialization = doctor.specialization if doctor else None

    templates = dental_template_service.get_matching_templates(
        db=db,
        condition_type=condition,
        tooth_surface=surface,
        severity=severity,
        doctor_id=doctor_id,
        specialization=specialization
    )

    return DentalObservationTemplateListResponse(
        templates=templates,
        total=len(templates)
    )


@router.get("/templates", response_model=DentalObservationTemplateListResponse)
async def list_templates(
    condition_type: Optional[str] = Query(None, description="Filter by condition type"),
    is_global: Optional[bool] = Query(None, description="Filter by global status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    List all observation note templates accessible by the current doctor.

    **Returns:**
    - Global templates for same specialization
    - Doctor's own templates
    """
    # Get doctor info
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    doctor_id = doctor.id if doctor else None
    specialization = doctor.specialization if doctor else None

    templates = dental_template_service.get_all_templates(
        db=db,
        doctor_id=doctor_id,
        specialization=specialization,
        condition_type=condition_type,
        is_global=is_global
    )

    return DentalObservationTemplateListResponse(
        templates=[DentalObservationTemplateResponse.model_validate(t) for t in templates],
        total=len(templates)
    )


@router.get("/templates/{template_id}", response_model=DentalObservationTemplateResponse)
async def get_template(
    template_id: UUID = Path(..., description="Template ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Get a specific observation note template by ID"""
    template = dental_template_service.get_template_by_id(db, template_id)

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )

    return DentalObservationTemplateResponse.model_validate(template)


@router.post("/templates", response_model=DentalObservationTemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_template(
    template_data: DentalObservationTemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Create a new observation note template.

    **Features:**
    - NULL values for condition/surface/severity act as wildcards
    - Set is_global=true to share with same specialization doctors
    - short_code for quick reference
    """
    # Get doctor info
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()

    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can create templates"
        )

    try:
        template = dental_template_service.create_template(
            db=db,
            data=template_data,
            doctor_id=doctor.id,
            specialization=doctor.specialization
        )
        return DentalObservationTemplateResponse.model_validate(template)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.put("/templates/{template_id}", response_model=DentalObservationTemplateResponse)
async def update_template(
    template_id: UUID = Path(..., description="Template ID"),
    update_data: DentalObservationTemplateUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Update an observation note template.

    **Note:** Only the creator can update their templates.
    """
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()

    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can update templates"
        )

    try:
        template = dental_template_service.update_template(
            db=db,
            template_id=template_id,
            data=update_data,
            doctor_id=doctor.id
        )

        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found"
            )

        return DentalObservationTemplateResponse.model_validate(template)
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.delete("/templates/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(
    template_id: UUID = Path(..., description="Template ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Delete an observation note template (soft delete).

    **Note:** Only the creator can delete their templates.
    """
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()

    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can delete templates"
        )

    try:
        success = dental_template_service.delete_template(
            db=db,
            template_id=template_id,
            doctor_id=doctor.id
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found"
            )
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


# ==================== File Attachment Endpoints ====================

@router.post("/observations/{observation_id}/attachments", response_model=dict, status_code=status.HTTP_201_CREATED)
async def upload_observation_attachment(
    observation_id: UUID,
    file: UploadFile = File(...),
    file_type: str = Form(...),
    caption: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Upload file attachment for dental observation

    **File Types:** xray, photo_before, photo_after, test_result, document, other
    **Allowed Formats:** JPG, PNG, PDF, DICOM
    **Max Size:** 10MB
    """
    from app.services.attachment_service import get_attachment_service

    service = get_attachment_service(db)

    try:
        attachment = await service.upload_observation_attachment(
            observation_id=observation_id,
            file=file,
            file_type=file_type,
            caption=caption,
            user_id=current_user.id
        )
        return attachment.model_dump()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading observation attachment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload attachment"
        )


@router.post("/procedures/{procedure_id}/attachments", response_model=dict, status_code=status.HTTP_201_CREATED)
async def upload_procedure_attachment(
    procedure_id: UUID,
    file: UploadFile = File(...),
    file_type: str = Form(...),
    caption: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    Upload file attachment for dental procedure

    **File Types:** photo_before, photo_after, test_result, document, other
    **Allowed Formats:** JPG, PNG, PDF, DICOM
    **Max Size:** 10MB
    """
    from app.services.attachment_service import get_attachment_service

    service = get_attachment_service(db)

    try:
        attachment = await service.upload_procedure_attachment(
            procedure_id=procedure_id,
            file=file,
            file_type=file_type,
            caption=caption,
            user_id=current_user.id
        )
        return attachment.model_dump()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading procedure attachment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload attachment"
        )


@router.get("/observations/{observation_id}/attachments", response_model=List[dict])
async def get_observation_attachments(
    observation_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Get all attachments for a dental observation"""
    from app.services.attachment_service import get_attachment_service

    service = get_attachment_service(db)

    try:
        attachments = service.get_observation_attachments(observation_id)
        return [a.model_dump() for a in attachments]
    except Exception as e:
        logger.error(f"Error getting observation attachments: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve attachments"
        )


@router.get("/procedures/{procedure_id}/attachments", response_model=List[dict])
async def get_procedure_attachments(
    procedure_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Get all attachments for a dental procedure"""
    from app.services.attachment_service import get_attachment_service

    service = get_attachment_service(db)

    try:
        attachments = service.get_procedure_attachments(procedure_id)
        return [a.model_dump() for a in attachments]
    except Exception as e:
        logger.error(f"Error getting procedure attachments: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve attachments"
        )


@router.delete("/attachments/{attachment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_attachment(
    attachment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Delete attachment (soft delete in database + remove from cloud storage)"""
    from app.services.attachment_service import get_attachment_service

    service = get_attachment_service(db)

    try:
        service.delete_attachment(attachment_id, current_user.id)
        return None
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting attachment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete attachment"
        )
