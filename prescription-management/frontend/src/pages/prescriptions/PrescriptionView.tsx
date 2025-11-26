import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  CircularProgress,
  Box,
  Alert,
  Button,
  Tabs,
  Tab,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useGetAppointmentPrescriptionsQuery, useGetAppointmentDetailsQuery } from '../../store/api';
import PrescriptionViewer from '../../components/dental/PrescriptionViewer';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';

/**
 * PrescriptionView Page
 *
 * Handles the logic for viewing prescriptions for an appointment:
 * - If prescriptions exist, displays them with a selector for multiple prescriptions
 * - If no prescriptions exist, redirects to consultation page
 * - Shows loading and error states appropriately
 */
const PrescriptionView: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const [selectedPrescriptionIndex, setSelectedPrescriptionIndex] = useState(0);

  // Get current user to check if dental doctor
  const { user } = useSelector((state: RootState) => state.auth);
  const isDentalDoctor = user?.specialization?.toLowerCase().includes('dental') ||
                         user?.specialization?.toLowerCase().includes('dentist');

  // Fetch prescriptions for this appointment
  const {
    data: prescriptions,
    isLoading: loadingPrescriptions,
    error: prescriptionsError,
    refetch: refetchPrescriptions,
  } = useGetAppointmentPrescriptionsQuery(appointmentId!, {
    skip: !appointmentId,
  });

  // Fetch appointment details
  const {
    data: appointment,
    isLoading: loadingAppointment,
  } = useGetAppointmentDetailsQuery(appointmentId!, {
    skip: !appointmentId,
  });

  // Redirect to consultation if no prescriptions exist
  useEffect(() => {
    if (!loadingPrescriptions && prescriptions && prescriptions.length === 0) {
      // No prescriptions found, redirect to appropriate consultation page
      const consultationPath = isDentalDoctor
        ? `/appointments/${appointmentId}/dental`
        : `/appointments/${appointmentId}/consultation`;
      navigate(consultationPath, { replace: true });
    }
  }, [prescriptions, loadingPrescriptions, appointmentId, navigate, isDentalDoctor]);

  const handleBack = () => {
    navigate('/dashboard');
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSelectedPrescriptionIndex(newValue);
  };

  if (!appointmentId) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">Invalid appointment ID</Alert>
      </Container>
    );
  }

  if (loadingPrescriptions || loadingAppointment) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (prescriptionsError) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          Failed to load prescriptions. Please try again.
        </Alert>
        <Button onClick={handleBack} sx={{ mt: 2 }}>
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  // If we reach here without prescriptions, the useEffect will redirect
  if (!prescriptions || prescriptions.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  const selectedPrescription = prescriptions[selectedPrescriptionIndex];

  return (
    <>
      <style>{`
        @media print {
          /* Hide navigation and tabs when printing */
          .prescription-no-print {
            display: none !important;
          }

          /* Remove container padding for print */
          .MuiContainer-root {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }

          /* Remove paper elevation and padding for print */
          .MuiPaper-root {
            box-shadow: none !important;
            padding: 0 !important;
          }
        }
      `}</style>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3 }}>
          {/* Header */}
          <Box display="flex" alignItems="center" gap={2} mb={3} className="prescription-no-print">
            <Button
              startIcon={<ArrowBack />}
              onClick={handleBack}
              variant="outlined"
            >
              Back
            </Button>
            <Typography variant="h5">
              Prescription Details
            </Typography>
          </Box>

          {/* Appointment Info */}
          {appointment && (
            <Alert severity="info" sx={{ mb: 3 }} className="prescription-no-print">
              <Typography variant="body2">
                <strong>Appointment:</strong> {appointment.appointment_number} |{' '}
                <strong>Patient:</strong> {appointment.patient_first_name} {appointment.patient_last_name} |{' '}
                <strong>Date:</strong> {new Date(appointment.appointment_date).toLocaleDateString()} {appointment.appointment_time}
              </Typography>
            </Alert>
          )}

          {/* Multiple Prescription Selector */}
          {prescriptions.length > 1 && (
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }} className="prescription-no-print">
              <Tabs
                value={selectedPrescriptionIndex}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
              >
                {prescriptions.map((prescription, index) => (
                  <Tab
                    key={prescription.id}
                    label={
                      <Box>
                        <Typography variant="body2">
                          {prescription.prescription_number}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(prescription.created_at).toLocaleDateString()}
                        </Typography>
                      </Box>
                    }
                    id={`prescription-tab-${index}`}
                    aria-controls={`prescription-tabpanel-${index}`}
                  />
                ))}
              </Tabs>
            </Box>
          )}

          {/* Prescription Viewer */}
          {selectedPrescription && (
            <PrescriptionViewer
              prescriptionId={selectedPrescription.id}
              refetch={refetchPrescriptions}
            />
          )}
        </Paper>
      </Container>
    </>
  );
};

export default PrescriptionView;
