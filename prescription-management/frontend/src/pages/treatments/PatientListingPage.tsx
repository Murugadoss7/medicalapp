/**
 * Patient Listing Page - Medical Futurism Design
 * Right side panel drawer filters for treatment management
 * iPad-optimized with active filter chips display
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Paper,
  CircularProgress,
  Alert,
  Pagination,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Chip,
  Drawer,
  IconButton,
  Stack,
  Fade,
  Divider,
  Grid,
} from '@mui/material';
import {
  Search as SearchIcon,
  LocalHospital as HospitalIcon,
  FilterList as FilterIcon,
  Close as CloseIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import PatientListCard from '../../components/treatments/PatientListCard';
import treatmentService, { PatientSummary } from '../../services/treatmentService';

// Date range preset options
const getDatePresets = () => {
  const today = new Date();
  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  return {
    today: {
      label: 'Today',
      from: formatDate(today),
      to: formatDate(today),
    },
    thisWeek: {
      label: 'This Week',
      from: formatDate(new Date(today.setDate(today.getDate() - today.getDay()))),
      to: formatDate(new Date(today.setDate(today.getDate() - today.getDay() + 6))),
    },
    thisMonth: {
      label: 'This Month',
      from: formatDate(new Date(today.getFullYear(), today.getMonth(), 1)),
      to: formatDate(new Date(today.getFullYear(), today.getMonth() + 1, 0)),
    },
  };
};

export const PatientListingPage = () => {
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Side drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Filter states
  const [treatmentFilters, setTreatmentFilters] = useState({
    procedures: false,
    observations: false,
  });

  const [statusFilters, setStatusFilters] = useState({
    scheduled: false,
    in_progress: false,
    completed: false,
    cancelled: false,
  });

  const [datePreset, setDatePreset] = useState<'today' | 'thisWeek' | 'thisMonth' | 'custom' | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Search and pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const datePresets = getDatePresets();

  // Load patients
  useEffect(() => {
    loadPatients();
  }, [page]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        page,
        per_page: 20,
      };

      // Build treatment_types parameter
      const selectedTypes = [];
      if (treatmentFilters.procedures) selectedTypes.push('procedures');
      if (treatmentFilters.observations) selectedTypes.push('observations');

      if (selectedTypes.length > 0) {
        params.treatment_types = selectedTypes.join(',');
      }

      // Build statuses parameter
      const selectedStatuses = [];
      if (statusFilters.scheduled) selectedStatuses.push('scheduled');
      if (statusFilters.in_progress) selectedStatuses.push('in_progress');
      if (statusFilters.completed) selectedStatuses.push('completed');
      if (statusFilters.cancelled) selectedStatuses.push('cancelled');

      if (selectedStatuses.length > 0) {
        params.statuses = selectedStatuses.join(',');
      }

      // Date range
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      // Search
      if (searchQuery) params.search = searchQuery;

      const response = await treatmentService.fetchPatients(params);
      setPatients(response.patients || []);
      setTotalPages(response.pagination?.pages || 1);
      setTotalCount(response.pagination?.total || 0);
    } catch (err: any) {
      console.error('Error loading patients:', err);
      setError(err.response?.data?.detail || 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setPage(1);
    loadPatients();
    setDrawerOpen(false); // Close drawer after applying
  };

  const handleClearFilters = () => {
    setTreatmentFilters({
      procedures: false,
      observations: false,
    });
    setStatusFilters({
      scheduled: false,
      in_progress: false,
      completed: false,
      cancelled: false,
    });
    setDatePreset(null);
    setDateFrom('');
    setDateTo('');
    setSearchQuery('');
    setPage(1);
    setTimeout(loadPatients, 100);
  };

  const handleTreatmentFilterChange = (filter: string) => {
    setTreatmentFilters({
      ...treatmentFilters,
      [filter]: !treatmentFilters[filter as keyof typeof treatmentFilters],
    });
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilters({
      ...statusFilters,
      [status]: !statusFilters[status as keyof typeof statusFilters],
    });
  };

  const handleDatePreset = (preset: 'today' | 'thisWeek' | 'thisMonth') => {
    setDatePreset(preset);
    const presetData = datePresets[preset];
    setDateFrom(presetData.from);
    setDateTo(presetData.to);
  };

  const handleCustomDate = () => {
    setDatePreset('custom');
  };

  const handleRemoveFilter = (filterType: 'treatment' | 'status' | 'date', filterKey?: string) => {
    if (filterType === 'treatment' && filterKey) {
      setTreatmentFilters({ ...treatmentFilters, [filterKey]: false });
    } else if (filterType === 'status' && filterKey) {
      setStatusFilters({ ...statusFilters, [filterKey]: false });
    } else if (filterType === 'date') {
      setDatePreset(null);
      setDateFrom('');
      setDateTo('');
    }
    setTimeout(() => {
      setPage(1);
      loadPatients();
    }, 100);
  };

  // Count active filters
  const activeFilterCount =
    Object.values(treatmentFilters).filter(Boolean).length +
    Object.values(statusFilters).filter(Boolean).length +
    (dateFrom || dateTo ? 1 : 0);

  // Get active filter labels for chips
  const getActiveFilters = () => {
    const filters: Array<{ type: 'treatment' | 'status' | 'date'; key?: string; label: string }> = [];

    if (treatmentFilters.procedures) filters.push({ type: 'treatment', key: 'procedures', label: 'Procedures' });
    if (treatmentFilters.observations) filters.push({ type: 'treatment', key: 'observations', label: 'Observations' });

    if (statusFilters.scheduled) filters.push({ type: 'status', key: 'scheduled', label: 'Scheduled' });
    if (statusFilters.in_progress) filters.push({ type: 'status', key: 'in_progress', label: 'In Progress' });
    if (statusFilters.completed) filters.push({ type: 'status', key: 'completed', label: 'Completed' });
    if (statusFilters.cancelled) filters.push({ type: 'status', key: 'cancelled', label: 'Cancelled' });

    if (dateFrom || dateTo) {
      const dateLabel = datePreset && datePreset !== 'custom'
        ? datePresets[datePreset].label
        : `${dateFrom || '...'} to ${dateTo || '...'}`;
      filters.push({ type: 'date', label: dateLabel });
    }

    return filters;
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100%' }}>
      {/* Side Filter Drawer - RIGHT SIDE */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '85%', sm: 360 },
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(10px)',
            borderLeft: '1px solid rgba(102, 126, 234, 0.15)',
          },
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Drawer Header */}
          <Box
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(102, 126, 234, 0.1)',
              background: '#667eea',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterIcon sx={{ color: 'white', fontSize: 20 }} />
              <Typography sx={{ fontWeight: 700, color: 'white', fontSize: '1rem' }}>
                Filters
              </Typography>
              {activeFilterCount > 0 && (
                <Chip
                  label={activeFilterCount}
                  size="small"
                  sx={{
                    height: 24,
                    bgcolor: 'white',
                    color: '#667eea',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                  }}
                />
              )}
            </Box>
            <IconButton
              onClick={() => setDrawerOpen(false)}
              sx={{
                color: 'white',
                minWidth: 44,
                minHeight: 44,
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Drawer Content - Scrollable */}
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              p: 2,
              '&::-webkit-scrollbar': { width: '6px' },
              '&::-webkit-scrollbar-track': { background: 'rgba(102, 126, 234, 0.05)', borderRadius: 10 },
              '&::-webkit-scrollbar-thumb': { background: '#667eea', borderRadius: 10 },
            }}
          >
            {/* Treatment Type Filters - TWO COLUMNS */}
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  mb: 1.5,
                  color: 'text.secondary',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                📋 Treatment Type
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={treatmentFilters.procedures}
                        onChange={() => handleTreatmentFilterChange('procedures')}
                        sx={{
                          color: '#667eea',
                          '&.Mui-checked': { color: '#667eea' },
                          '& .MuiSvgIcon-root': { fontSize: 20 },
                        }}
                      />
                    }
                    label="Procedures"
                    sx={{
                      '& .MuiFormControlLabel-label': { fontSize: '0.875rem', fontWeight: 500 },
                      minHeight: 44,
                      m: 0,
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={treatmentFilters.observations}
                        onChange={() => handleTreatmentFilterChange('observations')}
                        sx={{
                          color: '#667eea',
                          '&.Mui-checked': { color: '#667eea' },
                          '& .MuiSvgIcon-root': { fontSize: 20 },
                        }}
                      />
                    }
                    label="Observations"
                    sx={{
                      '& .MuiFormControlLabel-label': { fontSize: '0.875rem', fontWeight: 500 },
                      minHeight: 44,
                      m: 0,
                    }}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 2, borderColor: 'rgba(102, 126, 234, 0.1)' }} />

            {/* Status Filters - TWO COLUMNS */}
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  mb: 1.5,
                  color: 'text.secondary',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                📊 Status
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={statusFilters.scheduled}
                        onChange={() => handleStatusFilterChange('scheduled')}
                        sx={{
                          color: '#667eea',
                          '&.Mui-checked': { color: '#667eea' },
                          '& .MuiSvgIcon-root': { fontSize: 20 },
                        }}
                      />
                    }
                    label={
                      <Box>
                        <Typography sx={{ fontSize: '0.875rem', fontWeight: 500 }}>Scheduled</Typography>
                        <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary' }}>
                          Appointments
                        </Typography>
                      </Box>
                    }
                    sx={{ minHeight: 44, alignItems: 'flex-start', m: 0 }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={statusFilters.in_progress}
                        onChange={() => handleStatusFilterChange('in_progress')}
                        sx={{
                          color: '#667eea',
                          '&.Mui-checked': { color: '#667eea' },
                          '& .MuiSvgIcon-root': { fontSize: 20 },
                        }}
                      />
                    }
                    label={
                      <Box>
                        <Typography sx={{ fontSize: '0.875rem', fontWeight: 500 }}>In Progress</Typography>
                        <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary' }}>
                          Appointments
                        </Typography>
                      </Box>
                    }
                    sx={{ minHeight: 44, alignItems: 'flex-start', m: 0 }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={statusFilters.completed}
                        onChange={() => handleStatusFilterChange('completed')}
                        sx={{
                          color: '#667eea',
                          '&.Mui-checked': { color: '#667eea' },
                          '& .MuiSvgIcon-root': { fontSize: 20 },
                        }}
                      />
                    }
                    label={
                      <Box>
                        <Typography sx={{ fontSize: '0.875rem', fontWeight: 500 }}>Completed</Typography>
                        <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary' }}>
                          Both
                        </Typography>
                      </Box>
                    }
                    sx={{ minHeight: 44, alignItems: 'flex-start', m: 0 }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={statusFilters.cancelled}
                        onChange={() => handleStatusFilterChange('cancelled')}
                        sx={{
                          color: '#667eea',
                          '&.Mui-checked': { color: '#667eea' },
                          '& .MuiSvgIcon-root': { fontSize: 20 },
                        }}
                      />
                    }
                    label={
                      <Box>
                        <Typography sx={{ fontSize: '0.875rem', fontWeight: 500 }}>Cancelled</Typography>
                        <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary' }}>
                          Both
                        </Typography>
                      </Box>
                    }
                    sx={{ minHeight: 44, alignItems: 'flex-start', m: 0 }}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 2, borderColor: 'rgba(102, 126, 234, 0.1)' }} />

            {/* Date Range Filters */}
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  mb: 1.5,
                  color: 'text.secondary',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                📅 Date Range
              </Typography>
              <Grid container spacing={1} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <Button
                    variant={datePreset === 'today' ? 'contained' : 'outlined'}
                    onClick={() => handleDatePreset('today')}
                    fullWidth
                    sx={{
                      minHeight: 44,
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      borderRadius: 2,
                      textTransform: 'none',
                      ...(datePreset === 'today'
                        ? {
                            bgcolor: '#667eea',
                            color: 'white',
                            border: 'none',
                            boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                            '&:hover': { bgcolor: '#5568d3' },
                          }
                        : {
                            borderColor: 'rgba(102, 126, 234, 0.3)',
                            color: '#667eea',
                            '&:hover': { borderColor: '#667eea', background: 'rgba(102, 126, 234, 0.05)' },
                          }),
                    }}
                  >
                    Today
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    variant={datePreset === 'thisWeek' ? 'contained' : 'outlined'}
                    onClick={() => handleDatePreset('thisWeek')}
                    fullWidth
                    sx={{
                      minHeight: 44,
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      borderRadius: 2,
                      textTransform: 'none',
                      ...(datePreset === 'thisWeek'
                        ? {
                            bgcolor: '#667eea',
                            color: 'white',
                            border: 'none',
                            boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                            '&:hover': { bgcolor: '#5568d3' },
                          }
                        : {
                            borderColor: 'rgba(102, 126, 234, 0.3)',
                            color: '#667eea',
                            '&:hover': { borderColor: '#667eea', background: 'rgba(102, 126, 234, 0.05)' },
                          }),
                    }}
                  >
                    This Week
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    variant={datePreset === 'thisMonth' ? 'contained' : 'outlined'}
                    onClick={() => handleDatePreset('thisMonth')}
                    fullWidth
                    sx={{
                      minHeight: 44,
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      borderRadius: 2,
                      textTransform: 'none',
                      ...(datePreset === 'thisMonth'
                        ? {
                            bgcolor: '#667eea',
                            color: 'white',
                            border: 'none',
                            boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                            '&:hover': { bgcolor: '#5568d3' },
                          }
                        : {
                            borderColor: 'rgba(102, 126, 234, 0.3)',
                            color: '#667eea',
                            '&:hover': { borderColor: '#667eea', background: 'rgba(102, 126, 234, 0.05)' },
                          }),
                    }}
                  >
                    This Month
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    variant={datePreset === 'custom' ? 'contained' : 'outlined'}
                    onClick={handleCustomDate}
                    fullWidth
                    sx={{
                      minHeight: 44,
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      borderRadius: 2,
                      textTransform: 'none',
                      ...(datePreset === 'custom'
                        ? {
                            bgcolor: '#667eea',
                            color: 'white',
                            border: 'none',
                            boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                            '&:hover': { bgcolor: '#5568d3' },
                          }
                        : {
                            borderColor: 'rgba(102, 126, 234, 0.3)',
                            color: '#667eea',
                            '&:hover': { borderColor: '#667eea', background: 'rgba(102, 126, 234, 0.05)' },
                          }),
                    }}
                  >
                    Custom
                  </Button>
                </Grid>
              </Grid>
              <Stack spacing={2}>
                <TextField
                  type="date"
                  label="From"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setDatePreset('custom');
                  }}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      minHeight: 48,
                      borderRadius: 2,
                      '& fieldset': { borderColor: 'rgba(102, 126, 234, 0.2)' },
                      '&:hover fieldset': { borderColor: '#667eea' },
                      '&.Mui-focused fieldset': { borderColor: '#667eea', borderWidth: 2 },
                    },
                  }}
                />
                <TextField
                  type="date"
                  label="To"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setDatePreset('custom');
                  }}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      minHeight: 48,
                      borderRadius: 2,
                      '& fieldset': { borderColor: 'rgba(102, 126, 234, 0.2)' },
                      '&:hover fieldset': { borderColor: '#667eea' },
                      '&.Mui-focused fieldset': { borderColor: '#667eea', borderWidth: 2 },
                    },
                  }}
                />
              </Stack>
            </Box>
          </Box>

          {/* Drawer Footer - Action Buttons */}
          <Box
            sx={{
              p: 2,
              borderTop: '1px solid rgba(102, 126, 234, 0.1)',
              background: 'rgba(255, 255, 255, 0.95)',
            }}
          >
            <Stack spacing={1.5}>
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={handleClearFilters}
                fullWidth
                sx={{
                  minHeight: 48,
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  borderRadius: 2,
                  textTransform: 'none',
                  borderColor: 'rgba(102, 126, 234, 0.3)',
                  color: '#667eea',
                  '&:hover': {
                    borderColor: '#667eea',
                    background: 'rgba(102, 126, 234, 0.05)',
                  },
                }}
              >
                Clear All
              </Button>
              <Button
                variant="contained"
                onClick={handleApplyFilters}
                fullWidth
                sx={{
                  minHeight: 48,
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  borderRadius: 2,
                  textTransform: 'none',
                  bgcolor: '#667eea',
                  boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                  '&:hover': {
                    bgcolor: '#5568d3',
                  },
                }}
              >
                Apply Filters {totalCount > 0 && `(${totalCount})`}
              </Button>
            </Stack>
          </Box>
        </Box>
      </Drawer>

      {/* Main Content Area */}
      <Box
        sx={{
          flex: 1,
          py: 2,
          px: { xs: 2, sm: 3 },
          '&::-webkit-scrollbar': { width: '6px' },
          '&::-webkit-scrollbar-track': { background: 'rgba(102, 126, 234, 0.05)', borderRadius: 10 },
          '&::-webkit-scrollbar-thumb': { background: '#667eea', borderRadius: 10, '&:hover': { background: '#5568d3' } },
        }}
      >
        {/* Header */}
        <Fade in timeout={400}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
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
                <HospitalIcon sx={{ fontSize: 24, color: 'white' }} />
              </Box>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: '1.25rem', sm: '1.5rem' },
                  color: '#667eea',
                }}
              >
                Treatment Management
              </Typography>
            </Box>

            {/* Filter Button */}
            <Button
              variant="contained"
              startIcon={<FilterIcon />}
              onClick={() => setDrawerOpen(true)}
              sx={{
                minHeight: 48,
                px: 3,
                fontSize: '0.875rem',
                fontWeight: 700,
                borderRadius: 2,
                textTransform: 'none',
                bgcolor: '#667eea',
                boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                '&:hover': { bgcolor: '#5568d3' },
                position: 'relative',
              }}
            >
              Filters
              {activeFilterCount > 0 && (
                <Chip
                  label={activeFilterCount}
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    height: 20,
                    minWidth: 20,
                    bgcolor: '#f59e0b',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '0.6875rem',
                    '& .MuiChip-label': { px: 0.75 },
                  }}
                />
              )}
            </Button>
          </Box>
        </Fade>

        {/* Search Bar */}
        <Fade in timeout={600}>
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
              placeholder="Search by name, mobile, or tooth number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  setPage(1);
                  loadPatients();
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#667eea' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  minHeight: 48,
                  borderRadius: 2,
                  '& fieldset': { borderColor: 'rgba(102, 126, 234, 0.2)' },
                  '&:hover fieldset': { borderColor: '#667eea' },
                  '&.Mui-focused fieldset': { borderColor: '#667eea', borderWidth: 2 },
                },
              }}
            />
          </Paper>
        </Fade>

        {/* Active Filter Chips */}
        {activeFilterCount > 0 && (
          <Fade in timeout={700}>
            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                mb: 2,
                borderRadius: 2,
                background: 'rgba(102, 126, 234, 0.05)',
                border: '1px solid rgba(102, 126, 234, 0.15)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#667eea', mr: 1 }}>
                  Active Filters:
                </Typography>
                {getActiveFilters().map((filter, index) => (
                  <Chip
                    key={index}
                    label={filter.label}
                    onDelete={() => handleRemoveFilter(filter.type, filter.key)}
                    deleteIcon={<CloseIcon sx={{ fontSize: 16 }} />}
                    sx={{
                      height: 32,
                      bgcolor: '#667eea',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '0.8125rem',
                      '& .MuiChip-deleteIcon': {
                        color: 'rgba(255, 255, 255, 0.7)',
                        '&:hover': { color: 'white' },
                      },
                    }}
                  />
                ))}
                <Button
                  size="small"
                  onClick={handleClearFilters}
                  startIcon={<ClearIcon sx={{ fontSize: 16 }} />}
                  sx={{
                    minHeight: 32,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#667eea',
                    textTransform: 'none',
                    '&:hover': { background: 'rgba(102, 126, 234, 0.1)' },
                  }}
                >
                  Clear All
                </Button>
              </Box>
            </Paper>
          </Fade>
        )}

        {/* Results Info */}
        {!loading && (
          <Fade in timeout={800}>
            <Alert
              severity="info"
              sx={{
                mb: 2,
                borderRadius: 2,
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                '& .MuiAlert-icon': { color: '#3b82f6' },
              }}
            >
              Showing <strong>{patients.length}</strong> of <strong>{totalCount}</strong> patients
              {' '}• Page <strong>{page}</strong> of <strong>{totalPages}</strong>
            </Alert>
          </Fade>
        )}

        {/* Patient Cards */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#667eea' }} />
          </Box>
        ) : error ? (
          <Alert
            severity="error"
            sx={{
              borderRadius: 2,
              boxShadow: '0 2px 12px rgba(239, 68, 68, 0.15)',
            }}
          >
            {error}
          </Alert>
        ) : patients.length === 0 ? (
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
              <HospitalIcon sx={{ fontSize: 40, color: '#667eea' }} />
            </Box>
            <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1, fontWeight: 600 }}>
              No Patients Found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {activeFilterCount > 0
                ? 'Try adjusting your filters or search query'
                : 'No patients in the system yet'}
            </Typography>
          </Paper>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {patients.map((patient, index) => (
              <Fade key={`${patient.patient.mobile_number}-${patient.patient.first_name}`} in timeout={1000 + index * 100}>
                <Box>
                  <PatientListCard patient={patient} />
                </Box>
              </Fade>
            ))}
          </Box>
        )}

        {/* Pagination */}
        {!loading && patients.length > 0 && totalPages > 1 && (
          <Fade in timeout={1200}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => setPage(value)}
                sx={{
                  '& .MuiPaginationItem-root': {
                    color: '#667eea',
                    minWidth: 44,
                    minHeight: 44,
                    '&.Mui-selected': {
                      bgcolor: '#667eea',
                      color: 'white',
                      '&:hover': { bgcolor: '#5568d3' },
                    },
                    '&:hover': { bgcolor: 'rgba(102, 126, 234, 0.1)' },
                  },
                }}
              />
            </Box>
          </Fade>
        )}
      </Box>
    </Box>
  );
};

export default PatientListingPage;
