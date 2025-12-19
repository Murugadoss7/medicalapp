/**
 * NewObservationForm Component
 * Form for creating new observations in the left panel
 * Features tablet-optimized button groups for condition and severity selection
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Chip,
  FormControlLabel,
  Checkbox,
  Divider,
  IconButton,
  Paper,
} from '@mui/material';
import {
  Save as SaveIcon,
  Clear as ClearIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ButtonGroupSelect from '../common/ButtonGroupSelect';
import TemplateNotesSelector from './TemplateNotesSelector';
import { type ObservationData, type ProcedureData } from './ObservationRow';

// Dental conditions (from ObservationRow.tsx)
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

// Common procedures
const COMMON_PROCEDURES = [
  { code: 'D0120', name: 'Periodic Oral Evaluation' },
  { code: 'D0140', name: 'Limited Oral Evaluation' },
  { code: 'D0210', name: 'Intraoral Complete Series X-rays' },
  { code: 'D1110', name: 'Prophylaxis - Adult' },
  { code: 'D1120', name: 'Prophylaxis - Child' },
  { code: 'D2140', name: 'Amalgam - One Surface' },
  { code: 'D2150', name: 'Amalgam - Two Surfaces' },
  { code: 'D2160', name: 'Amalgam - Three Surfaces' },
  { code: 'D2330', name: 'Resin - One Surface' },
  { code: 'D2391', name: 'Resin - One Surface (Posterior)' },
  { code: 'D2740', name: 'Crown - Porcelain/Ceramic' },
  { code: 'D2750', name: 'Crown - Porcelain Fused to Metal' },
  { code: 'D3310', name: 'Root Canal - Anterior' },
  { code: 'D3320', name: 'Root Canal - Bicuspid' },
  { code: 'D3330', name: 'Root Canal - Molar' },
  { code: 'D7140', name: 'Extraction - Simple' },
  { code: 'D7210', name: 'Extraction - Surgical' },
  { code: 'CUSTOM', name: 'Custom Procedure' },
];

// Procedure statuses
const PROCEDURE_STATUSES = ['Planned', 'Completed', 'Cancelled'];

interface NewObservationFormProps {
  observation: ObservationData;
  onUpdate: (obs: ObservationData) => void;
  onSave: () => Promise<void>;
  onClear: () => void;
  saving?: boolean;
  isEditMode?: boolean;
}

const NewObservationForm: React.FC<NewObservationFormProps> = ({
  observation,
  onUpdate,
  onSave,
  onClear,
  saving = false,
  isEditMode = false,
}) => {
  // Auto-show procedures section when in edit mode with existing procedures
  const hasProcedures = observation.procedures && observation.procedures.length > 0;
  const [showProcedures, setShowProcedures] = useState(isEditMode && hasProcedures);
  const [showAllProcedures, setShowAllProcedures] = useState(false);

  // Update showProcedures when edit mode changes
  React.useEffect(() => {
    if (isEditMode && (observation.procedures?.length || observation.hasProcedure)) {
      setShowProcedures(true);
    }
  }, [isEditMode, observation.procedures, observation.hasProcedure]);

  const handleChange = (field: keyof ObservationData, value: any) => {
    onUpdate({ ...observation, [field]: value });
  };

  const isValid = observation.selectedTeeth.length > 0 && observation.conditionType;

  const handleSave = async () => {
    if (!isValid) {
      return;
    }
    await onSave();
  };

  // Generate unique ID for procedures
  const generateProcedureId = () => `proc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Add new procedure
  const handleAddProcedure = () => {
    const newProcedure: ProcedureData = {
      id: generateProcedureId(),
      selectedTeeth: [...observation.selectedTeeth], // Default to all observation teeth
      procedureCode: '',
      procedureName: '',
      customProcedureName: '',
      procedureDate: new Date(),
      procedureTime: new Date(),
      procedureNotes: '',
      procedureStatus: 'planned',
    };

    const updatedProcedures = [...(observation.procedures || []), newProcedure];
    onUpdate({
      ...observation,
      procedures: updatedProcedures,
      hasProcedure: true,
    });
  };

  // Remove procedure
  const handleRemoveProcedure = (procedureId: string) => {
    const updatedProcedures = observation.procedures.filter(p => p.id !== procedureId);
    onUpdate({
      ...observation,
      procedures: updatedProcedures,
      hasProcedure: updatedProcedures.length > 0,
    });
  };

  // Update specific procedure
  const handleUpdateProcedure = (procedureId: string, field: keyof ProcedureData, value: any) => {
    const updatedProcedures = observation.procedures.map(p =>
      p.id === procedureId ? { ...p, [field]: value } : p
    );
    onUpdate({ ...observation, procedures: updatedProcedures });
  };

  // Toggle tooth selection for a procedure
  const handleToggleProcedureTooth = (procedureId: string, toothNumber: string) => {
    const procedure = observation.procedures.find(p => p.id === procedureId);
    if (!procedure) return;

    const updatedTeeth = procedure.selectedTeeth.includes(toothNumber)
      ? procedure.selectedTeeth.filter(t => t !== toothNumber)
      : [...procedure.selectedTeeth, toothNumber];

    handleUpdateProcedure(procedureId, 'selectedTeeth', updatedTeeth);
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Edit Mode Banner */}
      {isEditMode && (
        <Box
          sx={{
            bgcolor: 'info.light',
            color: 'info.contrastText',
            px: 2,
            py: 1,
            mb: 1.5,
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Typography variant="body2" fontWeight="bold">
            ✏️ Edit Mode - Modify the observation below and click Update to save changes
          </Typography>
        </Box>
      )}

      {/* Sticky Header: Selected Teeth + Buttons - All in One Line */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          bgcolor: 'background.paper',
          pb: 1.5,
          mb: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          {/* Left: Label + Selected Teeth */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 500,
                fontSize: '0.75rem',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              Selected Teeth *
            </Typography>
            <Box
              sx={{
                display: 'flex',
                gap: 0.5,
                flexWrap: 'wrap',
                alignItems: 'center',
                flex: 1,
                minHeight: 32,
                p: 0.5,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                bgcolor: 'grey.50',
              }}
            >
              {observation.selectedTeeth.length > 0 ? (
                observation.selectedTeeth.map((tooth) => (
                  <Chip
                    key={tooth}
                    label={`#${tooth}`}
                    color="primary"
                    size="small"
                    sx={{ fontSize: '0.7rem', fontWeight: 500, height: 22 }}
                  />
                ))
              ) : (
                <Typography variant="caption" color="text.secondary" fontStyle="italic" sx={{ px: 0.5 }}>
                  Click teeth on chart
                </Typography>
              )}
            </Box>
          </Box>

          {/* Right: Action Buttons */}
          <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
            <Button
              variant="outlined"
              size="small"
              color={isEditMode ? 'error' : 'inherit'}
              startIcon={isEditMode ? <CloseIcon /> : <ClearIcon />}
              onClick={onClear}
              disabled={saving}
              sx={{ textTransform: 'none', fontSize: '0.7rem', minWidth: 80 }}
            >
              {isEditMode ? 'Cancel' : 'Clear'}
            </Button>
            <Button
              variant="contained"
              color={isEditMode ? 'primary' : 'success'}
              size="small"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={!isValid || saving}
              sx={{ textTransform: 'none', fontSize: '0.7rem', minWidth: 80 }}
            >
              {saving ? (isEditMode ? 'Updating...' : 'Saving...') : (isEditMode ? 'Update' : 'Save')}
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Condition - Button Group (5 columns like Figma) */}
      <ButtonGroupSelect
        label="Condition"
        options={DENTAL_CONDITIONS}
        value={observation.conditionType}
        onChange={(val) => handleChange('conditionType', val)}
        color="warning"
        required
        columns={5}
      />

      {/* Severity - Button Group (4 columns like Figma) */}
      <ButtonGroupSelect
        label="Severity"
        options={SEVERITY_LEVELS}
        value={observation.severity}
        onChange={(val) => handleChange('severity', val)}
        color="info"
        columns={4}
      />

      {/* Surface - Button Group */}
      <ButtonGroupSelect
        label="Tooth Surface"
        options={TOOTH_SURFACES}
        value={observation.toothSurface}
        onChange={(val) => handleChange('toothSurface', val)}
        color="default"
      />

      {/* Template Notes Selector */}
      <Box sx={{ mb: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
        <TemplateNotesSelector
          conditionType={observation.conditionType}
          toothSurface={observation.toothSurface}
          severity={observation.severity}
          selectedTemplateIds={observation.selectedTemplateIds || []}
          onTemplateSelect={(ids) => handleChange('selectedTemplateIds', ids)}
          customNotes={observation.customNotes || ''}
          onCustomNotesChange={(notes) => handleChange('customNotes', notes)}
          disabled={saving}
        />
      </Box>

      {/* Treatment Required */}
      <FormControlLabel
        control={
          <Checkbox
            checked={observation.treatmentRequired}
            onChange={(e) => handleChange('treatmentRequired', e.target.checked)}
            size="small"
          />
        }
        label={<Typography variant="body2">Treatment Required</Typography>}
        sx={{ mb: 1 }}
      />

      {/* Book Procedures Checkbox */}
      <FormControlLabel
        control={
          <Checkbox
            checked={showProcedures}
            onChange={(e) => {
              setShowProcedures(e.target.checked);
              if (e.target.checked && (!observation.procedures || observation.procedures.length === 0)) {
                handleAddProcedure(); // Add first procedure automatically
              } else if (!e.target.checked) {
                handleChange('hasProcedure', false);
                handleChange('procedures', []);
              }
            }}
            size="small"
          />
        }
        label={<Typography variant="body2">Book Procedures</Typography>}
        sx={{ mb: 0.75 }}
      />

      {/* Procedures Section - Multiple Procedures */}
      {showProcedures && observation.procedures && observation.procedures.length > 0 && (
        <Box sx={{ mb: 2 }}>
          {observation.procedures.map((procedure, index) => {
            // Check if procedure is completed (readonly)
            const isCompleted = procedure.procedureStatus?.toLowerCase() === 'completed';

            return (
              <Paper
                key={procedure.id}
                elevation={1}
                sx={{
                  p: 2,
                  mb: 2,
                  border: 2,
                  borderColor: isCompleted ? 'success.main' : 'success.light',
                  borderRadius: 1,
                  bgcolor: isCompleted ? 'success.50' : 'grey.50',
                  opacity: isCompleted ? 0.85 : 1,
                }}
              >
                {/* Procedure Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle2" fontWeight="bold" color={isCompleted ? 'success.dark' : 'primary.dark'}>
                      Procedure {index + 1}
                    </Typography>
                    {isCompleted && (
                      <Chip
                        label="✓ Completed"
                        size="small"
                        color="success"
                        sx={{ fontWeight: 600, fontSize: '0.65rem', height: 20 }}
                      />
                    )}
                  </Box>
                  {!isCompleted && (
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveProcedure(procedure.id)}
                      sx={{ color: 'error.main' }}
                      title="Remove procedure"
                    >
                      <DeleteIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  )}
                </Box>

              <Divider sx={{ mb: 1.5 }} />

              {/* Teeth Selection for this Procedure */}
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                  Teeth for this Procedure *
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    gap: 0.5,
                    flexWrap: 'wrap',
                    p: 0.75,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    bgcolor: isCompleted ? 'grey.100' : 'white',
                    minHeight: 36,
                    pointerEvents: isCompleted ? 'none' : 'auto',
                  }}
                >
                  {observation.selectedTeeth.map((tooth) => (
                    <Chip
                      key={tooth}
                      label={`#${tooth}`}
                      size="small"
                      onClick={() => !isCompleted && handleToggleProcedureTooth(procedure.id, tooth)}
                      color={procedure.selectedTeeth.includes(tooth) ? 'success' : 'default'}
                      variant={procedure.selectedTeeth.includes(tooth) ? 'filled' : 'outlined'}
                      sx={{
                        fontSize: '0.7rem',
                        fontWeight: procedure.selectedTeeth.includes(tooth) ? 600 : 400,
                        cursor: isCompleted ? 'not-allowed' : 'pointer',
                        height: 24,
                      }}
                    />
                  ))}
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', mt: 0.5, display: 'block' }}>
                  {isCompleted ? 'Procedure completed - fields are readonly' : 'Click teeth to select/deselect for this procedure'}
                </Typography>
              </Box>

              {/* Procedure Selection - Button Grid (3 columns) */}
              <Box sx={{ mb: 1.5, pointerEvents: isCompleted ? 'none' : 'auto', opacity: isCompleted ? 0.7 : 1 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                  Procedure *
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 0.75,
                    mb: 0.75,
                  }}
                >
                  {COMMON_PROCEDURES.slice(0, showAllProcedures ? COMMON_PROCEDURES.length : 9).map((proc) => (
                    <Button
                      key={proc.code}
                      variant={procedure.procedureCode === proc.code ? 'contained' : 'outlined'}
                      color={procedure.procedureCode === proc.code ? 'success' : 'inherit'}
                      disabled={isCompleted}
                      onClick={() => {
                        if (!isCompleted) {
                          handleUpdateProcedure(procedure.id, 'procedureCode', proc.code);
                          handleUpdateProcedure(procedure.id, 'procedureName', proc.name);
                          if (proc.code !== 'CUSTOM') {
                            handleUpdateProcedure(procedure.id, 'customProcedureName', '');
                          }
                        }
                      }}
                      sx={{
                        justifyContent: 'flex-start',
                        textAlign: 'left',
                        px: 1,
                        py: 0.75,
                        minHeight: 42,
                        fontSize: '0.65rem',
                        textTransform: 'none',
                        fontWeight: procedure.procedureCode === proc.code ? 600 : 400,
                      }}
                    >
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%', overflow: 'hidden' }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem', lineHeight: 1.2 }}>
                          {proc.name}
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: '0.6rem', opacity: 0.7, lineHeight: 1 }}>
                          {proc.code}
                        </Typography>
                      </Box>
                    </Button>
                  ))}
                </Box>
                {COMMON_PROCEDURES.length > 9 && !isCompleted && (
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => setShowAllProcedures(!showAllProcedures)}
                    sx={{ textTransform: 'none', fontWeight: 500, fontSize: '0.7rem', p: 0.5 }}
                  >
                    {showAllProcedures ? 'Show Less' : `Show More (${COMMON_PROCEDURES.length - 9} more)`}
                  </Button>
                )}
              </Box>

              {/* Custom Procedure Name */}
              {procedure.procedureCode === 'CUSTOM' && (
                <TextField
                  fullWidth
                  label="Custom Procedure Name"
                  value={procedure.customProcedureName || ''}
                  onChange={(e) => handleUpdateProcedure(procedure.id, 'customProcedureName', e.target.value)}
                  placeholder="Enter custom procedure name..."
                  size="small"
                  required
                  disabled={isCompleted}
                  sx={{ mb: 1.5 }}
                />
              )}

              {/* Status */}
              <ButtonGroupSelect
                label="Status"
                options={PROCEDURE_STATUSES}
                value={procedure.procedureStatus}
                onChange={(val) => handleUpdateProcedure(procedure.id, 'procedureStatus', val)}
                color="success"
                disabled={isCompleted}
              />

              {/* Date and Time - Same Row */}
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                  <DatePicker
                    label="Date"
                    value={procedure.procedureDate}
                    onChange={(newValue) => handleUpdateProcedure(procedure.id, 'procedureDate', newValue)}
                    disabled={isCompleted}
                    slotProps={{
                      textField: {
                        size: 'small',
                        sx: { flex: 1 },
                      },
                    }}
                  />
                  <TimePicker
                    label="Time"
                    value={procedure.procedureTime}
                    onChange={(newValue) => handleUpdateProcedure(procedure.id, 'procedureTime', newValue)}
                    disabled={isCompleted}
                    slotProps={{
                      textField: {
                        size: 'small',
                        sx: { flex: 1 },
                      },
                    }}
                  />
                </Box>
              </LocalizationProvider>

              {/* Notes */}
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Procedure Notes"
                value={procedure.procedureNotes}
                onChange={(e) => handleUpdateProcedure(procedure.id, 'procedureNotes', e.target.value)}
                placeholder="Enter procedure notes..."
                size="small"
                disabled={isCompleted}
              />
            </Paper>
          );
          })}

          {/* Add Another Procedure Button */}
          <Button
            variant="outlined"
            color="success"
            startIcon={<AddIcon />}
            onClick={handleAddProcedure}
            fullWidth
            sx={{ textTransform: 'none', fontWeight: 500, fontSize: '0.75rem' }}
          >
            Add Another Procedure
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default NewObservationForm;
