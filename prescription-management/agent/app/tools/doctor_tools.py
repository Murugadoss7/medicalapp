"""
Doctor Management Tools for AI Agent

This module provides LangChain tools for doctor-related operations.
The agent uses these tools to create, search, and manage doctors.

Educational Notes:
====================

**What is a LangChain Tool?**
- A tool is a function that an agent can call
- The @tool decorator makes a function usable by LangChain agents
- The docstring becomes the tool's description (agent reads this!)
- Type hints help the agent understand parameters

**How Agents Use Tools:**
1. Agent receives user request: "Create doctor John Smith"
2. Agent decides which tool to use: create_doctor_tool
3. Agent extracts parameters from user message
4. Agent calls the tool function
5. Tool returns result to agent
6. Agent formats response for user

**Smart Field Handling:**
The tools use field_requirements to:
- Know what fields are required
- Detect missing information
- Ask user for missing fields
- Only call API when all required data is available
"""

import json
import asyncio
from typing import Dict, Any, Optional
from langchain.tools import tool

from app.clients.medical_api_client import create_medical_client_from_settings
from app.clients.field_requirements import (
    get_missing_required_fields,
    generate_missing_fields_prompt,
    get_all_fields,
)


# ==========================================
# Doctor Creation Tool
# ==========================================

@tool
async def create_doctor_tool(
    first_name: Optional[str] = None,
    last_name: Optional[str] = None,
    email: Optional[str] = None,
    license_number: Optional[str] = None,
    specialization: Optional[str] = None,
    qualification: Optional[str] = None,
    experience_years: Optional[int] = None,
    clinic_address: Optional[str] = None,
    phone: Optional[str] = None,
    consultation_fee: Optional[str] = None,
    consultation_duration: Optional[int] = None,
    auth_token: Optional[str] = None,
) -> str:
    """
    Create a new doctor in the medical system.
    
    This tool registers a new doctor with their professional information.
    
    Required fields:
    - first_name: Doctor's first name
    - last_name: Doctor's last name
    - email: Doctor's email address
    - license_number: Medical license number
    - specialization: Medical specialization (e.g., Cardiology, Neurology)
    
    Optional fields:
    - qualification: Educational qualifications (e.g., MBBS, MD)
    - experience_years: Years of medical experience
    - clinic_address: Clinic or hospital address
    - phone: Professional contact number
    - consultation_fee: Default consultation fee
    - consultation_duration: Default consultation duration in minutes (default: 30)
    
    The tool will check for missing required fields and ask the user to provide them
    before attempting to create the doctor record.
    
    Returns:
    - Success message with doctor details if created
    - Request for missing information if required fields are missing
    - Error message if creation fails
    
    Educational Note:
    - This is a LangChain @tool decorated function
    - The agent reads this docstring to understand what the tool does
    - Type hints help the agent understand parameter types
    - The agent can extract parameters from natural language
    """
    
    # Step 1: Collect provided data
    provided_data = {
        "first_name": first_name,
        "last_name": last_name,
        "email": email,
        "license_number": license_number,
        "specialization": specialization,
        "qualification": qualification,
        "experience_years": experience_years,
        "clinic_address": clinic_address,
        "phone": phone,
        "consultation_fee": consultation_fee,
        "consultation_duration": consultation_duration,
    }
    
    # Remove None values
    provided_data = {k: v for k, v in provided_data.items() if v is not None}
    
    # Step 2: Check for missing required fields
    missing_fields = get_missing_required_fields("create_doctor", provided_data)
    
    if missing_fields:
        # Missing required information - ask user
        prompt = generate_missing_fields_prompt(missing_fields)
        return f"❌ Cannot create doctor yet. {prompt}"
    
    # Step 3: Check for auth token
    if not auth_token:
        return (
            "❌ Authentication required. Please provide auth_token to create a doctor. "
            "Only authenticated admin users can create doctor accounts."
        )
    
    # Step 4: All required fields present - create doctor
    try:
        client = create_medical_client_from_settings()
        
        # Separate required fields from optional
        required_fields = {
            "first_name": provided_data["first_name"],
            "last_name": provided_data["last_name"],
            "email": provided_data["email"],
            "license_number": provided_data["license_number"],
            "specialization": provided_data["specialization"],
        }
        
        # Optional fields
        optional_fields = {
            k: v for k, v in provided_data.items()
            if k not in required_fields
        }
        
        # Create doctor
        result = await client.create_doctor(
            **required_fields,
            **optional_fields,
            auth_token=auth_token,
        )
        
        # Close client
        await client.close()
        
        # Format success response
        doctor_name = f"Dr. {result.get('first_name')} {result.get('last_name')}"
        doctor_id = result.get('id')
        doctor_specialization = result.get('specialization')
        
        success_msg = (
            f"✅ Doctor created successfully!\n\n"
            f"**Details:**\n"
            f"- Name: {doctor_name}\n"
            f"- ID: {doctor_id}\n"
            f"- Specialization: {doctor_specialization}\n"
            f"- Email: {result.get('email')}\n"
            f"- License: {result.get('license_number')}\n"
        )
        
        if result.get('qualification'):
            success_msg += f"- Qualification: {result.get('qualification')}\n"
        if result.get('experience_years'):
            success_msg += f"- Experience: {result.get('experience_years')} years\n"
        
        return success_msg
        
    except Exception as e:
        # Handle errors
        error_msg = str(e)
        
        # Common error cases
        if "already exists" in error_msg.lower() or "duplicate" in error_msg.lower():
            return (
                f"❌ A doctor with this email or license number already exists.\n"
                f"Error: {error_msg}"
            )
        elif "unauthorized" in error_msg.lower() or "401" in error_msg:
            return (
                "❌ Authentication failed. Your session may have expired. "
                "Please log in again."
            )
        elif "forbidden" in error_msg.lower() or "403" in error_msg:
            return (
                "❌ Permission denied. Only admin users can create doctor accounts."
            )
        else:
            return f"❌ Failed to create doctor: {error_msg}"


# ==========================================
# Doctor Search Tool
# ==========================================

@tool
async def search_doctors_tool(
    specialization: Optional[str] = None,
    auth_token: Optional[str] = None,
) -> str:
    """
    Search for doctors in the medical system.
    
    This tool finds doctors based on search criteria.
    
    Parameters:
    - specialization: Filter by medical specialization (optional)
    - auth_token: Authentication token for API access
    
    Returns:
    - List of matching doctors with their details
    - Empty result if no doctors found
    - Error message if search fails
    
    Educational Note:
    - Search operations typically require less strict validation
    - Results are formatted for easy reading by the user
    - The agent can use this to help users find doctors
    """
    
    # Check for auth token
    if not auth_token:
        return (
            "❌ Authentication required. Please provide auth_token to search doctors."
        )
    
    try:
        client = create_medical_client_from_settings()
        
        # Search doctors
        doctors = await client.search_doctors(
            specialization=specialization,
            auth_token=auth_token,
        )
        
        await client.close()
        
        # Handle empty results
        if not doctors:
            if specialization:
                return f"No doctors found with specialization: {specialization}"
            else:
                return "No doctors found in the system."
        
        # Format results
        result_lines = [f"Found {len(doctors)} doctor(s):\n"]
        
        for i, doctor in enumerate(doctors, 1):
            name = f"Dr. {doctor.get('first_name')} {doctor.get('last_name')}"
            spec = doctor.get('specialization', 'N/A')
            email = doctor.get('email', 'N/A')
            doctor_id = doctor.get('id', 'N/A')
            
            result_lines.append(
                f"{i}. **{name}**\n"
                f"   - Specialization: {spec}\n"
                f"   - Email: {email}\n"
                f"   - ID: {doctor_id}\n"
            )
            
            # Add optional fields if present
            if doctor.get('qualification'):
                result_lines.append(f"   - Qualification: {doctor.get('qualification')}\n")
            if doctor.get('experience_years'):
                result_lines.append(f"   - Experience: {doctor.get('experience_years')} years\n")
            if doctor.get('consultation_fee'):
                result_lines.append(f"   - Fee: ₹{doctor.get('consultation_fee')}\n")
            
            result_lines.append("\n")
        
        return "".join(result_lines)
        
    except Exception as e:
        error_msg = str(e)
        
        if "unauthorized" in error_msg.lower() or "401" in error_msg:
            return "❌ Authentication failed. Please log in again."
        else:
            return f"❌ Failed to search doctors: {error_msg}"


# ==========================================
# Helper: Get Doctor by ID
# ==========================================

@tool
async def get_doctor_details_tool(
    doctor_id: str,
    auth_token: Optional[str] = None,
) -> str:
    """
    Get detailed information about a specific doctor.
    
    This tool retrieves complete information for a doctor by their ID.
    
    Parameters:
    - doctor_id: The unique ID (UUID) of the doctor
    - auth_token: Authentication token for API access
    
    Returns:
    - Complete doctor information
    - Error message if doctor not found
    
    Educational Note:
    - This is useful when agent needs to reference a specific doctor
    - Used in workflows like appointment booking (need doctor_id)
    """
    
    if not auth_token:
        return "❌ Authentication required. Please provide auth_token."
    
    if not doctor_id:
        return "❌ Please provide a doctor_id to retrieve details."
    
    try:
        client = create_medical_client_from_settings()
        
        doctor = await client.get_doctor(
            doctor_id=doctor_id,
            auth_token=auth_token,
        )
        
        await client.close()
        
        # Format detailed response
        name = f"Dr. {doctor.get('first_name')} {doctor.get('last_name')}"
        
        details = [
            f"**{name}**\n",
            f"- ID: {doctor.get('id')}\n",
            f"- Email: {doctor.get('email')}\n",
            f"- License: {doctor.get('license_number')}\n",
            f"- Specialization: {doctor.get('specialization')}\n",
        ]
        
        # Add optional fields
        if doctor.get('qualification'):
            details.append(f"- Qualification: {doctor.get('qualification')}\n")
        if doctor.get('experience_years') is not None:
            details.append(f"- Experience: {doctor.get('experience_years')} years\n")
        if doctor.get('clinic_address'):
            details.append(f"- Clinic: {doctor.get('clinic_address')}\n")
        if doctor.get('phone'):
            details.append(f"- Phone: {doctor.get('phone')}\n")
        if doctor.get('consultation_fee'):
            details.append(f"- Consultation Fee: ₹{doctor.get('consultation_fee')}\n")
        if doctor.get('consultation_duration'):
            details.append(f"- Duration: {doctor.get('consultation_duration')} minutes\n")
        
        # Status
        is_active = doctor.get('is_active', False)
        status = "✅ Active" if is_active else "❌ Inactive"
        details.append(f"- Status: {status}\n")
        
        return "".join(details)
        
    except Exception as e:
        error_msg = str(e)
        
        if "not found" in error_msg.lower() or "404" in error_msg:
            return f"❌ Doctor with ID {doctor_id} not found."
        elif "unauthorized" in error_msg.lower() or "401" in error_msg:
            return "❌ Authentication failed. Please log in again."
        else:
            return f"❌ Failed to get doctor details: {error_msg}"


# ==========================================
# Testing & Examples
# ==========================================

async def test_doctor_tools():
    """
    Test doctor tools with examples.

    Run this to understand how tools work:
        cd prescription-management/agent
        python -m app.tools.doctor_tools
    """
    print("Testing Doctor Tools")
    print("=" * 60)

    # Test 1: Try to create doctor with missing fields
    print("\n1. Testing create_doctor_tool with missing fields...")
    result = await create_doctor_tool.ainvoke({
        "first_name": "John",
        # Missing: last_name, email, license_number, specialization
    })
    print(result)
    assert "Cannot create doctor yet" in result
    print("✅ Correctly detected missing fields")

    # Test 2: Try with all required fields (will fail without valid token)
    print("\n2. Testing create_doctor_tool with all required fields...")
    result = await create_doctor_tool.ainvoke({
        "first_name": "John",
        "last_name": "Smith",
        "email": "john.smith@clinic.com",
        "license_number": "DOC123456",
        "specialization": "Cardiology",
        # No auth_token
    })
    print(result)
    assert "Authentication required" in result
    print("✅ Correctly requires authentication")

    # Test 3: Search doctors (will fail without valid token)
    print("\n3. Testing search_doctors_tool...")
    result = await search_doctors_tool.ainvoke({
        "specialization": "Cardiology",
    })
    print(result)
    assert "Authentication required" in result
    print("✅ Correctly requires authentication")

    print("\n" + "=" * 60)
    print("✅ All tool tests passed!")
    print("\nNote: Full testing requires valid JWT token and running medical backend.")


if __name__ == "__main__":
    """
    Run doctor tools tests.
    
    Usage:
        cd prescription-management/agent
        python -m app.tools.doctor_tools
    """
    asyncio.run(test_doctor_tools())
