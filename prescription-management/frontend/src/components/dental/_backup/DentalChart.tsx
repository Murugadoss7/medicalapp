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
  useTheme,
  useMediaQuery,
  alpha,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  HourglassEmpty as PendingIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
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
  // Multi-select support
  multiSelect?: boolean;
  selectedTeeth?: string[];
  onTeethSelect?: (toothNumbers: string[]) => void;
  // Compact mode for floating overlay
  compactMode?: boolean;
}

const DentalChart: React.FC<DentalChartProps> = ({
  dentitionType = 'permanent',
  teethData = [],
  onToothClick,
  selectedTooth,
  readOnly = false,
  // Multi-select props with defaults
  multiSelect = false,
  selectedTeeth = [],
  onTeethSelect,
  compactMode = false,
}) => {
  const theme = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Responsive breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'lg'));

  // Responsive tooth sizes - very compact to fit without horizontal scroll
  // In compact mode, make teeth much smaller for floating overlay
  const toothWidth = compactMode ? 32 : (isMobile ? 24 : isTablet ? 24 : 38);
  const toothHeight = compactMode ? 40 : (isMobile ? 32 : isTablet ? 32 : 46);
  const toothFontSize = compactMode ? '0.7rem' : (isMobile ? '0.65rem' : isTablet ? '0.65rem' : '0.85rem');
  const iconSize = compactMode ? 8 : (isMobile ? 8 : isTablet ? 8 : 10);
  const toothGap = compactMode ? 0.3 : (isMobile ? 0.2 : isTablet ? 0.2 : 0.4);

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
      return <CheckCircleIcon sx={{ fontSize: iconSize, color: 'success.dark' }} />;
    }

    // Priority 2: In-progress procedure
    if (tooth.procedureStatus === 'in_progress') {
      return <PendingIcon sx={{ fontSize: iconSize, color: 'info.dark' }} />;
    }

    // Priority 3: Active issues
    if (tooth.hasActiveIssue) {
      return <ErrorIcon sx={{ fontSize: iconSize, color: 'error.dark' }} />;
    }

    // Priority 4: Planned procedure or observation only
    if (tooth.hasPendingProcedure || tooth.procedureStatus === 'planned' || (tooth.hasObservation && !tooth.hasProcedure)) {
      return <WarningIcon sx={{ fontSize: iconSize, color: 'warning.dark' }} />;
    }

    // Priority 5: Has procedure (legacy)
    if (tooth.hasProcedure) {
      return <CheckCircleIcon sx={{ fontSize: iconSize, color: 'success.dark' }} />;
    }

    return <PendingIcon sx={{ fontSize: iconSize, color: 'info.dark' }} />;
  };

  // Handle tooth click for multi-select mode
  const handleToothClick = (toothStr: string) => {
    if (readOnly) return;

    if (multiSelect && onTeethSelect) {
      // Multi-select mode: toggle selection in array
      const newSelection = selectedTeeth.includes(toothStr)
        ? selectedTeeth.filter(t => t !== toothStr)  // Remove if already selected
        : [...selectedTeeth, toothStr];               // Add if not selected
      onTeethSelect(newSelection);
    } else if (onToothClick) {
      // Single-select mode: use existing callback
      onToothClick(toothStr);
    }
  };

  // Render individual tooth
  const renderTooth = (toothNumber: number) => {
    const toothStr = toothNumber.toString();
    const tooth = teethDataMap[toothStr];
    // Support both single and multi-select modes
    const isSelected = multiSelect
      ? selectedTeeth.includes(toothStr)
      : selectedTooth === toothStr;
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
      <Tooltip key={toothNumber} title={toothTooltip} arrow enterDelay={500} enterTouchDelay={700}>
        <Box
          onClick={() => handleToothClick(toothStr)}
          sx={{
            width: toothWidth,
            height: toothHeight,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: isSelected ? 3 : 2,
            borderColor: isSelected
              ? theme.palette.primary.main
              : toothColor,
            borderRadius: '4px 4px 2px 2px',
            bgcolor: isSelected
              ? alpha(theme.palette.primary.main, 0.2)
              : toothColor,
            cursor: readOnly ? 'default' : 'pointer',
            // Simplified transitions for better iPad performance
            transition: 'border-color 0.15s, background-color 0.15s',
            boxShadow: isSelected
              ? `0 2px 8px ${alpha(theme.palette.primary.main, 0.4)}`
              : 'none',
            position: 'relative',
            '&:active': !readOnly && {
              bgcolor: alpha(theme.palette.primary.main, 0.15),
            },
          }}
        >
          {/* Multi-select checkmark badge */}
          {multiSelect && isSelected && (
            <Box
              sx={{
                position: 'absolute',
                top: -6,
                left: -6,
                width: 18,
                height: 18,
                borderRadius: '50%',
                bgcolor: theme.palette.primary.main,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid white',
                zIndex: 1,
              }}
            >
              <CheckCircleIcon sx={{ fontSize: 14, color: 'white' }} />
            </Box>
          )}

          {/* Tooth status icon (top-right) */}
          <Box sx={{ position: 'absolute', top: 2, right: 2 }}>
            {getToothIcon(toothStr)}
          </Box>

          {/* Tooth number */}
          <Typography
            variant="body2"
            fontWeight="bold"
            sx={{
              color: theme.palette.text.primary,
              fontSize: toothFontSize,
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
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            mb: 0.5,
            display: 'block',
            fontSize: isMobile ? '0.65rem' : isTablet ? '0.7rem' : '0.75rem',
          }}
        >
          {label}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            gap: toothGap,
            justifyContent: 'center',
          }}
        >
          {teeth.map(renderTooth)}
        </Box>
      </Box>
    );
  };

  // Responsive gap between quadrants
  const quadrantGap = isMobile ? 1 : isTablet ? 1 : 4;

  // Compact mode: horizontal 2-row layout for floating
  if (compactMode) {
    return (
      <Paper elevation={0} sx={{ p: 1, bgcolor: 'transparent' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {/* Upper Jaw - All teeth in one horizontal row */}
          <Box>
            <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'primary.main', mb: 0.5, display: 'block' }}>
              Upper
            </Typography>
            <Box sx={{ display: 'flex', gap: toothGap, justifyContent: 'center' }}>
              {[...teethConfig.upperRight, ...teethConfig.upperLeft].map(renderTooth)}
            </Box>
          </Box>

          {/* Lower Jaw - All teeth in one horizontal row */}
          <Box>
            <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'primary.main', mb: 0.5, display: 'block' }}>
              Lower
            </Typography>
            <Box sx={{ display: 'flex', gap: toothGap, justifyContent: 'center' }}>
              {[...teethConfig.lowerLeft, ...teethConfig.lowerRight].map(renderTooth)}
            </Box>
          </Box>
        </Box>
      </Paper>
    );
  }

  // Normal mode: original layout
  return (
    <Paper elevation={2} sx={{ p: isMobile ? 1 : isTablet ? 1.5 : 2 }}>
      {/* Dental Chart - Use flexbox column for reliable stacking */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 1.5 : isTablet ? 2 : 3 }}>
        {/* Upper Jaw */}
        <Box
          sx={{
            border: 2,
            borderColor: 'divider',
            borderRadius: 2,
            p: isMobile ? 1 : isTablet ? 1.5 : 2,
            bgcolor: alpha(theme.palette.primary.main, 0.02),
          }}
        >
          <Typography
            variant="subtitle2"
            align="center"
            sx={{
              mb: isMobile ? 1 : 2,
              fontSize: isMobile ? '0.75rem' : isTablet ? '0.8rem' : '0.875rem',
            }}
            color="primary"
          >
            Upper Jaw (Maxillary)
          </Typography>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: quadrantGap,
            }}
          >
            {renderQuadrant(teethConfig.upperRight, 'Right')}
            {renderQuadrant(teethConfig.upperLeft, 'Left')}
          </Box>
        </Box>

        {/* Lower Jaw */}
        <Box
          sx={{
            border: 2,
            borderColor: 'divider',
            borderRadius: 2,
            p: isMobile ? 1 : isTablet ? 1.5 : 2,
            bgcolor: alpha(theme.palette.primary.main, 0.02),
          }}
        >
          <Typography
            variant="subtitle2"
            align="center"
            sx={{
              mb: isMobile ? 1 : 2,
              fontSize: isMobile ? '0.75rem' : isTablet ? '0.8rem' : '0.875rem',
            }}
            color="primary"
          >
            Lower Jaw (Mandibular)
          </Typography>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: quadrantGap,
            }}
          >
            {renderQuadrant(teethConfig.lowerLeft, 'Left')}
            {renderQuadrant(teethConfig.lowerRight, 'Right')}
          </Box>
        </Box>
      </Box>

      {/* Simple Instructions */}
      <Typography
        variant="caption"
        sx={{
          display: 'block',
          textAlign: 'center',
          color: 'text.secondary',
          mt: 2,
          fontSize: '0.75rem',
        }}
      >
        Click teeth to select. Click again to deselect.
      </Typography>
    </Paper>
  );
};

// Memoize to prevent unnecessary re-renders
export default React.memo(DentalChart);
