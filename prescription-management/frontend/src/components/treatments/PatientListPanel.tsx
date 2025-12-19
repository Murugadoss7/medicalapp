/**
 * Patient List Panel - Left Side (35%)
 * Shows patient list with filters and search
 * iPad-friendly: Button groups instead of dropdowns
 */

import { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  Button,
  ButtonGroup,
  InputAdornment,
  Chip,
  Stack,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { PatientSummary } from '../../services/treatmentService';
import treatmentService from '../../services/treatmentService';
import PatientCard from './PatientCard';

interface PatientListPanelProps {
  onPatientSelect: (patient: PatientSummary) => void;
  selectedPatient: PatientSummary | null;
}

const PatientListPanel = ({ onPatientSelect, selectedPatient }: PatientListPanelProps) => {
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'planned'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  // Load patients
  useEffect(() => {
    loadPatients();
  }, [statusFilter, page]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        page,
        per_page: 20,
      };

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await treatmentService.fetchPatients(params);
      setPatients(response.patients || []);
    } catch (err: any) {
      console.error('Error loading patients:', err);
      setError(err.response?.data?.detail || 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1); // Reset to page 1 on search
    loadPatients();
  };

  const handleStatusFilterChange = (status: 'all' | 'active' | 'completed' | 'planned') => {
    setStatusFilter(status);
    setPage(1); // Reset to page 1
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" gutterBottom>
          Patients
        </Typography>

        {/* Search Input */}
        <TextField
          fullWidth
          size="small"
          placeholder="Search by name or mobile..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        {/* Status Filter - Button Group (iPad-friendly) */}
        <Box sx={{ mb: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            Treatment Status
          </Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
            <Button
              size="small"
              variant={statusFilter === 'all' ? 'contained' : 'outlined'}
              onClick={() => handleStatusFilterChange('all')}
              sx={{ minHeight: 44 }} // iPad-friendly touch target
            >
              All
            </Button>
            <Button
              size="small"
              variant={statusFilter === 'active' ? 'contained' : 'outlined'}
              onClick={() => handleStatusFilterChange('active')}
              sx={{ minHeight: 44 }}
            >
              Active
            </Button>
            <Button
              size="small"
              variant={statusFilter === 'completed' ? 'contained' : 'outlined'}
              onClick={() => handleStatusFilterChange('completed')}
              sx={{ minHeight: 44 }}
            >
              Completed
            </Button>
            <Button
              size="small"
              variant={statusFilter === 'planned' ? 'contained' : 'outlined'}
              onClick={() => handleStatusFilterChange('planned')}
              sx={{ minHeight: 44 }}
            >
              Planned
            </Button>
          </Stack>
        </Box>
      </Box>

      {/* Patient List */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : patients.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              No patients found
            </Typography>
          </Box>
        ) : (
          <Stack spacing={2}>
            {patients.map((patient) => (
              <PatientCard
                key={`${patient.patient.mobile_number}-${patient.patient.first_name}`}
                patient={patient}
                isSelected={
                  selectedPatient?.patient.mobile_number === patient.patient.mobile_number &&
                  selectedPatient?.patient.first_name === patient.patient.first_name
                }
                onClick={() => onPatientSelect(patient)}
              />
            ))}
          </Stack>
        )}
      </Box>

      {/* Patient Count */}
      {!loading && patients.length > 0 && (
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary">
            Showing {patients.length} patient{patients.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default PatientListPanel;
