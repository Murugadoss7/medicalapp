# File Locations

## Backend Structure

```
backend/app/
├── api/
│   ├── deps/
│   │   ├── __init__.py      # Exports get_db, auth deps
│   │   ├── auth.py          # get_current_user, require_admin
│   │   └── database.py      # get_db with tenant context
│   └── v1/
│       └── endpoints/       # All API endpoints
│           ├── auth.py
│           ├── doctors.py
│           ├── patients.py
│           ├── tenants.py
│           ├── appointments.py
│           ├── prescriptions.py
│           ├── medicines.py
│           ├── dental.py
│           └── treatments.py
├── core/
│   ├── config.py            # Settings
│   ├── database.py          # SessionLocal, engine (DO NOT import get_db from here!)
│   ├── middleware.py        # TenantMiddleware
│   └── security.py          # Password hashing
├── models/                  # SQLAlchemy models
│   ├── user.py
│   ├── doctor.py
│   ├── patient.py
│   ├── tenant.py
│   └── ...
├── schemas/                 # Pydantic schemas
│   ├── user.py
│   ├── doctor.py
│   ├── patient.py
│   ├── tenant.py
│   └── ...
├── services/               # Business logic
│   ├── auth_service.py
│   ├── doctor_service.py
│   ├── patient_service.py
│   ├── tenant_service.py
│   └── ...
└── main.py                 # FastAPI app
```

## Key Files for Multi-Tenancy

| Purpose | File |
|---------|------|
| Tenant context in requests | `app/api/deps/database.py` |
| Auth dependencies | `app/api/deps/auth.py` |
| Tenant middleware | `app/core/middleware.py` |
| Tenant model | `app/models/tenant.py` |
| Tenant schema | `app/schemas/tenant.py` |
| Tenant service | `app/services/tenant_service.py` |
| Tenant endpoints | `app/api/v1/endpoints/tenants.py` |

## Frontend Structure

```
frontend/src/
├── components/
│   ├── auth/               # Auth components
│   ├── dashboard/          # Dashboard widgets
│   ├── layout/             # Layout components
│   └── ...
├── pages/
│   ├── auth/               # Login, Register
│   ├── admin/              # Admin dashboard
│   ├── doctor/             # Doctor dashboard
│   └── ...
├── store/
│   └── api.ts              # RTK Query API
└── routes/
    └── index.tsx           # Route definitions
```

## Database Files

| Purpose | Location |
|---------|----------|
| RLS policies | `backend/fix_rls_final.sql` |
| Migrations | `backend/alembic/versions/` |
| Initial schema | `backend/alembic/versions/*_initial_*.py` |

## Documentation

| Doc | Location |
|-----|----------|
| Main instructions | `/CLAUDE.md` |
| ERD | `ENTITY_RELATIONSHIP_DIAGRAM.md` |
| API Reference | `API_REFERENCE_GUIDE.md` |
| Architecture | `PROJECT_ARCHITECTURE.md` |
| Multi-tenancy | `MULTI_TENANCY_IMPLEMENTATION_SUMMARY.md` |
