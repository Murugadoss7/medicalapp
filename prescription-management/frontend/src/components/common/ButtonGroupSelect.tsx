/**
 * ButtonGroupSelect Component
 * Reusable button group for tablet-friendly selection
 * Replaces dropdowns with large touch targets
 */

import React from 'react';
import { Box, Typography, ToggleButton } from '@mui/material';

interface ButtonOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface ButtonGroupSelectProps {
  label: string;
  options: string[] | ButtonOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  color?: 'primary' | 'secondary' | 'warning' | 'success' | 'info' | 'error';
  multiline?: boolean; // Wrap buttons to multiple rows
  required?: boolean;
  columns?: number; // Number of columns for grid layout (Figma pattern)
}

const ButtonGroupSelect: React.FC<ButtonGroupSelectProps> = ({
  label,
  options,
  value,
  onChange,
  disabled = false,
  color = 'primary',
  multiline = true,
  required = false,
  columns,
}) => {
  const handleChange = (_event: React.MouseEvent<HTMLElement>, newValue: string | null) => {
    if (newValue !== null) {
      onChange(newValue);
    }
  };

  // Use grid layout if columns is specified (Figma pattern)
  const useGrid = columns !== undefined;

  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
        {label}{required && <span style={{ color: 'error.main' }}> *</span>}
      </Typography>
      <Box
        sx={{
          display: useGrid ? 'grid' : 'flex',
          gridTemplateColumns: useGrid ? `repeat(${columns}, 1fr)` : undefined,
          flexWrap: !useGrid && multiline ? 'wrap' : 'nowrap',
          gap: 0.75,
        }}
      >
        {options.map((opt) => {
          const isStringOption = typeof opt === 'string';
          const optValue = isStringOption ? opt : (opt as ButtonOption).value;
          const optLabel = isStringOption ? opt : (opt as ButtonOption).label;
          const optIcon = isStringOption ? null : (opt as ButtonOption).icon;

          return (
            <ToggleButton
              key={optValue}
              value={optValue}
              selected={value === optValue}
              onChange={() => onChange(optValue)}
              disabled={disabled}
              color={color}
              sx={{
                textTransform: 'none',
                fontSize: '0.7rem',
                fontWeight: value === optValue ? 600 : 400,
                border: '2px solid',
                borderColor: value === optValue ? `${color}.main` : 'divider',
                borderRadius: 1,
                px: 1,
                py: 0.75,
                minHeight: 36,
                '&:hover': {
                  borderColor: `${color}.main`,
                  bgcolor: `${color}.50`,
                },
                '&.Mui-selected': {
                  fontWeight: 600,
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2,
                  },
                },
              }}
            >
              {optIcon && (
                <Box sx={{ mr: 0.5, display: 'flex', alignItems: 'center' }}>
                  {optIcon}
                </Box>
              )}
              {optLabel}
            </ToggleButton>
          );
        })}
      </Box>
    </Box>
  );
};

export default ButtonGroupSelect;
