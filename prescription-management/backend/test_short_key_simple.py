#!/usr/bin/env python3
"""
Simple Short Key API Test
Tests short key CRUD operations and medicine management
"""

import requests
import json
import time

BASE_URL = "http://localhost:8000/api/v1"

def test_short_key_api():
    """Test short key API endpoints"""
    print("🧪 Starting Short Key API Tests...")
    
    # Step 1: Login as admin to get JWT token
    print("\n1️⃣ Logging in as admin...")
    login_data = {
        "email": "admin@example.com",
        "password": "admin123"
    }
    
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    if response.status_code != 200:
        print(f"❌ Login failed: {response.status_code} - {response.text}")
        return False
    
    auth_data = response.json()
    access_token = auth_data["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}
    print("✅ Admin login successful")
    
    # Step 2: Get some medicines first (we need them for short keys)
    print("\n2️⃣ Getting available medicines...")
    response = requests.get(f"{BASE_URL}/medicines/", headers=headers)
    if response.status_code != 200:
        print(f"❌ Failed to get medicines: {response.status_code}")
        return False
    
    medicines_data = response.json()
    medicines = medicines_data["medicines"]
    
    if len(medicines) < 2:
        print("❌ Need at least 2 medicines for testing")
        return False
    
    medicine_id_1 = medicines[0]["id"]
    medicine_id_2 = medicines[1]["id"]
    print(f"✅ Found medicines: {medicines[0]['name']}, {medicines[1]['name']}")
    
    # Step 3: Create test short keys
    print("\n3️⃣ Creating test short keys...")
    
    short_key_data_1 = {
        "code": f"FLU{int(time.time())}",
        "name": "Common Flu Treatment",
        "description": "Standard treatment for common flu symptoms",
        "is_global": True,
        "medicines": [
            {
                "medicine_id": medicine_id_1,
                "default_dosage": "500mg",
                "default_frequency": "Three times daily",
                "default_duration": "3-5 days",
                "default_instructions": "Take with food",
                "sequence_order": 1
            },
            {
                "medicine_id": medicine_id_2,
                "default_dosage": "250mg",
                "default_frequency": "Twice daily",
                "default_duration": "5 days",
                "default_instructions": "Complete the course",
                "sequence_order": 2
            }
        ]
    }
    
    short_key_data_2 = {
        "code": f"FEVER{int(time.time())}",
        "name": "Fever Management",
        "description": "Quick fever relief",
        "is_global": False,
        "medicines": [
            {
                "medicine_id": medicine_id_1,
                "default_dosage": "500mg",
                "default_frequency": "As needed",
                "default_duration": "3 days",
                "default_instructions": "Take when fever > 100°F",
                "sequence_order": 1
            }
        ]
    }
    
    # Create short keys
    short_key_ids = []
    short_key_codes = []
    for i, sk_data in enumerate([short_key_data_1, short_key_data_2], 1):
        response = requests.post(f"{BASE_URL}/short-keys/", json=sk_data, headers=headers)
        if response.status_code == 201:
            short_key = response.json()
            short_key_ids.append(short_key["id"])
            short_key_codes.append(short_key["code"])
            print(f"✅ Short key {i} created: {short_key['code']} (ID: {short_key['id']})")
        else:
            print(f"❌ Failed to create short key {i}: {response.status_code} - {response.text}")
            return False
    
    # Step 4: Test short key retrieval
    print("\n4️⃣ Testing short key retrieval...")
    
    # Get short key by ID
    response = requests.get(f"{BASE_URL}/short-keys/{short_key_ids[0]}", headers=headers)
    if response.status_code == 200:
        short_key = response.json()
        print(f"✅ Retrieved short key: {short_key['code']} with {len(short_key['medicines'])} medicines")
    else:
        print(f"❌ Failed to retrieve short key: {response.status_code}")
        return False
    
    # Get short key by code
    response = requests.get(f"{BASE_URL}/short-keys/code/{short_key_codes[0]}", headers=headers)
    if response.status_code == 200:
        short_key = response.json()
        print(f"✅ Retrieved short key by code: {short_key['code']}")
    else:
        print(f"❌ Failed to retrieve short key by code: {response.status_code}")
        return False
    
    # List short keys
    response = requests.get(f"{BASE_URL}/short-keys/", headers=headers)
    if response.status_code == 200:
        short_keys_list = response.json()
        print(f"✅ Listed short keys: {short_keys_list['total']} total")
    else:
        print(f"❌ Failed to list short keys: {response.status_code}")
        return False
    
    # Step 5: Test short key search
    print("\n5️⃣ Testing short key search...")
    
    # Search by query
    response = requests.get(f"{BASE_URL}/short-keys/?query=flu", headers=headers)
    if response.status_code == 200:
        search_results = response.json()
        print(f"✅ Search results: {search_results['total']} short keys found")
    else:
        print(f"❌ Failed to search short keys: {response.status_code}")
        return False
    
    # Step 6: Test short key update
    print("\n6️⃣ Testing short key update...")
    
    update_data = {
        "name": "Updated Flu Treatment",
        "description": "Updated description for flu treatment"
    }
    
    response = requests.put(f"{BASE_URL}/short-keys/{short_key_ids[0]}", json=update_data, headers=headers)
    if response.status_code == 200:
        updated_short_key = response.json()
        print(f"✅ Short key updated: name changed to '{updated_short_key['name']}'")
    else:
        print(f"❌ Failed to update short key: {response.status_code} - {response.text}")
        return False
    
    # Step 7: Test medicine management in short keys
    print("\n7️⃣ Testing medicine management in short keys...")
    
    # Try to add another medicine (should fail if medicine already exists)
    new_medicine_data = {
        "medicine_id": medicine_id_1,
        "default_dosage": "1000mg",
        "default_frequency": "Once daily",
        "default_duration": "7 days",
        "default_instructions": "Take with water",
        "sequence_order": 3
    }
    
    response = requests.post(f"{BASE_URL}/short-keys/{short_key_ids[1]}/medicines", json=new_medicine_data, headers=headers)
    if response.status_code == 409:  # Should conflict since medicine already exists
        print("✅ Correctly prevented duplicate medicine in short key")
    elif response.status_code == 201:
        print("✅ Medicine added to short key")
    else:
        print(f"❌ Unexpected response for adding medicine: {response.status_code}")
        return False
    
    # Step 8: Test short key usage
    print("\n8️⃣ Testing short key usage...")
    
    response = requests.post(f"{BASE_URL}/short-keys/use/{short_key_codes[0]}", headers=headers)
    if response.status_code == 200:
        usage_result = response.json()
        print(f"✅ Short key used: {len(usage_result['prescription_items'])} prescription items generated")
        print(f"   Usage count: {usage_result['short_key']['usage_count']}")
    else:
        print(f"❌ Failed to use short key: {response.status_code}")
        return False
    
    # Step 9: Test statistics
    print("\n9️⃣ Testing short key statistics...")
    
    response = requests.get(f"{BASE_URL}/short-keys/statistics/overview", headers=headers)
    if response.status_code == 200:
        stats = response.json()
        print(f"✅ Statistics retrieved: {stats['total_short_keys']} total short keys")
        print(f"   Personal: {stats['personal_short_keys']}, Global: {stats['global_short_keys']}")
    else:
        print(f"❌ Failed to get statistics: {response.status_code}")
        return False
    
    # Step 10: Test popular short keys
    print("\n🔟 Testing popular short keys...")
    
    response = requests.get(f"{BASE_URL}/short-keys/popular", headers=headers)
    if response.status_code == 200:
        popular_keys = response.json()
        print(f"✅ Popular short keys: {len(popular_keys)} keys retrieved")
    else:
        print(f"❌ Failed to get popular short keys: {response.status_code}")
        return False
    
    # Step 11: Test validation
    print("\n1️⃣1️⃣ Testing short key validation...")
    
    validation_data = {
        "code": short_key_codes[0]  # Should be invalid (already exists)
    }
    
    response = requests.post(f"{BASE_URL}/short-keys/validate", json=validation_data, headers=headers)
    if response.status_code == 200:
        validation_result = response.json()
        if not validation_result['is_valid']:
            print(f"✅ Validation correctly detected duplicate code")
            print(f"   Suggestions: {validation_result['suggestions']}")
        else:
            print("❌ Validation should have detected duplicate code")
            return False
    else:
        print(f"❌ Failed to validate short key: {response.status_code}")
        return False
    
    # Step 12: Test bulk operations
    print("\n1️⃣2️⃣ Testing bulk operations...")
    
    bulk_data = {
        "short_key_ids": [short_key_ids[1]],
        "operation": "deactivate"
    }
    
    response = requests.post(f"{BASE_URL}/short-keys/bulk", json=bulk_data, headers=headers)
    if response.status_code == 200:
        bulk_result = response.json()
        print(f"✅ Bulk operation: {bulk_result['successful']}/{bulk_result['total_requested']} successful")
    else:
        print(f"❌ Failed bulk operation: {response.status_code}")
        return False
    
    # Reactivate the short key
    response = requests.put(f"{BASE_URL}/short-keys/{short_key_ids[1]}/reactivate", headers=headers)
    if response.status_code == 200:
        print("✅ Short key reactivated successfully")
    else:
        print(f"❌ Failed to reactivate short key: {response.status_code}")
        return False
    
    print("\n🎉 All short key API tests passed!")
    return True

def main():
    """Main test function"""
    try:
        success = test_short_key_api()
        if success:
            print("\n✅ ALL TESTS PASSED - Short Key API is working correctly!")
        else:
            print("\n❌ SOME TESTS FAILED - Check the output above")
            exit(1)
    except Exception as e:
        print(f"\n💥 Test execution failed: {str(e)}")
        exit(1)

if __name__ == "__main__":
    main()