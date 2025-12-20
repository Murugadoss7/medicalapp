/**
 * Add Procedure Dialog
 * Creates a new dental procedure for a patient
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  MenuItem,
  Grid,
  Typography,
  CircularProgress,
} from '@mui/material';
import { StandardDatePicker } from '../common/StandardDatePicker';
import { dentalProcedureAPI } from '../../services/dentalService';
import axios from 'axios';

interface AddProcedureDialogProps {
  open: boolean;
  patientMobile: string;
  patientFirstName: string;
  onClose: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
}

interface Appointment {
  id: string;
  appointment_number: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const AddProcedureDialog = ({
  open,
  patientMobile,
  patientFirstName,
  onClose,
  onSuccess,
  onError,
}: AddProcedureDialogProps) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    appointment_id: '',
    procedure_code: '',
    procedure_name: '',
    tooth_numbers: '',
    description: '',
    estimated_cost: '',
    duration_minutes: '',
    status: 'planned' as 'planned' | 'in_progress' | 'completed' | 'cancelled',
    procedure_date: new Date(),
    procedure_notes: '',
  });

  useEffect(() => {
    if (open) {
      fetchAppointments();
    }
  }, [open, patientMobile, patientFirstName]);

  const fetchAppointments = async () => {
    try {
      setLoadingAppointments(true);
      const token = localStorage.getItem('access_token');

      const response = await axios.get(
        `${API_BASE_URL}/appointments/patient/${patientMobile}/${patientFirstName}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            page: 1,
            per_page: 50,
          },
        }
      );

      setAppointments(response.data.appointments || []);
    } catch (err: any) {
      console.error('Error fetching appointments:', err);
      onError('Failed to load appointments');
    } finally {
      setLoadingAppointments(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.appointment_id) {
      onError('Please select an appointment');
      return;
    }
    if (!formData.procedure_code || !formData.procedure_name) {
      onError('Please provide procedure code and name');
      return;
    }

    try {
      setLoading(true);

      const procedureData: any = {
        appointment_id: formData.appointment_id,
        procedure_code: formData.procedure_code,
        procedure_name: formData.procedure_name,
        status: formData.status,
      };

      // Add optional fields if provided
      if (formData.tooth_numbers) procedureData.tooth_numbers = formData.tooth_numbers;
      if (formData.description) procedureData.description = formData.description;
      if (formData.estimated_cost) procedureData.estimated_cost = parseFloat(formData.estimated_cost);
      if (formData.duration_minutes) procedureData.duration_minutes = parseInt(formData.duration_minutes);
      if (formData.procedure_date) {
        procedureData.procedure_date = formData.procedure_date.toISOString().split('T')[0];
      }
      if (formData.procedure_notes) procedureData.procedure_notes = formData.procedure_notes;

      await dentalProcedureAPI.create(procedureData);

      // Reset form
      setFormData({
        appointment_id: '',
        procedure_code: '',
        procedure_name: '',
        tooth_numbers: '',
        description: '',
        estimated_cost: '',
        duration_minutes: '',
        status: 'planned',
        procedure_date: new Date(),
        procedure_notes: '',
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error creating procedure:', err);
      onError(err.response?.data?.detail || 'Failed to create procedure');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Add New Procedure</DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Patient: {patientFirstName} ({patientMobile})
          </Typography>

          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Appointment Selection */}
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Select Appointment"
                value={formData.appointment_id}
                onChange={(e) => handleChange('appointment_id', e.target.value)}
                disabled={loadingAppointments || loading}
                required
                sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
              >
                {loadingAppointments ? (
                  <MenuItem disabled>
                    <CircularProgress size={20} /> Loading appointments...
                  </MenuItem>
                ) : appointments.length === 0 ? (
                  <MenuItem disabled>No appointments found</MenuItem>
                ) : (
                  appointments.map((apt) => (
                    <MenuItem key={apt.id} value={apt.id}>
                      {apt.appointment_number} - {new Date(apt.appointment_date).toLocaleDateString()}
                      {apt.appointment_time && ` ${apt.appointment_time}`} ({apt.status})
                    </MenuItem>
                  ))
                )}
              </TextField>
            </Grid>

            {/* Procedure Code */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Procedure Code"
                value={formData.procedure_code}
                onChange={(e) => handleChange('procedure_code', e.target.value)}
                placeholder="e.g., D7140"
                disabled={loading}
                required
                sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
              />
            </Grid>

            {/* Procedure Name */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Procedure Name"
                value={formData.procedure_name}
                onChange={(e) => handleChange('procedure_name', e.target.value)}
                placeholder="e.g., Tooth Extraction"
                disabled={loading}
                required
                sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
              />
            </Grid>

            {/* Tooth Numbers */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Tooth Numbers (FDI)"
                value={formData.tooth_numbers}
                onChange={(e) => handleChange('tooth_numbers', e.target.value)}
                placeholder="e.g., 18, 14-16"
                disabled={loading}
                sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
              />
            </Grid>

            {/* Status */}
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Status"
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                disabled={loading}
                sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
              >
                <MenuItem value="planned">Planned</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </TextField>
            </Grid>

            {/* Estimated Cost */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Estimated Cost ($)"
                value={formData.estimated_cost}
                onChange={(e) => handleChange('estimated_cost', e.target.value)}
                disabled={loading}
                sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
              />
            </Grid>

            {/* Duration */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Duration (minutes)"
                value={formData.duration_minutes}
                onChange={(e) => handleChange('duration_minutes', e.target.value)}
                disabled={loading}
                sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
              />
            </Grid>

            {/* Procedure Date */}
            <Grid item xs={12}>
              <StandardDatePicker
                label="Procedure Date"
                value={formData.procedure_date}
                onChange={(date) => handleChange('procedure_date', date)}
                disabled={loading}
              />
            </Grid>

            {/* Description */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                disabled={loading}
              />
            </Grid>

            {/* Notes */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Procedure Notes"
                value={formData.procedure_notes}
                onChange={(e) => handleChange('procedure_notes', e.target.value)}
                disabled={loading}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          variant="outlined"
          sx={{ minHeight: 44 }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading || !formData.appointment_id || !formData.procedure_code || !formData.procedure_name}
          variant="contained"
          sx={{ minHeight: 44 }}
        >
          {loading ? 'Creating...' : 'Create Procedure'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
