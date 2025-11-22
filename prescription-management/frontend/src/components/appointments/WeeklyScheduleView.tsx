import React, { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Stack,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Visibility,
  Cancel,
  Person,
  AccessTime,
} from '@mui/icons-material';
import { format, startOfWeek, addDays, addWeeks, isSameDay, parse } from 'date-fns';
import type { Appointment } from '../../store/api';

interface WeeklyScheduleViewProps {
  appointments: Appointment[];
  onAppointmentClick: (appointmentId: string) => void;
  onCancelAppointment: (appointmentId: string) => void;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  viewMode?: 'week' | 'day';
}

const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 8 AM to 9 PM

const getStatusColor = (status: string) => {
  switch (status) {
    case 'scheduled':
      return { bg: '#e3f2fd', border: '#2196f3', text: '#1565c0' };
    case 'in_progress':
      return { bg: '#fff3e0', border: '#ff9800', text: '#e65100' };
    case 'completed':
      return { bg: '#e8f5e9', border: '#4caf50', text: '#2e7d32' };
    case 'cancelled':
      return { bg: '#ffebee', border: '#f44336', text: '#c62828' };
    default:
      return { bg: '#f5f5f5', border: '#9e9e9e', text: '#616161' };
  }
};

export const WeeklyScheduleView: React.FC<WeeklyScheduleViewProps> = ({
  appointments,
  onAppointmentClick,
  onCancelAppointment,
  selectedDate,
  onDateChange,
  viewMode = 'week',
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const daysToShow = viewMode === 'week' ? 7 : 1;
  const days = Array.from({ length: daysToShow }, (_, i) => addDays(weekStart, viewMode === 'week' ? i : selectedDate.getDay()));

  // Group appointments by day and hour
  const appointmentsByDayAndHour = useMemo(() => {
    const grouped: Record<string, Record<number, Appointment[]>> = {};

    appointments.forEach(apt => {
      const aptDate = new Date(apt.appointment_datetime);
      const dayKey = format(aptDate, 'yyyy-MM-dd');
      const hour = aptDate.getHours();

      if (!grouped[dayKey]) {
        grouped[dayKey] = {};
      }
      if (!grouped[dayKey][hour]) {
        grouped[dayKey][hour] = [];
      }
      grouped[dayKey][hour].push(apt);
    });

    return grouped;
  }, [appointments]);

  const handlePrevious = () => {
    if (viewMode === 'week') {
      onDateChange(addWeeks(selectedDate, -1));
    } else {
      onDateChange(addDays(selectedDate, -1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'week') {
      onDateChange(addWeeks(selectedDate, 1));
    } else {
      onDateChange(addDays(selectedDate, 1));
    }
  };

  const handleAppointmentContextMenu = (
    event: React.MouseEvent<HTMLDivElement>,
    appointment: Appointment
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedAppointment(appointment);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedAppointment(null);
  };

  const handleViewDetails = () => {
    if (selectedAppointment) {
      onAppointmentClick(selectedAppointment.id);
    }
    handleMenuClose();
  };

  const handleCancel = () => {
    if (selectedAppointment) {
      onCancelAppointment(selectedAppointment.id);
    }
    handleMenuClose();
  };

  const renderAppointmentCard = (appointment: Appointment) => {
    const colors = getStatusColor(appointment.status);
    const aptTime = new Date(appointment.appointment_datetime);

    return (
      <Box
        key={appointment.id}
        onClick={() => onAppointmentClick(appointment.id)}
        onContextMenu={(e) => handleAppointmentContextMenu(e, appointment)}
        sx={{
          p: 1,
          mb: 0.5,
          borderRadius: 1,
          bgcolor: colors.bg,
          borderLeft: `4px solid ${colors.border}`,
          cursor: 'pointer',
          transition: 'all 0.2s',
          '&:hover': {
            transform: 'translateX(4px)',
            boxShadow: 2,
          },
        }}
      >
        <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
          <Person sx={{ fontSize: 14, color: colors.text }} />
          <Typography
            variant="caption"
            fontWeight={600}
            color={colors.text}
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {appointment.patient_first_name}
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" gap={0.5}>
          <AccessTime sx={{ fontSize: 12, color: colors.text }} />
          <Typography variant="caption" color={colors.text}>
            {format(aptTime, 'h:mm a')}
          </Typography>
          <Chip
            label={appointment.status}
            size="small"
            sx={{
              ml: 'auto',
              height: 16,
              fontSize: '0.65rem',
              bgcolor: colors.border,
              color: 'white',
            }}
          />
        </Box>
      </Box>
    );
  };

  return (
    <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
      {/* Header with Navigation */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <IconButton onClick={handlePrevious} size="small">
          <ChevronLeft />
        </IconButton>

        <Typography variant="h6" fontWeight={600}>
          {viewMode === 'week'
            ? `${format(days[0], 'MMM d')} - ${format(days[days.length - 1], 'MMM d, yyyy')}`
            : format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </Typography>

        <IconButton onClick={handleNext} size="small">
          <ChevronRight />
        </IconButton>
      </Box>

      {/* Schedule Grid */}
      <Box sx={{ overflowX: 'auto' }}>
        <Box sx={{ minWidth: viewMode === 'week' ? 1200 : 600 }}>
          {/* Day Headers */}
          <Box display="flex" borderBottom="2px solid" borderColor="divider">
            {/* Time column header */}
            <Box
              sx={{
                width: 80,
                p: 1,
                bgcolor: 'grey.50',
                borderRight: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography variant="caption" fontWeight={600} color="text.secondary">
                Time
              </Typography>
            </Box>

            {/* Day headers */}
            {days.map((day, index) => (
              <Box
                key={index}
                sx={{
                  flex: 1,
                  p: 1,
                  textAlign: 'center',
                  bgcolor: isSameDay(day, new Date()) ? 'primary.50' : 'grey.50',
                  borderRight: index < days.length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="caption" color="text.secondary" display="block">
                  {format(day, 'EEE')}
                </Typography>
                <Typography
                  variant="h6"
                  fontWeight={600}
                  color={isSameDay(day, new Date()) ? 'primary.main' : 'text.primary'}
                >
                  {format(day, 'd')}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Time Slots */}
          <Box>
            {HOURS.map((hour) => (
              <Box
                key={hour}
                display="flex"
                borderBottom="1px solid"
                borderColor="divider"
                minHeight={80}
              >
                {/* Time Label */}
                <Box
                  sx={{
                    width: 80,
                    p: 1,
                    bgcolor: 'grey.50',
                    borderRight: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'flex-start',
                  }}
                >
                  <Typography variant="caption" fontWeight={500} color="text.secondary">
                    {format(new Date().setHours(hour, 0), 'h:mm a')}
                  </Typography>
                </Box>

                {/* Day Columns */}
                {days.map((day, dayIndex) => {
                  const dayKey = format(day, 'yyyy-MM-dd');
                  const aptForSlot = appointmentsByDayAndHour[dayKey]?.[hour] || [];

                  return (
                    <Box
                      key={dayIndex}
                      sx={{
                        flex: 1,
                        p: 1,
                        borderRight: dayIndex < days.length - 1 ? '1px solid' : 'none',
                        borderColor: 'divider',
                        bgcolor: isSameDay(day, new Date()) ? 'primary.50' : 'white',
                      }}
                    >
                      {aptForSlot.map((apt) => renderAppointmentCard(apt))}
                    </Box>
                  );
                })}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewDetails}>
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        {selectedAppointment?.status !== 'cancelled' && selectedAppointment?.status !== 'completed' && (
          <MenuItem onClick={handleCancel}>
            <ListItemIcon>
              <Cancel fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Cancel Appointment</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </Paper>
  );
};
