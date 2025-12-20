# Treatment Module - Procedure Actions Enhancement

**Created**: December 20, 2025
**Feature**: Add action buttons to procedure cards in Procedures tab
**Requested by**: User

---

## 🎯 OBJECTIVE

Add quick action buttons to procedure cards so admin/doctor can easily:
1. **Add new procedure** (button at top of section)
2. **Complete** procedure (mark as done)
3. **Cancel** procedure (mark as cancelled)
4. **Reschedule** procedure (change date)

---

## 📋 EXISTING BACKEND ENDPOINTS

✅ **Already available** - No backend changes needed!

1. **Update Procedure Status**
   - Endpoint: `PUT /api/v1/dental/procedures/{id}/status`
   - Body: `{ "status": "completed", "notes": "optional notes" }`
   - Valid statuses: `planned`, `in_progress`, `completed`, `cancelled`

2. **Update Procedure Details (for reschedule)**
   - Endpoint: `PUT /api/v1/dental/procedures/{id}`
   - Body: `{ "procedure_date": "2025-12-25" }`

3. **Create New Procedure**
   - Endpoint: `POST /api/v1/dental/procedures`
   - Body: Full procedure data

---

## 🎨 UI DESIGN (iPad-Friendly)

### Action Buttons Layout

**For Upcoming/Planned Procedures:**
```
┌──────────────────────────────────────────┐
│ Tooth Extraction                [planned]│
│ Code: D7140 • Tooth #18                 │
│                                          │
│ Date: Dec 25, 2025                      │
│                                          │
│ [Complete] [Cancel] [Reschedule]        │ <- Action buttons
└──────────────────────────────────────────┘
```

**For In-Progress Procedures:**
```
┌──────────────────────────────────────────┐
│ Root Canal                  [in_progress]│
│ Code: D3310 • Tooth #14                 │
│                                          │
│ [Complete] [Cancel]                     │ <- Limited actions
└──────────────────────────────────────────┘
```

**For Completed/Cancelled Procedures:**
```
┌──────────────────────────────────────────┐
│ Cleaning                      [completed]│
│ Code: D1110                             │
│                                          │
│ Completed: Dec 18, 2025                 │
│ (No actions - terminal state)           │
└──────────────────────────────────────────┘
```

**Add Procedure Button:**
- At top of "Upcoming" accordion section
- Large, iPad-friendly button (44px min height)
- Opens dialog/modal for new procedure creation

---

## 📝 IMPLEMENTATION TASKS

### Frontend Changes

#### 1. Update dentalService.ts (API calls)
- [ ] Add `updateProcedureStatus(id, status, notes?)` function
- [ ] Add `updateProcedure(id, data)` function
- [ ] Add `createProcedure(data)` function

#### 2. Create Dialogs/Modals
- [ ] Create `RescheduleProcedureDialog.tsx`
  - Date picker for new procedure_date
  - Confirmation button
  - Cancel button
- [ ] Create `AddProcedureDialog.tsx`
  - Form with all procedure fields
  - Patient auto-filled from selected patient
  - Tooth number selector
  - Procedure code/name
  - Estimated cost, duration
  - Submit button

#### 3. Update ProcedureSchedule.tsx
- [ ] Add state for dialogs (open/close)
- [ ] Add state for selected procedure
- [ ] Add action button handlers:
  - [ ] `handleComplete(procedureId)`
  - [ ] `handleCancel(procedureId)`
  - [ ] `handleReschedule(procedureId)`
  - [ ] `handleAddProcedure()`
- [ ] Add confirmation dialogs for actions
  - Use ConfirmDialog component (already exists)
- [ ] Add action buttons to `renderProcedureCard()`
  - Conditional rendering based on status
  - iPad-friendly sizing (44px min)
  - Button group layout
- [ ] Add "Add Procedure" button to Upcoming section
- [ ] Add loading states during actions
- [ ] Add error handling with Toast notifications
- [ ] Reload procedures after successful action

#### 4. Styling & Responsiveness
- [ ] Action buttons: min 44px height (iPad-friendly)
- [ ] Responsive button layout (stack on mobile)
- [ ] Disabled state for completed/cancelled
- [ ] Loading indicators during API calls
- [ ] Success/error toast notifications

---

## 🚨 BUSINESS RULES

### Status Transition Rules (from backend)
```
planned → in_progress ✅
planned → cancelled ✅
in_progress → completed ✅
in_progress → cancelled ✅
completed → (terminal) ❌
cancelled → (terminal) ❌
```

### Action Availability
- **Complete**: Only for `planned`, `in_progress`
- **Cancel**: Only for `planned`, `in_progress`
- **Reschedule**: Only for `planned`, `in_progress`
- **No actions**: For `completed`, `cancelled`

### User Permissions
- **Doctor**: Full access to their patients' procedures
- **Admin**: Full access to all procedures
- **Others**: Read-only (no action buttons shown)

---

## 🔧 COMPONENT STRUCTURE

```typescript
ProcedureSchedule.tsx
├── State Management
│   ├── procedures (existing)
│   ├── loading (existing)
│   ├── error (existing)
│   ├── rescheduleDialogOpen (new)
│   ├── addProcedureDialogOpen (new)
│   └── selectedProcedure (new)
│
├── Handlers
│   ├── handleComplete (new)
│   ├── handleCancel (new)
│   ├── handleReschedule (new)
│   ├── handleAddProcedure (new)
│   └── loadProcedures (existing)
│
└── Components
    ├── Add Procedure Button (new)
    ├── Procedure Cards with Actions (enhanced)
    ├── RescheduleProcedureDialog (new)
    └── AddProcedureDialog (new)
```

---

## ✅ ACCEPTANCE CRITERIA

1. **Action Buttons Display**
   - [ ] Buttons visible on upcoming/planned procedures
   - [ ] No buttons on completed/cancelled procedures
   - [ ] Buttons are iPad-friendly (44px min height)
   - [ ] Responsive layout on mobile/tablet/desktop

2. **Complete Action**
   - [ ] Confirmation dialog before completing
   - [ ] Updates status to "completed"
   - [ ] Sets completed_date to today
   - [ ] Moves to "Completed" section
   - [ ] Shows success toast

3. **Cancel Action**
   - [ ] Confirmation dialog before cancelling
   - [ ] Updates status to "cancelled"
   - [ ] Moves to "Cancelled" section
   - [ ] Shows success toast

4. **Reschedule Action**
   - [ ] Opens date picker dialog
   - [ ] Updates procedure_date
   - [ ] Stays in "Upcoming" section
   - [ ] Shows success toast

5. **Add Procedure**
   - [ ] Button at top of "Upcoming" section
   - [ ] Opens procedure creation dialog
   - [ ] Pre-fills patient information
   - [ ] Creates procedure successfully
   - [ ] Appears in "Upcoming" section
   - [ ] Shows success toast

6. **Error Handling**
   - [ ] Network errors shown in toast
   - [ ] Validation errors shown in toast
   - [ ] Loading states during API calls

7. **User Experience**
   - [ ] Fast, responsive interactions
   - [ ] Clear visual feedback
   - [ ] No page reload needed
   - [ ] Smooth transitions

---

## 🧪 TESTING CHECKLIST

- [ ] Complete a planned procedure
- [ ] Complete an in-progress procedure
- [ ] Cancel a planned procedure
- [ ] Cancel an in-progress procedure
- [ ] Reschedule a planned procedure
- [ ] Add a new procedure
- [ ] Test on iPad Safari
- [ ] Test responsive layout (mobile/tablet/desktop)
- [ ] Test error scenarios (network failure, validation errors)
- [ ] Test with doctor role
- [ ] Test with admin role

---

## 📊 ESTIMATED EFFORT

- **Frontend**: 4-6 hours
  - dentalService.ts updates: 30 min
  - Dialog components: 2 hours
  - ProcedureSchedule.tsx enhancements: 2-3 hours
  - Testing: 1 hour
- **Backend**: 0 hours (already complete!)
- **Total**: 4-6 hours

---

## 🎯 NEXT STEPS

1. User approval of this plan
2. Implement frontend changes
3. Test thoroughly on iPad
4. Deploy to development branch
5. User acceptance testing

---

**Status**: ⏳ Awaiting Approval
**Priority**: High (user-requested feature)
**Dependencies**: None (backend ready)
