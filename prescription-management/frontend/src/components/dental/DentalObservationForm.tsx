/**
 * Dental Observation Form Component
 * Form for creating and editing dental observations
 * Supports FDI notation, tooth surfaces, conditions, and severity levels
 */

import React, { useState } from 'react';
import {
  Box,
  TextField,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Button,
  Grid,
  Paper,
  Typography,
  Alert,
  Chip,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';

// Tooth surfaces
const TOOTH_SURFACES = [
  'Occlusal',
  'Mesial',
  'Distal',
  'Buccal',
  'Lingual',
  'Palatal',
  'Incisal',
];

// Dental conditions
const DENTAL_CONDITIONS = [
  'Cavity',
  'Decay',
  'Fracture',
  'Missing',
  'Filling',
  'Crown',
  'Root Canal',
  'Abscess',
  'Gum Disease',
  'Plaque',
  'Calculus',
  'Stain',
  'Mobility',
  'Other',
];

// Severity levels
const SEVERITY_LEVELS = ['Mild', 'Moderate', 'Severe'];

interface DentalObservationFormData {
  toothNumber: string;
  toothSurface?: string;
  conditionType: string;
  severity?: string;
  observationNotes?: string;
  treatmentRequired: boolean;
  treatmentDone: boolean;
  treatmentDate?: Date | null;
}

interface DentalObservationFormProps {
  initialData?: Partial<DentalObservationFormData>;
  selectedTooth?: string;
  onSubmit: (data: DentalObservationFormData) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

const DentalObservationForm: React.FC<DentalObservationFormProps> = ({
  initialData,
  selectedTooth,
  onSubmit,
  onCancel,
  isEditing = false,
}) => {
  const [formData, setFormData] = useState<DentalObservationFormData>({
    toothNumber: selectedTooth || initialData?.toothNumber || '',
    toothSurface: initialData?.toothSurface || '',
    conditionType: initialData?.conditionType || '',
    severity: initialData?.severity || '',
    observationNotes: initialData?.observationNotes || '',
    treatmentRequired: initialData?.treatmentRequired ?? true,
    treatmentDone: initialData?.treatmentDone ?? false,
    treatmentDate: initialData?.treatmentDate || null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validate FDI tooth number
  const validateToothNumber = (toothNum: string): boolean => {
    const num = parseInt(toothNum);
    if (isNaN(num)) return false;

    // Permanent teeth: 11-18, 21-28, 31-38, 41-48
    if (
      (num >= 11 && num <= 18) ||
      (num >= 21 && num <= 28) ||
      (num >= 31 && num <= 38) ||
      (num >= 41 && num <= 48)
    ) {
      return true;
    }

    // Primary teeth: 51-55, 61-65, 71-75, 81-85
    if (
      (num >= 51 && num <= 55) ||
      (num >= 61 && num <= 65) ||
      (num >= 71 && num <= 75) ||
      (num >= 81 && num <= 85)
    ) {
      return true;
    }

    return false;
  };

  // Handle form field changes
  const handleChange = (field: keyof DentalObservationFormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = event.target.type === 'checkbox'
      ? (event.target as HTMLInputElement).checked
      : event.target.value;

    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Handle date change
  const handleDateChange = (date: Date | null) => {
    setFormData(prev => ({
      ...prev,
      treatmentDate: date,
    }));
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.toothNumber) {
      newErrors.toothNumber = 'Tooth number is required';
    } else if (!validateToothNumber(formData.toothNumber)) {
      newErrors.toothNumber = 'Invalid FDI tooth number';
    }

    if (!formData.conditionType) {
      newErrors.conditionType = 'Condition type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Box component="form" onSubmit={handleSubmit}>
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {isEditing ? 'Edit' : 'Add'} Dental Observation
          </Typography>
          {formData.toothNumber && (
            <Chip label={`Tooth #${formData.toothNumber}`} color="primary" />
          )}
        </Box>

        {/* Form Fields */}
        <Grid container spacing={3}>
          {/* Tooth Number */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Tooth Number (FDI)"
              value={formData.toothNumber}
              onChange={handleChange('toothNumber')}
              error={Boolean(errors.toothNumber)}
              helperText={errors.toothNumber || 'e.g., 11, 21, 51 (FDI notation)'}
              disabled={Boolean(selectedTooth)}
            />
          </Grid>

          {/* Tooth Surface */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label="Tooth Surface (Optional)"
              value={formData.toothSurface}
              onChange={handleChange('toothSurface')}
            >
              <MenuItem value="">None</MenuItem>
              {TOOTH_SURFACES.map(surface => (
                <MenuItem key={surface} value={surface}>
                  {surface}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Condition Type */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              select
              label="Condition Type"
              value={formData.conditionType}
              onChange={handleChange('conditionType')}
              error={Boolean(errors.conditionType)}
              helperText={errors.conditionType}
            >
              {DENTAL_CONDITIONS.map(condition => (
                <MenuItem key={condition} value={condition}>
                  {condition}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Severity */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label="Severity (Optional)"
              value={formData.severity}
              onChange={handleChange('severity')}
            >
              <MenuItem value="">None</MenuItem>
              {SEVERITY_LEVELS.map(level => (
                <MenuItem key={level} value={level}>
                  {level}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Observation Notes */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Observation Notes"
              value={formData.observationNotes}
              onChange={handleChange('observationNotes')}
              placeholder="Add detailed observations, findings, or recommendations..."
            />
          </Grid>

          {/* Treatment Checkboxes */}
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.treatmentRequired}
                  onChange={handleChange('treatmentRequired')}
                />
              }
              label="Treatment Required"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.treatmentDone}
                  onChange={handleChange('treatmentDone')}
                />
              }
              label="Treatment Done"
            />
          </Grid>

          {/* Treatment Date */}
          {formData.treatmentDone && (
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Treatment Date"
                  value={formData.treatmentDate}
                  onChange={handleDateChange}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    },
                  }}
                />
              </LocalizationProvider>
            </Grid>
          )}
        </Grid>

        {/* Info Alert */}
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>FDI Notation:</strong> Permanent teeth: 11-48 (32 teeth), Primary teeth: 51-85 (20 teeth).
            Quadrants are numbered 1-4 for permanent and 5-8 for primary dentition.
          </Typography>
        </Alert>

        {/* Action Buttons */}
        <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            startIcon={<CancelIcon />}
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
          >
            {isEditing ? 'Update' : 'Save'} Observation
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default DentalObservationForm;
