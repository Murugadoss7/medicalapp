/**
 * AnatomicalDentalChart Component
 * Realistic curved dental chart showing upper and lower arches
 * Similar to actual tooth positioning in the mouth
 * iPad-optimized with horizontal scroll functionality
 */

import React, { useState } from 'react';
import { Box, Paper, Typography, IconButton, Tooltip, Collapse } from '@mui/material';
import {
  ChevronRight as ExpandIcon,
  VisibilityOff as CollapseIcon,
} from '@mui/icons-material';

interface ToothData {
  toothNumber: string;
  status?: string;
  hasObservation?: boolean;
  hasProcedure?: boolean;
  hasActiveIssue?: boolean;
  procedureStatus?: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  hasPendingProcedure?: boolean;
  hasCompletedProcedure?: boolean;
}

interface AnatomicalDentalChartProps {
  dentitionType?: 'permanent' | 'deciduous';
  teethData?: Record<string, ToothData>;
  selectedTeeth?: string[];
  onToothClick?: (toothNumber: string) => void;
  multiSelect?: boolean;
  allowCollapse?: boolean;
  isCollapsed?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
}

// Tooth positioning for upper arch (curved) - COMPACT, NO ROTATION
// All teeth vertical for space efficiency - fits without horizontal scroll
const UPPER_ARCH_POSITIONS = {
  // Right side (18-11) - back to front, curving down
  '18': { x: 40, y: 30, rotation: 0 },
  '17': { x: 80, y: 45, rotation: 0 },
  '16': { x: 120, y: 60, rotation: 0 },
  '15': { x: 160, y: 75, rotation: 0 },
  '14': { x: 200, y: 88, rotation: 0 },
  '13': { x: 240, y: 98, rotation: 0 },
  '12': { x: 278, y: 105, rotation: 0 },
  '11': { x: 316, y: 110, rotation: 0 },
  // Left side (21-28) - front to back, curving up
  '21': { x: 354, y: 110, rotation: 0 },
  '22': { x: 392, y: 105, rotation: 0 },
  '23': { x: 430, y: 98, rotation: 0 },
  '24': { x: 470, y: 88, rotation: 0 },
  '25': { x: 510, y: 75, rotation: 0 },
  '26': { x: 550, y: 60, rotation: 0 },
  '27': { x: 590, y: 45, rotation: 0 },
  '28': { x: 630, y: 30, rotation: 0 },
};

// Tooth positioning for lower arch (curved) - PATIENT'S VIEW - COMPACT, NO ROTATION
const LOWER_ARCH_POSITIONS = {
  // Left side (38-31) - Patient's lower left quadrant on LEFT
  '38': { x: 40, y: 110, rotation: 0 },
  '37': { x: 80, y: 95, rotation: 0 },
  '36': { x: 120, y: 80, rotation: 0 },
  '35': { x: 160, y: 65, rotation: 0 },
  '34': { x: 200, y: 52, rotation: 0 },
  '33': { x: 240, y: 42, rotation: 0 },
  '32': { x: 278, y: 35, rotation: 0 },
  '31': { x: 316, y: 30, rotation: 0 },
  // Right side (41-48) - Patient's lower right quadrant on RIGHT
  '41': { x: 354, y: 30, rotation: 0 },
  '42': { x: 392, y: 35, rotation: 0 },
  '43': { x: 430, y: 42, rotation: 0 },
  '44': { x: 470, y: 52, rotation: 0 },
  '45': { x: 510, y: 65, rotation: 0 },
  '46': { x: 550, y: 80, rotation: 0 },
  '47': { x: 590, y: 95, rotation: 0 },
  '48': { x: 630, y: 110, rotation: 0 },
};

const AnatomicalDentalChart: React.FC<AnatomicalDentalChartProps> = ({
  dentitionType = 'permanent',
  teethData = {},
  selectedTeeth = [],
  onToothClick,
  multiSelect = false,
  allowCollapse = true,
  isCollapsed: controlledCollapsed,
  onCollapseChange,
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);

  // Support both controlled and uncontrolled collapse state
  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const handleCollapseToggle = () => {
    const newCollapsed = !isCollapsed;
    if (onCollapseChange) {
      onCollapseChange(newCollapsed);
    } else {
      setInternalCollapsed(newCollapsed);
    }
  };

  const handleToothClick = (toothNumber: string) => {
    if (!onToothClick) return;
    onToothClick(toothNumber);
  };

  const getToothColor = (toothNumber: string) => {
    const tooth = teethData[toothNumber];
    const isSelected = selectedTeeth.includes(toothNumber);

    if (isSelected) return '#1976d2'; // Blue for selected
    if (tooth?.status === 'missing') return '#f5f5f5'; // Light gray for missing

    // Priority 1: Completed procedure - green
    if (tooth?.hasCompletedProcedure || tooth?.procedureStatus === 'completed') {
      return '#4caf50';
    }

    // Priority 2: In-progress procedure - blue
    if (tooth?.procedureStatus === 'in_progress') {
      return '#2196f3';
    }

    // Priority 3: Active issue - red
    if (tooth?.hasActiveIssue) {
      return '#f44336';
    }

    // Priority 4: Planned procedure or observation only - orange
    if (tooth?.hasPendingProcedure || tooth?.procedureStatus === 'planned' || (tooth?.hasObservation && !tooth?.hasProcedure)) {
      return '#ff9800';
    }

    // Priority 5: Has procedure (legacy) - green
    if (tooth?.hasProcedure) {
      return '#4caf50';
    }

    return '#ffffff'; // White for normal
  };

  const getToothStroke = (toothNumber: string) => {
    const isSelected = selectedTeeth.includes(toothNumber);
    return isSelected ? '#0d47a1' : '#333';
  };

  const renderTooth = (toothNumber: string, position: { x: number; y: number; rotation: number }, isMolar: boolean) => {
    const tooth = teethData[toothNumber];
    const isMissing = tooth?.status === 'missing';
    const color = getToothColor(toothNumber);
    const stroke = getToothStroke(toothNumber);
    const isSelected = selectedTeeth.includes(toothNumber);

    return (
      <g
        key={toothNumber}
        transform={`translate(${position.x}, ${position.y}) rotate(${position.rotation})`}
        onClick={() => handleToothClick(toothNumber)}
        style={{ cursor: 'pointer' }}
      >
        {/* Tooth shape - iPad optimized larger sizes */}
        {isMolar ? (
          // Molar shape (rectangular with curves) - 40x48 for iPad
          <rect
            x="-20"
            y="-24"
            width="40"
            height="48"
            rx="5"
            ry="5"
            fill={color}
            stroke={stroke}
            strokeWidth={isSelected ? 3 : 2}
          />
        ) : (
          // Incisor/Canine shape (rounded) - rx=16, ry=24 for iPad
          <ellipse
            cx="0"
            cy="0"
            rx="16"
            ry="24"
            fill={color}
            stroke={stroke}
            strokeWidth={isSelected ? 3 : 2}
          />
        )}

        {/* X-cross for missing teeth */}
        {isMissing && (
          <>
            <line x1="-12" y1="-16" x2="12" y2="16" stroke="#666" strokeWidth="2.5" />
            <line x1="12" y1="-16" x2="-12" y2="16" stroke="#666" strokeWidth="2.5" />
          </>
        )}

        {/* Tooth number - larger font for iPad */}
        <text
          x="0"
          y="6"
          textAnchor="middle"
          fontSize="13"
          fontWeight="bold"
          fill={isSelected ? '#fff' : isMissing ? '#999' : '#333'}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {toothNumber}
        </text>

        {/* Crown line for realism (hide for missing teeth) */}
        {!isMissing && (isMolar ? (
          <line x1="-20" y1="-10" x2="20" y2="-10" stroke={stroke} strokeWidth="1" opacity="0.3" />
        ) : (
          <line x1="-16" y1="-8" x2="16" y2="-8" stroke={stroke} strokeWidth="1" opacity="0.3" />
        ))}
      </g>
    );
  };

  return (
    <Paper
      elevation={2}
      sx={{
        bgcolor: '#fafafa',
        position: 'relative',
      }}
    >
      {/* Header with Collapse Button only */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, pb: 0 }}>
        <Typography variant="subtitle2" fontWeight="bold" sx={{ fontSize: '0.85rem' }}>
          Anatomical Dental Chart
        </Typography>
        {/* Collapse/Expand Button */}
        {allowCollapse && (
          <Tooltip title={isCollapsed ? 'Show chart' : 'Hide chart'}>
            <IconButton
              size="medium"
              onClick={handleCollapseToggle}
              sx={{
                bgcolor: isCollapsed ? 'primary.main' : 'action.hover',
                color: isCollapsed ? 'white' : 'text.secondary',
                '&:hover': {
                  bgcolor: isCollapsed ? 'primary.dark' : 'action.selected',
                },
              }}
            >
              {isCollapsed ? <ExpandIcon /> : <CollapseIcon />}
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Collapsible Chart Content */}
      <Collapse in={!isCollapsed} timeout={300}>
        {/* Chart Container - NO horizontal scroll */}
        <Box sx={{ p: 1, pt: 0.5 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {/* Upper Arch */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0, textAlign: 'center', display: 'block', fontSize: '0.7rem' }}>
                Upper Arch (Maxillary)
              </Typography>
              <svg width="100%" height="140" viewBox="0 0 670 140" preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
                {/* Gum line curve for upper arch */}
                <path
                  d="M 40 20 Q 120 45, 200 70 Q 280 95, 335 110 Q 390 95, 470 70 Q 550 45, 630 20"
                  fill="none"
                  stroke="#ffa0a0"
                  strokeWidth="18"
                  opacity="0.2"
                />

                {/* Render upper teeth */}
                {Object.entries(UPPER_ARCH_POSITIONS).map(([toothNumber, position]) => {
                  const isMolar = ['18', '17', '16', '26', '27', '28'].includes(toothNumber);
                  return renderTooth(toothNumber, position, isMolar);
                })}
              </svg>
            </Box>

            {/* Divider */}
            <Box sx={{ borderTop: '1px dashed #ccc', my: 0 }} />

            {/* Lower Arch */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0, textAlign: 'center', display: 'block', fontSize: '0.7rem' }}>
                Lower Arch (Mandibular)
              </Typography>
              <svg width="100%" height="140" viewBox="0 0 670 140" preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
                {/* Gum line curve for lower arch */}
                <path
                  d="M 40 120 Q 120 95, 200 70 Q 280 45, 335 30 Q 390 45, 470 70 Q 550 95, 630 120"
                  fill="none"
                  stroke="#ffa0a0"
                  strokeWidth="18"
                  opacity="0.2"
                />

                {/* Render lower teeth */}
                {Object.entries(LOWER_ARCH_POSITIONS).map(([toothNumber, position]) => {
                  const isMolar = ['36', '37', '38', '46', '47', '48'].includes(toothNumber);
                  return renderTooth(toothNumber, position, isMolar);
                })}
              </svg>
            </Box>
          </Box>
        </Box>

        {/* Legend */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, px: 1, pb: 1, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, bgcolor: '#ffffff', border: '2px solid #333', borderRadius: 0.5 }} />
            <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>Normal</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, bgcolor: '#1976d2', border: '2px solid #0d47a1', borderRadius: 0.5 }} />
            <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>Selected</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, bgcolor: '#ff9800', border: '2px solid #333', borderRadius: 0.5 }} />
            <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>Observation/Planned</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, bgcolor: '#2196f3', border: '2px solid #333', borderRadius: 0.5 }} />
            <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>In Progress</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, bgcolor: '#4caf50', border: '2px solid #333', borderRadius: 0.5 }} />
            <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>Completed</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, bgcolor: '#f44336', border: '2px solid #333', borderRadius: 0.5 }} />
            <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>Active Issue</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {/* Missing tooth with X-cross inside */}
            <Box sx={{
              width: 12,
              height: 12,
              bgcolor: '#f5f5f5',
              border: '2px solid #333',
              borderRadius: 0.5,
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Box sx={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                '&::before, &::after': {
                  content: '""',
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: '10px',
                  height: '2px',
                  bgcolor: '#666',
                },
                '&::before': {
                  transform: 'translate(-50%, -50%) rotate(45deg)',
                },
                '&::after': {
                  transform: 'translate(-50%, -50%) rotate(-45deg)',
                },
              }} />
            </Box>
            <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>Missing</Typography>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default AnatomicalDentalChart;
