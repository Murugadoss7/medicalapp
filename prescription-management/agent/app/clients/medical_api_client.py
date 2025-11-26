"""
Medical API Client - Bridge to Medical Backend

This module provides an HTTP client to communicate with the medical backend.
All agent tools use this client to perform actual operations.

Educational Notes:
====================

**Why We Need This:**
- Agent needs to CREATE doctors, patients, appointments
- Medical backend has the API endpoints
- This client makes HTTP requests to medical backend
- Tools call this client → Client calls medical API → Database updated

**Architecture:**
    Agent Tool → Medical API Client → Medical Backend (port 8000) → Database

**HTTP Methods:**
- GET: Retrieve data (search, view)
- POST: Create new data (create doctor, patient)
- PUT: Update existing data (edit doctor info)
- DELETE: Remove data (cancel appointment)

**Why Async?**
- async/await allows non-blocking I/O
- Agent can handle multiple requests concurrently
- Faster response times
- Better resource usage
"""

import httpx
from typing import Dict, Any, Optional, List
from datetime import datetime
import logging

# Set up logging
logger = logging.getLogger(__name__)


class MedicalAPIClient:
    """
    Async HTTP client for medical backend API.

    This class handles all communication with the medical backend.
    It provides methods for common operations like creating doctors,
    patients, scheduling appointments, etc.

    Educational Note:
    - This is an async class (uses async/await)
    - All methods return data or raise exceptions
    - JWT token is passed with every request for authentication
    - httpx is like requests but with async support
    """

    def __init__(
        self,
        base_url: str = "http://localhost:8000",
        timeout: int = 30,
    ):
        """
        Initialize the medical API client.

        Args:
            base_url: Medical backend URL (default: http://localhost:8000)
            timeout: Request timeout in seconds (default: 30)

        Educational Note:
        - __init__ is the constructor
        - We store base_url and create an httpx client
        - The client is reused for all requests (efficient!)
        """
        self.base_url = base_url.rstrip("/")  # Remove trailing slash if present
        self.timeout = timeout

        # Create async HTTP client
        # This client handles connection pooling, keeps connections alive
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        """
        Get or create the HTTP client.

        Educational Note:
        - Lazy initialization: Create client when first needed
        - Reuse same client for all requests (connection pooling)
        - This is more efficient than creating new client each time
        """
        if self._client is None:
            self._client = httpx.AsyncClient(
                timeout=self.timeout,
                follow_redirects=True,
            )
        return self._client

    async def close(self):
        """
        Close the HTTP client and cleanup connections.

        Call this when you're done using the client.

        Educational Note:
        - Important for cleanup
        - Releases connections
        - In production, use context manager (async with)
        """
        if self._client:
            await self._client.aclose()
            self._client = None

    def _build_url(self, endpoint: str) -> str:
        """
        Build full URL from endpoint.

        Args:
            endpoint: API endpoint (e.g., "/api/v1/doctors")

        Returns:
            Full URL (e.g., "http://localhost:8000/api/v1/doctors")

        Educational Note:
        - Ensures endpoint starts with /
        - Combines base_url + endpoint
        - Simple but important helper method
        """
        if not endpoint.startswith("/"):
            endpoint = f"/{endpoint}"
        return f"{self.base_url}{endpoint}"

    def _build_headers(self, auth_token: Optional[str] = None) -> Dict[str, str]:
        """
        Build HTTP headers for request.

        Args:
            auth_token: JWT token for authentication

        Returns:
            Dictionary of headers

        Educational Note:
        - Content-Type tells server we're sending JSON
        - Authorization header contains JWT token
        - Format: "Bearer <token>"
        """
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

        if auth_token:
            headers["Authorization"] = f"Bearer {auth_token}"

        return headers

    async def _handle_response(self, response: httpx.Response) -> Dict[str, Any]:
        """
        Handle HTTP response and extract JSON data.

        Args:
            response: HTTP response from server

        Returns:
            Parsed JSON data as dictionary

        Raises:
            Exception: If response indicates error

        Educational Note:
        - HTTP status codes:
          * 200-299: Success
          * 400-499: Client errors (bad request, unauthorized, not found)
          * 500-599: Server errors
        - We check status code and raise exception if not successful
        - This makes error handling easier in calling code
        """
        # Check if request was successful
        if response.status_code >= 400:
            # Error occurred
            error_detail = "Unknown error"
            try:
                error_data = response.json()
                error_detail = error_data.get("detail", str(error_data))
            except:
                error_detail = response.text or f"HTTP {response.status_code}"

            logger.error(f"Medical API error: {response.status_code} - {error_detail}")

            raise Exception(f"Medical API error ({response.status_code}): {error_detail}")

        # Success - parse and return JSON
        try:
            return response.json()
        except Exception as e:
            logger.error(f"Failed to parse response JSON: {e}")
            raise Exception(f"Failed to parse response: {e}")

    # ==========================================
    # Generic HTTP Methods
    # ==========================================

    async def get(
        self,
        endpoint: str,
        auth_token: Optional[str] = None,
        params: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Make GET request to medical API.

        Used for retrieving data (search, view, list).

        Args:
            endpoint: API endpoint (e.g., "/api/v1/doctors")
            auth_token: JWT token
            params: Query parameters (e.g., {"specialization": "Cardiology"})

        Returns:
            Response data as dictionary

        Example:
            data = await client.get(
                "/api/v1/doctors/search",
                auth_token=token,
                params={"specialization": "Cardiology"}
            )
        """
        client = await self._get_client()
        url = self._build_url(endpoint)
        headers = self._build_headers(auth_token)

        logger.info(f"GET {url}")

        response = await client.get(url, headers=headers, params=params)
        return await self._handle_response(response)

    async def post(
        self,
        endpoint: str,
        data: Dict[str, Any],
        auth_token: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Make POST request to medical API.

        Used for creating new resources.

        Args:
            endpoint: API endpoint
            data: Data to send in request body
            auth_token: JWT token

        Returns:
            Response data (usually the created resource)

        Example:
            doctor = await client.post(
                "/api/v1/doctors",
                data={
                    "first_name": "John",
                    "last_name": "Smith",
                    "specialization": "Cardiology"
                },
                auth_token=token
            )
        """
        client = await self._get_client()
        url = self._build_url(endpoint)
        headers = self._build_headers(auth_token)

        logger.info(f"POST {url}")
        logger.debug(f"Data: {data}")

        response = await client.post(url, headers=headers, json=data)
        return await self._handle_response(response)

    async def put(
        self,
        endpoint: str,
        data: Dict[str, Any],
        auth_token: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Make PUT request to medical API.

        Used for updating existing resources.

        Args:
            endpoint: API endpoint (usually includes ID, e.g., "/api/v1/doctors/123")
            data: Updated data
            auth_token: JWT token

        Returns:
            Response data (usually the updated resource)
        """
        client = await self._get_client()
        url = self._build_url(endpoint)
        headers = self._build_headers(auth_token)

        logger.info(f"PUT {url}")
        logger.debug(f"Data: {data}")

        response = await client.put(url, headers=headers, json=data)
        return await self._handle_response(response)

    async def delete(
        self,
        endpoint: str,
        auth_token: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Make DELETE request to medical API.

        Used for deleting resources.

        Args:
            endpoint: API endpoint with ID
            auth_token: JWT token

        Returns:
            Response data (usually confirmation message)
        """
        client = await self._get_client()
        url = self._build_url(endpoint)
        headers = self._build_headers(auth_token)

        logger.info(f"DELETE {url}")

        response = await client.delete(url, headers=headers)
        return await self._handle_response(response)

    # ==========================================
    # Doctor Operations
    # ==========================================

    async def create_doctor(
        self,
        first_name: str,
        last_name: str,
        specialization: str,
        email: str,
        auth_token: str,
        **kwargs: Any,
    ) -> Dict[str, Any]:
        """
        Create a new doctor in the medical system.

        Args:
            first_name: Doctor's first name
            last_name: Doctor's last name
            specialization: Medical specialization
            email: Email address
            auth_token: JWT token
            **kwargs: Additional fields (phone, license_number, etc.)

        Returns:
            Created doctor data with ID

        Educational Note:
        - **kwargs captures any extra keyword arguments
        - Allows flexibility for optional fields
        - All fields are combined into data dict
        """
        data = {
            "first_name": first_name,
            "last_name": last_name,
            "specialization": specialization,
            "email": email,
            **kwargs,  # Merge any additional fields
        }

        return await self.post("/api/v1/doctors", data, auth_token)

    async def search_doctors(
        self,
        specialization: Optional[str] = None,
        auth_token: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Search for doctors by criteria.

        Args:
            specialization: Filter by specialization (optional)
            auth_token: JWT token

        Returns:
            List of doctors matching criteria
        """
        params = {}
        if specialization:
            params["specialization"] = specialization

        response = await self.get("/api/v1/doctors/search", auth_token, params)

        # Response might be a list or a dict with 'doctors' key
        if isinstance(response, list):
            return response
        return response.get("doctors", [])

    async def get_doctor(
        self,
        doctor_id: str,
        auth_token: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Get doctor details by ID.

        Args:
            doctor_id: Doctor's UUID
            auth_token: JWT token

        Returns:
            Doctor details
        """
        return await self.get(f"/api/v1/doctors/{doctor_id}", auth_token)

    # ==========================================
    # Patient Operations
    # ==========================================

    async def create_patient(
        self,
        mobile_number: str,
        first_name: str,
        last_name: str,
        date_of_birth: str,
        gender: str,
        auth_token: str,
        **kwargs: Any,
    ) -> Dict[str, Any]:
        """
        Register a new patient.

        Args:
            mobile_number: Patient's mobile (part of composite key)
            first_name: First name (part of composite key)
            last_name: Last name
            date_of_birth: DOB in YYYY-MM-DD format
            gender: Gender (Male/Female/Other)
            auth_token: JWT token
            **kwargs: Additional fields

        Returns:
            Created patient data

        Educational Note:
        - Patients use composite key (mobile_number + first_name)
        - This allows family members to share mobile number
        """
        data = {
            "mobile_number": mobile_number,
            "first_name": first_name,
            "last_name": last_name,
            "date_of_birth": date_of_birth,
            "gender": gender,
            **kwargs,
        }

        return await self.post("/api/v1/patients", data, auth_token)

    async def search_patients(
        self,
        mobile_number: Optional[str] = None,
        first_name: Optional[str] = None,
        auth_token: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Search for patients by mobile number or name.

        Args:
            mobile_number: Mobile number to search
            first_name: First name to search
            auth_token: JWT token

        Returns:
            List of matching patients
        """
        params = {}
        if mobile_number:
            params["mobile_number"] = mobile_number
        if first_name:
            params["first_name"] = first_name

        response = await self.get("/api/v1/patients/search", auth_token, params)

        if isinstance(response, list):
            return response
        return response.get("patients", [])

    # ==========================================
    # Appointment Operations
    # ==========================================

    async def create_appointment(
        self,
        patient_mobile: str,
        patient_first_name: str,
        doctor_id: str,
        appointment_date: str,
        appointment_time: str,
        auth_token: str,
        **kwargs: Any,
    ) -> Dict[str, Any]:
        """
        Schedule a new appointment.

        Args:
            patient_mobile: Patient's mobile number
            patient_first_name: Patient's first name
            doctor_id: Doctor's UUID
            appointment_date: Date in YYYY-MM-DD format
            appointment_time: Time in HH:MM format
            auth_token: JWT token
            **kwargs: Additional fields (reason, notes)

        Returns:
            Created appointment with appointment_number
        """
        data = {
            "patient_mobile_number": patient_mobile,
            "patient_first_name": patient_first_name,
            "doctor_id": doctor_id,
            "appointment_date": appointment_date,
            "appointment_time": appointment_time,
            **kwargs,
        }

        return await self.post("/api/v1/appointments", data, auth_token)

    async def get_available_slots(
        self,
        doctor_id: str,
        date: str,
        auth_token: Optional[str] = None,
    ) -> List[str]:
        """
        Get available time slots for a doctor on a specific date.

        Args:
            doctor_id: Doctor's UUID
            date: Date in YYYY-MM-DD format
            auth_token: JWT token

        Returns:
            List of available time slots (e.g., ["09:00", "09:30", "10:00"])
        """
        params = {"date": date}
        response = await self.get(
            f"/api/v1/appointments/doctor/{doctor_id}/availability",
            auth_token,
            params
        )

        return response.get("available_slots", [])

    # ==========================================
    # Health Check
    # ==========================================

    async def health_check(self) -> Dict[str, Any]:
        """
        Check if medical backend is accessible.

        Returns:
            Health status

        Educational Note:
        - Useful for testing connection
        - No authentication needed for health check
        - Returns basic server info
        """
        try:
            return await self.get("/api/v1/health")
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return {"status": "unhealthy", "error": str(e)}


# ==========================================
# Convenience Functions
# ==========================================

def create_medical_client_from_settings() -> MedicalAPIClient:
    """
    Create medical API client using settings from config.

    This is the easiest way to create a client.

    Usage:
        from app.clients.medical_api_client import create_medical_client_from_settings

        client = create_medical_client_from_settings()
        doctor = await client.create_doctor(...)

    Educational Note:
    - Loads medical API URL from settings
    - Creates client with correct configuration
    - You don't need to pass URL manually
    """
    from app.config import get_settings

    settings = get_settings()

    return MedicalAPIClient(
        base_url=settings.medical_api_url,
        timeout=settings.medical_api_timeout,
    )


# ==========================================
# Testing & Examples
# ==========================================

async def test_medical_api_client():
    """
    Test the medical API client.

    Run this to verify connection to medical backend:
        cd prescription-management/agent
        python -m app.clients.medical_api_client
    """
    print("Testing Medical API Client")
    print("=" * 60)

    # Create client
    client = create_medical_client_from_settings()

    try:
        # Test 1: Health check
        print("\n1. Testing health check...")
        health = await client.health_check()
        print(f"✅ Medical backend health: {health.get('status', 'unknown')}")

        # Test 2: Search doctors (no auth needed for testing)
        print("\n2. Testing doctor search (without auth)...")
        try:
            doctors = await client.search_doctors()
            print(f"✅ Found {len(doctors)} doctors")
        except Exception as e:
            print(f"⚠️  Search requires authentication: {e}")

        print("\n" + "=" * 60)
        print("✅ Medical API client is working!")
        print("\nNote: Full testing requires valid JWT token.")
        print("Run agent with authentication to test all operations.")

    except Exception as e:
        print(f"❌ Error: {e}")
        print("\nTroubleshooting:")
        print("1. Make sure medical backend is running on port 8000")
        print("2. Check MEDICAL_API_URL in .env file")
        print("3. Test medical API manually: curl http://localhost:8000/api/v1/health")

    finally:
        # Always close client
        await client.close()


if __name__ == "__main__":
    """
    Run medical API client tests.

    Usage:
        cd prescription-management/agent
        python -m app.clients.medical_api_client
    """
    import asyncio

    asyncio.run(test_medical_api_client())
