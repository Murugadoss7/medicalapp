/**
 * DoctorScheduleColumn Component
 * Displays a single doctor's schedule with time slots for drag-and-drop
 */
import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Paper,
  Chip,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  LocalHospital as DoctorIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { DroppableTimeSlot } from './DroppableTimeSlot';
import { Doctor, Appointment } from '../../store/api';

interface DoctorScheduleColumnProps {
  doctor: Doctor;
  appointments: Appointment[];
  isLoading?: boolean;
  expanded?: boolean; // When true, expands to fill available space (single doctor)
}

// Generate time slots from 8 AM to 8 PM (30-min intervals)
const generateTimeSlots = (): string[] => {
  const slots: string[] = [];
  for (let hour = 8; hour < 20; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    slots.push(`${hour.toString().padStart(2, '0')}:30`);
  }
  return slots;
};

export const DoctorScheduleColumn: React.FC<DoctorScheduleColumnProps> = ({
  doctor,
  appointments,
  isLoading,
  expanded = false,
}) => {
  const timeSlots = useMemo(() => generateTimeSlots(), []);

  // Map appointments to time slots
  const appointmentsByTime = useMemo(() => {
    const map: Record<string, Appointment> = {};
    appointments.forEach((apt) => {
      if (apt.appointment_time) {
        // Convert "09:30:00" to "09:30"
        const timeKey = apt.appointment_time.slice(0, 5);
        map[timeKey] = apt;
      }
    });
    return map;
  }, [appointments]);

  // Get doctor display name
  const getDoctorName = () => {
    if (doctor.first_name || doctor.last_name) {
      return `Dr. ${doctor.first_name || ''} ${doctor.last_name || ''}`.trim();
    }
    return `Doctor ${doctor.license_number}`;
  };

  // Get initials for avatar
  const getInitials = () => {
    const first = doctor.first_name?.[0] || '';
    const last = doctor.last_name?.[0] || '';
    return (first + last).toUpperCase() || 'DR';
  };

  // Count appointments by status
  const appointmentCounts = useMemo(() => {
    return {
      total: appointments.length,
      scheduled: appointments.filter(a => a.status === 'scheduled' || a.status === 'confirmed').length,
      inProgress: appointments.filter(a => a.status === 'in_progress').length,
      completed: appointments.filter(a => a.status === 'completed').length,
    };
  }, [appointments]);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 3,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(102, 126, 234, 0.1)',
        minWidth: expanded ? 350 : 200,
        maxWidth: expanded ? 500 : 250,
        flex: expanded ? 1 : 'none',
        height: 'fit-content',
      }}
    >
      {/* Doctor Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <Avatar
          sx={{
            width: 40,
            height: 40,
            bgcolor: 'primary.main',
            fontSize: '0.875rem',
          }}
        >
          {getInitials()}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="subtitle2"
            fontWeight={600}
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {getDoctorName()}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {doctor.specialization || 'General'}
          </Typography>
        </Box>
      </Box>

      {/* Appointment Summary */}
      <Box sx={{ display: 'flex', gap: 0.5, mb: 2, flexWrap: 'wrap' }}>
        <Chip
          size="small"
          label={`${appointmentCounts.total} total`}
          sx={{ height: 20, fontSize: '0.65rem' }}
        />
        {appointmentCounts.scheduled > 0 && (
          <Chip
            size="small"
            label={`${appointmentCounts.scheduled} scheduled`}
            sx={{
              height: 20,
              fontSize: '0.65rem',
              bgcolor: 'rgba(59, 130, 246, 0.1)',
              color: '#3B82F6',
            }}
          />
        )}
        {appointmentCounts.inProgress > 0 && (
          <Chip
            size="small"
            label={`${appointmentCounts.inProgress} in progress`}
            sx={{
              height: 20,
              fontSize: '0.65rem',
              bgcolor: 'rgba(245, 158, 11, 0.1)',
              color: '#F59E0B',
            }}
          />
        )}
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Time Slots */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            maxHeight: 'calc(100vh - 350px)',
            overflow: 'auto',
            pr: 0.5,
            '&::-webkit-scrollbar': {
              width: 4,
            },
            '&::-webkit-scrollbar-thumb': {
              borderRadius: 2,
              bgcolor: 'rgba(102, 126, 234, 0.3)',
            },
          }}
        >
          {timeSlots.map((time) => (
            <DroppableTimeSlot
              key={`${doctor.id}-${time}`}
              doctorId={doctor.id}
              time={time}
              appointment={appointmentsByTime[time]}
            />
          ))}
        </Box>
      )}
    </Paper>
  );
};

export default DoctorScheduleColumn;
