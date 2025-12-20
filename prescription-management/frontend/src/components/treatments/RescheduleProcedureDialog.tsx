/**
 * Reschedule Procedure Dialog
 * Allows changing the procedure date
 */

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
} from '@mui/material';
import StandardDatePicker from '../common/StandardDatePicker';
import { dentalProcedureAPI } from '../../services/dentalService';
import { useToast } from '../common/Toast';

interface RescheduleProcedureDialogProps {
  open: boolean;
  procedure: {
    id: string;
    procedure_name: string;
    procedure_code: string;
    procedure_date: string | null;
  } | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const RescheduleProcedureDialog = ({
  open,
  procedure,
  onClose,
  onSuccess,
}: RescheduleProcedureDialogProps) => {
  const toast = useToast();
  const [newDate, setNewDate] = useState<Date | null>(
    procedure?.procedure_date ? new Date(procedure.procedure_date) : new Date()
  );
  const [loading, setLoading] = useState(false);

  const handleReschedule = async () => {
    if (!procedure || !newDate) return;

    try {
      setLoading(true);

      // Format date as YYYY-MM-DD
      const formattedDate = newDate.toISOString().split('T')[0];

      await dentalProcedureAPI.update(procedure.id, {
        procedure_date: formattedDate,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error rescheduling procedure:', err);
      toast.error(err.response?.data?.detail || 'Failed to reschedule procedure');
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
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Reschedule Procedure</DialogTitle>

      <DialogContent>
        {procedure && (
          <>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              {procedure.procedure_name}
            </Typography>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Code: {procedure.procedure_code}
            </Typography>

            <Box sx={{ mt: 3 }}>
              <StandardDatePicker
                label="New Procedure Date"
                value={newDate}
                onChange={(date) => setNewDate(date)}
                minDate={new Date()}
                disabled={loading}
              />
            </Box>
          </>
        )}
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
          onClick={handleReschedule}
          disabled={loading || !newDate}
          variant="contained"
          sx={{ minHeight: 44 }}
        >
          {loading ? 'Rescheduling...' : 'Reschedule'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
