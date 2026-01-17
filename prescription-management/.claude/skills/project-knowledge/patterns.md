# Implementation Patterns

## Database Connection

```python
# Database credentials
conn = psycopg2.connect(
    host="localhost",
    port=5432,
    database="prescription_management",
    user="prescription_user",
    password="prescription_password"
)

# Or via docker
docker exec test-postgres-fresh psql -U prescription_user -d prescription_management -c "YOUR_SQL"
```

---

## Pattern: Creating a Record with Tenant Isolation

### 1. Schema (with tenant_id)
```python
# schemas/example.py
class ExampleCreate(ExampleBase):
    tenant_id: Optional[UUID] = Field(None, description="Tenant ID")
```

### 2. Service (set tenant_id)
```python
# services/example_service.py
def create_example(self, db: Session, data: ExampleCreate):
    example = Example(
        name=data.name,
        tenant_id=data.tenant_id,  # MUST set this!
    )
    db.add(example)
    db.commit()
    # Don't refresh! Use object directly
    return example
```

### 3. Endpoint (pass tenant_id from user)
```python
# api/v1/endpoints/examples.py
from app.api.deps import get_db, get_current_active_user  # Correct import!

@router.post("/")
def create_example(
    data: ExampleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Set tenant_id from current user
    data.tenant_id = current_user.tenant_id
    return example_service.create_example(db, data)
```

---

## Pattern: Querying with Tenant Context

RLS handles filtering automatically when tenant context is set.

```python
# Endpoint - get_db sets tenant context from request
@router.get("/")
def list_examples(
    db: Session = Depends(get_db),  # Tenant context set here
    current_user: User = Depends(get_current_active_user)
):
    # RLS automatically filters by tenant
    examples = db.query(Example).all()
    return examples
```

---

## Pattern: Login Flow with RLS

```python
# auth_service.py
def login(self, db: Session, email: str, password: str):
    # 1. Query user (users SELECT is open for login)
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise InvalidCredentials()

    # 2. Verify password
    if not verify_password(password, user.hashed_password):
        raise InvalidCredentials()

    # 3. Set tenant context for updates
    if user.tenant_id:
        db.execute(text(f"SET LOCAL app.current_tenant_id = '{user.tenant_id}'"))

    # 4. Update last login (now works with RLS)
    db.execute(
        text("UPDATE users SET last_login_at = :time WHERE id = :id"),
        {"time": datetime.utcnow(), "id": str(user.id)}
    )
    db.commit()

    # 5. Generate tokens with tenant_id
    return create_tokens(user)
```

---

## Pattern: Admin Creating Doctor

```python
@router.post("/doctors")
def admin_create_doctor(
    data: AdminCreateDoctorRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    # Inherit tenant_id from admin
    doctor_data = DoctorCreate(
        user_id=new_user.id,
        license_number=data.license_number,
        tenant_id=current_user.tenant_id,  # Inherit!
    )

    doctor = doctor_service.create_doctor(db, doctor_data)

    # Commit without refresh
    db.commit()
    # Return response using object data directly
    return response
```

---

## Pattern: RLS Policy (NULL-safe)

```sql
-- Must check IS NOT NULL to prevent bypass
CREATE POLICY example_tenant_isolation ON examples
FOR ALL
USING (
    current_setting('app.current_tenant_id', TRUE) IS NOT NULL
    AND tenant_id::text = current_setting('app.current_tenant_id', TRUE)
);
```

---

## Pattern: get_db with Tenant Context

```python
# api/deps/database.py
def get_db(request: Request = None) -> Generator:
    db = SessionLocal()
    try:
        # Set tenant context from request (set by middleware)
        if request and hasattr(request.state, 'tenant_id') and request.state.tenant_id:
            db.execute(text(f"SET app.current_tenant_id = '{request.state.tenant_id}'"))
        yield db
    finally:
        db.close()
```

---

## Anti-Patterns (DON'T DO)

### Wrong Import
```python
# WRONG
from app.core.database import get_db

# CORRECT
from app.api.deps import get_db
```

### Refresh After Commit
```python
# WRONG - RLS blocks this
db.commit()
db.refresh(obj)

# CORRECT
db.commit()
return obj  # Use directly
```

### Missing tenant_id
```python
# WRONG
doctor = Doctor(user_id=..., license_number=...)

# CORRECT
doctor = Doctor(user_id=..., license_number=..., tenant_id=data.tenant_id)
```
