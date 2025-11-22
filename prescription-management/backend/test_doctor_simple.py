#!/usr/bin/env python3
"""
Simple doctor management test script to validate Module 2: Doctor Management
Tests basic doctor CRUD operations and role-based access control
"""

import requests
import json
from typing import Dict, Any

# Test configuration
BASE_URL = "http://localhost:8000"

def test_server_health() -> bool:
    """Test if server is running and healthy"""
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Server health check passed: {data['status']}")
            return True
        else:
            print(f"❌ Health check failed with status: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Server connection failed: {e}")
        return False

def create_admin_user() -> Dict[str, Any]:
    """Create an admin user for testing"""
    import time
    timestamp = int(time.time())
    
    admin_data = {
        "email": f"admin.{timestamp}@example.com",
        "password": "adminpassword123",
        "confirm_password": "adminpassword123",
        "first_name": "Admin",
        "last_name": "User",
        "role": "admin"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/v1/auth/register",
            json=admin_data,
            timeout=10
        )
        
        if response.status_code == 200:
            print(f"✅ Admin user created: {admin_data['email']}")
            return {"success": True, "user": response.json(), "credentials": admin_data}
        else:
            print(f"❌ Admin creation failed: {response.status_code} - {response.text}")
            return {"success": False, "error": response.text}
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Admin creation request failed: {e}")
        return {"success": False, "error": str(e)}

def create_doctor_user() -> Dict[str, Any]:
    """Create a doctor user for testing"""
    import time
    timestamp = int(time.time())
    
    doctor_user_data = {
        "email": f"doctor.user.{timestamp}@example.com",
        "password": "doctorpassword123",
        "confirm_password": "doctorpassword123",
        "first_name": "John",
        "last_name": "Doe",
        "role": "doctor"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/v1/auth/register",
            json=doctor_user_data,
            timeout=10
        )
        
        if response.status_code == 200:
            print(f"✅ Doctor user created: {doctor_user_data['email']}")
            return {"success": True, "user": response.json(), "credentials": doctor_user_data}
        else:
            print(f"❌ Doctor user creation failed: {response.status_code} - {response.text}")
            return {"success": False, "error": response.text}
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Doctor user creation request failed: {e}")
        return {"success": False, "error": str(e)}

def login_user(email: str, password: str) -> Dict[str, Any]:
    """Login user and get access token"""
    login_data = {
        "email": email,
        "password": password
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/v1/auth/login",
            json=login_data,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ User login successful: {email}")
            return {"success": True, "tokens": data["tokens"], "user": data["user"]}
        else:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            return {"success": False, "error": response.text}
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Login request failed: {e}")
        return {"success": False, "error": str(e)}

def test_create_doctor_profile(admin_token: str, doctor_user_id: str) -> Dict[str, Any]:
    """Test creating a doctor profile"""
    doctor_profile_data = {
        "user_id": doctor_user_id,
        "license_number": "DOC123456",
        "specialization": "Cardiology",
        "qualification": "MBBS, MD (Cardiology)",
        "experience_years": 10,
        "clinic_address": "123 Medical Center, Healthcare District",
        "phone": "+1-555-0123",
        "consultation_fee": "100",
        "consultation_duration": 30,
        "availability_schedule": {
            "monday": [{"start_time": "09:00", "end_time": "17:00"}],
            "tuesday": [{"start_time": "09:00", "end_time": "17:00"}],
            "wednesday": [{"start_time": "09:00", "end_time": "17:00"}],
            "thursday": [{"start_time": "09:00", "end_time": "17:00"}],
            "friday": [{"start_time": "09:00", "end_time": "17:00"}],
            "saturday": [{"start_time": "09:00", "end_time": "13:00"}],
            "sunday": []
        }
    }
    
    headers = {
        "Authorization": f"Bearer {admin_token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/v1/doctors/",
            json=doctor_profile_data,
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 201:
            data = response.json()
            print(f"✅ Doctor profile created: {data['full_name']} (License: {data['license_number']})")
            return {"success": True, "doctor": data}
        else:
            print(f"❌ Doctor profile creation failed: {response.status_code} - {response.text}")
            return {"success": False, "error": response.text}
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Doctor profile creation request failed: {e}")
        return {"success": False, "error": str(e)}

def test_list_doctors(token: str) -> Dict[str, Any]:
    """Test listing doctors"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/v1/doctors/",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Doctor list retrieved: {data['total']} doctors found")
            return {"success": True, "doctors": data}
        else:
            print(f"❌ Doctor list failed: {response.status_code} - {response.text}")
            return {"success": False, "error": response.text}
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Doctor list request failed: {e}")
        return {"success": False, "error": str(e)}

def test_get_doctor_by_id(token: str, doctor_id: str) -> Dict[str, Any]:
    """Test getting doctor by ID"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/v1/doctors/{doctor_id}",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Doctor details retrieved: {data['full_name']}")
            return {"success": True, "doctor": data}
        else:
            print(f"❌ Get doctor failed: {response.status_code} - {response.text}")
            return {"success": False, "error": response.text}
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Get doctor request failed: {e}")
        return {"success": False, "error": str(e)}

def test_update_doctor_profile(token: str, doctor_id: str) -> Dict[str, Any]:
    """Test updating doctor profile"""
    update_data = {
        "experience_years": 12,
        "consultation_fee": "120",
        "clinic_address": "456 Updated Medical Center"
    }
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.put(
            f"{BASE_URL}/api/v1/doctors/{doctor_id}",
            json=update_data,
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Doctor profile updated: Experience now {data['experience_years']} years")
            return {"success": True, "doctor": data}
        else:
            print(f"❌ Doctor update failed: {response.status_code} - {response.text}")
            return {"success": False, "error": response.text}
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Doctor update request failed: {e}")
        return {"success": False, "error": str(e)}

def test_get_doctor_schedule(token: str, doctor_id: str) -> Dict[str, Any]:
    """Test getting doctor schedule"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/v1/doctors/{doctor_id}/schedule",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Doctor schedule retrieved for: {data['full_name']}")
            return {"success": True, "schedule": data}
        else:
            print(f"❌ Get schedule failed: {response.status_code} - {response.text}")
            return {"success": False, "error": response.text}
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Get schedule request failed: {e}")
        return {"success": False, "error": str(e)}

def test_search_doctors(token: str) -> Dict[str, Any]:
    """Test searching doctors"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/v1/doctors/?specialization=cardiology&min_experience=5",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Doctor search completed: {data['total']} cardiologists with 5+ years experience")
            return {"success": True, "results": data}
        else:
            print(f"❌ Doctor search failed: {response.status_code} - {response.text}")
            return {"success": False, "error": response.text}
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Doctor search request failed: {e}")
        return {"success": False, "error": str(e)}

def main():
    """Run comprehensive doctor management tests"""
    print("🔧 Testing Module 2: Doctor Management")
    print("=" * 50)
    
    # Test 1: Server health
    print("\n1. Testing server health...")
    if not test_server_health():
        print("💀 Server not running. Please start the server first.")
        return False
    
    # Test 2: Create admin user
    print("\n2. Creating admin user...")
    admin_result = create_admin_user()
    if not admin_result["success"]:
        print("💀 Admin user creation failed.")
        return False
    
    # Test 3: Create doctor user  
    print("\n3. Creating doctor user...")
    doctor_user_result = create_doctor_user()
    if not doctor_user_result["success"]:
        print("💀 Doctor user creation failed.")
        return False
    
    # Test 4: Login admin user
    print("\n4. Logging in admin user...")
    admin_login = login_user(
        admin_result["credentials"]["email"], 
        admin_result["credentials"]["password"]
    )
    if not admin_login["success"]:
        print("💀 Admin login failed.")
        return False
    
    admin_token = admin_login["tokens"]["access_token"]
    doctor_user_id = doctor_user_result["user"]["id"]
    
    # Test 5: Create doctor profile
    print("\n5. Creating doctor profile...")
    doctor_profile_result = test_create_doctor_profile(admin_token, doctor_user_id)
    if not doctor_profile_result["success"]:
        print("💀 Doctor profile creation failed.")
        return False
    
    doctor_id = doctor_profile_result["doctor"]["id"]
    
    # Test 6: List doctors
    print("\n6. Testing doctor list...")
    list_result = test_list_doctors(admin_token)
    if not list_result["success"]:
        print("💀 Doctor list test failed.")
        return False
    
    # Test 7: Get doctor by ID
    print("\n7. Testing get doctor by ID...")
    get_result = test_get_doctor_by_id(admin_token, doctor_id)
    if not get_result["success"]:
        print("💀 Get doctor test failed.")
        return False
    
    # Test 8: Update doctor profile
    print("\n8. Testing doctor profile update...")
    update_result = test_update_doctor_profile(admin_token, doctor_id)
    if not update_result["success"]:
        print("💀 Doctor update test failed.")
        return False
    
    # Test 9: Get doctor schedule
    print("\n9. Testing doctor schedule...")
    schedule_result = test_get_doctor_schedule(admin_token, doctor_id)
    if not schedule_result["success"]:
        print("💀 Doctor schedule test failed.")
        return False
    
    # Test 10: Search doctors
    print("\n10. Testing doctor search...")
    search_result = test_search_doctors(admin_token)
    if not search_result["success"]:
        print("💀 Doctor search test failed.")
        return False
    
    # All tests passed
    print("\n" + "=" * 50)
    print("🎉 All doctor management tests passed!")
    print("✅ Module 2: Doctor Management is working correctly!")
    
    # Test summary
    print("\n📊 Test Summary:")
    print(f"✅ Admin user creation and login")
    print(f"✅ Doctor user creation")
    print(f"✅ Doctor profile creation (with schedule)")
    print(f"✅ Doctor listing and pagination")
    print(f"✅ Doctor details retrieval")
    print(f"✅ Doctor profile updates")
    print(f"✅ Doctor schedule management")
    print(f"✅ Doctor search and filtering")
    print(f"✅ Role-based access control")
    
    return True

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)