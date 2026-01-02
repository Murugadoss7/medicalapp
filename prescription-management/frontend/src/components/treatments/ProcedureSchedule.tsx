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
  IconButton,
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

    // Status color mapping
    const statusColors = {
      completed: { bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', text: '#fff' },
      cancelled: { bg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', text: '#fff' },
      planned: { bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', text: '#fff' },
    };
    const statusStyle = statusColors[proc.status as keyof typeof statusColors] || statusColors.planned;

    return (
      <Card
        key={proc.id}
        sx={{
          mb: 1,
          borderRadius: 2,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(102, 126, 234, 0.15)',
          boxShadow: '0 1px 8px rgba(102, 126, 234, 0.1)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(102, 126, 234, 0.2)',
          },
        }}
      >
        <CardContent sx={{ p: { xs: 1.25, sm: 1.5 }, '&:last-child': { pb: { xs: 1.25, sm: 1.5 } } }}>
          {/* Row 1: Name + Action Buttons + Status (INLINE) */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5, gap: 1, flexWrap: 'wrap' }}>
            {/* Left: Procedure Name */}
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                lineHeight: 1.3,
                flex: { xs: '1 1 100%', sm: '0 1 auto' },
              }}
            >
              {proc.procedure_name}
            </Typography>

            {/* Right: Action Buttons (Compact Text Buttons) + Status */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
              {showActions && (
                <>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
                    onClick={() => handleCompleteClick(proc)}
                    sx={{
                      minHeight: 28,
                      px: 1,
                      py: 0.5,
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      borderRadius: 1.5,
                      boxShadow: '0 1px 4px rgba(16, 185, 129, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)',
                      },
                    }}
                  >
                    Complete
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<CancelIcon sx={{ fontSize: 14 }} />}
                    onClick={() => handleCancelClick(proc)}
                    sx={{
                      minHeight: 28,
                      px: 1,
                      py: 0.5,
                      borderColor: '#ef4444',
                      color: '#ef4444',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      borderRadius: 1.5,
                      '&:hover': {
                        borderColor: '#dc2626',
                        background: 'rgba(239, 68, 68, 0.05)',
                      },
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<ScheduleIcon sx={{ fontSize: 14 }} />}
                    onClick={() => handleRescheduleClick(proc)}
                    sx={{
                      minHeight: 28,
                      px: 1,
                      py: 0.5,
                      borderColor: '#667eea',
                      color: '#667eea',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      borderRadius: 1.5,
                      '&:hover': {
                        borderColor: '#5568d3',
                        background: 'rgba(102, 126, 234, 0.05)',
                      },
                    }}
                  >
                    Reschedule
                  </Button>
                </>
              )}
              {/* Only show status chip for completed/cancelled, not for planned */}
              {proc.status !== 'planned' && (
                <Chip
                  label={proc.status}
                  size="small"
                  sx={{
                    textTransform: 'capitalize',
                    fontWeight: 700,
                    fontSize: '0.6875rem',
                    height: 24,
                    background: statusStyle.bg,
                    color: statusStyle.text,
                    border: 'none',
                  }}
                />
              )}
            </Box>
          </Box>

          {/* Row 2: Code + Tooth + Duration + Date + Cost (ALL INLINE) */}
          <Box sx={{ display: 'flex', gap: 1, mb: proc.description || proc.procedure_notes ? 0.5 : 0, flexWrap: 'wrap', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 500 }}>
              {proc.procedure_code}
            </Typography>
            {proc.tooth_numbers && (
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 500 }}>
                • Tooth #{proc.tooth_numbers}
              </Typography>
            )}
            {proc.duration_minutes && (
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 500 }}>
                • {proc.duration_minutes}min
              </Typography>
            )}
            {proc.procedure_date && (
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 500 }}>
                • 📅 {new Date(proc.procedure_date).toLocaleDateString()}
              </Typography>
            )}
            {proc.completed_date && (
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 500 }}>
                • ✅ {new Date(proc.completed_date).toLocaleDateString()}
              </Typography>
            )}
            {proc.estimated_cost && (
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 500 }}>
                • ${proc.estimated_cost.toFixed(2)}
              </Typography>
            )}
            {proc.actual_cost && (
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 500 }}>
                • ${proc.actual_cost.toFixed(2)}
              </Typography>
            )}
          </Box>

          {/* Row 3: Description (if exists) */}
          {proc.description && (
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                fontSize: '0.75rem',
                lineHeight: 1.3,
                display: 'block',
                mb: proc.procedure_notes ? 0.25 : 0,
              }}
            >
              {proc.description}
            </Typography>
          )}

          {/* Row 4: Notes (if exists) */}
          {proc.procedure_notes && (
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                fontSize: '0.75rem',
                fontStyle: 'italic',
                display: 'block',
              }}
            >
              📝 {proc.procedure_notes}
            </Typography>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Stack spacing={1.5}>
      {/* Upcoming Procedures - Compact & Themed with Add Button */}
      <Accordion
        expanded={expanded === 'upcoming'}
        onChange={handleAccordionChange('upcoming')}
        sx={{
          borderRadius: 2,
          '&:before': { display: 'none' },
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(102, 126, 234, 0.15)',
          boxShadow: '0 2px 12px rgba(102, 126, 234, 0.08)',
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            minHeight: 48,
            '& .MuiAccordionSummary-content': { my: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                fontSize: '0.9375rem',
              }}
            >
              Planned
            </Typography>
            <Chip
              label={procedures.upcoming.length}
              size="small"
              sx={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: 'white',
                fontWeight: 700,
                height: 22,
                fontSize: '0.6875rem',
              }}
            />
          </Box>
          {/* Add Procedure Button - Right Side (using Box to avoid nested buttons) */}
          <Box
            onClick={(e) => {
              e.stopPropagation(); // Prevent accordion toggle
              handleAddProcedureClick();
            }}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              minHeight: 32,
              px: 2,
              py: 0.5,
              borderRadius: 1,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              fontWeight: 600,
              fontSize: '0.8125rem',
              boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                background: 'linear-gradient(135deg, #5568d3 0%, #66348a 100%)',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                transform: 'translateY(-1px)',
              },
              '&:active': {
                transform: 'translateY(0)',
              },
            }}
          >
            <AddIcon sx={{ fontSize: 18 }} />
            Add New
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0 }}>
          {procedures.upcoming.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
              No upcoming procedures
            </Typography>
          ) : (
            <Box>{procedures.upcoming.map(renderProcedureCard)}</Box>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Completed Procedures - Compact & Themed */}
      <Accordion
        expanded={expanded === 'completed'}
        onChange={handleAccordionChange('completed')}
        sx={{
          borderRadius: 2,
          '&:before': { display: 'none' },
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(102, 126, 234, 0.15)',
          boxShadow: '0 2px 12px rgba(102, 126, 234, 0.08)',
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            minHeight: 48,
            '& .MuiAccordionSummary-content': { my: 1 },
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              fontWeight: 700,
              fontSize: '0.9375rem',
            }}
          >
            Completed
            <Chip
              label={procedures.completed.length}
              size="small"
              sx={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                fontWeight: 700,
                height: 22,
                fontSize: '0.6875rem',
              }}
            />
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0 }}>
          {procedures.completed.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
              No completed procedures
            </Typography>
          ) : (
            <Box>{procedures.completed.map(renderProcedureCard)}</Box>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Cancelled Procedures - Compact & Themed */}
      {procedures.cancelled.length > 0 && (
        <Accordion
          expanded={expanded === 'cancelled'}
          onChange={handleAccordionChange('cancelled')}
          sx={{
            borderRadius: 2,
            '&:before': { display: 'none' },
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(102, 126, 234, 0.15)',
            boxShadow: '0 2px 12px rgba(102, 126, 234, 0.08)',
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              minHeight: 48,
              '& .MuiAccordionSummary-content': { my: 1 },
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                fontWeight: 700,
                fontSize: '0.9375rem',
              }}
            >
              Cancelled
              <Chip
                label={procedures.cancelled.length}
                size="small"
                sx={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: 'white',
                  fontWeight: 700,
                  height: 22,
                  fontSize: '0.6875rem',
                }}
              />
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            <Box>{procedures.cancelled.map(renderProcedureCard)}</Box>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Confirmation Dialog - Themed */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => !actionLoading && setConfirmDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            border: '1px solid rgba(102, 126, 234, 0.2)',
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#667eea' }}>
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
            sx={{
              minHeight: 40,
              borderColor: '#667eea',
              color: '#667eea',
              fontWeight: 600,
              '&:hover': {
                borderColor: '#5568d3',
                background: 'rgba(102, 126, 234, 0.05)',
              },
            }}
          >
            No, Go Back
          </Button>
          <Button
            onClick={handleConfirmAction}
            disabled={actionLoading}
            variant="contained"
            sx={{
              minHeight: 40,
              fontWeight: 600,
              background: confirmAction === 'complete'
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              '&:hover': {
                background: confirmAction === 'complete'
                  ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                  : 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
              },
            }}
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
