import { useEffect, useMemo } from 'react';
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
  CheckCircle,
  Refresh,
  Add as AddIcon,
  HourglassEmpty,
  Cancel,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks';
import { useToast } from '../../components/common/Toast';
import {
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
  const toast = useToast();

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

  // Use consistent doctor ID across all components
  const doctorId = getCurrentDoctorId();

  // API queries - Get ALL today's appointments (no status filter)
  const {
    data: todayAppointmentsData,
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

  // Extract appointments array from response
  const todayAppointments = useMemo(() => {
    if (!todayAppointmentsData) return [];
    // Handle both array and object with appointments property
    if (Array.isArray(todayAppointmentsData)) {
      return todayAppointmentsData;
    }
    return todayAppointmentsData.appointments || [];
  }, [todayAppointmentsData]);

  // Calculate statistics from actual appointment data
  const statistics = useMemo(() => {
    const total = todayAppointments.length;
    const completed = todayAppointments.filter(
      (apt) => apt.status === 'completed'
    ).length;
    const inProgress = todayAppointments.filter(
      (apt) => apt.status === 'in_progress'
    ).length;
    const scheduled = todayAppointments.filter(
      (apt) => apt.status === 'scheduled'
    ).length;
    const cancelled = todayAppointments.filter(
      (apt) => apt.status === 'cancelled' || apt.status === 'no_show'
    ).length;

    return {
      total,
      completed,
      inProgress,
      scheduled,
      cancelled,
      pending: scheduled + inProgress,
    };
  }, [todayAppointments]);

  // Count today's prescriptions
  const todayPrescriptionsCount = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return recentPrescriptions.filter((rx) => {
      const rxDate = new Date(rx.created_at).toISOString().split('T')[0];
      return rxDate === today;
    }).length;
  }, [recentPrescriptions]);

  const handleRefreshAll = async () => {
    try {
      await Promise.all([
        refetchAppointments(),
        refetchPrescriptions(),
      ]);
      toast.success('Dashboard refreshed successfully');
    } catch {
      toast.error('Failed to refresh dashboard');
    }
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    // Check if doctor has dental specialization
    const isDentalDoctor = user?.specialization?.toLowerCase().includes('dental') ||
                           user?.specialization?.toLowerCase().includes('dentist');

    if (isDentalDoctor) {
      navigate(`/appointments/${appointment.id}/dental`);
    } else {
      navigate(`/appointments/${appointment.id}/consultation`);
    }
  };

  const handleStartConsultation = (appointment: Appointment) => {
    // Check if doctor has dental specialization
    const isDentalDoctor = user?.specialization?.toLowerCase().includes('dental') ||
                           user?.specialization?.toLowerCase().includes('dentist');

    if (isDentalDoctor) {
      navigate(`/appointments/${appointment.id}/dental`);
    } else {
      navigate(`/appointments/${appointment.id}/consultation`);
    }
  };

  const handlePrescriptionClick = (prescription: Prescription) => {
    navigate(`/prescriptions/${prescription.id}`);
  };

  const handlePrintPrescription = (prescription: Prescription) => {
    // Open prescription in a new window for printing
    window.open(`/prescriptions/${prescription.id}/print`, '_blank');
    toast.info(`Opening prescription ${prescription.prescription_number} for printing`);
  };

  // Show loading backdrop for initial load
  if (appointmentsLoading && prescriptionsLoading) {
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
        <Box>
          <Typography variant="h4" component="h1">
            Welcome, Dr. {user?.first_name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Typography>
        </Box>
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
            disabled={appointmentsLoading || prescriptionsLoading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Error Messages */}
      {(appointmentsError || prescriptionsError) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          There was an error loading some dashboard data. Please try refreshing.
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Today's Appointments"
            value={statistics.total}
            icon={<Today />}
            loading={appointmentsLoading}
            color="primary"
            subtitle={`${statistics.scheduled} scheduled, ${statistics.inProgress} in progress`}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completed"
            value={statistics.completed}
            icon={<CheckCircle />}
            loading={appointmentsLoading}
            color="success"
            subtitle="Consultations done today"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending"
            value={statistics.pending}
            icon={<HourglassEmpty />}
            loading={appointmentsLoading}
            color="warning"
            subtitle="Waiting to be seen"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Prescriptions Today"
            value={todayPrescriptionsCount}
            icon={<Assignment />}
            loading={prescriptionsLoading}
            color="secondary"
            subtitle="Written today"
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
