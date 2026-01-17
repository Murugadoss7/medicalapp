/**
 * Prescription Viewer Component
 * Shows created prescription with edit capabilities
 */

import React, { useState } from 'react';
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
  Grid,
  TextField,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Collapse,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Print as PrintIcon,
  Search as SearchIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useToast } from '../common/Toast';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import {
  useGetPrescriptionQuery,
  useDeletePrescriptionItemMutation,
  useAddPrescriptionItemMutation,
  useUpdatePrescriptionItemMutation,
  useSearchMedicinesQuery,
  useGetEffectivePrescriptionTemplateQuery,
  type Medicine,
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
  officeId?: string; // Office ID for fetching correct template
  refetch?: () => void;
  hideNewPrescriptionButton?: boolean; // Hide "New Prescription" button
  hidePrice?: boolean; // Hide price and total amount
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
  officeId,
  refetch: externalRefetch,
  hideNewPrescriptionButton = false,
  hidePrice = false,
}) => {
  // Toast and confirm dialog hooks
  const toast = useToast();
  const { dialogProps, confirm } = useConfirmDialog();

  const { data: prescription, isLoading, error, refetch } = useGetPrescriptionQuery(prescriptionId);
  const [deleteItem] = useDeletePrescriptionItemMutation();
  const [addItem, { isLoading: addingItem }] = useAddPrescriptionItemMutation();
  const [updateItem, { isLoading: updatingItem }] = useUpdatePrescriptionItemMutation();
  const [retryCount, setRetryCount] = useState(0);

  // Fetch effective prescription template for print styling
  const { data: template } = useGetEffectivePrescriptionTemplateQuery(
    prescription?.doctor_id ? { doctor_id: prescription.doctor_id, office_id: officeId } : undefined,
    { skip: !prescription }
  );

  // Get print styles from template
  const getPaperSize = () => {
    if (!template?.paper_size) return 'A4';
    return template.paper_size.toUpperCase();
  };

  const getMargins = () => {
    if (!template) return { top: 15, right: 15, bottom: 15, left: 15 };
    return {
      top: template.margin_top || 15,
      right: template.margin_right || 15,
      bottom: template.margin_bottom || 15,
      left: template.margin_left || 15,
    };
  };

  // Get layout config from template - read directly like LivePreview does
  const layoutConfig = (template?.layout_config || {}) as Record<string, Record<string, unknown>>;
  const headerConfig = layoutConfig.header || {};
  const footerConfig = layoutConfig.footer || {};

  // Extract settings from layout config
  const accentColor = (headerConfig.accentColor as string) || '#667eea';
  const logoUrl = template?.logo_url;
  const signatureUrl = template?.signature_url;
  const signatureText = template?.signature_text;
  const logoPosition = ((headerConfig.logo as Record<string, unknown>)?.position as string) || 'left';
  const logoMaxWidth = ((headerConfig.logo as Record<string, unknown>)?.maxWidth as number) || 80;

  // Debug: Log template data to verify it's being fetched correctly
  React.useEffect(() => {
    if (template) {
      console.log('[PrescriptionViewer] Template fetched:', {
        id: template.id,
        name: template.name,
        layout_config: template.layout_config,
        logo_url: template.logo_url,
        doctor_id: template.doctor_id,
        office_id: template.office_id,
      });
      console.log('[PrescriptionViewer] Extracted logoPosition:', logoPosition);
    }
  }, [template, logoPosition]);

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [medicineSearch, setMedicineSearch] = useState('');
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [newItem, setNewItem] = useState({
    dosage: '1 tablet',
    frequency: 'Twice daily',
    duration: '5 days',
    quantity: 10,
    instructions: 'Take after meals',
  });

  // Inline editing state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editedItems, setEditedItems] = useState<Record<string, any>>({});

  // Adding new row state
  const [isAddingNewRow, setIsAddingNewRow] = useState(false);

  // Medicine search for adding items
  const {
    data: medicineOptions,
    isLoading: medicineSearchLoading,
  } = useSearchMedicinesQuery(
    { search: medicineSearch, limit: 20 },
    { skip: medicineSearch.length < 2 }
  );

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
    if (!prescription) return;

    const confirmed = await confirm({
      title: 'Remove Medicine',
      message: `Are you sure you want to remove "${medicineName}" from this prescription?`,
      confirmText: 'Remove',
      cancelText: 'Cancel',
      variant: 'danger',
    });

    if (confirmed) {
      try {
        console.log('DELETE: Attempting to delete item:', {
          itemId,
          prescriptionId: prescription.id,
          prescriptionNumber: prescription.prescription_number
        });

        await deleteItem({ itemId, prescriptionId: prescription.id }).unwrap();

        console.log('DELETE: Successfully deleted item', itemId);

        // Wait a moment for cache invalidation to propagate
        await new Promise(resolve => setTimeout(resolve, 100));

        // Force refetch to update UI
        await refetch();
        externalRefetch?.();

        toast.success('Medicine removed successfully');
      } catch (error: any) {
        console.error('DELETE FAILED:', {
          itemId,
          prescriptionId: prescription.id,
          error,
          status: error?.status,
          detail: error?.data?.detail
        });
        const errorMessage = error?.data?.detail || error?.message || 'Failed to remove medicine';
        toast.error(errorMessage);
        // Force refetch in case of error
        refetch();
        externalRefetch?.();
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

  const handleToggleEditMode = () => {
    setIsEditMode(!isEditMode);
    if (isEditMode) {
      // Reset form when closing edit mode
      setSelectedMedicine(null);
      setMedicineSearch('');
      setNewItem({
        dosage: '1 tablet',
        frequency: 'Twice daily',
        duration: '5 days',
        quantity: 10,
        instructions: 'Take after meals',
      });
    }
  };

  const handleAddMedicine = async () => {
    if (!selectedMedicine) {
      toast.warning('Please select a medicine');
      return;
    }

    try {
      await addItem({
        prescriptionId,
        medicine_id: selectedMedicine.id,
        dosage: newItem.dosage,
        frequency: newItem.frequency,
        duration: newItem.duration,
        instructions: newItem.instructions,
        quantity: newItem.quantity,
        unit_price: selectedMedicine.unit_price,
      }).unwrap();

      toast.success('Medicine added successfully');

      // Reset form
      setSelectedMedicine(null);
      setMedicineSearch('');
      setNewItem({
        dosage: '1 tablet',
        frequency: 'Twice daily',
        duration: '5 days',
        quantity: 10,
        instructions: 'Take after meals',
      });

      // Refetch prescription
      refetch();
      externalRefetch?.();
    } catch (error: any) {
      console.error('Failed to add medicine:', error);
      toast.error(error?.data?.detail || 'Failed to add medicine. Please try again.');
    }
  };

  // Handler for "Add Medicine" button above table
  const handleAddNewRow = () => {
    setIsAddingNewRow(true);
    setIsEditMode(true); // Show the form
  };

  // Handler for Edit icon click
  const handleEditItem = (itemId: string) => {
    setEditingItemId(itemId);
    // Store the current item data for editing
    const item = prescription?.items?.find(i => i.id === itemId);
    if (item) {
      setEditedItems({
        ...editedItems,
        [itemId]: {
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          quantity: item.quantity,
          instructions: item.instructions,
        }
      });
    }
  };

  // Handler to update edited field
  const handleFieldChange = (itemId: string, field: string, value: any) => {
    setEditedItems({
      ...editedItems,
      [itemId]: {
        ...editedItems[itemId],
        [field]: value
      }
    });
  };

  // Handler for Save All Changes button
  const handleSaveAllChanges = async () => {
    if (!prescription) return;

    const itemIds = Object.keys(editedItems);

    if (itemIds.length === 0) {
      toast.info('No changes to save');
      return;
    }

    try {
      // Save all edited items
      const savePromises = itemIds.map(itemId =>
        updateItem({
          itemId,
          prescriptionId: prescription.id,
          ...editedItems[itemId]
        }).unwrap()
      );

      await Promise.all(savePromises);

      toast.success(`Successfully saved ${itemIds.length} medicine(s)`);

      // Clear edit state
      setEditedItems({});
      setEditingItemId(null);

      // Refetch prescription
      refetch();
      externalRefetch?.();
    } catch (error: any) {
      console.error('Failed to save changes:', error);
      toast.error(error?.data?.detail || 'Failed to save changes. Please try again.');
    }
  };

  // Handler for Cancel button
  const handleCancelChanges = () => {
    setEditedItems({});
    setEditingItemId(null);
    setIsEditMode(false);
    toast.info('Changes discarded');
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

  // Get template-based print margins
  const margins = getMargins();

  return (
    <>
      <style>{`
        @page {
          size: ${getPaperSize()};
          margin: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm;
        }
        @media print {
          /* STEP 1: Hide everything first */
          body * {
            visibility: hidden;
          }

          /* STEP 2: Show prescription print area and ALL descendants */
          .prescription-print-area,
          .prescription-print-area *,
          .prescription-print-area *::before,
          .prescription-print-area *::after {
            visibility: visible !important;
          }

          /* STEP 3: Position prescription area at top of page */
          .prescription-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
            padding: 0; /* Margins handled by @page */
          }

          /* Hide no-print elements completely */
          .no-print, .prescription-no-print,
          .prescription-print-area .no-print,
          .prescription-print-area .prescription-no-print {
            display: none !important;
            visibility: hidden !important;
          }

          /* Hide sidebar and navigation */
          .MuiDrawer-root,
          .MuiDrawer-paper,
          .MuiAppBar-root {
            display: none !important;
          }

          /* Hide dialog backdrop */
          .MuiBackdrop-root {
            display: none !important;
          }

          /* Remove shadows for clean print */
          .prescription-print-area .MuiPaper-root {
            box-shadow: none !important;
            border: none !important;
          }

          /* MUI Table specific styles */
          .prescription-print-area .MuiTableContainer-root {
            overflow: visible !important;
          }

          .prescription-print-area .MuiTable-root {
            display: table !important;
            width: 100% !important;
            border-collapse: collapse !important;
          }

          .prescription-print-area .MuiTableHead-root {
            display: table-header-group !important;
          }

          .prescription-print-area .MuiTableBody-root {
            display: table-row-group !important;
          }

          .prescription-print-area .MuiTableRow-root {
            display: table-row !important;
            page-break-inside: avoid !important;
          }

          .prescription-print-area .MuiTableCell-root {
            display: table-cell !important;
            border: 1px solid #ccc !important;
            padding: 8px 12px !important;
            color: black !important;
            background: white !important;
          }

          .prescription-print-area .MuiTableCell-head {
            font-weight: bold !important;
            background: #f5f5f5 !important;
          }

          /* Ensure text is visible */
          .prescription-print-area .MuiTypography-root,
          .prescription-print-area p,
          .prescription-print-area span,
          .prescription-print-area strong {
            color: black !important;
          }

          /* Hide action column in print */
          .prescription-print-area .MuiTableCell-root.no-print,
          .prescription-print-area th.no-print,
          .prescription-print-area td.no-print {
            display: none !important;
          }

          /* Page setup */
          @page {
            size: A4;
            margin: 15mm;
          }
        }
      `}</style>
      <Box className="prescription-print-area">
        {/* Doctor/Clinic Header - Template Styled */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 2,
            borderBottom: `3px solid ${accentColor}`,
            borderRadius: 2,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${accentColor}20`,
            boxShadow: `0 2px 12px ${accentColor}15`,
          }}
        >
          <Box sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 3,
            flexDirection: logoPosition === 'right' ? 'row-reverse' : 'row',
          }}>
            {/* Logo - position based on layout_config */}
            {logoUrl && logoPosition !== 'center' && (
              <Box sx={{ flexShrink: 0 }}>
                <img
                  src={logoUrl}
                  alt="Clinic Logo"
                  style={{
                    maxWidth: logoMaxWidth,
                    maxHeight: 80,
                    objectFit: 'contain',
                  }}
                />
              </Box>
            )}

            {/* Clinic Info */}
            <Box sx={{ flex: 1, textAlign: logoUrl && logoPosition !== 'center' ? (logoPosition === 'right' ? 'right' : 'left') : 'center' }}>
              {/* Center logo above clinic name */}
              {logoUrl && logoPosition === 'center' && (
                <Box sx={{ mb: 1, display: 'flex', justifyContent: 'center' }}>
                  <img
                    src={logoUrl}
                    alt="Clinic Logo"
                    style={{
                      maxWidth: logoMaxWidth,
                      maxHeight: 80,
                      objectFit: 'contain',
                    }}
                  />
                </Box>
              )}
              <Typography variant="h4" fontWeight={700} sx={{ color: accentColor }}>
                {prescription?.clinic_name || clinicName}
              </Typography>
              <Typography variant="h6" color="text.secondary" fontWeight={600}>
                {prescription?.doctor_name || doctorName}
              </Typography>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                {prescription?.doctor_specialization || doctorSpecialization}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }} fontWeight={500}>
                {prescription?.clinic_address || clinicAddress}
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                Phone: {clinicPhone}
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Prescription Header with Glassmorphism */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 2,
          borderRadius: 2,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${accentColor}20`,
          boxShadow: `0 2px 12px ${accentColor}15`,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h5" gutterBottom fontWeight={700} sx={{ color: accentColor }}>
              Prescription Created
            </Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={500} className="no-print">
              Prescription #{prescription.prescription_number}
            </Typography>
            <Typography variant="body1" fontWeight={600} sx={{ mt: 0.5 }}>
              Patient: {prescription.patient_full_name || `${prescription.patient_first_name} ${prescription.patient_last_name || ''}`.trim()}
            </Typography>
            <Chip
              label={prescription.status}
              size="small"
              sx={{
                mt: 1,
                fontWeight: 700,
                fontSize: '0.6875rem',
                height: 24,
                bgcolor: '#10b981',
                color: 'white',
              }}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {/* New Prescription Button - Only show if onAddMore callback is provided and not hidden */}
            {onAddMore && !hideNewPrescriptionButton && (
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={onAddMore}
                size="small"
                className="no-print"
                sx={{
                  minHeight: 36,
                  px: 2,
                  fontWeight: 700,
                  borderColor: accentColor,
                  color: accentColor,
                  borderRadius: 1.5,
                  '&:hover': {
                    borderColor: accentColor,
                    bgcolor: `${accentColor}10`,
                  },
                }}
              >
                New Prescription
              </Button>
            )}
            <Button
              variant="contained"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
              size="small"
              className="no-print"
              sx={{
                minHeight: 36,
                px: 2,
                fontWeight: 700,
                bgcolor: accentColor,
                color: 'white',
                boxShadow: `0 2px 8px ${accentColor}50`,
                borderRadius: 1.5,
                '&:hover': {
                  bgcolor: accentColor,
                  filter: 'brightness(0.9)',
                  boxShadow: `0 4px 12px ${accentColor}60`,
                },
              }}
            >
              Print
            </Button>
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

      {/* Medicines Table with Glassmorphism */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${accentColor}20`,
          boxShadow: `0 2px 12px ${accentColor}15`,
        }}
      >
        <Box
          sx={{
            p: 2,
            borderBottom: `1px solid ${accentColor}20`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            bgcolor: `${accentColor}08`,
          }}
        >
          <Typography variant="h6" fontWeight={700} sx={{ color: accentColor }}>
            Prescribed Medicines ({prescription.items?.filter(item => item.is_active !== false).length || 0})
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            size="small"
            className="no-print"
            onClick={handleAddNewRow}
            sx={{
              minHeight: 36,
              px: 2,
              fontWeight: 700,
              bgcolor: '#10b981',
              color: 'white',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
              borderRadius: 1.5,
              '&:hover': {
                bgcolor: '#059669',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
              },
            }}
          >
            Add Medicine
          </Button>
        </Box>

        {prescription.items && prescription.items.filter(item => item.is_active !== false).length > 0 ? (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Medicine</strong></TableCell>
                  <TableCell><strong>Dosage</strong></TableCell>
                  <TableCell><strong>Frequency</strong></TableCell>
                  <TableCell><strong>Duration</strong></TableCell>
                  <TableCell align="right"><strong>Qty</strong></TableCell>
                  {!hidePrice && <TableCell align="right"><strong>Price</strong></TableCell>}
                  <TableCell align="right" className="no-print"><strong>Action</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {prescription.items.filter(item => item.is_active !== false).map((item) => {
                  const isEditing = editingItemId === item.id;
                  const editedData = editedItems[item.id] || {
                    dosage: item.dosage,
                    frequency: item.frequency,
                    duration: item.duration,
                    quantity: item.quantity,
                    instructions: item.instructions,
                  };

                  return (
                    <TableRow key={item.id} sx={{ bgcolor: isEditing ? 'action.hover' : 'inherit' }}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {item.medicine_name || 'Medicine'}
                        </Typography>
                        {isEditing ? (
                          <TextField
                            size="small"
                            fullWidth
                            value={editedData.instructions}
                            onChange={(e) => handleFieldChange(item.id, 'instructions', e.target.value)}
                            placeholder="Instructions"
                            sx={{ mt: 0.5 }}
                          />
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            {item.instructions}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <TextField
                            size="small"
                            value={editedData.dosage}
                            onChange={(e) => handleFieldChange(item.id, 'dosage', e.target.value)}
                          />
                        ) : (
                          item.dosage
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <TextField
                            size="small"
                            value={editedData.frequency}
                            onChange={(e) => handleFieldChange(item.id, 'frequency', e.target.value)}
                          />
                        ) : (
                          item.frequency
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <TextField
                            size="small"
                            value={editedData.duration}
                            onChange={(e) => handleFieldChange(item.id, 'duration', e.target.value)}
                          />
                        ) : (
                          item.duration
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {isEditing ? (
                          <TextField
                            size="small"
                            type="number"
                            value={editedData.quantity}
                            onChange={(e) => handleFieldChange(item.id, 'quantity', parseInt(e.target.value) || 0)}
                            inputProps={{ min: 1, style: { textAlign: 'right' } }}
                            sx={{ width: 80 }}
                          />
                        ) : (
                          item.quantity
                        )}
                      </TableCell>
                      {!hidePrice && (
                        <TableCell align="right">
                          ₹{(item.quantity * item.unit_price).toFixed(2)}
                        </TableCell>
                      )}
                      <TableCell align="right" className="no-print">
                        <IconButton
                          size="small"
                          color="primary"
                          sx={{ mr: 1 }}
                          onClick={() => handleEditItem(item.id)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteItem(item.id, item.medicine_name || 'this medicine')}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!hidePrice && (
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
                )}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">No medicines prescribed</Typography>
          </Box>
        )}

        {/* Signature Section - Printable */}
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'flex-end', borderTop: `1px solid ${accentColor}15` }}>
          <Box sx={{ textAlign: 'center', minWidth: 180 }}>
            {signatureUrl ? (
              <Box sx={{ mb: 1 }}>
                <img
                  src={signatureUrl}
                  alt="Doctor Signature"
                  style={{
                    maxWidth: 150,
                    maxHeight: 60,
                    objectFit: 'contain',
                  }}
                />
              </Box>
            ) : signatureText ? (
              <Typography
                variant="body1"
                sx={{
                  fontFamily: 'cursive',
                  fontSize: 18,
                  mb: 1,
                  color: accentColor,
                }}
              >
                {signatureText}
              </Typography>
            ) : null}
            <Box sx={{ borderTop: '1px solid #333', pt: 0.5 }}>
              <Typography variant="caption" fontWeight={600}>
                {prescription?.doctor_name || doctorName}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Date: {new Date(prescription?.created_at || Date.now()).toLocaleDateString()}
            </Typography>
          </Box>
        </Box>

        {/* Add Medicine Form - Collapsible */}
        <Collapse in={isEditMode} timeout="auto" unmountOnExit>
          <Box sx={{ p: 3, borderTop: 1, borderColor: 'divider' }} className="no-print">
            <Typography variant="h6" gutterBottom>
              Add Medicine to Prescription
            </Typography>
            <Grid container spacing={2}>
              {/* Medicine Search */}
              <Grid item xs={12} md={6}>
                <Autocomplete
                  value={selectedMedicine}
                  onChange={(_, newValue) => setSelectedMedicine(newValue)}
                  inputValue={medicineSearch}
                  onInputChange={(_, newInputValue) => setMedicineSearch(newInputValue)}
                  options={medicineOptions || []}
                  getOptionLabel={(option) =>
                    `${option.name} ${option.strength ? `(${option.strength})` : ''} - ${option.manufacturer}`
                  }
                  loading={medicineSearchLoading}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Search Medicine"
                      placeholder="Type medicine name..."
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                        endAdornment: (
                          <>
                            {medicineSearchLoading && <CircularProgress size={20} />}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props}>
                      <Box>
                        <Typography variant="subtitle2">
                          {option.name} {option.strength && `(${option.strength})`}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {option.manufacturer} • ₹{option.unit_price}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                />
              </Grid>

              {/* Dosage */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Dosage</InputLabel>
                  <Select
                    value={newItem.dosage}
                    onChange={(e) => setNewItem({ ...newItem, dosage: e.target.value })}
                    label="Dosage"
                  >
                    <MenuItem value="1/2 tablet">1/2 tablet</MenuItem>
                    <MenuItem value="1 tablet">1 tablet</MenuItem>
                    <MenuItem value="2 tablets">2 tablets</MenuItem>
                    <MenuItem value="5ml">5ml</MenuItem>
                    <MenuItem value="10ml">10ml</MenuItem>
                    <MenuItem value="1 capsule">1 capsule</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Frequency */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Frequency</InputLabel>
                  <Select
                    value={newItem.frequency}
                    onChange={(e) => setNewItem({ ...newItem, frequency: e.target.value })}
                    label="Frequency"
                  >
                    <MenuItem value="Once daily">Once daily</MenuItem>
                    <MenuItem value="Twice daily">Twice daily</MenuItem>
                    <MenuItem value="Three times daily">Three times daily</MenuItem>
                    <MenuItem value="Four times daily">Four times daily</MenuItem>
                    <MenuItem value="As needed">As needed</MenuItem>
                    <MenuItem value="Before meals">Before meals</MenuItem>
                    <MenuItem value="After meals">After meals</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Duration */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Duration</InputLabel>
                  <Select
                    value={newItem.duration}
                    onChange={(e) => setNewItem({ ...newItem, duration: e.target.value })}
                    label="Duration"
                  >
                    <MenuItem value="3 days">3 days</MenuItem>
                    <MenuItem value="5 days">5 days</MenuItem>
                    <MenuItem value="7 days">7 days</MenuItem>
                    <MenuItem value="10 days">10 days</MenuItem>
                    <MenuItem value="15 days">15 days</MenuItem>
                    <MenuItem value="1 month">1 month</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Quantity */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Quantity"
                  type="number"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                  inputProps={{ min: 1 }}
                />
              </Grid>

              {/* Instructions */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Instructions"
                  value={newItem.instructions}
                  onChange={(e) => setNewItem({ ...newItem, instructions: e.target.value })}
                  placeholder="E.g., Take after meals"
                />
              </Grid>

              {/* Add Button */}
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={handleAddMedicine}
                  disabled={!selectedMedicine || addingItem}
                  fullWidth
                >
                  {addingItem ? 'Adding Medicine...' : 'Add Medicine'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Collapse>

        {/* Save and Cancel Buttons */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', gap: 2 }} className="no-print">
          <Button
            variant="outlined"
            color="error"
            size="large"
            startIcon={<CancelIcon />}
            onClick={handleCancelChanges}
            disabled={Object.keys(editedItems).length === 0 && !editingItemId}
          >
            Cancel Changes
          </Button>
          <Button
            variant="contained"
            color="success"
            size="large"
            startIcon={<SaveIcon />}
            onClick={handleSaveAllChanges}
            disabled={updatingItem || Object.keys(editedItems).length === 0}
          >
            {updatingItem ? 'Saving...' : 'Save All Changes'}
          </Button>
        </Box>
      </Paper>
      </Box>

      {/* Confirm Dialog */}
      <ConfirmDialog {...dialogProps} />
    </>
  );
};

export default PrescriptionViewer;
