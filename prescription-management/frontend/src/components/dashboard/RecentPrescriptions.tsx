import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Box,
  Skeleton,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Receipt,
  Person,
  Phone,
  Visibility,
  Print,
  CalendarToday,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import type { Prescription } from '../../store/api';

interface RecentPrescriptionsProps {
  prescriptions: Prescription[];
  loading?: boolean;
  onPrescriptionClick?: (prescription: Prescription) => void;
  onPrintPrescription?: (prescription: Prescription) => void;
}

const getStatusColor = (status: Prescription['status']) => {
  switch (status) {
    case 'draft':
      return 'default';
    case 'finalized':
      return 'primary';
    case 'dispensed':
      return 'warning';
    case 'completed':
      return 'success';
    default:
      return 'default';
  }
};

const getStatusLabel = (status: Prescription['status']) => {
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'finalized':
      return 'Finalized';
    case 'dispensed':
      return 'Dispensed';
    case 'completed':
      return 'Completed';
    default:
      return status;
  }
};

export const RecentPrescriptions = ({
  prescriptions,
  loading = false,
  onPrescriptionClick,
  onPrintPrescription,
}: RecentPrescriptionsProps) => {
  if (loading) {
    return (
      <Paper sx={{ p: 3, height: '400px', overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Receipt sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">Recent Prescriptions</Typography>
        </Box>
        <List>
          {[1, 2, 3, 4].map((item) => (
            <ListItem key={item}>
              <ListItemIcon>
                <Skeleton variant="circular" width={24} height={24} />
              </ListItemIcon>
              <ListItemText
                primary={<Skeleton variant="text" width="60%" />}
                secondary={<Skeleton variant="text" width="80%" />}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, height: '400px', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Receipt sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6">Recent Prescriptions</Typography>
        <Chip 
          label={prescriptions.length} 
          size="small" 
          sx={{ ml: 'auto' }}
          color="primary"
        />
      </Box>

      {prescriptions.length === 0 ? (
        <Box 
          sx={{ 
            flexGrow: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'text.secondary'
          }}
        >
          <Typography variant="body2">No recent prescriptions</Typography>
        </Box>
      ) : (
        <List sx={{ flexGrow: 1, overflow: 'auto' }}>
          {prescriptions.map((prescription) => (
            <ListItem
              key={prescription.id}
              sx={{
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                mb: 1,
                '&:hover': {
                  backgroundColor: 'action.hover',
                  cursor: 'pointer',
                },
              }}
              onClick={() => onPrescriptionClick?.(prescription)}
            >
              <ListItemIcon>
                <Receipt color="primary" />
              </ListItemIcon>
              
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle2">
                      #{prescription.prescription_number}
                    </Typography>
                    <Chip
                      label={getStatusLabel(prescription.status)}
                      size="small"
                      color={getStatusColor(prescription.status)}
                      variant="outlined"
                    />
                  </Box>
                }
                secondary={
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                      <Person fontSize="small" />
                      <Typography variant="body2" color="text.secondary">
                        {prescription.patient_full_name}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                      <Phone fontSize="small" />
                      <Typography variant="body2" color="text.secondary">
                        {prescription.patient_mobile_number}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                      <CalendarToday fontSize="small" />
                      <Typography variant="body2" color="text.secondary">
                        {format(parseISO(prescription.created_at), 'MMM dd, yyyy')}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Diagnosis: {prescription.diagnosis}
                    </Typography>
                  </Box>
                }
              />
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Tooltip title="View Details">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPrescriptionClick?.(prescription);
                    }}
                  >
                    <Visibility />
                  </IconButton>
                </Tooltip>
                
                {(prescription.status === 'finalized' || prescription.status === 'completed') && (
                  <Tooltip title="Print Prescription">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPrintPrescription?.(prescription);
                      }}
                    >
                      <Print />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  );
};