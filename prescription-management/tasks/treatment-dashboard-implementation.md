# Treatment Dashboard - Implementation Tasks
**Started**: December 19, 2025
**Route**: `/treatments`
**Priority**: Phase 1 (Dashboard) → Phase 2 (Case Study + LLM)

---

## 🎯 IMPLEMENTATION STRATEGY

### Phase 1: Treatment Dashboard (MVP)
- ✅ Patient list with role-based filtering
- ✅ Treatment timeline view
- ✅ Procedure schedule view
- ✅ iPad-friendly UI (no dropdowns, only buttons)

### Phase 2: Case Study + LLM (After Phase 1)
- ⏳ Case study generation (doctor-only)
- ⏳ LLM integration (Claude API)

---

## 📋 TASK CHECKLIST

### **PHASE 1: DATABASE & BACKEND**

#### Database Migration
- [ ] Create `case_studies` table migration
- [ ] Add indexes for performance
- [ ] Test migration on development database

#### Backend Models
- [ ] Create `CaseStudy` model (`backend/app/models/case_study.py`)
- [ ] Update `__init__.py` to export CaseStudy

#### Backend Schemas
- [ ] Create case study schemas (`backend/app/schemas/case_study.py`)
  - [ ] `CaseStudyBase`
  - [ ] `CaseStudyCreate`
  - [ ] `CaseStudyResponse`

#### Backend Services
- [ ] Create `treatment_service.py`
  - [ ] `get_patients_with_treatment_summary()` - Get patient list with counts
  - [ ] `get_patient_treatment_timeline()` - Get chronological timeline
  - [ ] `get_patient_procedures()` - Get procedures grouped by status
- [ ] Add authorization helpers for doctor-patient access

#### Backend API Endpoints
- [ ] Create `treatments.py` endpoint file
- [ ] `GET /api/v1/treatments/patients` - Patient list
- [ ] `GET /api/v1/treatments/patients/{mobile}/{name}/timeline` - Timeline
- [ ] `GET /api/v1/treatments/patients/{mobile}/{name}/procedures` - Procedures
- [ ] Add authorization middleware
- [ ] Register routes in `__init__.py`

#### Backend Testing
- [ ] Test patient list endpoint (doctor role)
- [ ] Test patient list endpoint (admin role)
- [ ] Test timeline endpoint
- [ ] Test procedure endpoint
- [ ] Test authorization (doctor can't see other doctor's patients)

---

### **PHASE 1: FRONTEND**

#### Routing & Navigation
- [ ] Add `/treatments` route to `routes/index.tsx`
- [ ] Add "Treatments" menu item to sidebar (doctor + admin)
- [ ] Add navigation guard (doctor/admin only)

#### Services Layer
- [ ] Create `treatmentService.ts`
  - [ ] `fetchPatients()` API call
  - [ ] `fetchPatientTimeline()` API call
  - [ ] `fetchPatientProcedures()` API call
- [ ] Add treatment endpoints to Redux Toolkit Query (`store/api.ts`)

#### Main Container
- [ ] Create `TreatmentDashboard.tsx`
  - [ ] State management (selected patient, active tab, filters)
  - [ ] Split panel layout (35% left, 65% right)
  - [ ] Responsive breakpoints (desktop/tablet/mobile)
  - [ ] Role-based rendering (admin vs doctor view)

#### Patient List Panel (Left 35%)
- [ ] Create `PatientListPanel.tsx`
  - [ ] Patient card component with summary
  - [ ] Virtual scrolling (react-window) for performance
  - [ ] Filter section (buttons, no dropdowns!)
    - [ ] Status filter (button group: All | Active | Completed)
    - [ ] Date range selector (button group: Last 7 days | Last 30 days | Custom)
    - [ ] Search input (patient name/mobile)
  - [ ] Loading skeleton
  - [ ] Empty state
  - [ ] Click handler to select patient

#### Treatment Details Panel (Right 65%)
- [ ] Create `TreatmentDetailsPanel.tsx`
  - [ ] Tab navigation (Timeline | Procedures | Case Study)
  - [ ] Empty state (no patient selected)
  - [ ] Loading states

#### Timeline Tab
- [ ] Create `TreatmentTimeline.tsx`
  - [ ] Vertical timeline component
  - [ ] Event cards (appointment, prescription, observation, procedure)
  - [ ] Date grouping
  - [ ] Color-coded event types
  - [ ] Empty state (no timeline events)
  - [ ] Pagination (load more button)
  - [ ] Touch-friendly event cards (iPad)

#### Procedures Tab
- [ ] Create `ProcedureSchedule.tsx`
  - [ ] Status-grouped sections (Upcoming, Completed, Cancelled)
  - [ ] Procedure cards with details
  - [ ] Collapsible sections (touch-friendly)
  - [ ] Empty state (no procedures)
  - [ ] Status badges with colors

#### UI Components
- [ ] Create reusable components:
  - [ ] `PatientCard.tsx` - Patient summary card
  - [ ] `TimelineEvent.tsx` - Timeline event card
  - [ ] `ProcedureCard.tsx` - Procedure card
  - [ ] `FilterButtonGroup.tsx` - Button group filter (no dropdown!)
  - [ ] `StatusBadge.tsx` - Status badge component

#### Styling & Responsiveness
- [ ] Desktop layout (>1200px) - 35%/65% split
- [ ] Tablet layout (768-1200px) - 40%/60% split
- [ ] Mobile layout (<768px) - Stack vertically
- [ ] iPad-specific optimizations:
  - [ ] Touch-friendly buttons (min 44px height)
  - [ ] No hover states (use active states)
  - [ ] Swipe gestures for timeline (optional)
- [ ] Loading states (skeletons)
- [ ] Error states

#### Integration Testing
- [ ] Test patient list loading (doctor role)
- [ ] Test patient list loading (admin role)
- [ ] Test patient selection
- [ ] Test timeline loading
- [ ] Test procedure loading
- [ ] Test filters
- [ ] Test responsive design (desktop/tablet/mobile)
- [ ] Test iPad Safari
- [ ] Test touch interactions

---

### **PHASE 2: CASE STUDY + LLM** (After Phase 1 Complete)

#### Backend - LLM Integration
- [ ] Add `anthropic` package to requirements.txt
- [ ] Add `ANTHROPIC_API_KEY` to config
- [ ] Create `llm_client.py`
  - [ ] Claude API integration
  - [ ] Prompt templates
  - [ ] Response parsing
- [ ] Create `case_study_service.py`
  - [ ] `generate_case_study()` - LLM generation
  - [ ] `get_case_study()` - Fetch existing
  - [ ] `update_case_study()` - Edit
  - [ ] `regenerate_case_study()` - Regenerate with LLM

#### Backend - Case Study API
- [ ] `POST /api/v1/treatments/case-studies/generate` - Generate
- [ ] `GET /api/v1/treatments/case-studies/{id}` - Get
- [ ] `PUT /api/v1/treatments/case-studies/{id}` - Update
- [ ] `POST /api/v1/treatments/case-studies/{id}/regenerate` - Regenerate
- [ ] Add doctor-only authorization

#### Frontend - Case Study Tab
- [ ] Create `CaseStudyBuilder.tsx`
  - [ ] "No case study" state with generate button
  - [ ] Loading state (LLM generation with progress)
  - [ ] Generated case study display
  - [ ] Edit mode (editable sections)
  - [ ] Regenerate button
  - [ ] Save button
- [ ] Add case study API calls to `treatmentService.ts`

#### Testing - Case Study
- [ ] Test case study generation (LLM prompt quality)
- [ ] Test edit functionality
- [ ] Test regenerate
- [ ] Test doctor-only access
- [ ] Test loading states

---

## 📊 PROGRESS TRACKER

### Phase 1: Treatment Dashboard
- **Database**: 3/3 tasks (100%) ✅
- **Backend**: 11/11 tasks (100%) ✅
- **Frontend**: 25/25 tasks (100%) ✅
- **Testing**: In Progress

### Phase 2: Case Study + LLM
- **Backend**: 0/6 tasks (0%)
- **Frontend**: 0/2 tasks (0%)
- **Testing**: 0/5 tasks (0%)

**Overall Progress**: Phase 1 Complete! Ready for testing ✅

---

## 🎨 DESIGN CONSTRAINTS (iPad-Friendly)

### ✅ DO
- Use button groups for filters (horizontal buttons)
- Use chips/tags for status
- Use modal/bottom sheet for date picker
- Use large touch targets (min 44px)
- Use clear visual feedback on tap
- Use swipe gestures where appropriate
- Use pull-to-refresh

### ❌ DON'T
- No dropdowns (use button groups or modals)
- No small touch targets
- No hover-dependent interactions
- No tooltips (use labels or help text)

---

## 📝 CURRENT STATUS

**Last Updated**: December 19, 2025 - 5:30 PM
**Current Task**: Backend Complete ✅ | Starting Frontend
**Blocked**: None
**Next Up**: Create frontend components (TreatmentDashboard.tsx)

---

## 🐛 ISSUES LOG

None yet.

---

## ✅ COMPLETED MILESTONES

### Milestone 1: Backend Complete (Dec 19, 2025 - 5:30 PM) ✅
- ✅ Database migration: `case_studies` table created with all indexes
- ✅ SQLAlchemy model: `CaseStudy` model with relationships
- ✅ Pydantic schemas: Request/Response schemas for case studies
- ✅ Business logic: `TreatmentService` with 4 core methods
- ✅ API endpoints: 3 RESTful endpoints registered
  - `GET /api/v1/treatments/patients` - Patient list with filters
  - `GET /api/v1/treatments/patients/{mobile}/{name}/timeline` - Timeline
  - `GET /api/v1/treatments/patients/{mobile}/{name}/procedures` - Procedures
- ✅ Authorization: Role-based access (doctor/admin)
- ✅ Backend server restarted successfully

### Milestone 2: Frontend Complete (Dec 19, 2025 - 6:00 PM) ✅
- ✅ Main container: `TreatmentDashboard.tsx` with split panel layout
- ✅ Patient list: `PatientListPanel.tsx` with button filters (iPad-friendly)
- ✅ Patient cards: `PatientCard.tsx` with status badges
- ✅ Details panel: `TreatmentDetailsPanel.tsx` with tab navigation
- ✅ Timeline view: `TreatmentTimeline.tsx` with color-coded events
- ✅ Procedure view: `ProcedureSchedule.tsx` with status grouping
- ✅ Service layer: `treatmentService.ts` with API integration
- ✅ Route: `/treatments` added to router
- ✅ Navigation: "Treatments" menu item (doctor + admin)
- ✅ Responsive design: Desktop/tablet/mobile layouts
- ✅ iPad optimizations: Button groups, large touch targets (44px min)

---
