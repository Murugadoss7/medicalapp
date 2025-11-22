#!/usr/bin/env python3
"""
Simple authentication test script to validate Module 1: Authentication
Tests basic authentication functionality without complex test setup
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

def test_user_registration() -> Dict[str, Any]:
    """Test user registration endpoint"""
    import time
    # Use timestamp to ensure unique email
    timestamp = int(time.time())
    registration_data = {
        "email": f"test.doctor.{timestamp}@example.com",
        "password": "testpassword123",
        "confirm_password": "testpassword123", 
        "first_name": "Test",
        "last_name": "Doctor",
        "role": "doctor",
        "license_number": "TEST123456",
        "specialization": "General Medicine"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/v1/auth/register",
            json=registration_data,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ User registration successful: {data['email']}")
            return {"success": True, "data": data}
        else:
            print(f"❌ Registration failed: {response.status_code} - {response.text}")
            return {"success": False, "error": response.text}
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Registration request failed: {e}")
        return {"success": False, "error": str(e)}

def test_user_login(email: str, password: str) -> Dict[str, Any]:
    """Test user login endpoint"""
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
            print(f"✅ User login successful: {data['user']['email']}")
            return {"success": True, "data": data}
        else:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            return {"success": False, "error": response.text}
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Login request failed: {e}")
        return {"success": False, "error": str(e)}

def test_protected_endpoint(access_token: str) -> bool:
    """Test protected endpoint with access token"""
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/v1/auth/me",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Protected endpoint access successful: {data['email']}")
            return True
        else:
            print(f"❌ Protected endpoint failed: {response.status_code} - {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Protected endpoint request failed: {e}")
        return False

def main():
    """Run comprehensive authentication tests"""
    print("🔧 Testing Module 1: User/Authentication")
    print("=" * 50)
    
    # Test 1: Server health
    print("\n1. Testing server health...")
    if not test_server_health():
        print("💀 Server not running. Please start the server first.")
        return False
    
    # Test 2: User registration
    print("\n2. Testing user registration...")
    register_result = test_user_registration()
    if not register_result["success"]:
        print("💀 Registration test failed.")
        return False
    
    # Test 3: User login
    print("\n3. Testing user login...")
    registered_email = register_result["data"]["email"]
    login_result = test_user_login(registered_email, "testpassword123")
    if not login_result["success"]:
        print("💀 Login test failed.")
        return False
    
    # Test 4: Protected endpoint access
    print("\n4. Testing protected endpoint...")
    access_token = login_result["data"]["tokens"]["access_token"]
    if not test_protected_endpoint(access_token):
        print("💀 Protected endpoint test failed.")
        return False
    
    # All tests passed
    print("\n" + "=" * 50)
    print("🎉 All authentication tests passed!")
    print("✅ Module 1: User/Authentication is working correctly!")
    return True

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
