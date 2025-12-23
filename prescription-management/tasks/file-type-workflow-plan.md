# File Type Selection - Clinical Workflow Plan
**Created**: December 21, 2025
**Approach**: Hybrid with Smart Context-Aware Defaults
**Status**: 📋 Implementation

---

## 🏥 CLINICAL WORKFLOW UNDERSTANDING

### Perfect! Your Workflow Makes Total Sense:

#### Timing 1: During Consultation (New Observation)
```
Doctor examines patient
  ↓
Finds issue (cavity, fracture, etc.)
  ↓
Takes BEFORE photos
  ↓
Uploads: file_type = "photo_before" ✅
  ↓
Creates observation + treatment plan
```

#### Timing 2: After Procedure Completed
```
Procedure marked as "completed"
  ↓
Doctor takes AFTER photos
  ↓
Uploads: file_type = "photo_after" ✅
  ↓
Can add comments: "Good healing, no inflammation"
```

#### Timing 3: Next Visit (Follow-up)
```
Patient returns for checkup
  ↓
Doctor reviews healing
  ↓
Takes progress photos
  ↓
Uploads: file_type = "photo_after" ✅
  ↓
Comments: "2 weeks post-op, excellent healing"
```

---

## 🎯 IMPLEMENTATION STRATEGY

### Smart Context-Aware Defaults:

| Context | Default File Type | Reason |
|---------|------------------|---------|
| **New Observation** | `photo_before` | Initial assessment photos |
| **During Procedure** | `photo_before` | Before starting work |
| **After Procedure Completed** | `photo_after` | Post-treatment documentation |
| **Follow-up Visit** | `photo_after` | Healing/progress photos |
| **Diagnostic Review** | `xray` | X-ray review session |
| **Lab Results** | `test_result` | Test/lab uploads |

---

## 🏗️ ENHANCED IMPLEMENTATION PLAN

### Part A: Enhanced FileUpload Component

**File**: `frontend/src/components/common/FileUpload.tsx`

**New Props**:
```typescript
interface FileUploadProps {
  // Existing props
  maxFiles?: number;
  maxSizeBytes?: number;
  acceptedTypes?: string[];

  // NEW PROPS
  defaultFileType?: FileTypeOption; // Smart default based on context
  allowPerFileTypeSelection?: boolean; // Allow changing per file (default: true)
  allowCaption?: boolean; // Allow caption per file (default: true)
  onUploadComplete?: (file: File, metadata: FileMetadata) => void; // NEW callback
}

interface FileMetadata {
  fileType: FileTypeOption;
  caption?: string;
  takenDate?: Date;
}

type FileTypeOption = 'xray' | 'photo_before' | 'photo_after' | 'test_result' | 'document' | 'other';
```

**New Features**:
1. ✅ File type selector (buttons above drop zone)
2. ✅ Per-file type override (buttons in file list)
3. ✅ Caption field per file (optional comment)
4. ✅ Visual indication of selected type
5. ✅ All iPad-friendly (44px+ buttons)

---

### Part B: Consultation Page Integration

**File**: `frontend/src/components/dental/NewObservationForm.tsx`

**Context**: New Observation (Initial Assessment)

```typescript
<FileUpload
  defaultFileType="photo_before"  // Smart default!
  allowPerFileTypeSelection={true}
  allowCaption={true}
  onUploadComplete={(file, metadata) => {
    // Upload with correct type and caption
    onUploadAttachment(file, metadata.fileType, metadata.caption);
  }}
/>
```

**Result**: All initial photos default to "Before" (can change if needed)

---

### Part C: Treatment Page Integration (NEW!)

**File**: `frontend/src/components/treatments/ProcedureSchedule.tsx`

**Context**: After Procedure Marked Complete

**Add Upload Section**:
```typescript
// When procedure status = "completed", show upload option
{procedure.status === 'completed' && (
  <Collapse in={expandedProcedure === procedure.id}>
    <Box sx={{ p: 2, bgcolor: 'success.light' }}>
      <Typography variant="subtitle2" gutterBottom fontWeight={600}>
        📸 Add Post-Procedure Photos
      </Typography>

      <FileUpload
        defaultFileType="photo_after"  // Smart default for completed procedures!
        allowCaption={true}
        onUploadComplete={(file, metadata) => {
          // Upload to procedure attachments
          handleUploadProcedureAttachment(procedure.id, file, metadata);
        }}
      />
    </Box>
  </Collapse>
)}
```

**Result**: After marking procedure complete, doctor can immediately upload "After" photos with comments!

---

### Part D: Next Visit Workflow

**Scenario**: Patient returns for follow-up

**Option 1**: Upload through Treatment Dashboard
```typescript
// In ProcedureSchedule or TreatmentTimeline
<Button
  variant="outlined"
  onClick={() => setShowUploadDialog(true)}
>
  Add Follow-up Photos
</Button>

<Dialog open={showUploadDialog}>
  <DialogTitle>Upload Follow-up Photos</DialogTitle>
  <DialogContent>
    <FileUpload
      defaultFileType="photo_after"  // Follow-up = after treatment
      allowCaption={true}
      // Caption prompt: "Describe current status (e.g., '2 weeks post-op, good healing')"
    />
  </DialogContent>
</Dialog>
```

**Option 2**: Upload through New Appointment
```typescript
// When doctor opens follow-up appointment
// Auto-detect: Is this follow-up for previous procedure?
// If yes: Default to "photo_after"
// If no: Default to "photo_before"
```

---

## 📋 DETAILED IMPLEMENTATION TASKS

### Task 1: Enhance FileUpload Component (60 min)

**File**: `frontend/src/components/common/FileUpload.tsx`

**1.1: Add File Type Selector (Top)**
```typescript
// State
const [defaultFileType, setDefaultFileType] = useState(props.defaultFileType || 'document');

// UI - Above drop zone
<Box sx={{ mb: 2 }}>
  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
    File Type (applies to all files):
  </Typography>
  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
    {fileTypeButtons.map(({ type, label, icon, color }) => (
      <Button
        key={type}
        variant={defaultFileType === type ? 'contained' : 'outlined'}
        startIcon={icon}
        onClick={() => setDefaultFileType(type)}
        sx={{
          minHeight: 44,
          minWidth: 100,
          bgcolor: defaultFileType === type ? color : 'transparent',
        }}
      >
        {label}
      </Button>
    ))}
  </Box>
</Box>
```

**1.2: Update UploadedFile Interface**
```typescript
interface UploadedFile {
  file: File;
  preview?: string;
  progress: number;
  error?: string;
  fileType: FileTypeOption; // NEW!
  caption?: string; // NEW!
}
```

**1.3: Add Per-File Type Selector**
```typescript
// In uploaded files list, for each file:
<Box sx={{ mt: 1 }}>
  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
    Type:
  </Typography>
  <ButtonGroup size="small" sx={{ mb: 1 }}>
    <Button
      variant={uploadedFile.fileType === 'photo_before' ? 'contained' : 'outlined'}
      onClick={() => updateFileType(index, 'photo_before')}
      sx={{ minHeight: 36 }}
    >
      Before
    </Button>
    <Button
      variant={uploadedFile.fileType === 'photo_after' ? 'contained' : 'outlined'}
      onClick={() => updateFileType(index, 'photo_after')}
      sx={{ minHeight: 36 }}
    >
      After
    </Button>
    <Button
      variant={uploadedFile.fileType === 'xray' ? 'contained' : 'outlined'}
      onClick={() => updateFileType(index, 'xray')}
      sx={{ minHeight: 36 }}
    >
      X-ray
    </Button>
  </ButtonGroup>
</Box>
```

**1.4: Add Caption Field**
```typescript
{props.allowCaption && (
  <TextField
    placeholder="Add comment (e.g., '2 weeks post-op, good healing')"
    value={uploadedFile.caption || ''}
    onChange={(e) => updateCaption(index, e.target.value)}
    size="small"
    fullWidth
    multiline
    rows={2}
    sx={{ mt: 1 }}
  />
)}
```

---

### Task 2: Add Upload to Completed Procedures (30 min)

**File**: `frontend/src/components/treatments/ProcedureSchedule.tsx`

**When**: Procedure status = "completed"

**Add**:
```typescript
{procedure.status === 'completed' && (
  <Box sx={{ mt: 2, p: 2, bgcolor: 'success.50', borderRadius: 1 }}>
    <Typography variant="subtitle2" gutterBottom fontWeight={600} color="success.dark">
      📸 Add Post-Procedure Photos
    </Typography>

    <FileUpload
      defaultFileType="photo_after"  // Smart default!
      allowCaption={true}
      maxFiles={5}
      onUploadComplete={(file, metadata) => {
        handleUploadProcedurePhoto(procedure.id, file, metadata);
      }}
    />

    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
      💡 Tip: Upload after-treatment photos and add comments about healing progress
    </Typography>
  </Box>
)}
```

---

### Task 3: Update NewObservationForm (5 min)

**File**: `frontend/src/components/dental/NewObservationForm.tsx`

**Change**:
```typescript
<FileUpload
  defaultFileType="photo_before"  // NEW! Smart default for consultations
  allowCaption={true}              // NEW! Allow comments
  onUploadComplete={(file, metadata) => {
    onUploadAttachment(file, metadata.fileType, metadata.caption);
  }}
/>
```

---

## 🎬 REAL-WORLD WORKFLOW EXAMPLE

### Case: Root Canal on Tooth 16

#### Visit 1 (Dec 1) - Diagnosis & Emergency Treatment
**Doctor**:
1. Opens Dental Consultation
2. Examines Tooth 16
3. Takes photos → **Uploads** (Default: "Before" ✅)
   - Uploads 2 photos as "photo_before"
   - Caption: "Deep cavity, pulp exposed"
4. Takes X-ray → **Changes type to "X-ray"**
   - Uploads 1 X-ray as "xray"
   - Caption: "Periapical X-ray showing decay"
5. Performs emergency pulpectomy
6. Marks procedure as "completed"
7. **Upload section appears** (Default: "After" ✅)
   - Uploads 1 photo as "photo_after"
   - Caption: "Access cavity prepared, pulp removed"

**Result**: 4 attachments with correct types and comments!

#### Visit 2 (Dec 5) - Canal Preparation
**Doctor**:
1. Opens appointment
2. Reviews previous photos (Before/After from Visit 1)
3. Takes working length photo → **Uploads** (Default: "Before" ✅)
   - Caption: "Working length established"
4. Performs canal shaping
5. Marks complete → **Upload appears** (Default: "After" ✅)
   - Uploads photo as "photo_after"
   - Caption: "Canals cleaned and shaped, ready for obturation"

#### Visit 3 (Dec 12) - Obturation
**Doctor**:
1. Takes pre-fill photo → Uploads as "Before"
2. Fills canals
3. Marks complete → Uploads as "After"
   - Caption: "Canals obturated with gutta-percha"
4. Takes verification X-ray → Changes type to "X-ray"
   - Caption: "Post-obturation radiograph showing complete fill"

#### Visit 4 (Dec 20) - Final Restoration
**Doctor**:
1. Pre-crown photo → "Before"
2. Places crown
3. Marks complete → "After"
   - Caption: "Crown cemented, excellent fit"
4. Final X-ray → "X-ray"
   - Caption: "Final radiograph, treatment complete"

#### Follow-up (Jan 5) - Next Appointment
**Doctor**:
1. Opens follow-up appointment
2. System detects: Previous procedure on Tooth 16
3. Upload defaults to **"photo_after"** (smart!)
4. Takes healing photo → Uploads
   - Caption: "2 weeks post-op, excellent healing, no sensitivity"

---

## 🎯 IMPLEMENTATION PLAN (Updated)

### Part 1: Enhanced FileUpload Component ✅

**Add**:
1. ✅ File type selector (buttons)
2. ✅ Per-file type override
3. ✅ Caption field per file
4. ✅ Smart defaults from props

---

### Part 2: Consultation Page ✅

**Context**: Initial Assessment
**Default**: `photo_before`
**Allow**: Caption for each file

---

### Part 3: Procedure Completion Upload (NEW!) ⭐

**Where**: ProcedureSchedule.tsx or AddProcedureDialog.tsx

**Trigger**: When procedure status changes to "completed"

**Show**:
```
✅ Procedure marked as complete!

📸 Add Post-Procedure Photos (Optional)
[Upload area with default: "photo_after"]

💬 Add comments about outcome:
[Text area: "Describe healing, patient response, etc."]
```

---

### Part 4: Follow-up Appointment Upload (NEW!) ⭐

**Where**: Next appointment for same patient/tooth

**Smart Detection**:
```typescript
// Check if patient has completed procedures for this tooth
const hasCompletedProcedures = await checkCompletedProcedures(
  patientMobile,
  patientFirstName,
  selectedTooth
);

// If yes: Default to "photo_after"
// If no: Default to "photo_before"
const defaultType = hasCompletedProcedures ? 'photo_after' : 'photo_before';
```

---

## 🔧 PRACTICAL IMPLEMENTATION

### Step 1: Update FileUpload Component (60 min)

I'll add:
- File type selector buttons
- Per-file type override
- Caption field
- Smart initialization

### Step 2: Add Upload to Completed Procedures (30 min)

I'll add upload section that appears when:
- Procedure status changes to "completed"
- Default type: "photo_after"
- With caption field

### Step 3: Update NewObservationForm (5 min)

Smart defaults based on context

---

## 💬 Caption Field Examples

### For Doctors to Add:

**Before Photos**:
- "Deep mesial cavity, close to pulp"
- "Severe discoloration on buccal surface"
- "Periapical abscess visible"

**After Photos**:
- "Composite restoration completed, excellent margins"
- "1 week post-extraction, good granulation tissue"
- "Crown cemented, occlusion adjusted"

**Follow-up Photos**:
- "2 weeks post-op, excellent healing"
- "1 month follow-up, no sensitivity reported"
- "6 months post-RCT, radiograph shows bone healing"

**X-rays**:
- "Periapical radiograph showing decay extent"
- "Post-obturation film, canals well filled to apex"
- "Follow-up radiograph at 3 months"

---

## 🎯 SHALL I PROCEED?

I'll implement:

**Part 1** ✅: Enhanced FileUpload with type selector + captions
**Part 2** ✅: Update NewObservationForm (default: "before")
**Part 3** ✅: Add upload to completed procedures (default: "after")
**Part 4** ✅: Smart defaults throughout

**Also add**:
- Visual indicators (emojis for types)
- Validation (caption max length)
- Preview of metadata before upload

**Estimated time**: 2 hours total

**Ready to proceed?** 🚀
