/**
 * Grouped Treatment Timeline Component
 * Shows one card per appointment with all related observations and procedures
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
  Fade,
  Collapse,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  MedicalServices as ProcedureIcon,
  EventNote as AppointmentIcon,
  Visibility as ObservationIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { GroupedTimelineEntry } from '../../services/treatmentService';
import treatmentService from '../../services/treatmentService';

interface TreatmentTimelineGroupedProps {
  patientMobile: string;
  patientFirstName: string;
  onProcedureClick?: (procedureId: string) => void;
  onPrescriptionClick?: (prescriptionId: string) => void;
}

const TreatmentTimelineGrouped = ({ patientMobile, patientFirstName, onProcedureClick, onPrescriptionClick }: TreatmentTimelineGroupedProps) => {
  const [timeline, setTimeline] = useState<GroupedTimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadTimeline();
  }, [patientMobile, patientFirstName]);

  const loadTimeline = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await treatmentService.fetchPatientTimelineGrouped(
        patientMobile,
        patientFirstName
      );

      setTimeline(response.timeline || []);
      // Auto-expand first card
      if (response.timeline && response.timeline.length > 0) {
        setExpandedCards(new Set([response.timeline[0].appointment_id]));
      }
    } catch (err: any) {
      console.error('Error loading timeline:', err);
      setError(err.response?.data?.detail || 'Failed to load timeline');
    } finally {
      setLoading(false);
    }
  };

  const toggleCard = (appointmentId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(appointmentId)) {
        newSet.delete(appointmentId);
      } else {
        newSet.add(appointmentId);
      }
      return newSet;
    });
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'warning';
      case 'scheduled':
        return 'info';
      case 'cancelled':
        return 'error';
      case 'planned':
        return 'default';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: 300,
        }}
      >
        <CircularProgress
          sx={{
            color: '#667eea',
            mb: 2,
          }}
        />
        <Typography variant="body2" color="text.secondary">
          Loading timeline...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert
        severity="error"
        sx={{
          borderRadius: 3,
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)',
        }}
      >
        {error}
      </Alert>
    );
  }

  if (timeline.length === 0) {
    return (
      <Box
        sx={{
          textAlign: 'center',
          py: 8,
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <CalendarIcon sx={{ fontSize: 40, color: '#667eea' }} />
        </Box>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
          No treatment history available
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Treatment events will appear here once recorded
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      {timeline.map((entry, index) => {
        const isExpanded = expandedCards.has(entry.appointment_id);
        const hasData = entry.observations.length > 0 || entry.procedures.length > 0;

        return (
          <Fade key={entry.appointment_id} in timeout={800 + index * 100}>
            <Card
              sx={{
                borderRadius: 3,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '2px solid',
                borderColor: isExpanded ? '#667eea' : 'rgba(102, 126, 234, 0.15)',
                boxShadow: isExpanded
                  ? '0 8px 24px rgba(102, 126, 234, 0.25)'
                  : '0 2px 8px rgba(102, 126, 234, 0.1)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                {/* Header Row */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  {/* Date & Time */}
                  <Box>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarIcon sx={{ fontSize: 20 }} />
                        {new Date(entry.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </Typography>
                      {entry.time && (
                        <Chip
                          icon={<TimeIcon />}
                          label={entry.time}
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 600 }}
                        />
                      )}
                      <Chip
                        label={entry.appointment_status.replace('_', ' ')}
                        size="small"
                        color={getStatusColor(entry.appointment_status) as any}
                        sx={{ fontWeight: 700, textTransform: 'capitalize' }}
                      />
                    </Box>

                    {/* Summary Line */}
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      Teeth: {entry.summary.teeth_affected.join(', ') || 'None'} • {entry.summary.total_observations} obs • {entry.summary.total_procedures} proc
                    </Typography>
                  </Box>

                  {/* Expand Button */}
                  {hasData && (
                    <IconButton
                      onClick={() => toggleCard(entry.appointment_id)}
                      sx={{
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s',
                      }}
                    >
                      <ExpandMoreIcon />
                    </IconButton>
                  )}
                </Box>

                {/* Appointment Details */}
                <Box sx={{ mb: hasData && isExpanded ? 2 : 0 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {entry.appointment_status.replace('_', ' ').charAt(0).toUpperCase() + entry.appointment_status.replace('_', ' ').slice(1)} Appointment
                    {entry.doctor_name && ` • ${entry.doctor_name}`}
                  </Typography>
                  {entry.reason_for_visit && (
                    <Typography variant="body2" color="text.secondary">
                      {entry.reason_for_visit}
                    </Typography>
                  )}
                </Box>

                {/* Expandable Content */}
                {hasData && (
                  <Collapse in={isExpanded} timeout={300}>
                    <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                      {/* Observations Section */}
                      {entry.observations.length > 0 && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem', mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: '#f59e0b' }}>
                            <ObservationIcon sx={{ fontSize: 20 }} />
                            OBSERVATIONS
                          </Typography>
                          <Table size="small" sx={{ border: '1px solid rgba(0,0,0,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                            <TableHead sx={{ bgcolor: '#fef3c7' }}>
                              <TableRow>
                                <TableCell sx={{ fontWeight: 700 }}>Tooth</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Condition</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Severity</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Surface</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Treatment</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Prescription</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {entry.observations.map((obs) => (
                                <TableRow key={obs.id}>
                                  <TableCell>#{obs.tooth_number}</TableCell>
                                  <TableCell>{obs.condition_type}</TableCell>
                                  <TableCell>
                                    <Chip
                                      label={obs.severity}
                                      size="small"
                                      color={obs.severity === 'Mild' ? 'success' : obs.severity === 'Moderate' ? 'warning' : 'error'}
                                    />
                                  </TableCell>
                                  <TableCell>{obs.tooth_surface}</TableCell>
                                  <TableCell>
                                    <Chip
                                      label={obs.treatment_done ? 'Done' : obs.treatment_required ? 'Required' : 'Not Required'}
                                      size="small"
                                      color={obs.treatment_done ? 'success' : obs.treatment_required ? 'error' : 'default'}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    {obs.prescription ? (
                                      <Box>
                                        <Chip
                                          label={obs.prescription.prescription_number}
                                          size="small"
                                          color="success"
                                          onClick={() => onPrescriptionClick?.(obs.prescription!.id)}
                                          sx={{
                                            mb: 0.5,
                                            fontWeight: 600,
                                            cursor: onPrescriptionClick ? 'pointer' : 'default',
                                            '&:hover': onPrescriptionClick ? {
                                              backgroundColor: '#059669',
                                              transform: 'scale(1.05)',
                                            } : {}
                                          }}
                                        />
                                        <Typography variant="caption" display="block" color="text.secondary">
                                          {obs.prescription.diagnosis}
                                        </Typography>
                                      </Box>
                                    ) : (
                                      <Typography variant="caption" color="text.secondary">
                                        -
                                      </Typography>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </Box>
                      )}

                      {/* Procedures Section */}
                      {entry.procedures.length > 0 && (
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem', mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: '#ef4444' }}>
                            <ProcedureIcon sx={{ fontSize: 20 }} />
                            PROCEDURES
                          </Typography>
                          <Table size="small" sx={{ border: '1px solid rgba(0,0,0,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                            <TableHead sx={{ bgcolor: '#fecaca' }}>
                              <TableRow>
                                <TableCell sx={{ fontWeight: 700 }}>Teeth</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Procedure</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Code</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Cost</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {entry.procedures.map((proc) => (
                                <TableRow
                                  key={proc.id}
                                  onClick={() => onProcedureClick?.(proc.id)}
                                  sx={{
                                    cursor: onProcedureClick ? 'pointer' : 'default',
                                    '&:hover': onProcedureClick ? {
                                      backgroundColor: 'rgba(239, 68, 68, 0.05)',
                                      transition: 'background-color 0.2s',
                                    } : {}
                                  }}
                                >
                                  <TableCell>#{proc.tooth_numbers}</TableCell>
                                  <TableCell sx={{ fontWeight: onProcedureClick ? 600 : 400 }}>
                                    {proc.procedure_name}
                                  </TableCell>
                                  <TableCell>{proc.procedure_code}</TableCell>
                                  <TableCell>
                                    <Chip
                                      label={proc.status.replace('_', ' ')}
                                      size="small"
                                      color={getStatusColor(proc.status) as any}
                                      sx={{ textTransform: 'capitalize' }}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    {proc.estimated_cost ? `$${proc.estimated_cost}` : '-'}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </Box>
                      )}
                    </Box>
                  </Collapse>
                )}
              </CardContent>
            </Card>
          </Fade>
        );
      })}
    </Stack>
  );
};

export default TreatmentTimelineGrouped;
