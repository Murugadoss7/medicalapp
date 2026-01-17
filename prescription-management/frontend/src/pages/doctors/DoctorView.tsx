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
  Fade,
  Avatar,
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
import theme from '../../theme/medicalFuturismTheme';

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

  // Check permissions - use permissions array instead of role check
  const hasWritePermission = currentUser?.permissions?.includes('write:doctors');
  const isOwnProfile = currentUser?.doctor_id === doctor?.id;
  const canEdit = hasWritePermission || isOwnProfile;
  const canDelete = currentUser?.permissions?.includes('admin:system');

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
    <Box
      sx={{
        ...theme.layouts.pageContainer,
      }}
    >
      {/* Floating Gradient Orb */}
      <Box sx={theme.layouts.floatingOrb} />

      {/* Content Container */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          px: { xs: 1.5, sm: 2 },
          flex: { xs: 'none', md: 1 },
          overflowY: { xs: 'visible', md: 'auto' },
          overflowX: 'hidden',
          ...theme.components.scrollbar,
          minHeight: { xs: 'auto', md: 0 },
        }}
      >
        {/* Compact Header */}
        <Fade in timeout={600}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Button
                startIcon={<BackIcon />}
                onClick={() => navigate('/doctors')}
                sx={{
                  ...theme.components.outlinedButton,
                  minHeight: 40,
                  px: 2,
                }}
              >
                Back
              </Button>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: theme.colors.primary.gradient,
                    color: 'white',
                    mr: 1.5,
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                  }}
                >
                  <DoctorIcon sx={{ fontSize: 22 }} />
                </Box>
                <Typography sx={{ ...theme.typography.pageTitle }}>
                  Doctor Details
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              {canEdit && (
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => navigate(`/doctors/${doctorId}/edit`)}
                  sx={{
                    ...theme.components.outlinedButton,
                    minHeight: 40,
                  }}
                >
                  Edit Profile
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="outlined"
                  startIcon={<DeleteIcon />}
                  onClick={() => setDeleteDialogOpen(true)}
                  sx={{
                    minHeight: 40,
                    px: 2,
                    borderColor: '#ef4444',
                    color: '#ef4444',
                    fontWeight: 600,
                    borderRadius: 2,
                    '&:hover': {
                      borderColor: '#dc2626',
                      background: 'rgba(239, 68, 68, 0.05)',
                    },
                  }}
                >
                  Delete
                </Button>
              )}
            </Box>
          </Box>
        </Fade>

        {/* Doctor Profile Card */}
        <Fade in timeout={800}>
          <Paper
            elevation={0}
            sx={{
              ...theme.components.glassPaper,
              p: { xs: 2, sm: 3 },
              mb: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Avatar
                sx={{
                  ...theme.components.avatar,
                  width: { xs: 64, sm: 80 },
                  height: { xs: 64, sm: 80 },
                  fontSize: 32,
                }}
              >
                {doctor.full_name
                  ? doctor.full_name.charAt(0)
                  : doctor.first_name.charAt(0)}
              </Avatar>

              <Box sx={{ flexGrow: 1 }}>
                <Typography sx={{ ...theme.typography.pageTitle, mb: 1 }}>
                  {doctor.full_name || `Dr. ${doctor.first_name} ${doctor.last_name}`}
                </Typography>

                <Box sx={{ display: 'flex', gap: 0.5, mb: 1.5, flexWrap: 'wrap' }}>
                  {doctor.specialization && (
                    <Chip
                      label={doctor.specialization}
                      sx={{
                        ...theme.components.chip,
                        height: 24,
                      }}
                    />
                  )}
                  <Chip
                    label={doctor.is_active ? 'Active' : 'Inactive'}
                    sx={{
                      height: 24,
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      background: doctor.is_active
                        ? theme.colors.status.success
                        : 'rgba(128, 128, 128, 0.2)',
                      color: 'white',
                    }}
                  />
                </Box>

                {doctor.qualification && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    {doctor.qualification}
                  </Typography>
                )}

                <Typography variant="caption" color="text.secondary">
                  Medical License: {doctor.license_number}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Fade>

        {/* Professional & Contact Information - Compact Horizontal Cards */}
        <Fade in timeout={1000}>
          <Grid container spacing={1.5}>
            {/* Contact Information Row */}
            <Grid item xs={12}>
              <Paper
                elevation={0}
                sx={{
                  ...theme.components.glassPaper,
                  p: { xs: 1.5, sm: 2 },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: theme.colors.primary.gradient,
                      color: 'white',
                      mr: 1,
                    }}
                  >
                    <PersonIcon sx={{ fontSize: 16 }} />
                  </Box>
                  <Typography sx={{ ...theme.typography.sectionTitle }}>
                    Contact & Professional Details
                  </Typography>
                </Box>

                <Grid container spacing={1.5}>
                  {/* Experience */}
                  <Grid item xs={12} sm={6} md={3}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        background: theme.colors.primary.light,
                        border: `1px solid ${theme.colors.primary.border}`,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <ExperienceIcon sx={{ fontSize: 16, color: theme.colors.primary.main, mr: 0.5 }} />
                        <Typography variant="caption" sx={{ fontWeight: 700, color: theme.colors.primary.main }}>
                          Experience
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {doctor.experience_years !== undefined
                          ? formatExperience(doctor.experience_years)
                          : 'Not specified'}
                      </Typography>
                    </Box>
                  </Grid>

                  {/* Phone */}
                  {doctor.phone && (
                    <Grid item xs={12} sm={6} md={3}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          background: theme.colors.primary.light,
                          border: `1px solid ${theme.colors.primary.border}`,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <PhoneIcon sx={{ fontSize: 16, color: theme.colors.primary.main, mr: 0.5 }} />
                          <Typography variant="caption" sx={{ fontWeight: 700, color: theme.colors.primary.main }}>
                            Phone
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {doctor.phone}
                        </Typography>
                      </Box>
                    </Grid>
                  )}

                  {/* Email */}
                  {doctor.user_email && (
                    <Grid item xs={12} sm={6} md={3}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          background: theme.colors.primary.light,
                          border: `1px solid ${theme.colors.primary.border}`,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <EmailIcon sx={{ fontSize: 16, color: theme.colors.primary.main, mr: 0.5 }} />
                          <Typography variant="caption" sx={{ fontWeight: 700, color: theme.colors.primary.main }}>
                            Email
                          </Typography>
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {doctor.user_email}
                        </Typography>
                      </Box>
                    </Grid>
                  )}

                  {/* Consultation Fee */}
                  <Grid item xs={12} sm={6} md={3}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        background: theme.colors.primary.light,
                        border: `1px solid ${theme.colors.primary.border}`,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <FeeIcon sx={{ fontSize: 16, color: theme.colors.primary.main, mr: 0.5 }} />
                        <Typography variant="caption" sx={{ fontWeight: 700, color: theme.colors.primary.main }}>
                          Consultation Fee
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {doctor.consultation_fee ? `₹${doctor.consultation_fee}` : 'Not set'}
                      </Typography>
                    </Box>
                  </Grid>

                  {/* Duration */}
                  <Grid item xs={12} sm={6} md={3}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        background: theme.colors.primary.light,
                        border: `1px solid ${theme.colors.primary.border}`,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <DurationIcon sx={{ fontSize: 16, color: theme.colors.primary.main, mr: 0.5 }} />
                        <Typography variant="caption" sx={{ fontWeight: 700, color: theme.colors.primary.main }}>
                          Duration
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {doctor.consultation_duration || 30} minutes
                      </Typography>
                    </Box>
                  </Grid>

                  {/* Clinic Address - Full Width */}
                  {doctor.clinic_address && (
                    <Grid item xs={12}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          background: theme.colors.primary.light,
                          border: `1px solid ${theme.colors.primary.border}`,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <LocationIcon sx={{ fontSize: 16, color: theme.colors.primary.main, mr: 0.5 }} />
                          <Typography variant="caption" sx={{ fontWeight: 700, color: theme.colors.primary.main }}>
                            Clinic Address
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {doctor.clinic_address}
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </Fade>

        {/* Availability Schedule - Compact Horizontal Layout */}
        <Fade in timeout={1200}>
          <Paper
            elevation={0}
            sx={{
              ...theme.components.glassPaper,
              p: { xs: 1.5, sm: 2 },
              mt: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: theme.colors.primary.gradient,
                  color: 'white',
                  mr: 1,
                }}
              >
                <ScheduleIcon sx={{ fontSize: 16 }} />
              </Box>
              <Typography sx={{ ...theme.typography.sectionTitle }}>Weekly Schedule</Typography>
            </Box>

            {isLoadingSchedule ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={24} sx={{ color: theme.colors.primary.main }} />
              </Box>
            ) : scheduleData?.availability_schedule ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {Object.entries(scheduleData.availability_schedule).map(([day, slots]) => (
                  <Box
                    key={day}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1.5,
                      borderRadius: 2,
                      background: theme.colors.primary.light,
                      border: `1px solid ${theme.colors.primary.border}`,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        textTransform: 'capitalize',
                        minWidth: 80,
                        color: theme.colors.primary.main,
                      }}
                    >
                      {day}
                    </Typography>
                    {slots && slots.length > 0 ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, flex: 1 }}>
                        {slots.map((slot, index) => (
                          <Chip
                            key={index}
                            label={formatTimeSlot(slot.start_time, slot.end_time)}
                            size="small"
                            icon={<TimeIcon sx={{ fontSize: 14 }} />}
                            sx={{
                              height: 24,
                              fontSize: '0.6875rem',
                              fontWeight: 600,
                              background: theme.colors.primary.gradient,
                              color: 'white',
                              '& .MuiChip-icon': {
                                color: 'white',
                              },
                            }}
                          />
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="caption" color="text.secondary" fontStyle="italic">
                        Not available
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="caption" color="text.secondary" fontStyle="italic">
                No schedule information available
              </Typography>
            )}
          </Paper>
        </Fade>

        {/* Account Information - Compact Inline */}
        <Fade in timeout={1400}>
          <Paper
            elevation={0}
            sx={{
              ...theme.components.glassPaper,
              p: { xs: 1.5, sm: 2 },
              mt: 2,
            }}
          >
            <Typography sx={{ ...theme.typography.sectionTitle, mb: 1.5 }}>Account Information</Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box
                sx={{
                  flex: '1 1 auto',
                  minWidth: 150,
                  p: 1.5,
                  borderRadius: 2,
                  background: theme.colors.primary.light,
                  border: `1px solid ${theme.colors.primary.border}`,
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 700, color: theme.colors.primary.main }}>
                  User Role
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {doctor.user_role || 'Doctor'}
                </Typography>
              </Box>

              <Box
                sx={{
                  flex: '1 1 auto',
                  minWidth: 150,
                  p: 1.5,
                  borderRadius: 2,
                  background: theme.colors.primary.light,
                  border: `1px solid ${theme.colors.primary.border}`,
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 700, color: theme.colors.primary.main }}>
                  Profile Created
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {new Date(doctor.created_at).toLocaleDateString()}
                </Typography>
              </Box>

              <Box
                sx={{
                  flex: '1 1 auto',
                  minWidth: 150,
                  p: 1.5,
                  borderRadius: 2,
                  background: theme.colors.primary.light,
                  border: `1px solid ${theme.colors.primary.border}`,
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 700, color: theme.colors.primary.main }}>
                  Last Updated
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {new Date(doctor.updated_at).toLocaleDateString()}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Fade>

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
    </Box>
  );
};