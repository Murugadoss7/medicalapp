import { useState } from 'react';
import {
  Box,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Alert,
  Divider,
} from '@mui/material';
import {
  LocalHospital as MedicalIcon,
  Bloodtype as BloodIcon,
  Warning as AllergyIcon,
  Assignment as NotesIcon,
} from '@mui/icons-material';

interface MedicalInfoFormProps {
  bloodGroup?: string;
  allergies?: string;
  chronicConditions?: string;
  emergencyNotes?: string;
  onChange: (field: string, value: string) => void;
  errors?: Record<string, string>;
}

const bloodGroupOptions = [
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
];

export const MedicalInfoForm = ({
  bloodGroup = '',
  allergies = '',
  chronicConditions = '',
  emergencyNotes = '',
  onChange,
  errors = {},
}: MedicalInfoFormProps) => {
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  const handleFieldChange = (field: string, value: string) => {
    // Clear local error when user starts typing
    if (localErrors[field]) {
      setLocalErrors(prev => ({ ...prev, [field]: '' }));
    }
    onChange(field, value);
  };

  const validateAllergies = (value: string) => {
    if (value.length > 500) {
      return 'Allergies description should not exceed 500 characters';
    }
    return '';
  };

  const validateChronicConditions = (value: string) => {
    if (value.length > 500) {
      return 'Chronic conditions description should not exceed 500 characters';
    }
    return '';
  };

  const validateEmergencyNotes = (value: string) => {
    if (value.length > 300) {
      return 'Emergency notes should not exceed 300 characters';
    }
    return '';
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <MedicalIcon sx={{ mr: 2, color: 'primary.main' }} />
        <Typography variant="h6" color="primary">
          Medical Information
        </Typography>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Please provide medical information to help with better healthcare management.
        All fields are optional but recommended for comprehensive care.
      </Typography>

      <Grid container spacing={3}>
        {/* Blood Group Selection */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel id="blood-group-label">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <BloodIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                Blood Group
              </Box>
            </InputLabel>
            <Select
              labelId="blood-group-label"
              value={bloodGroup}
              onChange={(e) => handleFieldChange('blood_group', e.target.value)}
              label="Blood Group"
              error={!!(errors.blood_group || localErrors.blood_group)}
            >
              <MenuItem value="">
                <em>Select Blood Group</em>
              </MenuItem>
              {bloodGroupOptions.map((group) => (
                <MenuItem key={group} value={group}>
                  {group}
                </MenuItem>
              ))}
            </Select>
            {(errors.blood_group || localErrors.blood_group) && (
              <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                {errors.blood_group || localErrors.blood_group}
              </Typography>
            )}
          </FormControl>
        </Grid>

        {/* Spacer for alignment */}
        <Grid item xs={12} sm={6} />

        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
        </Grid>

        {/* Allergies */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AllergyIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                Known Allergies
              </Box>
            }
            placeholder="List any known allergies (medications, food, environmental, etc.)"
            value={allergies}
            onChange={(e) => {
              const value = e.target.value;
              const error = validateAllergies(value);
              if (error) {
                setLocalErrors(prev => ({ ...prev, allergies: error }));
              }
              handleFieldChange('allergies', value);
            }}
            error={!!(errors.allergies || localErrors.allergies)}
            helperText={
              errors.allergies || 
              localErrors.allergies || 
              `${allergies.length}/500 characters`
            }
            inputProps={{ maxLength: 500 }}
          />
        </Grid>

        {/* Chronic Conditions */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <MedicalIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                Chronic Conditions
              </Box>
            }
            placeholder="List any ongoing medical conditions (diabetes, hypertension, asthma, etc.)"
            value={chronicConditions}
            onChange={(e) => {
              const value = e.target.value;
              const error = validateChronicConditions(value);
              if (error) {
                setLocalErrors(prev => ({ ...prev, chronic_conditions: error }));
              }
              handleFieldChange('chronic_conditions', value);
            }}
            error={!!(errors.chronic_conditions || localErrors.chronic_conditions)}
            helperText={
              errors.chronic_conditions || 
              localErrors.chronic_conditions || 
              `${chronicConditions.length}/500 characters`
            }
            inputProps={{ maxLength: 500 }}
          />
        </Grid>

        {/* Emergency Notes */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={2}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <NotesIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                Emergency Medical Notes
              </Box>
            }
            placeholder="Critical medical information for emergency situations"
            value={emergencyNotes}
            onChange={(e) => {
              const value = e.target.value;
              const error = validateEmergencyNotes(value);
              if (error) {
                setLocalErrors(prev => ({ ...prev, emergency_notes: error }));
              }
              handleFieldChange('emergency_notes', value);
            }}
            error={!!(errors.emergency_notes || localErrors.emergency_notes)}
            helperText={
              errors.emergency_notes || 
              localErrors.emergency_notes || 
              `${emergencyNotes.length}/300 characters`
            }
            inputProps={{ maxLength: 300 }}
          />
        </Grid>

        {/* Information Alert */}
        <Grid item xs={12}>
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Privacy Note:</strong> Medical information is securely stored and only 
              accessible by authorized healthcare providers. This information helps provide 
              better and safer medical care.
            </Typography>
          </Alert>
        </Grid>
      </Grid>
    </Box>
  );
};