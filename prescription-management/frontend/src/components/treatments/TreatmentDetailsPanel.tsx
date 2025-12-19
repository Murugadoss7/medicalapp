/**
 * Treatment Details Panel - Right Side (65%)
 * Tab navigation: Timeline | Procedures | Case Study
 * iPad-friendly tabs
 */

import { Box, Tabs, Tab, Typography, IconButton, Paper } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TimelineIcon from '@mui/icons-material/Timeline';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import DescriptionIcon from '@mui/icons-material/Description';
import { PatientSummary } from '../../services/treatmentService';
import TreatmentTimeline from './TreatmentTimeline';
import ProcedureSchedule from './ProcedureSchedule';

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
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          p: 4,
        }}
      >
        <Typography variant="h6" color="text.secondary" textAlign="center">
          Select a patient from the list to view treatment details
        </Typography>
      </Box>
    );
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: 'timeline' | 'procedures' | 'case-study') => {
    onTabChange(newValue);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header with patient info and tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        {/* Patient Header */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Back button (mobile only) */}
          {onBack && (
            <IconButton
              onClick={onBack}
              sx={{ display: { xs: 'flex', md: 'none' } }}
              size="large"
            >
              <ArrowBackIcon />
            </IconButton>
          )}

          <Box>
            <Typography variant="h6" fontWeight={600}>
              {patient.patient.first_name} {patient.patient.last_name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {patient.patient.mobile_number} • {patient.patient.age} years • {patient.patient.gender}
            </Typography>
          </Box>
        </Box>

        {/* Tabs - iPad-friendly with min height */}
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              minHeight: 60, // iPad-friendly touch target
              fontSize: '0.9rem',
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
            disabled // Phase 2 feature
          />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
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
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Case Study Feature
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Coming in Phase 2 - AI-powered case study generation
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default TreatmentDetailsPanel;
