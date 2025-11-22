import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  LocalHospital as DoctorIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  School as QualificationIcon,
  Work as ExperienceIcon,
  AttachMoney as FeeIcon,
  Timer as DurationIcon,
  Person as PersonIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import {
  useGetDoctorByIdQuery,
  useGetDoctorScheduleQuery,
  useDeleteDoctorMutation,
  useGetCurrentUserQuery,
} from '../../store/api';

export const DoctorView = () => {
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();
  const { data: currentUser } = useGetCurrentUserQuery();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteDoctor, { isLoading: isDeleting }] = useDeleteDoctorMutation();

  const {
    data: doctor,
    isLoading,
    error,
  } = useGetDoctorByIdQuery(doctorId || '', {
    skip: !doctorId,
  });

  const {
    data: scheduleData,
    isLoading: isLoadingSchedule,
  } = useGetDoctorScheduleQuery(doctorId || '', {
    skip: !doctorId,
  });

  const formatExperience = (years: number) => {
    if (years === 0) return 'New practitioner';
    if (years === 1) return '1 year of experience';
    return `${years} years of experience`;
  };

  const formatTimeSlot = (start: string, end: string) => {
    return `${start} - ${end}`;
  };

  const handleDelete = async () => {
    if (!doctorId) return;

    try {
      await deleteDoctor(doctorId).unwrap();
      navigate('/doctors');
    } catch (error) {
      console.error('Failed to delete doctor:', error);
      // Handle error (could add toast notification)
    }
  };

  // Check permissions
  const canEdit = currentUser?.role === 'admin' || 
    (currentUser?.role === 'doctor' && doctor?.user_id === currentUser?.id);
  const canDelete = currentUser?.role === 'admin';

  if (!doctorId) {
    return (
      <Alert severity="error">
        Doctor ID is required to view doctor details.
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/doctors')}
          sx={{ mb: 2 }}
        >
          Back to Doctors
        </Button>
        <Alert severity="error">
          Failed to load doctor details. Please try again.
        </Alert>
      </Box>
    );
  }

  if (!doctor) {
    return (
      <Box>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/doctors')}
          sx={{ mb: 2 }}
        >
          Back to Doctors
        </Button>
        <Alert severity="warning">
          Doctor not found.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header with Navigation and Actions */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/doctors')}
        >
          Back to Doctors
        </Button>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {canEdit && (
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/doctors/${doctorId}/edit`)}
            >
              Edit Profile
            </Button>
          )}
          {canDelete && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setDeleteDialogOpen(true)}
            >
              Delete
            </Button>
          )}
        </Box>
      </Box>

      {/* Doctor Profile Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 32,
            }}
          >
            <DoctorIcon fontSize="inherit" />
          </Box>
          
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              {doctor.full_name || `Dr. ${doctor.first_name} ${doctor.last_name}`}
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              {doctor.specialization && (
                <Chip
                  label={doctor.specialization}
                  color="primary"
                  variant="outlined"
                />
              )}
              <Chip
                label={doctor.is_active ? 'Active' : 'Inactive'}
                color={doctor.is_active ? 'success' : 'default'}
                size="small"
              />
            </Box>

            {doctor.qualification && (
              <Typography variant="body1" color="text.secondary" gutterBottom>
                {doctor.qualification}
              </Typography>
            )}

            <Typography variant="body2" color="text.secondary">
              Medical License: {doctor.license_number}
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Professional Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <PersonIcon sx={{ mr: 1 }} />
                Professional Information
              </Typography>
              
              <List disablePadding>
                <ListItem disablePadding sx={{ py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <ExperienceIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Experience"
                    secondary={doctor.experience_years !== undefined 
                      ? formatExperience(doctor.experience_years)
                      : 'Not specified'}
                  />
                </ListItem>

                {doctor.phone && (
                  <ListItem disablePadding sx={{ py: 1 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <PhoneIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Phone"
                      secondary={doctor.phone}
                    />
                  </ListItem>
                )}

                {doctor.user_email && (
                  <ListItem disablePadding sx={{ py: 1 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <EmailIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Email"
                      secondary={doctor.user_email}
                    />
                  </ListItem>
                )}

                {doctor.clinic_address && (
                  <ListItem disablePadding sx={{ py: 1 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <LocationIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Clinic Address"
                      secondary={doctor.clinic_address}
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Consultation Details */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <FeeIcon sx={{ mr: 1 }} />
                Consultation Details
              </Typography>
              
              <List disablePadding>
                <ListItem disablePadding sx={{ py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <FeeIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Consultation Fee"
                    secondary={doctor.consultation_fee ? `₹${doctor.consultation_fee}` : 'Not set'}
                  />
                </ListItem>

                <ListItem disablePadding sx={{ py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <DurationIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Consultation Duration"
                    secondary={`${doctor.consultation_duration || 30} minutes`}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Availability Schedule */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <ScheduleIcon sx={{ mr: 1 }} />
                Weekly Schedule
              </Typography>

              {isLoadingSchedule ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : scheduleData?.availability_schedule ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Day</TableCell>
                        <TableCell>Availability</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(scheduleData.availability_schedule).map(([day, slots]) => (
                        <TableRow key={day}>
                          <TableCell sx={{ textTransform: 'capitalize', fontWeight: 'medium' }}>
                            {day}
                          </TableCell>
                          <TableCell>
                            {slots && slots.length > 0 ? (
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {slots.map((slot, index) => (
                                  <Chip
                                    key={index}
                                    label={formatTimeSlot(slot.start_time, slot.end_time)}
                                    size="small"
                                    variant="outlined"
                                    icon={<TimeIcon />}
                                  />
                                ))}
                              </Box>
                            ) : (
                              <Typography color="text.secondary" fontStyle="italic">
                                Not available
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary" fontStyle="italic">
                  No schedule information available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Additional Information */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Account Information
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>User Role:</strong> {doctor.user_role || 'Doctor'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Profile Created:</strong> {new Date(doctor.created_at).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Last Updated:</strong> {new Date(doctor.updated_at).toLocaleDateString()}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete Dr. {doctor.full_name || `${doctor.first_name} ${doctor.last_name}`}?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This action cannot be undone. The doctor profile will be permanently removed from the system.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};