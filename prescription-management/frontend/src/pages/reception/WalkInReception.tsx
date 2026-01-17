/**
 * WalkInReception Page - Redesigned
 * Queue-based walk-in patient handling with multi-select filters for clinics and doctors
 * iPad-first responsive design
 */
import React, { useState, useCallback, useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDroppable,
} from '@dnd-kit/core';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Snackbar,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Checkbox,
  ListItemText,
  SelectChangeEvent,
  Collapse,
  IconButton,
  Avatar,
  Divider,
  useMediaQuery,
  useTheme as useMuiTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  People as PeopleIcon,
  Queue as QueueIcon,
  PersonAdd as PersonAddIcon,
  FilterList as FilterIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Close as CloseIcon,
  LocationOn as LocationIcon,
  LocalHospital as DoctorIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import {
  useListDoctorsQuery,
  useGetDoctorAppointmentsQuery,
  useCreateAppointmentMutation,
  useGetTenantOfficesQuery,
  Patient,
  Doctor,
  Appointment,
  TenantOffice,
} from '../../store/api';
import { PatientLookup } from '../../components/reception/PatientLookup';
import { QuickPatientForm } from '../../components/reception/QuickPatientForm';
import { DraggablePatientCard } from '../../components/reception/DraggablePatientCard';
import { DoctorQueueColumn } from '../../components/reception/DoctorQueueColumn';
import PageContainer from '../../components/layout/PageContainer';
import theme from '../../theme/medicalFuturismTheme';

// Get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// Get next available time slot (rounds up to next 30 min)
const getNextTimeSlot = () => {
  const now = new Date();
  const minutes = now.getMinutes();
  const roundedMinutes = minutes < 30 ? 30 : 0;
  let hours = minutes < 30 ? now.getHours() : now.getHours() + 1;
  // Handle midnight wrap-around (hour 24 is invalid, use 00)
  if (hours >= 24) {
    hours = 0;
  }
  return `${hours.toString().padStart(2, '0')}:${roundedMinutes.toString().padStart(2, '0')}:00`;
};

export const WalkInReception: React.FC = () => {
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const isTablet = useMediaQuery(muiTheme.breakpoints.between('md', 'lg'));

  // State
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [registerMobile, setRegisterMobile] = useState('');
  const [isAddingFamilyMember, setIsAddingFamilyMember] = useState(false);
  const [primaryMemberName, setPrimaryMemberName] = useState<string | undefined>();
  const [activeDragPatient, setActiveDragPatient] = useState<Patient | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Filter state
  const [selectedClinics, setSelectedClinics] = useState<string[]>([]);
  const [selectedDoctors, setSelectedDoctors] = useState<string[]>([]);
  const [expandedDoctors, setExpandedDoctors] = useState<Set<string>>(new Set());

  // Quick Add Dialog state
  const [quickAddDialogOpen, setQuickAddDialogOpen] = useState(false);
  const [quickAddDoctorId, setQuickAddDoctorId] = useState<string>('');
  const [quickAddClinicId, setQuickAddClinicId] = useState<string>('');

  // Sensors for drag-and-drop with better touch support
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 8 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 200, tolerance: 8 },
  });
  const sensors = useSensors(mouseSensor, touchSensor);

  // API Queries
  const { data: officesData, isLoading: isLoadingOffices } = useGetTenantOfficesQuery();
  const { data: doctorsData, isLoading: isLoadingDoctors } = useListDoctorsQuery({
    is_active: true,
    per_page: 50,
  });

  const [createAppointment, { isLoading: isCreatingAppointment }] = useCreateAppointmentMutation();

  // Get today's date for appointment queries
  const today = useMemo(() => getTodayDate(), []);

  // Build clinic options from tenant offices
  const clinicOptions = useMemo(() => {
    return officesData?.offices || [];
  }, [officesData]);

  // Build doctor options - filtered by selected clinics
  const doctorOptions = useMemo(() => {
    const allDoctors = doctorsData?.doctors || [];

    if (selectedClinics.length === 0) {
      return allDoctors;
    }

    // Filter doctors that belong to selected clinics
    return allDoctors.filter(doctor => {
      if (!doctor.offices || doctor.offices.length === 0) return false;
      return doctor.offices.some(office => selectedClinics.includes(office.id));
    });
  }, [doctorsData, selectedClinics]);

  // Final filtered doctors to display
  const filteredDoctors = useMemo(() => {
    if (selectedDoctors.length === 0) {
      return doctorOptions;
    }
    return doctorOptions.filter(doctor => selectedDoctors.includes(doctor.id));
  }, [doctorOptions, selectedDoctors]);

  // Handlers
  const handleClinicFilterChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setSelectedClinics(typeof value === 'string' ? value.split(',') : value);
    // Reset doctor filter when clinic changes (doctors may no longer be valid)
    setSelectedDoctors([]);
  };

  const handleDoctorFilterChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setSelectedDoctors(typeof value === 'string' ? value.split(',') : value);
  };

  const handleRemoveClinicFilter = (clinicId: string) => {
    setSelectedClinics(prev => prev.filter(id => id !== clinicId));
    setSelectedDoctors([]); // Reset doctor filter
  };

  const handleRemoveDoctorFilter = (doctorId: string) => {
    setSelectedDoctors(prev => prev.filter(id => id !== doctorId));
  };

  const handleClearAllFilters = () => {
    setSelectedClinics([]);
    setSelectedDoctors([]);
  };

  const handlePatientSelect = useCallback((patient: Patient | null) => {
    setSelectedPatient(patient);
    setShowRegisterForm(false);
  }, []);

  const handleShowRegisterForm = useCallback((mobile: string, addingToFamily: boolean, primaryName?: string) => {
    setRegisterMobile(mobile);
    setIsAddingFamilyMember(addingToFamily);
    setPrimaryMemberName(primaryName);
    setShowRegisterForm(true);
  }, []);

  const handleRegisterSuccess = useCallback((patient: Patient) => {
    setSelectedPatient(patient);
    setShowRegisterForm(false);
    setSnackbar({
      open: true,
      message: `Patient "${patient.full_name}" registered successfully!`,
      severity: 'success',
    });
  }, []);

  const handleRegisterCancel = useCallback(() => {
    setShowRegisterForm(false);
    setRegisterMobile('');
    setIsAddingFamilyMember(false);
    setPrimaryMemberName(undefined);
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'patient') {
      setActiveDragPatient(active.data.current.patient);
    }
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragPatient(null);

    if (!over) return;

    // Check if dropped on a doctor queue
    if (over.data.current?.type === 'queue' && active.data.current?.type === 'patient') {
      const { doctorId, officeId } = over.data.current;

      if (!selectedPatient) return;

      try {
        await createAppointment({
          patient_mobile_number: selectedPatient.mobile_number,
          patient_first_name: selectedPatient.first_name,
          patient_uuid: selectedPatient.id,
          doctor_id: doctorId,
          office_id: officeId,
          appointment_date: today,
          appointment_time: getNextTimeSlot(),
          duration_minutes: 30,
          reason_for_visit: 'Walk-in appointment',
          appointment_type: 'walk_in',
        }).unwrap();

        setSnackbar({
          open: true,
          message: `${selectedPatient.full_name} added to queue`,
          severity: 'success',
        });

        // Clear selected patient after successful booking
        setSelectedPatient(null);
      } catch (err: any) {
        console.error('Failed to create appointment:', err);
        setSnackbar({
          open: true,
          message: err?.data?.detail || 'Failed to add patient to queue',
          severity: 'error',
        });
      }
    }
  }, [selectedPatient, today, createAppointment]);

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  const handleStartNewRegistration = useCallback(() => {
    setShowRegisterForm(true);
    setRegisterMobile('');
    setSelectedPatient(null);
    setIsAddingFamilyMember(false);
    setPrimaryMemberName(undefined);
  }, []);

  const handleToggleDoctorExpand = (doctorId: string) => {
    setExpandedDoctors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(doctorId)) {
        newSet.delete(doctorId);
      } else {
        newSet.add(doctorId);
      }
      return newSet;
    });
  };

  // Quick Add Dialog handlers
  const handleOpenQuickAdd = () => {
    if (filteredDoctors.length > 0) {
      setQuickAddDoctorId(filteredDoctors[0].id);
      // Set default clinic if doctor has offices
      const defaultDoctor = filteredDoctors[0];
      if (defaultDoctor.offices && defaultDoctor.offices.length > 0) {
        const primaryOffice = defaultDoctor.offices.find(o => o.is_primary) || defaultDoctor.offices[0];
        setQuickAddClinicId(primaryOffice.id);
      }
    }
    setQuickAddDialogOpen(true);
  };

  const handleQuickAddDoctorChange = (event: SelectChangeEvent<string>) => {
    const doctorId = event.target.value;
    setQuickAddDoctorId(doctorId);
    // Update clinic to doctor's primary office
    const doctor = filteredDoctors.find(d => d.id === doctorId);
    if (doctor?.offices && doctor.offices.length > 0) {
      const primaryOffice = doctor.offices.find(o => o.is_primary) || doctor.offices[0];
      setQuickAddClinicId(primaryOffice.id);
    } else {
      setQuickAddClinicId('');
    }
  };

  const handleQuickAddConfirm = async () => {
    if (!selectedPatient || !quickAddDoctorId) return;

    try {
      await createAppointment({
        patient_mobile_number: selectedPatient.mobile_number,
        patient_first_name: selectedPatient.first_name,
        patient_uuid: selectedPatient.id,
        doctor_id: quickAddDoctorId,
        office_id: quickAddClinicId || undefined,
        appointment_date: today,
        appointment_time: getNextTimeSlot(),
        duration_minutes: 30,
        reason_for_visit: 'Walk-in appointment',
        appointment_type: 'walk_in',
      }).unwrap();

      setSnackbar({
        open: true,
        message: `${selectedPatient.full_name} added to queue`,
        severity: 'success',
      });

      setSelectedPatient(null);
      setQuickAddDialogOpen(false);
    } catch (err: any) {
      console.error('Failed to create appointment:', err);
      setSnackbar({
        open: true,
        message: err?.data?.detail || 'Failed to add patient to queue',
        severity: 'error',
      });
    }
  };

  // Get doctor name helper
  const getDoctorName = (doctor: Doctor) => {
    if (doctor.first_name || doctor.last_name) {
      return `Dr. ${doctor.first_name || ''} ${doctor.last_name || ''}`.trim();
    }
    return `Doctor ${doctor.license_number}`;
  };

  // Get clinic name by id
  const getClinicName = (clinicId: string) => {
    const clinic = clinicOptions.find(c => c.id === clinicId);
    return clinic?.name || 'Unknown Clinic';
  };

  const hasActiveFilters = selectedClinics.length > 0 || selectedDoctors.length > 0;

  return (
    <PageContainer maxWidth="full">
      {/* Page Header */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
          }}
        >
          <PeopleIcon sx={{ fontSize: 24 }} />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={600}>Walk-In Reception</Typography>
          <Typography variant="body2" color="text.secondary">
            Quick patient registration and queue management
          </Typography>
        </Box>
      </Box>

      {/* Filter Bar */}
      <Paper
        elevation={0}
        sx={{
          ...theme.components.glassPaper,
          p: 2,
          mb: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <FilterIcon color="primary" fontSize="small" />
          <Typography variant="subtitle2" fontWeight={600}>
            Filter by Clinic & Doctor
          </Typography>
          {hasActiveFilters && (
            <Button
              size="small"
              onClick={handleClearAllFilters}
              sx={{ ml: 'auto', fontSize: '0.75rem' }}
            >
              Clear All
            </Button>
          )}
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
          }}
        >
          {/* Clinic Multi-Select */}
          <FormControl size="small" sx={{ minWidth: 200, flex: 1 }}>
            <InputLabel>Clinics</InputLabel>
            <Select
              multiple
              value={selectedClinics}
              onChange={handleClinicFilterChange}
              input={<OutlinedInput label="Clinics" />}
              renderValue={(selected) => `${selected.length} clinic${selected.length !== 1 ? 's' : ''} selected`}
              disabled={isLoadingOffices}
            >
              {clinicOptions.map((clinic) => (
                <MenuItem key={clinic.id} value={clinic.id}>
                  <Checkbox checked={selectedClinics.includes(clinic.id)} size="small" />
                  <ListItemText
                    primary={clinic.name || 'Unnamed Clinic'}
                    secondary={`${clinic.doctors.length} doctor${clinic.doctors.length !== 1 ? 's' : ''}`}
                  />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Doctor Multi-Select */}
          <FormControl size="small" sx={{ minWidth: 200, flex: 1 }}>
            <InputLabel>Doctors</InputLabel>
            <Select
              multiple
              value={selectedDoctors}
              onChange={handleDoctorFilterChange}
              input={<OutlinedInput label="Doctors" />}
              renderValue={(selected) => `${selected.length} doctor${selected.length !== 1 ? 's' : ''} selected`}
              disabled={isLoadingDoctors}
            >
              {doctorOptions.map((doctor) => (
                <MenuItem key={doctor.id} value={doctor.id}>
                  <Checkbox checked={selectedDoctors.includes(doctor.id)} size="small" />
                  <ListItemText
                    primary={getDoctorName(doctor)}
                    secondary={doctor.specialization || 'General'}
                  />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
            {selectedClinics.map((clinicId) => (
              <Chip
                key={clinicId}
                icon={<LocationIcon sx={{ fontSize: 16 }} />}
                label={getClinicName(clinicId)}
                size="small"
                onDelete={() => handleRemoveClinicFilter(clinicId)}
                sx={{
                  bgcolor: 'rgba(16, 185, 129, 0.1)',
                  color: '#059669',
                  '& .MuiChip-deleteIcon': { color: '#059669' },
                }}
              />
            ))}
            {selectedDoctors.map((doctorId) => {
              const doctor = doctorOptions.find(d => d.id === doctorId);
              return (
                <Chip
                  key={doctorId}
                  icon={<DoctorIcon sx={{ fontSize: 16 }} />}
                  label={doctor ? getDoctorName(doctor) : 'Unknown'}
                  size="small"
                  onDelete={() => handleRemoveDoctorFilter(doctorId)}
                  sx={{
                    bgcolor: 'rgba(102, 126, 234, 0.1)',
                    color: '#667eea',
                    '& .MuiChip-deleteIcon': { color: '#667eea' },
                  }}
                />
              );
            })}
          </Box>
        )}
      </Paper>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 2,
            minHeight: { xs: 'auto', md: 'calc(100vh - 350px)' },
          }}
        >
          {/* Left Panel - Patient Lookup & Registration */}
          <Box
            sx={{
              width: { xs: '100%', md: 380 },
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            {/* Patient Lookup */}
            <PatientLookup
              onPatientSelect={handlePatientSelect}
              onShowRegisterForm={handleShowRegisterForm}
              selectedPatient={selectedPatient}
            />

            {/* Quick Register Button (always visible) */}
            {!showRegisterForm && (
              <Button
                variant="outlined"
                color="primary"
                startIcon={<PersonAddIcon />}
                onClick={handleStartNewRegistration}
                fullWidth
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  borderStyle: 'dashed',
                }}
              >
                Register New Patient
              </Button>
            )}

            {/* Quick Registration Form */}
            {showRegisterForm && (
              <QuickPatientForm
                initialMobile={registerMobile}
                onSuccess={handleRegisterSuccess}
                onCancel={handleRegisterCancel}
                isAddingFamilyMember={isAddingFamilyMember}
                primaryMemberName={primaryMemberName}
              />
            )}

            {/* Selected Patient Card with Quick Add */}
            {selectedPatient && !showRegisterForm && (
              <Paper
                elevation={0}
                sx={{
                  ...theme.components.glassPaper,
                  p: 2,
                }}
              >
                <Typography
                  variant="subtitle2"
                  fontWeight={600}
                  sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <QueueIcon color="primary" fontSize="small" />
                  Add to Queue
                </Typography>

                <DraggablePatientCard patient={selectedPatient} />

                {/* Quick Add Button */}
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<AddIcon />}
                  onClick={handleOpenQuickAdd}
                  disabled={filteredDoctors.length === 0}
                  sx={{
                    mt: 2,
                    ...theme.components.primaryButton,
                  }}
                >
                  Quick Add to Queue
                </Button>

                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', mt: 1.5, textAlign: 'center' }}
                >
                  Or drag the patient card to a doctor's queue
                </Typography>
              </Paper>
            )}
          </Box>

          {/* Right Panel - Doctor Queues */}
          <Box
            sx={{
              flex: 1,
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Typography
              variant="subtitle1"
              fontWeight={600}
              sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <QueueIcon color="primary" />
              Patient Queues ({filteredDoctors.length} Doctor{filteredDoctors.length !== 1 ? 's' : ''})
            </Typography>

            {isLoadingDoctors ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : filteredDoctors.length === 0 ? (
              <Alert severity="info">
                {doctorsData?.doctors?.length === 0
                  ? 'No active doctors found.'
                  : 'No doctors match the selected filters.'}
              </Alert>
            ) : (
              <Box
                sx={{
                  flex: 1,
                  overflow: 'auto',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 2,
                  alignContent: 'flex-start',
                  pb: 2,
                }}
              >
                {filteredDoctors.map((doctor) => (
                  <DoctorQueueWithAppointments
                    key={doctor.id}
                    doctor={doctor}
                    date={today}
                    expanded={filteredDoctors.length <= 2}
                    isExpanded={expandedDoctors.has(doctor.id)}
                    onToggleExpand={() => handleToggleDoctorExpand(doctor.id)}
                    compactMode={filteredDoctors.length > 2 && !isMobile}
                    filteredClinicIds={selectedClinics}
                  />
                ))}
              </Box>
            )}
          </Box>
        </Box>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeDragPatient && (
            <DraggablePatientCard patient={activeDragPatient} isDragging />
          )}
        </DragOverlay>
      </DndContext>

      {/* Quick Add Dialog */}
      <Dialog
        open={quickAddDialogOpen}
        onClose={() => setQuickAddDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AddIcon color="primary" />
          Add to Queue
        </DialogTitle>
        <DialogContent>
          {selectedPatient && (
            <Box sx={{ mb: 2, p: 2, bgcolor: 'rgba(102, 126, 234, 0.05)', borderRadius: 2 }}>
              <Typography variant="subtitle2" fontWeight={600}>
                {selectedPatient.full_name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {selectedPatient.mobile_number}
              </Typography>
            </Box>
          )}

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Select Doctor</InputLabel>
            <Select
              value={quickAddDoctorId}
              onChange={handleQuickAddDoctorChange}
              label="Select Doctor"
            >
              {filteredDoctors.map((doctor) => (
                <MenuItem key={doctor.id} value={doctor.id}>
                  <Box>
                    <Typography variant="body2">{getDoctorName(doctor)}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {doctor.specialization || 'General'}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {quickAddDoctorId && (
            <FormControl fullWidth>
              <InputLabel>Select Clinic (Optional)</InputLabel>
              <Select
                value={quickAddClinicId}
                onChange={(e) => setQuickAddClinicId(e.target.value)}
                label="Select Clinic (Optional)"
              >
                <MenuItem value="">
                  <em>Default</em>
                </MenuItem>
                {filteredDoctors
                  .find(d => d.id === quickAddDoctorId)
                  ?.offices?.map((office) => (
                    <MenuItem key={office.id} value={office.id}>
                      <Box>
                        <Typography variant="body2">{office.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {office.address}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQuickAddDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleQuickAddConfirm}
            disabled={!quickAddDoctorId || isCreatingAppointment}
            sx={theme.components.primaryButton}
          >
            {isCreatingAppointment ? <CircularProgress size={20} /> : 'Add to Queue'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Creating Appointment Overlay */}
      {isCreatingAppointment && !quickAddDialogOpen && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={24} />
            <Typography>Adding to queue...</Typography>
          </Paper>
        </Box>
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </PageContainer>
  );
};

/**
 * Individual doctor queue with its own appointment query
 */
interface DoctorQueueWithAppointmentsProps {
  doctor: Doctor;
  date: string;
  expanded?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  compactMode?: boolean;
  filteredClinicIds?: string[];
}

const DoctorQueueWithAppointments: React.FC<DoctorQueueWithAppointmentsProps> = ({
  doctor,
  date,
  expanded = false,
  isExpanded = false,
  onToggleExpand,
  compactMode = false,
  filteredClinicIds = [],
}) => {
  const { data: appointmentsData, isLoading } = useGetDoctorAppointmentsQuery(
    { doctorId: doctor.id, date },
    { pollingInterval: 30000 } // Poll every 30 seconds
  );

  const appointments = appointmentsData?.appointments || [];

  // In compact mode, show a collapsible card
  if (compactMode) {
    return (
      <CompactDoctorQueue
        doctor={doctor}
        appointments={appointments}
        isLoading={isLoading}
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
        filteredClinicIds={filteredClinicIds}
      />
    );
  }

  return (
    <DoctorQueueColumn
      doctor={doctor}
      appointments={appointments}
      isLoading={isLoading}
      expanded={expanded}
      filteredClinicIds={filteredClinicIds}
    />
  );
};

/**
 * Compact Doctor Queue Card - for when there are many doctors
 */
interface CompactDoctorQueueProps {
  doctor: Doctor;
  appointments: Appointment[];
  isLoading: boolean;
  isExpanded: boolean;
  onToggleExpand?: () => void;
  filteredClinicIds?: string[];
}

const CompactDoctorQueue: React.FC<CompactDoctorQueueProps> = ({
  doctor,
  appointments,
  isLoading,
  isExpanded,
  onToggleExpand,
  filteredClinicIds = [],
}) => {
  // Get the relevant office based on filter, or primary office
  const getRelevantOffice = () => {
    if (doctor.offices && doctor.offices.length > 0) {
      // If filtering by clinic, find the matching clinic
      if (filteredClinicIds.length > 0) {
        const matchingOffice = doctor.offices.find(o => filteredClinicIds.includes(o.id));
        if (matchingOffice) return matchingOffice;
      }
      // Otherwise return primary or first office
      return doctor.offices.find(o => o.is_primary) || doctor.offices[0];
    }
    return undefined;
  };

  const relevantOffice = getRelevantOffice();

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `doctor-queue-${doctor.id}`,
    data: {
      type: 'queue',
      doctorId: doctor.id,
      officeId: relevantOffice?.id,
    },
  });

  // Filter active appointments - also filter by clinic if filter is active
  const queuedAppointments = useMemo(() => {
    return appointments
      .filter(apt => apt.status !== 'completed' && apt.status !== 'cancelled')
      .filter(apt => {
        // If clinic filter is active, only show appointments for that clinic
        if (filteredClinicIds.length > 0) {
          return apt.office_id && filteredClinicIds.includes(apt.office_id);
        }
        return true; // No filter, show all
      })
      .sort((a, b) => {
        if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
        if (b.status === 'in_progress' && a.status !== 'in_progress') return 1;
        return (a.appointment_time || '').localeCompare(b.appointment_time || '');
      });
  }, [appointments, filteredClinicIds]);

  const getDoctorName = () => {
    if (doctor.first_name || doctor.last_name) {
      return `Dr. ${doctor.first_name || ''} ${doctor.last_name || ''}`.trim();
    }
    return `Doctor ${doctor.license_number}`;
  };

  const getInitials = () => {
    const first = doctor.first_name?.[0] || '';
    const last = doctor.last_name?.[0] || '';
    return (first + last).toUpperCase() || 'DR';
  };

  // Get clinic name from relevant office
  const getClinicName = () => {
    if (relevantOffice) {
      return relevantOffice.name || relevantOffice.address?.split(',')[0] || 'Clinic';
    }
    return '';
  };

  const waitingCount = queuedAppointments.filter(a => a.status === 'scheduled').length;
  const inProgressCount = queuedAppointments.filter(a => a.status === 'in_progress').length;

  return (
    <Paper
      ref={setDropRef}
      elevation={0}
      sx={{
        width: { xs: '100%', sm: 'calc(50% - 8px)', lg: 'calc(33.333% - 11px)' },
        minWidth: 280,
        borderRadius: 3,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        border: isOver ? '2px solid #667eea' : '1px solid rgba(102, 126, 234, 0.1)',
        overflow: 'hidden',
        transition: 'all 0.2s',
      }}
    >
      {/* Header - Always Visible */}
      <Box
        sx={{
          p: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          cursor: 'pointer',
          '&:hover': { bgcolor: 'rgba(102, 126, 234, 0.03)' },
        }}
        onClick={onToggleExpand}
      >
        <Avatar
          sx={{
            width: 40,
            height: 40,
            bgcolor: 'primary.main',
            fontSize: '0.875rem',
          }}
        >
          {getInitials()}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="subtitle2"
            fontWeight={600}
            sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {getDoctorName()}
          </Typography>
          {getClinicName() && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', mb: 0.5 }}
            >
              {getClinicName()}
            </Typography>
          )}
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Chip
              size="small"
              label={`${queuedAppointments.length} in queue`}
              sx={{ height: 20, fontSize: '0.65rem' }}
            />
            {inProgressCount > 0 && (
              <Chip
                size="small"
                label={`${inProgressCount} active`}
                sx={{
                  height: 20,
                  fontSize: '0.65rem',
                  bgcolor: 'rgba(245, 158, 11, 0.1)',
                  color: '#F59E0B',
                }}
              />
            )}
          </Box>
        </Box>
        <IconButton size="small">
          {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      {/* Expanded Content */}
      <Collapse in={isExpanded}>
        <Divider />
        <Box sx={{ p: 1.5, maxHeight: 300, overflow: 'auto' }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={20} />
            </Box>
          ) : queuedAppointments.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              No patients in queue
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {queuedAppointments.map((apt, index) => (
                <Box
                  key={apt.id}
                  sx={{
                    p: 1,
                    borderRadius: 1,
                    bgcolor: apt.status === 'in_progress' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(102, 126, 234, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.65rem',
                      fontWeight: 600,
                    }}
                  >
                    {index + 1}
                  </Typography>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      fontWeight={500}
                      sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {apt.patient_full_name || `${apt.patient_first_name} ${apt.patient_last_name || ''}`.trim() || 'Unknown Patient'}
                    </Typography>
                  </Box>
                  {apt.status === 'in_progress' && (
                    <Chip
                      label="In Consultation"
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: '0.6rem',
                        bgcolor: '#F59E0B',
                        color: 'white',
                      }}
                    />
                  )}
                </Box>
              ))}
            </Box>
          )}
        </Box>

        {/* Drop Zone */}
        <Box
          sx={{
            p: 1,
            mx: 1.5,
            mb: 1.5,
            borderRadius: 1,
            border: isOver ? '2px dashed #667eea' : '2px dashed rgba(0,0,0,0.1)',
            bgcolor: isOver ? 'rgba(102, 126, 234, 0.05)' : 'transparent',
            textAlign: 'center',
            transition: 'all 0.2s',
          }}
        >
          <Typography variant="caption" color={isOver ? 'primary.main' : 'text.disabled'}>
            {isOver ? 'Drop to add' : 'Drop patient here'}
          </Typography>
        </Box>
      </Collapse>

      {/* Mini Drop Zone when collapsed */}
      {!isExpanded && (
        <Box
          sx={{
            px: 1.5,
            pb: 1.5,
            pt: 0.5,
          }}
        >
          <Box
            sx={{
              py: 0.75,
              borderRadius: 1,
              border: isOver ? '2px dashed #667eea' : '1px dashed rgba(0,0,0,0.1)',
              bgcolor: isOver ? 'rgba(102, 126, 234, 0.05)' : 'transparent',
              textAlign: 'center',
              transition: 'all 0.2s',
            }}
          >
            <Typography variant="caption" color={isOver ? 'primary.main' : 'text.disabled'}>
              {isOver ? '+ Drop to add' : '+ Drop patient'}
            </Typography>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default WalkInReception;
