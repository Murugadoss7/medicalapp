/**
 * Prescription Viewer Component
 * Shows created prescription with edit capabilities
 */

import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import {
  useGetPrescriptionQuery,
  useDeletePrescriptionItemMutation,
} from '../../store/api';

interface PrescriptionViewerProps {
  prescriptionId: string;
  onEdit?: () => void;
  onAddMore?: () => void;
  doctorName?: string;
  doctorSpecialization?: string;
  clinicName?: string;
  clinicAddress?: string;
  clinicPhone?: string;
}

export const PrescriptionViewer: React.FC<PrescriptionViewerProps> = ({
  prescriptionId,
  onEdit,
  onAddMore,
  doctorName = 'Dr. John Doe',
  doctorSpecialization = 'Dental Surgeon',
  clinicName = 'Smile Dental Clinic',
  clinicAddress = '123 Main Street, City, State - 123456',
  clinicPhone = '+91 1234567890',
}) => {
  const { data: prescription, isLoading, error, refetch } = useGetPrescriptionQuery(prescriptionId);
  const [deleteItem] = useDeletePrescriptionItemMutation();
  const [retryCount, setRetryCount] = React.useState(0);

  // Auto-retry once after a short delay if prescription not found
  React.useEffect(() => {
    if (!isLoading && !prescription && retryCount === 0) {
      const timer = setTimeout(() => {
        console.log('Auto-retrying prescription fetch...');
        setRetryCount(1);
        refetch();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, prescription, retryCount, refetch]);

  const handleDeleteItem = async (itemId: string, medicineName: string) => {
    if (window.confirm(`Remove ${medicineName} from prescription?`)) {
      try {
        await deleteItem(itemId).unwrap();
        alert('Medicine removed successfully');
        refetch();
      } catch (error) {
        alert('Failed to remove medicine');
      }
    }
  };

  const handleManualRetry = () => {
    setRetryCount(retryCount + 1);
    refetch();
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4, gap: 2 }}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          Loading prescription...
        </Typography>
      </Box>
    );
  }

  if (error) {
    const errorData = error as any;
    const is403 = errorData?.status === 403 || errorData?.originalStatus === 403;

    if (is403) {
      return (
        <Alert severity="error">
          Access denied. You don't have permission to view this prescription.
          This prescription may have been created by another doctor.
        </Alert>
      );
    }
  }

  if (!prescription) {
    return (
      <Alert
        severity="warning"
        action={
          <Button color="inherit" size="small" onClick={handleManualRetry}>
            Retry
          </Button>
        }
      >
        {retryCount > 0
          ? 'Prescription not found. Please try again or close and reopen.'
          : 'Loading prescription data...'
        }
      </Alert>
    );
  }

  const totalAmount = prescription.items?.reduce((sum, item) =>
    sum + (item.quantity * item.unit_price), 0
  ) || 0;

  return (
    <>
      <style>{`
        @media print {
          /* Hide elements with no-print class */
          .no-print {
            display: none !important;
          }

          /* Remove shadows and borders for cleaner print */
          body * {
            box-shadow: none !important;
          }

          /* Ensure clean page breaks */
          .MuiPaper-root {
            box-shadow: none !important;
            page-break-inside: avoid;
          }

          /* Optimize table for printing */
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }

          /* Hide dialogs and overlays */
          .MuiDialog-root, .MuiBackdrop-root {
            display: none !important;
          }
        }
      `}</style>
      <Box>
        {/* Doctor/Clinic Header - Prominent for printing */}
        <Paper elevation={1} sx={{ p: 3, mb: 2, borderBottom: 3, borderColor: 'primary.main' }}>
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Typography variant="h4" fontWeight="bold" color="primary">
              {clinicName}
            </Typography>
            <Typography variant="h6" color="text.secondary">
              {doctorName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {doctorSpecialization}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {clinicAddress}
            </Typography>
            <Typography variant="body2">
              Phone: {clinicPhone}
            </Typography>
          </Box>
        </Paper>

        {/* Prescription Header */}
      <Paper elevation={2} sx={{ p: 3, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h5" gutterBottom>
              Prescription Created
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Prescription #{prescription.prescription_number}
            </Typography>
            <Chip
              label={prescription.status}
              color="success"
              size="small"
              sx={{ mt: 1 }}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
              size="small"
              className="no-print"
            >
              Print
            </Button>
            {onAddMore && (
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={onAddMore}
                size="small"
                className="no-print"
              >
                Add More
              </Button>
            )}
            {onEdit && (
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={onEdit}
                size="small"
                className="no-print"
              >
                Edit Notes
              </Button>
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Diagnosis</Typography>
            <Typography variant="body2">{prescription.diagnosis || '-'}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Clinical Notes</Typography>
            <Typography variant="body2">{prescription.clinical_notes || '-'}</Typography>
          </Box>
        </Box>
      </Paper>

      {/* Medicines Table */}
      <Paper elevation={1}>
        <Typography variant="h6" sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          Prescribed Medicines ({prescription.items?.length || 0})
        </Typography>

        {prescription.items && prescription.items.length > 0 ? (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Medicine</strong></TableCell>
                  <TableCell><strong>Dosage</strong></TableCell>
                  <TableCell><strong>Frequency</strong></TableCell>
                  <TableCell><strong>Duration</strong></TableCell>
                  <TableCell align="right"><strong>Qty</strong></TableCell>
                  <TableCell align="right"><strong>Price</strong></TableCell>
                  <TableCell align="right" className="no-print"><strong>Action</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {prescription.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {item.medicine_name || 'Medicine'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.instructions}
                      </Typography>
                    </TableCell>
                    <TableCell>{item.dosage}</TableCell>
                    <TableCell>{item.frequency}</TableCell>
                    <TableCell>{item.duration}</TableCell>
                    <TableCell align="right">{item.quantity}</TableCell>
                    <TableCell align="right">
                      ₹{(item.quantity * item.unit_price).toFixed(2)}
                    </TableCell>
                    <TableCell align="right" className="no-print">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteItem(item.id, item.medicine_name || 'this medicine')}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={5} align="right">
                    <Typography variant="subtitle1" fontWeight="bold">
                      Total Amount:
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Chip label={`₹${totalAmount.toFixed(2)}`} color="primary" />
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">No medicines prescribed</Typography>
          </Box>
        )}
      </Paper>
      </Box>
    </>
  );
};

export default PrescriptionViewer;
