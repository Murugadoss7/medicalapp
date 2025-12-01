/**
 * Dental Summary Table Component
 * Shows treatment history organized by visit date with quick summary
 * Supports both Visit History and Tooth Summary views
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Collapse,
  Tabs,
  Tab,
  Card,
  CardContent,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  CheckCircle as CompletedIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  HourglassEmpty as PendingIcon,
  KeyboardArrowDown,
  KeyboardArrowUp,
  CalendarToday,
  Notes as NotesIcon,
  LocalHospital,
  Visibility,
} from '@mui/icons-material';
import { format } from 'date-fns';
import dentalService, { type DentalChart } from '../../services/dentalService';

interface DentalSummaryTableProps {
  patientMobileNumber: string;
  patientFirstName: string;
  onRefresh?: () => void;
}

interface VisitSummary {
  appointmentId: string;
  date: Date;
  teeth: string[];
  observations: Array<{
    id: string;
    tooth_number: string;
    condition_type: string;
    severity?: string;
    tooth_surface?: string;
    observation_notes?: string;
    treatment_required: boolean;
    treatment_done: boolean;
  }>;
  procedures: Array<{
    id: string;
    tooth_numbers: string;
    procedure_name: string;
    procedure_code: string;
    status: string;
    procedure_notes?: string;
    estimated_cost?: number;
    actual_cost?: number;
    completed_date?: string;
  }>;
  notes: string[];
  status: 'completed' | 'in_progress' | 'planned';
}

interface ToothSummary {
  toothNumber: string;
  observations: Array<any>;
  procedures: Array<any>;
  overallStatus: 'healthy' | 'observation' | 'planned' | 'in_progress' | 'completed' | 'needs_attention';
}

const DentalSummaryTable: React.FC<DentalSummaryTableProps> = ({
  patientMobileNumber,
  patientFirstName,
  onRefresh,
}) => {
  const [dentalChart, setDentalChart] = useState<DentalChart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedVisits, setExpandedVisits] = useState<Set<string>>(new Set());
  const [expandedTeeth, setExpandedTeeth] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    loadDentalChart();
  }, [patientMobileNumber, patientFirstName]);

  const loadDentalChart = async () => {
    try {
      setLoading(true);
      setError(null);
      const chart = await dentalService.chart.getChart(patientMobileNumber, patientFirstName);
      setDentalChart(chart);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load dental data');
    } finally {
      setLoading(false);
    }
  };

  // Group data by visit/appointment date - with deduplication by ID
  const visitSummaries: VisitSummary[] = useMemo(() => {
    if (!dentalChart?.teeth) return [];

    const visitMap = new Map<string, VisitSummary>();
    // Track seen IDs to avoid duplicates (same observation/procedure can appear under multiple teeth)
    const seenObservationIds = new Set<string>();
    const seenProcedureIds = new Set<string>();

    dentalChart.teeth.forEach(tooth => {
      // Process observations - dedupe by ID
      tooth.observations.forEach(obs => {
        // Skip if we've already processed this observation
        if (seenObservationIds.has(obs.id)) return;
        seenObservationIds.add(obs.id);

        const dateKey = format(new Date(obs.created_at), 'yyyy-MM-dd');
        const appointmentId = obs.appointment_id || dateKey;

        if (!visitMap.has(appointmentId)) {
          visitMap.set(appointmentId, {
            appointmentId,
            date: new Date(obs.created_at),
            teeth: [],
            observations: [],
            procedures: [],
            notes: [],
            status: 'planned',
          });
        }

        const visit = visitMap.get(appointmentId)!;
        if (!visit.teeth.includes(tooth.tooth_number)) {
          visit.teeth.push(tooth.tooth_number);
        }
        visit.observations.push({
          ...obs,
          tooth_number: tooth.tooth_number,
        });
        if (obs.observation_notes) {
          visit.notes.push(`#${tooth.tooth_number}: ${obs.observation_notes}`);
        }
      });

      // Process procedures - dedupe by ID
      tooth.procedures.forEach(proc => {
        // Skip if we've already processed this procedure
        if (seenProcedureIds.has(proc.id)) return;
        seenProcedureIds.add(proc.id);

        const dateKey = format(new Date(proc.created_at), 'yyyy-MM-dd');
        const appointmentId = proc.appointment_id || dateKey;

        if (!visitMap.has(appointmentId)) {
          visitMap.set(appointmentId, {
            appointmentId,
            date: new Date(proc.created_at),
            teeth: [],
            observations: [],
            procedures: [],
            notes: [],
            status: 'planned',
          });
        }

        const visit = visitMap.get(appointmentId)!;
        const procTeeth = proc.tooth_numbers?.split(',') || [tooth.tooth_number];
        procTeeth.forEach(t => {
          const trimmedTooth = t.trim();
          if (trimmedTooth && !visit.teeth.includes(trimmedTooth)) {
            visit.teeth.push(trimmedTooth);
          }
        });
        visit.procedures.push({
          ...proc,
          tooth_numbers: proc.tooth_numbers || tooth.tooth_number,
        });
        if (proc.procedure_notes) {
          visit.notes.push(`Procedure: ${proc.procedure_notes}`);
        }

        // Update visit status based on procedure status
        if (proc.status === 'completed') {
          visit.status = 'completed';
        } else if (proc.status === 'in_progress' && visit.status !== 'completed') {
          visit.status = 'in_progress';
        }
      });
    });

    // Sort by date descending (newest first)
    return Array.from(visitMap.values())
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [dentalChart]);

  // Process teeth data into summary format (existing logic)
  const teethSummary: ToothSummary[] = useMemo(() => {
    if (!dentalChart?.teeth) return [];

    return dentalChart.teeth
      .filter(tooth => tooth.observations.length > 0 || tooth.procedures.length > 0)
      .map(tooth => {
        const completedProcedures = tooth.procedures.filter(p => p.status === 'completed');
        const inProgressProcedures = tooth.procedures.filter(p => p.status === 'in_progress');
        const plannedProcedures = tooth.procedures.filter(p => p.status === 'planned');
        const hasUnresolvedObservations = tooth.observations.some(o => o.treatment_required && !o.treatment_done);

        let overallStatus: ToothSummary['overallStatus'] = 'healthy';

        if (tooth.procedures.length > 0) {
          if (completedProcedures.length === tooth.procedures.length) {
            overallStatus = 'completed';
          } else if (inProgressProcedures.length > 0) {
            overallStatus = 'in_progress';
          } else if (plannedProcedures.length > 0) {
            overallStatus = 'planned';
          }
        } else if (hasUnresolvedObservations) {
          overallStatus = 'needs_attention';
        } else if (tooth.observations.length > 0) {
          overallStatus = 'observation';
        }

        return {
          toothNumber: tooth.tooth_number,
          observations: tooth.observations,
          procedures: tooth.procedures,
          overallStatus,
        };
      })
      .sort((a, b) => parseInt(a.toothNumber) - parseInt(b.toothNumber));
  }, [dentalChart]);

  // Quick summary - all observation notes
  const quickSummary = useMemo(() => {
    return visitSummaries
      .slice(0, 5) // Last 5 visits
      .filter(v => v.notes.length > 0)
      .map(v => ({
        date: v.date,
        notes: v.notes.slice(0, 3), // Max 3 notes per visit
        hasMore: v.notes.length > 3,
      }));
  }, [visitSummaries]);

  const toggleVisit = (appointmentId: string) => {
    const newExpanded = new Set(expandedVisits);
    if (newExpanded.has(appointmentId)) {
      newExpanded.delete(appointmentId);
    } else {
      newExpanded.add(appointmentId);
    }
    setExpandedVisits(newExpanded);
  };

  const toggleTooth = (toothNumber: string) => {
    const newExpanded = new Set(expandedTeeth);
    if (newExpanded.has(toothNumber)) {
      newExpanded.delete(toothNumber);
    } else {
      newExpanded.add(toothNumber);
    }
    setExpandedTeeth(newExpanded);
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'completed':
        return <Chip icon={<CompletedIcon />} label="Completed" color="success" size="small" />;
      case 'in_progress':
        return <Chip icon={<PendingIcon />} label="In Progress" color="warning" size="small" />;
      case 'planned':
        return <Chip icon={<WarningIcon />} label="Planned" color="info" size="small" />;
      case 'needs_attention':
        return <Chip icon={<ErrorIcon />} label="Needs Attention" color="error" size="small" />;
      case 'observation':
        return <Chip label="Observation" color="warning" size="small" variant="outlined" />;
      default:
        return <Chip label={status} size="small" variant="outlined" />;
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity?.toLowerCase()) {
      case 'severe': return 'error';
      case 'moderate': return 'warning';
      case 'mild': return 'info';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (visitSummaries.length === 0 && teethSummary.length === 0) {
    return (
      <Alert severity="info">
        No dental observations or procedures recorded for this patient yet.
      </Alert>
    );
  }

  // Statistics
  const stats = {
    totalVisits: visitSummaries.length,
    totalTeeth: teethSummary.length,
    totalObservations: teethSummary.reduce((sum, t) => sum + t.observations.length, 0),
    totalProcedures: teethSummary.reduce((sum, t) => sum + t.procedures.length, 0),
    completedVisits: visitSummaries.filter(v => v.status === 'completed').length,
  };

  return (
    <Box>
      {/* Quick Summary Section */}
      {quickSummary.length > 0 && (
        <Paper elevation={1} sx={{ p: 2, mb: 2, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <NotesIcon color="primary" fontSize="small" />
            <Typography variant="subtitle2" color="primary.main">
              Quick Summary - Recent Observations
            </Typography>
          </Box>
          {quickSummary.map((summary, idx) => (
            <Box key={idx} sx={{ mb: 1 }}>
              <Typography variant="caption" color="text.secondary" fontWeight="bold">
                {format(summary.date, 'MMM dd, yyyy')}:
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ ml: 1, fontStyle: 'italic' }}>
                {summary.notes.join(' | ')}{summary.hasMore ? ' ...' : ''}
              </Typography>
            </Box>
          ))}
        </Paper>
      )}

      {/* Statistics */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
        <Chip label={`${stats.totalVisits} Visits`} color="primary" size="small" />
        <Chip label={`${stats.totalTeeth} Teeth`} variant="outlined" size="small" />
        <Chip label={`${stats.totalObservations} Observations`} color="warning" size="small" variant="outlined" />
        <Chip label={`${stats.totalProcedures} Procedures`} color="info" size="small" variant="outlined" />
        {stats.completedVisits > 0 && (
          <Chip label={`${stats.completedVisits} Completed`} color="success" size="small" />
        )}
      </Box>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 2 }}>
        <Tab icon={<CalendarToday fontSize="small" />} iconPosition="start" label="Visit History" />
        <Tab icon={<LocalHospital fontSize="small" />} iconPosition="start" label="Tooth Summary" />
      </Tabs>

      {/* Visit History Tab */}
      {activeTab === 0 && (
        <Box>
          {visitSummaries.map((visit) => {
            const isExpanded = expandedVisits.has(visit.appointmentId);
            const isToday = format(visit.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

            return (
              <Card
                key={visit.appointmentId}
                sx={{
                  mb: 1.5,
                  border: isToday ? '2px solid' : '1px solid',
                  borderColor: isToday ? 'primary.main' : 'divider',
                }}
              >
                {/* Compact Header */}
                <CardContent
                  sx={{ py: 1.5, px: 2, cursor: 'pointer', '&:last-child': { pb: 1.5 } }}
                  onClick={() => toggleVisit(visit.appointmentId)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                      <CalendarToday fontSize="small" color="action" />
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {format(visit.date, 'MMM dd, yyyy')}
                          </Typography>
                          {isToday && <Chip label="Today" size="small" color="primary" sx={{ height: 20 }} />}
                          {getStatusChip(visit.status)}
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          Teeth: {visit.teeth.map(t => `#${t}`).join(', ')} •
                          {visit.observations.length} obs • {visit.procedures.length} proc
                        </Typography>
                      </Box>
                    </Box>

                    {/* Notes Preview */}
                    {visit.notes.length > 0 && !isExpanded && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontStyle: 'italic',
                          mx: 2,
                        }}
                      >
                        "{visit.notes[0]}"
                      </Typography>
                    )}

                    <IconButton size="small">
                      {isExpanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                    </IconButton>
                  </Box>
                </CardContent>

                {/* Expanded Details */}
                <Collapse in={isExpanded}>
                  <Divider />
                  <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                    {/* Notes Section */}
                    {visit.notes.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" fontWeight="bold" color="primary.main">
                          NOTES
                        </Typography>
                        {visit.notes.map((note, idx) => (
                          <Typography key={idx} variant="body2" sx={{ ml: 1, fontStyle: 'italic' }}>
                            • {note}
                          </Typography>
                        ))}
                      </Box>
                    )}

                    {/* Observations */}
                    {visit.observations.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" fontWeight="bold" color="warning.main">
                          OBSERVATIONS
                        </Typography>
                        <Table size="small" sx={{ mt: 0.5 }}>
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ py: 0.5 }}>Tooth</TableCell>
                              <TableCell sx={{ py: 0.5 }}>Condition</TableCell>
                              <TableCell sx={{ py: 0.5 }}>Severity</TableCell>
                              <TableCell sx={{ py: 0.5 }}>Surface</TableCell>
                              <TableCell sx={{ py: 0.5 }}>Treatment</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {visit.observations.map((obs) => (
                              <TableRow key={obs.id}>
                                <TableCell sx={{ py: 0.5 }}>#{obs.tooth_number}</TableCell>
                                <TableCell sx={{ py: 0.5 }}>{obs.condition_type}</TableCell>
                                <TableCell sx={{ py: 0.5 }}>
                                  {obs.severity ? (
                                    <Chip label={obs.severity} size="small" color={getSeverityColor(obs.severity) as any} />
                                  ) : '-'}
                                </TableCell>
                                <TableCell sx={{ py: 0.5 }}>{obs.tooth_surface || '-'}</TableCell>
                                <TableCell sx={{ py: 0.5 }}>
                                  {obs.treatment_done ? (
                                    <Chip label="Done" color="success" size="small" />
                                  ) : obs.treatment_required ? (
                                    <Chip label="Required" color="error" size="small" />
                                  ) : '-'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </Box>
                    )}

                    {/* Procedures */}
                    {visit.procedures.length > 0 && (
                      <Box>
                        <Typography variant="caption" fontWeight="bold" color="success.main">
                          PROCEDURES
                        </Typography>
                        <Table size="small" sx={{ mt: 0.5 }}>
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ py: 0.5 }}>Teeth</TableCell>
                              <TableCell sx={{ py: 0.5 }}>Procedure</TableCell>
                              <TableCell sx={{ py: 0.5 }}>Code</TableCell>
                              <TableCell sx={{ py: 0.5 }}>Status</TableCell>
                              <TableCell sx={{ py: 0.5 }}>Cost</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {visit.procedures.map((proc) => (
                              <TableRow key={proc.id}>
                                <TableCell sx={{ py: 0.5 }}>
                                  {proc.tooth_numbers.split(',').map(t => `#${t}`).join(', ')}
                                </TableCell>
                                <TableCell sx={{ py: 0.5 }}>{proc.procedure_name}</TableCell>
                                <TableCell sx={{ py: 0.5 }}>{proc.procedure_code}</TableCell>
                                <TableCell sx={{ py: 0.5 }}>{getStatusChip(proc.status)}</TableCell>
                                <TableCell sx={{ py: 0.5 }}>
                                  {proc.actual_cost ? `₹${proc.actual_cost}` :
                                   proc.estimated_cost ? `₹${proc.estimated_cost} (est.)` : '-'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </Box>
                    )}
                  </Box>
                </Collapse>
              </Card>
            );
          })}
        </Box>
      )}

      {/* Tooth Summary Tab */}
      {activeTab === 1 && (
        <Box>
          {teethSummary.map((tooth) => {
            const isExpanded = expandedTeeth.has(tooth.toothNumber);
            const latestObs = tooth.observations[0];
            const latestProc = tooth.procedures[0];

            return (
              <Card key={tooth.toothNumber} sx={{ mb: 1, border: '1px solid', borderColor: 'divider' }}>
                {/* Compact Header */}
                <CardContent
                  sx={{ py: 1, px: 2, cursor: 'pointer', '&:last-child': { pb: 1 } }}
                  onClick={() => toggleTooth(tooth.toothNumber)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Chip label={`#${tooth.toothNumber}`} color="primary" size="small" sx={{ fontWeight: 'bold' }} />
                      {getStatusChip(tooth.overallStatus)}
                      <Typography variant="caption" color="text.secondary">
                        {tooth.observations.length} obs • {tooth.procedures.length} proc
                      </Typography>
                    </Box>

                    {/* Quick Info */}
                    {!isExpanded && (
                      <Typography variant="caption" color="text.secondary" sx={{ mx: 2 }}>
                        {latestObs?.condition_type || latestProc?.procedure_name || ''}
                      </Typography>
                    )}

                    <IconButton size="small">
                      {isExpanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                    </IconButton>
                  </Box>
                </CardContent>

                {/* Expanded Details */}
                <Collapse in={isExpanded}>
                  <Divider />
                  <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                    {/* Observations */}
                    {tooth.observations.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" fontWeight="bold" color="warning.main">
                          OBSERVATIONS
                        </Typography>
                        {tooth.observations.map((obs) => (
                          <Box key={obs.id} sx={{ ml: 1, my: 0.5 }}>
                            <Typography variant="body2">
                              {obs.condition_type}
                              {obs.severity && <Chip label={obs.severity} size="small" sx={{ ml: 1, height: 18 }} color={getSeverityColor(obs.severity) as any} />}
                              {obs.tooth_surface && <span> ({obs.tooth_surface})</span>}
                            </Typography>
                            {obs.observation_notes && (
                              <Typography variant="caption" color="text.secondary" fontStyle="italic">
                                "{obs.observation_notes}"
                              </Typography>
                            )}
                            <Typography variant="caption" color="text.secondary" display="block">
                              {format(new Date(obs.created_at), 'MMM dd, yyyy')}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    )}

                    {/* Procedures */}
                    {tooth.procedures.length > 0 && (
                      <Box>
                        <Typography variant="caption" fontWeight="bold" color="success.main">
                          PROCEDURES
                        </Typography>
                        {tooth.procedures.map((proc) => (
                          <Box key={proc.id} sx={{ ml: 1, my: 0.5 }}>
                            <Typography variant="body2">
                              {proc.procedure_name} ({proc.procedure_code})
                              {getStatusChip(proc.status)}
                            </Typography>
                            {proc.procedure_notes && (
                              <Typography variant="caption" color="text.secondary" fontStyle="italic">
                                "{proc.procedure_notes}"
                              </Typography>
                            )}
                            <Typography variant="caption" color="text.secondary" display="block">
                              {proc.completed_date
                                ? `Completed: ${format(new Date(proc.completed_date), 'MMM dd, yyyy')}`
                                : format(new Date(proc.created_at), 'MMM dd, yyyy')}
                              {proc.actual_cost && ` • ₹${proc.actual_cost}`}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                </Collapse>
              </Card>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default DentalSummaryTable;
