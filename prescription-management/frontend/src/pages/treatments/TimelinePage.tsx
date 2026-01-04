/**
 * Timeline Page - Medical Futurism Design
 * Shows patient appointment timeline and history
 * Solid colors only (no gradients), iPad-optimized
 */

import { useState, useEffect } from 'react';
import { Box, CircularProgress, Alert, Paper, Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import PatientDetailHeader from '../../components/treatments/PatientDetailHeader';
import TreatmentTimeline from '../../components/treatments/TreatmentTimelineGrouped';
import PrescriptionViewer from '../../components/dental/PrescriptionViewer';
import treatmentService, { PatientSummary } from '../../services/treatmentService';

export const TimelinePage = () => {
  const { mobile, firstName } = useParams<{ mobile: string; firstName: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<PatientSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState<string | null>(null);

  // Handle prescription click - show prescription in dialog
  const handlePrescriptionClick = (prescriptionId: string) => {
    setSelectedPrescriptionId(prescriptionId);
  };

  // Close prescription dialog
  const handleClosePrescription = () => {
    setSelectedPrescriptionId(null);
  };

  // Handle procedure click - navigate to procedures tab
  const handleProcedureClick = (procedureId: string) => {
    if (mobile && firstName) {
      navigate(`/treatments/patients/${mobile}/${firstName}/procedures`);
    }
  };

  useEffect(() => {
    loadPatient();
  }, [mobile, firstName]);

  const loadPatient = async () => {
    if (!mobile || !firstName) {
      setError('Invalid patient parameters');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch patient list and find the matching patient
      const response = await treatmentService.fetchPatients({
        search: mobile,
        per_page: 100,
      });

      const matchingPatient = response.patients.find(
        (p) =>
          p.patient.mobile_number === mobile &&
          p.patient.first_name.toLowerCase() === firstName.toLowerCase()
      );

      if (matchingPatient) {
        setPatient(matchingPatient);
      } else {
        setError('Patient not found');
      }
    } catch (err: any) {
      console.error('Error loading patient:', err);
      setError(err.response?.data?.detail || 'Failed to load patient');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
        }}
      >
        <CircularProgress sx={{ color: '#667eea' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ py: 2 }}>
        <Alert
          severity="error"
          sx={{
            borderRadius: 2,
            boxShadow: '0 2px 12px rgba(239, 68, 68, 0.15)',
          }}
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100%',
        py: 2,
        // Purple scrollbar
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'rgba(102, 126, 234, 0.05)',
          borderRadius: 10,
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#667eea',
          borderRadius: 10,
          '&:hover': {
            background: '#5568d3',
          },
        },
      }}
    >
      {/* Patient Header with Tabs */}
      <PatientDetailHeader patient={patient} />

      {/* Timeline Content */}
      {patient && (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.5, sm: 2 },
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(102, 126, 234, 0.15)',
            boxShadow: '0 2px 12px rgba(102, 126, 234, 0.1)',
          }}
        >
          <TreatmentTimeline
            patientMobile={patient.patient.mobile_number}
            patientFirstName={patient.patient.first_name}
            onPrescriptionClick={handlePrescriptionClick}
            onProcedureClick={handleProcedureClick}
          />
        </Paper>
      )}

      {/* Prescription Viewer Dialog */}
      <Dialog
        open={!!selectedPrescriptionId}
        onClose={handleClosePrescription}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: '90vh',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(0,0,0,0.1)',
            pb: 2,
          }}
        >
          Prescription Details
          <IconButton onClick={handleClosePrescription} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {selectedPrescriptionId && (
            <PrescriptionViewer
              prescriptionId={selectedPrescriptionId}
              onAddMore={handleClosePrescription}
              onEdit={() => {}}
              hideNewPrescriptionButton={true}
              hidePrice={true}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default TimelinePage;
