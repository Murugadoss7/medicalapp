#!/usr/bin/env python3
"""
Test script for Authentication API endpoints
Tests all authentication functionality including login, registration, token management
"""

import requests
import json
import sys
import os
from datetime import datetime

# Add app to path
sys.path.append(os.path.dirname(__file__))

# Configuration
BASE_URL = "http://localhost:8000"
API_V1 = "/api/v1"

class AuthAPITester:
    """Test class for authentication API"""
    
    def __init__(self):
        self.base_url = f"{BASE_URL}{API_V1}"
        self.session = requests.Session()
        self.test_user_data = {
            "email": "test.doctor@example.com",
            "password": "testpassword123",
            "confirm_password": "testpassword123",
            "first_name": "Test",
            "last_name": "Doctor",
            "role": "doctor",
            "license_number": "TEST123456",
            "specialization": "General Medicine"
        }
        self.access_token = None
        self.refresh_token = None
        self.user_id = None
    
    def test_server_health(self):
        """Test if server is running"""
        print("🔍 Testing server health...")
        
        try:
            response = self.session.get(f"{BASE_URL}/health")
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Server is healthy: {data['status']}")
                print(f"   Service: {data['service']}")
                print(f"   Version: {data['version']}")
                return True
            else:
                print(f"❌ Health check failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Cannot connect to server: {e}")
            return False
    
    def test_user_registration(self):
        """Test user registration"""
        print("\n👤 Testing user registration...")
        
        try:
            response = self.session.post(
                f"{self.base_url}/auth/register",
                json=self.test_user_data
            )
            
            if response.status_code == 200:
                data = response.json()
                self.user_id = data['id']
                print(f"✅ User registered successfully")
                print(f"   User ID: {data['id']}")
                print(f"   Email: {data['email']}")
                print(f"   Role: {data['role']}")
                print(f"   Full Name: {data['full_name']}")
                return True
            else:
                print(f"❌ Registration failed: {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data.get('detail', 'Unknown error')}")
                except:
                    print(f"   Raw response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Registration request failed: {e}")
            return False
    
    def test_user_login(self):
        """Test user login"""
        print("\n🔐 Testing user login...")
        
        try:
            login_data = {
                "email": self.test_user_data["email"],
                "password": self.test_user_data["password"]
            }
            
            response = self.session.post(
                f"{self.base_url}/auth/login",
                json=login_data
            )
            
            if response.status_code == 200:
                data = response.json()
                self.access_token = data['tokens']['access_token']
                self.refresh_token = data['tokens']['refresh_token']
                
                print(f"✅ Login successful")
                print(f"   User: {data['user']['full_name']}")
                print(f"   Role: {data['user']['role']}")
                print(f"   Permissions: {len(data['permissions'])} permissions")
                print(f"   Token expires in: {data['tokens']['expires_in']} seconds")
                return True
            else:
                print(f"❌ Login failed: {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data.get('detail', 'Unknown error')}")
                except:
                    print(f"   Raw response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Login request failed: {e}")
            return False
    
    def test_protected_endpoint(self):
        """Test accessing protected endpoint with token"""
        print("\n🛡️ Testing protected endpoint access...")
        
        if not self.access_token:
            print("❌ No access token available")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.access_token}"}
            
            response = self.session.get(
                f"{self.base_url}/auth/me",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Protected endpoint access successful")
                print(f"   User ID: {data['id']}")
                print(f"   Email: {data['email']}")
                print(f"   Role: {data['role']}")
                print(f"   Permissions: {len(data['permissions'])} permissions")
                return True
            else:
                print(f"❌ Protected endpoint access failed: {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data.get('detail', 'Unknown error')}")
                except:
                    print(f"   Raw response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Protected endpoint request failed: {e}")
            return False
    
    def test_token_refresh(self):
        """Test token refresh"""
        print("\n🔄 Testing token refresh...")
        
        if not self.refresh_token:
            print("❌ No refresh token available")
            return False
        
        try:
            refresh_data = {"refresh_token": self.refresh_token}
            
            response = self.session.post(
                f"{self.base_url}/auth/refresh",
                json=refresh_data
            )
            
            if response.status_code == 200:
                data = response.json()
                new_access_token = data['access_token']
                new_refresh_token = data['refresh_token']
                
                print(f"✅ Token refresh successful")
                print(f"   New access token received")
                print(f"   New refresh token received")
                print(f"   Token type: {data['token_type']}")
                print(f"   Expires in: {data['expires_in']} seconds")
                
                # Update tokens
                self.access_token = new_access_token
                self.refresh_token = new_refresh_token
                return True
            else:
                print(f"❌ Token refresh failed: {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data.get('detail', 'Unknown error')}")
                except:
                    print(f"   Raw response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Token refresh request failed: {e}")
            return False
    
    def test_user_permissions(self):
        """Test user permissions endpoint"""
        print("\n🔑 Testing user permissions...")
        
        if not self.access_token:
            print("❌ No access token available")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.access_token}"}
            
            response = self.session.get(
                f"{self.base_url}/auth/permissions",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Permissions retrieved successfully")
                print(f"   User ID: {data['user_id']}")
                print(f"   Role: {data['role']}")
                print(f"   Permissions ({len(data['permissions'])}):")
                for permission in data['permissions'][:5]:  # Show first 5
                    print(f"     - {permission}")
                if len(data['permissions']) > 5:
                    print(f"     ... and {len(data['permissions']) - 5} more")
                return True
            else:
                print(f"❌ Permissions request failed: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Permissions request failed: {e}")
            return False
    
    def test_user_profile_update(self):
        """Test user profile update"""
        print("\n✏️ Testing user profile update...")
        
        if not self.access_token:
            print("❌ No access token available")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.access_token}"}
            update_data = {
                "first_name": "Updated",
                "last_name": "TestDoctor"
            }
            
            response = self.session.put(
                f"{self.base_url}/users/me",
                headers=headers,
                json=update_data
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Profile updated successfully")
                print(f"   Updated name: {data['full_name']}")
                print(f"   Email: {data['email']}")
                return True
            else:
                print(f"❌ Profile update failed: {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data.get('detail', 'Unknown error')}")
                except:
                    print(f"   Raw response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Profile update request failed: {e}")
            return False
    
    def test_invalid_token(self):
        """Test invalid token handling"""
        print("\n🚫 Testing invalid token handling...")
        
        try:
            headers = {"Authorization": "Bearer invalid_token_here"}
            
            response = self.session.get(
                f"{self.base_url}/auth/me",
                headers=headers
            )
            
            if response.status_code == 401:
                print(f"✅ Invalid token correctly rejected")
                return True
            else:
                print(f"❌ Invalid token not rejected: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Invalid token test failed: {e}")
            return False
    
    def test_logout(self):
        """Test user logout"""
        print("\n👋 Testing user logout...")
        
        if not self.access_token:
            print("❌ No access token available")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.access_token}"}
            logout_data = {"refresh_token": self.refresh_token}
            
            response = self.session.post(
                f"{self.base_url}/auth/logout",
                headers=headers,
                json=logout_data
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Logout successful")
                print(f"   Message: {data['message']}")
                return True
            else:
                print(f"❌ Logout failed: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Logout request failed: {e}")
            return False
    
    def run_all_tests(self):
        """Run all authentication tests"""
        print("🧪 Starting Authentication API Tests")
        print("=" * 60)
        
        tests = [
            ("Server Health", self.test_server_health),
            ("User Registration", self.test_user_registration),
            ("User Login", self.test_user_login),
            ("Protected Endpoint", self.test_protected_endpoint),
            ("Token Refresh", self.test_token_refresh),
            ("User Permissions", self.test_user_permissions),
            ("Profile Update", self.test_user_profile_update),
            ("Invalid Token", self.test_invalid_token),
            ("User Logout", self.test_logout)
        ]
        
        passed = 0
        failed = 0
        
        for test_name, test_func in tests:
            try:
                if test_func():
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                print(f"❌ Test {test_name} crashed: {e}")
                failed += 1
        
        print("\n" + "=" * 60)
        print(f"🧪 Test Results: {passed} passed, {failed} failed")
        
        if failed == 0:
            print("🎉 All authentication tests passed!")
            print("✅ Module 1: User/Authentication API is working correctly")
        else:
            print("⚠️ Some tests failed. Please check the implementation.")
        
        return failed == 0


def main():
    """Run authentication API tests"""
    tester = AuthAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()