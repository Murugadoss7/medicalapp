/**
 * Patient List Panel - Medical Futurism Design
 * Shows patient list with filters and search
 * iPad-friendly: Icon-based filter buttons to prevent overflow
 */

import { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  InputAdornment,
  Stack,
  Paper,
  Tooltip,
  Fade,
} from '@mui/material';
import {
  Search as SearchIcon,
  CheckCircle as ActiveIcon,
  Task as CompletedIcon,
  Schedule as PlannedIcon,
  GridView as AllIcon,
} from '@mui/icons-material';
import { PatientSummary } from '../../services/treatmentService';
import treatmentService from '../../services/treatmentService';
import PatientCard from './PatientCard';

interface PatientListPanelProps {
  onPatientSelect: (patient: PatientSummary) => void;
  selectedPatient: PatientSummary | null;
}

const PatientListPanel = ({ onPatientSelect, selectedPatient }: PatientListPanelProps) => {
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [totalCount, setTotalCount] = useState(0);
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
      console.log('[DEBUG] API Response:', JSON.stringify(response.pagination));
      setPatients(response.patients || []);
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

  // Filter button configurations with icons
  const filterButtons = [
    { value: 'all', label: 'All Patients', icon: AllIcon, color: '#667eea' },
    { value: 'active', label: 'Active Treatment', icon: ActiveIcon, color: '#10b981' },
    { value: 'completed', label: 'Completed', icon: CompletedIcon, color: '#3b82f6' },
    { value: 'planned', label: 'Planned', icon: PlannedIcon, color: '#f59e0b' },
  ];

  return (
    <Paper
      elevation={0}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 4,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(102, 126, 234, 0.15)',
        boxShadow: '0 8px 32px rgba(102, 126, 234, 0.1)',
        overflow: 'hidden',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
        },
      }}
    >
      {/* Header */}
      <Box sx={{ p: 3, pb: 2 }}>
        <Fade in timeout={600}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              mb: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Patients
          </Typography>
        </Fade>

        {/* Search Input */}
        <Fade in timeout={800}>
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
                  <SearchIcon sx={{ color: '#667eea' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                background: 'rgba(102, 126, 234, 0.05)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '& fieldset': {
                  borderColor: 'rgba(102, 126, 234, 0.2)',
                },
                '&:hover fieldset': {
                  borderColor: '#667eea',
                },
                '&.Mui-focused': {
                  background: 'rgba(255, 255, 255, 1)',
                  '& fieldset': {
                    borderColor: '#667eea',
                    borderWidth: 2,
                  },
                  boxShadow: '0 0 0 4px rgba(102, 126, 234, 0.1)',
                },
              },
            }}
          />
        </Fade>

        {/* Status Filter - Icon Buttons (iPad-friendly) */}
        <Fade in timeout={1000}>
          <Box>
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
                flexWrap: 'nowrap',
                overflowX: 'auto',
                pb: 0.5,
                '&::-webkit-scrollbar': {
                  display: 'none',
                },
              }}
            >
              {filterButtons.map(({ value, label, icon: Icon, color }) => (
                <Tooltip key={value} title={label} arrow placement="top">
                  <IconButton
                    onClick={() => handleStatusFilterChange(value as any)}
                    sx={{
                      minWidth: { xs: 48, sm: 52 },
                      minHeight: { xs: 48, sm: 52 },
                      borderRadius: 3,
                      background:
                        statusFilter === value
                          ? `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`
                          : 'rgba(102, 126, 234, 0.05)',
                      border: '2px solid',
                      borderColor:
                        statusFilter === value ? 'transparent' : 'rgba(102, 126, 234, 0.15)',
                      boxShadow:
                        statusFilter === value
                          ? `0 4px 16px ${color}40`
                          : '0 2px 8px rgba(0, 0, 0, 0.04)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: `0 6px 20px ${color}30`,
                        background:
                          statusFilter === value
                            ? `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`
                            : 'rgba(102, 126, 234, 0.1)',
                      },
                      '&:active': {
                        transform: 'translateY(0)',
                      },
                    }}
                  >
                    <Icon
                      sx={{
                        fontSize: { xs: 20, sm: 22 },
                        color: statusFilter === value ? 'white' : color,
                      }}
                    />
                  </IconButton>
                </Tooltip>
              ))}
            </Stack>
          </Box>
        </Fade>
      </Box>

      {/* Patient List */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          px: 3,
          pb: 3,
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(102, 126, 234, 0.05)',
            borderRadius: 10,
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
            borderRadius: 10,
            '&:hover': {
              background: 'linear-gradient(180deg, #5568d3 0%, #66348a 100%)',
            },
          },
        }}
      >
        {loading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '200px',
            }}
          >
            <CircularProgress
              sx={{
                color: '#667eea',
              }}
            />
          </Box>
        ) : error ? (
          <Alert
            severity="error"
            sx={{
              borderRadius: 3,
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)',
            }}
          >
            {error}
          </Alert>
        ) : patients.length === 0 ? (
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                color: 'text.secondary',
                mb: 1,
              }}
            >
              No patients found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your filters or search query
            </Typography>
          </Box>
        ) : (
          <Stack spacing={2}>
            {patients.map((patient, index) => (
              <Fade key={`${patient.patient.mobile_number}-${patient.patient.first_name}`} in timeout={1200 + index * 100}>
                <Box>
                  <PatientCard
                    patient={patient}
                    isSelected={
                      selectedPatient?.patient.mobile_number === patient.patient.mobile_number &&
                      selectedPatient?.patient.first_name === patient.patient.first_name
                    }
                    onClick={() => onPatientSelect(patient)}
                  />
                </Box>
              </Fade>
            ))}
          </Stack>
        )}
      </Box>

      {/* Patient Count Footer */}
      {!loading && patients.length > 0 && (
        <Box
          sx={{
            px: 3,
            py: 2,
            borderTop: '1px solid rgba(102, 126, 234, 0.15)',
            background: 'rgba(102, 126, 234, 0.03)',
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontWeight: 600,
              fontSize: '0.8125rem',
            }}
          >
            Total Patients: {totalCount}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default PatientListPanel;
