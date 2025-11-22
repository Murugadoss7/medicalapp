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
} from '@mui/icons-material';
import { useGetFamilyMembersQuery } from '../../store/api';

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
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            startIcon={<BackIcon />}
            onClick={() => navigate('/patients')}
          >
            Back to Patients
          </Button>
          <Typography variant="h4" component="h1">
            Family Details
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate(`/patients/register?mobile=${mobileNumber}&mode=add_family`)}
        >
          Add Family Member
        </Button>
      </Box>

      {familyData && (
        <>
          {/* Primary Member Details */}
          {familyData.primary_member && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon color="primary" />
                Primary Member Details
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {familyData.primary_member.full_name}
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PhoneIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {familyData.primary_member.mobile_number}
                          </Typography>
                        </Box>
                        {familyData.primary_member.email && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <EmailIcon fontSize="small" color="action" />
                            <Typography variant="body2">
                              {familyData.primary_member.email}
                            </Typography>
                          </Box>
                        )}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AgeIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {formatAge(familyData.primary_member.date_of_birth)} years old
                          </Typography>
                        </Box>
                        {familyData.primary_member.address && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AddressIcon fontSize="small" color="action" />
                            <Typography variant="body2">
                              {familyData.primary_member.address}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                      <Box sx={{ mt: 2 }}>
                        <Chip
                          label={familyData.primary_member.relationship_to_primary}
                          size="small"
                          color="primary"
                          sx={{ textTransform: 'capitalize', mr: 1 }}
                        />
                        <Chip
                          label={familyData.primary_member.gender}
                          size="small"
                          variant="outlined"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Paper>
          )}

          {/* Family Members */}
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Family Members ({familyData.family_members.filter(m => m.relationship_to_primary !== 'self').length} additional members)
              </Typography>
            </Box>

            {familyData.family_members.filter(m => m.relationship_to_primary !== 'self').length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Age</TableCell>
                      <TableCell>Gender</TableCell>
                      <TableCell>Relationship</TableCell>
                      <TableCell>Contact</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {familyData.family_members
                      .filter(member => member.relationship_to_primary !== 'self') // Exclude primary member
                      .map((member) => (
                        <TableRow key={`${member.mobile_number}-${member.first_name}`}>
                        <TableCell>
                          <Box>
                            <Typography variant="body1" fontWeight="medium">
                              {member.full_name}
                            </Typography>
                            {member.email && (
                              <Typography variant="body2" color="text.secondary">
                                {member.email}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>{formatAge(member.date_of_birth)} years</TableCell>
                        <TableCell sx={{ textTransform: 'capitalize' }}>{member.gender}</TableCell>
                        <TableCell>
                          <Chip
                            label={member.relationship_to_primary}
                            size="small"
                            color={getRelationshipColor(member.relationship_to_primary) as any}
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </TableCell>
                        <TableCell>{member.mobile_number}</TableCell>
                        <TableCell>
                          <Tooltip title="Edit Member">
                            <IconButton 
                              size="small"
                              onClick={() => navigate(`/patients/register?edit=true&mobile=${member.mobile_number}&firstName=${member.first_name}&mode=family`)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">
                No additional family members found. This patient is the only member in this family.
              </Alert>
            )}
          </Paper>
        </>
      )}
    </Box>
  );
};