import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  ToggleButton,
  ToggleButtonGroup,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  CalendarToday,
  List,
  Add,
  Refresh,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../../store';
import { 
  AppointmentCalendar,
  AppointmentList, 
  AppointmentFilters,
} from '../../components/appointments';
import { 
  useUpdateAppointmentStatusMutation,
  useCancelAppointmentMutation,
} from '../../store/api';
import type { Appointment, AppointmentFilters as FilterType } from '../../store/api';
import { getCurrentDoctorId, isCurrentUserDoctor } from '../../utils/doctorUtils';

type ViewMode = 'calendar' | 'list';

export const DoctorAppointments = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [filters, setFilters] = useState<FilterType>({});
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const user = useSelector((state: RootState) => state.auth.user);
  
  // Use the correct doctor ID - this should match the ID used in appointment creation
  const doctorId = getCurrentDoctorId();
  
  // Check if user is authorized to view doctor appointments
  if (!isCurrentUserDoctor(user?.role)) {
    return (
      <Box>
        <Alert severity="error">
          Access denied. You must be a doctor to view appointments.
        </Alert>
      </Box>
    );
  }

  const [updateStatus] = useUpdateAppointmentStatusMutation();
  const [cancelAppointment] = useCancelAppointmentMutation();

  const handleViewModeChange = (
    event: React.MouseEvent<HTMLElement>,
    newViewMode: ViewMode,
  ) => {
    if (newViewMode !== null) {
      setViewMode(newViewMode);
    }
  };

  const handleFiltersChange = (newFilters: FilterType) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailsDialog(true);
  };

  const handleCloseDetailsDialog = () => {
    setShowDetailsDialog(false);
    setSelectedAppointment(null);
  };

  const handleStatusUpdate = async (appointmentId: string, status: string) => {
    try {
      await updateStatus({ appointmentId, status }).unwrap();
      setSnackbar({
        open: true,
        message: `Appointment status updated to ${status}`,
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to update appointment status',
        severity: 'error',
      });
    }
  };

  const handleCancelAppointment = async (appointment: Appointment) => {
    try {
      await cancelAppointment({ 
        appointmentId: appointment.id,
        reason: 'Cancelled by doctor',
      }).unwrap();
      setSnackbar({
        open: true,
        message: 'Appointment cancelled successfully',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to cancel appointment',
        severity: 'error',
      });
    }
  };

  const handleEditAppointment = (appointment: Appointment) => {
    // TODO: Implement reschedule functionality
    setSnackbar({
      open: true,
      message: 'Reschedule functionality coming soon',
      severity: 'info',
    });
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const refreshData = () => {
    // Data will refresh automatically due to RTK Query cache invalidation
    setSnackbar({
      open: true,
      message: 'Data refreshed',
      severity: 'success',
    });
  };

  if (!doctorId) {
    return (
      <Box>
        <Alert severity="error">
          Unable to load doctor information. Please try logging in again.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          My Appointments
        </Typography>
        
        <Box display="flex" gap={2} alignItems="center">
          <Button
            startIcon={<Refresh />}
            onClick={refreshData}
            variant="outlined"
            size="small"
          >
            Refresh
          </Button>
          
          <Button
            startIcon={<Add />}
            variant="contained"
            size="small"
            onClick={() => navigate('/appointments/book')}
          >
            New Appointment
          </Button>

          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            size="small"
          >
            <ToggleButton value="calendar" aria-label="calendar view">
              <CalendarToday />
            </ToggleButton>
            <ToggleButton value="list" aria-label="list view">
              <List />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Filters */}
        <Grid item xs={12}>
          <AppointmentFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClear={handleClearFilters}
          />
        </Grid>

        {/* Main Content */}
        <Grid item xs={12}>
          {viewMode === 'calendar' ? (
            <AppointmentCalendar
              doctorId={doctorId}
              onAppointmentClick={handleAppointmentClick}
              onDateClick={(date) => {
                // Set date filter when clicking on calendar date
                const dateString = date.toISOString().split('T')[0];
                handleFiltersChange({ ...filters, date: dateString });
              }}
            />
          ) : (
            <AppointmentList
              doctorId={doctorId}
              filters={filters}
              onAppointmentClick={handleAppointmentClick}
              onEditAppointment={handleEditAppointment}
              onCancelAppointment={handleCancelAppointment}
            />
          )}
        </Grid>
      </Grid>

      {/* Appointment Details Dialog */}
      <Dialog
        open={showDetailsDialog}
        onClose={handleCloseDetailsDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Appointment Details
        </DialogTitle>
        <DialogContent>
          {selectedAppointment && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedAppointment.patient_first_name}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Phone: {selectedAppointment.patient_mobile_number}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Date & Time: {new Date(selectedAppointment.appointment_datetime).toLocaleString()}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Status: {selectedAppointment.status}
              </Typography>
              {selectedAppointment.appointment_number && (
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Appointment #: {selectedAppointment.appointment_number}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {selectedAppointment?.status === 'scheduled' && (
            <Button
              onClick={() => {
                if (selectedAppointment) {
                  handleStatusUpdate(selectedAppointment.id, 'in_progress');
                  handleCloseDetailsDialog();
                }
              }}
              color="warning"
            >
              Start Consultation
            </Button>
          )}
          {selectedAppointment?.status === 'in_progress' && (
            <Button
              onClick={() => {
                if (selectedAppointment) {
                  handleStatusUpdate(selectedAppointment.id, 'completed');
                  handleCloseDetailsDialog();
                }
              }}
              color="success"
            >
              Mark Completed
            </Button>
          )}
          <Button onClick={handleCloseDetailsDialog}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

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