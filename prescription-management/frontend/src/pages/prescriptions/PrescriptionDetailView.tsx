import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  CircularProgress,
  Box,
  Alert,
  Button,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useGetPrescriptionQuery } from '../../store/api';
import PrescriptionViewer from '../../components/dental/PrescriptionViewer';

/**
 * PrescriptionDetailView Page
 *
 * Displays a single prescription by its ID
 * Used when navigating from the dashboard's recent prescriptions list
 */
const PrescriptionDetailView: React.FC = () => {
  const { prescriptionId } = useParams<{ prescriptionId: string }>();
  const navigate = useNavigate();

  const {
    data: prescription,
    isLoading,
    error,
    refetch,
  } = useGetPrescriptionQuery(prescriptionId!, {
    skip: !prescriptionId,
  });

  const handleBack = () => {
    navigate(-1);
  };

  if (!prescriptionId) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">Invalid prescription ID</Alert>
        <Button onClick={() => navigate('/doctor/dashboard')} sx={{ mt: 2 }}>
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    const errorData = error as any;
    const is403 = errorData?.status === 403 || errorData?.originalStatus === 403;

    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          {is403
            ? "Access denied. You don't have permission to view this prescription."
            : 'Failed to load prescription. Please try again.'}
        </Alert>
        <Button onClick={handleBack} sx={{ mt: 2 }} startIcon={<ArrowBack />}>
          Go Back
        </Button>
      </Container>
    );
  }

  if (!prescription) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="warning">Prescription not found</Alert>
        <Button onClick={handleBack} sx={{ mt: 2 }} startIcon={<ArrowBack />}>
          Go Back
        </Button>
      </Container>
    );
  }

  return (
    <>
      <style>{`
        @media print {
          .prescription-no-print {
            display: none !important;
          }
          .MuiContainer-root {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
          .MuiPaper-root {
            box-shadow: none !important;
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
              Prescription #{prescription.prescription_number}
            </Typography>
          </Box>

          {/* Patient Info */}
          <Alert severity="info" sx={{ mb: 3 }} className="prescription-no-print">
            <Typography variant="body2">
              <strong>Patient:</strong> {prescription.patient_full_name || `${prescription.patient_first_name}`} |{' '}
              <strong>Mobile:</strong> {prescription.patient_mobile_number} |{' '}
              <strong>Date:</strong> {new Date(prescription.created_at).toLocaleDateString()}
            </Typography>
          </Alert>

          {/* Prescription Viewer */}
          <PrescriptionViewer
            prescriptionId={prescription.id}
            refetch={refetch}
          />
        </Paper>
      </Container>
    </>
  );
};

export default PrescriptionDetailView;
