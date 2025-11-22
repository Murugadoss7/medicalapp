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
  Grid,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Visibility,
  Cancel,
  Today,
} from '@mui/icons-material';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  addDays,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import type { Appointment } from '../../store/api';

interface AppointmentCalendarEnhancedProps {
  appointments: Appointment[];
  onAppointmentClick: (appointmentId: string) => void;
  onCancelAppointment: (appointmentId: string) => void;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'scheduled':
      return '#2196f3';
    case 'in_progress':
      return '#ff9800';
    case 'completed':
      return '#4caf50';
    case 'cancelled':
      return '#f44336';
    default:
      return '#9e9e9e';
  }
};

export const AppointmentCalendarEnhanced: React.FC<AppointmentCalendarEnhancedProps> = ({
  appointments,
  onAppointmentClick,
  onCancelAppointment,
  selectedDate,
  onDateChange,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days = [];
    let day = startDate;

    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  }, [startDate, endDate]);

  // Group appointments by date
  const appointmentsByDate = useMemo(() => {
    const grouped: Record<string, Appointment[]> = {};

    appointments.forEach(apt => {
      const dateKey = format(new Date(apt.appointment_datetime), 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(apt);
    });

    // Sort appointments by time for each day
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) =>
        new Date(a.appointment_datetime).getTime() - new Date(b.appointment_datetime).getTime()
      );
    });

    return grouped;
  }, [appointments]);

  const handlePreviousMonth = () => {
    onDateChange(addMonths(selectedDate, -1));
  };

  const handleNextMonth = () => {
    onDateChange(addMonths(selectedDate, 1));
  };

  const handleToday = () => {
    onDateChange(new Date());
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

  const renderDayCell = (day: Date) => {
    const dayKey = format(day, 'yyyy-MM-dd');
    const dayAppointments = appointmentsByDate[dayKey] || [];
    const isCurrentMonth = isSameMonth(day, selectedDate);
    const isCurrentDay = isToday(day);
    const isSelected = isSameDay(day, selectedDate);

    return (
      <Paper
        key={dayKey}
        elevation={0}
        sx={{
          minHeight: 120,
          p: 1,
          border: '1px solid',
          borderColor: isCurrentDay ? 'primary.main' : 'divider',
          borderWidth: isCurrentDay ? 2 : 1,
          bgcolor: isSelected ? 'primary.50' : isCurrentMonth ? 'white' : 'grey.50',
          cursor: 'pointer',
          transition: 'all 0.2s',
          '&:hover': {
            bgcolor: 'primary.50',
            boxShadow: 2,
          },
        }}
        onClick={() => onDateChange(day)}
      >
        {/* Date Number */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography
            variant="body2"
            fontWeight={isCurrentDay ? 700 : 500}
            color={
              isCurrentDay
                ? 'primary.main'
                : isCurrentMonth
                ? 'text.primary'
                : 'text.disabled'
            }
          >
            {format(day, 'd')}
          </Typography>

          {dayAppointments.length > 0 && (
            <Chip
              label={dayAppointments.length}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.7rem',
                bgcolor: 'primary.main',
                color: 'white',
              }}
            />
          )}
        </Box>

        {/* Appointments */}
        <Box>
          {dayAppointments.slice(0, 3).map((apt) => {
            const aptTime = new Date(apt.appointment_datetime);
            return (
              <Box
                key={apt.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onAppointmentClick(apt.id);
                }}
                onContextMenu={(e) => handleAppointmentContextMenu(e, apt)}
                sx={{
                  p: 0.5,
                  mb: 0.5,
                  borderRadius: 0.5,
                  borderLeft: `3px solid ${getStatusColor(apt.status)}`,
                  bgcolor: 'white',
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'grey.100',
                  },
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {format(aptTime, 'h:mm a')} • {apt.patient_first_name}
                </Typography>
              </Box>
            );
          })}

          {dayAppointments.length > 3 && (
            <Typography
              variant="caption"
              color="primary"
              sx={{
                display: 'block',
                textAlign: 'center',
                fontSize: '0.65rem',
                fontWeight: 600,
              }}
            >
              +{dayAppointments.length - 3} more
            </Typography>
          )}
        </Box>
      </Paper>
    );
  };

  return (
    <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
      {/* Calendar Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '2px solid',
          borderColor: 'divider',
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton onClick={handlePreviousMonth} size="small">
            <ChevronLeft />
          </IconButton>
          <IconButton onClick={handleNextMonth} size="small">
            <ChevronRight />
          </IconButton>
        </Box>

        <Typography variant="h6" fontWeight={600}>
          {format(selectedDate, 'MMMM yyyy')}
        </Typography>

        <IconButton onClick={handleToday} size="small" color="primary">
          <Today />
        </IconButton>
      </Box>

      {/* Day of Week Headers */}
      <Grid container sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <Grid
            item
            xs={12 / 7}
            key={day}
            sx={{
              p: 1,
              textAlign: 'center',
              bgcolor: 'grey.100',
            }}
          >
            <Typography variant="caption" fontWeight={600} color="text.secondary">
              {day}
            </Typography>
          </Grid>
        ))}
      </Grid>

      {/* Calendar Grid */}
      <Grid container>
        {calendarDays.map((day) => (
          <Grid item xs={12 / 7} key={format(day, 'yyyy-MM-dd')}>
            {renderDayCell(day)}
          </Grid>
        ))}
      </Grid>

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
