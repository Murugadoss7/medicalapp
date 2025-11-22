import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Grid,
  Chip,
  Button,
  Avatar,
  Tooltip,
  Paper,
  Skeleton,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Event,
  Person,
  Schedule,
  CheckCircle,
  Cancel,
  Pending,
} from '@mui/icons-material';
import { startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isToday } from 'date-fns';
import { useGetAppointmentsByDateQuery } from '../../store/api';
import type { Appointment } from '../../store/api';
import { formatDate, appointmentDate } from '../../utils/dateUtils';

interface AppointmentCalendarProps {
  doctorId: string;
  onAppointmentClick?: (appointment: Appointment) => void;
  onDateClick?: (date: Date) => void;
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
      return <Event />;
  }
};

export const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({
  doctorId,
  onAppointmentClick,
  onDateClick,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const startDate = startOfMonth(currentDate);
  const endDate = endOfMonth(currentDate);

  const { data, isLoading, error } = useGetAppointmentsByDateQuery({
    doctorId,
    startDate: formatDate.forAPI.dateOnly(startDate),
    endDate: formatDate.forAPI.dateOnly(endDate),
  });

  // Handle different API response formats
  const appointments = Array.isArray(data) ? data : (data?.appointments || []);

  const daysInMonth = useMemo(() => {
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [startDate, endDate]);

  const appointmentsByDate = useMemo(() => {
    const grouped: Record<string, Appointment[]> = {};
    if (Array.isArray(appointments)) {
      appointments.forEach((appointment) => {
        const dateKey = appointmentDate.getCalendarKey(appointment.appointment_datetime);
        if (dateKey && !grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        if (dateKey) {
          grouped[dateKey].push(appointment);
        }
      });
    }
    return grouped;
  }, [appointments]);

  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateClick = (date: Date) => {
    onDateClick?.(date);
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    onAppointmentClick?.(appointment);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Skeleton variant="rectangular" height={400} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" component="h2">
            Appointment Calendar
          </Typography>
          <Box display="flex" alignItems="center" gap={1}>
            <Button size="small" onClick={goToToday} variant="outlined">
              Today
            </Button>
            <IconButton onClick={goToPreviousMonth} size="small">
              <ChevronLeft />
            </IconButton>
            <Typography variant="h6" sx={{ minWidth: 150, textAlign: 'center' }}>
              {formatDate.forCalendar.month(currentDate)}
            </Typography>
            <IconButton onClick={goToNextMonth} size="small">
              <ChevronRight />
            </IconButton>
          </Box>
        </Box>

        <Grid container spacing={1}>
          {/* Calendar Header */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <Grid item xs key={day}>
              <Typography
                variant="subtitle2"
                color="textSecondary"
                align="center"
                sx={{ py: 1, fontWeight: 'bold' }}
              >
                {day}
              </Typography>
            </Grid>
          ))}

          {/* Calendar Days */}
          {daysInMonth.map((date) => {
            const dateKey = formatDate.forAPI.dateOnly(date);
            const dayAppointments = appointmentsByDate[dateKey] || [];
            const isCurrentDay = isToday(date);

            return (
              <Grid item xs key={dateKey}>
                <Paper
                  variant="outlined"
                  sx={{
                    minHeight: 120,
                    p: 1,
                    cursor: 'pointer',
                    backgroundColor: isCurrentDay ? 'primary.main' : 'background.paper',
                    color: isCurrentDay ? 'primary.contrastText' : 'text.primary',
                    '&:hover': {
                      backgroundColor: isCurrentDay ? 'primary.dark' : 'action.hover',
                    },
                  }}
                  onClick={() => handleDateClick(date)}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: isCurrentDay ? 'bold' : 'normal',
                      mb: 0.5,
                    }}
                  >
                    {formatDate.forCalendar.day(date)}
                  </Typography>

                  <Box>
                    {dayAppointments.slice(0, 3).map((appointment) => (
                      <Tooltip
                        key={appointment.id}
                        title={`${appointmentDate.displayTime(appointment.appointment_datetime)} - ${appointment.patient_first_name}`}
                      >
                        <Chip
                          size="small"
                          label={appointmentDate.displayTime(appointment.appointment_datetime)}
                          color={getStatusColor(appointment.status)}
                          sx={{
                            mb: 0.5,
                            width: '100%',
                            maxWidth: '100%',
                            fontSize: '0.6rem',
                            height: 20,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAppointmentClick(appointment);
                          }}
                        />
                      </Tooltip>
                    ))}

                    {dayAppointments.length > 3 && (
                      <Typography
                        variant="caption"
                        color="textSecondary"
                        sx={{ fontSize: '0.6rem' }}
                      >
                        +{dayAppointments.length - 3} more
                      </Typography>
                    )}
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>

        <Box mt={2} display="flex" justifyContent="center" gap={2} flexWrap="wrap">
          <Chip
            size="small"
            icon={<CheckCircle />}
            label="Completed"
            color="success"
            variant="outlined"
          />
          <Chip
            size="small"
            icon={<Schedule />}
            label="Scheduled"
            color="primary"
            variant="outlined"
          />
          <Chip
            size="small"
            icon={<Pending />}
            label="In Progress"
            color="warning"
            variant="outlined"
          />
          <Chip
            size="small"
            icon={<Cancel />}
            label="Cancelled"
            color="error"
            variant="outlined"
          />
        </Box>
      </CardContent>
    </Card>
  );
};