#!/usr/bin/env python3
"""
Simple Appointment Management API Test
Tests all appointment endpoints for basic functionality
"""

import sys
import os
import requests
import json
from datetime import datetime, date, time, timedelta
import uuid
import time as time_module

# Add app directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api/v1"

class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_colored(message, color):
    print(f"{color}{message}{Colors.ENDC}")

def print_test_header(test_name):
    print(f"\n{Colors.HEADER}{'='*60}{Colors.ENDC}")
    print(f"{Colors.HEADER}{test_name.center(60)}{Colors.ENDC}")
    print(f"{Colors.HEADER}{'='*60}{Colors.ENDC}")

def print_test_result(test_name, success, message=""):
    if success:
        print_colored(f"✅ {test_name} - PASSED {message}", Colors.OKGREEN)
    else:
        print_colored(f"❌ {test_name} - FAILED {message}", Colors.FAIL)

def make_request(method, endpoint, data=None, headers=None, params=None):
    """Make HTTP request with error handling"""
    url = f"{API_BASE}{endpoint}"
    
    try:
        if method.upper() == "GET":
            response = requests.get(url, headers=headers, params=params, timeout=10)
        elif method.upper() == "POST":
            response = requests.post(url, json=data, headers=headers, params=params, timeout=10)
        elif method.upper() == "PUT":
            response = requests.put(url, json=data, headers=headers, params=params, timeout=10)
        elif method.upper() == "DELETE":
            response = requests.delete(url, headers=headers, params=params, timeout=10)
        else:
            return None, f"Unsupported method: {method}"
        
        return response, None
    except requests.exceptions.RequestException as e:
        return None, str(e)

def login_user():
    """Login and get access token"""
    login_data = {
        "email": "admin@example.com",
        "password": "admin123"
    }
    
    response, error = make_request("POST", "/auth/login", login_data)
    
    if error:
        print_colored(f"❌ Login failed: {error}", Colors.FAIL)
        return None
    
    if response.status_code == 200:
        token_data = response.json()
        print_colored("✅ Login successful", Colors.OKGREEN)
        return token_data["tokens"]["access_token"]
    else:
        print_colored(f"❌ Login failed: {response.status_code} - {response.text}", Colors.FAIL)
        return None

def get_test_data(token):
    """Get test data (doctors, patients) for appointments"""
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get doctors
    response, error = make_request("GET", "/doctors/", headers=headers)
    if error or response.status_code != 200:
        print_colored(f"❌ Could not fetch doctors: {error or response.text}", Colors.FAIL)
        return None, None
    
    doctors = response.json().get("doctors", [])
    if not doctors:
        print_colored("❌ No doctors found", Colors.FAIL)
        return None, None
    
    # Get patients
    response, error = make_request("GET", "/patients/", headers=headers)
    if error or response.status_code != 200:
        print_colored(f"❌ Could not fetch patients: {error or response.text}", Colors.FAIL)
        return None, None
    
    patients = response.json().get("patients", [])
    if not patients:
        print_colored("❌ No patients found", Colors.FAIL)
        return None, None
    
    print_colored(f"✅ Test data ready: {len(doctors)} doctors, {len(patients)} patients", Colors.OKGREEN)
    return doctors[0], patients[0]

def run_appointment_tests():
    """Run comprehensive appointment API tests"""
    print_colored("🚀 Starting Appointment Management API Tests", Colors.HEADER)
    
    # Login
    print_test_header("Authentication")
    token = login_user()
    if not token:
        print_colored("❌ Cannot proceed without authentication", Colors.FAIL)
        return False
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get test data
    print_test_header("Test Data Setup")
    doctor, patient = get_test_data(token)
    if not doctor or not patient:
        print_colored("❌ Cannot proceed without test data", Colors.FAIL)
        return False
    
    created_appointments = []
    all_tests_passed = True
    
    try:
        # Test 1: Create appointment
        print_test_header("Create Appointment")
        
        # Calculate future date
        appointment_date = (datetime.now() + timedelta(days=3)).date()
        appointment_time = time(14, 30)  # 2:30 PM
        
        appointment_data = {
            "patient_mobile_number": patient["mobile_number"],
            "patient_first_name": patient["first_name"],
            "patient_uuid": patient["id"],
            "doctor_id": doctor["id"],
            "appointment_date": appointment_date.isoformat(),
            "appointment_time": appointment_time.isoformat(),
            "reason_for_visit": "Regular checkup and consultation",
            "notes": "Patient prefers afternoon appointments",
            "duration_minutes": 30,
            "contact_number": patient["mobile_number"]
        }
        
        response, error = make_request("POST", "/appointments/", appointment_data, headers)
        
        if error:
            print_test_result("Create appointment", False, f"Request error: {error}")
            all_tests_passed = False
        elif response.status_code == 201:
            appointment = response.json()
            created_appointments.append(appointment)
            print_test_result("Create appointment", True, f"ID: {appointment['id'][:8]}...")
            print_colored(f"   📋 Appointment Number: {appointment['appointment_number']}", Colors.OKBLUE)
            print_colored(f"   📅 Date: {appointment['appointment_date']} {appointment['appointment_time']}", Colors.OKBLUE)
        else:
            print_test_result("Create appointment", False, f"Status: {response.status_code}, Body: {response.text}")
            all_tests_passed = False
        
        # Test 2: Get appointment by ID
        print_test_header("Get Appointment by ID")
        
        if created_appointments:
            appointment_id = created_appointments[0]["id"]
            response, error = make_request("GET", f"/appointments/{appointment_id}", headers=headers)
            
            if error:
                print_test_result("Get appointment by ID", False, f"Request error: {error}")
                all_tests_passed = False
            elif response.status_code == 200:
                appointment = response.json()
                print_test_result("Get appointment by ID", True, f"Retrieved: {appointment['appointment_number']}")
            else:
                print_test_result("Get appointment by ID", False, f"Status: {response.status_code}")
                all_tests_passed = False
        
        # Test 3: Get appointment by number
        print_test_header("Get Appointment by Number")
        
        if created_appointments:
            appointment_number = created_appointments[0]["appointment_number"]
            response, error = make_request("GET", f"/appointments/number/{appointment_number}", headers=headers)
            
            if error:
                print_test_result("Get appointment by number", False, f"Request error: {error}")
                all_tests_passed = False
            elif response.status_code == 200:
                appointment = response.json()
                print_test_result("Get appointment by number", True, f"Found: {appointment['id'][:8]}...")
            else:
                print_test_result("Get appointment by number", False, f"Status: {response.status_code}")
                all_tests_passed = False
        
        # Test 4: List appointments
        print_test_header("List Appointments")
        
        response, error = make_request("GET", "/appointments/", headers=headers)
        
        if error:
            print_test_result("List appointments", False, f"Request error: {error}")
            all_tests_passed = False
        elif response.status_code == 200:
            appointments_list = response.json()
            print_test_result("List appointments", True, f"Found {appointments_list['total']} appointments")
            print_colored(f"   📊 Page: {appointments_list['page']}, Total Pages: {appointments_list['total_pages']}", Colors.OKBLUE)
        else:
            print_test_result("List appointments", False, f"Status: {response.status_code}")
            all_tests_passed = False
        
        # Test 5: Search appointments with filters
        print_test_header("Search Appointments with Filters")
        
        search_params = {
            "doctor_id": doctor["id"],
            "is_upcoming": True,
            "page_size": 10
        }
        
        response, error = make_request("GET", "/appointments/", headers=headers, params=search_params)
        
        if error:
            print_test_result("Search appointments", False, f"Request error: {error}")
            all_tests_passed = False
        elif response.status_code == 200:
            appointments_list = response.json()
            print_test_result("Search appointments", True, f"Found {appointments_list['total']} upcoming appointments for doctor")
        else:
            print_test_result("Search appointments", False, f"Status: {response.status_code}")
            all_tests_passed = False
        
        # Test 6: Update appointment
        print_test_header("Update Appointment")
        
        if created_appointments:
            appointment_id = created_appointments[0]["id"]
            update_data = {
                "notes": "Updated notes - Patient requested morning slot",
                "duration_minutes": 45
            }
            
            response, error = make_request("PUT", f"/appointments/{appointment_id}", update_data, headers)
            
            if error:
                print_test_result("Update appointment", False, f"Request error: {error}")
                all_tests_passed = False
            elif response.status_code == 200:
                updated_appointment = response.json()
                print_test_result("Update appointment", True, f"Duration: {updated_appointment['duration_minutes']} min")
            else:
                print_test_result("Update appointment", False, f"Status: {response.status_code}, Body: {response.text}")
                all_tests_passed = False
        
        # Test 7: Check appointment conflicts
        print_test_header("Check Appointment Conflicts")
        
        conflict_data = {
            "doctor_id": doctor["id"],
            "appointment_date": appointment_date.isoformat(),
            "appointment_time": appointment_time.isoformat(),
            "duration_minutes": 30
        }
        
        response, error = make_request("POST", "/appointments/conflicts/check", conflict_data, headers)
        
        if error:
            print_test_result("Check conflicts", False, f"Request error: {error}")
            all_tests_passed = False
        elif response.status_code == 200:
            conflict_result = response.json()
            has_conflict = conflict_result["has_conflict"]
            print_test_result("Check conflicts", True, f"Has conflict: {has_conflict}")
            if has_conflict:
                print_colored(f"   🔍 Conflicting appointments: {len(conflict_result['conflicting_appointments'])}", Colors.WARNING)
        else:
            print_test_result("Check conflicts", False, f"Status: {response.status_code}")
            all_tests_passed = False
        
        # Test 8: Get doctor's schedule
        print_test_header("Get Doctor Schedule")
        
        response, error = make_request("GET", f"/appointments/schedule/{doctor['id']}/{appointment_date}", headers=headers)
        
        if error:
            print_test_result("Get doctor schedule", False, f"Request error: {error}")
            all_tests_passed = False
        elif response.status_code == 200:
            schedule = response.json()
            print_test_result("Get doctor schedule", True, f"Appointments: {schedule['total_appointments']}")
            print_colored(f"   📅 Date: {schedule['schedule_date']}", Colors.OKBLUE)
        else:
            print_test_result("Get doctor schedule", False, f"Status: {response.status_code}")
            all_tests_passed = False
        
        # Test 9: Get available time slots
        print_test_header("Get Available Time Slots")
        
        response, error = make_request("GET", f"/appointments/availability/{doctor['id']}/{appointment_date}", headers=headers)
        
        if error:
            print_test_result("Get available slots", False, f"Request error: {error}")
            all_tests_passed = False
        elif response.status_code == 200:
            availability = response.json()
            available_count = sum(1 for slot in availability["available_slots"] if slot["is_available"])
            print_test_result("Get available slots", True, f"Available: {available_count} slots")
        else:
            print_test_result("Get available slots", False, f"Status: {response.status_code}")
            all_tests_passed = False
        
        # Test 10: Get patient appointments
        print_test_header("Get Patient Appointments")
        
        mobile = patient["mobile_number"]
        first_name = patient["first_name"]
        
        response, error = make_request("GET", f"/appointments/patient/{mobile}/{first_name}", headers=headers)
        
        if error:
            print_test_result("Get patient appointments", False, f"Request error: {error}")
            all_tests_passed = False
        elif response.status_code == 200:
            patient_history = response.json()
            print_test_result("Get patient appointments", True, f"History: {patient_history['total_appointments']} appointments")
        else:
            print_test_result("Get patient appointments", False, f"Status: {response.status_code}")
            all_tests_passed = False
        
        # Test 11: Update appointment status
        print_test_header("Update Appointment Status")
        
        if created_appointments:
            appointment_id = created_appointments[0]["id"]
            status_data = {
                "status": "confirmed",
                "notes": "Patient confirmed attendance"
            }
            
            response, error = make_request("PUT", f"/appointments/{appointment_id}/status", status_data, headers)
            
            if error:
                print_test_result("Update status", False, f"Request error: {error}")
                all_tests_passed = False
            elif response.status_code == 200:
                updated_appointment = response.json()
                print_test_result("Update status", True, f"New status: {updated_appointment['status']}")
            else:
                print_test_result("Update status", False, f"Status: {response.status_code}, Body: {response.text}")
                all_tests_passed = False
        
        # Test 12: Reschedule appointment
        print_test_header("Reschedule Appointment")
        
        if created_appointments:
            appointment_id = created_appointments[0]["id"]
            new_date = (datetime.now() + timedelta(days=5)).date()
            reschedule_data = {
                "appointment_date": new_date.isoformat(),
                "appointment_time": "10:00:00",
                "reason": "Patient requested earlier time"
            }
            
            response, error = make_request("POST", f"/appointments/{appointment_id}/reschedule", reschedule_data, headers)
            
            if error:
                print_test_result("Reschedule appointment", False, f"Request error: {error}")
                all_tests_passed = False
            elif response.status_code == 200:
                rescheduled_appointment = response.json()
                print_test_result("Reschedule appointment", True, f"New date: {rescheduled_appointment['appointment_date']}")
            else:
                print_test_result("Reschedule appointment", False, f"Status: {response.status_code}, Body: {response.text}")
                all_tests_passed = False
        
        # Test 13: Get appointment statistics
        print_test_header("Get Appointment Statistics")
        
        response, error = make_request("GET", "/appointments/statistics/overview", headers=headers)
        
        if error:
            print_test_result("Get statistics", False, f"Request error: {error}")
            all_tests_passed = False
        elif response.status_code == 200:
            stats = response.json()
            print_test_result("Get statistics", True, f"Total: {stats['total_appointments']} appointments")
            print_colored(f"   📊 Scheduled: {stats['scheduled_appointments']}, Confirmed: {stats['confirmed_appointments']}", Colors.OKBLUE)
        else:
            print_test_result("Get statistics", False, f"Status: {response.status_code}")
            all_tests_passed = False
        
        # Test 14: Bulk operations (if we have multiple appointments)
        if len(created_appointments) >= 1:
            print_test_header("Bulk Operations")
            
            bulk_data = {
                "appointment_ids": [app["id"] for app in created_appointments],
                "operation": "confirm",
                "notes": "Bulk confirmation test"
            }
            
            response, error = make_request("POST", "/appointments/bulk", bulk_data, headers)
            
            if error:
                print_test_result("Bulk operations", False, f"Request error: {error}")
                all_tests_passed = False
            elif response.status_code == 200:
                bulk_result = response.json()
                print_test_result("Bulk operations", True, f"Success: {bulk_result['successful']}/{bulk_result['total_requested']}")
            else:
                print_test_result("Bulk operations", False, f"Status: {response.status_code}")
                all_tests_passed = False
        
        # Test 15: Cancel appointment (cleanup)
        print_test_header("Cancel Appointment (Cleanup)")
        
        if created_appointments:
            appointment_id = created_appointments[0]["id"]
            params = {"reason": "Test cleanup"}
            
            response, error = make_request("DELETE", f"/appointments/{appointment_id}", headers=headers, params=params)
            
            if error:
                print_test_result("Cancel appointment", False, f"Request error: {error}")
                all_tests_passed = False
            elif response.status_code == 204:
                print_test_result("Cancel appointment", True, "Successfully cancelled")
            else:
                print_test_result("Cancel appointment", False, f"Status: {response.status_code}")
                all_tests_passed = False
    
    except Exception as e:
        print_colored(f"❌ Test suite failed with exception: {str(e)}", Colors.FAIL)
        all_tests_passed = False
    
    # Final results
    print_test_header("Test Results Summary")
    
    if all_tests_passed:
        print_colored("🎉 All appointment API tests PASSED!", Colors.OKGREEN)
        print_colored("✅ Appointment management system is working correctly", Colors.OKGREEN)
    else:
        print_colored("❌ Some appointment API tests FAILED!", Colors.FAIL)
        print_colored("🔧 Please check the error messages above", Colors.WARNING)
    
    return all_tests_passed

if __name__ == "__main__":
    # Check if server is running
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code != 200:
            print_colored("❌ Server health check failed", Colors.FAIL)
            sys.exit(1)
    except requests.exceptions.RequestException:
        print_colored("❌ Cannot connect to server. Make sure the server is running on http://localhost:8000", Colors.FAIL)
        sys.exit(1)
    
    # Run tests
    success = run_appointment_tests()
    sys.exit(0 if success else 1)