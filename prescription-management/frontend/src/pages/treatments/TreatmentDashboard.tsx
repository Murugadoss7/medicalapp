/**
 * Treatment Dashboard - Main Container
 * Split panel layout: Patient List (35%) | Treatment Details (65%)
 * iPad-friendly design with button filters (no dropdowns)
 */

import { useState } from 'react';
import { Box, Container, Paper, Typography } from '@mui/material';
import PatientListPanel from '../../components/treatments/PatientListPanel';
import TreatmentDetailsPanel from '../../components/treatments/TreatmentDetailsPanel';
import { PatientSummary } from '../../services/treatmentService';

export const TreatmentDashboard = () => {
  const [selectedPatient, setSelectedPatient] = useState<PatientSummary | null>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'procedures' | 'case-study'>('timeline');

  const handlePatientSelect = (patient: PatientSummary) => {
    setSelectedPatient(patient);
    setActiveTab('timeline'); // Reset to timeline tab when selecting new patient
  };

  return (
    <Container maxWidth={false} sx={{ py: 3, height: 'calc(100vh - 100px)' }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        Treatment Dashboard
      </Typography>

      <Box
        sx={{
          display: 'flex',
          gap: 2,
          height: 'calc(100% - 60px)',
          flexDirection: {
            xs: 'column', // Stack vertically on mobile
            md: 'row',    // Side-by-side on tablet/desktop
          },
        }}
      >
        {/* Left Panel - Patient List (35%) */}
        <Paper
          elevation={2}
          sx={{
            width: {
              xs: '100%',
              md: '35%',
            },
            height: {
              xs: selectedPatient ? '0px' : '100%', // Hide on mobile when patient selected
              md: '100%',
            },
            overflow: 'hidden',
            display: {
              xs: selectedPatient ? 'none' : 'flex',
              md: 'flex',
            },
            flexDirection: 'column',
          }}
        >
          <PatientListPanel
            onPatientSelect={handlePatientSelect}
            selectedPatient={selectedPatient}
          />
        </Paper>

        {/* Right Panel - Treatment Details (65%) */}
        <Paper
          elevation={2}
          sx={{
            width: {
              xs: '100%',
              md: '65%',
            },
            height: '100%',
            overflow: 'hidden',
            display: {
              xs: selectedPatient ? 'flex' : 'none', // Show on mobile only when patient selected
              md: 'flex',
            },
            flexDirection: 'column',
          }}
        >
          <TreatmentDetailsPanel
            patient={selectedPatient}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onBack={() => setSelectedPatient(null)} // For mobile back button
          />
        </Paper>
      </Box>
    </Container>
  );
};

export default TreatmentDashboard;
