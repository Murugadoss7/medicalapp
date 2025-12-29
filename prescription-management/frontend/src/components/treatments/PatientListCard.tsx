/**
 * Patient List Card - Medical Futurism Design
 * Card component for patient listing page with quick action buttons
 * Solid colors only (no gradients), iPad-optimized
 */

import { Box, Typography, Chip, Button, Avatar, Card } from '@mui/material';
import {
  Timeline as TimelineIcon,
  MedicalServices as ProceduresIcon,
  Description as CaseStudyIcon,
  Phone as PhoneIcon,
  Person as PersonIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { PatientSummary } from '../../services/treatmentService';

interface PatientListCardProps {
  patient: PatientSummary;
}

export const PatientListCard = ({ patient }: PatientListCardProps) => {
  const navigate = useNavigate();

  // Generate initials
  const initials = `${patient.patient.first_name[0]}${patient.patient.last_name[0]}`.toUpperCase();

  // Status color mapping (solid colors only)
  const statusColors = {
    active: '#10b981',    // Green
    completed: '#3b82f6',  // Blue
    planned: '#f59e0b',    // Orange
  };

  const statusColor = statusColors[patient.summary.treatment_status] || '#667eea';

  // Navigate to specific view
  const handleNavigate = (view: 'timeline' | 'procedures' | 'case-study') => {
    const url = `/treatments/patients/${patient.patient.mobile_number}/${patient.patient.first_name}/${view}`;
    navigate(url);
  };

  return (
    <Card
      sx={{
        borderRadius: 2,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(102, 126, 234, 0.15)',
        boxShadow: '0 2px 12px rgba(102, 126, 234, 0.1)',
        transition: 'all 0.3s cubic-bezier(0, 0, 0.2, 1)',
        '&:hover': {
          boxShadow: '0 4px 16px rgba(102, 126, 234, 0.2)',
          transform: 'translateY(-2px)',
          borderColor: 'rgba(102, 126, 234, 0.3)',
        },
      }}
    >
      <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
        {/* Main Content - Horizontal Layout */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 2,
            flexWrap: { xs: 'wrap', lg: 'nowrap' },
            mb: 1.5,
          }}
        >
          {/* Left Side: Avatar + Patient Info */}
          <Box sx={{ display: 'flex', gap: 1.5, flex: 1, minWidth: 0 }}>
            {/* Avatar */}
            <Avatar
              sx={{
                width: 48,
                height: 48,
                bgcolor: '#667eea',
                fontSize: '1.125rem',
                fontWeight: 700,
                boxShadow: '0 2px 8px rgba(102, 126, 234, 0.25)',
                flexShrink: 0,
              }}
            >
              {initials}
            </Avatar>

            {/* Patient Info */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {/* Name + Status */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: '0.9375rem', sm: '1rem' },
                    color: 'text.primary',
                  }}
                >
                  {patient.patient.first_name} {patient.patient.last_name}
                </Typography>
                <Chip
                  label={patient.summary.treatment_status}
                  size="small"
                  sx={{
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    height: 24,
                    textTransform: 'capitalize',
                    bgcolor: statusColor,
                    color: 'white',
                    border: 'none',
                  }}
                />
              </Box>

              {/* Contact + Age + Gender */}
              <Typography
                variant="caption"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  color: 'text.secondary',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  mb: 0.5,
                }}
              >
                <PhoneIcon sx={{ fontSize: 14 }} />
                {patient.patient.mobile_number} • {patient.patient.age}y • {patient.patient.gender}
              </Typography>

              {/* Doctor + Last Visit */}
              {patient.summary.primary_doctor && (
                <Typography
                  variant="caption"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    color: 'text.secondary',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                  }}
                >
                  <PersonIcon sx={{ fontSize: 14 }} />
                  Dr. {patient.summary.primary_doctor.name}
                  {patient.summary.last_consultation_date && (
                    <>
                      {' '}• <CalendarIcon sx={{ fontSize: 14, ml: 0.5 }} />
                      {new Date(patient.summary.last_consultation_date).toLocaleDateString()}
                    </>
                  )}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Right Side: Statistics */}
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            {/* Appointments */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  color: 'text.secondary',
                  fontSize: '0.6875rem',
                  mb: 0.25,
                }}
              >
                Appointments
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  fontSize: '1.125rem',
                  color: '#667eea',
                }}
              >
                {patient.summary.completed_appointments}/{patient.summary.total_appointments}
              </Typography>
            </Box>

            {/* Pending Procedures */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  color: 'text.secondary',
                  fontSize: '0.6875rem',
                  mb: 0.25,
                }}
              >
                Pending
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  fontSize: '1.125rem',
                  color: patient.summary.pending_procedures > 0 ? '#f59e0b' : '#10b981',
                }}
              >
                {patient.summary.pending_procedures}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Quick Action Buttons */}
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          <Button
            variant="outlined"
            size="small"
            startIcon={<TimelineIcon sx={{ fontSize: 16 }} />}
            onClick={() => handleNavigate('timeline')}
            sx={{
              minHeight: 40,
              px: 2,
              fontSize: '0.8125rem',
              fontWeight: 600,
              borderColor: '#667eea',
              color: '#667eea',
              borderRadius: 1.5,
              textTransform: 'none',
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: '#5568d3',
                background: 'rgba(102, 126, 234, 0.08)',
              },
            }}
          >
            Timeline
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<ProceduresIcon sx={{ fontSize: 16 }} />}
            onClick={() => handleNavigate('procedures')}
            sx={{
              minHeight: 40,
              px: 2,
              fontSize: '0.8125rem',
              fontWeight: 600,
              borderColor: '#667eea',
              color: '#667eea',
              borderRadius: 1.5,
              textTransform: 'none',
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: '#5568d3',
                background: 'rgba(102, 126, 234, 0.08)',
              },
            }}
          >
            Procedures
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<CaseStudyIcon sx={{ fontSize: 16 }} />}
            onClick={() => handleNavigate('case-study')}
            sx={{
              minHeight: 40,
              px: 2,
              fontSize: '0.8125rem',
              fontWeight: 600,
              borderColor: '#667eea',
              color: '#667eea',
              borderRadius: 1.5,
              textTransform: 'none',
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: '#5568d3',
                background: 'rgba(102, 126, 234, 0.08)',
              },
            }}
          >
            Case Study
          </Button>
        </Box>
      </Box>
    </Card>
  );
};

export default PatientListCard;
