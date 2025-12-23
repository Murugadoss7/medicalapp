/**
 * Tooth Filter Bar - Button-based filter for iPad
 * No dropdowns - only buttons for touch-friendly UX
 */

import { Box, Button, Typography } from '@mui/material';
import { sortToothNumbers } from '../../utils/caseStudyHelpers';

interface ToothFilterBarProps {
  availableTeeth: string[];
  selectedTooth: string;
  onToothChange: (tooth: string) => void;
}

const ToothFilterBar: React.FC<ToothFilterBarProps> = ({
  availableTeeth,
  selectedTooth,
  onToothChange,
}) => {
  const sortedTeeth = sortToothNumbers([...availableTeeth]);

  return (
    <Box sx={{ mb: 3 }}>
      <Typography
        variant="subtitle2"
        sx={{
          mb: 1.5,
          fontWeight: 600,
          color: 'text.secondary',
        }}
      >
        Filter by Tooth:
      </Typography>

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        {/* All button */}
        <Button
          variant={selectedTooth === 'all' ? 'contained' : 'outlined'}
          onClick={() => onToothChange('all')}
          sx={{
            minWidth: 70,
            minHeight: 44, // iPad-friendly touch target
            fontWeight: selectedTooth === 'all' ? 600 : 400,
          }}
        >
          All
        </Button>

        {/* Individual tooth buttons */}
        {sortedTeeth.map(tooth => (
          <Button
            key={tooth}
            variant={selectedTooth === tooth ? 'contained' : 'outlined'}
            onClick={() => onToothChange(tooth)}
            sx={{
              minWidth: 60,
              minHeight: 44, // iPad-friendly touch target
              fontWeight: selectedTooth === tooth ? 600 : 400,
            }}
          >
            {tooth}
          </Button>
        ))}
      </Box>
    </Box>
  );
};

export default ToothFilterBar;
