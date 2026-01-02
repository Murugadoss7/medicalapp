# Root Causes Found for Both Issues ✅

## Issue #1: Procedures Not Showing in Saved Observations Panel ❌

### Root Cause:
**File:** `DentalConsultation.tsx`

Procedures are added to frontend state when created (line 1159), but:
- NOT fetched from backend when page reloads
- `loadDentalChart()` only loads tooth chart data, not full observations
- SavedObservationsPanel displays from frontend state only

**Solution:** Frontend needs to fetch full observation data from backend, which NOW includes procedures (we added the schema field!).

---

## Issue #2: Sarah Not Showing in Treatment Page ❌

### Root Cause #1: Base Query Only Includes Patients with Appointments
**File:** `treatment_service.py` - Lines 56-63

```python
# Base query: Get distinct patients who have appointments
base_query = db.query(Patient).join(
    Appointment,  # ❌ ONLY PATIENTS WITH APPOINTMENTS!
    ...
)
```

**Problem:** If Sarah has observations/procedures but NO appointment, she's excluded!

---

### Root Cause #2: Procedure Query Only Finds Appointment-Linked Procedures
**File:** `treatment_service.py` - Lines 182-191

```python
proc_query = db.query(DentalProcedure).join(
    Appointment,
    DentalProcedure.appointment_id == Appointment.id  # ❌ ONLY appointment_id!
).filter(...)
```

**Problem:** Sarah's procedures have `observation_id` but NOT `appointment_id`, so they're not counted!

---

## Fixes Needed:

### Fix #1 (Issue #2 - Treatment Listing):
Modify `treatment_service.py` to:
1. Include patients who have appointments OR observations OR procedures
2. Count procedures with `observation_id` OR `appointment_id`

### Fix #2 (Issue #1 - Procedures Display):
Modify frontend to fetch full observation data from backend after save.

---

**Priority:** Fix Issue #2 first (backend) - more critical
**Date:** 2025-12-29
