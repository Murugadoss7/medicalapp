/**
 * Patient Search - Medical Futurism Design
 * Space-efficient, iPad-optimized patient listing
 */

import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Chip,
  CircularProgress,
  Alert,
  InputAdornment,
  Pagination,
  IconButton,
  Container,
  Avatar,
  Fade,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Group as FamilyIcon,
  Person as PersonIcon,
  Edit as EditIcon,
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
    setPage(1);
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

  const getRelationshipStyles = (relationship: string) => {
    switch (relationship) {
      case 'self':
        return {
          bg: '#667eea',
          text: '#fff',
        };
      case 'spouse':
        return {
          bg: '#f59e0b',
          text: '#fff',
        };
      case 'child':
        return {
          bg: '#10b981',
          text: '#fff',
        };
      case 'parent':
        return {
          bg: '#3b82f6',
          text: '#fff',
        };
      default:
        return {
          bg: '#6b7280',
          text: '#fff',
        };
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100%',
        background: '#f5f7fa',
        position: 'relative',
      }}
    >
      {/* Background gradient orb */}
      <Box
        sx={{
          position: 'fixed',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(102, 126, 234, 0.08) 0%, transparent 70%)',
          top: '-200px',
          right: '-150px',
          animation: 'float 20s ease-in-out infinite',
          zIndex: 0,
          '@keyframes float': {
            '0%, 100%': {
              transform: 'translate(0, 0) scale(1)',
            },
            '50%': {
              transform: 'translate(-30px, 30px) scale(1.05)',
            },
          },
        }}
      />

      <Container maxWidth="xl" sx={{ py: 2, position: 'relative', zIndex: 1 }}>
        {/* Header - Compact */}
        <Fade in timeout={600}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  bgcolor: '#667eea',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                }}
              >
                <FamilyIcon sx={{ fontSize: 24, color: 'white' }} />
              </Box>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: '1.25rem', sm: '1.5rem' },
                  color: '#667eea',
                  letterSpacing: '-0.01em',
                }}
              >
                Patient Management
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/patients/register')}
              sx={{
                minHeight: { xs: 40, sm: 48 },
                px: { xs: 2, sm: 3 },
                fontSize: { xs: '0.8125rem', sm: '0.9375rem' },
                fontWeight: 700,
                bgcolor: '#667eea',
                boxShadow: '0 4px 16px rgba(102, 126, 234, 0.4)',
                borderRadius: 2,
                '&:hover': {
                  bgcolor: '#5568d3',
                  boxShadow: '0 6px 20px rgba(102, 126, 234, 0.5)',
                },
              }}
            >
              Register New Patient
            </Button>
          </Box>
        </Fade>

        {/* Search Panel - Glassmorphism */}
        <Fade in timeout={800}>
          <Paper
            elevation={0}
            sx={{
              mb: 2,
              p: { xs: 1.5, sm: 2 },
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(102, 126, 234, 0.15)',
              boxShadow: '0 8px 32px rgba(102, 126, 234, 0.1)',
            }}
          >
            <TextField
              fullWidth
              placeholder="Search by mobile, first name, or last name..."
              value={searchQuery}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#667eea' }} />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={clearSearch}
                      sx={{
                        minWidth: 44,
                        minHeight: 44,
                        color: '#667eea',
                        '&:hover': {
                          background: 'rgba(102, 126, 234, 0.1)',
                        },
                      }}
                    >
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '& fieldset': {
                    borderColor: 'rgba(102, 126, 234, 0.2)',
                  },
                  '&:hover fieldset': {
                    borderColor: '#667eea',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#667eea',
                  },
                },
              }}
            />
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem', mt: 0.5, display: 'block' }}>
              Enter 2+ characters for name or 3+ digits for mobile
            </Typography>
          </Paper>
        </Fade>

        {/* Results Panel */}
        <Fade in timeout={1000}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 4,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(102, 126, 234, 0.15)',
              boxShadow: '0 8px 32px rgba(102, 126, 234, 0.1)',
              position: 'relative',
              overflow: 'hidden',
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
            <Box sx={{ p: { xs: 1.5, sm: 2 }, borderBottom: '1px solid rgba(102, 126, 234, 0.15)' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.9375rem',
                    color: 'text.primary',
                  }}
                >
                  {searchQuery ? 'Search Results' : 'All Patients'}
                </Typography>
                {patientsData && (
                  <Chip
                    label={`${patientsData.total} patients`}
                    size="small"
                    sx={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      fontWeight: 700,
                      height: 24,
                      fontSize: '0.6875rem',
                    }}
                  />
                )}
              </Box>
            </Box>

            {/* Content Area with Custom Scrollbar */}
            <Box
              sx={{
                p: { xs: 1.5, sm: 2 },
                maxHeight: 'calc(100vh - 280px)',
                overflowY: 'auto',
                overflowX: 'hidden',
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
              {isLoading && (
                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', py: 8 }}>
                  <CircularProgress sx={{ color: '#667eea', mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    Loading patients...
                  </Typography>
                </Box>
              )}

              {error && (
                <Alert
                  severity="error"
                  sx={{
                    borderRadius: 2,
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                  }}
                >
                  Failed to load patients. Please try again.
                </Alert>
              )}

              {patientsData && patientsData.patients.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                    }}
                  >
                    <PersonIcon sx={{ fontSize: 40, color: '#667eea' }} />
                  </Box>
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
                    {searchQuery ? 'No patients found' : 'No patients yet'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {searchQuery ? 'Try a different search term' : 'Register your first patient to get started'}
                  </Typography>
                </Box>
              )}

              {patientsData && patientsData.patients.length > 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {patientsData.patients.map((patient, index) => {
                    const relationshipStyle = getRelationshipStyles(patient.relationship_to_primary);

                    return (
                      <Fade key={`${patient.mobile_number}-${patient.first_name}`} in timeout={1200 + index * 50}>
                        <Paper
                          onClick={() => navigate(`/patients/family/${patient.mobile_number}`)}
                          sx={{
                            p: { xs: 1.25, sm: 1.5 },
                            borderRadius: 2,
                            background: 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(102, 126, 234, 0.15)',
                            boxShadow: '0 1px 8px rgba(102, 126, 234, 0.1)',
                            cursor: 'pointer',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                              transform: 'translateX(4px)',
                              boxShadow: '0 4px 16px rgba(102, 126, 234, 0.2)',
                              borderColor: '#667eea',
                            },
                          }}
                        >
                          {/* Horizontal Layout - Name, Info, Actions */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
                            {/* Avatar */}
                            <Avatar
                              sx={{
                                width: { xs: 40, sm: 48 },
                                height: { xs: 40, sm: 48 },
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                fontSize: '1rem',
                                fontWeight: 700,
                                boxShadow: '0 2px 8px rgba(102, 126, 234, 0.25)',
                              }}
                            >
                              {patient.first_name[0]}{patient.last_name ? patient.last_name[0] : ''}
                            </Avatar>

                            {/* Name & Contact (Flex Priority) */}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography
                                variant="subtitle2"
                                sx={{
                                  fontWeight: 700,
                                  fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                                  lineHeight: 1.3,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  color: 'text.primary',
                                }}
                              >
                                {patient.full_name}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: 'text.secondary',
                                  fontSize: '0.75rem',
                                  fontWeight: 500,
                                  display: 'block',
                                  lineHeight: 1.2,
                                }}
                              >
                                {patient.mobile_number} • {formatAge(patient.date_of_birth)}y • {patient.gender.charAt(0).toUpperCase()}
                              </Typography>
                            </Box>

                            {/* Relationship Chip */}
                            <Chip
                              label={patient.relationship_to_primary}
                              size="small"
                              sx={{
                                textTransform: 'capitalize',
                                fontWeight: 700,
                                fontSize: '0.6875rem',
                                height: 24,
                                background: relationshipStyle.bg,
                                color: relationshipStyle.text,
                                border: 'none',
                                boxShadow: '0 2px 8px rgba(102, 126, 234, 0.2)',
                              }}
                            />

                            {/* Action Buttons */}
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              {/* Edit Icon Button */}
                              <IconButton
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/patients/register?edit=true&mobile=${patient.mobile_number}&firstName=${patient.first_name}&mode=primary`);
                                }}
                                sx={{
                                  minWidth: 44,
                                  minHeight: 44,
                                  background: 'rgba(102, 126, 234, 0.1)',
                                  color: '#667eea',
                                  '&:hover': {
                                    background: 'rgba(102, 126, 234, 0.2)',
                                    transform: 'scale(1.05)',
                                  },
                                }}
                              >
                                <EditIcon sx={{ fontSize: 20 }} />
                              </IconButton>

                              {/* Family Icon Button */}
                              <IconButton
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/patients/family/${patient.mobile_number}`);
                                }}
                                sx={{
                                  minWidth: 44,
                                  minHeight: 44,
                                  background: 'rgba(102, 126, 234, 0.1)',
                                  color: '#667eea',
                                  '&:hover': {
                                    background: 'rgba(102, 126, 234, 0.2)',
                                    transform: 'scale(1.05)',
                                  },
                                }}
                              >
                                <FamilyIcon sx={{ fontSize: 20 }} />
                              </IconButton>
                            </Box>
                          </Box>
                        </Paper>
                      </Fade>
                    );
                  })}
                </Box>
              )}
            </Box>

            {/* Pagination */}
            {patientsData && patientsData.total_pages > 1 && (
              <Box
                sx={{
                  p: { xs: 1.5, sm: 2 },
                  borderTop: '1px solid rgba(102, 126, 234, 0.15)',
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <Pagination
                  count={patientsData.total_pages}
                  page={page}
                  onChange={handlePageChange}
                  sx={{
                    '& .MuiPaginationItem-root': {
                      fontWeight: 600,
                      color: '#667eea',
                      '&.Mui-selected': {
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                      },
                    },
                  }}
                  showFirstButton
                  showLastButton
                />
              </Box>
            )}
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
};
