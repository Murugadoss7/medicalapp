# API Reference Guide
## Prescription Management System - Complete API Documentation

---

**📅 Last Updated**: November 18, 2025
**🎯 Purpose**: Complete API endpoint reference with request/response formats
**📋 Status**: All 117+ endpoints implemented and tested including dental module
**🔗 Base URL**: `http://localhost:8000/api/v1`
**🚀 Recent Updates**:
- Dental module added (18 endpoints)
- Login and /auth/me now return `specialization` and `doctor_id` fields for doctors
- Prescription viewing and printing with doctor/clinic information
- Doctor ownership validation for prescriptions

## ⚠️ Important Field Mapping Notes

### **Frontend ↔ Backend Field Mapping**
- **Frontend**: `relationship` → **Backend**: `relationship_to_primary`
- **Frontend**: `mobile_number` (in FamilyResponse) → **Backend**: `family_mobile`
- **Backend computed fields**: `full_name`, `age`, `is_family_member`
- **Family members**: Always include `primary_contact_mobile` field
- **Primary members**: `primary_contact_mobile` is always `null`

---

## 🔐 Authentication

### **JWT Token Authentication**
```http
Authorization: Bearer <access_token>
```

### **Auth Endpoints (6 endpoints)**

#### **1. POST /auth/register** - User Registration
```javascript
// Request
{
    "email": "doctor@example.com",
    "password": "password123",
    "confirm_password": "password123",
    "first_name": "John",
    "last_name": "Doe",
    "role": "doctor",           // doctor, admin, patient, nurse, receptionist
    "phone": "9876543210",      // optional
    // For doctor role, these fields are required:
    "license_number": "MED123456",     // required for doctors
    "specialization": "Cardiology"     // optional for doctors
}

// Response (201) - Returns User object directly
{
    "id": "uuid",
    "email": "doctor@example.com",
    "role": "doctor",
    "first_name": "John",
    "last_name": "Doe",
    "full_name": "John Doe",
    "phone": "9876543210",
    "is_active": true,
    "is_email_verified": false,
    "created_at": "2025-11-12T10:30:00Z",
    "updated_at": "2025-11-12T10:30:00Z",
    "permissions": [
        "read:patients",
        "write:patients",
        "read:appointments",
        "write:appointments",
        "read:prescriptions",
        "write:prescriptions"
    ]
}

// Note: Registration does NOT return tokens
// Users must login separately after registration
```

#### **2. POST /auth/login** - User Login
```javascript
// Request
{
    "email": "doctor@example.com",
    "password": "password123"
}

// Response (200)
{
    "user": {
        "id": "uuid",
        "email": "doctor@example.com",
        "role": "doctor",
        "first_name": "John",
        "last_name": "Doe",
        "full_name": "John Doe",
        "phone": "9876543210",
        "specialization": "Dental Surgery",  // ⭐ For doctors only, used for conditional UI
        "doctor_id": "uuid",                 // ⭐ For doctors only, doctor's ID from doctors table
        "is_active": true,
        "created_at": "2025-11-16T10:30:00Z"
    },
    "tokens": {
        "access_token": "jwt_token",
        "refresh_token": "jwt_token",
        "token_type": "bearer"
    }
}

// Note: specialization and doctor_id fields are included for doctors only
// Frontend uses specialization to show/hide dental features:
// isDentalDoctor = user.specialization?.toLowerCase().includes('dental')
// doctor_id is used for prescription management and ownership validation
```

#### **3. GET /auth/me** - Get Current User (Protected)
```javascript
// Headers: Authorization: Bearer <token>
// Response (200)
{
    "id": "uuid",
    "email": "doctor@example.com",
    "role": "doctor",
    "first_name": "John",
    "last_name": "Doe",
    "full_name": "John Doe",
    "specialization": "Dental Surgery",  // ⭐ For doctors only
    "doctor_id": "uuid",                 // ⭐ For doctors only
    "is_active": true,
    "last_login_at": "2025-10-31T10:30:00Z",
    "created_at": "2025-11-16T10:30:00Z",
    "updated_at": "2025-11-16T10:30:00Z",
    "permissions": [
        "read:patients",
        "write:patients",
        "read:appointments",
        "write:appointments",
        "read:prescriptions",
        "write:prescriptions"
    ]
}

// Note: This endpoint returns the same user structure as login
// Includes specialization and doctor_id for doctors
```

#### **4. POST /auth/refresh** - Refresh Access Token
```javascript
// Request
{
    "refresh_token": "jwt_refresh_token"
}

// Response (200)
{
    "access_token": "new_jwt_token",
    "token_type": "bearer"
}
```

#### **5. POST /auth/logout** - User Logout
```javascript
// Headers: Authorization: Bearer <token>
// Response (200)
{
    "message": "Successfully logged out"
}
```

#### **6. POST /auth/change-password** - Change Password
```javascript
// Request
{
    "current_password": "oldpassword",
    "new_password": "newpassword"
}

// Response (200)
{
    "message": "Password changed successfully"
}
```

---

## 👨‍💼 Admin Management (4 endpoints)

### **Admin Dashboard & System Endpoints**

#### **1. GET /admin/statistics** - System Statistics
```javascript
// Headers: Authorization: Bearer <admin_token>
// Response (200)
{
    "system_stats": {
        "total_doctors": 15,
        "active_doctors": 12,
        "total_patients": 1250,
        "total_appointments": 89,
        "total_prescriptions": 156,
        "active_users": 1265,
        "pending_registrations": 8,
        "appointments_today": 45,
        "prescriptions_today": 23
    },
    "recent_activity": {
        "new_doctors_this_week": 2,
        "new_patients_this_week": 34,
        "completed_appointments_today": 12
    }
}
```

#### **2. GET /admin/system-health** - System Health Status
```javascript
// Headers: Authorization: Bearer <admin_token>
// Response (200)
{
    "system_health": {
        "status": "operational",           // operational | warning | error
        "database_health": "good",         // good | warning | error
        "active_sessions": 47,
        "last_backup": "2024-11-02T08:00:00Z",
        "uptime_hours": 168,
        "error_rate": 0.01
    },
    "service_status": {
        "database": "healthy",
        "authentication": "healthy", 
        "file_storage": "healthy",
        "email_service": "healthy"
    }
}
```

#### **3. GET /admin/user-analytics** - User Analytics
```javascript
// Headers: Authorization: Bearer <admin_token>
// Query Parameters:
// - period: daily|weekly|monthly (default: weekly)
// - start_date: YYYY-MM-DD
// - end_date: YYYY-MM-DD

// Response (200)
{
    "user_analytics": {
        "period": "weekly",
        "total_users": 1265,
        "new_registrations": [
            {"date": "2024-11-01", "count": 5, "doctors": 1, "patients": 4},
            {"date": "2024-11-02", "count": 8, "doctors": 0, "patients": 8}
        ],
        "active_users_by_role": {
            "doctors": 15,
            "patients": 1200,
            "admin": 3,
            "staff": 47
        },
        "login_activity": {
            "daily_logins": 234,
            "peak_hours": ["09:00", "14:00", "19:00"]
        }
    }
}
```

#### **4. POST /admin/broadcast-notification** - Send System Notification
```javascript
// Request
{
    "title": "System Maintenance Notice",
    "message": "System will be under maintenance from 11 PM to 1 AM tonight",
    "type": "info",                    // info | warning | error | success
    "target_roles": ["doctor", "patient"],  // roles to send to
    "priority": "high",                // low | medium | high
    "expires_at": "2024-11-03T01:00:00Z"
}

// Response (201)
{
    "notification_id": "uuid",
    "message": "Notification sent successfully",
    "recipients_count": 1215,
    "delivery_status": "queued"
}
```

### **Admin Access Control**
- **Required Role**: `admin` or `super_admin`
- **Authentication**: JWT token with admin privileges
- **Rate Limiting**: 100 requests per minute
- **Frontend Integration**: Admin dashboard uses these endpoints for system overview

---

## 👨‍⚕️ Doctor Management (13 endpoints)

#### **1. POST /doctors/** - Create Doctor (Admin Only)
```javascript
// Request
{
    "user_id": "uuid",                    // existing user
    "license_number": "LIC123456",
    "specialization": "Cardiology",
    "qualification": "MBBS, MD",
    "experience_years": 10,
    "phone": "9876543210",
    "consultation_fee": 500.00,
    "available_days": "MON,TUE,WED,THU,FRI",
    "start_time": "09:00:00",
    "end_time": "22:00:00"
}

// Response (201)
{
    "id": "uuid",
    "user_id": "uuid",
    "license_number": "LIC123456",
    "specialization": "Cardiology",
    "qualification": "MBBS, MD",
    "experience_years": 10,
    "consultation_fee": 500.00,
    "available_days": "MON,TUE,WED,THU,FRI",
    "full_name": "Dr. John Doe",
    "is_available_today": true,
    "available_days_list": ["MON", "TUE", "WED", "THU", "FRI"]
}
```

#### **2. GET /doctors/** - List Doctors (Search/Filter/Pagination)
```javascript
// Query Parameters
?specialization=Cardiology&experience_min=5&page=1&page_size=20

// Response (200)
{
    "doctors": [
        {
            "id": "uuid",
            "license_number": "LIC123456",
            "specialization": "Cardiology",
            "full_name": "Dr. John Doe",
            "experience_years": 10,
            "consultation_fee": 500.00,
            "is_available": true
        }
    ],
    "total": 25,
    "page": 1,
    "page_size": 20,
    "total_pages": 2
}
```

#### **3. GET /doctors/{id}** - Get Doctor Details
```javascript
// Response (200)
{
    "id": "uuid",
    "user_id": "uuid", 
    "license_number": "LIC123456",
    "specialization": "Cardiology",
    "qualification": "MBBS, MD",
    "experience_years": 10,
    "phone": "9876543210",
    "consultation_fee": 500.00,
    "available_days": "MON,TUE,WED,THU,FRI",
    "start_time": "09:00:00",
    "end_time": "22:00:00",
    "lunch_break_start": "13:00:00",
    "lunch_break_end": "14:00:00",
    "is_available": true,
    "full_name": "Dr. John Doe",
    "years_of_experience": 10,
    "is_available_today": true
}
```

#### **4. PUT /doctors/{id}** - Update Doctor (Admin/Own)
```javascript
// Request (partial update)
{
    "consultation_fee": 600.00,
    "available_days": "MON,TUE,WED,THU,FRI,SAT"
}

// Response (200) - Updated doctor object
```

#### **5-13. Additional Doctor Endpoints**
```javascript
// GET /doctors/{id}/schedule - Get doctor schedule
// PUT /doctors/{id}/schedule - Update schedule
// GET /doctors/specializations/{specialization} - Doctors by specialization
// GET /doctors/availability/{day} - Available doctors for day
// GET /doctors/statistics/overview - Doctor statistics
// GET /doctors/license/{license} - Get by license number
// GET /doctors/user/{user_id} - Get by user ID
// PUT /doctors/{id}/reactivate - Reactivate doctor
// DELETE /doctors/{id} - Deactivate doctor
```

---

## 👨‍👩‍👧‍👦 Patient Management (13 endpoints)

#### **1. POST /patients/** - Create Primary Patient
```javascript
// Request
{
    "mobile_number": "9876543210",
    "first_name": "Raj",
    "last_name": "Patel",
    "date_of_birth": "1990-05-15",
    "gender": "male",                         // male, female, other
    "email": "raj@example.com",
    "address": "123 Main St, Mumbai",
    "relationship": "self",                   // Primary patient is always "self"
    "primary_member": true,                   // Primary patient is always true
    "blood_group": "O+",                      // Optional: A+, A-, B+, B-, AB+, AB-, O+, O-
    "allergies": "None known",                // Optional: Known allergies
    "chronic_conditions": "Diabetes",         // Optional: Chronic conditions
    "emergency_notes": "Emergency contact: Wife", // Optional: Emergency notes
    "emergency_contact": {                    // Optional: Emergency contact
        "name": "Priya Patel",
        "phone": "9876543211",
        "relationship": "spouse"
    }
}

// Response (201)
{
    "mobile_number": "9876543210",           // Primary key part 1
    "first_name": "Raj",                     // Primary key part 2
    "id": "uuid",                            // Internal UUID for references
    "last_name": "Patel",
    "date_of_birth": "1990-05-15",
    "gender": "male",
    "email": "raj@example.com",
    "address": "123 Main St, Mumbai",
    "relationship_to_primary": "self",       // Backend field name
    "primary_contact_mobile": null,          // Null for primary members
    "blood_group": "O+",
    "allergies": "None known",
    "chronic_conditions": "Diabetes",
    "emergency_notes": "Emergency contact: Wife",
    "emergency_contact": {
        "name": "Priya Patel",
        "phone": "9876543211", 
        "relationship": "spouse"
    },
    "notes": null,
    "is_active": true,
    "created_by": "uuid",
    "created_at": "2025-11-02T10:30:00Z",
    "updated_at": "2025-11-02T10:30:00Z",
    "full_name": "Raj Patel",              // Computed field
    "age": 35,                             // Computed field
    "is_family_member": false              // Computed field
}
```

#### **2. GET /patients/** - List Patients with Search & Pagination
```javascript
// Query Parameters
?mobile_number=9876543210&first_name=Raj&page=1&page_size=20&sort_by=first_name&sort_order=asc

// Response (200)
{
    "patients": [
        {
            "mobile_number": "9876543210",
            "first_name": "Raj",
            "last_name": "Patel",
            "full_name": "Raj Patel",
            "date_of_birth": "1990-05-15",
            "age": 35,
            "gender": "male",
            "email": "raj@example.com",
            "address": "123 Main St, Mumbai",
            "relationship_to_primary": "self",      // Corrected field name
            "primary_contact_mobile": null,
            "blood_group": "O+",
            "allergies": "None known",
            "chronic_conditions": "Diabetes",
            "is_active": true,
            "created_at": "2025-11-02T10:30:00Z",
            "updated_at": "2025-11-02T10:30:00Z"
        }
    ],
    "total": 150,
    "page": 1,
    "page_size": 20,
    "total_pages": 8,
    "has_next": true,
    "has_prev": false
}
```

#### **3. GET /patients/{mobile}/{name}** - Get Patient by Composite Key
```javascript
// URL: /patients/9876543210/Raj
// Response (200)
{
    "mobile_number": "9876543210",
    "first_name": "Raj",
    "id": "uuid",
    "last_name": "Patel",
    "date_of_birth": "1990-05-15",
    "gender": "male",
    "email": "raj@example.com",
    "full_name": "Raj Patel",
    "age": 35,
    "composite_key": "9876543210-Raj"
}
```

#### **4. PUT /patients/{mobile}/{name}** - Update Patient
```javascript
// Request
{
    "email": "raj.new@example.com",
    "address": "456 New St, Mumbai"
}

// Response (200) - Updated patient object
```

#### **5. GET /patients/families/{mobile}** - Get Complete Family
```javascript
// URL: /patients/families/9876543210
// Response (200)
{
    "family_mobile": "9876543210",           // Corrected field name
    "primary_member": {                      // Primary member details
        "mobile_number": "9876543210",
        "first_name": "Raj",
        "last_name": "Patel",
        "full_name": "Raj Patel",
        "date_of_birth": "1990-05-15",
        "age": 35,
        "gender": "male",
        "email": "raj@example.com",
        "relationship_to_primary": "self",   // Always "self" for primary
        "primary_contact_mobile": null,      // Always null for primary
        "blood_group": "O+",
        "allergies": "None known",
        "is_active": true
    },
    "family_members": [                      // All family members (including primary)
        {
            "mobile_number": "9876543210",
            "first_name": "Raj",
            "full_name": "Raj Patel",
            "relationship_to_primary": "self",
            "age": 35
        },
        {
            "mobile_number": "9876543210", 
            "first_name": "Priya",
            "last_name": "Patel",
            "full_name": "Priya Patel",
            "date_of_birth": "1992-03-10",
            "age": 32,
            "gender": "female",
            "relationship_to_primary": "spouse",    // Corrected field name
            "primary_contact_mobile": "9876543210", // Required for family members
            "blood_group": "A+",
            "allergies": "Dust allergy"
        }
    ],
    "total_members": 2
}
```

#### **6. POST /patients/families/{mobile}** - Add Family Member
```javascript
// URL: POST /patients/families/9876543210
// Request
{
    "first_name": "Arjun",
    "last_name": "Patel", 
    "date_of_birth": "2015-08-20",
    "gender": "male",                         // Required: male, female, other
    "relationship_to_primary": "child",      // Required: spouse, child, parent, sibling, other
    "primary_contact_mobile": "9876543210",  // Required: Primary family mobile
    "blood_group": "O+",                     // Optional
    "allergies": "None known",               // Optional
    "notes": "School going child"            // Optional
}

// Response (201) - Complete family member object
{
    "mobile_number": "9876543210",
    "first_name": "Arjun",
    "last_name": "Patel",
    "id": "uuid",
    "date_of_birth": "2015-08-20",
    "gender": "male",
    "relationship_to_primary": "child",
    "primary_contact_mobile": "9876543210",
    "blood_group": "O+",
    "allergies": "None known",
    "notes": "School going child",
    "is_active": true,
    "full_name": "Arjun Patel",
    "age": 10,
    "is_family_member": true
}
```

#### **7-13. Additional Patient Endpoints**
```javascript
// GET /patients/families/{mobile}/eligibility - Check family eligibility
// POST /patients/validate-family - Validate family registration
// GET /patients/search/mobile/{mobile} - Search by mobile
// GET /patients/search/email/{email} - Search by email  
// GET /patients/id/{uuid} - Get by UUID
// GET /patients/statistics/overview - Patient statistics
// DELETE /patients/{mobile}/{name} - Deactivate patient
// PUT /patients/{mobile}/{name}/reactivate - Reactivate patient
```

---

## 💊 Medicine Management (16 endpoints)

#### **1. POST /medicines/** - Create Medicine (Admin Only)
```javascript
// Request
{
    "name": "Paracetamol",
    "generic_name": "Acetaminophen",
    "brand_name": "Crocin",
    "atc_code": "N02BE01",
    "category": "Analgesics",
    "strength": "500mg",
    "dosage_form": "tablet",
    "manufacturer": "GSK",
    "price_per_unit": 2.50,
    "is_prescription_required": false,
    "indications": "Pain relief, fever reduction"
}

// Response (201)
{
    "id": "uuid",
    "name": "Paracetamol",
    "generic_name": "Acetaminophen", 
    "brand_name": "Crocin",
    "atc_code": "N02BE01",
    "category": "Analgesics",
    "strength": "500mg",
    "dosage_form": "tablet",
    "manufacturer": "GSK",
    "price_per_unit": 2.50,
    "is_prescription_required": false,
    "display_name": "Crocin",
    "full_description": "Paracetamol 500mg tablet",
    "price_display": "₹2.50"
}
```

#### **2. GET /medicines/** - List Medicines
```javascript
// Query Parameters
?category=Analgesics&search=paracetamol&page=1&page_size=20

// Response (200)
{
    "medicines": [
        {
            "id": "uuid",
            "name": "Paracetamol",
            "brand_name": "Crocin",
            "strength": "500mg",
            "dosage_form": "tablet",
            "manufacturer": "GSK",
            "price_per_unit": 2.50,
            "display_name": "Crocin",
            "is_prescription_required": false
        }
    ],
    "total": 500,
    "page": 1,
    "page_size": 20
}
```

#### **3. GET /medicines/{id}** - Get Medicine Details
```javascript
// Response (200) - Complete medicine object with all fields
```

#### **4. POST /medicines/interactions** - Check Drug Interactions
```javascript
// Request
{
    "medicine_ids": ["uuid1", "uuid2", "uuid3"]
}

// Response (200)
{
    "interactions": [
        {
            "medicine1": "Medicine A",
            "medicine2": "Medicine B", 
            "interaction_type": "moderate",
            "description": "May increase risk of side effects",
            "recommendation": "Monitor patient closely"
        }
    ],
    "has_interactions": true,
    "interaction_count": 1
}
```

#### **5-16. Additional Medicine Endpoints**
```javascript
// GET /medicines/search/simple - Simple search for autocomplete
// GET /medicines/categories/{category} - Medicines by category
// GET /medicines/manufacturers/{manufacturer} - By manufacturer
// GET /medicines/popular - Popular medicines
// GET /medicines/statistics/overview - Medicine statistics
// POST /medicines/bulk - Bulk operations
// POST /medicines/import - Import medicines
// GET /medicines/recommendations/{condition} - Recommendations
// GET /medicines/contraindications/{condition} - Contraindicated medicines
// PUT /medicines/{id} - Update medicine
// DELETE /medicines/{id} - Deactivate medicine
// PUT /medicines/{id}/reactivate - Reactivate medicine
```

---

## 🔑 Short Key Management (14 endpoints)

#### **1. POST /short-keys/** - Create Short Key
```javascript
// Request
{
    "code": "FEVER",
    "name": "Common Fever Treatment",
    "description": "Standard prescription for viral fever",
    "indication": "Viral fever, body ache, headache",
    "is_global": false,
    "medicines": [
        {
            "medicine_id": "uuid1",
            "default_dosage": "500mg",
            "default_frequency": "Twice daily", 
            "default_duration": "3 days",
            "default_quantity": 6,
            "sequence_order": 1
        },
        {
            "medicine_id": "uuid2",
            "default_dosage": "650mg",
            "default_frequency": "When fever > 100°F",
            "default_duration": "3 days", 
            "default_quantity": 6,
            "sequence_order": 2
        }
    ]
}

// Response (201)
{
    "id": "uuid",
    "code": "FEVER",
    "name": "Common Fever Treatment",
    "description": "Standard prescription for viral fever",
    "indication": "Viral fever, body ache, headache",
    "is_global": false,
    "created_by_doctor": "uuid",
    "usage_count": 0,
    "medicines": [
        {
            "medicine_id": "uuid1",
            "medicine_name": "Paracetamol 500mg",
            "default_dosage": "500mg",
            "default_frequency": "Twice daily",
            "default_duration": "3 days",
            "default_quantity": 6,
            "sequence_order": 1
        }
    ],
    "total_medicines": 2,
    "can_edit": true
}
```

#### **2. GET /short-keys/** - List Short Keys
```javascript
// Query Parameters
?is_global=true&created_by=uuid&search=fever&page=1

// Response (200)
{
    "short_keys": [
        {
            "id": "uuid",
            "code": "FEVER",
            "name": "Common Fever Treatment",
            "total_medicines": 2,
            "usage_count": 25,
            "is_global": false,
            "can_edit": true
        }
    ],
    "total": 50,
    "page": 1
}
```

#### **3. GET /short-keys/code/{code}** - Get Short Key by Code
```javascript
// URL: /short-keys/code/FEVER
// Response (200) - Complete short key object with medicines
```

#### **4. POST /short-keys/use/{code}** - Use Short Key (Track Usage)
```javascript
// URL: /short-keys/use/FEVER
// Request
{
    "used_by": "uuid",      // doctor using the short key
    "patient_info": {       // optional, for analytics
        "mobile_number": "9876543210",
        "first_name": "Raj"
    }
}

// Response (200)
{
    "short_key": { /* short key object */ },
    "medicines": [ /* medicine list with defaults */ ],
    "usage_tracked": true
}
```

#### **5-14. Additional Short Key Endpoints**
```javascript
// GET /short-keys/{id} - Get by ID
// PUT /short-keys/{id} - Update short key
// DELETE /short-keys/{id} - Deactivate short key
// POST /short-keys/{id}/medicines - Add medicine to short key
// PUT /short-keys/{id}/medicines/{medicine_id} - Update medicine in short key
// DELETE /short-keys/{id}/medicines/{medicine_id} - Remove medicine
// GET /short-keys/popular - Popular short keys
// GET /short-keys/statistics/overview - Statistics
// POST /short-keys/bulk - Bulk operations
// POST /short-keys/validate - Validate code uniqueness
```

---

## 📅 Appointment Management (15 endpoints)

#### **1. POST /appointments/** - Create Appointment
```javascript
// Request
{
    "patient_mobile_number": "9876543210",
    "patient_first_name": "Raj",
    "patient_uuid": "uuid",
    "doctor_id": "uuid",
    "appointment_date": "2025-11-01",
    "appointment_time": "09:30:00",
    "duration_minutes": 30,
    "reason_for_visit": "Regular checkup",
    "notes": "Patient has mild fever",
    "contact_number": "9876543210"
}

// Response (201)
{
    "id": "uuid",
    "appointment_number": "APT20251101001",
    "patient_mobile_number": "9876543210",
    "patient_first_name": "Raj",
    "doctor_id": "uuid",
    "appointment_date": "2025-11-01",
    "appointment_time": "09:30:00",
    "duration_minutes": 30,
    "status": "scheduled",
    "reason_for_visit": "Regular checkup",
    "appointment_datetime": "2025-11-01T09:30:00Z",
    "end_datetime": "2025-11-01T10:00:00Z",
    "is_upcoming": true,
    "can_be_cancelled": true,
    "patient_details": {
        "full_name": "Raj Patel",
        "age": 35,
        "mobile_number": "9876543210"
    },
    "doctor_details": {
        "full_name": "Dr. John Doe",
        "specialization": "Cardiology"
    }
}
```

#### **2. GET /appointments/** - List Appointments
```javascript
// Query Parameters
?doctor_id=uuid&date=2025-11-01&status=scheduled&page=1

// Response (200)
{
    "appointments": [
        {
            "id": "uuid",
            "appointment_number": "APT20251101001",
            "appointment_datetime": "2025-11-01T09:30:00Z",
            "status": "scheduled",
            "patient_details": {
                "full_name": "Raj Patel",
                "mobile_number": "9876543210"
            },
            "doctor_details": {
                "full_name": "Dr. John Doe"
            },
            "reason_for_visit": "Regular checkup"
        }
    ],
    "total": 25,
    "page": 1
}
```

#### **3. POST /appointments/conflicts/check** - Check Conflicts
```javascript
// Request
{
    "doctor_id": "uuid",
    "appointment_date": "2025-11-01",
    "appointment_time": "09:30:00",
    "duration_minutes": 30,
    "exclude_appointment_id": "uuid"    // optional, for rescheduling
}

// Response (200)
{
    "has_conflict": false,
    "available": true,
    "message": "Time slot is available"
}

// Response (409) - Conflict
{
    "has_conflict": true,
    "available": false,
    "conflicting_appointments": [
        {
            "appointment_number": "APT20251101002",
            "time": "09:30:00 - 10:00:00",
            "patient_name": "Another Patient"
        }
    ],
    "suggested_slots": [
        "10:10:00",
        "10:40:00",
        "11:10:00"
    ]
}
```

#### **4. GET /appointments/availability/{doctor_id}/{date}** - Available Slots
```javascript
// URL: /appointments/availability/uuid/2025-11-01
// Response (200)
{
    "date": "2025-11-01",
    "doctor_id": "uuid",
    "working_hours": {
        "start": "09:00:00",
        "end": "22:00:00",
        "lunch_break_start": "13:00:00",
        "lunch_break_end": "14:00:00"
    },
    "available_slots": [
        {
            "time": "09:00:00",
            "end_time": "09:30:00",
            "available": true
        },
        {
            "time": "09:40:00", 
            "end_time": "10:10:00",
            "available": true
        },
        {
            "time": "10:20:00",
            "end_time": "10:50:00",
            "available": false,
            "reason": "Already booked"
        }
    ],
    "total_slots": 26,
    "available_count": 20,
    "booked_count": 6
}
```

#### **5. POST /appointments/{id}/reschedule** - Reschedule Appointment
```javascript
// Request
{
    "new_date": "2025-11-02",
    "new_time": "10:30:00",
    "reason": "Patient request"
}

// Response (200) - Updated appointment object
```

#### **6-15. Additional Appointment Endpoints**
```javascript
// GET /appointments/{id} - Get appointment details
// GET /appointments/number/{number} - Get by appointment number
// PUT /appointments/{id} - Update appointment
// PUT /appointments/{id}/status - Update status
// DELETE /appointments/{id} - Cancel appointment
// GET /appointments/doctor/{doctor_id} - Doctor's appointments
// GET /appointments/patient/{mobile}/{name} - Patient's appointments
// GET /appointments/schedule/{doctor_id}/{date} - Daily schedule
// GET /appointments/statistics/overview - Statistics
// POST /appointments/bulk - Bulk operations
```

---

## 📋 Prescription Management (18 endpoints)

#### **1. POST /prescriptions/** - Create Prescription
```javascript
// Request
{
    "patient_mobile_number": "9876543210",
    "patient_first_name": "Raj",
    "patient_uuid": "uuid",
    "doctor_id": "uuid",
    "appointment_id": "uuid",           // optional
    "visit_date": "2025-10-31",
    "chief_complaint": "Fever and headache for 2 days",
    "diagnosis": "Viral fever",
    "symptoms": "High temperature, body ache, headache",
    "clinical_notes": "Patient appears tired. Temperature 101°F.",
    "doctor_instructions": "Complete rest for 3 days. Drink plenty of fluids.",
    "items": [
        {
            "medicine_id": "uuid1",
            "dosage": "500mg",
            "frequency": "Twice daily",
            "duration": "5 days",
            "instructions": "Take after meals",
            "quantity": 10,
            "unit_price": 2.50,
            "sequence_order": 1
        },
        {
            "medicine_id": "uuid2",
            "dosage": "650mg",
            "frequency": "When fever > 100°F",
            "duration": "3 days",
            "instructions": "Do not exceed 4 doses per day",
            "quantity": 6,
            "unit_price": 3.00,
            "sequence_order": 2
        }
    ]
}

// Response (201)
{
    "id": "uuid",
    "prescription_number": "RX20251031001",
    "patient_mobile_number": "9876543210",
    "patient_first_name": "Raj",
    "doctor_id": "uuid",
    "visit_date": "2025-10-31",
    "diagnosis": "Viral fever",
    "status": "active",
    "total_medicines": 2,
    "total_amount": 43.00,
    "can_be_modified": true,
    "is_expired": false,
    "items": [
        {
            "id": "uuid",
            "medicine_id": "uuid1",
            "medicine_name": "Paracetamol 500mg",
            "dosage": "500mg",
            "frequency": "Twice daily",
            "duration": "5 days",
            "instructions": "Take after meals",
            "quantity": 10,
            "unit_price": 2.50,
            "total_amount": 25.00,
            "sequence_order": 1,
            "formatted_instruction": "Dosage: 500mg | Frequency: Twice daily | Duration: 5 days | Instructions: Take after meals"
        }
    ],
    "patient_details": {
        "full_name": "Raj Patel",
        "age": 35,
        "mobile_number": "9876543210"
    },
    "doctor_details": {
        "full_name": "Dr. John Doe",
        "specialization": "Cardiology",
        "license_number": "LIC123456"
    }
}
```

#### **2. POST /prescriptions/short-key** - Create from Short Key
```javascript
// Request
{
    "patient_mobile_number": "9876543210",
    "patient_first_name": "Raj",
    "patient_uuid": "uuid",
    "doctor_id": "uuid",
    "short_key_code": "FEVER",
    "visit_date": "2025-10-31",
    "diagnosis": "Viral fever with headache",
    "chief_complaint": "Fever and body ache",
    "clinical_notes": "Using FEVER short key template"
}

// Response (201) - Complete prescription object with medicines from short key
```

#### **3. GET /prescriptions/** - List Prescriptions
```javascript
// Query Parameters
?patient_mobile_number=9876543210&doctor_id=uuid&status=active&visit_date_from=2025-10-01&page=1

// Response (200)
{
    "prescriptions": [
        {
            "id": "uuid",
            "prescription_number": "RX20251031001",
            "patient_mobile_number": "9876543210",
            "patient_first_name": "Raj",
            "visit_date": "2025-10-31",
            "diagnosis": "Viral fever",
            "status": "active",
            "total_medicines": 2,
            "total_amount": 43.00,
            "patient_details": {
                "full_name": "Raj Patel",
                "age": 35
            },
            "doctor_details": {
                "full_name": "Dr. John Doe"
            }
        }
    ],
    "total": 150,
    "page": 1,
    "page_size": 20,
    "total_pages": 8
}
```

#### **4. POST /prescriptions/{id}/items** - Add Item to Prescription
```javascript
// Request
{
    "medicine_id": "uuid3",
    "dosage": "1 tablet",
    "frequency": "Once daily",
    "duration": "7 days",
    "instructions": "Take before bedtime",
    "quantity": 7,
    "unit_price": 5.00
}

// Response (201) - New prescription item object
```

#### **5. POST /prescriptions/{id}/print** - Print Prescription
```javascript
// Request
{
    "template": "standard",           // template name
    "include_prices": true,
    "include_instructions": true,
    "format": "pdf"                  // pdf or html
}

// Response (200)
{
    "id": "uuid",
    "prescription_number": "RX20251031001",
    "is_printed": true,
    "printed_at": "2025-10-31T15:30:00Z",
    "template_used": "standard",
    "print_url": "/prescriptions/uuid/download",  // URL to download PDF
    "message": "Prescription marked as printed"
}
```

#### **6. POST /prescriptions/validate** - Validate Prescription Data
```javascript
// Request
{
    "patient_mobile_number": "9876543210",
    "patient_first_name": "Raj",
    "doctor_id": "uuid",
    "items": [
        {
            "medicine_id": "uuid1",
            "dosage": "500mg",
            "frequency": "Twice daily",
            "duration": "5 days",
            "quantity": 10
        }
    ]
}

// Response (200)
{
    "is_valid": true,
    "errors": [],
    "warnings": [
        "Duplicate medicine detected: Paracetamol appears twice"
    ]
}

// Response (400) - Validation Failed
{
    "is_valid": false,
    "errors": [
        "Patient not found",
        "Doctor not found",
        "Medicine not found for item 2"
    ],
    "warnings": []
}
```

#### **7-18. Additional Prescription Endpoints**
```javascript
// GET /prescriptions/{id} - Get prescription details
// GET /prescriptions/number/{number} - Get by prescription number
// PUT /prescriptions/{id} - Update prescription
// PUT /prescriptions/{id}/status - Update status
// DELETE /prescriptions/{id} - Cancel prescription
// PUT /prescriptions/items/{item_id} - Update prescription item
// DELETE /prescriptions/items/{item_id} - Remove prescription item
// GET /prescriptions/patient/{mobile}/{name} - Patient's prescriptions
// GET /prescriptions/doctor/{doctor_id} - Doctor's prescriptions
// GET /prescriptions/statistics/overview - Statistics
// POST /prescriptions/bulk - Bulk operations
// GET /prescriptions/search/advanced - Advanced search
```

---

## 📊 Common Response Patterns

### **Success Responses**
```javascript
// 200 OK - Successful GET/PUT
{
    "data": { /* response object */ }
}

// 201 Created - Successful POST
{
    "data": { /* created object */ },
    "message": "Resource created successfully"
}

// 204 No Content - Successful DELETE
// (No response body)
```

### **Error Responses**
```javascript
// 400 Bad Request - Validation Error
{
    "detail": "Validation error",
    "errors": [
        {
            "field": "email",
            "message": "Invalid email format"
        }
    ]
}

// 401 Unauthorized
{
    "detail": "Authentication required"
}

// 403 Forbidden
{
    "detail": "Insufficient permissions"
}

// 404 Not Found
{
    "detail": "Resource not found"
}

// 409 Conflict
{
    "detail": "Resource already exists",
    "conflicting_field": "email"
}

// 422 Unprocessable Entity
{
    "detail": "Invalid data provided",
    "errors": [ /* validation errors */ ]
}
```

### **Pagination Response Format**
```javascript
{
    "data": [ /* array of objects */ ],
    "total": 150,
    "page": 1,
    "page_size": 20,
    "total_pages": 8,
    "has_next": true,
    "has_prev": false
}
```

---

## 🔍 Search & Filter Patterns

### **Common Query Parameters**
```javascript
// Pagination
?page=1&page_size=20

// Sorting
?sort_by=created_at&sort_order=desc

// Date Filters
?created_from=2025-10-01&created_to=2025-10-31
?visit_date_from=2025-10-01&visit_date_to=2025-10-31

// Text Search
?search=paracetamol          // searches multiple fields
?name=paracetamol           // specific field search

// Status Filters
?status=active&is_active=true

// Relationship Filters
?doctor_id=uuid&patient_mobile_number=9876543210
```

---

## 📅 Appointments API (15 endpoints)

### **Core Appointment Management**

#### **1. POST /appointments/** - Create New Appointment
```javascript
// Request
{
    "patient_mobile_number": "9876543210",
    "patient_first_name": "Raj",
    "patient_uuid": "patient-uuid",          // Required for FK reference
    "doctor_id": "doctor-uuid",
    "appointment_date": "2025-11-15",        // YYYY-MM-DD
    "appointment_time": "09:30:00",          // HH:MM:SS
    "duration_minutes": 30,
    "reason_for_visit": "Regular checkup",
    "contact_number": "9876543210",          // Optional, defaults to patient mobile
    "notes": "First visit"                   // Optional
}

// Response (201)
{
    "id": "uuid",
    "appointment_number": "APT20251110001",
    "patient_mobile_number": "9876543210",
    "patient_first_name": "Raj",
    "patient_uuid": "patient-uuid",
    "doctor_id": "doctor-uuid",
    "appointment_date": "2025-11-15",
    "appointment_time": "09:30:00",
    "duration_minutes": 30,
    "status": "scheduled",
    "reason_for_visit": "Regular checkup",
    "notes": "First visit",
    "contact_number": "9876543210",
    "created_at": "2025-11-10T10:30:00Z",
    "updated_at": "2025-11-10T10:30:00Z",
    "is_active": true,
    
    // Computed fields
    "appointment_datetime": "2025-11-15T09:30:00",
    "end_datetime": "2025-11-15T10:00:00",
    "is_today": false,
    "is_upcoming": true,
    "can_be_cancelled": true,
    "status_display": "Scheduled"
}
```

#### **2. GET /appointments/doctor/{doctor_id}** - Get Doctor's Appointments
```javascript
// Query Parameters:
// ?appointment_date=2025-11-15      // Filter by specific date
// ?status=scheduled                 // Filter by status
// ?start_date=2025-11-01&end_date=2025-11-30  // Date range
// ?page=1&limit=50                  // Pagination

// Response (200)
{
    "appointments": [
        {
            "id": "uuid",
            "appointment_number": "APT20251110001",
            "patient_mobile_number": "9876543210",
            "patient_first_name": "Raj",
            "patient_last_name": "Kumar",
            "patient_full_name": "Raj Kumar",
            "doctor_id": "doctor-uuid", 
            "appointment_date": "2025-11-15",
            "appointment_time": "09:30:00",
            "appointment_datetime": "2025-11-15T09:30:00",
            "duration_minutes": 30,
            "status": "scheduled",
            "reason_for_visit": "Regular checkup",
            "notes": "First visit",
            "created_at": "2025-11-10T10:30:00Z",
            "updated_at": "2025-11-10T10:30:00Z"
        }
    ],
    "total": 15,
    "page": 1,
    "limit": 50
}
```

#### **3. GET /appointments/availability/{doctor_id}/{date}** - Check Doctor Availability
```javascript
// URL: /appointments/availability/doctor-uuid/2025-11-15

// Response (200)
{
    "doctor_id": "doctor-uuid",
    "date": "2025-11-15",
    "available_slots": [
        {
            "start_time": "09:00:00",
            "end_time": "09:30:00",
            "duration_minutes": 30,
            "is_available": true
        },
        {
            "start_time": "09:30:00", 
            "end_time": "10:00:00",
            "duration_minutes": 30,
            "is_available": false
        },
        {
            "start_time": "10:00:00",
            "end_time": "10:30:00", 
            "duration_minutes": 30,
            "is_available": true
        }
    ],
    "booked_slots": ["09:30:00"],
    "break_slots": ["13:00:00", "13:30:00"],
    "working_hours_start": "09:00:00",
    "working_hours_end": "17:00:00",
    "lunch_break_start": "13:00:00",
    "lunch_break_end": "14:00:00",
    "total_available_slots": 15,
    "total_booked_slots": 1
}
```

#### **4. POST /appointments/conflicts/check** - Check Appointment Conflicts
```javascript
// Request
{
    "doctor_id": "doctor-uuid",
    "appointment_date": "2025-11-15",
    "appointment_time": "09:30:00",
    "duration_minutes": 30,
    "exclude_appointment_id": "uuid"     // Optional, for rescheduling
}

// Response (200)
{
    "has_conflict": false,
    "available": true,
    "conflicting_appointments": [],
    "suggested_times": ["10:00:00", "10:30:00", "11:00:00"]
}

// Response with conflict (200)
{
    "has_conflict": true,
    "available": false,
    "conflicting_appointments": [
        {
            "appointment_number": "APT20251110001",
            "time": "09:30:00",
            "patient_name": "Raj Kumar"
        }
    ],
    "suggested_times": ["10:00:00", "10:30:00", "11:00:00"]
}
```

#### **5. GET /appointments/{appointment_id}** - Get Appointment Details
```javascript
// Response (200)
{
    "id": "uuid",
    "appointment_number": "APT20251110001",
    "patient_mobile_number": "9876543210",
    "patient_first_name": "Raj",
    "patient_uuid": "patient-uuid",
    "doctor_id": "doctor-uuid",
    "appointment_date": "2025-11-15",
    "appointment_time": "09:30:00",
    "duration_minutes": 30,
    "status": "scheduled",
    "reason_for_visit": "Regular checkup",
    "notes": "First visit",
    "created_at": "2025-11-10T10:30:00Z",
    "updated_at": "2025-11-10T10:30:00Z",
    
    // Extended details with related data
    "patient_details": {
        "mobile_number": "9876543210",
        "first_name": "Raj",
        "age": 35,
        "gender": "male",
        "address": "123 Main St"
    },
    "doctor_details": {
        "id": "doctor-uuid",
        "first_name": "Dr. Smith",
        "last_name": "Johnson",
        "specialization": "General Medicine"
    },
    "prescription_id": null              // If consultation completed
}
```

#### **6. PUT /appointments/{appointment_id}/status** - Update Appointment Status
```javascript
// Request
{
    "status": "in_progress",            // scheduled, in_progress, completed, cancelled
    "notes": "Patient arrived on time" // Optional
}

// Response (200)
{
    "id": "uuid",
    "status": "in_progress",
    "notes": "Patient arrived on time",
    "updated_at": "2025-11-15T09:30:00Z",
    "status_display": "In Progress"
}
```

#### **7. POST /appointments/{appointment_id}/reschedule** - Reschedule Appointment
```javascript
// Request
{
    "appointment_date": "2025-11-16",
    "appointment_time": "10:00:00"
}

// Response (200)
{
    "id": "uuid",
    "appointment_date": "2025-11-16",
    "appointment_time": "10:00:00",
    "status": "scheduled",
    "updated_at": "2025-11-15T09:30:00Z",
    "previous_datetime": "2025-11-15T09:30:00",
    "new_datetime": "2025-11-16T10:00:00"
}
```

#### **8. DELETE /appointments/{appointment_id}** - Cancel Appointment
```javascript
// Request (Optional body)
{
    "reason": "Patient requested cancellation"
}

// Response (200)
{
    "message": "Appointment cancelled successfully",
    "appointment_id": "uuid",
    "cancelled_at": "2025-11-15T09:00:00Z",
    "reason": "Patient requested cancellation"
}
```

### **Statistics & Dashboard Endpoints**

#### **9. GET /doctors/statistics/overview** - Doctor Dashboard Stats
```javascript
// Response (200)
{
    "total_patients": 150,
    "total_appointments": 45,
    "total_prescriptions": 120,
    "appointments_today": 8,
    "prescriptions_today": 5,
    "upcoming_appointments": 12,
    "completed_appointments_today": 3,
    "pending_appointments_today": 5,
    "revenue_today": 2400.00,
    "revenue_this_month": 45000.00
}
```

#### **10. GET /appointments/doctor/{doctor_id}/today** - Today's Appointments
```javascript
// Query: /appointments/doctor/doctor-uuid?appointment_date=2025-11-15&status=scheduled

// Response (200) - Array of appointments for today
[
    {
        "id": "uuid",
        "appointment_number": "APT20251115001",
        "patient_mobile_number": "9876543210",
        "patient_first_name": "Raj",
        "patient_full_name": "Raj Kumar",
        "appointment_time": "09:30:00",
        "appointment_datetime": "2025-11-15T09:30:00",
        "duration_minutes": 30,
        "status": "scheduled",
        "reason_for_visit": "Regular checkup",
        "is_today": true,
        "is_upcoming": true
    }
]
```

#### **11. GET /appointments/schedule/{doctor_id}/{date}** - Daily Schedule
```javascript
// URL: /appointments/schedule/doctor-uuid/2025-11-15

// Response (200)
{
    "doctor_id": "doctor-uuid",
    "date": "2025-11-15", 
    "appointments": [
        {
            "id": "uuid",
            "appointment_time": "09:30:00",
            "patient_name": "Raj Kumar",
            "patient_mobile": "9876543210",
            "status": "scheduled",
            "duration_minutes": 30,
            "reason_for_visit": "Regular checkup"
        }
    ],
    "total_appointments": 8,
    "available_slots": 10,
    "working_hours": {
        "start": "09:00:00",
        "end": "17:00:00",
        "lunch_start": "13:00:00", 
        "lunch_end": "14:00:00"
    }
}
```

### **Advanced Appointment Features**

#### **12. GET /appointments/search** - Search Appointments
```javascript
// Query Parameters:
// ?patient_name=Raj&doctor_id=uuid&date_from=2025-11-01&date_to=2025-11-30&status=scheduled

// Response (200)
{
    "appointments": [ /* appointment objects */ ],
    "total": 25,
    "filters_applied": {
        "patient_name": "Raj",
        "doctor_id": "doctor-uuid",
        "date_range": "2025-11-01 to 2025-11-30",
        "status": "scheduled"
    }
}
```

#### **13. GET /appointments/patient/{mobile_number}/{first_name}** - Patient's Appointments
```javascript
// URL: /appointments/patient/9876543210/Raj

// Response (200)
{
    "patient": {
        "mobile_number": "9876543210",
        "first_name": "Raj",
        "full_name": "Raj Kumar"
    },
    "appointments": [
        {
            "id": "uuid",
            "appointment_number": "APT20251115001", 
            "doctor_name": "Dr. Smith Johnson",
            "appointment_datetime": "2025-11-15T09:30:00",
            "status": "scheduled",
            "reason_for_visit": "Regular checkup"
        }
    ],
    "total_appointments": 5,
    "upcoming_appointments": 2,
    "completed_appointments": 3
}
```

#### **14. POST /appointments/batch** - Create Multiple Appointments
```javascript
// Request
{
    "appointments": [
        {
            "patient_mobile_number": "9876543210",
            "patient_first_name": "Raj", 
            "patient_uuid": "patient-uuid",
            "doctor_id": "doctor-uuid",
            "appointment_date": "2025-11-15",
            "appointment_time": "09:30:00",
            "reason_for_visit": "Regular checkup"
        },
        {
            "patient_mobile_number": "9876543211",
            "patient_first_name": "Priya",
            "patient_uuid": "patient-uuid-2", 
            "doctor_id": "doctor-uuid",
            "appointment_date": "2025-11-15",
            "appointment_time": "10:00:00",
            "reason_for_visit": "Follow-up"
        }
    ]
}

// Response (201)
{
    "created_appointments": [ /* appointment objects */ ],
    "failed_appointments": [],
    "total_created": 2,
    "total_failed": 0
}
```

#### **15. PUT /appointments/bulk/status** - Bulk Status Update
```javascript
// Request
{
    "appointment_ids": ["uuid1", "uuid2", "uuid3"],
    "status": "completed",
    "notes": "Batch completion after consultation session"
}

// Response (200)
{
    "updated_appointments": 3,
    "failed_updates": 0,
    "status": "completed",
    "updated_at": "2025-11-15T17:00:00Z"
}
```

---

### **⚠️ Appointment API Field Mapping Notes**

#### **Critical Field Mappings:**
- **Frontend**: `appointment_date` (Date object) → **Backend**: `appointment_date` (YYYY-MM-DD string)
- **Frontend**: `appointment_time` (time picker) → **Backend**: `appointment_time` (HH:MM:SS string)
- **Backend computed**: `appointment_datetime`, `end_datetime`, `status_display`
- **Patient Reference**: Always use composite key (`mobile_number` + `first_name`) + `patient_uuid`

#### **Status Workflow:**
```
scheduled → in_progress → completed
    ↓           ↓            ↓
cancelled ← cancelled ← cancelled
```

#### **Time Slot Structure:**
```javascript
{
    "start_time": "09:00:00",      // Slot start time
    "end_time": "09:30:00",        // Slot end time  
    "duration_minutes": 30,        // Fixed 30-minute slots
    "is_available": true           // Availability status
}
```

#### **Date Validation Rules:**
- **appointment_date**: Must be future date (except for rescheduling), max 1 year advance
- **appointment_time**: Must be within doctor's working hours, no conflicts
- **duration_minutes**: Fixed 30-minute appointments
- **working_hours**: 9:00 AM - 5:00 PM (customizable per doctor)
- **lunch_break**: 1:00 PM - 2:00 PM (configurable per doctor)

---

## 🦷 Dental Management (18 endpoints) ⭐ NEW

### **Dental Observations & Procedures**

**Note**: Dental features are conditionally shown based on doctor's specialization
- Frontend checks: `user.specialization?.toLowerCase().includes('dental')`
- Access route: `/appointments/{appointmentId}/dental`
- FDI Notation: International tooth numbering (11-48 permanent, 51-85 primary)

---

### **Dental Observations (9 endpoints)**

#### **1. POST /dental/observations** - Create Dental Observation
```javascript
// Request
{
    "prescription_id": "uuid",          // optional
    "appointment_id": "uuid",           // optional
    "patient_mobile_number": "9876543210",
    "patient_first_name": "John",
    "tooth_number": "26",               // FDI notation (11-48, 51-85)
    "tooth_surface": "Occlusal",        // Occlusal, Mesial, Distal, Buccal, Lingual, Palatal, Incisal
    "condition_type": "Cavity",         // 14 types: Cavity, Decay, Fracture, etc.
    "severity": "Moderate",             // Mild, Moderate, Severe
    "observation_notes": "Deep cavity on occlusal surface",
    "treatment_required": true,
    "treatment_done": false,
    "treatment_date": null
}

// Response (201)
{
    "id": "uuid",
    "tooth_number": "26",
    "tooth_surface": "Occlusal",
    "condition_type": "Cavity",
    "severity": "Moderate",
    "observation_notes": "Deep cavity on occlusal surface",
    "treatment_required": true,
    "treatment_done": false,
    "treatment_date": null,
    "patient_mobile_number": "9876543210",
    "patient_first_name": "John",
    "created_at": "2025-11-16T10:00:00Z",
    "updated_at": "2025-11-16T10:00:00Z",
    "is_active": true
}
```

#### **2. GET /dental/observations/{id}** - Get Observation by ID
```javascript
// Response (200)
{
    "id": "uuid",
    "tooth_number": "26",
    "condition_type": "Cavity",
    // ... full observation object
}
```

#### **3. PUT /dental/observations/{id}** - Update Observation
```javascript
// Request
{
    "severity": "Severe",
    "treatment_done": true,
    "treatment_date": "2025-11-16",
    "observation_notes": "Updated after treatment"
}

// Response (200)
{
    // Updated observation object
}
```

#### **4. DELETE /dental/observations/{id}** - Delete Observation
```javascript
// Response (204 No Content)
```

#### **5. GET /dental/observations/patient/{mobile}/{name}** - Get Patient Observations
```javascript
// Response (200)
{
    "observations": [
        {
            "id": "uuid",
            "tooth_number": "26",
            "condition_type": "Cavity",
            "created_at": "2025-11-16T10:00:00Z"
        },
        // ... more observations
    ],
    "total": 15,
    "patient_mobile_number": "9876543210",
    "patient_first_name": "John"
}
```

#### **6. GET /dental/observations/prescription/{id}** - Get by Prescription
```javascript
// Response (200)
{
    "observations": [ /* observation objects */ ],
    "total": 5,
    "prescription_id": "uuid"
}
```

#### **7. GET /dental/observations/appointment/{id}** - Get by Appointment
```javascript
// Response (200)
{
    "observations": [ /* observation objects */ ],
    "total": 3,
    "appointment_id": "uuid"
}
```

#### **8. GET /dental/observations/tooth/{mobile}/{name}/{tooth_number}** - Get Tooth History
```javascript
// Example: GET /dental/observations/tooth/9876543210/John/26
// Response (200)
{
    "tooth_number": "26",
    "observations": [
        {
            "id": "uuid",
            "condition_type": "Cavity",
            "severity": "Moderate",
            "treatment_done": true,
            "treatment_date": "2025-11-16",
            "created_at": "2025-11-16T10:00:00Z"
        },
        // ... historical observations for this tooth
    ],
    "total_observations": 3,
    "active_treatments": 0,
    "completed_treatments": 3
}
```

#### **9. POST /dental/observations/bulk** - Bulk Create Observations
```javascript
// Request
{
    "observations": [
        {
            "tooth_number": "11",
            "condition_type": "Cavity",
            "patient_mobile_number": "9876543210",
            "patient_first_name": "John"
        },
        {
            "tooth_number": "12",
            "condition_type": "Decay",
            "patient_mobile_number": "9876543210",
            "patient_first_name": "John"
        }
        // ... max 32 observations
    ]
}

// Response (201)
{
    "created": 2,
    "failed": 0,
    "observations": [ /* created observation objects */ ]
}
```

---

### **Dental Procedures (7 endpoints)**

#### **1. POST /dental/procedures** - Create Dental Procedure
```javascript
// Request
{
    "observation_id": "uuid",           // optional
    "prescription_id": "uuid",          // optional
    "appointment_id": "uuid",           // optional
    "procedure_code": "D2740",          // CDT code
    "procedure_name": "Crown - Porcelain/Ceramic",
    "tooth_numbers": "26",              // Comma-separated for multiple teeth
    "description": "Porcelain crown for upper left first molar",
    "estimated_cost": 15000.00,
    "actual_cost": null,
    "duration_minutes": 90,
    "status": "planned",                // planned, in_progress, completed, cancelled
    "procedure_date": "2025-11-20",
    "procedure_notes": "Patient prefers ceramic",
    "complications": null
}

// Response (201)
{
    "id": "uuid",
    "procedure_code": "D2740",
    "procedure_name": "Crown - Porcelain/Ceramic",
    "tooth_numbers": "26",
    "estimated_cost": 15000.00,
    "status": "planned",
    "procedure_date": "2025-11-20",
    "created_at": "2025-11-16T10:00:00Z",
    // ... full procedure object
}
```

#### **2. GET /dental/procedures/{id}** - Get Procedure by ID
```javascript
// Response (200)
{
    "id": "uuid",
    "procedure_name": "Crown - Porcelain/Ceramic",
    // ... full procedure object
}
```

#### **3. PUT /dental/procedures/{id}** - Update Procedure
```javascript
// Request
{
    "status": "completed",
    "completed_date": "2025-11-20",
    "actual_cost": 15000.00,
    "complications": "None"
}

// Response (200)
{
    // Updated procedure object
}
```

#### **4. PUT /dental/procedures/{id}/status** - Update Procedure Status
```javascript
// Request
{
    "status": "in_progress",
    "notes": "Procedure started"
}

// Response (200)
{
    "id": "uuid",
    "status": "in_progress",
    "updated_at": "2025-11-20T14:00:00Z"
}
```

#### **5. DELETE /dental/procedures/{id}** - Delete Procedure
```javascript
// Response (204 No Content)
```

#### **6. GET /dental/procedures/observation/{id}** - Get Procedures by Observation
```javascript
// Response (200)
{
    "procedures": [ /* procedure objects */ ],
    "total": 2,
    "observation_id": "uuid"
}
```

#### **7. POST /dental/procedures/bulk** - Bulk Create Procedures
```javascript
// Request
{
    "procedures": [
        {
            "procedure_code": "D1110",
            "procedure_name": "Prophylaxis - Adult",
            "tooth_numbers": "all",
            "estimated_cost": 2000.00
        },
        {
            "procedure_code": "D2140",
            "procedure_name": "Amalgam Filling",
            "tooth_numbers": "16,17",
            "estimated_cost": 3000.00
        }
        // ... max 20 procedures
    ]
}

// Response (201)
{
    "created": 2,
    "failed": 0,
    "procedures": [ /* created procedure objects */ ]
}
```

---

### **Dental Chart & Statistics (2 endpoints)**

#### **1. GET /dental/chart/{mobile}/{name}** - Get Complete Dental Chart
```javascript
// Example: GET /dental/chart/9876543210/John
// Response (200)
{
    "patient_mobile_number": "9876543210",
    "patient_first_name": "John",
    "dentition_type": "permanent",      // permanent or primary (based on age)
    "total_teeth": 32,
    "teeth": [
        {
            "tooth_number": "11",
            "status": "healthy",         // healthy, observation, treatment, completed
            "observations_count": 0,
            "procedures_count": 0,
            "last_observation": null,
            "last_procedure": null,
            "has_active_treatment": false
        },
        {
            "tooth_number": "26",
            "status": "treatment",
            "observations_count": 2,
            "procedures_count": 1,
            "last_observation": {
                "condition_type": "Cavity",
                "severity": "Moderate",
                "created_at": "2025-11-16T10:00:00Z"
            },
            "last_procedure": {
                "procedure_name": "Crown - Porcelain/Ceramic",
                "status": "planned",
                "procedure_date": "2025-11-20"
            },
            "has_active_treatment": true
        },
        // ... all 32 teeth
    ],
    "summary": {
        "total_observations": 15,
        "total_procedures": 8,
        "active_treatments": 3,
        "completed_treatments": 5,
        "healthy_teeth": 24,
        "teeth_with_observations": 8
    }
}
```

#### **2. GET /dental/statistics** - Get Dental Statistics
```javascript
// Optional query params: ?start_date=2025-01-01&end_date=2025-12-31
// Response (200)
{
    "total_observations": 450,
    "total_procedures": 280,
    "observations_by_condition": {
        "Cavity": 120,
        "Decay": 85,
        "Fracture": 45,
        "Gum Disease": 60,
        "Other": 140
    },
    "procedures_by_status": {
        "planned": 45,
        "in_progress": 15,
        "completed": 200,
        "cancelled": 20
    },
    "most_affected_teeth": [
        { "tooth_number": "16", "count": 25 },
        { "tooth_number": "26", "count": 22 },
        { "tooth_number": "36", "count": 20 }
    ],
    "procedures_by_type": {
        "D2740": { "name": "Crown", "count": 45 },
        "D1110": { "name": "Prophylaxis", "count": 80 },
        "D2140": { "name": "Amalgam Filling", "count": 65 }
    },
    "average_treatment_cost": 8500.00,
    "total_revenue": 2380000.00
}
```

---

### **🦷 Dental API Field Mapping Notes**

#### **FDI Notation System:**
- **Permanent Teeth (32)**: 11-18, 21-28, 31-38, 41-48
- **Primary Teeth (20)**: 51-55, 61-65, 71-75, 81-85
- **Validation**: Real-time validation on both frontend and backend

#### **Condition Types (14 options):**
Cavity, Decay, Fracture, Crack, Discoloration, Wear, Erosion, Abscess, Gum Disease, Root Exposure, Sensitivity, Missing, Impacted, Other

#### **Tooth Surfaces (7 options):**
Occlusal, Mesial, Distal, Buccal, Lingual, Palatal, Incisal

#### **Procedure Status Workflow:**
```
planned → in_progress → completed
   ↓           ↓            ↓
cancelled ← cancelled ← cancelled
```

#### **Common CDT Codes (20+ pre-configured):**
- D0120 - Periodic Oral Evaluation
- D1110 - Prophylaxis - Adult
- D2140 - Amalgam - One Surface
- D2330 - Composite - One Surface
- D2740 - Crown - Porcelain/Ceramic
- D3310 - Root Canal - Anterior
- D7140 - Extraction - Erupted Tooth
- And more...

#### **Color Coding (Frontend):**
- 🔴 Red: Active issues requiring treatment
- 🟠 Orange: Observations recorded, no procedure
- 🟢 Green: Treatment completed successfully
- 🔵 Blue: Data recorded, no issues
- ⚪ Grey: Healthy tooth, no data

---

**✅ This API Reference Guide provides complete field mappings and request/response formats for all 117+ endpoints including the dental consultation module with FDI tooth charting system.**