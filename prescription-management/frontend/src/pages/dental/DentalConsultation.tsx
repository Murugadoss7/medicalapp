/**
 * Dental Consultation Page
 * Main page for dental consultations integrating all dental components
 * Allows doctors to record observations, procedures, and view patient dental history
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  IconButton,
  Breadcrumbs,
  Link,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  History as HistoryIcon,
  MedicalServices as ProcedureIcon,
  CheckCircle,
  PlayArrow,
  Home,
  TableChart as SummaryIcon,
} from '@mui/icons-material';
import { useParams, useNavigate, useBlocker } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { type RootState } from '../../store';
import {
  DentalChart,
  DentalObservationForm,
  DentalProcedureForm,
  ToothHistoryViewer,
  DentalPrescriptionBuilder,
  DentalSummaryTable,
} from '../../components/dental';
import PrescriptionViewer from '../../components/dental/PrescriptionViewer';
import dentalService, { type DentalChart as DentalChartType } from '../../services/dentalService';
import {
  useGetAppointmentDetailsQuery,
  useGetPatientMedicalHistoryQuery,
  useGetCurrentUserQuery,
  useUpdateAppointmentStatusMutation,
} from '../../store/api';
import { useToast } from '../../components/common/Toast';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

const DentalConsultation: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  // Get logged-in user from Redux store
  const user = useSelector((state: RootState) => state.auth.user);

  // Fetch current user info to get doctor_id
  const { data: currentUserData, isLoading: isLoadingCurrentUser } = useGetCurrentUserQuery();

  // Get doctor_id from API response (preferred) or Redux fallback
  const doctorId = currentUserData?.doctor_id || user?.doctor_id;

  // Status update mutation
  const [updateStatus, { isLoading: isUpdatingStatus }] = useUpdateAppointmentStatusMutation();

  // Show warning if doctor_id is not available
  React.useEffect(() => {
    if (!isLoadingCurrentUser && !doctorId) {
      console.warn('Doctor ID not available. Please ensure you are logged in as a doctor.');
    }
  }, [isLoadingCurrentUser, doctorId]);

  // Fetch appointment details
  const {
    data: appointmentDetails,
    isLoading: appointmentLoading,
    error: appointmentError,
    refetch: refetchAppointment,
  } = useGetAppointmentDetailsQuery(appointmentId || '', { skip: !appointmentId });

  // Patient info from appointment
  const [patientData, setPatientData] = useState({
    mobileNumber: '',
    firstName: '',
  });

  // Navigation guard state
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Update patient data when appointment details are loaded
  useEffect(() => {
    if (appointmentDetails) {
      // Try patient_details first, fallback to appointment fields
      const mobileNumber = appointmentDetails.patient_details?.mobile_number ||
                          appointmentDetails.patient_mobile_number || '';
      const firstName = appointmentDetails.patient_details?.first_name ||
                       appointmentDetails.patient_first_name || '';

      setPatientData({
        mobileNumber,
        firstName,
      });

      // Auto-update status to in_progress if scheduled
      if (appointmentDetails.status === 'scheduled') {
        handleUpdateStatus('in_progress');
      }
    }
  }, [appointmentDetails]);

  // Fetch prescriptions for this patient
  const { data: allPrescriptions, refetch: refetchPrescriptions } = useGetPatientMedicalHistoryQuery(
    {
      patientMobile: patientData.mobileNumber,
      patientName: patientData.firstName,
      limit: 10,
    },
    { skip: !patientData.mobileNumber || !patientData.firstName }
  );

  // Filter prescriptions to only show those created by the current doctor
  const patientPrescriptions = React.useMemo(() => {
    if (!allPrescriptions) return [];
    // Use logged-in doctor_id if available, otherwise use appointment's doctor_id as fallback
    const currentDoctorId = doctorId || appointmentDetails?.doctor_id;
    if (!currentDoctorId) return [];
    return allPrescriptions.filter(
      (prescription) => prescription.doctor_id === currentDoctorId
    );
  }, [allPrescriptions, doctorId, appointmentDetails]);

  // State
  const [dentalChart, setDentalChart] = useState<DentalChartType | null>(null);
  const [selectedTooth, setSelectedTooth] = useState<string | null>(null);
  const [selectedToothData, setSelectedToothData] = useState<any>(null);
  const [showObservationForm, setShowObservationForm] = useState(false);
  const [showProcedureForm, setShowProcedureForm] = useState(false);
  const [showToothHistory, setShowToothHistory] = useState(false);
  const [showPrescriptionDialog, setShowPrescriptionDialog] = useState(false);
  const [createdPrescriptionId, setCreatedPrescriptionId] = useState<string | null>(null);
  const [selectedPrescriptionIndex, setSelectedPrescriptionIndex] = useState(0); // For tabbed prescriptions
  const [showSummaryDialog, setShowSummaryDialog] = useState(false); // For holistic view
  const [loading, setLoading] = useState(false);

  // Load dental chart data
  useEffect(() => {
    if (patientData.mobileNumber && patientData.firstName) {
      loadDentalChart();
    }
  }, [patientData]);

  const loadDentalChart = async () => {
    try {
      setLoading(true);
      const chart = await dentalService.chart.getChart(
        patientData.mobileNumber,
        patientData.firstName
      );
      setDentalChart(chart);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to load dental chart');
    } finally {
      setLoading(false);
    }
  };

  // Handle status update
  const handleUpdateStatus = async (newStatus: string) => {
    if (!appointmentId) return;

    try {
      await updateStatus({
        appointmentId,
        status: newStatus,
      }).unwrap();

      refetchAppointment();

      if (newStatus === 'completed') {
        toast.success('Consultation completed successfully!');
      } else if (newStatus === 'in_progress') {
        toast.info('Consultation started');
      }
    } catch (error: any) {
      toast.error(error?.data?.detail || 'Failed to update appointment status');
    }
  };

  // Handle complete consultation
  const handleCompleteConsultation = async () => {
    await handleUpdateStatus('completed');
    navigate('/doctor/dashboard');
  };

  // Handle navigation with status check
  const handleNavigateAway = useCallback((destination: string) => {
    if (appointmentDetails?.status === 'in_progress') {
      setPendingNavigation(() => () => navigate(destination));
      setShowExitDialog(true);
    } else {
      navigate(destination);
    }
  }, [appointmentDetails?.status, navigate]);

  // Handle exit dialog response
  const handleExitDialogResponse = async (completed: boolean) => {
    setShowExitDialog(false);

    if (completed) {
      await handleUpdateStatus('completed');
      toast.success('Consultation marked as completed');
    }
    // Keep status as in_progress if not completed

    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
  };

  // Update selectedToothData when dentalChart changes (for real-time updates)
  useEffect(() => {
    if (selectedTooth && dentalChart?.teeth) {
      const toothData = dentalChart.teeth.find(t => t.tooth_number === selectedTooth);
      setSelectedToothData(toothData || null);
    }
  }, [dentalChart, selectedTooth]);

  // Handle tooth click
  const handleToothClick = (toothNumber: string) => {
    setSelectedTooth(toothNumber);
    // Find the tooth data from the chart
    const toothData = dentalChart?.teeth.find(t => t.tooth_number === toothNumber);
    setSelectedToothData(toothData || null);
    setHasUnsavedChanges(true);
  };

  // Handle add observation
  const handleAddObservation = () => {
    if (!selectedTooth) {
      toast.warning('Please select a tooth first');
      return;
    }
    setShowObservationForm(true);
  };

  // Handle add procedure
  const handleAddProcedure = () => {
    if (!selectedTooth) {
      toast.warning('Please select a tooth first');
      return;
    }
    setShowProcedureForm(true);
  };

  // Handle view tooth history
  const handleViewHistory = () => {
    if (!selectedTooth) {
      toast.warning('Please select a tooth first');
      return;
    }
    setShowToothHistory(true);
  };

  // Handle observation form submit
  const handleObservationSubmit = async (data: any) => {
    try {
      setLoading(true);

      await dentalService.observations.create({
        ...data,
        appointment_id: appointmentId,
        patient_mobile_number: patientData.mobileNumber,
        patient_first_name: patientData.firstName,
        tooth_number: data.toothNumber,
        tooth_surface: data.toothSurface,
        condition_type: data.conditionType,
        observation_notes: data.observationNotes,
        treatment_required: data.treatmentRequired,
        treatment_done: data.treatmentDone,
        treatment_date: data.treatmentDate?.toISOString().split('T')[0],
      });

      toast.success('Observation added successfully');
      setShowObservationForm(false);
      loadDentalChart(); // Reload chart
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to add observation');
    } finally {
      setLoading(false);
    }
  };

  // Handle procedure form submit
  const handleProcedureSubmit = async (data: any) => {
    try {
      setLoading(true);

      await dentalService.procedures.create({
        appointment_id: appointmentId,
        procedure_code: data.procedureCode,
        procedure_name: data.procedureName,
        tooth_numbers: data.toothNumbers,
        description: data.description,
        estimated_cost: data.estimatedCost,
        actual_cost: data.actualCost,
        duration_minutes: data.durationMinutes,
        status: data.status,
        procedure_date: data.procedureDate?.toISOString().split('T')[0],
        completed_date: data.completedDate?.toISOString().split('T')[0],
        procedure_notes: data.procedureNotes,
        complications: data.complications,
      });

      toast.success('Procedure added successfully');
      setShowProcedureForm(false);
      loadDentalChart(); // Reload chart
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to add procedure');
    } finally {
      setLoading(false);
    }
  };

  // Convert dental chart data to tooth data for chart component
  const toothData = dentalChart?.teeth.map(tooth => {
    // Count completed procedures
    const completedProcedures = tooth.procedures.filter(p => p.status === 'completed');
    const inProgressProcedures = tooth.procedures.filter(p => p.status === 'in_progress');
    const plannedProcedures = tooth.procedures.filter(p => p.status === 'planned');

    // Determine overall procedure status for the tooth
    let procedureStatus: 'planned' | 'in_progress' | 'completed' | undefined;
    if (completedProcedures.length > 0 && completedProcedures.length === tooth.procedures.length) {
      procedureStatus = 'completed'; // All procedures completed
    } else if (completedProcedures.length > 0) {
      procedureStatus = 'in_progress'; // Some completed, some pending
    } else if (inProgressProcedures.length > 0) {
      procedureStatus = 'in_progress';
    } else if (plannedProcedures.length > 0) {
      procedureStatus = 'planned';
    }

    return {
      toothNumber: tooth.tooth_number,
      hasObservation: tooth.observations.length > 0,
      hasProcedure: tooth.procedures.length > 0,
      hasActiveIssue: tooth.has_active_issues,
      conditionType: tooth.observations.length > 1
        ? `${tooth.observations.length} observations`
        : tooth.observations[0]?.condition_type,
      severity: tooth.observations[0]?.severity,
      lastTreatmentDate: tooth.last_treatment_date,
      observationCount: tooth.observations.length,
      procedureCount: tooth.procedures.length,
      // New fields for better status tracking
      procedureStatus,
      completedProcedureCount: completedProcedures.length,
      hasPendingProcedure: plannedProcedures.length > 0 || inProgressProcedures.length > 0,
      hasCompletedProcedure: completedProcedures.length > 0,
    };
  }) || [];

  // Get status display info
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'scheduled':
        return { label: 'Scheduled', color: 'primary' as const };
      case 'in_progress':
        return { label: 'In Progress', color: 'warning' as const };
      case 'completed':
        return { label: 'Completed', color: 'success' as const };
      case 'cancelled':
        return { label: 'Cancelled', color: 'error' as const };
      default:
        return { label: status, color: 'default' as const };
    }
  };

  // Show loading state while fetching appointment
  if (appointmentLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Loading appointment details...
          </Typography>
        </Box>
      </Container>
    );
  }

  // Show error if appointment not found
  if (appointmentError || !appointmentDetails) {
    const errorMessage = appointmentError
      ? `Error: ${JSON.stringify(appointmentError)}`
      : 'Appointment not found';

    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>Failed to load appointment details</Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {errorMessage}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Appointment ID: {appointmentId || 'Not provided'}
          </Typography>
        </Alert>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="contained" onClick={() => navigate('/doctor/dashboard')}>
            Back to Dashboard
          </Button>
          <Button variant="outlined" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Box>
      </Container>
    );
  }

  const statusInfo = getStatusInfo(appointmentDetails.status);

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          component="button"
          underline="hover"
          color="inherit"
          onClick={() => handleNavigateAway('/doctor/dashboard')}
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
        >
          <Home fontSize="small" />
          Dashboard
        </Link>
        <Link
          component="button"
          underline="hover"
          color="inherit"
          onClick={() => handleNavigateAway('/doctor/appointments')}
        >
          Appointments
        </Link>
        <Typography color="text.primary">Dental Consultation</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Typography variant="h4">
                Dental Consultation
              </Typography>
              <Chip
                label={statusInfo.label}
                color={statusInfo.color}
                size="medium"
                icon={statusInfo.color === 'warning' ? <PlayArrow /> : statusInfo.color === 'success' ? <CheckCircle /> : undefined}
              />
            </Box>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Patient: <strong>{patientData.firstName}</strong> ({patientData.mobileNumber})
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Appointment: {appointmentDetails.appointment_number} •
              Date: {new Date(appointmentDetails.appointment_date).toLocaleDateString()} •
              Time: {appointmentDetails.appointment_time}
            </Typography>
            {dentalChart && (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                Dentition Type: {dentalChart.dentition_type.toUpperCase()} •
                Total Observations: {dentalChart.total_observations} •
                Total Procedures: {dentalChart.total_procedures} •
                Active Treatments: {dentalChart.active_treatments}
              </Typography>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {/* Complete Consultation Button */}
            {appointmentDetails.status !== 'completed' && (
              <Button
                variant="contained"
                color="success"
                size="large"
                startIcon={<CheckCircle />}
                onClick={handleCompleteConsultation}
                disabled={isUpdatingStatus}
                sx={{ minWidth: 200 }}
              >
                {isUpdatingStatus ? 'Updating...' : 'Complete Consultation'}
              </Button>
            )}

            {/* Prescription buttons */}
            {patientPrescriptions && patientPrescriptions.length > 0 && (
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  // Show the most recent prescription in dialog with tabs
                  const latestPrescription = patientPrescriptions[0];
                  if (latestPrescription?.id) {
                    setSelectedPrescriptionIndex(0); // Start with first (latest) prescription
                    setCreatedPrescriptionId(latestPrescription.id);
                    setShowPrescriptionDialog(true);
                  }
                }}
              >
                View Prescription{patientPrescriptions.length > 1 ? `s (${patientPrescriptions.length})` : ''}
              </Button>
            )}
            <Button
              variant="outlined"
              color="primary"
              onClick={() => {
                setCreatedPrescriptionId(null);
                setShowPrescriptionDialog(true);
              }}
            >
              {patientPrescriptions && patientPrescriptions.length > 0 ? 'Create New' : 'Create Prescription'}
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<SummaryIcon />}
              onClick={() => setShowSummaryDialog(true)}
            >
              Treatment Summary
            </Button>
          </Box>
        </Box>

        {/* Tooth action buttons - show when tooth is selected */}
        {selectedTooth && (
          <Box sx={{ display: 'flex', gap: 1, mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mr: 2, alignSelf: 'center' }}>
              Tooth #{selectedTooth} selected:
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<HistoryIcon />}
              onClick={handleViewHistory}
            >
              View History
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
              onClick={handleAddObservation}
            >
              Add Observation
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<ProcedureIcon />}
              onClick={handleAddProcedure}
            >
              Add Procedure
            </Button>
          </Box>
        )}
      </Paper>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Dental Chart */}
        <Grid item xs={12}>
          <DentalChart
            dentitionType={dentalChart?.dentition_type || 'permanent'}
            teethData={toothData}
            onToothClick={handleToothClick}
            selectedTooth={selectedTooth}
          />
        </Grid>

      </Grid>

      {/* Observation Form Dialog */}
      <Dialog
        open={showObservationForm}
        onClose={() => setShowObservationForm(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Add Dental Observation</Typography>
            <IconButton onClick={() => setShowObservationForm(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <DentalObservationForm
              selectedTooth={selectedTooth || undefined}
              onSubmit={handleObservationSubmit}
              onCancel={() => setShowObservationForm(false)}
            />
          </Box>
        </DialogContent>
      </Dialog>

      {/* Procedure Form Dialog */}
      <Dialog
        open={showProcedureForm}
        onClose={() => setShowProcedureForm(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Add Dental Procedure</Typography>
            <IconButton onClick={() => setShowProcedureForm(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <DentalProcedureForm
              selectedTooth={selectedTooth || undefined}
              onSubmit={handleProcedureSubmit}
              onCancel={() => setShowProcedureForm(false)}
            />
          </Box>
        </DialogContent>
      </Dialog>

      {/* Tooth History Dialog */}
      <Dialog
        open={showToothHistory}
        onClose={() => setShowToothHistory(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Tooth #{selectedTooth} History</Typography>
            <IconButton onClick={() => setShowToothHistory(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedTooth && (
            <ToothHistoryViewer
              patientMobileNumber={patientData.mobileNumber}
              patientFirstName={patientData.firstName}
              toothNumber={selectedTooth}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowToothHistory(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Prescription Dialog */}
      <Dialog
        open={showPrescriptionDialog}
        onClose={() => {
          setShowPrescriptionDialog(false);
          setCreatedPrescriptionId(null);
          setSelectedPrescriptionIndex(0);
        }}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle className="prescription-no-print">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6">
                {createdPrescriptionId ? 'View Prescription' : 'Create Prescription'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Patient: {patientData.firstName} ({patientData.mobileNumber})
              </Typography>
            </Box>
            <IconButton onClick={() => {
              setShowPrescriptionDialog(false);
              setCreatedPrescriptionId(null);
              setSelectedPrescriptionIndex(0);
            }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {createdPrescriptionId ? (
              <>
                {/* Tabs for multiple prescriptions */}
                {patientPrescriptions && patientPrescriptions.length > 1 && (
                  <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }} className="prescription-no-print">
                    <Tabs
                      value={selectedPrescriptionIndex}
                      onChange={(_, newValue) => {
                        setSelectedPrescriptionIndex(newValue);
                        setCreatedPrescriptionId(patientPrescriptions[newValue]?.id || null);
                      }}
                      variant="scrollable"
                      scrollButtons="auto"
                    >
                      {patientPrescriptions.map((prescription, index) => (
                        <Tab
                          key={prescription.id}
                          label={
                            <Box sx={{ textAlign: 'left' }}>
                              <Typography variant="body2">
                                {prescription.prescription_number}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(prescription.created_at).toLocaleDateString()}
                              </Typography>
                            </Box>
                          }
                          id={`prescription-tab-${index}`}
                          aria-controls={`prescription-tabpanel-${index}`}
                        />
                      ))}
                    </Tabs>
                  </Box>
                )}
                <PrescriptionViewer
                  prescriptionId={createdPrescriptionId}
                  onAddMore={() => setCreatedPrescriptionId(null)}
                  onEdit={() => {
                    toast.info('Edit functionality coming soon');
                  }}
                  refetch={refetchPrescriptions}
                />
              </>
            ) : (
              <>
                {isLoadingCurrentUser ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                    <Typography sx={{ ml: 2 }}>Loading doctor information...</Typography>
                  </Box>
                ) : !doctorId ? (
                  <Alert severity="error" sx={{ m: 2 }}>
                    Unable to load doctor information. Please log out and log back in.
                  </Alert>
                ) : (
                  appointmentDetails && (
                    <DentalPrescriptionBuilder
                      patientMobileNumber={patientData.mobileNumber}
                      patientFirstName={patientData.firstName}
                      patientUuid={appointmentDetails.patient_uuid}
                      appointmentId={appointmentId || ''}
                      doctorId={doctorId}
                      dentalNotes={dentalChart ? `Dental Consultation Summary:\n- Total Observations: ${dentalChart.total_observations}\n- Total Procedures: ${dentalChart.total_procedures}\n- Active Treatments: ${dentalChart.active_treatments}` : ''}
                      onSuccess={(prescriptionId) => {
                        setCreatedPrescriptionId(prescriptionId);
                        toast.success('Prescription created successfully!');
                        loadDentalChart(); // Reload chart
                        refetchPrescriptions(); // Reload prescriptions list
                      }}
                      onCancel={() => setShowPrescriptionDialog(false)}
                    />
                  )
                )}
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions className="prescription-no-print">
          <Button
            onClick={() => {
              setShowPrescriptionDialog(false);
              setCreatedPrescriptionId(null);
              setSelectedPrescriptionIndex(0);
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Treatment Summary Dialog */}
      <Dialog
        open={showSummaryDialog}
        onClose={() => setShowSummaryDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6">Treatment Summary</Typography>
              <Typography variant="caption" color="text.secondary">
                Patient: {patientData.firstName} ({patientData.mobileNumber})
              </Typography>
            </Box>
            <IconButton onClick={() => setShowSummaryDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <DentalSummaryTable
              patientMobileNumber={patientData.mobileNumber}
              patientFirstName={patientData.firstName}
              onRefresh={loadDentalChart}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSummaryDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Exit Confirmation Dialog */}
      <Dialog
        open={showExitDialog}
        onClose={() => setShowExitDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">Consultation Status</Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Is this consultation completed?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            If yes, the appointment will be marked as completed.
            If no, it will remain in progress for you to continue later.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => handleExitDialogResponse(false)}
          >
            No, Still In Progress
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircle />}
            onClick={() => handleExitDialogResponse(true)}
          >
            Yes, Mark Complete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DentalConsultation;
