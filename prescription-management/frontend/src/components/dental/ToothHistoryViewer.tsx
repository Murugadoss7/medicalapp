/**
 * Tooth History Viewer Component
 * Displays complete history of observations AND procedures for a specific tooth
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import {
  MedicalServices as ProcedureIcon,
  Visibility as ObservationIcon,
  CheckCircle as CompletedIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  HourglassEmpty as PendingIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import dentalService, { type DentalObservation, type DentalProcedure, type DentalChart } from '../../services/dentalService';

interface ToothHistoryViewerProps {
  patientMobileNumber: string;
  patientFirstName: string;
  toothNumber: string;
}

interface TimelineEntry {
  id: string;
  type: 'observation' | 'procedure';
  date: Date;
  data: DentalObservation | DentalProcedure;
}

const ToothHistoryViewer: React.FC<ToothHistoryViewerProps> = ({
  patientMobileNumber,
  patientFirstName,
  toothNumber,
}) => {
  const [observations, setObservations] = useState<DentalObservation[]>([]);
  const [procedures, setProcedures] = useState<DentalProcedure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    loadToothHistory();
  }, [patientMobileNumber, patientFirstName, toothNumber]);

  const loadToothHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get full dental chart which includes both observations and procedures
      const chart = await dentalService.chart.getChart(patientMobileNumber, patientFirstName);

      // Find the specific tooth data
      const toothData = chart.teeth.find(t => t.tooth_number === toothNumber);

      if (toothData) {
        setObservations(toothData.observations || []);
        setProcedures(toothData.procedures || []);
      } else {
        setObservations([]);
        setProcedures([]);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load tooth history');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity?.toLowerCase()) {
      case 'mild':
        return 'info';
      case 'moderate':
        return 'warning';
      case 'severe':
        return 'error';
      default:
        return 'default';
    }
  };

  const getProcedureStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'info';
      case 'planned':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  // Create unified timeline entries sorted by date
  const timelineEntries: TimelineEntry[] = React.useMemo(() => {
    const entries: TimelineEntry[] = [];

    observations.forEach(obs => {
      entries.push({
        id: obs.id,
        type: 'observation',
        date: new Date(obs.created_at),
        data: obs,
      });
    });

    procedures.forEach(proc => {
      entries.push({
        id: proc.id,
        type: 'procedure',
        date: new Date(proc.created_at),
        data: proc,
      });
    });

    // Sort by date descending (newest first)
    return entries.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [observations, procedures]);

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Loading tooth history...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const hasNoData = observations.length === 0 && procedures.length === 0;

  if (hasNoData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          No observations or procedures found for tooth #{toothNumber}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Tooth #{toothNumber} - Complete History
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip
            icon={<ObservationIcon />}
            label={`${observations.length} Observation${observations.length !== 1 ? 's' : ''}`}
            color="warning"
            variant="outlined"
            size="small"
          />
          <Chip
            icon={<ProcedureIcon />}
            label={`${procedures.length} Procedure${procedures.length !== 1 ? 's' : ''}`}
            color="primary"
            variant="outlined"
            size="small"
          />
        </Box>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Tabs for different views */}
      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 2 }}>
        <Tab label="Timeline View" />
        <Tab label="Observations" />
        <Tab label="Procedures" />
      </Tabs>

      {/* Timeline View */}
      {activeTab === 0 && (
        <Timeline position="right">
          {timelineEntries.map((entry, index) => {
            const isObservation = entry.type === 'observation';
            const obs = isObservation ? entry.data as DentalObservation : null;
            const proc = !isObservation ? entry.data as DentalProcedure : null;

            return (
              <TimelineItem key={entry.id}>
                <TimelineOppositeContent color="text.secondary" sx={{ flex: 0.25 }}>
                  <Typography variant="caption" display="block">
                    {format(entry.date, 'MMM dd, yyyy')}
                  </Typography>
                  <Typography variant="caption" display="block">
                    {format(entry.date, 'hh:mm a')}
                  </Typography>
                </TimelineOppositeContent>

                <TimelineSeparator>
                  <TimelineDot color={isObservation ? 'warning' : 'primary'}>
                    {isObservation ? <ObservationIcon /> : <ProcedureIcon />}
                  </TimelineDot>
                  {index < timelineEntries.length - 1 && <TimelineConnector />}
                </TimelineSeparator>

                <TimelineContent sx={{ pb: 3 }}>
                  <Paper elevation={1} sx={{ p: 2 }}>
                    {/* Type indicator */}
                    <Chip
                      label={isObservation ? 'Observation' : 'Procedure'}
                      color={isObservation ? 'warning' : 'primary'}
                      size="small"
                      sx={{ mb: 1 }}
                    />

                    {isObservation && obs && (
                      <>
                        <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap', mt: 1 }}>
                          <Chip label={obs.condition_type} size="small" variant="outlined" />
                          {obs.severity && (
                            <Chip
                              label={obs.severity}
                              color={getSeverityColor(obs.severity) as any}
                              size="small"
                            />
                          )}
                          {obs.tooth_surface && (
                            <Chip label={`Surface: ${obs.tooth_surface}`} size="small" variant="outlined" />
                          )}
                        </Box>
                        {obs.observation_notes && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {obs.observation_notes}
                          </Typography>
                        )}
                        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                          {obs.treatment_done ? (
                            <>
                              <CompletedIcon color="success" fontSize="small" />
                              <Typography variant="caption" color="success.main">
                                Treatment Completed
                                {obs.treatment_date && ` on ${format(new Date(obs.treatment_date), 'MMM dd, yyyy')}`}
                              </Typography>
                            </>
                          ) : obs.treatment_required ? (
                            <>
                              <ErrorIcon color="error" fontSize="small" />
                              <Typography variant="caption" color="error.main">Treatment Required</Typography>
                            </>
                          ) : (
                            <>
                              <WarningIcon color="warning" fontSize="small" />
                              <Typography variant="caption" color="warning.main">Observation Only</Typography>
                            </>
                          )}
                        </Box>
                      </>
                    )}

                    {!isObservation && proc && (
                      <>
                        <Typography variant="subtitle2" sx={{ mt: 1 }}>
                          {proc.procedure_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Code: {proc.procedure_code}
                        </Typography>
                        {proc.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {proc.description}
                          </Typography>
                        )}
                        <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                          <Chip
                            label={proc.status.replace('_', ' ')}
                            color={getProcedureStatusColor(proc.status) as any}
                            size="small"
                          />
                          {proc.estimated_cost && (
                            <Typography variant="caption">
                              Est: ₹{proc.estimated_cost}
                            </Typography>
                          )}
                          {proc.actual_cost && (
                            <Typography variant="caption">
                              Actual: ₹{proc.actual_cost}
                            </Typography>
                          )}
                        </Box>
                        {proc.completed_date && (
                          <Typography variant="caption" color="success.main" display="block" sx={{ mt: 1 }}>
                            Completed on {format(new Date(proc.completed_date), 'MMM dd, yyyy')}
                          </Typography>
                        )}
                      </>
                    )}
                  </Paper>
                </TimelineContent>
              </TimelineItem>
            );
          })}
        </Timeline>
      )}

      {/* Observations Table */}
      {activeTab === 1 && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'warning.light' }}>
                <TableCell><strong>Date</strong></TableCell>
                <TableCell><strong>Condition</strong></TableCell>
                <TableCell><strong>Surface</strong></TableCell>
                <TableCell><strong>Severity</strong></TableCell>
                <TableCell><strong>Treatment Status</strong></TableCell>
                <TableCell><strong>Notes</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {observations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary">No observations recorded</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                observations.map((obs) => (
                  <TableRow key={obs.id} hover>
                    <TableCell>{format(new Date(obs.created_at), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{obs.condition_type}</TableCell>
                    <TableCell>{obs.tooth_surface || '-'}</TableCell>
                    <TableCell>
                      {obs.severity ? (
                        <Chip label={obs.severity} color={getSeverityColor(obs.severity) as any} size="small" />
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {obs.treatment_done ? (
                        <Chip icon={<CompletedIcon />} label="Done" color="success" size="small" />
                      ) : obs.treatment_required ? (
                        <Chip icon={<ErrorIcon />} label="Required" color="error" size="small" />
                      ) : (
                        <Chip label="Not Required" size="small" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 200 }}>
                      <Typography variant="caption" noWrap title={obs.observation_notes}>
                        {obs.observation_notes || '-'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Procedures Table */}
      {activeTab === 2 && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.light' }}>
                <TableCell><strong>Date</strong></TableCell>
                <TableCell><strong>Procedure</strong></TableCell>
                <TableCell><strong>Code</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Cost</strong></TableCell>
                <TableCell><strong>Completed</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {procedures.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary">No procedures recorded</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                procedures.map((proc) => (
                  <TableRow key={proc.id} hover>
                    <TableCell>{format(new Date(proc.created_at), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{proc.procedure_name}</TableCell>
                    <TableCell>{proc.procedure_code}</TableCell>
                    <TableCell>
                      <Chip
                        label={proc.status.replace('_', ' ')}
                        color={getProcedureStatusColor(proc.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {proc.actual_cost
                        ? `₹${proc.actual_cost}`
                        : proc.estimated_cost
                        ? `₹${proc.estimated_cost} (est.)`
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {proc.completed_date
                        ? format(new Date(proc.completed_date), 'MMM dd, yyyy')
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default ToothHistoryViewer;
