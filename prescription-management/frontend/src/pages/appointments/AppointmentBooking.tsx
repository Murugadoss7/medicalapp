import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  TextField,
  MenuItem,
  Alert,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Chip,
  Divider,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import {
  Person as PersonIcon,
  LocalHospital as DoctorIcon,
  Event as EventIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import {
  useListPatientsQuery,
  useListDoctorsQuery,
  useGetAppointmentAvailabilityQuery,
  useCreateAppointmentMutation,
  useCheckAppointmentConflictMutation,
  type Patient,
  type Doctor,
  type AppointmentCreateRequest,
} from '../../store/api';
import StandardDatePicker from '../../components/common/StandardDatePicker';
import { formatDateForAPI } from '../../components/common/StandardDatePicker';

const steps = ['Select Patient', 'Choose Doctor & Date', 'Confirm Booking'];

interface BookingFormData {
  patient_mobile_number: string;
  patient_first_name: string;
  patient_uuid: string;
  doctor_id: string;
  appointment_date: Date | null;
  appointment_time: string;
  reason_for_visit: string;
  contact_number: string;
  notes: string;
}

const validationSchema = yup.object({
  patient_mobile_number: yup
    .string()
    .required('Patient mobile number is required')
    .matches(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'),
  patient_first_name: yup
    .string()
    .required('Patient name is required'),
  doctor_id: yup
    .string()
    .required('Please select a doctor'),
  appointment_date: yup
    .date()
    .nullable()
    .required('Appointment date is required'),
  appointment_time: yup
    .string()
    .required('Please select an appointment time'),
  reason_for_visit: yup
    .string()
    .required('Reason for visit is required')
    .min(3, 'Please provide a detailed reason'),
});

export const AppointmentBooking = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<BookingFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      patient_mobile_number: '',
      patient_first_name: '',
      patient_uuid: '',
      doctor_id: '',
      appointment_date: null,
      appointment_time: '',
      reason_for_visit: '',
      contact_number: '',
      notes: '',
    },
  });

  const watchedDate = watch('appointment_date');
  const watchedDoctorId = watch('doctor_id');

  // API calls
  const { data: patientsData, isLoading: patientsLoading } = useListPatientsQuery({
    mobile_number: patientSearch.length >= 3 ? patientSearch : undefined,
    page_size: 10,
  });

  const { data: doctorsData, isLoading: doctorsLoading } = useListDoctorsQuery({
    is_active: true,
    page: 1,
    per_page: 50,
  });

  const { data: availabilityData } = useGetAppointmentAvailabilityQuery(
    {
      doctorId: watchedDoctorId,
      date: watchedDate ? formatDateForAPI(watchedDate) || '' : '',
    },
    {
      skip: !watchedDoctorId || !watchedDate,
    }
  );

  const [createAppointment, { isLoading: creating }] = useCreateAppointmentMutation();
  const [checkConflict] = useCheckAppointmentConflictMutation();

  // Update available slots when availability data changes
  React.useEffect(() => {
    console.log('Availability data received:', availabilityData);
    
    if (availabilityData?.available_slots) {
      try {
        // Process the TimeSlot objects and extract only available times
        const slots = availabilityData.available_slots
          .filter(slot => slot.is_available === true)  // Only show available slots
          .map(slot => slot.start_time)  // Extract the start_time string
          .filter(Boolean);  // Remove any empty strings
        
        console.log('Processed available slots:', slots);
        setAvailableSlots(slots);
      } catch (error) {
        console.error('Error processing availability data:', error);
        setAvailableSlots([]);
      }
    } else {
      setAvailableSlots([]);
    }
  }, [availabilityData]);

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setValue('patient_mobile_number', patient.mobile_number);
    setValue('patient_first_name', patient.first_name);
    setValue('patient_uuid', patient.id);
    setValue('contact_number', patient.mobile_number);
    setActiveStep(1);
  };

  const handleDoctorSelect = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setValue('doctor_id', doctor.id);
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const onSubmit = async (data: BookingFormData) => {
    try {
      if (!data.appointment_date) return;

      const appointmentData: AppointmentCreateRequest = {
        patient_mobile_number: data.patient_mobile_number,
        patient_first_name: data.patient_first_name,
        patient_uuid: data.patient_uuid,
        doctor_id: data.doctor_id,
        appointment_date: formatDateForAPI(data.appointment_date) || '',
        appointment_time: data.appointment_time,
        duration_minutes: 30,
        reason_for_visit: data.reason_for_visit,
        contact_number: data.contact_number || data.patient_mobile_number,
        notes: data.notes,
      };

      // Check for conflicts before booking
      const conflictCheck = await checkConflict({
        doctor_id: data.doctor_id,
        appointment_date: appointmentData.appointment_date,
        appointment_time: data.appointment_time,
        duration_minutes: 30,
      }).unwrap();

      if (conflictCheck.has_conflict) {
        alert('This time slot is no longer available. Please select a different time.');
        return;
      }

      const result = await createAppointment(appointmentData).unwrap();
      alert('Appointment booked successfully!');
      navigate('/doctor/appointments');
    } catch (error) {
      console.error('Failed to book appointment:', error);
      alert('Failed to book appointment. Please try again.');
    }
  };

  const renderStep = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Patient
            </Typography>
            
            <TextField
              fullWidth
              label="Search by mobile number or name"
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              placeholder="Enter mobile number or patient name"
              sx={{ mb: 2 }}
            />

            {patientsLoading && <CircularProgress />}
            
            {patientsData && (
              <Grid container spacing={2}>
                {patientsData.patients.map((patient) => (
                  <Grid item xs={12} md={6} key={patient.id}>
                    <Card
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': { boxShadow: 3 },
                        border: selectedPatient?.id === patient.id ? 2 : 0,
                        borderColor: 'primary.main'
                      }}
                      onClick={() => handlePatientSelect(patient)}
                    >
                      <CardContent>
                        <Typography variant="h6">{patient.full_name}</Typography>
                        <Typography color="text.secondary">
                          📱 {patient.mobile_number}
                        </Typography>
                        <Typography color="text.secondary">
                          🎂 Age: {patient.age}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Choose Doctor & Schedule
            </Typography>
            
            {selectedPatient && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Booking for: <strong>{selectedPatient.full_name}</strong> ({selectedPatient.mobile_number})
              </Alert>
            )}

            <Grid container spacing={3}>
              {/* Doctor Selection */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Select Doctor
                </Typography>
                {doctorsData?.doctors.map((doctor) => (
                  <Card
                    key={doctor.id}
                    sx={{
                      mb: 1,
                      cursor: 'pointer',
                      '&:hover': { boxShadow: 2 },
                      border: selectedDoctor?.id === doctor.id ? 2 : 0,
                      borderColor: 'primary.main'
                    }}
                    onClick={() => handleDoctorSelect(doctor)}
                  >
                    <CardContent sx={{ py: 1 }}>
                      <Typography variant="subtitle2">
                        Dr. {doctor.first_name} {doctor.last_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {doctor.specialization}
                      </Typography>
                      {doctor.consultation_fee && (
                        <Typography variant="body2" color="primary">
                          Fee: ₹{doctor.consultation_fee}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Grid>

              {/* Date & Time Selection */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Select Date & Time
                </Typography>
                
                <Controller
                  name="appointment_date"
                  control={control}
                  render={({ field }) => (
                    <StandardDatePicker
                      label="Appointment Date"
                      dateType="appointment_date"
                      value={field.value}
                      onChange={field.onChange}
                      required
                      error={!!errors.appointment_date}
                      helperText={errors.appointment_date?.message}
                    />
                  )}
                />

                {/* Time Slots Section */}
                {watchedDoctorId && watchedDate && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Available Time Slots
                    </Typography>
                    
                    {availableSlots.length > 0 ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {availableSlots.map((slot, index) => (
                          <Chip
                            key={`${slot}-${index}`}
                            label={typeof slot === 'string' ? slot : 'Invalid slot'}
                            onClick={() => {
                              if (typeof slot === 'string') {
                                setValue('appointment_time', slot);
                              }
                            }}
                            color={watch('appointment_time') === slot ? 'primary' : 'default'}
                            variant={watch('appointment_time') === slot ? 'filled' : 'outlined'}
                          />
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        {availabilityData ? 'No available slots for this date' : 'Loading available times...'}
                      </Typography>
                    )}
                  </Box>
                )}

                <Controller
                  name="reason_for_visit"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Reason for Visit"
                      multiline
                      rows={3}
                      sx={{ mt: 2 }}
                      error={!!errors.reason_for_visit}
                      helperText={errors.reason_for_visit?.message}
                    />
                  )}
                />
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button onClick={handleBack}>Back</Button>
              <Button 
                variant="contained" 
                onClick={handleNext}
                disabled={!watch('doctor_id') || !watch('appointment_date') || !watch('appointment_time')}
              >
                Next
              </Button>
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Confirm Appointment
            </Typography>
            
            <Paper sx={{ p: 3, mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="primary">
                    Patient Details
                  </Typography>
                  <Typography><strong>Name:</strong> {selectedPatient?.full_name}</Typography>
                  <Typography><strong>Mobile:</strong> {selectedPatient?.mobile_number}</Typography>
                  <Typography><strong>Age:</strong> {selectedPatient?.age}</Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="primary">
                    Doctor Details
                  </Typography>
                  <Typography><strong>Doctor:</strong> Dr. {selectedDoctor?.first_name} {selectedDoctor?.last_name}</Typography>
                  <Typography><strong>Specialization:</strong> {selectedDoctor?.specialization}</Typography>
                  {selectedDoctor?.consultation_fee && (
                    <Typography><strong>Fee:</strong> ₹{selectedDoctor.consultation_fee}</Typography>
                  )}
                </Grid>
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" color="primary">
                    Appointment Details
                  </Typography>
                  <Typography><strong>Date:</strong> {watch('appointment_date')?.toLocaleDateString()}</Typography>
                  <Typography><strong>Time:</strong> {watch('appointment_time')} (30 minutes)</Typography>
                  <Typography><strong>Reason:</strong> {watch('reason_for_visit')}</Typography>
                </Grid>
              </Grid>
            </Paper>

            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Additional Notes (Optional)"
                  multiline
                  rows={2}
                  sx={{ mb: 3 }}
                />
              )}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={handleBack}>Back</Button>
              <Button 
                variant="contained" 
                onClick={handleSubmit(onSubmit)}
                disabled={creating}
                startIcon={creating ? <CircularProgress size={20} /> : <CheckIcon />}
              >
                {creating ? 'Booking...' : 'Confirm Appointment'}
              </Button>
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <EventIcon sx={{ mr: 1, fontSize: 32, color: 'primary.main' }} />
        Book New Appointment
      </Typography>
      
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Paper sx={{ p: 3 }}>
        {renderStep()}
      </Paper>
    </Box>
  );
};