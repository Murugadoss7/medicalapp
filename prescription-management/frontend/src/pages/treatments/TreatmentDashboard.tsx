/**
 * Treatment Dashboard - Main Container
 * Medical Futurism Design - Bold & Vibrant
 * Split panel layout: Patient List (35%) | Treatment Details (65%)
 * iPad-friendly with enhanced animations
 */

import { useState } from 'react';
import { Box, Container, Typography, Fade } from '@mui/material';
import { Healing, Vaccines, MonitorHeart } from '@mui/icons-material';
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

  // Floating medical icons for background
  const floatingIcons = [
    { Icon: Healing, top: '10%', left: '5%', delay: 0, duration: 15 },
    { Icon: Vaccines, top: '60%', left: '8%', delay: 3, duration: 18 },
    { Icon: MonitorHeart, top: '35%', right: '5%', delay: 1.5, duration: 16 },
  ];

  return (
    <Box
      sx={{
        minHeight: '100%',
        position: 'relative',
        background: '#f5f7fa',
      }}
    >
      {/* Background animated gradient orbs */}
      <Box
        sx={{
          position: 'fixed',
          width: '800px',
          height: '800px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(102, 126, 234, 0.08) 0%, transparent 70%)',
          top: '-300px',
          right: '-200px',
          animation: 'float 25s ease-in-out infinite',
          zIndex: 0,
          '@keyframes float': {
            '0%, 100%': {
              transform: 'translate(0, 0) scale(1)',
            },
            '50%': {
              transform: 'translate(-50px, 50px) scale(1.1)',
            },
          },
        }}
      />
      <Box
        sx={{
          position: 'fixed',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(118, 75, 162, 0.08) 0%, transparent 70%)',
          bottom: '-200px',
          left: '-150px',
          animation: 'floatReverse 20s ease-in-out infinite',
          zIndex: 0,
          '@keyframes floatReverse': {
            '0%, 100%': {
              transform: 'translate(0, 0) scale(1)',
            },
            '50%': {
              transform: 'translate(50px, -50px) scale(1.1)',
            },
          },
        }}
      />

      {/* Floating medical icons */}
      {floatingIcons.map(({ Icon, top, left, delay, duration, ...pos }, index) => (
        <Box
          key={index}
          sx={{
            position: 'fixed',
            top,
            left,
            ...pos,
            opacity: 0.04,
            zIndex: 0,
            animation: `floatIcon${index} ${duration}s ease-in-out infinite`,
            animationDelay: `${delay}s`,
            [`@keyframes floatIcon${index}`]: {
              '0%, 100%': {
                transform: 'translate(0, 0) rotate(0deg)',
              },
              '25%': {
                transform: `translate(${15 + index * 5}px, ${-20 - index * 3}px) rotate(90deg)`,
              },
              '50%': {
                transform: `translate(${-10 - index * 3}px, ${-30 - index * 5}px) rotate(180deg)`,
              },
              '75%': {
                transform: `translate(${-20 - index * 5}px, ${15 + index * 3}px) rotate(270deg)`,
              },
            },
          }}
        >
          <Icon sx={{ fontSize: 80, color: '#667eea' }} />
        </Box>
      ))}

      <Container maxWidth={false} sx={{ py: 2, position: 'relative', zIndex: 1 }}>
        {/* Header - Compact */}
        <Fade in timeout={600}>
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  bgcolor: '#667eea',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                }}
              >
                <Healing sx={{ fontSize: 24, color: 'white' }} />
              </Box>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: '1.25rem', sm: '1.5rem' },
                  color: '#667eea',
                  letterSpacing: '-0.01em',
                }}
              >
                Treatment Management
              </Typography>
            </Box>
          </Box>
        </Fade>

        {/* Split Panel Layout */}
        <Fade in timeout={800}>
          <Box
            sx={{
              display: 'flex',
              gap: 3,
              height: 'calc(100vh - 200px)', // Fixed height for scrolling
              minHeight: 600, // Minimum height for smaller screens
              flexDirection: {
                xs: 'column', // Stack vertically on mobile
                md: 'row', // Side-by-side on tablet/desktop
              },
            }}
          >
            {/* Left Panel - Patient List (35%) */}
            <Box
              sx={{
                width: {
                  xs: '100%',
                  md: '35%',
                },
                display: {
                  xs: selectedPatient ? 'none' : 'block',
                  md: 'block',
                },
                animation: 'slideInLeft 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                '@keyframes slideInLeft': {
                  '0%': {
                    opacity: 0,
                    transform: 'translateX(-30px)',
                  },
                  '100%': {
                    opacity: 1,
                    transform: 'translateX(0)',
                  },
                },
              }}
            >
              <PatientListPanel
                onPatientSelect={handlePatientSelect}
                selectedPatient={selectedPatient}
              />
            </Box>

            {/* Right Panel - Treatment Details (65%) */}
            <Box
              sx={{
                width: {
                  xs: '100%',
                  md: '65%',
                },
                display: {
                  xs: selectedPatient ? 'block' : 'none',
                  md: 'block',
                },
                animation: 'slideInRight 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                '@keyframes slideInRight': {
                  '0%': {
                    opacity: 0,
                    transform: 'translateX(30px)',
                  },
                  '100%': {
                    opacity: 1,
                    transform: 'translateX(0)',
                  },
                },
              }}
            >
              <TreatmentDetailsPanel
                patient={selectedPatient}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onBack={() => setSelectedPatient(null)} // For mobile back button
              />
            </Box>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
};

export default TreatmentDashboard;
