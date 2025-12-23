# File Upload Issues - Investigation & Fix Plan
**Created**: December 22, 2025
**Status**: ✅ COMPLETE

---

## Issues Summary

### Issue 1: Attachment not shown on right panel after upload until refresh ✅ FIXED
**Root Cause**: In `handleUploadAttachment`, after upload `observationAttachments` (for right panel) was not updated.
**Fix**: Added code to update `observationAttachments` state after successful upload.

### Issue 2: Created procedure not shown in current observation OR mapped to wrong observation ✅ FIXED
**Root Cause**: Procedures matched to observations by tooth numbers instead of `observation_id`.
**Fix**: Changed matching logic to FIRST try `observation_id`, then fall back to tooth numbers.

### Issue 3: File upload dialog not shown when clicking "Complete" in SavedObservationsPanel ✅ FIXED
**Root Cause**: Only `NewObservationForm` had the dialog logic.
**Fix**: Added `PostProcedureUploadDialog` to `SavedObservationsPanel` with proper handlers.

---

## TODO LIST

- [x] In `handleUploadAttachment` (DentalConsultation.tsx), update `observationAttachments` state
- [x] Modify loading logic to use `observation_id` for procedure matching
- [x] Add `PostProcedureUploadDialog` state and dialog to SavedObservationsPanel
- [x] Add `onUploadAttachment` prop and pass handler from DentalConsultation

---

## Files Modified

### 1. `frontend/src/pages/dental/DentalConsultation.tsx`

**Fix 1** (Lines 1219-1231): After successful upload, also update `observationAttachments`:
```javascript
// Find observation with this backend ID and update its attachments
const matchingObs = observations.find(obs => {
  if (!obs.backendObservationIds) return false;
  return Object.values(obs.backendObservationIds).includes(observationId);
});
if (matchingObs) {
  setObservationAttachments(prev => ({...prev, [matchingObs.id]: response || []}));
}
```

**Fix 2** (Lines 386-420): Changed procedure matching to prefer `observation_id`:
```javascript
// FIRST: Try to match by observation_id (direct link from backend)
if (proc.observation_id) {
  for (const key of Object.keys(groupedObs)) {
    if (obsGroup.backendObservationIds) {
      const hasMatchingId = Object.values(obsGroup.backendObservationIds).includes(proc.observation_id);
      if (hasMatchingId) { matchedKey = key; break; }
    }
  }
}
// FALLBACK: Match by tooth numbers if no observation_id match
```

**Fix 3** (Lines 1315-1349): Added `handleUploadAttachmentForPanel` handler for right panel uploads.

**Fix 3** (Line 1955): Passed handler to SavedObservationsPanel:
```javascript
onUploadAttachment={handleUploadAttachmentForPanel}
```

### 2. `frontend/src/components/dental/SavedObservationsPanel.tsx`

**Changes**:
- Added import for `PostProcedureUploadDialog` and `ProcedureData` type
- Added `onUploadAttachment` prop to interface
- Added state for dialog: `showPostProcedureDialog`, `completedProcedureInfo`
- Modified "Complete" button to show dialog after marking complete
- Added `PostProcedureUploadDialog` component at end of JSX

---

## Review Section

### Summary of Changes

| File | Lines Changed | Impact |
|------|---------------|--------|
| DentalConsultation.tsx | ~60 lines added | Issue 1, 2, 3 fixes |
| SavedObservationsPanel.tsx | ~45 lines added | Issue 3 fix |

### What Each Fix Does

1. **Issue 1 Fix**: When a file is uploaded in the left panel form, the right panel (SavedObservationsPanel) now immediately shows the attachment without requiring a page refresh.

2. **Issue 2 Fix**: When procedures are loaded from the backend, they're now matched to observations using the direct `observation_id` link from the database, ensuring procedures appear under the correct observation. Tooth number matching is only used as a fallback for legacy data.

3. **Issue 3 Fix**: When clicking "Complete" on a procedure in the right panel (SavedObservationsPanel), the PostProcedureUploadDialog now appears, allowing doctors to upload "After" photos immediately.

### Code Quality

- ✅ Minimal changes (follows CLAUDE.md Rule #6-9)
- ✅ No refactoring
- ✅ Fixes root causes, not symptoms
- ✅ Each fix is isolated and testable
- ✅ Backward compatible (tooth number fallback preserved)

### Testing Checklist

- [ ] Upload file in new observation form → Check right panel shows attachment immediately
- [ ] Create observation with procedure → Refresh page → Check procedure appears under correct observation
- [ ] Click "Complete" on procedure in right panel → Check upload dialog appears
- [ ] Upload "After" photo from dialog → Check it appears in attachments

---

## ✅ IMPLEMENTATION COMPLETE
