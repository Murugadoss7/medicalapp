/**
 * Treatment Timeline Component - Medical Futurism Design
 * Shows chronological treatment events grouped by appointment
 * Each card represents one appointment with all related observations and procedures
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
  Assignment as PrescriptionIcon,
  EventNote as AppointmentIcon,
  Visibility as ObservationIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { GroupedTimelineEntry } from '../../services/treatmentService';
import treatmentService from '../../services/treatmentService';

interface TreatmentTimelineProps {
  patientMobile: string;
  patientFirstName: string;
}

const TreatmentTimeline = ({ patientMobile, patientFirstName }: TreatmentTimelineProps) => {
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

  const getEventStyles = (type: string) => {
    switch (type) {
      case 'appointment':
        return {
          borderColor: '#667eea',
          iconBg: 'linear-gradient(135deg, #667eea 0%, #5568d3 100%)',
          chipBg: 'linear-gradient(135deg, #667eea 0%, #5568d3 100%)',
          glow: 'rgba(102, 126, 234, 0.2)',
        };
      case 'prescription':
        return {
          borderColor: '#10b981',
          iconBg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          chipBg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          glow: 'rgba(16, 185, 129, 0.2)',
        };
      case 'observation':
        return {
          borderColor: '#f59e0b',
          iconBg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          chipBg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          glow: 'rgba(245, 158, 11, 0.2)',
        };
      case 'procedure':
        return {
          borderColor: '#ef4444',
          iconBg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          chipBg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          glow: 'rgba(239, 68, 68, 0.2)',
        };
      default:
        return {
          borderColor: '#6b7280',
          iconBg: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
          chipBg: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
          glow: 'rgba(107, 114, 128, 0.2)',
        };
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
    <Stack spacing={1.5}>
      {timeline.map((event, index) => {
        const styles = getEventStyles(event.type);

        return (
          <Fade key={`${event.type}-${event.event.id}-${index}`} in timeout={800 + index * 100}>
            <Card
              sx={{
                position: 'relative',
                borderRadius: 2,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(102, 126, 234, 0.15)',
                borderLeft: `3px solid ${styles.borderColor}`,
                boxShadow: `0 1px 8px ${styles.glow}`,
                overflow: 'visible',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateX(3px)',
                  boxShadow: `0 4px 16px ${styles.glow}`,
                },
              }}
            >
              <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
                {/* Compact Row 1: Date, Time, Type Badge */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 0.75,
                    gap: 1,
                  }}
                >
                  {/* Date & Time - Inline */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'text.secondary',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                      }}
                    >
                      <CalendarIcon sx={{ fontSize: 14 }} />
                      {new Date(event.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Typography>
                    {event.time && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                        }}
                      >
                        <TimeIcon sx={{ fontSize: 14 }} />
                        {event.time}
                      </Typography>
                    )}
                  </Box>

                  {/* Type Badge - Compact */}
                  <Chip
                    label={event.type}
                    size="small"
                    icon={getEventIcon(event.type)}
                    sx={{
                      textTransform: 'capitalize',
                      fontWeight: 700,
                      fontSize: '0.6875rem',
                      height: 24,
                      background: styles.chipBg,
                      color: 'white',
                      border: 'none',
                      boxShadow: `0 2px 6px ${styles.glow}`,
                      '& .MuiChip-icon': {
                        color: 'white',
                        fontSize: 14,
                        ml: 0.5,
                      },
                    }}
                  />
                </Box>

                {/* Compact Row 2: Title & Doctor - Inline */}
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                      color: 'text.primary',
                      lineHeight: 1.3,
                    }}
                  >
                    {event.event.title}
                  </Typography>
                  {event.event.doctor && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'text.secondary',
                        fontWeight: 500,
                        fontSize: '0.75rem',
                      }}
                    >
                      • Dr. {event.event.doctor}
                    </Typography>
                  )}
                </Box>

                {/* Description - Truncated */}
                {event.event.description && (
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'text.secondary',
                      lineHeight: 1.4,
                      fontSize: '0.8125rem',
                      mb: 0.75,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {event.event.description}
                  </Typography>
                )}

                {/* Additional Details - Inline Chips */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                  {/* Status Badge */}
                  {event.event.status && (
                    <Chip
                      label={event.event.status.replace('_', ' ')}
                      size="small"
                      variant="outlined"
                      sx={{
                        textTransform: 'capitalize',
                        fontWeight: 600,
                        fontSize: '0.6875rem',
                        height: 22,
                        borderColor: styles.borderColor,
                        color: styles.borderColor,
                        background: `${styles.borderColor}08`,
                      }}
                    />
                  )}

                  {/* Tooth Numbers (for procedures) */}
                  {event.type === 'procedure' && event.event.tooth_numbers && (
                    <Chip
                      label={`#${event.event.tooth_numbers}`}
                      size="small"
                      variant="outlined"
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.6875rem',
                        height: 22,
                        borderColor: styles.borderColor,
                        color: styles.borderColor,
                        background: `${styles.borderColor}08`,
                      }}
                    />
                  )}

                  {/* Condition (for observations) */}
                  {event.type === 'observation' && event.event.condition && (
                    <Chip
                      label={`${event.event.condition}${event.event.severity ? ` (${event.event.severity})` : ''}`}
                      size="small"
                      variant="outlined"
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.6875rem',
                        height: 22,
                        borderColor: styles.borderColor,
                        color: styles.borderColor,
                        background: `${styles.borderColor}08`,
                      }}
                    />
                  )}
                </Box>
              </CardContent>
            </Card>
          </Fade>
        );
      })}
    </Stack>
  );
};

export default TreatmentTimeline;
