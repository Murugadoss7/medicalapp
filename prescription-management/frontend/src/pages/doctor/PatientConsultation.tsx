import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Stepper,
  Step,
  StepLabel,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Skeleton,
  TextField,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Person as PersonIcon,
  History as HistoryIcon,
  MedicalServices as MedicalIcon,
  Assignment as AssignmentIcon,
  Check as CheckIcon,
  ExpandMore as ExpandMoreIcon,
  LocalPharmacy as PharmacyIcon,
  CalendarToday as CalendarIcon,
  Note as NoteIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  useGetPatientByAppointmentQuery, 
  useGetAppointmentDetailsQuery,
  useGetPatientMedicalHistoryQuery,
  useSearchMedicinesQuery,
  useCompleteConsultationMutation
} from '../../store/api';
import { formatDate } from '../../utils/dateUtils';
import type { Medicine, PrescriptionItemForm } from '../../store/api';

// Consultation workflow steps
const consultationSteps = [
  { label: 'Patient Information', icon: PersonIcon },
  { label: 'Medical History', icon: HistoryIcon },
  { label: 'Consultation', icon: MedicalIcon },
  { label: 'Prescription', icon: AssignmentIcon },
  { label: 'Complete', icon: CheckIcon },
];

export const PatientConsultation = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  
  // Prescription form state
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItemForm[]>([]);
  const [medicineSearch, setMedicineSearch] = useState('');
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  
  // New prescription item form
  const [newItem, setNewItem] = useState<Partial<PrescriptionItemForm>>({
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
    quantity: 1,
    sequence_order: 1,
  });

  // Consultation form state
  const [consultationForm, setConsultationForm] = useState({
    chief_complaint: '',
    symptoms: '',
    diagnosis: '',
    clinical_notes: '',
    doctor_instructions: '',
  });

  // Fetch appointment and patient data
  const {
    data: appointmentData,
    isLoading: appointmentLoading,
    error: appointmentError,
  } = useGetAppointmentDetailsQuery(appointmentId || '');

  const {
    data: patientData,
    isLoading: patientLoading,
    error: patientError,
  } = useGetPatientByAppointmentQuery(appointmentId || '');

  // Fetch medical history when patient data is available
  const {
    data: medicalHistory,
    isLoading: historyLoading,
    error: historyError,
  } = useGetPatientMedicalHistoryQuery(
    {
      patientMobile: patientData?.mobile_number || '',
      patientName: patientData?.first_name || '',
      limit: 10,
    },
    { skip: !patientData }
  );

  // Medicine search for prescription builder
  const {
    data: medicineOptions,
    isLoading: medicineSearchLoading,
  } = useSearchMedicinesQuery(
    { search: medicineSearch, limit: 20 },
    { skip: medicineSearch.length < 2 }
  );

  // Complete consultation mutation
  const [completeConsultation, { isLoading: completingConsultation }] = useCompleteConsultationMutation();

  const isLoading = appointmentLoading || patientLoading;
  const hasError = appointmentError || patientError;

  const handleNext = () => {
    setActiveStep((prevStep) => Math.min(prevStep + 1, consultationSteps.length - 1));
  };

  const handleBack = () => {
    setActiveStep((prevStep) => Math.max(prevStep - 1, 0));
  };

  const handleStepClick = (stepIndex: number) => {
    setActiveStep(stepIndex);
  };

  // Prescription builder handlers
  const handleAddMedicine = () => {
    if (!selectedMedicine) return;
    
    const prescriptionItem: PrescriptionItemForm = {
      medicine_id: selectedMedicine.id,
      dosage: newItem.dosage || '',
      frequency: newItem.frequency || '',
      duration: newItem.duration || '',
      instructions: newItem.instructions || '',
      quantity: newItem.quantity || 1,
      unit_price: selectedMedicine.unit_price,
      sequence_order: prescriptionItems.length + 1,
    };
    
    setPrescriptionItems([...prescriptionItems, prescriptionItem]);
    
    // Reset form
    setSelectedMedicine(null);
    setMedicineSearch('');
    setNewItem({
      dosage: '',
      frequency: '',
      duration: '',
      instructions: '',
      quantity: 1,
      sequence_order: prescriptionItems.length + 2,
    });
  };

  const handleRemoveMedicine = (index: number) => {
    setPrescriptionItems(prescriptionItems.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return prescriptionItems.reduce((total, item) => {
      return total + (item.quantity * item.unit_price);
    }, 0);
  };

  const handleCompleteConsultation = async () => {
    if (!appointmentId || !patientData) return;

    const consultationData = {
      appointment_id: appointmentId,
      chief_complaint: consultationForm.chief_complaint,
      symptoms: consultationForm.symptoms,
      diagnosis: consultationForm.diagnosis,
      clinical_notes: consultationForm.clinical_notes,
      doctor_instructions: consultationForm.doctor_instructions,
      prescription_data: prescriptionItems.length > 0 ? {
        patient_mobile_number: patientData.mobile_number,
        patient_first_name: patientData.first_name,
        patient_uuid: patientData.id,
        appointment_id: appointmentId,
        visit_date: new Date().toISOString().split('T')[0],
        chief_complaint: consultationForm.chief_complaint,
        diagnosis: consultationForm.diagnosis,
        symptoms: consultationForm.symptoms,
        clinical_notes: consultationForm.clinical_notes,
        doctor_instructions: consultationForm.doctor_instructions,
        items: prescriptionItems,
      } : undefined,
    };

    try {
      await completeConsultation(consultationData).unwrap();
      navigate('/doctor/appointments', { 
        state: { message: 'Consultation completed successfully!' }
      });
    } catch (error) {
      console.error('Failed to complete consultation:', error);
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Loading consultation data...
        </Typography>
      </Box>
    );
  }

  if (hasError) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load consultation data. Please try again or contact support.
        </Alert>
        <Button variant="outlined" onClick={() => navigate('/doctor/appointments')}>
          Back to Appointments
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header Section */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Patient Consultation
        </Typography>
        
        {appointmentData && (
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
            <Chip
              label={`Appointment: ${appointmentData.appointment_number}`}
              color="primary"
              variant="outlined"
            />
            <Chip
              label={`Status: ${appointmentData.status}`}
              color={appointmentData.status === 'in_progress' ? 'success' : 'default'}
            />
            <Chip
              label={`Time: ${appointmentData.appointment_time}`}
              color="secondary"
              variant="outlined"
            />
          </Box>
        )}
      </Box>

      {/* Main Content Layout */}
      <Grid container spacing={3}>
        {/* Left Panel - Workflow Stepper */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Consultation Progress
            </Typography>
            <Stepper activeStep={activeStep} orientation="vertical">
              {consultationSteps.map((step, index) => {
                const StepIcon = step.icon;
                return (
                  <Step key={step.label}>
                    <StepLabel
                      onClick={() => handleStepClick(index)}
                      sx={{
                        cursor: 'pointer',
                        '& .MuiStepLabel-label': {
                          fontSize: '0.875rem',
                        },
                      }}
                      StepIconComponent={() => (
                        <StepIcon
                          color={index <= activeStep ? 'primary' : 'disabled'}
                          sx={{ fontSize: 20 }}
                        />
                      )}
                    >
                      {step.label}
                    </StepLabel>
                  </Step>
                );
              })}
            </Stepper>
          </Paper>
        </Grid>

        {/* Right Panel - Main Content */}
        <Grid item xs={12} md={9}>
          <Paper sx={{ p: 3, minHeight: '600px' }}>
            {/* Step Content Area */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h5" gutterBottom>
                {consultationSteps[activeStep].label}
              </Typography>
              <Divider />
            </Box>

            {/* Dynamic Content Based on Active Step */}
            <Box sx={{ minHeight: '400px' }}>
              {activeStep === 0 && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Patient Information
                    </Typography>
                    {patientData && (
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" color="textSecondary">
                            Name
                          </Typography>
                          <Typography variant="body1">
                            {patientData.full_name}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" color="textSecondary">
                            Mobile Number
                          </Typography>
                          <Typography variant="body1">
                            {patientData.mobile_number}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" color="textSecondary">
                            Age
                          </Typography>
                          <Typography variant="body1">
                            {patientData.age} years
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" color="textSecondary">
                            Gender
                          </Typography>
                          <Typography variant="body1">
                            {patientData.gender}
                          </Typography>
                        </Grid>
                      </Grid>
                    )}
                  </CardContent>
                </Card>
              )}

              {activeStep === 1 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Medical History
                    {medicalHistory && (
                      <Badge 
                        badgeContent={medicalHistory.length} 
                        color="primary" 
                        sx={{ ml: 2 }}
                      >
                        <PharmacyIcon />
                      </Badge>
                    )}
                  </Typography>
                  
                  {historyLoading && (
                    <Box>
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} variant="rectangular" height={80} sx={{ mb: 1 }} />
                      ))}
                    </Box>
                  )}

                  {historyError && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      Could not load medical history. Patient may be visiting for the first time.
                    </Alert>
                  )}

                  {medicalHistory && medicalHistory.length === 0 && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      No previous medical history found. This appears to be the patient's first visit.
                    </Alert>
                  )}

                  {medicalHistory && medicalHistory.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        Previous Prescriptions ({medicalHistory.length})
                      </Typography>
                      
                      {medicalHistory.map((history, index) => (
                        <Accordion key={history.id} sx={{ mb: 1 }}>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                              <CalendarIcon sx={{ mr: 1, color: 'primary.main' }} />
                              <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="subtitle1">
                                  {formatDate.forDisplay.date(history.visit_date)} - {history.doctor_name}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                  {history.chief_complaint}
                                </Typography>
                              </Box>
                              <Chip 
                                label={history.status} 
                                size="small"
                                color={history.status === 'completed' ? 'success' : 'default'}
                              />
                            </Box>
                          </AccordionSummary>
                          
                          <AccordionDetails>
                            <Grid container spacing={2}>
                              <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" color="textSecondary">
                                  Diagnosis
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 2 }}>
                                  {history.diagnosis}
                                </Typography>
                                
                                {history.symptoms && (
                                  <>
                                    <Typography variant="subtitle2" color="textSecondary">
                                      Symptoms
                                    </Typography>
                                    <Typography variant="body2" sx={{ mb: 2 }}>
                                      {history.symptoms}
                                    </Typography>
                                  </>
                                )}
                              </Grid>
                              
                              <Grid item xs={12} md={6}>
                                {history.clinical_notes && (
                                  <>
                                    <Typography variant="subtitle2" color="textSecondary">
                                      Clinical Notes
                                    </Typography>
                                    <Typography variant="body2" sx={{ mb: 2 }}>
                                      {history.clinical_notes}
                                    </Typography>
                                  </>
                                )}
                                
                                {history.doctor_instructions && (
                                  <>
                                    <Typography variant="subtitle2" color="textSecondary">
                                      Doctor Instructions
                                    </Typography>
                                    <Typography variant="body2">
                                      {history.doctor_instructions}
                                    </Typography>
                                  </>
                                )}
                              </Grid>
                              
                              <Grid item xs={12}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                  <NoteIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 16 }} />
                                  <Typography variant="caption" color="textSecondary">
                                    Prescription #{history.prescription_number} • 
                                    Total: ₹{history.total_amount}
                                  </Typography>
                                </Box>
                              </Grid>
                            </Grid>
                          </AccordionDetails>
                        </Accordion>
                      ))}
                    </Box>
                  )}
                </Box>
              )}

              {activeStep === 2 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Consultation Documentation
                  </Typography>
                  
                  <Grid container spacing={3}>
                    {/* Chief Complaint */}
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Chief Complaint"
                        multiline
                        rows={3}
                        value={consultationForm.chief_complaint}
                        onChange={(e) => setConsultationForm({ 
                          ...consultationForm, 
                          chief_complaint: e.target.value 
                        })}
                        placeholder="Main reason for patient's visit..."
                        helperText="Describe the primary reason for the patient's visit"
                      />
                    </Grid>

                    {/* Symptoms */}
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Symptoms"
                        multiline
                        rows={4}
                        value={consultationForm.symptoms}
                        onChange={(e) => setConsultationForm({ 
                          ...consultationForm, 
                          symptoms: e.target.value 
                        })}
                        placeholder="List all symptoms reported by patient..."
                        helperText="Detailed list of symptoms"
                      />
                    </Grid>

                    {/* Clinical Notes */}
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Clinical Notes"
                        multiline
                        rows={4}
                        value={consultationForm.clinical_notes}
                        onChange={(e) => setConsultationForm({ 
                          ...consultationForm, 
                          clinical_notes: e.target.value 
                        })}
                        placeholder="Physical examination findings, vital signs, etc..."
                        helperText="Clinical examination findings"
                      />
                    </Grid>

                    {/* Diagnosis */}
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Diagnosis"
                        multiline
                        rows={2}
                        value={consultationForm.diagnosis}
                        onChange={(e) => setConsultationForm({ 
                          ...consultationForm, 
                          diagnosis: e.target.value 
                        })}
                        placeholder="Primary and secondary diagnosis..."
                        helperText="Primary diagnosis and any secondary conditions"
                        required
                      />
                    </Grid>

                    {/* Doctor Instructions */}
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Doctor Instructions"
                        multiline
                        rows={3}
                        value={consultationForm.doctor_instructions}
                        onChange={(e) => setConsultationForm({ 
                          ...consultationForm, 
                          doctor_instructions: e.target.value 
                        })}
                        placeholder="Instructions for patient (diet, rest, follow-up, etc.)..."
                        helperText="Instructions and recommendations for the patient"
                      />
                    </Grid>

                    {/* Quick Templates */}
                    <Grid item xs={12}>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle2" gutterBottom>
                        Quick Templates
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip
                          label="Viral Fever"
                          clickable
                          onClick={() => setConsultationForm({
                            ...consultationForm,
                            chief_complaint: 'Fever and body ache for 2 days',
                            symptoms: 'High temperature, headache, body ache, fatigue',
                            diagnosis: 'Viral fever',
                            doctor_instructions: 'Take complete rest, drink plenty of fluids, follow medication as prescribed'
                          })}
                        />
                        <Chip
                          label="Common Cold"
                          clickable
                          onClick={() => setConsultationForm({
                            ...consultationForm,
                            chief_complaint: 'Runny nose and cough',
                            symptoms: 'Nasal congestion, runny nose, mild cough, throat irritation',
                            diagnosis: 'Common cold',
                            doctor_instructions: 'Stay hydrated, use steam inhalation, avoid cold foods'
                          })}
                        />
                        <Chip
                          label="Headache"
                          clickable
                          onClick={() => setConsultationForm({
                            ...consultationForm,
                            chief_complaint: 'Severe headache',
                            symptoms: 'Persistent headache, sensitivity to light',
                            diagnosis: 'Tension headache',
                            doctor_instructions: 'Adequate rest, avoid screen time, stress management'
                          })}
                        />
                        <Chip
                          label="Hypertension Follow-up"
                          clickable
                          onClick={() => setConsultationForm({
                            ...consultationForm,
                            chief_complaint: 'Routine blood pressure check',
                            symptoms: 'No acute symptoms',
                            diagnosis: 'Hypertension - stable',
                            doctor_instructions: 'Continue current medication, regular BP monitoring, low salt diet'
                          })}
                        />
                      </Box>
                    </Grid>

                    {/* Form Validation Summary */}
                    <Grid item xs={12}>
                      {!consultationForm.diagnosis && (
                        <Alert severity="warning">
                          Diagnosis is required before proceeding to prescription.
                        </Alert>
                      )}
                      {consultationForm.diagnosis && (
                        <Alert severity="success">
                          Consultation documentation is complete. You can proceed to create the prescription.
                        </Alert>
                      )}
                    </Grid>
                  </Grid>
                </Box>
              )}

              {activeStep === 3 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Prescription Builder
                    <Badge 
                      badgeContent={prescriptionItems.length} 
                      color="primary" 
                      sx={{ ml: 2 }}
                    >
                      <PharmacyIcon />
                    </Badge>
                  </Typography>

                  {/* Medicine Search and Add Form */}
                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Add Medicine
                      </Typography>
                      
                      <Grid container spacing={2}>
                        {/* Medicine Search */}
                        <Grid item xs={12} md={6}>
                          <Autocomplete
                            value={selectedMedicine}
                            onChange={(_, newValue) => setSelectedMedicine(newValue)}
                            inputValue={medicineSearch}
                            onInputChange={(_, newInputValue) => setMedicineSearch(newInputValue)}
                            options={medicineOptions || []}
                            getOptionLabel={(option) => 
                              `${option.name} ${option.strength ? `(${option.strength})` : ''} - ${option.manufacturer}`
                            }
                            loading={medicineSearchLoading}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Search Medicine"
                                placeholder="Type medicine name..."
                                InputProps={{
                                  ...params.InputProps,
                                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                                  endAdornment: (
                                    <>
                                      {medicineSearchLoading && <CircularProgress size={20} />}
                                      {params.InputProps.endAdornment}
                                    </>
                                  ),
                                }}
                              />
                            )}
                            renderOption={(props, option) => (
                              <Box component="li" {...props}>
                                <Box>
                                  <Typography variant="subtitle2">
                                    {option.name} {option.strength && `(${option.strength})`}
                                  </Typography>
                                  <Typography variant="caption" color="textSecondary">
                                    {option.manufacturer} • ₹{option.unit_price}
                                  </Typography>
                                </Box>
                              </Box>
                            )}
                          />
                        </Grid>

                        {/* Dosage */}
                        <Grid item xs={12} md={6}>
                          <FormControl fullWidth>
                            <InputLabel>Dosage</InputLabel>
                            <Select
                              value={newItem.dosage}
                              onChange={(e) => setNewItem({ ...newItem, dosage: e.target.value })}
                              label="Dosage"
                            >
                              <MenuItem value="1/2 tablet">1/2 tablet</MenuItem>
                              <MenuItem value="1 tablet">1 tablet</MenuItem>
                              <MenuItem value="2 tablets">2 tablets</MenuItem>
                              <MenuItem value="5ml">5ml</MenuItem>
                              <MenuItem value="10ml">10ml</MenuItem>
                              <MenuItem value="1 capsule">1 capsule</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>

                        {/* Frequency */}
                        <Grid item xs={12} md={6}>
                          <FormControl fullWidth>
                            <InputLabel>Frequency</InputLabel>
                            <Select
                              value={newItem.frequency}
                              onChange={(e) => setNewItem({ ...newItem, frequency: e.target.value })}
                              label="Frequency"
                            >
                              <MenuItem value="Once daily">Once daily</MenuItem>
                              <MenuItem value="Twice daily">Twice daily</MenuItem>
                              <MenuItem value="Three times daily">Three times daily</MenuItem>
                              <MenuItem value="Four times daily">Four times daily</MenuItem>
                              <MenuItem value="As needed">As needed</MenuItem>
                              <MenuItem value="Before meals">Before meals</MenuItem>
                              <MenuItem value="After meals">After meals</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>

                        {/* Duration */}
                        <Grid item xs={12} md={6}>
                          <FormControl fullWidth>
                            <InputLabel>Duration</InputLabel>
                            <Select
                              value={newItem.duration}
                              onChange={(e) => setNewItem({ ...newItem, duration: e.target.value })}
                              label="Duration"
                            >
                              <MenuItem value="3 days">3 days</MenuItem>
                              <MenuItem value="5 days">5 days</MenuItem>
                              <MenuItem value="7 days">7 days</MenuItem>
                              <MenuItem value="10 days">10 days</MenuItem>
                              <MenuItem value="15 days">15 days</MenuItem>
                              <MenuItem value="1 month">1 month</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>

                        {/* Quantity */}
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Quantity"
                            type="number"
                            value={newItem.quantity}
                            onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                            inputProps={{ min: 1 }}
                          />
                        </Grid>

                        {/* Instructions */}
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Instructions"
                            value={newItem.instructions}
                            onChange={(e) => setNewItem({ ...newItem, instructions: e.target.value })}
                            placeholder="Take with food, etc."
                          />
                        </Grid>

                        {/* Add Button */}
                        <Grid item xs={12}>
                          <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleAddMedicine}
                            disabled={!selectedMedicine || !newItem.dosage || !newItem.frequency || !newItem.duration}
                          >
                            Add Medicine
                          </Button>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>

                  {/* Prescription Items Table */}
                  {prescriptionItems.length > 0 && (
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          Prescription Items ({prescriptionItems.length})
                        </Typography>
                        
                        <TableContainer>
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell>Medicine</TableCell>
                                <TableCell>Dosage</TableCell>
                                <TableCell>Frequency</TableCell>
                                <TableCell>Duration</TableCell>
                                <TableCell>Qty</TableCell>
                                <TableCell>Price</TableCell>
                                <TableCell>Total</TableCell>
                                <TableCell>Action</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {prescriptionItems.map((item, index) => {
                                const medicine = medicineOptions?.find(m => m.id === item.medicine_id);
                                return (
                                  <TableRow key={index}>
                                    <TableCell>
                                      <Typography variant="subtitle2">
                                        {medicine?.name}
                                      </Typography>
                                      <Typography variant="caption" color="textSecondary">
                                        {item.instructions}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>{item.dosage}</TableCell>
                                    <TableCell>{item.frequency}</TableCell>
                                    <TableCell>{item.duration}</TableCell>
                                    <TableCell>{item.quantity}</TableCell>
                                    <TableCell>₹{item.unit_price}</TableCell>
                                    <TableCell>₹{(item.quantity * item.unit_price).toFixed(2)}</TableCell>
                                    <TableCell>
                                      <IconButton
                                        color="error"
                                        onClick={() => handleRemoveMedicine(index)}
                                        size="small"
                                      >
                                        <DeleteIcon />
                                      </IconButton>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                              <TableRow>
                                <TableCell colSpan={6} sx={{ textAlign: 'right', fontWeight: 'bold' }}>
                                  Total Amount:
                                </TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>
                                  ₹{calculateTotal().toFixed(2)}
                                </TableCell>
                                <TableCell />
                              </TableRow>
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  )}

                  {prescriptionItems.length === 0 && (
                    <Alert severity="info">
                      No medicines added yet. Search and add medicines to create the prescription.
                    </Alert>
                  )}
                </Box>
              )}

              {activeStep === 4 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Complete Consultation
                  </Typography>
                  
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                    Please review all consultation details before completing.
                  </Typography>

                  <Grid container spacing={3}>
                    {/* Consultation Summary */}
                    <Grid item xs={12} md={6}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Consultation Summary
                          </Typography>
                          
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="textSecondary">
                              Chief Complaint
                            </Typography>
                            <Typography variant="body2">
                              {consultationForm.chief_complaint || 'Not provided'}
                            </Typography>
                          </Box>

                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="textSecondary">
                              Diagnosis
                            </Typography>
                            <Typography variant="body2">
                              {consultationForm.diagnosis || 'Not provided'}
                            </Typography>
                          </Box>

                          {consultationForm.symptoms && (
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" color="textSecondary">
                                Symptoms
                              </Typography>
                              <Typography variant="body2">
                                {consultationForm.symptoms}
                              </Typography>
                            </Box>
                          )}

                          {consultationForm.clinical_notes && (
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" color="textSecondary">
                                Clinical Notes
                              </Typography>
                              <Typography variant="body2">
                                {consultationForm.clinical_notes}
                              </Typography>
                            </Box>
                          )}

                          {consultationForm.doctor_instructions && (
                            <Box>
                              <Typography variant="subtitle2" color="textSecondary">
                                Doctor Instructions
                              </Typography>
                              <Typography variant="body2">
                                {consultationForm.doctor_instructions}
                              </Typography>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Prescription Summary */}
                    <Grid item xs={12} md={6}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Prescription Summary
                            <Badge 
                              badgeContent={prescriptionItems.length} 
                              color="primary" 
                              sx={{ ml: 1 }}
                            />
                          </Typography>
                          
                          {prescriptionItems.length === 0 ? (
                            <Alert severity="info">
                              No prescription created for this consultation.
                            </Alert>
                          ) : (
                            <Box>
                              {prescriptionItems.map((item, index) => {
                                const medicine = medicineOptions?.find(m => m.id === item.medicine_id);
                                return (
                                  <Box key={index} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                                    <Typography variant="subtitle2">
                                      {medicine?.name}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                      {item.dosage} • {item.frequency} • {item.duration}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                      Qty: {item.quantity} • ₹{(item.quantity * item.unit_price).toFixed(2)}
                                    </Typography>
                                  </Box>
                                );
                              })}
                              
                              <Divider sx={{ my: 2 }} />
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="subtitle1">
                                  Total Amount:
                                </Typography>
                                <Typography variant="h6" color="primary">
                                  ₹{calculateTotal().toFixed(2)}
                                </Typography>
                              </Box>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Validation and Completion */}
                    <Grid item xs={12}>
                      {!consultationForm.diagnosis && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                          Diagnosis is required to complete the consultation.
                        </Alert>
                      )}
                      
                      {consultationForm.diagnosis && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                          Consultation is ready to be completed.
                        </Alert>
                      )}

                      <Card>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Complete Consultation
                          </Typography>
                          
                          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                            By completing this consultation, you confirm that:
                          </Typography>
                          
                          <List dense>
                            <ListItem>
                              <ListItemIcon>
                                <CheckIcon color="success" />
                              </ListItemIcon>
                              <ListItemText primary="All consultation details are accurate" />
                            </ListItem>
                            <ListItem>
                              <ListItemIcon>
                                <CheckIcon color="success" />
                              </ListItemIcon>
                              <ListItemText primary="Prescription (if any) is correct" />
                            </ListItem>
                            <ListItem>
                              <ListItemIcon>
                                <CheckIcon color="success" />
                              </ListItemIcon>
                              <ListItemText primary="Patient has been properly informed" />
                            </ListItem>
                          </List>

                          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                            <Button
                              variant="contained"
                              size="large"
                              onClick={handleCompleteConsultation}
                              disabled={!consultationForm.diagnosis || completingConsultation}
                              startIcon={completingConsultation ? <CircularProgress size={20} /> : <CheckIcon />}
                            >
                              {completingConsultation ? 'Completing...' : 'Complete Consultation'}
                            </Button>
                            
                            <Button
                              variant="outlined"
                              size="large"
                              onClick={() => navigate('/doctor/appointments')}
                            >
                              Cancel
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Box>

            {/* Navigation Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button
                variant="outlined"
                onClick={handleBack}
                disabled={activeStep === 0}
              >
                Back
              </Button>
              
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={activeStep === consultationSteps.length - 1}
              >
                {activeStep === consultationSteps.length - 2 ? 'Complete' : 'Next'}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};