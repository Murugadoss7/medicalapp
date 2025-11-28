import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Box,
  Skeleton,
  IconButton,
  Tooltip,
  Button,
} from '@mui/material';
import {
  Schedule,
  Person,
  AccessTime,
  Phone,
  PlayArrow,
  CheckCircle,
  Cancel,
  HourglassEmpty,
  EventBusy,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import type { Appointment } from '../../store/api';

interface TodayScheduleProps {
  appointments: Appointment[];
  loading?: boolean;
  onAppointmentClick?: (appointment: Appointment) => void;
  onStartConsultation?: (appointment: Appointment) => void;
}

const getStatusColor = (status: Appointment['status']) => {
  switch (status) {
    case 'scheduled':
      return 'primary';
    case 'in_progress':
      return 'warning';
    case 'completed':
      return 'success';
    case 'cancelled':
      return 'error';
    case 'no_show':
      return 'default';
    default:
      return 'default';
  }
};

const getStatusLabel = (status: Appointment['status']) => {
  switch (status) {
    case 'scheduled':
      return 'Scheduled';
    case 'in_progress':
      return 'In Progress';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    case 'no_show':
      return 'No Show';
    default:
      return status;
  }
};

const getStatusIcon = (status: Appointment['status']) => {
  switch (status) {
    case 'scheduled':
      return <AccessTime fontSize="small" />;
    case 'in_progress':
      return <HourglassEmpty fontSize="small" />;
    case 'completed':
      return <CheckCircle fontSize="small" />;
    case 'cancelled':
      return <Cancel fontSize="small" />;
    case 'no_show':
      return <EventBusy fontSize="small" />;
    default:
      return <AccessTime fontSize="small" />;
  }
};

const getTimeDisplay = (appointment: Appointment) => {
  try {
    // Try appointment_datetime first, then fall back to appointment_time
    if (appointment.appointment_datetime) {
      return format(parseISO(appointment.appointment_datetime), 'hh:mm a');
    }
    if (appointment.appointment_time) {
      // If it's just a time string like "10:00:00"
      const timeParts = appointment.appointment_time.split(':');
      const hour = parseInt(timeParts[0], 10);
      const minute = timeParts[1];
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minute} ${ampm}`;
    }
    return '--:--';
  } catch {
    return appointment.appointment_time || '--:--';
  }
};

// Sort appointments by time
const sortAppointmentsByTime = (appointments: Appointment[]) => {
  return [...appointments].sort((a, b) => {
    const timeA = a.appointment_datetime || a.appointment_time || '';
    const timeB = b.appointment_datetime || b.appointment_time || '';
    return timeA.localeCompare(timeB);
  });
};

export const TodaySchedule = ({
  appointments,
  loading = false,
  onAppointmentClick,
  onStartConsultation,
}: TodayScheduleProps) => {
  // Safety check to ensure appointments is always an array and sort by time
  const safeAppointments = Array.isArray(appointments) ? sortAppointmentsByTime(appointments) : [];

  // Filter out cancelled appointments for display but keep count
  const activeAppointments = safeAppointments.filter(
    (apt) => apt.status !== 'cancelled' && apt.status !== 'no_show'
  );

  if (loading) {
    return (
      <Paper sx={{ p: 3, height: '450px', overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Schedule sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">Today's Schedule</Typography>
        </Box>
        <List>
          {[1, 2, 3, 4].map((item) => (
            <ListItem key={item}>
              <ListItemIcon>
                <Skeleton variant="circular" width={24} height={24} />
              </ListItemIcon>
              <ListItemText
                primary={<Skeleton variant="text" width="60%" />}
                secondary={<Skeleton variant="text" width="80%" />}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, height: '450px', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Schedule sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6">Today's Schedule</Typography>
        <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
          <Chip
            label={`${activeAppointments.length} appointments`}
            size="small"
            color="primary"
          />
        </Box>
      </Box>

      {activeAppointments.length === 0 ? (
        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'text.secondary',
            gap: 2,
          }}
        >
          <Schedule sx={{ fontSize: 48, opacity: 0.5 }} />
          <Typography variant="body1">No appointments scheduled for today</Typography>
          <Typography variant="body2" color="text.secondary">
            Book a new appointment to get started
          </Typography>
        </Box>
      ) : (
        <List sx={{ flexGrow: 1, overflow: 'auto', py: 0 }}>
          {activeAppointments.map((appointment, index) => {
            const isActive = appointment.status === 'scheduled' || appointment.status === 'in_progress';
            const isCompleted = appointment.status === 'completed';

            return (
              <ListItem
                key={appointment.id}
                sx={{
                  border: 1,
                  borderColor: appointment.status === 'in_progress' ? 'warning.main' : 'divider',
                  borderRadius: 2,
                  mb: 1.5,
                  p: 2,
                  bgcolor: appointment.status === 'in_progress'
                    ? 'warning.light'
                    : isCompleted
                      ? 'action.disabledBackground'
                      : 'background.paper',
                  opacity: isCompleted ? 0.7 : 1,
                  '&:hover': {
                    backgroundColor: isCompleted ? 'action.disabledBackground' : 'action.hover',
                    cursor: 'pointer',
                  },
                  transition: 'all 0.2s ease',
                }}
                onClick={() => onAppointmentClick?.(appointment)}
              >
                {/* Time Badge */}
                <Box
                  sx={{
                    minWidth: 80,
                    mr: 2,
                    textAlign: 'center',
                    p: 1,
                    borderRadius: 1,
                    bgcolor: appointment.status === 'in_progress'
                      ? 'warning.main'
                      : 'primary.main',
                    color: 'white',
                  }}
                >
                  <Typography variant="subtitle1" fontWeight="bold">
                    {getTimeDisplay(appointment)}
                  </Typography>
                </Box>

                <ListItemText
                  disableTypography
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="subtitle1" fontWeight="medium">
                        {appointment.patient_full_name}
                      </Typography>
                      <Chip
                        icon={getStatusIcon(appointment.status)}
                        label={getStatusLabel(appointment.status)}
                        size="small"
                        color={getStatusColor(appointment.status)}
                        variant={isCompleted ? 'outlined' : 'filled'}
                        sx={{ height: 24 }}
                      />
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Phone fontSize="small" sx={{ color: 'text.secondary', fontSize: 16 }} />
                          <Typography variant="body2" color="text.secondary">
                            {appointment.patient_mobile_number}
                          </Typography>
                        </Box>
                        {appointment.reason_for_visit && (
                          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            {appointment.reason_for_visit}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  }
                />

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 1, ml: 1 }}>
                  {appointment.status === 'scheduled' && (
                    <Tooltip title="Start Consultation">
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        startIcon={<PlayArrow />}
                        onClick={(e) => {
                          e.stopPropagation();
                          onStartConsultation?.(appointment);
                        }}
                        sx={{ minWidth: 100 }}
                      >
                        Start
                      </Button>
                    </Tooltip>
                  )}
                  {appointment.status === 'in_progress' && (
                    <Tooltip title="Continue Consultation">
                      <Button
                        variant="contained"
                        color="warning"
                        size="small"
                        startIcon={<PlayArrow />}
                        onClick={(e) => {
                          e.stopPropagation();
                          onStartConsultation?.(appointment);
                        }}
                        sx={{ minWidth: 100 }}
                      >
                        Continue
                      </Button>
                    </Tooltip>
                  )}
                  {appointment.status === 'completed' && (
                    <Tooltip title="View Details">
                      <Button
                        variant="outlined"
                        color="success"
                        size="small"
                        startIcon={<CheckCircle />}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAppointmentClick?.(appointment);
                        }}
                        sx={{ minWidth: 100 }}
                      >
                        View
                      </Button>
                    </Tooltip>
                  )}
                </Box>
              </ListItem>
            );
          })}
        </List>
      )}
    </Paper>
  );
};
