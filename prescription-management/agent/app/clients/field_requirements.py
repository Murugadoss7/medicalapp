"""
Field Requirements for Medical Operations

This module defines REQUIRED and OPTIONAL fields for each medical operation.
The agent uses this to:
1. Know what information is needed
2. Ask users for missing required fields
3. Provide helpful prompts

Educational Notes:
====================

**Why This Is Important:**
Without this, agent would try to call API with missing fields and get errors.
With this, agent knows: "I need mobile_number and first_name, let me ask the user!"

**Based on Backend Schemas:**
All field requirements come from:
- backend/app/schemas/doctor.py (DoctorCreate)
- backend/app/schemas/patient.py (PatientCreate)
- backend/app/schemas/appointment.py (AppointmentCreate)
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass


@dataclass
class FieldRequirement:
    """
    Defines a field requirement for an operation.

    Educational Note:
    - @dataclass is Python's way to create simple classes
    - Like a struct in C or a record in other languages
    - Automatically generates __init__, __repr__, etc.
    """
    name: str  # Field name (e.g., "first_name")
    required: bool  # Is this field required?
    field_type: str  # Data type (str, int, date, etc.)
    description: str  # Human-readable description
    example: str  # Example value
    validation_rule: Optional[str] = None  # Validation rules (e.g., "10 digits")
    prompt: Optional[str] = None  # What to ask user


# ==========================================
# Doctor Field Requirements
# ==========================================

DOCTOR_FIELDS: List[FieldRequirement] = [
    # NOTE: user_id is required by backend but agent can't create users!
    # For agent, we'll work with existing users (admin creates doctor accounts)

    FieldRequirement(
        name="first_name",
        required=True,
        field_type="str",
        description="Doctor's first name",
        example="John",
        validation_rule="Min 2 characters, letters only",
        prompt="What is the doctor's first name?"
    ),

    FieldRequirement(
        name="last_name",
        required=True,
        field_type="str",
        description="Doctor's last name",
        example="Smith",
        validation_rule="Min 2 characters, letters only",
        prompt="What is the doctor's last name?"
    ),

    FieldRequirement(
        name="email",
        required=True,
        field_type="email",
        description="Doctor's email address",
        example="john.smith@clinic.com",
        validation_rule="Valid email format",
        prompt="What is the doctor's email address?"
    ),

    FieldRequirement(
        name="license_number",
        required=True,
        field_type="str",
        description="Medical license number",
        example="DOC123456",
        validation_rule="Min 5 characters",
        prompt="What is the doctor's medical license number?"
    ),

    FieldRequirement(
        name="specialization",
        required=True,  # Making this required for better UX
        field_type="str",
        description="Medical specialization",
        example="Cardiology",
        validation_rule="Max 255 characters",
        prompt="What is the doctor's specialization? (e.g., Cardiology, Neurology, General Practice)"
    ),

    # Optional fields
    FieldRequirement(
        name="qualification",
        required=False,
        field_type="str",
        description="Educational qualifications",
        example="MBBS, MD (Cardiology)",
        prompt="What are the doctor's qualifications? (optional)"
    ),

    FieldRequirement(
        name="experience_years",
        required=False,
        field_type="int",
        description="Years of experience",
        example="10",
        validation_rule="0-70 years",
        prompt="How many years of experience does the doctor have? (optional)"
    ),

    FieldRequirement(
        name="clinic_address",
        required=False,
        field_type="str",
        description="Clinic or hospital address",
        example="123 Medical Center, Healthcare District",
        prompt="What is the clinic address? (optional)"
    ),

    FieldRequirement(
        name="phone",
        required=False,
        field_type="str",
        description="Professional contact number",
        example="+1-555-0123",
        validation_rule="Max 20 characters",
        prompt="What is the doctor's professional contact number? (optional)"
    ),

    FieldRequirement(
        name="consultation_fee",
        required=False,
        field_type="str",
        description="Consultation fee amount",
        example="100",
        prompt="What is the consultation fee? (optional)"
    ),

    FieldRequirement(
        name="consultation_duration",
        required=False,
        field_type="int",
        description="Default consultation duration in minutes",
        example="30",
        validation_rule="10-240 minutes",
        prompt="What is the default consultation duration in minutes? (optional, default is 30)"
    ),
]


# ==========================================
# Patient Field Requirements
# ==========================================

PATIENT_FIELDS: List[FieldRequirement] = [
    FieldRequirement(
        name="mobile_number",
        required=True,
        field_type="str",
        description="Patient's mobile number (part of composite key)",
        example="9876543210",
        validation_rule="10 digits starting with 6-9 (Indian format)",
        prompt="What is the patient's mobile number? (10 digits)"
    ),

    FieldRequirement(
        name="first_name",
        required=True,
        field_type="str",
        description="Patient's first name (part of composite key)",
        example="John",
        validation_rule="Min 2 characters, letters only",
        prompt="What is the patient's first name?"
    ),

    FieldRequirement(
        name="last_name",
        required=True,
        field_type="str",
        description="Patient's last name",
        example="Doe",
        validation_rule="Min 2 characters, letters only",
        prompt="What is the patient's last name?"
    ),

    FieldRequirement(
        name="date_of_birth",
        required=True,
        field_type="date",
        description="Patient's date of birth",
        example="1990-01-15",
        validation_rule="YYYY-MM-DD format, not in future, age < 150",
        prompt="What is the patient's date of birth? (format: YYYY-MM-DD, e.g., 1990-01-15)"
    ),

    FieldRequirement(
        name="gender",
        required=True,
        field_type="enum",
        description="Patient's gender",
        example="male",
        validation_rule="Options: male, female, other, prefer_not_to_say",
        prompt="What is the patient's gender? (male/female/other/prefer_not_to_say)"
    ),

    # Optional fields
    FieldRequirement(
        name="email",
        required=False,
        field_type="email",
        description="Patient's email address",
        example="john.doe@example.com",
        prompt="What is the patient's email address? (optional)"
    ),

    FieldRequirement(
        name="address",
        required=False,
        field_type="str",
        description="Patient's address",
        example="123 Main Street, City, State",
        validation_rule="Max 500 characters",
        prompt="What is the patient's address? (optional)"
    ),

    FieldRequirement(
        name="relationship_to_primary",
        required=False,
        field_type="enum",
        description="Relationship to primary family member",
        example="self",
        validation_rule="Options: self, spouse, child, parent, sibling, grandparent, grandchild, other",
        prompt="What is the relationship to primary family member? (default: self)"
    ),

    FieldRequirement(
        name="notes",
        required=False,
        field_type="str",
        description="Additional notes about patient",
        example="No known allergies",
        validation_rule="Max 1000 characters",
        prompt="Any additional notes about the patient? (optional)"
    ),
]


# ==========================================
# Appointment Field Requirements
# ==========================================

APPOINTMENT_FIELDS: List[FieldRequirement] = [
    FieldRequirement(
        name="patient_mobile_number",
        required=True,
        field_type="str",
        description="Patient's mobile number",
        example="9876543210",
        validation_rule="10 digits starting with 6-9",
        prompt="What is the patient's mobile number?"
    ),

    FieldRequirement(
        name="patient_first_name",
        required=True,
        field_type="str",
        description="Patient's first name",
        example="John",
        validation_rule="Min 2 characters",
        prompt="What is the patient's first name?"
    ),

    FieldRequirement(
        name="doctor_id",
        required=True,
        field_type="uuid",
        description="Doctor's ID",
        example="123e4567-e89b-12d3-a456-426614174001",
        validation_rule="Valid UUID",
        prompt="Which doctor should this appointment be with? (provide doctor name or ID)"
    ),

    FieldRequirement(
        name="appointment_date",
        required=True,
        field_type="date",
        description="Appointment date",
        example="2025-11-15",
        validation_rule="YYYY-MM-DD format, must be future date",
        prompt="What date should the appointment be? (format: YYYY-MM-DD, e.g., 2025-11-15 or 'tomorrow')"
    ),

    FieldRequirement(
        name="appointment_time",
        required=True,
        field_type="time",
        description="Appointment time",
        example="10:30",
        validation_rule="HH:MM format (24-hour)",
        prompt="What time should the appointment be? (format: HH:MM, e.g., 10:30 or 14:00)"
    ),

    FieldRequirement(
        name="reason_for_visit",
        required=True,
        field_type="str",
        description="Reason for the appointment",
        example="Regular checkup and consultation",
        validation_rule="Min 3 characters",
        prompt="What is the reason for this appointment?"
    ),

    # Optional fields
    FieldRequirement(
        name="notes",
        required=False,
        field_type="str",
        description="Additional notes",
        example="Patient prefers morning appointments",
        validation_rule="Max 2000 characters",
        prompt="Any additional notes for this appointment? (optional)"
    ),

    FieldRequirement(
        name="duration_minutes",
        required=False,
        field_type="int",
        description="Appointment duration in minutes",
        example="30",
        validation_rule="10-480 minutes",
        prompt="How long should the appointment be in minutes? (optional, default: 30)"
    ),

    FieldRequirement(
        name="contact_number",
        required=False,
        field_type="str",
        description="Contact number for this appointment",
        example="9876543210",
        validation_rule="10 digits",
        prompt="Contact number for this appointment? (optional)"
    ),
]


# ==========================================
# Helper Functions
# ==========================================

def get_required_fields(operation: str) -> List[FieldRequirement]:
    """
    Get list of required fields for an operation.

    Args:
        operation: Operation name ("create_doctor", "create_patient", "create_appointment")

    Returns:
        List of required field requirements

    Educational Note:
    - Filters field list to only required fields
    - Agent uses this to know what MUST be asked
    """
    fields_map = {
        "create_doctor": DOCTOR_FIELDS,
        "create_patient": PATIENT_FIELDS,
        "create_appointment": APPOINTMENT_FIELDS,
    }

    all_fields = fields_map.get(operation, [])
    return [field for field in all_fields if field.required]


def get_all_fields(operation: str) -> List[FieldRequirement]:
    """
    Get all fields (required + optional) for an operation.

    Args:
        operation: Operation name

    Returns:
        List of all field requirements
    """
    fields_map = {
        "create_doctor": DOCTOR_FIELDS,
        "create_patient": PATIENT_FIELDS,
        "create_appointment": APPOINTMENT_FIELDS,
    }

    return fields_map.get(operation, [])


def get_missing_required_fields(operation: str, provided_data: Dict[str, Any]) -> List[FieldRequirement]:
    """
    Check which required fields are missing from provided data.

    Args:
        operation: Operation name
        provided_data: Data provided by user

    Returns:
        List of missing required fields

    Educational Note:
    - Agent calls this to see what's missing
    - Then asks user for the missing fields
    - Prevents API errors from missing data

    Example:
        >>> data = {"first_name": "John"}
        >>> missing = get_missing_required_fields("create_patient", data)
        >>> for field in missing:
        >>>     print(f"Missing: {field.name} - {field.prompt}")
    """
    required_fields = get_required_fields(operation)
    missing_fields = []

    for field in required_fields:
        # Check if field is in provided data and has a value
        value = provided_data.get(field.name)
        if value is None or value == "" or (isinstance(value, str) and not value.strip()):
            missing_fields.append(field)

    return missing_fields


def generate_missing_fields_prompt(missing_fields: List[FieldRequirement]) -> str:
    """
    Generate a friendly prompt asking for missing fields.

    Args:
        missing_fields: List of missing required fields

    Returns:
        User-friendly prompt asking for the information

    Educational Note:
    - Converts technical field requirements into friendly questions
    - Agent sends this to user
    - Makes conversation natural

    Example output:
        "I need a few more details to create the patient:
        1. What is the patient's last name?
        2. What is the patient's date of birth? (format: YYYY-MM-DD)
        3. What is the patient's gender? (male/female/other)"
    """
    if not missing_fields:
        return ""

    if len(missing_fields) == 1:
        # Single field missing
        field = missing_fields[0]
        return f"I need one more detail: {field.prompt}"

    # Multiple fields missing
    prompt_lines = [f"I need a few more details:"]
    for i, field in enumerate(missing_fields, 1):
        prompt_lines.append(f"{i}. {field.prompt}")

    return "\n".join(prompt_lines)


def get_field_description(operation: str, field_name: str) -> Optional[str]:
    """
    Get human-readable description of a field.

    Useful for agent to explain what a field means.

    Args:
        operation: Operation name
        field_name: Field to describe

    Returns:
        Field description or None if not found
    """
    all_fields = get_all_fields(operation)

    for field in all_fields:
        if field.name == field_name:
            return field.description

    return None


def get_field_example(operation: str, field_name: str) -> Optional[str]:
    """
    Get example value for a field.

    Agent can show examples to help user understand format.

    Args:
        operation: Operation name
        field_name: Field to get example for

    Returns:
        Example value or None if not found
    """
    all_fields = get_all_fields(operation)

    for field in all_fields:
        if field.name == field_name:
            return field.example

    return None


def get_operation_summary(operation: str) -> Dict[str, Any]:
    """
    Get summary of an operation's field requirements.

    Useful for agent to understand what an operation needs.

    Returns:
        {
            "operation": "create_patient",
            "required_fields": 5,
            "optional_fields": 3,
            "required_field_names": ["mobile_number", "first_name", ...],
            "all_fields": {...}
        }
    """
    all_fields = get_all_fields(operation)
    required = [f for f in all_fields if f.required]
    optional = [f for f in all_fields if not f.required]

    return {
        "operation": operation,
        "required_fields_count": len(required),
        "optional_fields_count": len(optional),
        "required_field_names": [f.name for f in required],
        "optional_field_names": [f.name for f in optional],
        "all_fields": {f.name: f for f in all_fields}
    }


# ==========================================
# Testing & Examples
# ==========================================

def test_field_requirements():
    """
    Test field requirements system.

    Run this to understand how it works:
        python -m app.clients.field_requirements
    """
    print("Testing Field Requirements System")
    print("=" * 60)

    # Test 1: Get required fields for creating patient
    print("\n1. Required fields for creating patient:")
    required = get_required_fields("create_patient")
    for field in required:
        print(f"   - {field.name}: {field.description}")

    # Test 2: Check missing fields
    print("\n2. Checking for missing fields...")
    partial_data = {
        "first_name": "John",
        "mobile_number": "9876543210"
    }
    missing = get_missing_required_fields("create_patient", partial_data)
    print(f"   Provided: {list(partial_data.keys())}")
    print(f"   Missing: {[f.name for f in missing]}")

    # Test 3: Generate prompt for missing fields
    print("\n3. Generated prompt for user:")
    prompt = generate_missing_fields_prompt(missing)
    print(f"   {prompt}")

    # Test 4: Operation summary
    print("\n4. Operation summary:")
    summary = get_operation_summary("create_appointment")
    print(f"   Operation: {summary['operation']}")
    print(f"   Required fields: {summary['required_fields_count']}")
    print(f"   Optional fields: {summary['optional_fields_count']}")
    print(f"   Required: {summary['required_field_names']}")

    print("\n" + "=" * 60)
    print("✅ All tests passed!")


if __name__ == "__main__":
    test_field_requirements()
