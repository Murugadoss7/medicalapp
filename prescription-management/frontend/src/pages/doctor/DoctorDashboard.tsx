import { useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Alert,
  Button,
  CircularProgress,
  Backdrop
} from '@mui/material';
import {
  Today,
  Assignment,
  People,
  CheckCircle,
  Refresh,
  Add as AddIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks';
import {
  useGetDoctorStatisticsQuery,
  useGetDoctorTodayAppointmentsQuery,
  useGetDoctorRecentPrescriptionsQuery,
  type Appointment,
  type Prescription,
} from '../../store/api';
import { StatCard } from '../../components/dashboard/StatCard';
import { TodaySchedule } from '../../components/dashboard/TodaySchedule';
import { RecentPrescriptions } from '../../components/dashboard/RecentPrescriptions';
import { getCurrentDoctorId } from '../../utils/doctorUtils';

export const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  // Redirect non-doctor users to their appropriate dashboard
  useEffect(() => {
    if (user && user.role !== 'doctor') {
      switch (user.role) {
        case 'admin':
          navigate('/admin/dashboard', { replace: true });
          break;
        case 'patient':
          navigate('/patient/dashboard', { replace: true });
          break;
        default:
          navigate('/dashboard', { replace: true });
          break;
      }
    }
  }, [user, navigate]);

  // Return null while redirecting
  if (!user || user.role !== 'doctor') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // API queries
  const {
    data: statistics,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useGetDoctorStatisticsQuery();

  // Use consistent doctor ID across all components
  const doctorId = getCurrentDoctorId();

  const {
    data: todayAppointments = [],
    isLoading: appointmentsLoading,
    error: appointmentsError,
    refetch: refetchAppointments,
  } = useGetDoctorTodayAppointmentsQuery(doctorId);

  const {
    data: recentPrescriptions = [],
    isLoading: prescriptionsLoading,
    error: prescriptionsError,
    refetch: refetchPrescriptions,
  } = useGetDoctorRecentPrescriptionsQuery({ 
    doctorId, 
    limit: 5 
  });

  const handleRefreshAll = () => {
    refetchStats();
    refetchAppointments();
    refetchPrescriptions();
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    navigate(`/doctor/consultation/${appointment.id}`);
  };

  const handleStartConsultation = (appointment: Appointment) => {
    navigate(`/doctor/consultation/${appointment.id}?start=true`);
  };

  const handlePrescriptionClick = (prescription: Prescription) => {
    navigate(`/prescriptions/${prescription.id}`);
  };

  const handlePrintPrescription = (prescription: Prescription) => {
    // TODO: Implement prescription printing
    console.log('Print prescription:', prescription.id);
  };

  // Show loading backdrop for initial load
  if (statsLoading && appointmentsLoading && prescriptionsLoading) {
    return (
      <Backdrop open sx={{ zIndex: 1 }}>
        <CircularProgress color="primary" />
      </Backdrop>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Welcome, Dr. {user?.first_name}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/appointments/book')}
            color="primary"
          >
            Book Appointment
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRefreshAll}
            disabled={statsLoading || appointmentsLoading || prescriptionsLoading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Error Messages */}
      {(statsError || appointmentsError || prescriptionsError) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          There was an error loading some dashboard data. Please try refreshing.
        </Alert>
      )}
      
      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Today's Appointments"
            value={statistics?.appointments_today || 0}
            icon={<Today />}
            loading={statsLoading}
            color="primary"
            subtitle="Scheduled for today"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completed Today"
            value={statistics?.completed_appointments_today || 0}
            icon={<CheckCircle />}
            loading={statsLoading}
            color="success"
            subtitle="Consultations done"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Prescriptions Today"
            value={statistics?.prescriptions_today || 0}
            icon={<Assignment />}
            loading={statsLoading}
            color="secondary"
            subtitle="Written today"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Patients"
            value={statistics?.total_patients || 0}
            icon={<People />}
            loading={statsLoading}
            color="warning"
            subtitle="Under your care"
          />
        </Grid>
      </Grid>
      
      {/* Main Content */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <TodaySchedule
            appointments={todayAppointments}
            loading={appointmentsLoading}
            onAppointmentClick={handleAppointmentClick}
            onStartConsultation={handleStartConsultation}
          />
        </Grid>
        
        <Grid item xs={12} md={4}>
          <RecentPrescriptions
            prescriptions={recentPrescriptions}
            loading={prescriptionsLoading}
            onPrescriptionClick={handlePrescriptionClick}
            onPrintPrescription={handlePrintPrescription}
          />
        </Grid>
      </Grid>
    </Box>
  );
};