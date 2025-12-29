/**
 * Short Key Management Page - Medical Futurism Design
 * iPad-optimized with glassmorphism, solid colors (A11Y compliant), and compact spacing
 */

import { useState } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  Autocomplete,
  Tooltip,
  Divider,
  Card,
  Fade,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  KeyboardAlt as ShortKeyIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  Public as GlobalIcon,
  Person as PersonalIcon,
} from '@mui/icons-material';
import { useToast } from '../../components/common/Toast';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import {
  useListShortKeysQuery,
  useCreateShortKeyMutation,
  useUpdateShortKeyMutation,
  useDeleteShortKeyMutation,
  useAddMedicineToShortKeyMutation,
  useRemoveMedicineFromShortKeyMutation,
  useSearchMedicinesQuery,
  type ShortKey,
  type Medicine,
} from '../../store/api';

interface MedicineFormData {
  medicine_id: string;
  medicine_name: string;
  medicine_generic_name?: string;
  default_dosage: string;
  default_frequency: string;
  default_duration: string;
  default_instructions: string;
  sequence_order: number;
}

export const ShortKeyManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingShortKey, setEditingShortKey] = useState<ShortKey | null>(null);

  // Toast and confirm dialog hooks
  const toast = useToast();
  const { dialogProps, confirm } = useConfirmDialog();

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    is_global: false,
  });

  // Medicine management state
  const [medicines, setMedicines] = useState<MedicineFormData[]>([]);
  const [medicineSearchTerm, setMedicineSearchTerm] = useState('');
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [newMedicineDefaults, setNewMedicineDefaults] = useState({
    dosage: '1 tablet',
    frequency: 'Twice daily',
    duration: '5 days',
    instructions: 'After meals',
  });

  // API hooks
  const { data: shortKeysData, isLoading, refetch } = useListShortKeysQuery({
    query: searchQuery,
  });

  const [createShortKey, { isLoading: creating }] = useCreateShortKeyMutation();
  const [updateShortKey, { isLoading: updating }] = useUpdateShortKeyMutation();
  const [deleteShortKey] = useDeleteShortKeyMutation();
  const [addMedicine] = useAddMedicineToShortKeyMutation();
  const [removeMedicine] = useRemoveMedicineFromShortKeyMutation();

  // Medicine search
  const { data: searchedMedicines = [] } = useSearchMedicinesQuery(
    { search: medicineSearchTerm, limit: 20 },
    { skip: medicineSearchTerm.length < 2 }
  );

  // Handlers
  const handleOpenDialog = (shortKey?: ShortKey) => {
    if (shortKey) {
      setEditingShortKey(shortKey);
      setFormData({
        code: shortKey.code,
        name: shortKey.name,
        description: shortKey.description || '',
        is_global: shortKey.is_global,
      });
      // Load existing medicines
      const existingMedicines: MedicineFormData[] = shortKey.medicines.map((med, index) => ({
        medicine_id: med.medicine_id,
        medicine_name: med.medicine?.name || 'Unknown Medicine',
        medicine_generic_name: med.medicine?.generic_name,
        default_dosage: med.default_dosage,
        default_frequency: med.default_frequency,
        default_duration: med.default_duration,
        default_instructions: med.default_instructions || '',
        sequence_order: med.sequence_order || index + 1,
      }));
      setMedicines(existingMedicines.sort((a, b) => a.sequence_order - b.sequence_order));
    } else {
      setEditingShortKey(null);
      setFormData({
        code: '',
        name: '',
        description: '',
        is_global: false,
      });
      setMedicines([]);
    }
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingShortKey(null);
    setSelectedMedicine(null);
    setMedicineSearchTerm('');
  };

  const handleSubmit = async () => {
    // Validate code (uppercase, non-empty)
    if (!formData.code || !formData.name) {
      toast.warning('Code and Name are required');
      return;
    }

    const upperCode = formData.code.toUpperCase();
    if (upperCode !== formData.code) {
      setFormData({ ...formData, code: upperCode });
    }

    try {
      let shortKeyId: string;

      if (editingShortKey) {
        // Update short key
        await updateShortKey({ id: editingShortKey.id, ...formData, code: upperCode }).unwrap();
        shortKeyId = editingShortKey.id;

        // Remove old medicines if needed
        for (const oldMed of editingShortKey.medicines) {
          const stillExists = medicines.find(m => m.medicine_id === oldMed.medicine_id);
          if (!stillExists) {
            await removeMedicine({ shortKeyId, medicineId: oldMed.medicine_id }).unwrap();
          }
        }

        toast.success('Short key updated successfully!');
      } else {
        // Create new short key
        const result = await createShortKey({ ...formData, code: upperCode }).unwrap();
        shortKeyId = result.id;
        toast.success('Short key created successfully!');
      }

      // Add/update medicines
      for (const med of medicines) {
        await addMedicine({
          shortKeyId,
          medicine_id: med.medicine_id,
          default_dosage: med.default_dosage,
          default_frequency: med.default_frequency,
          default_duration: med.default_duration,
          default_instructions: med.default_instructions,
          sequence_order: med.sequence_order,
        }).unwrap();
      }

      handleCloseDialog();
      refetch();
    } catch (error: any) {
      console.error('Short key save error:', error);
      toast.error(error?.data?.detail || 'Failed to save short key');
    }
  };

  const handleDelete = async (id: string, code: string) => {
    const confirmed = await confirm({
      title: 'Delete Shortcut',
      message: `Are you sure you want to delete shortcut "${code}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });

    if (confirmed) {
      try {
        await deleteShortKey(id).unwrap();
        toast.success('Short key deleted successfully!');
        refetch();
      } catch (error: any) {
        toast.error(error?.data?.detail || 'Failed to delete short key');
      }
    }
  };

  const handleAddMedicine = () => {
    if (!selectedMedicine) {
      toast.warning('Please select a medicine');
      return;
    }

    // Check if already added
    if (medicines.find(m => m.medicine_id === selectedMedicine.id)) {
      toast.warning('This medicine is already in the list');
      return;
    }

    const newMedicine: MedicineFormData = {
      medicine_id: selectedMedicine.id,
      medicine_name: selectedMedicine.name,
      medicine_generic_name: selectedMedicine.generic_name,
      default_dosage: newMedicineDefaults.dosage,
      default_frequency: newMedicineDefaults.frequency,
      default_duration: newMedicineDefaults.duration,
      default_instructions: newMedicineDefaults.instructions,
      sequence_order: medicines.length + 1,
    };

    setMedicines([...medicines, newMedicine]);
    setSelectedMedicine(null);
    setMedicineSearchTerm('');
  };

  const handleRemoveMedicine = (medicineId: string) => {
    const filtered = medicines.filter(m => m.medicine_id !== medicineId);
    // Reorder sequence
    const reordered = filtered.map((m, index) => ({ ...m, sequence_order: index + 1 }));
    setMedicines(reordered);
  };

  const handleMoveMedicine = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === medicines.length - 1)
    ) {
      return;
    }

    const newMedicines = [...medicines];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newMedicines[index], newMedicines[swapIndex]] = [newMedicines[swapIndex], newMedicines[index]];

    // Update sequence orders
    const reordered = newMedicines.map((m, idx) => ({ ...m, sequence_order: idx + 1 }));
    setMedicines(reordered);
  };

  const handleUpdateMedicineField = (
    medicineId: string,
    field: keyof MedicineFormData,
    value: string
  ) => {
    setMedicines(
      medicines.map(m =>
        m.medicine_id === medicineId ? { ...m, [field]: value } : m
      )
    );
  };

  const shortKeys = shortKeysData?.short_keys || [];

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
            <ShortKeyIcon sx={{ fontSize: 24, color: 'white' }} />
          </Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
              color: '#667eea',
            }}
          >
            Shortcut Management
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
          Create New Shortcut
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
          placeholder="Search shortcuts by code or name..."
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
      {shortKeysData && (
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
          Total Shortcuts: <strong>{shortKeysData.total || shortKeys.length}</strong>
        </Alert>
      )}

      {/* Shortcuts Cards */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#667eea' }} />
        </Box>
      ) : shortKeys.length > 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {shortKeys.map((shortKey: ShortKey, index: number) => (
            <Fade in key={shortKey.id} timeout={300 + index * 100}>
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
                    {/* Left Side: Code + Name + Description */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.75 }}>
                        <Chip
                          label={shortKey.code}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            height: 28,
                            fontFamily: 'monospace',
                            bgcolor: '#667eea',
                            color: 'white',
                            border: 'none',
                            boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                          }}
                        />
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: 700,
                            fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                            color: 'text.primary',
                          }}
                        >
                          {shortKey.name}
                        </Typography>
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          color: 'text.secondary',
                          fontSize: '0.75rem',
                          lineHeight: 1.4,
                        }}
                      >
                        {shortKey.description || 'No description'}
                      </Typography>
                    </Box>

                    {/* Right Side: Metadata + Actions */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        flexShrink: 0,
                      }}
                    >
                      {/* Medicine Count */}
                      <Chip
                        label={`${shortKey.medicine_count || shortKey.medicines?.length || 0} meds`}
                        size="small"
                        sx={{
                          fontSize: '0.6875rem',
                          fontWeight: 600,
                          height: 24,
                          bgcolor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                        }}
                      />

                      {/* Scope */}
                      {shortKey.is_global ? (
                        <Chip
                          icon={<GlobalIcon sx={{ fontSize: 14, color: 'white !important' }} />}
                          label="Global"
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
                      ) : (
                        <Chip
                          icon={<PersonalIcon sx={{ fontSize: 14 }} />}
                          label="Personal"
                          size="small"
                          variant="outlined"
                          sx={{
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            height: 24,
                            borderColor: 'rgba(102, 126, 234, 0.3)',
                            color: 'text.secondary',
                          }}
                        />
                      )}

                      {/* Usage Count */}
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: '0.75rem',
                          color: 'text.secondary',
                          minWidth: 60,
                          textAlign: 'center',
                        }}
                      >
                        Used: <strong>{shortKey.usage_count || 0}</strong>
                      </Typography>

                      {/* Action Buttons */}
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(shortKey)}
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
                            onClick={() => handleDelete(shortKey.id, shortKey.code)}
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
            <ShortKeyIcon sx={{ fontSize: 40, color: '#667eea' }} />
          </Box>
          <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1, fontWeight: 600 }}>
            No Shortcuts Found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {searchQuery ? 'Try a different search term' : 'Click "Create New Shortcut" to get started'}
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
              Create Your First Shortcut
            </Button>
          )}
        </Paper>
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        open={showDialog}
        onClose={handleCloseDialog}
        maxWidth="lg"
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
          {editingShortKey ? `Edit Shortcut: ${editingShortKey.code}` : 'Create New Shortcut'}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Box sx={{ pt: 1 }}>
            {/* Short Key Details */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 2,
                pb: 2,
                borderBottom: '2px solid rgba(102, 126, 234, 0.15)',
              }}
            >
              <ShortKeyIcon sx={{ color: '#667eea', fontSize: 24 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#667eea' }}>
                Shortcut Details
              </Typography>
            </Box>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Code *"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  helperText="Uppercase, e.g. DAE"
                  inputProps={{ style: { textTransform: 'uppercase' } }}
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
              <Grid item xs={12} md={5}>
                <TextField
                  fullWidth
                  label="Name *"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  helperText="e.g. Common Dental Antibiotics"
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
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.is_global}
                      onChange={(e) => setFormData({ ...formData, is_global: e.target.checked })}
                      sx={{
                        color: '#667eea',
                        '&.Mui-checked': {
                          color: '#667eea',
                        },
                      }}
                    />
                  }
                  label="Global (visible to all doctors)"
                  sx={{ mt: 1 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  multiline
                  rows={2}
                  helperText="Optional - describe when to use this shortcut"
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

            <Divider sx={{ my: 3, borderColor: 'rgba(102, 126, 234, 0.15)' }} />

            {/* Medicine Management */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 2,
                pb: 2,
                borderBottom: '2px solid rgba(102, 126, 234, 0.15)',
              }}
            >
              <AddIcon sx={{ color: '#667eea', fontSize: 24 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#667eea' }}>
                Add Medicines
              </Typography>
            </Box>
            <Box
              sx={{
                p: 2.5,
                borderRadius: 2,
                background: 'linear-gradient(to bottom, rgba(102, 126, 234, 0.02), rgba(102, 126, 234, 0.01))',
                border: '1px solid rgba(102, 126, 234, 0.1)',
                mb: 3,
              }}
            >
              <Grid container spacing={2.5}>
                {/* Row 1: Search + Dosage + Frequency + Duration */}
                <Grid item xs={12} md={4}>
                  <Autocomplete
                    value={selectedMedicine}
                    onChange={(_, newValue) => setSelectedMedicine(newValue)}
                    inputValue={medicineSearchTerm}
                    onInputChange={(_, newValue) => setMedicineSearchTerm(newValue)}
                    options={searchedMedicines}
                    getOptionLabel={(option) =>
                      `${option.name}${option.generic_name ? ` (${option.generic_name})` : ''}`
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Search Medicine"
                        placeholder="Type to search..."
                        size="small"
                        InputLabelProps={{
                          shrink: true,
                          sx: {
                            fontWeight: 600,
                            fontSize: '0.8125rem',
                            letterSpacing: '0.02em',
                          },
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: 'white',
                            transition: 'all 0.2s ease',
                            '& fieldset': {
                              borderColor: 'rgba(102, 126, 234, 0.2)',
                              borderWidth: '1.5px',
                            },
                            '&:hover fieldset': {
                              borderColor: 'rgba(102, 126, 234, 0.4)',
                            },
                            '&.Mui-focused': {
                              boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.08)',
                              '& fieldset': {
                                borderColor: '#667eea',
                                borderWidth: '1.5px',
                              },
                            },
                          },
                          '& .MuiInputLabel-root': {
                            color: '#475569',
                            '&.Mui-focused': {
                              color: '#667eea',
                            },
                          },
                        }}
                      />
                    )}
                    loading={medicineSearchTerm.length >= 2}
                    noOptionsText={
                      medicineSearchTerm.length < 2
                        ? 'Type at least 2 characters'
                        : 'No medicines found'
                    }
                  />
                </Grid>
                <Grid item xs={6} md={2}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Dosage"
                    value={newMedicineDefaults.dosage}
                    onChange={(e) =>
                      setNewMedicineDefaults({ ...newMedicineDefaults, dosage: e.target.value })
                    }
                    SelectProps={{
                      native: true,
                    }}
                    InputLabelProps={{
                      shrink: true,
                      sx: {
                        fontWeight: 600,
                        fontSize: '0.8125rem',
                        letterSpacing: '0.02em',
                      },
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'white',
                        transition: 'all 0.2s ease',
                        '& fieldset': {
                          borderColor: 'rgba(102, 126, 234, 0.2)',
                          borderWidth: '1.5px',
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(102, 126, 234, 0.4)',
                        },
                        '&.Mui-focused': {
                          boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.08)',
                          '& fieldset': {
                            borderColor: '#667eea',
                            borderWidth: '1.5px',
                          },
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: '#475569',
                        '&.Mui-focused': {
                          color: '#667eea',
                        },
                      },
                      '& select': {
                        fontWeight: 500,
                      },
                    }}
                  >
                    <option value="1 tablet">1 tablet</option>
                    <option value="2 tablets">2 tablets</option>
                    <option value="1 capsule">1 capsule</option>
                    <option value="2 capsules">2 capsules</option>
                    <option value="5ml">5ml</option>
                    <option value="10ml">10ml</option>
                    <option value="1 spoon">1 spoon</option>
                  </TextField>
                </Grid>
                <Grid item xs={6} md={3}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Frequency"
                    value={newMedicineDefaults.frequency}
                    onChange={(e) =>
                      setNewMedicineDefaults({ ...newMedicineDefaults, frequency: e.target.value })
                    }
                    SelectProps={{
                      native: true,
                    }}
                    InputLabelProps={{
                      shrink: true,
                      sx: {
                        fontWeight: 600,
                        fontSize: '0.8125rem',
                        letterSpacing: '0.02em',
                      },
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'white',
                        transition: 'all 0.2s ease',
                        '& fieldset': {
                          borderColor: 'rgba(102, 126, 234, 0.2)',
                          borderWidth: '1.5px',
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(102, 126, 234, 0.4)',
                        },
                        '&.Mui-focused': {
                          boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.08)',
                          '& fieldset': {
                            borderColor: '#667eea',
                            borderWidth: '1.5px',
                          },
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: '#475569',
                        '&.Mui-focused': {
                          color: '#667eea',
                        },
                      },
                      '& select': {
                        fontWeight: 500,
                      },
                    }}
                  >
                    <option value="Once daily">Once daily</option>
                    <option value="Twice daily">Twice daily</option>
                    <option value="Thrice daily">Thrice daily</option>
                    <option value="Four times daily">Four times daily</option>
                    <option value="Every 4 hours">Every 4 hours</option>
                    <option value="Every 6 hours">Every 6 hours</option>
                    <option value="Every 8 hours">Every 8 hours</option>
                    <option value="As needed">As needed</option>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Duration"
                    value={newMedicineDefaults.duration}
                    onChange={(e) =>
                      setNewMedicineDefaults({ ...newMedicineDefaults, duration: e.target.value })
                    }
                    SelectProps={{
                      native: true,
                    }}
                    InputLabelProps={{
                      shrink: true,
                      sx: {
                        fontWeight: 600,
                        fontSize: '0.8125rem',
                        letterSpacing: '0.02em',
                      },
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'white',
                        transition: 'all 0.2s ease',
                        '& fieldset': {
                          borderColor: 'rgba(102, 126, 234, 0.2)',
                          borderWidth: '1.5px',
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(102, 126, 234, 0.4)',
                        },
                        '&.Mui-focused': {
                          boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.08)',
                          '& fieldset': {
                            borderColor: '#667eea',
                            borderWidth: '1.5px',
                          },
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: '#475569',
                        '&.Mui-focused': {
                          color: '#667eea',
                        },
                      },
                      '& select': {
                        fontWeight: 500,
                      },
                    }}
                  >
                    <option value="3 days">3 days</option>
                    <option value="5 days">5 days</option>
                    <option value="7 days">7 days</option>
                    <option value="10 days">10 days</option>
                    <option value="14 days">14 days</option>
                    <option value="1 month">1 month</option>
                    <option value="3 months">3 months</option>
                  </TextField>
                </Grid>

                {/* Row 2: Instructions + Add Button */}
                <Grid item xs={12} md={10}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Instructions"
                    value={newMedicineDefaults.instructions}
                    onChange={(e) =>
                      setNewMedicineDefaults({ ...newMedicineDefaults, instructions: e.target.value })
                    }
                    SelectProps={{
                      native: true,
                    }}
                    InputLabelProps={{
                      shrink: true,
                      sx: {
                        fontWeight: 600,
                        fontSize: '0.8125rem',
                        letterSpacing: '0.02em',
                      },
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'white',
                        transition: 'all 0.2s ease',
                        '& fieldset': {
                          borderColor: 'rgba(102, 126, 234, 0.2)',
                          borderWidth: '1.5px',
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(102, 126, 234, 0.4)',
                        },
                        '&.Mui-focused': {
                          boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.08)',
                          '& fieldset': {
                            borderColor: '#667eea',
                            borderWidth: '1.5px',
                          },
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: '#475569',
                        '&.Mui-focused': {
                          color: '#667eea',
                        },
                      },
                      '& select': {
                        fontWeight: 500,
                      },
                    }}
                  >
                    <option value="After meals">After meals</option>
                    <option value="Before meals">Before meals</option>
                    <option value="With meals">With meals</option>
                    <option value="Empty stomach">Empty stomach</option>
                    <option value="At bedtime">At bedtime</option>
                    <option value="Morning and evening">Morning and evening</option>
                    <option value="As directed">As directed</option>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleAddMedicine}
                    startIcon={<AddIcon />}
                    sx={{
                      minHeight: 40,
                      bgcolor: '#667eea',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      borderRadius: 1.5,
                      textTransform: 'none',
                      letterSpacing: '0.02em',
                      boxShadow: '0 2px 8px rgba(102, 126, 234, 0.25)',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        bgcolor: '#5568d3',
                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.35)',
                        transform: 'translateY(-1px)',
                      },
                      '&:active': {
                        transform: 'translateY(0)',
                        boxShadow: '0 2px 6px rgba(102, 126, 234, 0.25)',
                      },
                    }}
                  >
                    Add
                  </Button>
                </Grid>
              </Grid>
            </Box>

            {/* Medicine List */}
            {medicines.length > 0 ? (
              <>
                <Typography
                  variant="subtitle2"
                  sx={{ mt: 3, mb: 1, fontWeight: 700, color: '#667eea' }}
                >
                  Medicines in this Shortcut ({medicines.length})
                </Typography>
                <TableContainer
                  component={Paper}
                  variant="outlined"
                  sx={{
                    borderRadius: 2,
                    border: '1px solid rgba(102, 126, 234, 0.15)',
                    maxHeight: 400,
                    overflow: 'auto',
                    '&::-webkit-scrollbar': {
                      width: '6px',
                    },
                    '&::-webkit-scrollbar-track': {
                      background: 'rgba(102, 126, 234, 0.05)',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: '#667eea',
                      borderRadius: 10,
                    },
                  }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow
                        sx={{
                          background: 'rgba(102, 126, 234, 0.08)',
                        }}
                      >
                        <TableCell width="40px" sx={{ fontWeight: 700 }}>#</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Medicine</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Dosage</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Frequency</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Duration</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Instructions</TableCell>
                        <TableCell width="120px" align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {medicines.map((med, index) => (
                        <TableRow
                          key={med.medicine_id}
                          sx={{
                            '&:hover': {
                              background: 'rgba(102, 126, 234, 0.05)',
                            },
                          }}
                        >
                          <TableCell>{med.sequence_order}</TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={700}>
                              {med.medicine_name}
                            </Typography>
                            {med.medicine_generic_name && (
                              <Typography variant="caption" color="text.secondary">
                                {med.medicine_generic_name}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              value={med.default_dosage}
                              onChange={(e) =>
                                handleUpdateMedicineField(med.medicine_id, 'default_dosage', e.target.value)
                              }
                              fullWidth
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  '&.Mui-focused fieldset': {
                                    borderColor: '#667eea',
                                  },
                                },
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              value={med.default_frequency}
                              onChange={(e) =>
                                handleUpdateMedicineField(med.medicine_id, 'default_frequency', e.target.value)
                              }
                              fullWidth
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  '&.Mui-focused fieldset': {
                                    borderColor: '#667eea',
                                  },
                                },
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              value={med.default_duration}
                              onChange={(e) =>
                                handleUpdateMedicineField(med.medicine_id, 'default_duration', e.target.value)
                              }
                              fullWidth
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  '&.Mui-focused fieldset': {
                                    borderColor: '#667eea',
                                  },
                                },
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              value={med.default_instructions}
                              onChange={(e) =>
                                handleUpdateMedicineField(med.medicine_id, 'default_instructions', e.target.value)
                              }
                              fullWidth
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  '&.Mui-focused fieldset': {
                                    borderColor: '#667eea',
                                  },
                                },
                              }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Move Up">
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => handleMoveMedicine(index, 'up')}
                                  disabled={index === 0}
                                  sx={{
                                    color: '#667eea',
                                    '&:hover': {
                                      background: 'rgba(102, 126, 234, 0.1)',
                                    },
                                  }}
                                >
                                  <ArrowUpIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Move Down">
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => handleMoveMedicine(index, 'down')}
                                  disabled={index === medicines.length - 1}
                                  sx={{
                                    color: '#667eea',
                                    '&:hover': {
                                      background: 'rgba(102, 126, 234, 0.1)',
                                    },
                                  }}
                                >
                                  <ArrowDownIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Remove">
                              <IconButton
                                size="small"
                                onClick={() => handleRemoveMedicine(med.medicine_id)}
                                sx={{
                                  color: '#ef4444',
                                  '&:hover': {
                                    background: 'rgba(239, 68, 68, 0.1)',
                                  },
                                }}
                              >
                                <CloseIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            ) : (
              <Alert
                severity="info"
                sx={{
                  mt: 2,
                  borderRadius: 2,
                  background: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                }}
              >
                No medicines added yet. Search and add medicines to this shortcut.
              </Alert>
            )}
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
            {creating || updating ? 'Saving...' : editingShortKey ? 'Update Shortcut' : 'Create Shortcut'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Dialog */}
      <ConfirmDialog {...dialogProps} />
    </Box>
  );
};
