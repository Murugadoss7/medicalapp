/**
 * Dental Procedure Form Component
 * Form for creating and editing dental procedures
 */

import React, { useState } from 'react';
import {
  Box,
  TextField,
  MenuItem,
  Button,
  Grid,
  Paper,
  Typography,
  Alert,
  Chip,
  InputAdornment,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';

// Procedure statuses
const PROCEDURE_STATUSES = [
  { value: 'planned', label: 'Planned', color: 'info' },
  { value: 'in_progress', label: 'In Progress', color: 'warning' },
  { value: 'completed', label: 'Completed', color: 'success' },
  { value: 'cancelled', label: 'Cancelled', color: 'error' },
];

// Common dental procedure codes (CDT codes)
const COMMON_PROCEDURES = [
  { code: 'D0120', name: 'Periodic Oral Evaluation' },
  { code: 'D0140', name: 'Limited Oral Evaluation' },
  { code: 'D0210', name: 'Intraoral Complete Series X-rays' },
  { code: 'D1110', name: 'Prophylaxis - Adult' },
  { code: 'D1120', name: 'Prophylaxis - Child' },
  { code: 'D2140', name: 'Amalgam - One Surface' },
  { code: 'D2150', name: 'Amalgam - Two Surfaces' },
  { code: 'D2160', name: 'Amalgam - Three Surfaces' },
  { code: 'D2330', name: 'Resin - One Surface (Anterior)' },
  { code: 'D2391', name: 'Resin - One Surface (Posterior)' },
  { code: 'D2740', name: 'Crown - Porcelain/Ceramic' },
  { code: 'D2750', name: 'Crown - Porcelain Fused to Metal' },
  { code: 'D2920', name: 'Root Canal - Anterior' },
  { code: 'D3310', name: 'Root Canal - Anterior' },
  { code: 'D3320', name: 'Root Canal - Bicuspid' },
  { code: 'D3330', name: 'Root Canal - Molar' },
  { code: 'D7140', name: 'Extraction - Erupted Tooth' },
  { code: 'D7210', name: 'Extraction - Impacted Tooth' },
  { code: 'D7240', name: 'Removal of Impacted Tooth' },
  { code: 'CUSTOM', name: 'Custom Procedure' },
];

interface DentalProcedureFormData {
  procedureCode: string;
  procedureName: string;
  toothNumbers?: string;
  description?: string;
  estimatedCost?: number;
  actualCost?: number;
  durationMinutes?: number;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  procedureDate?: Date | null;
  completedDate?: Date | null;
  procedureNotes?: string;
  complications?: string;
}

interface DentalProcedureFormProps {
  initialData?: Partial<DentalProcedureFormData>;
  selectedTooth?: string;
  onSubmit: (data: DentalProcedureFormData) => void;
  onCancel: () => void;
  isEditing?: boolean;
  // Multi-tooth and simplified mode support
  selectedTeeth?: string[];
  simplified?: boolean;
}

const DentalProcedureForm: React.FC<DentalProcedureFormProps> = ({
  initialData,
  selectedTooth,
  onSubmit,
  onCancel,
  isEditing = false,
  // New props with defaults
  selectedTeeth = [],
  simplified = false,
}) => {
  // Determine tooth numbers from selectedTeeth array or single selectedTooth
  const toothNumbersValue = selectedTeeth.length > 0
    ? selectedTeeth.join(',')
    : (selectedTooth || initialData?.toothNumbers || '');

  const [formData, setFormData] = useState<DentalProcedureFormData>({
    procedureCode: initialData?.procedureCode || '',
    procedureName: initialData?.procedureName || '',
    toothNumbers: toothNumbersValue,
    description: initialData?.description || '',
    estimatedCost: initialData?.estimatedCost,
    actualCost: initialData?.actualCost,
    durationMinutes: initialData?.durationMinutes || 30,
    // Default to 'completed' in simplified mode (procedure being done now)
    status: initialData?.status || (simplified ? 'completed' : 'planned'),
    // Default to today in simplified mode
    procedureDate: initialData?.procedureDate || (simplified ? new Date() : null),
    completedDate: initialData?.completedDate || null,
    procedureNotes: initialData?.procedureNotes || '',
    complications: initialData?.complications || '',
  });

  // Track if CUSTOM procedure is selected (for showing custom name field)
  const isCustomProcedure = formData.procedureCode === 'CUSTOM';

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Handle form field changes
  const handleChange = (field: keyof DentalProcedureFormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = event.target.value;

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

  // Handle procedure selection from dropdown
  const handleProcedureSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedCode = event.target.value;
    const procedure = COMMON_PROCEDURES.find(p => p.code === selectedCode);

    if (procedure) {
      setFormData(prev => ({
        ...prev,
        procedureCode: procedure.code,
        procedureName: procedure.code === 'CUSTOM' ? '' : procedure.name,
      }));
    }
  };

  // Handle date changes
  const handleProcedureDateChange = (date: Date | null) => {
    setFormData(prev => ({ ...prev, procedureDate: date }));
  };

  const handleCompletedDateChange = (date: Date | null) => {
    setFormData(prev => ({ ...prev, completedDate: date }));
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (simplified) {
      // Simplified mode: just need a procedure selected or custom name entered
      if (!formData.procedureCode) {
        newErrors.procedureCode = 'Please select a procedure';
      }
      if (isCustomProcedure && !formData.procedureName) {
        newErrors.procedureName = 'Please enter the procedure name';
      }
    } else {
      // Full mode: require code and name
      if (!formData.procedureCode) {
        newErrors.procedureCode = 'Procedure code is required';
      }

      if (!formData.procedureName) {
        newErrors.procedureName = 'Procedure name is required';
      }

      if (formData.estimatedCost && formData.estimatedCost < 0) {
        newErrors.estimatedCost = 'Cost cannot be negative';
      }

      if (formData.actualCost && formData.actualCost < 0) {
        newErrors.actualCost = 'Cost cannot be negative';
      }
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

  // Render simplified form (4 fields only)
  const renderSimplifiedForm = () => (
    <Grid container spacing={2}>
      {/* Procedure Selection Dropdown */}
      <Grid item xs={12}>
        <TextField
          fullWidth
          select
          label="Select Procedure"
          value={formData.procedureCode}
          onChange={handleProcedureSelect}
          error={Boolean(errors.procedureCode)}
          helperText={errors.procedureCode || 'Choose a procedure or select CUSTOM'}
        >
          {COMMON_PROCEDURES.map(proc => (
            <MenuItem key={proc.code} value={proc.code}>
              {proc.code === 'CUSTOM' ? '✏️ Custom Procedure (enter manually)' : `${proc.name}`}
            </MenuItem>
          ))}
        </TextField>
      </Grid>

      {/* Custom Procedure Name (only if CUSTOM selected) */}
      {isCustomProcedure && (
        <Grid item xs={12}>
          <TextField
            fullWidth
            required
            label="Custom Procedure Name"
            value={formData.procedureName}
            onChange={handleChange('procedureName')}
            error={Boolean(errors.procedureName)}
            helperText={errors.procedureName || 'Enter the procedure name'}
            placeholder="e.g., Dental Cleaning, Tooth Extraction"
          />
        </Grid>
      )}

      {/* Date/Time */}
      <Grid item xs={12}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="Procedure Date"
            value={formData.procedureDate}
            onChange={handleProcedureDateChange}
            slotProps={{
              textField: {
                fullWidth: true,
                helperText: 'When was/will this procedure be done?',
              },
            }}
          />
        </LocalizationProvider>
      </Grid>

      {/* Comments/Notes */}
      <Grid item xs={12}>
        <TextField
          fullWidth
          multiline
          rows={3}
          label="Comments / Notes"
          value={formData.procedureNotes}
          onChange={handleChange('procedureNotes')}
          placeholder="Technique used, patient response, post-op instructions..."
        />
      </Grid>
    </Grid>
  );

  // Render full form (existing 12+ fields)
  const renderFullForm = () => (
    <Grid container spacing={3}>
      {/* Procedure Selection */}
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          select
          label="Select Procedure"
          value={formData.procedureCode}
          onChange={handleProcedureSelect}
          error={Boolean(errors.procedureCode)}
          helperText={errors.procedureCode || 'Choose from common procedures'}
        >
          {COMMON_PROCEDURES.map(proc => (
            <MenuItem key={proc.code} value={proc.code}>
              {proc.code} - {proc.name}
            </MenuItem>
          ))}
        </TextField>
      </Grid>

      {/* Procedure Code */}
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          required
          label="Procedure Code"
          value={formData.procedureCode}
          onChange={handleChange('procedureCode')}
          error={Boolean(errors.procedureCode)}
          helperText={errors.procedureCode || 'CDT code or custom code'}
        />
      </Grid>

      {/* Procedure Name */}
      <Grid item xs={12}>
        <TextField
          fullWidth
          required
          label="Procedure Name"
          value={formData.procedureName}
          onChange={handleChange('procedureName')}
          error={Boolean(errors.procedureName)}
          helperText={errors.procedureName}
        />
      </Grid>

      {/* Tooth Numbers */}
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Tooth Numbers (FDI)"
          value={formData.toothNumbers}
          onChange={handleChange('toothNumbers')}
          helperText="Comma-separated (e.g., 11,12,13)"
          disabled={Boolean(selectedTooth) || selectedTeeth.length > 0}
        />
      </Grid>

      {/* Status */}
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          select
          label="Status"
          value={formData.status}
          onChange={handleChange('status')}
        >
          {PROCEDURE_STATUSES.map(status => (
            <MenuItem key={status.value} value={status.value}>
              {status.label}
            </MenuItem>
          ))}
        </TextField>
      </Grid>

      {/* Description */}
      <Grid item xs={12}>
        <TextField
          fullWidth
          multiline
          rows={2}
          label="Description"
          value={formData.description}
          onChange={handleChange('description')}
          placeholder="Detailed procedure description..."
        />
      </Grid>

      {/* Estimated Cost */}
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          type="number"
          label="Estimated Cost"
          value={formData.estimatedCost || ''}
          onChange={handleChange('estimatedCost')}
          error={Boolean(errors.estimatedCost)}
          helperText={errors.estimatedCost}
          InputProps={{
            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
          }}
        />
      </Grid>

      {/* Actual Cost */}
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          type="number"
          label="Actual Cost"
          value={formData.actualCost || ''}
          onChange={handleChange('actualCost')}
          error={Boolean(errors.actualCost)}
          helperText={errors.actualCost}
          InputProps={{
            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
          }}
        />
      </Grid>

      {/* Duration */}
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          type="number"
          label="Duration (minutes)"
          value={formData.durationMinutes || ''}
          onChange={handleChange('durationMinutes')}
          InputProps={{
            inputProps: { min: 1, max: 480 },
          }}
        />
      </Grid>

      {/* Procedure Date */}
      <Grid item xs={12} sm={6}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="Procedure Date"
            value={formData.procedureDate}
            onChange={handleProcedureDateChange}
            slotProps={{
              textField: {
                fullWidth: true,
              },
            }}
          />
        </LocalizationProvider>
      </Grid>

      {/* Completed Date */}
      {formData.status === 'completed' && (
        <Grid item xs={12} sm={6}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Completed Date"
              value={formData.completedDate}
              onChange={handleCompletedDateChange}
              slotProps={{
                textField: {
                  fullWidth: true,
                },
              }}
            />
          </LocalizationProvider>
        </Grid>
      )}

      {/* Procedure Notes */}
      <Grid item xs={12}>
        <TextField
          fullWidth
          multiline
          rows={3}
          label="Procedure Notes"
          value={formData.procedureNotes}
          onChange={handleChange('procedureNotes')}
          placeholder="Add notes about the procedure, technique used, patient response, etc..."
        />
      </Grid>

      {/* Complications */}
      {(formData.status === 'completed' || formData.status === 'in_progress') && (
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Complications (if any)"
            value={formData.complications}
            onChange={handleChange('complications')}
            placeholder="Note any complications or adverse events..."
          />
        </Grid>
      )}
    </Grid>
  );

  // Get display text for selected teeth
  const getTeethDisplayText = () => {
    if (selectedTeeth.length > 0) {
      return selectedTeeth.length > 3
        ? `${selectedTeeth.length} teeth: #${selectedTeeth.slice(0, 3).join(', #')}...`
        : `Teeth #${selectedTeeth.join(', #')}`;
    }
    if (formData.toothNumbers) {
      return `Tooth #${formData.toothNumbers}`;
    }
    return null;
  };

  return (
    <Paper elevation={simplified ? 0 : 2} sx={{ p: simplified ? 0 : 3 }}>
      <Box component="form" onSubmit={handleSubmit}>
        {/* Header */}
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant={simplified ? 'subtitle1' : 'h6'} fontWeight={simplified ? 600 : 400}>
            {isEditing ? 'Edit' : 'Add'} Procedure
          </Typography>
          {getTeethDisplayText() && (
            <Chip label={getTeethDisplayText()} color="primary" size={simplified ? 'small' : 'medium'} />
          )}
        </Box>

        {/* Form Fields - conditional rendering based on simplified mode */}
        {simplified ? renderSimplifiedForm() : renderFullForm()}

        {/* Info Alert (only in full mode) */}
        {!simplified && (
          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="body2">
              <strong>CDT Codes:</strong> Current Dental Terminology codes standardized by the American Dental Association.
              Select from common procedures or enter a custom code.
            </Typography>
          </Alert>
        )}

        {/* Action Buttons */}
        <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            startIcon={<CancelIcon />}
            onClick={onCancel}
            size={simplified ? 'medium' : 'large'}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
            size={simplified ? 'medium' : 'large'}
          >
            {isEditing ? 'Update' : 'Save'} Procedure
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default DentalProcedureForm;
