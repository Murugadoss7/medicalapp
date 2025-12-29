import { useState } from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Collapse,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
  Chip,
  Fade,
  Avatar,
} from '@mui/material';
import {
  Group as FamilyIcon,
  Person as PersonIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  NavigateNext as NavigateIcon,
  PersonAdd as AddMemberIcon,
  Cake as AgeIcon,
} from '@mui/icons-material';
import type { FamilyExistsResponse, Patient } from '../../store/api';
import theme from '../../theme/medicalFuturismTheme';

interface FamilyExistsAlertProps {
  familyData: FamilyExistsResponse;
  onAddToFamily: () => void;
  onViewFamily: () => void;
  onContinueNewRegistration: () => void;
  loading?: boolean;
}

const calculateAge = (dateOfBirth: string): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

const formatGender = (gender: string): string => {
  return gender.charAt(0).toUpperCase() + gender.slice(1);
};

const formatRelationship = (relationship: string): string => {
  return relationship.charAt(0).toUpperCase() + relationship.slice(1);
};

export const FamilyExistsAlert = ({
  familyData,
  onAddToFamily,
  onViewFamily,
  onContinueNewRegistration,
  loading = false,
}: FamilyExistsAlertProps) => {
  const [expanded, setExpanded] = useState(false);

  if (!familyData.exists) {
    return null;
  }

  const { primary_member, family_members, total_members, mobile_number } = familyData;

  return (
    <Fade in timeout={800}>
      <Alert
        severity="info"
        sx={{
          mb: 2,
          borderRadius: 3,
          border: `2px solid ${theme.colors.primary.main}`,
          background: `linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.08) 100%)`,
          backdropFilter: 'blur(20px)',
          boxShadow: '0 8px 24px rgba(102, 126, 234, 0.2)',
          '& .MuiAlert-message': { width: '100%' },
          '& .MuiAlert-icon': {
            color: theme.colors.primary.main,
          },
        }}
      >
        <AlertTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            color: theme.colors.primary.main,
            fontWeight: 700,
          }}
        >
          <FamilyIcon sx={{ mr: 1 }} />
          Family Found: {mobile_number}
        </AlertTitle>

        <Typography variant="caption" sx={{ mb: 2, display: 'block' }}>
          This mobile number is already registered with {total_members} family member{total_members > 1 ? 's' : ''}.
        </Typography>

        {/* Primary Member Info */}
        {primary_member && (
          <Box
            sx={{
              mb: 2,
              p: { xs: 1.5, sm: 2 },
              background: theme.colors.background.glass,
              backdropFilter: 'blur(10px)',
              border: `1px solid ${theme.colors.primary.border}`,
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(102, 126, 234, 0.1)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: theme.colors.primary.gradient,
                  color: 'white',
                  mr: 1,
                }}
              >
                <PersonIcon sx={{ fontSize: 16 }} />
              </Box>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  color: theme.colors.primary.main,
                }}
              >
                Primary Member
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Avatar
                sx={{
                  ...theme.components.avatar,
                  width: 36,
                  height: 36,
                  mr: 1.5,
                }}
              >
                {primary_member.full_name.charAt(0)}
              </Avatar>
              <Typography variant="body2" fontWeight="600">
                {primary_member.full_name}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
              <Chip
                icon={<AgeIcon sx={{ fontSize: 14 }} />}
                label={`${calculateAge(primary_member.date_of_birth)} years`}
                size="small"
                sx={{
                  ...theme.components.chip,
                  height: 24,
                  fontSize: '0.6875rem',
                }}
              />
              <Chip
                label={formatGender(primary_member.gender)}
                size="small"
                sx={{
                  textTransform: 'capitalize',
                  fontWeight: 600,
                  fontSize: '0.6875rem',
                  height: 24,
                  background: theme.colors.primary.light,
                  color: theme.colors.primary.main,
                  border: `1px solid ${theme.colors.primary.border}`,
                }}
              />
              {primary_member.relationship_to_primary && (
                <Chip
                  label={formatRelationship(primary_member.relationship_to_primary)}
                  size="small"
                  sx={{
                    ...theme.components.chip,
                    height: 24,
                    fontSize: '0.6875rem',
                  }}
                />
              )}
            </Box>
          </Box>
        )}

        {/* Family Members List (Collapsible) */}
        {family_members.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Button
              startIcon={expanded ? <CollapseIcon /> : <ExpandIcon />}
              onClick={() => setExpanded(!expanded)}
              size="small"
              sx={{
                mb: 1,
                color: theme.colors.primary.main,
                fontWeight: 600,
                '&:hover': {
                  background: theme.colors.primary.light,
                },
              }}
            >
              {expanded ? 'Hide' : 'Show'} Other Family Members ({family_members.length})
            </Button>

            <Collapse in={expanded}>
              <Box
                sx={{
                  background: theme.colors.background.glass,
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${theme.colors.primary.border}`,
                  borderRadius: 2,
                  p: 1,
                }}
              >
                {family_members.map((member: Patient, index: number) => (
                  <Box
                    key={member.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      p: 1,
                      mb: index < family_members.length - 1 ? 1 : 0,
                      borderBottom:
                        index < family_members.length - 1
                          ? `1px solid ${theme.colors.primary.border}`
                          : 'none',
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        mr: 1.5,
                        background: theme.colors.primary.light,
                        color: theme.colors.primary.main,
                        fontSize: '0.875rem',
                        fontWeight: 700,
                      }}
                    >
                      {member.full_name.charAt(0)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" fontWeight="600">
                        {member.full_name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                        <Chip
                          icon={<AgeIcon sx={{ fontSize: 12 }} />}
                          label={`${calculateAge(member.date_of_birth)} years`}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.625rem',
                            fontWeight: 600,
                            background: theme.colors.primary.light,
                            color: theme.colors.primary.main,
                            '& .MuiChip-icon': {
                              color: theme.colors.primary.main,
                            },
                          }}
                        />
                        <Chip
                          label={formatGender(member.gender)}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.625rem',
                            fontWeight: 600,
                            background: theme.colors.primary.light,
                            color: theme.colors.primary.main,
                            textTransform: 'capitalize',
                          }}
                        />
                        {member.relationship_to_primary && (
                          <Chip
                            label={formatRelationship(member.relationship_to_primary)}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.625rem',
                              fontWeight: 700,
                              background: theme.colors.primary.gradient,
                              color: 'white',
                              textTransform: 'capitalize',
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Collapse>
          </Box>
        )}

        <Divider sx={{ my: 2, borderColor: theme.colors.primary.border }} />

        {/* Action Buttons */}
        <Typography variant="caption" sx={{ mb: 1.5, display: 'block', fontWeight: 700 }}>
          What would you like to do?
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {/* Add to existing family */}
          <Button
            variant="contained"
            startIcon={<AddMemberIcon />}
            onClick={onAddToFamily}
            disabled={loading}
            sx={{
              ...theme.components.primaryButton,
              minHeight: 44,
            }}
          >
            Add New Family Member
          </Button>

          {/* View existing family */}
          <Button
            variant="outlined"
            startIcon={<NavigateIcon />}
            onClick={onViewFamily}
            disabled={loading}
            sx={{
              ...theme.components.outlinedButton,
              minHeight: 44,
            }}
          >
            View & Manage Family
          </Button>

          {/* Continue with new registration */}
          <Button
            variant="text"
            onClick={onContinueNewRegistration}
            disabled={loading}
            sx={{
              minHeight: 40,
              color: 'text.secondary',
              fontWeight: 600,
              '&:hover': {
                background: theme.colors.primary.light,
                color: theme.colors.primary.main,
              },
            }}
          >
            Continue with New Registration
          </Button>
        </Box>

        <Box
          sx={{
            mt: 2,
            p: 1.5,
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: 2,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            <strong>Note:</strong> Choose "Add New Family Member" if registering someone in this existing family.
            Choose "Continue with New Registration" for a different family using the same phone number.
          </Typography>
        </Box>
      </Alert>
    </Fade>
  );
};