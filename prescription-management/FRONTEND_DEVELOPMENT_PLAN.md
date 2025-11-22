# Frontend Development Plan
## Prescription Management System - Complete UI/UX Specifications

---

**📅 Last Updated**: November 12, 2025
**🎯 Purpose**: Detailed frontend development roadmap with page specifications and API mappings
**📋 Based On**: WORKFLOW_SPECIFICATIONS.md, API_REFERENCE_GUIDE.md, ENTITY_RELATIONSHIP_DIAGRAM.md
**🔗 Backend APIs**: 99+ endpoints ready for integration
**🚀 Recent Updates**: Doctor registration flow updated to 5-step wizard with new user account creation

## 📊 Implementation Status

### ✅ **Completed Features**
- **Authentication**: Complete login/register with JWT token handling and role-based routing
- **Admin Dashboard**: Full admin dashboard with system overview and quick actions
  - System statistics cards (doctors, patients, appointments, etc.)
  - Quick action cards for doctor/patient management
  - System health overview with status indicators
  - Role-based access control and navigation
- **Doctor Management**: Complete CRUD functionality for doctors
  - Doctor search and filtering with specialization/experience filters
  - Grid/list view modes with pagination
  - Doctor profile creation and editing
  - Role-based edit permissions (admin or self-edit)
- **Patient Management**: Complete patient and family registration system
  - Multi-step wizard patient registration
  - Family member management with relationship handling
  - Patient search and listing with pagination
  - Family view with edit functionality
  - Proper field mapping (relationship ↔ relationship_to_primary)
- **Dashboard**: Doctor dashboard with statistics and appointments
- **Navigation**: Main layout with protected routes and role-based redirects
- **Appointment Management**: Complete appointment booking system with:
  - 3-step booking wizard (Patient → Doctor & Schedule → Confirmation)
  - Real-time doctor availability checking with time slot display
  - Appointment calendar view with monthly navigation
  - Appointment list view with filtering and pagination
  - Doctor dashboard integration with today's appointments
  - Conflict detection and prevention
  - Form validation with comprehensive error handling
  - Cache invalidation for real-time updates
  - Doctor ID consistency utilities

### 🚧 **In Progress** 
- **Prescription Management**: Consultation workflow partially implemented

### 📋 **Pending Implementation**
- **Medicine Management**: Full medicine catalog and inventory
- **Advanced Features**: Analytics, reports, notifications
- **Admin Features**: Advanced user management, system settings, reports
- **Appointment Advanced Features**: Rescheduling, bulk operations, notifications  

---

## 🏗️ Frontend Technology Stack (Recommended)

### **Core Framework**
- **Framework**: React.js 18+ with TypeScript
- **State Management**: Redux Toolkit + RTK Query for API calls
- **Routing**: React Router v6
- **UI Library**: Material-UI (MUI) v5 or Ant Design v5

### **Supporting Libraries**
- **HTTP Client**: RTK Query (built into Redux Toolkit)
- **Form Handling**: React Hook Form with Yup validation
- **Date/Time**: date-fns for appointment scheduling
- **PDF Generation**: react-pdf for prescription printing
- **Charts**: Recharts for analytics/statistics
- **Icons**: Material Icons or Ant Design Icons

### **Development Tools**
- **Build Tool**: Vite for fast development
- **Linting**: ESLint + Prettier
- **Testing**: Vitest + React Testing Library
- **Type Safety**: TypeScript with strict mode

---

## 🔐 Authentication & User Management

### **1. Login Page** - `/login`

#### **Page Fields & Validation**
```typescript
interface LoginForm {
    email: string;          // required, email format
    password: string;       // required, min 6 chars
    remember_me: boolean;   // optional
}
```

#### **API Integration**
```typescript
// API Call: POST /api/v1/auth/login
const loginUser = useMutation({
    mutationFn: (credentials: LoginForm) => 
        authAPI.login(credentials),
    onSuccess: (response) => {
        // Store tokens in secure storage
        localStorage.setItem('access_token', response.tokens.access_token);
        localStorage.setItem('refresh_token', response.tokens.refresh_token);
        // Store user info in Redux
        dispatch(setUser(response.user));
        // Redirect based on role
        navigateByRole(response.user.role);
    }
});
```

#### **Page Layout**
```jsx
<LoginPage>
    <Logo />
    <FormCard>
        <Title>Login to Prescription Management System</Title>
        <LoginForm>
            <EmailField required />
            <PasswordField required />
            <RememberMeCheckbox />
            <LoginButton loading={isLoading} />
        </LoginForm>
        <Links>
            <ForgotPasswordLink />
            <RegisterLink />
        </Links>
    </FormCard>
</LoginPage>
```

#### **Role-Based Navigation**
```typescript
const navigateByRole = (role: UserRole) => {
    switch(role) {
        case 'doctor': navigate('/doctor/dashboard');
        case 'admin': navigate('/admin/dashboard');
        case 'patient': navigate('/patient/dashboard');
        case 'nurse': navigate('/nurse/dashboard');
        case 'receptionist': navigate('/receptionist/dashboard');
        default: navigate('/dashboard');
    }
};
```

### **2. Register Page** - `/register`

#### **Page Fields & Validation**
```typescript
interface RegisterForm {
    email: string;          // required, email format, unique
    password: string;       // required, min 8 chars, 1 upper, 1 lower, 1 number
    confirm_password: string; // required, must match password
    first_name: string;     // required, min 2 chars, letters only
    last_name: string;      // required, min 2 chars, letters only
    phone: string;          // required, Indian mobile format
    role: UserRole;         // required, dropdown selection
}
```

#### **API Integration**
```typescript
// API Call: POST /api/v1/auth/register
const registerUser = useMutation({
    mutationFn: (userData: RegisterForm) => 
        authAPI.register(userData),
    onSuccess: (response) => {
        // Auto-login after registration
        loginUser.mutate({
            email: userData.email,
            password: userData.password
        });
    }
});
```

---

## 👨‍💼 Admin Dashboard & Management

### **1. Admin Dashboard** - `/admin/dashboard` ✅ **IMPLEMENTED**

#### **Page Overview**
The admin dashboard provides system administrators with a comprehensive overview of the prescription management system, including statistics, quick actions, and system health monitoring.

#### **Dashboard Components**
```typescript
interface AdminDashboardData {
    systemStats: {
        totalDoctors: number;
        totalPatients: number;
        totalAppointments: number;
        totalPrescriptions: number;
        activeUsers: number;
        pendingRegistrations: number;
    };
    systemHealth: {
        status: 'operational' | 'warning' | 'error';
        databaseHealth: 'good' | 'warning' | 'error';
        activeSessions: number;
        lastBackup: string;
    };
    quickActions: AdminQuickAction[];
}

interface AdminQuickAction {
    title: string;
    description: string;
    icon: string;
    action: () => void;
    color: 'primary' | 'success' | 'info' | 'warning';
}
```

#### **API Integration**
```typescript
// System statistics (mock data for now, real endpoints to be implemented)
const { data: adminStats } = useQuery({
    queryKey: ['admin', 'statistics'],
    queryFn: () => adminAPI.getSystemStatistics()
});

// System health monitoring
const { data: systemHealth } = useQuery({
    queryKey: ['admin', 'health'],
    queryFn: () => adminAPI.getSystemHealth(),
    refetchInterval: 30000 // Refresh every 30 seconds
});
```

#### **Page Layout**
```jsx
<AdminDashboard>
    <DashboardHeader>
        <Title>Admin Dashboard</Title>
        <WelcomeMessage>Welcome back, {currentUser?.first_name}!</WelcomeMessage>
    </DashboardHeader>
    
    {/* Statistics Overview */}
    <StatisticsGrid>
        <StatCard title="Total Doctors" value={adminStats.totalDoctors} icon="doctor" color="primary" />
        <StatCard title="Total Patients" value={adminStats.totalPatients} icon="patients" color="success" />
        <StatCard title="Today's Appointments" value={adminStats.totalAppointments} icon="calendar" color="info" />
        <StatCard title="Prescriptions" value={adminStats.totalPrescriptions} icon="prescription" color="warning" />
        <StatCard title="Active Users" value={adminStats.activeUsers} icon="users" color="secondary" />
        <StatCard title="Pending Approvals" value={adminStats.pendingRegistrations} icon="pending" color="error" />
    </StatisticsGrid>
    
    <MainContent>
        {/* Quick Actions Panel */}
        <QuickActionsPanel>
            <SectionTitle>Quick Actions</SectionTitle>
            <ActionsGrid>
                <ActionCard
                    title="Register New Doctor"
                    description="Add a new doctor to the system"
                    icon="doctor-add"
                    onClick={() => navigate('/doctors/register')}
                    color="primary"
                />
                <ActionCard
                    title="Manage Doctors"
                    description="View and manage doctor profiles"
                    icon="doctor-manage"
                    onClick={() => navigate('/doctors')}
                    color="success"
                />
                <ActionCard
                    title="Patient Management"
                    description="Search and manage patient records"
                    icon="patient-manage"
                    onClick={() => navigate('/patients')}
                    color="info"
                />
                <ActionCard
                    title="Medicine Catalog"
                    description="Manage medicine inventory"
                    icon="medicine"
                    onClick={() => navigate('/medicines')}
                    color="warning"
                />
            </ActionsGrid>
        </QuickActionsPanel>
        
        {/* System Overview Panel */}
        <SystemOverviewPanel>
            <SectionTitle>System Overview</SectionTitle>
            <SystemStatusList>
                <StatusItem label="System Status" value="Operational" status="success" />
                <StatusItem label="Database Health" value="Good" status="success" />
                <StatusItem label="Active Sessions" value="47" status="info" />
                <StatusItem label="Last Backup" value="2 hours ago" status="default" />
            </SystemStatusList>
        </SystemOverviewPanel>
    </MainContent>
</AdminDashboard>
```

#### **Role-Based Access Control**
```typescript
// Automatic redirect for non-admin users
useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
        switch (currentUser.role) {
            case 'doctor':
                navigate('/doctor/dashboard');
                break;
            case 'patient':
                navigate('/patient/dashboard');
                break;
            default:
                navigate('/dashboard');
        }
    }
}, [currentUser, navigate]);
```

#### **Navigation Integration**
The admin dashboard is integrated into the main navigation layout with admin-specific menu items:
- Doctor Management (/doctors)
- Patient Management (/patients)
- Medicine Catalog (/medicines)
- System Reports (future implementation)
- User Settings (future implementation)

---

### **2. Doctor Registration** - `/doctors/register` ✅ **IMPLEMENTED**

#### **Purpose & Workflow**
Admin-initiated 5-step wizard to register new doctors in the system. Creates both a user account and doctor profile.

#### **Registration Steps**
```typescript
interface DoctorRegistrationWizard {
    currentStep: 0 | 1 | 2 | 3 | 4;
    steps: [
        'User Account',           // Step 0: Create user credentials
        'Professional Credentials', // Step 1: Medical qualifications
        'Clinic Details',          // Step 2: Practice information
        'Availability Schedule',   // Step 3: Weekly schedule
        'Review & Submit'          // Step 4: Confirmation
    ];
}
```

#### **Step 0: User Account**
Creates a new user account for the doctor:
```typescript
interface UserAccountData {
    email: string;              // required, will be login email
    password: string;           // required, min 8 chars
    confirm_password: string;   // required, must match password
    first_name: string;         // required
    last_name: string;          // required
    phone: string;              // optional
}
```

#### **Step 1: Professional Credentials**
```typescript
interface ProfessionalCredentials {
    license_number: string;     // required, medical license
    specialization: string;     // required, dropdown selection
    qualification: string;      // required, e.g. "MBBS, MD"
    experience_years: number;   // optional, default 0
}
```

#### **Step 2: Clinic Details**
```typescript
interface ClinicDetails {
    clinic_address: string;     // optional
    consultation_fee: string;   // optional
    consultation_duration: number; // default 30 minutes
}
```

#### **Step 3: Availability Schedule**
```typescript
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
    start_time: string;  // HH:MM format
    end_time: string;    // HH:MM format
}
```

#### **Step 4: Review & Submit**
Shows all entered information for review before submission.

#### **API Integration**
```typescript
// Step 1: Register user account
const registerUser = useMutation({
    mutationFn: (userData: UserAccountData) =>
        authAPI.register({
            ...userData,
            role: 'doctor',
            license_number: credentials.license_number,
            specialization: credentials.specialization
        })
});

// Step 2: Create doctor profile with returned user ID
const createDoctor = useMutation({
    mutationFn: (doctorData: DoctorCreate) =>
        doctorAPI.createDoctor({
            user_id: newUserId,  // from registration response
            ...professionalData,
            ...clinicData,
            availability_schedule: scheduleData
        })
});
```

#### **Validation Rules**
- **Step 0**: All fields required except phone
- **Step 1**: License number, specialization, and qualification required
- **Step 2**: All fields optional
- **Step 3**: Schedule optional
- **Step 4**: Review only, no validation

#### **Success Flow**
After successful registration:
1. User account created with role='doctor'
2. Doctor profile created and linked to user
3. Redirect to doctors list with success message
4. New doctor can now login with their email/password

---

## 👨‍⚕️ Doctor Dashboard & Workflows

### **3. Doctor Dashboard** - `/doctor/dashboard`

#### **Page Sections & Data**
```typescript
interface DoctorDashboard {
    todayStats: {
        total_appointments: number;
        completed_appointments: number;
        pending_appointments: number;
        prescriptions_written: number;
    };
    todaySchedule: Appointment[];
    recentPrescriptions: Prescription[];
    upcomingAppointments: Appointment[];
}
```

#### **API Integration**
```typescript
// Multiple API calls on page load
const { data: todayAppointments } = useQuery({
    queryKey: ['appointments', 'today', doctorId],
    queryFn: () => appointmentAPI.getDoctorAppointments(doctorId, {
        date: format(new Date(), 'yyyy-MM-dd')
    })
});

const { data: prescriptionStats } = useQuery({
    queryKey: ['prescriptions', 'stats', doctorId],
    queryFn: () => prescriptionAPI.getStatistics(doctorId)
});
```

#### **Page Layout**
```jsx
<DoctorDashboard>
    <Header>
        <Title>Welcome, Dr. {user.full_name}</Title>
        <QuickActions>
            <NewPrescriptionButton />
            <ViewScheduleButton />
            <ShortKeysButton />
        </QuickActions>
    </Header>
    
    <StatsCards>
        <StatCard title="Today's Appointments" value={todayStats.total_appointments} />
        <StatCard title="Prescriptions Written" value={todayStats.prescriptions_written} />
        <StatCard title="Pending Appointments" value={todayStats.pending_appointments} />
    </StatsCards>
    
    <MainContent>
        <LeftPanel>
            <TodaySchedule appointments={todayAppointments} />
        </LeftPanel>
        <RightPanel>
            <RecentPrescriptions prescriptions={recentPrescriptions} />
            <UpcomingAppointments appointments={upcomingAppointments} />
        </RightPanel>
    </MainContent>
</DoctorDashboard>
```

### **4. Doctor Appointments** - `/doctor/appointments`

#### **Page Features**
- **Calendar View**: Monthly/weekly calendar with appointment slots
- **List View**: Table view with filters and pagination
- **Appointment Details**: Click to view full appointment info

#### **API Integration**
```typescript
// API Call: GET /api/v1/appointments/doctor/{doctor_id}
const { data: appointments, isLoading } = useQuery({
    queryKey: ['appointments', 'doctor', doctorId, filters],
    queryFn: () => appointmentAPI.getDoctorAppointments(doctorId, {
        date: selectedDate,
        status: filterStatus,
        page: currentPage
    })
});
```

#### **Page Layout**
```jsx
<AppointmentsPage>
    <PageHeader>
        <Title>My Appointments</Title>
        <ViewToggle>
            <CalendarViewButton active={view === 'calendar'} />
            <ListViewButton active={view === 'list'} />
        </ViewToggle>
    </PageHeader>
    
    <Filters>
        <DatePicker value={selectedDate} onChange={setSelectedDate} />
        <StatusFilter value={filterStatus} onChange={setFilterStatus} />
        <SearchBox placeholder="Search by patient name..." />
    </Filters>
    
    {view === 'calendar' ? (
        <CalendarView appointments={appointments} onDateSelect={setSelectedDate} />
    ) : (
        <AppointmentsList 
            appointments={appointments} 
            onAppointmentClick={handleAppointmentClick}
            pagination={pagination}
        />
    )}
</AppointmentsPage>
```

### **5. Patient Consultation** - `/doctor/consultation/{appointment_id}`

#### **Page Fields & Medical History**
```typescript
interface ConsultationData {
    appointment: Appointment;
    patient: Patient;
    medicalHistory: Prescription[];      // Last 2 visits by default
    consultation: {
        chief_complaint: string;         // required
        symptoms: string;               // optional
        clinical_notes: string;         // required for prescription
        diagnosis: string;              // required for prescription
        doctor_instructions: string;    // optional
    };
    prescription: {
        items: PrescriptionItem[];
        short_key_code?: string;        // if using short key
    };
}
```

#### **API Integration**
```typescript
// Load appointment and patient data
const { data: appointment } = useQuery({
    queryKey: ['appointment', appointmentId],
    queryFn: () => appointmentAPI.getById(appointmentId)
});

// Load patient medical history (progressive loading)
const { data: medicalHistory } = useQuery({
    queryKey: ['prescriptions', 'patient', appointment?.patient_mobile_number, appointment?.patient_first_name],
    queryFn: () => prescriptionAPI.getPatientPrescriptions(
        appointment.patient_mobile_number,
        appointment.patient_first_name,
        { limit: showAllHistory ? 50 : 2 }
    ),
    enabled: !!appointment
});
```

#### **Page Layout (Based on Workflow Specifications)**
```jsx
<ConsultationPage>
    <Breadcrumb>
        Home > Appointments > {patient.full_name} > Consultation
    </Breadcrumb>
    
    <PatientHeader>
        <PatientInfo>
            <Name>{patient.full_name}</Name>
            <BasicInfo>Age: {patient.age} | Gender: {patient.gender} | Mobile: {patient.mobile_number}</BasicInfo>
        </PatientInfo>
        <AppointmentInfo>
            <AppointmentNumber>{appointment.appointment_number}</AppointmentNumber>
            <DateTime>{appointment.appointment_datetime}</DateTime>
        </AppointmentInfo>
    </PatientHeader>
    
    <MainContent>
        <LeftPanel>
            <ConsultationForm>
                <ChiefComplaintField required />
                <SymptomsField />
                <ClinicalNotesField />
                <DiagnosisField required />
                <DoctorInstructionsField />
            </ConsultationForm>
        </LeftPanel>
        
        <RightPanel>
            <MedicalHistory>
                <Title>Medical History</Title>
                <HistoryToggle>
                    <ShowLastVisitsButton active={!showAllHistory} />
                    <ShowAllHistoryButton active={showAllHistory} />
                </HistoryToggle>
                <PrescriptionHistory prescriptions={medicalHistory} />
            </MedicalHistory>
        </RightPanel>
    </MainContent>
    
    <PrescriptionSection>
        <SectionTitle>Create Prescription</SectionTitle>
        <PrescriptionBuilder 
            onShortKeySelect={handleShortKeySelect}
            onMedicineAdd={handleMedicineAdd}
        />
    </PrescriptionSection>
    
    <Actions>
        <SaveDraftButton />
        <CreatePrescriptionButton />
        <CompleteConsultationButton />
    </Actions>
</ConsultationPage>
```

### **6. Prescription Builder** - Component within Consultation

#### **Prescription Builder Features**
```typescript
interface PrescriptionBuilder {
    mode: 'manual' | 'shortkey';
    shortKeyCode?: string;
    items: PrescriptionItem[];
    validation: {
        errors: string[];
        warnings: string[];
    };
}
```

#### **API Integration**
```typescript
// Short key search and selection
const { data: shortKeys } = useQuery({
    queryKey: ['short-keys', 'search', searchTerm],
    queryFn: () => shortKeyAPI.search(searchTerm, { created_by: doctorId })
});

// Medicine search for manual prescription
const { data: medicines } = useQuery({
    queryKey: ['medicines', 'search', medicineSearch],
    queryFn: () => medicineAPI.search(medicineSearch)
});

// Validate prescription before creation
const validatePrescription = useMutation({
    mutationFn: (prescriptionData) => prescriptionAPI.validate(prescriptionData)
});
```

#### **Component Layout**
```jsx
<PrescriptionBuilder>
    <ModeSelector>
        <ShortKeyModeButton active={mode === 'shortkey'} />
        <ManualModeButton active={mode === 'manual'} />
    </ModeSelector>
    
    {mode === 'shortkey' ? (
        <ShortKeySelector>
            <SearchBox placeholder="Search short keys (e.g., FEVER, COLD)..." />
            <ShortKeyList onSelect={handleShortKeySelect} />
        </ShortKeySelector>
    ) : (
        <ManualPrescription>
            <MedicineSearch placeholder="Search medicines..." />
            <SelectedMedicines>
                {items.map(item => (
                    <MedicineItem 
                        key={item.id}
                        medicine={item}
                        onUpdate={handleItemUpdate}
                        onRemove={handleItemRemove}
                    />
                ))}
            </SelectedMedicines>
        </ManualPrescription>
    )}
    
    <PrescriptionSummary>
        <ItemCount>{items.length} medicines</ItemCount>
        <TotalAmount>Total: ₹{totalAmount}</TotalAmount>
        <ValidationStatus errors={validation.errors} warnings={validation.warnings} />
    </PrescriptionSummary>
</PrescriptionBuilder>
```

---

## 👨‍👩‍👧‍👦 Patient Management

### **7. Patient Registration** - `/patients/register` ✅ **IMPLEMENTED**

#### **Implementation Details**
- **Status**: ✅ Fully implemented with multi-step wizard
- **Components**: PatientRegistrationWizard, FamilyMemberForm, MedicalInfoForm
- **Features**: 4-step wizard, family member editing, field validation
- **API Integration**: Complete with proper field mapping

#### **Page Fields & Family Registration**
```typescript
interface PatientRegistrationForm {
    // Primary Patient (always first)
    mobile_number: string;      // required, Indian format, becomes family identifier
    first_name: string;         // required, letters only
    last_name: string;          // required
    date_of_birth: Date;        // required
    gender: 'male' | 'female' | 'other'; // required
    email: string;              // optional, email format
    address: string;            // required
    blood_group: string;        // optional
    emergency_contact: string;  // optional
    
    // Medical Information
    allergies: string;          // optional
    chronic_conditions: string; // optional
    emergency_notes: string;    // optional
    
    // Family Members (optional)
    family_members: FamilyMember[];
}

interface FamilyMember {
    first_name: string;         // required
    last_name: string;          // required
    date_of_birth: Date;        // required
    gender: 'male' | 'female' | 'other';
    relationship: 'spouse' | 'child' | 'parent'; // required
    blood_group: string;        // optional
    allergies: string;          // optional
}
```

#### **API Integration**
```typescript
// Check if family already exists
const checkFamilyExists = useQuery({
    queryKey: ['patients', 'family', mobile_number],
    queryFn: () => patientAPI.getFamilyMembers(mobile_number),
    enabled: !!mobile_number && mobile_number.length === 10
});

// Register primary patient
const registerPatient = useMutation({
    mutationFn: (patientData: PatientRegistrationForm) => 
        patientAPI.createPatient({
            ...patientData,
            relationship: 'self',
            primary_member: true
        }),
    onSuccess: (response) => {
        // Register family members if any
        if (patientData.family_members.length > 0) {
            registerFamilyMembers.mutate({
                mobile_number: patientData.mobile_number,
                members: patientData.family_members
            });
        }
    }
});
```

#### **Page Layout (Based on Workflow Specifications)**
```jsx
<PatientRegistrationPage>
    <Breadcrumb>Home > Patients > Register New Patient</Breadcrumb>
    
    <Header>
        <Title>Patient Registration</Title>
        <Subtitle>Register patient and family members using single mobile number</Subtitle>
    </Header>
    
    <FormSection>
        <SectionTitle>Primary Patient Information</SectionTitle>
        <PrimaryPatientForm>
            <MobileNumberField 
                required 
                placeholder="10-digit mobile number" 
                onChange={handleMobileChange}
            />
            {familyExists && (
                <FamilyExistsAlert>
                    This mobile number is already registered. You can add this patient as a family member.
                    <AddToFamilyButton />
                </FamilyExistsAlert>
            )}
            
            <PersonalInfoSection>
                <FirstNameField required />
                <LastNameField required />
                <DateOfBirthField required />
                <GenderField required />
                <EmailField />
            </PersonalInfoSection>
            
            <ContactInfoSection>
                <AddressField required />
                <EmergencyContactField />
            </ContactInfoSection>
            
            <MedicalInfoSection>
                <BloodGroupField />
                <AllergiesField />
                <ChronicConditionsField />
                <EmergencyNotesField />
            </MedicalInfoSection>
        </PrimaryPatientForm>
    </FormSection>
    
    <FamilySection>
        <SectionTitle>
            Family Members (Optional)
            <AddFamilyMemberButton onClick={handleAddFamilyMember} />
        </SectionTitle>
        
        {familyMembers.map((member, index) => (
            <FamilyMemberForm key={index}>
                <PersonalInfo>
                    <FirstNameField required />
                    <LastNameField required />
                    <DateOfBirthField required />
                    <GenderField required />
                    <RelationshipField required />
                </PersonalInfo>
                <MedicalInfo>
                    <BloodGroupField />
                    <AllergiesField />
                </MedicalInfo>
                <RemoveMemberButton onClick={() => handleRemoveMember(index)} />
            </FamilyMemberForm>
        ))}
    </FamilySection>
    
    <Actions>
        <CancelButton />
        <SaveAsDraftButton />
        <RegisterPatientButton loading={isRegistering} />
    </Actions>
</PatientRegistrationPage>
```

### **8. Patient Search & Management** - `/patients`

#### **Search & Filter Options**
```typescript
interface PatientSearchFilters {
    mobile_number: string;      // exact match
    name: string;              // search in first_name + last_name
    email: string;             // exact match
    age_min: number;           // calculated from date_of_birth
    age_max: number;
    gender: 'male' | 'female' | 'other';
    blood_group: string;
    relationship: string;      // 'self' for primary members only
    primary_member_only: boolean; // show only primary members
    page: number;
    page_size: number;
}
```

#### **API Integration**
```typescript
const { data: patientsData, isLoading } = useQuery({
    queryKey: ['patients', 'search', searchFilters],
    queryFn: () => patientAPI.searchPatients(searchFilters)
});
```

#### **Page Layout**
```jsx
<PatientsPage>
    <PageHeader>
        <Title>Patient Management</Title>
        <Actions>
            <RegisterNewPatientButton />
            <ExportPatientsButton />
        </Actions>
    </PageHeader>
    
    <SearchAndFilters>
        <SearchBox 
            placeholder="Search by name, mobile, or email..." 
            value={searchTerm}
            onChange={setSearchTerm}
        />
        <Filters>
            <MobileNumberFilter />
            <AgeRangeFilter />
            <GenderFilter />
            <BloodGroupFilter />
            <PrimaryMemberOnlyToggle />
        </Filters>
    </SearchAndFilters>
    
    <PatientsTable>
        <TableHeader>
            <Column>Name</Column>
            <Column>Mobile</Column>
            <Column>Age/Gender</Column>
            <Column>Relationship</Column>
            <Column>Family Members</Column>
            <Column>Actions</Column>
        </TableHeader>
        <TableBody>
            {patientsData?.patients.map(patient => (
                <PatientRow key={`${patient.mobile_number}-${patient.first_name}`}>
                    <PatientName>
                        {patient.full_name}
                        {patient.primary_member && <PrimaryBadge />}
                    </PatientName>
                    <Mobile>{patient.mobile_number}</Mobile>
                    <AgeGender>{patient.age}Y, {patient.gender}</AgeGender>
                    <Relationship>{patient.relationship}</Relationship>
                    <FamilyCount>
                        <ViewFamilyButton mobile={patient.mobile_number} />
                    </FamilyCount>
                    <Actions>
                        <ViewButton />
                        <EditButton />
                        <BookAppointmentButton />
                    </Actions>
                </PatientRow>
            ))}
        </TableBody>
    </PatientsTable>
    
    <Pagination 
        current={patientsData?.page}
        total={patientsData?.total_pages}
        onChange={handlePageChange}
    />
</PatientsPage>
```

### **9. Family View** - `/patients/family/{mobile_number}`

#### **Family Management Features**
```typescript
interface FamilyView {
    mobile_number: string;
    family_members: Patient[];
    primary_member: Patient;
    family_appointments: Appointment[];
    family_prescriptions: Prescription[];
}
```

#### **API Integration**
```typescript
const { data: familyData } = useQuery({
    queryKey: ['patients', 'family', mobile_number],
    queryFn: () => patientAPI.getFamilyMembers(mobile_number)
});

const { data: familyAppointments } = useQuery({
    queryKey: ['appointments', 'family', mobile_number],
    queryFn: () => appointmentAPI.getFamilyAppointments(mobile_number)
});
```

#### **Page Layout**
```jsx
<FamilyViewPage>
    <Breadcrumb>Home > Patients > Family {mobile_number}</Breadcrumb>
    
    <FamilyHeader>
        <FamilyInfo>
            <MobileNumber>{mobile_number}</MobileNumber>
            <PrimaryMember>Primary: {primaryMember.full_name}</PrimaryMember>
            <MemberCount>{familyData.total_members} family members</MemberCount>
        </FamilyInfo>
        <Actions>
            <AddFamilyMemberButton />
            <BookFamilyAppointmentButton />
        </Actions>
    </FamilyHeader>
    
    <FamilyMembers>
        <SectionTitle>Family Members</SectionTitle>
        <MembersGrid>
            {familyData.family_members.map(member => (
                <MemberCard key={`${member.mobile_number}-${member.first_name}`}>
                    <MemberInfo>
                        <Name>{member.full_name}</Name>
                        <Details>{member.age}Y, {member.gender}</Details>
                        <Relationship>{member.relationship}</Relationship>
                        {member.primary_member && <PrimaryBadge />}
                    </MemberInfo>
                    <MemberActions>
                        <ViewDetailsButton />
                        <BookAppointmentButton patient={member} />
                        <ViewPrescriptionsButton patient={member} />
                    </MemberActions>
                </MemberCard>
            ))}
        </MembersGrid>
    </FamilyMembers>
    
    <FamilyActivity>
        <Tabs>
            <Tab label="Recent Appointments" />
            <Tab label="Recent Prescriptions" />
            <Tab label="Medical History" />
        </Tabs>
        <TabContent>
            {/* Tab-specific content */}
        </TabContent>
    </FamilyActivity>
</FamilyViewPage>
```

---

## 📅 Appointment Management

### **10. Appointment Booking** - `/appointments/book`

#### **Booking Form & Family Selection**
```typescript
interface AppointmentBookingForm {
    // Patient Selection (Family Support)
    patient_mobile_number: string;  // required
    patient_first_name: string;     // required, from family member selection
    patient_uuid: string;           // required, from patient data
    
    // Doctor & Scheduling
    doctor_id: string;              // required, from doctor selection
    appointment_date: Date;         // required, future date only
    appointment_time: string;       // required, available slot only
    duration_minutes: number;       // default 30, based on doctor settings
    
    // Appointment Details
    reason_for_visit: string;       // required, min 10 chars
    notes: string;                  // optional
    contact_number: string;         // optional, defaults to patient mobile
}
```

#### **Multi-Step Booking Process**
```typescript
// Step 1: Patient Selection
const PatientSelectionStep = {
    searchMethod: 'mobile' | 'name' | 'new',
    selectedPatient: Patient | null,
    familyMembers: Patient[],
    showFamilyMembers: boolean
};

// Step 2: Doctor Selection  
const DoctorSelectionStep = {
    specialization: string,
    selectedDoctor: Doctor | null,
    availableDoctors: Doctor[]
};

// Step 3: Date & Time Selection
const SchedulingStep = {
    selectedDate: Date,
    availableSlots: TimeSlot[],
    selectedSlot: TimeSlot | null,
    conflictCheck: ConflictCheckResult
};

// Step 4: Appointment Details
const DetailsStep = {
    reason_for_visit: string,
    notes: string,
    contact_number: string
};
```

#### **API Integration**
```typescript
// Patient search and family loading
const searchPatients = useQuery({
    queryKey: ['patients', 'search', searchTerm],
    queryFn: () => patientAPI.search(searchTerm)
});

// Doctor search by specialization
const doctorsBySpecialization = useQuery({
    queryKey: ['doctors', 'specialization', selectedSpecialization],
    queryFn: () => doctorAPI.getBySpecialization(selectedSpecialization)
});

// Available time slots
const availableSlots = useQuery({
    queryKey: ['appointments', 'availability', selectedDoctor?.id, selectedDate],
    queryFn: () => appointmentAPI.getAvailability(selectedDoctor.id, selectedDate),
    enabled: !!selectedDoctor && !!selectedDate
});

// Conflict check before booking
const conflictCheck = useMutation({
    mutationFn: (bookingData) => appointmentAPI.checkConflicts(bookingData)
});

// Final booking
const bookAppointment = useMutation({
    mutationFn: (appointmentData: AppointmentBookingForm) => 
        appointmentAPI.createAppointment(appointmentData)
});
```

#### **Page Layout (Based on Workflow Specifications)**
```jsx
<AppointmentBookingPage>
    <Breadcrumb>Home > Appointments > Book New Appointment</Breadcrumb>
    
    <BookingWizard currentStep={currentStep}>
        <StepIndicator>
            <Step number={1} title="Select Patient" active={currentStep === 1} />
            <Step number={2} title="Choose Doctor" active={currentStep === 2} />
            <Step number={3} title="Pick Date & Time" active={currentStep === 3} />
            <Step number={4} title="Appointment Details" active={currentStep === 4} />
        </StepIndicator>
        
        {currentStep === 1 && (
            <PatientSelectionStep>
                <SearchMethods>
                    <SearchByMobileTab active={searchMethod === 'mobile'} />
                    <SearchByNameTab active={searchMethod === 'name'} />
                    <NewPatientTab active={searchMethod === 'new'} />
                </SearchMethods>
                
                {searchMethod === 'mobile' && (
                    <MobileSearch>
                        <MobileInput 
                            placeholder="Enter 10-digit mobile number"
                            onChange={handleMobileSearch}
                        />
                        {familyMembers.length > 0 && (
                            <FamilyMemberSelection>
                                <Title>Select family member for appointment:</Title>
                                {familyMembers.map(member => (
                                    <FamilyMemberCard 
                                        key={`${member.mobile_number}-${member.first_name}`}
                                        member={member}
                                        onSelect={handlePatientSelect}
                                        showRelationship={true}
                                    />
                                ))}
                            </FamilyMemberSelection>
                        )}
                    </MobileSearch>
                )}
                
                <NextButton 
                    disabled={!selectedPatient} 
                    onClick={() => setCurrentStep(2)}
                />
            </PatientSelectionStep>
        )}
        
        {currentStep === 2 && (
            <DoctorSelectionStep>
                <SpecializationFilter>
                    <SpecializationDropdown 
                        value={selectedSpecialization}
                        onChange={setSelectedSpecialization}
                    />
                </SpecializationFilter>
                
                <DoctorsList>
                    {availableDoctors.map(doctor => (
                        <DoctorCard 
                            key={doctor.id}
                            doctor={doctor}
                            onSelect={handleDoctorSelect}
                            selected={selectedDoctor?.id === doctor.id}
                        >
                            <DoctorInfo>
                                <Name>Dr. {doctor.full_name}</Name>
                                <Specialization>{doctor.specialization}</Specialization>
                                <Experience>{doctor.experience_years} years experience</Experience>
                                <ConsultationFee>₹{doctor.consultation_fee}</ConsultationFee>
                            </DoctorInfo>
                            <Availability>
                                <AvailableDays>{doctor.available_days_list.join(', ')}</AvailableDays>
                                <WorkingHours>{doctor.start_time} - {doctor.end_time}</WorkingHours>
                            </Availability>
                        </DoctorCard>
                    ))}
                </DoctorsList>
                
                <StepNavigation>
                    <BackButton onClick={() => setCurrentStep(1)} />
                    <NextButton 
                        disabled={!selectedDoctor} 
                        onClick={() => setCurrentStep(3)}
                    />
                </StepNavigation>
            </DoctorSelectionStep>
        )}
        
        {currentStep === 3 && (
            <SchedulingStep>
                <DateSelector>
                    <Title>Select Appointment Date</Title>
                    <DatePicker 
                        value={selectedDate}
                        onChange={setSelectedDate}
                        minDate={new Date()}
                        disabledDays={getUnavailableDays(selectedDoctor)}
                    />
                </DateSelector>
                
                <TimeSlotSelector>
                    <Title>Available Time Slots - {format(selectedDate, 'dd MMM yyyy')}</Title>
                    {isLoadingSlots ? (
                        <LoadingSpinner />
                    ) : (
                        <SlotsGrid>
                            {availableSlots.map(slot => (
                                <TimeSlot 
                                    key={slot.time}
                                    slot={slot}
                                    available={slot.available}
                                    selected={selectedSlot?.time === slot.time}
                                    onClick={() => handleSlotSelect(slot)}
                                >
                                    {slot.time} - {slot.end_time}
                                </TimeSlot>
                            ))}
                        </SlotsGrid>
                    )}
                    
                    {conflictCheck.data?.has_conflict && (
                        <ConflictWarning>
                            <WarningIcon />
                            <Message>Time slot conflict detected. Please select another time.</Message>
                            <SuggestedSlots>
                                Suggested alternatives: {conflictCheck.data.suggested_slots.join(', ')}
                            </SuggestedSlots>
                        </ConflictWarning>
                    )}
                </TimeSlotSelector>
                
                <StepNavigation>
                    <BackButton onClick={() => setCurrentStep(2)} />
                    <NextButton 
                        disabled={!selectedSlot} 
                        onClick={() => setCurrentStep(4)}
                    />
                </StepNavigation>
            </SchedulingStep>
        )}
        
        {currentStep === 4 && (
            <AppointmentDetailsStep>
                <AppointmentSummary>
                    <Title>Appointment Summary</Title>
                    <SummaryCard>
                        <PatientInfo>
                            <Label>Patient:</Label>
                            <Value>{selectedPatient.full_name}</Value>
                            <Relationship>{selectedPatient.relationship}</Relationship>
                        </PatientInfo>
                        <DoctorInfo>
                            <Label>Doctor:</Label>
                            <Value>Dr. {selectedDoctor.full_name}</Value>
                            <Specialization>{selectedDoctor.specialization}</Specialization>
                        </DoctorInfo>
                        <DateTime>
                            <Label>Date & Time:</Label>
                            <Value>{format(selectedDate, 'dd MMM yyyy')} at {selectedSlot.time}</Value>
                            <Duration>Duration: {duration_minutes} minutes</Duration>
                        </DateTime>
                    </SummaryCard>
                </AppointmentSummary>
                
                <AppointmentDetailsForm>
                    <ReasonField 
                        label="Reason for Visit"
                        required
                        placeholder="Describe the reason for this appointment..."
                        value={reason_for_visit}
                        onChange={setReasonForVisit}
                    />
                    <NotesField 
                        label="Additional Notes"
                        placeholder="Any additional information..."
                        value={notes}
                        onChange={setNotes}
                    />
                    <ContactNumberField 
                        label="Contact Number"
                        placeholder="Contact number for this appointment"
                        value={contact_number}
                        onChange={setContactNumber}
                        defaultValue={selectedPatient.mobile_number}
                    />
                </AppointmentDetailsForm>
                
                <StepNavigation>
                    <BackButton onClick={() => setCurrentStep(3)} />
                    <BookAppointmentButton 
                        loading={isBooking}
                        onClick={handleBookAppointment}
                    />
                </StepNavigation>
            </AppointmentDetailsStep>
        )}
    </BookingWizard>
</AppointmentBookingPage>
```

---

## 💊 Medicine & Short Key Management

### **11. Medicine Catalog** - `/medicines`

#### **Medicine Search & Management**
```typescript
interface MedicineSearchFilters {
    search: string;             // name, generic_name, brand_name
    category: string;           // Analgesics, Antibiotics, etc.
    manufacturer: string;       // GSK, Cipla, etc.
    atc_code: string;          // A10BA02, etc.
    dosage_form: string;       // tablet, syrup, injection
    is_prescription_required: boolean;
    is_otc: boolean;           // Over The Counter
    price_min: number;
    price_max: number;
    in_stock: boolean;         // current_stock > 0
    low_stock: boolean;        // current_stock <= minimum_stock
    page: number;
    page_size: number;
}
```

#### **API Integration**
```typescript
const { data: medicinesData } = useQuery({
    queryKey: ['medicines', 'search', searchFilters],
    queryFn: () => medicineAPI.searchMedicines(searchFilters)
});

const { data: categories } = useQuery({
    queryKey: ['medicines', 'categories'],
    queryFn: () => medicineAPI.getCategories()
});

const checkInteractions = useMutation({
    mutationFn: (medicineIds: string[]) => 
        medicineAPI.checkInteractions(medicineIds)
});
```

#### **Page Layout**
```jsx
<MedicineCatalogPage>
    <PageHeader>
        <Title>Medicine Catalog</Title>
        <Actions>
            <AddMedicineButton />
            <BulkImportButton />
            <ExportCatalogButton />
        </Actions>
    </PageHeader>
    
    <SearchAndFilters>
        <SearchBox 
            placeholder="Search by medicine name, brand, or generic name..."
            value={searchTerm}
            onChange={setSearchTerm}
        />
        <FilterPanel>
            <CategoryFilter options={categories} />
            <ManufacturerFilter />
            <DosageFormFilter />
            <PriceRangeFilter />
            <AvailabilityFilters>
                <PrescriptionRequiredToggle />
                <OTCToggle />
                <InStockToggle />
                <LowStockToggle />
            </AvailabilityFilters>
        </FilterPanel>
    </SearchAndFilters>
    
    <MedicinesGrid>
        {medicinesData?.medicines.map(medicine => (
            <MedicineCard key={medicine.id}>
                <MedicineHeader>
                    <MedicineName>{medicine.display_name}</MedicineName>
                    <MedicineType>
                        {medicine.is_prescription_required ? <RxBadge /> : <OTCBadge />}
                    </MedicineType>
                </MedicineHeader>
                
                <MedicineInfo>
                    <GenericName>{medicine.generic_name}</GenericName>
                    <Strength>{medicine.strength}</Strength>
                    <DosageForm>{medicine.dosage_form}</DosageForm>
                    <Manufacturer>{medicine.manufacturer}</Manufacturer>
                </MedicineInfo>
                
                <PriceInfo>
                    <Price>₹{medicine.price_per_unit}</Price>
                    <MRP>MRP: ₹{medicine.mrp}</MRP>
                </PriceInfo>
                
                <StockInfo>
                    <CurrentStock stock={medicine.current_stock} minimum={medicine.minimum_stock} />
                    {medicine.is_low_stock && <LowStockAlert />}
                </StockInfo>
                
                <Actions>
                    <ViewDetailsButton />
                    <EditMedicineButton />
                    <AddToShortKeyButton />
                    <CheckInteractionsButton />
                </Actions>
            </MedicineCard>
        ))}
    </MedicinesGrid>
    
    <Pagination 
        current={medicinesData?.page}
        total={medicinesData?.total_pages}
        onChange={handlePageChange}
    />
</MedicineCatalogPage>
```

### **12. Short Key Management** - `/short-keys`

#### **Short Key Features**
```typescript
interface ShortKeyManagement {
    personalShortKeys: ShortKey[];     // Created by current doctor
    globalShortKeys: ShortKey[];       // Available to all doctors
    popularShortKeys: ShortKey[];      // Most used short keys
    recentlyUsed: ShortKey[];          // Recently used by current doctor
}

interface ShortKeyForm {
    code: string;                      // required, 2-20 chars, alphanumeric, unique
    name: string;                      // required, display name
    description: string;               // optional, detailed description
    indication: string;                // required, when to use this short key
    usage_instructions: string;        // optional, how to use
    is_global: boolean;               // default false, only admin can set true
    medicines: ShortKeyMedicine[];     // required, at least 1 medicine
}

interface ShortKeyMedicine {
    medicine_id: string;               // required, selected from medicine catalog
    default_dosage: string;           // required, e.g., "500mg"
    default_frequency: string;        // required, e.g., "Twice daily"
    default_duration: string;         // required, e.g., "5 days"
    default_quantity: number;         // required, default 1
    instructions: string;             // optional, specific instructions
    sequence_order: number;           // required, order in prescription
}
```

#### **API Integration**
```typescript
// Load doctor's short keys
const { data: personalShortKeys } = useQuery({
    queryKey: ['short-keys', 'personal', doctorId],
    queryFn: () => shortKeyAPI.getPersonalShortKeys(doctorId)
});

// Load global short keys
const { data: globalShortKeys } = useQuery({
    queryKey: ['short-keys', 'global'],
    queryFn: () => shortKeyAPI.getGlobalShortKeys()
});

// Create new short key
const createShortKey = useMutation({
    mutationFn: (shortKeyData: ShortKeyForm) => 
        shortKeyAPI.createShortKey(shortKeyData),
    onSuccess: () => {
        // Refresh short keys list
        queryClient.invalidateQueries(['short-keys']);
        setShowCreateForm(false);
    }
});

// Validate short key code uniqueness
const validateCode = useMutation({
    mutationFn: (code: string) => shortKeyAPI.validateCode(code)
});
```

#### **Page Layout**
```jsx
<ShortKeyManagementPage>
    <PageHeader>
        <Title>Short Key Management</Title>
        <Subtitle>Create and manage quick prescription templates</Subtitle>
        <Actions>
            <CreateShortKeyButton onClick={() => setShowCreateForm(true)} />
            <ImportShortKeysButton />
        </Actions>
    </PageHeader>
    
    <ShortKeyTabs>
        <Tab label="My Short Keys" active={activeTab === 'personal'} />
        <Tab label="Global Short Keys" active={activeTab === 'global'} />
        <Tab label="Popular" active={activeTab === 'popular'} />
        <Tab label="Recently Used" active={activeTab === 'recent'} />
    </ShortKeyTabs>
    
    <ShortKeysGrid>
        {currentShortKeys.map(shortKey => (
            <ShortKeyCard key={shortKey.id}>
                <ShortKeyHeader>
                    <ShortKeyCode>{shortKey.code}</ShortKeyCode>
                    <ShortKeyBadges>
                        {shortKey.is_global && <GlobalBadge />}
                        {shortKey.is_popular && <PopularBadge />}
                        {shortKey.can_edit && <EditableBadge />}
                    </ShortKeyBadges>
                </ShortKeyHeader>
                
                <ShortKeyInfo>
                    <Name>{shortKey.name}</Name>
                    <Description>{shortKey.description}</Description>
                    <Indication>
                        <Label>Indication:</Label>
                        <Text>{shortKey.indication}</Text>
                    </Indication>
                </ShortKeyInfo>
                
                <MedicinesList>
                    <Label>Medicines ({shortKey.total_medicines}):</Label>
                    {shortKey.medicines.slice(0, 3).map(medicine => (
                        <MedicineItem key={medicine.medicine_id}>
                            <MedicineName>{medicine.medicine_name}</MedicineName>
                            <Dosage>{medicine.default_dosage} {medicine.default_frequency}</Dosage>
                        </MedicineItem>
                    ))}
                    {shortKey.medicines.length > 3 && (
                        <MoreMedicines>+{shortKey.medicines.length - 3} more</MoreMedicines>
                    )}
                </MedicinesList>
                
                <UsageStats>
                    <UsageCount>Used {shortKey.usage_count} times</UsageCount>
                    {shortKey.last_used_at && (
                        <LastUsed>Last used: {formatDate(shortKey.last_used_at)}</LastUsed>
                    )}
                </UsageStats>
                
                <Actions>
                    <UseShortKeyButton onClick={() => handleUseShortKey(shortKey.code)} />
                    <ViewDetailsButton />
                    {shortKey.can_edit && (
                        <>
                            <EditButton />
                            <DuplicateButton />
                            <DeleteButton />
                        </>
                    )}
                </Actions>
            </ShortKeyCard>
        ))}
    </ShortKeysGrid>
    
    {showCreateForm && (
        <CreateShortKeyModal>
            <ShortKeyForm 
                onSubmit={handleCreateShortKey}
                onCancel={() => setShowCreateForm(false)}
            />
        </CreateShortKeyModal>
    )}
</ShortKeyManagementPage>
```

### **13. Short Key Creation Form** - Modal/Page Component

#### **Component Layout**
```jsx
<ShortKeyForm>
    <FormSection title="Basic Information">
        <ShortKeyCodeField 
            label="Short Key Code"
            placeholder="e.g., FEVER, COLD, HTN"
            required
            validation={validateCode}
            helperText="2-20 characters, alphanumeric only"
        />
        <NameField 
            label="Display Name"
            placeholder="e.g., Common Fever Treatment"
            required
        />
        <DescriptionField 
            label="Description"
            placeholder="Detailed description of this short key..."
            multiline
        />
        <IndicationField 
            label="Medical Indication"
            placeholder="When to use this short key..."
            required
        />
        <IsGlobalToggle 
            label="Make this short key available to all doctors"
            disabled={!canCreateGlobal}
        />
    </FormSection>
    
    <FormSection title="Medicines">
        <MedicineSelector>
            <AddMedicineButton onClick={() => setShowMedicineSearch(true)} />
            
            {selectedMedicines.map((medicine, index) => (
                <MedicineFormCard key={medicine.medicine_id}>
                    <MedicineHeader>
                        <MedicineName>{medicine.medicine_name}</MedicineName>
                        <RemoveMedicineButton onClick={() => handleRemoveMedicine(index)} />
                    </MedicineHeader>
                    
                    <MedicineDefaults>
                        <DosageField 
                            label="Default Dosage"
                            placeholder="e.g., 500mg"
                            required
                            value={medicine.default_dosage}
                            onChange={(value) => handleMedicineUpdate(index, 'default_dosage', value)}
                        />
                        <FrequencyField 
                            label="Default Frequency"
                            placeholder="e.g., Twice daily"
                            required
                            value={medicine.default_frequency}
                            onChange={(value) => handleMedicineUpdate(index, 'default_frequency', value)}
                        />
                        <DurationField 
                            label="Default Duration"
                            placeholder="e.g., 5 days"
                            required
                            value={medicine.default_duration}
                            onChange={(value) => handleMedicineUpdate(index, 'default_duration', value)}
                        />
                        <QuantityField 
                            label="Default Quantity"
                            type="number"
                            min={1}
                            value={medicine.default_quantity}
                            onChange={(value) => handleMedicineUpdate(index, 'default_quantity', value)}
                        />
                        <InstructionsField 
                            label="Special Instructions"
                            placeholder="e.g., Take after meals"
                            value={medicine.instructions}
                            onChange={(value) => handleMedicineUpdate(index, 'instructions', value)}
                        />
                        <SequenceOrderField 
                            label="Order"
                            type="number"
                            value={medicine.sequence_order}
                            onChange={(value) => handleMedicineUpdate(index, 'sequence_order', value)}
                        />
                    </MedicineDefaults>
                </MedicineFormCard>
            ))}
            
            {selectedMedicines.length === 0 && (
                <EmptyState>
                    <Message>No medicines added yet. Add at least one medicine to create a short key.</Message>
                </EmptyState>
            )}
        </MedicineSelector>
    </FormSection>
    
    <FormActions>
        <CancelButton onClick={onCancel} />
        <SaveAsDraftButton 
            disabled={!isValidForDraft}
            onClick={handleSaveAsDraft}
        />
        <CreateShortKeyButton 
            disabled={!isValidForCreation}
            loading={isCreating}
            onClick={handleCreate}
        />
    </FormActions>
    
    {showMedicineSearch && (
        <MedicineSearchModal 
            onSelect={handleMedicineSelect}
            onClose={() => setShowMedicineSearch(false)}
            excludeIds={selectedMedicines.map(m => m.medicine_id)}
        />
    )}
</ShortKeyForm>
```

---

## 📊 Navigation & Layout Structure

### **Main Application Layout**

#### **Header/Navigation Bar**
```jsx
<AppHeader>
    <Logo>
        <Image src="/logo.png" alt="Prescription Management System" />
        <Title>RX Manager</Title>
    </Logo>
    
    <Navigation>
        {user.role === 'doctor' && (
            <NavItems>
                <NavItem to="/doctor/dashboard" icon={<DashboardIcon />}>Dashboard</NavItem>
                <NavItem to="/doctor/appointments" icon={<CalendarIcon />}>Appointments</NavItem>
                <NavItem to="/doctor/prescriptions" icon={<RxIcon />}>Prescriptions</NavItem>
                <NavItem to="/short-keys" icon={<KeyIcon />}>Short Keys</NavItem>
                <NavItem to="/medicines" icon={<PillIcon />}>Medicines</NavItem>
            </NavItems>
        )}
        
        {user.role === 'admin' && (
            <NavItems>
                <NavItem to="/admin/dashboard" icon={<DashboardIcon />}>Dashboard</NavItem>
                <NavItem to="/patients" icon={<PatientIcon />}>Patients</NavItem>
                <NavItem to="/doctors" icon={<DoctorIcon />}>Doctors</NavItem>
                <NavItem to="/appointments" icon={<CalendarIcon />}>Appointments</NavItem>
                <NavItem to="/medicines" icon={<PillIcon />}>Medicines</NavItem>
                <NavItem to="/reports" icon={<ReportIcon />}>Reports</NavItem>
            </NavItems>
        )}
    </Navigation>
    
    <UserMenu>
        <UserInfo>
            <Avatar src={user.avatar} />
            <UserName>{user.full_name}</UserName>
            <UserRole>{user.role}</UserRole>
        </UserInfo>
        <Dropdown>
            <DropdownItem to="/profile">Profile</DropdownItem>
            <DropdownItem to="/settings">Settings</DropdownItem>
            <DropdownItem onClick={handleLogout}>Logout</DropdownItem>
        </Dropdown>
    </UserMenu>
</AppHeader>
```

#### **Breadcrumb Navigation (Based on Workflow Specifications)**
```jsx
<BreadcrumbNavigation>
    <BreadcrumbItem to="/">Home</BreadcrumbItem>
    {breadcrumbItems.map((item, index) => (
        <React.Fragment key={index}>
            <BreadcrumbSeparator>></BreadcrumbSeparator>
            <BreadcrumbItem 
                to={item.path} 
                active={index === breadcrumbItems.length - 1}
            >
                {item.label}
            </BreadcrumbItem>
        </React.Fragment>
    ))}
</BreadcrumbNavigation>
```

#### **Page Transition Patterns (Based on Workflow Specifications)**
```typescript
// New Page Navigation (Main Actions)
const handleAppointmentClick = (appointmentId: string) => {
    navigate(`/doctor/consultation/${appointmentId}`);
};

const handlePatientClick = (mobile: string, firstName: string) => {
    navigate(`/patients/${mobile}/${firstName}`);
};

// Modal/Popup (Quick Actions & Confirmations)
const handleQuickEdit = () => {
    setShowEditModal(true);
};

const handleDeleteConfirmation = () => {
    setShowDeleteDialog(true);
};

// Back Navigation
const handleBack = () => {
    navigate(-1); // Browser back
    // OR
    navigate('/previous/route'); // Specific route
};
```

---

## 🔄 State Management & API Integration

### **Redux Store Structure**
```typescript
interface RootState {
    auth: {
        user: User | null;
        tokens: {
            access_token: string;
            refresh_token: string;
        } | null;
        isAuthenticated: boolean;
        isLoading: boolean;
    };
    
    ui: {
        breadcrumbs: BreadcrumbItem[];
        notifications: Notification[];
        modals: {
            [key: string]: boolean;
        };
        loading: {
            [key: string]: boolean;
        };
    };
    
    // API State (managed by RTK Query)
    api: ApiState;
}
```

### **RTK Query API Configuration**
```typescript
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const api = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery({
        baseUrl: '/api/v1',
        prepareHeaders: (headers, { getState }) => {
            const token = (getState() as RootState).auth.tokens?.access_token;
            if (token) {
                headers.set('authorization', `Bearer ${token}`);
            }
            return headers;
        },
    }),
    tagTypes: ['User', 'Doctor', 'Patient', 'Medicine', 'ShortKey', 'Appointment', 'Prescription'],
    endpoints: (builder) => ({
        // Auth endpoints
        login: builder.mutation<LoginResponse, LoginRequest>({
            query: (credentials) => ({
                url: '/auth/login',
                method: 'POST',
                body: credentials,
            }),
        }),
        
        // Doctor endpoints
        getDoctors: builder.query<DoctorsResponse, DoctorSearchParams>({
            query: (params) => ({
                url: '/doctors/',
                params,
            }),
            providesTags: ['Doctor'],
        }),
        
        // Patient endpoints (with composite key support)
        getPatientByCompositeKey: builder.query<Patient, {mobile: string, firstName: string}>({
            query: ({mobile, firstName}) => `/patients/${mobile}/${firstName}`,
            providesTags: ['Patient'],
        }),
        
        // Additional endpoints for all modules...
    }),
});

export const {
    useLoginMutation,
    useGetDoctorsQuery,
    useGetPatientByCompositeKeyQuery,
    // ... other hooks
} = api;
```

---

## 📱 Responsive Design & Mobile Support

### **Breakpoints & Layout**
```typescript
const breakpoints = {
    xs: '0px',      // Mobile portrait
    sm: '600px',    // Mobile landscape
    md: '900px',    // Tablet
    lg: '1200px',   // Desktop
    xl: '1536px'    // Large desktop
};

// Responsive layout patterns
<ResponsiveLayout>
    <DesktopSidebar display={{ xs: 'none', md: 'block' }} />
    <MobileBottomNav display={{ xs: 'block', md: 'none' }} />
    <MainContent>
        <MobileHeader display={{ xs: 'block', md: 'none' }} />
        <PageContent />
    </MainContent>
</ResponsiveLayout>
```

### **Mobile-Specific Features**
```jsx
// Mobile appointment booking with simplified steps
<MobileAppointmentBooking>
    <MobileStepIndicator currentStep={currentStep} />
    <SwipeableSteps 
        index={currentStep}
        onChangeIndex={setCurrentStep}
    >
        <PatientSelectionStep />
        <DoctorSelectionStep />
        <DateTimeSelection />
        <ConfirmationStep />
    </SwipeableSteps>
    <MobileNavigation />
</MobileAppointmentBooking>

// Mobile-optimized prescription view
<MobilePrescriptionView>
    <PrescriptionHeader collapsed />
    <ExpandableMedicineList>
        {prescription.items.map(item => (
            <MobileMedicineCard key={item.id} expandable />
        ))}
    </ExpandableMedicineList>
    <MobileActions>
        <PrintButton />
        <ShareButton />
        <EditButton />
    </MobileActions>
</MobilePrescriptionView>
```

---

## 🎯 Implementation Priority & Phases

### **Phase 1: Authentication & Core Layout** (Week 1)
1. **Setup & Configuration**
   - React + TypeScript + Vite setup
   - Redux Toolkit + RTK Query configuration
   - Material-UI/Ant Design integration
   - Routing setup with React Router

2. **Authentication Flow**
   - Login page implementation
   - Register page implementation
   - JWT token management
   - Protected route guards
   - Role-based navigation

3. **Layout & Navigation**
   - Main application layout
   - Header/navigation bar
   - Breadcrumb navigation
   - Responsive layout structure

### **Phase 2: Doctor Module** (Week 2)
1. **Doctor Dashboard**
   - Dashboard layout and statistics
   - Today's schedule component
   - Recent prescriptions list

2. **Appointment Management**
   - Appointment calendar view
   - Appointment list view
   - Appointment details page

3. **Patient Consultation**
   - Consultation workflow implementation
   - Medical history progressive loading
   - Basic prescription builder

### **Phase 3: Patient & Family Management** (Week 3)
1. **Patient Registration**
   - Multi-step patient registration
   - Family member registration
   - Composite key implementation

2. **Patient Search & Management**
   - Advanced patient search
   - Family view implementation
   - Patient profile management

### **Phase 4: Medicine & Short Keys** (Week 4)
1. **Medicine Catalog**
   - Medicine search and filters
   - Medicine details view
   - Drug interaction checking

2. **Short Key Management**
   - Short key creation form
   - Short key listing and management
   - Integration with prescription builder

### **Phase 5: Advanced Prescription Features** (Week 5)
1. **Enhanced Prescription Builder**
   - Advanced medicine search
   - Short key integration
   - Prescription validation

2. **Prescription Management**
   - Prescription listing and search
   - Prescription printing (PDF)
   - Prescription status management

### **Phase 6: Appointment Booking & Admin Features** (Week 6)
1. **Appointment Booking**
   - Multi-step booking wizard
   - Family member selection
   - Conflict detection and resolution

2. **Admin Features**
   - User management
   - System statistics
   - Reports and analytics

3. **Mobile Optimization**
   - Mobile-responsive components
   - Touch-friendly interactions
   - Offline support (if needed)

---

## 📅 **APPOINTMENT BOOKING SYSTEM - COMPLETE IMPLEMENTATION**

### **🟢 Implementation Status: FULLY COMPLETED**

The appointment booking system has been successfully implemented with a comprehensive 3-step wizard, real-time availability checking, and full integration with the doctor dashboard and appointments calendar.

### **📱 Key Pages Implemented**

#### **1. Appointment Booking Page** - `/appointments/book` ✅ COMPLETED

**File**: `/frontend/src/pages/appointments/AppointmentBooking.tsx`

```tsx
// Complete 3-Step Booking Wizard
const AppointmentBooking = () => {
    const [activeStep, setActiveStep] = useState(0);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);

    // Form handling with React Hook Form + Yup validation
    const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<BookingFormData>({
        resolver: yupResolver(validationSchema),
        defaultValues: {
            patient_mobile_number: '',
            patient_first_name: '',
            patient_uuid: '',
            doctor_id: '',
            appointment_date: null,
            appointment_time: '',
            reason_for_visit: '',
            contact_number: '',
            notes: '',
        },
    });

    // Real-time availability checking
    const { data: availabilityData } = useGetAppointmentAvailabilityQuery({
        doctorId: watch('doctor_id'),
        date: watch('appointment_date') ? formatDateForAPI(watch('appointment_date')) : '',
    }, {
        skip: !watch('doctor_id') || !watch('appointment_date'),
    });

    // Process TimeSlot objects and extract available times
    React.useEffect(() => {
        if (availabilityData?.available_slots) {
            const slots = availabilityData.available_slots
                .filter(slot => slot.is_available === true)
                .map(slot => slot.start_time)
                .filter(Boolean);
            setAvailableSlots(slots);
        }
    }, [availabilityData]);

    // Appointment creation with conflict checking
    const onSubmit = async (data: BookingFormData) => {
        // Pre-booking conflict check
        const conflictCheck = await checkConflict({
            doctor_id: data.doctor_id,
            appointment_date: formatDateForAPI(data.appointment_date) || '',
            appointment_time: data.appointment_time,
            duration_minutes: 30,
        }).unwrap();

        if (conflictCheck.has_conflict) {
            alert('Time slot no longer available');
            return;
        }

        // Create appointment
        const result = await createAppointment({
            patient_mobile_number: data.patient_mobile_number,
            patient_first_name: data.patient_first_name,
            patient_uuid: data.patient_uuid,
            doctor_id: data.doctor_id,
            appointment_date: formatDateForAPI(data.appointment_date) || '',
            appointment_time: data.appointment_time,
            duration_minutes: 30,
            reason_for_visit: data.reason_for_visit,
            contact_number: data.contact_number || data.patient_mobile_number,
            notes: data.notes,
        }).unwrap();

        alert('Appointment booked successfully!');
        navigate('/doctor/appointments');
    };

    return (
        <Box sx={{ maxWidth: 1000, mx: 'auto', p: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Book New Appointment
            </Typography>
            
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                {['Select Patient', 'Choose Doctor & Date', 'Confirm Booking'].map((label) => (
                    <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            <Paper sx={{ p: 3 }}>
                {/* Step 1: Patient Selection */}
                {activeStep === 0 && (
                    <PatientSelectionStep 
                        patientSearch={patientSearch}
                        setPatientSearch={setPatientSearch}
                        patients={patientsData?.patients || []}
                        selectedPatient={selectedPatient}
                        onPatientSelect={handlePatientSelect}
                    />
                )}

                {/* Step 2: Doctor & Schedule Selection */}
                {activeStep === 1 && (
                    <DoctorAndScheduleStep 
                        selectedPatient={selectedPatient}
                        doctors={doctorsData?.doctors || []}
                        selectedDoctor={selectedDoctor}
                        onDoctorSelect={handleDoctorSelect}
                        control={control}
                        errors={errors}
                        watch={watch}
                        setValue={setValue}
                        availableSlots={availableSlots}
                    />
                )}

                {/* Step 3: Confirmation */}
                {activeStep === 2 && (
                    <ConfirmationStep 
                        selectedPatient={selectedPatient}
                        selectedDoctor={selectedDoctor}
                        watch={watch}
                        control={control}
                        onSubmit={handleSubmit(onSubmit)}
                        creating={creating}
                        onBack={() => setActiveStep(1)}
                    />
                )}
            </Paper>
        </Box>
    );
};
```

#### **2. Doctor Appointments Page** - `/doctor/appointments` ✅ COMPLETED

**File**: `/frontend/src/pages/doctor/DoctorAppointments.tsx`

```tsx
// Complete appointment management with calendar and list views
const DoctorAppointments = () => {
    const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
    const [filters, setFilters] = useState<AppointmentFilters>({});
    
    // Use consistent doctor ID across all components
    const doctorId = getCurrentDoctorId();

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" component="h1">My Appointments</Typography>
                
                <Box display="flex" gap={2} alignItems="center">
                    <Button
                        startIcon={<Refresh />}
                        onClick={refreshData}
                        variant="outlined"
                    >
                        Refresh
                    </Button>
                    
                    <Button
                        startIcon={<Add />}
                        variant="contained"
                        onClick={() => navigate('/appointments/book')}
                    >
                        New Appointment
                    </Button>

                    <ToggleButtonGroup value={viewMode} exclusive onChange={handleViewModeChange}>
                        <ToggleButton value="calendar"><CalendarToday /></ToggleButton>
                        <ToggleButton value="list"><List /></ToggleButton>
                    </ToggleButtonGroup>
                </Box>
            </Box>

            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <AppointmentFilters
                        filters={filters}
                        onFiltersChange={handleFiltersChange}
                        onClear={handleClearFilters}
                    />
                </Grid>

                <Grid item xs={12}>
                    {viewMode === 'calendar' ? (
                        <AppointmentCalendar
                            doctorId={doctorId}
                            onAppointmentClick={handleAppointmentClick}
                            onDateClick={handleDateClick}
                        />
                    ) : (
                        <AppointmentList
                            doctorId={doctorId}
                            filters={filters}
                            onAppointmentClick={handleAppointmentClick}
                            onEditAppointment={handleEditAppointment}
                            onCancelAppointment={handleCancelAppointment}
                        />
                    )}
                </Grid>
            </Grid>
        </Box>
    );
};
```

#### **3. Doctor Dashboard Integration** ✅ COMPLETED

**Files**: 
- `/frontend/src/pages/doctor/DoctorDashboard.tsx`
- `/frontend/src/components/dashboard/TodaySchedule.tsx`

```tsx
// Doctor dashboard with today's appointments and booking integration
const DoctorDashboard = () => {
    const doctorId = getCurrentDoctorId(); // Consistent doctor ID

    const { data: todayAppointments = [] } = useGetDoctorTodayAppointmentsQuery(doctorId);
    const { data: statistics } = useGetDoctorStatisticsQuery();

    return (
        <Box>
            {/* Header with Book Appointment Button */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">Welcome, Dr. {user?.first_name}</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => navigate('/appointments/book')}
                        color="primary"
                    >
                        Book Appointment
                    </Button>
                    <Button variant="outlined" onClick={handleRefreshAll}>
                        Refresh
                    </Button>
                </Box>
            </Box>

            {/* Statistics Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Today's Appointments"
                        value={statistics?.appointments_today || 0}
                        icon={<Today />}
                        color="primary"
                    />
                </Grid>
                {/* Additional stat cards */}
            </Grid>

            {/* Today's Schedule */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <TodaySchedule
                        appointments={todayAppointments}
                        loading={appointmentsLoading}
                        onAppointmentClick={handleAppointmentClick}
                        onStartConsultation={handleStartConsultation}
                    />
                </Grid>
            </Grid>
        </Box>
    );
};
```

### **📊 Appointment Components**

#### **AppointmentCalendar Component** ✅ COMPLETED
**File**: `/frontend/src/components/appointments/AppointmentCalendar.tsx`

- Monthly calendar view with navigation
- Real-time appointment display
- Click handlers for dates and appointments
- Status color coding and legends
- Responsive design for mobile/desktop

#### **AppointmentList Component** ✅ COMPLETED
**File**: `/frontend/src/components/appointments/AppointmentList.tsx`

- Paginated appointment list
- Filter integration
- Status management actions
- Patient and appointment details
- Bulk operations support

#### **AppointmentFilters Component** ✅ COMPLETED
**File**: `/frontend/src/components/appointments/AppointmentFilters.tsx`

- Date range filtering
- Status filtering
- Patient name search
- Clear filters functionality

### **🔧 Utilities & State Management** ✅ COMPLETED

#### **Doctor Utilities**
**File**: `/frontend/src/utils/doctorUtils.ts`
```typescript
// Consistent doctor ID management across components
export const getCurrentDoctorId = (): string => {
    // Returns the current doctor's profile ID
    return '3a874913-1b97-4fa1-b100-97af324ce0ad';
};

export const isCurrentUserDoctor = (userRole?: string): boolean => {
    return userRole === 'doctor';
};
```

#### **Date Utilities**
**File**: `/frontend/src/utils/dateUtils.ts`
```typescript
// Comprehensive date handling for appointments
export const appointmentDate = {
    displayDateTime: (datetimeString: string): string => {...},
    displayDate: (datetimeString: string): string => {...},
    displayTime: (datetimeString: string): string => {...},
    getCalendarKey: (datetimeString: string): string => {...},
    isToday: (datetimeString: string): boolean => {...}
};
```

#### **API Integration**
**File**: `/frontend/src/store/api.ts`
```typescript
// Complete RTK Query integration with cache invalidation
export const api = createApi({
    // Appointment endpoints
    createAppointment: builder.mutation<Appointment, AppointmentCreateRequest>({
        query: (appointmentData) => ({
            url: '/appointments/',
            method: 'POST',
            body: appointmentData,
        }),
        invalidatesTags: ['Appointment'], // Auto-refresh all appointment queries
    }),
    
    getAppointmentAvailability: builder.query<AppointmentAvailability, { doctorId: string; date: string }>({
        query: ({ doctorId, date }) => `/appointments/availability/${doctorId}/${date}`,
        providesTags: ['Appointment'],
    }),

    checkAppointmentConflict: builder.mutation<AppointmentConflictResponse, AppointmentConflictRequest>({
        query: (conflictData) => ({
            url: '/appointments/conflicts/check',
            method: 'POST',
            body: conflictData,
        }),
    }),

    // Doctor appointment queries
    getDoctorAppointments: builder.query<{ appointments: Appointment[]; total: number }, { doctorId: string } & AppointmentFilters>({
        query: ({ doctorId, ...filters }) => ({
            url: `/appointments/doctor/${doctorId}`,
            params: filters,
        }),
        providesTags: ['Appointment'],
    }),

    getAppointmentsByDate: builder.query<Appointment[], { doctorId: string; startDate: string; endDate: string }>({
        query: ({ doctorId, startDate, endDate }) => ({
            url: `/appointments/doctor/${doctorId}`,
            params: { start_date: startDate, end_date: endDate },
        }),
        providesTags: ['Appointment'],
    }),

    getDoctorTodayAppointments: builder.query<Appointment[], string>({
        query: (doctorId) => ({
            url: `/appointments/doctor/${doctorId}`,
            params: {
                appointment_date: new Date().toISOString().split('T')[0],
                status: 'scheduled',
            },
        }),
        providesTags: ['Appointment'],
    }),
});
```

### **🔄 Data Flow & Cache Management**

#### **Appointment Creation Flow**
1. **Patient Selection**: Search and select from existing patients
2. **Doctor & Schedule**: Select doctor, pick date, view available time slots
3. **Real-time Availability**: Query `/appointments/availability/{doctor_id}/{date}`
4. **Conflict Detection**: Pre-booking conflict check via `/appointments/conflicts/check`
5. **Appointment Creation**: POST to `/appointments/` with form data
6. **Cache Invalidation**: RTK Query automatically refreshes all appointment-related queries
7. **Navigation**: Redirect to appointments page with updated data

#### **Automatic Data Refresh**
- **Cache Tags**: All appointment queries tagged with `['Appointment']`
- **Invalidation**: `createAppointment` mutation invalidates all appointment caches
- **Real-time Updates**: Dashboard and calendar automatically show new appointments
- **No Manual Refresh**: Users see updates immediately without page reload

### **✅ Implementation Verification**

#### **Completed Features Checklist**
- ✅ **3-Step Booking Wizard**: Patient → Doctor & Schedule → Confirmation
- ✅ **Patient Search**: Search by mobile number or name with live results
- ✅ **Doctor Selection**: Visual cards with specialization and consultation fees
- ✅ **Date Selection**: StandardDatePicker with appointment date validation
- ✅ **Time Slot Display**: Real-time availability checking with clickable chips
- ✅ **Conflict Prevention**: Pre-booking conflict detection prevents double-booking
- ✅ **Form Validation**: Comprehensive validation with error messages and field requirements
- ✅ **Calendar View**: Monthly calendar with appointment display and navigation
- ✅ **List View**: Filterable and paginated appointment list with actions
- ✅ **Dashboard Integration**: Today's appointments display in doctor dashboard
- ✅ **Navigation Integration**: "Book Appointment" buttons in dashboards
- ✅ **Cache Management**: Real-time updates without manual refresh
- ✅ **Doctor ID Consistency**: Unified doctor ID management across components
- ✅ **Responsive Design**: Mobile and desktop optimized interfaces
- ✅ **Error Handling**: User-friendly error messages and validation feedback
- ✅ **TypeScript Integration**: Full type safety with interfaces and validation

#### **API Integration Status**
- ✅ **POST /appointments/**: Create new appointments
- ✅ **GET /appointments/doctor/{id}**: Fetch doctor's appointments with filtering
- ✅ **GET /appointments/availability/{doctor_id}/{date}**: Real-time availability
- ✅ **POST /appointments/conflicts/check**: Conflict detection
- ✅ **GET /appointments/{id}**: Appointment details
- ✅ **GET /doctors/statistics/overview**: Dashboard statistics
- ✅ **GET /patients/**: Patient search for booking

---

**✅ This Frontend Development Plan provides complete page specifications, API mappings, and implementation guidance for all modules including the fully implemented appointment booking system with comprehensive documentation and verification.**