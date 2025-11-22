/**
 * Medicine Catalog Page
 * Complete medicine management with CRUD operations
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
  Pagination,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  LocalPharmacy as PharmacyIcon,
} from '@mui/icons-material';
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
      alert('Brand name is required');
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
        alert('Medicine updated successfully!');
      } else {
        await createMedicine(medicineData).unwrap();
        alert('Medicine created successfully!');
      }
      handleCloseDialog();
      refetch();
    } catch (error: any) {
      console.error('Medicine save error:', error);
      alert(error?.data?.detail || 'Failed to save medicine');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        await deleteMedicine(id).unwrap();
        alert('Medicine deleted successfully!');
        refetch();
      } catch (error: any) {
        alert(error?.data?.detail || 'Failed to delete medicine');
      }
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <PharmacyIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Medicine Catalog
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Medicine
        </Button>
      </Box>

      {/* Search */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search medicines by name, category, manufacturer..."
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
      {medicinesData && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Total Medicines: {medicinesData.total} | Page {medicinesData.page} of {medicinesData.total_pages}
        </Alert>
      )}

      {/* Medicine Table */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : medicinesData && medicinesData.medicines.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Generic Name</strong></TableCell>
                <TableCell><strong>Brand</strong></TableCell>
                <TableCell><strong>Category</strong></TableCell>
                <TableCell><strong>Form</strong></TableCell>
                <TableCell><strong>Strength</strong></TableCell>
                <TableCell align="right"><strong>Price</strong></TableCell>
                <TableCell align="right"><strong>Stock</strong></TableCell>
                <TableCell><strong>Rx</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {medicinesData.medicines.map((medicine) => (
                <TableRow key={medicine.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {medicine.generic_name || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>{medicine.name || '-'}</TableCell>
                  <TableCell>
                    {medicine.drug_category && (
                      <Chip label={medicine.drug_category} size="small" color="primary" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell>{medicine.dosage_forms?.[0] || '-'}</TableCell>
                  <TableCell>{medicine.strength || '-'}</TableCell>
                  <TableCell align="right">
                    {medicine.price ? `₹${medicine.price.toFixed(2)}` : '-'}
                  </TableCell>
                  <TableCell align="right">
                    <Chip
                      label="N/A"
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {medicine.requires_prescription ? (
                      <Chip label="Yes" size="small" color="warning" />
                    ) : (
                      <Chip label="No" size="small" />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleOpenDialog(medicine)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(medicine.id, medicine.name)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <PharmacyIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Medicines Found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {searchQuery ? 'Try a different search term' : 'Click "Add Medicine" to get started'}
          </Typography>
          {!searchQuery && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
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
            color="primary"
          />
        </Box>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingMedicine ? 'Edit Medicine' : 'Add New Medicine'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Brand Name *"
                  value={formData.brand_name}
                  onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                  helperText="Required - Medicine brand/trade name"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Generic Name"
                  value={formData.generic_name}
                  onChange={(e) => setFormData({ ...formData, generic_name: e.target.value })}
                  helperText="Optional - Scientific/generic name"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Manufacturer"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Antibiotic, Analgesic"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Dosage Form"
                  value={formData.dosage_form}
                  onChange={(e) => setFormData({ ...formData, dosage_form: e.target.value })}
                  placeholder="e.g., Tablet, Syrup"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Strength"
                  value={formData.strength}
                  onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                  placeholder="e.g., 500mg, 10ml"
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
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.requires_prescription}
                      onChange={(e) => setFormData({ ...formData, requires_prescription: e.target.checked })}
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
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={creating || updating}
          >
            {creating || updating ? 'Saving...' : editingMedicine ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
