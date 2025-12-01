# Project Architecture Guide
## Prescription Management System - Complete Technical Architecture

---

**📅 Last Updated**: December 2, 2025
**🎯 Purpose**: Complete technical architecture and folder structure documentation
**📋 Status**: Backend Complete (118+ endpoints across 9 modules), Frontend 98% Complete
**🚀 Recent Updates**:
- **iPad UI Optimizations**: Fixed page freeze on iPad with useTransition and module-level guards ⭐ NEW
- **Responsive Layout System**: Side-by-side layout (55/45%) on tablet, stacked on mobile ⭐ NEW
- **Observation Side Panel**: Replaced tabs with fixed side panel for observations ⭐ NEW
- **ObservationRow Component**: Inline observation form with optional procedure expansion ⭐ NEW
- **TodayAppointmentsSidebar**: Persistent right sidebar for today's appointments (doctors only) ⭐ NEW
- **Treatment Summary Dialog**: DentalSummaryTable in modal for holistic patient view ⭐ NEW
- **Procedures Sidebar View**: Click "Today's Procedures" card to view procedures in sidebar
- **Clickable StatCards**: StatCard component supports onClick for interactive dashboards
- **Sidebar Mode Toggle**: uiSlice.ts manages 'appointments' | 'procedures' view mode
- **Doctor Today Procedures API**: GET /dental/procedures/doctor/{id}/today with patient_name
- **Toast Notification System**: ToastContext.tsx + ConfirmDialog.tsx replaces browser alerts
- **Consultation Status Tracking**: DentalConsultation.tsx with status chip, Complete button, navigation guard
- **Backend Status Transitions**: appointment_service.py allows `scheduled → in_progress` direct transition
- **Dashboard Real-time Stats**: DoctorDashboard.tsx calculates statistics from actual appointment data
- **TodaySchedule Enhancements**: Status-based styling, "Start"/"Continue"/"View" buttons
- Short Key Management UI complete (702 lines, /shortcuts route)
- Prescription items fully editable with inline editing
- Backend error handling improved (404 for not found)
- Soft delete filtering for prescription items
- Doctor ownership validation enforced  

---

## 🏗️ System Architecture Overview

### **High-Level Architecture**
```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                            │
├─────────────────────────────────────────────────────────────┤
│  React.js Frontend (TypeScript)                            │
│  ├── Authentication (JWT)                                  │
│  ├── Role-based Dashboards                                 │
│  ├── Responsive UI Components                              │
│  └── Real-time Updates                                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS/REST API
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   API GATEWAY LAYER                        │
├─────────────────────────────────────────────────────────────┤
│  FastAPI Server (Python 3.10+)                           │
│  ├── JWT Authentication & Authorization                    │
│  ├── Request Validation (Pydantic v2)                     │
│  ├── Rate Limiting & Security                             │
│  └── API Documentation (OpenAPI/Swagger)                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   BUSINESS LOGIC LAYER                     │
├─────────────────────────────────────────────────────────────┤
│  Service Layer (Python)                                   │
│  ├── User & Authentication Service                        │
│  ├── Doctor Management Service                            │
│  ├── Patient Management Service (Composite Keys)          │
│  ├── Medicine Catalog Service                             │
│  ├── Short Key Management Service                         │
│  ├── Appointment Scheduling Service                       │
│  └── Prescription Management Service                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATA ACCESS LAYER                       │
├─────────────────────────────────────────────────────────────┤
│  SQLAlchemy ORM (Python)                                  │
│  ├── Repository Pattern                                   │
│  ├── Database Migrations (Alembic)                        │
│  ├── Connection Pooling                                   │
│  └── Query Optimization                                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   PERSISTENCE LAYER                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐    ┌─────────────────────────────┐ │
│  │   PostgreSQL 14     │    │        Redis 7              │ │
│  │   ├── Primary DB    │    │  ├── Session Storage        │ │
│  │   ├── ACID Support  │    │  ├── API Caching           │ │
│  │   ├── Indexes       │    │  └── Rate Limiting         │ │
│  │   └── Constraints   │    └─────────────────────────────┘ │
│  └─────────────────────┘                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Folder Structure

### **Root Directory Structure**
```
prescription-management/
├── 📄 README.md                          # Project overview and setup instructions
├── 📄 ENTITY_RELATIONSHIP_DIAGRAM.md     # Database schema and field mappings
├── 📄 API_REFERENCE_GUIDE.md             # Complete API documentation
├── 📄 FRONTEND_DEVELOPMENT_PLAN.md       # Page specs and UI/UX guidelines
├── 📄 PROJECT_ARCHITECTURE.md            # Technical architecture (this file)
├── 📄 WORKFLOW_SPECIFICATIONS.md         # Business workflow requirements
├── 📄 DEVELOPMENT_PROGRESS.md            # Project progress tracking
├── 📄 CONTEXT_RESTORATION.md             # Context for AI development
├── 📄 docker-compose.yml                 # Docker services configuration
├── 📁 backend/                           # FastAPI backend application
├── 📁 frontend/                          # React frontend application (to be created)
├── 📁 database/                          # Database scripts and migrations
├── 📁 infrastructure/                    # Deployment and infrastructure
├── 📁 archive/                           # Archived documentation
└── 📁 keycloak/                          # Keycloak configuration (future)
```

### **Backend Folder Structure**
```
backend/
├── 📄 Dockerfile.dev                     # Development Docker configuration
├── 📄 requirements.txt                   # Python dependencies
├── 📄 requirements-dev.txt               # Development dependencies  
├── 📄 requirements-minimal.txt           # Minimal dependencies
├── 📄 alembic.ini                        # Database migration configuration
├── 📁 alembic/                           # Database migration files
│   ├── 📄 env.py                         # Migration environment
│   ├── 📄 script.py.mako                 # Migration template
│   └── 📁 versions/                      # Migration version files
├── 📁 app/                               # Main application package
│   ├── 📄 __init__.py
│   ├── 📄 main.py                        # FastAPI application entry point
│   ├── 📁 api/                           # API layer
│   │   ├── 📄 __init__.py
│   │   ├── 📁 deps/                      # Dependencies and middleware
│   │   │   ├── 📄 auth.py                # Authentication dependencies
│   │   │   └── 📄 database.py            # Database dependencies
│   │   └── 📁 v1/                        # API version 1
│   │       ├── 📄 __init__.py            # API router configuration
│   │       └── 📁 endpoints/             # API endpoints
│   │           ├── 📄 __init__.py
│   │           ├── 📄 auth.py            # Authentication endpoints (6)
│   │           ├── 📄 admin.py           # Admin management endpoints (4) ✅ NEW
│   │           ├── 📄 users.py           # User management endpoints
│   │           ├── 📄 doctors.py         # Doctor management endpoints (13)
│   │           ├── 📄 patients.py        # Patient management endpoints (13)
│   │           ├── 📄 medicines.py       # Medicine catalog endpoints (16)
│   │           ├── 📄 short_keys.py      # Short key management endpoints (14)
│   │           ├── 📄 appointments.py    # Appointment management endpoints (15)
│   │           └── 📄 prescriptions.py   # Prescription management endpoints (18)
│   ├── 📁 core/                          # Core application modules
│   │   ├── 📄 __init__.py
│   │   ├── 📄 config.py                  # Application configuration
│   │   ├── 📄 database.py                # Database connection and session
│   │   └── 📄 exceptions.py              # Custom exception classes
│   ├── 📁 models/                        # SQLAlchemy database models
│   │   ├── 📄 __init__.py
│   │   ├── 📄 base.py                    # Base model with common fields
│   │   ├── 📄 user.py                    # User model (authentication)
│   │   ├── 📄 doctor.py                  # Doctor profile model
│   │   ├── 📄 patient.py                 # Patient model (composite key)
│   │   ├── 📄 medicine.py                # Medicine catalog model
│   │   ├── 📄 short_key.py               # Short key management models
│   │   ├── 📄 appointment.py             # Appointment scheduling model
│   │   ├── 📄 prescription.py            # Prescription management models
│   │   └── 📄 audit_log.py               # Audit logging model
│   ├── 📁 schemas/                       # Pydantic validation schemas
│   │   ├── 📄 __init__.py
│   │   ├── 📄 auth.py                    # Authentication schemas
│   │   ├── 📄 admin.py                   # Admin management schemas ✅ NEW
│   │   ├── 📄 user.py                    # User management schemas
│   │   ├── 📄 doctor.py                  # Doctor management schemas
│   │   ├── 📄 patient.py                 # Patient management schemas
│   │   ├── 📄 medicine.py                # Medicine catalog schemas
│   │   ├── 📄 short_key.py               # Short key schemas
│   │   ├── 📄 appointment.py             # Appointment schemas
│   │   └── 📄 prescription.py            # Prescription schemas
│   ├── 📁 services/                      # Business logic layer
│   │   ├── 📄 __init__.py
│   │   ├── 📄 auth_service.py            # Authentication business logic
│   │   ├── 📄 admin_service.py           # Admin management business logic ✅ NEW
│   │   ├── 📄 user_service.py            # User management business logic
│   │   ├── 📄 doctor_service.py          # Doctor management business logic
│   │   ├── 📄 patient_service.py         # Patient management business logic
│   │   ├── 📄 medicine_service.py        # Medicine catalog business logic
│   │   ├── 📄 short_key_service.py       # Short key business logic
│   │   ├── 📄 appointment_service.py     # Appointment business logic
│   │   └── 📄 prescription_service.py    # Prescription business logic
│   ├── 📁 repositories/                  # Data access layer (optional)
│   ├── 📁 utils/                         # Utility functions
│   └── 📁 workers/                       # Background tasks (future)
├── 📁 tests/                             # Test files
│   ├── 📄 __init__.py
│   ├── 📄 conftest.py                    # Test configuration
│   ├── 📁 api/                           # API endpoint tests
│   ├── 📁 services/                      # Service layer tests
│   └── 📁 utils/                         # Utility tests
├── 📄 test_auth_simple.py                # Authentication API tests
├── 📄 test_doctor_simple.py              # Doctor management tests
├── 📄 test_patient_simple.py             # Patient management tests
├── 📄 test_medicine_simple.py            # Medicine catalog tests
├── 📄 test_short_key_simple.py           # Short key tests
├── 📄 test_appointment_simple.py         # Appointment tests
├── 📄 test_prescription_simple.py        # Prescription tests
├── 📄 verify_system.py                   # System verification script
└── 📁 venv/                              # Python virtual environment
```

### **Frontend Folder Structure (Current Implementation)**
```
frontend/
├── 📄 package.json                       # Node.js dependencies with React 18 + TypeScript
├── 📄 tsconfig.json                      # TypeScript configuration
├── 📄 vite.config.ts                     # Vite build configuration
├── 📄 index.html                         # Main HTML template
├── 📁 public/                            # Static public assets
│   └── 📄 vite.svg                       # Default Vite icon
├── 📁 src/                               # Source code
│   ├── 📄 main.tsx                       # Application entry point
│   ├── 📄 App.tsx                        # Root component with routing
│   ├── 📄 vite-env.d.ts                  # Vite environment types
│   │
│   ├── 📁 components/                    # Reusable UI components ✅ IMPLEMENTED
│   │   ├── 📁 common/                    # Common components
│   │   │   ├── 📄 Layout.tsx             # Main layout with navigation ✅ IMPLEMENTED
│   │   │   ├── 📄 Header.tsx             # Header with role-based menu ✅ IMPLEMENTED
│   │   │   ├── 📄 Sidebar.tsx            # Collapsible sidebar navigation ✅ IMPLEMENTED
│   │   │   ├── 📄 ProtectedRoute.tsx     # Route protection component ✅ IMPLEMENTED
│   │   │   ├── 📄 LoadingSpinner.tsx     # Loading indicator ✅ IMPLEMENTED
│   │   │   ├── 📄 StandardDatePicker.tsx # Centralized date picker ✅ IMPLEMENTED
│   │   │   ├── 📄 Toast.tsx              # Toast notification provider ⭐ NEW
│   │   │   │   # ToastContext with success/error/warning/info methods
│   │   │   │   # Replaces browser alerts throughout the application
│   │   │   └── 📄 ConfirmDialog.tsx      # Confirmation dialog for navigation guards ⭐ NEW
│   │   ├── 📁 forms/                     # Form components ✅ IMPLEMENTED
│   │   │   ├── 📄 PatientForm.tsx        # Patient registration form ✅ IMPLEMENTED
│   │   │   ├── 📄 DoctorForm.tsx         # Doctor registration form ✅ IMPLEMENTED
│   │   │   └── 📄 AppointmentBookingForm.tsx # 3-step appointment wizard ✅ IMPLEMENTED
│   │   ├── 📁 cards/                     # Card components ✅ IMPLEMENTED
│   │   │   ├── 📄 DoctorCard.tsx         # Doctor profile display card ✅ IMPLEMENTED
│   │   │   ├── 📄 PatientCard.tsx        # Patient profile display card ✅ IMPLEMENTED
│   │   │   └── 📄 AppointmentCard.tsx    # Appointment summary card ✅ IMPLEMENTED
│   │   ├── 📁 dashboard/                 # Dashboard components ⭐ UPDATED
│   │   │   ├── 📄 TodaySchedule.tsx      # Today's appointments with status-based styling
│   │   │   │   # "Start"/"Continue"/"View" buttons based on status
│   │   │   │   # Time-sorted appointment list
│   │   │   │   # Orange background for in_progress appointments
│   │   │   ├── 📄 TodayAppointmentsSidebar.tsx # Persistent right sidebar ⭐ NEW
│   │   │   │   # Shows today's appointments for doctors
│   │   │   │   # Collapsible with toggle in AppBar
│   │   │   │   # 320px width, visible on dashboard + large screens
│   │   │   │   # Click to navigate to consultation
│   │   │   ├── 📄 StatCard.tsx           # Statistics card with icon and subtitle
│   │   │   └── 📄 RecentPrescriptions.tsx # Recent prescriptions list
│   │   ├── 📁 layout/                    # Layout components ⭐ UPDATED
│   │   │   └── 📄 MainLayout.tsx         # Main layout with right sidebar support
│   │   │       # TodayAppointmentsSidebar integration
│   │   │       # Responsive margin adjustments for sidebars
│   │   └── 📁 dental/                    # Dental-specific components ⭐ UPDATED
│   │       ├── 📄 DentalChart.tsx        # Interactive FDI tooth chart (optimized for iPad)
│   │       ├── 📄 DentalObservationForm.tsx # Add/edit tooth observations
│   │       ├── 📄 DentalProcedureForm.tsx # Manage dental procedures
│   │       ├── 📄 ToothHistoryViewer.tsx # Timeline view of tooth history
│   │       ├── 📄 DentalSummaryTable.tsx # Holistic view of all teeth/procedures ⭐ NEW
│   │       ├── 📄 ObservationRow.tsx     # Inline observation form with procedure ⭐ NEW
│   │       │   # Collapsible observation cards
│   │       │   # Optional procedure expansion within observation
│   │       │   # Save/edit state management
│   │       ├── 📄 PrescriptionViewer.tsx # Prescription display with print
│   │       └── 📄 index.ts               # Module exports
│   │
│   ├── 📁 pages/                         # Page components ✅ IMPLEMENTED
│   │   ├── 📁 auth/                      # Authentication pages ✅ IMPLEMENTED
│   │   │   ├── 📄 LoginPage.tsx          # Login with role-based redirect ✅ IMPLEMENTED
│   │   │   └── 📄 RegisterPage.tsx       # User registration ✅ IMPLEMENTED
│   │   │
│   │   ├── 📁 doctor/                    # Doctor role pages ✅ IMPLEMENTED
│   │   │   ├── 📄 DoctorDashboard.tsx    # Doctor dashboard with real-time stats ⭐ UPDATED
│   │   │   │   # Statistics calculated from actual appointment data
│   │   │   │   # "X scheduled, Y in progress" subtitle on stat cards
│   │   │   │   # Book Appointment and Refresh buttons in header
│   │   │   ├── 📄 DoctorAppointments.tsx # Doctor appointments view ✅ IMPLEMENTED
│   │   │   └── 📄 PatientConsultation.tsx # General patient consultation ✅ IMPLEMENTED
│   │   │
│   │   ├── 📁 dental/                    # Dental consultation pages ⭐ UPDATED
│   │   │   └── 📄 DentalConsultation.tsx # Complete dental consultation workflow
│   │   │       # ~1350 lines with iPad optimizations
│   │   │       # Side-by-side layout: Chart (55%) | Observations (45%)
│   │   │       # Status chip (Scheduled/In Progress/Completed)
│   │   │       # Complete Consultation button
│   │   │       # Navigation guard with exit dialog
│   │   │       # Auto-update to in_progress on entry
│   │   │       # Treatment Summary dialog with DentalSummaryTable
│   │   │       # ObservationRow components in fixed side panel
│   │   │       # useTransition for non-blocking state updates
│   │   │       # Module-level guards prevent double API calls
│   │   │       # Route: /appointments/{appointmentId}/dental
│   │   │
│   │   ├── 📁 admin/                     # Admin role pages ✅ IMPLEMENTED
│   │   │   └── 📄 AdminDashboard.tsx     # Admin dashboard with system stats ✅ IMPLEMENTED
│   │   │
│   │   ├── 📁 doctors/                   # Doctor management pages ✅ IMPLEMENTED
│   │   │   ├── 📄 DoctorSearch.tsx       # Doctor search/list with filters ✅ IMPLEMENTED
│   │   │   ├── 📄 DoctorRegistration.tsx # Doctor registration with validation ✅ IMPLEMENTED
│   │   │   ├── 📄 DoctorView.tsx         # Doctor profile view with schedule ✅ IMPLEMENTED
│   │   │   ├── 📄 DoctorEdit.tsx         # Doctor profile edit ✅ IMPLEMENTED
│   │   │   └── 📄 index.ts               # Module exports ✅ IMPLEMENTED
│   │   │
│   │   ├── 📁 patients/                  # Patient management pages ✅ IMPLEMENTED
│   │   │   ├── 📄 PatientSearch.tsx      # Patient search with filters ✅ IMPLEMENTED
│   │   │   ├── 📄 PatientRegistration.tsx # Patient registration ✅ IMPLEMENTED
│   │   │   ├── 📄 PatientView.tsx        # Patient profile view ✅ IMPLEMENTED
│   │   │   ├── 📄 PatientEdit.tsx        # Patient profile edit ✅ IMPLEMENTED
│   │   │   ├── 📄 FamilyView.tsx         # Family management ✅ IMPLEMENTED
│   │   │   └── 📄 index.ts               # Module exports ✅ IMPLEMENTED
│   │   │
│   │   ├── 📁 appointments/              # Appointment pages ✅ IMPLEMENTED
│   │   │   ├── 📄 AppointmentBooking.tsx # 3-step appointment wizard ✅ IMPLEMENTED
│   │   │   ├── 📄 AppointmentCalendar.tsx # Calendar view with events ✅ IMPLEMENTED
│   │   │   └── 📄 index.ts               # Module exports ✅ IMPLEMENTED
│   │   │
│   │   ├── 📁 medicines/                 # Medicine pages (pending)
│   │   │   └── 📄 MedicineListPage.tsx   # Medicine catalog (pending)
│   │   │
│   │   ├── 📁 short-keys/                # Short key management ✅ COMPLETE
│   │   │   └── 📄 ShortKeyManagement.tsx # Complete CRUD UI (702 lines) ✅
│   │   │       # Features:
│   │   │       # - Create/edit/delete shortcuts
│   │   │       # - Add/remove medicines with inline editing
│   │   │       # - Drag-and-drop reordering (sequence_order)
│   │   │       # - Real-time validation and error handling
│   │   │       # - Usage: Type /CODE in prescription search
│   │   │
│   │   └── 📁 prescriptions/             # Prescription pages ✅ COMPLETE
│   │       ├── 📄 PrescriptionListPage.tsx # Prescription listing
│   │       └── 📄 PrescriptionViewPage.tsx # Prescription details
│   │
│   ├── 📁 hooks/                         # Custom React hooks (future)
│   │   ├── 📄 useAuth.ts                 # Authentication hook
│   │   ├── 📄 useApi.ts                  # API calling hook
│   │   └── 📄 useLocalStorage.ts         # Local storage hook
│   │
│   ├── 📁 store/                         # Redux Toolkit store ✅ IMPLEMENTED
│   │   ├── 📄 store.ts                   # Store configuration with RTK Query ✅ IMPLEMENTED
│   │   ├── 📄 api.ts                     # Base RTK Query API configuration ✅ UPDATED
│   │   │   # ⭐ Recent Updates (lines 876-952):
│   │   │   # - listShortKeys: Query for shortcuts with filters
│   │   │   # - createShortKey: Create new shortcut template
│   │   │   # - updateShortKey: Update shortcut metadata
│   │   │   # - deleteShortKey: Soft delete shortcut
│   │   │   # - addMedicineToShortKey: Add medicine with defaults
│   │   │   # - removeMedicineFromShortKey: Remove medicine from shortcut
│   │   │   # - Cache invalidation: Prescription-specific tags
│   │   └── 📁 slices/                    # Redux slices ✅ IMPLEMENTED
│   │       ├── 📄 authSlice.ts           # Authentication state management ✅ IMPLEMENTED
│   │       ├── 📄 uiSlice.ts             # UI state (sidebar, notifications) ✅ IMPLEMENTED
│   │       └── 📄 notificationSlice.ts   # Toast notifications ✅ IMPLEMENTED
│   │
│   ├── 📁 types/                         # TypeScript type definitions ✅ IMPLEMENTED
│   │   ├── 📄 index.ts                   # Common types and interfaces ✅ IMPLEMENTED
│   │   ├── 📄 auth.ts                    # Authentication types ✅ IMPLEMENTED
│   │   ├── 📄 api.ts                     # API response types ✅ IMPLEMENTED
│   │   └── 📄 entities.ts                # Entity types (User, Doctor, Patient, etc.) ✅ IMPLEMENTED
│   │
│   ├── 📁 utils/                         # Utility functions ✅ IMPLEMENTED
│   │   ├── 📄 constants.ts               # Application constants ✅ IMPLEMENTED
│   │   ├── 📄 formatters.ts              # Data formatting utilities ✅ IMPLEMENTED
│   │   ├── 📄 validators.ts              # Form validation utilities ✅ IMPLEMENTED
│   │   ├── 📄 dateUtils.ts               # Date/time manipulation ✅ IMPLEMENTED
│   │   ├── 📄 dateConfig.ts              # Centralized date configuration ✅ IMPLEMENTED
│   │   └── 📄 doctorUtils.ts             # Doctor ID consistency utilities ✅ IMPLEMENTED
│   │
│   ├── 📁 styles/                        # CSS/styling files (minimal - using MUI)
│   │   └── 📄 index.css                  # Global styles ✅ IMPLEMENTED
│   │
│   └── 📁 assets/                        # Static assets (minimal)
│       └── 📄 react.svg                  # Default React icon
│
├── 📁 tests/                             # Frontend tests (future)
│   ├── 📄 setup.ts                       # Test setup
│   ├── 📁 components/                    # Component tests
│   ├── 📁 pages/                         # Page tests
│   └── 📁 utils/                         # Utility tests
│
└── 📁 dist/                              # Build output (generated)
```

**🎯 Implementation Status Summary:**
- ✅ **Authentication System**: Login, registration, role-based routing
- ✅ **Admin Dashboard**: System overview, quick actions, statistics
- ✅ **Doctor Management**: Complete CRUD with search, registration, profiles
- ✅ **Patient Management**: Complete CRUD with family support, composite keys
- ✅ **Appointment System**: 3-step booking wizard, calendar view, dashboard integration
- ✅ **Prescription Management**: Complete CRUD with printing, ownership validation
  - Prescription items fully editable (dosage, frequency, duration, quantity, instructions)
  - Soft delete filtering (is_active=false items excluded from display)
  - Doctor ownership validation on all operations
  - Cache invalidation with prescription-specific tags
- ✅ **Short Key Management**: Complete CRUD UI at /shortcuts route
  - 702-line ShortKeyManagement.tsx component
  - Inline editing for all medicine fields
  - Drag-and-drop reordering with sequence_order
  - RTK Query mutations for all operations
  - Usage: Type /CODE in prescription medicine search
- ✅ **Toast Notification System**: Complete toast and dialog system ⭐ NEW
  - ToastContext.tsx with success/error/warning/info methods
  - ConfirmDialog.tsx for action confirmations and navigation guards
  - Replaces all browser alerts throughout the application
- ✅ **Dental Consultation Module**: Complete consultation workflow ⭐ UPDATED
  - DentalConsultation.tsx (~1350 lines) with full status tracking
  - **iPad Optimizations**: useTransition + module-level guards prevent freezing
  - **Side-by-side Layout**: Chart (55%) | Observations (45%) on tablet
  - **ObservationRow Component**: Inline forms with optional procedure expansion
  - **Treatment Summary Dialog**: DentalSummaryTable for holistic patient view
  - Status chip showing real-time appointment status (Scheduled/In Progress/Completed)
  - "Complete Consultation" button for finalizing appointments
  - Navigation guard with exit dialog for in-progress consultations
  - Auto-update to "in_progress" when entering consultation
  - Backend status transitions updated: `scheduled → in_progress` allowed
- ✅ **Today's Appointments Sidebar**: Persistent sidebar for doctors ⭐ NEW
  - TodayAppointmentsSidebar.tsx component
  - Toggle in AppBar for show/hide
  - 320px width, visible on dashboard and large screens
  - Click appointment to navigate to consultation
- ✅ **Doctor Dashboard Enhancements**: Real-time statistics ⭐ NEW
  - Statistics calculated from actual appointment data
  - "X scheduled, Y in progress" subtitle on stat cards
  - TodaySchedule with "Start"/"Continue"/"View" buttons
  - Status-based styling (orange for in_progress)
- ✅ **Date Standardization**: Centralized date handling with StandardDatePicker
- ✅ **State Management**: Redux Toolkit + RTK Query with cache invalidation
- ✅ **UI Framework**: Material-UI v5 with TypeScript
- 🔄 **Medicine Module**: Backend complete, frontend catalog pending
- 🔄 **Testing**: Test infrastructure setup pending

---

## 🔧 Technology Stack Details

### **Backend Stack**
```yaml
Runtime:
  - Python: 3.10+
  - FastAPI: 0.104+
  - Uvicorn: ASGI server

Database:
  - PostgreSQL: 14+
  - SQLAlchemy: 2.0+ (ORM)
  - Alembic: Database migrations
  - Redis: 7+ (Caching & Sessions)

Authentication:
  - JWT: JSON Web Tokens
  - BCrypt: Password hashing
  - Python-JOSE: JWT handling

Validation:
  - Pydantic: v2 (Data validation)
  - Email-validator: Email validation

Development:
  - pytest: Testing framework
  - Black: Code formatting
  - isort: Import sorting
  - mypy: Type checking (optional)

Deployment:
  - Docker: Containerization
  - docker-compose: Multi-service development
```

### **Frontend Stack (Recommended)**
```yaml
Framework:
  - React: 18+
  - TypeScript: 5+
  - Vite: Build tool
  - React Router: v6 (Routing)

State Management:
  - Redux Toolkit: State management
  - RTK Query: API state management
  - React Hook Form: Form handling

UI Framework:
  - Material-UI (MUI): v5 OR
  - Ant Design: v5
  - Tailwind CSS: Utility CSS (optional)

Date/Time:
  - date-fns: Date manipulation
  - React Date Picker: Date selection

PDF/Printing:
  - react-pdf: PDF generation
  - html2canvas: HTML to image

Testing:
  - Vitest: Test runner
  - React Testing Library: Component testing
  - MSW: API mocking

Development:
  - ESLint: Code linting
  - Prettier: Code formatting
  - Husky: Git hooks
```

### **Database Architecture**
```sql
-- Primary Database: PostgreSQL 14+
-- Character Set: UTF-8
-- Timezone: UTC

-- Core Tables (7 main entities)
users              -- Authentication and user management
doctors             -- Doctor profiles and schedules  
patients            -- Patient records (composite key: mobile + name)
medicines           -- Medicine catalog with ATC codes
short_keys          -- Quick prescription templates
appointments        -- Doctor-patient appointments
prescriptions       -- Prescription management

-- Junction Tables (2 many-to-many relationships)
short_key_medicines -- Short keys ↔ Medicines relationship
prescription_items  -- Prescriptions ↔ Medicines relationship

-- Indexes (Performance optimization)
B-Tree indexes on:
  - Primary keys and foreign keys
  - Composite keys (patients)
  - Search fields (names, mobile numbers)
  - Date fields (appointments, prescriptions)

-- Constraints
Primary Keys:       All tables have UUID primary keys
Foreign Keys:       Proper referential integrity
Unique Constraints: Emails, license numbers, prescription numbers
Check Constraints:  Enum values, date validations
```

---

## 🔐 Security Architecture

### **Authentication & Authorization**
```yaml
Authentication Flow:
  1. User Login → JWT Access Token (30 min) + Refresh Token (7 days)
  2. Frontend stores tokens in secure storage
  3. API requests include Bearer token in header
  4. Backend validates JWT and extracts user info
  5. Refresh token used to get new access token

Role-Based Access Control (RBAC):
  Roles:
    - super_admin: Full system access
    - admin: User and system management
    - doctor: Patient consultation and prescriptions
    - nurse: Patient care and basic operations
    - receptionist: Appointment booking and patient registration
    - patient: Own medical records access (future)

  Permission Matrix:
    Resource         | Admin | Doctor | Nurse | Receptionist | Patient
    Users           | CRUD  | R      | R     | R           | -
    Doctors         | CRUD  | R(Own) | R     | R           | R
    Patients        | CRUD  | R      | CRUD  | CRUD        | R(Own)
    Appointments    | CRUD  | R(Own) | R     | CRUD        | R(Own)
    Prescriptions   | R     | CRUD   | R     | R           | R(Own)
    Medicines       | CRUD  | R      | R     | R           | -
    Short Keys      | R     | CRUD   | R     | R           | -
    Admin Dashboard | FULL  | -      | -     | -           | -
    System Stats    | FULL  | -      | -     | -           | -

  Admin Specific Features:
    - System statistics dashboard
    - Doctor registration and management
    - Patient data oversight across all families
    - Medicine catalog management
    - System health monitoring
    - User role management
    - Broadcast notifications

Security Headers:
  - CORS: Configured for frontend domain
  - CSRF Protection: Via JWT tokens
  - Rate Limiting: Per IP and per user
  - Input Validation: Pydantic schemas
  - SQL Injection: Protected by SQLAlchemy ORM
```

### **Data Protection**
```yaml
Sensitive Data Handling:
  - Passwords: BCrypt hashed with salt
  - Medical Data: Encrypted at rest (future)
  - API Keys: Environment variables only
  - Database: SSL connections required

Privacy Compliance:
  - Patient Data: Access logging (audit trails)
  - Data Retention: Configurable retention policies
  - Data Export: Patient data export capability
  - Data Deletion: Soft deletes with hard delete option

Security Best Practices:
  - Environment Variables: Secrets not in code
  - HTTPS Only: SSL/TLS required in production
  - Token Expiry: Short-lived access tokens
  - Session Management: Secure session handling
  - Error Handling: No sensitive data in error messages
```

---

## 📊 Performance & Scalability

### **Database Optimization**
```sql
-- Query Optimization Strategies
1. Proper Indexing:
   CREATE INDEX idx_patients_mobile ON patients(mobile_number);
   CREATE INDEX idx_appointments_date ON appointments(appointment_date);
   CREATE INDEX idx_prescriptions_doctor ON prescriptions(doctor_id);

2. Composite Indexes for Patient Queries:
   CREATE INDEX idx_patients_composite ON patients(mobile_number, first_name);

3. Partial Indexes for Active Records:
   CREATE INDEX idx_active_doctors ON doctors(id) WHERE is_active = true;

4. Connection Pooling:
   - SQLAlchemy connection pool: 5-20 connections
   - Connection timeout: 30 seconds
   - Connection recycling: 3600 seconds
```

### **Caching Strategy**
```yaml
Redis Caching:
  Session Data:
    - JWT refresh tokens
    - User session information
    - Login attempt tracking

  API Response Caching:
    - Medicine catalog (TTL: 1 hour)
    - Doctor availability (TTL: 15 minutes)
    - Frequently accessed patient data (TTL: 30 minutes)

  Application Caching:
    - Static configuration data
    - Lookup tables (categories, specializations)
    - Short key templates

Cache Invalidation:
  - Time-based expiry (TTL)
  - Event-based invalidation (data updates)
  - Manual cache clearing (admin operations)
```

### **API Performance**
```yaml
Response Time Targets:
  - Authentication: < 200ms
  - Simple CRUD operations: < 300ms
  - Complex searches: < 500ms
  - Report generation: < 2000ms

Optimization Techniques:
  - Database query optimization
  - Eager loading for relationships
  - Response compression (gzip)
  - API response pagination
  - Background task processing

Monitoring:
  - Request/response time tracking
  - Database query performance
  - Error rate monitoring
  - Resource utilization tracking
```

---

## 🚀 Deployment Architecture

### **Development Environment**
```yaml
Local Development:
  - Docker Compose: Multi-service orchestration
  - PostgreSQL Container: Database
  - Redis Container: Caching
  - FastAPI Server: Hot reload with uvicorn
  - React Dev Server: Vite development server

Services Configuration:
  Database:
    Host: localhost:5432
    Database: prescription_management
    User: postgres
    Password: prescription123

  Redis:
    Host: localhost:6379
    Database: 0

  API Server:
    Host: localhost:8000
    Reload: True (development)
    Workers: 1

Environment Variables:
  - DATABASE_URL: PostgreSQL connection string
  - REDIS_URL: Redis connection string
  - JWT_SECRET_KEY: JWT signing secret
  - DEBUG: True (development only)
```

### **Production Deployment (Future)**
```yaml
Infrastructure:
  - Cloud Provider: AWS/GCP/Azure
  - Container Orchestration: Kubernetes or Docker Swarm
  - Load Balancer: Nginx or cloud LB
  - Database: Managed PostgreSQL (RDS/Cloud SQL)
  - Cache: Managed Redis (ElastiCache/Cloud Memorystore)

Scaling Strategy:
  API Servers:
    - Horizontal scaling with load balancer
    - Auto-scaling based on CPU/memory usage
    - Multiple availability zones

  Database:
    - Read replicas for read-heavy operations
    - Connection pooling (PgBouncer)
    - Regular backups and point-in-time recovery

  Cache:
    - Redis cluster for high availability
    - Cache warming strategies
    - Failover mechanisms

Security:
  - SSL/TLS certificates (Let's Encrypt)
  - WAF (Web Application Firewall)
  - VPC with private subnets
  - Database encryption at rest
  - Regular security updates
```

---

## 🔄 Development Workflow

### **Git Workflow**
```yaml
Branch Strategy:
  main:         Production-ready code
  develop:      Integration branch for features
  feature/*:    Individual feature development
  hotfix/*:     Critical bug fixes
  release/*:    Release preparation

Commit Conventions:
  feat:         New feature
  fix:          Bug fix
  docs:         Documentation updates
  style:        Code formatting changes
  refactor:     Code refactoring
  test:         Test additions/updates
  chore:        Build/dependency updates

Code Review Process:
  1. Feature branch creation
  2. Development and testing
  3. Pull request creation
  4. Code review and approval
  5. Merge to develop branch
  6. Integration testing
  7. Release to main branch
```

### **Testing Strategy**
```yaml
Backend Testing:
  Unit Tests:
    - Service layer business logic
    - Utility functions
    - Data validation

  Integration Tests:
    - API endpoint testing
    - Database operations
    - Authentication flows

  End-to-End Tests:
    - Complete workflow testing
    - Cross-module integration
    - Performance testing

Frontend Testing:
  Unit Tests:
    - Component functionality
    - Utility functions
    - State management

  Integration Tests:
    - API integration
    - Form submissions
    - User interactions

  E2E Tests:
    - Complete user workflows
    - Cross-browser testing
    - Mobile responsiveness

Test Coverage Targets:
  - Backend: >80% code coverage
  - Frontend: >70% code coverage
  - Critical paths: 100% coverage
```

### **Documentation Standards**
```yaml
Code Documentation:
  - Docstrings for all functions/classes
  - Type hints for all parameters
  - Inline comments for complex logic
  - README files for each module

API Documentation:
  - OpenAPI/Swagger specifications
  - Request/response examples
  - Error code documentation
  - Authentication requirements

User Documentation:
  - Installation guides
  - User manuals
  - API integration guides
  - Troubleshooting guides

Architecture Documentation:
  - System design documents
  - Database schema documentation
  - Deployment guides
  - Security guidelines
```

---

## 📋 Quality Assurance

### **Code Quality Standards**
```yaml
Python Backend:
  Formatting:
    - Black: Code formatting
    - isort: Import organization
    - Line length: 88 characters

  Linting:
    - flake8: Style guide enforcement
    - pylint: Code quality analysis
    - mypy: Type checking (optional)

  Standards:
    - PEP 8: Python style guide
    - Type hints: Required for public APIs
    - Docstrings: Google style docstrings
    - Error handling: Comprehensive exception handling

TypeScript Frontend:
  Formatting:
    - Prettier: Code formatting
    - ESLint: Code linting
    - Consistent import organization

  Standards:
    - Strict TypeScript mode
    - Component prop type definitions
    - Consistent naming conventions
    - Error boundary implementations

Database:
  Schema Standards:
    - Consistent naming conventions
    - Proper foreign key relationships
    - Appropriate indexes
    - Data validation constraints

  Migration Standards:
    - Reversible migrations
    - Data preservation
    - Performance considerations
    - Testing on staging data
```

### **Performance Standards**
```yaml
Response Time Requirements:
  API Endpoints:
    - Simple CRUD: < 300ms
    - Complex queries: < 500ms
    - Search operations: < 800ms
    - Report generation: < 2000ms

  Frontend:
    - Page load time: < 2 seconds
    - Component rendering: < 100ms
    - Form submissions: < 500ms
    - Navigation: < 200ms

Resource Usage:
  Memory:
    - Backend: < 512MB per instance
    - Frontend: < 100MB browser memory

  CPU:
    - Backend: < 50% average utilization
    - Database: < 70% average utilization

Database Performance:
  Query Performance:
    - Simple queries: < 50ms
    - Complex joins: < 200ms
    - Full-text search: < 300ms
    - Aggregations: < 500ms
```

---

**✅ This Project Architecture Guide provides complete technical specifications, folder structures, and implementation guidelines for the entire Prescription Management System.**