/**
 * Procedure Schedule Component
 * Shows procedures grouped by status: Upcoming | Completed | Cancelled
 * iPad-friendly collapsible sections with action buttons
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Button,
  ButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { ProcedureGroup } from '../../services/treatmentService';
import treatmentService from '../../services/treatmentService';
import { dentalProcedureAPI } from '../../services/dentalService';
import { RescheduleProcedureDialog } from './RescheduleProcedureDialog';
import { AddProcedureDialog } from './AddProcedureDialog';
import PostProcedureUploadDialog from '../common/PostProcedureUploadDialog';
import dentalService from '../../services/dentalService';
import { useToast } from '../common/Toast';

interface ProcedureScheduleProps {
  patientMobile: string;
  patientFirstName: string;
}

const ProcedureSchedule = ({ patientMobile, patientFirstName }: ProcedureScheduleProps) => {
  const toast = useToast();
  const [procedures, setProcedures] = useState<ProcedureGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string>('upcoming'); // Default expanded

  // Dialog states
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [addProcedureDialogOpen, setAddProcedureDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedProcedure, setSelectedProcedure] = useState<any>(null);
  const [confirmAction, setConfirmAction] = useState<'complete' | 'cancel' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // NEW: Post-procedure upload dialog
  const [showPostProcedureDialog, setShowPostProcedureDialog] = useState(false);
  const [completedProcedureForUpload, setCompletedProcedureForUpload] = useState<any>(null);

  useEffect(() => {
    loadProcedures();
  }, [patientMobile, patientFirstName]);

  const loadProcedures = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await treatmentService.fetchPatientProcedures(
        patientMobile,
        patientFirstName
      );

      setProcedures(response);
    } catch (err: any) {
      console.error('Error loading procedures:', err);
      setError(err.response?.data?.detail || 'Failed to load procedures');
    } finally {
      setLoading(false);
    }
  };

  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : '');
  };

  // Action Handlers
  const handleCompleteClick = (procedure: any) => {
    setSelectedProcedure(procedure);
    setConfirmAction('complete');
    setConfirmDialogOpen(true);
  };

  const handleCancelClick = (procedure: any) => {
    setSelectedProcedure(procedure);
    setConfirmAction('cancel');
    setConfirmDialogOpen(true);
  };

  const handleRescheduleClick = (procedure: any) => {
    setSelectedProcedure(procedure);
    setRescheduleDialogOpen(true);
  };

  const handleAddProcedureClick = () => {
    setAddProcedureDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedProcedure || !confirmAction) return;

    try {
      setActionLoading(true);

      const newStatus = confirmAction === 'complete' ? 'completed' : 'cancelled';
      const notes = confirmAction === 'complete'
        ? 'Procedure completed via treatment dashboard'
        : 'Procedure cancelled via treatment dashboard';

      await dentalProcedureAPI.updateStatus(selectedProcedure.id, newStatus, notes);

      toast.success(`Procedure ${confirmAction === 'complete' ? 'completed' : 'cancelled'} successfully`);
      setConfirmDialogOpen(false);

      // NEW: If completed, show post-procedure upload dialog
      if (confirmAction === 'complete') {
        setCompletedProcedureForUpload(selectedProcedure);
        setShowPostProcedureDialog(true);
      }

      setSelectedProcedure(null);
      setConfirmAction(null);

      // Reload procedures
      await loadProcedures();
    } catch (err: any) {
      console.error('Error updating procedure:', err);
      toast.error(err.response?.data?.detail || `Failed to ${confirmAction} procedure`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRescheduleSuccess = () => {
    toast.success('Procedure rescheduled successfully');
    setSelectedProcedure(null);
    loadProcedures();
  };

  const handleAddProcedureSuccess = () => {
    toast.success('Procedure added successfully');
    loadProcedures();
  };

  // NEW: Handle post-procedure photo upload
  const handlePostProcedureUpload = async (file: File, fileType: string, caption?: string) => {
    if (!completedProcedureForUpload) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('file_type', fileType);
      if (caption) {
        formData.append('caption', caption);
      }

      // Upload to procedure attachments endpoint
      await dentalService.attachments.uploadProcedureAttachment(
        completedProcedureForUpload.id,
        formData
      );

      toast.success('Post-procedure photo uploaded successfully');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error?.response?.data?.detail || 'Failed to upload photo');
      throw error; // Re-throw to let dialog handle
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!procedures || (procedures.upcoming.length === 0 && procedures.completed.length === 0 && procedures.cancelled.length === 0)) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          No procedures found
        </Typography>
      </Box>
    );
  }

  const renderProcedureCard = (proc: any) => {
    // Determine if actions should be shown (not for completed/cancelled)
    const showActions = proc.status !== 'completed' && proc.status !== 'cancelled';

    return (
      <Card key={proc.id} sx={{ mb: 2, minHeight: 60 }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          {/* Procedure Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                {proc.procedure_name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Code: {proc.procedure_code}
                {proc.tooth_numbers && ` • Tooth #${proc.tooth_numbers}`}
              </Typography>
            </Box>
            <Chip
              label={proc.status}
              color={
                proc.status === 'completed'
                  ? 'success'
                  : proc.status === 'cancelled'
                  ? 'error'
                  : 'warning'
              }
              size="small"
              sx={{ textTransform: 'capitalize' }}
            />
          </Box>

          {/* Description */}
          {proc.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {proc.description}
            </Typography>
          )}

          {/* Procedure Details */}
          <Stack direction="row" spacing={2} sx={{ mt: 1.5, flexWrap: 'wrap' }}>
            {proc.procedure_date && (
              <Typography variant="caption" color="text.secondary">
                Date: {new Date(proc.procedure_date).toLocaleDateString()}
              </Typography>
            )}
            {proc.completed_date && (
              <Typography variant="caption" color="text.secondary">
                Completed: {new Date(proc.completed_date).toLocaleDateString()}
              </Typography>
            )}
            {proc.duration_minutes && (
              <Typography variant="caption" color="text.secondary">
                Duration: {proc.duration_minutes} min
              </Typography>
            )}
          </Stack>

          {/* Cost */}
          {(proc.estimated_cost || proc.actual_cost) && (
            <Box sx={{ mt: 1 }}>
              {proc.estimated_cost && (
                <Typography variant="caption" color="text.secondary">
                  Estimated: ${proc.estimated_cost.toFixed(2)}
                </Typography>
              )}
              {proc.actual_cost && (
                <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                  Actual: ${proc.actual_cost.toFixed(2)}
                </Typography>
              )}
            </Box>
          )}

          {/* Notes */}
          {proc.procedure_notes && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, fontStyle: 'italic' }}>
              Notes: {proc.procedure_notes}
            </Typography>
          )}

          {/* Action Buttons */}
          {showActions && (
            <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={<CheckCircleIcon />}
                onClick={() => handleCompleteClick(proc)}
                sx={{ minHeight: 44, flex: { xs: '1 1 100%', sm: '0 0 auto' } }}
              >
                Complete
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<CancelIcon />}
                onClick={() => handleCancelClick(proc)}
                sx={{ minHeight: 44, flex: { xs: '1 1 100%', sm: '0 0 auto' } }}
              >
                Cancel
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<ScheduleIcon />}
                onClick={() => handleRescheduleClick(proc)}
                sx={{ minHeight: 44, flex: { xs: '1 1 100%', sm: '0 0 auto' } }}
              >
                Reschedule
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Stack spacing={2}>
      {/* Add Procedure Button */}
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={handleAddProcedureClick}
        sx={{ minHeight: 44 }}
      >
        Add New Procedure
      </Button>

      {/* Upcoming Procedures */}
      <Accordion
        expanded={expanded === 'upcoming'}
        onChange={handleAccordionChange('upcoming')}
        sx={{ minHeight: 60 }} // iPad-friendly
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{ minHeight: 60 }}
        >
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            Upcoming
            <Chip label={procedures.upcoming.length} size="small" color="warning" />
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {procedures.upcoming.length === 0 ? (
            <Typography color="text.secondary">No upcoming procedures</Typography>
          ) : (
            <Box>{procedures.upcoming.map(renderProcedureCard)}</Box>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Completed Procedures */}
      <Accordion
        expanded={expanded === 'completed'}
        onChange={handleAccordionChange('completed')}
        sx={{ minHeight: 60 }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{ minHeight: 60 }}
        >
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            Completed
            <Chip label={procedures.completed.length} size="small" color="success" />
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {procedures.completed.length === 0 ? (
            <Typography color="text.secondary">No completed procedures</Typography>
          ) : (
            <Box>{procedures.completed.map(renderProcedureCard)}</Box>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Cancelled Procedures */}
      {procedures.cancelled.length > 0 && (
        <Accordion
          expanded={expanded === 'cancelled'}
          onChange={handleAccordionChange('cancelled')}
          sx={{ minHeight: 60 }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{ minHeight: 60 }}
          >
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              Cancelled
              <Chip label={procedures.cancelled.length} size="small" color="error" />
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box>{procedures.cancelled.map(renderProcedureCard)}</Box>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => !actionLoading && setConfirmDialogOpen(false)}>
        <DialogTitle>
          {confirmAction === 'complete' ? 'Complete Procedure?' : 'Cancel Procedure?'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {selectedProcedure && (
              <>
                Are you sure you want to {confirmAction} the procedure:{' '}
                <strong>{selectedProcedure.procedure_name}</strong> (Code: {selectedProcedure.procedure_code})?
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setConfirmDialogOpen(false)}
            disabled={actionLoading}
            variant="outlined"
            sx={{ minHeight: 44 }}
          >
            No, Go Back
          </Button>
          <Button
            onClick={handleConfirmAction}
            disabled={actionLoading}
            variant="contained"
            color={confirmAction === 'complete' ? 'success' : 'error'}
            sx={{ minHeight: 44 }}
          >
            {actionLoading ? 'Processing...' : `Yes, ${confirmAction === 'complete' ? 'Complete' : 'Cancel'}`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reschedule Dialog */}
      <RescheduleProcedureDialog
        open={rescheduleDialogOpen}
        procedure={selectedProcedure}
        onClose={() => {
          setRescheduleDialogOpen(false);
          setSelectedProcedure(null);
        }}
        onSuccess={handleRescheduleSuccess}
      />

      {/* Add Procedure Dialog */}
      <AddProcedureDialog
        open={addProcedureDialogOpen}
        patientMobile={patientMobile}
        patientFirstName={patientFirstName}
        onClose={() => setAddProcedureDialogOpen(false)}
        onSuccess={handleAddProcedureSuccess}
      />

      {/* Post-Procedure Upload Dialog */}
      {completedProcedureForUpload && (
        <PostProcedureUploadDialog
          open={showPostProcedureDialog}
          procedureName={completedProcedureForUpload.procedure_name}
          toothNumbers={completedProcedureForUpload.tooth_numbers?.split(',') || []}
          onClose={() => {
            setShowPostProcedureDialog(false);
            setCompletedProcedureForUpload(null);
          }}
          onUploadComplete={handlePostProcedureUpload}
          onSkip={() => {
            setShowPostProcedureDialog(false);
            setCompletedProcedureForUpload(null);
          }}
        />
      )}
    </Stack>
  );
};

export default ProcedureSchedule;
