import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  Alert,
  CircularProgress,
  Divider,
  Paper,
  Step,
  Stepper,
  StepLabel,
  Card,
  CardContent,
  Container,
} from '@mui/material';
import { LocalHospital as DoctorIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  useRegisterMutation,
  type RegisterRequest,
} from '../../store/api';

interface UserAccountData {
  email: string;
  password: string;
  confirm_password: string;
  first_name: string;
  last_name: string;
  phone: string;
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

const steps = [
  'User Account',
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
  const [registerUser, { isLoading: isRegistering }] = useRegisterMutation();

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
      case 0: // User Account
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

      // Register with ALL doctor details in a single API call
      // The /api/v1/auth/register endpoint now accepts all doctor fields
      const registerData: RegisterRequest = {
        email: registrationState.userAccountData.email,
        password: registrationState.userAccountData.password,
        confirm_password: registrationState.userAccountData.confirm_password,
        first_name: registrationState.userAccountData.first_name,
        last_name: registrationState.userAccountData.last_name,
        phone: registrationState.userAccountData.phone || undefined,
        role: 'doctor',
        // All doctor-specific fields
        license_number: registrationState.doctorInfo.license_number,
        specialization: registrationState.doctorInfo.specialization,
        qualification: registrationState.doctorInfo.qualification || undefined,
        experience_years: registrationState.doctorInfo.experience_years || undefined,
        clinic_address: registrationState.doctorInfo.clinic_address || undefined,
        consultation_fee: registrationState.doctorInfo.consultation_fee || undefined,
        consultation_duration: registrationState.doctorInfo.consultation_duration || 30,
        availability_schedule: registrationState.doctorInfo.availability_schedule,
      };

      await registerUser(registerData).unwrap();

      // Navigate to doctor search page with success message
      navigate('/doctors', {
        state: {
          message: `Doctor ${registrationState.userAccountData.first_name} ${registrationState.userAccountData.last_name} registered successfully!`
        }
      });
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

  const renderStepContent = () => {
    switch (registrationState.currentStep) {
      case 0: // User Account
        return (
          <UserAccountStep
            formData={registrationState.userAccountData}
            onChange={handleUserAccountChange}
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

  return (
    <Container maxWidth="md" disableGutters sx={{ mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <DoctorIcon sx={{ mr: 1, fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          Doctor Registration
        </Typography>
      </Box>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Create a comprehensive doctor profile with professional credentials and availability schedule.
      </Typography>

      {/* Stepper */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Stepper activeStep={registrationState.currentStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Step Content */}
      <Card>
        <CardContent sx={{ p: 4 }}>
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button
          variant="outlined"
          onClick={handleBack}
          disabled={registrationState.currentStep === 0 || isRegistering}
        >
          Back
        </Button>

        <Box>
          {registrationState.currentStep === steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={!validateForSubmission() || isRegistering}
              startIcon={isRegistering ? <CircularProgress size={20} /> : undefined}
            >
              {isRegistering ? 'Registering Doctor...' : 'Register Doctor'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!validateCurrentStep()}
            >
              Next
            </Button>
          )}
        </Box>
      </Box>
    </Container>
  );
};

// Step 1: User Account Step Component
interface UserAccountStepProps {
  formData: UserAccountData;
  onChange: (field: keyof UserAccountData, value: any) => void;
}

const UserAccountStep = ({ formData, onChange }: UserAccountStepProps) => {
  const handleInputChange = (field: keyof UserAccountData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    onChange(field, event.target.value);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom color="primary">
        Create User Account
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Create a new user account for the doctor. This will be their login credentials.
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

  return (
    <Box>
      <Typography variant="h6" gutterBottom color="primary">
        Clinic & Consultation Details
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Provide clinic information and consultation details (all fields are optional).
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Clinic/Hospital Address"
            multiline
            rows={3}
            value={formData.clinic_address}
            onChange={handleInputChange('clinic_address')}
            helperText="Primary practice location address"
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
          <Grid item xs={12}>
            <Typography variant="body2"><strong>Clinic Address:</strong> {doctorInfo.clinic_address || 'Not provided'}</Typography>
          </Grid>
        </Grid>
      </Paper>

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
          <br />
          • The doctor can login and update their profile after registration
        </Typography>
      </Alert>
    </Box>
  );
};