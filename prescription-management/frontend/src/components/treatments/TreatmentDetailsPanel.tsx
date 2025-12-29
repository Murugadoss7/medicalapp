/**
 * Treatment Details Panel - Medical Futurism Design
 * Tab navigation: Timeline | Procedures | Case Study
 * iPad-friendly tabs with smooth animations
 */

import { Box, Tabs, Tab, Typography, IconButton, Paper, Fade, Avatar } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TimelineIcon from '@mui/icons-material/Timeline';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import DescriptionIcon from '@mui/icons-material/Description';
import { PatientSummary } from '../../services/treatmentService';
import TreatmentTimeline from './TreatmentTimeline';
import ProcedureSchedule from './ProcedureSchedule';
import CaseStudyView from './CaseStudyView';

interface TreatmentDetailsPanelProps {
  patient: PatientSummary | null;
  activeTab: 'timeline' | 'procedures' | 'case-study';
  onTabChange: (tab: 'timeline' | 'procedures' | 'case-study') => void;
  onBack?: () => void; // For mobile back button
}

const TreatmentDetailsPanel = ({
  patient,
  activeTab,
  onTabChange,
  onBack,
}: TreatmentDetailsPanelProps) => {
  if (!patient) {
    return (
      <Paper
        elevation={0}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 4,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(102, 126, 234, 0.15)',
          boxShadow: '0 8px 32px rgba(102, 126, 234, 0.1)',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            p: 4,
          }}
        >
          <Box
            sx={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3,
              animation: 'pulse 2s ease-in-out infinite',
              '@keyframes pulse': {
                '0%, 100%': {
                  transform: 'scale(1)',
                  opacity: 0.8,
                },
                '50%': {
                  transform: 'scale(1.05)',
                  opacity: 1,
                },
              },
            }}
          >
            <MedicalServicesIcon sx={{ fontSize: 48, color: '#667eea' }} />
          </Box>
          <Typography
            variant="h6"
            sx={{
              color: 'text.secondary',
              textAlign: 'center',
              fontWeight: 600,
              mb: 1,
            }}
          >
            Select a Patient
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Choose a patient from the list to view their treatment details
          </Typography>
        </Box>
      </Paper>
    );
  }

  const handleTabChange = (
    event: React.SyntheticEvent,
    newValue: 'timeline' | 'procedures' | 'case-study'
  ) => {
    onTabChange(newValue);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 4,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(102, 126, 234, 0.15)',
        boxShadow: '0 8px 32px rgba(102, 126, 234, 0.1)',
        overflow: 'hidden',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
        },
      }}
    >
      {/* Patient Header - Compact */}
      <Fade in timeout={600}>
        <Box
          sx={{
            p: { xs: 1.5, sm: 2 },
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 1, sm: 1.5 },
            borderBottom: '1px solid rgba(102, 126, 234, 0.15)',
            background: 'linear-gradient(90deg, rgba(102, 126, 234, 0.03) 0%, transparent 100%)',
          }}
        >
          {/* Back button (mobile only) */}
          {onBack && (
            <IconButton
              onClick={onBack}
              size="small"
              sx={{
                display: { xs: 'flex', md: 'none' },
                background: 'rgba(102, 126, 234, 0.1)',
                '&:hover': {
                  background: 'rgba(102, 126, 234, 0.2)',
                },
              }}
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>
          )}

          {/* Patient Avatar - Compact */}
          <Avatar
            sx={{
              width: { xs: 36, sm: 40 },
              height: { xs: 36, sm: 40 },
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              fontSize: '1rem',
              fontWeight: 700,
              boxShadow: '0 2px 8px rgba(102, 126, 234, 0.25)',
            }}
          >
            {patient.patient.first_name[0]}{patient.patient.last_name[0]}
          </Avatar>

          {/* Patient Info - Inline */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                fontSize: { xs: '0.9375rem', sm: '1rem' },
                color: '#667eea',
                lineHeight: 1.3,
              }}
            >
              {patient.patient.first_name} {patient.patient.last_name}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                fontWeight: 500,
                fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                display: 'block',
                lineHeight: 1.2,
              }}
            >
              {patient.patient.mobile_number} • {patient.patient.age}y • {patient.patient.gender}
            </Typography>
          </Box>
        </Box>
      </Fade>

      {/* Tabs - iPad-friendly with enhanced design */}
      <Fade in timeout={800}>
        <Box sx={{ borderBottom: '1px solid rgba(102, 126, 234, 0.1)' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            TabIndicatorProps={{
              sx: {
                height: 3,
                background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '3px 3px 0 0',
              },
            }}
            sx={{
              minHeight: 48,
              '& .MuiTab-root': {
                minHeight: 48,
                fontSize: { xs: '0.8125rem', sm: '0.875rem' },
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
              icon={<TimelineIcon />}
              iconPosition="start"
            />
            <Tab
              label="Procedures"
              value="procedures"
              icon={<MedicalServicesIcon />}
              iconPosition="start"
            />
            <Tab
              label="Case Study"
              value="case-study"
              icon={<DescriptionIcon />}
              iconPosition="start"
            />
          </Tabs>
        </Box>
      </Fade>

      {/* Tab Content with fade transition - SCROLLABLE */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          p: { xs: 1.5, sm: 2 },
          minHeight: 0, // Critical for flex child scrolling
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(102, 126, 234, 0.05)',
            borderRadius: 10,
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
            borderRadius: 10,
            '&:hover': {
              background: 'linear-gradient(180deg, #5568d3 0%, #66348a 100%)',
            },
          },
        }}
      >
        <Fade in key={activeTab} timeout={400}>
          <Box sx={{ minHeight: '100%' }}>
            {activeTab === 'timeline' && (
              <TreatmentTimeline
                patientMobile={patient.patient.mobile_number}
                patientFirstName={patient.patient.first_name}
              />
            )}

            {activeTab === 'procedures' && (
              <ProcedureSchedule
                patientMobile={patient.patient.mobile_number}
                patientFirstName={patient.patient.first_name}
              />
            )}

            {activeTab === 'case-study' && (
              <CaseStudyView
                patientMobile={patient.patient.mobile_number}
                patientFirstName={patient.patient.first_name}
              />
            )}
          </Box>
        </Fade>
      </Box>
    </Paper>
  );
};

export default TreatmentDetailsPanel;
