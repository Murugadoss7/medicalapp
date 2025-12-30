/**
 * Patient Registration - Medical Futurism Design
 * Wizard-style registration with iPad-optimized inputs
 */

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
  Container,
  Fade,
  Chip,
} from '@mui/material';
import StandardDatePicker from '../../components/common/StandardDatePicker';
import { Person as PersonIcon, CheckCircle as CheckIcon, ArrowBack as BackIcon } from '@mui/icons-material';
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
  editingMemberId?: string;
}

export const PatientRegistration = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [createPatient, { isLoading: isCreatingPatient }] = useCreatePatientMutation();
  const [createFamilyMember, { isLoading: isCreatingFamilyMember }] = useCreateFamilyMemberMutation();
  const [updatePatient, { isLoading: isUpdatingPatient }] = useUpdatePatientMutation();

  const isEditMode = searchParams.get('edit') === 'true';
  const editMobile = searchParams.get('mobile');
  const editFirstName = searchParams.get('firstName');
  const editMode = searchParams.get('mode');
  const isAddFamilyMode = editMode === 'add_family' && editMobile;

  const [registrationState, setRegistrationState] = useState<RegistrationState>({
    currentStep: (isEditMode && editMode === 'family') || isAddFamilyMode ? 1 : 0,
    primaryPatient: {
      mobile_number: editMobile || '',
      first_name: isEditMode && editMode !== 'family' ? editFirstName || '' : '',
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

  const {
    data: editFamilyData,
    isLoading: isLoadingEditData,
    error: editDataError,
  } = useGetFamilyMembersQuery(editMobile || '', {
    skip: (!isEditMode && !isAddFamilyMode) || !editMobile,
  });

  const isLoading = isCreatingPatient || isCreatingFamilyMember || isUpdatingPatient || isLoadingEditData;

  useEffect(() => {
    if (registrationState.primaryPatient.mobile_number.length === 10) {
      setShouldCheckFamily(true);
    } else {
      setShouldCheckFamily(false);
    }
  }, [registrationState.primaryPatient.mobile_number]);

  useEffect(() => {
    if ((isEditMode || isAddFamilyMode) && editFamilyData && editMobile) {
      if (editMode === 'family' || editMode === 'add_family') {
        if (editFamilyData.primary_member) {
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
            familyMembers: editMode === 'add_family'
              ? []
              : editFamilyData.family_members
                  .filter(member => member.relationship_to_primary !== 'self')
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
      case 0:
        return !!(primaryPatient.mobile_number &&
                 primaryPatient.first_name &&
                 primaryPatient.last_name &&
                 primaryPatient.date_of_birth &&
                 primaryPatient.gender);
      case 1:
        return true;
      case 2:
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
        if (editMode === 'family' || editMode === 'add_family') {
          if (registrationState.familyMembers.length > 0) {
            if (editMode === 'add_family') {
              for (const member of registrationState.familyMembers) {
                await createFamilyMember({
                  mobile_number: registrationState.primaryPatient.mobile_number,
                  ...member
                }).unwrap();
              }
            } else {
              const originalMembers = editFamilyData?.family_members
                .filter(m => m.relationship_to_primary !== 'self')
                .map(m => ({
                  firstName: m.first_name,
                  lastName: m.last_name,
                  fullName: `${m.first_name} ${m.last_name}`
                })) || [];

              for (const member of registrationState.familyMembers) {
                const memberFullName = `${member.first_name} ${member.last_name}`;

                const existingMember = originalMembers.find(
                  m => m.firstName === member.first_name && m.lastName === member.last_name
                );

                if (existingMember) {
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
                  await createFamilyMember({
                    mobile_number: registrationState.primaryPatient.mobile_number,
                    ...member
                  }).unwrap();
                }
              }
            }
          }
        } else {
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
        const primaryPatientData: PatientCreate = {
          mobile_number: registrationState.primaryPatient.mobile_number,
          first_name: registrationState.primaryPatient.first_name,
          last_name: registrationState.primaryPatient.last_name,
          date_of_birth: registrationState.primaryPatient.date_of_birth.toISOString().split('T')[0],
          gender: registrationState.primaryPatient.gender,
          email: registrationState.primaryPatient.email || undefined,
          address: registrationState.primaryPatient.address || undefined,
          relationship: 'self',
          primary_member: true,
        };

        if (registrationState.primaryPatient.has_emergency_contact &&
            registrationState.primaryPatient.emergency_contact_name) {
          primaryPatientData.emergency_contact = {
            name: registrationState.primaryPatient.emergency_contact_name,
            phone: registrationState.primaryPatient.emergency_contact_phone,
            relationship: registrationState.primaryPatient.emergency_contact_relationship,
          };
        }

        const createdPatient = await createPatient(primaryPatientData).unwrap();

        if (registrationState.familyMembers.length > 0) {
          for (const member of registrationState.familyMembers) {
            await createFamilyMember({
              mobile_number: registrationState.primaryPatient.mobile_number,
              ...member
            }).unwrap();
          }
        }
      }

      navigate(`/patients/family/${registrationState.primaryPatient.mobile_number}`);
    } catch (err: any) {
      console.error('Failed to register patient/family:', err);

      let errorMessage = 'Failed to register patient';

      if (err?.data?.detail) {
        if (typeof err.data.detail === 'string') {
          errorMessage = err.data.detail;
        } else if (Array.isArray(err.data.detail)) {
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

  const handleAddToFamily = () => {
    navigate(`/patients/family/${registrationState.primaryPatient.mobile_number}/add-member`);
  };

  const handleViewFamily = () => {
    navigate(`/patients/family/${registrationState.primaryPatient.mobile_number}`);
  };

  const handleContinueNewRegistration = () => {
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

  if ((isEditMode || isAddFamilyMode) && isLoadingEditData) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: '#667eea', mb: 2 }} />
        <Typography variant="body2" color="text.secondary">
          Loading patient data...
        </Typography>
      </Box>
    );
  }

  if ((isEditMode || isAddFamilyMode) && editDataError) {
    return (
      <Container maxWidth="md">
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          Failed to load {isAddFamilyMode ? 'family' : 'patient'} data. Please try again.
        </Alert>
      </Container>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100%',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)',
        position: 'relative',
        py: 2,
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

      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Header with Back Button */}
        <Fade in timeout={600}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Button
              startIcon={<BackIcon />}
              onClick={() => navigate('/patients')}
              sx={{
                minHeight: 40,
                px: 2,
                color: '#667eea',
                fontWeight: 600,
                fontSize: { xs: '0.875rem', sm: '1rem' },
                border: '1px solid rgba(102, 126, 234, 0.3)',
                '&:hover': {
                  background: 'rgba(102, 126, 234, 0.08)',
                  borderColor: '#667eea',
                },
              }}
            >
              Back
            </Button>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                  mr: 1.5,
                }}
              >
                <PersonIcon sx={{ color: 'white', fontSize: 22 }} />
              </Box>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: '1.25rem', sm: '1.5rem' },
                  color: '#667eea',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.2,
                }}
              >
                {isAddFamilyMode
                  ? 'Add Family Member'
                  : isEditMode
                    ? 'Edit Patient'
                    : 'Patient Registration'
                }
              </Typography>
            </Box>
          </Box>
        </Fade>

        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
          {isAddFamilyMode
            ? `Adding to family: ${editMobile}`
            : isEditMode
              ? `Editing: ${editFirstName} (${editMobile})`
              : 'Create new patient record'
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
                ? (editMode === 'family' ? 'Save Family Changes' : 'Save Changes')
                : 'Complete Registration'
          }
        >
          {renderStepContent()}
        </PatientRegistrationWizard>
      </Container>
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
      {familyExistsData?.exists && (
        <FamilyExistsAlert
          familyData={familyExistsData}
          onAddToFamily={onAddToFamily}
          onViewFamily={onViewFamily}
          onContinueNewRegistration={onContinueNewRegistration}
        />
      )}

      <Typography
        variant="subtitle1"
        sx={{
          fontWeight: 700,
          fontSize: '0.9375rem',
          color: '#667eea',
          mb: 0.5,
        }}
      >
        Primary Patient Information
      </Typography>
      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem', mb: 2, display: 'block' }}>
        Enter the main patient details
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Mobile Number"
            required
            value={formData.mobile_number}
            onChange={handleInputChange('mobile_number')}
            helperText={isCheckingFamily ? "Checking family..." : "10-digit mobile"}
            InputProps={{
              endAdornment: isCheckingFamily ? <CircularProgress size={20} sx={{ color: '#667eea' }} /> : undefined,
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
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
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#667eea',
              },
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
            sx={{
              '& .MuiOutlinedInput-root': {
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
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#667eea',
              },
            }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Last Name"
            required
            value={formData.last_name}
            onChange={handleInputChange('last_name')}
            sx={{
              '& .MuiOutlinedInput-root': {
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
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#667eea',
              },
            }}
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
            sx={{
              '& .MuiOutlinedInput-root': {
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
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#667eea',
              },
            }}
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
            sx={{
              '& .MuiOutlinedInput-root': {
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
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#667eea',
              },
            }}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Address"
            multiline
            rows={2}
            value={formData.address}
            onChange={handleInputChange('address')}
            sx={{
              '& .MuiOutlinedInput-root': {
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
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#667eea',
              },
            }}
          />
        </Grid>

        {/* Emergency Contact */}
        <Grid item xs={12}>
          <Divider sx={{ my: 1, borderColor: 'rgba(102, 126, 234, 0.15)' }} />
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.has_emergency_contact}
                onChange={(e) => onChange('has_emergency_contact', e.target.checked)}
                sx={{
                  color: '#667eea',
                  '&.Mui-checked': {
                    color: '#667eea',
                  },
                }}
              />
            }
            label={
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Add Emergency Contact
              </Typography>
            }
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
                sx={{
                  '& .MuiOutlinedInput-root': {
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
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#667eea',
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Emergency Contact Phone"
                value={formData.emergency_contact_phone}
                onChange={handleInputChange('emergency_contact_phone')}
                sx={{
                  '& .MuiOutlinedInput-root': {
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
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#667eea',
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Relationship"
                value={formData.emergency_contact_relationship}
                onChange={handleInputChange('emergency_contact_relationship')}
                sx={{
                  '& .MuiOutlinedInput-root': {
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
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#667eea',
                  },
                }}
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
            sx={{
              '& .MuiOutlinedInput-root': {
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
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#667eea',
              },
            }}
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
      <Typography
        variant="subtitle1"
        sx={{
          fontWeight: 700,
          fontSize: '0.9375rem',
          color: '#667eea',
          mb: 0.5,
        }}
      >
        Review & Confirm
      </Typography>
      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem', mb: 2, display: 'block' }}>
        Please review before submitting
      </Typography>

      {/* Primary Patient Summary */}
      <Paper
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 2,
          background: 'rgba(102, 126, 234, 0.05)',
          border: '1px solid rgba(102, 126, 234, 0.15)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <CheckIcon sx={{ color: '#667eea', fontSize: 20 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
            Primary Patient
          </Typography>
        </Box>
        <Grid container spacing={1}>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
              {primaryPatient.first_name} {primaryPatient.last_name}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
              📱 {primaryPatient.mobile_number}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
              {primaryPatient.gender} • {primaryPatient.date_of_birth?.toLocaleDateString()}
            </Typography>
          </Grid>
          {primaryPatient.email && (
            <Grid item xs={12}>
              <Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                ✉️ {primaryPatient.email}
              </Typography>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Family Members Summary */}
      {familyMembers.length > 0 && (
        <Paper
          sx={{
            p: 2,
            mb: 2,
            borderRadius: 2,
            background: 'rgba(102, 126, 234, 0.05)',
            border: '1px solid rgba(102, 126, 234, 0.15)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <CheckIcon sx={{ color: '#667eea', fontSize: 20 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
              Family Members ({familyMembers.length})
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {familyMembers.map((member, index) => (
              <Box
                key={index}
                sx={{
                  p: 1,
                  borderRadius: 1,
                  border: '1px solid rgba(102, 126, 234, 0.1)',
                  background: 'rgba(255, 255, 255, 0.5)',
                }}
              >
                <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                  {member.first_name} {member.last_name}
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary', display: 'block' }}>
                  {member.relationship} • {member.gender} • {member.date_of_birth}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      )}

      <Alert
        severity="info"
        sx={{
          borderRadius: 2,
          border: '1px solid rgba(59, 130, 246, 0.2)',
          background: 'rgba(59, 130, 246, 0.05)',
        }}
      >
        <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
          <strong>Summary:</strong> {familyMembers.length > 0 ? 'Family' : 'Individual'} registration •
          {familyMembers.length + 1} member(s) • Mobile: {primaryPatient.mobile_number}
        </Typography>
      </Alert>
    </Box>
  );
};
