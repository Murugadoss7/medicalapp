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

  const handleViewPrescription = () => {
    navigate(`/appointments/${appointment.id}/prescription`);
  };

  // Check if current user is a dental doctor
  const isDentalDoctor = user?.specialization?.toLowerCase().includes('dental') ||
                         user?.specialization?.toLowerCase().includes('dentist');

  return (
    <Card
      sx={{
        mb: 1.5,
        '&:hover': showActions ? {
          boxShadow: (theme) => theme.shadows[4],
        } : {},
      }}
    >
      <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box display="flex" gap={1.5} flex={1}>
            <Avatar sx={{ width: 36, height: 36, fontSize: '1rem' }}>
              <Person fontSize="small" />
            </Avatar>

            <Box flex={1} minWidth={0}>
              <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                <Typography
                  variant="subtitle2"
                  component="h3"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    lineHeight: 1.3,
                    wordBreak: 'break-word',
                    flex: 1,
                    minWidth: 0
                  }}
                >
                  {appointment.patient_first_name}
                </Typography>
                <Chip
                  size="small"
                  label={appointment.status}
                  color={getStatusColor(appointment.status)}
                  icon={getStatusIcon(appointment.status)}
                  sx={{
                    height: 20,
                    fontSize: '0.7rem',
                    '& .MuiChip-icon': { fontSize: '0.875rem' }
                  }}
                />
              </Box>

              <Box display="flex" alignItems="center" gap={0.75} mb={0.25}>
                <AccessTime sx={{ fontSize: 14 }} color="action" />
                <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.75rem' }}>
                  {appointmentDate.displayDateTime(appointment.appointment_datetime)}
                </Typography>
              </Box>

              {appointment.patient_mobile_number && (
                <Box display="flex" alignItems="center" gap={0.75} mb={0.25}>
                  <Phone sx={{ fontSize: 14 }} color="action" />
                  <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.75rem' }}>
                    {appointment.patient_mobile_number}
                  </Typography>
                </Box>
              )}

              {appointment.appointment_number && (
                <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.7rem' }}>
                  #{appointment.appointment_number}
                </Typography>
              )}
            </Box>
          </Box>

          {showActions && (
            <IconButton size="small" sx={{ p: 0.5, ml: 1 }}>
              <MoreVert fontSize="small" />
            </IconButton>
          )}
        </Box>

        {showActions && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Box display="flex" gap={0.75} flexWrap="wrap">
              <Button
                size="small"
                variant={isDentalDoctor ? "contained" : "text"}
                color={isDentalDoctor ? "secondary" : "primary"}
                startIcon={isDentalDoctor ? <MedicalServices fontSize="small" /> : <Visibility fontSize="small" />}
                onClick={() => isDentalDoctor ? handleDentalConsultation() : handleViewPrescription()}
                sx={{
                  fontSize: '0.75rem',
                  py: 0.5,
                  px: 1,
                  minWidth: 'auto'
                }}
              >
                {isDentalDoctor ? 'Dental' : 'View'}
              </Button>

              {!isDentalDoctor && (
                <Button
                  size="small"
                  variant="outlined"
                  color="secondary"
                  startIcon={<MedicalServices fontSize="small" />}
                  onClick={handleDentalConsultation}
                  sx={{
                    fontSize: '0.75rem',
                    py: 0.5,
                    px: 1,
                    minWidth: 'auto'
                  }}
                >
                  Dental
                </Button>
              )}

              {appointment.status === 'scheduled' && !isDentalDoctor && (
                <Button
                  size="small"
                  startIcon={<Pending fontSize="small" />}
                  onClick={() => handleStatusUpdate('in_progress')}
                  color="warning"
                  sx={{
                    fontSize: '0.75rem',
                    py: 0.5,
                    px: 1,
                    minWidth: 'auto'
                  }}
                >
                  Start
                </Button>
              )}

              {appointment.status === 'in_progress' && !isDentalDoctor && (
                <Button
                  size="small"
                  startIcon={<CheckCircle fontSize="small" />}
                  onClick={() => handleStatusUpdate('completed')}
                  color="success"
                  sx={{
                    fontSize: '0.75rem',
                    py: 0.5,
                    px: 1,
                    minWidth: 'auto'
                  }}
                >
                  Complete
                </Button>
              )}

              {appointment.status !== 'completed' && appointment.status !== 'cancelled' && !isDentalDoctor && (
                <>
                  <Button
                    size="small"
                    startIcon={<Edit fontSize="small" />}
                    onClick={() => onEdit?.(appointment)}
                    sx={{
                      fontSize: '0.75rem',
                      py: 0.5,
                      px: 1,
                      minWidth: 'auto'
                    }}
                  >
                    Reschedule
                  </Button>
                  <Button
                    size="small"
                    startIcon={<Cancel fontSize="small" />}
                    onClick={() => onCancel?.(appointment)}
                    color="error"
                    sx={{
                      fontSize: '0.75rem',
                      py: 0.5,
                      px: 1,
                      minWidth: 'auto'
                    }}
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