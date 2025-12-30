/**
 * Medicine Catalog Page - Medical Futurism Design
 * iPad-optimized with glassmorphism, solid colors (A11Y compliant), and compact spacing
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  FormControlLabel,
  Checkbox,
  Pagination,
  InputAdornment,
  Card,
  Fade,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  LocalPharmacy as PharmacyIcon,
  Close as CloseIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useToast } from '../../components/common/Toast';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import {
  useListMedicinesQuery,
  useCreateMedicineMutation,
  useUpdateMedicineMutation,
  useDeleteMedicineMutation,
  type Medicine,
} from '../../store/api';

export const MedicineCatalog = () => {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);

  // Toast and confirm dialog hooks
  const toast = useToast();
  const { dialogProps, confirm } = useConfirmDialog();

  // Form state
  const [formData, setFormData] = useState({
    generic_name: '',
    brand_name: '',
    manufacturer: '',
    category: '',
    dosage_form: '',
    strength: '',
    unit_price: '',
    requires_prescription: true,
    atc_code: '',
    contraindications: '',
    side_effects: '',
    storage_conditions: '',
  });

  // API hooks
  const { data: medicinesData, isLoading, refetch } = useListMedicinesQuery({
    query: searchQuery,
    page,
    page_size: 20,
  });

  const [createMedicine, { isLoading: creating }] = useCreateMedicineMutation();
  const [updateMedicine, { isLoading: updating }] = useUpdateMedicineMutation();
  const [deleteMedicine] = useDeleteMedicineMutation();

  // Handlers
  const handleOpenDialog = (medicine?: Medicine) => {
    if (medicine) {
      setEditingMedicine(medicine);
      setFormData({
        generic_name: medicine.generic_name || '',
        brand_name: medicine.name || '',
        manufacturer: medicine.manufacturer || '',
        category: medicine.drug_category || '',
        dosage_form: medicine.dosage_forms?.[0] || '',
        strength: medicine.strength || '',
        unit_price: medicine.price?.toString() || '',
        requires_prescription: medicine.requires_prescription ?? true,
        atc_code: medicine.atc_code || '',
        contraindications: medicine.contraindications || '',
        side_effects: medicine.side_effects || '',
        storage_conditions: medicine.storage_conditions || '',
      });
    } else {
      setEditingMedicine(null);
      setFormData({
        generic_name: '',
        brand_name: '',
        manufacturer: '',
        category: '',
        dosage_form: 'Tablet',
        strength: '',
        unit_price: '',
        requires_prescription: true,
        atc_code: '',
        contraindications: '',
        side_effects: '',
        storage_conditions: 'Store at room temperature',
      });
    }
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingMedicine(null);
  };

  const handleSubmit = async () => {
    if (!formData.brand_name) {
      toast.warning('Brand name is required');
      return;
    }

    // Backend schema mapping
    const medicineData = {
      name: formData.brand_name, // Backend uses 'name' for brand name
      generic_name: formData.generic_name || undefined,
      composition: formData.generic_name || formData.brand_name, // Required field - use generic or brand as composition
      manufacturer: formData.manufacturer || undefined,
      dosage_forms: formData.dosage_form ? [formData.dosage_form.toLowerCase()] : undefined,
      strength: formData.strength || undefined,
      drug_category: formData.category || undefined,
      price: formData.unit_price ? parseFloat(formData.unit_price) : undefined,
      requires_prescription: formData.requires_prescription,
      atc_code: formData.atc_code || undefined,
      storage_conditions: formData.storage_conditions || undefined,
      contraindications: formData.contraindications || undefined,
      side_effects: formData.side_effects || undefined,
    };

    try {
      if (editingMedicine) {
        await updateMedicine({ id: editingMedicine.id, ...medicineData }).unwrap();
        toast.success('Medicine updated successfully!');
      } else {
        await createMedicine(medicineData).unwrap();
        toast.success('Medicine created successfully!');
      }
      handleCloseDialog();
      refetch();
    } catch (error: any) {
      console.error('Medicine save error:', error);
      toast.error(error?.data?.detail || 'Failed to save medicine');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await confirm({
      title: 'Delete Medicine',
      message: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });

    if (confirmed) {
      try {
        await deleteMedicine(id).unwrap();
        toast.success('Medicine deleted successfully!');
        refetch();
      } catch (error: any) {
        toast.error(error?.data?.detail || 'Failed to delete medicine');
      }
    }
  };

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
      {/* Compact Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: '#667eea',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
            }}
          >
            <PharmacyIcon sx={{ fontSize: 24, color: 'white' }} />
          </Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
              color: '#667eea',
            }}
          >
            Medicine Catalog
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{
            minHeight: 44,
            px: { xs: 2, sm: 3 },
            fontSize: { xs: '0.8125rem', sm: '0.9375rem' },
            fontWeight: 700,
            bgcolor: '#667eea',
            color: 'white',
            boxShadow: '0 4px 16px rgba(102, 126, 234, 0.4)',
            borderRadius: 2,
            transition: 'all 0.3s cubic-bezier(0, 0, 0.2, 1)',
            '&:hover': {
              bgcolor: '#5568d3',
              boxShadow: '0 6px 20px rgba(102, 126, 234, 0.5)',
              transform: 'translateY(-2px)',
            },
          }}
        >
          Add Medicine
        </Button>
      </Box>

      {/* Search Panel with Glassmorphism */}
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
        <TextField
          fullWidth
          placeholder="Search medicines by name, category, manufacturer..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#667eea' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              '& fieldset': {
                borderColor: 'rgba(102, 126, 234, 0.2)',
              },
              '&:hover fieldset': {
                borderColor: '#667eea',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#667eea',
                borderWidth: 2,
              },
            },
          }}
        />
      </Paper>

      {/* Statistics */}
      {medicinesData && (
        <Alert
          severity="info"
          sx={{
            mb: 2,
            borderRadius: 2,
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            '& .MuiAlert-icon': {
              color: '#3b82f6',
            },
          }}
        >
          Total Medicines: <strong>{medicinesData.total}</strong> | Page <strong>{medicinesData.page}</strong> of <strong>{medicinesData.total_pages}</strong>
        </Alert>
      )}

      {/* Medicine Cards */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#667eea' }} />
        </Box>
      ) : medicinesData && medicinesData.medicines.length > 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {medicinesData.medicines.map((medicine, index) => (
            <Fade in key={medicine.id} timeout={300 + index * 100}>
              <Card
                sx={{
                  borderRadius: 2,
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(102, 126, 234, 0.15)',
                  boxShadow: '0 2px 12px rgba(102, 126, 234, 0.1)',
                  transition: 'all 0.3s cubic-bezier(0, 0, 0.2, 1)',
                  '&:hover': {
                    boxShadow: '0 4px 16px rgba(102, 126, 234, 0.2)',
                    transform: 'translateY(-2px)',
                    borderColor: 'rgba(102, 126, 234, 0.3)',
                  },
                }}
              >
                <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
                  {/* Main Content - Horizontal Layout */}
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 2,
                      flexWrap: { xs: 'wrap', md: 'nowrap' },
                    }}
                  >
                    {/* Left Side: Brand + Generic Name */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 700,
                          fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                          color: 'text.primary',
                          mb: 0.5,
                        }}
                      >
                        {medicine.name || '-'}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          color: 'text.secondary',
                          fontSize: '0.75rem',
                          lineHeight: 1.4,
                          mb: 0.75,
                        }}
                      >
                        {medicine.generic_name || 'No generic name'}
                      </Typography>
                      {/* Inline metadata with bullets */}
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          color: 'text.secondary',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                        }}
                      >
                        {medicine.dosage_forms?.[0] || 'N/A'} • {medicine.strength || 'N/A'} • {medicine.manufacturer || 'Unknown'} • ₹{medicine.price ? medicine.price.toFixed(2) : '0.00'}
                      </Typography>
                    </Box>

                    {/* Right Side: Category + Prescription + Actions */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        flexShrink: 0,
                      }}
                    >
                      {/* Category Chip */}
                      {medicine.drug_category && (
                        <Chip
                          label={medicine.drug_category}
                          size="small"
                          sx={{
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            height: 24,
                            bgcolor: '#667eea',
                            color: 'white',
                            border: 'none',
                          }}
                        />
                      )}

                      {/* Prescription Chip */}
                      {medicine.requires_prescription ? (
                        <Chip
                          label="Rx"
                          size="small"
                          sx={{
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            height: 24,
                            bgcolor: '#f59e0b',
                            color: 'white',
                            border: 'none',
                          }}
                        />
                      ) : (
                        <Chip
                          label="OTC"
                          size="small"
                          sx={{
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            height: 24,
                            bgcolor: '#10b981',
                            color: 'white',
                            border: 'none',
                          }}
                        />
                      )}

                      {/* Action Buttons */}
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(medicine)}
                            sx={{
                              minWidth: 36,
                              minHeight: 36,
                              color: '#667eea',
                              border: '1px solid rgba(102, 126, 234, 0.3)',
                              borderRadius: 1.5,
                              transition: 'all 0.2s',
                              '&:hover': {
                                background: 'rgba(102, 126, 234, 0.1)',
                                borderColor: '#667eea',
                              },
                            }}
                          >
                            <EditIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(medicine.id, medicine.name)}
                            sx={{
                              minWidth: 36,
                              minHeight: 36,
                              color: '#ef4444',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              borderRadius: 1.5,
                              transition: 'all 0.2s',
                              '&:hover': {
                                background: 'rgba(239, 68, 68, 0.1)',
                                borderColor: '#ef4444',
                              },
                            }}
                          >
                            <DeleteIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Card>
            </Fade>
          ))}
        </Box>
      ) : (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(102, 126, 234, 0.15)',
            boxShadow: '0 2px 12px rgba(102, 126, 234, 0.1)',
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'rgba(102, 126, 234, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <PharmacyIcon sx={{ fontSize: 40, color: '#667eea' }} />
          </Box>
          <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1, fontWeight: 600 }}>
            No Medicines Found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {searchQuery ? 'Try a different search term' : 'Click "Add Medicine" to get started'}
          </Typography>
          {!searchQuery && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{
                minHeight: 44,
                px: 3,
                fontWeight: 700,
                bgcolor: '#667eea',
                color: 'white',
                boxShadow: '0 4px 16px rgba(102, 126, 234, 0.4)',
                borderRadius: 2,
                '&:hover': {
                  bgcolor: '#5568d3',
                  boxShadow: '0 6px 20px rgba(102, 126, 234, 0.5)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              Add Your First Medicine
            </Button>
          )}
        </Paper>
      )}

      {/* Pagination */}
      {medicinesData && medicinesData.total_pages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={medicinesData.total_pages}
            page={page}
            onChange={(_, value) => setPage(value)}
            sx={{
              '& .MuiPaginationItem-root': {
                color: '#667eea',
                '&.Mui-selected': {
                  bgcolor: '#667eea',
                  color: 'white',
                  '&:hover': {
                    bgcolor: '#5568d3',
                  },
                },
                '&:hover': {
                  bgcolor: 'rgba(102, 126, 234, 0.1)',
                },
              },
            }}
          />
        </Box>
      )}

      {/* Add/Edit Dialog */}
      <Dialog
        open={showDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(102, 126, 234, 0.2)',
          },
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: '#667eea',
            color: 'white',
            fontWeight: 700,
            fontSize: '1.25rem',
          }}
        >
          {editingMedicine ? 'Edit Medicine' : 'Add New Medicine'}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Brand Name *"
                  value={formData.brand_name}
                  onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                  helperText="Required - Medicine brand/trade name"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&.Mui-focused fieldset': {
                        borderColor: '#667eea',
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#667eea',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Generic Name"
                  value={formData.generic_name}
                  onChange={(e) => setFormData({ ...formData, generic_name: e.target.value })}
                  helperText="Optional - Scientific/generic name"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&.Mui-focused fieldset': {
                        borderColor: '#667eea',
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#667eea',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Manufacturer"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&.Mui-focused fieldset': {
                        borderColor: '#667eea',
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#667eea',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Antibiotic, Analgesic"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&.Mui-focused fieldset': {
                        borderColor: '#667eea',
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#667eea',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Dosage Form"
                  value={formData.dosage_form}
                  onChange={(e) => setFormData({ ...formData, dosage_form: e.target.value })}
                  placeholder="e.g., Tablet, Syrup"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&.Mui-focused fieldset': {
                        borderColor: '#667eea',
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#667eea',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Strength"
                  value={formData.strength}
                  onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                  placeholder="e.g., 500mg, 10ml"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&.Mui-focused fieldset': {
                        borderColor: '#667eea',
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#667eea',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Price"
                  type="number"
                  value={formData.unit_price}
                  onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                  InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                  helperText="Price per unit"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&.Mui-focused fieldset': {
                        borderColor: '#667eea',
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#667eea',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.requires_prescription}
                      onChange={(e) => setFormData({ ...formData, requires_prescription: e.target.checked })}
                      sx={{
                        color: '#667eea',
                        '&.Mui-checked': {
                          color: '#667eea',
                        },
                      }}
                    />
                  }
                  label="Requires Prescription"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="ATC Code"
                  value={formData.atc_code}
                  onChange={(e) => setFormData({ ...formData, atc_code: e.target.value })}
                  placeholder="e.g., J01CA04"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&.Mui-focused fieldset': {
                        borderColor: '#667eea',
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#667eea',
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            p: 2,
            background: 'rgba(102, 126, 234, 0.05)',
            borderTop: '1px solid rgba(102, 126, 234, 0.15)',
          }}
        >
          <Button
            onClick={handleCloseDialog}
            startIcon={<CloseIcon />}
            sx={{
              minHeight: 44,
              px: 3,
              fontWeight: 600,
              color: 'text.secondary',
              '&:hover': {
                background: 'rgba(0, 0, 0, 0.05)',
              },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={creating || updating}
            startIcon={<SaveIcon />}
            sx={{
              minHeight: 44,
              px: 3,
              fontWeight: 700,
              bgcolor: '#667eea',
              color: 'white',
              boxShadow: '0 4px 16px rgba(102, 126, 234, 0.4)',
              '&:hover': {
                bgcolor: '#5568d3',
                boxShadow: '0 6px 20px rgba(102, 126, 234, 0.5)',
              },
              '&.Mui-disabled': {
                bgcolor: 'rgba(102, 126, 234, 0.3)',
                color: 'rgba(255, 255, 255, 0.5)',
              },
            }}
          >
            {creating || updating ? 'Saving...' : editingMedicine ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Dialog */}
      <ConfirmDialog {...dialogProps} />
    </Box>
  );
};
