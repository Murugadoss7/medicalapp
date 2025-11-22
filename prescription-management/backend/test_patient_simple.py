#!/usr/bin/env python3
"""
Module 3: Patient Management - Comprehensive Test Suite
Tests composite key functionality, family registration, and all API endpoints
"""

import requests
import json
import time
from datetime import date, datetime
from typing import Dict, Any, Optional

BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api/v1"

class PatientTestRunner:
    """Test runner for Patient Management module with composite key support"""
    
    def __init__(self):
        self.admin_token = None
        self.staff_token = None
        self.doctor_token = None
        self.patient_token = None
        self.timestamp = int(time.time())
        
        # Test family data (unique per test run) - Indian mobile format
        mobile_suffix = str(self.timestamp)[-6:]  # Get last 6 digits
        self.family_mobile = f"9876{mobile_suffix}"  # Start with 9876 + 6 digits = 10 digit mobile
        self.test_patients = []
        
    def log_test_result(self, test_name: str, success: bool, details: str = ""):
        """Log test results with status"""
        status = "✅" if success else "❌"
        print(f"{status} {test_name}")
        if details:
            print(f"   {details}")
        if not success:
            print(f"💀 {test_name} failed.")
            return False
        return True
    
    def make_request(self, method: str, endpoint: str, data: Dict = None, token: str = None) -> Dict[str, Any]:
        """Make HTTP request with proper error handling"""
        headers = {"Content-Type": "application/json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        
        url = f"{API_BASE}{endpoint}"
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=headers, timeout=10)
            elif method.upper() == "POST":
                response = requests.post(url, headers=headers, json=data, timeout=10)
            elif method.upper() == "PUT":
                response = requests.put(url, headers=headers, json=data, timeout=10)
            elif method.upper() == "DELETE":
                response = requests.delete(url, headers=headers, timeout=10)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            return {
                "status_code": response.status_code,
                "data": response.json() if response.content else {},
                "success": 200 <= response.status_code < 300
            }
        except requests.exceptions.RequestException as e:
            return {
                "status_code": 0,
                "data": {"detail": str(e)},
                "success": False
            }
    
    def test_server_health(self) -> bool:
        """Test server health and endpoints"""
        print("1. Testing server health...")
        
        # Test health endpoint
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if not self.log_test_result("Health endpoint", response.status_code == 200):
            return False
        
        # Test API endpoints
        response = requests.get(f"{API_BASE}/", timeout=5)
        if response.status_code == 200:
            endpoints = response.json().get("endpoints", {})
            return self.log_test_result("Patient endpoints available", "patients" in endpoints)
        
        return False
    
    def create_test_users(self) -> bool:
        """Create test users for different roles"""
        print("\n2. Creating test users...")
        
        users = [
            {
                "email": f"admin.patient.test.{self.timestamp}@example.com",
                "password": "adminpassword123",
                "confirm_password": "adminpassword123",
                "first_name": "Admin",
                "last_name": "PatientTest",
                "role": "admin"
            },
            {
                "email": f"staff.patient.test.{self.timestamp}@example.com",
                "password": "staffpassword123",
                "confirm_password": "staffpassword123",
                "first_name": "Staff",
                "last_name": "PatientTest",
                "role": "nurse"
            },
            {
                "email": f"doctor.patient.test.{self.timestamp}@example.com",
                "password": "doctorpassword123",
                "confirm_password": "doctorpassword123",
                "first_name": "Doctor",
                "last_name": "PatientTest",
                "role": "doctor",
                "license_number": f"DOC{self.timestamp}",
                "specialization": "Family Medicine"
            }
        ]
        
        for user_data in users:
            result = self.make_request("POST", "/auth/register", user_data)
            if not self.log_test_result(f"Create {user_data['role']} user", result["success"]):
                return False
        
        return True
    
    def authenticate_users(self) -> bool:
        """Authenticate users and get tokens"""
        print("\n3. Authenticating users...")
        
        # Login admin
        admin_login = {
            "email": f"admin.patient.test.{self.timestamp}@example.com",
            "password": "adminpassword123"
        }
        result = self.make_request("POST", "/auth/login", admin_login)
        if not self.log_test_result("Admin login", result["success"]):
            return False
        self.admin_token = result["data"]["tokens"]["access_token"]
        
        # Login staff
        staff_login = {
            "email": f"staff.patient.test.{self.timestamp}@example.com",
            "password": "staffpassword123"
        }
        result = self.make_request("POST", "/auth/login", staff_login)
        if not self.log_test_result("Staff login", result["success"]):
            return False
        self.staff_token = result["data"]["tokens"]["access_token"]
        
        # Login doctor
        doctor_login = {
            "email": f"doctor.patient.test.{self.timestamp}@example.com",
            "password": "doctorpassword123"
        }
        result = self.make_request("POST", "/auth/login", doctor_login)
        if not self.log_test_result("Doctor login", result["success"]):
            return False
        self.doctor_token = result["data"]["tokens"]["access_token"]
        
        return True
    
    def test_create_primary_patient(self) -> bool:
        """Test creating primary family member (relationship: self)"""
        print("\n4. Testing primary patient creation...")
        
        primary_patient = {
            "mobile_number": self.family_mobile,
            "first_name": "John",
            "last_name": "Doe",
            "date_of_birth": "1980-05-15",
            "gender": "male",
            "email": "john.doe@example.com",
            "address": "123 Main Street, City, State",
            "relationship_to_primary": "self",
            "emergency_contact": {
                "name": "Jane Doe",
                "phone": "9876543211",
                "relationship": "spouse"
            },
            "notes": "Primary family member"
        }
        
        result = self.make_request("POST", "/patients/", primary_patient, self.staff_token)
        success = self.log_test_result("Create primary patient", result["success"], 
                                       f"Status: {result['status_code']}, Data: {result['data']}")
        
        if success:
            self.test_patients.append(result["data"])
            # Verify composite key structure
            patient = result["data"]
            composite_key_valid = (
                patient["mobile_number"] == self.family_mobile and
                patient["first_name"] == "John" and
                patient["relationship_to_primary"] == "self"
            )
            return self.log_test_result("Composite key validation", composite_key_valid)
        
        return False
    
    def test_create_family_members(self) -> bool:
        """Test creating family members (same mobile, different names)"""
        print("\n5. Testing family member creation...")
        
        family_members = [
            {
                "mobile_number": self.family_mobile,
                "first_name": "Jane",
                "last_name": "Doe",
                "date_of_birth": "1985-08-20",
                "gender": "female",
                "email": "jane.doe@example.com",
                "relationship_to_primary": "spouse",
                "primary_contact_mobile": self.family_mobile,
                "emergency_contact": {
                    "name": "John Doe",
                    "phone": self.family_mobile,
                    "relationship": "spouse"
                }
            },
            {
                "mobile_number": self.family_mobile,
                "first_name": "Alice",
                "last_name": "Doe",
                "date_of_birth": "2010-03-10",
                "gender": "female",
                "relationship_to_primary": "child",
                "primary_contact_mobile": self.family_mobile,
                "emergency_contact": {
                    "name": "John Doe",
                    "phone": self.family_mobile,
                    "relationship": "father"
                }
            },
            {
                "mobile_number": self.family_mobile,
                "first_name": "Bob",
                "last_name": "Doe",
                "date_of_birth": "2012-11-25",
                "gender": "male",
                "relationship_to_primary": "child",
                "primary_contact_mobile": self.family_mobile
            }
        ]
        
        for i, member_data in enumerate(family_members):
            result = self.make_request("POST", "/patients/", member_data, self.staff_token)
            if not self.log_test_result(f"Create family member {i+1} ({member_data['first_name']})", result["success"]):
                return False
            self.test_patients.append(result["data"])
        
        return True
    
    def test_composite_key_retrieval(self) -> bool:
        """Test retrieving patients by composite key"""
        print("\n6. Testing composite key retrieval...")
        
        # Test retrieving each patient by composite key
        for patient in self.test_patients:
            mobile = patient["mobile_number"]
            first_name = patient["first_name"]
            
            result = self.make_request("GET", f"/patients/{mobile}/{first_name}", token=self.staff_token)
            if not self.log_test_result(f"Get patient {mobile}-{first_name}", result["success"]):
                return False
            
            # Verify data consistency
            retrieved_patient = result["data"]
            data_consistent = (
                retrieved_patient["id"] == patient["id"] and
                retrieved_patient["mobile_number"] == mobile and
                retrieved_patient["first_name"] == first_name
            )
            if not self.log_test_result(f"Data consistency {first_name}", data_consistent):
                return False
        
        return True
    
    def test_family_operations(self) -> bool:
        """Test family-specific operations"""
        print("\n7. Testing family operations...")
        
        # Test get family members
        result = self.make_request("GET", f"/patients/families/{self.family_mobile}", token=self.staff_token)
        if not self.log_test_result("Get family members", result["success"]):
            return False
        
        family_data = result["data"]
        expected_count = len(self.test_patients)
        actual_count = family_data["total_members"]
        
        if not self.log_test_result("Family member count", actual_count == expected_count, f"Expected: {expected_count}, Got: {actual_count}"):
            return False
        
        # Verify primary member identification
        primary_member = family_data["primary_member"]
        if primary_member:
            primary_correct = (
                primary_member["relationship_to_primary"] == "self" and
                primary_member["first_name"] == "John"
            )
            if not self.log_test_result("Primary member identification", primary_correct):
                return False
        else:
            return self.log_test_result("Primary member found", False)
        
        # Test family eligibility check
        result = self.make_request("GET", f"/patients/families/{self.family_mobile}/eligibility", token=self.staff_token)
        if not self.log_test_result("Family eligibility check", result["success"]):
            return False
        
        return True
    
    def test_family_member_via_endpoint(self) -> bool:
        """Test adding family member via family endpoint"""
        print("\n8. Testing family member addition via family endpoint...")
        
        new_member = {
            "first_name": "Charlie",
            "last_name": "Doe",
            "date_of_birth": "2015-07-04",
            "gender": "male",
            "relationship_to_primary": "child",
            "primary_contact_mobile": self.family_mobile
        }
        
        result = self.make_request("POST", f"/patients/families/{self.family_mobile}", new_member, self.staff_token)
        success = self.log_test_result("Add family member via family endpoint", result["success"])
        
        if success:
            self.test_patients.append(result["data"])
            
            # Verify the member was added correctly
            charlie = result["data"]
            correct_addition = (
                charlie["mobile_number"] == self.family_mobile and
                charlie["first_name"] == "Charlie" and
                charlie["relationship_to_primary"] == "child"
            )
            return self.log_test_result("Family member addition verification", correct_addition)
        
        return False
    
    def test_patient_search_and_filtering(self) -> bool:
        """Test patient search and filtering capabilities"""
        print("\n9. Testing patient search and filtering...")
        
        # Test search by mobile number
        result = self.make_request("GET", f"/patients/?mobile_number={self.family_mobile}", token=self.staff_token)
        if not self.log_test_result("Search by mobile number", result["success"]):
            return False
        
        search_results = result["data"]["patients"]
        expected_count = len(self.test_patients)
        if not self.log_test_result("Mobile search count", len(search_results) == expected_count):
            return False
        
        # Test search by first name
        result = self.make_request("GET", "/patients/?first_name=John", token=self.staff_token)
        if not self.log_test_result("Search by first name", result["success"]):
            return False
        
        # Test search by relationship
        result = self.make_request("GET", "/patients/?relationship=child", token=self.staff_token)
        if not self.log_test_result("Search by relationship", result["success"]):
            return False
        
        # Test pagination
        result = self.make_request("GET", "/patients/?page=1&page_size=2", token=self.staff_token)
        if not self.log_test_result("Pagination test", result["success"]):
            return False
        
        pagination_data = result["data"]
        pagination_correct = (
            pagination_data["page"] == 1 and
            pagination_data["page_size"] == 2 and
            len(pagination_data["patients"]) <= 2
        )
        return self.log_test_result("Pagination structure", pagination_correct)
    
    def test_patient_updates(self) -> bool:
        """Test patient update operations"""
        print("\n10. Testing patient updates...")
        
        # Update John's information
        john_mobile = self.family_mobile
        john_name = "John"
        
        update_data = {
            "last_name": "Smith-Doe",
            "email": "john.smithdoe@example.com",
            "notes": "Updated patient information"
        }
        
        result = self.make_request("PUT", f"/patients/{john_mobile}/{john_name}", update_data, self.staff_token)
        if not self.log_test_result("Update patient information", result["success"]):
            return False
        
        # Verify update
        updated_patient = result["data"]
        update_successful = (
            updated_patient["last_name"] == "Smith-Doe" and
            updated_patient["email"] == "john.smithdoe@example.com" and
            updated_patient["notes"] == "Updated patient information"
        )
        
        return self.log_test_result("Update verification", update_successful)
    
    def test_search_by_alternative_methods(self) -> bool:
        """Test search by mobile and email endpoints"""
        print("\n11. Testing alternative search methods...")
        
        # Test search by mobile endpoint
        result = self.make_request("GET", f"/patients/search/mobile/{self.family_mobile}", token=self.staff_token)
        if not self.log_test_result("Search by mobile endpoint", result["success"]):
            return False
        
        mobile_results = result["data"]
        expected_count = len(self.test_patients)
        if not self.log_test_result("Mobile endpoint count", len(mobile_results) == expected_count):
            return False
        
        # Test search by email endpoint
        result = self.make_request("GET", "/patients/search/email/john.smithdoe@example.com", token=self.staff_token)
        if not self.log_test_result("Search by email endpoint", result["success"]):
            return False
        
        return True
    
    def test_patient_by_id(self) -> bool:
        """Test patient retrieval by UUID"""
        print("\n12. Testing patient retrieval by ID...")
        
        if self.test_patients:
            patient_id = self.test_patients[0]["id"]
            result = self.make_request("GET", f"/patients/id/{patient_id}", token=self.staff_token)
            success = self.log_test_result("Get patient by ID", result["success"])
            
            if success:
                id_patient = result["data"]
                id_match = id_patient["id"] == patient_id
                return self.log_test_result("ID retrieval verification", id_match)
        
        return False
    
    def test_validation_and_constraints(self) -> bool:
        """Test validation and business rule constraints"""
        print("\n13. Testing validation and constraints...")
        
        # Test duplicate patient creation (should fail)
        duplicate_patient = {
            "mobile_number": self.family_mobile,
            "first_name": "John",  # Already exists
            "last_name": "Duplicate",
            "date_of_birth": "1990-01-01",
            "gender": "male",
            "relationship_to_primary": "self"
        }
        
        result = self.make_request("POST", "/patients/", duplicate_patient, self.staff_token)
        duplicate_prevented = not result["success"]
        if not self.log_test_result("Duplicate patient prevention", duplicate_prevented):
            return False
        
        # Test family validation endpoint
        validation_request = {
            "mobile_number": self.family_mobile,
            "first_name": "NewMember",
            "relationship": "child"
        }
        
        result = self.make_request("POST", "/patients/validate-family", validation_request, self.staff_token)
        if not self.log_test_result("Family validation endpoint", result["success"]):
            return False
        
        validation_result = result["data"]
        return self.log_test_result("Validation response structure", "is_valid" in validation_result)
    
    def test_role_based_access(self) -> bool:
        """Test role-based access control"""
        print("\n14. Testing role-based access control...")
        
        # Test that different roles can access patient data
        test_cases = [
            ("Admin access", self.admin_token),
            ("Staff access", self.staff_token),
            ("Doctor access", self.doctor_token)
        ]
        
        for test_name, token in test_cases:
            result = self.make_request("GET", "/patients/", token=token)
            if not self.log_test_result(test_name, result["success"]):
                return False
        
        # Test admin-only operations (statistics)
        result = self.make_request("GET", "/patients/statistics/overview", token=self.admin_token)
        if not self.log_test_result("Admin statistics access", result["success"]):
            return False
        
        # Test non-admin cannot access statistics
        result = self.make_request("GET", "/patients/statistics/overview", token=self.staff_token)
        admin_only_enforced = result["status_code"] == 403
        return self.log_test_result("Admin-only enforcement", admin_only_enforced)
    
    def test_patient_deactivation(self) -> bool:
        """Test patient deactivation (admin only)"""
        print("\n15. Testing patient deactivation...")
        
        if len(self.test_patients) > 1:
            # Deactivate last family member (Charlie)
            charlie = self.test_patients[-1]
            mobile = charlie["mobile_number"]
            first_name = charlie["first_name"]
            
            result = self.make_request("DELETE", f"/patients/{mobile}/{first_name}", token=self.admin_token)
            if not self.log_test_result("Patient deactivation", result["success"]):
                return False
            
            # Verify patient is deactivated (should not appear in active search)
            result = self.make_request("GET", f"/patients/{mobile}/{first_name}", token=self.staff_token)
            deactivated = result["status_code"] == 404
            if not self.log_test_result("Deactivation verification", deactivated):
                return False
            
            # Test reactivation
            result = self.make_request("PUT", f"/patients/{mobile}/{first_name}/reactivate", token=self.admin_token)
            return self.log_test_result("Patient reactivation", result["success"])
        
        return self.log_test_result("Deactivation test skipped", True, "Not enough patients")
    
    def run_all_tests(self) -> bool:
        """Run all patient management tests"""
        print("🧪 Testing Module 3: Patient Management")
        print("=" * 50)
        
        test_methods = [
            self.test_server_health,
            self.create_test_users,
            self.authenticate_users,
            self.test_create_primary_patient,
            self.test_create_family_members,
            self.test_composite_key_retrieval,
            self.test_family_operations,
            self.test_family_member_via_endpoint,
            self.test_patient_search_and_filtering,
            self.test_patient_updates,
            self.test_search_by_alternative_methods,
            self.test_patient_by_id,
            self.test_validation_and_constraints,
            self.test_role_based_access,
            self.test_patient_deactivation
        ]
        
        all_passed = True
        for test_method in test_methods:
            try:
                if not test_method():
                    all_passed = False
                    break
            except Exception as e:
                print(f"❌ Test {test_method.__name__} failed with exception: {str(e)}")
                all_passed = False
                break
        
        print("\n" + "=" * 50)
        if all_passed:
            print("🎉 ALL PATIENT MANAGEMENT TESTS PASSED!")
            print("✅ Module 3: Patient Management is ready for production")
            print(f"✅ Total patients created: {len(self.test_patients)}")
            print(f"✅ Family mobile: {self.family_mobile}")
            print("✅ Composite key functionality working perfectly")
            print("✅ Family registration working perfectly")
            print("✅ All API endpoints functional")
        else:
            print("❌ SOME PATIENT MANAGEMENT TESTS FAILED")
            print("🔧 Please fix issues before proceeding")
        
        return all_passed


def main():
    """Main test execution"""
    test_runner = PatientTestRunner()
    success = test_runner.run_all_tests()
    return 0 if success else 1


if __name__ == "__main__":
    exit(main())