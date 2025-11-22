#!/usr/bin/env python3
"""
System Verification Script
Run this when starting a new context to verify all completed modules are working
"""

import requests
import subprocess
import sys
import time

BASE_URL = "http://localhost:8000"

def check_docker_containers():
    """Check if required Docker containers are running"""
    print("🐳 Checking Docker containers...")
    try:
        result = subprocess.run(['docker', 'ps'], capture_output=True, text=True)
        if 'test-postgres-fresh' in result.stdout and 'test-redis-fresh' in result.stdout:
            print("✅ PostgreSQL and Redis containers are running")
            return True
        else:
            print("❌ Required containers not found. Please start docker containers.")
            return False
    except Exception as e:
        print(f"❌ Docker check failed: {e}")
        return False

def check_server_health():
    """Check if FastAPI server is running"""
    print("🔧 Checking server health...")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Server healthy: {data['status']}")
            return True
        else:
            print(f"❌ Server unhealthy: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Server not reachable: {e}")
        return False

def check_api_endpoints():
    """Check if all implemented endpoints are available"""
    print("🔗 Checking API endpoints...")
    try:
        response = requests.get(f"{BASE_URL}/api/v1/", timeout=5)
        if response.status_code == 200:
            data = response.json()
            endpoints = data.get('endpoints', {})
            print(f"✅ API endpoints available: {list(endpoints.keys())}")
            return True
        else:
            print(f"❌ API endpoints check failed: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ API endpoints not reachable: {e}")
        return False

def run_auth_tests():
    """Run authentication module tests"""
    print("🔐 Running authentication tests...")
    try:
        result = subprocess.run(['python', 'test_auth_simple.py'], 
                              capture_output=True, text=True, timeout=60)
        if result.returncode == 0:
            print("✅ Authentication tests passed")
            return True
        else:
            print(f"❌ Authentication tests failed:\n{result.stdout}\n{result.stderr}")
            return False
    except subprocess.TimeoutExpired:
        print("❌ Authentication tests timed out")
        return False
    except Exception as e:
        print(f"❌ Authentication tests error: {e}")
        return False

def run_doctor_tests():
    """Run doctor management module tests"""
    print("🩺 Running doctor management tests...")
    try:
        result = subprocess.run(['python', 'test_doctor_simple.py'], 
                              capture_output=True, text=True, timeout=60)
        if result.returncode == 0:
            print("✅ Doctor management tests passed")
            return True
        else:
            print(f"❌ Doctor management tests failed:\n{result.stdout}\n{result.stderr}")
            return False
    except subprocess.TimeoutExpired:
        print("❌ Doctor management tests timed out")
        return False
    except Exception as e:
        print(f"❌ Doctor management tests error: {e}")
        return False

def check_database_connectivity():
    """Check database connectivity"""
    print("🗄️ Checking database connectivity...")
    try:
        result = subprocess.run([
            'docker', 'exec', 'test-postgres-fresh', 
            'psql', '-U', 'prescription_user', '-d', 'prescription_management', 
            '-c', 'SELECT COUNT(*) FROM users;'
        ], capture_output=True, text=True, timeout=10)
        
        if result.returncode == 0:
            print("✅ Database connectivity confirmed")
            return True
        else:
            print(f"❌ Database connectivity failed: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ Database check error: {e}")
        return False

def show_system_status():
    """Show current system status"""
    print("\n" + "="*60)
    print("📊 SYSTEM STATUS SUMMARY")
    print("="*60)
    print("✅ Module 1: User/Authentication - PRODUCTION READY")
    print("✅ Module 2: Doctor Management - PRODUCTION READY")
    print("⏳ Module 3: Patient Management - NEXT TO IMPLEMENT")
    print("⏳ Module 4: Medicine/ShortKey - PENDING")
    print("⏳ Module 5: Appointment - PENDING")
    print("⏳ Module 6: Prescription - PENDING")
    print("="*60)
    print("🎯 READY TO START: Module 3 - Patient Management")
    print("📋 KEY CHALLENGE: Composite key (mobile_number + first_name)")
    print("📚 REFERENCE: CONTEXT_RESTORATION.md")
    print("="*60)

def main():
    """Run complete system verification"""
    print("🔧 PRESCRIPTION MANAGEMENT SYSTEM - VERIFICATION")
    print("="*60)
    
    all_checks = [
        check_docker_containers(),
        check_server_health(),
        check_api_endpoints(),
        check_database_connectivity(),
        run_auth_tests(),
        run_doctor_tests()
    ]
    
    if all(all_checks):
        print("\n🎉 ALL VERIFICATIONS PASSED!")
        print("✅ System is ready for continued development")
        show_system_status()
        return True
    else:
        print("\n❌ SOME VERIFICATIONS FAILED")
        print("🔧 Please fix issues before continuing development")
        failed_count = len([check for check in all_checks if not check])
        print(f"📊 {len(all_checks) - failed_count}/{len(all_checks)} checks passed")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)