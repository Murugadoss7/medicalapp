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
  IconButton,
  Card,
  CardContent,
  Button,
  Divider,
  Alert,
  Fade,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Group as FamilyIcon,
  Person as PersonIcon,
  Cake as AgeIcon,
  Wc as GenderIcon,
  AccountTree as RelationshipIcon,
} from '@mui/icons-material';
import type { FamilyMember } from '../../store/api';
import theme from '../../theme/medicalFuturismTheme';

interface FamilyMemberFormProps {
  familyMembers: FamilyMember[];
  onChange: (members: FamilyMember[]) => void;
  errors?: Record<string, any>;
  editingMemberId?: string; // Highlight member being edited
}

const relationshipOptions = [
  { value: 'spouse', label: 'Spouse' },
  { value: 'child', label: 'Child' },
  { value: 'parent', label: 'Parent' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'other', label: 'Other' },
];

const genderOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

const bloodGroupOptions = [
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
];

const createEmptyMember = (): FamilyMember => ({
  first_name: '',
  last_name: '',
  date_of_birth: '',
  gender: 'male',
  relationship: 'spouse',
  notes: '',
});

export const FamilyMemberForm = ({
  familyMembers,
  onChange,
  errors = {},
  editingMemberId,
}: FamilyMemberFormProps) => {
  const [localErrors, setLocalErrors] = useState<Record<string, any>>({});

  const addFamilyMember = () => {
    const newMembers = [...familyMembers, createEmptyMember()];
    onChange(newMembers);
  };

  const removeFamilyMember = (index: number) => {
    const newMembers = familyMembers.filter((_, i) => i !== index);
    onChange(newMembers);
    
    // Clear errors for removed member
    const newLocalErrors = { ...localErrors };
    delete newLocalErrors[`member_${index}`];
    setLocalErrors(newLocalErrors);
  };

  const updateFamilyMember = (index: number, field: keyof FamilyMember, value: string) => {
    const newMembers = [...familyMembers];
    newMembers[index] = { ...newMembers[index], [field]: value };
    onChange(newMembers);

    // Clear local error when user starts typing
    if (localErrors[`member_${index}_${field}`]) {
      setLocalErrors(prev => ({
        ...prev,
        [`member_${index}_${field}`]: ''
      }));
    }
  };

  const validateDateOfBirth = (dob: string): string => {
    if (!dob) return '';
    
    const birthDate = new Date(dob);
    const today = new Date();
    
    if (birthDate > today) {
      return 'Date of birth cannot be in the future';
    }
    
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age > 120) {
      return 'Please check the date of birth';
    }
    
    return '';
  };

  const getFieldError = (memberIndex: number, field: string) => {
    return errors[`family_members_${memberIndex}_${field}`] || 
           localErrors[`member_${memberIndex}_${field}`];
  };

  const isEditingMember = (member: FamilyMember, index: number) => {
    if (!editingMemberId) return false;
    // Match by first name and last name (or index if we have a more specific ID later)
    const memberId = `${member.first_name}`;
    return editingMemberId.includes(memberId);
  };

  return (
    <Box>
      {/* Header with Purple Icon Bubble */}
      <Fade in timeout={600}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
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
          <Typography
            sx={{
              ...theme.typography.sectionTitle,
              fontSize: '0.9375rem',
            }}
          >
            Family Members
          </Typography>
        </Box>
      </Fade>

      <Fade in timeout={800}>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
          Add family members who will use the same mobile number for appointments.
        </Typography>
      </Fade>

      {/* Family Members List */}
      {familyMembers.length === 0 ? (
        <Fade in timeout={1000}>
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
              No family members added yet. Click "Add Family Member" to register additional family members.
            </Typography>
          </Alert>
        </Fade>
      ) : (
        <Box sx={{ mb: 2 }}>
          {familyMembers.map((member, index) => {
            const isEditing = isEditingMember(member, index);
            return (
              <Fade key={index} in timeout={1000 + index * 100}>
                <Card
                  sx={{
                    ...theme.components.glassPaper,
                    mb: 1.5,
                    p: { xs: 1.5, sm: 2 },
                    border: `2px solid ${isEditing ? theme.colors.primary.main : theme.colors.primary.border}`,
                    background: isEditing
                      ? `linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.05) 100%)`
                      : theme.colors.background.glass,
                    boxShadow: isEditing
                      ? '0 8px 24px rgba(102, 126, 234, 0.2)'
                      : '0 4px 16px rgba(102, 126, 234, 0.1)',
                  }}
                >
                  <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: isEditing ? theme.colors.primary.gradient : theme.colors.primary.light,
                            color: isEditing ? 'white' : theme.colors.primary.main,
                            mr: 1.5,
                          }}
                        >
                          <PersonIcon sx={{ fontSize: 18 }} />
                        </Box>
                        <Typography
                          sx={{
                            ...theme.typography.cardTitle,
                            color: isEditing ? theme.colors.primary.main : 'text.primary',
                          }}
                        >
                          {isEditing
                            ? `Editing: ${member.first_name || 'Family Member'} ${member.last_name || ''}`
                            : `Family Member ${index + 1}`}
                        </Typography>
                      </Box>
                      <IconButton
                        onClick={() => removeFamilyMember(index)}
                        sx={{
                          minWidth: 40,
                          minHeight: 40,
                          color: '#ef4444',
                          '&:hover': {
                            background: 'rgba(239, 68, 68, 0.1)',
                          },
                        }}
                      >
                        <DeleteIcon sx={{ fontSize: 20 }} />
                      </IconButton>
                    </Box>

                    <Grid container spacing={1.5}>
                      {/* Name Fields */}
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          required
                          label="First Name"
                          value={member.first_name}
                          onChange={(e) => updateFamilyMember(index, 'first_name', e.target.value)}
                          error={!!getFieldError(index, 'first_name')}
                          helperText={getFieldError(index, 'first_name')}
                          sx={{
                            ...theme.components.textField,
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          required
                          label="Last Name"
                          value={member.last_name}
                          onChange={(e) => updateFamilyMember(index, 'last_name', e.target.value)}
                          error={!!getFieldError(index, 'last_name')}
                          helperText={getFieldError(index, 'last_name')}
                          sx={{
                            ...theme.components.textField,
                          }}
                        />
                      </Grid>

                      {/* Date of Birth */}
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          required
                          type="date"
                          label="Date of Birth"
                          value={member.date_of_birth}
                          onChange={(e) => {
                            const value = e.target.value;
                            const error = validateDateOfBirth(value);
                            if (error) {
                              setLocalErrors(prev => ({
                                ...prev,
                                [`member_${index}_date_of_birth`]: error
                              }));
                            }
                            updateFamilyMember(index, 'date_of_birth', value);
                          }}
                          InputLabelProps={{ shrink: true }}
                          InputProps={{
                            startAdornment: <AgeIcon sx={{ mr: 1, color: theme.colors.primary.main }} />
                          }}
                          error={!!getFieldError(index, 'date_of_birth')}
                          helperText={getFieldError(index, 'date_of_birth')}
                          sx={{
                            ...theme.components.textField,
                          }}
                        />
                      </Grid>

                      {/* Gender */}
                      <Grid item xs={12} sm={6}>
                        <FormControl
                          fullWidth
                          required
                          sx={{
                            ...theme.components.textField,
                          }}
                        >
                          <InputLabel
                            sx={{
                              '&.Mui-focused': {
                                color: theme.colors.primary.main,
                              },
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <GenderIcon sx={{ mr: 1, fontSize: 18 }} />
                              Gender
                            </Box>
                          </InputLabel>
                          <Select
                            value={member.gender}
                            onChange={(e) => updateFamilyMember(index, 'gender', e.target.value)}
                            label="Gender"
                            error={!!getFieldError(index, 'gender')}
                          >
                            {genderOptions.map((option) => (
                              <MenuItem key={option.value} value={option.value}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>

                      {/* Relationship */}
                      <Grid item xs={12} sm={6}>
                        <FormControl
                          fullWidth
                          required
                          sx={{
                            ...theme.components.textField,
                          }}
                        >
                          <InputLabel
                            sx={{
                              '&.Mui-focused': {
                                color: theme.colors.primary.main,
                              },
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <RelationshipIcon sx={{ mr: 1, fontSize: 18 }} />
                              Relationship
                            </Box>
                          </InputLabel>
                          <Select
                            value={member.relationship}
                            onChange={(e) => updateFamilyMember(index, 'relationship', e.target.value)}
                            label="Relationship"
                            error={!!getFieldError(index, 'relationship')}
                          >
                            {relationshipOptions.map((option) => (
                              <MenuItem key={option.value} value={option.value}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>

                      {/* Notes */}
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          multiline
                          rows={2}
                          label="Additional Notes (Optional)"
                          placeholder="Any additional medical or contact information..."
                          value={member.notes || ''}
                          onChange={(e) => updateFamilyMember(index, 'notes', e.target.value)}
                          inputProps={{ maxLength: 200 }}
                          helperText={`${(member.notes || '').length}/200 characters`}
                          sx={{
                            ...theme.components.textField,
                          }}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Fade>
            );
          })}
        </Box>
      )}

      {/* Add Family Member Button */}
      <Fade in timeout={1200}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={addFamilyMember}
            sx={{
              ...theme.components.primaryButton,
              px: { xs: 3, sm: 4 },
            }}
          >
            Add Family Member
          </Button>
        </Box>
      </Fade>

      {/* Information */}
      <Divider sx={{ my: 2, borderColor: theme.colors.primary.border }} />
      <Fade in timeout={1400}>
        <Alert
          severity="info"
          sx={{
            borderRadius: 2,
            border: `1px solid ${theme.colors.primary.border}`,
            background: theme.colors.primary.light,
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            <strong>Family Registration Benefits:</strong>
            <br />
            • Single mobile number for all family members
            <br />
            • Shared appointment booking
            <br />
            • Consolidated medical records
            <br />
            • Easy family healthcare management
          </Typography>
        </Alert>
      </Fade>
    </Box>
  );
};