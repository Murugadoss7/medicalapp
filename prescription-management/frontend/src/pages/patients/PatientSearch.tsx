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
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Group as FamilyIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useListPatientsQuery } from '../../store/api';

export const PatientSearch = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Load patients with search and pagination
  const {
    data: patientsData,
    isLoading,
    error,
  } = useListPatientsQuery({
    mobile_number: searchQuery.length >= 3 ? searchQuery : undefined,
    first_name: searchQuery.length >= 2 && !/^\d/.test(searchQuery) ? searchQuery : undefined,
    last_name: searchQuery.length >= 2 && !/^\d/.test(searchQuery) ? searchQuery : undefined,
    page,
    page_size: pageSize,
    sort_by: 'first_name',
    sort_order: 'asc',
  });

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPage(1); // Reset to first page when searching
  };

  const clearSearch = () => {
    setSearchQuery('');
    setPage(1);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const formatAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getRelationshipColor = (relationship: string) => {
    switch (relationship) {
      case 'self':
        return 'primary';
      case 'spouse':
        return 'secondary';
      case 'child':
        return 'success';
      case 'parent':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Patient Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/patients/register')}
          size="large"
        >
          Register New Patient
        </Button>
      </Box>

      {/* Search Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Search Patients
        </Typography>
        <TextField
          fullWidth
          placeholder="Search by mobile number, first name, or last name..."
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
                <IconButton onClick={clearSearch} size="small">
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />
        <Typography variant="body2" color="text.secondary">
          Enter at least 2 characters for name search or 3 digits for mobile number search
        </Typography>
      </Paper>

      {/* Results Section */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            {searchQuery ? 'Search Results' : 'All Patients'}
          </Typography>
          {patientsData && (
            <Typography variant="body2" color="text.secondary">
              {patientsData.total} patients found
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
            Failed to load patients. Please try again.
          </Alert>
        )}

        {patientsData && patientsData.patients.length === 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {searchQuery ? 'No patients found matching your search.' : 'No patients registered yet.'}
          </Alert>
        )}

        {patientsData && patientsData.patients.length > 0 && (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Mobile Number</TableCell>
                    <TableCell>Age</TableCell>
                    <TableCell>Gender</TableCell>
                    <TableCell>Relationship</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {patientsData.patients.map((patient) => (
                    <TableRow key={`${patient.mobile_number}-${patient.first_name}`}>
                      <TableCell>
                        <Box>
                          <Typography variant="body1" fontWeight="medium">
                            {patient.full_name}
                          </Typography>
                          {patient.email && (
                            <Typography variant="body2" color="text.secondary">
                              {patient.email}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>{patient.mobile_number}</TableCell>
                      <TableCell>{formatAge(patient.date_of_birth)} years</TableCell>
                      <TableCell sx={{ textTransform: 'capitalize' }}>{patient.gender}</TableCell>
                      <TableCell>
                        <Chip
                          label={patient.relationship_to_primary}
                          size="small"
                          color={getRelationshipColor(patient.relationship_to_primary) as any}
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/patients/family/${patient.mobile_number}`)}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View Family">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/patients/family/${patient.mobile_number}`)}
                            >
                              <FamilyIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            {patientsData.total_pages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={patientsData.total_pages}
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