# Case Study Feature - AI-Powered Clinical Documentation

**Created**: December 20, 2025
**Feature**: File uploads + AI case study generation for dental observations and procedures
**User Requirements**: Upload files during observation/procedure, generate comprehensive case studies with GPT-5-nano
**Status**: ⏳ Planning Phase

---

## 🎯 OBJECTIVE

Create a comprehensive case study system with:
1. **File Upload** during dental observations (consultation page)
2. **File Upload** after procedures (treatment dashboard)
3. **AI-Powered Case Study Generation** using GPT-5-nano
4. **PDF Export** with before/after photos, X-rays, test results, treatment timeline

---

## 📋 USER REQUIREMENTS SUMMARY

### Storage & Files
- **Cloud Storage**: Cloudflare R2 or Google Cloud Storage (cost-effective)
- **File Types**: JPG, PNG, PDF, DICOM (X-rays)
- **Max Files**: 5 files per observation/procedure
- **Max Size**: 10MB per file (already configured in config.py)

### AI Model
- **Model**: GPT-5-nano (OpenAI)
- **Cost**: Input $0.05, Cache $0.005, Output $0.40
- **API Key**: User will provide

### UI Locations
1. **Observation Upload**: DentalConsultation page (during observation entry)
2. **Procedure Upload**: Treatment Dashboard > Case Study tab
3. **Case Study Generation**: Treatment Dashboard > Case Study tab

### Design Constraints
- ✅ No dropdowns (use buttons for filters)
- ✅ iPad-friendly (44px min touch targets)
- ✅ Responsive design (mobile/tablet/desktop)
- ✅ Use existing Toast notifications
- ✅ Follow existing API patterns

---

## 🗄️ DATABASE SCHEMA CHANGES

### New Table 1: dental_attachments
```sql
CREATE TABLE dental_attachments (
    -- Primary Key
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Foreign Keys (one of these must be set)
    observation_id          UUID REFERENCES dental_observations(id) ON DELETE CASCADE,
    procedure_id            UUID REFERENCES dental_procedures(id) ON DELETE CASCADE,
    case_study_id           UUID REFERENCES case_studies(id) ON DELETE CASCADE,

    -- Patient Reference (for easier queries)
    patient_mobile_number   VARCHAR(20) NOT NULL,
    patient_first_name      VARCHAR(100) NOT NULL,

    -- File Information
    file_type               VARCHAR(20) NOT NULL,
    -- ENUM: 'xray', 'photo_before', 'photo_after', 'test_result', 'document', 'other'
    file_name               VARCHAR(255) NOT NULL,
    file_path               TEXT NOT NULL,              -- Cloud storage URL or path
    file_size               INTEGER NOT NULL,           -- Size in bytes
    mime_type               VARCHAR(100) NOT NULL,      -- 'image/jpeg', 'application/pdf', etc.

    -- Metadata
    caption                 TEXT,                       -- Optional description
    taken_date              TIMESTAMP,                  -- When photo/xray was taken

    -- Audit Fields
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_by             UUID REFERENCES users(id),
    is_active               BOOLEAN DEFAULT TRUE,

    -- Constraints
    CONSTRAINT dental_attachments_ref_check
        CHECK (
            (observation_id IS NOT NULL AND procedure_id IS NULL AND case_study_id IS NULL) OR
            (observation_id IS NULL AND procedure_id IS NOT NULL AND case_study_id IS NULL) OR
            (observation_id IS NULL AND procedure_id IS NULL AND case_study_id IS NOT NULL)
        ),

    -- Foreign Key for patient composite key
    FOREIGN KEY (patient_mobile_number, patient_first_name)
        REFERENCES patients(mobile_number, first_name)
);

-- Indexes
CREATE INDEX idx_dental_attach_observation ON dental_attachments(observation_id);
CREATE INDEX idx_dental_attach_procedure ON dental_attachments(procedure_id);
CREATE INDEX idx_dental_attach_case_study ON dental_attachments(case_study_id);
CREATE INDEX idx_dental_attach_patient ON dental_attachments(patient_mobile_number, patient_first_name);
CREATE INDEX idx_dental_attach_file_type ON dental_attachments(file_type);
CREATE INDEX idx_dental_attach_created ON dental_attachments(created_at);
CREATE INDEX idx_dental_attach_active ON dental_attachments(is_active);
```

### New Table 2: case_studies
```sql
CREATE TABLE case_studies (
    -- Primary Key
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Patient Reference
    patient_mobile_number   VARCHAR(20) NOT NULL,
    patient_first_name      VARCHAR(100) NOT NULL,

    -- Case Study Details
    title                   VARCHAR(255) NOT NULL,
    chief_complaint         TEXT,                       -- Primary reason for treatment
    diagnosis               TEXT,                       -- Clinical diagnosis

    -- Data References (comma-separated UUIDs)
    observation_ids         TEXT,                       -- "uuid1,uuid2,uuid3"
    procedure_ids           TEXT,                       -- "uuid1,uuid2,uuid3"

    -- AI-Generated Content
    ai_summary              TEXT,                       -- GPT-generated summary
    treatment_plan          TEXT,                       -- GPT-generated plan
    outcome_assessment      TEXT,                       -- GPT-generated outcome
    learning_points         TEXT,                       -- GPT-generated key learnings

    -- Metadata
    ai_model_used           VARCHAR(50),                -- 'gpt-5-nano', etc.
    ai_generation_cost      DECIMAL(10,4),              -- Cost in USD
    generation_timestamp    TIMESTAMP,

    -- Status
    status                  VARCHAR(20) DEFAULT 'draft' NOT NULL,
    -- ENUM: 'draft', 'reviewed', 'published', 'archived'

    -- Export/Sharing
    pdf_path                TEXT,                       -- Generated PDF path
    is_anonymized           BOOLEAN DEFAULT FALSE,      -- PHI removed for sharing
    share_token             VARCHAR(100),               -- Unique token for sharing

    -- Audit Fields
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by              UUID REFERENCES users(id),
    reviewed_by             UUID REFERENCES users(id),
    is_active               BOOLEAN DEFAULT TRUE,

    -- Foreign Key for patient composite key
    FOREIGN KEY (patient_mobile_number, patient_first_name)
        REFERENCES patients(mobile_number, first_name)
);

-- Indexes
CREATE INDEX idx_case_study_patient ON case_studies(patient_mobile_number, patient_first_name);
CREATE INDEX idx_case_study_status ON case_studies(status);
CREATE INDEX idx_case_study_created_by ON case_studies(created_by);
CREATE INDEX idx_case_study_created_at ON case_studies(created_at);
CREATE INDEX idx_case_study_active ON case_studies(is_active);
```

---

## 🔧 BACKEND IMPLEMENTATION

### Phase 1: Database Migration
**File**: `backend/alembic/versions/XXX_add_case_study_tables.py`

- [ ] Create `dental_attachments` table with all columns and indexes
- [ ] Create `case_studies` table with all columns and indexes
- [ ] Add foreign key constraints
- [ ] Add check constraints for dental_attachments reference validation
- [ ] Test migration up/down

### Phase 2: Models
**File**: `backend/app/models/dental.py` (extend existing file)

- [ ] Add `DentalAttachment` model class
  - Relationships: `observation`, `procedure`, `case_study`, `patient`, `uploader`
  - Validation: file_type enum, file_size limits
- [ ] Add `CaseStudy` model class
  - Relationships: `patient`, `creator`, `reviewer`, `attachments`
  - Validation: status enum
- [ ] Update `DentalObservation` model: add `attachments` relationship
- [ ] Update `DentalProcedure` model: add `attachments` relationship

### Phase 3: Schemas
**File**: `backend/app/schemas/dental_attachments.py` (NEW)

- [ ] `DentalAttachmentCreate` schema (for upload)
- [ ] `DentalAttachmentUpdate` schema
- [ ] `DentalAttachmentResponse` schema (includes URL)
- [ ] `DentalAttachmentListResponse` schema
- [ ] File type enum validation

**File**: `backend/app/schemas/case_study.py` (NEW)

- [ ] `CaseStudyCreate` schema
- [ ] `CaseStudyUpdate` schema
- [ ] `CaseStudyResponse` schema (full details)
- [ ] `CaseStudyListResponse` schema (summary)
- [ ] `CaseStudyGenerateRequest` schema (AI generation params)
- [ ] Status enum validation

### Phase 4: Cloud Storage Service
**File**: `backend/app/services/cloud_storage_service.py` (NEW)

- [ ] Abstract base class `CloudStorageService`
- [ ] Cloudflare R2 implementation `CloudflareR2Service`
  - `upload_file(file, path)` → returns URL
  - `delete_file(path)` → void
  - `get_signed_url(path, expires)` → temporary URL
- [ ] Google Cloud Storage implementation `GCSService`
  - Same methods as R2
- [ ] Configuration from environment variables
- [ ] Automatic bucket creation/validation
- [ ] Error handling and retries

**Config Updates**:
```python
# backend/app/core/config.py additions
CLOUD_STORAGE_PROVIDER: str = "cloudflare"  # or "gcs"
CLOUDFLARE_R2_ACCESS_KEY: str
CLOUDFLARE_R2_SECRET_KEY: str
CLOUDFLARE_R2_BUCKET: str
CLOUDFLARE_R2_ENDPOINT: str
GCS_PROJECT_ID: str
GCS_BUCKET: str
GCS_CREDENTIALS_PATH: str
ALLOWED_FILE_TYPES: List[str] = ["pdf", "jpg", "jpeg", "png", "dcm", "dicom"]
```

### Phase 5: File Upload Service
**File**: `backend/app/services/attachment_service.py` (NEW)

- [ ] `upload_attachment(file, observation_id/procedure_id, file_type, uploaded_by)`
  - Validate file type and size
  - Upload to cloud storage
  - Create database record
  - Return attachment response
- [ ] `get_attachments(observation_id/procedure_id)` → list
- [ ] `delete_attachment(attachment_id, user_id)`
  - Delete from cloud storage
  - Soft delete in database
- [ ] `get_patient_attachments(mobile, first_name, file_type_filter)`

### Phase 6: AI Case Study Service
**File**: `backend/app/services/ai_case_study_service.py` (NEW)

- [ ] OpenAI GPT-5-nano integration
- [ ] `generate_case_study(patient, observation_ids, procedure_ids, user_preferences)`
  - Fetch all observations, procedures, attachments
  - Build comprehensive prompt with:
    - Patient demographics
    - Chief complaint
    - Pre-treatment observations (symptoms, X-rays)
    - Procedures performed
    - Post-treatment observations
    - Before/after photos
  - Call GPT-5-nano API
  - Parse structured response (summary, plan, outcome, learnings)
  - Calculate cost
  - Store in database
- [ ] `regenerate_section(case_study_id, section_name)`
- [ ] Prompt templates for different case types
- [ ] Cost tracking and limits

**Config Updates**:
```python
# backend/app/core/config.py additions
OPENAI_API_KEY: str
OPENAI_MODEL: str = "gpt-5-nano"
AI_MAX_COST_PER_CASE_STUDY: float = 1.0  # USD
AI_PROMPT_TEMPLATE_DIR: str = "./templates/ai_prompts"
```

### Phase 7: PDF Generation Service
**File**: `backend/app/services/case_study_pdf_service.py` (NEW)

- [ ] PDF template using ReportLab or WeasyPrint
- [ ] `generate_case_study_pdf(case_study_id)`
  - Header: Clinic branding, doctor details
  - Patient info section
  - Chief complaint & diagnosis
  - Pre-treatment section: observations, X-rays, symptoms
  - Treatment section: procedures timeline, photos
  - Post-treatment section: outcomes, after photos
  - AI-generated summary and learnings
  - Footer: Disclaimer, generation timestamp
- [ ] Before/after photo comparison layout
- [ ] Upload PDF to cloud storage
- [ ] Return PDF URL

### Phase 8: API Endpoints
**File**: `backend/app/api/v1/endpoints/dental_attachments.py` (NEW)

```python
# File Upload Endpoints
POST   /api/v1/dental/observations/{observation_id}/attachments
  - Upload file for observation
  - Request: multipart/form-data with file + file_type
  - Response: DentalAttachmentResponse

POST   /api/v1/dental/procedures/{procedure_id}/attachments
  - Upload file for procedure
  - Request: multipart/form-data with file + file_type
  - Response: DentalAttachmentResponse

GET    /api/v1/dental/observations/{observation_id}/attachments
  - List attachments for observation
  - Response: DentalAttachmentListResponse

GET    /api/v1/dental/procedures/{procedure_id}/attachments
  - List attachments for procedure
  - Response: DentalAttachmentListResponse

DELETE /api/v1/dental/attachments/{attachment_id}
  - Delete attachment (soft delete)
  - Response: success message

GET    /api/v1/dental/patients/{mobile}/{first_name}/attachments
  - Get all attachments for patient
  - Query params: file_type (optional filter)
  - Response: DentalAttachmentListResponse
```

**File**: `backend/app/api/v1/endpoints/case_studies.py` (NEW)

```python
# Case Study Endpoints
POST   /api/v1/case-studies/generate
  - Generate AI case study
  - Body: { patient_mobile, patient_first_name, observation_ids[], procedure_ids[], title, chief_complaint }
  - Response: CaseStudyResponse (with AI-generated content)

GET    /api/v1/case-studies/{case_study_id}
  - Get case study details
  - Response: CaseStudyResponse (includes attachments)

PUT    /api/v1/case-studies/{case_study_id}
  - Update case study (edit AI content, change status)
  - Body: CaseStudyUpdate
  - Response: CaseStudyResponse

DELETE /api/v1/case-studies/{case_study_id}
  - Soft delete case study
  - Response: success message

POST   /api/v1/case-studies/{case_study_id}/regenerate/{section}
  - Regenerate specific section (summary/plan/outcome/learnings)
  - Response: Updated CaseStudyResponse

POST   /api/v1/case-studies/{case_study_id}/export-pdf
  - Generate PDF and return download URL
  - Response: { pdf_url, expires_at }

GET    /api/v1/case-studies/patient/{mobile}/{first_name}
  - List all case studies for patient
  - Query params: status, page, per_page
  - Response: CaseStudyListResponse
```

### Phase 9: Testing
**File**: `backend/tests/test_case_study_simple.py` (NEW)

- [ ] Test file upload (valid/invalid types, size limits)
- [ ] Test attachment CRUD operations
- [ ] Test AI case study generation (mock OpenAI)
- [ ] Test PDF generation
- [ ] Test patient attachment aggregation
- [ ] Test access control (doctor can only see their patients)

---

## 🎨 FRONTEND IMPLEMENTATION

### Phase 1: File Upload Component
**File**: `frontend/src/components/common/FileUpload.tsx` (NEW)

- [ ] Reusable file upload component
- [ ] Props:
  - `maxFiles: number` (default 5)
  - `acceptedTypes: string[]` (JPG, PNG, PDF, DICOM)
  - `maxSizeBytes: number` (10MB)
  - `fileType: 'xray' | 'photo_before' | 'photo_after' | 'test_result'`
  - `onUploadSuccess: (file) => void`
  - `onUploadError: (error) => void`
- [ ] Features:
  - Drag-and-drop area
  - File type/size validation
  - Upload progress indicator
  - Preview for images
  - Delete uploaded file
  - iPad-friendly (large touch targets)
- [ ] Uses existing Toast for errors
- [ ] Responsive design

### Phase 2: File Gallery Component
**File**: `frontend/src/components/common/FileGallery.tsx` (NEW)

- [ ] Display uploaded files as grid
- [ ] Image preview with lightbox
- [ ] PDF icon with download link
- [ ] DICOM icon with view option
- [ ] Delete button (with confirmation)
- [ ] Caption display/edit
- [ ] Filter by file type (buttons, not dropdown)
- [ ] iPad-friendly grid layout

### Phase 3: Update Observation Form (Add File Upload)
**File**: `frontend/src/components/dental/NewObservationForm.tsx` (UPDATE)

- [ ] Add `<FileUpload>` section below observation notes
- [ ] Label: "Attach X-rays, Photos, or Test Results (Optional)"
- [ ] File type filter buttons: All | X-rays | Photos | Documents
- [ ] Show uploaded files for current observation
- [ ] Associate uploaded files with observation on save
- [ ] Validation: Prevent save if file upload in progress

**File**: `frontend/src/components/dental/ObservationRow.tsx` (UPDATE)

- [ ] Add attachment icon/badge if observation has files
- [ ] Show attachment count
- [ ] Click to expand and view attachments

### Phase 4: Case Study Tab Component
**File**: `frontend/src/components/treatments/CaseStudyPanel.tsx` (NEW)

**Layout** (3 sections):

1. **Patient Summary Section** (Top - 20% height)
   - Patient name, age, gender, mobile
   - Total observations count
   - Total procedures count
   - Total attachments count

2. **Data Selection Section** (Middle - 30% height)
   - **Observations List** (with checkboxes):
     - Tooth number, condition, severity, date
     - Attachment count badge
     - Select all / Deselect all buttons
   - **Procedures List** (with checkboxes):
     - Procedure name, code, status, date
     - Attachment count badge
     - Select all / Deselect all buttons
   - **File Upload Area**:
     - Upload additional photos/documents for case study
     - Separate from observation/procedure attachments

3. **Case Study Generation Section** (Bottom - 50% height)
   - **Input Fields**:
     - Title (text field)
     - Chief Complaint (textarea)
   - **Generate Button** (prominent, iPad-friendly)
     - Shows loading spinner during generation
     - Displays estimated cost
   - **Generated Content Display**:
     - AI Summary (editable textarea)
     - Treatment Plan (editable textarea)
     - Outcome Assessment (editable textarea)
     - Key Learning Points (editable textarea)
     - Regenerate buttons for each section
   - **Actions**:
     - Save Draft button
     - Mark as Reviewed button
     - Export PDF button (opens PDF in new tab)
     - Delete button (with confirmation)

**Features**:
- [ ] Fetch patient observations and procedures
- [ ] Load existing case studies for patient
- [ ] Select observations/procedures for case study
- [ ] Show all attachments (grouped by observation/procedure)
- [ ] Generate AI case study (call backend API)
- [ ] Edit AI-generated content
- [ ] Save case study (draft/reviewed status)
- [ ] Export to PDF
- [ ] Delete case study
- [ ] iPad-optimized layout (collapsible sections)

### Phase 5: Update Treatment Details Panel
**File**: `frontend/src/components/treatments/TreatmentDetailsPanel.tsx` (UPDATE)

- [ ] Enable "Case Study" tab (remove `disabled` prop)
- [ ] Import and render `<CaseStudyPanel>` component
- [ ] Pass patient data as props

### Phase 6: API Service
**File**: `frontend/src/services/caseStudyService.ts` (NEW)

```typescript
interface AttachmentUpload {
  file: File;
  file_type: 'xray' | 'photo_before' | 'photo_after' | 'test_result';
  caption?: string;
}

interface CaseStudyGenerateRequest {
  patient_mobile_number: string;
  patient_first_name: string;
  observation_ids: string[];
  procedure_ids: string[];
  title: string;
  chief_complaint?: string;
}

// File Upload
uploadObservationAttachment(observationId: string, upload: AttachmentUpload)
uploadProcedureAttachment(procedureId: string, upload: AttachmentUpload)
getObservationAttachments(observationId: string)
getProcedureAttachments(procedureId: string)
getPatientAttachments(mobile: string, firstName: string, fileType?: string)
deleteAttachment(attachmentId: string)

// Case Study
generateCaseStudy(request: CaseStudyGenerateRequest)
getCaseStudy(caseStudyId: string)
updateCaseStudy(caseStudyId: string, updates: Partial<CaseStudy>)
deleteCaseStudy(caseStudyId: string)
regenerateSection(caseStudyId: string, section: string)
exportCaseStudyPDF(caseStudyId: string)
getPatientCaseStudies(mobile: string, firstName: string)
```

### Phase 7: State Management
**File**: `frontend/src/store/api.ts` (UPDATE)

- [ ] Add RTK Query endpoints for case study APIs
- [ ] Add RTK Query endpoints for attachment APIs
- [ ] Cache invalidation on upload/delete
- [ ] Optimistic updates for better UX

---

## 🧪 TESTING CHECKLIST

### Backend Tests
- [ ] File upload validation (type, size)
- [ ] Cloud storage upload/delete
- [ ] Attachment CRUD operations
- [ ] AI case study generation (mocked)
- [ ] PDF generation
- [ ] Access control (doctor permissions)
- [ ] Database constraints (foreign keys, check constraints)

### Frontend Tests
- [ ] File upload component (drag-drop, validation)
- [ ] File gallery display
- [ ] Observation form with attachments
- [ ] Case study generation flow
- [ ] PDF export
- [ ] Responsive design (mobile/tablet/desktop)
- [ ] iPad touch targets (44px minimum)

### Integration Tests
- [ ] Upload file during observation → Save observation → View attachments
- [ ] Upload file for procedure → Generate case study → PDF includes photo
- [ ] Before/after photo comparison in PDF
- [ ] AI case study with all data sources

### User Acceptance Testing
- [ ] Doctor creates observation with X-ray upload
- [ ] Doctor adds procedure with before photo
- [ ] Doctor completes procedure, uploads after photo
- [ ] Doctor generates case study with all data
- [ ] Doctor exports PDF, verifies content
- [ ] Admin views patient case studies

---

## 📊 ESTIMATED EFFORT

### Backend Development
- Database migration: 2 hours
- Models & schemas: 3 hours
- Cloud storage service: 4 hours
- Attachment service: 3 hours
- AI case study service: 6 hours
- PDF generation service: 4 hours
- API endpoints: 4 hours
- Testing: 4 hours
**Subtotal: 30 hours**

### Frontend Development
- File upload component: 4 hours
- File gallery component: 3 hours
- Update observation form: 2 hours
- Case study panel: 8 hours
- Update treatment panel: 1 hour
- API service: 2 hours
- State management: 2 hours
- Testing: 3 hours
**Subtotal: 25 hours**

### Integration & Polish
- End-to-end testing: 4 hours
- iPad optimization: 2 hours
- Documentation: 2 hours
**Subtotal: 8 hours**

**TOTAL: 63 hours (~8-9 working days)**

---

## 🎯 IMPLEMENTATION PHASES

### Phase 1: File Upload Foundation (Days 1-2)
- Database migration
- Models & schemas
- Cloud storage service
- Basic attachment endpoints
- Frontend file upload component

### Phase 2: Observation/Procedure Integration (Days 3-4)
- Update observation form with file upload
- Procedure attachment upload
- File gallery component
- Test upload flow end-to-end

### Phase 3: AI Case Study Core (Days 5-6)
- AI case study service (GPT-5-nano)
- Case study endpoints
- Frontend case study panel (basic)
- Test AI generation

### Phase 4: PDF Export & Polish (Days 7-8)
- PDF generation service
- Case study panel complete UI
- Export functionality
- iPad optimization

### Phase 5: Testing & Documentation (Day 9)
- Comprehensive testing
- Bug fixes
- Documentation
- User acceptance testing

---

## 🔐 SECURITY CONSIDERATIONS

- [ ] Validate file types (magic bytes, not just extension)
- [ ] Scan uploaded files for malware
- [ ] Restrict file access to authorized users only
- [ ] Use signed URLs with expiration for downloads
- [ ] Anonymize PHI when exporting case studies
- [ ] Audit log all file uploads/downloads
- [ ] Rate limit AI API calls to prevent abuse
- [ ] Secure API key storage (environment variables)

---

## 🚀 DEPLOYMENT NOTES

### Environment Variables Required
```bash
# Cloud Storage (choose one)
CLOUD_STORAGE_PROVIDER=cloudflare  # or "gcs"

# Cloudflare R2
CLOUDFLARE_R2_ACCESS_KEY=xxx
CLOUDFLARE_R2_SECRET_KEY=xxx
CLOUDFLARE_R2_BUCKET=dental-case-studies
CLOUDFLARE_R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com

# OR Google Cloud Storage
GCS_PROJECT_ID=xxx
GCS_BUCKET=dental-case-studies
GCS_CREDENTIALS_PATH=/path/to/credentials.json

# OpenAI (provided by user)
OPENAI_API_KEY=sk-xxx
OPENAI_MODEL=gpt-5-nano

# File Upload Limits
MAX_FILE_SIZE=10485760  # 10MB
ALLOWED_FILE_TYPES=pdf,jpg,jpeg,png,dcm,dicom
```

### Dependencies to Install
**Backend**:
```bash
pip install openai boto3 google-cloud-storage reportlab weasyprint python-magic
```

**Frontend**:
```bash
npm install react-dropzone @mui/x-data-grid
```

---

## ✅ ACCEPTANCE CRITERIA

1. **File Upload**
   - [ ] Upload JPG/PNG/PDF/DICOM files during observation
   - [ ] Upload photos after procedure completion
   - [ ] Max 5 files per observation/procedure
   - [ ] 10MB file size limit enforced
   - [ ] Files stored in cloud storage
   - [ ] Preview images in gallery

2. **Case Study Generation**
   - [ ] Select observations and procedures
   - [ ] Generate AI summary using GPT-5-nano
   - [ ] Editable AI-generated content
   - [ ] Include before/after photo comparison
   - [ ] Display treatment timeline
   - [ ] Save draft or mark as reviewed

3. **PDF Export**
   - [ ] Generate PDF with all case study data
   - [ ] Include all photos and X-rays
   - [ ] Professional layout with branding
   - [ ] Download PDF link with expiration

4. **User Experience**
   - [ ] iPad-friendly design (44px buttons)
   - [ ] Responsive on all devices
   - [ ] Toast notifications for success/errors
   - [ ] No dropdowns (use button filters)
   - [ ] Fast loading (<3s for case study generation)

5. **Security & Permissions**
   - [ ] Only doctors can create case studies
   - [ ] Doctors see only their patients' data
   - [ ] Admins have full access
   - [ ] Secure file access with signed URLs
   - [ ] Audit logging for all actions

---

**Status**: ⏳ Awaiting User Approval
**Next Step**: User confirms plan → Begin Phase 1 implementation

---

**Questions for User Before Starting:**
1. Confirm cloud storage provider (Cloudflare R2 or Google Cloud Storage)?
2. Confirm you will provide OPENAI_API_KEY?
3. Any changes to the UI design or workflow?
4. Ready to proceed with Phase 1?
