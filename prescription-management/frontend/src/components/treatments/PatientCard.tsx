/**
 * Patient Card Component - Medical Futurism Design
 * Enhanced with gradient borders, glassmorphism, and smooth animations
 * iPad-friendly: Large touch target, clear status badges
 */

import { Card, CardContent, Typography, Box, Chip, Stack } from '@mui/material';
import { PatientSummary } from '../../services/treatmentService';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

interface PatientCardProps {
  patient: PatientSummary;
  isSelected: boolean;
  onClick: () => void;
}

const PatientCard = ({ patient, isSelected, onClick }: PatientCardProps) => {
  const { patient: patientInfo, summary } = patient;

  // Status badge color and gradient
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'active':
        return {
          color: 'success' as const,
          gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          glow: 'rgba(16, 185, 129, 0.2)',
        };
      case 'completed':
        return {
          color: 'info' as const,
          gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          glow: 'rgba(59, 130, 246, 0.2)',
        };
      case 'planned':
        return {
          color: 'warning' as const,
          gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          glow: 'rgba(245, 158, 11, 0.2)',
        };
      default:
        return {
          color: 'default' as const,
          gradient: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
          glow: 'rgba(107, 114, 128, 0.2)',
        };
    }
  };

  const statusStyles = getStatusStyles(summary.treatment_status);

  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        position: 'relative',
        borderRadius: 3,
        background: isSelected
          ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.95) 100%)'
          : 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        border: '1px solid',
        borderColor: isSelected ? 'transparent' : 'rgba(102, 126, 234, 0.1)',
        boxShadow: isSelected
          ? '0 8px 32px rgba(102, 126, 234, 0.25), 0 0 0 2px rgba(102, 126, 234, 0.3)'
          : '0 2px 8px rgba(0, 0, 0, 0.04)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        minHeight: 120,
        overflow: 'visible',
        '&::before': isSelected
          ? {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 50%, #667eea 100%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 3s linear infinite',
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
            }
          : {},
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 40px rgba(102, 126, 234, 0.2)',
          borderColor: 'rgba(102, 126, 234, 0.3)',
          background: 'rgba(255, 255, 255, 1)',
        },
        '&:active': {
          transform: 'translateY(-2px)',
        },
        '@keyframes shimmer': {
          '0%': {
            backgroundPosition: '200% 0',
          },
          '100%': {
            backgroundPosition: '-200% 0',
          },
        },
      }}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        {/* Patient Name & Status */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'start',
            mb: 1.5,
          }}
        >
          <Box sx={{ flex: 1, pr: 1 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontSize: '1.0625rem',
                mb: 0.5,
                background: isSelected
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : 'inherit',
                backgroundClip: isSelected ? 'text' : 'unset',
                WebkitBackgroundClip: isSelected ? 'text' : 'unset',
                WebkitTextFillColor: isSelected ? 'transparent' : 'inherit',
              }}
            >
              {patientInfo.first_name} {patientInfo.last_name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <PhoneIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  fontWeight: 500,
                  fontSize: '0.8125rem',
                }}
              >
                {patientInfo.mobile_number}
              </Typography>
            </Box>
          </Box>
          <Chip
            label={summary.treatment_status}
            size="small"
            sx={{
              textTransform: 'capitalize',
              fontWeight: 600,
              fontSize: '0.75rem',
              height: 28,
              background: statusStyles.gradient,
              color: 'white',
              border: 'none',
              boxShadow: `0 4px 12px ${statusStyles.glow}`,
            }}
          />
        </Box>

        {/* Patient Details */}
        <Stack spacing={0.75}>
          {/* Last Consultation */}
          {summary.last_consultation_date && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <CalendarTodayIcon sx={{ fontSize: 14, color: '#667eea' }} />
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  fontWeight: 500,
                  fontSize: '0.8125rem',
                }}
              >
                Last visit:{' '}
                <Typography
                  component="span"
                  variant="caption"
                  sx={{ fontWeight: 600, color: 'text.primary' }}
                >
                  {new Date(summary.last_consultation_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Typography>
              </Typography>
            </Box>
          )}

          {/* Primary Doctor */}
          {summary.primary_doctor && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <PersonIcon sx={{ fontSize: 14, color: '#764ba2' }} />
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  fontWeight: 500,
                  fontSize: '0.8125rem',
                }}
              >
                Dr.{' '}
                <Typography
                  component="span"
                  variant="caption"
                  sx={{ fontWeight: 600, color: 'text.primary' }}
                >
                  {summary.primary_doctor.name}
                </Typography>
              </Typography>
            </Box>
          )}

          {/* Treatment Summary */}
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              mt: 1,
              pt: 1.5,
              borderTop: '1px solid',
              borderColor: 'rgba(102, 126, 234, 0.1)',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 0.25,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.6875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Appointments
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  color: '#667eea',
                  fontSize: '0.875rem',
                }}
              >
                {summary.completed_appointments}/{summary.total_appointments}
              </Typography>
            </Box>
            {summary.total_procedures > 0 && (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.25,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontSize: '0.6875rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Pending
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    color: '#f59e0b',
                    fontSize: '0.875rem',
                  }}
                >
                  {summary.pending_procedures}
                </Typography>
              </Box>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default PatientCard;
