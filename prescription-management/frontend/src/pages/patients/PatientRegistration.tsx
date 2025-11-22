import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  Alert,
  CircularProgress,
  Divider,
  FormControlLabel,
  Checkbox,
  Paper,
} from '@mui/material';
import StandardDatePicker from '../../components/common/StandardDatePicker';
import { Person as PersonIcon } from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  useCreatePatientMutation,
  useCreateFamilyMemberMutation,
  useUpdatePatientMutation,
  useCheckFamilyExistsQuery,
  useGetFamilyMembersQuery,
  type PatientCreate,
  type FamilyMember,
} from '../../store/api';
import { PatientRegistrationWizard } from '../../components/patients/PatientRegistrationWizard';
import { FamilyMemberForm } from '../../components/patients/FamilyMemberForm';
import { FamilyExistsAlert } from '../../components/patients/FamilyExistsAlert';

interface PatientFormData extends Omit<PatientCreate, 'date_of_birth' | 'relationship' | 'primary_member'> {
  date_of_birth: Date | null;
  has_emergency_contact: boolean;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
}

interface RegistrationState {
  currentStep: number;
  primaryPatient: PatientFormData;
  familyMembers: FamilyMember[];
  registrationMode: 'new_family' | 'add_to_family' | 'individual';
  editingMemberId?: string; // Track which family member is being edited
}

export const PatientRegistration = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [createPatient, { isLoading: isCreatingPatient }] = useCreatePatientMutation();
  const [createFamilyMember, { isLoading: isCreatingFamilyMember }] = useCreateFamilyMemberMutation();
  const [updatePatient, { isLoading: isUpdatingPatient }] = useUpdatePatientMutation();
  
  // Check if we're in edit mode or add family mode
  const isEditMode = searchParams.get('edit') === 'true';
  const editMobile = searchParams.get('mobile');
  const editFirstName = searchParams.get('firstName');
  const editMode = searchParams.get('mode'); // 'family' or 'primary' or 'add_family'

  // add_family mode: Adding a new family member to an existing family
  const isAddFamilyMode = editMode === 'add_family' && editMobile;

  const [registrationState, setRegistrationState] = useState<RegistrationState>({
    currentStep: (isEditMode && editMode === 'family') || isAddFamilyMode ? 1 : 0, // Start at family step for family edits and add family
    primaryPatient: {
      mobile_number: editMobile || '',
      first_name: isEditMode && editMode !== 'family' ? editFirstName || '' : '', // Only pre-fill for primary edits
      last_name: '',
      date_of_birth: null,
      gender: 'male',
      email: '',
      address: '',
      notes: '',
      has_emergency_contact: false,
      emergency_contact_name: '',
      emergency_contact_phone: '',
      emergency_contact_relationship: '',
    },
    familyMembers: [],
    registrationMode: 'new_family',
    editingMemberId: isEditMode && editMode === 'family' ? `${editMobile}-${editFirstName}` : undefined,
  });
  
  const [shouldCheckFamily, setShouldCheckFamily] = useState(false);
  const [error, setError] = useState<string>('');
  
  // Check if family exists when mobile number is entered
  const {
    data: familyExistsData,
    isLoading: isCheckingFamily,
    error: familyCheckError,
  } = useCheckFamilyExistsQuery(
    registrationState.primaryPatient.mobile_number,
    {
      skip: !shouldCheckFamily || registrationState.primaryPatient.mobile_number.length !== 10,
    }
  );

  // Fetch family data for edit mode or add family mode
  const {
    data: editFamilyData,
    isLoading: isLoadingEditData,
    error: editDataError,
  } = useGetFamilyMembersQuery(editMobile || '', {
    skip: (!isEditMode && !isAddFamilyMode) || !editMobile,
  });
  
  const isLoading = isCreatingPatient || isCreatingFamilyMember || isUpdatingPatient || isLoadingEditData;

  // Check family existence when mobile number changes
  useEffect(() => {
    if (registrationState.primaryPatient.mobile_number.length === 10) {
      setShouldCheckFamily(true);
    } else {
      setShouldCheckFamily(false);
    }
  }, [registrationState.primaryPatient.mobile_number]);

  // Populate form with edit data when available (including add_family mode)
  useEffect(() => {
    if ((isEditMode || isAddFamilyMode) && editFamilyData && editMobile) {
      if (editMode === 'family' || editMode === 'add_family') {
        // For family member edits or adding new family members
        if (editFamilyData.primary_member) {
          // Set primary member data (always needed for context)
          setRegistrationState(prev => ({
            ...prev,
            primaryPatient: {
              mobile_number: editFamilyData.primary_member.mobile_number,
              first_name: editFamilyData.primary_member.first_name,
              last_name: editFamilyData.primary_member.last_name,
              date_of_birth: new Date(editFamilyData.primary_member.date_of_birth),
              gender: editFamilyData.primary_member.gender,
              email: editFamilyData.primary_member.email || '',
              address: editFamilyData.primary_member.address || '',
              notes: editFamilyData.primary_member.notes || '',
              has_emergency_contact: !!editFamilyData.primary_member.emergency_contact,
              emergency_contact_name: editFamilyData.primary_member.emergency_contact?.name || '',
              emergency_contact_phone: editFamilyData.primary_member.emergency_contact?.phone || '',
              emergency_contact_relationship: editFamilyData.primary_member.emergency_contact?.relationship || '',
            },
            // For add_family mode: start with empty array (only add NEW members)
            // For family edit mode: load existing members for editing
            familyMembers: editMode === 'add_family'
              ? []
              : editFamilyData.family_members
                  .filter(member => member.relationship_to_primary !== 'self') // Exclude primary member
                  .map(member => ({
                    first_name: member.first_name,
                    last_name: member.last_name,
                    date_of_birth: member.date_of_birth,
                    gender: member.gender,
                    relationship: member.relationship_to_primary as any,
                    notes: member.notes || '',
                  })),
          }));
        }
      } else {
        // For primary member edits, just populate the primary patient
        const patientToEdit = editFamilyData.primary_member;
        if (patientToEdit && patientToEdit.first_name === editFirstName) {
          setRegistrationState(prev => ({
            ...prev,
            primaryPatient: {
              mobile_number: patientToEdit.mobile_number,
              first_name: patientToEdit.first_name,
              last_name: patientToEdit.last_name,
              date_of_birth: new Date(patientToEdit.date_of_birth),
              gender: patientToEdit.gender,
              email: patientToEdit.email || '',
              address: patientToEdit.address || '',
              notes: patientToEdit.notes || '',
              has_emergency_contact: !!patientToEdit.emergency_contact,
              emergency_contact_name: patientToEdit.emergency_contact?.name || '',
              emergency_contact_phone: patientToEdit.emergency_contact?.phone || '',
              emergency_contact_relationship: patientToEdit.emergency_contact?.relationship || '',
            },
          }));
        }
      }
    }
  }, [isEditMode, isAddFamilyMode, editFamilyData, editMobile, editFirstName, editMode]);

  const handlePrimaryPatientChange = (field: keyof PatientFormData, value: any) => {
    setRegistrationState(prev => ({
      ...prev,
      primaryPatient: {
        ...prev.primaryPatient,
        [field]: value,
      },
    }));
    setError('');
  };

  const handleFamilyMembersChange = (members: FamilyMember[]) => {
    setRegistrationState(prev => ({
      ...prev,
      familyMembers: members,
    }));
  };

  const handleStepChange = (step: number) => {
    setRegistrationState(prev => ({ ...prev, currentStep: step }));
  };
  
  const handleNext = () => {
    if (registrationState.currentStep < 2) {
      setRegistrationState(prev => ({
        ...prev,
        currentStep: prev.currentStep + 1,
      }));
    }
  };
  
  const handleBack = () => {
    if (registrationState.currentStep > 0) {
      setRegistrationState(prev => ({
        ...prev,
        currentStep: prev.currentStep - 1,
      }));
    }
  };
  
  const validateCurrentStep = (): boolean => {
    const { currentStep, primaryPatient } = registrationState;

    switch (currentStep) {
      case 0: // Primary Patient
        return !!(primaryPatient.mobile_number &&
                 primaryPatient.first_name &&
                 primaryPatient.last_name &&
                 primaryPatient.date_of_birth &&
                 primaryPatient.gender);
      case 1: // Family Members (optional)
        return true;
      case 2: // Review
        return true;
      default:
        return false;
    }
  };

  const validateForSubmission = (): boolean => {
    return validateCurrentStep() && registrationState.currentStep === 2;
  };
  
  const handleSubmit = async () => {
    if (!registrationState.primaryPatient.date_of_birth) {
      setError('Date of birth is required');
      return;
    }

    try {
      setError('');

      if (isEditMode || isAddFamilyMode) {
        // Edit mode or add family mode: Only save changes, don't create new patients
        if (editMode === 'family' || editMode === 'add_family') {
          // In family edit/add mode, we're only adding/updating family members
          // The primary patient already exists, so we only handle new family members
          if (registrationState.familyMembers.length > 0) {
            if (editMode === 'add_family') {
              // In add_family mode, all members in the array are NEW
              for (const member of registrationState.familyMembers) {
                await createFamilyMember({
                  mobile_number: registrationState.primaryPatient.mobile_number,
                  ...member
                }).unwrap();
              }
            } else {
              // In family edit mode, find new/updated family members
              const originalMembers = editFamilyData?.family_members
                .filter(m => m.relationship_to_primary !== 'self') // Exclude primary member from comparison
                .map(m => ({
                  firstName: m.first_name,
                  lastName: m.last_name,
                  fullName: `${m.first_name} ${m.last_name}`
                })) || [];

              for (const member of registrationState.familyMembers) {
                const memberFullName = `${member.first_name} ${member.last_name}`;

                // Check if this member already exists in the original data
                const existingMember = originalMembers.find(
                  m => m.firstName === member.first_name && m.lastName === member.last_name
                );

                if (existingMember) {
                  // Update existing member
                  await updatePatient({
                    mobile_number: registrationState.primaryPatient.mobile_number,
                    first_name: member.first_name,
                    patientData: {
                      last_name: member.last_name,
                      date_of_birth: member.date_of_birth,
                      gender: member.gender,
                      notes: member.notes || undefined,
                    }
                  }).unwrap();
                } else {
                  // Add new member
                  await createFamilyMember({
                    mobile_number: registrationState.primaryPatient.mobile_number,
                    ...member
                  }).unwrap();
                }
              }
            }
          }
        } else {
          // Primary member edit mode - Update the primary patient
          if (editMobile && editFirstName) {
            await updatePatient({
              mobile_number: editMobile,
              first_name: editFirstName,
              patientData: {
                last_name: registrationState.primaryPatient.last_name,
                date_of_birth: registrationState.primaryPatient.date_of_birth?.toISOString().split('T')[0],
                gender: registrationState.primaryPatient.gender,
                email: registrationState.primaryPatient.email || undefined,
                address: registrationState.primaryPatient.address || undefined,
                notes: registrationState.primaryPatient.notes || undefined,
              }
            }).unwrap();
          }
        }
      } else {
        // New registration mode: Create new primary patient and family members
        const primaryPatientData: PatientCreate = {
          mobile_number: registrationState.primaryPatient.mobile_number,
          first_name: registrationState.primaryPatient.first_name,
          last_name: registrationState.primaryPatient.last_name,
          date_of_birth: registrationState.primaryPatient.date_of_birth.toISOString().split('T')[0],
          gender: registrationState.primaryPatient.gender,
          email: registrationState.primaryPatient.email || undefined,
          address: registrationState.primaryPatient.address || undefined,
          relationship: 'self',  // Primary patient is always 'self'
          primary_member: true,  // Primary patient is always true
        };

        // Add emergency contact if provided
        if (registrationState.primaryPatient.has_emergency_contact && 
            registrationState.primaryPatient.emergency_contact_name) {
          primaryPatientData.emergency_contact = {
            name: registrationState.primaryPatient.emergency_contact_name,
            phone: registrationState.primaryPatient.emergency_contact_phone,
            relationship: registrationState.primaryPatient.emergency_contact_relationship,
          };
        }

        // Create primary patient first
        const createdPatient = await createPatient(primaryPatientData).unwrap();
        
        // Then add family members one by one if any exist
        if (registrationState.familyMembers.length > 0) {
          for (const member of registrationState.familyMembers) {
            await createFamilyMember({
              mobile_number: registrationState.primaryPatient.mobile_number,
              ...member
            }).unwrap();
          }
        }
      }
      
      // Navigate to family view
      navigate(`/patients/family/${registrationState.primaryPatient.mobile_number}`);
    } catch (err: any) {
      console.error('Failed to register patient/family:', err);
      
      // Extract meaningful error message
      let errorMessage = 'Failed to register patient';
      
      if (err?.data?.detail) {
        if (typeof err.data.detail === 'string') {
          errorMessage = err.data.detail;
        } else if (Array.isArray(err.data.detail)) {
          // Handle validation errors
          const firstError = err.data.detail[0];
          if (firstError?.msg) {
            errorMessage = `${firstError.loc?.join(' → ') || 'Field'}: ${firstError.msg}`;
          } else {
            errorMessage = 'Validation error occurred';
          }
        }
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    }
  };
  
  // Family exists alert handlers
  const handleAddToFamily = () => {
    // Navigate to add family member page
    navigate(`/patients/family/${registrationState.primaryPatient.mobile_number}/add-member`);
  };
  
  const handleViewFamily = () => {
    // Navigate to family view
    navigate(`/patients/family/${registrationState.primaryPatient.mobile_number}`);
  };
  
  const handleContinueNewRegistration = () => {
    // Continue with current registration (ignore existing family)
    setRegistrationState(prev => ({ ...prev, registrationMode: 'individual' }));
  };

  const renderStepContent = () => {
    switch (registrationState.currentStep) {
      case 0:
        return (
          <PrimaryPatientStep
            formData={registrationState.primaryPatient}
            onChange={handlePrimaryPatientChange}
            familyExistsData={familyExistsData}
            isCheckingFamily={isCheckingFamily}
            onAddToFamily={handleAddToFamily}
            onViewFamily={handleViewFamily}
            onContinueNewRegistration={handleContinueNewRegistration}
          />
        );
      case 1:
        return (
          <FamilyMemberForm
            familyMembers={registrationState.familyMembers}
            onChange={handleFamilyMembersChange}
            editingMemberId={registrationState.editingMemberId}
          />
        );
      case 2:
        return (
          <ReviewStep
            primaryPatient={registrationState.primaryPatient}
            familyMembers={registrationState.familyMembers}
          />
        );
      default:
        return null;
    }
  };

  // Show loading state while fetching edit data or family data
  if ((isEditMode || isAddFamilyMode) && isLoadingEditData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Show error if edit data failed to load
  if ((isEditMode || isAddFamilyMode) && editDataError) {
    return (
      <Alert severity="error">
        Failed to load {isAddFamilyMode ? 'family' : 'patient'} data. Please try again.
      </Alert>
    );
  }

  return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <PersonIcon sx={{ mr: 1, fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            {isAddFamilyMode
              ? 'Add Family Member'
              : isEditMode
                ? 'Edit Patient Information'
                : 'Patient & Family Registration'
            }
          </Typography>
        </Box>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {isAddFamilyMode
            ? `Adding a new family member to the existing family with mobile number: ${editMobile}`
            : isEditMode
              ? `Editing information for ${editFirstName} (${editMobile})`
              : 'Register patients and family members using a single mobile number for convenient healthcare management.'
          }
        </Typography>

        <PatientRegistrationWizard
          currentStep={registrationState.currentStep}
          onStepChange={handleStepChange}
          onNext={handleNext}
          onBack={handleBack}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          canGoNext={validateCurrentStep()}
          canSubmit={validateForSubmission()}
          error={error}
          submitButtonText={
            isAddFamilyMode
              ? 'Add Family Member'
              : isEditMode
                ? (editMode === 'family' ? 'Save Family Changes' : 'Save Patient Changes')
                : 'Complete Registration'
          }
        >
          {renderStepContent()}
        </PatientRegistrationWizard>
      </Box>
  );
};

// Primary Patient Step Component
interface PrimaryPatientStepProps {
  formData: PatientFormData;
  onChange: (field: keyof PatientFormData, value: any) => void;
  familyExistsData?: any;
  isCheckingFamily: boolean;
  onAddToFamily: () => void;
  onViewFamily: () => void;
  onContinueNewRegistration: () => void;
}

const PrimaryPatientStep = ({
  formData,
  onChange,
  familyExistsData,
  isCheckingFamily,
  onAddToFamily,
  onViewFamily,
  onContinueNewRegistration,
}: PrimaryPatientStepProps) => {
  const handleInputChange = (field: keyof PatientFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    onChange(field, event.target.value);
  };

  return (
    <Box>
      {/* Family Exists Alert */}
      {familyExistsData?.exists && (
        <FamilyExistsAlert
          familyData={familyExistsData}
          onAddToFamily={onAddToFamily}
          onViewFamily={onViewFamily}
          onContinueNewRegistration={onContinueNewRegistration}
        />
      )}

      <Typography variant="h6" gutterBottom color="primary">
        Primary Patient Information
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Enter the main patient details. This person will be the primary contact for the family.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Mobile Number"
            required
            value={formData.mobile_number}
            onChange={handleInputChange('mobile_number')}
            helperText={isCheckingFamily ? "Checking family..." : "10-digit mobile number"}
            InputProps={{
              endAdornment: isCheckingFamily ? <CircularProgress size={20} /> : undefined,
            }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="First Name"
            required
            value={formData.first_name}
            onChange={handleInputChange('first_name')}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Last Name"
            required
            value={formData.last_name}
            onChange={handleInputChange('last_name')}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <StandardDatePicker
            label="Date of Birth"
            dateType="date_of_birth"
            value={formData.date_of_birth}
            onChange={(date) => onChange('date_of_birth', date)}
            required={true}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            select
            label="Gender"
            required
            value={formData.gender}
            onChange={handleInputChange('gender')}
          >
            <MenuItem value="male">Male</MenuItem>
            <MenuItem value="female">Female</MenuItem>
            <MenuItem value="other">Other</MenuItem>
          </TextField>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={formData.email}
            onChange={handleInputChange('email')}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Address"
            multiline
            rows={3}
            value={formData.address}
            onChange={handleInputChange('address')}
          />
        </Grid>

        {/* Emergency Contact */}
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.has_emergency_contact}
                onChange={(e) => onChange('has_emergency_contact', e.target.checked)}
              />
            }
            label="Add Emergency Contact"
          />
        </Grid>

        {formData.has_emergency_contact && (
          <>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Emergency Contact Name"
                value={formData.emergency_contact_name}
                onChange={handleInputChange('emergency_contact_name')}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Emergency Contact Phone"
                value={formData.emergency_contact_phone}
                onChange={handleInputChange('emergency_contact_phone')}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Emergency Contact Relationship"
                value={formData.emergency_contact_relationship}
                onChange={handleInputChange('emergency_contact_relationship')}
              />
            </Grid>
          </>
        )}

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Additional Notes"
            multiline
            rows={2}
            value={formData.notes}
            onChange={handleInputChange('notes')}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

// Review Step Component
interface ReviewStepProps {
  primaryPatient: PatientFormData;
  familyMembers: FamilyMember[];
}

const ReviewStep = ({ primaryPatient, familyMembers }: ReviewStepProps) => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom color="primary">
        Review & Confirm Registration
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Please review all information before submitting the registration.
      </Typography>

      {/* Primary Patient Summary */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'action.hover' }}>
        <Typography variant="h6" gutterBottom>
          Primary Patient
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2"><strong>Name:</strong> {primaryPatient.first_name} {primaryPatient.last_name}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2"><strong>Mobile:</strong> {primaryPatient.mobile_number}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2"><strong>Gender:</strong> {primaryPatient.gender}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2"><strong>Date of Birth:</strong> {primaryPatient.date_of_birth?.toLocaleDateString()}</Typography>
          </Grid>
          {primaryPatient.email && (
            <Grid item xs={12}>
              <Typography variant="body2"><strong>Email:</strong> {primaryPatient.email}</Typography>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Family Members Summary */}
      {familyMembers.length > 0 && (
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'action.hover' }}>
          <Typography variant="h6" gutterBottom>
            Family Members ({familyMembers.length})
          </Typography>
          {familyMembers.map((member, index) => (
            <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Typography variant="body2"><strong>{member.first_name} {member.last_name}</strong> - {member.relationship}</Typography>
              <Typography variant="caption" color="text.secondary">
                {member.gender} • Born: {member.date_of_birth}
              </Typography>
            </Box>
          ))}
        </Paper>
      )}

      <Alert severity="info">
        <Typography variant="body2">
          <strong>Registration Summary:</strong>
          <br />
          • {familyMembers.length > 0 ? 'Family' : 'Individual'} registration for mobile number {primaryPatient.mobile_number}
          <br />
          • Total members: {familyMembers.length + 1}
          <br />
          • All members will share the same mobile number for appointments
        </Typography>
      </Alert>
    </Box>
  );
};