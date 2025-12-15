/**
 * ObservationEditModal Component
 * Modal for editing saved observations
 * Allows editing observation details (teeth are read-only)
 * Procedures are displayed but not editable (edit via main interface)
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
  Typography,
  TextField,
  Chip,
  Divider,
  MenuItem,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { type ObservationData } from './ObservationRow';
import ButtonGroupSelect from '../common/ButtonGroupSelect';

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

const SEVERITY_LEVELS = ['Mild', 'Moderate', 'Severe'];

const TOOTH_SURFACES = [
  'Occlusal',
  'Mesial',
  'Distal',
  'Buccal',
  'Lingual',
  'Palatal',
  'Incisal',
];

interface ObservationEditModalProps {
  open: boolean;
  observation: ObservationData | null;
  onClose: () => void;
  onSave: (updated: Partial<ObservationData>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const ObservationEditModal: React.FC<ObservationEditModalProps> = ({
  open,
  observation,
  onClose,
  onSave,
  onDelete,
}) => {
  const [editing, setEditing] = useState<Partial<ObservationData>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (observation) {
      setEditing({
        conditionType: observation.conditionType,
        severity: observation.severity,
        toothSurface: observation.toothSurface,
        observationNotes: observation.observationNotes,
      });
    }
  }, [observation]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await onSave(editing);
      onClose();
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!observation) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete this observation? This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      await onDelete(observation.id);
      onClose();
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setDeleting(false);
    }
  };

  if (!observation) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight="bold">
            Edit Observation
          </Typography>
          <IconButton onClick={onClose} disabled={saving || deleting}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Teeth - Read-only */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 500 }}>
            Teeth (Read-only)
          </Typography>
          <Box
            sx={{
              display: 'flex',
              gap: 0.5,
              flexWrap: 'wrap',
              p: 1.5,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              bgcolor: 'grey.50',
            }}
          >
            {observation.selectedTeeth.map((tooth) => (
              <Chip key={tooth} label={`Tooth #${tooth}`} color="primary" sx={{ fontWeight: 500 }} />
            ))}
          </Box>
        </Box>

        {/* Editable Fields - Use button groups like main form */}
        <ButtonGroupSelect
          label="Condition"
          options={DENTAL_CONDITIONS}
          value={editing.conditionType || ''}
          onChange={(val) => setEditing({ ...editing, conditionType: val })}
          color="warning"
          required
          columns={5}
        />

        <ButtonGroupSelect
          label="Severity"
          options={SEVERITY_LEVELS}
          value={editing.severity || ''}
          onChange={(val) => setEditing({ ...editing, severity: val })}
          color="info"
          columns={4}
        />

        <TextField
          select
          fullWidth
          label="Tooth Surface"
          value={editing.toothSurface || ''}
          onChange={(e) => setEditing({ ...editing, toothSurface: e.target.value })}
          sx={{ mb: 2 }}
        >
          <MenuItem value="">None</MenuItem>
          {TOOTH_SURFACES.map((surface) => (
            <MenuItem key={surface} value={surface}>
              {surface}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          fullWidth
          multiline
          rows={4}
          label="Observation Notes"
          value={editing.observationNotes || ''}
          onChange={(e) => setEditing({ ...editing, observationNotes: e.target.value })}
          placeholder="Enter detailed notes about the observation..."
          sx={{ mb: 2 }}
        />

        {/* Procedures - Read-only Display - Loop through ALL procedures */}
        {observation.procedures && observation.procedures.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Linked Procedures ({observation.procedures.length})
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Procedures are read-only here. To edit procedures, use the main consultation interface.
            </Alert>
            {observation.procedures.map((procedure, index) => (
              <Box
                key={procedure.id}
                sx={{
                  p: 2,
                  bgcolor: 'grey.50',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  mb: 2,
                }}
              >
                <Typography variant="subtitle2" fontWeight="bold" color="primary" gutterBottom>
                  Procedure #{index + 1}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Teeth:</strong> {procedure.selectedTeeth.join(', ')}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Procedure:</strong> {procedure.procedureCode === 'CUSTOM' ? procedure.customProcedureName : procedure.procedureName}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Code:</strong> {procedure.procedureCode}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Status:</strong>{' '}
                  <Chip
                    label={procedure.procedureStatus}
                    size="small"
                    color={
                      procedure.procedureStatus === 'completed'
                        ? 'success'
                        : procedure.procedureStatus === 'cancelled'
                        ? 'error'
                        : 'warning'
                    }
                  />
                </Typography>
                {procedure.procedureNotes && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>Notes:</strong> {procedure.procedureNotes}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          startIcon={<DeleteIcon />}
          onClick={handleDelete}
          color="error"
          disabled={deleting || saving}
        >
          {deleting ? 'Deleting...' : 'Delete'}
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose} disabled={saving || deleting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={saving || deleting || !editing.conditionType}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ObservationEditModal;
