# Treatment Dashboard - Implementation Plan
**Feature**: Treatment Dashboard with AI-Powered Case Study Generation
**Date**: December 19, 2025
**Status**: Planning
**Priority**: High

---

## 📋 EXECUTIVE SUMMARY

### **What We're Building**
A Treatment Dashboard where doctors can:
1. View their consulted patients with treatment history
2. See appointment schedules and procedure statuses
3. Create presentation-ready case studies using LLM
4. Track treatment timeline and outcomes

**Key Design Principle**: Progressive Disclosure - Show summary first, details on demand

---

## 🎯 REQUIREMENTS CLARIFICATION

### **Primary Use Case**
✅ Creating **presentation-ready case studies** for doctors using LLM

### **Confirmed Specifications**
1. ✅ **Photo Upload**: Happens in consultation page (NOT in this feature)
2. ✅ **Case Study Trigger**: Doctor manually triggers case study generation
3. ✅ **Access Control**: Doctor-only feature (no sharing of case studies)
4. ✅ **LLM Integration**: AI generates case study narrative from treatment data
5. ✅ **Role-Based View**:
   - **Admin**: See ALL patients across all doctors
   - **Doctor**: See ONLY their consulted patients

### **Phase 1 - MVP Features**
- ✅ Patient list with role-based filtering
- ✅ Treatment timeline view
- ✅ Appointment/procedure schedule
- ✅ Basic case study creation (text-based, LLM-generated)
- ✅ Status tracking

---

## 📊 DATABASE ANALYSIS

### **Existing Tables We'll Use**

#### **1. Patients Table**
```
✓ patient_mobile_number (composite key)
✓ patient_first_name (composite key)
✓ patient_uuid
✓ full demographics
```

#### **2. Appointments Table**
```
✓ appointment_number
✓ patient_mobile_number + patient_first_name (composite)
✓ doctor_id
✓ appointment_date, appointment_time
✓ status (scheduled, in_progress, completed, cancelled)
✓ reason_for_visit
```

#### **3. Prescriptions Table**
```
✓ prescription_number
✓ patient_mobile_number + patient_first_name (composite)
✓ doctor_id
✓ appointment_id (optional link)
✓ chief_complaint, diagnosis, symptoms
✓ clinical_notes, doctor_instructions
✓ visit_date
```

#### **4. Dental Observations Table**
```
✓ prescription_id, appointment_id
✓ patient_mobile_number + patient_first_name
✓ tooth_number (FDI notation)
✓ condition_type, severity
✓ observation_notes (template-based)
✓ treatment_required, treatment_done
```

#### **5. Dental Procedures Table**
```
✓ observation_id, prescription_id, appointment_id
✓ procedure_code, procedure_name
✓ tooth_numbers
✓ status (planned, in_progress, completed, cancelled)
✓ procedure_date, completed_date
✓ estimated_cost, actual_cost
✓ procedure_notes, complications
```

### **New Table Required: case_studies**

```sql
CREATE TABLE case_studies (
    -- Primary Key
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Case Study Identifier
    case_study_number       VARCHAR(100) UNIQUE NOT NULL,  -- "CS20251219001"

    -- Patient Reference (Composite Key)
    patient_mobile_number   VARCHAR(15) NOT NULL,
    patient_first_name      VARCHAR(100) NOT NULL,
    patient_uuid            UUID NOT NULL REFERENCES patients(id),

    -- Doctor Reference
    doctor_id               UUID NOT NULL REFERENCES doctors(id),

    -- Related Entities (Treatment Journey)
    appointment_ids         TEXT,  -- JSON array of appointment UUIDs
    prescription_ids        TEXT,  -- JSON array of prescription UUIDs
    procedure_ids           TEXT,  -- JSON array of dental_procedure UUIDs

    -- Case Study Content
    title                   VARCHAR(500) NOT NULL,
    chief_complaint         TEXT NOT NULL,

    -- Pre-Treatment Assessment (AI-Generated)
    pre_treatment_summary   TEXT,  -- LLM-generated summary
    initial_diagnosis       TEXT,
    treatment_goals         TEXT,

    -- Treatment Timeline (AI-Generated)
    treatment_summary       TEXT,  -- LLM-generated narrative
    procedures_performed    TEXT,  -- Formatted list

    -- Post-Treatment Outcome (AI-Generated)
    outcome_summary         TEXT,  -- LLM-generated summary
    success_metrics         TEXT,
    patient_feedback        TEXT,

    -- Full Case Study Narrative (AI-Generated)
    full_narrative          TEXT,  -- Complete LLM-generated case study

    -- Metadata
    generation_prompt       TEXT,  -- Prompt used for LLM
    generation_model        VARCHAR(100),  -- e.g., "claude-sonnet-4"

    -- Timeline
    treatment_start_date    DATE,
    treatment_end_date      DATE,

    -- Status
    status                  VARCHAR(20) DEFAULT 'draft',
    -- ENUM: 'draft', 'finalized', 'archived'

    -- Export/Presentation
    is_exported             BOOLEAN DEFAULT FALSE,
    exported_format         VARCHAR(20),  -- 'pdf', 'docx', 'pptx'
    exported_at             TIMESTAMP,

    -- Audit Fields
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by              UUID,
    is_active               BOOLEAN DEFAULT TRUE,

    -- Constraints
    FOREIGN KEY (patient_mobile_number, patient_first_name)
        REFERENCES patients(mobile_number, first_name)
);

-- Indexes
CREATE INDEX idx_case_studies_patient ON case_studies(patient_mobile_number, patient_first_name);
CREATE INDEX idx_case_studies_doctor ON case_studies(doctor_id);
CREATE INDEX idx_case_studies_status ON case_studies(status);
CREATE INDEX idx_case_studies_created_at ON case_studies(created_at DESC);
```

---

## 🏗️ ARCHITECTURE DESIGN

### **Frontend - Page Structure**

**Route**: `/treatments` (or `/treatment-dashboard`)

**Layout**: Single Page with Split Panel (Progressive Disclosure)

```
┌─────────────────────────────────────────────────────────────┐
│  Treatment Dashboard                     [Admin/Doctor View]│
├─────────────────────────────────────────────────────────────┤
│  Filters: [Status ▼] [Date Range ▼] [Search Patient...]    │
├──────────────────┬──────────────────────────────────────────┤
│                  │                                          │
│  Patient List    │   Treatment Details Panel               │
│  (35%)           │   (65%)                                  │
│                  │                                          │
│  [Card View]     │   Tabs:                                  │
│                  │   ┌────────────────────────────────────┐ │
│  ┌─────────────┐ │   │ Timeline | Procedures | Case Study││
│  │ John Doe    │ │   └────────────────────────────────────┘ │
│  │ 9876543210  │ │                                          │
│  │ Last Visit: │ │   [Content based on selected tab]       │
│  │ Dec 15, 2025│ │                                          │
│  │ Status: 🟢  │ │                                          │
│  │ Active      │ │                                          │
│  └─────────────┘ │                                          │
│                  │                                          │
│  ┌─────────────┐ │                                          │
│  │ Jane Smith  │ │                                          │
│  │ ...         │ │                                          │
│  └─────────────┘ │                                          │
│                  │                                          │
└──────────────────┴──────────────────────────────────────────┘
```

### **Component Breakdown**

#### **1. TreatmentDashboard.tsx** (Main Container)
```typescript
interface TreatmentDashboardProps {
  // Role-based rendering
}

// State:
- selectedPatient: Patient | null
- activeTab: 'timeline' | 'procedures' | 'case-study'
- filters: { status, dateRange, searchQuery, doctorId }
```

#### **2. PatientListPanel.tsx** (Left Panel - 35%)
```typescript
// Features:
- Virtual scrolling (react-window) for performance
- Patient card with summary:
  * Name, Mobile, Age
  * Last consultation date
  * Primary doctor (admin view only)
  * Treatment status badge
  * Procedure summary (e.g., "2 pending, 3 completed")
  * Click to select → loads details panel
```

#### **3. TreatmentDetailsPanel.tsx** (Right Panel - 65%)
```typescript
// Tabs:
1. Timeline Tab (TreatmentTimeline.tsx)
2. Procedures Tab (ProcedureSchedule.tsx)
3. Case Study Tab (CaseStudyBuilder.tsx)
```

---

### **Tab 1: Treatment Timeline** (Default View)

**Component**: `TreatmentTimeline.tsx`

**Visual Design**: Vertical timeline with chronological events

```
Timeline View:
│
├─ Dec 1, 2025  Initial Consultation
│  └─ Dr. Smith | Chief Complaint: Toothache
│  └─ Diagnosis: Cavity on tooth #26
│
├─ Dec 3, 2025  Dental Observation
│  └─ Tooth #26: Cavity (Moderate severity)
│  └─ Treatment required ✓
│
├─ Dec 5, 2025  Procedure Scheduled
│  └─ Crown - Porcelain/Ceramic
│  └─ Status: Planned
│
├─ Dec 10, 2025 Procedure Completed
│  └─ Crown - Porcelain/Ceramic
│  └─ Status: Completed ✓
│
└─ Dec 15, 2025 Follow-up Appointment
   └─ Status: Scheduled
```

**Data Sources**:
- Appointments (sorted by date)
- Prescriptions (grouped by visit_date)
- Dental Observations (linked to prescriptions)
- Dental Procedures (status progression)

---

### **Tab 2: Procedures Schedule**

**Component**: `ProcedureSchedule.tsx`

**Layout**: Status-grouped procedure cards

```
┌─────────────────────────────────────────────────┐
│  Upcoming (2)                                   │
├─────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────┐  │
│  │ Crown - Porcelain/Ceramic                │  │
│  │ Tooth: #26 | Date: Dec 20, 2025         │  │
│  │ Cost: $800 | Duration: 60 mins          │  │
│  │ Status: Planned                          │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  Completed (3)                                  │
│  [Collapsed by default - click to expand]      │
│                                                 │
│  Cancelled (0)                                  │
└─────────────────────────────────────────────────┘
```

---

### **Tab 3: Case Study Builder** ⭐ KEY FEATURE

**Component**: `CaseStudyBuilder.tsx`

**Flow**:
```
1. Check if case study exists for this patient
2. If NO → Show "Generate Case Study" button
3. If YES → Show generated case study with edit options
```

**UI - No Case Study**:
```
┌──────────────────────────────────────────────────┐
│  No case study generated for this patient        │
│                                                   │
│  ┌────────────────────────────────────────────┐  │
│  │  Generate AI Case Study                    │  │
│  │                                             │  │
│  │  This will create a presentation-ready     │  │
│  │  case study using:                         │  │
│  │  • Treatment timeline                      │  │
│  │  • Procedures performed                    │  │
│  │  • Observations and diagnoses              │  │
│  │  • Treatment outcomes                      │  │
│  │                                             │  │
│  │  [Generate Case Study]                     │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

**UI - Generated Case Study**:
```
┌──────────────────────────────────────────────────┐
│  Case Study: CS20251219001                       │
│  Generated: Dec 19, 2025 | Status: Draft         │
│  [Regenerate] [Export PDF] [Finalize]            │
├──────────────────────────────────────────────────┤
│                                                   │
│  Title: Complex Crown Restoration - Tooth #26    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                   │
│  PRE-TREATMENT ASSESSMENT                         │
│  [AI-generated summary]                          │
│  Patient presented with persistent pain in       │
│  the upper right quadrant. Clinical examination  │
│  revealed a moderate cavity on tooth #26...      │
│                                                   │
│  TREATMENT SUMMARY                                │
│  [AI-generated narrative]                        │
│  Treatment plan consisted of crown restoration   │
│  using porcelain/ceramic material. The procedure │
│  was performed on December 10, 2025...           │
│                                                   │
│  OUTCOME                                          │
│  [AI-generated summary]                          │
│  Patient reported complete resolution of pain    │
│  following the procedure. Follow-up examination  │
│  showed successful integration...                │
│                                                   │
│  FULL NARRATIVE                                   │
│  [Complete AI-generated case study]              │
│  [Expandable section with full details]          │
│                                                   │
└──────────────────────────────────────────────────┘
```

---

## 🔌 BACKEND API DESIGN

### **New Endpoints Required**

#### **1. Get Treatment Dashboard Data**
```
GET /api/v1/treatments/patients
```

**Query Parameters**:
- `doctor_id` (optional, admin only) - Filter by specific doctor
- `status` (optional) - Filter by treatment status
- `date_from` (optional) - Start date filter
- `date_to` (optional) - End date filter
- `search` (optional) - Search by patient name/mobile
- `page` (default: 1)
- `per_page` (default: 20)

**Response**:
```json
{
  "patients": [
    {
      "patient": {
        "mobile_number": "9876543210",
        "first_name": "John",
        "last_name": "Doe",
        "uuid": "uuid",
        "age": 35,
        "gender": "Male"
      },
      "summary": {
        "last_consultation_date": "2025-12-15",
        "primary_doctor": {
          "id": "uuid",
          "name": "Dr. Smith",
          "specialization": "Dentist"
        },
        "total_appointments": 5,
        "completed_appointments": 3,
        "pending_procedures": 2,
        "completed_procedures": 3,
        "active_prescriptions": 1,
        "treatment_status": "active"  // active, completed, planned
      }
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "per_page": 20,
    "pages": 8
  }
}
```

#### **2. Get Patient Treatment Timeline**
```
GET /api/v1/treatments/patients/{mobile}/{first_name}/timeline
```

**Response**:
```json
{
  "timeline": [
    {
      "date": "2025-12-01",
      "type": "appointment",  // appointment, prescription, observation, procedure
      "event": {
        "id": "uuid",
        "title": "Initial Consultation",
        "doctor": "Dr. Smith",
        "description": "Chief Complaint: Toothache",
        "status": "completed"
      }
    },
    {
      "date": "2025-12-03",
      "type": "observation",
      "event": {
        "id": "uuid",
        "title": "Dental Observation - Tooth #26",
        "condition": "Cavity",
        "severity": "Moderate",
        "treatment_required": true
      }
    }
  ]
}
```

#### **3. Generate Case Study (LLM)**
```
POST /api/v1/treatments/case-studies/generate
```

**Request Body**:
```json
{
  "patient_mobile_number": "9876543210",
  "patient_first_name": "John",
  "doctor_id": "uuid",
  "title": "Complex Crown Restoration - Tooth #26" (optional),
  "include_procedures": ["uuid1", "uuid2"],  (optional - default: all)
  "include_appointments": ["uuid1", "uuid2"],  (optional - default: all)
  "treatment_start_date": "2025-12-01",  (optional)
  "treatment_end_date": "2025-12-15"  (optional)
}
```

**Response**:
```json
{
  "case_study": {
    "id": "uuid",
    "case_study_number": "CS20251219001",
    "patient_mobile_number": "9876543210",
    "patient_first_name": "John",
    "doctor_id": "uuid",
    "title": "Complex Crown Restoration - Tooth #26",
    "chief_complaint": "Persistent pain in upper right quadrant",
    "pre_treatment_summary": "[AI-generated]",
    "treatment_summary": "[AI-generated]",
    "outcome_summary": "[AI-generated]",
    "full_narrative": "[AI-generated complete case study]",
    "status": "draft",
    "created_at": "2025-12-19T10:00:00Z"
  }
}
```

#### **4. Get Case Study**
```
GET /api/v1/treatments/case-studies/{case_study_id}
```

#### **5. Update Case Study**
```
PUT /api/v1/treatments/case-studies/{case_study_id}
```

**Request Body**: Same as case study object (allow editing AI-generated content)

#### **6. Regenerate Case Study**
```
POST /api/v1/treatments/case-studies/{case_study_id}/regenerate
```

#### **7. Export Case Study**
```
GET /api/v1/treatments/case-studies/{case_study_id}/export?format=pdf
```

**Query Parameters**:
- `format`: pdf (Phase 1), docx (Phase 2), pptx (Phase 2)

---

## 🤖 LLM INTEGRATION DESIGN

### **LLM Provider**: Claude API (Anthropic)

**Why Claude?**
- Already using Claude Code (you're familiar)
- Excellent medical/clinical writing
- Structured output support
- Strong context handling

### **Prompt Engineering Strategy**

**System Prompt**:
```
You are a medical case study writer specializing in dental treatments.
Your task is to create professional, presentation-ready case studies
from patient treatment data.

Requirements:
- Use clinical terminology appropriately
- Structure: Pre-treatment → Treatment → Outcome
- Be concise but comprehensive
- Focus on clinical significance
- Use past tense for completed treatments
- Maintain patient privacy (use initials or anonymized names)
```

**User Prompt Template**:
```
Create a case study for the following patient treatment:

PATIENT INFORMATION:
- Age: {age}
- Gender: {gender}
- Chief Complaint: {chief_complaint}

PRE-TREATMENT ASSESSMENT:
{initial_diagnosis}
{observations_summary}

TREATMENT PERFORMED:
{procedures_list}
Dates: {treatment_start_date} to {treatment_end_date}

CLINICAL NOTES:
{doctor_notes}

Generate a professional case study with these sections:
1. Pre-Treatment Assessment (2-3 paragraphs)
2. Treatment Summary (2-3 paragraphs)
3. Outcome (1-2 paragraphs)
4. Full Narrative (complete case study, 500-800 words)

Format as JSON with keys: pre_treatment_summary, treatment_summary, outcome_summary, full_narrative
```

### **Implementation**:

**Backend Service**: `case_study_service.py`

```python
async def generate_case_study(
    db: Session,
    patient_mobile: str,
    patient_first_name: str,
    doctor_id: str,
    options: CaseStudyGenerationOptions
) -> CaseStudy:
    # 1. Fetch patient data
    patient = get_patient(db, patient_mobile, patient_first_name)

    # 2. Fetch treatment data
    appointments = get_patient_appointments(db, patient, options.date_range)
    prescriptions = get_patient_prescriptions(db, patient, options.date_range)
    observations = get_dental_observations(db, patient, options.date_range)
    procedures = get_dental_procedures(db, patient, options.date_range)

    # 3. Build prompt
    prompt = build_case_study_prompt(
        patient, appointments, prescriptions,
        observations, procedures
    )

    # 4. Call LLM
    llm_response = await call_claude_api(prompt)

    # 5. Parse response
    case_study_content = parse_llm_response(llm_response)

    # 6. Save to database
    case_study = create_case_study(
        db, patient, doctor_id, case_study_content
    )

    return case_study
```

**LLM Client**: `llm_client.py`

```python
import anthropic

async def call_claude_api(prompt: str) -> str:
    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    message = client.messages.create(
        model="claude-sonnet-4-20250514",  # Latest model
        max_tokens=2000,
        temperature=0.7,
        system=CASE_STUDY_SYSTEM_PROMPT,
        messages=[
            {"role": "user", "content": prompt}
        ]
    )

    return message.content[0].text
```

---

## 📁 FILE STRUCTURE

### **Backend**

```
backend/
├── app/
│   ├── api/v1/endpoints/
│   │   └── treatments.py  ⭐ NEW
│   ├── models/
│   │   └── case_study.py  ⭐ NEW
│   ├── schemas/
│   │   └── case_study.py  ⭐ NEW
│   ├── services/
│   │   ├── treatment_service.py  ⭐ NEW
│   │   ├── case_study_service.py  ⭐ NEW
│   │   └── llm_client.py  ⭐ NEW
│   └── core/
│       └── config.py  (add ANTHROPIC_API_KEY)
```

### **Frontend**

```
frontend/src/
├── pages/
│   └── treatments/
│       └── TreatmentDashboard.tsx  ⭐ NEW
├── components/
│   └── treatments/
│       ├── PatientListPanel.tsx  ⭐ NEW
│       ├── TreatmentDetailsPanel.tsx  ⭐ NEW
│       ├── TreatmentTimeline.tsx  ⭐ NEW
│       ├── ProcedureSchedule.tsx  ⭐ NEW
│       └── CaseStudyBuilder.tsx  ⭐ NEW
├── services/
│   └── treatmentService.ts  ⭐ NEW
└── store/
    └── api.ts  (add treatment endpoints)
```

---

## 🔐 SECURITY & PERMISSIONS

### **Authorization Rules**

**Doctor Role**:
- ✅ View only THEIR consulted patients
- ✅ Generate case studies for THEIR patients only
- ✅ Edit/delete THEIR case studies only
- ❌ Cannot view other doctors' patients
- ❌ Cannot view other doctors' case studies

**Admin Role**:
- ✅ View ALL patients across all doctors
- ✅ Filter by specific doctor
- ✅ View all case studies (read-only)
- ❌ Cannot generate/edit case studies (doctor-only action)

**Implementation**:
```python
# Middleware: Check doctor ownership
def verify_doctor_patient_access(
    current_user: User,
    patient_mobile: str,
    patient_first_name: str
) -> bool:
    if current_user.role == "admin":
        return True  # Admin can view all

    if current_user.role == "doctor":
        # Check if doctor has consulted this patient
        has_appointments = db.query(Appointment).filter(
            Appointment.doctor_id == current_user.doctor_id,
            Appointment.patient_mobile_number == patient_mobile,
            Appointment.patient_first_name == patient_first_name
        ).first()

        return has_appointments is not None

    return False
```

---

## 📝 IMPLEMENTATION CHECKLIST

### **Phase 1 - MVP (Week 1-2)**

**Backend Tasks**:
- [ ] Create `case_studies` table migration
- [ ] Create `CaseStudy` model (`models/case_study.py`)
- [ ] Create `CaseStudy` schemas (`schemas/case_study.py`)
- [ ] Implement `treatment_service.py`:
  - [ ] `get_patients_with_treatment_summary()`
  - [ ] `get_patient_treatment_timeline()`
- [ ] Implement `case_study_service.py`:
  - [ ] `generate_case_study()`
  - [ ] `get_case_study()`
  - [ ] `update_case_study()`
  - [ ] `regenerate_case_study()`
- [ ] Implement `llm_client.py`:
  - [ ] Claude API integration
  - [ ] Prompt templates
  - [ ] Response parsing
- [ ] Create API endpoints (`endpoints/treatments.py`):
  - [ ] `GET /treatments/patients`
  - [ ] `GET /treatments/patients/{mobile}/{first_name}/timeline`
  - [ ] `POST /treatments/case-studies/generate`
  - [ ] `GET /treatments/case-studies/{id}`
  - [ ] `PUT /treatments/case-studies/{id}`
  - [ ] `POST /treatments/case-studies/{id}/regenerate`
- [ ] Add authorization middleware
- [ ] Add ANTHROPIC_API_KEY to config
- [ ] Write unit tests

**Frontend Tasks**:
- [ ] Create route `/treatments` in router
- [ ] Create `TreatmentDashboard.tsx` (main container)
- [ ] Create `PatientListPanel.tsx`:
  - [ ] Patient card component
  - [ ] Virtual scrolling
  - [ ] Filters (status, date range, search)
  - [ ] Role-based rendering (admin vs doctor)
- [ ] Create `TreatmentDetailsPanel.tsx`:
  - [ ] Tab navigation
  - [ ] Empty state
- [ ] Create `TreatmentTimeline.tsx`:
  - [ ] Timeline component
  - [ ] Event cards
  - [ ] Date grouping
- [ ] Create `ProcedureSchedule.tsx`:
  - [ ] Status-grouped procedure cards
  - [ ] Upcoming/Completed/Cancelled sections
- [ ] Create `CaseStudyBuilder.tsx`:
  - [ ] "Generate Case Study" button
  - [ ] Loading state (LLM generation)
  - [ ] Generated case study display
  - [ ] Edit functionality
  - [ ] Regenerate button
- [ ] Create `treatmentService.ts` (API calls)
- [ ] Add treatment API endpoints to Redux Toolkit Query
- [ ] Add navigation menu item
- [ ] Responsive design (tablet/mobile)
- [ ] Loading states
- [ ] Error handling

**Testing Tasks**:
- [ ] Backend API testing (Postman/pytest)
- [ ] Frontend component testing
- [ ] Integration testing
- [ ] LLM prompt testing (validate output quality)
- [ ] Role-based access testing
- [ ] Performance testing (timeline with 50+ events)

---

## 🚀 DEPLOYMENT CONSIDERATIONS

### **Environment Variables**
```env
# .env
ANTHROPIC_API_KEY=sk-ant-xxxxx
CASE_STUDY_MODEL=claude-sonnet-4-20250514
CASE_STUDY_MAX_TOKENS=2000
CASE_STUDY_TEMPERATURE=0.7
```

### **Cost Estimation (LLM)**
- Claude Sonnet 4: ~$3 per 1M input tokens, ~$15 per 1M output tokens
- Average case study: ~2000 input tokens, ~1000 output tokens
- Cost per case study: ~$0.02
- Estimated 100 case studies/month: ~$2/month

### **Performance Optimization**
- Timeline pagination (load 20 events at a time)
- Patient list virtual scrolling
- Lazy load treatment details panel
- Cache case studies (avoid regenerating)

---

## 📈 FUTURE ENHANCEMENTS (Post-MVP)

### **Phase 2 Features**:
- [ ] Photo integration (before/after comparisons)
- [ ] PDF export with custom branding
- [ ] Case study templates (multiple formats)
- [ ] Collaborative case studies (multiple doctors)
- [ ] Analytics dashboard (treatment outcomes)

### **Phase 3 Features**:
- [ ] PowerPoint export for presentations
- [ ] Patient consent for case study usage
- [ ] Anonymous case study sharing (for education)
- [ ] Treatment success metrics tracking
- [ ] Automated follow-up reminders

---

## ❓ OPEN QUESTIONS & DECISIONS NEEDED

1. **Case Study Number Format**:
   - Option A: `CS{YYYYMMDD}{sequence}` → `CS20251219001`
   - Option B: `CS{doctor_id_short}{YYYYMMDD}{seq}` → `CS1234-20251219-001`
   - **Recommendation**: Option A (simpler)

2. **LLM Generation Timeout**:
   - Claude API can take 10-30 seconds
   - Show progress indicator or async job?
   - **Recommendation**: Progress indicator with 60s timeout

3. **Case Study Editing**:
   - Allow full edit of AI-generated text?
   - Track manual edits vs AI-generated?
   - **Recommendation**: Allow edits, add `is_manually_edited` flag

4. **Multiple Case Studies per Patient**:
   - Allow multiple case studies for same patient?
   - **Recommendation**: Yes, one per treatment episode

5. **Case Study Deletion**:
   - Soft delete or hard delete?
   - **Recommendation**: Soft delete (is_active=false)

---

## 🎨 UI/UX MOCKUP NOTES

**Color Scheme**:
- Active treatment: Green badge (#4CAF50)
- Pending procedures: Orange badge (#FF9800)
- Completed: Blue badge (#2196F3)
- Timeline events: Gray timeline with color-coded markers

**Responsive Breakpoints**:
- Desktop (>1200px): Split panel (35%/65%)
- Tablet (768-1200px): Split panel (40%/60%)
- Mobile (<768px): Stack vertically, hide panel until patient selected

**Loading States**:
- Skeleton loaders for patient list
- Spinner for timeline loading
- Progress bar for case study generation

---

## 📚 DEPENDENCIES TO ADD

### **Backend**:
```python
# requirements.txt
anthropic==0.18.1  # Claude API client
```

### **Frontend**:
```json
// package.json
{
  "react-window": "^1.8.10",  // Virtual scrolling
  "react-markdown": "^9.0.0"  // Display LLM-generated markdown
}
```

---

## ✅ DEFINITION OF DONE

**Feature is complete when**:
1. ✅ Doctor can view their consulted patients
2. ✅ Admin can view all patients with doctor filter
3. ✅ Treatment timeline displays chronologically
4. ✅ Procedure schedule shows status-grouped procedures
5. ✅ Case study can be generated via LLM
6. ✅ Generated case study can be viewed and edited
7. ✅ Case study can be regenerated
8. ✅ Authorization rules enforced (doctor-only access)
9. ✅ All API endpoints tested
10. ✅ UI responsive on desktop/tablet/mobile
11. ✅ Error handling implemented
12. ✅ Code reviewed and merged to development

---

## 📝 REVIEW NOTES

**Strengths of This Design**:
✅ Leverages existing data (no major schema changes except case_studies table)
✅ Progressive disclosure keeps UI simple
✅ LLM integration adds unique value
✅ Role-based access properly implemented
✅ Scalable architecture (can add photos, PDF export later)

**Potential Risks**:
⚠️ LLM API costs (mitigated by caching)
⚠️ LLM generation latency (mitigated by progress indicator)
⚠️ Timeline performance with 100+ events (mitigated by pagination)

**Next Steps**:
1. Get approval on this plan
2. Create Alembic migration for `case_studies` table
3. Start backend implementation (services → endpoints → tests)
4. Start frontend implementation (components → pages → integration)
5. Test with real data
6. Deploy to development

---

**End of Plan**
