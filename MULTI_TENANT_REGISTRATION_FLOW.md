# Multi-Tenant Registration Flow & Hierarchy
## Complete User Onboarding Strategy

---

**📅 Created**: January 6, 2026
**🎯 Purpose**: Define registration flow, user hierarchy, and onboarding process
**📋 Status**: Design Phase - Pending Approval

---

## 🏗️ System Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                        TENANT                               │
│  (Organization/Clinic Group - Gets unique tenant_id)       │
│  Example: "Dr. Smith's Dental Care Group"                  │
└─────────────────────────────────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────────┐        ┌────────┐       ┌────────┐
    │Clinic 1│        │Clinic 2│       │Clinic 3│
    │(Primary)│        │        │       │        │
    └────────┘        └────────┘       └────────┘
         │                 │                 │
    ┌────┴────┐       ┌────┴────┐      ┌────┴────┐
    │  Users  │       │  Users  │      │  Users  │
    └─────────┘       └─────────┘      └─────────┘
        │                  │                 │
    ┌───┴───┐          ┌───┴───┐        ┌───┴───┐
    │ Admin │          │ Admin │        │ Admin │
    │Doctor │          │Doctor │        │Doctor │
    │Recept.│          │Recept.│        │Recept.│
    │ Nurse │          │ Nurse │        │ Nurse │
    └───────┘          └───────┘        └───────┘
```

---

## 🎯 What Gets Created First?

### **RECOMMENDED: Clinic-First Registration** ⭐

**Order of Creation:**
1. **Clinic Registration** (single form)
   - Creates: Tenant → Clinic → Admin User (all in one transaction)
2. **Admin adds more clinics** (if needed)
3. **Admin invites staff** (doctors, receptionists, nurses)
4. **Staff accept invitations** and complete profiles

**Why this approach?**
- ✅ **Simple user experience**: Clinic owner thinks "I'm registering my clinic"
- ✅ **One-step onboarding**: Everything created in single flow
- ✅ **Natural progression**: Clinic → Staff → Patients
- ✅ **Flexible expansion**: Can add more clinics later

---

## 📋 Detailed Registration Flow

### **Step 1: Initial Clinic Registration** 🏥

**Who**: Clinic Owner (becomes first admin)

**Registration Form Fields:**
```json
{
  // Clinic Information
  "clinic_name": "Dr. Smith Dental Clinic",
  "clinic_code": "SMITH_DENTAL_01",
  "clinic_phone": "+1234567890",
  "clinic_address": "123 Main Street, City, State",

  // Owner/Admin Information
  "owner_first_name": "John",
  "owner_last_name": "Smith",
  "owner_email": "john.smith@example.com",
  "owner_phone": "+1234567890",
  "password": "secure_password",

  // Professional Information (if doctor)
  "is_doctor": true,
  "license_number": "DDS123456",
  "specialization": "General Dentistry",
  "qualification": "BDS, MDS",
  "experience_years": 10,

  // Subscription
  "subscription_plan": "trial" // trial, basic, premium
}
```

**What Gets Created:**

```sql
-- Transaction begins
BEGIN;

-- 1. Create Tenant (Organization)
INSERT INTO tenants (
    id,                    -- UUID generated
    tenant_name,           -- "Dr. Smith Dental Clinic" (same as clinic initially)
    tenant_code,           -- "TENANT_SMITH_001" (auto-generated)
    subscription_plan,     -- "trial"
    max_doctors,           -- Based on plan
    max_patients,          -- Based on plan
    is_active,             -- true
    created_at,
    expires_at             -- Trial: +30 days
) VALUES (...);

-- 2. Create Primary Clinic
INSERT INTO clinics (
    id,                    -- UUID generated
    tenant_id,             -- From step 1
    clinic_name,           -- "Dr. Smith Dental Clinic"
    clinic_code,           -- "SMITH_DENTAL_01"
    address,               -- "123 Main Street..."
    phone,                 -- "+1234567890"
    is_primary,            -- TRUE (first clinic)
    is_active              -- true
) VALUES (...);

-- 3. Create Admin User
INSERT INTO users (
    id,                    -- UUID generated
    tenant_id,             -- From step 1
    email,                 -- "john.smith@example.com"
    hashed_password,       -- bcrypt hash
    role,                  -- "admin" (can also be doctor)
    first_name,            -- "John"
    last_name,             -- "Smith"
    phone,                 -- "+1234567890"
    is_active              -- true
) VALUES (...);

-- 4. IF is_doctor = true: Create Doctor Profile
INSERT INTO doctors (
    id,                    -- UUID generated
    tenant_id,             -- From step 1
    user_id,               -- From step 3
    license_number,        -- "DDS123456"
    specialization,        -- "General Dentistry"
    qualification,         -- "BDS, MDS"
    experience_years,      -- 10
    is_available           -- true
) VALUES (...);

-- 5. Create default clinic assignment
INSERT INTO user_clinic_assignments (
    user_id,               -- From step 3
    clinic_id,             -- From step 2
    is_primary_clinic      -- TRUE
) VALUES (...);

COMMIT;
-- Transaction ends
```

**API Endpoint:**
```python
POST /api/v1/auth/register/clinic

Response:
{
    "success": true,
    "tenant_id": "uuid",
    "clinic_id": "uuid",
    "user_id": "uuid",
    "access_token": "jwt_token",
    "message": "Clinic registered successfully. Trial period: 30 days"
}
```

---

### **Step 2: Admin Dashboard After Login** 🎛️

**Admin sees:**
```
Dashboard Overview:
├── Clinic Information
│   └── [Add Another Clinic] button
├── Staff Management
│   ├── Doctors (0)      [+ Invite Doctor]
│   ├── Nurses (0)       [+ Invite Nurse]
│   └── Receptionists (0)[+ Invite Receptionist]
├── Subscription Status
│   └── Trial expires in 29 days [Upgrade]
└── Quick Actions
    ├── Setup clinic hours
    ├── Add medicines
    └── Configure settings
```

---

### **Step 3: Adding More Clinics** 🏥➕

**When**: Admin wants to add second/third location

**Form:**
```json
{
  "clinic_name": "Dr. Smith Dental - Downtown Branch",
  "clinic_code": "SMITH_DENTAL_02",
  "clinic_phone": "+1234567891",
  "clinic_address": "456 Downtown Ave, City, State"
}
```

**What Happens:**
```sql
-- Creates clinic under SAME tenant_id
INSERT INTO clinics (
    tenant_id,        -- SAME as primary clinic
    clinic_name,
    clinic_code,
    address,
    phone,
    is_primary        -- FALSE
) VALUES (...);
```

**Result**: All clinics share:
- ✅ Same tenant_id
- ✅ Same user pool
- ✅ Same subscription
- ✅ Same medicine catalog
- ✅ Can transfer staff between clinics

---

### **Step 4: Inviting Staff Members** 👥

**Admin Actions:**

#### **Option A: Invite by Email** ⭐ RECOMMENDED
```json
POST /api/v1/staff/invite

{
  "email": "dr.jane@example.com",
  "role": "doctor",
  "first_name": "Jane",
  "last_name": "Doe",
  "assigned_clinic_id": "uuid",  // Which clinic they work at

  // If doctor role:
  "doctor_details": {
    "license_number": "DDS789012",
    "specialization": "Orthodontics",
    "qualification": "BDS, MDS (Ortho)",
    "experience_years": 5
  }
}

Process:
1. Create user record (with status = "invited")
2. Generate invitation token (expires in 7 days)
3. Send invitation email with link
4. User clicks link → Sets password → Account activated
```

#### **Option B: Direct Registration**
```json
POST /api/v1/staff/register

{
  "email": "nurse.mary@example.com",
  "password": "secure_password",
  "role": "nurse",
  "first_name": "Mary",
  "last_name": "Johnson",
  "invitation_token": "token_from_email"  // From invitation
}

Process:
1. Validates invitation token
2. Updates user record (status = "active")
3. Sends welcome email
```

---

### **Step 5: Staff Login & Clinic Assignment** 🔐

**Login Flow:**
```python
POST /api/v1/auth/login

{
  "email": "dr.jane@example.com",
  "password": "password123"
}

Response:
{
  "access_token": "jwt_token",
  "user": {
    "id": "uuid",
    "email": "dr.jane@example.com",
    "role": "doctor",
    "tenant_id": "uuid",           // ⭐ KEY: Same tenant as clinic
    "assigned_clinics": [
      {
        "clinic_id": "uuid",
        "clinic_name": "Dr. Smith Dental Clinic",
        "is_primary": true
      },
      {
        "clinic_id": "uuid",
        "clinic_name": "Downtown Branch",
        "is_primary": false
      }
    ]
  }
}
```

**JWT Token Claims:**
```json
{
  "sub": "user_uuid",
  "email": "dr.jane@example.com",
  "role": "doctor",
  "tenant_id": "tenant_uuid",      // ⭐ CRITICAL for RLS
  "clinic_ids": ["clinic1", "clinic2"],
  "exp": 1234567890
}
```

---

## 🗂️ Database Schema Updates

### **New Tables Needed:**

#### **1. Tenants Table**
```sql
CREATE TABLE tenants (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_name             VARCHAR(200) NOT NULL,
    tenant_code             VARCHAR(50) UNIQUE NOT NULL,

    -- Subscription
    subscription_plan       VARCHAR(50) DEFAULT 'trial',  -- trial, basic, premium, enterprise
    subscription_status     VARCHAR(50) DEFAULT 'active',  -- active, suspended, cancelled
    trial_ends_at           TIMESTAMP,
    subscription_ends_at    TIMESTAMP,

    -- Limits (based on plan)
    max_clinics             INTEGER DEFAULT 1,
    max_doctors             INTEGER DEFAULT 5,
    max_patients            INTEGER DEFAULT 1000,
    max_storage_mb          INTEGER DEFAULT 1000,

    -- Contact
    billing_email           VARCHAR(255),
    support_email           VARCHAR(255),
    phone                   VARCHAR(20),

    -- Settings
    settings                JSONB DEFAULT '{}',  -- Timezone, language, etc.

    -- Audit
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by              UUID,
    is_active               BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_tenants_code ON tenants(tenant_code);
CREATE INDEX idx_tenants_status ON tenants(subscription_status);
```

#### **2. Clinics Table**
```sql
CREATE TABLE clinics (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Clinic Information
    clinic_name             VARCHAR(200) NOT NULL,
    clinic_code             VARCHAR(50) UNIQUE NOT NULL,
    phone                   VARCHAR(20),
    email                   VARCHAR(255),
    address                 TEXT,

    -- Location (for multi-location support)
    city                    VARCHAR(100),
    state                   VARCHAR(100),
    country                 VARCHAR(100) DEFAULT 'India',
    postal_code             VARCHAR(20),
    latitude                DECIMAL(10, 8),
    longitude               DECIMAL(11, 8),

    -- Clinic Settings
    working_hours           JSONB,  -- {"MON": {"start": "09:00", "end": "18:00"}}
    is_primary              BOOLEAN DEFAULT FALSE,  -- First clinic in tenant

    -- Audit
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by              UUID,
    is_active               BOOLEAN DEFAULT TRUE,

    CONSTRAINT fk_clinics_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX idx_clinics_tenant_id ON clinics(tenant_id);
CREATE INDEX idx_clinics_code ON clinics(clinic_code);
CREATE UNIQUE INDEX idx_one_primary_per_tenant ON clinics(tenant_id) WHERE is_primary = TRUE;
```

#### **3. User-Clinic Assignments (Many-to-Many)**
```sql
CREATE TABLE user_clinic_assignments (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    clinic_id               UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

    -- Assignment Details
    is_primary_clinic       BOOLEAN DEFAULT FALSE,  -- User's main clinic
    can_manage_clinic       BOOLEAN DEFAULT FALSE,  -- Can edit clinic settings

    -- Schedule (if user works different hours at different clinics)
    working_days            VARCHAR(50),  -- "MON,WED,FRI"

    -- Audit
    assigned_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by             UUID REFERENCES users(id),
    is_active               BOOLEAN DEFAULT TRUE,

    CONSTRAINT unique_user_clinic UNIQUE(user_id, clinic_id)
);

CREATE INDEX idx_user_clinic_user ON user_clinic_assignments(user_id);
CREATE INDEX idx_user_clinic_clinic ON user_clinic_assignments(clinic_id);
```

#### **4. Staff Invitations Table**
```sql
CREATE TABLE staff_invitations (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL REFERENCES tenants(id),
    invited_email           VARCHAR(255) NOT NULL,
    role                    user_role_enum NOT NULL,

    -- Invitation Details
    invitation_token        VARCHAR(255) UNIQUE NOT NULL,
    expires_at              TIMESTAMP NOT NULL,  -- 7 days from creation

    -- Additional Data
    first_name              VARCHAR(100),
    last_name               VARCHAR(100),
    assigned_clinic_id      UUID REFERENCES clinics(id),
    doctor_details          JSONB,  -- If inviting doctor

    -- Status
    status                  VARCHAR(50) DEFAULT 'pending',  -- pending, accepted, expired, cancelled
    accepted_at             TIMESTAMP,
    created_user_id         UUID REFERENCES users(id),  -- Set when accepted

    -- Audit
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    invited_by              UUID REFERENCES users(id),

    CONSTRAINT unique_pending_invitation UNIQUE(tenant_id, invited_email, status)
        WHERE status = 'pending'
);

CREATE INDEX idx_invitations_token ON staff_invitations(invitation_token);
CREATE INDEX idx_invitations_email ON staff_invitations(invited_email);
CREATE INDEX idx_invitations_tenant ON staff_invitations(tenant_id);
```

---

## 🔐 Role Permissions

### **Role Hierarchy:**

```
Super Admin (Platform Owner)
└── Can access all tenants
    └── Platform-level management

Tenant Admin (Clinic Owner)
└── Can manage entire tenant
    ├── Add/remove clinics
    ├── Invite/remove staff
    ├── Manage subscription
    └── View all tenant data

Clinic Admin (Clinic Manager)
└── Can manage assigned clinic(s)
    ├── Invite staff to their clinic
    ├── Manage clinic settings
    └── View clinic data only

Doctor
└── Clinical operations
    ├── View patients
    ├── Create prescriptions
    ├── Manage appointments
    └── Access assigned clinic(s) data

Nurse
└── Patient care
    ├── View patients
    ├── Record vitals
    ├── View prescriptions (read-only)
    └── Access assigned clinic(s) data

Receptionist
└── Front desk
    ├── Book appointments
    ├── Manage patient registration
    ├── View basic patient info
    └── Access assigned clinic(s) data

Patient
└── Self-service
    ├── View own records
    ├── Book appointments
    └── View own prescriptions
```

### **Permission Matrix:**

| Action | Super Admin | Tenant Admin | Clinic Admin | Doctor | Nurse | Receptionist | Patient |
|--------|-------------|--------------|--------------|--------|-------|--------------|---------|
| **Tenant Management** |
| Create tenant | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View all tenants | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Clinic Management** |
| Add clinic | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Edit clinic | ✅ | ✅ | ✅* | ❌ | ❌ | ❌ | ❌ |
| Delete clinic | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Staff Management** |
| Invite staff | ✅ | ✅ | ✅* | ❌ | ❌ | ❌ | ❌ |
| Remove staff | ✅ | ✅ | ✅* | ❌ | ❌ | ❌ | ❌ |
| **Patient Management** |
| Register patient | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| View all patients | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| View own records | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Appointments** |
| Book appointment | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Cancel appointment | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅** |
| **Prescriptions** |
| Create prescription | ✅ | ✅*** | ✅*** | ✅ | ❌ | ❌ | ❌ |
| View prescription | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅** |
| Edit prescription | ✅ | ❌ | ❌ | ✅**** | ❌ | ❌ | ❌ |

\* Only for assigned clinics
\** Only own records
\*** Only if also a doctor
\**** Only own prescriptions

---

## 🔄 Complete Registration API Flow

### **1. Clinic Registration API**

```python
# app/api/v1/endpoints/auth.py

@router.post("/register/clinic", response_model=ClinicRegistrationResponse)
async def register_clinic(
    data: ClinicRegistrationRequest,
    db: Session = Depends(get_db)
):
    """
    Register new clinic (creates tenant + clinic + admin user)
    """

    # Validate email doesn't exist
    existing_user = db.query(User).filter(User.email == data.owner_email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Validate clinic code is unique
    existing_clinic = db.query(Clinic).filter(Clinic.clinic_code == data.clinic_code).first()
    if existing_clinic:
        raise HTTPException(status_code=400, detail="Clinic code already taken")

    try:
        # Start transaction

        # 1. Create Tenant
        tenant = Tenant(
            tenant_name=data.clinic_name,
            tenant_code=generate_tenant_code(data.clinic_name),
            subscription_plan="trial",
            trial_ends_at=datetime.now() + timedelta(days=30),
            max_clinics=1 if data.subscription_plan == "trial" else 5,
            max_doctors=5 if data.subscription_plan == "trial" else 50,
            max_patients=1000 if data.subscription_plan == "trial" else 10000
        )
        db.add(tenant)
        db.flush()  # Get tenant.id

        # 2. Create Clinic
        clinic = Clinic(
            tenant_id=tenant.id,
            clinic_name=data.clinic_name,
            clinic_code=data.clinic_code,
            phone=data.clinic_phone,
            address=data.clinic_address,
            is_primary=True  # First clinic
        )
        db.add(clinic)
        db.flush()  # Get clinic.id

        # 3. Create Admin User
        hashed_password = get_password_hash(data.password)
        user = User(
            tenant_id=tenant.id,
            email=data.owner_email,
            hashed_password=hashed_password,
            role="admin",
            first_name=data.owner_first_name,
            last_name=data.owner_last_name,
            phone=data.owner_phone,
            is_active=True
        )
        db.add(user)
        db.flush()  # Get user.id

        # 4. If doctor, create doctor profile
        doctor = None
        if data.is_doctor:
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

        # 5. Assign user to clinic
        assignment = UserClinicAssignment(
            user_id=user.id,
            clinic_id=clinic.id,
            is_primary_clinic=True,
            can_manage_clinic=True
        )
        db.add(assignment)

        # 6. Create audit log
        audit_log = AuditLog(
            tenant_id=tenant.id,
            action="TENANT_CREATED",
            entity_type="tenant",
            entity_id=tenant.id,
            performed_by=user.id
        )
        db.add(audit_log)

        # Commit transaction
        db.commit()

        # 7. Generate JWT token
        access_token = create_access_token(
            data={
                "sub": str(user.id),
                "email": user.email,
                "role": user.role,
                "tenant_id": str(tenant.id),
                "clinic_ids": [str(clinic.id)]
            }
        )

        # 8. Send welcome email
        send_welcome_email(user.email, tenant.tenant_name)

        return {
            "success": True,
            "tenant_id": tenant.id,
            "clinic_id": clinic.id,
            "user_id": user.id,
            "doctor_id": doctor.id if doctor else None,
            "access_token": access_token,
            "token_type": "bearer",
            "subscription": {
                "plan": tenant.subscription_plan,
                "trial_ends": tenant.trial_ends_at.isoformat()
            },
            "message": f"Clinic registered successfully! Trial period: 30 days"
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
```

### **2. Invite Staff API**

```python
@router.post("/staff/invite", response_model=InvitationResponse)
async def invite_staff(
    data: StaffInvitationRequest,
    current_user: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    """
    Invite staff member to tenant
    """

    # Check if user already exists in this tenant
    existing = db.query(User).filter(
        User.email == data.email,
        User.tenant_id == current_user.tenant_id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="User already exists in this clinic")

    # Check pending invitations
    pending = db.query(StaffInvitation).filter(
        StaffInvitation.invited_email == data.email,
        StaffInvitation.tenant_id == current_user.tenant_id,
        StaffInvitation.status == "pending"
    ).first()

    if pending:
        raise HTTPException(status_code=400, detail="Invitation already sent")

    # Generate invitation token
    invitation_token = secrets.token_urlsafe(32)
    expires_at = datetime.now() + timedelta(days=7)

    # Create invitation
    invitation = StaffInvitation(
        tenant_id=current_user.tenant_id,
        invited_email=data.email,
        role=data.role,
        invitation_token=invitation_token,
        expires_at=expires_at,
        first_name=data.first_name,
        last_name=data.last_name,
        assigned_clinic_id=data.assigned_clinic_id,
        doctor_details=data.doctor_details if data.role == "doctor" else None,
        invited_by=current_user.id
    )

    db.add(invitation)
    db.commit()

    # Send invitation email
    invitation_link = f"{settings.FRONTEND_URL}/accept-invitation?token={invitation_token}"
    send_invitation_email(
        email=data.email,
        inviter_name=f"{current_user.first_name} {current_user.last_name}",
        clinic_name=get_clinic_name(data.assigned_clinic_id),
        role=data.role,
        invitation_link=invitation_link
    )

    return {
        "success": True,
        "invitation_id": invitation.id,
        "invited_email": data.email,
        "expires_at": expires_at.isoformat(),
        "message": f"Invitation sent to {data.email}"
    }
```

---

## 🎯 Summary: What Gets Created First?

### **Registration Order:**

```
1️⃣ TENANT
   └── Organization/Clinic Group
       └── Gets unique tenant_id
       └── Subscription plan assigned

2️⃣ CLINIC (Primary)
   └── First physical location
       └── Linked to tenant_id
       └── is_primary = TRUE

3️⃣ ADMIN USER
   └── Clinic owner/manager
       └── Linked to tenant_id
       └── role = "admin"
       └── Optionally also a doctor

4️⃣ DOCTOR PROFILE (if admin is doctor)
   └── Medical professional details
       └── Linked to user_id and tenant_id

5️⃣ USER-CLINIC ASSIGNMENT
   └── Links user to primary clinic
       └── is_primary_clinic = TRUE

6️⃣ MORE CLINICS (optional)
   └── Admin can add branches
       └── Same tenant_id

7️⃣ STAFF INVITATIONS
   └── Admin invites doctors, nurses, receptionists
       └── All under same tenant_id

8️⃣ PATIENTS
   └── Created by any staff member
       └── Linked to tenant_id
```

---

## ✅ Recommended Implementation

**Phase 1: Core Registration (Week 1)**
- [ ] Create tenants table
- [ ] Create clinics table
- [ ] Create user_clinic_assignments table
- [ ] Create staff_invitations table
- [ ] Implement clinic registration API

**Phase 2: Staff Management (Week 2)**
- [ ] Implement staff invitation API
- [ ] Implement invitation acceptance flow
- [ ] Build admin dashboard
- [ ] Add role-based access control

**Phase 3: Multi-Clinic Support (Week 3)**
- [ ] Implement add clinic API
- [ ] Update all queries to respect clinic assignments
- [ ] Add clinic switcher in UI
- [ ] Test cross-clinic data access

---

## ❓ Questions to Confirm

1. **Should admin always be a doctor?**
   - Or can they be non-medical manager?

2. **Can one user work at multiple clinics?**
   - Within same tenant? YES (via assignments)
   - Across different tenants? NO

3. **Can staff transfer between clinics?**
   - Within tenant? YES
   - Across tenants? NO (need new registration)

4. **Should nurses/receptionists have clinic-level or tenant-level access?**
   - Recommendation: Clinic-level (via assignments)

---

**Next Steps**: Review this flow and confirm the registration order. Once approved, I'll create the database migrations and API implementations!
