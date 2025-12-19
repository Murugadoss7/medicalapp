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
- **Lunch Time**: Configurable lunch break for each doctor duration 1 hour
- **Availability**: Set during doctor registration by doctor/admin. 

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