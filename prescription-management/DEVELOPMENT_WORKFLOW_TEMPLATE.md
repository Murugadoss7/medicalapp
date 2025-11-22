# Development Workflow Template
**Project**: Prescription Management System Frontend
**Purpose**: Standardized development workflow for consistent phase execution
**Created**: October 31, 2025

---

## 🚀 `/execute-next-phase` Workflow Template

### **Phase Execution Checklist**

#### **Step 1: Context Reading & Planning** 📚
- [ ] Read `CLAUDE.md` for development guidelines and critical rules
- [ ] Read `PROJECT_ARCHITECTURE.md` for folder structure compliance
- [ ] Read `API_REFERENCE_GUIDE.md` for available endpoints
- [ ] Read `FRONTEND_DEVELOPMENT_PLAN.md` for phase specifications
- [ ] Read `development_frontend.md` for current status
- [ ] Search existing codebase with `Grep`/`Glob` to avoid duplicates
- [ ] Verify API endpoints exist in backend before integration

#### **Step 2: Phase Planning & Todo Creation** 📋
- [ ] Update `TodoWrite` with specific phase tasks
- [ ] Break down phase into 5-10 actionable tasks
- [ ] Mark first task as `in_progress`
- [ ] Identify dependencies and prerequisites

#### **Step 3: Development Implementation** 🛠️
- [ ] Follow PROJECT_ARCHITECTURE.md folder structure exactly
- [ ] Create TypeScript interfaces first (in `store/api.ts`)
- [ ] Extend API endpoints with proper RTK Query integration
- [ ] Create reusable components in appropriate folders
- [ ] Implement main page/feature with real API integration
- [ ] Add proper loading states and error handling
- [ ] Ensure responsive design with Material-UI breakpoints
- [ ] Add proper TypeScript types and interfaces

#### **Step 4: Testing & Validation** ✅
- [ ] Test development server runs without errors (`npm run dev`)
- [ ] Test API integration with backend endpoints
- [ ] Verify responsive design on different screen sizes
- [ ] Test error handling scenarios
- [ ] Test loading states functionality
- [ ] Verify navigation and routing works correctly
- [ ] Check console for any TypeScript or runtime errors

#### **Step 5: Documentation Updates** 📝
- [ ] Update `development_frontend.md` with completed tasks
- [ ] Mark todos as `completed` in TodoWrite
- [ ] Update file count and technical details
- [ ] Add code metrics (lines added, components created)
- [ ] Document new dependencies added
- [ ] Update overall progress percentage
- [ ] Add next phase planning section

#### **Step 6: Next Phase Preparation** 🎯
- [ ] Identify next phase from FRONTEND_DEVELOPMENT_PLAN.md
- [ ] Research required APIs for next phase
- [ ] Plan component architecture for next phase
- [ ] Create placeholder todos for next phase
- [ ] Await user approval for next phase execution

---

## 📋 Standard Phase Execution Template

### **Pre-Execution Requirements:**
```bash
# Required Documentation Reading:
1. CLAUDE.md - Development guidelines
2. PROJECT_ARCHITECTURE.md - Folder structure
3. API_REFERENCE_GUIDE.md - Available endpoints  
4. FRONTEND_DEVELOPMENT_PLAN.md - Phase specifications
5. development_frontend.md - Current status

# Required Code Searches:
grep -r "function_name" src/  # Check for existing functions
grep -r "ComponentName" src/ # Check for existing components
grep -r "endpoint" src/store/ # Check for existing API endpoints
```

### **Implementation Standards:**
```typescript
// 1. Always create TypeScript interfaces first
export interface NewFeatureData {
  id: string;
  // ... proper field mappings from ERD
}

// 2. Extend API with RTK Query
export const api = createApi({
  endpoints: (builder) => ({
    getNewFeatureData: builder.query<NewFeatureData[], void>({
      query: () => '/api/endpoint',
      providesTags: ['NewFeature'],
    }),
  }),
});

// 3. Create reusable components
export const NewFeatureComponent = ({ 
  data, 
  loading = false,
  onAction
}: NewFeatureProps) => {
  // Proper loading states, error handling, responsive design
};
```

### **File Creation Pattern:**
```
src/
├── components/
│   └── feature-name/
│       ├── ComponentName.tsx      # Reusable components
│       └── index.ts               # Export barrel
├── pages/
│   └── feature-name/
│       └── FeaturePage.tsx        # Main feature page
└── store/
    └── api.ts                     # Extended API endpoints
```

---

## 🔄 Phase-Specific Templates

### **Phase 2.2: Appointment Management Template**
```typescript
// Expected Implementation:
1. Components to Create:
   - components/appointments/AppointmentCalendar.tsx
   - components/appointments/AppointmentList.tsx
   - components/appointments/AppointmentFilters.tsx
   - components/appointments/AppointmentCard.tsx

2. API Endpoints to Add:
   - getAppointmentsByDate
   - getAppointmentsByStatus
   - updateAppointmentStatus
   - getAppointmentDetails

3. Pages to Enhance:
   - pages/doctor/DoctorAppointments.tsx

4. Features to Implement:
   - Calendar view with navigation
   - List view with filtering
   - Status management
   - Search functionality
```

### **Phase 2.3: Patient Consultation Template**
```typescript
// Expected Implementation:
1. Components to Create:
   - components/consultation/PatientHeader.tsx
   - components/consultation/MedicalHistory.tsx
   - components/consultation/ConsultationForm.tsx
   - components/consultation/PrescriptionBuilder.tsx

2. API Endpoints to Add:
   - getPatientMedicalHistory
   - createConsultation
   - updateConsultation
   - createPrescription

3. Pages to Enhance:
   - pages/doctor/PatientConsultation.tsx

4. Features to Implement:
   - Patient info display
   - Progressive medical history loading
   - Consultation form with validation
   - Basic prescription builder
```

---

## ✅ Success Criteria Checklist

### **Technical Requirements:**
- [ ] No TypeScript compilation errors
- [ ] No console errors in browser
- [ ] All API endpoints return proper data
- [ ] Loading states work correctly
- [ ] Error handling displays user-friendly messages
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] Navigation between pages works correctly
- [ ] State management updates properly

### **Code Quality Requirements:**
- [ ] Follows PROJECT_ARCHITECTURE.md folder structure
- [ ] Uses consistent naming conventions
- [ ] Proper TypeScript types for all props and data
- [ ] Reusable components are properly structured
- [ ] Material-UI theme is used consistently
- [ ] Proper error boundaries and loading states
- [ ] No duplicate code or functions

### **Documentation Requirements:**
- [ ] development_frontend.md updated with new phase completion
- [ ] Technical implementation details documented
- [ ] File creation list updated
- [ ] Code metrics recorded
- [ ] Next phase planning completed
- [ ] All todos marked as completed

---

## 🎯 Quick Reference Commands

### **Start Phase Execution:**
```bash
# 1. Read all documentation
# 2. Create todos for phase tasks  
# 3. Search existing codebase
# 4. Implement following PROJECT_ARCHITECTURE.md
# 5. Test implementation
# 6. Update documentation
# 7. Plan next phase
```

### **Standard Implementation Order:**
1. **Types & Interfaces** → `store/api.ts`
2. **API Endpoints** → `store/api.ts` 
3. **Reusable Components** → `components/feature/`
4. **Main Page Implementation** → `pages/feature/`
5. **Integration Testing** → Browser testing
6. **Documentation Update** → `development_frontend.md`

---

**📝 Usage**: Copy this workflow for each new phase execution. Follow steps 1-6 in sequence for consistent development quality and documentation.