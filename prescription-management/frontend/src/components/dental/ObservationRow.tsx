/**
 * ObservationRow Component
 * Inline observation form with optional procedure expansion
 * Used in the fixed observation panel for dental consultation
 */

import React, { useState } from 'react';
import {
  Box,
  TextField,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Button,
  IconButton,
  Chip,
  Collapse,
  Typography,
  Paper,
  Divider,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  MedicalServices as ProcedureIcon,
  Edit as EditIcon,
} from '@mui/icons-material';

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
  { code: 'D0150', name: 'Comprehensive Oral Evaluation' },
  { code: 'D1110', name: 'Prophylaxis (Adult Cleaning)' },
  { code: 'D1120', name: 'Prophylaxis (Child Cleaning)' },
  { code: 'D2140', name: 'Amalgam Filling - One Surface' },
  { code: 'D2150', name: 'Amalgam Filling - Two Surfaces' },
  { code: 'D2330', name: 'Composite Filling - One Surface' },
  { code: 'D2331', name: 'Composite Filling - Two Surfaces' },
  { code: 'D2740', name: 'Crown - Porcelain/Ceramic' },
  { code: 'D2750', name: 'Crown - Porcelain Fused to Metal' },
  { code: 'D3310', name: 'Root Canal - Anterior' },
  { code: 'D3320', name: 'Root Canal - Premolar' },
  { code: 'D3330', name: 'Root Canal - Molar' },
  { code: 'D4341', name: 'Scaling and Root Planing' },
  { code: 'D7140', name: 'Extraction - Simple' },
  { code: 'D7210', name: 'Extraction - Surgical' },
  { code: 'CUSTOM', name: 'Custom Procedure' },
];

// Individual procedure data
export interface ProcedureData {
  id: string; // Unique ID for UI tracking
  selectedTeeth: string[]; // Teeth for this procedure (can be subset of observation teeth)
  procedureCode: string;
  procedureName: string;
  customProcedureName?: string;
  procedureDate: Date | null;
  procedureTime: Date | null; // Separate time field
  procedureNotes: string;
  procedureStatus: 'planned' | 'cancelled' | 'completed';
  backendProcedureId?: string; // Backend ID for updates
}

export interface ObservationData {
  id: string;
  selectedTeeth: string[];
  toothSurface: string;
  conditionType: string;
  severity: string;
  observationNotes: string;
  treatmentRequired: boolean;
  // Multiple procedures support
  hasProcedure: boolean;
  procedures: ProcedureData[]; // Array of procedures
  // Legacy single procedure fields (for backward compatibility during migration)
  procedureCode?: string;
  procedureName?: string;
  customProcedureName?: string;
  procedureDate?: Date | null;
  procedureNotes?: string;
  procedureStatus?: 'planned' | 'cancelled' | 'completed';
  // Saved state
  isSaved?: boolean;
  // Backend IDs for update operations (maps tooth_number -> observation_id)
  backendObservationIds?: Record<string, string>;
  backendProcedureId?: string; // Legacy single procedure ID
  // Template support
  selectedTemplateIds?: string[];
  customNotes?: string;
}

interface ObservationRowProps {
  observation: ObservationData;
  index: number;
  isActive: boolean;
  onUpdate: (id: string, data: Partial<ObservationData>) => void;
  onDelete: (id: string) => void;
  onSetActive: (id: string) => void;
  onEdit?: (id: string) => void;  // Enable edit mode for saved observations
}

const ObservationRow: React.FC<ObservationRowProps> = ({
  observation,
  index,
  isActive,
  onUpdate,
  onDelete,
  onSetActive,
  onEdit,
}) => {
  const [showProcedure, setShowProcedure] = useState(observation.hasProcedure);

  const handleChange = (field: keyof ObservationData, value: any) => {
    onUpdate(observation.id, { [field]: value });
  };

  const handleToggleProcedure = () => {
    const newShowProcedure = !showProcedure;
    setShowProcedure(newShowProcedure);
    onUpdate(observation.id, { hasProcedure: newShowProcedure });
  };

  const isCustomProcedure = observation.procedureCode === 'CUSTOM';

  // Get procedure name from code
  const getProcedureName = (code: string) => {
    const proc = COMMON_PROCEDURES.find(p => p.code === code);
    return proc?.name || '';
  };

  const isSaved = observation.isSaved || false;

  return (
    <Paper
      elevation={isActive ? 3 : 1}
      sx={{
        p: 2,
        mb: 2,
        border: isActive ? 2 : 1,
        borderColor: isActive ? 'primary.main' : 'divider',
        cursor: 'pointer',
        '&:hover': {
          borderColor: 'primary.light',
        },
      }}
      onClick={() => onSetActive(observation.id)}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle2" color={isActive ? 'primary' : 'text.secondary'}>
            Observation {index + 1}
          </Typography>
          {isSaved && (
            <Chip label="Saved" size="small" color="success" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {isSaved && onEdit && (
            <IconButton
              size="small"
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(observation.id);
              }}
              title="Edit observation"
            >
              <EditIcon fontSize="small" />
            </IconButton>
          )}
          {!isSaved && (
            <IconButton
              size="small"
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(observation.id);
              }}
              title="Delete observation"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Collapsed View - Show summary when not active */}
      {!isActive && (
        <Box>
          {/* Tags row */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap', mb: observation.observationNotes ? 0.5 : 0 }}>
            {observation.selectedTeeth.length > 0 && (
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {observation.selectedTeeth.slice(0, 3).map((tooth) => (
                  <Chip key={tooth} label={`#${tooth}`} size="small" variant="outlined" sx={{ height: 22 }} />
                ))}
                {observation.selectedTeeth.length > 3 && (
                  <Chip label={`+${observation.selectedTeeth.length - 3}`} size="small" variant="outlined" sx={{ height: 22 }} />
                )}
              </Box>
            )}
            {observation.conditionType && (
              <Chip label={observation.conditionType} size="small" color="warning" sx={{ height: 22 }} />
            )}
            {observation.severity && (
              <Chip label={observation.severity} size="small" color="info" variant="outlined" sx={{ height: 22 }} />
            )}
            {observation.hasProcedure && observation.procedureCode && (
              <Chip
                label={observation.procedureCode === 'CUSTOM'
                  ? (observation.customProcedureName || 'Custom')
                  : (observation.procedureName || observation.procedureCode)
                }
                size="small"
                color="success"
                sx={{
                  height: 22,
                  maxWidth: 120,
                  opacity: observation.procedureStatus === 'completed' ? 0.5 : 1,
                  textDecoration: observation.procedureStatus === 'completed' ? 'line-through' : 'none'
                }}
              />
            )}
            {observation.hasProcedure && observation.procedureStatus && (
              <Chip
                label={
                  observation.procedureStatus === 'planned' ? '📋' :
                  observation.procedureStatus === 'cancelled' ? '❌' :
                  '✅'
                }
                size="small"
                variant="outlined"
                sx={{
                  height: 22,
                  opacity: observation.procedureStatus === 'completed' ? 0.5 : 1
                }}
              />
            )}
          </Box>
          {/* Notes preview row */}
          {observation.observationNotes && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 1,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontStyle: 'italic',
              }}
            >
              "{observation.observationNotes}"
            </Typography>
          )}
        </Box>
      )}

      {/* Expanded View - Show full form when active */}
      {isActive && (
        <>
          {/* Selected Teeth - Inline */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
            <Typography variant="caption" color="text.secondary">
              Teeth:
            </Typography>
            {observation.selectedTeeth.length > 0 ? (
              observation.selectedTeeth.map((tooth) => (
                <Chip
                  key={tooth}
                  label={`#${tooth}`}
                  size="small"
                  color="primary"
                  variant="filled"
                  sx={{ height: 24 }}
                />
              ))
            ) : (
              <Typography variant="caption" color="text.secondary" fontStyle="italic">
                Click teeth on chart
              </Typography>
            )}
          </Box>

          {/* Observation Fields */}
          <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
            <TextField
              select
              size="small"
              label="Condition"
              value={observation.conditionType}
              onChange={(e) => handleChange('conditionType', e.target.value)}
              sx={{ minWidth: 110, flex: 1 }}
              onClick={(e) => e.stopPropagation()}
              disabled={isSaved}
            >
              {DENTAL_CONDITIONS.map((condition) => (
                <MenuItem key={condition} value={condition}>
                  {condition}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              label="Severity"
              value={observation.severity}
              onChange={(e) => handleChange('severity', e.target.value)}
              sx={{ minWidth: 90 }}
              onClick={(e) => e.stopPropagation()}
              disabled={isSaved}
            >
              <MenuItem value="">None</MenuItem>
              {SEVERITY_LEVELS.map((level) => (
                <MenuItem key={level} value={level}>
                  {level}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              label="Surface"
              value={observation.toothSurface}
              onChange={(e) => handleChange('toothSurface', e.target.value)}
              sx={{ minWidth: 90 }}
              onClick={(e) => e.stopPropagation()}
              disabled={isSaved}
            >
              <MenuItem value="">None</MenuItem>
              {TOOTH_SURFACES.map((surface) => (
                <MenuItem key={surface} value={surface}>
                  {surface}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {/* Notes */}
          <TextField
            fullWidth
            size="small"
            label="Notes"
            value={observation.observationNotes}
            onChange={(e) => handleChange('observationNotes', e.target.value)}
            multiline
            rows={2}
            sx={{ mb: 1 }}
            onClick={(e) => e.stopPropagation()}
            disabled={isSaved}
          />

          {/* Treatment checkbox and Add Procedure inline */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={observation.treatmentRequired}
                  onChange={(e) => handleChange('treatmentRequired', e.target.checked)}
                  onClick={(e) => e.stopPropagation()}
                  disabled={isSaved}
                />
              }
              label={<Typography variant="body2">Treatment Required</Typography>}
              sx={{ mr: 0 }}
            />
            {!showProcedure && !isSaved && (
              <Button
                size="small"
                variant="outlined"
                color="success"
                startIcon={<ProcedureIcon />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleProcedure();
                }}
                sx={{ height: 28, fontSize: '0.75rem' }}
              >
                + Procedure
              </Button>
            )}
          </Box>

          {/* Procedure Fields - Show when has procedure */}
          <Box>
        <Collapse in={showProcedure}>
          <Divider sx={{ my: 1 }} />
          <Typography variant="caption" color="success.main" fontWeight="bold" sx={{ mb: 1, display: 'block' }}>
            Procedure {isSaved ? '(Read Only)' : ''}</Typography>

          <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
            <TextField
              select
              size="small"
              label="Procedure"
              value={observation.procedureCode}
              onChange={(e) => {
                handleChange('procedureCode', e.target.value);
                if (e.target.value !== 'CUSTOM') {
                  handleChange('procedureName', getProcedureName(e.target.value));
                }
              }}
              sx={{ flex: 2, minWidth: 200 }}
              onClick={(e) => e.stopPropagation()}
              disabled={isSaved}
            >
              {COMMON_PROCEDURES.map((proc) => (
                <MenuItem key={proc.code} value={proc.code}>
                  {proc.code === 'CUSTOM' ? '✏️ Custom Procedure' : `${proc.name}`}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {isCustomProcedure && (
            <TextField
              fullWidth
              size="small"
              label="Custom Procedure Name"
              value={observation.customProcedureName}
              onChange={(e) => handleChange('customProcedureName', e.target.value)}
              sx={{ mb: 1 }}
              onClick={(e) => e.stopPropagation()}
              disabled={isSaved}
            />
          )}

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateTimePicker
              label="Procedure Date/Time"
              value={observation.procedureDate}
              onChange={(date) => handleChange('procedureDate', date)}
              disabled={isSaved}
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                  sx: { mb: 1 },
                  onClick: (e) => e.stopPropagation(),
                },
              }}
            />
          </LocalizationProvider>

          <TextField
            select
            size="small"
            label="Status"
            value={observation.procedureStatus || 'planned'}
            onChange={(e) => handleChange('procedureStatus', e.target.value)}
            sx={{ mb: 1, minWidth: 150 }}
            onClick={(e) => e.stopPropagation()}
          >
            <MenuItem value="planned">📋 Planned</MenuItem>
            <MenuItem value="cancelled">❌ Cancelled</MenuItem>
            <MenuItem value="completed">✅ Completed</MenuItem>
          </TextField>

          <TextField
            fullWidth
            size="small"
            label="Procedure Notes"
            value={observation.procedureNotes}
            onChange={(e) => handleChange('procedureNotes', e.target.value)}
            multiline
            rows={2}
            onClick={(e) => e.stopPropagation()}
            disabled={isSaved}
          />
        </Collapse>
        </Box>
        </>
      )}
    </Paper>
  );
};

// Memoize to prevent unnecessary re-renders on iPad
export default React.memo(ObservationRow);
