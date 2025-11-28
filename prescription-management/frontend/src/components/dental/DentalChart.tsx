/**
 * Dental Chart Component
 * Interactive tooth chart using FDI notation system
 * Supports permanent (32 teeth) and primary (20 teeth) dentition
 */

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tooltip,
  Chip,
  Grid,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  HourglassEmpty as PendingIcon,
} from '@mui/icons-material';

// FDI Notation tooth numbers
const PERMANENT_TEETH = {
  upperRight: [18, 17, 16, 15, 14, 13, 12, 11],
  upperLeft: [21, 22, 23, 24, 25, 26, 27, 28],
  lowerLeft: [31, 32, 33, 34, 35, 36, 37, 38],
  lowerRight: [48, 47, 46, 45, 44, 43, 42, 41],
};

const PRIMARY_TEETH = {
  upperRight: [55, 54, 53, 52, 51],
  upperLeft: [61, 62, 63, 64, 65],
  lowerLeft: [71, 72, 73, 74, 75],
  lowerRight: [85, 84, 83, 82, 81],
};

interface ToothData {
  toothNumber: string;
  hasObservation?: boolean;
  hasProcedure?: boolean;
  hasActiveIssue?: boolean;
  conditionType?: string;
  severity?: string;
  lastTreatmentDate?: string;
  // New fields for better tracking
  procedureStatus?: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  observationCount?: number;
  procedureCount?: number;
  completedProcedureCount?: number;
  hasPendingProcedure?: boolean;
  hasCompletedProcedure?: boolean;
}

interface DentalChartProps {
  dentitionType?: 'permanent' | 'primary' | 'mixed';
  teethData?: ToothData[];
  onToothClick?: (toothNumber: string) => void;
  selectedTooth?: string | null;
  readOnly?: boolean;
}

const DentalChart: React.FC<DentalChartProps> = ({
  dentitionType = 'permanent',
  teethData = [],
  onToothClick,
  selectedTooth,
  readOnly = false,
}) => {
  const theme = useTheme();
  const [hoveredTooth, setHoveredTooth] = useState<string | null>(null);

  // Convert teeth data array to map for quick lookup
  const teethDataMap = React.useMemo(() => {
    const map: Record<string, ToothData> = {};
    teethData.forEach(tooth => {
      map[tooth.toothNumber] = tooth;
    });
    return map;
  }, [teethData]);

  // Get teeth configuration based on dentition type
  const teethConfig = dentitionType === 'primary' ? PRIMARY_TEETH : PERMANENT_TEETH;

  // Get tooth status color - Priority: Completed > In Progress > Observation > Planned
  const getToothColor = (toothNumber: string) => {
    const tooth = teethDataMap[toothNumber];

    if (!tooth) {
      return theme.palette.grey[200]; // Default/healthy - no data
    }

    // Priority 1: Check procedure status first (most important)
    if (tooth.hasCompletedProcedure || tooth.procedureStatus === 'completed') {
      return theme.palette.success.light; // Completed procedure - green
    }

    // Priority 2: Active/In-progress procedure
    if (tooth.procedureStatus === 'in_progress') {
      return theme.palette.info.light; // In progress - blue
    }

    // Priority 3: Has active issues (observation with treatment required but no procedure done)
    if (tooth.hasActiveIssue) {
      return theme.palette.error.light; // Active issue - red
    }

    // Priority 4: Has planned procedure (pending treatment)
    if (tooth.hasPendingProcedure || tooth.procedureStatus === 'planned') {
      return theme.palette.warning.light; // Planned procedure - orange
    }

    // Priority 5: Has observation only (no procedure)
    if (tooth.hasObservation && !tooth.hasProcedure) {
      return theme.palette.warning.light; // Observation only - orange
    }

    // Priority 6: Has procedure but no specific status (legacy support)
    if (tooth.hasProcedure) {
      return theme.palette.success.light; // Has treatment - green
    }

    // Has data but nothing specific
    return theme.palette.info.light; // Has data - blue
  };

  // Get tooth icon - matches color logic priority
  const getToothIcon = (toothNumber: string) => {
    const tooth = teethDataMap[toothNumber];

    if (!tooth) return null;

    // Priority 1: Completed procedure
    if (tooth.hasCompletedProcedure || tooth.procedureStatus === 'completed') {
      return <CheckCircleIcon sx={{ fontSize: 12, color: 'success.dark' }} />;
    }

    // Priority 2: In-progress procedure
    if (tooth.procedureStatus === 'in_progress') {
      return <PendingIcon sx={{ fontSize: 12, color: 'info.dark' }} />;
    }

    // Priority 3: Active issues
    if (tooth.hasActiveIssue) {
      return <ErrorIcon sx={{ fontSize: 12, color: 'error.dark' }} />;
    }

    // Priority 4: Planned procedure or observation only
    if (tooth.hasPendingProcedure || tooth.procedureStatus === 'planned' || (tooth.hasObservation && !tooth.hasProcedure)) {
      return <WarningIcon sx={{ fontSize: 12, color: 'warning.dark' }} />;
    }

    // Priority 5: Has procedure (legacy)
    if (tooth.hasProcedure) {
      return <CheckCircleIcon sx={{ fontSize: 12, color: 'success.dark' }} />;
    }

    return <PendingIcon sx={{ fontSize: 12, color: 'info.dark' }} />;
  };

  // Render individual tooth
  const renderTooth = (toothNumber: number) => {
    const toothStr = toothNumber.toString();
    const tooth = teethDataMap[toothStr];
    const isSelected = selectedTooth === toothStr;
    const isHovered = hoveredTooth === toothStr;
    const toothColor = getToothColor(toothStr);

    const toothTooltip = tooth ? (
      <Box>
        <Typography variant="caption" fontWeight="bold">
          Tooth #{toothNumber}
        </Typography>
        {tooth.observationCount !== undefined && tooth.observationCount > 0 && (
          <Typography variant="caption" display="block">
            Observations: {tooth.observationCount}
          </Typography>
        )}
        {tooth.procedureCount !== undefined && tooth.procedureCount > 0 && (
          <Typography variant="caption" display="block">
            Procedures: {tooth.procedureCount}
            {tooth.completedProcedureCount !== undefined && tooth.completedProcedureCount > 0 &&
              ` (${tooth.completedProcedureCount} completed)`}
          </Typography>
        )}
        {tooth.conditionType && (
          <Typography variant="caption" display="block">
            Condition: {tooth.conditionType}
          </Typography>
        )}
        {tooth.severity && (
          <Typography variant="caption" display="block">
            Severity: {tooth.severity}
          </Typography>
        )}
        {tooth.procedureStatus && (
          <Typography variant="caption" display="block">
            Status: {tooth.procedureStatus.replace('_', ' ')}
          </Typography>
        )}
        {tooth.lastTreatmentDate && (
          <Typography variant="caption" display="block">
            Last Treatment: {tooth.lastTreatmentDate}
          </Typography>
        )}
        {tooth.hasActiveIssue && (
          <Typography variant="caption" display="block" color="error">
            ⚠️ Active Issue
          </Typography>
        )}
        {tooth.hasCompletedProcedure && (
          <Typography variant="caption" display="block" color="success.main">
            ✓ Treatment Completed
          </Typography>
        )}
      </Box>
    ) : (
      <Typography variant="caption">Tooth #{toothNumber} - Healthy</Typography>
    );

    return (
      <Tooltip key={toothNumber} title={toothTooltip} arrow>
        <Box
          onClick={() => !readOnly && onToothClick?.(toothStr)}
          onMouseEnter={() => setHoveredTooth(toothStr)}
          onMouseLeave={() => setHoveredTooth(null)}
          sx={{
            width: 50,
            height: 60,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: 2,
            borderColor: isSelected
              ? theme.palette.primary.main
              : isHovered
              ? theme.palette.primary.light
              : toothColor,
            borderRadius: '8px 8px 4px 4px',
            bgcolor: toothColor,
            cursor: readOnly ? 'default' : 'pointer',
            transition: 'all 0.2s ease',
            transform: isSelected ? 'scale(1.1)' : isHovered ? 'scale(1.05)' : 'scale(1)',
            boxShadow: isSelected
              ? `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`
              : isHovered
              ? `0 2px 8px ${alpha(theme.palette.grey[500], 0.3)}`
              : 'none',
            position: 'relative',
            '&:hover': !readOnly && {
              borderColor: theme.palette.primary.main,
            },
          }}
        >
          {/* Tooth icon */}
          <Box sx={{ position: 'absolute', top: 2, right: 2 }}>
            {getToothIcon(toothStr)}
          </Box>

          {/* Tooth number */}
          <Typography
            variant="caption"
            fontWeight="bold"
            sx={{
              color: theme.palette.text.primary,
              fontSize: '0.75rem',
            }}
          >
            {toothNumber}
          </Typography>
        </Box>
      </Tooltip>
    );
  };

  // Render quadrant
  const renderQuadrant = (teeth: number[], label: string) => {
    return (
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
          {label}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            gap: 0.5,
            justifyContent: 'center',
          }}
        >
          {teeth.map(renderTooth)}
        </Box>
      </Box>
    );
  };

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Dental Chart - {dentitionType === 'primary' ? 'Primary' : 'Permanent'} Dentition
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            size="small"
            icon={<CheckCircleIcon />}
            label="Completed"
            sx={{ bgcolor: theme.palette.success.light }}
          />
          <Chip
            size="small"
            icon={<PendingIcon />}
            label="In Progress"
            sx={{ bgcolor: theme.palette.info.light }}
          />
          <Chip
            size="small"
            icon={<WarningIcon />}
            label="Pending/Observation"
            sx={{ bgcolor: theme.palette.warning.light }}
          />
          <Chip
            size="small"
            icon={<ErrorIcon />}
            label="Active Issue"
            sx={{ bgcolor: theme.palette.error.light }}
          />
        </Box>
      </Box>

      {/* Dental Chart */}
      <Grid container spacing={3}>
        {/* Upper Jaw */}
        <Grid item xs={12}>
          <Box
            sx={{
              border: 2,
              borderColor: 'divider',
              borderRadius: 2,
              p: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.02),
            }}
          >
            <Typography variant="subtitle2" align="center" sx={{ mb: 2 }} color="primary">
              Upper Jaw (Maxillary)
            </Typography>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 4,
              }}
            >
              {renderQuadrant(teethConfig.upperRight, 'Upper Right (Q1)')}
              {renderQuadrant(teethConfig.upperLeft, 'Upper Left (Q2)')}
            </Box>
          </Box>
        </Grid>

        {/* Lower Jaw */}
        <Grid item xs={12}>
          <Box
            sx={{
              border: 2,
              borderColor: 'divider',
              borderRadius: 2,
              p: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.02),
            }}
          >
            <Typography variant="subtitle2" align="center" sx={{ mb: 2 }} color="primary">
              Lower Jaw (Mandibular)
            </Typography>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 4,
              }}
            >
              {renderQuadrant(teethConfig.lowerLeft, 'Lower Left (Q3)')}
              {renderQuadrant(teethConfig.lowerRight, 'Lower Right (Q4)')}
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Legend */}
      <Box sx={{ mt: 3, p: 2, bgcolor: alpha(theme.palette.grey[500], 0.05), borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary">
          <strong>FDI Notation System:</strong> International standard for tooth numbering.
          Permanent teeth: 11-48 (32 teeth), Primary teeth: 51-85 (20 teeth).
          Click on a tooth to view details or add observations.
        </Typography>
      </Box>
    </Paper>
  );
};

export default DentalChart;
