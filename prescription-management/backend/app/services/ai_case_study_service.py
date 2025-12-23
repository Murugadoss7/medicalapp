"""
AI Case Study Service
Business logic for generating AI-powered dental case studies using GPT-5-nano
"""

import logging
import json
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.core.config import settings

logger = logging.getLogger(__name__)

# System prompt for dental case study generation
DENTAL_SYSTEM_PROMPT = """You are a professional dental case study assistant helping doctors create comprehensive clinical documentation.

DENTAL TERMINOLOGY REFERENCE:
- RCT: Root Canal Treatment - endodontic procedure to remove infected pulp
- Pulpectomy: Complete removal of pulp tissue from tooth
- Pulpotomy: Partial removal of pulp (usually in primary teeth)
- Obturation: Filling and sealing root canals after cleaning
- Composite: Tooth-colored resin filling material
- Amalgam: Silver-colored metal alloy filling
- Crown: Prosthetic cap covering entire visible tooth
- Bridge: Fixed prosthetic replacing missing teeth
- Extraction: Surgical removal of tooth
- Scaling: Professional cleaning to remove tartar/calculus
- Root Planing: Deep cleaning below gumline
- Periodontal: Related to gums and supporting structures
- Caries: Tooth decay/cavity
- Pulpitis: Inflammation of tooth pulp
- Periapical: Around the root tip
- Abscess: Localized infection with pus
- FDI Notation: International tooth numbering (11-48 for permanent teeth)

OUTPUT FORMAT:
Generate the case study in valid JSON format with these exact keys:
{
    "pre_treatment_summary": "Patient's initial condition and symptoms",
    "initial_diagnosis": "Clinical findings and diagnosis",
    "treatment_goals": "Treatment objectives",
    "treatment_summary": "Overview of treatment performed",
    "procedures_performed": "Detailed list of procedures with dates",
    "outcome_summary": "Results achieved",
    "success_metrics": "Measurable outcomes and improvements",
    "full_narrative": "Complete professional case study narrative (3-4 paragraphs)"
}

GUIDELINES:
- Use professional medical/dental terminology
- Be concise but thorough
- Focus on clinical relevance
- IMPORTANT: Use EXACT dates provided in the input data - do NOT generate random dates
- Include the doctor's notes and custom observations in the narrative
- Reference before/after observations when provided
- Maintain objective, clinical tone
- Structure the narrative logically: presentation → diagnosis → treatment → outcome
- In procedures_performed, list each procedure with its ACTUAL date from input"""


class AICaseStudyService:
    """Service for generating AI-powered case studies"""

    def __init__(self, db: Session):
        self.db = db
        self._client = None

    @property
    def client(self):
        """Lazy load OpenAI client"""
        if self._client is None:
            if not settings.OPENAI_API_KEY:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="AI service not configured. Please set OPENAI_API_KEY in environment."
                )
            try:
                from openai import OpenAI
                self._client = OpenAI(api_key=settings.OPENAI_API_KEY)
            except ImportError:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="OpenAI package not installed. Run: pip install openai"
                )
        return self._client

    def estimate_tokens(self, text: str) -> int:
        """Rough estimate of token count (avg 4 chars per token)"""
        return len(text) // 4

    def estimate_cost(self, input_tokens: int, output_tokens: int) -> float:
        """
        Estimate cost based on GPT-5-nano pricing
        Input: $0.05/1M tokens, Output: $0.40/1M tokens
        """
        input_cost = (input_tokens / 1_000_000) * 0.05
        output_cost = (output_tokens / 1_000_000) * 0.40
        return round(input_cost + output_cost, 6)

    def build_user_prompt(
        self,
        patient_info: Dict[str, Any],
        observations: List[Dict[str, Any]],
        procedures: List[Dict[str, Any]],
        chief_complaint: str,
        title: str
    ) -> str:
        """Build the user prompt with patient data"""

        prompt_parts = []

        # Patient info
        prompt_parts.append(f"CASE STUDY TITLE: {title}")
        prompt_parts.append(f"\nPATIENT INFORMATION:")
        prompt_parts.append(f"- Name: {patient_info.get('first_name', 'N/A')} {patient_info.get('last_name', '')}")
        prompt_parts.append(f"- Age: {patient_info.get('age', 'N/A')}")
        prompt_parts.append(f"- Gender: {patient_info.get('gender', 'N/A')}")

        # Chief complaint
        prompt_parts.append(f"\nCHIEF COMPLAINT:")
        prompt_parts.append(chief_complaint or "Not specified")

        # Observations (chronological)
        if observations:
            prompt_parts.append(f"\nCLINICAL OBSERVATIONS ({len(observations)} records):")
            for i, obs in enumerate(sorted(observations, key=lambda x: x.get('observation_date', '')), 1):
                tooth_nums = obs.get('tooth_numbers', [])
                teeth_str = ', '.join(tooth_nums) if tooth_nums else 'General'
                prompt_parts.append(f"\n{i}. Date: {obs.get('observation_date', 'N/A')}")
                prompt_parts.append(f"   Teeth: {teeth_str}")
                if obs.get('tooth_surface'):
                    prompt_parts.append(f"   Surface: {obs.get('tooth_surface')}")
                prompt_parts.append(f"   Condition: {obs.get('condition', 'N/A')}")
                prompt_parts.append(f"   Severity: {obs.get('severity', 'N/A')}")
                if obs.get('observation_notes'):
                    prompt_parts.append(f"   Clinical Notes: {obs.get('observation_notes')}")
                if obs.get('custom_notes'):
                    prompt_parts.append(f"   Doctor's Notes: {obs.get('custom_notes')}")
                treatment_status = "Treatment Done" if obs.get('treatment_done') else ("Treatment Required" if obs.get('treatment_required') else "No Treatment Needed")
                prompt_parts.append(f"   Status: {treatment_status}")

        # Procedures (chronological)
        if procedures:
            prompt_parts.append(f"\nPROCEDURES PERFORMED ({len(procedures)} records):")
            for i, proc in enumerate(sorted(procedures, key=lambda x: x.get('procedure_date', '')), 1):
                tooth_nums = proc.get('tooth_numbers', [])
                teeth_str = ', '.join(tooth_nums) if tooth_nums else 'General'
                prompt_parts.append(f"\n{i}. Date: {proc.get('procedure_date', 'N/A')}")
                prompt_parts.append(f"   Teeth: {teeth_str}")
                prompt_parts.append(f"   Procedure: {proc.get('procedure_name', 'N/A')}")
                prompt_parts.append(f"   Code: {proc.get('procedure_code', 'N/A')}")
                prompt_parts.append(f"   Status: {proc.get('status', 'N/A')}")
                if proc.get('description'):
                    prompt_parts.append(f"   Description: {proc.get('description')}")
                if proc.get('notes'):
                    prompt_parts.append(f"   Procedure Notes: {proc.get('notes')}")
                if proc.get('complications'):
                    prompt_parts.append(f"   Complications: {proc.get('complications')}")
                if proc.get('duration_minutes'):
                    prompt_parts.append(f"   Duration: {proc.get('duration_minutes')} minutes")
                if proc.get('completed_date'):
                    prompt_parts.append(f"   Completed: {proc.get('completed_date')}")

        prompt_parts.append("\n\nPlease generate a comprehensive case study based on the above information.")
        prompt_parts.append("Return the response as valid JSON matching the specified format.")

        return '\n'.join(prompt_parts)

    async def generate_case_study(
        self,
        patient_info: Dict[str, Any],
        observations: List[Dict[str, Any]],
        procedures: List[Dict[str, Any]],
        chief_complaint: str,
        title: str
    ) -> Dict[str, Any]:
        """
        Generate AI case study using GPT-5-nano

        Returns:
            Dict with generated content and metadata
        """

        # Build prompts
        user_prompt = self.build_user_prompt(
            patient_info=patient_info,
            observations=observations,
            procedures=procedures,
            chief_complaint=chief_complaint,
            title=title
        )

        # Estimate input tokens
        input_text = DENTAL_SYSTEM_PROMPT + user_prompt
        estimated_input_tokens = self.estimate_tokens(input_text)

        logger.info(f"Generating case study for patient {patient_info.get('first_name')}, "
                   f"estimated input tokens: {estimated_input_tokens}")

        try:
            # Call OpenAI API
            response = self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": DENTAL_SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=settings.OPENAI_TEMPERATURE,
                max_completion_tokens=settings.OPENAI_MAX_TOKENS,
                response_format={"type": "json_object"}
            )

            # Extract response
            content = response.choices[0].message.content

            # Parse JSON response
            try:
                generated_content = json.loads(content)
            except json.JSONDecodeError:
                logger.error(f"Failed to parse AI response as JSON: {content[:500]}")
                # Return raw content if JSON parsing fails
                generated_content = {
                    "full_narrative": content,
                    "pre_treatment_summary": "",
                    "initial_diagnosis": "",
                    "treatment_goals": "",
                    "treatment_summary": "",
                    "procedures_performed": "",
                    "outcome_summary": "",
                    "success_metrics": ""
                }

            # Get actual usage
            usage = response.usage
            actual_input_tokens = usage.prompt_tokens
            actual_output_tokens = usage.completion_tokens
            total_tokens = usage.total_tokens

            # Calculate cost
            cost = self.estimate_cost(actual_input_tokens, actual_output_tokens)

            # Check cost limit
            if cost > settings.AI_MAX_COST_PER_CASE_STUDY:
                logger.warning(f"Case study generation cost ${cost} exceeds limit ${settings.AI_MAX_COST_PER_CASE_STUDY}")

            logger.info(f"Case study generated successfully. "
                       f"Tokens: {total_tokens}, Cost: ${cost}")

            return {
                "content": generated_content,
                "metadata": {
                    "model": settings.OPENAI_MODEL,
                    "input_tokens": actual_input_tokens,
                    "output_tokens": actual_output_tokens,
                    "total_tokens": total_tokens,
                    "estimated_cost_usd": cost,
                    "generated_at": datetime.utcnow().isoformat()
                }
            }

        except Exception as e:
            logger.error(f"Failed to generate case study: {str(e)}")

            # Handle specific OpenAI errors
            error_message = str(e)
            if "api_key" in error_message.lower():
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid OpenAI API key. Please check your configuration."
                )
            elif "rate_limit" in error_message.lower():
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="AI service rate limit exceeded. Please try again later."
                )
            elif "model" in error_message.lower():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Model '{settings.OPENAI_MODEL}' not available. Check your OpenAI plan."
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to generate case study: {error_message}"
                )

    async def regenerate_section(
        self,
        section_name: str,
        current_content: Dict[str, Any],
        additional_instructions: Optional[str] = None
    ) -> str:
        """
        Regenerate a specific section of the case study

        Args:
            section_name: One of the case study sections (e.g., 'outcome_summary')
            current_content: The current case study content
            additional_instructions: Optional specific instructions for regeneration
        """

        valid_sections = [
            'pre_treatment_summary', 'initial_diagnosis', 'treatment_goals',
            'treatment_summary', 'procedures_performed', 'outcome_summary',
            'success_metrics', 'full_narrative'
        ]

        if section_name not in valid_sections:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid section name. Valid sections: {', '.join(valid_sections)}"
            )

        # Build focused prompt
        prompt = f"""Based on this existing case study content, please regenerate ONLY the '{section_name}' section.

EXISTING CASE STUDY:
{json.dumps(current_content, indent=2)}

{f'ADDITIONAL INSTRUCTIONS: {additional_instructions}' if additional_instructions else ''}

Please provide only the regenerated content for the '{section_name}' section as a plain text string (not JSON).
Make it professional, clinical, and comprehensive."""

        try:
            response = self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": "You are a dental case study assistant. Regenerate the specified section professionally."},
                    {"role": "user", "content": prompt}
                ],
                temperature=settings.OPENAI_TEMPERATURE,
                max_completion_tokens=1000
            )

            return response.choices[0].message.content.strip()

        except Exception as e:
            logger.error(f"Failed to regenerate section: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to regenerate section: {str(e)}"
            )


def get_ai_case_study_service(db: Session) -> AICaseStudyService:
    """Dependency injection for AI case study service"""
    return AICaseStudyService(db)
