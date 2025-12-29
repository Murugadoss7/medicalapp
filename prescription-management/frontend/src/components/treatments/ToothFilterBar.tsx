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
    <Box sx={{ mb: 2 }}>
      <Typography
        variant="caption"
        sx={{
          mb: 1,
          fontWeight: 600,
          color: 'text.secondary',
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          display: 'block',
        }}
      >
        Filter by Tooth:
      </Typography>

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 0.75,
        }}
      >
        {/* All button - Themed */}
        <Button
          variant={selectedTooth === 'all' ? 'contained' : 'outlined'}
          onClick={() => onToothChange('all')}
          sx={{
            minWidth: 60,
            minHeight: 32,
            px: 2,
            borderRadius: 8,
            fontSize: '0.8125rem',
            fontWeight: 600,
            ...(selectedTooth === 'all' ? {
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5568d3 0%, #66348a 100%)',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
              },
            } : {
              borderColor: '#667eea',
              color: '#667eea',
              '&:hover': {
                borderColor: '#5568d3',
                background: 'rgba(102, 126, 234, 0.05)',
              },
            }),
          }}
        >
          All
        </Button>

        {/* Individual tooth buttons - Compact pills */}
        {sortedTeeth.map(tooth => (
          <Button
            key={tooth}
            variant={selectedTooth === tooth ? 'contained' : 'outlined'}
            onClick={() => onToothChange(tooth)}
            sx={{
              minWidth: 50,
              minHeight: 32,
              px: 1.5,
              borderRadius: 8,
              fontSize: '0.8125rem',
              fontWeight: 600,
              ...(selectedTooth === tooth ? {
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5568d3 0%, #66348a 100%)',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                },
              } : {
                borderColor: 'rgba(102, 126, 234, 0.5)',
                color: '#667eea',
                '&:hover': {
                  borderColor: '#667eea',
                  background: 'rgba(102, 126, 234, 0.05)',
                },
              }),
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
