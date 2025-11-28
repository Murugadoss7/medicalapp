/**
 * Short Key Management Page
 * Complete shortcut management with CRUD operations and medicine assignment
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
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ShortKeyIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Shortcut Management
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Create New Shortcut
        </Button>
      </Box>

      {/* Search */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search shortcuts by code or name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {/* Statistics */}
      {shortKeysData && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Total Shortcuts: {shortKeysData.total || shortKeys.length}
        </Alert>
      )}

      {/* Shortcuts Table */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : shortKeys.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Code</strong></TableCell>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Description</strong></TableCell>
                <TableCell align="center"><strong># Medicines</strong></TableCell>
                <TableCell><strong>Scope</strong></TableCell>
                <TableCell align="center"><strong>Usage</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {shortKeys.map((shortKey: ShortKey) => (
                <TableRow key={shortKey.id} hover>
                  <TableCell>
                    <Chip
                      label={shortKey.code}
                      color="primary"
                      size="small"
                      sx={{ fontWeight: 'bold', fontFamily: 'monospace' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {shortKey.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 300 }}>
                      {shortKey.description || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={shortKey.medicine_count || shortKey.medicines?.length || 0}
                      size="small"
                      color="info"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {shortKey.is_global ? (
                      <Chip label="Global" size="small" color="success" />
                    ) : (
                      <Chip label="Personal" size="small" />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">{shortKey.usage_count || 0}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleOpenDialog(shortKey)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(shortKey.id, shortKey.code)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <ShortKeyIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Shortcuts Found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {searchQuery ? 'Try a different search term' : 'Click "Create New Shortcut" to get started'}
          </Typography>
          {!searchQuery && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
              Create Your First Shortcut
            </Button>
          )}
        </Paper>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
        <DialogTitle>
          {editingShortKey ? `Edit Shortcut: ${editingShortKey.code}` : 'Create New Shortcut'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {/* Short Key Details */}
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ShortKeyIcon /> Shortcut Details
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Code *"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  helperText="Uppercase, e.g. DAE"
                  inputProps={{ style: { textTransform: 'uppercase' } }}
                />
              </Grid>
              <Grid item xs={12} md={5}>
                <TextField
                  fullWidth
                  label="Name *"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  helperText="e.g. Common Dental Antibiotics"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.is_global}
                      onChange={(e) => setFormData({ ...formData, is_global: e.target.checked })}
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
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Medicine Management */}
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AddIcon /> Add Medicines
            </Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
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
                    <TextField {...params} label="Search Medicine" placeholder="Type to search..." />
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
                  fullWidth
                  label="Dosage"
                  value={newMedicineDefaults.dosage}
                  onChange={(e) =>
                    setNewMedicineDefaults({ ...newMedicineDefaults, dosage: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={6} md={2}>
                <TextField
                  fullWidth
                  label="Frequency"
                  value={newMedicineDefaults.frequency}
                  onChange={(e) =>
                    setNewMedicineDefaults({ ...newMedicineDefaults, frequency: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={6} md={2}>
                <TextField
                  fullWidth
                  label="Duration"
                  value={newMedicineDefaults.duration}
                  onChange={(e) =>
                    setNewMedicineDefaults({ ...newMedicineDefaults, duration: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={6} md={2}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddMedicine}
                  disabled={!selectedMedicine}
                  sx={{ height: '56px' }}
                >
                  Add
                </Button>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Instructions"
                  value={newMedicineDefaults.instructions}
                  onChange={(e) =>
                    setNewMedicineDefaults({ ...newMedicineDefaults, instructions: e.target.value })
                  }
                  placeholder="e.g. After meals"
                  size="small"
                />
              </Grid>
            </Grid>

            {/* Medicine List */}
            {medicines.length > 0 ? (
              <>
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 3, mb: 1 }}>
                  Medicines in this Shortcut ({medicines.length})
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell width="40px"><strong>#</strong></TableCell>
                        <TableCell><strong>Medicine</strong></TableCell>
                        <TableCell><strong>Dosage</strong></TableCell>
                        <TableCell><strong>Frequency</strong></TableCell>
                        <TableCell><strong>Duration</strong></TableCell>
                        <TableCell><strong>Instructions</strong></TableCell>
                        <TableCell width="120px" align="center"><strong>Actions</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {medicines.map((med, index) => (
                        <TableRow key={med.medicine_id}>
                          <TableCell>{med.sequence_order}</TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
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
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Move Up">
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => handleMoveMedicine(index, 'up')}
                                  disabled={index === 0}
                                >
                                  <ArrowUpIcon />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Move Down">
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => handleMoveMedicine(index, 'down')}
                                  disabled={index === medicines.length - 1}
                                >
                                  <ArrowDownIcon />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Remove">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRemoveMedicine(med.medicine_id)}
                              >
                                <CloseIcon />
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
              <Alert severity="info" sx={{ mt: 2 }}>
                No medicines added yet. Search and add medicines to this shortcut.
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} startIcon={<CloseIcon />}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={creating || updating}
            startIcon={<SaveIcon />}
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
