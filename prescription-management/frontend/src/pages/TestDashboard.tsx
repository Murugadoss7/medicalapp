import { 
  Box, 
  Typography, 
  Grid, 
  Button,
  Paper,
  Divider
} from '@mui/material';
import {
  Today,
  Assignment,
  People,
  CheckCircle,
} from '@mui/icons-material';
import { StatCard } from '../components/dashboard/StatCard';
import { TodaySchedule } from '../components/dashboard/TodaySchedule';
import { RecentPrescriptions } from '../components/dashboard/RecentPrescriptions';
import { 
  mockDoctorStatistics, 
  mockTodayAppointments, 
  mockRecentPrescriptions 
} from '../utils/testData';
import type { Appointment, Prescription } from '../store/api';

export const TestDashboard = () => {
  const handleAppointmentClick = (appointment: Appointment) => {
    console.log('Appointment clicked:', appointment);
    alert(`Appointment clicked: ${appointment.patient_full_name} at ${appointment.appointment_time}`);
  };

  const handleStartConsultation = (appointment: Appointment) => {
    console.log('Start consultation:', appointment);
    alert(`Starting consultation for: ${appointment.patient_full_name}`);
  };

  const handlePrescriptionClick = (prescription: Prescription) => {
    console.log('Prescription clicked:', prescription);
    alert(`Prescription clicked: ${prescription.prescription_number}`);
  };

  const handlePrintPrescription = (prescription: Prescription) => {
    console.log('Print prescription:', prescription);
    alert(`Printing prescription: ${prescription.prescription_number}`);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Phase 2.1 Component Testing Dashboard
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Testing all Phase 2.1 components with mock data
      </Typography>

      <Divider sx={{ mb: 3 }} />
      
      {/* Statistics Cards Testing */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          StatCard Components Test
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Today's Appointments"
              value={mockDoctorStatistics.appointments_today}
              icon={<Today />}
              color="primary"
              subtitle="Scheduled for today"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Completed Today"
              value={mockDoctorStatistics.completed_appointments_today}
              icon={<CheckCircle />}
              color="success"
              subtitle="Consultations done"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Prescriptions Today"
              value={mockDoctorStatistics.prescriptions_today}
              icon={<Assignment />}
              color="secondary"
              subtitle="Written today"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Patients"
              value={mockDoctorStatistics.total_patients}
              icon={<People />}
              color="warning"
              subtitle="Under your care"
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            ✅ StatCard components displaying mock statistics data
          </Typography>
        </Box>
      </Paper>

      {/* Loading States Testing */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Loading States Test
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Loading Test"
              value="--"
              loading={true}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Normal State"
              value={42}
              icon={<Today />}
              color="primary"
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            ✅ Loading skeleton states working correctly
          </Typography>
        </Box>
      </Paper>
      
      {/* Main Dashboard Components */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              TodaySchedule Component Test
            </Typography>
            <TodaySchedule
              appointments={mockTodayAppointments}
              onAppointmentClick={handleAppointmentClick}
              onStartConsultation={handleStartConsultation}
            />
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary">
                ✅ TodaySchedule with interactive appointment cards
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              RecentPrescriptions Component Test
            </Typography>
            <RecentPrescriptions
              prescriptions={mockRecentPrescriptions}
              onPrescriptionClick={handlePrescriptionClick}
              onPrintPrescription={handlePrintPrescription}
            />
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary">
                ✅ RecentPrescriptions with action buttons
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Testing Instructions */}
      <Paper sx={{ p: 3, mt: 3, bgcolor: 'info.light' }}>
        <Typography variant="h6" gutterBottom>
          Testing Instructions
        </Typography>
        <Box component="ul" sx={{ pl: 2 }}>
          <li>Click on appointment cards to test navigation</li>
          <li>Click "Start Consultation" buttons to test workflow</li>
          <li>Click on prescription cards to test prescription view</li>
          <li>Click print buttons to test print functionality</li>
          <li>Check console for logged actions</li>
          <li>Test responsive design by resizing window</li>
        </Box>
      </Paper>
    </Box>
  );
};