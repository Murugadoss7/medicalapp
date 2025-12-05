# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**Prescription Management System** - A comprehensive medical practice management system for clinics with doctor consultation, patient management, appointment booking, prescription generation, and medicine catalog features.

### Technology Stack
- **Backend**: FastAPI (Python 3.10+), PostgreSQL 14, SQLAlchemy ORM, Pydantic v2
- **Frontend**: React 19, TypeScript, Material-UI (MUI), Redux Toolkit, React Router
- **Database**: PostgreSQL 14 with composite key patient identification
- **Auth**: JWT bearer tokens
- **Testing**: pytest (backend), manual testing workflows

---

## Critical Development Rules

### 1. DOCUMENTATION-FIRST WORKFLOW

**ALWAYS read these documentation files BEFORE making changes:**

Navigate to `/prescription-management/` and read:
- `ENTITY_RELATIONSHIP_DIAGRAM.md` - Database schema authority, field mappings, composite keys
- `API_REFERENCE_GUIDE.md` - All API endpoints (99+ endpoints across 8 modules)
- `PROJECT_ARCHITECTURE.md` - Folder structure and technical architecture
- `FRONTEND_DEVELOPMENT_PLAN.md` - Page specifications and UI/UX guidelines
- `WORKFLOW_SPECIFICATIONS.md` - Business rules and workflows

### 2. NO RANDOM FILE CREATION

- **NEVER** create files without checking the documented folder structure
- **ALWAYS** use `Glob` to check existing files before creating new ones
- **ALWAYS** follow the exact folder structure in `PROJECT_ARCHITECTURE.md`
- Backend files belong in `backend/app/` with proper module separation
- Frontend files belong in `frontend/src/` following the established patterns

### 3. NO DUPLICATE FUNCTIONS

- **ALWAYS** search existing code with `Grep` before creating functions
- Check service files, utils, and helpers first
- Backend services are in `backend/app/services/`
- Frontend utilities are in `frontend/src/utils/`
- API endpoints already exist - verify in `API_REFERENCE_GUIDE.md`

### 4. PATIENT COMPOSITE KEY ARCHITECTURE

**Critical**: Patients use composite primary key (mobile_number, first_name)

- All patient operations require BOTH mobile_number AND first_name
- Backend also has UUID field for foreign key references
- Family members share mobile_number, differentiated by first_name
- Frontend-backend field mapping: `relationship` (FE) → `relationship_to_primary` (BE)

---

## Project Structure

```
prescription-management/
├── backend/
│   └── app/
│       ├── api/v1/endpoints/      # 9 endpoint modules (auth, doctors, patients, dental, etc.)
│       ├── services/               # Business logic layer
│       ├── models/                 # SQLAlchemy ORM models (including dental.py)
│       ├── schemas/                # Pydantic validation schemas (including dental.py)
│       ├── core/                   # Config, security, dependencies
│       ├── utils/                  # Utility functions, date validators
│       └── main.py                 # FastAPI application entry
│
├── frontend/
│   └── src/
│       ├── components/             # Reusable UI components
│       │   ├── dental/             # Dental-specific components (NEW)
│       │   │   ├── DentalChart.tsx
│       │   │   ├── DentalObservationForm.tsx
│       │   │   ├── DentalProcedureForm.tsx
│       │   │   └── ToothHistoryViewer.tsx
│       │   └── ...
│       ├── pages/                  # Page components (admin, doctors, patients, etc.)
│       │   ├── dental/             # Dental consultation pages (NEW)
│       │   │   └── DentalConsultation.tsx
│       │   └── ...
│       ├── services/               # API client services
│       │   ├── dentalService.ts    # Dental API integration (NEW)
│       │   └── ...
│       ├── store/                  # Redux state management
│       ├── routes/                 # React Router configuration
│       ├── utils/                  # Helper functions, formatters
│       └── theme/                  # MUI theme configuration
│
└── [Documentation files listed above]
```

---

## Running the Application

### Backend Development

```bash
# Navigate to backend directory
cd prescription-management/backend

# Start backend server (from backend root, not app/)
DATABASE_URL="postgresql://postgres:prescription123@localhost:5432/prescription_management" \
python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Run module tests (from backend root)
python test_auth_simple.py
python test_patient_simple.py
python test_prescription_simple.py
```

### Frontend Development

```bash
# Navigate to frontend directory
cd prescription-management/frontend

# Start development server
npm run dev

# Build for production
npm run build

# Lint code
npm run lint
```

### Database Connection

- **Host**: localhost:5432
- **Database**: prescription_management
- **User**: postgres
- **Password**: prescription123
- Access via: `PGPASSWORD=prescription123 psql -h localhost -p 5432 -U postgres -d prescription_management`

---

## API Architecture

### Endpoint Structure (117+ endpoints across 9 modules)

1. **Auth** (6 endpoints): login, register, refresh, logout, change-password
2. **Admin** (4 endpoints): dashboard stats, system overview
3. **Doctors** (13 endpoints): CRUD, search, availability, schedules
4. **Patients** (13 endpoints): CRUD, family management, composite key operations
5. **Medicines** (16 endpoints): CRUD, categories, stock management, ATC codes
6. **Short Keys** (14 endpoints): Prescription templates, usage tracking
7. **Appointments** (15 endpoints): Booking, availability, conflicts, calendar
8. **Prescriptions** (18 endpoints): CRUD, items, printing, status management
9. **Dental** (18 endpoints): Dental observations, procedures, FDI charts, tooth history

**Base URL**: `http://localhost:8000/api/v1`

### Search Before Creating Endpoints

```bash
# Check if endpoint exists
rg "@router\.(get|post|put|delete)" backend/app/api/

# Search for specific route
rg "/patients" backend/app/api/v1/endpoints/

# Find service functions
rg "def.*patient" backend/app/services/
```

---

## Key Business Rules

### Patient Management
- Composite key: (mobile_number, first_name) uniquely identifies patients
- Family groups share mobile_number
- One primary_member per family (primary_member=true)
- Age calculated from date_of_birth

### Appointment Scheduling
- Fixed 30-minute appointment slots
- Working hours: 9 AM - 10 PM, Monday-Friday
- 10-minute breaks between appointments
- Lunch break configurable per doctor
- No overlapping appointments for same doctor

### Date Handling (CRITICAL)
- All dates in ISO format: YYYY-MM-DD
- Backend validators: `backend/app/utils/date_validators.py`
- Frontend component: `StandardDatePicker.tsx` (use for ALL date inputs)
- Timezone: Indian Standard Time (Asia/Kolkata)

Date validation rules:
- `date_of_birth`: Cannot be future, min year 1900, max age 150
- `appointment_date`: Must be future (except rescheduling), max 1 year advance
- `visit_date`: Can be past/present, max 5 years old

### Prescription Management
- Status workflow: draft → active → dispensed → completed
- Prescriptions expire after 30 days
- Only draft/active can be modified
- Short keys enable quick prescription templates

### Dental Consultation (Specialization-Based)
- **Specialization Detection**: Login returns doctor's specialization field
- **Conditional UI**: Dental consultation UI shown ONLY if doctor's specialization contains "dental" or "dentist"
- **FDI Notation**: International tooth numbering system (11-48 for permanent, 51-85 for primary)
- **Tooth Chart**: Interactive chart with 32 permanent teeth or 20 primary teeth
- **Color Coding**: Red (issues), Orange (observations), Green (completed), Blue (data), Grey (healthy)
- **Observations**: Tooth-level conditions with severity tracking (14 condition types, 7 surfaces)
- **Procedures**: CDT-coded procedures with cost tracking (20+ pre-configured templates)
- **Access Route**: `/appointments/{appointmentId}/dental` - shown as "Dental" button in appointment cards for dental doctors only

---

## Frontend Development Patterns

### Authentication
- JWT tokens stored in Redux state
- Role-based routing (admin, doctor, patient, etc.)
- Protected routes use auth middleware
- Token refresh on 401 responses
- **Specialization field**: Login response includes `specialization` for doctors (used for dental UI detection)

### State Management
- Redux Toolkit for global state
- Slices: auth, patients, doctors, appointments, prescriptions
- API services use axios with interceptors
- Base URL: `http://localhost:8000/api/v1`

### Component Structure
- Use Material-UI components consistently
- Forms use react-hook-form + yup validation
- Date inputs MUST use StandardDatePicker component
- Reusable components in `components/` folder
- Page-specific components in `pages/[module]/components/`
- **Dental components**: Located in `components/dental/` (DentalChart, DentalObservationForm, DentalProcedureForm, ToothHistoryViewer)

### API Integration
```typescript
// Use existing API service pattern
import { patientsApi } from '@/services/patientsApi';

// All API calls return structured responses
const response = await patientsApi.getPatient(mobile, firstName);

// Dental API integration
import { dentalObservationAPI, dentalProcedureAPI, dentalChartAPI } from '@/services/dentalService';
```

### Specialization-Based UI
- Check user specialization: `user?.specialization?.toLowerCase().includes('dental')`
- Conditionally render dental features for dental doctors
- Example: Dental button in AppointmentCard shown only for dental doctors

---

## Testing Workflow

### Backend Testing
```bash
# Run specific test files
python test_auth_simple.py
python test_patient_simple.py
python test_appointment_simple.py

# Tests validate:
# - API endpoint responses
# - Database operations
# - Business logic
# - Error handling
```

### Real-World Testing
Test complete workflows:
1. Register doctor → Login → View dashboard
2. Register patient → Add family member → Book appointment
3. Doctor consultation → Create prescription → Print
4. Admin dashboard → Manage doctors/patients → View reports

---

## Common Development Tasks

### Adding New API Endpoint
1. Read `API_REFERENCE_GUIDE.md` to check if endpoint exists
2. Read `ENTITY_RELATIONSHIP_DIAGRAM.md` for field mappings
3. Add route in `backend/app/api/v1/endpoints/[module].py`
4. Implement service logic in `backend/app/services/[module]_service.py`
5. Add Pydantic schema in `backend/app/schemas/[module]_schemas.py`
6. Update `API_REFERENCE_GUIDE.md` with new endpoint

### Adding Frontend Page
1. Read `FRONTEND_DEVELOPMENT_PLAN.md` for page specifications
2. Create page in `frontend/src/pages/[module]/`
3. Add route in `frontend/src/routes/`
4. Create API service function in `frontend/src/services/[module]Api.ts`
5. Add Redux slice if needed in `frontend/src/store/[module]Slice.ts`
6. Use existing components and follow MUI theme

### Database Changes
1. Read `ENTITY_RELATIONSHIP_DIAGRAM.md` for current schema
2. Create migration in `backend/alembic/versions/`
3. Update model in `backend/app/models/`
4. Update schema in `backend/app/schemas/`
5. Update ERD documentation

---

## Debugging Tips

### Backend Issues
- Check logs in `/tmp/backend.log` or `/tmp/backend_clean.log`
- Verify database connection and credentials
- Check FastAPI docs at `http://localhost:8000/docs`
- Validate request/response against schemas

### Frontend Issues
- Check browser console for errors
- Verify API responses in Network tab
- Check Redux state in Redux DevTools
- Ensure date formatting uses utility functions

### Database Issues
```bash
# Check if database exists
PGPASSWORD=prescription123 psql -h localhost -p 5432 -U postgres -l

# List tables
PGPASSWORD=prescription123 psql -h localhost -p 5432 -U postgres -d prescription_management -c "\dt"

# Check recent appointments
PGPASSWORD=prescription123 psql -h localhost -p 5432 -U postgres -d prescription_management -c \
"SELECT id, appointment_number, patient_mobile_number, patient_first_name FROM appointments ORDER BY created_at DESC LIMIT 10;"
```

---

## Project Status (November 2025)

- **Backend**: ✅ Complete - 117+ endpoints across 9 modules
- **Frontend**: 🟡 92% Complete
  - ✅ Authentication (login, registration, role-based routing)
  - ✅ Admin dashboard (system overview, quick actions)
  - ✅ Doctor management (CRUD, profiles, schedules)
  - ✅ Patient management (CRUD, family support)
  - ✅ Appointment booking (3-step wizard, calendar, availability)
  - ✅ Dental module (FDI charts, observations, procedures, tooth history)
  - 🔄 Medicine module (backend ready, frontend pending)
  - 🔄 Prescription module (backend ready, frontend pending)
- **Database**: ✅ ERD-compliant schema with proper indexes
- **Tests**: ✅ Comprehensive test suites for all modules

---

## Important Reminders

1. **Search before creating** - Use `Grep` and `Glob` extensively
2. **Read docs first** - All architectural decisions are documented
3. **Composite keys matter** - Patients require mobile_number + first_name
4. **Date handling is critical** - Use standardized validators and components
5. **API already exists** - 117+ endpoints implemented, check before adding
6. **Follow patterns** - Backend services, frontend pages follow established patterns
7. **Field mappings** - Frontend/backend field names differ (check ERD)
8. **No random endpoints** - Medical systems require careful endpoint design
9. **Specialization-based features** - Check user.specialization for conditional UI (e.g., dental features)
10. **Dental module** - FDI notation, tooth charts, observations/procedures for dental doctors only

---

## Dental Module (Specialization-Based Feature)

### Overview
The dental module provides specialized consultation tools for dental doctors. Access is **automatically enabled** when a doctor's specialization contains "dental" or "dentist".

### How It Works

#### 1. Login Flow
```typescript
// Login response includes specialization field
{
  "user": {
    "id": "uuid",
    "email": "dentist@clinic.com",
    "role": "doctor",
    "specialization": "Dental Surgery",  // ← Key field
    "first_name": "Dr. John",
    "last_name": "Doe"
  },
  "tokens": { ... }
}
```

#### 2. Conditional UI Rendering
```typescript
// Frontend checks specialization
const isDentalDoctor = user?.specialization?.toLowerCase().includes('dental') ||
                       user?.specialization?.toLowerCase().includes('dentist');

// Shows "Dental" button only for dental doctors
{isDentalDoctor && (
  <Button onClick={() => navigate(`/appointments/${id}/dental`)}>
    Dental Consultation
  </Button>
)}
```

#### 3. Dental Consultation Page
- **Route**: `/appointments/{appointmentId}/dental`
- **Access**: Visible in appointment cards for dental doctors only
- **Features**:
  - Interactive FDI tooth chart (32 permanent or 20 primary teeth)
  - Click-to-select teeth with visual feedback
  - Add observations with 14 condition types, 7 tooth surfaces
  - Record procedures with 20+ CDT codes
  - View complete tooth history timeline
  - Color-coded status indicators

### Database Tables

#### dental_observations
- Tooth-level observations with FDI notation (11-48, 51-85)
- Links to prescriptions and appointments
- Tracks condition type, severity, treatment status
- 10 indexes for optimized queries

#### dental_procedures
- CDT-coded dental procedures
- Cost tracking (estimated/actual)
- Status workflow: planned → in_progress → completed/cancelled
- Duration and completion date tracking
- 5 indexes for efficient queries

### FDI Notation System (International Standard)

**Permanent Teeth (32):**
- Quadrant 1 (Upper Right): 18-11
- Quadrant 2 (Upper Left): 21-28
- Quadrant 3 (Lower Left): 31-38
- Quadrant 4 (Lower Right): 48-41

**Primary Teeth (20):**
- Quadrant 5 (Upper Right): 55-51
- Quadrant 6 (Upper Left): 61-65
- Quadrant 7 (Lower Left): 71-75
- Quadrant 8 (Lower Right): 85-81

### Color Coding System

| Color | Status | Meaning |
|-------|--------|---------|
| 🔴 Red | Critical | Active issues requiring immediate treatment |
| 🟠 Orange | Warning | Observations recorded, no procedure yet |
| 🟢 Green | Success | Treatment completed successfully |
| 🔵 Blue | Info | Data recorded, no issues found |
| ⚪ Grey | Default | Healthy tooth, no data recorded |

### Components (5 major)

1. **DentalChart.tsx** - Interactive tooth chart with FDI notation
2. **DentalObservationForm.tsx** - Add/edit tooth observations
3. **DentalProcedureForm.tsx** - Manage dental procedures
4. **ToothHistoryViewer.tsx** - Timeline view of tooth history
5. **DentalConsultation.tsx** - Main consultation page

### API Endpoints (18 total)

**Observations (9):**
- POST/GET/PUT/DELETE `/api/v1/dental/observations`
- GET `/observations/patient/{mobile}/{name}` - All patient observations
- GET `/observations/tooth/{mobile}/{name}/{tooth}` - Specific tooth history
- POST `/observations/bulk` - Bulk create (max 32)

**Procedures (7):**
- POST/GET/PUT/DELETE `/api/v1/dental/procedures`
- PUT `/procedures/{id}/status` - Update procedure status
- POST `/procedures/bulk` - Bulk create (max 20)

**Chart & Stats (2):**
- GET `/chart/{mobile}/{name}` - Complete dental chart
- GET `/statistics` - System-wide dental statistics

### Usage Example

```typescript
// 1. Doctor logs in
const response = await authApi.login(email, password);
// Response includes specialization: "Dental Surgery"

// 2. Navigate to appointments
// Dental button appears automatically for dental doctors

// 3. Click "Dental" button on any appointment
navigate(`/appointments/${appointmentId}/dental`);

// 4. Select tooth from interactive chart
// Click tooth 26 (upper left first molar)

// 5. Add observation
const observation = {
  tooth_number: "26",
  condition_type: "Cavity",
  severity: "Moderate",
  observation_notes: "Deep cavity on occlusal surface"
};

// 6. Record procedure
const procedure = {
  procedure_code: "D2740",
  procedure_name: "Crown - Porcelain/Ceramic",
  tooth_numbers: "26",
  estimated_cost: 15000,
  status: "planned"
};
```

### Related Documentation
- `DENTAL_CONSULTATION_PLAN.md` - Detailed implementation plan with FDI notation
- `DENTAL_MODULE_SUMMARY.md` - Complete feature summary and code statistics
- `DENTAL_QUICK_START.md` - Quick start guide for using the dental module
- `DENTAL_PHASE_3_COMPLETE.md` - Phase 3 implementation completion report

---

## Getting Help

- API documentation: `http://localhost:8000/docs` (when backend running)
- All architecture decisions documented in markdown files
- Test files demonstrate correct usage patterns
- ERD is the single source of truth for data structures
- Dental module docs: See DENTAL_*.md files in project root



Directory Structure

  | Directory                         | Branch      | Purpose                      |
  |-----------------------------------|-------------|------------------------------|
  | /Users/murugadoss/MedicalApp      | development | Active development           |
  | /Users/murugadoss/MedicalApp-main | main        | Stable/production comparison |

  Running Both Environments

  Development (current setup):
  # Frontend: port 5173, Backend: port 8000
  cd /Users/murugadoss/MedicalApp/prescription-management/frontend && npm run dev
  cd /Users/murugadoss/MedicalApp/prescription-management/backend && uvicorn app.main:app --port 8000

  Main (different ports):
  # Frontend: port 5174, Backend: port 8001
  cd /Users/murugadoss/MedicalApp-main/prescription-management/frontend && npm run dev -- --port 5174
  cd /Users/murugadoss/MedicalApp-main/prescription-management/backend && uvicorn app.main:app --port 8001

  Note

  Currently both branches have identical code since we just merged. The difference will appear when you make new changes
   to development - main will stay at the current stable version until you merge again.

  Worktree Commands

  # List worktrees
  git worktree list

  # Remove main worktree when no longer needed
  git worktree remove /Users/murugadoss/MedicalApp-main
