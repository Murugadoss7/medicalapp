import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Stack,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  Divider,
} from '@mui/material';
import {
  Business,
  Person,
  LocalHospital,
  ArrowBack,
  ArrowForward,
  Check,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useRegisterClinicMutation, ClinicRegistrationRequest } from '../../store/api';
import { useAppDispatch } from '../../hooks';
import { setCredentials } from '../../store/slices/authSlice';

interface ClinicFormData extends ClinicRegistrationRequest {}

const schema = yup.object({
  // Clinic Information
  clinic_name: yup.string().required('Clinic name is required').min(3, 'Clinic name must be at least 3 characters'),
  clinic_phone: yup.string().required('Clinic phone is required').matches(/^[6-9]\d{9}$/, 'Invalid phone number'),
  clinic_address: yup.string().required('Clinic address is required'),

  // Owner Information
  owner_first_name: yup.string().required('First name is required'),
  owner_last_name: yup.string().required('Last name is required'),
  owner_email: yup.string().required('Email is required').email('Invalid email'),
  owner_phone: yup.string().required('Phone is required').matches(/^[6-9]\d{9}$/, 'Invalid phone number'),
  password: yup.string().required('Password is required').min(8, 'Password must be at least 8 characters'),

  // Role
  role: yup.string().required('Please select a role').oneOf(['admin', 'admin_doctor']),

  // Doctor fields (conditional)
  license_number: yup.string().when('role', {
    is: 'admin_doctor',
    then: (schema) => schema.required('License number is required for doctors'),
    otherwise: (schema) => schema.notRequired(),
  }),
  specialization: yup.string().when('role', {
    is: 'admin_doctor',
    then: (schema) => schema.required('Specialization is required for doctors'),
    otherwise: (schema) => schema.notRequired(),
  }),
  qualification: yup.string(),
  experience_years: yup.number().min(0).max(70),
});

export const ClinicRegistrationPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [registerClinic, { isLoading }] = useRegisterClinicMutation();
  const [errorMessage, setErrorMessage] = useState('');
  const [activeStep, setActiveStep] = useState(0);

  const steps = ['Clinic Details', 'Your Information', 'Role Selection'];

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
    trigger,
  } = useForm<ClinicFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      clinic_name: '',
      clinic_phone: '',
      clinic_address: '',
      owner_first_name: '',
      owner_last_name: '',
      owner_email: '',
      owner_phone: '',
      password: '',
      role: 'admin_doctor',
      license_number: '',
      specialization: '',
      qualification: '',
      experience_years: undefined,
    },
    mode: 'onChange',
  });

  const selectedRole = watch('role');

  const handleNext = async () => {
    const fieldsToValidate = getFieldsForStep(activeStep);
    const isValid = await trigger(fieldsToValidate as any);

    if (isValid) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const getFieldsForStep = (step: number): string[] => {
    switch (step) {
      case 0:
        return ['clinic_name', 'clinic_phone', 'clinic_address'];
      case 1:
        return ['owner_first_name', 'owner_last_name', 'owner_email', 'owner_phone', 'password'];
      case 2:
        return ['role', 'license_number', 'specialization', 'qualification', 'experience_years'];
      default:
        return [];
    }
  };

  const onSubmit = async (data: ClinicFormData) => {
    try {
      setErrorMessage('');
      console.log('Submitting clinic registration:', data);
      const result = await registerClinic(data).unwrap();
      console.log('Registration successful:', result);

      // Store credentials
      dispatch(
        setCredentials({
          user: result.user,
          token: result.access_token,
        })
      );

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Registration error:', error);
      setErrorMessage(error?.data?.detail || 'Registration failed. Please try again.');
    }
  };

  return (
    <Box sx={{ width: '100%', maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', pr: 1 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Register Your Clinic
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Start your 30-day free trial • No credit card required
        </Typography>
      </Box>

      {/* Stepper */}
      <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Error Alert */}
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorMessage('')}>
          {errorMessage}
        </Alert>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step 1: Clinic Details */}
        {activeStep === 0 && (
          <Stack spacing={2.5}>
            <Typography variant="subtitle1" fontWeight={600}>
              <Business sx={{ verticalAlign: 'middle', mr: 1, fontSize: 20 }} />
              Clinic Information
            </Typography>

            <Controller
              name="clinic_name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Clinic Name"
                  fullWidth
                  size="small"
                  error={!!errors.clinic_name}
                  helperText={errors.clinic_name?.message}
                  placeholder="e.g., Dr. Smith Dental Clinic"
                />
              )}
            />

            <Controller
              name="clinic_phone"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Clinic Phone"
                  fullWidth
                  size="small"
                  error={!!errors.clinic_phone}
                  helperText={errors.clinic_phone?.message}
                  placeholder="10-digit mobile number"
                />
              )}
            />

            <Controller
              name="clinic_address"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Clinic Address"
                  fullWidth
                  size="small"
                  multiline
                  rows={2}
                  error={!!errors.clinic_address}
                  helperText={errors.clinic_address?.message}
                  placeholder="Full clinic address"
                />
              )}
            />
          </Stack>
        )}

        {/* Step 2: Owner Information */}
        {activeStep === 1 && (
          <Stack spacing={2.5}>
            <Typography variant="subtitle1" fontWeight={600}>
              <Person sx={{ verticalAlign: 'middle', mr: 1, fontSize: 20 }} />
              Your Information
            </Typography>

            <Stack direction="row" spacing={2}>
              <Controller
                name="owner_first_name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="First Name"
                    fullWidth
                    size="small"
                    error={!!errors.owner_first_name}
                    helperText={errors.owner_first_name?.message}
                  />
                )}
              />

              <Controller
                name="owner_last_name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Last Name"
                    fullWidth
                    size="small"
                    error={!!errors.owner_last_name}
                    helperText={errors.owner_last_name?.message}
                  />
                )}
              />
            </Stack>

            <Controller
              name="owner_email"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Email"
                  type="email"
                  fullWidth
                  size="small"
                  error={!!errors.owner_email}
                  helperText={errors.owner_email?.message}
                  placeholder="your@email.com"
                />
              )}
            />

            <Controller
              name="owner_phone"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Your Phone"
                  fullWidth
                  size="small"
                  error={!!errors.owner_phone}
                  helperText={errors.owner_phone?.message}
                  placeholder="10-digit mobile number"
                />
              )}
            />

            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Password"
                  type="password"
                  fullWidth
                  size="small"
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  placeholder="Minimum 8 characters"
                />
              )}
            />
          </Stack>
        )}

        {/* Step 3: Role Selection */}
        {activeStep === 2 && (
          <Stack spacing={2.5}>
            <Typography variant="subtitle1" fontWeight={600}>
              <LocalHospital sx={{ verticalAlign: 'middle', mr: 1, fontSize: 20 }} />
              Your Role
            </Typography>

            <FormControl component="fieldset">
              <FormLabel component="legend" sx={{ fontSize: '0.875rem' }}>Select your role</FormLabel>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <RadioGroup {...field}>
                    <FormControlLabel
                      value="admin"
                      control={<Radio size="small" />}
                      label={
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            Admin Only
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            I manage the clinic but don't practice medicine
                          </Typography>
                        </Box>
                      }
                    />
                    <FormControlLabel
                      value="admin_doctor"
                      control={<Radio size="small" />}
                      label={
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            Admin + Doctor
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            I manage the clinic and also practice medicine
                          </Typography>
                        </Box>
                      }
                    />
                  </RadioGroup>
                )}
              />
            </FormControl>

            {selectedRole === 'admin_doctor' && (
              <>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body2" fontWeight={600}>
                  Medical Information
                </Typography>

                <Controller
                  name="license_number"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Medical License Number"
                      fullWidth
                      size="small"
                      error={!!errors.license_number}
                      helperText={errors.license_number?.message}
                      placeholder="e.g., MED123456"
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
                      size="small"
                      error={!!errors.specialization}
                      helperText={errors.specialization?.message}
                      placeholder="e.g., Dentistry, General Medicine"
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
                        label="Qualification (optional)"
                        fullWidth
                        size="small"
                        placeholder="e.g., MBBS, BDS"
                      />
                    )}
                  />

                  <Controller
                    name="experience_years"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Experience (years)"
                        type="number"
                        fullWidth
                        size="small"
                        placeholder="0"
                      />
                    )}
                  />
                </Stack>
              </>
            )}

            <Alert severity="info" sx={{ fontSize: '0.75rem' }}>
              <Typography variant="caption" fontWeight={500} display="block">
                What you get with the free trial:
              </Typography>
              <Typography variant="caption" component="div" sx={{ mt: 0.5 }}>
                • 30 days free access
                <br />• Up to 5 doctors
                <br />• Up to 1,000 patients
                <br />• All features included
              </Typography>
            </Alert>
          </Stack>
        )}

        {/* Navigation Buttons */}
        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
          {activeStep > 0 && (
            <Button
              startIcon={<ArrowBack />}
              onClick={handleBack}
              disabled={isLoading}
              size="small"
            >
              Back
            </Button>
          )}
          <Box sx={{ flex: 1 }} />
          {activeStep < steps.length - 1 ? (
            <Button
              variant="contained"
              endIcon={<ArrowForward />}
              onClick={handleNext}
              size="small"
            >
              Next
            </Button>
          ) : (
            <Button
              type="submit"
              variant="contained"
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={16} /> : <Check />}
              size="small"
            >
              {isLoading ? 'Creating Account...' : 'Complete Registration'}
            </Button>
          )}
        </Stack>
      </form>

      {/* Footer */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Already have an account?{' '}
          <Link component={RouterLink} to="/auth/login" underline="hover">
            Sign in here
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};
