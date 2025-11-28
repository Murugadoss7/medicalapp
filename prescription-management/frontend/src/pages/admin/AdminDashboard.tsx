import { useEffect, useRef } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Skeleton,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PatientsIcon,
  LocalHospital as DoctorsIcon,
  CalendarToday as AppointmentsIcon,
  LocalPharmacy as MedicinesIcon,
  PersonAdd as PersonAddIcon,
  CheckCircle as CompletedIcon,
  Schedule as ScheduledIcon,
  PlayArrow as InProgressIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks';
import { StatCard } from '../../components/dashboard/StatCard';
import {
  useGetAdminDoctorStatsQuery,
  useGetAdminPatientStatsQuery,
  useGetAdminTodayAppointmentsQuery,
} from '../../store/api';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated } = useAppSelector((state) => state.auth);
  const hasRedirected = useRef(false);

  // Fetch real-time data
  const {
    data: doctorStats,
    isLoading: doctorStatsLoading,
    error: doctorStatsError
  } = useGetAdminDoctorStatsQuery();

  const {
    data: patientStats,
    isLoading: patientStatsLoading,
    error: patientStatsError
  } = useGetAdminPatientStatsQuery();

  const {
    data: todayAppointments,
    isLoading: appointmentsLoading,
    error: appointmentsError
  } = useGetAdminTodayAppointmentsQuery();

  useEffect(() => {
    // Only redirect once, and only if we have user data
    if (hasRedirected.current || !isAuthenticated || !currentUser) {
      return;
    }

    // Redirect non-admin users
    if (currentUser.role !== 'admin') {
      hasRedirected.current = true;
      switch (currentUser.role) {
        case 'doctor':
          navigate('/doctor/dashboard', { replace: true });
          break;
        case 'patient':
          navigate('/patient/dashboard', { replace: true });
          break;
        default:
          navigate('/dashboard', { replace: true });
      }
    }
  }, [currentUser, navigate, isAuthenticated]);

  // Calculate appointment stats from real data
  const appointmentStats = {
    total: todayAppointments?.total || 0,
    scheduled: todayAppointments?.appointments?.filter(a => a.status === 'scheduled').length || 0,
    inProgress: todayAppointments?.appointments?.filter(a => a.status === 'in_progress').length || 0,
    completed: todayAppointments?.appointments?.filter(a => a.status === 'completed').length || 0,
    cancelled: todayAppointments?.appointments?.filter(a => a.status === 'cancelled').length || 0,
  };

  const quickActions = [
    {
      title: 'Book Appointment',
      description: 'Schedule new patient appointment',
      icon: <AppointmentsIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      action: () => navigate('/appointments/book'),
      color: 'primary',
    },
    {
      title: 'Register New Doctor',
      description: 'Add a new doctor to the system',
      icon: <PersonAddIcon sx={{ fontSize: 40, color: 'secondary.main' }} />,
      action: () => navigate('/doctors/register'),
      color: 'secondary',
    },
    {
      title: 'Manage Doctors',
      description: 'View and manage doctor profiles',
      icon: <DoctorsIcon sx={{ fontSize: 40, color: 'success.main' }} />,
      action: () => navigate('/doctors'),
      color: 'success',
    },
    {
      title: 'Patient Management',
      description: 'Search and manage patient records',
      icon: <PatientsIcon sx={{ fontSize: 40, color: 'info.main' }} />,
      action: () => navigate('/patients'),
      color: 'info',
    },
    {
      title: 'Medicine Catalog',
      description: 'Manage medicine inventory',
      icon: <MedicinesIcon sx={{ fontSize: 40, color: 'warning.main' }} />,
      action: () => navigate('/medicines'),
      color: 'warning',
    },
  ];

  // Show loading while checking auth
  if (!isAuthenticated || !currentUser) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // If not admin, don't render (will redirect via useEffect)
  if (currentUser.role !== 'admin') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const hasError = doctorStatsError || patientStatsError || appointmentsError;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome back, {currentUser?.first_name}! Here's an overview of your clinic.
        </Typography>
      </Box>

      {/* Error Alert */}
      {hasError && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Some statistics could not be loaded. Showing available data.
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Doctors */}
        <Grid item xs={12} sm={6} md={3}>
          {doctorStatsLoading ? (
            <Skeleton variant="rectangular" height={120} />
          ) : (
            <StatCard
              title="Active Doctors"
              value={doctorStats?.active_doctors || 0}
              subtitle={`${doctorStats?.total_doctors || 0} total`}
              icon={<DoctorsIcon />}
              color="primary"
            />
          )}
        </Grid>

        {/* Patients */}
        <Grid item xs={12} sm={6} md={3}>
          {patientStatsLoading ? (
            <Skeleton variant="rectangular" height={120} />
          ) : (
            <StatCard
              title="Total Patients"
              value={patientStats?.total_patients || 0}
              subtitle={`${patientStats?.total_families || 0} families`}
              icon={<PatientsIcon />}
              color="success"
            />
          )}
        </Grid>

        {/* Today's Appointments */}
        <Grid item xs={12} sm={6} md={3}>
          {appointmentsLoading ? (
            <Skeleton variant="rectangular" height={120} />
          ) : (
            <StatCard
              title="Today's Appointments"
              value={appointmentStats.total}
              subtitle={`${appointmentStats.completed} completed, ${appointmentStats.scheduled} pending`}
              icon={<AppointmentsIcon />}
              color="info"
            />
          )}
        </Grid>

        {/* In Progress */}
        <Grid item xs={12} sm={6} md={3}>
          {appointmentsLoading ? (
            <Skeleton variant="rectangular" height={120} />
          ) : (
            <StatCard
              title="In Progress"
              value={appointmentStats.inProgress}
              subtitle="Active consultations"
              icon={<InProgressIcon />}
              color="warning"
            />
          )}
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Quick Actions */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <DashboardIcon sx={{ mr: 1 }} />
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              {quickActions.map((action, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Card
                    sx={{
                      height: '100%',
                      cursor: 'pointer',
                      '&:hover': {
                        boxShadow: 3,
                        transform: 'translateY(-2px)',
                        transition: 'all 0.2s ease-in-out'
                      }
                    }}
                    onClick={action.action}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        {action.icon}
                        <Box sx={{ ml: 2 }}>
                          <Typography variant="h6" component="div">
                            {action.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {action.description}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                    <CardActions>
                      <Button size="small" color={action.color as any}>
                        Open
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Today's Summary */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <AppointmentsIcon sx={{ mr: 1 }} />
              Today's Summary
            </Typography>

            {appointmentsLoading ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Skeleton variant="rectangular" height={40} />
                <Skeleton variant="rectangular" height={40} />
                <Skeleton variant="rectangular" height={40} />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, bgcolor: 'primary.light', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ScheduledIcon color="primary" />
                    <Typography variant="body2">Scheduled</Typography>
                  </Box>
                  <Chip label={appointmentStats.scheduled} color="primary" size="small" />
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, bgcolor: 'warning.light', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InProgressIcon color="warning" />
                    <Typography variant="body2">In Progress</Typography>
                  </Box>
                  <Chip label={appointmentStats.inProgress} color="warning" size="small" />
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, bgcolor: 'success.light', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CompletedIcon color="success" />
                    <Typography variant="body2">Completed</Typography>
                  </Box>
                  <Chip label={appointmentStats.completed} color="success" size="small" />
                </Box>

                {appointmentStats.cancelled > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, bgcolor: 'error.light', borderRadius: 1 }}>
                    <Typography variant="body2">Cancelled</Typography>
                    <Chip label={appointmentStats.cancelled} color="error" size="small" />
                  </Box>
                )}
              </Box>
            )}
          </Paper>

          {/* Specialization Summary */}
          {doctorStats?.specialization_counts && Object.keys(doctorStats.specialization_counts).length > 0 && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <DoctorsIcon sx={{ mr: 1 }} />
                Doctors by Specialty
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {Object.entries(doctorStats.specialization_counts).map(([specialty, count]) => (
                  <Chip
                    key={specialty}
                    label={`${specialty}: ${count}`}
                    variant="outlined"
                    size="small"
                  />
                ))}
              </Box>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};
