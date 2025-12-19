/**
 * Procedure Schedule Component
 * Shows procedures grouped by status: Upcoming | Completed | Cancelled
 * iPad-friendly collapsible sections
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { ProcedureGroup } from '../../services/treatmentService';
import treatmentService from '../../services/treatmentService';

interface ProcedureScheduleProps {
  patientMobile: string;
  patientFirstName: string;
}

const ProcedureSchedule = ({ patientMobile, patientFirstName }: ProcedureScheduleProps) => {
  const [procedures, setProcedures] = useState<ProcedureGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string>('upcoming'); // Default expanded

  useEffect(() => {
    loadProcedures();
  }, [patientMobile, patientFirstName]);

  const loadProcedures = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await treatmentService.fetchPatientProcedures(
        patientMobile,
        patientFirstName
      );

      setProcedures(response);
    } catch (err: any) {
      console.error('Error loading procedures:', err);
      setError(err.response?.data?.detail || 'Failed to load procedures');
    } finally {
      setLoading(false);
    }
  };

  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : '');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!procedures || (procedures.upcoming.length === 0 && procedures.completed.length === 0 && procedures.cancelled.length === 0)) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          No procedures found
        </Typography>
      </Box>
    );
  }

  const renderProcedureCard = (proc: any) => (
    <Card key={proc.id} sx={{ mb: 2, minHeight: 60 }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        {/* Procedure Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              {proc.procedure_name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Code: {proc.procedure_code}
              {proc.tooth_numbers && ` • Tooth #${proc.tooth_numbers}`}
            </Typography>
          </Box>
          <Chip
            label={proc.status}
            color={
              proc.status === 'completed'
                ? 'success'
                : proc.status === 'cancelled'
                ? 'error'
                : 'warning'
            }
            size="small"
            sx={{ textTransform: 'capitalize' }}
          />
        </Box>

        {/* Description */}
        {proc.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {proc.description}
          </Typography>
        )}

        {/* Procedure Details */}
        <Stack direction="row" spacing={2} sx={{ mt: 1.5, flexWrap: 'wrap' }}>
          {proc.procedure_date && (
            <Typography variant="caption" color="text.secondary">
              Date: {new Date(proc.procedure_date).toLocaleDateString()}
            </Typography>
          )}
          {proc.completed_date && (
            <Typography variant="caption" color="text.secondary">
              Completed: {new Date(proc.completed_date).toLocaleDateString()}
            </Typography>
          )}
          {proc.duration_minutes && (
            <Typography variant="caption" color="text.secondary">
              Duration: {proc.duration_minutes} min
            </Typography>
          )}
        </Stack>

        {/* Cost */}
        {(proc.estimated_cost || proc.actual_cost) && (
          <Box sx={{ mt: 1 }}>
            {proc.estimated_cost && (
              <Typography variant="caption" color="text.secondary">
                Estimated: ${proc.estimated_cost.toFixed(2)}
              </Typography>
            )}
            {proc.actual_cost && (
              <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                Actual: ${proc.actual_cost.toFixed(2)}
              </Typography>
            )}
          </Box>
        )}

        {/* Notes */}
        {proc.procedure_notes && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, fontStyle: 'italic' }}>
            Notes: {proc.procedure_notes}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Stack spacing={2}>
      {/* Upcoming Procedures */}
      <Accordion
        expanded={expanded === 'upcoming'}
        onChange={handleAccordionChange('upcoming')}
        sx={{ minHeight: 60 }} // iPad-friendly
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{ minHeight: 60 }}
        >
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            Upcoming
            <Chip label={procedures.upcoming.length} size="small" color="warning" />
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {procedures.upcoming.length === 0 ? (
            <Typography color="text.secondary">No upcoming procedures</Typography>
          ) : (
            <Box>{procedures.upcoming.map(renderProcedureCard)}</Box>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Completed Procedures */}
      <Accordion
        expanded={expanded === 'completed'}
        onChange={handleAccordionChange('completed')}
        sx={{ minHeight: 60 }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{ minHeight: 60 }}
        >
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            Completed
            <Chip label={procedures.completed.length} size="small" color="success" />
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {procedures.completed.length === 0 ? (
            <Typography color="text.secondary">No completed procedures</Typography>
          ) : (
            <Box>{procedures.completed.map(renderProcedureCard)}</Box>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Cancelled Procedures */}
      {procedures.cancelled.length > 0 && (
        <Accordion
          expanded={expanded === 'cancelled'}
          onChange={handleAccordionChange('cancelled')}
          sx={{ minHeight: 60 }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{ minHeight: 60 }}
          >
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              Cancelled
              <Chip label={procedures.cancelled.length} size="small" color="error" />
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box>{procedures.cancelled.map(renderProcedureCard)}</Box>
          </AccordionDetails>
        </Accordion>
      )}
    </Stack>
  );
};

export default ProcedureSchedule;
