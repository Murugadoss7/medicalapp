# API Documentation
## Prescription Management System - REST API Reference

---

**📅 Last Updated**: October 30, 2025  
**🔗 Base URL**: `http://localhost:8000`  
**🔐 Authentication**: Bearer JWT Token  

---

## 📊 API Status Overview

```
✅ Authentication Module     [██████████] 100% Complete
⏳ Doctor Management        [░░░░░░░░░░]   0% Pending
⏳ Patient Management       [░░░░░░░░░░]   0% Pending
⏳ Medicine Management      [░░░░░░░░░░]   0% Pending
⏳ Appointment Management   [░░░░░░░░░░]   0% Pending
⏳ Prescription Management  [░░░░░░░░░░]   0% Pending
```

---

## 🔐 Authentication Endpoints

**Base Path**: `/api/v1/auth`

### **POST** `/api/v1/auth/register`
Register a new user with role assignment.

**Request Body**:
```json
{
  "email": "doctor@example.com",
  "password": "securepassword123",
  "confirm_password": "securepassword123",
  "first_name": "John",
  "last_name": "Doe",
  "role": "doctor",
  "license_number": "DOC123456",    // Required for doctors
  "specialization": "Cardiology"    // Optional for doctors
}
```

**Response** (200):
```json
{
  "id": "uuid-string",
  "email": "doctor@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "role": "doctor",
  "keycloak_id": null,
  "is_active": true,
  "last_login": null,
  "created_at": "2025-10-30T12:00:00Z",
  "updated_at": "2025-10-30T12:00:00Z",
  "full_name": "John Doe",
  "permissions": [
    "read:patients", "write:patients",
    "read:appointments", "write:appointments",
    "read:prescriptions", "write:prescriptions",
    // ... full doctor permissions
  ]
}
```

**Supported Roles**: `super_admin`, `admin`, `doctor`, `nurse`, `receptionist`, `patient`

---

### **POST** `/api/v1/auth/login`
Authenticate user and receive JWT tokens.

**Request Body**:
```json
{
  "email": "doctor@example.com",
  "password": "securepassword123"
}
```

**Response** (200):
```json
{
  "user": {
    "id": "uuid-string",
    "email": "doctor@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "doctor",
    "full_name": "John Doe",
    "permissions": ["read:patients", "write:patients", "..."]
  },
  "tokens": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "expires_in": 1800  // 30 minutes
  },
  "permissions": ["read:patients", "write:patients", "..."]
}
```

---

### **GET** `/api/v1/auth/me`
Get current authenticated user profile.

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200):
```json
{
  "id": "uuid-string",
  "email": "doctor@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "role": "doctor",
  "keycloak_id": null,
  "is_active": true,
  "last_login": "2025-10-30T12:00:00",
  "created_at": "2025-10-30T12:00:00Z",
  "updated_at": "2025-10-30T12:00:00Z",
  "full_name": "John Doe",
  "permissions": ["read:patients", "write:patients", "..."]
}
```

---

### **POST** `/api/v1/auth/refresh`
Refresh access token using refresh token.

**Request Body**:
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response** (200):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

---

### **POST** `/api/v1/auth/logout`
Logout current user (invalidate tokens).

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200):
```json
{
  "message": "Successfully logged out"
}
```

---

### **POST** `/api/v1/auth/change-password`
Change user password.

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "current_password": "oldpassword123",
  "new_password": "newpassword456",
  "confirm_new_password": "newpassword456"
}
```

**Response** (200):
```json
{
  "message": "Password updated successfully"
}
```

---

## 🩺 Doctor Management Endpoints

**Base Path**: `/api/v1/doctors`  
**Status**: 🔄 **PLANNED - Module 2**

### **Planned Endpoints**:
```
POST   /api/v1/doctors/           - Create doctor profile
GET    /api/v1/doctors/           - List doctors (with filtering)
GET    /api/v1/doctors/{id}       - Get doctor details
PUT    /api/v1/doctors/{id}       - Update doctor profile
DELETE /api/v1/doctors/{id}       - Deactivate doctor
GET    /api/v1/doctors/{id}/schedule - Get doctor availability
PUT    /api/v1/doctors/{id}/schedule - Update doctor availability
```

---

## 👥 Patient Management Endpoints

**Base Path**: `/api/v1/patients`  
**Status**: 🔄 **PLANNED - Module 3**

### **Special Features**:
- **Composite Key Support**: `mobile_number + first_name`
- **Family Registration**: Multiple patients per mobile number
- **Complex Relationships**: Family member linking

### **Planned Endpoints**:
```
POST   /api/v1/patients/                     - Register patient (composite key)
GET    /api/v1/patients/                     - List patients
GET    /api/v1/patients/{mobile}/{name}      - Get patient by composite key
PUT    /api/v1/patients/{mobile}/{name}      - Update patient
DELETE /api/v1/patients/{mobile}/{name}      - Deactivate patient
GET    /api/v1/patients/families/{mobile}    - Get family members
POST   /api/v1/patients/families/{mobile}    - Add family member
```

---

## 💊 Medicine Management Endpoints

**Base Path**: `/api/v1/medicines`, `/api/v1/short-keys`  
**Status**: 🔄 **PLANNED - Module 4**

### **Planned Endpoints**:
```
GET    /api/v1/medicines/                    - Search medicines
POST   /api/v1/medicines/                    - Add medicine
GET    /api/v1/medicines/{id}                - Get medicine details
PUT    /api/v1/medicines/{id}                - Update medicine
GET    /api/v1/medicines/interactions        - Check drug interactions

GET    /api/v1/short-keys/                   - Get user's short keys
POST   /api/v1/short-keys/                   - Create short key
PUT    /api/v1/short-keys/{id}               - Update short key
DELETE /api/v1/short-keys/{id}               - Delete short key
```

---

## 📅 Appointment Management Endpoints

**Base Path**: `/api/v1/appointments`  
**Status**: 🔄 **PLANNED - Module 5**

### **Planned Endpoints**:
```
POST   /api/v1/appointments/                 - Schedule appointment
GET    /api/v1/appointments/                 - List appointments
GET    /api/v1/appointments/{id}             - Get appointment details
PUT    /api/v1/appointments/{id}             - Update appointment
DELETE /api/v1/appointments/{id}             - Cancel appointment
GET    /api/v1/appointments/calendar/{date}  - Get daily schedule
```

---

## 📋 Prescription Management Endpoints

**Base Path**: `/api/v1/prescriptions`  
**Status**: 🔄 **PLANNED - Module 6**

### **Planned Endpoints**:
```
POST   /api/v1/prescriptions/                - Create prescription
GET    /api/v1/prescriptions/                - List prescriptions
GET    /api/v1/prescriptions/{id}            - Get prescription details
PUT    /api/v1/prescriptions/{id}            - Update prescription
DELETE /api/v1/prescriptions/{id}            - Cancel prescription
GET    /api/v1/prescriptions/{id}/pdf        - Generate PDF
POST   /api/v1/prescriptions/templates       - Save as template
```

---

## 🔒 Authentication & Authorization

### **JWT Token Details**
- **Access Token**: 30 minutes expiry
- **Refresh Token**: 7 days expiry
- **Algorithm**: HS256
- **Format**: `Authorization: Bearer <token>`

### **Role-Based Permissions**

#### **Super Admin**
```json
["admin:all", "read:all", "write:all", "delete:all"]
```

#### **Admin**
```json
[
  "read:users", "write:users", "read:doctors", "write:doctors",
  "read:patients", "write:patients", "read:appointments", "write:appointments",
  "read:prescriptions", "write:prescriptions", "read:medicines", "write:medicines",
  "read:reports", "admin:system"
]
```

#### **Doctor**
```json
[
  "read:patients", "write:patients", "read:appointments", "write:appointments",
  "read:prescriptions", "write:prescriptions", "read:medicines",
  "read:short_keys", "write:short_keys", "read:medical_history",
  "write:medical_history", "read:own_profile", "write:own_profile"
]
```

#### **Nurse**
```json
[
  "read:patients", "read:appointments", "write:appointments",
  "read:prescriptions", "read:medicines", "read:medical_history"
]
```

#### **Receptionist**
```json
[
  "read:patients", "write:patients", "read:appointments", "write:appointments",
  "read:doctors", "read:medicines"
]
```

#### **Patient**
```json
[
  "read:own_data", "read:family_data", "write:own_appointments",
  "read:own_prescriptions", "read:own_medical_history"
]
```

---

## 📊 Error Response Format

### **Standard Error Response**:
```json
{
  "detail": "Error message description",
  "error_code": "SPECIFIC_ERROR_CODE",
  "timestamp": "2025-10-30T12:00:00Z"
}
```

### **Common HTTP Status Codes**:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate data)
- `422` - Unprocessable Entity (validation failed)
- `500` - Internal Server Error

---

## 🧪 Testing

### **Authentication Module Testing**
- ✅ **Registration Test**: All validation scenarios
- ✅ **Login Test**: Successful and failed authentication
- ✅ **Protected Endpoint Test**: Token validation
- ✅ **Integration Test**: End-to-end authentication flow

**Test Script**: `test_auth_simple.py`  
**Status**: All tests passing ✅

---

## 📋 Development Notes

### **Database Schema**
- **ERD Compliance**: All APIs follow ERD specifications
- **Composite Keys**: Patient table uses `(mobile_number, first_name)`
- **Relationships**: Proper foreign key relationships maintained
- **Migrations**: Schema changes tracked with Alembic

### **Code Standards**
- **Validation**: Pydantic schemas for all endpoints
- **Error Handling**: Comprehensive error responses
- **Security**: JWT authentication, password hashing, role-based access
- **Testing**: Test coverage for all endpoints before deployment
- **Documentation**: OpenAPI/Swagger auto-generated docs available

### **Development Workflow**
```
ERD Reference → API Design → Implementation → Testing → Documentation → Frontend Integration
```

---

**📌 Next Module**: Doctor Management API endpoints  
**🎯 Goal**: Complete REST API implementation for all modules with comprehensive testing