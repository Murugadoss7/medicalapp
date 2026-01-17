import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  Stack,
  Divider,
  IconButton,
  Card,
  CardContent,
} from '@mui/material';
import {
  PersonAdd,
  ContentCopy,
  Check,
  ArrowBack,
  Warning,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  useAdminCreateDoctorMutation,
  useGetTenantLimitsQuery,
  AdminCreateDoctorRequest,
  User,
} from '../../store/api';

interface DoctorFormData extends AdminCreateDoctorRequest {}

const schema = yup.object({
  first_name: yup.string().required('First name is required').min(2, 'Minimum 2 characters'),
  last_name: yup.string().required('Last name is required').min(2, 'Minimum 2 characters'),
  email: yup.string().required('Email is required').email('Invalid email address'),
  phone: yup.string().required('Phone is required').matches(/^[6-9]\d{9}$/, 'Invalid phone number'),
  license_number: yup.string().required('License number is required'),
  specialization: yup.string().required('Specialization is required'),
  qualification: yup.string(),
  experience_years: yup.number().min(0, 'Cannot be negative').max(70, 'Maximum 70 years'),
});

export const AddDoctorPage = () => {
  const navigate = useNavigate();
  const [createDoctor, { isLoading }] = useAdminCreateDoctorMutation();
  const { data: tenantLimits, isLoading: limitsLoading } = useGetTenantLimitsQuery();
  const [errorMessage, setErrorMessage] = useState('');
  const [createdDoctor, setCreatedDoctor] = useState<User | null>(null);
  const [passwordCopied, setPasswordCopied] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<DoctorFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      license_number: '',
      specialization: '',
      qualification: '',
      experience_years: undefined,
    },
    mode: 'onChange',
  });

  const onSubmit = async (data: DoctorFormData) => {
    try {
      setErrorMessage('');
      const result = await createDoctor(data).unwrap();
      setCreatedDoctor(result);
      reset();
    } catch (error: any) {
      setErrorMessage(error?.data?.detail || 'Failed to create doctor. Please try again.');
    }
  };

  const handleCopyPassword = () => {
    if (createdDoctor?.temporary_password) {
      navigator.clipboard.writeText(createdDoctor.temporary_password);
      setPasswordCopied(true);
      setTimeout(() => setPasswordCopied(false), 2000);
    }
  };

  const handleAddAnother = () => {
    setCreatedDoctor(null);
    setPasswordCopied(false);
  };

  // Check if doctor limit reached
  const canAddDoctor = tenantLimits?.doctors?.can_add ?? true;
  const doctorLimitReached = !canAddDoctor;

  if (limitsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Show success screen with temporary password
  if (createdDoctor) {
    return (
      <Box sx={{ maxWidth: 700, mx: 'auto' }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/admin/dashboard')}
          sx={{ mb: 3 }}
        >
          Back to Dashboard
        </Button>

        <Paper elevation={2} sx={{ p: 4 }}>
          <Stack spacing={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  bgcolor: 'success.main',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <Check sx={{ fontSize: 40 }} />
              </Box>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Doctor Account Created Successfully!
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Dr. {createdDoctor.first_name} {createdDoctor.last_name} has been added to your clinic
              </Typography>
            </Box>

            <Divider />

            <Card sx={{ bgcolor: 'warning.light', border: '2px solid', borderColor: 'warning.main' }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <Warning color="warning" />
                  <Typography variant="h6" fontWeight="bold">
                    Important: Share This Password
                  </Typography>
                </Stack>

                <Typography variant="body2" paragraph>
                  This is the temporary password for the new doctor account. Please share it securely.
                  The doctor should change this password after first login.
                </Typography>

                <Box
                  sx={{
                    bgcolor: 'white',
                    p: 2,
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography
                    variant="h6"
                    fontFamily="monospace"
                    sx={{ letterSpacing: 2 }}
                  >
                    {createdDoctor.temporary_password}
                  </Typography>
                  <IconButton
                    color="primary"
                    onClick={handleCopyPassword}
                    sx={{ ml: 2 }}
                  >
                    {passwordCopied ? <Check color="success" /> : <ContentCopy />}
                  </IconButton>
                </Box>

                {passwordCopied && (
                  <Typography variant="caption" color="success.main" sx={{ mt: 1, display: 'block' }}>
                    Password copied to clipboard!
                  </Typography>
                )}
              </CardContent>
            </Card>

            <Box>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Account Details:
              </Typography>
              <Stack spacing={1}>
                <Typography variant="body2">
                  <strong>Email:</strong> {createdDoctor.email}
                </Typography>
                <Typography variant="body2">
                  <strong>Phone:</strong> {createdDoctor.phone}
                </Typography>
                <Typography variant="body2">
                  <strong>License:</strong> {createdDoctor.license_number}
                </Typography>
                <Typography variant="body2">
                  <strong>Specialization:</strong> {createdDoctor.specialization}
                </Typography>
              </Stack>
            </Box>

            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                onClick={handleAddAnother}
                disabled={doctorLimitReached}
                fullWidth
              >
                Add Another Doctor
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/admin/dashboard')}
                fullWidth
              >
                Back to Dashboard
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Box>
    );
  }

  // Show form
  return (
    <Box sx={{ maxWidth: 700, mx: 'auto' }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/admin/dashboard')}
        sx={{ mb: 3 }}
      >
        Back to Dashboard
      </Button>

      <Paper elevation={2} sx={{ p: 4 }}>
        <Stack spacing={3}>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <PersonAdd color="primary" sx={{ fontSize: 32 }} />
              <Typography variant="h5" fontWeight="bold">
                Add New Doctor
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Create a new doctor account for your clinic
            </Typography>
          </Box>

          {/* Tenant Limits Info */}
          {tenantLimits && (
            <Alert
              severity={doctorLimitReached ? 'error' : 'info'}
              icon={doctorLimitReached ? <Warning /> : undefined}
            >
              <Typography variant="body2" fontWeight="medium">
                Doctor Limit: {tenantLimits.doctors.current} / {tenantLimits.doctors.max}
              </Typography>
              {doctorLimitReached && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  You have reached your doctor limit. Please upgrade your plan to add more doctors.
                </Typography>
              )}
            </Alert>
          )}

          {errorMessage && (
            <Alert severity="error" onClose={() => setErrorMessage('')}>
              {errorMessage}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={3}>
              <Divider textAlign="left">
                <Typography variant="subtitle2" color="text.secondary">
                  Personal Information
                </Typography>
              </Divider>

              <Stack direction="row" spacing={2}>
                <Controller
                  name="first_name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="First Name"
                      fullWidth
                      error={!!errors.first_name}
                      helperText={errors.first_name?.message}
                      disabled={isLoading || doctorLimitReached}
                    />
                  )}
                />

                <Controller
                  name="last_name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Last Name"
                      fullWidth
                      error={!!errors.last_name}
                      helperText={errors.last_name?.message}
                      disabled={isLoading || doctorLimitReached}
                    />
                  )}
                />
              </Stack>

              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Email Address"
                    type="email"
                    fullWidth
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    placeholder="doctor@example.com"
                    disabled={isLoading || doctorLimitReached}
                  />
                )}
              />

              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Phone Number"
                    fullWidth
                    error={!!errors.phone}
                    helperText={errors.phone?.message}
                    placeholder="10-digit mobile number"
                    disabled={isLoading || doctorLimitReached}
                  />
                )}
              />

              <Divider textAlign="left">
                <Typography variant="subtitle2" color="text.secondary">
                  Professional Details
                </Typography>
              </Divider>

              <Controller
                name="license_number"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Medical License Number"
                    fullWidth
                    error={!!errors.license_number}
                    helperText={errors.license_number?.message}
                    placeholder="e.g., MED123456"
                    disabled={isLoading || doctorLimitReached}
                  />
                )}
              />

              <Controller
                name="specialization"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Specialization"
                    fullWidth
                    error={!!errors.specialization}
                    helperText={errors.specialization?.message}
                    placeholder="e.g., Dentistry, Cardiology"
                    disabled={isLoading || doctorLimitReached}
                  />
                )}
              />

              <Stack direction="row" spacing={2}>
                <Controller
                  name="qualification"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Qualification (Optional)"
                      fullWidth
                      error={!!errors.qualification}
                      helperText={errors.qualification?.message}
                      placeholder="e.g., MBBS, MD"
                      disabled={isLoading || doctorLimitReached}
                    />
                  )}
                />

                <Controller
                  name="experience_years"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Experience (Years)"
                      type="number"
                      fullWidth
                      error={!!errors.experience_years}
                      helperText={errors.experience_years?.message}
                      placeholder="0"
                      disabled={isLoading || doctorLimitReached}
                    />
                  )}
                />
              </Stack>

              <Alert severity="info">
                <Typography variant="body2" fontWeight="medium" gutterBottom>
                  Note:
                </Typography>
                <Typography variant="body2">
                  A temporary password will be generated automatically. You'll need to share it with
                  the doctor after account creation. The doctor can change it after first login.
                </Typography>
              </Alert>

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={isLoading || doctorLimitReached}
                startIcon={isLoading ? <CircularProgress size={20} /> : <PersonAdd />}
              >
                {isLoading ? 'Creating Account...' : 'Create Doctor Account'}
              </Button>
            </Stack>
          </form>
        </Stack>
      </Paper>
    </Box>
  );
};
