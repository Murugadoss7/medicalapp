/**
 * Doctor Dashboard - Medical Futurism Design
 * Enhanced with glassmorphism, gradients, and smooth animations
 * iPad-friendly responsive design
 */

import { useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Alert,
  Button,
  CircularProgress,
  Backdrop,
  Paper,
  Divider,
  Chip,
  Fade,
} from '@mui/material';
import {
  Today,
  CheckCircle,
  Refresh,
  Add as AddIcon,
  HourglassEmpty,
  LocalHospital,
  LocationOn,
  MedicalServices,
  CalendarMonth,
  Search,
  Healing,
  Vaccines,
  MonitorHeart,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../hooks';
import { useToast } from '../../components/common/Toast';
import {
  useGetDoctorTodayAppointmentsQuery,
  useGetDoctorTodayProceduresQuery,
  useGetDoctorProfileQuery,
  useGetMyTenantQuery,
} from '../../store/api';
import { StatCard } from '../../components/dashboard/StatCard';
import { getCurrentDoctorId } from '../../utils/doctorUtils';
import { setSelectedOfficeId, setAppointmentsSidebarOpen, setSidebarMode, setSidebarOpen } from '../../store/slices/uiSlice';
import { ResponsiveButton } from '../../components/common/ResponsiveButton';

// Office color palette - Medical Futurism gradients
const OFFICE_COLORS = [
  {
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    glow: 'rgba(102, 126, 234, 0.25)',
    color: '#667eea',
  }, // Purple
  {
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    glow: 'rgba(16, 185, 129, 0.25)',
    color: '#10b981',
  }, // Green
  {
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    glow: 'rgba(245, 158, 11, 0.25)',
    color: '#f59e0b',
  }, // Orange
  {
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    glow: 'rgba(59, 130, 246, 0.25)',
    color: '#3b82f6',
  }, // Blue
  {
    gradient: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
    glow: 'rgba(0, 212, 255, 0.25)',
    color: '#00d4ff',
  }, // Cyan
  {
    gradient: 'linear-gradient(135deg, #ff6b9d 0%, #c9184a 100%)',
    glow: 'rgba(255, 107, 157, 0.25)',
    color: '#ff6b9d',
  }, // Pink
];

export const DoctorDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { selectedOfficeId, appointmentsSidebarOpen } = useAppSelector((state) => state.ui);
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

  // Check if doctor has dental specialization
  const isDentalDoctor = useMemo(() => {
    return user?.specialization?.toLowerCase().includes('dental') ||
           user?.specialization?.toLowerCase().includes('dentist');
  }, [user?.specialization]);

  // API queries - Get ALL today's appointments (no status filter)
  const {
    data: todayAppointmentsData,
    isLoading: appointmentsLoading,
    error: appointmentsError,
    refetch: refetchAppointments,
  } = useGetDoctorTodayAppointmentsQuery(doctorId);

  // Get today's dental procedures (only for dental doctors)
  const {
    data: todayProceduresData,
    isLoading: proceduresLoading,
    refetch: refetchProcedures,
  } = useGetDoctorTodayProceduresQuery(doctorId, {
    skip: !isDentalDoctor, // Skip if not a dental doctor
  });

  // Get doctor profile for offices data (use doctorId, not userId)
  const {
    data: doctorProfile,
    isLoading: profileLoading,
    refetch: refetchProfile,
  } = useGetDoctorProfileQuery(doctorId, {
    skip: !doctorId,
  });

  // Get tenant info for clinic name
  const { data: tenantData } = useGetMyTenantQuery();

  // Open both sidebars, reset office filter, and refetch data when dashboard loads
  // CRITICAL: Must be AFTER hooks are defined to avoid reference errors
  useEffect(() => {
    dispatch(setSidebarOpen(true));
    dispatch(setAppointmentsSidebarOpen(true));
    // Reset to show ALL appointments from all locations
    dispatch(setSelectedOfficeId(null));

    // CRITICAL FIX: Refetch appointments and procedures to show latest data
    // This ensures newly created procedures from dental consultation appear immediately
    refetchAppointments();
    if (isDentalDoctor) {
      refetchProcedures();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, isDentalDoctor]); // Removed refetch functions to prevent infinite loop

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

  // Compute office stats from appointments and doctor's offices
  const officeStats = useMemo(() => {
    const offices = doctorProfile?.offices || [];
    const activeAppointments = todayAppointments.filter(
      (apt) => apt.status !== 'cancelled' && apt.status !== 'no_show'
    );

    // Create a map of office_id to count
    const countMap: Record<string, number> = {};
    activeAppointments.forEach((apt) => {
      const officeId = apt.office_id || 'no_office';
      countMap[officeId] = (countMap[officeId] || 0) + 1;
    });

    // Deduplicate offices by id (keep first occurrence)
    const uniqueOfficesMap = new Map<string, typeof offices[0]>();
    offices.forEach((office) => {
      if (!uniqueOfficesMap.has(office.id)) {
        uniqueOfficesMap.set(office.id, office);
      }
    });
    const uniqueOffices = Array.from(uniqueOfficesMap.values());

    // Build stats for all unique offices (even with 0 count)
    const stats = uniqueOffices.map((office, index) => ({
      id: office.id,
      name: office.name,
      address: office.address,
      is_primary: office.is_primary,
      count: countMap[office.id] || 0,
      colorIndex: index % OFFICE_COLORS.length,
    }));

    // Add "No Office" if there are appointments without office_id
    // Use the tenant's clinic name instead of "Default"
    const noOfficeCount = countMap['no_office'] || 0;
    if (noOfficeCount > 0 || offices.length === 0) {
      stats.push({
        id: 'no_office',
        name: tenantData?.tenant_name || 'Clinic',
        address: '',
        is_primary: offices.length === 0,
        count: noOfficeCount,
        colorIndex: stats.length % OFFICE_COLORS.length,
      });
    }

    return stats;
  }, [doctorProfile?.offices, todayAppointments, tenantData?.tenant_name]);

  // REMOVED: Auto-select first office
  // Now defaults to showing ALL appointments across all locations
  // Users can click on a specific office to filter
  // This provides better visibility of all appointments on dashboard load

  // Handle office selection - shows appointments for that office
  const handleOfficeSelect = (officeId: string) => {
    dispatch(setSelectedOfficeId(officeId));
    dispatch(setSidebarMode('appointments'));
    // Open sidebar if not already open
    if (!appointmentsSidebarOpen) {
      dispatch(setAppointmentsSidebarOpen(true));
    }
  };

  // Handle procedures card click - shows procedures in sidebar
  const handleProceduresClick = () => {
    dispatch(setSidebarMode('procedures'));
    dispatch(setAppointmentsSidebarOpen(true));
  };

  const handleRefreshAll = async () => {
    try {
      await Promise.all([
        refetchAppointments(),
        refetchProfile(),
        ...(isDentalDoctor ? [refetchProcedures()] : []),
      ]);
      toast.success('Dashboard refreshed successfully');
    } catch {
      toast.error('Failed to refresh dashboard');
    }
  };

  // Show loading backdrop for initial load
  if (appointmentsLoading) {
    return (
      <Backdrop open sx={{ zIndex: 1 }}>
        <CircularProgress color="primary" />
      </Backdrop>
    );
  }

  // Calculate number of stat cards
  const statCardCount = isDentalDoctor ? 4 : 3;

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: { xs: 2, sm: 2.5, md: 3 },
        overflow: 'visible',
        minWidth: { xs: 'auto', md: 500, lg: 'auto' },
        position: 'relative',
      }}
    >
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
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 2,
            pb: 2,
            borderBottom: '2px solid',
            borderColor: 'rgba(102, 126, 234, 0.15)',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
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
                <MedicalServices sx={{ fontSize: 24, color: 'white' }} />
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
                Welcome back, Dr. {user?.first_name}
              </Typography>
            </Box>
            <Typography
              variant="body1"
              sx={{
                color: 'text.secondary',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                fontWeight: 500,
              }}
            >
              <CalendarMonth sx={{ fontSize: 18, color: '#667eea' }} />
              {new Date().toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <ResponsiveButton
              label="New Appointment"
              icon={<AddIcon />}
              onClick={() => navigate('/appointments/book')}
              variant="contained"
              color="primary"
            />
            <ResponsiveButton
              label="Refresh"
              icon={<Refresh />}
              onClick={handleRefreshAll}
              disabled={appointmentsLoading}
              variant="outlined"
              color="primary"
            />
          </Box>
        </Box>
      </Fade>

      {/* Error Messages */}
      {appointmentsError && (
        <Fade in timeout={800}>
          <Alert
            severity="error"
            sx={{
              borderRadius: 3,
              border: '1px solid rgba(239, 68, 68, 0.2)',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)',
              position: 'relative',
              zIndex: 1,
            }}
          >
            There was an error loading appointment data. Please try refreshing.
          </Alert>
        </Fade>
      )}

      {/* Statistics Cards - Responsive grid with staggered animations */}
      <Fade in timeout={1000}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(2, 1fr)',
              lg: `repeat(${statCardCount}, 1fr)`,
            },
            gap: { xs: 1.5, sm: 2, md: 2 },
            position: 'relative',
            zIndex: 1,
          }}
        >
        <StatCard
          title="Today's Appointments"
          value={statistics.total}
          icon={<Today />}
          loading={appointmentsLoading}
          color="primary"
          subtitle={`${statistics.scheduled} scheduled, ${statistics.inProgress} in progress`}
        />
        <StatCard
          title="Completed"
          value={statistics.completed}
          icon={<CheckCircle />}
          loading={appointmentsLoading}
          color="success"
          subtitle="Consultations done today"
        />
        <StatCard
          title="Pending"
          value={statistics.pending}
          icon={<HourglassEmpty />}
          loading={appointmentsLoading}
          color="warning"
          subtitle="Waiting to be seen"
        />
        {isDentalDoctor && (
          <StatCard
            title="Today's Procedures"
            value={todayProceduresData?.total || 0}
            icon={<MedicalServices />}
            loading={proceduresLoading}
            color="secondary"
            subtitle="Click to view procedures"
            onClick={handleProceduresClick}
          />
        )}
        </Box>
      </Fade>

      {/* Bottom Section - Office Locations and Quick Actions */}
      <Fade in timeout={1200}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', lg: 'row' },
            gap: { xs: 2.5, md: 2, lg: 2.5 }, // Tighter spacing on iPad
            flexShrink: 0,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Office-wise Appointments - Enhanced Glassmorphism */}
          {officeStats.length > 0 && (
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, md: 2, lg: 3 }, // Compact padding on iPad
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRadius: 4,
                border: '1px solid rgba(102, 126, 234, 0.15)',
                boxShadow: '0 8px 32px rgba(102, 126, 234, 0.1)',
                flex: { lg: 1.5 },
                minWidth: 0,
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
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: { xs: 2.5, md: 1.5, lg: 2.5 } }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  fontSize: { xs: '1.125rem', md: '1rem', lg: '1.125rem' }, // Smaller on iPad
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                <LocationOn sx={{ fontSize: { xs: 22, md: 20, lg: 22 }, color: '#667eea' }} />
                Office Locations
              </Typography>
              <Chip
                label="Click to filter"
                size="small"
                sx={{
                  height: 26,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                  border: '1px solid rgba(102, 126, 234, 0.3)',
                  color: '#667eea',
                }}
              />
            </Box>
            <Divider sx={{ mb: { xs: 2.5, md: 1.5, lg: 2.5 }, borderColor: 'rgba(102, 126, 234, 0.1)' }} />
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'repeat(2, 1fr)',
                  sm: 'repeat(auto-fit, minmax(180px, 1fr))',
                  md: 'repeat(2, 1fr)', // Fixed 2 columns on iPad for compact layout
                  lg: 'repeat(auto-fit, minmax(180px, 1fr))',
                },
                gap: { xs: 2, md: 1.5, lg: 2 }, // Tighter gap on iPad
              }}
            >
              {officeStats.map((office) => {
                const styles = OFFICE_COLORS[office.colorIndex];
                const isSelected = selectedOfficeId === office.id;

                return (
                  <Paper
                    key={office.id}
                    elevation={0}
                    onClick={() => handleOfficeSelect(office.id)}
                    sx={{
                      p: { xs: 2.5, md: 1.75, lg: 2.5 }, // Compact padding on iPad
                      cursor: 'pointer',
                      background: isSelected
                        ? `linear-gradient(135deg, ${styles.color}15 0%, ${styles.color}10 100%)`
                        : 'rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(10px)',
                      border: '2px solid',
                      borderColor: isSelected ? styles.color : 'rgba(102, 126, 234, 0.1)',
                      borderRadius: 3,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: isSelected
                        ? `0 6px 20px ${styles.glow}`
                        : '0 2px 8px rgba(0, 0, 0, 0.04)',
                      '&:hover': {
                        background: `linear-gradient(135deg, ${styles.color}20 0%, ${styles.color}15 100%)`,
                        borderColor: styles.color,
                        transform: 'translateY(-4px)',
                        boxShadow: `0 8px 24px ${styles.glow}`,
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, md: 1, lg: 1.5 } }}>
                      <Box
                        sx={{
                          width: { xs: 48, md: 40, lg: 48 }, // Smaller icon on iPad
                          height: { xs: 48, md: 40, lg: 48 },
                          borderRadius: 2.5,
                          background: styles.gradient,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          flexShrink: 0,
                          boxShadow: `0 4px 12px ${styles.glow}`,
                          '& svg': {
                            fontSize: { xs: 24, md: 20, lg: 24 },
                          },
                        }}
                      >
                        <LocalHospital />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap', mb: 0.5 }}>
                          <Typography
                            variant="body2"
                            fontWeight="700"
                            noWrap
                            sx={{
                              color: 'text.primary',
                              fontSize: '0.875rem',
                            }}
                          >
                            {office.name}
                          </Typography>
                          {office.is_primary && (
                            <Chip
                              label="Primary"
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                background: styles.gradient,
                                color: 'white',
                                border: 'none',
                              }}
                            />
                          )}
                        </Box>
                        <Typography
                          variant="h5"
                          fontWeight="800"
                          sx={{
                            background: styles.gradient,
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            lineHeight: 1.2,
                            fontSize: '1.75rem',
                          }}
                        >
                          {office.count}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'text.secondary',
                            fontWeight: 500,
                            fontSize: '0.75rem',
                          }}
                        >
                          appointment{office.count !== 1 ? 's' : ''} today
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          </Paper>
        )}

        {/* Quick Actions - Enhanced Glassmorphism */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 2, lg: 3 }, // Compact padding on iPad
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: 4,
              border: '1px solid rgba(102, 126, 234, 0.15)',
              boxShadow: '0 8px 32px rgba(102, 126, 234, 0.1)',
              flex: { lg: 1 },
              minWidth: 0,
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
              sx={{
                fontWeight: 700,
                mb: { xs: 2.5, md: 1.5, lg: 2.5 }, // Less margin on iPad
                fontSize: { xs: '1.125rem', md: '1rem', lg: '1.125rem' }, // Smaller on iPad
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Quick Actions
            </Typography>
            <Divider sx={{ mb: { xs: 2.5, md: 1.5, lg: 2.5 }, borderColor: 'rgba(102, 126, 234, 0.1)' }} />
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: { xs: 1.5, md: 1.25, lg: 1.5 }, // Tighter gap on iPad
              }}
            >
              <Button
                variant="contained"
                fullWidth
                startIcon={<AddIcon />}
                onClick={() => navigate('/appointments/book')}
                sx={{
                  py: { xs: 1.75, md: 1.25, lg: 1.75 }, // Compact button on iPad
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: { xs: '0.875rem', md: '0.8125rem', lg: '0.875rem' },
                  justifyContent: 'flex-start',
                  px: 2.5,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
                    background: 'linear-gradient(135deg, #5568d3 0%, #66348a 100%)',
                  },
                }}
              >
                Book New Appointment
              </Button>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<CalendarMonth />}
                onClick={() => navigate('/appointments')}
                sx={{
                  py: { xs: 1.75, md: 1.25, lg: 1.75 }, // Compact button on iPad
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: { xs: '0.875rem', md: '0.8125rem', lg: '0.875rem' },
                  justifyContent: 'flex-start',
                  px: 2.5,
                  borderWidth: 2,
                  borderColor: '#667eea',
                  color: '#667eea',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    borderWidth: 2,
                    borderColor: '#667eea',
                    background: 'rgba(102, 126, 234, 0.1)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                View All Appointments
              </Button>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<Search />}
                onClick={() => navigate('/patients')}
                sx={{
                  py: { xs: 1.75, md: 1.25, lg: 1.75 }, // Compact button on iPad
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: { xs: '0.875rem', md: '0.8125rem', lg: '0.875rem' },
                  justifyContent: 'flex-start',
                  px: 2.5,
                  borderWidth: 2,
                  borderColor: '#10b981',
                  color: '#10b981',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    borderWidth: 2,
                    borderColor: '#10b981',
                    background: 'rgba(16, 185, 129, 0.1)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                Search Patients
              </Button>
            </Box>
          </Paper>
        </Box>
      </Fade>
    </Box>
  );
};
