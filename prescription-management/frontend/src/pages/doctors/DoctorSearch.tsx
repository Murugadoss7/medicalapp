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
  Card,
  CardContent,
  CardActions,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  LocalHospital as DoctorIcon,
  Schedule as ScheduleIcon,
  GridView as GridViewIcon,
  List as ListViewIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  School as QualificationIcon,
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const pageSize = 12;

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

  const handleViewModeChange = (event: React.MouseEvent<HTMLElement>, newViewMode: 'grid' | 'list' | null) => {
    if (newViewMode !== null) {
      setViewMode(newViewMode);
    }
  };

  const formatExperience = (years: number) => {
    if (years === 0) return 'New';
    if (years === 1) return '1 year';
    return `${years} years`;
  };


  // Check if user can create doctors (admin only)
  const canCreateDoctor = currentUser?.role === 'admin';

  return (
    <Box>
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
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                variant="outlined"
                onClick={clearFilters}
                size="small"
              >
                Clear Filters
              </Button>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={handleViewModeChange}
                size="small"
              >
                <ToggleButton value="grid" aria-label="grid view">
                  <GridViewIcon />
                </ToggleButton>
                <ToggleButton value="list" aria-label="list view">
                  <ListViewIcon />
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
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
            {viewMode === 'grid' ? (
              <Grid container spacing={3}>
                {doctorsData.doctors.map((doctor) => (
                  <Grid item xs={12} sm={6} md={4} key={doctor.id}>
                    <DoctorCard
                      doctor={doctor}
                      onView={() => navigate(`/doctors/${doctor.id}`)}
                      onEdit={canCreateDoctor ? () => navigate(`/doctors/${doctor.id}/edit`) : undefined}
                      currentUserRole={currentUser?.role}
                      currentUserId={currentUser?.id}
                    />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <DoctorTable
                doctors={doctorsData.doctors}
                onView={(doctorId) => navigate(`/doctors/${doctorId}`)}
                onEdit={canCreateDoctor ? (doctorId) => navigate(`/doctors/${doctorId}/edit`) : undefined}
                currentUserRole={currentUser?.role}
                currentUserId={currentUser?.id}
              />
            )}

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
    </Box>
  );
};

// Doctor Card Component for Grid View
interface DoctorCardProps {
  doctor: any;
  onView: () => void;
  onEdit?: () => void;
  currentUserRole?: string;
  currentUserId?: string;
}

const DoctorCard = ({ doctor, onView, onEdit, currentUserRole, currentUserId }: DoctorCardProps) => {
  const canEdit = currentUserRole === 'admin' || 
    (currentUserRole === 'doctor' && doctor.user_id === currentUserId);

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <DoctorIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" component="div" noWrap>
            {doctor.full_name || `Dr. ${doctor.first_name} ${doctor.last_name}`}
          </Typography>
        </Box>

        {doctor.specialization && (
          <Chip
            label={doctor.specialization}
            size="small"
            color={getSpecializationColor(doctor.specialization) as any}
            sx={{ mb: 1 }}
          />
        )}

        <Typography variant="body2" color="text.secondary" gutterBottom>
          License: {doctor.license_number}
        </Typography>

        {doctor.experience_years !== undefined && (
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Experience: {doctor.experience_years} years
          </Typography>
        )}

        {doctor.consultation_fee && (
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Fee: ₹{doctor.consultation_fee}
          </Typography>
        )}

        {doctor.phone && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <PhoneIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {doctor.phone}
            </Typography>
          </Box>
        )}

        {doctor.clinic_address && (
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mt: 1 }}>
            <LocationIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary', mt: 0.1 }} />
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>
              {doctor.clinic_address.length > 50 
                ? `${doctor.clinic_address.substring(0, 50)}...` 
                : doctor.clinic_address}
            </Typography>
          </Box>
        )}

        <Box sx={{ mt: 1 }}>
          <Chip
            label={doctor.is_active ? 'Active' : 'Inactive'}
            size="small"
            color={doctor.is_active ? 'success' : 'default'}
          />
        </Box>
      </CardContent>

      <CardActions>
        <Button size="small" startIcon={<ViewIcon />} onClick={onView}>
          View
        </Button>
        {canEdit && onEdit && (
          <Button size="small" startIcon={<EditIcon />} onClick={onEdit}>
            Edit
          </Button>
        )}
        <Button size="small" startIcon={<ScheduleIcon />}>
          Schedule
        </Button>
      </CardActions>
    </Card>
  );
};

// Doctor Table Component for List View
interface DoctorTableProps {
  doctors: any[];
  onView: (doctorId: string) => void;
  onEdit?: (doctorId: string) => void;
  currentUserRole?: string;
  currentUserId?: string;
}

const DoctorTable = ({ doctors, onView, onEdit, currentUserRole, currentUserId }: DoctorTableProps) => {
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>License Number</TableCell>
            <TableCell>Specialization</TableCell>
            <TableCell>Experience</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {doctors.map((doctor) => {
            const canEdit = currentUserRole === 'admin' || 
              (currentUserRole === 'doctor' && doctor.user_id === currentUserId);

            return (
              <TableRow key={doctor.id}>
                <TableCell>
                  <Box>
                    <Typography variant="body1" fontWeight="medium">
                      {doctor.full_name || `Dr. ${doctor.first_name} ${doctor.last_name}`}
                    </Typography>
                    {doctor.qualification && (
                      <Typography variant="body2" color="text.secondary">
                        {doctor.qualification.length > 50 
                          ? `${doctor.qualification.substring(0, 50)}...` 
                          : doctor.qualification}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>{doctor.license_number}</TableCell>
                <TableCell>
                  {doctor.specialization && (
                    <Chip
                      label={doctor.specialization}
                      size="small"
                      color={getSpecializationColor(doctor.specialization) as any}
                    />
                  )}
                </TableCell>
                <TableCell>
                  {doctor.experience_years !== undefined 
                    ? `${doctor.experience_years} years` 
                    : 'Not specified'}
                </TableCell>
                <TableCell>
                  <Chip
                    label={doctor.is_active ? 'Active' : 'Inactive'}
                    size="small"
                    color={doctor.is_active ? 'success' : 'default'}
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => onView(doctor.id)}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    {canEdit && onEdit && (
                      <Tooltip title="Edit Profile">
                        <IconButton
                          size="small"
                          onClick={() => onEdit(doctor.id)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="View Schedule">
                      <IconButton
                        size="small"
                        onClick={() => onView(doctor.id)} // For now, view schedule goes to profile
                      >
                        <ScheduleIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};