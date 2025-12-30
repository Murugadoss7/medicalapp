/**
 * SavedObservationsPanel Component
 * Displays saved observations as collapsible cards with procedures
 * Matches Figma design with procedure action buttons
 */

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Chip,
  IconButton,
  Divider,
  Button,
  Collapse,
  TextField,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  CheckCircle as CompleteIcon,
  Schedule as RescheduleIcon,
  Cancel as CancelIcon,
  AttachFile as AttachFileIcon,
} from '@mui/icons-material';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { type ObservationData, type ProcedureData } from './ObservationRow';
import { FileGallery } from '../common/FileGallery';
import PostProcedureUploadDialog from '../common/PostProcedureUploadDialog';

interface FileAttachment {
  id: string;
  file_name: string;
  file_path: string;
  file_type: 'xray' | 'photo_before' | 'photo_after' | 'test_result' | 'document' | 'other';
  file_size: number;
  mime_type: string;
  caption?: string;
  created_at: string;
}

interface SavedObservationsPanelProps {
  observations: ObservationData[];
  onEditClick: (observation: ObservationData) => void;
  onEditInPanel?: (observation: ObservationData) => void;
  onRefresh: () => void;
  onUpdateProcedure?: (obsId: string, procedureData: Partial<ObservationData>) => Promise<void>;
  onDeleteObservation?: (obsId: string) => Promise<void>;
  editingObservationId?: string | null;
  // Attachments - mapping of observation ID to attachments array
  observationAttachments?: Record<string, FileAttachment[]>;
  onDeleteAttachment?: (attachmentId: string, observationId: string) => Promise<void>;
  // Upload handler for post-procedure photos
  onUploadAttachment?: (observationId: string, file: File, fileType: string, caption?: string) => Promise<void>;
}

const SavedObservationsPanel: React.FC<SavedObservationsPanelProps> = ({
  observations,
  onEditClick,
  onEditInPanel,
  onRefresh,
  onUpdateProcedure,
  onDeleteObservation,
  editingObservationId,
  observationAttachments = {},
  onDeleteAttachment,
  onUploadAttachment,
}) => {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [reschedulingProcedures, setReschedulingProcedures] = useState<Set<string>>(new Set());

  // Post-procedure upload dialog state
  const [showPostProcedureDialog, setShowPostProcedureDialog] = useState(false);
  const [completedProcedureInfo, setCompletedProcedureInfo] = useState<{
    observationId: string;
    procedure: ProcedureData;
  } | null>(null);
  const [procedureDates, setProcedureDates] = useState<Record<string, Date | null>>({});

  const toggleCard = (obsId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(obsId)) {
      newExpanded.delete(obsId);
    } else {
      newExpanded.add(obsId);
    }
    setExpandedCards(newExpanded);
  };

  const formatDate = (dateString?: string | Date | null) => {
    if (!dateString) return 'Today';
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      const now = new Date();
      const isToday =
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

      if (isToday) {
        return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }
      return date.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Today';
    }
  };

  const formatDateOnly = (dateString?: string | Date | null) => {
    if (!dateString) return '';
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      return date.toLocaleDateString('en-CA'); // YYYY-MM-DD format
    } catch {
      return '';
    }
  };

  const formatTimeOnly = (dateString?: string | Date | null) => {
    if (!dateString) return '';
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return '';
    }
  };

  const handleProcedureAction = async (obs: ObservationData, action: 'completed' | 'cancelled' | 'reschedule') => {
    if (!onUpdateProcedure) return;

    if (action === 'reschedule') {
      setReschedulingProcedures(prev => {
        const newSet = new Set(prev);
        newSet.add(obs.id);
        return newSet;
      });
      // Initialize with current date if available
      if (obs.procedureDate) {
        setProcedureDates(prev => ({ ...prev, [obs.id]: new Date(obs.procedureDate!) }));
      }
    } else {
      await onUpdateProcedure(obs.id, { procedureStatus: action });
    }
  };

  const handleSaveReschedule = async (obs: ObservationData) => {
    if (!onUpdateProcedure) return;

    const newDate = procedureDates[obs.id];
    if (newDate) {
      await onUpdateProcedure(obs.id, {
        procedureDate: newDate,
        procedureStatus: 'planned',
      });
    }

    setReschedulingProcedures(prev => {
      const newSet = new Set(prev);
      newSet.delete(obs.id);
      return newSet;
    });
  };

  const handleCancelReschedule = (obsId: string) => {
    setReschedulingProcedures(prev => {
      const newSet = new Set(prev);
      newSet.delete(obsId);
      return newSet;
    });
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      case 'planned':
      default:
        return 'info';
    }
  };

  const getStatusLabel = (status?: string) => {
    return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Scheduled';
  };

  // Count procedures from procedures array AND legacy single procedures
  const totalProcedures = observations.reduce((count, obs) => {
    const newProcs = obs.procedures?.length || 0;
    // Fix: Check backendProcedureId instead of procedureCode (which can be empty)
    const legacyProc = (!obs.procedures || obs.procedures.length === 0) && obs.hasProcedure && obs.backendProcedureId ? 1 : 0;
    return count + newProcs + legacyProc;
  }, 0);

  const scheduledProcedures = observations.reduce((count, obs) => {
    const scheduled = obs.procedures?.filter(p => p.procedureStatus?.toLowerCase() === 'planned').length || 0;
    const legacyScheduled = (!obs.procedures || obs.procedures.length === 0) && obs.hasProcedure && obs.procedureStatus?.toLowerCase() === 'planned' ? 1 : 0;
    return count + scheduled + legacyScheduled;
  }, 0);

  const doneProcedures = observations.reduce((count, obs) => {
    const done = obs.procedures?.filter(p => p.procedureStatus?.toLowerCase() === 'completed').length || 0;
    const legacyDone = (!obs.procedures || obs.procedures.length === 0) && obs.hasProcedure && obs.procedureStatus?.toLowerCase() === 'completed' ? 1 : 0;
    return count + done + legacyDone;
  }, 0);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(102, 126, 234, 0.15)',
        boxShadow: '0 2px 12px rgba(102, 126, 234, 0.1)',
      }}
    >
      {/* Header with Purple Theme */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h6" fontWeight={700} color="#667eea">
            Today's Observations ({observations.length})
          </Typography>
          <Typography variant="caption" color="text.secondary" fontWeight={500}>
            {scheduledProcedures} Scheduled | {doneProcedures} Done
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={onRefresh}
          title="Refresh"
          sx={{
            color: '#667eea',
            '&:hover': {
              bgcolor: 'rgba(102, 126, 234, 0.1)',
            },
          }}
        >
          <RefreshIcon />
        </IconButton>
      </Box>

      <Divider sx={{ mb: 2, borderColor: 'rgba(102, 126, 234, 0.15)' }} />

      {/* Cards */}
      <Box>
        {observations.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              No observations recorded yet
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Create a new observation using the form on the left
            </Typography>
          </Box>
        ) : (
          observations.map((obs) => {
            const isExpanded = expandedCards.has(obs.id);
            const isRescheduling = reschedulingProcedures.has(obs.id);

            return (
              <Card
                key={obs.id}
                elevation={0}
                sx={{
                  mb: 1.5,
                  border: '1px solid rgba(102, 126, 234, 0.15)',
                  borderRadius: 2,
                  overflow: 'hidden',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 2px 8px rgba(102, 126, 234, 0.08)',
                  transition: 'all 0.2s',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)',
                    borderColor: 'rgba(102, 126, 234, 0.25)',
                  },
                }}
              >
                {/* Card Header - Always Visible with Purple Theme */}
                <Box
                  sx={{
                    p: 1.5,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    cursor: 'pointer',
                    bgcolor: 'rgba(102, 126, 234, 0.03)',
                    transition: 'background 0.2s',
                    '&:hover': {
                      bgcolor: 'rgba(102, 126, 234, 0.06)',
                    },
                  }}
                  onClick={() => toggleCard(obs.id)}
                >
                  <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                    {/* Teeth and Status with Purple Theme */}
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center', mb: 1 }}>
                      {/* Single chip showing all teeth numbers */}
                      <Chip
                        label={`Teeth: ${obs.selectedTeeth.join(', ')}`}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.6875rem',
                          height: 24,
                          bgcolor: '#667eea',
                          color: 'white',
                        }}
                      />
                      {obs.severity && (
                        <Chip
                          label={obs.severity}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.6875rem',
                            height: 24,
                            bgcolor: obs.severity === 'Severe' ? '#ef4444' :
                              obs.severity === 'Moderate' ? '#f59e0b' : '#10b981',
                            color: 'white',
                          }}
                        />
                      )}
                      {/* Show procedure count for THIS observation - with Purple Theme */}
                      {((obs.procedures && obs.procedures.length > 0) || (obs.hasProcedure && obs.backendProcedureId)) && (
                        <Chip
                          label={(() => {
                            const newScheduled = obs.procedures?.filter(p => p.procedureStatus?.toLowerCase() === 'planned').length || 0;
                            const newDone = obs.procedures?.filter(p => p.procedureStatus?.toLowerCase() === 'completed').length || 0;
                            const legacyScheduled = (!obs.procedures || obs.procedures.length === 0) && obs.hasProcedure && obs.procedureStatus?.toLowerCase() === 'planned' ? 1 : 0;
                            const legacyDone = (!obs.procedures || obs.procedures.length === 0) && obs.hasProcedure && obs.procedureStatus?.toLowerCase() === 'completed' ? 1 : 0;
                            return `${newScheduled + legacyScheduled} Scheduled | ${newDone + legacyDone} Done`;
                          })()}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.6875rem',
                            height: 24,
                            borderColor: '#3b82f6',
                            color: '#3b82f6',
                            bgcolor: 'rgba(59, 130, 246, 0.05)',
                          }}
                          variant="outlined"
                        />
                      )}
                      {/* Show attachment count badge with Purple Theme */}
                      {(() => {
                        const attachmentCount = observationAttachments[obs.id]?.length || 0;
                        if (attachmentCount > 0) {
                          return (
                            <Chip
                              icon={<AttachFileIcon sx={{ fontSize: 14, color: '#3b82f6' }} />}
                              label={attachmentCount}
                              size="small"
                              variant="outlined"
                              sx={{
                                fontWeight: 700,
                                fontSize: '0.6875rem',
                                height: 24,
                                borderColor: '#3b82f6',
                                color: '#3b82f6',
                                bgcolor: 'rgba(59, 130, 246, 0.05)',
                              }}
                            />
                          );
                        }
                        return null;
                      })()}
                    </Box>

                    {/* Condition */}
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 500,
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                        wordBreak: 'break-word',
                      }}
                    >
                      Condition: {obs.conditionType}
                    </Typography>

                    {/* Timestamp */}
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(obs.created_at)}
                    </Typography>
                  </Box>

                  {/* Edit, Expand/Collapse and Delete */}
                  <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                    {onEditInPanel && (
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditInPanel(obs);
                        }}
                        title="Edit observation"
                      >
                        <EditIcon />
                      </IconButton>
                    )}
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCard(obs.id);
                      }}
                    >
                      {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onDeleteObservation) {
                          onDeleteObservation(obs.id);
                        }
                      }}
                      title="Delete observation"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>

                {/* Expandable Content */}
                <Collapse in={isExpanded} timeout="auto">
                  <CardContent sx={{ pt: 2 }}>
                    {/* Observation Details */}
                    {obs.observationNotes && (
                      <Box sx={{ mb: 2 }}>
                        {/* Template indicator */}
                        {obs.selectedTemplateIds && (
                          <Chip
                            label="Template Notes"
                            size="small"
                            variant="outlined"
                            color="info"
                            sx={{ mb: 1, fontSize: '0.65rem' }}
                          />
                        )}
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                            wordBreak: 'break-word',
                          }}
                        >
                          {obs.observationNotes}
                        </Typography>
                      </Box>
                    )}
                    {/* Custom Notes (if separate from template notes) */}
                    {obs.customNotes && !obs.observationNotes?.includes(obs.customNotes) && (
                      <Box sx={{ mb: 2, pl: 1, borderLeft: '2px solid', borderColor: 'primary.light' }}>
                        <Typography variant="caption" color="text.secondary" fontStyle="italic">
                          Additional notes:
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                            wordBreak: 'break-word',
                          }}
                        >
                          {obs.customNotes}
                        </Typography>
                      </Box>
                    )}

                    {/* Procedures Section - Loop through ALL procedures */}
                    {((obs.procedures && obs.procedures.length > 0) || (obs.hasProcedure && obs.backendProcedureId)) && (
                      <>
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                          Procedures ({obs.procedures?.length || 1}):
                        </Typography>

                        {/* Loop through all procedures - Support both new array and legacy single procedure */}
                        {(obs.procedures && obs.procedures.length > 0 ? obs.procedures :
                          obs.hasProcedure && obs.backendProcedureId ? [{
                            id: 'legacy',
                            selectedTeeth: obs.selectedTeeth,
                            procedureCode: obs.procedureCode,
                            procedureName: obs.procedureName,
                            customProcedureName: obs.customProcedureName,
                            procedureDate: obs.procedureDate,
                            procedureTime: obs.procedureDate, // Use same date for time
                            procedureNotes: obs.procedureNotes,
                            procedureStatus: obs.procedureStatus || 'planned',
                          }] : []
                        ).map((procedure, procIndex) => {
                          const isRescheduling = reschedulingProcedures.has(procedure.id);

                          return (
                            <Box
                              key={procedure.id}
                              sx={{
                                p: 2,
                                border: '2px solid',
                                borderColor: procedure.procedureStatus?.toLowerCase() === 'completed' ? 'success.light' :
                                            procedure.procedureStatus?.toLowerCase() === 'cancelled' ? 'error.light' : 'primary.light',
                                borderRadius: 1,
                                bgcolor: procedure.procedureStatus?.toLowerCase() === 'completed' ? 'success.50' :
                                          procedure.procedureStatus?.toLowerCase() === 'cancelled' ? 'error.50' : 'primary.50',
                                mb: 2,
                              }}
                            >
                              {/* Procedure Header */}
                              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1, flexWrap: 'wrap' }}>
                                <Typography variant="caption" fontWeight="bold" color="primary">
                                  #{procIndex + 1}
                                </Typography>
                                <Chip
                                  label={`Teeth: ${procedure.selectedTeeth.join(', ')}`}
                                  size="small"
                                  sx={{ bgcolor: 'white', border: '1px solid', borderColor: 'divider' }}
                                />
                                <Chip
                                  label={getStatusLabel(procedure.procedureStatus)}
                                  size="small"
                                  color={getStatusColor(procedure.procedureStatus)}
                                />
                              </Box>

                              {/* Procedure Name */}
                              <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>
                                {procedure.procedureCode === 'CUSTOM' ? procedure.customProcedureName : procedure.procedureName}
                              </Typography>

                              {/* Date and Time - View or Reschedule Mode */}
                              {isRescheduling ? (
                                <LocalizationProvider dateAdapter={AdapterDateFns}>
                                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                    <DatePicker
                                      label="Date"
                                      value={procedureDates[procedure.id] || procedure.procedureDate}
                                      onChange={(newDate) => setProcedureDates(prev => ({ ...prev, [procedure.id]: newDate }))}
                                      slotProps={{
                                        textField: {
                                          size: 'small',
                                          sx: { flex: 1 },
                                        },
                                      }}
                                    />
                                    <TimePicker
                                      label="Time"
                                      value={procedureDates[procedure.id] || procedure.procedureTime}
                                      onChange={(newTime) => setProcedureDates(prev => ({ ...prev, [procedure.id]: newTime }))}
                                      slotProps={{
                                        textField: {
                                          size: 'small',
                                          sx: { flex: 1 },
                                        },
                                      }}
                                    />
                                  </Box>
                                </LocalizationProvider>
                              ) : (
                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 1 }}>
                                  <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                                    <CalendarIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                    <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                                      {formatDateOnly(procedure.procedureDate)}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                                    <TimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                    <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                                      {formatTimeOnly(procedure.procedureTime || procedure.procedureDate)}
                                    </Typography>
                                  </Box>
                                </Box>
                              )}

                              {/* Procedure Notes */}
                              {procedure.procedureNotes && (
                                <Box
                                  sx={{
                                    p: 1,
                                    bgcolor: 'white',
                                    borderRadius: 1,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    mb: 2,
                                  }}
                                >
                                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                    {procedure.procedureNotes}
                                  </Typography>
                                </Box>
                              )}

                              {/* Action Buttons - Only show for scheduled procedures */}
                              {procedure.procedureStatus?.toLowerCase() === 'planned' && (
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                  {isRescheduling ? (
                                    <>
                                      <Button
                                        variant="contained"
                                        size="small"
                                        onClick={async () => {
                                          if (onUpdateProcedure) {
                                            // Handle both new array and legacy single procedure
                                            if (obs.procedures && obs.procedures.length > 0) {
                                              // New array structure
                                              await onUpdateProcedure(obs.id, {
                                                procedures: obs.procedures.map(p =>
                                                  p.id === procedure.id
                                                    ? { ...p, procedureDate: procedureDates[procedure.id] || p.procedureDate, procedureTime: procedureDates[procedure.id] || p.procedureTime }
                                                    : p
                                                )
                                              });
                                            } else {
                                              // Legacy single procedure - update date directly
                                              await onUpdateProcedure(obs.id, {
                                                procedureDate: procedureDates[procedure.id] || procedure.procedureDate
                                              });
                                            }
                                          }
                                          setReschedulingProcedures(prev => {
                                            const newSet = new Set(prev);
                                            newSet.delete(procedure.id);
                                            return newSet;
                                          });
                                        }}
                                        sx={{ textTransform: 'none', fontSize: '0.7rem' }}
                                      >
                                        Save
                                      </Button>
                                      <Button
                                        variant="outlined"
                                        size="small"
                                        color="inherit"
                                        onClick={() => {
                                          setReschedulingProcedures(prev => {
                                            const newSet = new Set(prev);
                                            newSet.delete(procedure.id);
                                            return newSet;
                                          });
                                        }}
                                        sx={{ textTransform: 'none', fontSize: '0.7rem' }}
                                      >
                                        Cancel
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <Button
                                        variant="contained"
                                        color="success"
                                        size="small"
                                        startIcon={<CompleteIcon sx={{ fontSize: 14 }} />}
                                        onClick={async () => {
                                          if (onUpdateProcedure) {
                                            // Handle both new array and legacy single procedure
                                            if (obs.procedures && obs.procedures.length > 0) {
                                              // New array structure
                                              await onUpdateProcedure(obs.id, {
                                                procedures: obs.procedures.map(p =>
                                                  p.id === procedure.id ? { ...p, procedureStatus: 'completed' } : p
                                                )
                                              });
                                            } else {
                                              // Legacy single procedure - update status directly
                                              await onUpdateProcedure(obs.id, {
                                                procedureStatus: 'completed'
                                              });
                                            }
                                          }
                                          // Show post-procedure upload dialog if handler available
                                          if (onUploadAttachment) {
                                            setCompletedProcedureInfo({
                                              observationId: obs.id,
                                              procedure: procedure as ProcedureData,
                                            });
                                            setShowPostProcedureDialog(true);
                                          }
                                        }}
                                        sx={{ textTransform: 'none', fontSize: '0.7rem' }}
                                      >
                                        Complete
                                      </Button>
                                      <Button
                                        variant="contained"
                                        color="primary"
                                        size="small"
                                        startIcon={<RescheduleIcon sx={{ fontSize: 14 }} />}
                                        onClick={() => {
                                          setReschedulingProcedures(prev => {
                                            const newSet = new Set(prev);
                                            newSet.add(procedure.id);
                                            return newSet;
                                          });
                                          setProcedureDates(prev => ({
                                            ...prev,
                                            [procedure.id]: procedure.procedureDate || new Date()
                                          }));
                                        }}
                                        sx={{ textTransform: 'none', fontSize: '0.7rem' }}
                                      >
                                        Reschedule
                                      </Button>
                                      <Button
                                        variant="contained"
                                        color="error"
                                        size="small"
                                        startIcon={<CancelIcon sx={{ fontSize: 14 }} />}
                                        onClick={async () => {
                                          if (onUpdateProcedure) {
                                            // Handle both new array and legacy single procedure
                                            if (obs.procedures && obs.procedures.length > 0) {
                                              // New array structure
                                              await onUpdateProcedure(obs.id, {
                                                procedures: obs.procedures.map(p =>
                                                  p.id === procedure.id ? { ...p, procedureStatus: 'cancelled' } : p
                                                )
                                              });
                                            } else {
                                              // Legacy single procedure - update status directly
                                              await onUpdateProcedure(obs.id, {
                                                procedureStatus: 'cancelled'
                                              });
                                            }
                                          }
                                        }}
                                        sx={{ textTransform: 'none', fontSize: '0.7rem' }}
                                      >
                                        Cancel
                                      </Button>
                                    </>
                                  )}
                                </Box>
                              )}
                            </Box>
                          );
                        })}
                      </>
                    )}

                    {/* Attachments Section */}
                    {(() => {
                      const attachments = observationAttachments[obs.id] || [];
                      if (attachments.length > 0) {
                        return (
                          <>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                              Attachments ({attachments.length}):
                            </Typography>
                            <FileGallery
                              attachments={attachments}
                              onDelete={onDeleteAttachment ? (attachmentId) => onDeleteAttachment(attachmentId, obs.id) : undefined}
                              readOnly={false}
                            />
                          </>
                        );
                      }
                      return null;
                    })()}
                  </CardContent>
                </Collapse>
              </Card>
            );
          })
        )}
      </Box>

      {/* Post-Procedure Upload Dialog */}
      {completedProcedureInfo && (
        <PostProcedureUploadDialog
          open={showPostProcedureDialog}
          procedureName={completedProcedureInfo.procedure.procedureName || completedProcedureInfo.procedure.customProcedureName || 'Procedure'}
          toothNumbers={completedProcedureInfo.procedure.selectedTeeth}
          onClose={() => {
            setShowPostProcedureDialog(false);
            setCompletedProcedureInfo(null);
          }}
          onUploadComplete={async (file, fileType, caption) => {
            if (onUploadAttachment && completedProcedureInfo) {
              // Get the real backend observation ID from the observation
              const obs = observations.find(o => o.id === completedProcedureInfo.observationId);
              let realObservationId = completedProcedureInfo.observationId;

              // Try to get real UUID from backendObservationIds
              if (obs?.backendObservationIds) {
                const firstId = Object.values(obs.backendObservationIds)[0];
                if (firstId) realObservationId = firstId;
              }

              await onUploadAttachment(realObservationId, file, fileType, caption);
            }
          }}
          onSkip={() => {
            setShowPostProcedureDialog(false);
            setCompletedProcedureInfo(null);
          }}
        />
      )}
    </Paper>
  );
};

export default SavedObservationsPanel;
