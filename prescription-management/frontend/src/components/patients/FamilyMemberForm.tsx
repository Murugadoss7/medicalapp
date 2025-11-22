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
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <FamilyIcon sx={{ mr: 2, color: 'primary.main' }} />
        <Typography variant="h6" color="primary">
          Family Members
        </Typography>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Add family members who will use the same mobile number for appointments.
        This helps manage family healthcare together.
      </Typography>

      {/* Family Members List */}
      {familyMembers.length === 0 ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            No family members added yet. Click "Add Family Member" to register additional family members.
          </Typography>
        </Alert>
      ) : (
        <Box sx={{ mb: 3 }}>
          {familyMembers.map((member, index) => {
            const isEditing = isEditingMember(member, index);
            return (
              <Card 
                key={index} 
                sx={{ 
                  mb: 2, 
                  border: '2px solid', 
                  borderColor: isEditing ? 'primary.main' : 'grey.300',
                  bgcolor: isEditing ? 'primary.50' : 'background.paper',
                  boxShadow: isEditing ? 3 : 1,
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', color: isEditing ? 'primary.main' : 'inherit' }}>
                      <PersonIcon sx={{ mr: 1 }} />
                      {isEditing ? `Editing: ${member.first_name || 'Family Member'} ${member.last_name || ''}` : `Family Member ${index + 1}`}
                    </Typography>
                  <IconButton
                    onClick={() => removeFamilyMember(index)}
                    color="error"
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>

                <Grid container spacing={2}>
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
                        startAdornment: <AgeIcon sx={{ mr: 1, color: 'action.active' }} />
                      }}
                      error={!!getFieldError(index, 'date_of_birth')}
                      helperText={getFieldError(index, 'date_of_birth')}
                    />
                  </Grid>

                  {/* Gender */}
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required>
                      <InputLabel>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <GenderIcon sx={{ mr: 1 }} />
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
                    <FormControl fullWidth required>
                      <InputLabel>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <RelationshipIcon sx={{ mr: 1 }} />
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
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            );
          })}
        </Box>
      )}

      {/* Add Family Member Button */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={addFamilyMember}
          sx={{ px: 4 }}
        >
          Add Family Member
        </Button>
      </Box>

      {/* Information */}
      <Divider sx={{ my: 3 }} />
      <Alert severity="info">
        <Typography variant="body2">
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
    </Box>
  );
};