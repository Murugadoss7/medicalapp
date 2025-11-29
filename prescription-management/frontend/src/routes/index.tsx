import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { AuthLayout } from '../components/layout/AuthLayout';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';

// Auth pages
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { DashboardRedirect } from '../components/auth/DashboardRedirect';

// Doctor pages
import { DoctorDashboard } from '../pages/doctor/DoctorDashboard';
import { PatientConsultation } from '../pages/doctor/PatientConsultation';

// Admin pages
import { AdminDashboard } from '../pages/admin/AdminDashboard';

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

// Prescription pages
import PrescriptionView from '../pages/prescriptions/PrescriptionView';
import PrescriptionDetailView from '../pages/prescriptions/PrescriptionDetailView';

// Test pages
import { TestDashboard } from '../pages/TestDashboard';
import { SimpleTest } from '../pages/SimpleTest';

export const router = createBrowserRouter([
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
        index: true,
        element: <Navigate to="/auth/login" replace />,
      },
    ],
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <DashboardRedirect />,
      },
      
      // Dashboard routes (role-based redirects)
      {
        path: 'dashboard',
        element: <DashboardRedirect />,
      },
      
      // Doctor routes
      {
        path: 'doctor',
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
        path: 'admin',
        children: [
          {
            path: 'dashboard',
            element: <AdminDashboard />,
          },
          {
            path: 'appointments',
            element: <UnifiedAppointments />,
          },
        ],
      },
      
      // Patient management routes
      {
        path: 'patients',
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
        path: 'doctors',
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
        path: 'appointments',
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
        path: 'medicines',
        element: <MedicineCatalog />,
      },
      
      // Short key routes
      {
        path: 'short-keys',
        element: <ShortKeyManagement />,
      },

      // Prescription routes
      {
        path: 'prescriptions/:prescriptionId',
        element: <PrescriptionDetailView />,
      },

      // Test routes (development only)
      {
        path: 'test',
        element: <TestDashboard />,
      },
      {
        path: 'simple-test',
        element: <SimpleTest />,
      },
    ],
  },
  
  // Catch all route
  {
    path: '*',
    element: <Navigate to="/auth/login" replace />,
  },
]);