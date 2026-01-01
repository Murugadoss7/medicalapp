"""
Dental Observation Template Service
Handles CRUD and matching logic for observation note templates
"""

from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from app.models.dental import DentalObservationTemplate
from app.models.doctor import Doctor
from app.schemas.dental import (
    DentalObservationTemplateCreate,
    DentalObservationTemplateUpdate,
    DentalObservationTemplateResponse
)


class DentalTemplateService:
    """Service for managing dental observation templates"""

    def get_matching_templates(
        self,
        db: Session,
        condition_type: str,
        tooth_surface: Optional[str],
        severity: Optional[str],
        doctor_id: Optional[UUID] = None,
        specialization: Optional[str] = None
    ) -> List[DentalObservationTemplateResponse]:
        """
        Get templates matching the given criteria with wildcard support.

        Matching priority (score):
        - Exact match on all 3 fields = 3
        - Match on 2 fields + 1 wildcard = 2
        - Match on 1 field + 2 wildcards = 1

        Returns templates sorted by match_score (desc) then display_order (asc)
        """
        query = db.query(DentalObservationTemplate).filter(
            DentalObservationTemplate.is_active == True
        )

        # Filter by access: global templates for same specialization OR own templates
        access_filter = []
        if specialization:
            access_filter.append(
                and_(
                    DentalObservationTemplate.is_global == True,
                    or_(
                        DentalObservationTemplate.specialization == specialization,
                        DentalObservationTemplate.specialization.is_(None)
                    )
                )
            )
        if doctor_id:
            access_filter.append(DentalObservationTemplate.created_by_doctor == doctor_id)

        if access_filter:
            query = query.filter(or_(*access_filter))

        # Build condition matching filter
        # Match exact OR wildcard (NULL) for each field
        condition_filter = or_(
            DentalObservationTemplate.condition_type == condition_type,
            DentalObservationTemplate.condition_type.is_(None)
        )

        # For surface and severity:
        # - If provided: match exact value OR NULL (wildcard)
        # - If NOT provided: don't filter (show all templates regardless of surface/severity)
        query = query.filter(condition_filter)

        if tooth_surface:
            surface_filter = or_(
                DentalObservationTemplate.tooth_surface == tooth_surface,
                DentalObservationTemplate.tooth_surface.is_(None)
            )
            query = query.filter(surface_filter)

        if severity:
            severity_filter = or_(
                DentalObservationTemplate.severity == severity,
                DentalObservationTemplate.severity.is_(None)
            )
            query = query.filter(severity_filter)

        templates = query.all()

        # Calculate match scores and convert to response
        results = []
        for template in templates:
            score = 0
            if template.condition_type == condition_type:
                score += 1
            if tooth_surface and template.tooth_surface == tooth_surface:
                score += 1
            if severity and template.severity == severity:
                score += 1

            response = DentalObservationTemplateResponse.model_validate(template)
            response.match_score = score
            results.append(response)

        # Sort by match_score (desc), then display_order (asc)
        results.sort(key=lambda x: (-x.match_score, x.display_order))

        return results

    def get_all_templates(
        self,
        db: Session,
        doctor_id: Optional[UUID] = None,
        specialization: Optional[str] = None,
        condition_type: Optional[str] = None,
        is_global: Optional[bool] = None
    ) -> List[DentalObservationTemplate]:
        """Get all templates accessible by the doctor"""
        query = db.query(DentalObservationTemplate).filter(
            DentalObservationTemplate.is_active == True
        )

        # Filter by access
        access_filter = []
        if specialization:
            access_filter.append(
                and_(
                    DentalObservationTemplate.is_global == True,
                    or_(
                        DentalObservationTemplate.specialization == specialization,
                        DentalObservationTemplate.specialization.is_(None)
                    )
                )
            )
        if doctor_id:
            access_filter.append(DentalObservationTemplate.created_by_doctor == doctor_id)

        if access_filter:
            query = query.filter(or_(*access_filter))

        # Optional filters
        if condition_type:
            query = query.filter(DentalObservationTemplate.condition_type == condition_type)
        if is_global is not None:
            query = query.filter(DentalObservationTemplate.is_global == is_global)

        return query.order_by(
            DentalObservationTemplate.display_order,
            DentalObservationTemplate.created_at.desc()
        ).all()

    def get_template_by_id(self, db: Session, template_id: UUID) -> Optional[DentalObservationTemplate]:
        """Get template by ID"""
        return db.query(DentalObservationTemplate).filter(
            DentalObservationTemplate.id == template_id,
            DentalObservationTemplate.is_active == True
        ).first()

    def create_template(
        self,
        db: Session,
        data: DentalObservationTemplateCreate,
        doctor_id: UUID,
        specialization: str
    ) -> DentalObservationTemplate:
        """Create a new observation template"""
        template = DentalObservationTemplate(
            condition_type=data.condition_type,
            tooth_surface=data.tooth_surface,
            severity=data.severity,
            template_text=data.template_text,
            short_code=data.short_code,
            display_order=data.display_order,
            is_global=data.is_global,
            specialization=specialization if data.is_global else None,
            created_by_doctor=doctor_id
        )

        db.add(template)
        db.commit()
        db.refresh(template)

        return template

    def update_template(
        self,
        db: Session,
        template_id: UUID,
        data: DentalObservationTemplateUpdate,
        doctor_id: UUID
    ) -> Optional[DentalObservationTemplate]:
        """Update an existing template (only by creator)"""
        template = self.get_template_by_id(db, template_id)

        if not template:
            return None

        # Only creator can update
        if template.created_by_doctor != doctor_id:
            raise PermissionError("Only the creator can update this template")

        # Update fields
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(template, field, value)

        db.commit()
        db.refresh(template)

        return template

    def delete_template(
        self,
        db: Session,
        template_id: UUID,
        doctor_id: UUID
    ) -> bool:
        """Soft delete a template (only by creator)"""
        template = self.get_template_by_id(db, template_id)

        if not template:
            return False

        # Only creator can delete
        if template.created_by_doctor != doctor_id:
            raise PermissionError("Only the creator can delete this template")

        template.is_active = False
        db.commit()

        return True

    def get_templates_by_ids(
        self,
        db: Session,
        template_ids: List[UUID]
    ) -> List[DentalObservationTemplate]:
        """Get templates by list of IDs"""
        if not template_ids:
            return []

        return db.query(DentalObservationTemplate).filter(
            DentalObservationTemplate.id.in_(template_ids),
            DentalObservationTemplate.is_active == True
        ).all()

    def combine_template_texts(
        self,
        db: Session,
        template_ids: List[UUID],
        custom_notes: Optional[str] = None
    ) -> str:
        """Combine template texts with custom notes"""
        templates = self.get_templates_by_ids(db, template_ids)

        texts = [t.template_text for t in templates]
        if custom_notes:
            texts.append(custom_notes)

        return " | ".join(texts) if texts else ""


# Singleton instance
dental_template_service = DentalTemplateService()
