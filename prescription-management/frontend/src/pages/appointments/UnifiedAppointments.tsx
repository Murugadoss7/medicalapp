import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  Autocomplete,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
  Card,
  CardContent,
  Chip,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Stack,
} from '@mui/material';
import {
  CalendarToday,
  ViewWeek,
  ViewDay,
  Add,
  Refresh,
  TrendingUp,
  EventAvailable,
  Cancel as CancelIcon,
  CheckCircle,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../../store';
import {
  useListDoctorsQuery,
  useGetDoctorAppointmentsQuery,
  useCancelAppointmentMutation,
  type Doctor,
} from '../../store/api';
import { getCurrentDoctorId } from '../../utils/doctorUtils';
import { AppointmentCalendarEnhanced } from '../../components/appointments/AppointmentCalendarEnhanced';
import { WeeklyScheduleView } from '../../components/appointments/WeeklyScheduleView';

type ViewMode = 'month' | 'week' | 'day';
type StatusFilter = 'all' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export const UnifiedAppointments = () => {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);

  // Determine if user is admin/receptionist
  const isAdmin = user?.role === 'admin' || user?.role === 'receptionist';
  const isDoctor = user?.role === 'doctor';

  // For doctors, use their own ID. For admin, allow selection
  // Only call getCurrentDoctorId() for doctor users to avoid throwing errors
  const currentDoctorId = isDoctor ? getCurrentDoctorId() : null;
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(
    isDoctor && currentDoctorId ? currentDoctorId : ''
  );

  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [specializationFilter, setSpecializationFilter] = useState<string>('all');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Fetch doctors list (for admin) - use per_page to get all doctors
  const { data: doctorsData, isLoading: loadingDoctors } = useListDoctorsQuery(
    { page: 1, per_page: 100 },
    { skip: !isAdmin }
  );

  // Fetch appointments for selected doctor
  const { data: appointmentsData, isLoading: loadingAppointments, refetch } = useGetDoctorAppointmentsQuery(
    {
      doctorId: selectedDoctorId,
    },
    { skip: !selectedDoctorId }
  );

  const [cancelAppointment] = useCancelAppointmentMutation();

  // Filter appointments by status
  const filteredAppointments = useMemo(() => {
    if (!appointmentsData?.appointments) return [];
    if (statusFilter === 'all') return appointmentsData.appointments;
    return appointmentsData.appointments.filter(apt => apt.status === statusFilter);
  }, [appointmentsData, statusFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    const appointments = appointmentsData?.appointments || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    return {
      today: appointments.filter(apt => {
        const aptDate = new Date(apt.appointment_datetime);
        return aptDate >= today && aptDate <= todayEnd && apt.status !== 'cancelled';
      }).length,
      upcoming: appointments.filter(apt => {
        const aptDate = new Date(apt.appointment_datetime);
        return aptDate > todayEnd && aptDate <= nextWeek && apt.status === 'scheduled';
      }).length,
      completed: appointments.filter(apt => apt.status === 'completed').length,
      cancelled: appointments.filter(apt => apt.status === 'cancelled').length,
    };
  }, [appointmentsData]);

  const handleViewModeChange = (
    event: React.MouseEvent<HTMLElement>,
    newViewMode: ViewMode,
  ) => {
    if (newViewMode !== null) {
      setViewMode(newViewMode);
    }
  };

  const handleDoctorChange = (doctor: Doctor | null) => {
    setSelectedDoctorId(doctor?.id || '');
  };

  const handleAppointmentClick = (appointmentId: string) => {
    // Check if current user is a dental doctor
    const isDentalDoctor = user?.specialization?.toLowerCase().includes('dental') ||
                           user?.specialization?.toLowerCase().includes('dentist');

    // Route to dental consultation for dental doctors, regular consultation for others
    if (isDentalDoctor) {
      navigate(`/appointments/${appointmentId}/dental`);
    } else {
      navigate(`/doctor/consultation/${appointmentId}`);
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      await cancelAppointment({
        appointmentId,
        reason: 'Cancelled by user',
      }).unwrap();
      setSnackbar({
        open: true,
        message: 'Appointment cancelled successfully',
        severity: 'success',
      });
      refetch();
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to cancel appointment',
        severity: 'error',
      });
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleRefresh = () => {
    refetch();
    setSnackbar({
      open: true,
      message: 'Data refreshed',
      severity: 'success',
    });
  };

  const selectedDoctor = doctorsData?.doctors.find(d => d.id === selectedDoctorId);

  // Get unique specializations for filter dropdown
  const specializations = useMemo(() => {
    if (!doctorsData?.doctors) return [];
    const specs = [...new Set(doctorsData.doctors.map(d => d.specialization).filter(Boolean))];
    return specs.sort();
  }, [doctorsData]);

  // Filter doctors by specialization
  const filteredDoctors = useMemo(() => {
    if (!doctorsData?.doctors) return [];
    if (specializationFilter === 'all') return doctorsData.doctors;
    return doctorsData.doctors.filter(d => d.specialization === specializationFilter);
  }, [doctorsData, specializationFilter]);

  return (
    <Box>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        flexDirection={{ xs: 'column', sm: 'row' }}
        gap={{ xs: 2, sm: 0 }}
        mb={3}
      >
        <Typography
          variant="h4"
          component="h1"
          fontWeight={600}
          sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}
        >
          {isAdmin ? 'Appointment Management' : 'My Appointments'}
        </Typography>

        <Box display="flex" gap={{ xs: 1, sm: 2 }} alignItems="center" flexWrap="wrap">
          <Button
            startIcon={<Refresh />}
            onClick={handleRefresh}
            variant="outlined"
            size="medium"
            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
          >
            Refresh
          </Button>

          <Button
            startIcon={<Add />}
            variant="contained"
            size="medium"
            onClick={() => navigate('/appointments/book')}
            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
          >
            New Appointment
          </Button>
        </Box>
      </Box>

      {/* Doctor Selector (for admin/receptionist) */}
      {isAdmin && (
        <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            Select Doctor to View Appointments
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: { md: 'center' } }}>
            {/* Specialization Filter */}
            <Box sx={{ minWidth: { xs: '100%', md: 200 } }}>
              <FormControl fullWidth size="small">
                <InputLabel>Specialization</InputLabel>
                <Select
                  value={specializationFilter}
                  label="Specialization"
                  onChange={(e) => {
                    setSpecializationFilter(e.target.value);
                    setSelectedDoctorId(''); // Reset doctor when specialization changes
                  }}
                >
                  <MenuItem value="all">All Specializations ({doctorsData?.doctors?.length || 0})</MenuItem>
                  {specializations.map((spec) => (
                    <MenuItem key={spec} value={spec}>
                      {spec} ({doctorsData?.doctors?.filter(d => d.specialization === spec).length || 0})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Doctor Selector */}
            <Box sx={{ flex: 1, minWidth: { xs: '100%', md: 300 } }}>
              <Autocomplete
                options={filteredDoctors}
                getOptionLabel={(option) => `Dr. ${option.first_name} ${option.last_name}`}
                value={selectedDoctor || null}
                onChange={(_, newValue) => handleDoctorChange(newValue)}
                loading={loadingDoctors}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Doctor"
                    placeholder="Search by name..."
                    variant="outlined"
                    size="small"
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Box>
                      <Typography variant="body1">
                        Dr. {option.first_name} {option.last_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.specialization} • {option.phone}
                      </Typography>
                    </Box>
                  </li>
                )}
              />
            </Box>

            {/* Selected Doctor Info */}
            {selectedDoctor && (
              <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1, minWidth: { xs: '100%', md: 250 } }}>
                <Typography variant="body2" color="text.secondary">
                  Selected Doctor
                </Typography>
                <Typography variant="subtitle1" fontWeight={600}>
                  Dr. {selectedDoctor.first_name} {selectedDoctor.last_name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {selectedDoctor.specialization} • {selectedDoctor.phone}
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>
      )}

      {/* Show prompt if admin hasn't selected a doctor */}
      {isAdmin && !selectedDoctorId && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Please select a doctor to view their appointments
        </Alert>
      )}

      {/* Statistics Cards */}
      {selectedDoctorId && (
        <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography
                      variant="h3"
                      color="white"
                      fontWeight={700}
                      sx={{ fontSize: { xs: '1.75rem', sm: '3rem' } }}
                    >
                      {stats.today}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="rgba(255,255,255,0.9)"
                      sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}
                    >
                      Today's Appointments
                    </Typography>
                  </Box>
                  <EventAvailable
                    sx={{
                      fontSize: { xs: 32, sm: 48 },
                      color: 'rgba(255,255,255,0.3)',
                      display: { xs: 'none', sm: 'block' },
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={6} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography
                      variant="h3"
                      color="white"
                      fontWeight={700}
                      sx={{ fontSize: { xs: '1.75rem', sm: '3rem' } }}
                    >
                      {stats.upcoming}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="rgba(255,255,255,0.9)"
                      sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}
                    >
                      Upcoming (7 days)
                    </Typography>
                  </Box>
                  <TrendingUp
                    sx={{
                      fontSize: { xs: 32, sm: 48 },
                      color: 'rgba(255,255,255,0.3)',
                      display: { xs: 'none', sm: 'block' },
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={6} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography
                      variant="h3"
                      color="white"
                      fontWeight={700}
                      sx={{ fontSize: { xs: '1.75rem', sm: '3rem' } }}
                    >
                      {stats.completed}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="rgba(255,255,255,0.9)"
                      sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}
                    >
                      Completed
                    </Typography>
                  </Box>
                  <CheckCircle
                    sx={{
                      fontSize: { xs: 32, sm: 48 },
                      color: 'rgba(255,255,255,0.3)',
                      display: { xs: 'none', sm: 'block' },
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={6} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography
                      variant="h3"
                      color="white"
                      fontWeight={700}
                      sx={{ fontSize: { xs: '1.75rem', sm: '3rem' } }}
                    >
                      {stats.cancelled}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="rgba(255,255,255,0.9)"
                      sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}
                    >
                      Cancelled
                    </Typography>
                  </Box>
                  <CancelIcon
                    sx={{
                      fontSize: { xs: 32, sm: 48 },
                      color: 'rgba(255,255,255,0.3)',
                      display: { xs: 'none', sm: 'block' },
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters and View Toggles */}
      {selectedDoctorId && (
        <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 3 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={{ xs: 1.5, sm: 2 }}
            justifyContent="space-between"
            alignItems={{ xs: 'stretch', sm: 'center' }}
          >
            {/* Status Filter */}
            <FormControl sx={{ minWidth: { xs: '100%', sm: 200 } }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                label="Status"
                size="small"
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="scheduled">Scheduled</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>

            {/* View Mode Toggle */}
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={handleViewModeChange}
              size="small"
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              <ToggleButton value="month" aria-label="month view" sx={{ flex: { xs: 1, sm: 'initial' } }}>
                <CalendarToday sx={{ mr: { xs: 0.5, sm: 1 }, fontSize: { xs: 18, sm: 24 } }} />
                <Typography sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Month</Typography>
              </ToggleButton>
              <ToggleButton value="week" aria-label="week view" sx={{ flex: { xs: 1, sm: 'initial' } }}>
                <ViewWeek sx={{ mr: { xs: 0.5, sm: 1 }, fontSize: { xs: 18, sm: 24 } }} />
                <Typography sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Week</Typography>
              </ToggleButton>
              <ToggleButton value="day" aria-label="day view" sx={{ flex: { xs: 1, sm: 'initial' } }}>
                <ViewDay sx={{ mr: { xs: 0.5, sm: 1 }, fontSize: { xs: 18, sm: 24 } }} />
                <Typography sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Day</Typography>
              </ToggleButton>
            </ToggleButtonGroup>

            {/* Status Legend */}
            <Box display={{ xs: 'none', md: 'flex' }} gap={1} flexWrap="wrap">
              <Chip label="Scheduled" size="small" color="primary" variant="outlined" />
              <Chip label="In Progress" size="small" sx={{ bgcolor: '#ff9800', color: 'white' }} />
              <Chip label="Completed" size="small" color="success" />
              <Chip label="Cancelled" size="small" color="error" variant="outlined" />
            </Box>
          </Stack>
        </Paper>
      )}

      {/* Calendar/Schedule View */}
      {selectedDoctorId && (
        <Box sx={{ minHeight: 600 }}>
          {viewMode === 'month' && (
            <AppointmentCalendarEnhanced
              appointments={filteredAppointments}
              onAppointmentClick={handleAppointmentClick}
              onCancelAppointment={handleCancelAppointment}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
            />
          )}

          {viewMode === 'week' && (
            <WeeklyScheduleView
              appointments={filteredAppointments}
              onAppointmentClick={handleAppointmentClick}
              onCancelAppointment={handleCancelAppointment}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
            />
          )}

          {viewMode === 'day' && (
            <WeeklyScheduleView
              appointments={filteredAppointments}
              onAppointmentClick={handleAppointmentClick}
              onCancelAppointment={handleCancelAppointment}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              viewMode="day"
            />
          )}
        </Box>
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
