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
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../hooks';
import { useToast } from '../../components/common/Toast';
import {
  useGetDoctorTodayAppointmentsQuery,
  useGetDoctorTodayProceduresQuery,
  useGetDoctorProfileQuery,
} from '../../store/api';
import { StatCard } from '../../components/dashboard/StatCard';
import { getCurrentDoctorId } from '../../utils/doctorUtils';
import { setSelectedOfficeId, setAppointmentsSidebarOpen, setSidebarMode, setSidebarOpen } from '../../store/slices/uiSlice';

// Office color palette for easy identification
const OFFICE_COLORS = [
  { bg: '#e3f2fd', border: '#1976d2', text: '#0d47a1' }, // Blue
  { bg: '#e8f5e9', border: '#4caf50', text: '#1b5e20' }, // Green
  { bg: '#fff3e0', border: '#ff9800', text: '#e65100' }, // Orange
  { bg: '#f3e5f5', border: '#9c27b0', text: '#4a148c' }, // Purple
  { bg: '#e0f7fa', border: '#00bcd4', text: '#006064' }, // Cyan
  { bg: '#fce4ec', border: '#e91e63', text: '#880e4f' }, // Pink
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

  // Open both sidebars, reset office filter, and refetch data when dashboard loads
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
  }, [dispatch, refetchAppointments, refetchProcedures, isDentalDoctor]);

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

    // Build stats for all offices (even with 0 count)
    const stats = offices.map((office, index) => ({
      id: office.id,
      name: office.name,
      address: office.address,
      is_primary: office.is_primary,
      count: countMap[office.id] || 0,
      colorIndex: index % OFFICE_COLORS.length,
    }));

    // Add "No Office" if there are appointments without office_id
    const noOfficeCount = countMap['no_office'] || 0;
    if (noOfficeCount > 0 || offices.length === 0) {
      stats.push({
        id: 'no_office',
        name: 'Default',
        address: '',
        is_primary: offices.length === 0,
        count: noOfficeCount,
        colorIndex: stats.length % OFFICE_COLORS.length,
      });
    }

    return stats;
  }, [doctorProfile?.offices, todayAppointments]);

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
        overflow: 'visible', // Allow parent to handle scroll
        // Minimum width for tablet to ensure content is readable
        minWidth: { xs: 'auto', md: 500, lg: 'auto' },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 2,
          pb: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 600,
              color: 'text.primary',
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
            }}
          >
            Welcome back, Dr. {user?.first_name}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: 'text.secondary',
              mt: 0.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <CalendarMonth sx={{ fontSize: 18 }} />
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/appointments/book')}
            sx={{
              px: 2.5,
              py: 1,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500,
              boxShadow: '0 2px 8px rgba(25, 118, 210, 0.25)',
            }}
          >
            New Appointment
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRefreshAll}
            disabled={appointmentsLoading}
            sx={{
              px: 2,
              py: 1,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500,
            }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Error Messages */}
      {appointmentsError && (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          There was an error loading appointment data. Please try refreshing.
        </Alert>
      )}

      {/* Statistics Cards - Responsive grid that works with sidebars */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',                              // 1 column on mobile
            sm: 'repeat(2, 1fr)',                   // 2 columns on small tablets
            md: 'repeat(2, 1fr)',                   // 2 columns on tablets (with sidebars open)
            lg: `repeat(${statCardCount}, 1fr)`,    // All columns on desktop
          },
          gap: { xs: 1.5, sm: 2, md: 2 },
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

      {/* Bottom Section - Office Locations and Quick Actions */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', lg: 'row' },
          gap: 2.5,
          flexShrink: 0,
        }}
      >
        {/* Office-wise Appointments */}
        {officeStats.length > 0 && (
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              bgcolor: 'white',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              flex: { lg: 1.5 },
              minWidth: 0,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  fontSize: '1rem',
                }}
              >
                <LocationOn color="primary" sx={{ fontSize: 22 }} />
                Office Locations
              </Typography>
              <Chip
                label="Click to filter"
                size="small"
                variant="outlined"
                sx={{
                  height: 24,
                  fontSize: '0.7rem',
                  borderColor: 'grey.300',
                }}
              />
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'repeat(2, 1fr)',
                  sm: 'repeat(auto-fit, minmax(180px, 1fr))',
                },
                gap: 2,
              }}
            >
              {officeStats.map((office) => {
                const colors = OFFICE_COLORS[office.colorIndex];
                const isSelected = selectedOfficeId === office.id;

                return (
                  <Paper
                    key={office.id}
                    elevation={isSelected ? 2 : 0}
                    onClick={() => handleOfficeSelect(office.id)}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      bgcolor: isSelected ? colors.bg : 'grey.50',
                      border: '2px solid',
                      borderColor: isSelected ? colors.border : 'transparent',
                      borderRadius: 2,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: colors.bg,
                        borderColor: colors.border,
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 1.5,
                          bgcolor: colors.border,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          flexShrink: 0,
                        }}
                      >
                        <LocalHospital />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                          <Typography
                            variant="body2"
                            fontWeight="600"
                            noWrap
                            sx={{ color: isSelected ? colors.text : 'text.primary' }}
                          >
                            {office.name}
                          </Typography>
                          {office.is_primary && (
                            <Chip
                              label="Primary"
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: '0.6rem',
                                bgcolor: colors.border,
                                color: 'white',
                              }}
                            />
                          )}
                        </Box>
                        <Typography
                          variant="h5"
                          fontWeight="700"
                          sx={{
                            color: isSelected ? colors.text : 'text.primary',
                            lineHeight: 1.2,
                            mt: 0.5,
                          }}
                        >
                          {office.count}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
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

        {/* Quick Actions */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            bgcolor: 'white',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            flex: { lg: 1 },
            minWidth: 0,
          }}
        >
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, mb: 2, fontSize: '1rem' }}
          >
            Quick Actions
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
            }}
          >
            <Button
              variant="contained"
              fullWidth
              startIcon={<AddIcon />}
              onClick={() => navigate('/appointments/book')}
              sx={{
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                justifyContent: 'flex-start',
                px: 2.5,
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
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                justifyContent: 'flex-start',
                px: 2.5,
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
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                justifyContent: 'flex-start',
                px: 2.5,
              }}
            >
              Search Patients
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};
