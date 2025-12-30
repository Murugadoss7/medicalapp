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
  Paper,
  Step,
  Stepper,
  StepLabel,
  Card,
  CardContent,
  Container,
  Chip,
} from '@mui/material';
import {
  LocalHospital as DoctorIcon,
  ArrowBack as BackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  LocationOn as LocationIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useGetDoctorByIdQuery,
  useUpdateDoctorMutation,
  useUpdateDoctorScheduleMutation,
  useGetCurrentUserQuery,
  type DoctorUpdate,
  type DoctorScheduleUpdate,
} from '../../store/api';
import theme from '../../theme/medicalFuturismTheme';

interface OfficeLocation {
  id: string;
  name: string;
  address: string;
  is_primary: boolean;
}

// Simple UUID generator using crypto API
const generateUUID = (): string => {
  return crypto.randomUUID();
};

interface DoctorFormData {
  license_number: string;
  specialization: string;
  qualification: string;
  experience_years: number;
  clinic_address: string;
  phone: string;
  consultation_fee: string;
  consultation_duration: number;
  availability_schedule: WeeklySchedule;
  is_active: boolean;
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
  start_time: string;
  end_time: string;
}

interface EditState {
  currentStep: number;
  doctorInfo: DoctorFormData;
  originalData?: any;
}

const steps = [
  'Basic Information',
  'Professional Details',
  'Availability Schedule',
  'Review & Save'
];

const defaultSchedule: WeeklySchedule = {
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
  saturday: [],
  sunday: [],
};

const specializations = [
  'General Practice',
  'Cardiology',
  'Dental Surgery',
  'Dentistry',
  'Dermatology',
  'Emergency Medicine',
  'Endocrinology',
  'Endodontics',
  'Family Medicine',
  'Gastroenterology',
  'Internal Medicine',
  'Neurology',
  'Obstetrics & Gynecology',
  'Ophthalmology',
  'Oral & Maxillofacial Surgery',
  'Orthodontics',
  'Orthopedics',
  'Pediatric Dentistry',
  'Pediatrics',
  'Periodontics',
  'Prosthodontics',
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

export const DoctorEdit = () => {
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();
  const { data: currentUser } = useGetCurrentUserQuery();
  
  const [updateDoctor, { isLoading: isUpdating }] = useUpdateDoctorMutation();
  const [updateSchedule, { isLoading: isUpdatingSchedule }] = useUpdateDoctorScheduleMutation();
  
  const {
    data: doctor,
    isLoading: isLoadingDoctor,
    error: doctorError,
  } = useGetDoctorByIdQuery(doctorId || '', {
    skip: !doctorId,
  });

  const [editState, setEditState] = useState<EditState>({
    currentStep: 0,
    doctorInfo: {
      license_number: '',
      specialization: '',
      qualification: '',
      experience_years: 0,
      clinic_address: '',
      phone: '',
      consultation_fee: '',
      consultation_duration: 30,
      availability_schedule: defaultSchedule,
      is_active: true,
      offices: [],
    },
  });
  
  const [error, setError] = useState<string>('');

  // Check permissions
  const canEdit = currentUser?.role === 'admin' || 
    (currentUser?.role === 'doctor' && doctor?.user_id === currentUser?.id);

  // Populate form with existing doctor data
  useEffect(() => {
    if (doctor) {
      setEditState(prev => ({
        ...prev,
        originalData: doctor,
        doctorInfo: {
          license_number: doctor.license_number || '',
          specialization: doctor.specialization || '',
          qualification: doctor.qualification || '',
          experience_years: doctor.experience_years || 0,
          clinic_address: doctor.clinic_address || '',
          phone: doctor.phone || '',
          consultation_fee: doctor.consultation_fee || '',
          consultation_duration: doctor.consultation_duration || 30,
          availability_schedule: doctor.availability_schedule || defaultSchedule,
          is_active: doctor.is_active !== undefined ? doctor.is_active : true,
          offices: doctor.offices || [],
        },
      }));
    }
  }, [doctor]);

  const handleDoctorInfoChange = (field: keyof DoctorFormData, value: any) => {
    setEditState(prev => ({
      ...prev,
      doctorInfo: {
        ...prev.doctorInfo,
        [field]: value,
      },
    }));
    setError('');
  };

  const handleScheduleChange = (day: keyof WeeklySchedule, slots: TimeSlot[]) => {
    setEditState(prev => ({
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
    if (editState.currentStep < steps.length - 1) {
      setEditState(prev => ({
        ...prev,
        currentStep: prev.currentStep + 1,
      }));
    }
  };

  const handleBack = () => {
    if (editState.currentStep > 0) {
      setEditState(prev => ({
        ...prev,
        currentStep: prev.currentStep - 1,
      }));
    }
  };

  const validateCurrentStep = (): boolean => {
    const { currentStep, doctorInfo } = editState;

    switch (currentStep) {
      case 0: // Basic Information
        return !!(doctorInfo.license_number && doctorInfo.specialization);
      case 1: // Professional Details
        // In edit mode, these fields are optional - just check they're not undefined
        return true; // All fields in this step are optional
      case 2: // Schedule
        return true; // Schedule is optional
      case 3: // Review
        return true;
      default:
        return false;
    }
  };

  const validateForSubmission = (): boolean => {
    return validateCurrentStep() && editState.currentStep === steps.length - 1;
  };

  const handleSubmit = async () => {
    if (!doctorId) return;

    try {
      setError('');
      
      // Prepare update data (only include changed fields)
      const updateData: DoctorUpdate = {};
      const { doctorInfo, originalData } = editState;

      if (doctorInfo.license_number !== originalData?.license_number) {
        updateData.license_number = doctorInfo.license_number;
      }
      if (doctorInfo.specialization !== originalData?.specialization) {
        updateData.specialization = doctorInfo.specialization || undefined;
      }
      if (doctorInfo.qualification !== originalData?.qualification) {
        updateData.qualification = doctorInfo.qualification || undefined;
      }
      if (doctorInfo.experience_years !== originalData?.experience_years) {
        updateData.experience_years = doctorInfo.experience_years || undefined;
      }
      if (doctorInfo.clinic_address !== originalData?.clinic_address) {
        updateData.clinic_address = doctorInfo.clinic_address || undefined;
      }
      if (doctorInfo.phone !== originalData?.phone) {
        updateData.phone = doctorInfo.phone || undefined;
      }
      if (doctorInfo.consultation_fee !== originalData?.consultation_fee) {
        updateData.consultation_fee = doctorInfo.consultation_fee || undefined;
      }
      if (doctorInfo.consultation_duration !== originalData?.consultation_duration) {
        updateData.consultation_duration = doctorInfo.consultation_duration || 30;
      }
      if (doctorInfo.is_active !== originalData?.is_active) {
        updateData.is_active = doctorInfo.is_active;
      }

      // Check if offices have changed
      const officesChanged = JSON.stringify(doctorInfo.offices) !== JSON.stringify(originalData?.offices || []);
      if (officesChanged) {
        updateData.offices = doctorInfo.offices;
      }

      // Update doctor profile if there are changes
      if (Object.keys(updateData).length > 0) {
        await updateDoctor({
          doctorId,
          doctorData: updateData,
        }).unwrap();
      }

      // Update schedule if it has changed
      const scheduleChanged = JSON.stringify(doctorInfo.availability_schedule) !== 
        JSON.stringify(originalData?.availability_schedule);
      
      if (scheduleChanged) {
        const scheduleUpdateData: DoctorScheduleUpdate = {
          availability_schedule: doctorInfo.availability_schedule,
        };
        
        await updateSchedule({
          doctorId,
          scheduleData: scheduleUpdateData,
        }).unwrap();
      }
      
      // Navigate back to doctor profile
      navigate(`/doctors/${doctorId}`);
    } catch (err: any) {
      console.error('Failed to update doctor:', err);
      
      let errorMessage = 'Failed to update doctor profile';
      
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
    switch (editState.currentStep) {
      case 0:
        return (
          <BasicInformationStep
            formData={editState.doctorInfo}
            onChange={handleDoctorInfoChange}
            doctor={doctor}
          />
        );
      case 1:
        return (
          <ProfessionalDetailsStep
            formData={editState.doctorInfo}
            onChange={handleDoctorInfoChange}
          />
        );
      case 2:
        return (
          <ScheduleStep
            schedule={editState.doctorInfo.availability_schedule}
            onChange={handleScheduleChange}
          />
        );
      case 3:
        return (
          <ReviewStep
            doctorInfo={editState.doctorInfo}
            originalData={editState.originalData}
          />
        );
      default:
        return null;
    }
  };

  if (!doctorId) {
    return (
      <Alert severity="error">
        Doctor ID is required to edit doctor profile.
      </Alert>
    );
  }

  if (isLoadingDoctor) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (doctorError || !doctor) {
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

  if (!canEdit) {
    return (
      <Box>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate(`/doctors/${doctorId}`)}
          sx={{ mb: 2 }}
        >
          Back to Profile
        </Button>
        <Alert severity="error">
          You don't have permission to edit this doctor profile.
        </Alert>
      </Box>
    );
  }

  const isLoading = isUpdating || isUpdatingSchedule;

  return (
    <Box
      sx={{
        ...theme.layouts.pageContainer,
      }}
    >
      {/* Floating Gradient Orb */}
      <Box sx={theme.layouts.floatingOrb} />

      {/* Content Container */}
      <Container
        maxWidth="md"
        disableGutters
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
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Button
            startIcon={<BackIcon />}
            onClick={() => navigate(`/doctors/${doctorId}`)}
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
              Edit Doctor Profile
            </Typography>
          </Box>
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
          Update professional credentials and availability schedule for Dr. {doctor.full_name || `${doctor.first_name} ${doctor.last_name}`}.
        </Typography>

        {/* Stepper */}
        <Paper
          elevation={0}
          sx={{
            ...theme.components.glassPaper,
            p: { xs: 1.5, sm: 2 },
            mb: 2,
          }}
        >
          <Stepper
            activeStep={editState.currentStep}
            alternativeLabel
            sx={{
              '& .MuiStepConnector-line': {
                borderColor: theme.colors.primary.border,
              },
              '& .MuiStepLabel-label': {
                fontSize: '0.75rem',
                fontWeight: 600,
              },
              '& .MuiStepLabel-label.Mui-active': {
                color: theme.colors.primary.main,
                fontWeight: 700,
              },
              '& .MuiStepLabel-label.Mui-completed': {
                color: theme.colors.primary.main,
              },
              '& .MuiStepIcon-root': {
                color: theme.colors.primary.light,
                '&.Mui-active': {
                  color: theme.colors.primary.main,
                },
                '&.Mui-completed': {
                  color: theme.colors.primary.main,
                },
              },
            }}
          >
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        {/* Error Alert */}
        {error && (
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
        )}

        {/* Step Content */}
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

        {/* Navigation Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
          <Button
            variant="outlined"
            onClick={handleBack}
            disabled={editState.currentStep === 0 || isLoading}
            sx={{
              ...theme.components.outlinedButton,
              minHeight: 44,
            }}
          >
            Back
          </Button>

          <Box>
            {editState.currentStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={!validateForSubmission() || isLoading}
                startIcon={isLoading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : undefined}
                sx={{
                  ...theme.components.primaryButton,
                  minHeight: 44,
                }}
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={!validateCurrentStep()}
                sx={{
                  ...theme.components.primaryButton,
                  minHeight: 44,
                }}
              >
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

// Step components (reuse from DoctorRegistration with minor modifications)
interface BasicInformationStepProps {
  formData: DoctorFormData;
  onChange: (field: keyof DoctorFormData, value: any) => void;
  doctor?: any;
}

const BasicInformationStep = ({ formData, onChange, doctor }: BasicInformationStepProps) => {
  const handleInputChange = (field: keyof DoctorFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    onChange(field, event.target.value);
  };

  return (
    <Box>
      <Typography sx={{ ...theme.typography.sectionTitle, mb: 1 }}>
        Basic Information
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
        Update the basic professional details for the doctor profile.
      </Typography>

      <Grid container spacing={1.5}>
        <Grid item xs={12}>
          <Alert
            severity="info"
            sx={{
              borderRadius: 2,
              border: `1px solid ${theme.colors.primary.border}`,
              background: theme.colors.primary.light,
            }}
          >
            <Typography variant="caption">
              <strong>User Account:</strong> {doctor?.first_name} {doctor?.last_name} ({doctor?.user_email})
              <br />
              Account details cannot be changed from this form.
            </Typography>
          </Alert>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Medical License Number"
            required
            value={formData.license_number}
            onChange={handleInputChange('license_number')}
            helperText="Medical license number"
            sx={{
              ...theme.components.textField,
            }}
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
            sx={{
              ...theme.components.textField,
            }}
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
            value={formData.qualification}
            onChange={handleInputChange('qualification')}
            helperText="Educational qualifications and certifications"
            sx={{
              ...theme.components.textField,
            }}
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
            helperText="Years of medical practice"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Professional Phone"
            value={formData.phone}
            onChange={handleInputChange('phone')}
            helperText="Contact number for professional use"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            select
            label="Profile Status"
            value={formData.is_active}
            onChange={handleInputChange('is_active')}
            helperText="Profile active status"
          >
            <MenuItem value={true}>Active</MenuItem>
            <MenuItem value={false}>Inactive</MenuItem>
          </TextField>
        </Grid>
      </Grid>
    </Box>
  );
};

// Reuse Professional Details, Schedule, and Review components from DoctorRegistration
// (They would be identical, so I'll import them or copy the implementations)

interface ProfessionalDetailsStepProps {
  formData: DoctorFormData;
  onChange: (field: keyof DoctorFormData, value: any) => void;
}

const ProfessionalDetailsStep = ({ formData, onChange }: ProfessionalDetailsStepProps) => {
  const handleInputChange = (field: keyof DoctorFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    onChange(field, event.target.value);
  };

  // Office management functions
  const addOffice = () => {
    const newOffice: OfficeLocation = {
      id: generateUUID(),
      name: '',
      address: '',
      is_primary: formData.offices.length === 0,
    };
    onChange('offices', [...formData.offices, newOffice]);
  };

  const removeOffice = (index: number) => {
    const updatedOffices = formData.offices.filter((_, i) => i !== index);
    // If we removed the primary office, make the first remaining one primary
    if (formData.offices[index].is_primary && updatedOffices.length > 0) {
      updatedOffices[0].is_primary = true;
    }
    onChange('offices', updatedOffices);
  };

  const updateOffice = (index: number, field: keyof OfficeLocation, value: string | boolean) => {
    const updatedOffices = [...formData.offices];
    updatedOffices[index] = { ...updatedOffices[index], [field]: value };
    onChange('offices', updatedOffices);
  };

  const setPrimaryOffice = (index: number) => {
    const updatedOffices = formData.offices.map((office, i) => ({
      ...office,
      is_primary: i === index,
    }));
    onChange('offices', updatedOffices);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom color="primary">
        Professional Details
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Update clinic information and consultation details.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Clinic/Hospital Address (Legacy)"
            multiline
            rows={2}
            value={formData.clinic_address}
            onChange={handleInputChange('clinic_address')}
            helperText="Primary practice location (for backward compatibility)"
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

        {/* Office Locations Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, bgcolor: 'grey.50' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationIcon color="primary" />
                <Typography variant="h6">Office Locations</Typography>
              </Box>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={addOffice}
                size="small"
              >
                Add Office
              </Button>
            </Box>

            {formData.offices.length === 0 ? (
              <Alert severity="info">
                No office locations added. Add offices to allow patients to select a location when booking appointments.
              </Alert>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {formData.offices.map((office, index) => (
                  <Paper
                    key={office.id}
                    variant="outlined"
                    sx={{
                      p: 2,
                      border: office.is_primary ? '2px solid' : '1px solid',
                      borderColor: office.is_primary ? 'primary.main' : 'grey.300',
                    }}
                  >
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Office Name"
                          placeholder="e.g., Main Clinic, Branch Office"
                          value={office.name}
                          onChange={(e) => updateOffice(index, 'name', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} sm={5}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Full Address"
                          placeholder="Full address"
                          value={office.address}
                          onChange={(e) => updateOffice(index, 'address', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant={office.is_primary ? 'contained' : 'outlined'}
                            color={office.is_primary ? 'primary' : 'inherit'}
                            onClick={() => setPrimaryOffice(index)}
                            startIcon={<StarIcon />}
                            sx={{ flex: 1 }}
                          >
                            {office.is_primary ? 'Primary' : 'Set Primary'}
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => removeOffice(index)}
                          >
                            <DeleteIcon fontSize="small" />
                          </Button>
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

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
        Update your weekly availability schedule. You can add multiple time slots per day.
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

interface ReviewStepProps {
  doctorInfo: DoctorFormData;
  originalData?: any;
}

const ReviewStep = ({ doctorInfo, originalData }: ReviewStepProps) => {
  const hasChanges = (field: keyof DoctorFormData) => {
    if (!originalData) return true;
    if (field === 'availability_schedule' || field === 'offices') {
      return JSON.stringify(doctorInfo[field]) !== JSON.stringify(originalData[field] || []);
    }
    return doctorInfo[field] !== originalData[field];
  };

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
        Review Changes
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Review the changes before saving. Modified fields are highlighted.
      </Typography>

      {/* Professional Information */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: hasChanges('license_number') || hasChanges('specialization') || hasChanges('qualification') || hasChanges('experience_years') ? 'action.hover' : 'background.paper' }}>
        <Typography variant="h6" gutterBottom>
          Professional Information
          {(hasChanges('license_number') || hasChanges('specialization') || hasChanges('qualification') || hasChanges('experience_years')) && (
            <Typography component="span" variant="caption" color="primary" sx={{ ml: 1 }}>
              (Modified)
            </Typography>
          )}
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2">
              <strong>License Number:</strong> {doctorInfo.license_number}
              {hasChanges('license_number') && <Typography component="span" color="primary"> *</Typography>}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2">
              <strong>Specialization:</strong> {doctorInfo.specialization}
              {hasChanges('specialization') && <Typography component="span" color="primary"> *</Typography>}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2">
              <strong>Experience:</strong> {doctorInfo.experience_years} years
              {hasChanges('experience_years') && <Typography component="span" color="primary"> *</Typography>}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2">
              <strong>Phone:</strong> {doctorInfo.phone || 'Not provided'}
              {hasChanges('phone') && <Typography component="span" color="primary"> *</Typography>}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2">
              <strong>Qualifications:</strong> {doctorInfo.qualification || 'Not provided'}
              {hasChanges('qualification') && <Typography component="span" color="primary"> *</Typography>}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Consultation Details */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: hasChanges('consultation_fee') || hasChanges('consultation_duration') || hasChanges('clinic_address') ? 'action.hover' : 'background.paper' }}>
        <Typography variant="h6" gutterBottom>
          Consultation Details
          {(hasChanges('consultation_fee') || hasChanges('consultation_duration') || hasChanges('clinic_address')) && (
            <Typography component="span" variant="caption" color="primary" sx={{ ml: 1 }}>
              (Modified)
            </Typography>
          )}
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2">
              <strong>Fee:</strong> ₹{doctorInfo.consultation_fee || 'Not set'}
              {hasChanges('consultation_fee') && <Typography component="span" color="primary"> *</Typography>}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2">
              <strong>Duration:</strong> {doctorInfo.consultation_duration} minutes
              {hasChanges('consultation_duration') && <Typography component="span" color="primary"> *</Typography>}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2">
              <strong>Clinic Address:</strong> {doctorInfo.clinic_address || 'Not provided'}
              {hasChanges('clinic_address') && <Typography component="span" color="primary"> *</Typography>}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Office Locations */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: hasChanges('offices') ? 'action.hover' : 'background.paper' }}>
        <Typography variant="h6" gutterBottom>
          Office Locations ({doctorInfo.offices.length})
          {hasChanges('offices') && (
            <Typography component="span" variant="caption" color="primary" sx={{ ml: 1 }}>
              (Modified)
            </Typography>
          )}
        </Typography>
        {doctorInfo.offices.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No offices configured</Typography>
        ) : (
          <Grid container spacing={2}>
            {doctorInfo.offices.map((office, index) => (
              <Grid item xs={12} sm={6} key={office.id || index}>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: office.is_primary ? 'primary.50' : 'background.paper' }}>
                  <Typography variant="subtitle2">
                    {office.name || 'Unnamed Office'}
                    {office.is_primary && (
                      <Chip label="Primary" size="small" color="primary" sx={{ ml: 1 }} />
                    )}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {office.address || 'No address'}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* Schedule */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: hasChanges('availability_schedule') ? 'action.hover' : 'background.paper' }}>
        <Typography variant="h6" gutterBottom>
          Weekly Schedule
          {hasChanges('availability_schedule') && (
            <Typography component="span" variant="caption" color="primary" sx={{ ml: 1 }}>
              (Modified)
            </Typography>
          )}
        </Typography>
        <Box sx={{ whiteSpace: 'pre-line', fontFamily: 'monospace' }}>
          <Typography variant="body2">
            {formatSchedule(doctorInfo.availability_schedule)}
          </Typography>
        </Box>
      </Paper>

      {/* Status */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: hasChanges('is_active') ? 'action.hover' : 'background.paper' }}>
        <Typography variant="h6" gutterBottom>
          Profile Status
          {hasChanges('is_active') && (
            <Typography component="span" variant="caption" color="primary" sx={{ ml: 1 }}>
              (Modified)
            </Typography>
          )}
        </Typography>
        <Typography variant="body2">
          <strong>Status:</strong> {doctorInfo.is_active ? 'Active' : 'Inactive'}
          {hasChanges('is_active') && <Typography component="span" color="primary"> *</Typography>}
        </Typography>
      </Paper>

      <Alert severity="info">
        <Typography variant="body2">
          <strong>Update Summary:</strong>
          <br />
          • Only modified fields will be updated
          <br />
          • Changes marked with * will be saved
          <br />
          • Schedule changes are saved separately
        </Typography>
      </Alert>
    </Box>
  );
};