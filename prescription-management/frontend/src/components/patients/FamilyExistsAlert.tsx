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
    <Alert 
      severity="info" 
      sx={{ 
        mb: 3,
        '& .MuiAlert-message': { width: '100%' }
      }}
    >
      <AlertTitle sx={{ display: 'flex', alignItems: 'center' }}>
        <FamilyIcon sx={{ mr: 1 }} />
        Family Found for Mobile Number: {mobile_number}
      </AlertTitle>

      <Typography variant="body2" sx={{ mb: 2 }}>
        This mobile number is already registered with {total_members} family member{total_members > 1 ? 's' : ''}.
      </Typography>

      {/* Primary Member Info */}
      {primary_member && (
        <Box sx={{ mb: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <PersonIcon sx={{ mr: 1, fontSize: '1.1rem' }} />
            Primary Member
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="body2" fontWeight="medium">
              {primary_member.full_name}
            </Typography>
            <Chip
              icon={<AgeIcon />}
              label={`${calculateAge(primary_member.date_of_birth)} years`}
              size="small"
              variant="outlined"
            />
            <Chip
              label={formatGender(primary_member.gender)}
              size="small"
              variant="outlined"
            />
            {primary_member.relationship_to_primary && (
              <Chip
                label={formatRelationship(primary_member.relationship_to_primary)}
                size="small"
                variant="outlined"
                color="primary"
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
            sx={{ mb: 1 }}
          >
            {expanded ? 'Hide' : 'Show'} Other Family Members ({family_members.length})
          </Button>
          
          <Collapse in={expanded}>
            <List dense sx={{ bgcolor: 'action.hover', borderRadius: 1 }}>
              {family_members.map((member: Patient, index: number) => (
                <ListItem key={member.id} divider={index < family_members.length - 1}>
                  <ListItemIcon>
                    <PersonIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="body2" fontWeight="medium">
                          {member.full_name}
                        </Typography>
                        <Chip
                          icon={<AgeIcon />}
                          label={`${calculateAge(member.date_of_birth)} years`}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={formatGender(member.gender)}
                          size="small"
                          variant="outlined"
                        />
                        {member.relationship_to_primary && (
                          <Chip
                            label={formatRelationship(member.relationship_to_primary)}
                            size="small"
                            variant="outlined"
                            color="secondary"
                          />
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Collapse>
        </Box>
      )}

      <Divider sx={{ my: 2 }} />

      {/* Action Buttons */}
      <Typography variant="body2" sx={{ mb: 2 }}>
        <strong>What would you like to do?</strong>
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {/* Add to existing family */}
        <Button
          variant="contained"
          startIcon={<AddMemberIcon />}
          onClick={onAddToFamily}
          disabled={loading}
          size="small"
        >
          Add New Family Member to This Family
        </Button>

        {/* View existing family */}
        <Button
          variant="outlined"
          startIcon={<NavigateIcon />}
          onClick={onViewFamily}
          disabled={loading}
          size="small"
        >
          View & Manage Existing Family
        </Button>

        {/* Continue with new registration */}
        <Button
          variant="text"
          onClick={onContinueNewRegistration}
          disabled={loading}
          size="small"
          sx={{ mt: 1 }}
        >
          Continue with New Registration (Different Family)
        </Button>
      </Box>

      <Box sx={{ mt: 2, p: 1, bgcolor: 'warning.light', borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary">
          <strong>Note:</strong> If you're registering a new person who should be part of this existing family, 
          choose "Add New Family Member". If this is a completely different family that happens to use 
          the same phone number, choose "Continue with New Registration".
        </Typography>
      </Box>
    </Alert>
  );
};