/**
 * Patient Detail Header - Medical Futurism Design
 * Header component for patient detail pages with breadcrumb and tabs
 * Solid colors only (no gradients), iPad-optimized
 */

import { Box, Typography, Paper, Avatar, Breadcrumbs, Link, Tabs, Tab, Fade, Button } from '@mui/material';
import {
  Home as HomeIcon,
  Timeline as TimelineIcon,
  MedicalServices as ProceduresIcon,
  Description as CaseStudyIcon,
  ArrowBack as BackIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { PatientSummary } from '../../services/treatmentService';

interface PatientDetailHeaderProps {
  patient: PatientSummary | null;
}

export const PatientDetailHeader = ({ patient }: PatientDetailHeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  if (!patient) {
    return null;
  }

  // Determine active tab from URL
  const pathSegments = location.pathname.split('/');
  const currentView = pathSegments[pathSegments.length - 1] as 'timeline' | 'procedures' | 'case-study';

  // Generate initials
  const initials = `${patient.patient.first_name[0]}${patient.patient.last_name[0]}`.toUpperCase();

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: 'timeline' | 'procedures' | 'case-study') => {
    const url = `/treatments/patients/${patient.patient.mobile_number}/${patient.patient.first_name}/${newValue}`;
    navigate(url);
  };

  // Status color mapping (solid colors only)
  const statusColors = {
    active: '#10b981',    // Green
    completed: '#3b82f6',  // Blue
    planned: '#f59e0b',    // Orange
  };

  const statusColor = statusColors[patient.summary.treatment_status] || '#667eea';

  return (
    <Box sx={{ mb: 2 }}>
      {/* Breadcrumb Navigation */}
      <Fade in timeout={400}>
        <Box sx={{ mb: 1.5 }}>
          <Breadcrumbs
            separator="›"
            sx={{
              '& .MuiBreadcrumbs-separator': {
                color: '#667eea',
                fontWeight: 700,
              },
            }}
          >
            <Link
              component="button"
              onClick={() => navigate('/treatments/patients')}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                color: '#667eea',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: 600,
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              <HomeIcon sx={{ fontSize: 16 }} />
              Patients
            </Link>
            <Typography
              sx={{
                color: 'text.primary',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              {patient.patient.first_name} {patient.patient.last_name}
            </Typography>
          </Breadcrumbs>
        </Box>
      </Fade>

      {/* Patient Info Card */}
      <Fade in timeout={600}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.5, sm: 2 },
            mb: 2,
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(102, 126, 234, 0.15)',
            boxShadow: '0 2px 12px rgba(102, 126, 234, 0.1)',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
            {/* Patient Info */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
              {/* Avatar */}
              <Avatar
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: '#667eea',
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  boxShadow: '0 2px 8px rgba(102, 126, 234, 0.25)',
                }}
              >
                {initials}
              </Avatar>

              {/* Details */}
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: '1rem', sm: '1.125rem' },
                      color: '#667eea',
                    }}
                  >
                    {patient.patient.first_name} {patient.patient.last_name}
                  </Typography>
                  <Box
                    sx={{
                      px: 1,
                      py: 0.25,
                      borderRadius: 1,
                      bgcolor: statusColor,
                      color: 'white',
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      textTransform: 'capitalize',
                    }}
                  >
                    {patient.summary.treatment_status}
                  </Box>
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    color: 'text.secondary',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                  }}
                >
                  <PhoneIcon sx={{ fontSize: 14 }} />
                  {patient.patient.mobile_number} • {patient.patient.age}y • {patient.patient.gender}
                  {patient.summary.primary_doctor && (
                    <>
                      {' '}• Dr. {patient.summary.primary_doctor.name}
                    </>
                  )}
                </Typography>
              </Box>
            </Box>

            {/* Back to List Button */}
            <Button
              variant="outlined"
              startIcon={<BackIcon />}
              onClick={() => navigate('/treatments/patients')}
              sx={{
                minHeight: 44,
                px: 2,
                fontSize: '0.875rem',
                fontWeight: 600,
                borderColor: '#667eea',
                color: '#667eea',
                borderRadius: 2,
                textTransform: 'none',
                '&:hover': {
                  borderColor: '#5568d3',
                  background: 'rgba(102, 126, 234, 0.08)',
                },
              }}
            >
              Back to List
            </Button>
          </Box>
        </Paper>
      </Fade>

      {/* View Tabs */}
      <Fade in timeout={800}>
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(102, 126, 234, 0.15)',
            boxShadow: '0 2px 12px rgba(102, 126, 234, 0.1)',
          }}
        >
          <Tabs
            value={currentView}
            onChange={handleTabChange}
            variant="fullWidth"
            TabIndicatorProps={{
              sx: {
                height: 3,
                background: '#667eea',
                borderRadius: '3px 3px 0 0',
              },
            }}
            sx={{
              minHeight: 52,
              '& .MuiTab-root': {
                minHeight: 52,
                fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                fontWeight: 600,
                textTransform: 'none',
                color: 'text.secondary',
                px: { xs: 1, sm: 2 },
                py: 1,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  color: '#667eea',
                  background: 'rgba(102, 126, 234, 0.05)',
                },
                '&.Mui-selected': {
                  color: '#667eea',
                  fontWeight: 700,
                },
              },
            }}
          >
            <Tab
              label="Timeline"
              value="timeline"
              icon={<TimelineIcon sx={{ fontSize: 20 }} />}
              iconPosition="start"
            />
            <Tab
              label="Procedures"
              value="procedures"
              icon={<ProceduresIcon sx={{ fontSize: 20 }} />}
              iconPosition="start"
            />
            <Tab
              label="Case Study"
              value="case-study"
              icon={<CaseStudyIcon sx={{ fontSize: 20 }} />}
              iconPosition="start"
            />
          </Tabs>
        </Paper>
      </Fade>
    </Box>
  );
};

export default PatientDetailHeader;
