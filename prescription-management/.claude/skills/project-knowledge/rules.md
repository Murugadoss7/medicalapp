# Critical Rules

## DO - Always Follow

### 1. Import Rules
```python
# CORRECT - get_db with tenant context
from app.api.deps import get_db

# WRONG - get_db without tenant context
from app.core.database import get_db
```

### 1b. get_db Function Signature (CRITICAL)
```python
# CORRECT - No default value, FastAPI injects Request
def get_db(request: Request) -> Generator:

# WRONG - Default prevents FastAPI from injecting Request
def get_db(request: Request = None) -> Generator:  # NO!
```
**Why:** The `= None` default tells FastAPI not to inject the Request object, so tenant context from middleware is never read.

### 2. Creating Records with tenant_id
```python
# In service layer, ALWAYS set tenant_id from schema
doctor = Doctor(
    user_id=doctor_data.user_id,
    tenant_id=doctor_data.tenant_id,  # Must be set!
    ...
)

# In schema, include tenant_id field
class DoctorCreate(BaseModel):
    tenant_id: Optional[UUID] = None
```

### 3. After db.commit()
```python
# CORRECT - Don't refresh after commit (RLS blocks it)
db.commit()
# Use object data directly, don't call db.refresh()

# WRONG - Will fail with RLS
db.commit()
db.refresh(obj)  # RLS blocks SELECT
```

### 4. Login/Auth Flow
```python
# CORRECT - Set tenant context before updates
if user.tenant_id:
    db.execute(text(f"SET LOCAL app.current_tenant_id = '{user.tenant_id}'"))
    # Now updates work
    db.execute(text("UPDATE users SET last_login_at = ..."))
```

---

## DON'T - Never Do

### 1. Never Import Wrong get_db
```python
# NEVER use this in endpoints
from app.core.database import get_db  # NO!
```

### 2. Never Forget tenant_id
```python
# NEVER create records without tenant_id
doctor = Doctor(
    user_id=...,
    # Missing tenant_id = RLS violation!
)
```

### 3. Never Refresh After Commit
```python
# NEVER do this with RLS enabled
db.commit()
db.refresh(obj)  # Will fail!
```

### 4. Never Use SET Instead of SET LOCAL in Transactions
```python
# WRONG for transactions
db.execute(text("SET app.current_tenant_id = ..."))

# CORRECT for transactions
db.execute(text("SET LOCAL app.current_tenant_id = ..."))
```

---

### 5. SessionLocal Config (Critical)
```python
# In app/core/database.py - expire_on_commit=False is REQUIRED
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,  # Critical for RLS!
    bind=engine
)
```

---

### 6. Unique Constraints Must Be Tenant-Scoped
```sql
-- WRONG - Global unique constraint
UNIQUE (appointment_number)

-- CORRECT - Composite with tenant_id
UNIQUE (tenant_id, appointment_number)
```
**Affected tables:** appointments, prescriptions, case_studies, doctors (license_number)

### 7. Public Endpoints (No JWT) Must Set Tenant Context
```python
# For public endpoints like clinic registration:
tenant = create_tenant(...)
db.execute(text(f"SET app.current_tenant_id = '{tenant.id}'"))
# Now RLS allows user creation
user = User(tenant_id=tenant.id, ...)
```

---

## Quick Reference

| Action | Correct | Wrong |
|--------|---------|-------|
| Import get_db | `from app.api.deps import get_db` | `from app.core.database import get_db` |
| get_db signature | `def get_db(request: Request):` | `def get_db(request: Request = None):` |
| After commit | Use object directly | `db.refresh(obj)` |
| Create records | Include `tenant_id` | Omit tenant_id |
| Transaction context | `SET LOCAL` | `SET` |
| SessionLocal | `expire_on_commit=False` | Default (True) |
| Unique constraints | `UNIQUE (tenant_id, col)` | `UNIQUE (col)` |
| Public endpoints | Set tenant context manually | Assume context exists |
