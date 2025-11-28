/**
 * Dental Prescription Builder Component
 * Simplified prescription creation for dental consultations
 * Reuses existing prescription and medicine APIs
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Autocomplete,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useToast } from '../common/Toast';
import {
  useSearchMedicinesQuery,
  useCreatePrescriptionMutation,
  useGetShortKeyByCodeQuery,
  type Medicine,
  type PrescriptionItemForm,
  type ShortKey
} from '../../store/api';

interface DentalPrescriptionBuilderProps {
  patientMobileNumber: string;
  patientFirstName: string;
  patientUuid: string;
  appointmentId: string;
  doctorId: string;
  dentalNotes?: string;
  onSuccess?: (prescriptionId: string) => void;
  onCancel?: () => void;
}

export const DentalPrescriptionBuilder: React.FC<DentalPrescriptionBuilderProps> = ({
  patientMobileNumber,
  patientFirstName,
  patientUuid,
  appointmentId,
  doctorId,
  dentalNotes = '',
  onSuccess,
  onCancel,
}) => {
  // Toast hook
  const toast = useToast();

  // State
  const [medicineSearch, setMedicineSearch] = useState('');
  const [shortKeyCode, setShortKeyCode] = useState('');
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItemForm[]>([]);
  const [consultationNotes, setConsultationNotes] = useState({
    chief_complaint: 'Dental consultation',
    diagnosis: '',
    symptoms: '',
    clinical_notes: dentalNotes,
    doctor_instructions: '',
  });

  // New item form
  const [newItem, setNewItem] = useState<Partial<PrescriptionItemForm>>({
    dosage: '1 tablet',
    frequency: 'Twice daily',
    duration: '5 days',
    instructions: 'After meals',
    quantity: 1,
  });

  // API hooks
  const { data: medicineOptions, isLoading: medicineSearchLoading } = useSearchMedicinesQuery(
    { search: medicineSearch, limit: 20 },
    { skip: medicineSearch.length < 2 }
  );

  // Short key lookup - only trigger when shortKeyCode is set
  const { data: shortKeyData, isLoading: shortKeyLoading } = useGetShortKeyByCodeQuery(
    shortKeyCode,
    { skip: !shortKeyCode }
  );

  const [createPrescription, { isLoading: creatingPrescription }] = useCreatePrescriptionMutation();

  // Effect: Load medicines when short key data arrives
  React.useEffect(() => {
    if (shortKeyData && shortKeyData.medicines) {
      const newItems = [...shortKeyData.medicines]
        .sort((a, b) => a.sequence_order - b.sequence_order)
        .map((skMed) => ({
          medicine_id: skMed.medicine_id,
          dosage: skMed.default_dosage || '1 tablet',
          frequency: skMed.default_frequency || 'Twice daily',
          duration: skMed.default_duration || '5 days',
          instructions: skMed.default_instructions || 'After meals',
          quantity: 1,
          unit_price: skMed.medicine?.price || 0,
          sequence_order: prescriptionItems.length + skMed.sequence_order,
          medicine_name: skMed.medicine?.name || '',
          medicine_generic_name: skMed.medicine?.generic_name || '',
        }));

      setPrescriptionItems([...prescriptionItems, ...newItems]);
      setMedicineSearch('');
      setShortKeyCode('');
      toast.success(`Loaded ${shortKeyData.medicines.length} medicines from shortcut "${shortKeyData.code}"`);
    }
  }, [shortKeyData]);

  // Handlers
  const handleShortKeyInput = (input: string) => {
    setMedicineSearch(input);

    // Check if input starts with / (shortcut trigger)
    if (input.startsWith('/') && input.length > 1) {
      const code = input.substring(1).toUpperCase();
      // Only trigger API call if we have at least 2 characters after /
      if (code.length >= 2) {
        setShortKeyCode(code);
      }
    } else {
      setShortKeyCode('');
    }
  };

  const handleAddMedicine = () => {
    if (!selectedMedicine) return;

    // Validate dosage is not empty
    const dosageValue = newItem.dosage?.trim() || '1 tablet';

    const prescriptionItem: PrescriptionItemForm = {
      medicine_id: selectedMedicine.id,
      dosage: dosageValue,
      frequency: newItem.frequency || 'Twice daily',
      duration: newItem.duration || '5 days',
      instructions: newItem.instructions || 'After meals',
      quantity: newItem.quantity || 1,
      unit_price: selectedMedicine.price || 0,
      sequence_order: prescriptionItems.length + 1,
      medicine_name: selectedMedicine.name,
      medicine_generic_name: selectedMedicine.generic_name,
    };

    setPrescriptionItems([...prescriptionItems, prescriptionItem]);

    // Reset form
    setSelectedMedicine(null);
    setMedicineSearch('');
    setNewItem({
      dosage: '1 tablet',
      frequency: 'Twice daily',
      duration: '5 days',
      instructions: 'After meals',
      quantity: 1,
    });
  };

  const handleRemoveMedicine = (index: number) => {
    setPrescriptionItems(prescriptionItems.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, field: string, value: any) => {
    const updatedItems = [...prescriptionItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setPrescriptionItems(updatedItems);
  };

  const calculateTotal = () => {
    return prescriptionItems.reduce((total, item) => {
      return total + (item.quantity * item.unit_price);
    }, 0);
  };

  const handleCreatePrescription = async () => {
    if (prescriptionItems.length === 0) {
      toast.warning('Please add at least one medicine');
      return;
    }

    const prescriptionData = {
      patient_mobile_number: patientMobileNumber,
      patient_first_name: patientFirstName,
      patient_uuid: patientUuid,
      doctor_id: doctorId,
      appointment_id: appointmentId,
      visit_date: new Date().toISOString().split('T')[0],
      chief_complaint: consultationNotes.chief_complaint,
      diagnosis: consultationNotes.diagnosis || 'Dental treatment',
      symptoms: consultationNotes.symptoms,
      clinical_notes: consultationNotes.clinical_notes,
      doctor_instructions: consultationNotes.doctor_instructions,
      items: prescriptionItems,
    };

    try {
      const result = await createPrescription(prescriptionData).unwrap();
      if (onSuccess && result.id) {
        onSuccess(result.id);
      }
    } catch (error) {
      console.error('Failed to create prescription:', error);
      toast.error('Failed to create prescription. Please try again.');
    }
  };

  const getMedicineName = (item: PrescriptionItemForm) => {
    // First try to use the stored names
    if (item.medicine_generic_name || item.medicine_name) {
      return item.medicine_generic_name || item.medicine_name;
    }

    // Fallback: search in medicineOptions
    const medicine = medicineOptions?.find(m => m.id === item.medicine_id);
    if (medicine) {
      return medicine.generic_name || medicine.name;
    }

    // Last fallback: check shortKeyData
    if (shortKeyData) {
      const skMed = shortKeyData.medicines.find(m => m.medicine_id === item.medicine_id);
      if (skMed?.medicine) {
        return skMed.medicine.generic_name || skMed.medicine.name;
      }
    }

    return 'Unknown medicine';
  };

  return (
    <Box>
      {/* Consultation Notes */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Consultation Details
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Diagnosis"
            value={consultationNotes.diagnosis}
            onChange={(e) => setConsultationNotes({ ...consultationNotes, diagnosis: e.target.value })}
            placeholder="e.g., Dental caries, Gingivitis, Root canal treatment"
            fullWidth
          />
          <TextField
            label="Clinical Notes"
            value={consultationNotes.clinical_notes}
            onChange={(e) => setConsultationNotes({ ...consultationNotes, clinical_notes: e.target.value })}
            multiline
            rows={2}
            fullWidth
          />
          <TextField
            label="Doctor Instructions"
            value={consultationNotes.doctor_instructions}
            onChange={(e) => setConsultationNotes({ ...consultationNotes, doctor_instructions: e.target.value })}
            placeholder="e.g., Apply cold compress, Avoid hard foods, Follow up in 7 days"
            multiline
            rows={2}
            fullWidth
          />
        </Box>
      </Paper>

      {/* Medicine Builder */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Add Medicines
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Medicine Search */}
          <Autocomplete
            value={selectedMedicine}
            onChange={(_, newValue) => setSelectedMedicine(newValue)}
            inputValue={medicineSearch}
            onInputChange={(_, newInputValue) => handleShortKeyInput(newInputValue)}
            options={medicineOptions || []}
            getOptionLabel={(option) => `${option.generic_name || option.name} (${option.name})`}
            loading={medicineSearchLoading || shortKeyLoading}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search Medicine or Shortcut"
                placeholder="Type to search or /CODE for shortcut..."
                helperText="Tip: Type /RCA to load multiple medicines at once"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {(medicineSearchLoading || shortKeyLoading) ? <CircularProgress size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />

          {/* Medicine Details */}
          {selectedMedicine && (
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Dosage *"
                value={newItem.dosage}
                onChange={(e) => setNewItem({ ...newItem, dosage: e.target.value })}
                placeholder="e.g., 500mg, 1 tablet"
                helperText="Required"
                size="small"
                required
              />
              <TextField
                label="Frequency"
                value={newItem.frequency}
                onChange={(e) => setNewItem({ ...newItem, frequency: e.target.value })}
                placeholder="e.g., Twice daily, After meals"
                size="small"
              />
              <TextField
                label="Duration"
                value={newItem.duration}
                onChange={(e) => setNewItem({ ...newItem, duration: e.target.value })}
                placeholder="e.g., 5 days, 1 week"
                size="small"
              />
              <TextField
                label="Quantity"
                type="number"
                value={newItem.quantity}
                onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                size="small"
              />
              <TextField
                label="Instructions"
                value={newItem.instructions}
                onChange={(e) => setNewItem({ ...newItem, instructions: e.target.value })}
                placeholder="e.g., After meals, With water"
                size="small"
                sx={{ gridColumn: 'span 2' }}
              />
            </Box>
          )}

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddMedicine}
            disabled={!selectedMedicine}
          >
            Add Medicine
          </Button>
        </Box>
      </Paper>

      {/* Medicines List */}
      {prescriptionItems.length > 0 && (
        <Paper elevation={1} sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ p: 2 }}>
            Prescription Items ({prescriptionItems.length})
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Medicine</TableCell>
                  <TableCell>Dosage</TableCell>
                  <TableCell>Frequency</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Qty</TableCell>
                  <TableCell align="right">Price</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {prescriptionItems.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {getMedicineName(item)}
                      </Typography>
                      <TextField
                        value={item.instructions}
                        onChange={(e) => handleUpdateItem(index, 'instructions', e.target.value)}
                        size="small"
                        placeholder="Instructions"
                        fullWidth
                        variant="standard"
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        value={item.dosage}
                        onChange={(e) => handleUpdateItem(index, 'dosage', e.target.value)}
                        size="small"
                        placeholder="Dosage"
                        variant="standard"
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        value={item.frequency}
                        onChange={(e) => handleUpdateItem(index, 'frequency', e.target.value)}
                        size="small"
                        placeholder="Frequency"
                        variant="standard"
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        value={item.duration}
                        onChange={(e) => handleUpdateItem(index, 'duration', e.target.value)}
                        size="small"
                        placeholder="Duration"
                        variant="standard"
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleUpdateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        size="small"
                        placeholder="Qty"
                        variant="standard"
                        inputProps={{ min: 1 }}
                        sx={{ width: 60 }}
                      />
                    </TableCell>
                    <TableCell align="right">₹{(item.quantity * item.unit_price).toFixed(2)}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleRemoveMedicine(index)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={5} align="right">
                    <Typography variant="subtitle1" fontWeight="bold">
                      Total:
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Chip label={`₹${calculateTotal().toFixed(2)}`} color="primary" />
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Info Alert */}
      {prescriptionItems.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Search and add medicines to create a prescription for this dental consultation.
        </Alert>
      )}

      {/* Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        {onCancel && (
          <Button variant="outlined" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          variant="contained"
          onClick={handleCreatePrescription}
          disabled={prescriptionItems.length === 0 || creatingPrescription}
        >
          {creatingPrescription ? 'Creating...' : 'Create Prescription'}
        </Button>
      </Box>
    </Box>
  );
};

export default DentalPrescriptionBuilder;
