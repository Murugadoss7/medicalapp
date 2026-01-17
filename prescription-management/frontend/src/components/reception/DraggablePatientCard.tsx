/**
 * DraggablePatientCard Component
 * A patient card that can be dragged to schedule slots
 */
import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
  Box,
  Typography,
  Avatar,
  Paper,
  Chip,
} from '@mui/material';
import {
  DragIndicator as DragIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { Patient } from '../../store/api';

interface DraggablePatientCardProps {
  patient: Patient;
  isDragging?: boolean;
}

export const DraggablePatientCard: React.FC<DraggablePatientCardProps> = ({
  patient,
  isDragging: externalDragging,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `patient-${patient.id}`,
    data: {
      type: 'patient',
      patient,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const isCurrentlyDragging = isDragging || externalDragging;

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      elevation={isCurrentlyDragging ? 8 : 1}
      sx={{
        p: 1.5,
        borderRadius: 2,
        cursor: 'grab',
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        transition: 'box-shadow 0.2s, transform 0.2s',
        background: isCurrentlyDragging
          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          : 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
        border: isCurrentlyDragging
          ? '2px solid #667eea'
          : '1px solid rgba(102, 126, 234, 0.2)',
        color: isCurrentlyDragging ? 'white' : 'inherit',
        '&:hover': {
          boxShadow: 3,
          transform: 'translateY(-2px)',
        },
        '&:active': {
          cursor: 'grabbing',
        },
      }}
      {...listeners}
      {...attributes}
    >
      {/* Drag Handle */}
      <DragIcon
        fontSize="small"
        sx={{
          color: isCurrentlyDragging ? 'white' : 'text.secondary',
          opacity: 0.6,
        }}
      />

      {/* Avatar */}
      <Avatar
        sx={{
          width: 36,
          height: 36,
          bgcolor: patient.gender === 'male' ? 'primary.main' : 'secondary.main',
          fontSize: '0.875rem',
        }}
      >
        {getInitials(patient.first_name, patient.last_name)}
      </Avatar>

      {/* Patient Info */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          fontWeight={600}
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {patient.full_name}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: isCurrentlyDragging ? 'rgba(255,255,255,0.8)' : 'text.secondary',
            display: 'block',
          }}
        >
          {patient.mobile_number}
        </Typography>
      </Box>

      {/* Age Chip */}
      <Chip
        label={`${patient.age}y`}
        size="small"
        sx={{
          height: 20,
          fontSize: '0.7rem',
          bgcolor: isCurrentlyDragging ? 'rgba(255,255,255,0.2)' : 'rgba(102, 126, 234, 0.1)',
          color: isCurrentlyDragging ? 'white' : 'text.secondary',
        }}
      />
    </Paper>
  );
};

/**
 * Non-draggable version for display in schedule slots
 */
export const PatientCardStatic: React.FC<{ patient: Patient; compact?: boolean }> = ({
  patient,
  compact = false,
}) => {
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  if (compact) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <PersonIcon fontSize="small" sx={{ color: 'text.secondary' }} />
        <Typography variant="caption" fontWeight={500} noWrap>
          {patient.full_name}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Avatar
        sx={{
          width: 28,
          height: 28,
          bgcolor: patient.gender === 'male' ? 'primary.main' : 'secondary.main',
          fontSize: '0.75rem',
        }}
      >
        {getInitials(patient.first_name, patient.last_name)}
      </Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" fontWeight={500} display="block" noWrap>
          {patient.full_name}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          {patient.mobile_number}
        </Typography>
      </Box>
    </Box>
  );
};

export default DraggablePatientCard;
