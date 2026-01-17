# Multi-Tenant Implementation - Doctor-Focused
## Simplified Plan for Immediate Implementation

---

**📅 Created**: January 6, 2026
**🎯 Focus**: Doctors only (nurses/receptionists later)
**📋 Status**: Ready for Implementation
**⚠️ Requirement**: Full database backup before starting

---

## ✅ Requirements Confirmed

1. ✅ **Admin can be non-medical** (clinic manager without medical license)
2. ✅ **Doctor can be admin + doctor** (dual role - has admin privileges + can prescribe)
3. ✅ **Medicines shared across all clinics** within same tenant
4. ✅ **Focus on doctors only** (nurses/receptionists added later)
5. ✅ **Use existing profile edit flow** (no new UI needed for editing)
6. ✅ **Subscription limits** (Trial/Basic/Premium)
7. ✅ **Direct doctor creation** from app (no invitation needed!)

---

## 🎯 Key Insight: Two Ways to Add Doctors

### **Method 1: Self-Registration** (New clinic owner)
```
Doctor visits website → Registers clinic → Gets tenant_id
```

### **Method 2: Admin Creates Doctor** (Existing clinic adds doctor) ⭐ **YOUR QUESTION**
```
Admin logged in → "Add Doctor" → Creates doctor account
                                → Uses admin's tenant_id automatically!
```

**Answer: YES!** ✅
- Admin can create new doctors directly from the app
- System automatically uses admin's `tenant_id`
- Much simpler than invitation flow
- New doctor gets email with temporary password
- Doctor logs in → Uses existing profile edit to complete details

---

## 🗄️ Database Changes Required

### **1. New Tables (3 tables)**

#### **A. Tenants Table**
```sql
CREATE TABLE tenants (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_name             VARCHAR(200) NOT NULL,           -- "Dr. Smith's Dental Group"
    tenant_code             VARCHAR(50) UNIQUE NOT NULL,     -- "SMITH_DENTAL" (auto-generated)

    -- Subscription
    subscription_plan       VARCHAR(50) DEFAULT 'trial',     -- trial, basic, premium
    subscription_status     VARCHAR(50) DEFAULT 'active',    -- active, suspended, cancelled
    trial_ends_at           TIMESTAMP,
    subscription_ends_at    TIMESTAMP,

    -- Limits (enforced by application)
    max_clinics             INTEGER DEFAULT 1,               -- Trial: 1, Basic: 3, Premium: 10
    max_doctors             INTEGER DEFAULT 5,               -- Trial: 5, Basic: 20, Premium: 100
    max_patients            INTEGER DEFAULT 1000,            -- Trial: 1000, Basic: 10000, Premium: unlimited

    -- Audit
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active               BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_tenants_code ON tenants(tenant_code);
CREATE INDEX idx_tenants_status ON tenants(subscription_status, is_active);
```

#### **B. Clinics Table**
```sql
CREATE TABLE clinics (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Clinic Information
    clinic_name             VARCHAR(200) NOT NULL,           -- "Dr. Smith Dental - Main"
    clinic_code             VARCHAR(50) UNIQUE NOT NULL,     -- "SMITH_MAIN"
    phone                   VARCHAR(20),
    email                   VARCHAR(255),
    address                 TEXT,

    -- Clinic Settings
    is_primary              BOOLEAN DEFAULT FALSE,           -- First clinic in tenant

    -- Audit
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by              UUID,                            -- Which user created this
    is_active               BOOLEAN DEFAULT TRUE,

    CONSTRAINT fk_clinics_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX idx_clinics_tenant_id ON clinics(tenant_id);
CREATE INDEX idx_clinics_code ON clinics(clinic_code);
CREATE UNIQUE INDEX idx_one_primary_per_tenant ON clinics(tenant_id) WHERE is_primary = TRUE;
```

#### **C. Doctor-Clinic Assignments (Many-to-Many)**
```sql
CREATE TABLE doctor_clinic_assignments (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id               UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    clinic_id               UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

    -- Assignment Details
    is_primary_clinic       BOOLEAN DEFAULT FALSE,           -- Doctor's main clinic
    working_days            VARCHAR(50),                     -- "MON,WED,FRI" (optional)

    -- Audit
    assigned_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by             UUID REFERENCES users(id),
    is_active               BOOLEAN DEFAULT TRUE,

    CONSTRAINT unique_doctor_clinic UNIQUE(doctor_id, clinic_id)
);

CREATE INDEX idx_doctor_clinic_doctor ON doctor_clinic_assignments(doctor_id);
CREATE INDEX idx_doctor_clinic_clinic ON doctor_clinic_assignments(clinic_id);
CREATE INDEX idx_doctor_clinic_active ON doctor_clinic_assignments(is_active);
```

---

### **2. Add tenant_id to Existing Tables**

#### **Tables Requiring tenant_id Column:**

```sql
-- USERS table
ALTER TABLE users ADD COLUMN tenant_id UUID;
ALTER TABLE users ADD CONSTRAINT fk_users_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
CREATE INDEX idx_users_tenant_id ON users(tenant_id);

-- DOCTORS table
ALTER TABLE doctors ADD COLUMN tenant_id UUID;
ALTER TABLE doctors ADD CONSTRAINT fk_doctors_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
CREATE INDEX idx_doctors_tenant_id ON doctors(tenant_id);

-- PATIENTS table (composite key adjustment needed)
ALTER TABLE patients ADD COLUMN tenant_id UUID;
ALTER TABLE patients ADD CONSTRAINT fk_patients_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
CREATE INDEX idx_patients_tenant_id ON patients(tenant_id);

-- APPOINTMENTS table
ALTER TABLE appointments ADD COLUMN tenant_id UUID;
ALTER TABLE appointments ADD CONSTRAINT fk_appointments_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
CREATE INDEX idx_appointments_tenant_id ON appointments(tenant_id);

-- PRESCRIPTIONS table
ALTER TABLE prescriptions ADD COLUMN tenant_id UUID;
ALTER TABLE prescriptions ADD CONSTRAINT fk_prescriptions_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
CREATE INDEX idx_prescriptions_tenant_id ON prescriptions(tenant_id);

-- SHORT_KEYS table
ALTER TABLE short_keys ADD COLUMN tenant_id UUID;
ALTER TABLE short_keys ADD CONSTRAINT fk_short_keys_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
CREATE INDEX idx_short_keys_tenant_id ON short_keys(tenant_id);

-- DENTAL_OBSERVATIONS table
ALTER TABLE dental_observations ADD COLUMN tenant_id UUID;
ALTER TABLE dental_observations ADD CONSTRAINT fk_dental_observations_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
CREATE INDEX idx_dental_observations_tenant_id ON dental_observations(tenant_id);

-- DENTAL_PROCEDURES table
ALTER TABLE dental_procedures ADD COLUMN tenant_id UUID;
ALTER TABLE dental_procedures ADD CONSTRAINT fk_dental_procedures_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
CREATE INDEX idx_dental_procedures_tenant_id ON dental_procedures(tenant_id);

-- DENTAL_OBSERVATION_TEMPLATES table
ALTER TABLE dental_observation_templates ADD COLUMN tenant_id UUID;
ALTER TABLE dental_observation_templates ADD CONSTRAINT fk_dental_observation_templates_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
CREATE INDEX idx_dental_observation_templates_tenant_id ON dental_observation_templates(tenant_id);

-- DENTAL_ATTACHMENTS table
ALTER TABLE dental_attachments ADD COLUMN tenant_id UUID;
ALTER TABLE dental_attachments ADD CONSTRAINT fk_dental_attachments_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
CREATE INDEX idx_dental_attachments_tenant_id ON dental_attachments(tenant_id);

-- CASE_STUDIES table
ALTER TABLE case_studies ADD COLUMN tenant_id UUID;
ALTER TABLE case_studies ADD CONSTRAINT fk_case_studies_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
CREATE INDEX idx_case_studies_tenant_id ON case_studies(tenant_id);
```

---

### **3. MEDICINES Table - Special Handling** ⭐

**Requirement**: Medicines shared **ACROSS ALL CLINICS** within same tenant.

```sql
-- OPTION 1: Medicines shared within tenant (RECOMMENDED)
ALTER TABLE medicines ADD COLUMN tenant_id UUID;
ALTER TABLE medicines ADD CONSTRAINT fk_medicines_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
CREATE INDEX idx_medicines_tenant_id ON medicines(tenant_id);

-- Allow NULL tenant_id for "GLOBAL" medicines (pre-loaded catalog)
-- If tenant_id IS NULL → Available to ALL tenants (shared catalog)
-- If tenant_id IS NOT NULL → Only available to that tenant (custom medicine)

-- RLS Policy for medicines:
CREATE POLICY medicine_access_policy ON medicines
    USING (
        tenant_id IS NULL OR  -- Global medicines
        tenant_id = current_setting('app.current_tenant_id')::uuid  -- Tenant-specific
    );
```

**Use Cases:**
1. **Global Medicines**: System admin pre-loads common medicines (tenant_id = NULL)
   - All tenants can see these
   - Example: Paracetamol, Amoxicillin

2. **Custom Medicines**: Tenant adds their own medicines
   - Only visible to that tenant
   - Example: Custom compound prescriptions

---

### **4. Update Patient Composite Key** ⚠️ **CRITICAL**

**Problem**: Current composite key `(mobile_number, first_name)` will conflict across tenants.

**Solution**: Make composite key unique **per tenant**.

```sql
-- Drop existing constraint
ALTER TABLE patients DROP CONSTRAINT patients_pkey;

-- Create new composite primary key with tenant_id
ALTER TABLE patients ADD CONSTRAINT patients_tenant_composite_key
    PRIMARY KEY (tenant_id, mobile_number, first_name);

-- Keep UUID for foreign key references (more stable)
-- All foreign keys still use patients.id (UUID), not composite key
```

**Result**:
- Tenant A can have: (mobile: "1234567890", name: "John")
- Tenant B can have: (mobile: "1234567890", name: "John") ← Different patient!

---

## 🔒 Row-Level Security (RLS) Policies

### **Enable RLS on All Tables:**

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE short_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE dental_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE dental_procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE dental_observation_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE dental_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;

-- Universal tenant isolation policy (apply to each table)
CREATE POLICY tenant_isolation ON users
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_isolation ON doctors
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_isolation ON patients
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- ... repeat for all tables

-- Medicines: Allow NULL (global) OR tenant-specific
CREATE POLICY medicine_tenant_isolation ON medicines
    USING (
        tenant_id IS NULL OR
        tenant_id = current_setting('app.current_tenant_id')::uuid
    );
```

---

## 🚀 Implementation Flow

### **Scenario 1: New Clinic Registration (Self-Service)**

#### **Step 1: Registration Form**
```typescript
// Frontend form
interface ClinicRegistrationForm {
  // Clinic Details
  clinic_name: string;
  clinic_phone: string;
  clinic_address: string;

  // Owner Details
  owner_first_name: string;
  owner_last_name: string;
  owner_email: string;
  owner_phone: string;
  password: string;

  // Role Selection
  role: 'admin' | 'admin_doctor';  // Admin only OR Admin + Doctor

  // If admin_doctor selected:
  license_number?: string;
  specialization?: string;
  qualification?: string;
  experience_years?: number;
}
```

#### **Step 2: Backend API**
```python
# app/api/v1/endpoints/auth.py

@router.post("/register/clinic")
async def register_clinic(data: ClinicRegistrationRequest, db: Session):
    """Register new clinic (creates tenant + clinic + admin user)"""

    try:
        # 1. Create Tenant
        tenant = Tenant(
            tenant_name=data.clinic_name,
            tenant_code=generate_tenant_code(data.clinic_name),
            subscription_plan="trial",
            trial_ends_at=datetime.now() + timedelta(days=30),
            max_clinics=1,
            max_doctors=5,
            max_patients=1000
        )
        db.add(tenant)
        db.flush()

        # 2. Create Clinic
        clinic = Clinic(
            tenant_id=tenant.id,
            clinic_name=data.clinic_name,
            clinic_code=generate_clinic_code(data.clinic_name),
            phone=data.clinic_phone,
            address=data.clinic_address,
            is_primary=True
        )
        db.add(clinic)
        db.flush()

        # 3. Create User
        user = User(
            tenant_id=tenant.id,
            email=data.owner_email,
            hashed_password=get_password_hash(data.password),
            role="admin",  # Always admin
            first_name=data.owner_first_name,
            last_name=data.owner_last_name,
            phone=data.owner_phone
        )
        db.add(user)
        db.flush()

        # 4. If admin_doctor: Create doctor profile
        doctor = None
        if data.role == "admin_doctor":
            doctor = Doctor(
                tenant_id=tenant.id,
                user_id=user.id,
                license_number=data.license_number,
                specialization=data.specialization,
                qualification=data.qualification,
                experience_years=data.experience_years
            )
            db.add(doctor)
            db.flush()

            # Assign doctor to clinic
            assignment = DoctorClinicAssignment(
                doctor_id=doctor.id,
                clinic_id=clinic.id,
                is_primary_clinic=True
            )
            db.add(assignment)

        db.commit()

        # Generate JWT with tenant_id
        access_token = create_access_token(
            data={
                "sub": str(user.id),
                "tenant_id": str(tenant.id),
                "role": user.role
            }
        )

        return {
            "success": True,
            "tenant_id": tenant.id,
            "clinic_id": clinic.id,
            "user_id": user.id,
            "access_token": access_token,
            "message": "Clinic registered successfully!"
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
```

---

### **Scenario 2: Admin Creates New Doctor** ⭐ **YOUR USE CASE**

#### **Step 1: Admin Dashboard - "Add Doctor" Button**
```typescript
// Frontend form
interface AddDoctorForm {
  // Basic Info
  first_name: string;
  last_name: string;
  email: string;
  phone: string;

  // Medical Info
  license_number: string;
  specialization: string;
  qualification: string;
  experience_years: number;

  // Clinic Assignment (optional - can select multiple)
  assigned_clinic_ids: string[];  // Admin's clinics
  primary_clinic_id: string;
}
```

#### **Step 2: Backend API**
```python
# app/api/v1/endpoints/doctors.py

@router.post("/doctors/create")
async def create_doctor(
    data: CreateDoctorRequest,
    current_user: User = Depends(get_current_admin),  # Must be admin
    db: Session = Depends(get_db)
):
    """
    Admin creates new doctor account
    Uses admin's tenant_id automatically!
    """

    # Validate: Email not already in use in this tenant
    existing = db.query(User).filter(
        User.email == data.email,
        User.tenant_id == current_user.tenant_id  # Same tenant
    ).first()

    if existing:
        raise HTTPException(400, "Email already registered in your clinic")

    # Check tenant limits
    tenant = db.query(Tenant).filter(Tenant.id == current_user.tenant_id).first()
    doctor_count = db.query(Doctor).filter(Doctor.tenant_id == current_user.tenant_id).count()

    if doctor_count >= tenant.max_doctors:
        raise HTTPException(400, f"Doctor limit reached ({tenant.max_doctors}). Upgrade plan.")

    try:
        # 1. Create User
        temp_password = generate_temp_password()  # Random 8-char password

        user = User(
            tenant_id=current_user.tenant_id,  # ⭐ Use admin's tenant_id!
            email=data.email,
            hashed_password=get_password_hash(temp_password),
            role="doctor",
            first_name=data.first_name,
            last_name=data.last_name,
            phone=data.phone
        )
        db.add(user)
        db.flush()

        # 2. Create Doctor Profile
        doctor = Doctor(
            tenant_id=current_user.tenant_id,  # ⭐ Same tenant!
            user_id=user.id,
            license_number=data.license_number,
            specialization=data.specialization,
            qualification=data.qualification,
            experience_years=data.experience_years
        )
        db.add(doctor)
        db.flush()

        # 3. Assign to Clinics
        for clinic_id in data.assigned_clinic_ids:
            # Verify clinic belongs to this tenant
            clinic = db.query(Clinic).filter(
                Clinic.id == clinic_id,
                Clinic.tenant_id == current_user.tenant_id
            ).first()

            if not clinic:
                raise HTTPException(400, f"Invalid clinic_id: {clinic_id}")

            assignment = DoctorClinicAssignment(
                doctor_id=doctor.id,
                clinic_id=clinic_id,
                is_primary_clinic=(clinic_id == data.primary_clinic_id)
            )
            db.add(assignment)

        db.commit()

        # 4. Send welcome email with temporary password
        send_doctor_welcome_email(
            email=data.email,
            name=f"{data.first_name} {data.last_name}",
            temp_password=temp_password,
            clinic_name=tenant.tenant_name
        )

        return {
            "success": True,
            "doctor_id": doctor.id,
            "user_id": user.id,
            "message": f"Doctor added! Welcome email sent to {data.email}"
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(500, str(e))
```

#### **Step 3: New Doctor Logs In**
```python
# Doctor receives email:
"""
Subject: Welcome to ABC Dental Clinic!

Hi Dr. Jane Doe,

You've been added to ABC Dental Clinic.

Login credentials:
Email: dr.jane@example.com
Temporary Password: TempP@ss123

Please login and change your password immediately.

Login URL: https://yourapp.com/login
"""

# Doctor logs in with temp password
POST /api/v1/auth/login
{
  "email": "dr.jane@example.com",
  "password": "TempP@ss123"
}

# Response forces password change
{
  "access_token": "...",
  "must_change_password": true,
  "user": {...}
}

# Doctor changes password and edits profile using EXISTING UI
# All existing profile edit endpoints work - they already have user.id
```

---

## 🔧 Backend Middleware - Tenant Context

### **Critical: Set Tenant Context on Every Request**

```python
# app/core/middleware/tenant_middleware.py

from fastapi import Request
from sqlalchemy import text

async def set_tenant_context_middleware(request: Request, call_next):
    """
    Extract tenant_id from JWT and set PostgreSQL session variable
    This enables Row-Level Security (RLS)
    """

    # Skip for public endpoints
    if request.url.path in ["/api/v1/auth/login", "/api/v1/auth/register/clinic"]:
        return await call_next(request)

    # Extract user from JWT (already verified by auth middleware)
    user = getattr(request.state, "user", None)

    if not user or not user.tenant_id:
        raise HTTPException(status_code=401, detail="Tenant not identified")

    # Set PostgreSQL session variable for RLS
    async with request.app.state.db_pool.acquire() as conn:
        await conn.execute(
            text("SET LOCAL app.current_tenant_id = :tenant_id"),
            {"tenant_id": str(user.tenant_id)}
        )

    response = await call_next(request)
    return response


# Register middleware in main.py
app.add_middleware(
    BaseHTTPMiddleware,
    dispatch=set_tenant_context_middleware
)
```

---

## 📊 Subscription Plans

```python
# app/core/subscription_plans.py

SUBSCRIPTION_PLANS = {
    "trial": {
        "name": "Trial",
        "duration_days": 30,
        "price": 0,
        "limits": {
            "max_clinics": 1,
            "max_doctors": 5,
            "max_patients": 1000,
            "max_appointments_per_month": 500,
            "storage_mb": 1000,  # 1 GB
        },
        "features": [
            "Basic appointment scheduling",
            "Prescription management",
            "Patient records",
            "Single clinic location"
        ]
    },

    "basic": {
        "name": "Basic",
        "price": 2999,  # ₹2999/month
        "limits": {
            "max_clinics": 3,
            "max_doctors": 20,
            "max_patients": 10000,
            "max_appointments_per_month": 5000,
            "storage_mb": 10000,  # 10 GB
        },
        "features": [
            "Everything in Trial",
            "Multiple clinic locations (3)",
            "Advanced analytics",
            "Email reminders",
            "WhatsApp integration"
        ]
    },

    "premium": {
        "name": "Premium",
        "price": 9999,  # ₹9999/month
        "limits": {
            "max_clinics": 10,
            "max_doctors": 100,
            "max_patients": -1,  # Unlimited
            "max_appointments_per_month": -1,  # Unlimited
            "storage_mb": 100000,  # 100 GB
        },
        "features": [
            "Everything in Basic",
            "Unlimited patients",
            "Multiple clinic locations (10)",
            "Priority support",
            "Custom integrations",
            "API access"
        ]
    },

    "enterprise": {
        "name": "Enterprise",
        "price": "Custom",
        "limits": {
            "max_clinics": -1,  # Unlimited
            "max_doctors": -1,  # Unlimited
            "max_patients": -1,  # Unlimited
            "max_appointments_per_month": -1,
            "storage_mb": -1,  # Unlimited
        },
        "features": [
            "Everything in Premium",
            "Unlimited everything",
            "Dedicated support",
            "Custom development",
            "SLA guarantee"
        ]
    }
}

# Helper function
def check_tenant_limit(tenant: Tenant, resource: str, current_count: int) -> bool:
    """Check if tenant can create more resources"""
    plan = SUBSCRIPTION_PLANS[tenant.subscription_plan]
    limit = plan["limits"].get(f"max_{resource}", 0)

    if limit == -1:  # Unlimited
        return True

    return current_count < limit
```

---

## 🔄 Data Migration Strategy

### **Phase 1: Add Columns (Non-Breaking)**
```sql
-- Add tenant_id columns as NULLABLE first
ALTER TABLE users ADD COLUMN tenant_id UUID;
ALTER TABLE doctors ADD COLUMN tenant_id UUID;
-- ... all tables

-- Add indexes
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_doctors_tenant_id ON doctors(tenant_id);
-- ... all indexes
```

### **Phase 2: Create Default Tenant**
```sql
-- Create default tenant for existing data
INSERT INTO tenants (
    id,
    tenant_name,
    tenant_code,
    subscription_plan,
    max_clinics,
    max_doctors,
    max_patients
) VALUES (
    gen_random_uuid(),
    'Legacy Clinic',
    'LEGACY_001',
    'premium',  -- Give existing clinic premium features
    10,
    100,
    -1
) RETURNING id;

-- Create default clinic
INSERT INTO clinics (
    tenant_id,
    clinic_name,
    clinic_code,
    is_primary
) VALUES (
    (SELECT id FROM tenants WHERE tenant_code = 'LEGACY_001'),
    'Legacy Clinic',
    'LEGACY_CLINIC_001',
    TRUE
) RETURNING id;
```

### **Phase 3: Migrate Data**
```sql
-- Set tenant_id for all existing records
UPDATE users
SET tenant_id = (SELECT id FROM tenants WHERE tenant_code = 'LEGACY_001');

UPDATE doctors
SET tenant_id = (SELECT id FROM tenants WHERE tenant_code = 'LEGACY_001');

UPDATE patients
SET tenant_id = (SELECT id FROM tenants WHERE tenant_code = 'LEGACY_001');

-- ... all tables

-- Assign all existing doctors to legacy clinic
INSERT INTO doctor_clinic_assignments (doctor_id, clinic_id, is_primary_clinic)
SELECT
    d.id,
    (SELECT id FROM clinics WHERE clinic_code = 'LEGACY_CLINIC_001'),
    TRUE
FROM doctors d;
```

### **Phase 4: Make tenant_id NOT NULL**
```sql
-- After migration, enforce NOT NULL
ALTER TABLE users ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE doctors ALTER COLUMN tenant_id SET NOT NULL;
-- ... all tables
```

### **Phase 5: Enable RLS**
```sql
-- Enable Row-Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
-- ... all tables

-- Create policies (see RLS section above)
```

---

## ✅ Implementation Checklist

### **Week 1: Database Setup**
- [ ] Backup production database
- [ ] Create test database copy
- [ ] Create tenants table
- [ ] Create clinics table
- [ ] Create doctor_clinic_assignments table
- [ ] Add tenant_id to all tables (nullable)
- [ ] Create indexes
- [ ] Test on dev database

### **Week 2: Data Migration**
- [ ] Create default tenant
- [ ] Create default clinic
- [ ] Migrate existing data to default tenant
- [ ] Assign doctors to default clinic
- [ ] Make tenant_id NOT NULL
- [ ] Test data integrity

### **Week 3: Backend Changes**
- [ ] Update Pydantic models (add tenant_id)
- [ ] Create tenant middleware
- [ ] Update JWT to include tenant_id
- [ ] Implement clinic registration API
- [ ] Implement "Add Doctor" API
- [ ] Update all queries to filter by tenant_id
- [ ] Add subscription limit checks

### **Week 4: RLS & Security**
- [ ] Enable RLS on all tables
- [ ] Create RLS policies
- [ ] Test tenant isolation
- [ ] Test medicine sharing
- [ ] Security audit

### **Week 5: Frontend Changes**
- [ ] Update registration form
- [ ] Add "Add Doctor" form in admin dashboard
- [ ] Display clinic info in header
- [ ] Add subscription status widget
- [ ] Test flows end-to-end

### **Week 6: Testing & Deployment**
- [ ] Unit tests
- [ ] Integration tests
- [ ] Load testing
- [ ] Staging deployment
- [ ] Production deployment
- [ ] Monitor for issues

---

## 🎯 Key Points Summary

### ✅ **Your Questions Answered:**

1. **Can admin be non-medical?**
   - YES ✅ Admin doesn't need doctor profile

2. **Can doctor be admin + doctor?**
   - YES ✅ User has role="admin", plus doctor profile exists

3. **Medicine sharing?**
   - YES ✅ Shared across ALL clinics within same tenant
   - Global medicines (tenant_id=NULL) visible to all tenants

4. **Can logged-in doctor create new doctors?**
   - YES ✅ If they have admin role
   - System auto-uses their tenant_id
   - No invitation flow needed
   - New doctor gets email with temp password
   - Uses existing profile edit flow

5. **Focus on doctors only?**
   - YES ✅ This document focuses on doctors
   - Nurses/receptionists added later (same pattern)

---

## 🚀 Next Steps

**Once you approve this plan:**

1. ✅ Create full database backup
2. ✅ Create test database
3. ✅ Start with database migrations (Week 1-2)
4. ✅ Then backend implementation (Week 3-4)
5. ✅ Then frontend updates (Week 5)
6. ✅ Testing and deployment (Week 6)

**Estimated Timeline**: 6 weeks for complete implementation

**Do you want me to start with the database migration scripts?** 🚀
