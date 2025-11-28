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
  Fade,
  Zoom,
  alpha,
  useTheme,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Visibility,
  Cancel,
  Today,
  AccessTime,
  MoreHoriz,
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

// Status color palette - refined and accessible
const statusConfig = {
  scheduled: {
    color: '#3B82F6',
    bg: '#EFF6FF',
    label: 'Scheduled',
  },
  in_progress: {
    color: '#F59E0B',
    bg: '#FFFBEB',
    label: 'In Progress',
  },
  completed: {
    color: '#10B981',
    bg: '#ECFDF5',
    label: 'Completed',
  },
  cancelled: {
    color: '#EF4444',
    bg: '#FEF2F2',
    label: 'Cancelled',
  },
};

const getStatusStyle = (status: string) => {
  return statusConfig[status as keyof typeof statusConfig] || {
    color: '#6B7280',
    bg: '#F3F4F6',
    label: status,
  };
};

export const AppointmentCalendarEnhanced: React.FC<AppointmentCalendarEnhancedProps> = ({
  appointments,
  onAppointmentClick,
  onCancelAppointment,
  selectedDate,
  onDateChange,
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

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

  // Calculate weeks for grid layout
  const weeks = useMemo(() => {
    const result: Date[][] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      result.push(calendarDays.slice(i, i + 7));
    }
    return result;
  }, [calendarDays]);

  const renderAppointmentItem = (apt: Appointment, isCompact: boolean = false) => {
    const aptTime = new Date(apt.appointment_datetime);
    const status = getStatusStyle(apt.status);

    return (
      <Tooltip
        key={apt.id}
        title={
          <Box sx={{ p: 0.5 }}>
            <Typography variant="body2" fontWeight={600}>
              {apt.patient_first_name} {apt.patient_last_name}
            </Typography>
            <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <AccessTime sx={{ fontSize: 12 }} />
              {format(aptTime, 'h:mm a')}
            </Typography>
            <Chip
              label={status.label}
              size="small"
              sx={{
                mt: 0.5,
                height: 18,
                fontSize: '0.65rem',
                bgcolor: status.bg,
                color: status.color,
                fontWeight: 600,
              }}
            />
          </Box>
        }
        placement="top"
        arrow
        TransitionComponent={Zoom}
      >
        <Box
          onClick={(e) => {
            e.stopPropagation();
            onAppointmentClick(apt.id);
          }}
          onContextMenu={(e) => handleAppointmentContextMenu(e, apt)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            py: isCompact ? 0.5 : 0.75,
            px: 1,
            mb: 0.5,
            borderRadius: 1.5,
            bgcolor: alpha(status.color, 0.08),
            borderLeft: `3px solid ${status.color}`,
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              bgcolor: alpha(status.color, 0.15),
              transform: 'translateX(2px)',
              boxShadow: `0 2px 8px ${alpha(status.color, 0.25)}`,
            },
            '&:active': {
              transform: 'translateX(2px) scale(0.98)',
            },
          }}
        >
          <Typography
            sx={{
              fontSize: isCompact ? '0.7rem' : '0.75rem',
              fontWeight: 600,
              color: status.color,
              minWidth: 'fit-content',
            }}
          >
            {format(aptTime, 'h:mm a')}
          </Typography>
          <Typography
            sx={{
              fontSize: isCompact ? '0.7rem' : '0.75rem',
              fontWeight: 500,
              color: 'text.primary',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
            }}
          >
            {apt.patient_first_name}
          </Typography>
        </Box>
      </Tooltip>
    );
  };

  const renderDayCell = (day: Date) => {
    const dayKey = format(day, 'yyyy-MM-dd');
    const dayAppointments = appointmentsByDate[dayKey] || [];
    const isCurrentMonth = isSameMonth(day, selectedDate);
    const isCurrentDay = isToday(day);
    const isSelected = isSameDay(day, selectedDate);
    const isHovered = hoveredDate === dayKey;
    const hasAppointments = dayAppointments.length > 0;

    return (
      <Box
        key={dayKey}
        onMouseEnter={() => setHoveredDate(dayKey)}
        onMouseLeave={() => setHoveredDate(null)}
        onClick={() => onDateChange(day)}
        sx={{
          flex: 1,
          minHeight: { xs: 100, sm: 120, md: 140 },
          p: { xs: 0.75, sm: 1, md: 1.25 },
          borderRight: '1px solid',
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: isSelected
            ? alpha(theme.palette.primary.main, 0.04)
            : isCurrentMonth
            ? 'background.paper'
            : alpha(theme.palette.grey[500], 0.02),
          cursor: 'pointer',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden',
          '&:hover': {
            bgcolor: isSelected
              ? alpha(theme.palette.primary.main, 0.08)
              : alpha(theme.palette.primary.main, 0.03),
          },
          '&:last-child': {
            borderRight: 'none',
          },
        }}
      >
        {/* Date Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 1,
          }}
        >
          <Box
            sx={{
              width: { xs: 24, sm: 28, md: 32 },
              height: { xs: 24, sm: 28, md: 32 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              bgcolor: isCurrentDay
                ? 'primary.main'
                : isSelected
                ? alpha(theme.palette.primary.main, 0.1)
                : 'transparent',
              color: isCurrentDay
                ? 'white'
                : isCurrentMonth
                ? 'text.primary'
                : 'text.disabled',
              fontWeight: isCurrentDay || isSelected ? 700 : 500,
              fontSize: { xs: '0.75rem', sm: '0.85rem', md: '0.9rem' },
              transition: 'all 0.2s ease',
              ...(isHovered && !isCurrentDay && {
                bgcolor: alpha(theme.palette.primary.main, 0.08),
              }),
            }}
          >
            {format(day, 'd')}
          </Box>

          {hasAppointments && (
            <Fade in>
              <Chip
                label={dayAppointments.length}
                size="small"
                sx={{
                  height: { xs: 18, sm: 20 },
                  minWidth: { xs: 18, sm: 20 },
                  fontSize: { xs: '0.65rem', sm: '0.7rem' },
                  fontWeight: 700,
                  bgcolor: 'primary.main',
                  color: 'white',
                  '& .MuiChip-label': {
                    px: 0.75,
                  },
                }}
              />
            </Fade>
          )}
        </Box>

        {/* Appointments List */}
        <Box
          sx={{
            overflow: 'hidden',
            maxHeight: { xs: 55, sm: 70, md: 85 },
          }}
        >
          {dayAppointments.slice(0, 3).map((apt) => renderAppointmentItem(apt, dayAppointments.length > 2))}

          {dayAppointments.length > 3 && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                py: 0.25,
                px: 1,
                borderRadius: 1,
                bgcolor: alpha(theme.palette.primary.main, 0.06),
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.12),
                },
              }}
              onClick={(e) => {
                e.stopPropagation();
                onDateChange(day);
              }}
            >
              <MoreHoriz sx={{ fontSize: 14, color: 'primary.main' }} />
              <Typography
                sx={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: 'primary.main',
                }}
              >
                +{dayAppointments.length - 3} more
              </Typography>
            </Box>
          )}
        </Box>

        {/* Hover indicator line */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 3,
            bgcolor: 'primary.main',
            transform: isHovered || isSelected ? 'scaleX(1)' : 'scaleX(0)',
            transformOrigin: 'left',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </Box>
    );
  };

  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        overflow: 'hidden',
        bgcolor: 'background.paper',
      }}
    >
      {/* Calendar Header */}
      <Box
        sx={{
          px: { xs: 2, sm: 3 },
          py: { xs: 2, sm: 2.5 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: alpha(theme.palette.primary.main, 0.02),
        }}
      >
        {/* Navigation */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 0.5, sm: 1 },
          }}
        >
          <IconButton
            onClick={handlePreviousMonth}
            size="small"
            sx={{
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              '&:hover': {
                bgcolor: 'primary.main',
                color: 'white',
                borderColor: 'primary.main',
              },
              transition: 'all 0.2s',
            }}
          >
            <ChevronLeft />
          </IconButton>
          <IconButton
            onClick={handleNextMonth}
            size="small"
            sx={{
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              '&:hover': {
                bgcolor: 'primary.main',
                color: 'white',
                borderColor: 'primary.main',
              },
              transition: 'all 0.2s',
            }}
          >
            <ChevronRight />
          </IconButton>
        </Box>

        {/* Month Title */}
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            fontSize: { xs: '1.1rem', sm: '1.35rem', md: '1.5rem' },
            color: 'text.primary',
            letterSpacing: '-0.01em',
          }}
        >
          {format(selectedDate, 'MMMM yyyy')}
        </Typography>

        {/* Today Button */}
        <IconButton
          onClick={handleToday}
          size="small"
          sx={{
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            '&:hover': {
              bgcolor: 'primary.main',
              color: 'white',
              borderColor: 'primary.main',
            },
            transition: 'all 0.2s',
          }}
        >
          <Today />
        </IconButton>
      </Box>

      {/* Day of Week Headers */}
      <Box
        sx={{
          display: 'flex',
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: alpha(theme.palette.grey[500], 0.04),
        }}
      >
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
          <Box
            key={day}
            sx={{
              flex: 1,
              py: { xs: 1, sm: 1.5 },
              textAlign: 'center',
              borderRight: index < 6 ? '1px solid' : 'none',
              borderColor: 'divider',
            }}
          >
            <Typography
              sx={{
                fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' },
                fontWeight: 600,
                color: index === 0 || index === 6 ? 'error.main' : 'text.secondary',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              {day}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Calendar Grid */}
      <Box>
        {weeks.map((week, weekIndex) => (
          <Box
            key={weekIndex}
            sx={{
              display: 'flex',
              '&:last-child > div': {
                borderBottom: 'none',
              },
            }}
          >
            {week.map((day) => renderDayCell(day))}
          </Box>
        ))}
      </Box>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        TransitionComponent={Fade}
        PaperProps={{
          elevation: 8,
          sx: {
            borderRadius: 2,
            minWidth: 180,
            border: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        <MenuItem onClick={handleViewDetails} sx={{ py: 1.5 }}>
          <ListItemIcon>
            <Visibility fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText
            primary="View Details"
            primaryTypographyProps={{ fontWeight: 500 }}
          />
        </MenuItem>
        {selectedAppointment?.status !== 'cancelled' && selectedAppointment?.status !== 'completed' && (
          <MenuItem onClick={handleCancel} sx={{ py: 1.5 }}>
            <ListItemIcon>
              <Cancel fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText
              primary="Cancel Appointment"
              primaryTypographyProps={{ fontWeight: 500, color: 'error.main' }}
            />
          </MenuItem>
        )}
      </Menu>
    </Paper>
  );
};
