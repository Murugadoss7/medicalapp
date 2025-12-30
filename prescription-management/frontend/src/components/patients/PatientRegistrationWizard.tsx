/**
 * Patient Registration Wizard - Medical Futurism Design
 * Stepper component with purple gradient theme
 */

import { ReactNode } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Typography,
  Button,
  Alert,
  Fade,
  CircularProgress,
} from '@mui/material';
import {
  Person as PersonIcon,
  Group as FamilyIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import theme from '../../theme/medicalFuturismTheme';

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
  },
  {
    label: 'Family Members',
    icon: FamilyIcon,
  },
  {
    label: 'Review',
    icon: CheckIcon,
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
    if (stepIndex < currentStep) {
      onStepChange(stepIndex);
    }
  };

  return (
    <Box>
      {/* Stepper - Glassmorphism */}
      <Fade in timeout={800}>
        <Paper
          elevation={0}
          sx={{
            ...theme.components.glassPaper,
            p: { xs: 1.5, sm: 2 },
            mb: 2,
          }}
        >
          <Stepper
            activeStep={currentStep}
            alternativeLabel
            sx={{
              '& .MuiStepConnector-line': {
                borderColor: theme.colors.primary.border,
                borderTopWidth: 2,
              },
              '& .MuiStepConnector-root.Mui-active .MuiStepConnector-line': {
                borderColor: theme.colors.primary.main,
              },
              '& .MuiStepConnector-root.Mui-completed .MuiStepConnector-line': {
                borderColor: theme.colors.primary.main,
              },
            }}
          >
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;

              return (
                <Step key={step.label}>
                  <StepLabel
                    onClick={() => handleStepClick(index)}
                    sx={{
                      cursor: index < currentStep ? 'pointer' : 'default',
                    }}
                    icon={
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: { xs: 40, sm: 48 },
                          height: { xs: 40, sm: 48 },
                          borderRadius: '50%',
                          background: isActive || isCompleted
                            ? theme.colors.primary.gradient
                            : theme.colors.primary.light,
                          color: isActive || isCompleted ? 'white' : theme.colors.primary.main,
                          boxShadow: isActive
                            ? '0 4px 16px rgba(102, 126, 234, 0.4)'
                            : 'none',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          transform: isActive ? 'scale(1.1)' : 'scale(1)',
                        }}
                      >
                        <StepIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                      </Box>
                    }
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: isActive ? 700 : 600,
                        fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                        color: isActive ? theme.colors.primary.main : 'text.secondary',
                        mt: 0.5,
                      }}
                    >
                      {step.label}
                    </Typography>
                  </StepLabel>
                </Step>
              );
            })}
          </Stepper>
        </Paper>
      </Fade>

      {/* Error Display */}
      {error && (
        <Fade in timeout={400}>
          <Alert
            severity="error"
            sx={{
              mb: 2,
              borderRadius: 2,
              border: '1px solid rgba(239, 68, 68, 0.2)',
            }}
          >
            {error}
          </Alert>
        </Fade>
      )}

      {/* Step Content - Glassmorphism */}
      <Fade in timeout={1000}>
        <Paper
          elevation={0}
          sx={{
            ...theme.components.glassPaper,
            p: { xs: 2, sm: 3 },
            mb: 2,
            minHeight: '400px',
          }}
        >
          {children}
        </Paper>
      </Fade>

      {/* Navigation Buttons */}
      <Fade in timeout={1200}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={onBack}
            disabled={isFirstStep || isLoading}
            sx={{
              ...theme.components.outlinedButton,
              minWidth: { xs: 100, sm: 120 },
            }}
          >
            Back
          </Button>

          <Box sx={{ display: 'flex', gap: 2 }}>
            {!isLastStep ? (
              <Button
                variant="contained"
                onClick={onNext}
                disabled={!canGoNext || isLoading}
                startIcon={isLoading ? <CircularProgress size={18} color="inherit" /> : undefined}
                sx={{
                  ...theme.components.primaryButton,
                  minWidth: { xs: 100, sm: 120 },
                }}
              >
                {isLoading ? 'Processing...' : 'Next'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={onSubmit}
                disabled={!canSubmit || isLoading}
                startIcon={isLoading ? <CircularProgress size={18} color="inherit" /> : <CheckIcon />}
                sx={{
                  ...theme.components.primaryButton,
                  minWidth: { xs: 140, sm: 180 },
                  background: isLoading
                    ? theme.colors.status.success
                    : theme.colors.primary.gradient,
                  '&:hover': {
                    background: isLoading
                      ? theme.colors.status.success
                      : theme.colors.primary.gradientHover,
                  },
                }}
              >
                {isLoading ? 'Saving...' : submitButtonText}
              </Button>
            )}
          </Box>
        </Box>
      </Fade>
    </Box>
  );
};
