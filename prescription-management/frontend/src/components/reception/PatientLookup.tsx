/**
 * PatientLookup Component
 * Searches for patients by mobile number and displays family members
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  TextField,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  CircularProgress,
  Paper,
  InputAdornment,
  Divider,
  Button,
  Alert,
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  PersonAdd as PersonAddIcon,
  Group as GroupIcon,
} from '@mui/icons-material';
import { useLazyGetFamilyMembersQuery } from '../../store/api';
import { Patient } from '../../store/api';

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface PatientLookupProps {
  onPatientSelect: (patient: Patient) => void;
  onShowRegisterForm: (mobileNumber: string, isAddingToFamily: boolean, primaryMemberName?: string) => void;
  selectedPatient: Patient | null;
}

export const PatientLookup: React.FC<PatientLookupProps> = ({
  onPatientSelect,
  onShowRegisterForm,
  selectedPatient,
}) => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const debouncedMobile = useDebounce(mobileNumber, 500);

  const [
    getFamilyMembers,
    { data: familyData, isLoading, isError, error }
  ] = useLazyGetFamilyMembersQuery();

  // Search when mobile number changes (after debounce)
  useEffect(() => {
    if (debouncedMobile.length >= 10) {
      getFamilyMembers(debouncedMobile);
      setHasSearched(true);
    } else {
      setHasSearched(false);
    }
  }, [debouncedMobile, getFamilyMembers]);

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setMobileNumber(value);
  };

  const handlePatientClick = (patient: Patient) => {
    onPatientSelect(patient);
  };

  const handleRegisterNew = (isAddingToFamily: boolean = false) => {
    const primaryMember = familyMembers.find(p => p.relationship_to_primary === 'self');
    const primaryName = primaryMember?.full_name || familyMembers[0]?.full_name;
    onShowRegisterForm(mobileNumber, isAddingToFamily, primaryName);
  };

  const getRelationshipColor = (relationship: string) => {
    const colors: Record<string, 'primary' | 'secondary' | 'success' | 'warning' | 'info'> = {
      self: 'primary',
      spouse: 'secondary',
      child: 'success',
      parent: 'warning',
      sibling: 'info',
    };
    return colors[relationship?.toLowerCase()] || 'default';
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const familyMembers = familyData?.family_members || [];
  const noFamilyFound = hasSearched && !isLoading && familyMembers.length === 0;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 3,
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(102, 126, 234, 0.1)',
      }}
    >
      <Typography
        variant="subtitle1"
        fontWeight={600}
        sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
      >
        <SearchIcon color="primary" />
        Patient Lookup
      </Typography>

      {/* Mobile Number Input */}
      <TextField
        fullWidth
        label="Mobile Number"
        placeholder="Enter 10-digit mobile"
        value={mobileNumber}
        onChange={handleMobileChange}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <PhoneIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: isLoading ? (
            <InputAdornment position="end">
              <CircularProgress size={20} />
            </InputAdornment>
          ) : null,
        }}
        sx={{ mb: 2 }}
      />

      {/* Selected Patient Display */}
      {selectedPatient && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => onPatientSelect(null as any)}
        >
          <Typography variant="body2" fontWeight={600}>
            Selected: {selectedPatient.full_name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {selectedPatient.mobile_number} | {selectedPatient.age} yrs | {selectedPatient.gender}
          </Typography>
        </Alert>
      )}

      {/* Search Results */}
      {hasSearched && !selectedPatient && (
        <>
          {familyMembers.length > 0 ? (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <GroupIcon fontSize="small" color="primary" />
                <Typography variant="body2" color="text.secondary">
                  Family Found ({familyMembers.length} member{familyMembers.length > 1 ? 's' : ''})
                </Typography>
              </Box>

              <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
                {familyMembers.map((patient, index) => (
                  <React.Fragment key={patient.id}>
                    <ListItem
                      component="div"
                      onClick={() => handlePatientClick(patient)}
                      sx={{
                        borderRadius: 2,
                        mb: 0.5,
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: patient.gender === 'male' ? 'primary.main' : 'secondary.main',
                            width: 36,
                            height: 36,
                          }}
                        >
                          {getInitials(patient.first_name, patient.last_name)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" fontWeight={500}>
                              {patient.full_name}
                            </Typography>
                            <Chip
                              label={patient.relationship_to_primary || 'self'}
                              size="small"
                              color={getRelationshipColor(patient.relationship_to_primary)}
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          </Box>
                        }
                        secondary={`${patient.age} yrs | ${patient.gender}`}
                      />
                    </ListItem>
                    {index < familyMembers.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </List>

              {/* Add New Family Member Button */}
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<PersonAddIcon />}
                  onClick={() => handleRegisterNew(true)}
                  size="small"
                  fullWidth
                >
                  Add Family Member
                </Button>
              </Box>
            </>
          ) : noFamilyFound ? (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <PersonIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                No patient found with this mobile number
              </Typography>
              <Button
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={() => handleRegisterNew(false)}
                size="small"
              >
                Register New Patient
              </Button>
            </Box>
          ) : null}
        </>
      )}

      {/* Hint when not searching */}
      {!hasSearched && !selectedPatient && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center' }}>
          Enter complete 10-digit mobile number to search
        </Typography>
      )}
    </Paper>
  );
};

export default PatientLookup;
