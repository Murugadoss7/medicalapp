import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Avatar,
  IconButton,
  Button,
  Divider,
} from '@mui/material';
import {
  Person,
  Phone,
  AccessTime,
  MoreVert,
  CheckCircle,
  Cancel,
  Schedule,
  Pending,
  Edit,
  Visibility,
  MedicalServices,
} from '@mui/icons-material';
import type { Appointment } from '../../store/api';
import { appointmentDate } from '../../utils/dateUtils';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks';

interface AppointmentCardProps {
  appointment: Appointment;
  onView?: (appointment: Appointment) => void;
  onEdit?: (appointment: Appointment) => void;
  onCancel?: (appointment: Appointment) => void;
  onStatusUpdate?: (appointmentId: string, status: string) => void;
  showActions?: boolean;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'success';
    case 'cancelled':
      return 'error';
    case 'scheduled':
      return 'primary';
    case 'in_progress':
      return 'warning';
    default:
      return 'default';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle />;
    case 'cancelled':
      return <Cancel />;
    case 'scheduled':
      return <Schedule />;
    case 'in_progress':
      return <Pending />;
    default:
      return <Schedule />;
  }
};

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onView,
  onEdit,
  onCancel,
  onStatusUpdate,
  showActions = true,
}) => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  const handleStatusUpdate = (status: string) => {
    onStatusUpdate?.(appointment.id, status);
  };

  const handleDentalConsultation = () => {
    navigate(`/appointments/${appointment.id}/dental`);
  };

  // Check if current user is a dental doctor
  const isDentalDoctor = user?.specialization?.toLowerCase().includes('dental') ||
                         user?.specialization?.toLowerCase().includes('dentist');

  return (
    <Card 
      sx={{ 
        mb: 2,
        '&:hover': showActions ? {
          boxShadow: (theme) => theme.shadows[4],
        } : {},
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box display="flex" gap={2} flex={1}>
            <Avatar>
              <Person />
            </Avatar>
            
            <Box flex={1}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="h6" component="h3">
                  {appointment.patient_first_name}
                </Typography>
                <Chip
                  size="small"
                  label={appointment.status}
                  color={getStatusColor(appointment.status)}
                  icon={getStatusIcon(appointment.status)}
                />
              </Box>

              <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                <AccessTime fontSize="small" color="action" />
                <Typography variant="body2" color="textSecondary">
                  {appointmentDate.displayDateTime(appointment.appointment_datetime)}
                </Typography>
              </Box>

              {appointment.patient_mobile_number && (
                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                  <Phone fontSize="small" color="action" />
                  <Typography variant="body2" color="textSecondary">
                    {appointment.patient_mobile_number}
                  </Typography>
                </Box>
              )}

              {appointment.appointment_number && (
                <Typography variant="caption" color="textSecondary">
                  Appointment #{appointment.appointment_number}
                </Typography>
              )}
            </Box>
          </Box>

          {showActions && (
            <IconButton size="small">
              <MoreVert />
            </IconButton>
          )}
        </Box>

        {showActions && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box display="flex" gap={1} flexWrap="wrap">
              <Button
                size="small"
                variant={isDentalDoctor ? "contained" : "text"}
                color={isDentalDoctor ? "secondary" : "primary"}
                startIcon={isDentalDoctor ? <MedicalServices /> : <Visibility />}
                onClick={() => isDentalDoctor ? handleDentalConsultation() : onView?.(appointment)}
              >
                {isDentalDoctor ? 'Start Dental Consultation' : 'View'}
              </Button>

              {!isDentalDoctor && (
                <Button
                  size="small"
                  variant="outlined"
                  color="secondary"
                  startIcon={<MedicalServices />}
                  onClick={handleDentalConsultation}
                >
                  Dental
                </Button>
              )}

              {appointment.status === 'scheduled' && !isDentalDoctor && (
                <Button
                  size="small"
                  startIcon={<Pending />}
                  onClick={() => handleStatusUpdate('in_progress')}
                  color="warning"
                >
                  Start
                </Button>
              )}

              {appointment.status === 'in_progress' && !isDentalDoctor && (
                <Button
                  size="small"
                  startIcon={<CheckCircle />}
                  onClick={() => handleStatusUpdate('completed')}
                  color="success"
                >
                  Complete
                </Button>
              )}

              {appointment.status !== 'completed' && appointment.status !== 'cancelled' && !isDentalDoctor && (
                <>
                  <Button
                    size="small"
                    startIcon={<Edit />}
                    onClick={() => onEdit?.(appointment)}
                  >
                    Reschedule
                  </Button>
                  <Button
                    size="small"
                    startIcon={<Cancel />}
                    onClick={() => onCancel?.(appointment)}
                    color="error"
                  >
                    Cancel
                  </Button>
                </>
              )}
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};