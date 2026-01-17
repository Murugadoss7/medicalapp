import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { AuthLayout } from '../components/layout/AuthLayout';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { RootPage } from '../components/auth/RootPage';

// Auth pages
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { ClinicRegistrationPage } from '../pages/auth/ClinicRegistrationPage';
import { DashboardRedirect } from '../components/auth/DashboardRedirect';

// Doctor pages
import { DoctorDashboard } from '../pages/doctor/DoctorDashboard';
import { PatientConsultation } from '../pages/doctor/PatientConsultation';

// Admin pages
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { AddDoctorPage } from '../pages/admin/AddDoctorPage';
import { AdminClinics } from '../pages/admin/AdminClinics';

// Appointment pages (shared by doctors and admin)
import { UnifiedAppointments } from '../pages/appointments/UnifiedAppointments';

// Patient pages
import { PatientSearch } from '../pages/patients/PatientSearch';
import { PatientRegistration } from '../pages/patients/PatientRegistration';
import { FamilyView } from '../pages/patients/FamilyView';

// Doctor Management pages
import { DoctorSearch, DoctorRegistration, DoctorView, DoctorEdit } from '../pages/doctors';

// Appointment pages
import { AppointmentBooking } from '../pages/appointments/AppointmentBooking';

// Medicine pages
import { MedicineCatalog } from '../pages/medicines/MedicineCatalog';

// Short key pages
import { ShortKeyManagement } from '../pages/short-keys/ShortKeyManagement';

// Dental pages
import { DentalConsultation } from '../pages/dental';

// Treatment pages
import { TreatmentDashboard } from '../pages/treatments/TreatmentDashboard';
import { PatientListingPage } from '../pages/treatments/PatientListingPage';
import { TimelinePage } from '../pages/treatments/TimelinePage';
import { ProceduresPage } from '../pages/treatments/ProceduresPage';
import { CaseStudyPage } from '../pages/treatments/CaseStudyPage';

// Prescription pages
import PrescriptionView from '../pages/prescriptions/PrescriptionView';
import PrescriptionDetailView from '../pages/prescriptions/PrescriptionDetailView';

// Test pages
import { TestDashboard } from '../pages/TestDashboard';
import { SimpleTest } from '../pages/SimpleTest';

// Reception pages
import { WalkInReception } from '../pages/reception/WalkInReception';

// Settings pages
import { PrescriptionTemplates } from '../pages/settings/PrescriptionTemplates';
import { TemplateEditor } from '../components/prescription-templates';

export const router = createBrowserRouter([
  // Root - shows landing page or redirects to dashboard
  {
    path: '/',
    element: <RootPage />,
  },

  // Auth routes
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'register',
        element: <RegisterPage />,
      },
      {
        path: 'register-clinic',
        element: <ClinicRegistrationPage />,
      },
      {
        index: true,
        element: <Navigate to="/auth/login" replace />,
      },
    ],
  },

  // Protected application routes
  {
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      // Dashboard routes (role-based redirects)
      {
        path: '/dashboard',
        element: <DashboardRedirect />,
      },

      // Doctor routes
      {
        path: '/doctor',
        children: [
          {
            path: 'dashboard',
            element: <DoctorDashboard />,
          },
          {
            path: 'appointments',
            element: <UnifiedAppointments />,
          },
          {
            path: 'consultation/:appointmentId',
            element: <PatientConsultation />,
          },
        ],
      },

      // Admin routes
      {
        path: '/admin',
        children: [
          {
            path: 'dashboard',
            element: <AdminDashboard />,
          },
          {
            path: 'appointments',
            element: <UnifiedAppointments />,
          },
          {
            path: 'add-doctor',
            element: <AddDoctorPage />,
          },
          {
            path: 'clinics',
            element: <AdminClinics />,
          },
        ],
      },

      // Patient management routes
      {
        path: '/patients',
        children: [
          {
            index: true,
            element: <PatientSearch />,
          },
          {
            path: 'register',
            element: <PatientRegistration />,
          },
          {
            path: 'family/:mobileNumber',
            element: <FamilyView />,
          },
        ],
      },
      
      // Doctor management routes
      {
        path: '/doctors',
        children: [
          {
            index: true,
            element: <DoctorSearch />,
          },
          {
            path: 'register',
            element: <DoctorRegistration />,
          },
          {
            path: ':doctorId',
            element: <DoctorView />,
          },
          {
            path: ':doctorId/edit',
            element: <DoctorEdit />,
          },
        ],
      },
      
      // Appointment routes
      {
        path: '/appointments',
        children: [
          {
            index: true,
            element: <UnifiedAppointments />,
          },
          {
            path: 'book',
            element: <AppointmentBooking />,
          },
          {
            path: ':appointmentId/dental',
            element: <DentalConsultation />,
          },
          {
            path: ':appointmentId/prescription',
            element: <PrescriptionView />,
          },
          {
            path: ':appointmentId/consultation',
            element: <PatientConsultation />,
          },
        ],
      },
      
      // Medicine routes
      {
        path: '/medicines',
        element: <MedicineCatalog />,
      },
      
      // Short key routes
      {
        path: '/short-keys',
        element: <ShortKeyManagement />,
      },

      // Settings routes
      {
        path: '/settings/templates',
        element: <PrescriptionTemplates />,
      },
      {
        path: '/settings/templates/:templateId/edit',
        element: <TemplateEditor />,
      },

      // Walk-In Reception route
      {
        path: '/walk-in',
        element: <WalkInReception />,
      },

      // Treatment Dashboard routes (NEW: Option 2 implementation)
      {
        path: '/treatments',
        children: [
          {
            index: true,
            element: <Navigate to="/treatments/patients" replace />,
          },
          {
            path: 'patients',
            children: [
              {
                index: true,
                element: <PatientListingPage />,
              },
              {
                path: ':mobile/:firstName/timeline',
                element: <TimelinePage />,
              },
              {
                path: ':mobile/:firstName/procedures',
                element: <ProceduresPage />,
              },
              {
                path: ':mobile/:firstName/case-study',
                element: <CaseStudyPage />,
              },
            ],
          },
          // Legacy route for backwards compatibility
          {
            path: 'dashboard',
            element: <TreatmentDashboard />,
          },
        ],
      },

      // Prescription routes
      {
        path: '/prescriptions/:prescriptionId',
        element: <PrescriptionDetailView />,
      },

      // Test routes (development only)
      {
        path: '/test',
        element: <TestDashboard />,
      },
      {
        path: '/simple-test',
        element: <SimpleTest />,
      },
    ],
  },

  // Catch all route - redirect to root (will show landing or redirect to dashboard)
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);