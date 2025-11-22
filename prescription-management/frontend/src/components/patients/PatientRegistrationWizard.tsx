import { useState, ReactNode } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Typography,
  Button,
  Alert,
} from '@mui/material';
import {
  Person as PersonIcon,
  LocalHospital as MedicalIcon,
  Group as FamilyIcon,
  Check as CheckIcon,
} from '@mui/icons-material';

interface PatientRegistrationWizardProps {
  children: ReactNode;
  currentStep: number;
  onStepChange: (step: number) => void;
  onNext: () => void;
  onBack: () => void;
  onSubmit: () => void;
  isLoading?: boolean;
  canGoNext?: boolean;
  canSubmit?: boolean;
  error?: string;
  submitButtonText?: string;
}

const steps = [
  {
    label: 'Primary Patient',
    icon: PersonIcon,
    description: 'Basic patient information',
  },
  {
    label: 'Family Members',
    icon: FamilyIcon,
    description: 'Add family members (optional)',
  },
  {
    label: 'Review & Submit',
    icon: CheckIcon,
    description: 'Review and confirm registration',
  },
];

export const PatientRegistrationWizard = ({
  children,
  currentStep,
  onStepChange,
  onNext,
  onBack,
  onSubmit,
  isLoading = false,
  canGoNext = false,
  canSubmit = false,
  error,
  submitButtonText = 'Complete Registration',
}: PatientRegistrationWizardProps) => {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  const handleStepClick = (stepIndex: number) => {
    // Allow clicking on previous steps only
    if (stepIndex < currentStep) {
      onStepChange(stepIndex);
    }
  };

  return (
    <Box>
      {/* Step Indicator */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Patient Registration Progress
        </Typography>
        <Stepper activeStep={currentStep} alternativeLabel>
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            return (
              <Step key={step.label}>
                <StepLabel
                  onClick={() => handleStepClick(index)}
                  sx={{
                    cursor: index < currentStep ? 'pointer' : 'default',
                    '& .MuiStepLabel-label': {
                      fontSize: '0.875rem',
                      fontWeight: index === currentStep ? 600 : 400,
                    },
                  }}
                  icon={
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        backgroundColor: index <= currentStep ? 'primary.main' : 'grey.300',
                        color: index <= currentStep ? 'white' : 'grey.600',
                      }}
                    >
                      <StepIcon fontSize="small" />
                    </Box>
                  }
                >
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" fontWeight={index === currentStep ? 600 : 400}>
                      {step.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {step.description}
                    </Typography>
                  </Box>
                </StepLabel>
              </Step>
            );
          })}
        </Stepper>
      </Paper>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Step Content */}
      <Paper sx={{ p: 4, mb: 3 }}>
        <Box sx={{ minHeight: '400px' }}>
          {children}
        </Box>
      </Paper>

      {/* Navigation Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          variant="outlined"
          onClick={onBack}
          disabled={isFirstStep || isLoading}
        >
          Back
        </Button>

        <Box sx={{ display: 'flex', gap: 2 }}>
          {!isLastStep ? (
            <Button
              variant="contained"
              onClick={onNext}
              disabled={!canGoNext || isLoading}
            >
              {isLoading ? 'Processing...' : 'Next'}
            </Button>
          ) : (
            <Button
              variant="contained"
              color="success"
              onClick={onSubmit}
              disabled={!canSubmit || isLoading}
              size="large"
            >
              {isLoading ? 'Saving...' : submitButtonText}
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
};