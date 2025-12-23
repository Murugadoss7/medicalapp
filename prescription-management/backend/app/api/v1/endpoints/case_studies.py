"""
Case Studies API Endpoints
AI-powered case study generation for dental treatments
"""

import logging
import json
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.api.deps.database import get_db
from app.api.deps.auth import get_current_active_user, require_doctor
from app.models.user import User
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.dental import DentalObservation, DentalProcedure, DentalAttachment
from app.models.case_study import CaseStudy
from app.schemas.case_study import (
    CaseStudyCreate,
    CaseStudyGenerateRequest,
    CaseStudyUpdate,
    CaseStudyResponse,
    CaseStudySummary,
    CaseStudyList
)
from app.services.ai_case_study_service import get_ai_case_study_service

logger = logging.getLogger(__name__)

router = APIRouter()


def generate_case_study_number() -> str:
    """Generate unique case study number"""
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    return f"CS-{timestamp}"


def safe_content_to_string(value) -> Optional[str]:
    """Convert AI response content to string for database storage"""
    if value is None:
        return None
    if isinstance(value, str):
        return value
    # Convert list or dict to JSON string
    return json.dumps(value, ensure_ascii=False)


# ==================== AI Generation Endpoint ====================

@router.post("/generate", status_code=status.HTTP_201_CREATED)
async def generate_case_study(
    request: CaseStudyGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor)
):
    """
    Generate AI-powered case study using GPT-5-nano

    **Flow:**
    1. Validates patient exists
    2. Fetches selected observations and procedures
    3. Calls OpenAI GPT-5-nano to generate case study
    4. Saves case study to database
    5. Returns generated content with metadata

    **Required:**
    - patient_mobile_number, patient_first_name
    - At least one observation_id or procedure_id

    **Returns:**
    - Generated case study content
    - Token usage and estimated cost
    """

    # Validate patient exists
    patient = db.query(Patient).filter(
        Patient.mobile_number == request.patient_mobile_number,
        Patient.first_name == request.patient_first_name,
        Patient.is_active == True
    ).first()

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )

    # Get doctor record for current user
    doctor = db.query(Doctor).filter(
        Doctor.user_id == current_user.id,
        Doctor.is_active == True
    ).first()

    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Doctor profile not found for current user"
        )

    # Fetch observations
    observations_data = []
    if request.observation_ids:
        observations = db.query(DentalObservation).filter(
            DentalObservation.id.in_(request.observation_ids),
            DentalObservation.is_active == True
        ).all()

        for obs in observations:
            # Use treatment_date if available, otherwise created_at
            obs_date = obs.treatment_date or (obs.created_at.date() if obs.created_at else None)
            observations_data.append({
                "id": str(obs.id),
                "tooth_numbers": [obs.tooth_number] if obs.tooth_number else [],
                "tooth_surface": obs.tooth_surface,
                "condition": obs.condition_type,
                "severity": obs.severity,
                "observation_notes": obs.observation_notes,
                "custom_notes": obs.custom_notes,  # Doctor's additional notes
                "treatment_required": obs.treatment_required,
                "treatment_done": obs.treatment_done,
                "observation_date": str(obs_date) if obs_date else str(obs.created_at.date()) if obs.created_at else "Date not recorded"
            })

    # Fetch procedures
    procedures_data = []
    if request.procedure_ids:
        procedures = db.query(DentalProcedure).filter(
            DentalProcedure.id.in_(request.procedure_ids),
            DentalProcedure.is_active == True
        ).all()

        for proc in procedures:
            # tooth_numbers is comma-separated text, convert to list
            teeth_list = proc.tooth_numbers.split(',') if proc.tooth_numbers else []
            # Use procedure_date or completed_date or created_at
            proc_date = proc.procedure_date or proc.completed_date or (proc.created_at.date() if proc.created_at else None)
            procedures_data.append({
                "id": str(proc.id),
                "tooth_numbers": teeth_list,
                "procedure_name": proc.procedure_name,
                "procedure_code": proc.procedure_code,
                "description": proc.description,  # Procedure description
                "status": proc.status,
                "notes": proc.procedure_notes,
                "complications": proc.complications,  # Any complications noted
                "duration_minutes": proc.duration_minutes,
                "procedure_date": str(proc_date) if proc_date else "Date not recorded",
                "completed_date": str(proc.completed_date) if proc.completed_date else None
            })

    # Require at least some data
    if not observations_data and not procedures_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one observation or procedure is required for case study generation"
        )

    # Prepare patient info
    patient_info = {
        "first_name": patient.first_name,
        "last_name": patient.last_name or "",
        "age": calculate_age(patient.date_of_birth) if patient.date_of_birth else "N/A",
        "gender": patient.gender or "N/A"
    }

    # Generate title if not provided
    title = request.title or generate_default_title(observations_data, procedures_data)

    # Determine chief complaint (use first observation notes if not provided)
    chief_complaint = "Dental treatment"
    if observations_data:
        first_obs = observations_data[0]
        chief_complaint = first_obs.get("observation_notes") or first_obs.get("condition") or chief_complaint

    # Call AI service
    ai_service = get_ai_case_study_service(db)

    try:
        result = await ai_service.generate_case_study(
            patient_info=patient_info,
            observations=observations_data,
            procedures=procedures_data,
            chief_complaint=chief_complaint,
            title=title
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"AI generation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate case study: {str(e)}"
        )

    # Extract generated content
    content = result["content"]
    metadata = result["metadata"]

    # Create case study record
    case_study = CaseStudy(
        case_study_number=generate_case_study_number(),
        patient_mobile_number=request.patient_mobile_number,
        patient_first_name=request.patient_first_name,
        patient_uuid=patient.id,
        doctor_id=doctor.id,
        title=title,
        chief_complaint=chief_complaint,
        observation_ids=json.dumps([str(oid) for oid in request.observation_ids]) if request.observation_ids else None,
        procedure_ids=json.dumps([str(pid) for pid in request.procedure_ids]) if request.procedure_ids else None,
        # AI-generated content (safely convert to strings for database)
        pre_treatment_summary=safe_content_to_string(content.get("pre_treatment_summary")),
        initial_diagnosis=safe_content_to_string(content.get("initial_diagnosis")),
        treatment_goals=safe_content_to_string(content.get("treatment_goals")),
        treatment_summary=safe_content_to_string(content.get("treatment_summary")),
        procedures_performed=safe_content_to_string(content.get("procedures_performed")),
        outcome_summary=safe_content_to_string(content.get("outcome_summary")),
        success_metrics=safe_content_to_string(content.get("success_metrics")),
        full_narrative=safe_content_to_string(content.get("full_narrative")),
        # Metadata
        generation_model=metadata["model"],
        generation_prompt=f"Tokens: {metadata['total_tokens']}, Cost: ${metadata['estimated_cost_usd']}",
        # Audit
        created_by=current_user.id,
        status="draft"
    )

    # Set date range from observations/procedures
    if request.treatment_start_date:
        case_study.treatment_start_date = request.treatment_start_date
    if request.treatment_end_date:
        case_study.treatment_end_date = request.treatment_end_date

    db.add(case_study)
    db.commit()
    db.refresh(case_study)

    # Fetch attachments from selected observations (don't update - they already have observation_id)
    # The case study stores observation_ids, so we can always query attachments later
    attachments_data = []
    if request.observation_ids:
        attachments = db.query(DentalAttachment).filter(
            DentalAttachment.observation_id.in_(request.observation_ids),
            DentalAttachment.is_active == True
        ).all()

        for att in attachments:
            attachments_data.append({
                "id": str(att.id),
                "file_type": att.file_type,
                "file_name": att.file_name,
                "file_path": att.file_path,
                "caption": att.caption,
                "taken_date": str(att.taken_date) if att.taken_date else None,
                "observation_id": str(att.observation_id) if att.observation_id else None
            })

    # Also fetch attachments from procedures
    if request.procedure_ids:
        proc_attachments = db.query(DentalAttachment).filter(
            DentalAttachment.procedure_id.in_(request.procedure_ids),
            DentalAttachment.is_active == True
        ).all()

        for att in proc_attachments:
            attachments_data.append({
                "id": str(att.id),
                "file_type": att.file_type,
                "file_name": att.file_name,
                "file_path": att.file_path,
                "caption": att.caption,
                "taken_date": str(att.taken_date) if att.taken_date else None,
                "procedure_id": str(att.procedure_id) if att.procedure_id else None
            })

    logger.info(f"Case study generated: {case_study.case_study_number} for patient {patient.first_name} with {len(attachments_data)} attachments")

    # Return response
    return {
        "id": str(case_study.id),
        "case_study_number": case_study.case_study_number,
        "title": case_study.title,
        "status": case_study.status,
        "content": {
            "pre_treatment_summary": case_study.pre_treatment_summary,
            "initial_diagnosis": case_study.initial_diagnosis,
            "treatment_goals": case_study.treatment_goals,
            "treatment_summary": case_study.treatment_summary,
            "procedures_performed": case_study.procedures_performed,
            "outcome_summary": case_study.outcome_summary,
            "success_metrics": case_study.success_metrics,
            "full_narrative": case_study.full_narrative
        },
        "metadata": {
            "model": metadata["model"],
            "input_tokens": metadata["input_tokens"],
            "output_tokens": metadata["output_tokens"],
            "total_tokens": metadata["total_tokens"],
            "estimated_cost_usd": metadata["estimated_cost_usd"],
            "generated_at": metadata["generated_at"]
        },
        "attachments": attachments_data,
        "created_at": case_study.created_at.isoformat()
    }


# ==================== CRUD Endpoints ====================

@router.get("/{case_study_id}", response_model=CaseStudyResponse)
async def get_case_study(
    case_study_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor)
):
    """Get case study by ID"""
    case_study = db.query(CaseStudy).filter(
        CaseStudy.id == case_study_id,
        CaseStudy.is_active == True
    ).first()

    if not case_study:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case study not found"
        )

    return case_study


@router.put("/{case_study_id}", response_model=CaseStudyResponse)
async def update_case_study(
    case_study_id: UUID,
    update_data: CaseStudyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor)
):
    """
    Update case study content

    Doctors can edit AI-generated content before finalizing
    """
    case_study = db.query(CaseStudy).filter(
        CaseStudy.id == case_study_id,
        CaseStudy.is_active == True
    ).first()

    if not case_study:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case study not found"
        )

    # Update fields
    update_dict = update_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(case_study, field, value)

    case_study.updated_at = datetime.now()

    db.commit()
    db.refresh(case_study)

    logger.info(f"Case study updated: {case_study.case_study_number}")

    return case_study


@router.delete("/{case_study_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_case_study(
    case_study_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor)
):
    """Soft delete case study"""
    case_study = db.query(CaseStudy).filter(
        CaseStudy.id == case_study_id,
        CaseStudy.is_active == True
    ).first()

    if not case_study:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case study not found"
        )

    case_study.is_active = False
    case_study.updated_at = datetime.now()

    db.commit()

    logger.info(f"Case study deleted: {case_study.case_study_number}")

    return None


@router.get("/patient/{mobile}/{first_name}", response_model=CaseStudyList)
async def get_patient_case_studies(
    mobile: str,
    first_name: str,
    status_filter: Optional[str] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor)
):
    """Get all case studies for a patient"""

    query = db.query(CaseStudy).filter(
        CaseStudy.patient_mobile_number == mobile,
        CaseStudy.patient_first_name == first_name,
        CaseStudy.is_active == True
    )

    if status_filter:
        query = query.filter(CaseStudy.status == status_filter)

    # Count total
    total = query.count()

    # Paginate
    case_studies = query.order_by(CaseStudy.created_at.desc()).offset(
        (page - 1) * per_page
    ).limit(per_page).all()

    return CaseStudyList(
        case_studies=[CaseStudySummary.model_validate(cs) for cs in case_studies],
        total=total,
        page=page,
        per_page=per_page,
        pages=(total + per_page - 1) // per_page
    )


# ==================== Section Regeneration ====================

@router.post("/{case_study_id}/regenerate/{section}")
async def regenerate_section(
    case_study_id: UUID,
    section: str,
    additional_instructions: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor)
):
    """
    Regenerate a specific section of the case study

    **Valid sections:**
    - pre_treatment_summary
    - initial_diagnosis
    - treatment_goals
    - treatment_summary
    - procedures_performed
    - outcome_summary
    - success_metrics
    - full_narrative
    """
    case_study = db.query(CaseStudy).filter(
        CaseStudy.id == case_study_id,
        CaseStudy.is_active == True
    ).first()

    if not case_study:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case study not found"
        )

    # Build current content dict
    current_content = {
        "pre_treatment_summary": case_study.pre_treatment_summary,
        "initial_diagnosis": case_study.initial_diagnosis,
        "treatment_goals": case_study.treatment_goals,
        "treatment_summary": case_study.treatment_summary,
        "procedures_performed": case_study.procedures_performed,
        "outcome_summary": case_study.outcome_summary,
        "success_metrics": case_study.success_metrics,
        "full_narrative": case_study.full_narrative
    }

    # Call AI service to regenerate
    ai_service = get_ai_case_study_service(db)

    new_content = await ai_service.regenerate_section(
        section_name=section,
        current_content=current_content,
        additional_instructions=additional_instructions
    )

    # Update the section
    setattr(case_study, section, new_content)
    case_study.updated_at = datetime.now()

    db.commit()
    db.refresh(case_study)

    return {
        "section": section,
        "new_content": new_content,
        "updated_at": case_study.updated_at.isoformat()
    }


# ==================== Helper Functions ====================

def calculate_age(date_of_birth) -> str:
    """Calculate age from date of birth"""
    if not date_of_birth:
        return "N/A"
    today = datetime.now().date()
    age = today.year - date_of_birth.year
    if today.month < date_of_birth.month or (today.month == date_of_birth.month and today.day < date_of_birth.day):
        age -= 1
    return str(age)


def generate_default_title(observations: list, procedures: list) -> str:
    """Generate default title from observations/procedures"""
    teeth = set()
    proc_names = []

    for obs in observations:
        teeth.update(obs.get("tooth_numbers", []))

    for proc in procedures:
        teeth.update(proc.get("tooth_numbers", []))
        if proc.get("procedure_name"):
            proc_names.append(proc["procedure_name"])

    teeth_str = ", ".join(sorted(teeth)[:3])
    if len(teeth) > 3:
        teeth_str += f" +{len(teeth) - 3} more"

    if proc_names:
        return f"Treatment Case Study - Teeth {teeth_str} - {proc_names[0]}"

    return f"Case Study - Teeth {teeth_str}"
