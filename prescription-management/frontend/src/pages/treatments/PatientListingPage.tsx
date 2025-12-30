/**
 * Patient Listing Page - Medical Futurism Design
 * Scalable patient list with advanced filters and search
 * Solid colors only (no gradients), iPad-optimized
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
  Tooltip,
  IconButton,
  Stack,
  Fade,
} from '@mui/material';
import {
  Search as SearchIcon,
  LocalHospital as HospitalIcon,
  CheckCircle as ActiveIcon,
  Task as CompletedIcon,
  Schedule as PlannedIcon,
  GridView as AllIcon,
} from '@mui/icons-material';
import PatientListCard from '../../components/treatments/PatientListCard';
import treatmentService, { PatientSummary } from '../../services/treatmentService';

export const PatientListingPage = () => {
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'planned'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

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
      setTotalPages(response.pagination?.pages || 1);
      setTotalCount(response.pagination?.total || 0);
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

  // Filter button configurations
  const filterButtons = [
    { value: 'all', label: 'All Patients', icon: AllIcon, color: '#667eea' },
    { value: 'active', label: 'Active Treatment', icon: ActiveIcon, color: '#10b981' },
    { value: 'completed', label: 'Completed', icon: CompletedIcon, color: '#3b82f6' },
    { value: 'planned', label: 'Planned', icon: PlannedIcon, color: '#f59e0b' },
  ];

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
      <Fade in timeout={400}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
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
      </Fade>

      {/* Search Panel with Glassmorphism */}
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
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
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
      </Fade>

      {/* Filters Panel */}
      <Fade in timeout={800}>
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
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mb: 1,
              color: 'text.secondary',
              fontWeight: 600,
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Filter by Status
          </Typography>
          <Stack
            direction="row"
            spacing={1}
            sx={{
              flexWrap: 'wrap',
              gap: 1,
            }}
          >
            {filterButtons.map(({ value, label, icon: Icon, color }) => (
              <Tooltip key={value} title={label} arrow placement="top">
                <Button
                  variant={statusFilter === value ? 'contained' : 'outlined'}
                  onClick={() => handleStatusFilterChange(value as any)}
                  startIcon={<Icon sx={{ fontSize: 18 }} />}
                  sx={{
                    minHeight: 44,
                    px: 2,
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    borderRadius: 2,
                    textTransform: 'none',
                    ...(statusFilter === value
                      ? {
                          bgcolor: color,
                          color: 'white',
                          border: 'none',
                          boxShadow: `0 2px 8px ${color}40`,
                          '&:hover': {
                            bgcolor: color,
                            opacity: 0.9,
                          },
                        }
                      : {
                          borderColor: 'rgba(102, 126, 234, 0.3)',
                          color: color,
                          '&:hover': {
                            borderColor: color,
                            background: `${color}10`,
                          },
                        }),
                  }}
                >
                  {label}
                </Button>
              </Tooltip>
            ))}
          </Stack>
        </Paper>
      </Fade>

      {/* Statistics */}
      {!loading && (
        <Fade in timeout={1000}>
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
            Total Patients: <strong>{totalCount}</strong>
            {statusFilter !== 'all' && (
              <>
                {' '}• Status: <strong>{statusFilter}</strong>
              </>
            )}
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
            {searchQuery
              ? 'Try adjusting your search or filters'
              : 'No patients match the selected status'}
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {patients.map((patient, index) => (
            <Fade key={`${patient.patient.mobile_number}-${patient.patient.first_name}`} in timeout={1200 + index * 100}>
              <Box>
                <PatientListCard patient={patient} />
              </Box>
            </Fade>
          ))}
        </Box>
      )}

      {/* Pagination */}
      {!loading && patients.length > 0 && totalPages > 1 && (
        <Fade in timeout={1400}>
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
        </Fade>
      )}
    </Box>
  );
};

export default PatientListingPage;
