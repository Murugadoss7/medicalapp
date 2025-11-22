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
} from '@mui/material';
import {
  Schedule,
  Person,
  AccessTime,
  Phone,
  Visibility,
  PlayArrow,
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

export const TodaySchedule = ({
  appointments,
  loading = false,
  onAppointmentClick,
  onStartConsultation,
}: TodayScheduleProps) => {
  // Safety check to ensure appointments is always an array
  const safeAppointments = Array.isArray(appointments) ? appointments : [];
  if (loading) {
    return (
      <Paper sx={{ p: 3, height: '400px', overflow: 'hidden' }}>
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
    <Paper sx={{ p: 3, height: '400px', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Schedule sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6">Today's Schedule</Typography>
        <Chip 
          label={safeAppointments.length} 
          size="small" 
          sx={{ ml: 'auto' }}
          color="primary"
        />
      </Box>

      {safeAppointments.length === 0 ? (
        <Box 
          sx={{ 
            flexGrow: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'text.secondary'
          }}
        >
          <Typography variant="body2">No appointments scheduled for today</Typography>
        </Box>
      ) : (
        <List sx={{ flexGrow: 1, overflow: 'auto' }}>
          {safeAppointments.map((appointment) => (
            <ListItem
              key={appointment.id}
              sx={{
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                mb: 1,
                '&:hover': {
                  backgroundColor: 'action.hover',
                  cursor: 'pointer',
                },
              }}
              onClick={() => onAppointmentClick?.(appointment)}
            >
              <ListItemIcon>
                <AccessTime color="primary" />
              </ListItemIcon>
              
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle2">
                      {format(parseISO(appointment.appointment_datetime), 'HH:mm')}
                    </Typography>
                    <Chip
                      label={getStatusLabel(appointment.status)}
                      size="small"
                      color={getStatusColor(appointment.status)}
                      variant="outlined"
                    />
                  </Box>
                }
                secondary={
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                      <Person fontSize="small" />
                      <Typography variant="body2" color="text.secondary">
                        {appointment.patient_full_name}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                      <Phone fontSize="small" />
                      <Typography variant="body2" color="text.secondary">
                        {appointment.patient_mobile_number}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {appointment.reason_for_visit}
                    </Typography>
                  </Box>
                }
              />
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Tooltip title="View Details">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAppointmentClick?.(appointment);
                    }}
                  >
                    <Visibility />
                  </IconButton>
                </Tooltip>
                
                {appointment.status === 'scheduled' && (
                  <Tooltip title="Start Consultation">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartConsultation?.(appointment);
                      }}
                    >
                      <PlayArrow />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  );
};