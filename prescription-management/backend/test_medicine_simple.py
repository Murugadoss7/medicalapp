#!/usr/bin/env python3
"""
Simple Medicine API Test
Tests medicine CRUD operations and drug interaction checking
"""

import requests
import json
import time
from decimal import Decimal

BASE_URL = "http://localhost:8000/api/v1"

def test_medicine_api():
    """Test medicine API endpoints"""
    print("🧪 Starting Medicine API Tests...")
    
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
    
    # Step 2: Create test medicines
    print("\n2️⃣ Creating test medicines...")
    
    medicine_data_1 = {
        "name": f"Paracetamol-{int(time.time())}",
        "generic_name": "Acetaminophen",
        "composition": "Paracetamol 500mg",
        "manufacturer": "ABC Pharmaceuticals",
        "dosage_forms": ["tablet", "syrup"],
        "strength": "500mg",
        "drug_category": "analgesic",
        "price": 25.50,
        "requires_prescription": False,
        "atc_code": "N02BE01",
        "storage_conditions": "Store below 30°C in dry place",
        "contraindications": "Hypersensitivity to paracetamol",
        "side_effects": "Rare: skin rash, nausea"
    }
    
    medicine_data_2 = {
        "name": f"Amoxicillin-{int(time.time())}",
        "generic_name": "Amoxicillin",
        "composition": "Amoxicillin 250mg",
        "manufacturer": "XYZ Pharma",
        "dosage_forms": ["capsule", "suspension"],
        "strength": "250mg",
        "drug_category": "antibiotic",
        "price": 45.00,
        "requires_prescription": True,
        "atc_code": "J01CA04",
        "storage_conditions": "Store in refrigerator",
        "contraindications": "Penicillin allergy",
        "side_effects": "Nausea, diarrhea, allergic reactions"
    }
    
    # Create medicines
    medicine_ids = []
    for i, med_data in enumerate([medicine_data_1, medicine_data_2], 1):
        response = requests.post(f"{BASE_URL}/medicines/", json=med_data, headers=headers)
        if response.status_code == 201:
            medicine = response.json()
            medicine_ids.append(medicine["id"])
            print(f"✅ Medicine {i} created: {medicine['name']} (ID: {medicine['id']})")
        else:
            print(f"❌ Failed to create medicine {i}: {response.status_code} - {response.text}")
            return False
    
    # Step 3: Test medicine retrieval
    print("\n3️⃣ Testing medicine retrieval...")
    
    # Get medicine by ID
    response = requests.get(f"{BASE_URL}/medicines/{medicine_ids[0]}", headers=headers)
    if response.status_code == 200:
        medicine = response.json()
        print(f"✅ Retrieved medicine: {medicine['name']}")
    else:
        print(f"❌ Failed to retrieve medicine: {response.status_code}")
        return False
    
    # List medicines
    response = requests.get(f"{BASE_URL}/medicines/", headers=headers)
    if response.status_code == 200:
        medicines_list = response.json()
        print(f"✅ Listed medicines: {medicines_list['total']} total")
    else:
        print(f"❌ Failed to list medicines: {response.status_code}")
        return False
    
    # Step 4: Test medicine search
    print("\n4️⃣ Testing medicine search...")
    
    # Search by query
    response = requests.get(f"{BASE_URL}/medicines/?query=paracetamol", headers=headers)
    if response.status_code == 200:
        search_results = response.json()
        print(f"✅ Search results: {search_results['total']} medicines found")
    else:
        print(f"❌ Failed to search medicines: {response.status_code}")
        return False
    
    # Simple search for autocomplete
    response = requests.get(f"{BASE_URL}/medicines/search/simple?query=para", headers=headers)
    if response.status_code == 200:
        simple_results = response.json()
        print(f"✅ Simple search results: {len(simple_results)} medicines found")
    else:
        print(f"❌ Failed to perform simple search: {response.status_code}")
        return False
    
    # Step 5: Test medicine update
    print("\n5️⃣ Testing medicine update...")
    
    update_data = {
        "price": 30.00,
        "storage_conditions": "Store below 25°C in dry place"
    }
    
    response = requests.put(f"{BASE_URL}/medicines/{medicine_ids[0]}", json=update_data, headers=headers)
    if response.status_code == 200:
        updated_medicine = response.json()
        print(f"✅ Medicine updated: price changed to {updated_medicine['price']}")
    else:
        print(f"❌ Failed to update medicine: {response.status_code} - {response.text}")
        return False
    
    # Step 6: Test drug interaction checking
    print("\n6️⃣ Testing drug interaction checking...")
    
    interaction_data = {
        "medicine_ids": medicine_ids
    }
    
    response = requests.post(f"{BASE_URL}/medicines/interactions", json=interaction_data, headers=headers)
    if response.status_code == 200:
        interaction_result = response.json()
        print(f"✅ Drug interaction check: {interaction_result['has_interactions']} interactions found")
        print(f"   Checked {len(interaction_result['checked_medicines'])} medicines")
    else:
        print(f"❌ Failed to check drug interactions: {response.status_code}")
        return False
    
    # Step 7: Test category and manufacturer filters
    print("\n7️⃣ Testing category and manufacturer filters...")
    
    # Get by category
    response = requests.get(f"{BASE_URL}/medicines/categories/analgesic", headers=headers)
    if response.status_code == 200:
        category_medicines = response.json()
        print(f"✅ Analgesic medicines: {len(category_medicines)} found")
    else:
        print(f"❌ Failed to get medicines by category: {response.status_code}")
        return False
    
    # Get by manufacturer
    response = requests.get(f"{BASE_URL}/medicines/manufacturers/ABC Pharmaceuticals", headers=headers)
    if response.status_code == 200:
        manufacturer_medicines = response.json()
        print(f"✅ ABC Pharmaceuticals medicines: {len(manufacturer_medicines)} found")
    else:
        print(f"❌ Failed to get medicines by manufacturer: {response.status_code}")
        return False
    
    # Step 8: Test statistics
    print("\n8️⃣ Testing medicine statistics...")
    
    response = requests.get(f"{BASE_URL}/medicines/statistics/overview", headers=headers)
    if response.status_code == 200:
        stats = response.json()
        print(f"✅ Statistics retrieved: {stats['total_medicines']} total medicines")
        print(f"   Active: {stats['active_medicines']}, Prescription required: {stats['prescription_required']}")
    else:
        print(f"❌ Failed to get statistics: {response.status_code}")
        return False
    
    # Step 9: Test medicine recommendations
    print("\n9️⃣ Testing medicine recommendations...")
    
    response = requests.get(f"{BASE_URL}/medicines/recommendations/headache", headers=headers)
    if response.status_code == 200:
        recommendations = response.json()
        print(f"✅ Recommendations for headache: {len(recommendations['recommended_medicines'])} medicines")
    else:
        print(f"❌ Failed to get recommendations: {response.status_code}")
        return False
    
    # Step 10: Test bulk operations
    print("\n🔟 Testing bulk operations...")
    
    bulk_data = {
        "medicine_ids": [medicine_ids[0]],
        "operation": "deactivate"
    }
    
    response = requests.post(f"{BASE_URL}/medicines/bulk", json=bulk_data, headers=headers)
    if response.status_code == 200:
        bulk_result = response.json()
        print(f"✅ Bulk operation: {bulk_result['successful']}/{bulk_result['total_requested']} successful")
    else:
        print(f"❌ Failed bulk operation: {response.status_code}")
        return False
    
    # Reactivate the medicine
    response = requests.put(f"{BASE_URL}/medicines/{medicine_ids[0]}/reactivate", headers=headers)
    if response.status_code == 200:
        print("✅ Medicine reactivated successfully")
    else:
        print(f"❌ Failed to reactivate medicine: {response.status_code}")
        return False
    
    print("\n🎉 All medicine API tests passed!")
    return True

def main():
    """Main test function"""
    try:
        success = test_medicine_api()
        if success:
            print("\n✅ ALL TESTS PASSED - Medicine API is working correctly!")
        else:
            print("\n❌ SOME TESTS FAILED - Check the output above")
            exit(1)
    except Exception as e:
        print(f"\n💥 Test execution failed: {str(e)}")
        exit(1)

if __name__ == "__main__":
    main()