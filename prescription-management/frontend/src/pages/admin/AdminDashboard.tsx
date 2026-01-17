/**
 * Admin Dashboard - Medical Futurism Design
 * Enhanced with glassmorphism, gradients, and smooth animations
 * iPad-friendly responsive design
 */

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
  Fade,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PatientsIcon,
  LocalHospital as DoctorsIcon,
  CalendarToday as AppointmentsIcon,
  CalendarToday,
  LocalPharmacy as MedicinesIcon,
  PersonAdd as PersonAddIcon,
  CheckCircle as CompletedIcon,
  Schedule as ScheduledIcon,
  PlayArrow as InProgressIcon,
  Healing,
  Vaccines,
  MonitorHeart,
  LocationOn as ClinicsIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks';
import { StatCard } from '../../components/dashboard/StatCard';
import {
  useGetAdminDoctorStatsQuery,
  useGetAdminPatientStatsQuery,
  useGetAdminTodayAppointmentsQuery,
  useGetTenantLimitsQuery,
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

  const {
    data: tenantInfo,
    isLoading: tenantLoading,
  } = useGetTenantLimitsQuery();

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
      title: 'View Appointments',
      description: 'View and manage all appointments',
      icon: <CalendarToday sx={{ fontSize: 40, color: 'primary.main' }} />,
      action: () => navigate('/appointments'),
      color: 'primary',
    },
    {
      title: 'Book Appointment',
      description: 'Schedule new patient appointment',
      icon: <AppointmentsIcon sx={{ fontSize: 40, color: 'secondary.main' }} />,
      action: () => navigate('/appointments/book'),
      color: 'secondary',
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
    {
      title: 'All Clinics',
      description: 'View all clinic locations',
      icon: <ClinicsIcon sx={{ fontSize: 40, color: 'error.main' }} />,
      action: () => navigate('/admin/clinics'),
      color: 'error',
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
    <Box sx={{ position: 'relative' }}>
      {/* Background Gradient Orbs - Medical Futurism */}
      <Box
        sx={{
          position: 'fixed',
          top: '10%',
          left: '5%',
          width: { xs: 200, sm: 300, md: 400 },
          height: { xs: 200, sm: 300, md: 400 },
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          opacity: 0.05,
          filter: 'blur(60px)',
          pointerEvents: 'none',
          zIndex: 0,
          animation: 'float 8s ease-in-out infinite',
          '@keyframes float': {
            '0%, 100%': { transform: 'translate(0, 0)' },
            '50%': { transform: 'translate(30px, -30px)' },
          },
        }}
      />
      <Box
        sx={{
          position: 'fixed',
          bottom: '10%',
          right: '10%',
          width: { xs: 150, sm: 250, md: 350 },
          height: { xs: 150, sm: 250, md: 350 },
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          opacity: 0.05,
          filter: 'blur(60px)',
          pointerEvents: 'none',
          zIndex: 0,
          animation: 'float-reverse 10s ease-in-out infinite',
          '@keyframes float-reverse': {
            '0%, 100%': { transform: 'translate(0, 0)' },
            '50%': { transform: 'translate(-30px, 30px)' },
          },
        }}
      />

      {/* Floating Medical Icons */}
      <Box
        sx={{
          position: 'fixed',
          top: '20%',
          right: '15%',
          color: '#667eea',
          opacity: 0.08,
          fontSize: { xs: 80, sm: 120 },
          pointerEvents: 'none',
          zIndex: 0,
          animation: 'float 12s ease-in-out infinite',
        }}
      >
        <Healing sx={{ fontSize: 'inherit' }} />
      </Box>
      <Box
        sx={{
          position: 'fixed',
          bottom: '25%',
          left: '10%',
          color: '#10b981',
          opacity: 0.08,
          fontSize: { xs: 70, sm: 100 },
          pointerEvents: 'none',
          zIndex: 0,
          animation: 'float-reverse 14s ease-in-out infinite',
        }}
      >
        <Vaccines sx={{ fontSize: 'inherit' }} />
      </Box>
      <Box
        sx={{
          position: 'fixed',
          top: '50%',
          left: '5%',
          color: '#f59e0b',
          opacity: 0.06,
          fontSize: { xs: 60, sm: 90 },
          pointerEvents: 'none',
          zIndex: 0,
          animation: 'float 16s ease-in-out infinite',
        }}
      >
        <MonitorHeart sx={{ fontSize: 'inherit' }} />
      </Box>

      {/* Header - Enhanced Medical Futurism */}
      <Fade in timeout={600}>
        <Box sx={{ mb: 4, position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                bgcolor: '#667eea',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
              }}
            >
              <DashboardIcon sx={{ fontSize: 24, color: 'white' }} />
            </Box>
            <Typography
              variant="h5"
              component="h1"
              sx={{
                fontWeight: 700,
                fontSize: { xs: '1.25rem', sm: '1.5rem' },
                color: '#667eea',
                letterSpacing: '-0.01em',
              }}
            >
              Admin Dashboard
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
            Welcome back, {currentUser?.first_name}! Here's an overview of your clinic.
          </Typography>
        </Box>
      </Fade>

      {/* Error Alert */}
      {hasError && (
        <Fade in timeout={800}>
          <Alert
            severity="warning"
            sx={{
              mb: 3,
              borderRadius: 3,
              border: '1px solid rgba(245, 158, 11, 0.2)',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.15)',
              position: 'relative',
              zIndex: 1,
            }}
          >
            Some statistics could not be loaded. Showing available data.
          </Alert>
        </Fade>
      )}

      {/* Statistics Cards */}
      <Fade in timeout={1000}>
        <Grid container spacing={3} sx={{ mb: 4, position: 'relative', zIndex: 1 }}>
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
      </Fade>

      <Fade in timeout={1200}>
        <Grid container spacing={3} sx={{ position: 'relative', zIndex: 1 }}>
        {/* Quick Actions - Enhanced Glassmorphism - Full width */}
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: 4,
              border: '1px solid rgba(102, 126, 234, 0.15)',
              boxShadow: '0 8px 32px rgba(102, 126, 234, 0.1)',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
              },
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                display: 'flex',
                alignItems: 'center',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              <DashboardIcon sx={{ mr: 1, color: '#667eea' }} />
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              {quickActions.map((action, index) => (
                <Grid item xs={12} sm={6} md={4} lg={4} key={index}>
                  <Card
                    elevation={0}
                    sx={{
                      height: '100%',
                      cursor: 'pointer',
                      background: 'rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: 3,
                      border: '1px solid rgba(102, 126, 234, 0.1)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 24px rgba(102, 126, 234, 0.2)',
                        border: '1px solid rgba(102, 126, 234, 0.3)',
                      }
                    }}
                    onClick={action.action}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        {action.icon}
                        <Box sx={{ ml: 2 }}>
                          <Typography variant="h6" component="div" sx={{ fontSize: { xs: '1rem', md: '1.1rem' } }}>
                            {action.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                            {action.description}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        color={action.color as any}
                        sx={{
                          fontWeight: 600,
                          textTransform: 'none',
                          px: 2,
                        }}
                      >
                        Open
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Tenant Info - Enhanced Glassmorphism */}
        <Grid item xs={12} sm={6} md={4}>
          {tenantLoading ? (
            <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 4 }} />
          ) : tenantInfo ? (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                height: '100%',
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
                backdropFilter: 'blur(20px)',
                borderRadius: 4,
                border: '2px solid rgba(102, 126, 234, 0.2)',
                boxShadow: '0 8px 32px rgba(102, 126, 234, 0.15)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                },
              }}
            >
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                <DashboardIcon sx={{ mr: 1, color: '#667eea' }} />
                Your Clinic
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Clinic Name
                </Typography>
                <Typography variant="h6" fontWeight={600} sx={{ fontSize: { xs: '1rem', md: '1.1rem' } }}>
                  {tenantInfo.tenant_name}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Subscription Plan
                </Typography>
                <Chip
                  label={tenantInfo.subscription_plan.toUpperCase()}
                  sx={{
                    background: tenantInfo.subscription_plan === 'trial'
                      ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                      : tenantInfo.subscription_plan === 'basic'
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                  }}
                />
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Doctor Limits */}
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" fontWeight={600}>
                      Doctors
                    </Typography>
                    <Typography variant="body2" fontWeight={700} color={tenantInfo.doctors.can_add ? 'success.main' : 'error.main'}>
                      {tenantInfo.doctors.current} / {tenantInfo.doctors.max}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: '100%',
                      height: 8,
                      bgcolor: 'rgba(102, 126, 234, 0.1)',
                      borderRadius: 1,
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      sx={{
                        width: `${(tenantInfo.doctors.current / tenantInfo.doctors.max) * 100}%`,
                        height: '100%',
                        background: tenantInfo.doctors.can_add
                          ? 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
                          : 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </Box>
                </Box>

                {/* Patient Limits */}
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" fontWeight={600}>
                      Patients
                    </Typography>
                    <Typography variant="body2" fontWeight={700} color={tenantInfo.patients.can_add ? 'success.main' : 'error.main'}>
                      {tenantInfo.patients.current} / {tenantInfo.patients.max}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: '100%',
                      height: 8,
                      bgcolor: 'rgba(16, 185, 129, 0.1)',
                      borderRadius: 1,
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      sx={{
                        width: `${(tenantInfo.patients.current / tenantInfo.patients.max) * 100}%`,
                        height: '100%',
                        background: tenantInfo.patients.can_add
                          ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                          : 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </Box>
                </Box>
              </Box>

              {!tenantInfo.doctors.can_add && (
                <Alert
                  severity="warning"
                  sx={{
                    mt: 2,
                    borderRadius: 2,
                    '& .MuiAlert-message': {
                      fontSize: '0.75rem',
                    },
                  }}
                >
                  Doctor limit reached. Upgrade plan to add more.
                </Alert>
              )}

              <Button
                variant="contained"
                fullWidth
                startIcon={<PersonAddIcon />}
                onClick={() => navigate('/admin/add-doctor')}
                disabled={!tenantInfo.doctors.can_add}
                sx={{
                  mt: 2,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5568d3 0%, #653a8e 100%)',
                  },
                }}
              >
                Add New Doctor
              </Button>
            </Paper>
          ) : null}
        </Grid>

        {/* Today's Summary - Enhanced Glassmorphism */}
        <Grid item xs={12} sm={6} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              height: '100%',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: 4,
              border: '1px solid rgba(102, 126, 234, 0.15)',
              boxShadow: '0 8px 32px rgba(102, 126, 234, 0.1)',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
              },
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                display: 'flex',
                alignItems: 'center',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              <AppointmentsIcon sx={{ mr: 1, color: '#667eea' }} />
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
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 1.75,
                    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                    borderRadius: 2,
                    border: '1px solid rgba(102, 126, 234, 0.2)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateX(4px)',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ScheduledIcon sx={{ color: '#667eea' }} />
                    <Typography variant="body2" fontWeight={600}>Scheduled</Typography>
                  </Box>
                  <Chip
                    label={appointmentStats.scheduled}
                    sx={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      fontWeight: 700,
                    }}
                    size="small"
                  />
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 1.75,
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%)',
                    borderRadius: 2,
                    border: '1px solid rgba(245, 158, 11, 0.2)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateX(4px)',
                      boxShadow: '0 4px 12px rgba(245, 158, 11, 0.15)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InProgressIcon sx={{ color: '#f59e0b' }} />
                    <Typography variant="body2" fontWeight={600}>In Progress</Typography>
                  </Box>
                  <Chip
                    label={appointmentStats.inProgress}
                    sx={{
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: 'white',
                      fontWeight: 700,
                    }}
                    size="small"
                  />
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 1.75,
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)',
                    borderRadius: 2,
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateX(4px)',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CompletedIcon sx={{ color: '#10b981' }} />
                    <Typography variant="body2" fontWeight={600}>Completed</Typography>
                  </Box>
                  <Chip
                    label={appointmentStats.completed}
                    sx={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      fontWeight: 700,
                    }}
                    size="small"
                  />
                </Box>

                {appointmentStats.cancelled > 0 && (
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 1.75,
                      background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)',
                      borderRadius: 2,
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateX(4px)',
                        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)',
                      },
                    }}
                  >
                    <Typography variant="body2" fontWeight={600}>Cancelled</Typography>
                    <Chip
                      label={appointmentStats.cancelled}
                      sx={{
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        color: 'white',
                        fontWeight: 700,
                      }}
                      size="small"
                    />
                  </Box>
                )}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Specialization Summary - Enhanced Glassmorphism */}
        <Grid item xs={12} sm={12} md={4}>
          {doctorStats?.specialization_counts && Object.keys(doctorStats.specialization_counts).length > 0 ? (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                height: '100%',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRadius: 4,
                border: '1px solid rgba(102, 126, 234, 0.15)',
                boxShadow: '0 8px 32px rgba(102, 126, 234, 0.1)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                },
              }}
            >
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                <DoctorsIcon sx={{ mr: 1, color: '#667eea' }} />
                Doctors by Specialty
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                {Object.entries(doctorStats.specialization_counts).map(([specialty, count]) => (
                  <Chip
                    key={specialty}
                    label={`${specialty}: ${count}`}
                    sx={{
                      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                      border: '1px solid rgba(102, 126, 234, 0.3)',
                      fontWeight: 600,
                      color: '#667eea',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)',
                      },
                    }}
                    size="small"
                  />
                ))}
              </Box>
            </Paper>
          ) : (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                height: '100%',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRadius: 4,
                border: '1px solid rgba(102, 126, 234, 0.15)',
                boxShadow: '0 8px 32px rgba(102, 126, 234, 0.1)',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                },
              }}
            >
              <DoctorsIcon sx={{ fontSize: 48, color: 'rgba(102, 126, 234, 0.3)', mb: 1 }} />
              <Typography variant="body2" color="text.secondary" textAlign="center">
                No doctors registered yet
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate('/doctors/register')}
                sx={{
                  mt: 2,
                  borderColor: 'rgba(102, 126, 234, 0.3)',
                  color: '#667eea',
                  '&:hover': {
                    borderColor: '#667eea',
                    background: 'rgba(102, 126, 234, 0.05)',
                  },
                }}
              >
                Register Doctor
              </Button>
            </Paper>
          )}
        </Grid>
      </Grid>
      </Fade>
    </Box>
  );
};
