/**
 * Patient Card Component
 * Shows patient summary with treatment status
 * iPad-friendly: Large touch target, clear status badges
 */

import { Card, CardContent, Typography, Box, Chip, Stack } from '@mui/material';
import { PatientSummary } from '../../services/treatmentService';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';

interface PatientCardProps {
  patient: PatientSummary;
  isSelected: boolean;
  onClick: () => void;
}

const PatientCard = ({ patient, isSelected, onClick }: PatientCardProps) => {
  const { patient: patientInfo, summary } = patient;

  // Status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'completed':
        return 'info';
      case 'planned':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        border: isSelected ? 2 : 1,
        borderColor: isSelected ? 'primary.main' : 'divider',
        transition: 'all 0.2s',
        minHeight: 44, // iPad-friendly touch target
        '&:hover': {
          boxShadow: 3,
          transform: 'translateY(-2px)',
        },
        '&:active': {
          transform: 'translateY(0px)',
        },
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        {/* Patient Name & Status */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>
              {patientInfo.first_name} {patientInfo.last_name}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <PhoneIcon sx={{ fontSize: 14 }} />
              {patientInfo.mobile_number}
            </Typography>
          </Box>
          <Chip
            label={summary.treatment_status}
            color={getStatusColor(summary.treatment_status)}
            size="small"
            sx={{ textTransform: 'capitalize' }}
          />
        </Box>

        {/* Patient Details */}
        <Stack spacing={0.5} sx={{ mt: 1.5 }}>
          {/* Last Consultation */}
          {summary.last_consultation_date && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CalendarTodayIcon sx={{ fontSize: 14 }} />
              Last visit: {new Date(summary.last_consultation_date).toLocaleDateString()}
            </Typography>
          )}

          {/* Primary Doctor */}
          {summary.primary_doctor && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <PersonIcon sx={{ fontSize: 14 }} />
              {summary.primary_doctor.name}
            </Typography>
          )}

          {/* Treatment Summary */}
          <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 500 }}>
              {summary.completed_appointments}/{summary.total_appointments} Appointments
            </Typography>
            {summary.total_procedures > 0 && (
              <Typography variant="caption" sx={{ fontWeight: 500 }}>
                {summary.pending_procedures} Pending Procedures
              </Typography>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default PatientCard;
