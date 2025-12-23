# Entity Relationship Diagram (ERD)
## Prescription Management System - Database Schema

---

**📅 Last Updated**: December 23, 2025
**🎯 Purpose**: Single source of truth for database schema, field mappings, and relationships
**📋 Status**: Production Implementation Complete - All 10 modules implemented including dental consultation and AI case studies
**📅 Date Standardization**: Standardized date handling implemented across all modules
**🚀 Recent Updates**:
- **AI Case Study Generation** ⭐ NEW: GPT-powered case study generation from treatment data
- **Dental File Attachments** ⭐ NEW: File upload on observations and post-procedure uploads
- **Case Study History** ⭐ NEW: View, print, and delete saved case studies
- **Treatment Dashboard** ⭐ NEW: Tooth-grouped treatment journey view for case study selection
- **iPad Performance Optimizations**: useTransition + module-level Set guards prevent page freeze on tablet
- **Dental Consultation Layout**: Side-by-side layout (55% chart / 45% observations) replaces tabs
- **ObservationRow Component**: Inline observation form with collapsible procedure expansion
- **DentalSummaryTable**: Holistic treatment summary showing all teeth and conditions
- **TodayAppointmentsSidebar**: Persistent right sidebar showing today's appointments for doctors
- **Appointment Status Transitions**: Backend now allows direct `scheduled → in_progress` transition for consultation workflow
- **Toast Notification System**: Browser alerts replaced with ToastContext-based notifications
- Dental module complete (4 tables, 20+ indexes)
- UserResponse schema includes `doctor_id` and `specialization` for doctors
- Doctor ownership validation enforced for prescription operations  

---

## 🗄️ Database Tables Overview

### **Core Entities (12 Primary Tables)**
1. **users** - Authentication and user management (includes specialization for doctors)
2. **doctors** - Doctor profiles and specializations
3. **patients** - Patient records with composite key (mobile + firstName)
4. **medicines** - Medicine catalog with ATC codes
5. **short_keys** - Quick prescription templates
6. **appointments** - Doctor-patient scheduling
7. **prescriptions** - Prescription management
8. **dental_observations** - Tooth-level observations with FDI notation
9. **dental_procedures** - Dental procedures and treatments
10. **dental_observation_templates** - Pre-defined observation note templates
11. **dental_attachments** - File uploads for observations, procedures, and case studies ⭐ NEW
12. **case_studies** - AI-generated treatment case studies ⭐ NEW

### **Junction/Relationship Tables**
- **short_key_medicines** - Many-to-many: Short keys ↔ Medicines
- **prescription_items** - One-to-many: Prescriptions ↔ Medicines

---

## 📋 Table Schemas & Field Mappings

### **1. USERS Table**
```sql
CREATE TABLE users (
    -- Primary Key
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Authentication Fields
    email               VARCHAR(255) UNIQUE NOT NULL,
    hashed_password     VARCHAR(255),           -- For local auth
    keycloak_id         VARCHAR(255),           -- For Keycloak integration (nullable)
    
    -- Role & Permissions
    role                user_role_enum NOT NULL DEFAULT 'patient',
    -- ENUM: 'super_admin', 'admin', 'doctor', 'nurse', 'receptionist', 'patient'
    -- 'admin': System administrators with full access to doctor/patient/medicine management
    -- 'doctor': Medical professionals with consultation and prescription capabilities  
    -- 'patient': End users with appointment booking and profile management access
    -- 'nurse', 'receptionist': Staff roles with limited system access
    -- 'super_admin': Technical administrators with system configuration access
    
    -- Personal Information
    first_name          VARCHAR(100) NOT NULL,
    last_name           VARCHAR(100) NOT NULL,
    phone               VARCHAR(20),
    
    -- Verification Status
    is_email_verified   BOOLEAN DEFAULT FALSE,
    is_phone_verified   BOOLEAN DEFAULT FALSE,
    
    -- Session Management
    last_login_at       TIMESTAMP,
    
    -- Audit Fields (inherited from BaseModel)
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by          UUID,
    is_active           BOOLEAN DEFAULT TRUE
);
```

**🔗 Frontend Field Mapping:**
```javascript
// API Response Format (UserResponse schema)
{
    "id": "uuid",
    "email": "string",
    "role": "doctor|admin|patient|nurse|receptionist|super_admin",
    "first_name": "string",
    "last_name": "string",
    "full_name": "string",             // ⭐ Computed: first_name + last_name
    "phone": "string",
    "is_email_verified": boolean,
    "is_phone_verified": boolean,
    "last_login_at": "datetime",
    "created_at": "datetime",
    "updated_at": "datetime",
    "is_active": boolean,
    "permissions": ["string"],          // ⭐ Computed: Role-based permissions array

    // ⭐ For doctor role only (returned by login and /auth/me):
    "specialization": "string",         // Doctor's specialization from doctors table
    "doctor_id": "uuid"                 // Doctor's ID from doctors table (for prescription ownership)
}

// Note: specialization and doctor_id fields are populated by joining with doctors table
// These fields are null/undefined for non-doctor roles
```

---

### **2. DOCTORS Table**
```sql
CREATE TABLE doctors (
    -- Primary Key
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User Relationship (One-to-One)
    user_id             UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    -- Professional Information
    license_number      VARCHAR(50) UNIQUE NOT NULL,
    specialization      VARCHAR(200) NOT NULL,
    qualification       TEXT NOT NULL,
    experience_years    INTEGER DEFAULT 0,
    
    -- Contact & Address
    phone               VARCHAR(20),
    emergency_contact   VARCHAR(20),
    address             TEXT,
    clinic_address      TEXT,                    -- Deprecated: Use offices instead

    -- Multiple Office Locations (JSONB array) ⭐ NEW
    offices             JSONB DEFAULT '[]',      -- Array of office locations
    -- Structure: [{"id": "uuid-string", "name": "Main Clinic", "address": "123 Main St", "is_primary": true}]

    -- Professional Details
    consultation_fee    DECIMAL(10,2),
    available_days      VARCHAR(20) DEFAULT 'MON,TUE,WED,THU,FRI',
    start_time          TIME DEFAULT '09:00:00',
    end_time            TIME DEFAULT '22:00:00',
    lunch_break_start   TIME DEFAULT '13:00:00',
    lunch_break_end     TIME DEFAULT '14:00:00',
    
    -- Status
    is_available        BOOLEAN DEFAULT TRUE,
    
    -- Audit Fields
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by          UUID,
    is_active           BOOLEAN DEFAULT TRUE
);
```

**🔗 Frontend Field Mapping:**
```javascript
// API Response Format
{
    "id": "uuid",
    "user_id": "uuid",
    "license_number": "string",
    "specialization": "string",
    "qualification": "string",
    "experience_years": number,
    "phone": "string",
    "emergency_contact": "string",
    "address": "string",
    "clinic_address": "string",    // Deprecated: Use offices instead
    "offices": [                   // ⭐ NEW: Multiple office locations
        {
            "id": "uuid-string",   // Unique office ID
            "name": "string",      // Office name (e.g., "Main Clinic")
            "address": "string",   // Full address
            "is_primary": boolean  // Primary office flag
        }
    ],
    "consultation_fee": number,
    "available_days": "string", // "MON,TUE,WED,THU,FRI"
    "start_time": "time",       // "09:00:00"
    "end_time": "time",         // "22:00:00"  
    "lunch_break_start": "time",
    "lunch_break_end": "time",
    "is_available": boolean,
    "created_at": "datetime",
    "updated_at": "datetime",
    "is_active": boolean,
    
    // Computed Fields (from API)
    "full_name": "string",
    "years_of_experience": number,
    "is_available_today": boolean,
    "available_days_list": ["MON", "TUE", ...]
}
```

---

### **3. PATIENTS Table (Composite Primary Key)**
```sql
CREATE TABLE patients (
    -- Composite Primary Key
    mobile_number       VARCHAR(15) NOT NULL,
    first_name          VARCHAR(100) NOT NULL,
    PRIMARY KEY (mobile_number, first_name),
    
    -- Internal UUID for references
    id                  UUID UNIQUE DEFAULT gen_random_uuid(),
    
    -- Personal Information
    last_name           VARCHAR(100) NOT NULL,
    date_of_birth       DATE NOT NULL,
    gender              gender_enum NOT NULL,
    -- ENUM: 'male', 'female', 'other'
    
    -- Contact Information
    email               VARCHAR(255),
    address             TEXT,
    emergency_contact   VARCHAR(20),
    
    -- Family Information
    relationship        VARCHAR(50),    -- "self", "spouse", "child", "parent"
    primary_member      BOOLEAN DEFAULT TRUE,
    
    -- Medical Information
    blood_group         VARCHAR(5),
    allergies           TEXT,
    chronic_conditions  TEXT,
    emergency_notes     TEXT,
    
    -- Audit Fields
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by          UUID,
    is_active           BOOLEAN DEFAULT TRUE
);
```

**🔗 Frontend Field Mapping:**
```javascript
// API Response Format
{
    // Composite Key
    "mobile_number": "string",      // Primary key part 1
    "first_name": "string",         // Primary key part 2
    
    // Internal Reference
    "id": "uuid",                   // For foreign key references
    
    // Personal Info
    "last_name": "string",
    "date_of_birth": "date",        // "YYYY-MM-DD"
    "gender": "male|female|other",
    
    // Contact
    "email": "string",
    "address": "string",
    "emergency_contact": "string",
    
    // Family
    "relationship": "string",        // "self", "spouse", "child", "parent"
    "primary_member": boolean,
    
    // Medical
    "blood_group": "string",        // "O+", "A-", etc.
    "allergies": "string",
    "chronic_conditions": "string",
    "emergency_notes": "string",
    
    // Audit
    "created_at": "datetime",
    "updated_at": "datetime",
    "is_active": boolean,
    
    // Computed Fields (from API)
    "full_name": "string",          // first_name + last_name
    "age": number,                  // calculated from date_of_birth
    "composite_key": "string"       // mobile_number + first_name
}
```

---

### **4. MEDICINES Table**
```sql
CREATE TABLE medicines (
    -- Primary Key
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Information
    name                VARCHAR(200) NOT NULL,
    generic_name        VARCHAR(200),
    brand_name          VARCHAR(200),
    
    -- Classification
    atc_code            VARCHAR(20),        -- Anatomical Therapeutic Chemical
    category            VARCHAR(100) NOT NULL,
    subcategory         VARCHAR(100),
    
    -- Physical Properties
    strength            VARCHAR(50),        -- "500mg", "10ml"
    dosage_form         VARCHAR(50) NOT NULL, -- "tablet", "syrup", "injection"
    pack_size           VARCHAR(50),        -- "strip of 10", "bottle of 100ml"
    
    -- Commercial Information
    manufacturer        VARCHAR(200) NOT NULL,
    price_per_unit      DECIMAL(10,2),
    mrp                 DECIMAL(10,2),
    
    -- Regulatory
    is_prescription_required BOOLEAN DEFAULT TRUE,
    is_otc              BOOLEAN DEFAULT FALSE,  -- Over The Counter
    schedule            VARCHAR(10),        -- "H", "X", etc.
    
    -- Clinical Information
    indications         TEXT,
    contraindications   TEXT,
    side_effects        TEXT,
    drug_interactions   TEXT,
    
    -- Inventory
    current_stock       INTEGER DEFAULT 0,
    minimum_stock       INTEGER DEFAULT 10,
    
    -- Audit Fields
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by          UUID,
    is_active           BOOLEAN DEFAULT TRUE
);
```

**🔗 Frontend Field Mapping:**
```javascript
// API Response Format
{
    "id": "uuid",
    "name": "string",
    "generic_name": "string",
    "brand_name": "string",
    
    // Classification
    "atc_code": "string",
    "category": "string",
    "subcategory": "string",
    
    // Physical
    "strength": "string",
    "dosage_form": "string",
    "pack_size": "string",
    
    // Commercial
    "manufacturer": "string",
    "price_per_unit": number,
    "mrp": number,
    
    // Regulatory
    "is_prescription_required": boolean,
    "is_otc": boolean,
    "schedule": "string",
    
    // Clinical
    "indications": "string",
    "contraindications": "string", 
    "side_effects": "string",
    "drug_interactions": "string",
    
    // Inventory
    "current_stock": number,
    "minimum_stock": number,
    
    // Audit
    "created_at": "datetime",
    "updated_at": "datetime",
    "is_active": boolean,
    
    // Computed Fields (from API)
    "display_name": "string",       // brand_name or generic_name
    "full_description": "string",   // name + strength + dosage_form
    "is_low_stock": boolean,        // current_stock <= minimum_stock
    "price_display": "string"      // formatted price
}
```

---

### **5. SHORT_KEYS Table**
```sql
CREATE TABLE short_keys (
    -- Primary Key
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Short Key Information
    code                VARCHAR(20) UNIQUE NOT NULL,  -- "FEVER", "COLD", "HTN"
    name                VARCHAR(200) NOT NULL,
    description         TEXT,
    
    -- Usage Information
    indication          VARCHAR(500),       -- When to use this short key
    usage_instructions  TEXT,
    
    -- Metadata
    is_global           BOOLEAN DEFAULT FALSE, -- Available to all doctors
    created_by_doctor   UUID REFERENCES doctors(id),
    usage_count         INTEGER DEFAULT 0,
    last_used_at        TIMESTAMP,
    
    -- Status
    is_popular          BOOLEAN DEFAULT FALSE,
    
    -- Audit Fields
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by          UUID,
    is_active           BOOLEAN DEFAULT TRUE
);

-- Junction Table: short_key_medicines
CREATE TABLE short_key_medicines (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    short_key_id        UUID NOT NULL REFERENCES short_keys(id) ON DELETE CASCADE,
    medicine_id         UUID NOT NULL REFERENCES medicines(id),
    
    -- Default Prescription Details
    default_dosage      VARCHAR(100) NOT NULL,
    default_frequency   VARCHAR(100) NOT NULL,
    default_duration    VARCHAR(100) NOT NULL,
    default_quantity    INTEGER DEFAULT 1,
    instructions        TEXT,
    sequence_order      INTEGER NOT NULL DEFAULT 1,
    
    -- Audit Fields
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by          UUID,
    is_active           BOOLEAN DEFAULT TRUE,
    
    UNIQUE(short_key_id, medicine_id)
);
```

**🔗 Frontend Field Mapping:**
```javascript
// Short Key API Response Format
{
    "id": "uuid",
    "code": "string",               // "FEVER", "COLD" (unique, uppercase)
    "name": "string",
    "description": "string",
    "indication": "string",
    "usage_instructions": "string",
    "is_global": boolean,
    "created_by_doctor": "uuid",
    "usage_count": number,
    "last_used_at": "datetime",
    "is_popular": boolean,
    "created_at": "datetime",
    "updated_at": "datetime",
    "is_active": boolean,

    // Related Medicines (from junction table)
    "medicines": [
        {
            "medicine_id": "uuid",
            "medicine_name": "string",
            "default_dosage": "string",         // Editable in UI ⭐
            "default_frequency": "string",      // Editable in UI ⭐
            "default_duration": "string",       // Editable in UI ⭐
            "default_quantity": number,         // Editable in UI ⭐
            "instructions": "string",           // Editable in UI ⭐
            "sequence_order": number            // Reorderable via drag-drop ⭐
        }
    ],

    // Computed Fields
    "total_medicines": number,
    "can_edit": boolean,            // if current user created it
    "usage_display": "string"       // formatted usage count
}

// ⭐ Frontend Integration (ShortKeyManagement.tsx - 702 lines):
// - Complete CRUD interface at /shortcuts route
// - Inline editing for all medicine fields with validation
// - Drag-and-drop reordering with automatic sequence_order update
// - Real-time search and filtering
// - Usage: Type /CODE in prescription medicine search (e.g., /DAE)
// - RTK Query mutations: listShortKeys, createShortKey, updateShortKey,
//   deleteShortKey, addMedicineToShortKey, removeMedicineFromShortKey
```

---

### **6. APPOINTMENTS Table**
```sql
CREATE TABLE appointments (
    -- Primary Key
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Unique Identifier
    appointment_number  VARCHAR(100) UNIQUE NOT NULL,
    
    -- Patient Reference (Composite Key)
    patient_mobile_number VARCHAR(15) NOT NULL,
    patient_first_name    VARCHAR(100) NOT NULL,
    patient_uuid          UUID NOT NULL REFERENCES patients(id),
    
    -- Doctor Reference
    doctor_id           UUID NOT NULL REFERENCES doctors(id),
    office_id           VARCHAR(50),             -- ⭐ NEW: Office ID from doctor's offices JSONB array

    -- Appointment Scheduling
    appointment_date    DATE NOT NULL,
    appointment_time    TIME NOT NULL,
    duration_minutes    INTEGER DEFAULT 30,
    
    -- Appointment Details
    status              appointment_status_enum DEFAULT 'scheduled',
    -- ENUM: 'scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled'
    
    reason_for_visit    TEXT NOT NULL,
    notes               TEXT,
    contact_number      VARCHAR(20),
    
    -- Audit Fields
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by          UUID,
    is_active           BOOLEAN DEFAULT TRUE
);
```

**🔗 Frontend Field Mapping:**
```javascript
// API Response Format
{
    "id": "uuid",
    "appointment_number": "string",     // "APT20251031001"
    
    // Patient (Composite Key)
    "patient_mobile_number": "string",
    "patient_first_name": "string", 
    "patient_uuid": "uuid",
    
    // Doctor
    "doctor_id": "uuid",
    "office_id": "string",               // ⭐ NEW: Office ID from doctor's offices array

    // Scheduling
    "appointment_date": "date",         // "2025-10-31"
    "appointment_time": "time",         // "09:30:00"
    "duration_minutes": number,         // 30
    
    // Details
    "status": "scheduled|confirmed|in_progress|completed|cancelled|no_show|rescheduled",
    "reason_for_visit": "string",
    "notes": "string",
    "contact_number": "string",
    
    // Audit
    "created_at": "datetime",
    "updated_at": "datetime", 
    "is_active": boolean,
    
    // Computed Fields (from API)
    "appointment_datetime": "datetime", // combined date + time
    "end_datetime": "datetime",         // appointment_datetime + duration
    "is_today": boolean,
    "is_upcoming": boolean,
    "is_past": boolean,
    "can_be_cancelled": boolean,
    "can_be_rescheduled": boolean,
    "status_display": "string",
    
    // Related Data (when included)
    "patient_details": {
        "full_name": "string",
        "age": number,
        "mobile_number": "string"
    },
    "doctor_details": {
        "full_name": "string", 
        "specialization": "string"
    }
}
```

---

### **7. PRESCRIPTIONS Table**
```sql
CREATE TABLE prescriptions (
    -- Primary Key
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Unique Identifier
    prescription_number VARCHAR(100) UNIQUE NOT NULL,
    
    -- Patient Reference (Composite Key)
    patient_mobile_number VARCHAR(15) NOT NULL,
    patient_first_name    VARCHAR(100) NOT NULL,
    patient_uuid          UUID NOT NULL REFERENCES patients(id),
    
    -- Doctor Reference
    doctor_id           UUID NOT NULL REFERENCES doctors(id),
    
    -- Appointment Reference (Optional)
    appointment_id      UUID REFERENCES appointments(id),
    
    -- Visit Information
    visit_date          DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Clinical Information
    chief_complaint     TEXT,
    diagnosis           TEXT NOT NULL,
    symptoms            TEXT,
    clinical_notes      TEXT,
    doctor_instructions TEXT,
    
    -- Status & Metadata
    status              prescription_status_enum DEFAULT 'active',
    -- ENUM: 'draft', 'active', 'dispensed', 'completed', 'cancelled', 'expired'
    
    -- Printing Information
    is_printed          BOOLEAN DEFAULT FALSE,
    printed_at          TIMESTAMP,
    template_used       VARCHAR(100),
    
    -- Audit Fields
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by          UUID,
    is_active           BOOLEAN DEFAULT TRUE
);

-- Prescription Items (One-to-Many)
CREATE TABLE prescription_items (
    -- Primary Key
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign Keys
    prescription_id     UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    medicine_id         UUID NOT NULL REFERENCES medicines(id),
    
    -- Prescription Details
    dosage              VARCHAR(100) NOT NULL,    -- "500mg"
    frequency           VARCHAR(100) NOT NULL,    -- "Twice daily"
    duration            VARCHAR(100) NOT NULL,    -- "5 days"
    instructions        TEXT,                     -- "Take after meals"
    
    -- Quantity & Pricing
    quantity            INTEGER NOT NULL DEFAULT 1,
    unit_price          DECIMAL(10,2),
    total_amount        DECIMAL(10,2),
    
    -- Options
    is_generic_substitution_allowed BOOLEAN DEFAULT TRUE,
    sequence_order      INTEGER NOT NULL DEFAULT 1,
    
    -- Audit Fields
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by          UUID,
    is_active           BOOLEAN DEFAULT TRUE
);
```

**🔗 Frontend Field Mapping:**
```javascript
// Prescription API Response Format
{
    "id": "uuid",
    "prescription_number": "string",    // "RX20251031001"

    // Patient (Composite Key)
    "patient_mobile_number": "string",
    "patient_first_name": "string",
    "patient_uuid": "uuid",

    // Doctor & Appointment
    "doctor_id": "uuid",
    "appointment_id": "uuid",           // optional

    // Visit
    "visit_date": "date",               // "2025-10-31"

    // Clinical
    "chief_complaint": "string",
    "diagnosis": "string",
    "symptoms": "string",
    "clinical_notes": "string",
    "doctor_instructions": "string",

    // Status
    "status": "draft|active|dispensed|completed|cancelled|expired",

    // Printing
    "is_printed": boolean,
    "printed_at": "datetime",
    "template_used": "string",

    // Audit
    "created_at": "datetime",
    "updated_at": "datetime",
    "is_active": boolean,

    // Prescription Items
    "items": [
        {
            "id": "uuid",
            "medicine_id": "uuid",
            "medicine_name": "string",      // from medicine table
            "dosage": "string",             // ⭐ NOW FULLY EDITABLE
            "frequency": "string",          // ⭐ NOW FULLY EDITABLE
            "duration": "string",           // ⭐ NOW FULLY EDITABLE
            "instructions": "string",       // ⭐ NOW FULLY EDITABLE
            "quantity": number,             // ⭐ NOW FULLY EDITABLE
            "unit_price": number,
            "total_amount": number,
            "is_generic_substitution_allowed": boolean,
            "sequence_order": number,
            "is_active": boolean,           // ⭐ Soft delete support

            // Computed
            "formatted_instruction": "string",
            "calculated_total": number
        }
    ],

    // Computed Fields (from API)
    "patient_composite_key": ["string", "string"],
    "total_medicines": number,
    "total_amount": number,
    "can_be_modified": boolean,
    "is_expired": boolean,
    "days_until_expiry": number,

    // Related Data (when included)
    "patient_details": {
        "full_name": "string",
        "age": number,
        "mobile_number": "string"
    },
    "doctor_details": {
        "full_name": "string",
        "specialization": "string",
        "license_number": "string"
    }
}

// ⭐ Recent Prescription Management Updates:
// 1. Items Fully Editable: All prescription item fields now editable in PrescriptionViewer
// 2. Soft Delete Filtering: DELETE operations filter is_active=false items in UI
// 3. Doctor Ownership: Backend validates doctor_id for all operations
// 4. Cache Invalidation: Prescription-specific tags for better RTK Query performance
// 5. DentalPrescriptionBuilder: Fixed immutable array handling for shortcuts
// 6. Removed "New Prescription" Button: Streamlined workflow from PrescriptionView
```

---

### **8. DENTAL_OBSERVATIONS Table**
```sql
CREATE TABLE dental_observations (
    -- Primary Key
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Foreign Keys
    prescription_id         UUID REFERENCES prescriptions(id),
    appointment_id          UUID REFERENCES appointments(id),

    -- Patient Composite Key
    patient_mobile_number   VARCHAR(20) NOT NULL,
    patient_first_name      VARCHAR(100) NOT NULL,

    -- Tooth Information (FDI Notation)
    tooth_number            VARCHAR(3) NOT NULL,    -- FDI: 11-48 (permanent), 51-85 (primary)
    tooth_surface           VARCHAR(10),            -- Occlusal, Mesial, Distal, Buccal, Lingual, Palatal, Incisal

    -- Observation Details
    condition_type          VARCHAR(50) NOT NULL,   -- Cavity, Decay, Fracture, etc. (14 types)
    severity                VARCHAR(20),            -- Mild, Moderate, Severe
    observation_notes       TEXT,                   -- Combined template notes + custom notes

    -- Template Support ⭐ NEW
    selected_template_ids   TEXT,                   -- Comma-separated UUIDs of selected templates
    custom_notes            TEXT,                   -- Additional notes beyond templates

    -- Treatment Tracking
    treatment_required      BOOLEAN DEFAULT TRUE NOT NULL,
    treatment_done          BOOLEAN DEFAULT FALSE NOT NULL,
    treatment_date          DATE,

    -- Audit Fields
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by              UUID,
    is_active               BOOLEAN DEFAULT TRUE
);
```

**🔗 Frontend Field Mapping:**
```javascript
// API Response Format
{
    "id": "uuid",
    "prescription_id": "uuid",          // optional
    "appointment_id": "uuid",           // optional

    // Patient
    "patient_mobile_number": "string",
    "patient_first_name": "string",

    // Tooth (FDI Notation)
    "tooth_number": "string",           // "26" (FDI notation)
    "tooth_surface": "string",          // "Occlusal"

    // Observation
    "condition_type": "string",         // "Cavity"
    "severity": "string",               // "Moderate"
    "observation_notes": "string",

    // Treatment
    "treatment_required": boolean,
    "treatment_done": boolean,
    "treatment_date": "date",           // "2025-11-16"

    // Template Support ⭐ NEW
    "selected_template_ids": "string",  // Comma-separated UUIDs
    "custom_notes": "string",           // Additional custom notes

    // Audit
    "created_at": "datetime",
    "updated_at": "datetime",
    "is_active": boolean
}
```

**FDI Notation System:**
- **Permanent Teeth (32)**: Quadrants 1-4 (11-18, 21-28, 31-38, 41-48)
- **Primary Teeth (20)**: Quadrants 5-8 (51-55, 61-65, 71-75, 81-85)
- **Validation**: Real-time FDI notation validation on backend and frontend

**Condition Types (14):**
Cavity, Decay, Fracture, Crack, Discoloration, Wear, Erosion, Abscess, Gum Disease, Root Exposure, Sensitivity, Missing, Impacted, Other

**Tooth Surfaces (7):**
Occlusal, Mesial, Distal, Buccal, Lingual, Palatal, Incisal

---

### **9. DENTAL_PROCEDURES Table** ⭐ NEW
```sql
CREATE TABLE dental_procedures (
    -- Primary Key
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Foreign Keys
    observation_id      UUID REFERENCES dental_observations(id),
    prescription_id     UUID REFERENCES prescriptions(id),
    appointment_id      UUID REFERENCES appointments(id),

    -- Procedure Information
    procedure_code      VARCHAR(20) NOT NULL,       -- CDT code (e.g., "D2740")
    procedure_name      VARCHAR(200) NOT NULL,      -- "Crown - Porcelain/Ceramic"
    tooth_numbers       TEXT,                       -- Comma-separated: "11,12,13"

    -- Procedure Details
    description         TEXT,
    estimated_cost      DECIMAL(10,2),
    actual_cost         DECIMAL(10,2),
    duration_minutes    INTEGER,

    -- Status & Dates
    status              VARCHAR(20) DEFAULT 'planned' NOT NULL,
    -- ENUM: 'planned', 'in_progress', 'completed', 'cancelled'
    procedure_date      DATE,
    completed_date      DATE,

    -- Notes
    procedure_notes     TEXT,
    complications       TEXT,

    -- Audit Fields
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by          UUID,
    is_active           BOOLEAN DEFAULT TRUE
);
```

**🔗 Frontend Field Mapping:**
```javascript
// API Response Format
{
    "id": "uuid",
    "observation_id": "uuid",           // optional
    "prescription_id": "uuid",          // optional
    "appointment_id": "uuid",           // optional

    // Procedure
    "procedure_code": "string",         // "D2740" (CDT code)
    "procedure_name": "string",         // "Crown - Porcelain/Ceramic"
    "tooth_numbers": "string",          // "26" or "11,12,13"
    "description": "string",

    // Cost & Duration
    "estimated_cost": number,           // 15000.00
    "actual_cost": number,              // 15000.00
    "duration_minutes": number,         // 90

    // Status
    "status": "planned|in_progress|completed|cancelled",
    "procedure_date": "date",           // "2025-11-20"
    "completed_date": "date",           // "2025-11-20"

    // Notes
    "procedure_notes": "string",
    "complications": "string",

    // Audit
    "created_at": "datetime",
    "updated_at": "datetime",
    "is_active": boolean
}
```

**Common CDT Codes (20+ pre-configured):**
- D0120 - Periodic Oral Evaluation
- D1110 - Prophylaxis - Adult
- D2140 - Amalgam - One Surface
- D2330 - Composite - One Surface
- D2740 - Crown - Porcelain/Ceramic
- D3310 - Root Canal - Anterior
- D3320 - Root Canal - Bicuspid
- D7140 - Extraction - Erupted Tooth
- D7210 - Extraction - Surgical

**Procedure Status Workflow:**
```
planned → in_progress → completed
   ↓           ↓            ↓
cancelled ← cancelled ← cancelled
```

---

### **10. DENTAL_OBSERVATION_TEMPLATES Table** ⭐ NEW
```sql
CREATE TABLE dental_observation_templates (
    -- Primary Key
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Matching Criteria (NULL = wildcard, matches all)
    condition_type          VARCHAR(50),            -- "Cavity", NULL = all conditions
    tooth_surface           VARCHAR(10),            -- "Occlusal", NULL = all surfaces
    severity                VARCHAR(20),            -- "Moderate", NULL = all severities

    -- Template Content
    template_text           TEXT NOT NULL,          -- Pre-defined note text
    short_code              VARCHAR(20),            -- Quick reference code (e.g., "CAV-OCC-M")
    display_order           INTEGER DEFAULT 0,      -- Sort order for display

    -- Access Control
    is_global               BOOLEAN DEFAULT FALSE,  -- Available to same specialization doctors
    specialization          VARCHAR(200),           -- Filter by doctor specialty
    created_by_doctor       UUID REFERENCES doctors(id),

    -- Audit Fields
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by              UUID,
    is_active               BOOLEAN DEFAULT TRUE
);
```

**🔗 Frontend Field Mapping:**
```javascript
// API Response Format
{
    "id": "uuid",

    // Matching Criteria (NULL = wildcard)
    "condition_type": "string|null",    // "Cavity" or null
    "tooth_surface": "string|null",     // "Occlusal" or null
    "severity": "string|null",          // "Moderate" or null

    // Template Content
    "template_text": "string",          // The actual note template
    "short_code": "string",             // "CAV-OCC-M"
    "display_order": number,

    // Access Control
    "is_global": boolean,               // Share with same specialization
    "specialization": "string|null",
    "created_by_doctor": "uuid|null",

    // Computed (returned by match endpoint)
    "match_score": number,              // 3=exact, 2=good, 1=general

    // Audit
    "created_at": "datetime",
    "updated_at": "datetime",
    "is_active": boolean
}
```

**Template Matching Logic:**
- **Score 3 (Exact)**: All 3 fields match exactly
- **Score 2 (Good)**: 2 fields match, 1 is wildcard (NULL)
- **Score 1 (General)**: 1 field matches, 2 are wildcards
- Templates sorted by match_score DESC, then display_order ASC

**API Endpoints:**
- `GET /dental/templates/match?condition=X&surface=Y&severity=Z` - Get matching templates
- `GET /dental/templates` - List all accessible templates
- `POST /dental/templates` - Create new template
- `PUT /dental/templates/{id}` - Update template (creator only)
- `DELETE /dental/templates/{id}` - Delete template (creator only)

---

### **11. DENTAL_ATTACHMENTS Table** ⭐ NEW
```sql
CREATE TABLE dental_attachments (
    -- Primary Key
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Foreign Keys (exactly one must be set)
    observation_id          UUID REFERENCES dental_observations(id) ON DELETE CASCADE,
    procedure_id            UUID REFERENCES dental_procedures(id) ON DELETE CASCADE,
    case_study_id           UUID REFERENCES case_studies(id) ON DELETE CASCADE,

    -- Patient Composite Key
    patient_mobile_number   VARCHAR(20) NOT NULL,
    patient_first_name      VARCHAR(100) NOT NULL,

    -- File Information
    file_type               VARCHAR(20) NOT NULL,     -- xray, photo_before, photo_after, test_result, document, other
    file_name               VARCHAR(255) NOT NULL,
    file_path               TEXT NOT NULL,            -- Cloud storage URL
    file_size               INTEGER NOT NULL,         -- Size in bytes
    mime_type               VARCHAR(100) NOT NULL,    -- image/jpeg, application/pdf, etc.

    -- Metadata
    caption                 TEXT,                     -- Optional description
    taken_date              DATE,                     -- When photo/xray was taken

    -- Audit Fields
    uploaded_by             UUID REFERENCES users(id),
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active               BOOLEAN DEFAULT TRUE,

    -- Constraint: exactly one FK must be set
    CONSTRAINT check_dental_attach_single_reference CHECK (
        (observation_id IS NOT NULL)::int +
        (procedure_id IS NOT NULL)::int +
        (case_study_id IS NOT NULL)::int = 1
    )
);
```

**🔗 Frontend Field Mapping:**
```javascript
// API Response Format
{
    "id": "uuid",
    "observation_id": "uuid|null",
    "procedure_id": "uuid|null",
    "case_study_id": "uuid|null",

    // Patient
    "patient_mobile_number": "string",
    "patient_first_name": "string",

    // File Info
    "file_type": "xray|photo_before|photo_after|test_result|document|other",
    "file_name": "string",
    "file_path": "string",              // Cloud storage URL
    "file_size": number,                // Bytes
    "mime_type": "string",              // e.g., "image/jpeg"

    // Metadata
    "caption": "string|null",
    "taken_date": "date|null",          // "YYYY-MM-DD"

    // Audit
    "uploaded_by": "uuid",
    "created_at": "datetime",
    "is_active": boolean
}
```

**File Type Options (6):**
- `xray` - X-ray images
- `photo_before` - Before treatment photos
- `photo_after` - After treatment photos (post-procedure uploads)
- `test_result` - Lab/test results
- `document` - Documents and reports
- `other` - Other attachments

**Upload Workflows:**
1. **Observation Upload**: Attach files during observation creation
2. **Post-Procedure Upload**: Upload results after completing a procedure
3. **Case Study Images**: Include images in AI-generated case studies

---

### **12. CASE_STUDIES Table** ⭐ NEW
```sql
CREATE TABLE case_studies (
    -- Primary Key
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Unique Identifier
    case_study_number       VARCHAR(100) UNIQUE NOT NULL,

    -- Patient Reference
    patient_mobile_number   VARCHAR(15) NOT NULL,
    patient_first_name      VARCHAR(100) NOT NULL,
    patient_uuid            UUID NOT NULL REFERENCES patients(id),

    -- Doctor Reference
    doctor_id               UUID NOT NULL REFERENCES doctors(id),

    -- Related Entities (JSON arrays as text)
    appointment_ids         TEXT,                     -- JSON array of appointment UUIDs
    prescription_ids        TEXT,                     -- JSON array of prescription UUIDs
    procedure_ids           TEXT,                     -- JSON array of procedure UUIDs
    observation_ids         TEXT,                     -- JSON array of observation UUIDs

    -- Case Study Content
    title                   VARCHAR(500) NOT NULL,
    chief_complaint         TEXT NOT NULL,

    -- AI-Generated Sections
    pre_treatment_summary   TEXT,
    initial_diagnosis       TEXT,
    treatment_goals         TEXT,
    treatment_summary       TEXT,
    procedures_performed    TEXT,
    outcome_summary         TEXT,
    success_metrics         TEXT,
    patient_feedback        TEXT,
    full_narrative          TEXT,                     -- Complete case study narrative

    -- Generation Metadata
    generation_prompt       TEXT,                     -- Prompt used for AI
    generation_model        VARCHAR(100),             -- e.g., "gpt-4o-mini"

    -- Timeline
    treatment_start_date    DATE,
    treatment_end_date      DATE,

    -- Status
    status                  VARCHAR(20) DEFAULT 'draft',  -- draft, finalized, archived

    -- Export
    is_exported             BOOLEAN DEFAULT FALSE,
    exported_format         VARCHAR(20),              -- pdf, docx, pptx
    exported_at             TIMESTAMP,

    -- Audit Fields
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by              UUID,
    is_active               BOOLEAN DEFAULT TRUE
);
```

**🔗 Frontend Field Mapping:**
```javascript
// API Response Format
{
    "id": "uuid",
    "case_study_number": "string",      // "CS20251223001"

    // Patient
    "patient_mobile_number": "string",
    "patient_first_name": "string",
    "patient_uuid": "uuid",

    // Doctor
    "doctor_id": "uuid",

    // Related Entities
    "observation_ids": ["uuid", ...],   // Selected observations
    "procedure_ids": ["uuid", ...],     // Selected procedures

    // Content
    "title": "string",
    "chief_complaint": "string",

    // AI-Generated Sections
    "content": {
        "pre_treatment_summary": "string",
        "initial_diagnosis": "string",
        "treatment_goals": "string",
        "treatment_summary": "string",
        "procedures_performed": "string",
        "outcome_summary": "string",
        "success_metrics": "string",
        "full_narrative": "string"
    },

    // Metadata
    "metadata": {
        "model": "string",              // AI model used
        "input_tokens": number,
        "output_tokens": number,
        "total_tokens": number,
        "estimated_cost_usd": number
    },

    // Timeline
    "treatment_start_date": "date",
    "treatment_end_date": "date",

    // Status
    "status": "draft|finalized|archived",

    // Attachments
    "attachments": [
        {
            "id": "uuid",
            "file_type": "string",
            "file_path": "string",
            "caption": "string"
        }
    ],

    // Audit
    "created_at": "datetime",
    "updated_at": "datetime"
}
```

**Case Study Generation Flow:**
1. **Selection**: Doctor selects visits/images from treatment journey
2. **Generation**: AI generates case study from observations + procedures
3. **Review**: Case study saved with `draft` status
4. **Export**: Print or save as PDF with images

**AI Integration:**
- **Model**: GPT-4o-mini (configurable)
- **Prompt**: Dental-specific system prompt with terminology
- **Output**: Structured JSON with all sections
- **Cost Tracking**: Token usage and estimated cost per generation

---

## 🔗 Entity Relationships

### **Primary Relationships**
```
users (1) ←→ (1) doctors
patients (1) ←→ (many) appointments
doctors (1) ←→ (many) appointments
appointments (1) ←→ (0..1) prescriptions
patients (1) ←→ (many) prescriptions
doctors (1) ←→ (many) prescriptions
prescriptions (1) ←→ (many) prescription_items
medicines (1) ←→ (many) prescription_items
short_keys (many) ←→ (many) medicines [via short_key_medicines]
doctors (1) ←→ (many) short_keys

⭐ Dental Relationships
prescriptions (1) ←→ (many) dental_observations
appointments (1) ←→ (many) dental_observations
dental_observations (1) ←→ (many) dental_procedures
prescriptions (1) ←→ (many) dental_procedures
appointments (1) ←→ (many) dental_procedures

⭐ Template Relationships
doctors (1) ←→ (many) dental_observation_templates
dental_observation_templates (many) ←→ (many) dental_observations [via selected_template_ids]

⭐ File Attachment Relationships
dental_observations (1) ←→ (many) dental_attachments
dental_procedures (1) ←→ (many) dental_attachments
case_studies (1) ←→ (many) dental_attachments
users (1) ←→ (many) dental_attachments [uploaded_by]

⭐ Case Study Relationships
patients (1) ←→ (many) case_studies
doctors (1) ←→ (many) case_studies
case_studies (many) ←→ (many) dental_observations [via observation_ids]
case_studies (many) ←→ (many) dental_procedures [via procedure_ids]
```

### **Composite Key Relationships**
```
patients[mobile_number, first_name] ←→ appointments[patient_mobile_number, patient_first_name]
patients[mobile_number, first_name] ←→ prescriptions[patient_mobile_number, patient_first_name]

⭐ NEW: Dental Composite Keys
patients[mobile_number, first_name] ←→ dental_observations[patient_mobile_number, patient_first_name]
```

### **Family Relationships (Within Patients)**
```
patients(primary_member=true) ←→ patients(same mobile_number, primary_member=false)
```

---

## 📊 Indexes for Performance

### **Critical Indexes (Already Implemented)**
```sql
-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Doctors  
CREATE INDEX idx_doctors_user_id ON doctors(user_id);
CREATE INDEX idx_doctors_license ON doctors(license_number);
CREATE INDEX idx_doctors_specialization ON doctors(specialization);

-- Patients (Composite Key)
CREATE INDEX idx_patients_mobile ON patients(mobile_number);
CREATE INDEX idx_patients_composite ON patients(mobile_number, first_name);

-- Medicines
CREATE INDEX idx_medicines_name ON medicines(name);
CREATE INDEX idx_medicines_category ON medicines(category);
CREATE INDEX idx_medicines_atc_code ON medicines(atc_code);

-- Appointments
CREATE INDEX idx_appointments_patient_composite ON appointments(patient_mobile_number, patient_first_name);
CREATE INDEX idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_datetime ON appointments(appointment_date, appointment_time);

-- Prescriptions
CREATE INDEX idx_prescriptions_patient_composite ON prescriptions(patient_mobile_number, patient_first_name);
CREATE INDEX idx_prescriptions_doctor_id ON prescriptions(doctor_id);
CREATE INDEX idx_prescriptions_visit_date ON prescriptions(visit_date);
CREATE INDEX idx_prescriptions_number ON prescriptions(prescription_number);

-- Dental Observations ⭐ NEW (10 indexes)
CREATE INDEX idx_dental_obs_prescription ON dental_observations(prescription_id);
CREATE INDEX idx_dental_obs_appointment ON dental_observations(appointment_id);
CREATE INDEX idx_dental_obs_tooth ON dental_observations(tooth_number);
CREATE INDEX idx_dental_obs_patient ON dental_observations(patient_mobile_number, patient_first_name);
CREATE INDEX idx_dental_obs_condition ON dental_observations(condition_type);
CREATE INDEX idx_dental_obs_severity ON dental_observations(severity);
CREATE INDEX idx_dental_obs_treatment_req ON dental_observations(treatment_required);
CREATE INDEX idx_dental_obs_treatment_done ON dental_observations(treatment_done);
CREATE INDEX idx_dental_obs_created_at ON dental_observations(created_at);
CREATE INDEX idx_dental_obs_active ON dental_observations(is_active);

-- Dental Procedures ⭐ NEW (5 indexes)
CREATE INDEX idx_dental_proc_prescription ON dental_procedures(prescription_id);
CREATE INDEX idx_dental_proc_appointment ON dental_procedures(appointment_id);
CREATE INDEX idx_dental_proc_observation ON dental_procedures(observation_id);
CREATE INDEX idx_dental_proc_status ON dental_procedures(status);
CREATE INDEX idx_dental_proc_code ON dental_procedures(procedure_code);
```

---

## 🎯 Business Rules Implemented

### **1. Patient Management**
- **Composite Key**: (mobile_number, first_name) uniquely identifies patients
- **Family Groups**: Multiple patients can share same mobile_number
- **Primary Member**: One primary member per mobile number for billing/contact

### **2. Appointment Scheduling**
- **Duration**: Fixed 30-minute slots
- **Working Hours**: 9 AM - 10 PM, Monday-Friday
- **Breaks**: 10 minutes between appointments
- **Conflict Detection**: No overlapping appointments for same doctor

**⭐ Appointment Status Transitions (Updated)**:
```
scheduled → in_progress → completed
    ↓           ↓
cancelled   cancelled

confirmed → in_progress → completed
    ↓           ↓
cancelled   cancelled

no_show (terminal state)
rescheduled → scheduled/confirmed
```

**Valid Status Transitions**:
| From Status  | Allowed Transitions |
|--------------|---------------------|
| `scheduled`  | `confirmed`, `in_progress`, `cancelled`, `no_show` |
| `confirmed`  | `in_progress`, `cancelled`, `no_show` |
| `in_progress` | `completed`, `cancelled` |
| `completed`  | (terminal state - no transitions) |
| `cancelled`  | (terminal state - no transitions) |
| `no_show`    | (terminal state - no transitions) |
| `rescheduled` | `scheduled`, `confirmed`, `cancelled` |

**Note**: The `scheduled → in_progress` transition was added to support direct consultation start from the doctor dashboard without requiring a separate "confirm" step.

### **3. Prescription Management**
- **Status Workflow**: draft → active → dispensed → completed
- **Expiry**: Prescriptions expire after 30 days
- **Modification**: Only draft/active prescriptions can be modified
- **Short Keys**: Quick prescription creation from templates

### **4. Medicine Catalog**
- **Classification**: ATC codes for drug classification
- **Interactions**: Basic drug interaction warnings
- **Stock Management**: Track current vs minimum stock levels

### **5. Admin Role & Access Control**
- **Admin Dashboard**: System overview with statistics and quick actions
- **Doctor Management**: Full CRUD operations for doctor profiles, specializations, and schedules
- **Patient Management**: View all patients across the system, family management
- **System Management**: Medicine catalog management, user role assignment
- **Access Control**: Role-based navigation and feature access
- **Navigation Routes**: `/admin/dashboard`, `/doctors`, `/patients`, `/medicines`

### **6. Date Handling Standards** 📅
**CRITICAL**: All modules MUST use standardized date validation and handling

#### **Date Storage Rules**
- **Database**: PostgreSQL `DATE` type for dates, `TIME` for times, `TIMESTAMP` for date-times
- **Format**: ISO 8601 format (YYYY-MM-DD) for all date fields
- **Timezone**: Indian Standard Time (Asia/Kolkata) for all operations

#### **Date Validation Standards**
```python
# Backend: Use app/utils/date_validators.py for ALL date validation
from app.utils.date_validators import (
    validate_date_of_birth,      # For patient registration
    validate_appointment_date,   # For appointment booking  
    validate_prescription_date,  # For prescription creation
    validate_visit_date         # For medical records
)
```

```typescript
// Frontend: Use StandardDatePicker component for ALL date inputs
import StandardDatePicker from '@/components/common/StandardDatePicker';

// Usage examples:
<StandardDatePicker 
  dateType="date_of_birth"     // Auto-validates birth dates
  value={birthDate} 
  onChange={setBirthDate} 
/>

<StandardDatePicker 
  dateType="appointment_date"  // Auto-validates appointment dates
  value={appointmentDate} 
  onChange={setAppointmentDate} 
/>
```

#### **Date Field Mapping Rules**
| **Module** | **Field Name** | **Validation** | **Format** | **Storage** |
|------------|----------------|----------------|------------|-------------|
| **Patients** | `date_of_birth` | Cannot be future, min year 1900, max age 150 | YYYY-MM-DD | `DATE` |
| **Appointments** | `appointment_date` | Must be future (except rescheduling), max 1 year advance | YYYY-MM-DD | `DATE` |
| **Appointments** | `appointment_time` | Working hours validation, conflict checking | HH:MM | `TIME` |
| **Prescriptions** | `visit_date` | Can be past/present, max 5 years old | YYYY-MM-DD | `DATE` |
| **Users** | `last_login_at` | Auto-generated, system timezone | YYYY-MM-DD HH:MM:SS | `TIMESTAMP` |

#### **API Response Format**
```json
{
  "date_of_birth": "1990-01-15",        // Always YYYY-MM-DD
  "appointment_date": "2024-12-15",     // Always YYYY-MM-DD  
  "appointment_time": "14:30",          // Always HH:MM
  "created_at": "2024-11-02T10:30:00Z", // ISO 8601 with timezone
  "updated_at": "2024-11-02T10:30:00Z"  // ISO 8601 with timezone
}
```

#### **Frontend-Backend Field Mapping**
```typescript
// Frontend form submission
const formData = {
  date_of_birth: formatDateForAPI(birthDate), // Converts Date to "YYYY-MM-DD"
  appointment_date: formatDateForAPI(appointmentDate),
  appointment_time: formatTimeForAPI(appointmentTime) // Converts to "HH:MM"
};

// Frontend data consumption  
const parsedData = {
  date_of_birth: parseDateFromAPI(response.date_of_birth), // Converts to Date object
  appointment_date: parseDateFromAPI(response.appointment_date),
  age: calculateAge(parsedDate) // Standardized age calculation
};
```

#### **Validation Error Messages**
- **Date of Birth**: "Date of birth cannot be in the future" | "Invalid date of birth (age cannot exceed 150 years)"
- **Appointment Date**: "Appointment date cannot be in the past" | "Appointment cannot be scheduled more than 1 year in advance"  
- **Prescription Date**: "Prescription date cannot be in the future" | "Prescription date cannot be more than 5 years old"

#### **Required Implementation Files**
- **Backend**: `/backend/app/utils/date_validators.py` - Centralized validation functions
- **Backend**: `/backend/app/schemas/date_schemas.py` - Pydantic date schemas
- **Frontend**: `/frontend/src/components/common/StandardDatePicker.tsx` - Standardized date picker
- **Frontend**: All date inputs MUST use StandardDatePicker component

---

### **7. Dental Module Business Rules** ⭐ NEW

#### **Specialization-Based Access Control**
- **Login Response**: Includes `specialization` field for doctors
- **Frontend Detection**: `user.specialization?.toLowerCase().includes('dental')`
- **Conditional UI**: Dental consultation button shown ONLY for dental doctors
- **Access Route**: `/appointments/{appointmentId}/dental`

#### **FDI Notation System (International Standard)**
- **Permanent Dentition (32 teeth)**: Quadrants 1-4
  - Quadrant 1 (Upper Right): 11, 12, 13, 14, 15, 16, 17, 18
  - Quadrant 2 (Upper Left): 21, 22, 23, 24, 25, 26, 27, 28
  - Quadrant 3 (Lower Left): 31, 32, 33, 34, 35, 36, 37, 38
  - Quadrant 4 (Lower Right): 41, 42, 43, 44, 45, 46, 47, 48

- **Primary Dentition (20 teeth)**: Quadrants 5-8
  - Quadrant 5 (Upper Right): 51, 52, 53, 54, 55
  - Quadrant 6 (Upper Left): 61, 62, 63, 64, 65
  - Quadrant 7 (Lower Left): 71, 72, 73, 74, 75
  - Quadrant 8 (Lower Right): 81, 82, 83, 84, 85

- **Validation**: Real-time FDI notation validation on both backend and frontend
- **Age-Based Chart**: Automatic selection of permanent vs primary based on patient age

#### **Dental Observations Rules**
1. **Tooth Number**: Must be valid FDI notation (validated)
2. **Condition Types**: 14 predefined types (Cavity, Decay, Fracture, Crack, Discoloration, Wear, Erosion, Abscess, Gum Disease, Root Exposure, Sensitivity, Missing, Impacted, Other)
3. **Tooth Surfaces**: 7 options (Occlusal, Mesial, Distal, Buccal, Lingual, Palatal, Incisal)
4. **Severity Levels**: 3 levels (Mild, Moderate, Severe)
5. **Treatment Tracking**: Separate flags for `treatment_required` and `treatment_done`
6. **Patient Linkage**: Uses composite key (mobile_number + first_name)
7. **Optional Links**: Can link to prescription, appointment, or standalone

#### **Dental Procedures Rules**
1. **CDT Codes**: 20+ pre-configured standard procedure codes
2. **Status Workflow**:
   - `planned` → `in_progress` → `completed`
   - Any status → `cancelled` (terminal state)
3. **Multiple Teeth**: Comma-separated tooth numbers (e.g., "11,12,13")
4. **Cost Tracking**: Separate `estimated_cost` and `actual_cost` fields
5. **Observation Link**: Optional link to dental observation (treatment for specific finding)
6. **Duration**: Tracked in minutes (1-480)
7. **Completion**: Auto-set `completed_date` when status changes to completed
8. **Bulk Operations**: Support for bulk creation (max 20 procedures)

#### **Integration Points**
- **Appointments**: Dental observations/procedures can be linked to appointments
- **Prescriptions**: Dental treatment can generate prescriptions (e.g., antibiotics, pain medication)
- **Patients**: Composite key ensures proper patient identification
- **History Tracking**: Complete tooth history timeline available via API

#### **Frontend Components**
1. **DentalChart**: Interactive FDI tooth chart with click-to-select
2. **DentalObservationForm**: Observation creation with validation
3. **DentalProcedureForm**: Procedure management with CDT codes
4. **ToothHistoryViewer**: Timeline view of tooth history
5. **DentalConsultation**: Main consultation page integrating all components

#### **Color Coding System (Frontend)**
- 🔴 **Red**: Active issues requiring immediate treatment
- 🟠 **Orange**: Observations recorded, no procedure scheduled
- 🟢 **Green**: Treatment completed successfully
- 🔵 **Blue**: Data recorded, no issues identified
- ⚪ **Grey**: Healthy tooth, no data recorded

#### **API Endpoints**
- **Observations**: 9 endpoints (CRUD + patient/tooth/appointment queries + bulk)
- **Procedures**: 7 endpoints (CRUD + status update + bulk)
- **Chart & Stats**: 2 endpoints (complete chart + statistics)
- **Total**: 18 dental-specific endpoints

---

**✅ This ERD serves as the single source of truth for all database operations, API field mappings, frontend-backend data synchronization, standardized date handling, and dental consultation workflows across the entire system.**