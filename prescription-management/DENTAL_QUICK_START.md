# Dental Module - Quick Start Guide

## ✅ Setup Complete

The dental consultation module is now fully integrated into your system!

---

## 🚀 Quick Access

**URL:** `http://localhost:5173/appointments/:appointmentId/dental`

**Example:** `http://localhost:5173/appointments/abc123-def456/dental`

---

## 📦 Dependencies Installed

✅ `axios` - HTTP client for API calls
✅ `date-fns` - Date formatting (already installed)
✅ `@mui/material` - Material-UI core components
✅ `@mui/lab` - Material-UI lab components (Timeline)
✅ `@mui/x-date-pickers` - Date picker components
✅ React Router for navigation

---

## 🎯 How to Use

### 1. Navigate to Dental Consultation
```
From appointment page → Click appointment → Navigate to dental consultation
OR
Direct URL: /appointments/{appointmentId}/dental
```

### 2. Using the Dental Chart
- **Click on a tooth** to select it
- Selected tooth will be highlighted in blue
- Action buttons appear after selection

### 3. Add Observation
1. Select a tooth from the chart
2. Click "Add Observation" button
3. Fill in the form:
   - Tooth number (auto-filled)
   - Tooth surface (optional)
   - Condition type (required)
   - Severity (optional)
   - Notes (optional)
   - Treatment status
4. Click "Save Observation"

### 4. Add Procedure
1. Select a tooth from the chart
2. Click "Add Procedure" button
3. Choose from pre-configured CDT procedures or create custom
4. Fill in details:
   - Procedure code and name
   - Tooth numbers (can be multiple)
   - Cost estimates
   - Duration
   - Status
   - Notes
5. Click "Save Procedure"

### 5. View Tooth History
1. Select a tooth from the chart
2. Click "View History" button
3. See complete timeline of all observations and treatments

---

## 🔧 Available Features

### Dental Chart
- ✅ 32 permanent teeth (adult)
- ✅ 20 primary teeth (children)
- ✅ Color-coded status indicators
- ✅ Interactive tooth selection
- ✅ Hover tooltips with details

### Condition Types (14 options)
- Cavity
- Decay
- Fracture
- Missing
- Filling
- Crown
- Root Canal
- Abscess
- Gum Disease
- Plaque
- Calculus
- Stain
- Mobility
- Other

### Tooth Surfaces (7 options)
- Occlusal (chewing surface)
- Mesial (toward midline)
- Distal (away from midline)
- Buccal (cheek side)
- Lingual (tongue side)
- Palatal (roof of mouth)
- Incisal (biting edge)

### CDT Procedures (20+ pre-configured)
- D0120 - Periodic Oral Evaluation
- D0140 - Limited Oral Evaluation
- D1110 - Prophylaxis - Adult
- D2140 - Amalgam - One Surface
- D2740 - Crown - Porcelain/Ceramic
- D3310 - Root Canal - Anterior
- D7140 - Extraction - Erupted Tooth
- And many more...

---

## 🗄️ Database Tables

### dental_observations
Stores tooth-level observations with:
- FDI tooth numbering
- Condition types and severity
- Treatment status tracking
- Links to appointments and prescriptions

### dental_procedures
Stores dental procedures with:
- CDT procedure codes
- Cost tracking (estimated/actual)
- Status workflow management
- Duration and completion dates

---

## 🔌 API Endpoints

All endpoints are available at: `http://localhost:8000/api/v1/dental/`

### Observations
- POST `/observations` - Create observation
- GET `/observations/{id}` - Get by ID
- PUT `/observations/{id}` - Update
- DELETE `/observations/{id}` - Delete
- GET `/observations/patient/{mobile}/{name}` - Get patient observations
- GET `/observations/tooth/{mobile}/{name}/{tooth}` - Get tooth history

### Procedures
- POST `/procedures` - Create procedure
- GET `/procedures/{id}` - Get by ID
- PUT `/procedures/{id}` - Update
- PUT `/procedures/{id}/status` - Update status
- DELETE `/procedures/{id}` - Delete

### Chart
- GET `/chart/{mobile}/{name}` - Get complete dental chart
- GET `/statistics` - Get dental statistics

---

## 🎨 Color Coding

The dental chart uses color coding to show tooth status:

| Color | Meaning |
|-------|---------|
| 🔴 Red | Active issues requiring treatment |
| 🟠 Orange | Observations recorded, no procedure |
| 🟢 Green | Treatment completed |
| 🔵 Blue | Data recorded, no issues |
| ⚪ Grey | Healthy, no data |

---

## 🦷 FDI Notation Reference

### Permanent Teeth (32 total)
```
Upper Right (Q1): 18 17 16 15 14 13 12 11
Upper Left  (Q2): 21 22 23 24 25 26 27 28
Lower Left  (Q3): 31 32 33 34 35 36 37 38
Lower Right (Q4): 48 47 46 45 44 43 42 41
```

### Primary Teeth (20 total)
```
Upper Right (Q5): 55 54 53 52 51
Upper Left  (Q6): 61 62 63 64 65
Lower Left  (Q7): 71 72 73 74 75
Lower Right (Q8): 85 84 83 82 81
```

---

## 🐛 Troubleshooting

### Frontend not loading?
```bash
cd frontend
npm install  # Reinstall dependencies
npm run dev  # Restart dev server
```

### Backend errors?
```bash
cd backend
# Check if dental tables exist
python create_dental_tables.py
```

### Can't see dental route?
- Clear browser cache
- Check that you're logged in
- Verify URL: `/appointments/:appointmentId/dental`

---

## ✅ Integration Complete

The dental module is now fully integrated with appointments:
1. ✅ "Dental" button added to AppointmentCard component
2. ✅ Button navigates to: `/appointments/{appointmentId}/dental`
3. ✅ Patient data automatically loaded from appointment details

---

## 💡 Tips

1. **Always select a tooth first** before trying to add observations or procedures
2. **Use the bulk operations** for multiple teeth with the same condition
3. **Check tooth history** before adding new observations
4. **Use CDT codes** for standardized procedure recording
5. **Color coding** helps quickly identify teeth needing attention

---

## 📚 Related Documentation

- `DENTAL_MODULE_SUMMARY.md` - Comprehensive implementation summary
- `DENTAL_CONSULTATION_PLAN.md` - Detailed planning and progress
- `API_REFERENCE_GUIDE.md` - Complete API documentation

---

## ✅ Status

- **Backend**: ✅ Complete (18 endpoints)
- **Frontend**: ✅ Complete (5 components)
- **Database**: ✅ Tables created and indexed
- **Routing**: ✅ Route configured
- **Dependencies**: ✅ All installed
- **Integration**: ✅ Appointment workflow integrated
- **Type Safety**: ✅ TypeScript imports fixed

**Ready to use!** 🎉

## 🚀 How to Access

### Option 1: Via Appointment Card (Recommended)
1. Navigate to Appointments page
2. Find any appointment
3. Click the "Dental" button on the appointment card
4. You'll be taken directly to the dental consultation page

### Option 2: Direct URL
Navigate to: `/appointments/{appointmentId}/dental`

Example: `http://localhost:5173/appointments/abc123-def456/dental`
