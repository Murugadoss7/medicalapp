# Case Study Tab Implementation Plan - Phase 3
**Created**: December 21, 2025
**Status**: 📋 Ready for Implementation
**Prerequisites**: File upload system complete ✅

---

## 🎯 OVERVIEW

**Goal**: Enable Case Study tab in Treatment module for doctors to view:
1. Patient treatment summary
2. All uploaded attachments (X-rays, photos, test results)
3. Observations and procedures
4. Filter/organize files by type

**Future** (Phase 4): AI-powered case study generation with ChatGPT

---

## ✅ WHAT ALREADY EXISTS

### Backend
- ✅ `CaseStudy` model in `app/models/case_study.py`
- ✅ `DentalAttachment` model with `case_study_id` relationship
- ✅ Patient attachments endpoint: `GET /dental/patients/{mobile}/{first_name}/attachments`
- ✅ Treatment endpoints: `GET /treatments/patients/{mobile}/{first_name}/timeline`
- ✅ Local file storage working (`./uploads/`)

### Frontend
- ✅ `TreatmentDetailsPanel` component with disabled Case Study tab
- ✅ `FileGallery` component for displaying attachments
- ✅ `dentalService.ts` with attachment methods
- ✅ Treatment module structure complete

---

## 📋 IMPLEMENTATION TASKS

### Task 1: Add Patient Attachments Method to dentalService ⚡
**File**: `frontend/src/services/dentalService.ts`
**Priority**: High (needed for Case Study)

```typescript
/**
 * Get all attachments for a patient
 */
getPatientAttachments: async (mobile: string, firstName: string, fileType?: string) => {
  const params = new URLSearchParams();
  if (fileType) params.append('file_type', fileType);

  const response = await axiosInstance.get(
    `/dental/patients/${mobile}/${firstName}/attachments?${params.toString()}`
  );
  return response.data;
},
```

**Checklist**:
```
□ Add method to dentalAttachmentAPI object
□ Test with valid patient data
□ Test with file_type filter
□ Handle errors (404 if no attachments)
```

---

### Task 2: Create CaseStudyView Component ⭐
**File**: `frontend/src/components/treatments/CaseStudyView.tsx`
**Priority**: High (main component)

**Component Structure**:
```typescript
interface CaseStudyViewProps {
  patientMobile: string;
  patientFirstName: string;
}

Sections:
1. Patient Summary (from treatment timeline)
2. File Type Filter Buttons (All, X-rays, Before, After, Tests, Documents)
3. File Gallery (grid of thumbnails)
4. Empty State (if no attachments)
```

**Features**:
- Filter by file type (xray, photo_before, photo_after, test_result, document)
- Display file count per type
- Grid layout with 3-4 columns
- Click to open lightbox
- Show upload date and caption
- iPad-friendly touch targets (min 44px)

**Checklist**:
```
□ Create component file
□ Add patient summary section
□ Add filter buttons (All, X-rays, Before, After, etc.)
□ Integrate FileGallery component
□ Add loading state
□ Add empty state (no attachments)
□ Style for iPad (responsive grid)
□ Test filtering works
□ Test lightbox opens
```

---

### Task 3: Enable Case Study Tab ⚡
**File**: `frontend/src/components/treatments/TreatmentDetailsPanel.tsx`
**Priority**: High

**Changes**:
```typescript
// Line 107: Remove disabled prop
<Tab
  label="Case Study"
  value="case-study"
  icon={<DescriptionIcon />}
  iconPosition="start"
  // disabled // REMOVE THIS LINE
/>

// Line 128-137: Replace placeholder with CaseStudyView
{activeTab === 'case-study' && (
  <CaseStudyView
    patientMobile={patient.patient.mobile_number}
    patientFirstName={patient.patient.first_name}
  />
)}
```

**Checklist**:
```
□ Import CaseStudyView component
□ Remove disabled prop from tab
□ Replace placeholder content
□ Pass patient data as props
□ Test tab switching works
```

---

### Task 4: Add RTK Query Endpoint (Optional)
**File**: `frontend/src/store/api.ts`
**Priority**: Low (can use dentalService directly)

```typescript
getPatientAttachments: builder.query<Attachment[], {
  mobile: string;
  firstName: string;
  fileType?: string;
}>({
  query: ({ mobile, firstName, fileType }) => ({
    url: `/dental/patients/${mobile}/${firstName}/attachments`,
    params: { file_type: fileType },
  }),
  providesTags: ['Attachments'],
}),
```

**Checklist**:
```
□ Add query endpoint
□ Add proper types
□ Add cache tags
□ Test invalidation works
```

---

### Task 5: Testing & Validation 🧪
**Priority**: High

**Test Cases**:
```
□ Open Case Study tab - no errors
□ Attachments load correctly
□ Filter by file type works
  - All (shows everything)
  - X-rays only
  - Before photos only
  - After photos only
  - Test results only
  - Documents only
□ Click thumbnail opens lightbox
□ Empty state displays (no attachments)
□ Loading state shows while fetching
□ Works on iPad (touch targets)
□ Layout responsive (desktop/tablet/mobile)
□ Patient with no attachments handled gracefully
```

---

## 🔄 IMPLEMENTATION ORDER

### Step 1: Backend Verification ✅
```bash
# Verify endpoint works
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8000/api/v1/dental/patients/9876543210/John/attachments
```

**Expected**: Returns array of attachments or empty array
**Status**: ✅ Already working (tested earlier)

### Step 2: Frontend Service (15 min)
1. Add `getPatientAttachments` to dentalService.ts
2. Test with console.log

### Step 3: CaseStudyView Component (60-90 min)
1. Create file with basic structure
2. Add patient summary
3. Add filter buttons
4. Integrate FileGallery
5. Add loading/empty states
6. Style for iPad

### Step 4: Enable Tab (5 min)
1. Import component
2. Remove disabled
3. Replace placeholder

### Step 5: Testing (30 min)
1. Test all filter options
2. Test with patients (with and without attachments)
3. Test iPad layout
4. Fix any issues

**Total Time**: ~2-2.5 hours

---

## 📁 FILES TO CREATE/MODIFY

### Create (1 file):
```
✅ frontend/src/components/treatments/CaseStudyView.tsx
```

### Modify (2 files):
```
✅ frontend/src/services/dentalService.ts
✅ frontend/src/components/treatments/TreatmentDetailsPanel.tsx
```

### Optional (1 file):
```
⚪ frontend/src/store/api.ts (can use dentalService directly)
```

---

## 🎨 UI/UX DESIGN

### Layout:
```
┌─────────────────────────────────────────┐
│ Patient Summary                          │
│ John Doe • 9876543210 • 45 years        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Filter: [All] [X-rays] [Before] [After] │
│         [Tests] [Documents]              │
└─────────────────────────────────────────┘

┌──────────┬──────────┬──────────┬──────────┐
│ [IMG]    │ [IMG]    │ [IMG]    │ [IMG]    │
│ X-ray    │ Before   │ After    │ Test     │
│ Dec 20   │ Dec 20   │ Dec 21   │ Dec 19   │
├──────────┼──────────┼──────────┼──────────┤
│ [IMG]    │ [IMG]    │          │          │
│ X-ray    │ Document │          │          │
│ Dec 18   │ Dec 18   │          │          │
└──────────┴──────────┴──────────┴──────────┘
```

### Empty State:
```
        📁
  No Attachments Found

  Upload files in Dental Consultation
  to see them here
```

---

## 🚨 CRITICAL REMINDERS (From LESSONS_LEARNED.md)

### 1. Route Registration
✅ **Not Needed** - Using existing `/dental/patients/{mobile}/{first_name}/attachments` endpoint

### 2. UUID Validation
✅ **Not Applicable** - Using patient composite key (mobile + first_name), not UUIDs

### 3. Component Patterns
- ✅ Search existing components before creating (FileGallery already exists!)
- ✅ Follow PROJECT_ARCHITECTURE.md structure
- ✅ Use existing hooks and services
- ✅ Follow Toast notification patterns

### 4. Testing Checklist
```
□ Test immediately after changes
□ Check console for errors
□ Test with real data
□ Test empty states
□ Test iPad layout
```

---

## 🎯 SUCCESS CRITERIA

**Phase 3 is complete when**:
- [x] Case Study tab is enabled
- [x] Patient attachments load correctly
- [x] File type filtering works
- [x] Click thumbnail opens lightbox
- [x] Empty state displays properly
- [x] Works on iPad (touch-friendly)
- [x] No console errors
- [x] Handles patients with no attachments

---

## 🔮 FUTURE: PHASE 4 - AI GENERATION

**Not included in Phase 3** (requires ChatGPT API key):
- Generate case study narrative from patient data
- AI-powered summary generation
- Export to PDF
- Case study templates

**When ready**:
1. User provides ChatGPT API credentials
2. Create case study generation UI
3. Integrate OpenAI API
4. Add to config: `OPENAI_API_KEY`

---

## 📞 QUICK REFERENCE

### API Endpoint:
```
GET /api/v1/dental/patients/{mobile}/{first_name}/attachments?file_type=xray
```

### File Types:
```typescript
'xray' | 'photo_before' | 'photo_after' | 'test_result' | 'document' | 'other'
```

### Component Import:
```typescript
import FileGallery from '../../components/common/FileGallery';
```

---

**Status**: Ready to implement! All prerequisites complete. 🚀

**Next Step**: Start with Task 1 (Add patient attachments method to dentalService)
