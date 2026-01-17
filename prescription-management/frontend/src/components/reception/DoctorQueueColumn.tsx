/**
 * DoctorQueueColumn Component
 * Shows a doctor's patient queue with drag-and-drop reordering
 */
import React, { useMemo } from 'react';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import {
  Box,
  Typography,
  Avatar,
  Paper,
  Chip,
  CircularProgress,
  Divider,
  Button,
} from '@mui/material';
import {
  Add as AddIcon,
  Queue as QueueIcon,
} from '@mui/icons-material';
import { PatientQueueCard } from './PatientQueueCard';
import { Doctor, Appointment } from '../../store/api';

interface DoctorQueueColumnProps {
  doctor: Doctor;
  appointments: Appointment[];
  isLoading?: boolean;
  expanded?: boolean;
  onCallPatient?: (appointment: Appointment) => void;
  filteredClinicIds?: string[];
}

export const DoctorQueueColumn: React.FC<DoctorQueueColumnProps> = ({
  doctor,
  appointments,
  isLoading,
  expanded = false,
  onCallPatient,
  filteredClinicIds = [],
}) => {
  // Filter and sort appointments - active ones sorted by appointment_time
  // Also filter by clinic if filter is active
  const queuedAppointments = useMemo(() => {
    return appointments
      .filter(apt => apt.status !== 'completed' && apt.status !== 'cancelled')
      .filter(apt => {
        // If clinic filter is active, only show appointments for that clinic
        if (filteredClinicIds.length > 0) {
          return apt.office_id && filteredClinicIds.includes(apt.office_id);
        }
        return true; // No filter, show all
      })
      .sort((a, b) => {
        // In-progress appointments first
        if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
        if (b.status === 'in_progress' && a.status !== 'in_progress') return 1;
        // Then by appointment time
        return (a.appointment_time || '').localeCompare(b.appointment_time || '');
      });
  }, [appointments, filteredClinicIds]);

  // Get relevant office based on filter or primary office
  const getRelevantOffice = () => {
    if (doctor.offices && doctor.offices.length > 0) {
      // If filtering by clinic, find the matching clinic
      if (filteredClinicIds.length > 0) {
        const matchingOffice = doctor.offices.find(o => filteredClinicIds.includes(o.id));
        if (matchingOffice) return matchingOffice;
      }
      // Otherwise return primary or first office
      return doctor.offices.find(o => o.is_primary) || doctor.offices[0];
    }
    return undefined;
  };

  const relevantOffice = getRelevantOffice();

  // Drop zone for new patients
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `doctor-queue-${doctor.id}`,
    data: {
      type: 'queue',
      doctorId: doctor.id,
      officeId: relevantOffice?.id,
    },
  });

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

  // Get clinic name from relevant office
  const getClinicName = () => {
    if (relevantOffice) {
      return relevantOffice.name || relevantOffice.address?.split(',')[0] || '';
    }
    return '';
  };

  // Count appointments by status (use filtered appointments)
  const counts = useMemo(() => ({
    waiting: queuedAppointments.filter(a => a.status === 'scheduled' || a.status === 'confirmed').length,
    inProgress: queuedAppointments.filter(a => a.status === 'in_progress').length,
    total: queuedAppointments.length,
  }), [queuedAppointments]);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 3,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(102, 126, 234, 0.1)',
        minWidth: expanded ? 350 : 280,
        maxWidth: expanded ? 500 : 350,
        flex: expanded ? 1 : 'none',
        height: 'fit-content',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Doctor Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <Avatar
          sx={{
            width: 44,
            height: 44,
            bgcolor: 'primary.main',
            fontSize: '0.95rem',
          }}
        >
          {getInitials()}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="subtitle1"
            fontWeight={600}
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {getDoctorName()}
          </Typography>
          {getClinicName() && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {getClinicName()}
            </Typography>
          )}
          <Typography variant="caption" color="text.disabled">
            {doctor.specialization || 'General'}
          </Typography>
        </Box>
      </Box>

      {/* Queue Stats */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Chip
          icon={<QueueIcon sx={{ fontSize: 16 }} />}
          size="small"
          label={`${counts.total} in queue`}
          sx={{ height: 24, fontSize: '0.75rem' }}
        />
        {counts.waiting > 0 && (
          <Chip
            size="small"
            label={`${counts.waiting} waiting`}
            sx={{
              height: 24,
              fontSize: '0.75rem',
              bgcolor: 'rgba(59, 130, 246, 0.1)',
              color: '#3B82F6',
            }}
          />
        )}
        {counts.inProgress > 0 && (
          <Chip
            size="small"
            label={`${counts.inProgress} in consultation`}
            sx={{
              height: 24,
              fontSize: '0.75rem',
              bgcolor: 'rgba(245, 158, 11, 0.1)',
              color: '#F59E0B',
            }}
          />
        )}
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Patient Queue */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={24} />
        </Box>
      ) : queuedAppointments.length === 0 ? (
        <Box
          ref={setDropRef}
          sx={{
            py: 4,
            textAlign: 'center',
            borderRadius: 2,
            border: isOver ? '2px dashed #667eea' : '2px dashed rgba(0,0,0,0.1)',
            bgcolor: isOver ? 'rgba(102, 126, 234, 0.05)' : 'transparent',
            transition: 'all 0.2s',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {isOver ? 'Drop patient here' : 'No patients in queue'}
          </Typography>
          <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
            Drag a patient here to add to queue
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            maxHeight: 'calc(100vh - 400px)',
            pr: 0.5,
          }}
        >
          <SortableContext
            items={queuedAppointments.map(a => a.id)}
            strategy={verticalListSortingStrategy}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {queuedAppointments.map((appointment, index) => (
                <PatientQueueCard
                  key={appointment.id}
                  appointment={appointment}
                  position={index + 1}
                  onCallPatient={onCallPatient}
                />
              ))}
            </Box>
          </SortableContext>

          {/* Drop zone at bottom */}
          <Box
            ref={setDropRef}
            sx={{
              mt: 2,
              py: 2,
              textAlign: 'center',
              borderRadius: 2,
              border: isOver ? '2px dashed #667eea' : '2px dashed rgba(0,0,0,0.1)',
              bgcolor: isOver ? 'rgba(102, 126, 234, 0.05)' : 'transparent',
              transition: 'all 0.2s',
            }}
          >
            <AddIcon sx={{ fontSize: 20, color: isOver ? 'primary.main' : 'text.disabled' }} />
            <Typography variant="caption" color={isOver ? 'primary.main' : 'text.disabled'} display="block">
              {isOver ? 'Drop to add' : 'Drop patient here'}
            </Typography>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default DoctorQueueColumn;
