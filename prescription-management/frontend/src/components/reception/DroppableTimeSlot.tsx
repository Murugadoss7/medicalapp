/**
 * DroppableTimeSlot Component
 * A time slot that accepts dropped patients and can also be dragged to reschedule
 */
import React from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import {
  Box,
  Typography,
  Paper,
  Chip,
} from '@mui/material';
import {
  AccessTime as TimeIcon,
  Person as PersonIcon,
  Add as AddIcon,
  DragIndicator as DragIcon,
} from '@mui/icons-material';
import { Appointment } from '../../store/api';

interface DroppableTimeSlotProps {
  doctorId: string;
  time: string; // Format: "09:00"
  appointment?: Appointment | null;
  isOver?: boolean;
}

export const DroppableTimeSlot: React.FC<DroppableTimeSlotProps> = ({
  doctorId,
  time,
  appointment,
  isOver: externalIsOver,
}) => {
  const slotId = `slot-${doctorId}-${time}`;
  const isOccupied = !!appointment;

  // Droppable - for receiving patients
  const { setNodeRef: setDropRef, isOver: isDropOver } = useDroppable({
    id: slotId,
    data: {
      type: 'slot',
      doctorId,
      time,
      hasAppointment: isOccupied,
      appointment,
    },
  });

  // Draggable - for rescheduling existing appointments
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `appointment-${appointment?.id || 'none'}`,
    data: {
      type: 'appointment',
      appointment,
      doctorId,
      fromTime: time,
    },
    disabled: !isOccupied,
  });

  const isDropTarget = isDropOver || externalIsOver;

  // Format time for display (09:00 -> 9:00 AM)
  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Get status color
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

  // Combined ref for both drag and drop
  const setRefs = (node: HTMLElement | null) => {
    setDropRef(node);
    if (isOccupied) {
      setDragRef(node);
    }
  };

  const style = transform
    ? {
        transform: `translate(${transform.x}px, ${transform.y}px)`,
        zIndex: isDragging ? 1000 : 'auto',
      }
    : undefined;

  return (
    <Paper
      ref={setRefs}
      elevation={isDropTarget ? 4 : isDragging ? 8 : 0}
      style={style}
      sx={{
        p: 1,
        minHeight: 60,
        borderRadius: 2,
        transition: isDragging ? 'none' : 'all 0.2s ease',
        border: isDropTarget
          ? '2px dashed #667eea'
          : isDragging
          ? '2px solid #667eea'
          : isOccupied
          ? `1px solid ${getStatusColor(appointment?.status || '')}30`
          : '1px dashed rgba(0,0,0,0.1)',
        bgcolor: isDropTarget
          ? 'rgba(102, 126, 234, 0.1)'
          : isDragging
          ? 'rgba(102, 126, 234, 0.15)'
          : isOccupied
          ? `${getStatusColor(appointment?.status || '')}10`
          : 'transparent',
        cursor: isOccupied ? 'grab' : 'pointer',
        opacity: isDragging ? 0.8 : 1,
        '&:hover': !isOccupied ? {
          bgcolor: 'rgba(102, 126, 234, 0.05)',
          borderColor: 'rgba(102, 126, 234, 0.3)',
        } : {
          boxShadow: 2,
        },
        '&:active': isOccupied ? {
          cursor: 'grabbing',
        } : {},
      }}
      {...(isOccupied ? { ...listeners, ...attributes } : {})}
    >
      {/* Time Badge */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
        <TimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
        <Typography variant="caption" fontWeight={600} color="text.secondary">
          {formatTime(time)}
        </Typography>
        {isOccupied && (
          <DragIcon
            sx={{
              fontSize: 14,
              color: 'text.disabled',
              ml: 'auto',
              opacity: 0.6,
            }}
          />
        )}
      </Box>

      {isOccupied && appointment ? (
        /* Occupied Slot */
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
            <PersonIcon sx={{ fontSize: 14, color: 'primary.main' }} />
            <Typography
              variant="body2"
              fontWeight={500}
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {appointment.patient_first_name}
            </Typography>
          </Box>
          <Chip
            label={appointment.status}
            size="small"
            sx={{
              height: 18,
              fontSize: '0.65rem',
              bgcolor: `${getStatusColor(appointment.status)}20`,
              color: getStatusColor(appointment.status),
              fontWeight: 600,
            }}
          />
        </Box>
      ) : (
        /* Empty Slot */
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 30,
            color: isDropTarget ? 'primary.main' : 'text.disabled',
          }}
        >
          {isDropTarget ? (
            <Typography variant="caption" fontWeight={500}>
              Drop here
            </Typography>
          ) : (
            <AddIcon sx={{ fontSize: 18, opacity: 0.5 }} />
          )}
        </Box>
      )}
    </Paper>
  );
};

export default DroppableTimeSlot;
