# Fix Observation Issues - Plan

## Issue 1: Image Comments/Captions Not Being Saved ❌

### Problem
In **Consultation > Observation > Upload Images**:
- Upload happens **immediately** upon file selection
- Caption field is shown AFTER upload completes
- By the time user enters a caption, the upload already finished with empty caption
- **Root cause:** `FileUpload.tsx:152-170` - `simulateUpload()` is called immediately, before user can type caption

### Current Flow (BROKEN):
1. User selects file
2. File added to list with `caption: ''` (line 127)
3. Upload starts immediately with empty caption (line 133)
4. Upload completes, saves empty caption to backend (line 166)
5. Caption field shown to user (line 426)
6. User types caption → **TOO LATE! Already uploaded with empty caption**

### Solution:
**Allow caption editing AFTER upload:**
1. Add backend API: `PUT /api/v1/dental/attachments/{attachment_id}` to update caption
2. Add "Edit Caption" button in `FileGallery.tsx` component
3. Show dialog to edit caption for already-uploaded files
4. Call update API to save new caption

---

## Issue 2: Procedures Not Showing in Observation Edit ❌

### Problem
In **Consultation > Observation > Edit**:
- Procedures created for an observation are not displaying
- `ObservationEditModal.tsx:210-265` has code to show procedures
- But `observation.procedures` is likely empty/undefined

### Possible Causes:
1. Backend not including procedures when fetching observation
2. Frontend not mapping procedures correctly
3. Procedures not being created at all

### Investigation Needed:
1. Check backend API response for observation fetch
2. Verify procedures are being created in database
3. Check frontend data mapping

---

## Tasks
- [ ] Add backend API endpoint to update attachment caption
- [ ] Add caption edit button/dialog in FileGallery component
- [ ] Test caption update flow
- [ ] Investigate observation fetch API response
- [ ] Fix procedures not being included in observation data
- [ ] Test procedure display in edit modal

---

**Files to Modify:**
- Backend: `app/api/v1/endpoints/dental_attachments.py` - Add PUT endpoint
- Backend: `app/services/attachment_service.py` - Add update caption method
- Frontend: `FileGallery.tsx` - Add edit caption UI
- Frontend: Check observation fetch logic and procedure mapping
