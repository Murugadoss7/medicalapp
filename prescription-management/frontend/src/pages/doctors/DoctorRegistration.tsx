import { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  Alert,
  CircularProgress,
  Paper,
  Step,
  Stepper,
  StepLabel,
  Card,
  CardContent,
  Container,
  IconButton,
  Checkbox,
  FormControlLabel,
  Chip,
  Fade,
} from '@mui/material';
import {
  LocalHospital as DoctorIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  LocationOn as LocationIcon,
  ContentCopy,
  Check,
  Warning,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import theme from '../../theme/medicalFuturismTheme';
import { useAppSelector } from '../../hooks';

// Simple UUID generator using crypto API
const generateUUID = (): string => {
  return crypto.randomUUID();
};
import {
  useRegisterMutation,
  useAdminCreateDoctorMutation,
  useGetTenantLimitsQuery,
  type RegisterRequest,
  type AdminCreateDoctorRequest,
} from '../../store/api';

interface UserAccountData {
  email: string;
  password: string;
  confirm_password: string;
  first_name: string;
  last_name: string;
  phone: string;
}

interface OfficeLocation {
  id: string;
  name: string;
  address: string;
  is_primary: boolean;
  is_tenant_default?: boolean;
}

interface DoctorFormData {
  user_id: string;
  license_number: string;
  specialization: string;
  qualification: string;
  experience_years: number;
  clinic_address: string;
  phone: string;
  consultation_fee: string;
  consultation_duration: number;
  availability_schedule: WeeklySchedule;
  offices: OfficeLocation[];
}

interface WeeklySchedule {
  monday: TimeSlot[];
  tuesday: TimeSlot[];
  wednesday: TimeSlot[];
  thursday: TimeSlot[];
  friday: TimeSlot[];
  saturday: TimeSlot[];
  sunday: TimeSlot[];
}

interface TimeSlot {
  start_time: string;  // HH:MM format
  end_time: string;    // HH:MM format
}

interface RegistrationState {
  currentStep: number;
  userAccountData: UserAccountData;
  doctorInfo: DoctorFormData;
  createdUserId: string | null;
}

// Steps for public registration (includes password)
const publicSteps = [
  'User Account',
  'Professional Credentials',
  'Clinic Details',
  'Availability Schedule',
  'Review & Submit'
];

// Steps for admin registration (no password needed)
const adminSteps = [
  'Doctor Details',
  'Professional Credentials',
  'Clinic Details',
  'Availability Schedule',
  'Review & Submit'
];

const defaultSchedule: WeeklySchedule = {
  monday: [{ start_time: '09:00', end_time: '17:00' }],
  tuesday: [{ start_time: '09:00', end_time: '17:00' }],
  wednesday: [{ start_time: '09:00', end_time: '17:00' }],
  thursday: [{ start_time: '09:00', end_time: '17:00' }],
  friday: [{ start_time: '09:00', end_time: '17:00' }],
  saturday: [{ start_time: '09:00', end_time: '13:00' }],
  sunday: [],
};

const specializations = [
  'General Practice',
  'Cardiology',
  'Dental',
  'Dental Surgery',
  'Endodontics',
  'Orthodontics',
  'Pediatric Dentistry',
  'Periodontics',
  'Prosthodontics',
  'Oral & Maxillofacial Surgery',
  'Dermatology',
  'Emergency Medicine',
  'Endocrinology',
  'Family Medicine',
  'Gastroenterology',
  'Internal Medicine',
  'Neurology',
  'Obstetrics & Gynecology',
  'Ophthalmology',
  'Orthopedics',
  'Pediatrics',
  'Psychiatry',
  'Radiology',
  'Surgery',
  'Urology',
  'Other'
];

const consultationDurations = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '60 minutes' },
];

export const DoctorRegistration = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAppSelector((state) => state.auth);

  // Determine if user is admin - admin uses different API endpoint
  const isAdmin = currentUser?.role === 'admin';
  const steps = isAdmin ? adminSteps : publicSteps;

  // Use different mutations based on user role
  const [registerUser, { isLoading: isRegistering }] = useRegisterMutation();
  const [adminCreateDoctor, { isLoading: isAdminCreating }] = useAdminCreateDoctorMutation();
  const { data: tenantLimits } = useGetTenantLimitsQuery(undefined, { skip: !isAdmin });

  // State for admin flow - stores created doctor with temp password
  const [createdDoctor, setCreatedDoctor] = useState<{ email: string; temporary_password?: string; first_name: string; last_name: string } | null>(null);
  const [passwordCopied, setPasswordCopied] = useState(false);

  const [registrationState, setRegistrationState] = useState<RegistrationState>({
    currentStep: 0,
    userAccountData: {
      email: '',
      password: '',
      confirm_password: '',
      first_name: '',
      last_name: '',
      phone: '',
    },
    doctorInfo: {
      user_id: '',
      license_number: '',
      specialization: '',
      qualification: '',
      experience_years: 0,
      clinic_address: '',
      phone: '',
      consultation_fee: '',
      consultation_duration: 30,
      availability_schedule: defaultSchedule,
      offices: [],
    },
    createdUserId: null,
  });

  const [error, setError] = useState<string>('');

  const handleUserAccountChange = (field: keyof UserAccountData, value: any) => {
    setRegistrationState(prev => ({
      ...prev,
      userAccountData: {
        ...prev.userAccountData,
        [field]: value,
      },
    }));
    setError('');
  };

  const handleDoctorInfoChange = (field: keyof DoctorFormData, value: any) => {
    setRegistrationState(prev => ({
      ...prev,
      doctorInfo: {
        ...prev.doctorInfo,
        [field]: value,
      },
    }));
    setError('');
  };

  const handleScheduleChange = (day: keyof WeeklySchedule, slots: TimeSlot[]) => {
    setRegistrationState(prev => ({
      ...prev,
      doctorInfo: {
        ...prev.doctorInfo,
        availability_schedule: {
          ...prev.doctorInfo.availability_schedule,
          [day]: slots,
        },
      },
    }));
  };

  const handleNext = () => {
    if (registrationState.currentStep < steps.length - 1) {
      setRegistrationState(prev => ({
        ...prev,
        currentStep: prev.currentStep + 1,
      }));
    }
  };

  const handleBack = () => {
    if (registrationState.currentStep > 0) {
      setRegistrationState(prev => ({
        ...prev,
        currentStep: prev.currentStep - 1,
      }));
    }
  };

  const validateCurrentStep = (): boolean => {
    const { currentStep, userAccountData, doctorInfo } = registrationState;

    switch (currentStep) {
      case 0: // User Account / Doctor Details
        if (isAdmin) {
          // Admin flow: No password required
          return !!(
            userAccountData.email &&
            userAccountData.first_name &&
            userAccountData.last_name
          );
        }
        // Public flow: Password required
        return !!(
          userAccountData.email &&
          userAccountData.password &&
          userAccountData.confirm_password &&
          userAccountData.first_name &&
          userAccountData.last_name &&
          userAccountData.password === userAccountData.confirm_password &&
          userAccountData.password.length >= 8
        );
      case 1: // Professional Credentials
        return !!(
          doctorInfo.license_number &&
          doctorInfo.specialization &&
          doctorInfo.qualification
        );
      case 2: // Clinic Details
        return true; // All optional
      case 3: // Schedule
        return true; // Schedule is optional
      case 4: // Review
        return true;
      default:
        return false;
    }
  };

  const validateForSubmission = (): boolean => {
    return validateCurrentStep() && registrationState.currentStep === steps.length - 1;
  };

  const handleSubmit = async () => {
    try {
      setError('');

      if (isAdmin) {
        // Admin flow: Use admin create doctor endpoint (tenant_id from auth token)
        const adminData: AdminCreateDoctorRequest = {
          email: registrationState.userAccountData.email,
          first_name: registrationState.userAccountData.first_name,
          last_name: registrationState.userAccountData.last_name,
          phone: registrationState.userAccountData.phone || undefined,
          license_number: registrationState.doctorInfo.license_number,
          specialization: registrationState.doctorInfo.specialization,
          qualification: registrationState.doctorInfo.qualification || undefined,
          experience_years: registrationState.doctorInfo.experience_years || undefined,
          offices: registrationState.doctorInfo.offices.length > 0
            ? registrationState.doctorInfo.offices
            : undefined,
        };

        const result = await adminCreateDoctor(adminData).unwrap();

        // Store result to show temp password
        setCreatedDoctor({
          email: result.email,
          temporary_password: result.temporary_password,
          first_name: result.first_name || registrationState.userAccountData.first_name,
          last_name: result.last_name || registrationState.userAccountData.last_name,
        });
      } else {
        // Public flow: Use register endpoint (ONLY for non-multi-tenant setups)
        const registerData: RegisterRequest = {
          email: registrationState.userAccountData.email,
          password: registrationState.userAccountData.password,
          confirm_password: registrationState.userAccountData.confirm_password,
          first_name: registrationState.userAccountData.first_name,
          last_name: registrationState.userAccountData.last_name,
          phone: registrationState.userAccountData.phone || undefined,
          role: 'doctor',
          license_number: registrationState.doctorInfo.license_number,
          specialization: registrationState.doctorInfo.specialization,
          qualification: registrationState.doctorInfo.qualification || undefined,
          experience_years: registrationState.doctorInfo.experience_years || undefined,
          clinic_address: registrationState.doctorInfo.clinic_address || undefined,
          consultation_fee: registrationState.doctorInfo.consultation_fee || undefined,
          consultation_duration: registrationState.doctorInfo.consultation_duration || 30,
          availability_schedule: registrationState.doctorInfo.availability_schedule,
          offices: registrationState.doctorInfo.offices.length > 0
            ? registrationState.doctorInfo.offices
            : undefined,
        };

        await registerUser(registerData).unwrap();

        // Navigate to doctor search page with success message
        navigate('/doctors', {
          state: {
            message: `Doctor ${registrationState.userAccountData.first_name} ${registrationState.userAccountData.last_name} registered successfully!`
          }
        });
      }
    } catch (err: any) {
      console.error('Failed to register doctor:', err);

      let errorMessage = 'Failed to register doctor';

      if (err?.data?.detail) {
        if (typeof err.data.detail === 'string') {
          errorMessage = err.data.detail;
        } else if (Array.isArray(err.data.detail)) {
          const firstError = err.data.detail[0];
          if (firstError?.msg) {
            errorMessage = `${firstError.loc?.join(' → ') || 'Field'}: ${firstError.msg}`;
          } else {
            errorMessage = 'Validation error occurred';
          }
        }
      } else if (err?.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    }
  };

  // Handle copy password
  const handleCopyPassword = () => {
    if (createdDoctor?.temporary_password) {
      navigator.clipboard.writeText(createdDoctor.temporary_password);
      setPasswordCopied(true);
      setTimeout(() => setPasswordCopied(false), 2000);
    }
  };

  const renderStepContent = () => {
    switch (registrationState.currentStep) {
      case 0: // User Account / Doctor Details
        return (
          <UserAccountStep
            formData={registrationState.userAccountData}
            onChange={handleUserAccountChange}
            isAdmin={isAdmin}
          />
        );
      case 1: // Professional Credentials
        return (
          <ProfessionalCredentialsStep
            formData={registrationState.doctorInfo}
            onChange={handleDoctorInfoChange}
          />
        );
      case 2: // Clinic Details
        return (
          <ClinicDetailsStep
            formData={registrationState.doctorInfo}
            onChange={handleDoctorInfoChange}
          />
        );
      case 3: // Schedule
        return (
          <ScheduleStep
            schedule={registrationState.doctorInfo.availability_schedule}
            onChange={handleScheduleChange}
          />
        );
      case 4: // Review
        return (
          <ReviewStep
            userAccountData={registrationState.userAccountData}
            doctorInfo={registrationState.doctorInfo}
          />
        );
      default:
        return null;
    }
  };

  // Show success screen for admin flow with temp password
  if (createdDoctor) {
    return (
      <Box sx={{ ...theme.layouts.pageContainer, py: 2 }}>
        <Box sx={theme.layouts.floatingOrb} />
        <Container maxWidth="sm" disableGutters sx={{ position: 'relative', zIndex: 1, px: { xs: 1.5, sm: 2 } }}>
          <Paper
            elevation={0}
            sx={{
              ...theme.components.glassPaper,
              p: 4,
              textAlign: 'center',
            }}
          >
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
              Doctor Account Created!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Dr. {createdDoctor.first_name} {createdDoctor.last_name} has been added to your clinic.
            </Typography>

            <Card sx={{ bgcolor: 'warning.light', border: '2px solid', borderColor: 'warning.main', mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
                  <Warning color="warning" />
                  <Typography variant="h6" fontWeight="bold">
                    Share This Password
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  This is the temporary password for the new doctor. Share it securely.
                </Typography>
                <Box
                  sx={{
                    bgcolor: 'white',
                    p: 2,
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="h6" fontFamily="monospace" sx={{ letterSpacing: 2 }}>
                    {createdDoctor.temporary_password}
                  </Typography>
                  <IconButton color="primary" onClick={handleCopyPassword}>
                    {passwordCopied ? <Check color="success" /> : <ContentCopy />}
                  </IconButton>
                </Box>
                {passwordCopied && (
                  <Typography variant="caption" color="success.main" sx={{ mt: 1, display: 'block' }}>
                    Password copied!
                  </Typography>
                )}
              </CardContent>
            </Card>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={() => {
                  setCreatedDoctor(null);
                  setRegistrationState(prev => ({ ...prev, currentStep: 0 }));
                }}
                fullWidth
                disabled={tenantLimits && !tenantLimits.doctors.can_add}
              >
                Add Another Doctor
              </Button>
              <Button variant="outlined" onClick={() => navigate('/doctors')} fullWidth>
                Back to Doctors
              </Button>
            </Box>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        ...theme.layouts.pageContainer,
        py: 2,
      }}
    >
      {/* Floating Gradient Orb */}
      <Box sx={theme.layouts.floatingOrb} />

      {/* Content Container */}
      <Container maxWidth="md" disableGutters sx={{ position: 'relative', zIndex: 1, px: { xs: 1.5, sm: 2 } }}>
        {/* Header */}
        <Fade in timeout={600}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
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
              {isAdmin ? 'Register Doctor for Your Clinic' : 'Doctor Registration'}
            </Typography>
          </Box>
        </Fade>

        <Fade in timeout={800}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
            {isAdmin
              ? 'Add a new doctor to your clinic. Their account will be created under your tenant.'
              : 'Create a comprehensive doctor profile with professional credentials and availability schedule.'}
          </Typography>
        </Fade>

        {/* Stepper */}
        <Fade in timeout={1000}>
          <Paper
            elevation={0}
            sx={{
              ...theme.components.glassPaper,
              p: { xs: 1.5, sm: 2 },
              mb: 2,
            }}
          >
            <Stepper
              activeStep={registrationState.currentStep}
              alternativeLabel
              sx={{
                '& .MuiStepConnector-line': {
                  borderColor: theme.colors.primary.border,
                  borderTopWidth: 2,
                },
                '& .MuiStepConnector-root.Mui-active .MuiStepConnector-line': {
                  borderColor: theme.colors.primary.main,
                },
                '& .MuiStepConnector-root.Mui-completed .MuiStepConnector-line': {
                  borderColor: theme.colors.primary.main,
                },
                '& .MuiStepLabel-label': {
                  fontSize: '0.75rem',
                  fontWeight: 600,
                },
                '& .MuiStepLabel-label.Mui-active': {
                  color: theme.colors.primary.main,
                  fontWeight: 700,
                },
              }}
            >
              {steps.map((label, index) => {
                const isActive = index === registrationState.currentStep;
                const isCompleted = index < registrationState.currentStep;

                return (
                  <Step key={label}>
                    <StepLabel
                      StepIconProps={{
                        sx: {
                          color: isActive || isCompleted ? theme.colors.primary.main : theme.colors.primary.light,
                          '&.Mui-active': {
                            color: theme.colors.primary.main,
                          },
                          '&.Mui-completed': {
                            color: theme.colors.primary.main,
                          },
                        },
                      }}
                    >
                      {label}
                    </StepLabel>
                  </Step>
                );
              })}
            </Stepper>
          </Paper>
        </Fade>

        {/* Error Alert */}
        {error && (
          <Fade in timeout={600}>
            <Alert
              severity="error"
              sx={{
                mb: 2,
                borderRadius: 2,
                border: '1px solid rgba(239, 68, 68, 0.2)',
              }}
            >
              {error}
            </Alert>
          </Fade>
        )}

        {/* Step Content */}
        <Fade in timeout={1200}>
          <Paper
            elevation={0}
            sx={{
              ...theme.components.glassPaper,
              p: { xs: 2, sm: 3 },
              mb: 2,
            }}
          >
            {renderStepContent()}
          </Paper>
        </Fade>

        {/* Navigation Buttons */}
        <Fade in timeout={1400}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={handleBack}
              disabled={registrationState.currentStep === 0 || (isAdmin ? isAdminCreating : isRegistering)}
              sx={{
                ...theme.components.outlinedButton,
                minWidth: { xs: 100, sm: 120 },
              }}
            >
              Back
            </Button>

            <Box>
              {registrationState.currentStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={!validateForSubmission() || (isAdmin ? isAdminCreating : isRegistering)}
                  startIcon={(isAdmin ? isAdminCreating : isRegistering) ? <CircularProgress size={18} color="inherit" /> : undefined}
                  sx={{
                    ...theme.components.primaryButton,
                    minWidth: { xs: 140, sm: 180 },
                  }}
                >
                  {(isAdmin ? isAdminCreating : isRegistering) ? 'Registering...' : 'Register Doctor'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={!validateCurrentStep()}
                  sx={{
                    ...theme.components.primaryButton,
                    minWidth: { xs: 100, sm: 120 },
                  }}
                >
                  Next
                </Button>
              )}
            </Box>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
};

// Step 1: User Account Step Component
interface UserAccountStepProps {
  formData: UserAccountData;
  onChange: (field: keyof UserAccountData, value: any) => void;
  isAdmin?: boolean;
}

const UserAccountStep = ({ formData, onChange, isAdmin = false }: UserAccountStepProps) => {
  const handleInputChange = (field: keyof UserAccountData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    onChange(field, event.target.value);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom color="primary">
        {isAdmin ? 'Doctor Details' : 'Create User Account'}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {isAdmin
          ? 'Enter the doctor\'s information. A temporary password will be auto-generated.'
          : 'Create a new user account for the doctor. This will be their login credentials.'}
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="First Name"
            required
            value={formData.first_name}
            onChange={handleInputChange('first_name')}
            helperText="Doctor's first name"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Last Name"
            required
            value={formData.last_name}
            onChange={handleInputChange('last_name')}
            helperText="Doctor's last name"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            required
            value={formData.email}
            onChange={handleInputChange('email')}
            helperText="This will be used for login"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Phone Number"
            value={formData.phone}
            onChange={handleInputChange('phone')}
            helperText="Contact phone number"
          />
        </Grid>

        {/* Password fields - only show for non-admin (public registration) */}
        {!isAdmin && (
          <>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Password"
                type="password"
                required
                value={formData.password}
                onChange={handleInputChange('password')}
                helperText="Minimum 8 characters"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Confirm Password"
                type="password"
                required
                value={formData.confirm_password}
                onChange={handleInputChange('confirm_password')}
                error={formData.password !== formData.confirm_password && formData.confirm_password !== ''}
                helperText={
                  formData.password !== formData.confirm_password && formData.confirm_password !== ''
                    ? 'Passwords do not match'
                    : 'Re-enter password'
                }
              />
            </Grid>
          </>
        )}

        {/* Admin info message */}
        {isAdmin && (
          <Grid item xs={12}>
            <Alert severity="info">
              A temporary password will be automatically generated. You'll need to share it with the doctor after registration.
            </Alert>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

// Step 2: Professional Credentials Step Component
interface ProfessionalCredentialsStepProps {
  formData: DoctorFormData;
  onChange: (field: keyof DoctorFormData, value: any) => void;
}

const ProfessionalCredentialsStep = ({ formData, onChange }: ProfessionalCredentialsStepProps) => {
  const handleInputChange = (field: keyof DoctorFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    onChange(field, event.target.value);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom color="primary">
        Professional Credentials
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Enter the doctor's professional credentials and qualifications.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Medical License Number"
            required
            value={formData.license_number}
            onChange={handleInputChange('license_number')}
            helperText="Medical license registration number"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            select
            label="Specialization"
            required
            value={formData.specialization}
            onChange={handleInputChange('specialization')}
            helperText="Primary medical specialization"
          >
            {specializations.map((spec) => (
              <MenuItem key={spec} value={spec}>
                {spec}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Qualifications"
            multiline
            rows={3}
            required
            value={formData.qualification}
            onChange={handleInputChange('qualification')}
            helperText="Educational qualifications and certifications (e.g., MBBS, MD, Fellowship)"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Years of Experience"
            type="number"
            value={formData.experience_years}
            onChange={handleInputChange('experience_years')}
            InputProps={{
              inputProps: { min: 0, max: 70 }
            }}
            helperText="Years of medical practice experience"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

// Step 3: Clinic Details Step Component
interface ClinicDetailsStepProps {
  formData: DoctorFormData;
  onChange: (field: keyof DoctorFormData, value: any) => void;
}

const ClinicDetailsStep = ({ formData, onChange }: ClinicDetailsStepProps) => {
  const handleInputChange = (field: keyof DoctorFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    onChange(field, event.target.value);
  };

  const addOffice = () => {
    const newOffice: OfficeLocation = {
      id: generateUUID(),
      name: '',
      address: '',
      is_primary: formData.offices.length === 0, // First office is primary by default
    };
    onChange('offices', [...formData.offices, newOffice]);
  };

  const removeOffice = (index: number) => {
    const updatedOffices = formData.offices.filter((_, i) => i !== index);
    // If removed office was primary, make first remaining office primary
    if (formData.offices[index].is_primary && updatedOffices.length > 0) {
      updatedOffices[0].is_primary = true;
    }
    onChange('offices', updatedOffices);
  };

  const updateOffice = (index: number, field: keyof OfficeLocation, value: any) => {
    const updatedOffices = [...formData.offices];

    if (field === 'is_primary' && value === true) {
      // If setting as primary, unset all others
      updatedOffices.forEach((office, i) => {
        office.is_primary = i === index;
      });
    } else {
      updatedOffices[index] = { ...updatedOffices[index], [field]: value };
    }

    onChange('offices', updatedOffices);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom color="primary">
        Clinic & Consultation Details
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Provide clinic information and consultation details. You can add multiple office locations.
      </Typography>

      {/* Office Locations Section */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'background.default' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationIcon color="primary" />
            <Typography variant="h6">Office Locations</Typography>
          </Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={addOffice}
          >
            Add Office
          </Button>
        </Box>

        {formData.offices.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 3, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              No offices added yet. Click "Add Office" to add your clinic locations.
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {formData.offices.map((office, index) => (
              <Grid item xs={12} key={office.id}>
                <Paper
                  sx={{
                    p: 2,
                    border: office.is_primary ? '2px solid' : '1px solid',
                    borderColor: office.is_primary ? 'primary.main' : 'divider',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Office Name"
                            placeholder="e.g., Main Clinic, Chrompet Branch"
                            value={office.name}
                            onChange={(e) => updateOffice(index, 'name', e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={12} md={8}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Full Address"
                            placeholder="e.g., 123 Main Street, Chrompet, Chennai - 600044"
                            value={office.address}
                            onChange={(e) => updateOffice(index, 'address', e.target.value)}
                          />
                        </Grid>
                      </Grid>
                      <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              size="small"
                              checked={office.is_primary}
                              onChange={(e) => updateOffice(index, 'is_primary', e.target.checked)}
                            />
                          }
                          label={
                            <Typography variant="body2" color="text.secondary">
                              Primary Office
                            </Typography>
                          }
                        />
                        {office.is_primary && (
                          <Chip
                            label="Primary"
                            size="small"
                            color="primary"
                          />
                        )}
                      </Box>
                    </Box>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => removeOffice(index)}
                      title="Remove office"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* Consultation Details */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Legacy Clinic Address (Optional)"
            multiline
            rows={2}
            value={formData.clinic_address}
            onChange={handleInputChange('clinic_address')}
            helperText="This field is deprecated. Use Office Locations above instead."
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Consultation Fee"
            value={formData.consultation_fee}
            onChange={handleInputChange('consultation_fee')}
            helperText="Fee amount (e.g., 500, 1000)"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            select
            label="Consultation Duration"
            value={formData.consultation_duration}
            onChange={handleInputChange('consultation_duration')}
            helperText="Default duration per consultation"
          >
            {consultationDurations.map((duration) => (
              <MenuItem key={duration.value} value={duration.value}>
                {duration.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>
    </Box>
  );
};

// Schedule Step Component
interface ScheduleStepProps {
  schedule: WeeklySchedule;
  onChange: (day: keyof WeeklySchedule, slots: TimeSlot[]) => void;
}

const ScheduleStep = ({ schedule, onChange }: ScheduleStepProps) => {
  const days: Array<{ key: keyof WeeklySchedule; label: string }> = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
  ];

  const addTimeSlot = (day: keyof WeeklySchedule) => {
    const newSlot: TimeSlot = { start_time: '09:00', end_time: '17:00' };
    onChange(day, [...schedule[day], newSlot]);
  };

  const removeTimeSlot = (day: keyof WeeklySchedule, index: number) => {
    const newSlots = schedule[day].filter((_, i) => i !== index);
    onChange(day, newSlots);
  };

  const updateTimeSlot = (day: keyof WeeklySchedule, index: number, field: 'start_time' | 'end_time', value: string) => {
    const newSlots = [...schedule[day]];
    newSlots[index] = { ...newSlots[index], [field]: value };
    onChange(day, newSlots);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom color="primary">
        Availability Schedule
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Set your weekly availability schedule. You can add multiple time slots per day.
      </Typography>

      {days.map(({ key, label }) => (
        <Paper key={key} sx={{ p: 3, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">{label}</Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={() => addTimeSlot(key)}
            >
              Add Time Slot
            </Button>
          </Box>

          {schedule[key].length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              No availability set for this day
            </Typography>
          ) : (
            <Grid container spacing={2}>
              {schedule[key].map((slot, index) => (
                <Grid item xs={12} key={index}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <TextField
                      type="time"
                      label="Start Time"
                      size="small"
                      value={slot.start_time}
                      onChange={(e) => updateTimeSlot(key, index, 'start_time', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                    <Typography>to</Typography>
                    <TextField
                      type="time"
                      label="End Time"
                      size="small"
                      value={slot.end_time}
                      onChange={(e) => updateTimeSlot(key, index, 'end_time', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      color="error"
                      onClick={() => removeTimeSlot(key, index)}
                    >
                      Remove
                    </Button>
                  </Box>
                </Grid>
              ))}
            </Grid>
          )}
        </Paper>
      ))}
    </Box>
  );
};

// Step 5: Review Step Component
interface ReviewStepProps {
  userAccountData: UserAccountData;
  doctorInfo: DoctorFormData;
}

const ReviewStep = ({ userAccountData, doctorInfo }: ReviewStepProps) => {
  const formatSchedule = (schedule: WeeklySchedule) => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    return days.map(day => {
      const slots = schedule[day as keyof WeeklySchedule];
      const dayName = day.charAt(0).toUpperCase() + day.slice(1);
      
      if (slots.length === 0) {
        return `${dayName}: Not Available`;
      }
      
      const timeSlots = slots.map(slot => `${slot.start_time} - ${slot.end_time}`).join(', ');
      return `${dayName}: ${timeSlots}`;
    }).join('\n');
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom color="primary">
        Review & Confirm
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Please review all information before creating the doctor profile.
      </Typography>

      {/* User Account Info */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'action.hover' }}>
        <Typography variant="h6" gutterBottom>
          User Account Details
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2"><strong>Name:</strong> {userAccountData.first_name} {userAccountData.last_name}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2"><strong>Email:</strong> {userAccountData.email}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2"><strong>Phone:</strong> {userAccountData.phone || 'Not provided'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2"><strong>Role:</strong> Doctor</Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Professional Information */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'action.hover' }}>
        <Typography variant="h6" gutterBottom>
          Professional Information
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2"><strong>License Number:</strong> {doctorInfo.license_number}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2"><strong>Specialization:</strong> {doctorInfo.specialization}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2"><strong>Experience:</strong> {doctorInfo.experience_years} years</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2"><strong>Phone:</strong> {doctorInfo.phone || 'Not provided'}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2"><strong>Qualifications:</strong> {doctorInfo.qualification || 'Not provided'}</Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Consultation Details */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'action.hover' }}>
        <Typography variant="h6" gutterBottom>
          Consultation Details
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2"><strong>Fee:</strong> ₹{doctorInfo.consultation_fee || 'Not set'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2"><strong>Duration:</strong> {doctorInfo.consultation_duration} minutes</Typography>
          </Grid>
          {doctorInfo.clinic_address && (
            <Grid item xs={12}>
              <Typography variant="body2"><strong>Legacy Clinic Address:</strong> {doctorInfo.clinic_address}</Typography>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Office Locations */}
      {doctorInfo.offices.length > 0 && (
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'action.hover' }}>
          <Typography variant="h6" gutterBottom>
            Office Locations ({doctorInfo.offices.length})
          </Typography>
          <Grid container spacing={2}>
            {doctorInfo.offices.map((office, index) => (
              <Grid item xs={12} key={office.id}>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: 'background.paper',
                    borderRadius: 1,
                    border: office.is_primary ? '2px solid' : '1px solid',
                    borderColor: office.is_primary ? 'primary.main' : 'divider',
                  }}
                >
                  <Typography variant="body2">
                    <strong>{office.name || `Office ${index + 1}`}</strong>
                    {office.is_primary && (
                      <Chip
                        label="Primary"
                        size="small"
                        color="primary"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {office.address || 'No address provided'}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Schedule Summary */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'action.hover' }}>
        <Typography variant="h6" gutterBottom>
          Weekly Schedule
        </Typography>
        <Box sx={{ whiteSpace: 'pre-line', fontFamily: 'monospace' }}>
          <Typography variant="body2">
            {formatSchedule(doctorInfo.availability_schedule)}
          </Typography>
        </Box>
      </Paper>

      <Alert severity="info">
        <Typography variant="body2">
          <strong>Registration Summary:</strong>
          <br />
          • New user account will be created for: {userAccountData.email}
          <br />
          • Doctor profile will be linked to this account
          <br />
          • License number: {doctorInfo.license_number}
          <br />
          • Specialization: {doctorInfo.specialization}
          {doctorInfo.offices.length > 0 && (
            <>
              <br />
              • Office locations: {doctorInfo.offices.length} configured
            </>
          )}
          <br />
          • The doctor can login and update their profile after registration
        </Typography>
      </Alert>
    </Box>
  );
};