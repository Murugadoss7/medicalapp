/**
 * Tooth History Viewer Component
 * Displays complete history of observations and procedures for a specific tooth
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
} from '@mui/icons-material';
import { format } from 'date-fns';
import dentalService, { type DentalObservation, type DentalProcedure } from '../../services/dentalService';

interface ToothHistoryViewerProps {
  patientMobileNumber: string;
  patientFirstName: string;
  toothNumber: string;
}

const ToothHistoryViewer: React.FC<ToothHistoryViewerProps> = ({
  patientMobileNumber,
  patientFirstName,
  toothNumber,
}) => {
  const [observations, setObservations] = useState<DentalObservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadToothHistory();
  }, [patientMobileNumber, patientFirstName, toothNumber]);

  const loadToothHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await dentalService.observations.getToothHistory(
        patientMobileNumber,
        patientFirstName,
        toothNumber
      );

      setObservations(result.observations);
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

  const getStatusIcon = (observation: DentalObservation) => {
    if (observation.treatment_done) {
      return <CompletedIcon color="success" />;
    }
    if (observation.treatment_required) {
      return <ErrorIcon color="error" />;
    }
    return <WarningIcon color="warning" />;
  };

  if (loading) {
    return (
      <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Loading tooth history...
        </Typography>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper elevation={2} sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Paper>
    );
  }

  if (observations.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 3 }}>
        <Alert severity="info">
          No observations found for tooth #{toothNumber}
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Tooth #{toothNumber} - Complete History
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {observations.length} observation{observations.length !== 1 ? 's' : ''} recorded
        </Typography>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Timeline */}
      <Timeline position="right">
        {observations.map((observation, index) => (
          <TimelineItem key={observation.id}>
            <TimelineOppositeContent color="text.secondary" sx={{ flex: 0.3 }}>
              <Typography variant="caption" display="block">
                {format(new Date(observation.created_at), 'MMM dd, yyyy')}
              </Typography>
              <Typography variant="caption" display="block">
                {format(new Date(observation.created_at), 'hh:mm a')}
              </Typography>
            </TimelineOppositeContent>

            <TimelineSeparator>
              <TimelineDot color={observation.treatment_done ? 'success' : 'primary'}>
                {getStatusIcon(observation)}
              </TimelineDot>
              {index < observations.length - 1 && <TimelineConnector />}
            </TimelineSeparator>

            <TimelineContent sx={{ pb: 4 }}>
              <Paper elevation={1} sx={{ p: 2 }}>
                {/* Condition */}
                <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                  <Chip
                    label={observation.condition_type}
                    color="primary"
                    size="small"
                  />
                  {observation.severity && (
                    <Chip
                      label={observation.severity}
                      color={getSeverityColor(observation.severity) as any}
                      size="small"
                    />
                  )}
                  {observation.tooth_surface && (
                    <Chip
                      label={observation.tooth_surface}
                      variant="outlined"
                      size="small"
                    />
                  )}
                </Box>

                {/* Notes */}
                {observation.observation_notes && (
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {observation.observation_notes}
                  </Typography>
                )}

                {/* Treatment Status */}
                <Box sx={{ mt: 2 }}>
                  {observation.treatment_done ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CompletedIcon color="success" fontSize="small" />
                      <Typography variant="caption" color="success.main">
                        Treatment Completed
                        {observation.treatment_date &&
                          ` on ${format(new Date(observation.treatment_date), 'MMM dd, yyyy')}`}
                      </Typography>
                    </Box>
                  ) : observation.treatment_required ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ErrorIcon color="error" fontSize="small" />
                      <Typography variant="caption" color="error.main">
                        Treatment Required
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <WarningIcon color="warning" fontSize="small" />
                      <Typography variant="caption" color="warning.main">
                        Observation Only
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
    </Paper>
  );
};

export default ToothHistoryViewer;
