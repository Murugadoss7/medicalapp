import React from 'react';
import {
  Typography,
  Box,
  Chip,
  Button,
} from '@mui/material';
import {
  Phone,
  AccessTime,
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
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        py: 1.25,
        px: 2,
        borderBottom: '1px solid',
        borderColor: 'rgba(102, 126, 234, 0.15)',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        minHeight: 44,
        '&:hover': showActions ? {
          bgcolor: 'rgba(102, 126, 234, 0.05)',
          transform: 'translateX(4px)',
        } : {},
      }}
      onClick={() => isDentalDoctor ? handleDentalConsultation() : handleViewPrescription()}
    >
      {/* Left Section - Patient Name and Details */}
      <Box sx={{ flex: '1 1 35%', minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
          <Typography
            variant="body1"
            sx={{
              fontWeight: 600,
              fontSize: '0.9rem',
              lineHeight: 1.3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
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
              height: 18,
              fontSize: '0.65rem',
              fontWeight: 600,
              '& .MuiChip-icon': { fontSize: '0.7rem', ml: 0.4 },
              '& .MuiChip-label': { px: 0.6 }
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Phone sx={{ fontSize: 12 }} color="action" />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', lineHeight: 1.2 }}>
              {appointment.patient_mobile_number}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <AccessTime sx={{ fontSize: 12 }} color="action" />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', lineHeight: 1.2 }}>
              {appointmentDate.displayDateTime(appointment.appointment_datetime)}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Right Section - Compact Actions */}
      {showActions && (
        <Box sx={{ display: 'flex', gap: 0.5, flex: '0 0 auto' }}>
          <Button
            size="small"
            variant={isDentalDoctor ? "contained" : "outlined"}
            startIcon={isDentalDoctor ? <MedicalServices sx={{ fontSize: 14 }} /> : <Visibility sx={{ fontSize: 14 }} />}
            onClick={(e) => {
              e.stopPropagation();
              isDentalDoctor ? handleDentalConsultation() : handleViewPrescription();
            }}
            sx={{
              fontSize: '0.7rem',
              py: 0.5,
              px: 1,
              minWidth: 'auto',
              lineHeight: 1.2,
              height: 28,
              ...(isDentalDoctor ? {
                bgcolor: '#667eea',
                fontWeight: 700,
                '&:hover': { bgcolor: '#5568d3' }
              } : {
                borderColor: '#667eea',
                color: '#667eea',
                fontWeight: 700,
                '&:hover': { borderColor: '#5568d3', color: '#5568d3' }
              })
            }}
          >
            {isDentalDoctor ? 'Dental' : 'View'}
          </Button>

          {appointment.status === 'scheduled' && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<Pending sx={{ fontSize: 14 }} />}
              onClick={(e) => {
                e.stopPropagation();
                handleStatusUpdate('in_progress');
              }}
              color="warning"
              sx={{
                fontSize: '0.7rem',
                py: 0.5,
                px: 1,
                minWidth: 'auto',
                lineHeight: 1.2,
                height: 28
              }}
            >
              Start
            </Button>
          )}

          {appointment.status === 'in_progress' && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<CheckCircle sx={{ fontSize: 14 }} />}
              onClick={(e) => {
                e.stopPropagation();
                handleStatusUpdate('completed');
              }}
              color="success"
              sx={{
                fontSize: '0.7rem',
                py: 0.5,
                px: 1,
                minWidth: 'auto',
                lineHeight: 1.2,
                height: 28
              }}
            >
              Complete
            </Button>
          )}

          {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
            <>
              <Button
                size="small"
                variant="text"
                startIcon={<Edit sx={{ fontSize: 14 }} />}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(appointment);
                }}
                sx={{
                  fontSize: '0.7rem',
                  py: 0.5,
                  px: 1,
                  minWidth: 'auto',
                  lineHeight: 1.2,
                  height: 28
                }}
              >
                Edit
              </Button>
              <Button
                size="small"
                variant="text"
                startIcon={<Cancel sx={{ fontSize: 14 }} />}
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel?.(appointment);
                }}
                color="error"
                sx={{
                  fontSize: '0.7rem',
                  py: 0.5,
                  px: 1,
                  minWidth: 'auto',
                  lineHeight: 1.2,
                  height: 28
                }}
              >
                Cancel
              </Button>
            </>
          )}
        </Box>
      )}
    </Box>
  );
};