import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  TextField,
  Alert,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Chip,
  Divider,
  Card,
  CardContent,
  Avatar,
  Rating,
  InputAdornment,
  Fade,
  Slide,
  IconButton,
  Pagination,
  Container,
} from '@mui/material';
import {
  Person,
  LocalHospital,
  Event as EventIcon,
  Check as CheckIcon,
  Search,
  Phone,
  CalendarToday,
  AccessTime,
  CheckCircle,
  ArrowBack,
  ArrowForward,
  Close,
  LocationOn,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/common/Toast';
import {
  useListPatientsQuery,
  useListDoctorsQuery,
  useGetAppointmentAvailabilityQuery,
  useCreateAppointmentMutation,
  useCheckAppointmentConflictMutation,
  type Patient,
  type Doctor,
  type AppointmentCreateRequest,
  type OfficeLocation,
} from '../../store/api';
import StandardDatePicker from '../../components/common/StandardDatePicker';
import { formatDateForAPI } from '../../components/common/StandardDatePicker';

const steps = ['Select Patient', 'Choose Doctor & Schedule', 'Confirm Booking'];

interface BookingFormData {
  patient_mobile_number: string;
  patient_first_name: string;
  patient_uuid: string;
  doctor_id: string;
  office_id: string;
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
  const toast = useToast();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedOffice, setSelectedOffice] = useState<OfficeLocation | null>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [doctorSearch, setDoctorSearch] = useState('');
  const [patientPage, setPatientPage] = useState(1);
  const [doctorPage, setDoctorPage] = useState(1);
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
      office_id: '',
      appointment_date: null,
      appointment_time: '',
      reason_for_visit: '',
      contact_number: '',
      notes: '',
    },
  });

  const watchedDate = watch('appointment_date');
  const watchedDoctorId = watch('doctor_id');
  const watchedTime = watch('appointment_time');

  // API calls
  const { data: patientsData, isLoading: patientsLoading } = useListPatientsQuery({
    mobile_number: patientSearch.length >= 3 && !isNaN(Number(patientSearch)) ? patientSearch : undefined,
    first_name: patientSearch.length >= 2 && isNaN(Number(patientSearch)) ? patientSearch : undefined,
    page: patientPage,
    page_size: 9,
  });

  const { data: doctorsData, isLoading: doctorsLoading } = useListDoctorsQuery({
    is_active: true,
    specialization: doctorSearch.length >= 2 ? doctorSearch : undefined,
    page: doctorPage,
    per_page: 9,
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
    if (availabilityData?.available_slots) {
      try {
        // Process the TimeSlot objects and extract only available times
        const slots = availabilityData.available_slots
          .filter(slot => slot.is_available === true)
          .map(slot => slot.start_time)
          .filter(Boolean);

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

    // Auto-select primary office or first office if available
    if (doctor.offices && doctor.offices.length > 0) {
      const primaryOffice = doctor.offices.find(o => o.is_primary) || doctor.offices[0];
      setSelectedOffice(primaryOffice);
      setValue('office_id', primaryOffice.id);
    } else {
      setSelectedOffice(null);
      setValue('office_id', '');
    }
  };

  const handleOfficeSelect = (office: OfficeLocation) => {
    setSelectedOffice(office);
    setValue('office_id', office.id);
  };

  const handleTimeSelect = (time: string) => {
    setValue('appointment_time', time);
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const clearPatientSelection = () => {
    setSelectedPatient(null);
    setValue('patient_mobile_number', '');
    setValue('patient_first_name', '');
    setValue('patient_uuid', '');
    setValue('contact_number', '');
    setActiveStep(0);
  };

  const onSubmit = async (data: BookingFormData) => {
    try {
      if (!data.appointment_date) return;

      const appointmentData: AppointmentCreateRequest = {
        patient_mobile_number: data.patient_mobile_number,
        patient_first_name: data.patient_first_name,
        patient_uuid: data.patient_uuid,
        doctor_id: data.doctor_id,
        office_id: data.office_id || undefined,
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
        toast.warning('This time slot is no longer available. Please select a different time.');
        return;
      }

      const result = await createAppointment(appointmentData).unwrap();
      toast.success('Appointment booked successfully!');
      navigate('/doctor/appointments');
    } catch (error) {
      console.error('Failed to book appointment:', error);
      toast.error('Failed to book appointment. Please try again.');
    }
  };

  // Render sticky patient header
  const renderPatientHeader = () => {
    if (!selectedPatient) return null;

    return (
      <Paper
        elevation={0}
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          bgcolor: '#667eea',
          color: 'white',
          p: 2,
          mb: 3,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
          minHeight: 44,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'white', color: '#667eea', width: 48, height: 48 }}>
            <Person />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {selectedPatient.first_name} {selectedPatient.last_name}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Phone sx={{ fontSize: 14 }} />
              {selectedPatient.mobile_number}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={clearPatientSelection} sx={{ color: 'white' }}>
          <Close />
        </IconButton>
      </Paper>
    );
  };

  // Step 1: Patient Selection
  const renderPatientSelection = () => (
    <Fade in timeout={500}>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
          Select Patient
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Search by phone number or name
        </Typography>

        <TextField
          fullWidth
          placeholder="Search by phone number or patient name..."
          value={patientSearch}
          onChange={(e) => {
            setPatientSearch(e.target.value);
            setPatientPage(1);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 4 }}
        />

        {/* Content wrapper - flex layout for proper spacing */}
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          {patientsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : patientsData?.patients && patientsData.patients.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              {/* Grid layout for patients - shows more on wider screens */}
              <Grid container spacing={2} sx={{ alignContent: 'flex-start' }}>
                {patientsData.patients.map((patient) => (
                  <Grid item xs={12} sm={6} lg={4} key={patient.id}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        border: '2px solid',
                        borderColor: 'rgba(102, 126, 234, 0.15)',
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(10px)',
                        minHeight: 44,
                        '&:hover': {
                          bgcolor: 'rgba(102, 126, 234, 0.05)',
                          borderColor: '#667eea',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)',
                        }
                      }}
                      onClick={() => handlePatientSelect(patient)}
                      elevation={0}
                    >
                      <CardContent sx={{ py: 2, px: 2.5, '&:last-child': { pb: 2 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: '#667eea', width: 48, height: 48 }}>
                            <Person />
                          </Avatar>

                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              variant="subtitle1"
                              sx={{
                                fontWeight: 600,
                                fontSize: '1rem',
                                lineHeight: 1.3,
                                mb: 0.5,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {patient.first_name} {patient.last_name}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Phone sx={{ fontSize: 14 }} color="action" />
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                                  {patient.mobile_number}
                                </Typography>
                              </Box>
                              {patient.age && (
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                                  Age: {patient.age} years
                                </Typography>
                              )}
                            </Box>
                          </Box>

                          <CheckIcon sx={{ color: '#667eea', opacity: 0.3 }} />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {patientsData.total_pages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <Pagination
                    count={patientsData.total_pages}
                    page={patientPage}
                    onChange={(_, page) => setPatientPage(page)}
                    sx={{
                      '& .MuiPaginationItem-root': {
                        fontWeight: 700,
                        minHeight: 44,
                        minWidth: 44,
                        '&.Mui-selected': {
                          bgcolor: '#667eea',
                          color: 'white',
                          '&:hover': {
                            bgcolor: '#5568d3'
                          }
                        },
                        '&:not(.Mui-selected)': {
                          borderColor: 'rgba(102, 126, 234, 0.3)',
                          color: '#667eea',
                          '&:hover': {
                            bgcolor: 'rgba(102, 126, 234, 0.05)'
                          }
                        }
                      }
                    }}
                    size="large"
                  />
                </Box>
              )}
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
              <Alert severity="info">
                {patientSearch
                  ? 'No patients found matching your search.'
                  : 'Start typing to search for patients.'}
              </Alert>
            </Box>
          )}
        </Box>
      </Box>
    </Fade>
  );

  // Step 2: Doctor & Schedule Selection
  const renderDoctorSchedule = () => (
    <Fade in timeout={500}>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
          Choose Doctor & Schedule
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Select a doctor and pick an available time slot
        </Typography>

        {/* Doctor Selection */}
        <Box sx={{ mb: 5 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Select Doctor
          </Typography>

          <TextField
            fullWidth
            placeholder="Search doctors by specialization..."
            value={doctorSearch}
            onChange={(e) => {
              setDoctorSearch(e.target.value);
              setDoctorPage(1);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 3 }}
          />

          {/* Content wrapper - flex layout for proper spacing */}
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            {doctorsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : doctorsData?.doctors && doctorsData.doctors.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                {/* Grid layout for doctors - shows more on wider screens */}
                <Grid container spacing={2} sx={{ alignContent: 'flex-start' }}>
                  {doctorsData.doctors.map((doctor) => (
                    <Grid item xs={12} sm={6} lg={4} key={doctor.id}>
                      <Card
                        sx={{
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          border: '2px solid',
                          borderColor: selectedDoctor?.id === doctor.id ? '#667eea' : 'rgba(102, 126, 234, 0.15)',
                          background: selectedDoctor?.id === doctor.id ? 'rgba(102, 126, 234, 0.08)' : 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(10px)',
                          minHeight: 44,
                          '&:hover': {
                            borderColor: '#667eea',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)',
                          }
                        }}
                        onClick={() => handleDoctorSelect(doctor)}
                        elevation={0}
                      >
                        <CardContent sx={{ py: 2, px: 2.5, '&:last-child': { pb: 2 } }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: '#667eea', width: 48, height: 48 }}>
                              <LocalHospital />
                            </Avatar>

                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography
                                variant="subtitle1"
                                sx={{
                                  fontWeight: 600,
                                  fontSize: '1rem',
                                  lineHeight: 1.3,
                                  mb: 0.5,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                Dr. {doctor.first_name} {doctor.last_name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mb: 0.5 }}>
                                {doctor.specialization}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Rating value={doctor.rating || 4.5} precision={0.5} size="small" readOnly />
                                <Typography variant="caption" color="text.secondary">
                                  ({doctor.rating?.toFixed(1) || '4.5'})
                                </Typography>
                              </Box>
                            </Box>

                            {selectedDoctor?.id === doctor.id && (
                              <CheckCircle sx={{ color: '#667eea' }} />
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                {doctorsData.total_pages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Pagination
                      count={doctorsData.total_pages}
                      page={doctorPage}
                      onChange={(_, page) => setDoctorPage(page)}
                      sx={{
                        '& .MuiPaginationItem-root': {
                          fontWeight: 700,
                          minHeight: 44,
                          minWidth: 44,
                          '&.Mui-selected': {
                            bgcolor: '#667eea',
                            color: 'white',
                            '&:hover': {
                              bgcolor: '#5568d3'
                            }
                          },
                          '&:not(.Mui-selected)': {
                            borderColor: 'rgba(102, 126, 234, 0.3)',
                            color: '#667eea',
                            '&:hover': {
                              bgcolor: 'rgba(102, 126, 234, 0.05)'
                            }
                          }
                        }
                      }}
                    />
                  </Box>
                )}
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
                <Alert severity="info">No doctors available</Alert>
              </Box>
            )}
          </Box>
        </Box>

        {/* Office Selection - only show if doctor has multiple offices */}
        {selectedDoctor && selectedDoctor.offices && selectedDoctor.offices.length > 1 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Select Office Location
            </Typography>
            <Grid container spacing={2}>
              {selectedDoctor.offices.map((office) => (
                <Grid item xs={12} sm={6} key={office.id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      border: '2px solid',
                      borderColor: selectedOffice?.id === office.id ? '#667eea' : 'rgba(102, 126, 234, 0.15)',
                      background: selectedOffice?.id === office.id ? 'rgba(102, 126, 234, 0.08)' : 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(10px)',
                      minHeight: 44,
                      '&:hover': {
                        borderColor: '#667eea',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)',
                      }
                    }}
                    onClick={() => handleOfficeSelect(office)}
                    elevation={0}
                  >
                    <CardContent sx={{ py: 2, px: 2.5, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <LocationOn sx={{ color: selectedOffice?.id === office.id ? '#667eea' : 'text.secondary', mt: 0.5 }} />
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {office.name}
                            </Typography>
                            {office.is_primary && (
                              <Chip label="Primary" size="small" sx={{ bgcolor: '#667eea', color: 'white', fontWeight: 700 }} />
                            )}
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {office.address}
                          </Typography>
                        </Box>
                        {selectedOffice?.id === office.id && (
                          <CheckCircle sx={{ color: '#667eea' }} />
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Show single office info if doctor has only one office */}
        {selectedDoctor && selectedDoctor.offices && selectedDoctor.offices.length === 1 && (
          <Box sx={{ mb: 4 }}>
            <Alert severity="info" icon={<LocationOn />}>
              <Typography variant="body2">
                <strong>Office:</strong> {selectedDoctor.offices[0].name} - {selectedDoctor.offices[0].address}
              </Typography>
            </Alert>
          </Box>
        )}

        {/* Date & Time Selection */}
        {selectedDoctor && (
          <Slide direction="up" in mountOnEnter unmountOnExit>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Select Date & Time
              </Typography>

              <Grid container spacing={4}>
                <Grid item xs={12} md={5}>
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
                </Grid>

                <Grid item xs={12} md={7}>
                  {watchedDate && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                        Available time slots:
                      </Typography>
                      {availableSlots.length > 0 ? (
                        <Grid container spacing={1.5}>
                          {availableSlots.map((slot) => (
                            <Grid item xs={6} sm={4} md={3} key={slot}>
                              <Button
                                fullWidth
                                variant={watchedTime === slot ? 'contained' : 'outlined'}
                                onClick={() => handleTimeSelect(slot)}
                                sx={{
                                  py: 1.5,
                                  fontSize: '0.95rem',
                                  fontWeight: 700,
                                  minHeight: 44,
                                  transition: 'all 0.2s',
                                  ...(watchedTime === slot ? {
                                    bgcolor: '#667eea',
                                    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                                    '&:hover': {
                                      bgcolor: '#5568d3',
                                      transform: 'scale(1.05)',
                                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                                    }
                                  } : {
                                    borderColor: '#667eea',
                                    color: '#667eea',
                                    borderWidth: 2,
                                    '&:hover': {
                                      borderColor: '#667eea',
                                      borderWidth: 2,
                                      background: 'rgba(102, 126, 234, 0.05)',
                                      transform: 'scale(1.05)',
                                    }
                                  })
                                }}
                              >
                                <AccessTime sx={{ fontSize: 18, mr: 0.5 }} />
                                {slot}
                              </Button>
                            </Grid>
                          ))}
                        </Grid>
                      ) : (
                        <Alert severity="warning">No available slots for this date</Alert>
                      )}

                      {availabilityData?.available_slots && (
                        <Box sx={{ mt: 3 }}>
                          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                            Booked slots:
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                            {availabilityData.available_slots
                              .filter(slot => !slot.is_available)
                              .map((slot) => (
                                <Chip
                                  key={slot.start_time}
                                  label={slot.start_time}
                                  icon={<AccessTime />}
                                  sx={{
                                    bgcolor: 'grey.200',
                                    color: 'text.disabled',
                                    cursor: 'not-allowed',
                                  }}
                                />
                              ))}
                          </Box>
                        </Box>
                      )}
                    </Box>
                  )}
                </Grid>
              </Grid>

              {watchedTime && (
                <Box sx={{ mt: 4 }}>
                  <Controller
                    name="reason_for_visit"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        multiline
                        rows={3}
                        label="Reason for Visit"
                        placeholder="Brief description of the consultation reason..."
                        error={!!errors.reason_for_visit}
                        helperText={errors.reason_for_visit?.message}
                      />
                    )}
                  />
                </Box>
              )}
            </Box>
          </Slide>
        )}

        {/* Navigation Buttons */}
        <Box sx={{ display: 'flex', gap: 2, mt: 5 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={handleBack}
            size="large"
            sx={{
              minHeight: 44,
              borderColor: '#667eea',
              color: '#667eea',
              borderWidth: 2,
              fontWeight: 700,
              '&:hover': {
                borderColor: '#667eea',
                borderWidth: 2,
                background: 'rgba(102, 126, 234, 0.05)'
              }
            }}
          >
            Back
          </Button>
          <Button
            variant="contained"
            endIcon={<ArrowForward />}
            onClick={handleNext}
            disabled={!selectedDoctor || !watchedDate || !watchedTime}
            size="large"
            sx={{
              flex: 1,
              minHeight: 44,
              bgcolor: '#667eea',
              fontWeight: 700,
              boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
              '&:hover': {
                bgcolor: '#5568d3',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
              },
              '&:disabled': {
                bgcolor: 'rgba(102, 126, 234, 0.3)'
              }
            }}
          >
            Continue to Review
          </Button>
        </Box>
      </Box>
    </Fade>
  );

  // Step 3: Confirmation
  const renderConfirmation = () => (
    <Fade in timeout={500}>
      <Box>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <CheckCircle sx={{ fontSize: 64, color: '#10b981', mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
            Review Your Appointment
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please review the details before confirming
          </Typography>
        </Box>

        <Paper elevation={0} sx={{
          p: 4,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(102, 126, 234, 0.15)',
          borderRadius: 2
        }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="overline" color="text.secondary">
                Patient Information
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {selectedPatient?.first_name} {selectedPatient?.last_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <Phone sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                  {selectedPatient?.mobile_number}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="overline" color="text.secondary">
                Doctor Information
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Dr. {selectedDoctor?.first_name} {selectedDoctor?.last_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedDoctor?.specialization}
                </Typography>
              </Box>
            </Grid>

            {selectedOffice && (
              <Grid item xs={12}>
                <Typography variant="overline" color="text.secondary">
                  Office Location
                </Typography>
                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOn sx={{ color: '#667eea' }} />
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {selectedOffice.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedOffice.address}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            )}

            <Grid item xs={12} md={6}>
              <Typography variant="overline" color="text.secondary">
                Appointment Date
              </Typography>
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarToday sx={{ color: '#667eea' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {watchedDate ? new Date(watchedDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  }) : 'N/A'}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="overline" color="text.secondary">
                Appointment Time
              </Typography>
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccessTime sx={{ color: '#667eea' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {watchedTime || 'N/A'}
                </Typography>
              </Box>
            </Grid>

            {watch('reason_for_visit') && (
              <Grid item xs={12}>
                <Typography variant="overline" color="text.secondary">
                  Reason for Visit
                </Typography>
                <Typography variant="body1" sx={{ mt: 1 }}>
                  {watch('reason_for_visit')}
                </Typography>
              </Grid>
            )}
          </Grid>
        </Paper>

        <Box sx={{ mt: 4 }}>
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                multiline
                rows={2}
                label="Additional Notes (Optional)"
                placeholder="Any additional information..."
              />
            )}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={handleBack}
            size="large"
            disabled={creating}
            sx={{
              minHeight: 44,
              borderColor: '#667eea',
              color: '#667eea',
              borderWidth: 2,
              fontWeight: 700,
              '&:hover': {
                borderColor: '#667eea',
                borderWidth: 2,
                background: 'rgba(102, 126, 234, 0.05)'
              },
              '&:disabled': {
                borderColor: 'rgba(102, 126, 234, 0.3)',
                color: 'rgba(102, 126, 234, 0.3)'
              }
            }}
          >
            Back
          </Button>
          <Button
            variant="contained"
            endIcon={<CheckCircle />}
            onClick={handleSubmit(onSubmit)}
            disabled={creating}
            size="large"
            sx={{
              flex: 1,
              minHeight: 44,
              bgcolor: '#10b981',
              fontWeight: 700,
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
              '&:hover': {
                bgcolor: '#059669',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
              },
              '&:disabled': {
                bgcolor: 'rgba(16, 185, 129, 0.3)'
              }
            }}
          >
            {creating ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Confirm Appointment'}
          </Button>
        </Box>
      </Box>
    </Fade>
  );

  const renderStep = () => {
    switch (activeStep) {
      case 0:
        return renderPatientSelection();
      case 1:
        return renderDoctorSchedule();
      case 2:
        return renderConfirmation();
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg" disableGutters sx={{ mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: '#667eea',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
            }}
          >
            <EventIcon sx={{ fontSize: 24, color: 'white' }} />
          </Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
              color: '#667eea',
              letterSpacing: '-0.01em',
            }}
          >
            Book New Appointment
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Schedule appointments in three simple steps
        </Typography>
      </Box>

      {/* Stepper */}
      <Paper elevation={0} sx={{
        p: 3,
        mb: 4,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(102, 126, 234, 0.15)',
        borderRadius: 2
      }}>
        <Stepper
          activeStep={activeStep}
          sx={{
            '& .MuiStepLabel-root .Mui-completed': {
              color: '#10b981',
            },
            '& .MuiStepLabel-root .Mui-active': {
              color: '#667eea',
            },
            '& .MuiStepIcon-root.Mui-active': {
              color: '#667eea',
            },
            '& .MuiStepIcon-root.Mui-completed': {
              color: '#10b981',
            }
          }}
        >
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Sticky Patient Header */}
      {renderPatientHeader()}

      {/* Step Content */}
      <Paper elevation={0} sx={{
        p: { xs: 3, sm: 4, md: 5 },
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(102, 126, 234, 0.15)',
        borderRadius: 2
      }}>
        {renderStep()}
      </Paper>
    </Container>
  );
};
