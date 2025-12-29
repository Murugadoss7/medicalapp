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
  Fade,
  Avatar,
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
import theme from '../../theme/medicalFuturismTheme';

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
    min_experience: experienceRange[0] || undefined,
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

  return (
    <Box
      sx={{
        ...theme.layouts.pageContainer,
      }}
    >
      {/* Floating Gradient Orb */}
      <Box sx={theme.layouts.floatingOrb} />

      {/* Content Container */}
      <Container
        maxWidth="lg"
        disableGutters
        sx={{
          position: 'relative',
          zIndex: 1,
          px: { xs: 1.5, sm: 2 },
        }}
      >
        {/* Header */}
        <Fade in timeout={600}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: theme.colors.primary.gradient,
                  color: 'white',
                  mr: 1.5,
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                }}
              >
                <DoctorIcon sx={{ fontSize: 22 }} />
              </Box>
              <Typography sx={{ ...theme.typography.pageTitle }}>
                Doctor Management
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/doctors/register')}
              sx={{
                ...theme.components.primaryButton,
              }}
            >
              Register New Doctor
            </Button>
          </Box>
        </Fade>

        {/* Search and Filter Section */}
        <Fade in timeout={800}>
          <Paper
            elevation={0}
            sx={{
              ...theme.components.glassPaper,
              p: { xs: 1.5, sm: 2 },
              mb: 2,
            }}
          >
            <Typography sx={{ ...theme.typography.sectionTitle, mb: 2 }}>
              Search & Filter
            </Typography>

            <Grid container spacing={1.5}>
              {/* Search Field */}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="Search by name or license..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: theme.colors.primary.main }} />
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
                  sx={{
                    ...theme.components.textField,
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
                  sx={{
                    ...theme.components.textField,
                  }}
                >
                  {specializations.map((spec) => (
                    <MenuItem key={spec} value={spec}>
                      {spec}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Minimum Experience Filter */}
              <Grid item xs={12} md={3}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                  Min Experience: {formatExperience(experienceRange[0])}
                </Typography>
                <Slider
                  value={experienceRange[0]}
                  onChange={(event, newValue) => {
                    setExperienceRange([newValue as number, 50]);
                    setPage(1);
                  }}
                  valueLabelDisplay="auto"
                  min={0}
                  max={50}
                  marks={[
                    { value: 0, label: '0' },
                    { value: 10, label: '10' },
                    { value: 25, label: '25' },
                    { value: 50, label: '50+' },
                  ]}
                  sx={{
                    color: theme.colors.primary.main,
                    '& .MuiSlider-thumb': {
                      background: theme.colors.primary.gradient,
                    },
                    '& .MuiSlider-track': {
                      background: theme.colors.primary.gradient,
                    },
                  }}
                />
              </Grid>

              {/* Clear Filters */}
              <Grid item xs={12} md={2}>
                <Button
                  variant="outlined"
                  onClick={clearFilters}
                  fullWidth
                  sx={{
                    ...theme.components.outlinedButton,
                    minHeight: 40,
                  }}
                >
                  Clear Filters
                </Button>
              </Grid>
            </Grid>

            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Enter at least 2 characters for name search
            </Typography>
          </Paper>
        </Fade>

        {/* Results Section */}
        <Fade in timeout={1000}>
          <Paper
            elevation={0}
            sx={{
              ...theme.components.glassPaper,
              p: { xs: 1.5, sm: 2 },
              flex: { xs: 'none', md: 1 },
              display: 'flex',
              flexDirection: 'column',
              overflow: { xs: 'visible', md: 'hidden' },
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography sx={{ ...theme.typography.sectionTitle }}>
                {searchQuery || specialization !== 'All Specializations' || experienceRange[0] > 0
                  ? 'Search Results'
                  : 'All Doctors'}
              </Typography>
              {doctorsData && (
                <Typography variant="caption" color="text.secondary">
                  {doctorsData.total} doctors found
                </Typography>
              )}
            </Box>

            {isLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress sx={{ color: theme.colors.primary.main }} />
              </Box>
            )}

            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 2,
                  borderRadius: 2,
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                }}
              >
                Failed to load doctors. Please try again.
              </Alert>
            )}

            {doctorsData && doctorsData.doctors.length === 0 && (
              <Alert
                severity="info"
                sx={{
                  mb: 2,
                  borderRadius: 2,
                  border: `1px solid ${theme.colors.primary.border}`,
                  background: theme.colors.primary.light,
                }}
              >
                <Typography variant="caption">
                  {searchQuery || specialization !== 'All Specializations'
                    ? 'No doctors found matching your criteria.'
                    : 'No doctors registered yet.'}
                </Typography>
              </Alert>
            )}

            {doctorsData && doctorsData.doctors.length > 0 && (
              <>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    flex: { xs: 'none', md: 1 },
                    maxHeight: { xs: 'none', md: 'auto' },
                    overflowY: { xs: 'visible', md: 'auto' },
                    overflowX: 'hidden',
                    ...theme.components.scrollbar,
                    pr: 1,
                    minHeight: { xs: 'auto', md: 0 },
                  }}
                >
                  {doctorsData.doctors.map((doctor, index) => {
                    const canEdit =
                      currentUser?.role === 'admin' ||
                      (currentUser?.role === 'doctor' && doctor.user_id === currentUser?.id);

                    return (
                      <Fade key={doctor.id} in timeout={1200 + index * 50}>
                        <Box
                          sx={{
                            ...theme.components.glassPaper,
                            p: { xs: 1.5, sm: 2 },
                            border: `1px solid ${theme.colors.primary.border}`,
                            cursor: 'pointer',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                              boxShadow: '0 4px 16px rgba(102, 126, 234, 0.2)',
                              borderColor: theme.colors.primary.main,
                              transform: 'translateX(2px)',
                            },
                          }}
                          onClick={() => navigate(`/doctors/${doctor.id}`)}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            {/* Avatar */}
                            <Avatar
                              sx={{
                                ...theme.components.avatar,
                                width: { xs: 40, sm: 44 },
                                height: { xs: 40, sm: 44 },
                              }}
                            >
                              {doctor.full_name
                                ? doctor.full_name.charAt(0)
                                : doctor.first_name.charAt(0)}
                            </Avatar>

                            {/* Left Section - Name and Specialization */}
                            <Box sx={{ flex: '1 1 30%', minWidth: 0 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
                                <Typography
                                  sx={{
                                    ...theme.typography.cardTitle,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {doctor.full_name || `Dr. ${doctor.first_name} ${doctor.last_name}`}
                                </Typography>
                                {doctor.is_active && (
                                  <Chip
                                    label="Active"
                                    size="small"
                                    sx={{
                                      height: 20,
                                      fontSize: '0.625rem',
                                      fontWeight: 700,
                                      background: theme.colors.status.success,
                                      color: 'white',
                                    }}
                                  />
                                )}
                              </Box>
                              <Typography variant="caption" color="text.secondary">
                                {doctor.specialization || 'General Practice'} • {doctor.license_number}
                              </Typography>
                            </Box>

                            {/* Middle Section - Compact Info */}
                            <Typography variant="caption" color="text.secondary" sx={{ flex: '0 0 auto' }}>
                              {doctor.experience_years !== undefined
                                ? `${doctor.experience_years}y exp`
                                : 'New'}
                              {doctor.phone && ` • ${doctor.phone}`}
                              {doctor.consultation_fee && ` • ₹${doctor.consultation_fee}`}
                            </Typography>

                            {/* Right Section - Specialization & Actions */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: '0 0 auto' }}>
                              {doctor.specialization && (
                                <Chip
                                  label={doctor.specialization}
                                  size="small"
                                  sx={{
                                    ...theme.components.chip,
                                    height: 24,
                                    fontSize: '0.65rem',
                                  }}
                                />
                              )}

                              <IconButton
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/doctors/${doctor.id}`);
                                }}
                                sx={{
                                  minWidth: 40,
                                  minHeight: 40,
                                  background: theme.colors.primary.light,
                                  color: theme.colors.primary.main,
                                  '&:hover': {
                                    background: theme.colors.primary.border,
                                    transform: 'scale(1.05)',
                                  },
                                }}
                              >
                                <ViewIcon sx={{ fontSize: 18 }} />
                              </IconButton>

                              {canEdit && (
                                <IconButton
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/doctors/${doctor.id}/edit`);
                                  }}
                                  sx={{
                                    minWidth: 40,
                                    minHeight: 40,
                                    background: 'rgba(245, 158, 11, 0.1)',
                                    color: '#f59e0b',
                                    '&:hover': {
                                      background: 'rgba(245, 158, 11, 0.2)',
                                      transform: 'scale(1.05)',
                                    },
                                  }}
                                >
                                  <EditIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                              )}
                            </Box>
                          </Box>
                        </Box>
                      </Fade>
                    );
                  })}
                </Box>

                {/* Pagination */}
                {doctorsData.total_pages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <Pagination
                      count={doctorsData.total_pages}
                      page={page}
                      onChange={handlePageChange}
                      sx={{
                        '& .MuiPaginationItem-root': {
                          color: theme.colors.primary.main,
                          fontWeight: 600,
                          '&.Mui-selected': {
                            background: theme.colors.primary.gradient,
                            color: 'white',
                          },
                          '&:hover': {
                            background: theme.colors.primary.light,
                          },
                        },
                      }}
                      showFirstButton
                      showLastButton
                    />
                  </Box>
                )}
              </>
            )}
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
};
