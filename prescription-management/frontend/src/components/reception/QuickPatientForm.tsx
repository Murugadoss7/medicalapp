/**
 * QuickPatientForm Component
 * Minimal form for quick patient registration (walk-ins)
 * Supports both new patient and family member registration
 */
import React, { useState } from 'react';
import {
  Box,
  TextField,
  Typography,
  Button,
  Paper,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress,
  Alert,
  InputAdornment,
  IconButton,
  Select,
  MenuItem,
  InputLabel,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Close as CloseIcon,
  Phone as PhoneIcon,
  Group as GroupIcon,
} from '@mui/icons-material';
import { useCreatePatientMutation, useCreateFamilyMemberMutation } from '../../store/api';
import { Patient } from '../../store/api';

interface QuickPatientFormProps {
  initialMobile: string;
  onSuccess: (patient: Patient) => void;
  onCancel: () => void;
  /** If true, this is adding to an existing family */
  isAddingFamilyMember?: boolean;
  /** Primary member name for context */
  primaryMemberName?: string;
}

export const QuickPatientForm: React.FC<QuickPatientFormProps> = ({
  initialMobile,
  onSuccess,
  onCancel,
  isAddingFamilyMember = false,
  primaryMemberName,
}) => {
  const [formData, setFormData] = useState({
    mobile_number: initialMobile,
    first_name: '',
    last_name: '',
    gender: 'male' as 'male' | 'female' | 'other',
    date_of_birth: '',
    relationship: 'spouse' as 'spouse' | 'child' | 'parent' | 'sibling' | 'other',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [createPatient, { isLoading: isCreatingPatient, error: createPatientError }] = useCreatePatientMutation();
  const [createFamilyMember, { isLoading: isCreatingFamily, error: createFamilyError }] = useCreateFamilyMemberMutation();

  const isLoading = isCreatingPatient || isCreatingFamily;
  const apiError = createPatientError || createFamilyError;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.mobile_number || formData.mobile_number.length !== 10) {
      newErrors.mobile_number = 'Enter valid 10-digit mobile';
    }
    if (!formData.first_name || formData.first_name.length < 2) {
      newErrors.first_name = 'First name required (min 2 chars)';
    }
    if (!formData.last_name || formData.last_name.length < 2) {
      newErrors.last_name = 'Last name required (min 2 chars)';
    }
    if (!formData.date_of_birth) {
      newErrors.date_of_birth = 'Date of birth required';
    } else {
      const dob = new Date(formData.date_of_birth);
      const today = new Date();
      if (dob > today) {
        newErrors.date_of_birth = 'Date cannot be in future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error on change
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      let patient: Patient;

      if (isAddingFamilyMember) {
        // Add as family member to existing family
        patient = await createFamilyMember({
          mobile_number: formData.mobile_number,
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          gender: formData.gender,
          date_of_birth: formData.date_of_birth,
          relationship: formData.relationship,
        }).unwrap();
      } else {
        // Create new primary patient
        patient = await createPatient({
          mobile_number: formData.mobile_number,
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          gender: formData.gender,
          date_of_birth: formData.date_of_birth,
          relationship_to_primary: 'self',
        }).unwrap();
      }

      onSuccess(patient);
    } catch (err) {
      console.error('Failed to create patient:', err);
    }
  };

  const getApiErrorMessage = () => {
    if (!apiError) return null;
    if ('data' in apiError) {
      const data = apiError.data as any;
      return data?.detail || 'Failed to register patient';
    }
    return 'Failed to register patient';
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 3,
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(102, 126, 234, 0.2)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography
          variant="subtitle1"
          fontWeight={600}
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          {isAddingFamilyMember ? (
            <>
              <GroupIcon color="primary" />
              Add Family Member
            </>
          ) : (
            <>
              <PersonAddIcon color="primary" />
              Quick Registration
            </>
          )}
        </Typography>
        <IconButton size="small" onClick={onCancel}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {isAddingFamilyMember && primaryMemberName && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Adding family member to: <strong>{primaryMemberName}</strong>
        </Alert>
      )}

      {apiError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {getApiErrorMessage()}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        {/* Mobile Number */}
        <TextField
          fullWidth
          label="Mobile Number"
          value={formData.mobile_number}
          onChange={(e) => handleChange('mobile_number', e.target.value.replace(/\D/g, '').slice(0, 10))}
          error={!!errors.mobile_number}
          helperText={errors.mobile_number}
          disabled={isAddingFamilyMember} // Can't change mobile when adding family member
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PhoneIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
          size="small"
        />

        {/* First Name */}
        <TextField
          fullWidth
          label="First Name"
          value={formData.first_name}
          onChange={(e) => handleChange('first_name', e.target.value)}
          error={!!errors.first_name}
          helperText={errors.first_name}
          sx={{ mb: 2 }}
          size="small"
          autoFocus
        />

        {/* Last Name */}
        <TextField
          fullWidth
          label="Last Name"
          value={formData.last_name}
          onChange={(e) => handleChange('last_name', e.target.value)}
          error={!!errors.last_name}
          helperText={errors.last_name}
          sx={{ mb: 2 }}
          size="small"
        />

        {/* Relationship (only for family members) */}
        {isAddingFamilyMember && (
          <FormControl fullWidth sx={{ mb: 2 }} size="small">
            <InputLabel>Relationship</InputLabel>
            <Select
              value={formData.relationship}
              label="Relationship"
              onChange={(e) => handleChange('relationship', e.target.value)}
            >
              <MenuItem value="spouse">Spouse</MenuItem>
              <MenuItem value="child">Child</MenuItem>
              <MenuItem value="parent">Parent</MenuItem>
              <MenuItem value="sibling">Sibling</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
        )}

        {/* Gender */}
        <FormControl sx={{ mb: 2 }} error={!!errors.gender}>
          <FormLabel sx={{ fontSize: '0.875rem' }}>Gender</FormLabel>
          <RadioGroup
            row
            value={formData.gender}
            onChange={(e) => handleChange('gender', e.target.value)}
          >
            <FormControlLabel
              value="male"
              control={<Radio size="small" />}
              label="Male"
            />
            <FormControlLabel
              value="female"
              control={<Radio size="small" />}
              label="Female"
            />
            <FormControlLabel
              value="other"
              control={<Radio size="small" />}
              label="Other"
            />
          </RadioGroup>
        </FormControl>

        {/* Date of Birth */}
        <TextField
          fullWidth
          label="Date of Birth"
          type="date"
          value={formData.date_of_birth}
          onChange={(e) => handleChange('date_of_birth', e.target.value)}
          error={!!errors.date_of_birth}
          helperText={errors.date_of_birth}
          InputLabelProps={{ shrink: true }}
          inputProps={{ max: new Date().toISOString().split('T')[0] }}
          sx={{ mb: 3 }}
          size="small"
        />

        {/* Submit Button */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            type="button"
            variant="outlined"
            onClick={onCancel}
            sx={{ flex: 1 }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading}
            sx={{ flex: 1 }}
          >
            {isLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              'Register'
            )}
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default QuickPatientForm;
