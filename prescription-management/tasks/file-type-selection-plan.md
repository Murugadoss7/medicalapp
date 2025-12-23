# File Type Selection - Implementation Plan
**Created**: December 21, 2025
**Problem**: Cannot differentiate between Before/After/X-ray images during upload
**Status**: 📋 Ready to Implement

---

## 🎯 CURRENT SITUATION

### Backend (Already Supports!)
**File Types Available** (from `dental_attachments.py:33`):
```
✅ xray          - X-ray images
✅ photo_before  - Before treatment photos
✅ photo_after   - After treatment photos
✅ test_result   - Test results (PDF, images)
✅ document      - Other documents
✅ other         - Miscellaneous files
```

### Frontend (Missing!)
**Current FileUpload Component**:
- Has `fileType` prop but it's **fixed** (defaults to 'document')
- No UI for user to **select** file type
- Just passes same type for all uploads

**Result**: All images uploaded as "document" - can't tell Before from After!

---

## 💡 RECOMMENDED SOLUTION

### Option A: File Type Selector PER FILE (BEST) ⭐
**When**: After file selected, before upload
**Where**: Show type selector for each file

**UX Flow**:
```
1. User drops/selects file
2. File appears in list
3. User selects type: [Before] [After] [X-ray] [Test] [Other]
4. User clicks upload or auto-uploads
```

**Pros**:
- ✅ Different types for different files (most flexible)
- ✅ Clear which type for which file
- ✅ Matches clinical workflow
- ✅ iPad-friendly buttons

**Implementation**: Modify FileUpload component to add type selector per file

---

### Option B: Pre-Select Type Then Upload (SIMPLER)
**When**: Before file selection
**Where**: Show type selector above upload area

**UX Flow**:
```
1. User selects type: [Before] [After] [X-ray] [Test] [Other]
2. Selected type highlighted
3. User uploads files
4. All files tagged with selected type
```

**Pros**:
- ✅ Simpler implementation
- ✅ Good for batch uploads (all before photos, all after photos)
- ✅ iPad-friendly buttons

**Cons**:
- ❌ Can't mix types in single upload session
- ❌ Need to upload multiple times for different types

---

## 🎯 MY RECOMMENDATION: **Hybrid Approach** ⭐⭐⭐

### Best of Both Worlds:

**Step 1**: Pre-select default type (buttons above upload area)
**Step 2**: After file selected, can change type per file
**Step 3**: Upload all with their respective types

### UX Design:

```
┌─────────────────────────────────────────────┐
│ Upload Type (Default for all files):        │
│ [Before ✓] [After] [X-ray] [Test] [Other]  │
├─────────────────────────────────────────────┤
│                                             │
│ 📤 Drop files here or click to upload      │
│                                             │
└─────────────────────────────────────────────┘

After file selected:

┌─────────────────────────────────────────────┐
│ ┌──────────────────────────────────────┐   │
│ │ 📷 image1.jpg                        │   │
│ │ Type: [Before ✓] [After] [X-ray]    │   │
│ │ Progress: ███████░░░ 70%             │   │
│ └──────────────────────────────────────┘   │
│                                             │
│ ┌──────────────────────────────────────┐   │
│ │ 📷 image2.jpg                        │   │
│ │ Type: [Before] [After ✓] [X-ray]    │   │
│ │ Progress: Queued                     │   │
│ └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

**Benefits**:
- ✅ Fast: Pre-select type for batch uploads
- ✅ Flexible: Change per file if needed
- ✅ iPad-friendly: All buttons (44px min)
- ✅ Clinical workflow: Doctor uploads before photos, then after photos separately
- ✅ No confusion: Clear visual indication per file

---

## 🏗️ IMPLEMENTATION PLAN

### Approach: **Hybrid with Smart Defaults**

### Task 1: Enhance FileUpload Component (45 min) 🎯

**File**: `frontend/src/components/common/FileUpload.tsx`

**Changes**:

#### 1.1: Add File Type State Per File
```typescript
interface UploadedFile {
  file: File;
  preview?: string;
  progress: number;
  error?: string;
  fileType: 'xray' | 'photo_before' | 'photo_after' | 'test_result' | 'document' | 'other'; // NEW!
}

interface FileUploadProps {
  // ... existing props
  defaultFileType?: 'xray' | 'photo_before' | 'photo_after' | 'test_result' | 'document' | 'other'; // NEW!
  allowPerFileTypeSelection?: boolean; // NEW! (default: true)
}
```

#### 1.2: Add Default File Type Selector
```typescript
const [defaultFileType, setDefaultFileType] = useState(props.defaultFileType || 'document');

// Render above drop zone:
<Box sx={{ mb: 2 }}>
  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
    File Type:
  </Typography>
  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
    <Button
      variant={defaultFileType === 'photo_before' ? 'contained' : 'outlined'}
      onClick={() => setDefaultFileType('photo_before')}
      sx={{ minHeight: 44 }}
    >
      📷 Before
    </Button>
    <Button
      variant={defaultFileType === 'photo_after' ? 'contained' : 'outlined'}
      onClick={() => setDefaultFileType('photo_after')}
      sx={{ minHeight: 44 }}
    >
      📷 After
    </Button>
    <Button
      variant={defaultFileType === 'xray' ? 'contained' : 'outlined'}
      onClick={() => setDefaultFileType('xray')}
      sx={{ minHeight: 44 }}
    >
      🩻 X-ray
    </Button>
    <Button
      variant={defaultFileType === 'test_result' ? 'contained' : 'outlined'}
      onClick={() => setDefaultFileType('test_result')}
      sx={{ minHeight: 44 }}
    >
      📄 Test Result
    </Button>
    <Button
      variant={defaultFileType === 'other' ? 'contained' : 'outlined'}
      onClick={() => setDefaultFileType('other')}
      sx={{ minHeight: 44 }}
    >
      📎 Other
    </Button>
  </Box>
</Box>
```

#### 1.3: Add Per-File Type Selector
```typescript
// In uploaded files list (after each file):
{allowPerFileTypeSelection && (
  <Box sx={{ mt: 1 }}>
    <ButtonGroup size="small">
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
)}
```

#### 1.4: Update Upload Callback
```typescript
// Change callback signature to pass file type
onUploadSuccess(uploadedFile.file, uploadedFile.fileType); // Use file's specific type
```

---

### Task 2: Update NewObservationForm Integration (15 min) 📝

**File**: `frontend/src/components/dental/NewObservationForm.tsx`

**Changes**:
```typescript
// Add default to photo_before (most common)
<FileUpload
  defaultFileType="photo_before"  // NEW! Smart default
  allowPerFileTypeSelection={true} // NEW! Allow changing per file
  onUploadSuccess={(file, fileType) => onUploadAttachment(file, fileType)}
/>
```

---

### Task 3: Smart Defaults Per Context (10 min) 🎯

**Different contexts = different defaults**:

#### Consultation Page (NewObservationForm):
```typescript
<FileUpload defaultFileType="photo_before" />
// Most uploads during consultation are before-treatment photos
```

#### Treatment Page (Post-procedure):
```typescript
<FileUpload defaultFileType="photo_after" />
// After procedures, upload after-treatment photos
```

#### Diagnostic Session:
```typescript
<FileUpload defaultFileType="xray" />
// When reviewing X-rays
```

---

## 🎨 DETAILED UX MOCKUP

### Before Selection:
```
┌──────────────────────────────────────────┐
│ File Type (applies to all files):       │
│ [📷 Before ✓] [📷 After] [🩻 X-ray]     │
│ [📄 Test] [📎 Other]                    │
├──────────────────────────────────────────┤
│                                          │
│        📤 Drop files here                │
│     or click to browse                   │
│                                          │
│ JPG, PNG, PDF, DICOM • Max 10MB         │
│ [Browse Files]                           │
└──────────────────────────────────────────┘
```

### After File Added (Can Change Type):
```
┌──────────────────────────────────────────┐
│ Uploaded Files (2/5):                    │
├──────────────────────────────────────────┤
│ ┌────────────────────────────────────┐  │
│ │ 📷 [Preview] tooth16_before.jpg    │  │
│ │ 245 KB                             │  │
│ │ Type: [Before ✓] [After] [X-ray]  │  │
│ │ Progress: ████████░░ 80%           │  │
│ │                              [×]    │  │
│ └────────────────────────────────────┘  │
│                                          │
│ ┌────────────────────────────────────┐  │
│ │ 🩻 xray_tooth16.jpg                │  │
│ │ 1.2 MB                             │  │
│ │ Type: [Before] [After] [X-ray ✓]  │  │
│ │ Progress: Queued                   │  │
│ │                              [×]    │  │
│ └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

**Key Features**:
- ✅ Default type selected (from context)
- ✅ Can change per file (button toggles)
- ✅ Visual indication (checkmark)
- ✅ All buttons 44px+ (iPad-friendly)
- ✅ Clear labels with emojis
- ✅ No dropdowns!

---

## 🔧 IMPLEMENTATION STEPS

### Step 1: Update FileUpload Component
```typescript
1. Add defaultFileType state
2. Add fileType to UploadedFile interface
3. Render file type selector buttons (above drop zone)
4. Add per-file type toggle buttons (in file list)
5. Update upload callback to use file.fileType
6. Initialize each file with defaultFileType
```

**Time**: 45 minutes
**Complexity**: Medium

---

### Step 2: Update NewObservationForm
```typescript
1. Add defaultFileType="photo_before" prop
2. Keep existing upload handler (already handles fileType param)
```

**Time**: 5 minutes
**Complexity**: Low

---

### Step 3: (Optional) Add Caption Field
```typescript
// For each file, allow optional caption
<TextField
  placeholder="Add caption (optional)"
  value={uploadedFile.caption || ''}
  onChange={(e) => updateCaption(index, e.target.value)}
  size="small"
  sx={{ mt: 1 }}
/>
```

**Time**: 15 minutes
**Complexity**: Low

---

## 📋 FILE TYPE USE CASES

### Clinical Scenarios:

#### Scenario 1: Root Canal - Multi-Visit
```
Visit 1 (Diagnosis):
- 🩻 X-ray (initial diagnostic)
- 📷 Before (tooth condition photo)

Visit 2 (During Treatment):
- 📷 Before (canal work)
- 📷 After (canal sealed)

Visit 3 (Final):
- 📷 After (restoration complete)
- 🩻 X-ray (verify root fill)
```

**With file type selection**: Doctor can upload 2 before + 2 after + 2 x-rays, all properly labeled!

#### Scenario 2: Cosmetic - Whitening
```
Before Treatment:
- 📷 Before (smile photo)
- 📷 Before (close-up teeth)

After Treatment:
- 📷 After (smile photo)
- 📷 After (close-up teeth - whiter!)
```

**With file type selection**: Perfect before/after comparison for case study!

#### Scenario 3: Extraction
```
Before:
- 🩻 X-ray (impacted tooth)
- 📷 Before (clinical photo)

After:
- 📷 After (healing site)
- 📄 Test Result (healing report)
```

---

## 🎨 BUTTON DESIGN (iPad-Friendly)

### Primary Selector (Default for All):
```
Large buttons:
- Min width: 100px
- Min height: 44px
- Gap: 8px
- Wrap on mobile
- Active: Filled blue
- Inactive: Outlined gray
```

### Per-File Selector (Optional Change):
```
Compact buttons:
- Min width: 70px
- Min height: 36px
- ButtonGroup (connected)
- Only show 3 most common: Before | After | X-ray
- "+ More" button for test_result, document, other
```

---

## ✅ SUCCESS CRITERIA

When complete, doctors can:
- [x] Select default file type before uploading
- [x] Upload multiple files with default type
- [x] Change file type per individual file
- [x] See visual indication of selected type
- [x] All uploads have correct type metadata
- [x] Case study can filter by type
- [x] Before/After comparison works perfectly

---

## 🚀 IMPLEMENTATION PRIORITY

### Must Have (Now):
1. ✅ Default file type selector (buttons above upload)
2. ✅ Per-file type override (buttons per file)
3. ✅ Pass correct type to backend

### Nice to Have (Later):
4. ⏳ Caption field per file
5. ⏳ Taken date field (when photo was taken)
6. ⏳ Smart suggestions based on context

---

## 📊 ESTIMATED EFFORT

- **FileUpload component**: 45-60 min
- **Integration testing**: 20 min
- **NewObservationForm update**: 5 min
- **Documentation**: 10 min

**Total**: ~1.5 hours

---

## 🔄 WORKFLOW COMPARISON

### Before (Current):
```
1. Upload file
2. File tagged as "document"
3. Can't tell Before from After
4. Case study can't organize by type
❌ Poor documentation quality
```

### After (With File Type Selection):
```
1. Select type: "Before Treatment"
2. Upload file
3. File tagged as "photo_before"
4. Upload more as "After Treatment"
5. Files tagged as "photo_after"
6. Case study shows Before → After progression
✅ Professional documentation!
```

---

## 💡 SMART DEFAULTS SUGGESTION

**Context-aware defaults** based on where upload happens:

| Context | Default Type | Reason |
|---------|-------------|---------|
| New Observation (Consultation) | `photo_before` | Initial assessment |
| During Procedure | `photo_after` | Post-procedure documentation |
| Diagnostic Review | `xray` | Reviewing radiographs |
| Test Results Upload | `test_result` | Lab reports |
| Case Study Tab | `other` | Mixed documentation |

---

## 🎯 NEXT STEPS

### Option 1: Implement Hybrid Approach (Recommended)
**Effort**: 1.5 hours
**Value**: Maximum flexibility + good UX

### Option 2: Implement Simple Pre-Selector Only
**Effort**: 45 minutes
**Value**: Good enough for most cases, simpler

### Option 3: Add to Phase 4 (With AI)
**Effort**: Deferred
**Value**: Fix when doing AI case study generation

---

## 🤔 YOUR DECISION NEEDED

**Questions**:

1. **Which approach do you prefer?**
   - [ ] Hybrid (default + per-file override)
   - [ ] Simple (just default selector)
   - [ ] Defer to Phase 4

2. **When should this be implemented?**
   - [ ] Now (before testing Phase 3)
   - [ ] After testing Phase 3
   - [ ] With Phase 4 (AI generation)

3. **Additional fields needed?**
   - [ ] Caption per file (optional text)
   - [ ] Taken date per file (when photo was taken)
   - [ ] Just file type is enough

---

**Let me know your preference and I'll implement it!** 🚀
