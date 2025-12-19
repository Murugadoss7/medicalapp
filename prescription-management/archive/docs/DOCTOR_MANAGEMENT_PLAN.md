# Doctor Management Implementation Plan

**Created**: November 2, 2025  
**Purpose**: Complete implementation plan for doctor CRUD module following established patterns  
**Status**: Ready for Implementation  

---

## 📋 Analysis Summary

### ✅ **Existing Backend API** (Already Implemented)
- **POST** `/doctors/` - Create doctor profile (admin only)
- **GET** `/doctors/` - List doctors with filters and pagination  
- **GET** `/doctors/{doctor_id}` - Get doctor by ID
- **PUT** `/doctors/{doctor_id}` - Update doctor profile
- **DELETE** `/doctors/{doctor_id}` - Delete doctor (admin only)
- **GET** `/doctors/profile/user/{user_id}` - Get doctor by user ID
- **GET** `/doctors/statistics/overview` - Doctor statistics

### ✅ **Existing Schemas & Models**
- **DoctorCreate**: For creating new doctor profiles
- **DoctorUpdate**: For updating existing doctors  
- **DoctorResponse**: For API responses
- **DoctorListResponse**: For paginated lists
- **Doctor Model**: Database entity with all fields

### 📋 **Missing Frontend Implementation**
- Doctor management pages (create/edit/view/list)
- Frontend API integration
- Route configuration
- User interface components

---

## 🚀 Implementation Plan

## **Phase 1: API Integration**

### **1.1 Update Frontend API Store**
```typescript
// File: /frontend/src/store/api.ts
// Add comprehensive doctor management endpoints

export interface DoctorCreate {
  user_id: string;
  license_number: string;
  specialization?: string;
  qualification?: string;
  experience_years?: number;
  clinic_address?: string;
  phone?: string;
  consultation_fee?: string;
  consultation_duration?: number;
  availability_schedule?: Record<string, Array<{ start: string; end: string }>>;
}

export interface DoctorUpdate {
  license_number?: string;
  specialization?: string;
  qualification?: string;
  experience_years?: number;
  clinic_address?: string;
  phone?: string;
  consultation_fee?: string;
  consultation_duration?: number;
  availability_schedule?: Record<string, Array<{ start: string; end: string }>>;
  is_active?: boolean;
}

export interface DoctorListResponse {
  doctors: Doctor[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface DoctorSearchParams {
  query?: string;           // Search by name or license
  specialization?: string;  // Filter by specialization
  min_experience?: number; // Minimum experience years
  is_active?: boolean;     // Filter by active status  
  page?: number;           // Page number
  per_page?: number;       // Items per page
}

// API endpoints
createDoctor: builder.mutation<Doctor, DoctorCreate>({
  query: (doctorData) => ({
    url: '/doctors/',
    method: 'POST',
    body: doctorData,
  }),
  invalidatesTags: ['Doctor'],
}),

listDoctors: builder.query<DoctorListResponse, DoctorSearchParams>({
  query: (params) => ({
    url: '/doctors/',
    params,
  }),
  providesTags: ['Doctor'],
}),

getDoctorById: builder.query<Doctor, string>({
  query: (doctorId) => `/doctors/${doctorId}`,
  providesTags: ['Doctor'],
}),

updateDoctor: builder.mutation<Doctor, { doctorId: string; doctorData: DoctorUpdate }>({
  query: ({ doctorId, doctorData }) => ({
    url: `/doctors/${doctorId}`,
    method: 'PUT',
    body: doctorData,
  }),
  invalidatesTags: ['Doctor'],
}),

deleteDoctor: builder.mutation<void, string>({
  query: (doctorId) => ({
    url: `/doctors/${doctorId}`,
    method: 'DELETE',
  }),
  invalidatesTags: ['Doctor'],
}),
```

---

## **Phase 2: UI Components**

### **2.1 Doctor Registration Component**
```typescript
// File: /frontend/src/pages/doctors/DoctorRegistration.tsx
// Multi-step form similar to PatientRegistration

interface DoctorFormData {
  // Basic Information
  user_id: string;
  license_number: string;
  specialization: string;
  qualification: string;
  experience_years: number;
  
  // Contact Information  
  clinic_address: string;
  phone: string;
  consultation_fee: string;
  consultation_duration: number;
  
  // Schedule Information
  availability_schedule: WeeklySchedule;
}

interface WeeklySchedule {
  monday: TimeSlot[];
  tuesday: TimeSlot[];
  wednesday: TimeSlot[];
  thursday: TimeSlot[];
  friday: TimeSlot[];
  saturday: TimeSlot[];
  sunday: TimeSlot[];
}

interface TimeSlot {
  start: string;  // HH:MM format
  end: string;    // HH:MM format
}

// 3-Step Registration Process:
// Step 1: Basic Doctor Information
// Step 2: Contact & Professional Details  
// Step 3: Availability Schedule
```

### **2.2 Doctor Search & List Component**
```typescript
// File: /frontend/src/pages/doctors/DoctorSearch.tsx
// Similar to PatientSearch but with doctor-specific filters

interface DoctorFilters {
  searchTerm: string;
  specialization: string;
  minExperience: number;
  isActive: boolean;
  sortBy: 'name' | 'specialization' | 'experience';
  sortOrder: 'asc' | 'desc';
}

// Features:
// - Real-time search by name/license
// - Filter by specialization dropdown
// - Experience years slider  
// - Active/inactive toggle
// - Grid/List view toggle
// - Pagination with page size options
```

### **2.3 Doctor Profile View**
```typescript
// File: /frontend/src/pages/doctors/DoctorView.tsx
// Detailed doctor profile similar to FamilyView

// Features:
// - Complete doctor information display
// - Schedule visualization (weekly calendar)
// - Statistics (total patients, appointments)
// - Edit button (role-based access)
// - Delete button (admin only)
// - Appointment booking integration
```

---

## **Phase 3: Form Components**

### **3.1 Doctor Information Form**
```typescript
// File: /frontend/src/components/doctors/DoctorInfoForm.tsx

// Fields with validation:
// - User ID selection (dropdown of doctor-role users)
// - License number (required, unique validation)
// - Specialization (dropdown with common specializations)
// - Qualification (rich text editor)
// - Experience years (number input with validation)
// - Phone (with standardized phone validation)
// - Consultation fee (currency input)
// - Consultation duration (dropdown: 15, 30, 45, 60 minutes)
```

### **3.2 Schedule Management Form**
```typescript
// File: /frontend/src/components/doctors/ScheduleForm.tsx

// Features:
// - Weekly calendar grid
// - Add/remove time slots per day
// - Time slot validation (no overlaps)
// - Copy schedule between days
// - Standard time templates (9-5, flexible, etc.)
// - Holiday/break management
```

---

## **Phase 4: Integration & Navigation**

### **4.1 Route Configuration**
```typescript
// File: /frontend/src/App.tsx or router config

// Add routes:
// - /doctors - Doctor list/search page
// - /doctors/register - Doctor registration
// - /doctors/:doctorId - Doctor profile view
// - /doctors/:doctorId/edit - Doctor edit form
```

### **4.2 Navigation Updates**
```typescript
// File: /frontend/src/components/layout/Navigation.tsx

// Add doctor management links:
// - "Doctor Management" in admin menu
// - "All Doctors" for viewing
// - "Register Doctor" for admins
// - Quick access to own profile for doctors
```

---

## **Phase 5: Role-Based Access Control**

### **5.1 Permission Matrix**
| **Role** | **View Doctors** | **Create Doctor** | **Edit Doctor** | **Delete Doctor** |
|----------|------------------|-------------------|-----------------|-------------------|
| **Admin** | ✅ All | ✅ Yes | ✅ All | ✅ Yes |
| **Doctor** | ✅ All | ❌ No | ✅ Own Profile | ❌ No |
| **Staff** | ✅ Active | ❌ No | ❌ No | ❌ No |
| **Patient** | ✅ Active | ❌ No | ❌ No | ❌ No |

### **5.2 UI Access Control**
```typescript
// Example access control implementation
const canCreateDoctor = user?.role === 'admin';
const canEditDoctor = user?.role === 'admin' || 
  (user?.role === 'doctor' && doctor.user_id === user.id);
const canDeleteDoctor = user?.role === 'admin';

// Conditional rendering
{canCreateDoctor && <CreateDoctorButton />}
{canEditDoctor && <EditDoctorButton />}
{canDeleteDoctor && <DeleteDoctorButton />}
```

---

## **Phase 6: Validation & Standards**

### **6.1 Apply Date Standardization**
```typescript
// Use StandardDatePicker for any date inputs
// Apply standardized phone validation
// Use consistent form validation patterns
// Follow established UI component patterns
```

### **6.2 Validation Rules**
```typescript
interface DoctorValidationRules {
  license_number: {
    required: true;
    minLength: 5;
    pattern: /^[A-Z0-9-]+$/; // Alphanumeric with hyphens
  };
  experience_years: {
    min: 0;
    max: 70;
  };
  consultation_duration: {
    options: [15, 30, 45, 60]; // Standard durations
  };
  phone: {
    pattern: /^[6-9]\d{9}$/; // Indian mobile format
  };
}
```

---

## **🎯 Implementation Timeline**

| **Phase** | **Tasks** | **Estimated Time** | **Dependencies** |
|-----------|-----------|-------------------|------------------|
| **Phase 1** | API integration & TypeScript interfaces | 2-3 hours | Existing API |
| **Phase 2** | Core UI components (Register/Search/View) | 6-8 hours | Phase 1 |
| **Phase 3** | Form components & validation | 4-5 hours | Phase 2 |
| **Phase 4** | Navigation & routing | 1-2 hours | Phase 3 |
| **Phase 5** | Role-based access control | 2-3 hours | Phase 4 |
| **Phase 6** | Testing & validation | 2-3 hours | Phase 5 |
| **Total** | **Complete doctor management** | **17-24 hours** | All phases |

---

## **📋 Quality Standards**

### **🎯 UI/UX Consistency**
- Follow Material-UI design patterns from patient management
- Use StandardDatePicker for any date inputs
- Consistent form layout and validation
- Responsive design for mobile/desktop
- Loading states and error handling

### **🔒 Security & Validation**
- Role-based access control throughout
- Input validation and sanitization  
- Secure API endpoints with authentication
- No sensitive data in client state

### **📊 Performance**
- Lazy loading for large doctor lists
- Efficient pagination and filtering
- Optimistic updates for better UX
- Proper caching with RTK Query

---

## **🚀 Ready for Execution**

### **Next Steps:**
1. ✅ Plan created and reviewed
2. 🔄 Start with Phase 1: API integration
3. 🔄 Build components following patient management patterns
4. 🔄 Test thoroughly before deployment

### **Success Criteria:**
- ✅ Complete CRUD operations for doctors
- ✅ Role-based access control implemented  
- ✅ Consistent UI/UX with existing patterns
- ✅ Comprehensive validation and error handling
- ✅ Mobile-responsive design
- ✅ Integration with appointment booking system

**This plan ensures a complete, consistent, and secure doctor management module following all established patterns and standards.**