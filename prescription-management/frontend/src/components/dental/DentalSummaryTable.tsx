/**
 * Dental Summary Table Component
 * Shows a holistic view of all teeth with observations and procedures
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Collapse,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle as CompletedIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  HourglassEmpty as PendingIcon,
  KeyboardArrowDown,
  KeyboardArrowUp,
} from '@mui/icons-material';
import { format } from 'date-fns';
import dentalService, { type DentalChart } from '../../services/dentalService';

interface DentalSummaryTableProps {
  patientMobileNumber: string;
  patientFirstName: string;
  onRefresh?: () => void;
}

interface ToothSummary {
  toothNumber: string;
  observations: Array<{
    id: string;
    condition_type: string;
    severity?: string;
    tooth_surface?: string;
    treatment_required: boolean;
    treatment_done: boolean;
    created_at: string;
  }>;
  procedures: Array<{
    id: string;
    procedure_name: string;
    procedure_code: string;
    status: string;
    estimated_cost?: number;
    actual_cost?: number;
    created_at: string;
    completed_date?: string;
  }>;
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
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

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

  const toggleRow = (toothNumber: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(toothNumber)) {
      newExpanded.delete(toothNumber);
    } else {
      newExpanded.add(toothNumber);
    }
    setExpandedRows(newExpanded);
  };

  // Process teeth data into summary format
  const teethSummary: ToothSummary[] = React.useMemo(() => {
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

  const getStatusChip = (status: ToothSummary['overallStatus']) => {
    switch (status) {
      case 'completed':
        return <Chip icon={<CompletedIcon />} label="Completed" color="success" size="small" />;
      case 'in_progress':
        return <Chip icon={<PendingIcon />} label="In Progress" color="info" size="small" />;
      case 'planned':
        return <Chip icon={<WarningIcon />} label="Planned" color="warning" size="small" />;
      case 'needs_attention':
        return <Chip icon={<ErrorIcon />} label="Needs Attention" color="error" size="small" />;
      case 'observation':
        return <Chip icon={<WarningIcon />} label="Observation" color="warning" size="small" variant="outlined" />;
      default:
        return <Chip label="Healthy" size="small" variant="outlined" />;
    }
  };

  const getProcedureStatusChip = (status: string) => {
    switch (status) {
      case 'completed':
        return <Chip label="Completed" color="success" size="small" />;
      case 'in_progress':
        return <Chip label="In Progress" color="info" size="small" />;
      case 'planned':
        return <Chip label="Planned" color="warning" size="small" />;
      case 'cancelled':
        return <Chip label="Cancelled" color="error" size="small" variant="outlined" />;
      default:
        return <Chip label={status} size="small" />;
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

  if (teethSummary.length === 0) {
    return (
      <Alert severity="info">
        No dental observations or procedures recorded for this patient yet.
      </Alert>
    );
  }

  // Calculate summary statistics
  const stats = {
    totalTeeth: teethSummary.length,
    completed: teethSummary.filter(t => t.overallStatus === 'completed').length,
    inProgress: teethSummary.filter(t => t.overallStatus === 'in_progress').length,
    planned: teethSummary.filter(t => t.overallStatus === 'planned').length,
    needsAttention: teethSummary.filter(t => t.overallStatus === 'needs_attention').length,
    totalObservations: teethSummary.reduce((sum, t) => sum + t.observations.length, 0),
    totalProcedures: teethSummary.reduce((sum, t) => sum + t.procedures.length, 0),
  };

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      {/* Header with Statistics */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Dental Treatment Summary
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
          <Chip label={`${stats.totalTeeth} Teeth with records`} variant="outlined" />
          <Chip label={`${stats.totalObservations} Observations`} color="warning" variant="outlined" />
          <Chip label={`${stats.totalProcedures} Procedures`} color="primary" variant="outlined" />
          {stats.completed > 0 && <Chip label={`${stats.completed} Completed`} color="success" />}
          {stats.inProgress > 0 && <Chip label={`${stats.inProgress} In Progress`} color="info" />}
          {stats.planned > 0 && <Chip label={`${stats.planned} Planned`} color="warning" />}
          {stats.needsAttention > 0 && <Chip label={`${stats.needsAttention} Need Attention`} color="error" />}
        </Box>
      </Box>

      {/* Summary Table */}
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell width={50}></TableCell>
              <TableCell><strong>Tooth #</strong></TableCell>
              <TableCell><strong>Observations</strong></TableCell>
              <TableCell><strong>Procedures</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Last Updated</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {teethSummary.map((tooth) => {
              const isExpanded = expandedRows.has(tooth.toothNumber);
              const lastDate = [...tooth.observations, ...tooth.procedures]
                .map(item => new Date(item.created_at))
                .sort((a, b) => b.getTime() - a.getTime())[0];

              return (
                <React.Fragment key={tooth.toothNumber}>
                  {/* Main Row */}
                  <TableRow
                    hover
                    sx={{ cursor: 'pointer', '& > *': { borderBottom: isExpanded ? 'none' : undefined } }}
                    onClick={() => toggleRow(tooth.toothNumber)}
                  >
                    <TableCell>
                      <IconButton size="small">
                        {isExpanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        #{tooth.toothNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {tooth.observations.length > 0 ? (
                        <Tooltip title={tooth.observations.map(o => o.condition_type).join(', ')}>
                          <Chip
                            label={`${tooth.observations.length} observation${tooth.observations.length > 1 ? 's' : ''}`}
                            size="small"
                            color="warning"
                            variant="outlined"
                          />
                        </Tooltip>
                      ) : (
                        <Typography variant="body2" color="text.secondary">-</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {tooth.procedures.length > 0 ? (
                        <Tooltip title={tooth.procedures.map(p => `${p.procedure_name} (${p.status})`).join(', ')}>
                          <Chip
                            label={`${tooth.procedures.length} procedure${tooth.procedures.length > 1 ? 's' : ''}`}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </Tooltip>
                      ) : (
                        <Typography variant="body2" color="text.secondary">-</Typography>
                      )}
                    </TableCell>
                    <TableCell>{getStatusChip(tooth.overallStatus)}</TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {lastDate ? format(lastDate, 'MMM dd, yyyy') : '-'}
                      </Typography>
                    </TableCell>
                  </TableRow>

                  {/* Expanded Details Row */}
                  <TableRow>
                    <TableCell colSpan={6} sx={{ py: 0 }}>
                      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <Box sx={{ py: 2, px: 4, bgcolor: 'grey.50' }}>
                          {/* Observations */}
                          {tooth.observations.length > 0 && (
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" color="warning.main" gutterBottom>
                                Observations
                              </Typography>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Condition</TableCell>
                                    <TableCell>Surface</TableCell>
                                    <TableCell>Severity</TableCell>
                                    <TableCell>Treatment</TableCell>
                                    <TableCell>Date</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {tooth.observations.map((obs) => (
                                    <TableRow key={obs.id}>
                                      <TableCell>{obs.condition_type}</TableCell>
                                      <TableCell>{obs.tooth_surface || '-'}</TableCell>
                                      <TableCell>
                                        {obs.severity ? (
                                          <Chip
                                            label={obs.severity}
                                            size="small"
                                            color={
                                              obs.severity === 'severe' ? 'error' :
                                              obs.severity === 'moderate' ? 'warning' : 'info'
                                            }
                                          />
                                        ) : '-'}
                                      </TableCell>
                                      <TableCell>
                                        {obs.treatment_done ? (
                                          <Chip label="Done" color="success" size="small" />
                                        ) : obs.treatment_required ? (
                                          <Chip label="Required" color="error" size="small" />
                                        ) : (
                                          <Chip label="Not Required" size="small" variant="outlined" />
                                        )}
                                      </TableCell>
                                      <TableCell>{format(new Date(obs.created_at), 'MMM dd, yyyy')}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </Box>
                          )}

                          {/* Procedures */}
                          {tooth.procedures.length > 0 && (
                            <Box>
                              <Typography variant="subtitle2" color="primary.main" gutterBottom>
                                Procedures
                              </Typography>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Procedure</TableCell>
                                    <TableCell>Code</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Cost</TableCell>
                                    <TableCell>Date</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {tooth.procedures.map((proc) => (
                                    <TableRow key={proc.id}>
                                      <TableCell>{proc.procedure_name}</TableCell>
                                      <TableCell>{proc.procedure_code}</TableCell>
                                      <TableCell>{getProcedureStatusChip(proc.status)}</TableCell>
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
                                          : format(new Date(proc.created_at), 'MMM dd, yyyy')}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </Box>
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default DentalSummaryTable;
