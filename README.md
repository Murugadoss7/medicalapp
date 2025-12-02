# Medical Appointment & Prescription Management System

A comprehensive medical practice management system for clinics with doctor consultation, patient management, appointment booking, prescription generation, and medicine catalog features.

## Technology Stack

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **Database**: PostgreSQL 14
- **ORM**: SQLAlchemy
- **Validation**: Pydantic v2
- **Authentication**: JWT Bearer Tokens

### Frontend
- **Framework**: React 19 with TypeScript
- **UI Library**: Material-UI (MUI)
- **State Management**: Redux Toolkit
- **Routing**: React Router
- **Build Tool**: Vite

## Features

### Core Modules
1. **Authentication & Authorization**
   - Role-based access control (Admin, Doctor, Patient)
   - JWT token management with refresh tokens
   - Secure password handling

2. **Patient Management**
   - Composite key patient identification (mobile + first name)
   - Family member management
   - Medical history tracking
   - Patient demographics and profiles

3. **Doctor Management**
   - Doctor profiles with specializations
   - Schedule and availability management
   - Multiple doctor support per clinic

4. **Appointment Scheduling**
   - 30-minute fixed time slots
   - Conflict detection and prevention
   - Calendar integration
   - Appointment status tracking (scheduled, completed, cancelled)

5. **Prescription Management**
   - Digital prescription generation
   - Medicine catalog with ATC codes
   - Prescription templates (Short Keys)
   - Status workflow management
   - PDF generation for printing

6. **Medicine Catalog**
   - Comprehensive medicine database
   - ATC code classification
   - Stock management
   - Dosage and frequency templates

7. **Dental Module** (Specialization-based)
   - FDI notation tooth charts
   - Dental observations and procedures
   - Tooth history tracking
   - CDT procedure codes

8. **Admin Dashboard**
   - System overview and statistics
   - User management
   - Configuration settings

## Project Structure

```
MedicalApp/
├── prescription-management/
│   ├── backend/
│   │   └── app/
│   │       ├── api/v1/endpoints/    # API endpoints (9 modules)
│   │       ├── services/             # Business logic layer
│   │       ├── models/               # SQLAlchemy ORM models
│   │       ├── schemas/              # Pydantic schemas
│   │       ├── core/                 # Config, security
│   │       ├── utils/                # Utility functions
│   │       └── main.py               # FastAPI app entry
│   │
│   └── frontend/
│       └── src/
│           ├── components/           # Reusable UI components
│           ├── pages/                # Page components
│           ├── services/             # API client services
│           ├── store/                # Redux state
│           ├── routes/               # Router config
│           └── utils/                # Helper functions
│
├── CLAUDE.md                         # Development guidelines
└── [Additional documentation files]
```

## Getting Started

### Prerequisites
- Python 3.10 or higher
- Node.js 18 or higher
- PostgreSQL 14 or higher
- npm or yarn

### Database Setup

1. Create PostgreSQL database:
```bash
createdb prescription_management
```

2. Set database credentials:
```bash
DATABASE_URL="postgresql://postgres:prescription123@localhost:5432/prescription_management"
```

### Backend Setup

```bash
# Navigate to backend directory
cd prescription-management/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations (if applicable)
alembic upgrade head

# Start the backend server
DATABASE_URL="postgresql://postgres:prescription123@localhost:5432/prescription_management" \
python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: http://localhost:8000
API Documentation: http://localhost:8000/docs

### Frontend Setup

```bash
# Navigate to frontend directory
cd prescription-management/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at: http://localhost:5173

## API Architecture

The system provides 117+ RESTful API endpoints across 9 modules:

1. **Auth** (6 endpoints) - Authentication & authorization
2. **Admin** (4 endpoints) - Admin dashboard & system management
3. **Doctors** (13 endpoints) - Doctor CRUD & scheduling
4. **Patients** (13 endpoints) - Patient management & family support
5. **Medicines** (16 endpoints) - Medicine catalog & stock management
6. **Short Keys** (14 endpoints) - Prescription templates
7. **Appointments** (15 endpoints) - Appointment booking & management
8. **Prescriptions** (18 endpoints) - Prescription generation & tracking
9. **Dental** (18 endpoints) - Dental consultation features

Base URL: `http://localhost:8000/api/v1`

## Key Features

### Patient Composite Key System
- Patients identified by `(mobile_number, first_name)` composite key
- Enables family member management under single mobile number
- One primary member per family group

### Date Handling
- All dates in ISO format (YYYY-MM-DD)
- Indian Standard Time (Asia/Kolkata)
- Comprehensive date validation for DOB, appointments, visits

### Appointment System
- 30-minute fixed slots
- Working hours: 9 AM - 10 PM (Monday-Friday)
- Automatic conflict detection
- Configurable lunch breaks per doctor

### Prescription Workflow
- Status progression: draft → active → dispensed → completed
- 30-day expiration for active prescriptions
- Modification allowed only for draft/active status

### Dental Module (Specialization-based)
- Activated automatically for dental doctors
- FDI international tooth numbering
- Interactive tooth chart (32 permanent or 20 primary teeth)
- Observation and procedure tracking

## Development Guidelines

See `CLAUDE.md` for comprehensive development guidelines including:
- Documentation-first workflow
- ERD-driven development
- API design patterns
- Frontend component patterns
- Testing workflows
- Business rules and validation

## Testing

### Backend Tests
```bash
cd prescription-management/backend

# Run specific test modules
python test_auth_simple.py
python test_patient_simple.py
python test_appointment_simple.py
```

### Frontend Tests
```bash
cd prescription-management/frontend
npm run test
```

## Database Access

Direct database access for debugging:
```bash
PGPASSWORD=prescription123 psql -h localhost -p 5432 -U postgres -d prescription_management
```

## Project Status

- Backend: Complete (117+ endpoints)
- Frontend: 100% Complete
  - Authentication: Complete
  - Admin Dashboard: Complete
  - Doctor Management: Complete
  - Patient Management: Complete
  - Appointment Booking: Complete
  - Dental Module: Complete
  - Medicine Module: Complete
  - Prescription Module: Complete
  - Short Cut Module: Complete

## Documentation

Key documentation files:
- `CLAUDE.md` - Development guidelines and architecture
- `ENTITY_RELATIONSHIP_DIAGRAM.md` - Database schema authority
- `API_REFERENCE_GUIDE.md` - Complete API documentation
- `PROJECT_ARCHITECTURE.md` - Technical architecture
- `FRONTEND_DEVELOPMENT_PLAN.md` - UI/UX specifications
- `WORKFLOW_SPECIFICATIONS.md` - Business rules

## License

This is a proprietary medical practice management system.

## Support

For issues, questions, or contributions, please contact the development team.

---

**Note**: This system handles sensitive medical data. Ensure proper security measures, HIPAA compliance, and data protection regulations are followed in production deployments.
