/**
 * PatientQueueCard Component
 * A draggable card showing a patient in the queue with their position number
 */
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Box,
  Typography,
  Paper,
  Chip,
  IconButton,
} from '@mui/material';
import {
  DragIndicator as DragIcon,
  Person as PersonIcon,
  PlayArrow as CallIcon,
  DirectionsWalk as WalkInIcon,
} from '@mui/icons-material';
import { Appointment } from '../../store/api';

interface PatientQueueCardProps {
  appointment: Appointment;
  position: number;
  onCallPatient?: (appointment: Appointment) => void;
}

export const PatientQueueCard: React.FC<PatientQueueCardProps> = ({
  appointment,
  position,
  onCallPatient,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: appointment.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: '#3B82F6',
      confirmed: '#3B82F6',
      in_progress: '#F59E0B',
      completed: '#10B981',
      cancelled: '#EF4444',
    };
    return colors[status] || '#6B7280';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      scheduled: 'Waiting',
      confirmed: 'Waiting',
      in_progress: 'In Consultation',
      completed: 'Done',
      cancelled: 'Cancelled',
    };
    return labels[status] || status;
  };

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      elevation={isDragging ? 8 : 1}
      sx={{
        p: 1.5,
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        bgcolor: isDragging ? 'rgba(102, 126, 234, 0.1)' : 'white',
        border: isDragging
          ? '2px solid #667eea'
          : `1px solid ${getStatusColor(appointment.status)}30`,
        opacity: isDragging ? 0.9 : 1,
        cursor: 'grab',
        '&:hover': {
          boxShadow: 3,
        },
      }}
    >
      {/* Drag Handle */}
      <Box
        {...attributes}
        {...listeners}
        sx={{
          display: 'flex',
          alignItems: 'center',
          color: 'text.disabled',
          cursor: 'grab',
          '&:active': { cursor: 'grabbing' },
        }}
      >
        <DragIcon fontSize="small" />
      </Box>

      {/* Position Number */}
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          bgcolor: appointment.status === 'in_progress' ? '#F59E0B' : 'primary.main',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: '0.875rem',
          flexShrink: 0,
        }}
      >
        {position}
      </Box>

      {/* Patient Info */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <PersonIcon sx={{ fontSize: 16, color: 'primary.main' }} />
          <Typography
            variant="body2"
            fontWeight={600}
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {appointment.patient_full_name || `${appointment.patient_first_name} ${appointment.patient_last_name || ''}`.trim()}
          </Typography>
        </Box>
        <Chip
          label={getStatusLabel(appointment.status)}
          size="small"
          sx={{
            height: 20,
            fontSize: '0.65rem',
            mt: 0.5,
            bgcolor: `${getStatusColor(appointment.status)}20`,
            color: getStatusColor(appointment.status),
            fontWeight: 600,
          }}
        />
      </Box>

      {/* Call Button (only for waiting patients) */}
      {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && onCallPatient && (
        <IconButton
          size="small"
          onClick={() => onCallPatient(appointment)}
          sx={{
            bgcolor: 'success.main',
            color: 'white',
            '&:hover': { bgcolor: 'success.dark' },
          }}
        >
          <CallIcon fontSize="small" />
        </IconButton>
      )}
    </Paper>
  );
};

export default PatientQueueCard;
