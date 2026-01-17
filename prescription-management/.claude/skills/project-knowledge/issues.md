# Known Issues and Fixes

## Issue: "new row violates row-level security policy"

**Symptoms:**
- Creating doctor/patient fails
- Error mentions RLS policy violation

**Root Cause:**
Wrong `get_db` import - not setting tenant context

**Fix:**
```python
# Change this:
from app.core.database import get_db  # WRONG

# To this:
from app.api.deps import get_db  # CORRECT
```

**Files to check:**
- `app/api/v1/endpoints/*.py`

---

## Issue: "Could not refresh instance"

**Symptoms:**
- After db.commit(), db.refresh() fails
- Error: "Could not refresh instance"

**Root Cause:**
RLS blocks SELECT after commit because session context is lost

**Fix:**
```python
# Don't refresh after commit
db.commit()
# db.refresh(obj)  # Remove this!

# Use object data directly - you already have it
return UserResponse(
    id=user.id,  # Use values directly
    email=user.email,
    ...
)
```

---

## Issue: StaleDataError on Login

**Symptoms:**
- Login fails with StaleDataError
- Happens when updating last_login_at

**Root Cause:**
RLS blocks UPDATE on users table without tenant context

**Fix:**
```python
# In auth_service.py login method:
if user.tenant_id:
    db.execute(text(f"SET LOCAL app.current_tenant_id = '{user.tenant_id}'"))
    db.execute(
        text("UPDATE users SET last_login_at = :time WHERE id = :id"),
        {"time": datetime.utcnow(), "id": str(user.id)}
    )
    db.commit()
```

---

## Issue: 401 Unauthorized After Backend Restart

**Symptoms:**
- API returns 401 after restarting backend
- Token was valid before restart

**Root Cause:**
JWT tokens don't persist across restarts if SECRET_KEY changes

**Fix:**
- Log in again to get new token
- Ensure SECRET_KEY is stable in .env

---

## Issue: Admin Sees All Tenants' Data

**Symptoms:**
- Admin dashboard shows doctors/patients from all clinics
- No tenant isolation

**Root Cause:**
Multiple possible causes:
1. RLS not enabled or policies missing
2. Database user has BYPASSRLS privilege
3. get_db not setting tenant context

**Fix Checklist:**
1. Check RLS is enabled: `\d tablename` should show "Policies"
2. Check user privileges: `\du prescription_user` should NOT show BYPASSRLS
3. Check get_db import in endpoints

---

## Issue: "Instance has been deleted" After Update

**Symptoms:**
- Update works (data saved) but error shown
- Error: "Instance has been deleted, or its row is otherwise not present"

**Root Cause:**
SQLAlchemy expires objects after commit by default. Accessing attributes triggers reload which RLS blocks.

**Fix:**
In `app/core/database.py`:
```python
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,  # Add this!
    bind=engine
)
```

---

## Issue: Missing tenant_id in Schema

**Symptoms:**
- Error: "'DoctorCreate' object has no attribute 'tenant_id'"

**Root Cause:**
Schema doesn't include tenant_id field

**Fix:**
Add to relevant schema:
```python
# In schemas/doctor.py
class DoctorCreate(DoctorBase):
    tenant_id: Optional[UUID] = Field(None, description="Tenant ID")

# In schemas/patient.py
class PatientCreate(PatientBase):
    tenant_id: Optional[UUID] = Field(None, description="Tenant ID")
```

---

## COMPREHENSIVE: All Models with tenant_id

**All models that require tenant_id for multi-tenancy:**

| Model | File | Has tenant_id | Notes |
|-------|------|---------------|-------|
| User | user.py | ✅ | - |
| Doctor | doctor.py | ✅ | - |
| Patient | patient.py | ✅ | - |
| Appointment | appointment.py | ✅ | - |
| Prescription | prescription.py | ✅ | - |
| PrescriptionItem | prescription.py | ✅ | Inherits from Prescription |
| Medicine | medicine.py | ✅ | NULL = global medicines |
| ShortKey | short_key.py | ✅ | - |
| ShortKeyMedicine | short_key.py | ✅ | Inherits from ShortKey |
| DentalObservation | dental.py | ✅ | - |
| DentalProcedure | dental.py | ✅ | - |
| DentalAttachment | dental.py | ✅ | - |
| DentalObservationTemplate | dental.py | ✅ | - |
| CaseStudy | case_study.py | ✅ | - |
| Tenant | tenant.py | N/A | The tenant table itself |
| AuditLog | audit_log.py | ❌ | System-wide audit |

**Child records inherit tenant_id from parent:**
- `PrescriptionItem` → inherits from `Prescription`
- `ShortKeyMedicine` → inherits from `ShortKey`
- `DentalAttachment` → inherits from parent observation/procedure

**When adding a new model:**
1. Add `tenant_id` column to model
2. Add `tenant_id` field to Create schema
3. Set `tenant_id` in service from parent or user
4. In endpoint: `data.tenant_id = current_user.tenant_id`

---

## Issue: "column X does not exist" after adding to model

**Symptoms:**
- Error: `column tablename.tenant_id does not exist`
- Happens after adding column to SQLAlchemy model

**Root Cause:**
SQLAlchemy models don't auto-update database schema. Column exists in Python but not in DB.

**Fix:**
Add column to database manually:
```sql
docker exec test-postgres-fresh psql -U prescription_user -d prescription_management -c "
ALTER TABLE tablename ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_tablename_tenant_id ON tablename(tenant_id);
"
```

**Tables that need tenant_id column:**
- users, doctors, patients, appointments
- prescriptions, prescription_items
- medicines, short_keys, short_key_medicines
- dental_observations, dental_procedures, dental_attachments
- dental_observation_templates, case_studies

---

## Issue: get_db Not Receiving Request Object (Jan 2026)

**Symptoms:**
- RLS violations even with correct import
- Tenant context not set despite middleware running
- Data not persisting or visible after creation

**Root Cause:**
`get_db(request: Request = None)` - the `= None` default prevents FastAPI from injecting Request

**Fix:**
```python
# In app/api/deps/database.py AND app/api/deps/auth.py:

# WRONG - FastAPI won't inject Request
def get_db(request: Request = None) -> Generator:

# CORRECT - FastAPI injects Request automatically
def get_db(request: Request) -> Generator:
```

**Files to fix:**
- `app/api/deps/database.py`
- `app/api/deps/auth.py`

---

## Issue: Clinic Registration Fails with RLS Error

**Symptoms:**
- New clinic registration fails
- Error: "new row violates row-level security policy for table users"

**Root Cause:**
Public endpoint (no JWT) doesn't have tenant context. After creating tenant, must set context before creating user.

**Fix:**
In `app/api/v1/endpoints/tenants.py`:
```python
# After creating tenant, before creating user:
tenant = tenant_service.create_tenant(db, tenant_data, auto_commit=False)

# ADD THIS: Set tenant context for RLS
db.execute(text(f"SET app.current_tenant_id = '{tenant.id}'"))

# Now user creation will work
user = User(...)
db.add(user)
```

---

## Issue: Duplicate Key Violation on appointment_number/prescription_number

**Symptoms:**
- Creating appointment/prescription fails
- Error: "duplicate key value violates unique constraint"
- Different tenants get same number (APT202601110001)

**Root Cause:**
Unique constraints are GLOBAL but should be per-tenant. `appointments_appointment_number_key` blocks tenant B from using same number as tenant A.

**Fix:**
Change constraints from global to composite (tenant_id + number):
```sql
-- Appointments
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_appointment_number_key;
ALTER TABLE appointments ADD CONSTRAINT appointments_tenant_appointment_number_key
UNIQUE (tenant_id, appointment_number);

-- Prescriptions
ALTER TABLE prescriptions DROP CONSTRAINT IF EXISTS prescriptions_prescription_number_key;
ALTER TABLE prescriptions ADD CONSTRAINT prescriptions_tenant_prescription_number_key
UNIQUE (tenant_id, prescription_number);

-- Case Studies
ALTER TABLE case_studies DROP CONSTRAINT IF EXISTS uq_case_study_number;
ALTER TABLE case_studies ADD CONSTRAINT case_studies_tenant_number_key
UNIQUE (tenant_id, case_study_number);

-- Doctors license
ALTER TABLE doctors DROP CONSTRAINT IF EXISTS doctors_license_number_key;
ALTER TABLE doctors ADD CONSTRAINT doctors_tenant_license_number_key
UNIQUE (tenant_id, license_number);
```

---

## Issue: Procedures Not Showing After Create in Edit Mode (Frontend)

**Symptoms:**
- Create procedure in edit mode succeeds (API returns 200)
- Procedure doesn't appear in right panel until page reload

**Root Cause:**
After saving, `loadDentalChart()` only loads chart data, not procedures. Need to also reload procedures and update observations state.

**Fix:**
In `DentalConsultation.tsx`, after edit mode save:
```typescript
// After loadDentalChart(), also reload procedures:
if (appointmentId) {
  const procResponse = await dentalService.procedures.getByAppointment(appointmentId);
  const procedures = procResponse.procedures || [];

  // Update observations with fresh procedure data
  setObservations(prev => prev.map(obs => {
    // ... map procedures to observations
  }));
}
```

**File:** `frontend/src/pages/dental/DentalConsultation.tsx` (around line 1150)
