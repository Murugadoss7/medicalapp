import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Divider,
  Fade,
  Avatar,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Home as AddressIcon,
  Edit as EditIcon,
  Add as AddIcon,
  CalendarToday as AgeIcon,
  Group as FamilyIcon,
  Wc as GenderIcon,
} from '@mui/icons-material';
import { useGetFamilyMembersQuery } from '../../store/api';
import theme from '../../theme/medicalFuturismTheme';

export const FamilyView = () => {
  const { mobileNumber } = useParams<{ mobileNumber: string }>();
  const navigate = useNavigate();

  const {
    data: familyData,
    isLoading,
    error,
  } = useGetFamilyMembersQuery(mobileNumber || '', {
    skip: !mobileNumber,
  });

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

  if (!mobileNumber) {
    return (
      <Alert severity="error">
        Mobile number is required to view family details.
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/patients')}
          sx={{ mb: 2 }}
        >
          Back to Patients
        </Button>
        <Alert severity="error">
          Failed to load family details. The family may not exist.
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        ...theme.layouts.pageContainer,
        py: 2,
      }}
    >
      {/* Floating Gradient Orb */}
      <Box sx={theme.layouts.floatingOrb} />

      {/* Content Container */}
      <Box sx={{ position: 'relative', zIndex: 1, px: { xs: 1.5, sm: 2 } }}>
        {/* Header */}
        <Fade in timeout={600}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Button
                startIcon={<BackIcon />}
                onClick={() => navigate('/patients')}
                sx={{
                  ...theme.components.outlinedButton,
                  minHeight: 40,
                  px: 2,
                }}
              >
                Back
              </Button>
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
                  <FamilyIcon sx={{ fontSize: 22 }} />
                </Box>
                <Typography sx={{ ...theme.typography.pageTitle }}>
                  Family Details
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate(`/patients/register?mobile=${mobileNumber}&mode=add_family`)}
              sx={{
                ...theme.components.primaryButton,
              }}
            >
              Add Family Member
            </Button>
          </Box>
        </Fade>

        {familyData && (
          <>
            {/* Primary Member Details */}
            {familyData.primary_member && (
              <Fade in timeout={800}>
                <Paper
                  elevation={0}
                  sx={{
                    ...theme.components.glassPaper,
                    p: { xs: 1.5, sm: 2 },
                    mb: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: theme.colors.primary.gradient,
                        color: 'white',
                        mr: 1.5,
                      }}
                    >
                      <PersonIcon sx={{ fontSize: 18 }} />
                    </Box>
                    <Typography sx={{ ...theme.typography.sectionTitle }}>
                      Primary Member
                    </Typography>
                  </Box>

                  <Card
                    sx={{
                      ...theme.components.glassPaper,
                      p: { xs: 1.5, sm: 2 },
                      border: `1px solid ${theme.colors.primary.border}`,
                    }}
                  >
                    <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar
                          sx={{
                            ...theme.components.avatar,
                            mr: 1.5,
                          }}
                        >
                          {familyData.primary_member.full_name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography sx={{ ...theme.typography.cardTitle, fontSize: '0.9375rem' }}>
                            {familyData.primary_member.full_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {familyData.primary_member.mobile_number}
                            {familyData.primary_member.email && ` • ${familyData.primary_member.email}`}
                          </Typography>
                        </Box>
                      </Box>

                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                        {formatAge(familyData.primary_member.date_of_birth)} years • {familyData.primary_member.gender}
                        {familyData.primary_member.address && ` • ${familyData.primary_member.address}`}
                      </Typography>

                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Chip
                          label={familyData.primary_member.relationship_to_primary}
                          size="small"
                          sx={{
                            ...theme.components.chip,
                            height: 24,
                          }}
                        />
                        <Chip
                          label={familyData.primary_member.gender}
                          size="small"
                          sx={{
                            textTransform: 'capitalize',
                            fontWeight: 600,
                            fontSize: '0.6875rem',
                            height: 24,
                            background: theme.colors.primary.light,
                            color: theme.colors.primary.main,
                            border: `1px solid ${theme.colors.primary.border}`,
                          }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Paper>
              </Fade>
            )}

            {/* Family Members */}
            <Fade in timeout={1000}>
              <Paper
                elevation={0}
                sx={{
                  ...theme.components.glassPaper,
                  p: { xs: 1.5, sm: 2 },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography sx={{ ...theme.typography.sectionTitle }}>
                    Family Members ({familyData.family_members.filter(m => m.relationship_to_primary !== 'self').length})
                  </Typography>
                </Box>

                {familyData.family_members.filter(m => m.relationship_to_primary !== 'self').length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {familyData.family_members
                      .filter(member => member.relationship_to_primary !== 'self')
                      .map((member, index) => (
                        <Fade key={`${member.mobile_number}-${member.first_name}`} in timeout={1200 + index * 100}>
                          <Card
                            sx={{
                              ...theme.components.glassPaper,
                              p: { xs: 1.5, sm: 2 },
                              border: `1px solid ${theme.colors.primary.border}`,
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              '&:hover': {
                                boxShadow: '0 4px 16px rgba(102, 126, 234, 0.2)',
                                borderColor: theme.colors.primary.main,
                              },
                            }}
                          >
                            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                {/* Member Info */}
                                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                                  <Avatar
                                    sx={{
                                      ...theme.components.avatar,
                                      width: { xs: 36, sm: 40 },
                                      height: { xs: 36, sm: 40 },
                                      mr: 1.5,
                                    }}
                                  >
                                    {member.full_name.charAt(0)}
                                  </Avatar>
                                  <Box sx={{ flex: 1 }}>
                                    <Typography sx={{ ...theme.typography.cardTitle }}>
                                      {member.full_name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {formatAge(member.date_of_birth)} years • {member.gender} • {member.mobile_number}
                                      {member.email && ` • ${member.email}`}
                                    </Typography>
                                  </Box>
                                </Box>

                                {/* Relationship Chip & Actions */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Chip
                                    label={member.relationship_to_primary}
                                    size="small"
                                    sx={{
                                      ...theme.components.chip,
                                      height: 24,
                                    }}
                                  />
                                  <IconButton
                                    onClick={() => navigate(`/patients/register?edit=true&mobile=${member.mobile_number}&firstName=${member.first_name}&mode=family`)}
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
                                    <EditIcon sx={{ fontSize: 18 }} />
                                  </IconButton>
                                </Box>
                              </Box>
                            </CardContent>
                          </Card>
                        </Fade>
                      ))}
                  </Box>
                ) : (
                  <Alert
                    severity="info"
                    sx={{
                      borderRadius: 2,
                      border: `1px solid ${theme.colors.primary.border}`,
                      background: theme.colors.primary.light,
                    }}
                  >
                    <Typography variant="caption">
                      No additional family members found. This patient is the only member in this family.
                    </Typography>
                  </Alert>
                )}
              </Paper>
            </Fade>
          </>
        )}
      </Box>
    </Box>
  );
};