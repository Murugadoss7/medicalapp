# Execute Next Phase Command Reference
**Quick Reference for Automated Phase Development**

---

## 🚀 EXECUTE NEXT PHASE WORKFLOW

### **Phase 2.3: Patient Consultation - READY TO EXECUTE**

#### **📚 STEP 1: Context Reading (REQUIRED FIRST)**
```bash
# Read these files in order:
1. CLAUDE.md                    # Development guidelines & rules
2. PROJECT_ARCHITECTURE.md      # Folder structure requirements  
3. API_REFERENCE_GUIDE.md       # Available backend endpoints
4. FRONTEND_DEVELOPMENT_PLAN.md # Phase 2.3 specifications (consultation workflow)
5. development_frontend.md      # Current status & next steps
6. ENTITY_RELATIONSHIP_DIAGRAM.md # Patient and consultation data models
```

#### **🔍 STEP 2: Codebase Research (AVOID DUPLICATES)**
```bash
# Search existing code:
grep -r "consultation\|Consultation" src/
grep -r "PatientConsultation\|ConsultationForm" src/
grep -r "prescription.*builder\|PrescriptionBuilder" src/
grep -r "/consultation/" src/
grep -r "medical.*history\|MedicalHistory" src/
```

#### **📋 STEP 3: Create Phase 2.3 Todos**
```typescript
// TodoWrite tasks for Phase 2.3:
[
  "Research consultation and prescription APIs in backend",
  "Create consultation workflow layout and navigation",
  "Build patient information display component",
  "Implement medical history progressive loading",
  "Create basic prescription builder interface",
  "Add consultation notes and documentation forms",
  "Implement consultation completion workflow",
  "Update PatientConsultation page with full functionality",
  "Test consultation workflow end-to-end",
  "Update documentation with Phase 2.3 completion"
]
```

#### **🛠️ STEP 4: Implementation Sequence**
```bash
# Follow this exact order:
1. Extend store/api.ts with consultation and prescription endpoints
2. Create components/consultation/ folder
3. Create PatientInfoPanel.tsx component
4. Create MedicalHistoryLoader.tsx component
5. Create PrescriptionBuilder.tsx component
6. Create ConsultationNotes.tsx component
7. Update pages/doctor/PatientConsultation.tsx
8. Test consultation workflow end-to-end
9. Update development_frontend.md
```

#### **📁 STEP 5: Required File Structure**
```
src/
├── components/
│   └── consultation/           # NEW FOLDER
│       ├── PatientInfoPanel.tsx
│       ├── MedicalHistoryLoader.tsx
│       ├── PrescriptionBuilder.tsx
│       ├── ConsultationNotes.tsx
│       ├── ConsultationWorkflow.tsx
│       └── index.ts
├── pages/
│   └── doctor/
│       └── PatientConsultation.tsx  # ENHANCE EXISTING
└── store/
    └── api.ts                       # EXTEND EXISTING
```

#### **🔗 STEP 6: API Endpoints to Implement**
```typescript
// Add to store/api.ts:
getPatientByAppointment: builder.query<PatientDetails, string>
getPatientMedicalHistory: builder.query<MedicalHistory[], {
  patientId: string;
  limit?: number;
}>
createPrescription: builder.mutation<Prescription, {
  appointmentId: string;
  patientId: string;
  prescriptionData: PrescriptionForm;
}>
addPrescriptionItem: builder.mutation<PrescriptionItem, {
  prescriptionId: string;
  itemData: PrescriptionItemForm;
}>
updateConsultationNotes: builder.mutation<Consultation, {
  appointmentId: string;
  notes: string;
  diagnosis: string;
}>
completeConsultation: builder.mutation<Appointment, {
  appointmentId: string;
  consultationData: ConsultationCompleteForm;
}>
```

#### **✅ STEP 7: Testing Checklist**
```bash
# Test these features:
- [ ] Patient information loads correctly for appointment
- [ ] Medical history displays with progressive loading
- [ ] Prescription builder allows adding/editing/removing items
- [ ] Consultation notes can be saved and updated
- [ ] Diagnosis field is properly validated
- [ ] Consultation completion workflow functions
- [ ] Prescription generation works correctly
- [ ] Loading states display properly throughout workflow
- [ ] Error handling works for all API failures
- [ ] Responsive design works on all devices
- [ ] Navigation between consultation steps works
- [ ] Form validation prevents invalid submissions
```

#### **📝 STEP 8: Documentation Update**
```bash
# Update development_frontend.md:
- [ ] Mark Phase 2.3 as completed
- [ ] Add technical implementation details
- [ ] Update file count and code metrics
- [ ] Add consultation component descriptions
- [ ] Document API endpoints added
- [ ] Update overall progress percentage to 45%
- [ ] Add Phase 3 (Patient Management) as next ready phase
```

---

## 🎯 EXECUTE COMMAND SUMMARY

**To execute Phase 2.3 Patient Consultation:**

1. **READ**: All documentation files (CLAUDE.md, PROJECT_ARCHITECTURE.md, etc.)
2. **SEARCH**: Existing codebase to avoid duplicates  
3. **PLAN**: Create TodoWrite with 8-10 specific tasks
4. **BUILD**: Follow implementation sequence exactly
5. **TEST**: Complete testing checklist
6. **DOCUMENT**: Update all progress documentation in development_frontend.md

**Expected Completion Time**: 3-4 hours
**Files to Create**: 6-7 new files
**Lines of Code**: ~800-1000 lines  
**API Endpoints**: 6-7 new endpoints

---

## 🚨 CRITICAL REMINDERS

- **ALWAYS** read CLAUDE.md first for development rules
- **NEVER** create files outside PROJECT_ARCHITECTURE.md structure
- **ALWAYS** search existing code before creating new functions
- **ALWAYS** verify API endpoints exist in API_REFERENCE_GUIDE.md
- **ALWAYS** update todos as completed throughout development
- **ALWAYS** update development_frontend.md with completion details

---

**Ready to execute? Confirm and we'll begin Phase 2.3 Patient Consultation development.**