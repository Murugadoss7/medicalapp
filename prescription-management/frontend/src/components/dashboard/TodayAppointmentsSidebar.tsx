import { useMemo } from 'react';
import {
  Drawer,
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  Chip,
  IconButton,
  Skeleton,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Close,
  CalendarToday,
  AccessTime,
  HourglassEmpty,
  CheckCircle,
  Cancel,
  EventBusy,
  Refresh,
  Person,
  LocationOn,
  MedicalServices,
  Schedule,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../hooks';
import { setAppointmentsSidebarOpen, setSidebarMode } from '../../store/slices/uiSlice';
import { useGetDoctorTodayAppointmentsQuery, useGetDoctorProfileQuery, useGetDoctorTodayProceduresQuery, type Appointment } from '../../store/api';
import { getCurrentDoctorId } from '../../utils/doctorUtils';

const drawerWidth = 320;

const getStatusColor = (status: Appointment['status']) => {
  switch (status) {
    case 'scheduled':
      return 'primary';
    case 'in_progress':
      return 'warning';
    case 'completed':
      return 'success';
    case 'cancelled':
      return 'error';
    case 'no_show':
      return 'default';
    default:
      return 'default';
  }
};

const getStatusLabel = (status: Appointment['status']) => {
  switch (status) {
    case 'scheduled':
      return 'Scheduled';
    case 'in_progress':
      return 'In Progress';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    case 'no_show':
      return 'No Show';
    default:
      return status;
  }
};

const getStatusIcon = (status: Appointment['status']) => {
  switch (status) {
    case 'scheduled':
      return <AccessTime fontSize="small" />;
    case 'in_progress':
      return <HourglassEmpty fontSize="small" />;
    case 'completed':
      return <CheckCircle fontSize="small" />;
    case 'cancelled':
      return <Cancel fontSize="small" />;
    case 'no_show':
      return <EventBusy fontSize="small" />;
    default:
      return <AccessTime fontSize="small" />;
  }
};

const getTimeDisplay = (appointment: Appointment) => {
  try {
    if (appointment.appointment_datetime) {
      return format(parseISO(appointment.appointment_datetime), 'hh:mm a');
    }
    if (appointment.appointment_time) {
      const timeParts = appointment.appointment_time.split(':');
      const hour = parseInt(timeParts[0], 10);
      const minute = timeParts[1];
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minute} ${ampm}`;
    }
    return '--:--';
  } catch {
    return appointment.appointment_time || '--:--';
  }
};

const sortAppointmentsByTime = (appointments: Appointment[]) => {
  return [...appointments].sort((a, b) => {
    const timeA = a.appointment_datetime || a.appointment_time || '';
    const timeB = b.appointment_datetime || b.appointment_time || '';
    return timeA.localeCompare(timeB);
  });
};

// Procedure status colors
const getProcedureStatusColor = (status: string) => {
  switch (status) {
    case 'planned':
      return 'primary';
    case 'in_progress':
      return 'warning';
    case 'completed':
      return 'success';
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
};

export const TodayAppointmentsSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));
  const { user } = useAppSelector((state) => state.auth);
  const { appointmentsSidebarOpen, selectedOfficeId, sidebarMode } = useAppSelector((state) => state.ui);

  // Dashboard always uses persistent sidebar
  const isDashboard = location.pathname === '/doctor/dashboard';
  const usePersistent = isLargeScreen || isDashboard;

  const doctorId = getCurrentDoctorId();

  // Check if dental doctor
  const isDentalDoctor = useMemo(() => {
    return user?.specialization?.toLowerCase().includes('dental') ||
           user?.specialization?.toLowerCase().includes('dentist');
  }, [user?.specialization]);

  const {
    data: todayAppointmentsData,
    isLoading: appointmentsLoading,
    refetch: refetchAppointments,
  } = useGetDoctorTodayAppointmentsQuery(doctorId, {
    skip: !doctorId || user?.role !== 'doctor',
  });

  // Get procedures for dental doctors
  const {
    data: todayProceduresData,
    isLoading: proceduresLoading,
    refetch: refetchProcedures,
  } = useGetDoctorTodayProceduresQuery(doctorId, {
    skip: !doctorId || !isDentalDoctor,
  });

  // Get doctor profile to get office names (use doctorId, not userId)
  const { data: doctorProfile } = useGetDoctorProfileQuery(doctorId, {
    skip: !doctorId,
  });

  // Get selected office name
  const selectedOfficeName = useMemo(() => {
    if (!selectedOfficeId || selectedOfficeId === 'no_office') return 'All Locations';
    const office = doctorProfile?.offices?.find((o) => o.id === selectedOfficeId);
    return office?.name || 'All Locations';
  }, [selectedOfficeId, doctorProfile?.offices]);

  // Extract and sort appointments
  const appointments = useMemo(() => {
    if (!todayAppointmentsData) return [];
    const data = Array.isArray(todayAppointmentsData)
      ? todayAppointmentsData
      : todayAppointmentsData.appointments || [];
    return sortAppointmentsByTime(data);
  }, [todayAppointmentsData]);

  // Filter appointments by selected office and exclude cancelled/no_show
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      // Exclude cancelled and no_show
      if (apt.status === 'cancelled' || apt.status === 'no_show') {
        return false;
      }

      // Filter by office if selected
      if (selectedOfficeId && selectedOfficeId !== 'no_office') {
        return apt.office_id === selectedOfficeId;
      }

      // If 'no_office' is selected, show appointments without office_id
      if (selectedOfficeId === 'no_office') {
        return !apt.office_id;
      }

      // Show all if no office selected
      return true;
    });
  }, [appointments, selectedOfficeId]);

  // Count pending appointments (scheduled + in_progress) from filtered list
  const pendingCount = filteredAppointments.filter(
    (apt) => apt.status === 'scheduled' || apt.status === 'in_progress'
  ).length;

  const handleClose = () => {
    dispatch(setAppointmentsSidebarOpen(false));
  };

  const handleAppointmentClick = (appointment: Appointment, event: React.MouseEvent<HTMLElement>) => {
    // CRITICAL FIX for iPad: Blur the button before navigation to prevent aria-hidden focus trap
    // When a button retains focus during navigation, Material-UI sets aria-hidden="true" on root,
    // blocking ALL clicks on the page. Blurring prevents this issue.
    const target = event.currentTarget;
    if (target instanceof HTMLElement) {
      target.blur();
    }

    // Also blur any focused element as a safety measure
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    // Check if doctor has dental specialization
    const isDentalDoctor =
      user?.specialization?.toLowerCase().includes('dental') ||
      user?.specialization?.toLowerCase().includes('dentist');

    if (isDentalDoctor) {
      navigate(`/appointments/${appointment.id}/dental`);
    } else {
      navigate(`/appointments/${appointment.id}/consultation`);
    }
  };

  // Only render for doctors
  if (user?.role !== 'doctor') {
    return null;
  }

  return (
    <Drawer
      variant={usePersistent ? 'persistent' : 'temporary'}
      anchor="right"
      open={appointmentsSidebarOpen}
      onClose={handleClose}
      ModalProps={{
        keepMounted: false, // CRITICAL FIX: Don't keep mounted when closed to prevent iPad overlay blocking
        disableRestoreFocus: true, // Prevent focus trap issues
        // Hide backdrop immediately when closing to prevent interaction blocking
        hideBackdrop: false,
        slotProps: {
          backdrop: {
            // Make backdrop invisible and non-blocking
            sx: {
              backgroundColor: 'transparent',
              pointerEvents: 'none', // CRITICAL: Prevent backdrop from blocking clicks
            },
          },
        },
      }}
      sx={{
        // Don't set width on Drawer - main content uses margin-right instead
        // This prevents double-counting of sidebar space
        flexShrink: 0,
        // CRITICAL FIX: Ensure drawer doesn't block interactions when closed
        pointerEvents: appointmentsSidebarOpen ? 'auto' : 'none',
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          top: { xs: 56, sm: 64 }, // Below AppBar (56px on mobile, 64px on desktop)
          height: { xs: 'calc(100% - 56px)', sm: 'calc(100% - 64px)' },
          pointerEvents: 'auto', // Re-enable pointer events on the paper itself
        },
      }}
    >
      {/* Header - Medical Futurism Solid Purple (NO GRADIENT) */}
      <Box
        sx={{
          p: 2,
          background: '#667eea', // Solid purple
          color: 'white',
          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {sidebarMode === 'procedures' ? <MedicalServices /> : <CalendarToday />}
            <Typography variant="h6" fontWeight={700}>
              {sidebarMode === 'procedures' ? 'Procedures' : 'Appointments'}
            </Typography>
            {sidebarMode === 'appointments' && pendingCount > 0 && (
              <Chip
                label={pendingCount}
                size="small"
                sx={{
                  bgcolor: '#f59e0b', // Solid orange
                  color: 'white',
                  fontWeight: 700,
                  height: 24,
                  boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
                }}
              />
            )}
            {sidebarMode === 'procedures' && todayProceduresData?.procedures?.length > 0 && (
              <Chip
                label={todayProceduresData.procedures.length}
                size="small"
                sx={{
                  bgcolor: '#10b981', // Solid green
                  color: 'white',
                  fontWeight: 700,
                  height: 24,
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                }}
              />
            )}
          </Box>
          <Box>
            <IconButton
              size="small"
              onClick={() => sidebarMode === 'procedures' ? refetchProcedures() : refetchAppointments()}
              sx={{ color: 'white', mr: 0.5 }}
            >
              <Refresh fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={handleClose} sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </Box>
        </Box>
        {/* Selected Office Indicator - only show for appointments mode */}
        {sidebarMode === 'appointments' && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1, opacity: 0.9 }}>
            <LocationOn fontSize="small" />
            <Typography variant="caption">
              {selectedOfficeName}
            </Typography>
          </Box>
        )}
        {sidebarMode === 'procedures' && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1, opacity: 0.9 }}>
            <Schedule fontSize="small" />
            <Typography variant="caption">
              Today's Scheduled Procedures
            </Typography>
          </Box>
        )}
      </Box>

      <Divider />

      {/* Content Area with Purple Scrollbar */}
      <Box
        sx={{
          overflow: 'auto',
          flexGrow: 1,
          // Purple scrollbar
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(102, 126, 234, 0.05)',
            borderRadius: 10,
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#667eea',
            borderRadius: 10,
            '&:hover': {
              background: '#5568d3',
            },
          },
        }}
      >
        {/* Procedures View */}
        {sidebarMode === 'procedures' && (
          <>
            {proceduresLoading ? (
              <List sx={{ p: 1 }}>
                {[1, 2, 3].map((item) => (
                  <ListItem key={item} sx={{ px: 1, py: 0.5 }}>
                    <Box sx={{ width: '100%' }}>
                      <Skeleton variant="text" width="60%" />
                      <Skeleton variant="text" width="40%" />
                    </Box>
                  </ListItem>
                ))}
              </List>
            ) : !todayProceduresData?.procedures?.length ? (
              <Box
                sx={{
                  p: 3,
                  textAlign: 'center',
                  color: 'text.secondary',
                }}
              >
                <MedicalServices sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
                <Typography variant="body2">
                  No procedures scheduled for today
                </Typography>
              </Box>
            ) : (
              <List sx={{ p: 1 }}>
                {todayProceduresData.procedures.map((procedure: any) => (
                  <ListItem
                    key={procedure.id}
                    disablePadding
                    sx={{ mb: 1 }}
                  >
                    <ListItemButton
                      onClick={(event) => {
                        // CRITICAL FIX: Blur button before navigation to prevent aria-hidden focus trap
                        const target = event.currentTarget;
                        if (target instanceof HTMLElement) {
                          target.blur();
                        }
                        if (document.activeElement instanceof HTMLElement) {
                          document.activeElement.blur();
                        }

                        if (procedure.appointment_id) {
                          navigate(`/appointments/${procedure.appointment_id}/dental`);
                        }
                      }}
                      sx={{
                        borderRadius: 1.5,
                        border: '2px solid',
                        borderColor:
                          procedure.status === 'in_progress'
                            ? '#f59e0b'
                            : procedure.status === 'completed'
                            ? 'rgba(102, 126, 234, 0.3)'
                            : 'rgba(102, 126, 234, 0.15)',
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(10px)',
                        opacity: procedure.status === 'completed' ? 0.8 : 1,
                        p: 1.5,
                        minHeight: 44,
                        '&:hover': {
                          background: 'rgba(102, 126, 234, 0.05)',
                          borderColor:
                            procedure.status === 'in_progress'
                              ? '#f59e0b'
                              : '#667eea',
                        },
                      }}
                    >
                      <Box sx={{ width: '100%' }}>
                        {/* Procedure Name and Status */}
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            mb: 0.5,
                          }}
                        >
                          <Typography
                            variant="body2"
                            fontWeight="bold"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              flex: 1,
                              mr: 1,
                            }}
                          >
                            {procedure.procedure_name}
                          </Typography>
                          <Chip
                            label={procedure.status}
                            size="small"
                            color={getProcedureStatusColor(procedure.status) as any}
                            variant={
                              procedure.status === 'completed'
                                ? 'outlined'
                                : 'filled'
                            }
                            sx={{ height: 22, fontSize: '0.7rem' }}
                          />
                        </Box>

                        {/* Patient Name */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
                          <Person fontSize="small" sx={{ color: 'text.secondary', fontSize: 16 }} />
                          <Typography
                            variant="caption"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              color: 'text.primary',
                            }}
                          >
                            {procedure.patient_name || 'Unknown Patient'}
                          </Typography>
                        </Box>

                        {/* Tooth Numbers */}
                        {procedure.tooth_numbers && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ pl: 2.5 }}
                            >
                              Tooth: {procedure.tooth_numbers}
                            </Typography>
                          </Box>
                        )}

                        {/* Procedure Code */}
                        {procedure.procedure_code && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ pl: 2.5, display: 'block' }}
                          >
                            Code: {procedure.procedure_code}
                          </Typography>
                        )}
                      </Box>
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            )}
          </>
        )}

        {/* Appointments View */}
        {sidebarMode === 'appointments' && (
        appointmentsLoading ? (
          <List sx={{ p: 1 }}>
            {[1, 2, 3, 4].map((item) => (
              <ListItem key={item} sx={{ px: 1, py: 0.5 }}>
                <Box sx={{ width: '100%' }}>
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="40%" />
                </Box>
              </ListItem>
            ))}
          </List>
        ) : filteredAppointments.length === 0 ? (
          <Box
            sx={{
              p: 3,
              textAlign: 'center',
              color: 'text.secondary',
            }}
          >
            <CalendarToday sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
            <Typography variant="body2">
              {selectedOfficeId && selectedOfficeId !== 'no_office'
                ? 'No appointments at this location'
                : 'No appointments today'}
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 1 }}>
            {filteredAppointments.map((appointment) => (
              <ListItem
                key={appointment.id}
                disablePadding
                sx={{ mb: 1 }}
              >
                <ListItemButton
                  onClick={(event) => handleAppointmentClick(appointment, event)}
                  sx={{
                    borderRadius: 1.5,
                    border: '2px solid',
                    borderColor:
                      appointment.status === 'in_progress'
                        ? '#f59e0b'
                        : appointment.status === 'completed'
                        ? 'rgba(102, 126, 234, 0.3)'
                        : 'rgba(102, 126, 234, 0.15)',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    opacity: appointment.status === 'completed' ? 0.8 : 1,
                    p: 1.5,
                    minHeight: 44,
                    '&:hover': {
                      background: 'rgba(102, 126, 234, 0.05)',
                      borderColor:
                        appointment.status === 'in_progress'
                          ? '#f59e0b'
                          : '#667eea',
                    },
                  }}
                >
                  <Box sx={{ width: '100%' }}>
                    {/* Time and Status Row */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 0.5,
                      }}
                    >
                      <Typography
                        variant="caption"
                        fontWeight="bold"
                        sx={{
                          color:
                            appointment.status === 'in_progress'
                              ? 'warning.dark'
                              : 'primary.main',
                        }}
                      >
                        {getTimeDisplay(appointment)}
                      </Typography>
                      <Chip
                        icon={getStatusIcon(appointment.status)}
                        label={getStatusLabel(appointment.status)}
                        size="small"
                        color={getStatusColor(appointment.status)}
                        variant={
                          appointment.status === 'completed'
                            ? 'outlined'
                            : 'filled'
                        }
                        sx={{ height: 22, fontSize: '0.7rem' }}
                      />
                    </Box>

                    {/* Patient Name - Prominently displayed */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
                      <Person fontSize="small" sx={{ color: 'text.secondary', fontSize: 16 }} />
                      <Typography
                        variant="body2"
                        fontWeight="bold"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          color: 'text.primary',
                        }}
                      >
                        {appointment.patient_full_name ||
                         `${appointment.patient_first_name || ''} ${appointment.patient_last_name || ''}`.trim() ||
                         'Unknown Patient'}
                      </Typography>
                    </Box>

                    {/* Reason (if exists) */}
                    {appointment.reason_for_visit && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontStyle: 'italic',
                          pl: 2.5,
                        }}
                      >
                        {appointment.reason_for_visit}
                      </Typography>
                    )}
                  </Box>
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        ))}
      </Box>

      {/* Summary Footer */}
      <Divider sx={{ borderColor: 'rgba(102, 126, 234, 0.2)' }} />
      <Box sx={{
        p: 1.5,
        background: 'rgba(102, 126, 234, 0.03)',
        borderTop: '1px solid rgba(102, 126, 234, 0.1)'
      }}>
        {sidebarMode === 'procedures' ? (
          <Typography variant="caption" color="text.secondary">
            {todayProceduresData?.procedures?.length || 0} procedure{(todayProceduresData?.procedures?.length || 0) !== 1 ? 's' : ''}
            {(todayProceduresData?.procedures?.filter((p: any) => p.status === 'completed').length || 0) > 0 &&
              ` (${todayProceduresData?.procedures?.filter((p: any) => p.status === 'completed').length} completed)`}
          </Typography>
        ) : (
          <Typography variant="caption" color="text.secondary">
            {filteredAppointments.length} appointment{filteredAppointments.length !== 1 ? 's' : ''}
            {filteredAppointments.filter((a) => a.status === 'completed').length > 0 &&
              ` (${filteredAppointments.filter((a) => a.status === 'completed').length} completed)`}
          </Typography>
        )}
      </Box>
    </Drawer>
  );
};
