# Workflow Specifications
## Prescription Management System - Detailed Requirements

---

## 🏥 **Doctor Dashboard Workflow**

### **Medical History Access**
- **Default**: Show last visit details only
- **On Demand**: Click "Load History" → Show past 2 visits
- **Progressive Loading**: Click "Load More" → Show additional visits
- **Privacy**: Doctor sees only specific patient history, not full family

### **Appointment Schedule**
- **Fixed Duration**: 30 minutes per appointment
- **Working Hours**: Monday to Friday, 9 AM to 10 PM
- **Break Time**: 10-minute breaks between appointments
- **Lunch Time**: Configurable lunch break for each doctor
- **Availability**: Set during doctor registration by doctor/admin

### **Procedures Sidebar View** ⭐ NEW (November 30, 2025)
- **Access**: Click "Today's Procedures" card in dashboard
- **Mode Toggle**: Sidebar switches between appointments and procedures view
- **Procedures Display**: Shows procedure name, patient name, tooth numbers, status
- **Return to Appointments**: Click any office location to switch back to appointments
- **API**: `GET /dental/procedures/doctor/{doctor_id}/today` with patient_name from linked appointment

### **Navigation Pattern**
- **Breadcrumb**: Home > Appointments > Patient Details
- **New Page**: Appointment click opens new page (not modal)
- **Back Navigation**: Clear breadcrumb with "Back" option
- **Consistent**: Same navigation pattern for all features

---

## 👨‍👩‍👧‍👦 **Family Appointment Booking**

### **Booking Authority**
- **Self Booking**: Any family member can book for themselves
- **Family Booking**: Any family member can book for other family members
- **Relationship Display**: Show relationship when booking (Parent for Child, etc.)
- **Composite Key**: Use mobile + firstName for all bookings

---

## 📅 **Doctor Schedule Management**

### **Time Slot Configuration**
```
Working Days: Monday - Friday
Working Hours: 9:00 AM - 10:00 PM
Appointment Duration: 30 minutes
Break Between Appointments: 10 minutes
Lunch Break: Configurable (e.g., 1:00 PM - 2:00 PM)

Example Schedule:
09:00 - 09:30: Patient 1
09:40 - 10:10: Patient 2 (10 min break)
10:20 - 10:50: Patient 3
...
01:00 - 02:00: LUNCH BREAK
02:00 - 02:30: Patient N
```

### **Availability Setup**
- **During Registration**: Doctor/Admin sets working days
- **Schedule Patterns**: Weekly recurring schedule
- **Exception Handling**: Holiday/leave management
- **Slot Management**: Block/unblock specific time slots

### **Multiple Office Locations** ⭐ NEW
Doctors can practice at multiple clinic/hospital locations.

**Office Configuration:**
```
Office Structure:
{
  "id": "uuid-string",        // Unique office ID
  "name": "Main Clinic",      // Display name
  "address": "123 Main St",   // Full address
  "is_primary": true          // Primary office flag
}

Example for a doctor with 2 offices:
[
  { "id": "off-001", "name": "Main Clinic", "address": "Downtown", "is_primary": true },
  { "id": "off-002", "name": "Branch Office", "address": "Uptown", "is_primary": false }
]
```

**Office Management Workflow:**
- **During Registration**: Add offices in Step 2 (Clinic Details)
- **First Office**: Automatically marked as primary
- **Edit Office**: Update name/address via Doctor Edit page
- **Add/Remove**: Manage offices through Doctor Profile

**Appointment with Office Selection:**
1. Patient selects doctor
2. If doctor has multiple offices → Show office selection cards
3. If single office or none → Auto-select primary/first
4. Selected `office_id` stored with appointment
5. Dashboard sidebar shows office location for each appointment

---

## 🗂️ **Navigation & UX Specifications**

### **Breadcrumb Pattern**
```
Home > Appointments > [Patient Name] > Prescription
Home > Patients > [Family Group] > [Patient Name]
Home > Medicine > Short Keys > [Short Key Name]
Home > Reports > Daily Schedule > [Date]
```

### **Page Transitions**
- **New Page**: All major actions open new pages
- **Modal/Popup**: Only for confirmations and quick actions
- **Back Button**: Always available with breadcrumb
- **Auto-save**: Draft data saved automatically

---

## 🔐 **Role-Based Workflow Access**

### **Doctor Role**
- Dashboard with today's appointments
- Patient consultation workflow
- Prescription creation/management
- Own schedule viewing
- Medical history access (specific patient only)

### **Admin/Receptionist Role**
- Appointment booking for any patient
- Doctor schedule management
- Patient registration/management
- Reports and analytics
- System configuration

### **Patient Role** (Future)
- Own/family appointment booking
- Own/family medical history
- Prescription downloads
- Appointment rescheduling

---

**✅ Confirmed Requirements Ready for Implementation**