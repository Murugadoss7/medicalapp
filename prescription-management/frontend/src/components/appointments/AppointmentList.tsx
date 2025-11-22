import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Button,
  Divider,
  Skeleton,
  Alert,
  Pagination,
} from '@mui/material';
import {
  Person,
  MoreVert,
  CheckCircle,
  Cancel,
  Schedule,
  Pending,
  Edit,
  Delete,
  Visibility,
  Phone,
  AccessTime,
} from '@mui/icons-material';
import { useGetDoctorAppointmentsQuery, useUpdateAppointmentStatusMutation } from '../../store/api';
import type { Appointment, AppointmentFilters } from '../../store/api';
import { appointmentDate } from '../../utils/dateUtils';

interface AppointmentListProps {
  doctorId: string;
  filters?: AppointmentFilters;
  onAppointmentClick?: (appointment: Appointment) => void;
  onEditAppointment?: (appointment: Appointment) => void;
  onCancelAppointment?: (appointment: Appointment) => void;
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
      return <Schedule />;
  }
};

export const AppointmentList: React.FC<AppointmentListProps> = ({
  doctorId,
  filters = {},
  onAppointmentClick,
  onEditAppointment,
  onCancelAppointment,
}) => {
  const [page, setPage] = useState(1);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const { data, isLoading, error } = useGetDoctorAppointmentsQuery({
    doctorId,
    ...filters,
    page,
    limit: 10,
  });

  const [updateStatus] = useUpdateAppointmentStatusMutation();

  const appointments = data?.appointments || [];
  const totalPages = Math.ceil((data?.total || 0) / 10);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, appointment: Appointment) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedAppointment(appointment);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedAppointment(null);
  };

  const handleStatusUpdate = async (appointmentId: string, status: string) => {
    try {
      await updateStatus({ appointmentId, status }).unwrap();
      handleMenuClose();
    } catch (error) {
      console.error('Failed to update appointment status:', error);
    }
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    onAppointmentClick?.(appointment);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Appointments
          </Typography>
          <List>
            {[...Array(5)].map((_, index) => (
              <ListItem key={index}>
                <ListItemAvatar>
                  <Skeleton variant="circular" width={40} height={40} />
                </ListItemAvatar>
                <ListItemText
                  primary={<Skeleton variant="text" width="60%" />}
                  secondary={<Skeleton variant="text" width="40%" />}
                />
                <Skeleton variant="rectangular" width={80} height={24} />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">
            Failed to load appointments. Please try again.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (appointments.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Appointments
          </Typography>
          <Alert severity="info">
            No appointments found for the selected criteria.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Appointments ({data?.total || 0})
          </Typography>
        </Box>

        <List>
          {appointments.map((appointment, index) => (
            <React.Fragment key={appointment.id}>
              <ListItem
                button
                onClick={() => handleAppointmentClick(appointment)}
                sx={{
                  borderRadius: 1,
                  mb: 1,
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <ListItemAvatar>
                  <Avatar>
                    <Person />
                  </Avatar>
                </ListItemAvatar>

                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="subtitle2">
                        {appointment.patient_first_name}
                      </Typography>
                      <Chip
                        size="small"
                        label={appointment.status}
                        color={getStatusColor(appointment.status)}
                        icon={getStatusIcon(appointment.status)}
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                        <AccessTime fontSize="small" color="action" />
                        <Typography variant="body2" color="textSecondary">
                          {appointmentDate.displayDateTime(appointment.appointment_datetime)}
                        </Typography>
                      </Box>
                      {appointment.patient_mobile_number && (
                        <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                          <Phone fontSize="small" color="action" />
                          <Typography variant="body2" color="textSecondary">
                            {appointment.patient_mobile_number}
                          </Typography>
                        </Box>
                      )}
                      {appointment.appointment_number && (
                        <Typography variant="caption" color="textSecondary">
                          #{appointment.appointment_number}
                        </Typography>
                      )}
                    </Box>
                  }
                />

                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={(e) => handleMenuClick(e, appointment)}
                  >
                    <MoreVert />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>

              {index < appointments.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>

        {totalPages > 1 && (
          <Box display="flex" justifyContent="center" mt={2}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        )}

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem
            onClick={() => {
              if (selectedAppointment) {
                handleAppointmentClick(selectedAppointment);
              }
            }}
          >
            <Visibility fontSize="small" sx={{ mr: 1 }} />
            View Details
          </MenuItem>

          {selectedAppointment?.status === 'scheduled' && (
            <MenuItem
              onClick={() => {
                if (selectedAppointment) {
                  handleStatusUpdate(selectedAppointment.id, 'in_progress');
                }
              }}
            >
              <Pending fontSize="small" sx={{ mr: 1 }} />
              Start Consultation
            </MenuItem>
          )}

          {selectedAppointment?.status === 'in_progress' && (
            <MenuItem
              onClick={() => {
                if (selectedAppointment) {
                  handleStatusUpdate(selectedAppointment.id, 'completed');
                }
              }}
            >
              <CheckCircle fontSize="small" sx={{ mr: 1 }} />
              Mark Completed
            </MenuItem>
          )}

          {selectedAppointment?.status !== 'completed' && selectedAppointment?.status !== 'cancelled' && (
            <MenuItem
              onClick={() => {
                if (selectedAppointment) {
                  onEditAppointment?.(selectedAppointment);
                }
                handleMenuClose();
              }}
            >
              <Edit fontSize="small" sx={{ mr: 1 }} />
              Reschedule
            </MenuItem>
          )}

          {selectedAppointment?.status !== 'completed' && selectedAppointment?.status !== 'cancelled' && (
            <MenuItem
              onClick={() => {
                if (selectedAppointment) {
                  onCancelAppointment?.(selectedAppointment);
                }
                handleMenuClose();
              }}
              sx={{ color: 'error.main' }}
            >
              <Cancel fontSize="small" sx={{ mr: 1 }} />
              Cancel
            </MenuItem>
          )}
        </Menu>
      </CardContent>
    </Card>
  );
};