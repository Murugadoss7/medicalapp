/**
 * Treatment Timeline Component
 * Shows chronological treatment events
 * iPad-friendly with large touch targets
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
  Divider,
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  MedicalServices as ProcedureIcon,
  Assignment as PrescriptionIcon,
  EventNote as AppointmentIcon,
  Visibility as ObservationIcon,
} from '@mui/icons-material';
import { TimelineEvent } from '../../services/treatmentService';
import treatmentService from '../../services/treatmentService';

interface TreatmentTimelineProps {
  patientMobile: string;
  patientFirstName: string;
}

const TreatmentTimeline = ({ patientMobile, patientFirstName }: TreatmentTimelineProps) => {
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTimeline();
  }, [patientMobile, patientFirstName]);

  const loadTimeline = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await treatmentService.fetchPatientTimeline(
        patientMobile,
        patientFirstName
      );

      setTimeline(response.timeline || []);
    } catch (err: any) {
      console.error('Error loading timeline:', err);
      setError(err.response?.data?.detail || 'Failed to load timeline');
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return <AppointmentIcon />;
      case 'prescription':
        return <PrescriptionIcon />;
      case 'observation':
        return <ObservationIcon />;
      case 'procedure':
        return <ProcedureIcon />;
      default:
        return <CalendarIcon />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'appointment':
        return 'primary';
      case 'prescription':
        return 'success';
      case 'observation':
        return 'warning';
      case 'procedure':
        return 'error';
      default:
        return 'default';
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

  if (timeline.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          No treatment history available
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      {timeline.map((event, index) => (
        <Card
          key={`${event.type}-${event.event.id}-${index}`}
          sx={{
            position: 'relative',
            minHeight: 80, // iPad-friendly
            '&:hover': {
              boxShadow: 3,
            },
          }}
        >
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            {/* Date & Time Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {new Date(event.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Typography>
                {event.time && (
                  <>
                    <TimeIcon sx={{ fontSize: 16, color: 'text.secondary', ml: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      {event.time}
                    </Typography>
                  </>
                )}
              </Box>

              <Chip
                label={event.type}
                color={getEventColor(event.type) as any}
                size="small"
                icon={getEventIcon(event.type)}
                sx={{ textTransform: 'capitalize' }}
              />
            </Box>

            {/* Event Details */}
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              {event.event.title}
            </Typography>

            {event.event.doctor && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {event.event.doctor}
              </Typography>
            )}

            {event.event.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {event.event.description}
              </Typography>
            )}

            {/* Status Badge */}
            {event.event.status && (
              <Box sx={{ mt: 1 }}>
                <Chip
                  label={event.event.status.replace('_', ' ')}
                  size="small"
                  variant="outlined"
                  sx={{ textTransform: 'capitalize' }}
                />
              </Box>
            )}

            {/* Additional Details based on type */}
            {event.type === 'procedure' && event.event.tooth_numbers && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Tooth: #{event.event.tooth_numbers}
              </Typography>
            )}

            {event.type === 'observation' && event.event.condition && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Condition: {event.event.condition}
                  {event.event.severity && ` (${event.event.severity})`}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
};

export default TreatmentTimeline;
