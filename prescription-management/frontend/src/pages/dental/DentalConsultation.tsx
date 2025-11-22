/**
 * Dental Consultation Page
 * Main page for dental consultations integrating all dental components
 * Allows doctors to record observations, procedures, and view patient dental history
 */

import React, { useState, useEffect } from 'react';
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
  Snackbar,
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
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { type RootState } from '../../store';
import {
  DentalChart,
  DentalObservationForm,
  DentalProcedureForm,
  ToothHistoryViewer,
  DentalPrescriptionBuilder,
} from '../../components/dental';
import PrescriptionViewer from '../../components/dental/PrescriptionViewer';
import dentalService, { type DentalChart as DentalChartType } from '../../services/dentalService';
import { useGetAppointmentDetailsQuery, useGetPatientMedicalHistoryQuery, useGetCurrentUserQuery } from '../../store/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dental-tabpanel-${index}`}
      aria-labelledby={`dental-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const DentalConsultation: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();

  // Get logged-in user from Redux store
  const user = useSelector((state: RootState) => state.auth.user);

  // Fetch current user info to get doctor_id
  const { data: currentUserData, isLoading: isLoadingCurrentUser } = useGetCurrentUserQuery();

  // Get doctor_id from API response (preferred) or Redux fallback
  const doctorId = currentUserData?.doctor_id || user?.doctor_id;

  // Show warning if doctor_id is not available
  React.useEffect(() => {
    if (!isLoadingCurrentUser && !doctorId) {
      console.warn('Doctor ID not available. Please ensure you are logged in as a doctor.');
    }
  }, [isLoadingCurrentUser, doctorId]);

  // Fetch appointment details
  const { data: appointmentDetails, isLoading: appointmentLoading, error: appointmentError } =
    useGetAppointmentDetailsQuery(appointmentId || '', { skip: !appointmentId });

  // Patient info from appointment
  const [patientData, setPatientData] = useState({
    mobileNumber: '',
    firstName: '',
  });

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
  const [activeTab, setActiveTab] = useState(0);
  const [dentalChart, setDentalChart] = useState<DentalChartType | null>(null);
  const [selectedTooth, setSelectedTooth] = useState<string | null>(null);
  const [selectedToothData, setSelectedToothData] = useState<any>(null);
  const [showObservationForm, setShowObservationForm] = useState(false);
  const [showProcedureForm, setShowProcedureForm] = useState(false);
  const [showToothHistory, setShowToothHistory] = useState(false);
  const [showPrescriptionDialog, setShowPrescriptionDialog] = useState(false);
  const [createdPrescriptionId, setCreatedPrescriptionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

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
      showSnackbar(error.response?.data?.detail || 'Failed to load dental chart', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle tooth click
  const handleToothClick = (toothNumber: string) => {
    setSelectedTooth(toothNumber);
    // Find the tooth data from the chart
    const toothData = dentalChart?.teeth.find(t => t.tooth_number === toothNumber);
    setSelectedToothData(toothData || null);
    setActiveTab(0); // Reset to first tab
  };

  // Handle add observation
  const handleAddObservation = () => {
    if (!selectedTooth) {
      showSnackbar('Please select a tooth first', 'error');
      return;
    }
    setShowObservationForm(true);
  };

  // Handle add procedure
  const handleAddProcedure = () => {
    if (!selectedTooth) {
      showSnackbar('Please select a tooth first', 'error');
      return;
    }
    setShowProcedureForm(true);
  };

  // Handle view tooth history
  const handleViewHistory = () => {
    if (!selectedTooth) {
      showSnackbar('Please select a tooth first', 'error');
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

      showSnackbar('Observation added successfully', 'success');
      setShowObservationForm(false);
      loadDentalChart(); // Reload chart
    } catch (error: any) {
      showSnackbar(error.response?.data?.detail || 'Failed to add observation', 'error');
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

      showSnackbar('Procedure added successfully', 'success');
      setShowProcedureForm(false);
      loadDentalChart(); // Reload chart
    } catch (error: any) {
      showSnackbar(error.response?.data?.detail || 'Failed to add procedure', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Show snackbar
  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  // Convert dental chart data to tooth data for chart component
  const toothData = dentalChart?.teeth.map(tooth => ({
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
  })) || [];

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
          <Button variant="contained" onClick={() => navigate('/appointments')}>
            Back to Appointments
          </Button>
          <Button variant="outlined" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link underline="hover" color="inherit" onClick={() => navigate('/appointments')}>
          Appointments
        </Link>
        <Typography color="text.primary">Dental Consultation</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Dental Consultation
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Patient: {patientData.firstName} ({patientData.mobileNumber})
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

          <Box sx={{ display: 'flex', gap: 1 }}>
            {patientPrescriptions && patientPrescriptions.length > 0 && (
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  const latestPrescription = patientPrescriptions[0];
                  // Use logged-in doctor_id if available, otherwise use appointment's doctor_id
                  const currentDoctorId = doctorId || appointmentDetails?.doctor_id;
                  if (latestPrescription && latestPrescription.doctor_id === currentDoctorId) {
                    setCreatedPrescriptionId(latestPrescription.id);
                    setShowPrescriptionDialog(true);
                  } else {
                    showSnackbar('No accessible prescriptions found', 'error');
                  }
                }}
              >
                View Prescription ({patientPrescriptions.length})
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
            {selectedTooth && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<HistoryIcon />}
                  onClick={handleViewHistory}
                >
                  View History
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddObservation}
                >
                  Add Observation
                </Button>
                <Button
                  variant="contained"
                  startIcon={<ProcedureIcon />}
                  onClick={handleAddProcedure}
                >
                  Add Procedure
                </Button>
              </>
            )}
          </Box>
        </Box>
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

        {/* Tabs for additional info */}
        {selectedTooth && (
          <Grid item xs={12}>
            <Paper elevation={2}>
              <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
                <Tab label="Tooth Details" />
                <Tab label="Observations" />
                <Tab label="Procedures" />
              </Tabs>

              <TabPanel value={activeTab} index={0}>
                <Box sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Tooth #{selectedTooth} Summary
                  </Typography>
                  {selectedToothData ? (
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <Paper elevation={1} sx={{ p: 2, bgcolor: 'background.default' }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Total Observations
                          </Typography>
                          <Typography variant="h4" color="primary">
                            {selectedToothData.observations.length}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Paper elevation={1} sx={{ p: 2, bgcolor: 'background.default' }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Total Procedures
                          </Typography>
                          <Typography variant="h4" color="secondary">
                            {selectedToothData.procedures.length}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Paper elevation={1} sx={{ p: 2, bgcolor: 'background.default' }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Status
                          </Typography>
                          <Typography variant="h6" color={selectedToothData.has_active_issues ? 'error' : 'success.main'}>
                            {selectedToothData.has_active_issues ? 'Requires Treatment' : 'Healthy'}
                          </Typography>
                        </Paper>
                      </Grid>
                      {selectedToothData.last_treatment_date && (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">
                            Last Treatment: {new Date(selectedToothData.last_treatment_date).toLocaleDateString()}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No data available for this tooth.
                    </Typography>
                  )}
                </Box>
              </TabPanel>

              <TabPanel value={activeTab} index={1}>
                <Box sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Observations for Tooth #{selectedTooth}
                  </Typography>
                  {selectedToothData && selectedToothData.observations.length > 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {selectedToothData.observations.map((obs: any, index: number) => (
                        <Paper key={obs.id || index} elevation={1} sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                            <Box>
                              <Typography variant="subtitle1" fontWeight="bold">
                                {obs.condition_type}
                              </Typography>
                              {obs.tooth_surface && (
                                <Typography variant="body2" color="text.secondary">
                                  Surface: {obs.tooth_surface}
                                </Typography>
                              )}
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              {obs.severity && (
                                <Chip
                                  label={obs.severity}
                                  size="small"
                                  color={
                                    obs.severity === 'severe' ? 'error' :
                                    obs.severity === 'moderate' ? 'warning' :
                                    obs.severity === 'mild' ? 'info' : 'default'
                                  }
                                />
                              )}
                              <Chip
                                label={obs.treatment_done ? 'Treated' : obs.treatment_required ? 'Treatment Required' : 'Observation'}
                                size="small"
                                color={obs.treatment_done ? 'success' : obs.treatment_required ? 'error' : 'default'}
                              />
                            </Box>
                          </Box>
                          {obs.observation_notes && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              {obs.observation_notes}
                            </Typography>
                          )}
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                            Recorded: {new Date(obs.created_at).toLocaleDateString()}
                            {obs.treatment_date && ` • Treated: ${new Date(obs.treatment_date).toLocaleDateString()}`}
                          </Typography>
                        </Paper>
                      ))}
                    </Box>
                  ) : (
                    <Alert severity="info">
                      No observations recorded for this tooth yet. Click "Add Observation" to record one.
                    </Alert>
                  )}
                </Box>
              </TabPanel>

              <TabPanel value={activeTab} index={2}>
                <Box sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Procedures for Tooth #{selectedTooth}
                  </Typography>
                  {selectedToothData && selectedToothData.procedures.length > 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {selectedToothData.procedures.map((proc: any, index: number) => (
                        <Paper key={proc.id || index} elevation={1} sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                            <Box>
                              <Typography variant="subtitle1" fontWeight="bold">
                                {proc.procedure_name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Code: {proc.procedure_code}
                              </Typography>
                            </Box>
                            <Chip
                              label={proc.status}
                              size="small"
                              color={
                                proc.status === 'completed' ? 'success' :
                                proc.status === 'in_progress' ? 'warning' :
                                proc.status === 'cancelled' ? 'error' : 'default'
                              }
                            />
                          </Box>
                          {proc.description && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              {proc.description}
                            </Typography>
                          )}
                          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                            {proc.estimated_cost && (
                              <Typography variant="body2" color="text.secondary">
                                Estimated: ₹{proc.estimated_cost}
                              </Typography>
                            )}
                            {proc.actual_cost && (
                              <Typography variant="body2" color="text.secondary">
                                Actual: ₹{proc.actual_cost}
                              </Typography>
                            )}
                            {proc.duration_minutes && (
                              <Typography variant="body2" color="text.secondary">
                                Duration: {proc.duration_minutes} min
                              </Typography>
                            )}
                          </Box>
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                            Recorded: {new Date(proc.created_at).toLocaleDateString()}
                            {proc.completed_date && ` • Completed: ${new Date(proc.completed_date).toLocaleDateString()}`}
                          </Typography>
                        </Paper>
                      ))}
                    </Box>
                  ) : (
                    <Alert severity="info">
                      No procedures recorded for this tooth yet. Click "Add Procedure" to record one.
                    </Alert>
                  )}
                </Box>
              </TabPanel>
            </Paper>
          </Grid>
        )}
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
        }}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
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
            }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {createdPrescriptionId ? (
              <PrescriptionViewer
                prescriptionId={createdPrescriptionId}
                onAddMore={() => setCreatedPrescriptionId(null)}
                onEdit={() => {
                  showSnackbar('Edit functionality coming soon', 'info');
                }}
              />
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
                        showSnackbar('Prescription created successfully!', 'success');
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
        <DialogActions>
          <Button
            onClick={() => {
              setShowPrescriptionDialog(false);
              setCreatedPrescriptionId(null);
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default DentalConsultation;
