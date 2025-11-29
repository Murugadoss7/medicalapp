import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  InputAdornment,
  Pagination,
  IconButton,
  Tooltip,
  MenuItem,
  Slider,
  Container,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  LocalHospital as DoctorIcon,
  Schedule as ScheduleIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useListDoctorsQuery, useGetCurrentUserQuery, type DoctorSearchParams } from '../../store/api';

const specializations = [
  'All Specializations',
  'General Practice',
  'Cardiology',
  'Dermatology',
  'Emergency Medicine',
  'Endocrinology',
  'Family Medicine',
  'Gastroenterology',
  'Internal Medicine',
  'Neurology',
  'Obstetrics & Gynecology',
  'Ophthalmology',
  'Orthopedics',
  'Pediatrics',
  'Psychiatry',
  'Radiology',
  'Surgery',
  'Urology',
  'Other'
];

// Helper function for specialization colors
const getSpecializationColor = (spec: string) => {
  const colors = [
    'default', 'primary', 'secondary', 'success', 'error', 'info', 'warning'
  ];
  const index = specializations.indexOf(spec) % colors.length;
  return colors[index];
};

export const DoctorSearch = () => {
  const navigate = useNavigate();
  const { data: currentUser } = useGetCurrentUserQuery();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [specialization, setSpecialization] = useState('All Specializations');
  const [experienceRange, setExperienceRange] = useState<number[]>([0, 50]);
  const [isActiveOnly, setIsActiveOnly] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Build search parameters
  const searchParams: DoctorSearchParams = {
    query: searchQuery.length >= 2 ? searchQuery : undefined,
    specialization: specialization !== 'All Specializations' ? specialization : undefined,
    min_experience: experienceRange[0] > 0 ? experienceRange[0] : undefined,
    is_active: isActiveOnly,
    page,
    per_page: pageSize,
  };

  // Load doctors with search and pagination
  const {
    data: doctorsData,
    isLoading,
    error,
  } = useListDoctorsQuery(searchParams);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPage(1); // Reset to first page when searching
  };

  const handleSpecializationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSpecialization(event.target.value);
    setPage(1);
  };

  const handleExperienceChange = (event: Event, newValue: number | number[]) => {
    setExperienceRange(newValue as number[]);
    setPage(1);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSpecialization('All Specializations');
    setExperienceRange([0, 50]);
    setPage(1);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const formatExperience = (years: number) => {
    if (years === 0) return 'New';
    if (years === 1) return '1 year';
    return `${years} years`;
  };


  // Check if user can create doctors (admin only)
  const canCreateDoctor = currentUser?.role === 'admin';

  return (
    <Container maxWidth="lg" disableGutters sx={{ mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <DoctorIcon sx={{ mr: 1, fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Doctor Management
          </Typography>
        </Box>
        {canCreateDoctor && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/doctors/register')}
            size="large"
          >
            Register New Doctor
          </Button>
        )}
      </Box>

      {/* Search and Filter Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Search & Filter Doctors
        </Typography>
        
        <Grid container spacing={3}>
          {/* Search Field */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search by name or license number..."
              value={searchQuery}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setSearchQuery('')} size="small">
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Specialization Filter */}
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              select
              label="Specialization"
              value={specialization}
              onChange={handleSpecializationChange}
            >
              {specializations.map((spec) => (
                <MenuItem key={spec} value={spec}>
                  {spec}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Experience Range */}
          <Grid item xs={12} md={3}>
            <Typography gutterBottom>
              Experience: {formatExperience(experienceRange[0])} - {formatExperience(experienceRange[1])}
            </Typography>
            <Slider
              value={experienceRange}
              onChange={handleExperienceChange}
              valueLabelDisplay="auto"
              min={0}
              max={50}
              marks={[
                { value: 0, label: '0' },
                { value: 10, label: '10' },
                { value: 25, label: '25' },
                { value: 50, label: '50+' }
              ]}
            />
          </Grid>

          {/* Clear Filters */}
          <Grid item xs={12} md={2}>
            <Button
              variant="outlined"
              onClick={clearFilters}
              fullWidth
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Enter at least 2 characters for name search
        </Typography>
      </Paper>

      {/* Results Section */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            {searchQuery || specialization !== 'All Specializations' || experienceRange[0] > 0 
              ? 'Search Results' : 'All Doctors'}
          </Typography>
          {doctorsData && (
            <Typography variant="body2" color="text.secondary">
              {doctorsData.total} doctors found
            </Typography>
          )}
        </Box>

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to load doctors. Please try again.
          </Alert>
        )}

        {doctorsData && doctorsData.doctors.length === 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {searchQuery || specialization !== 'All Specializations' 
              ? 'No doctors found matching your criteria.' 
              : 'No doctors registered yet.'}
          </Alert>
        )}

        {doctorsData && doctorsData.doctors.length > 0 && (
          <>
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              '& > *:not(:last-child)': {
                borderBottom: '1px solid',
                borderColor: 'divider'
              }
            }}>
              {doctorsData.doctors.map((doctor) => {
                const canEdit = currentUser?.role === 'admin' ||
                  (currentUser?.role === 'doctor' && doctor.user_id === currentUser?.id);

                return (
                  <Box
                    key={doctor.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      py: 1.5,
                      px: 2,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        bgcolor: 'action.hover',
                        transform: 'translateX(4px)',
                      }
                    }}
                    onClick={() => navigate(`/doctors/${doctor.id}`)}
                  >
                    {/* Left Section - Name and Specialization */}
                    <Box sx={{ flex: '1 1 30%', minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            lineHeight: 1.3,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {doctor.full_name || `Dr. ${doctor.first_name} ${doctor.last_name}`}
                        </Typography>
                        {doctor.is_active && (
                          <Chip
                            label="Active"
                            size="small"
                            color="success"
                            sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600 }}
                          />
                        )}
                      </Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          fontSize: '0.75rem',
                          lineHeight: 1.3,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {doctor.specialization || 'General Practice'} • {doctor.license_number}
                      </Typography>
                    </Box>

                    {/* Middle Section - Compact Info */}
                    <Box sx={{
                      display: 'flex',
                      gap: 2,
                      flex: '0 0 auto',
                      alignItems: 'center'
                    }}>
                      <Box sx={{ minWidth: 80 }}>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.7rem', lineHeight: 1.2 }}>
                          Experience
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
                          {doctor.experience_years !== undefined
                            ? `${doctor.experience_years}y`
                            : 'N/A'}
                        </Typography>
                      </Box>

                      {doctor.phone && (
                        <Box sx={{ minWidth: 100 }}>
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.7rem', lineHeight: 1.2 }}>
                            Phone
                          </Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
                            {doctor.phone}
                          </Typography>
                        </Box>
                      )}

                      {doctor.consultation_fee && (
                        <Box sx={{ minWidth: 70 }}>
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.7rem', lineHeight: 1.2 }}>
                            Fee
                          </Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
                            ₹{doctor.consultation_fee}
                          </Typography>
                        </Box>
                      )}

                      {doctor.specialization && (
                        <Box sx={{ minWidth: 110 }}>
                          <Chip
                            label={doctor.specialization}
                            size="small"
                            color={getSpecializationColor(doctor.specialization) as any}
                            sx={{
                              height: 22,
                              fontSize: '0.7rem',
                              fontWeight: 600
                            }}
                          />
                        </Box>
                      )}
                    </Box>

                    {/* Right Section - Actions */}
                    <Box sx={{
                      display: 'flex',
                      gap: 0.5,
                      flex: '0 0 auto'
                    }}>
                      <Tooltip title="View Profile">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/doctors/${doctor.id}`);
                          }}
                          sx={{
                            width: 32,
                            height: 32,
                            '&:hover': { bgcolor: 'primary.light', color: 'primary.main' }
                          }}
                        >
                          <ViewIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                      {canEdit && (
                        <Tooltip title="Edit Profile">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/doctors/${doctor.id}/edit`);
                            }}
                            sx={{
                              width: 32,
                              height: 32,
                              '&:hover': { bgcolor: 'warning.light', color: 'warning.main' }
                            }}
                          >
                            <EditIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="View Schedule">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/doctors/${doctor.id}`);
                          }}
                          sx={{
                            width: 32,
                            height: 32,
                            '&:hover': { bgcolor: 'info.light', color: 'info.main' }
                          }}
                        >
                          <ScheduleIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                );
              })}
            </Box>

            {/* Pagination */}
            {doctorsData.total_pages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={doctorsData.total_pages}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                  showFirstButton
                  showLastButton
                />
              </Box>
            )}
          </>
        )}
      </Paper>
    </Container>
  );
};
