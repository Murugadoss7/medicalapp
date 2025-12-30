/**
 * Responsive Button Component - Medical Futurism Design
 * Shows icon-only on iPad/mobile (xs, sm, md)
 * Shows full button with text on desktop (lg, xl)
 * Maintains consistent Medical Futurism aesthetic
 */

import { Button, IconButton, Tooltip, ButtonProps, IconButtonProps } from '@mui/material';
import { ReactElement } from 'react';

interface ResponsiveButtonProps {
  // Button text (shown on desktop)
  label: string;

  // Icon component
  icon: ReactElement;

  // Click handler
  onClick?: () => void;

  // Button variant
  variant?: 'contained' | 'outlined' | 'text';

  // Button color
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';

  // Custom gradient colors (Medical Futurism style)
  gradientColors?: {
    from: string;
    to: string;
    glow: string;
  };

  // Disabled state
  disabled?: boolean;

  // Active/selected state
  active?: boolean;

  // Size
  size?: 'small' | 'medium' | 'large';

  // Full width on mobile
  fullWidth?: boolean;

  // Tooltip placement
  tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right';

  // Additional sx props
  sx?: ButtonProps['sx'];

  // Button type
  type?: 'button' | 'submit' | 'reset';

  // Start icon (for desktop button)
  startIcon?: ReactElement;
}

export const ResponsiveButton = ({
  label,
  icon,
  onClick,
  variant = 'contained',
  color = 'primary',
  gradientColors,
  disabled = false,
  active = false,
  size = 'medium',
  fullWidth = false,
  tooltipPlacement = 'top',
  sx = {},
  type = 'button',
  startIcon,
}: ResponsiveButtonProps) => {
  // Default gradient colors (purple gradient from Medical Futurism theme)
  const defaultGradient = {
    from: '#667eea',
    to: '#764ba2',
    glow: 'rgba(102, 126, 234, 0.3)',
  };

  const gradient = gradientColors || defaultGradient;

  // Common icon button styles (iPad/mobile)
  const iconButtonStyles = {
    minWidth: size === 'small' ? 40 : size === 'large' ? 52 : 48,
    minHeight: size === 'small' ? 40 : size === 'large' ? 52 : 48,
    borderRadius: 3,
    background: active
      ? `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)`
      : variant === 'contained'
      ? `linear-gradient(135deg, ${gradient.from}15 0%, ${gradient.to}15 100%)`
      : 'transparent',
    border: variant === 'outlined' ? '2px solid' : 'none',
    borderColor: active ? 'transparent' : `${gradient.from}30`,
    boxShadow: active
      ? `0 4px 16px ${gradient.glow}`
      : '0 2px 8px rgba(0, 0, 0, 0.04)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    color: active ? 'white' : gradient.from,
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: `0 6px 20px ${gradient.glow}`,
      background: active
        ? `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)`
        : `linear-gradient(135deg, ${gradient.from}20 0%, ${gradient.to}20 100%)`,
    },
    '&:active': {
      transform: 'translateY(0)',
    },
    '&.Mui-disabled': {
      opacity: 0.5,
    },
    ...sx,
  };

  // Common full button styles (desktop)
  const fullButtonStyles = {
    py: size === 'small' ? 1 : size === 'large' ? 1.75 : 1.5,
    px: size === 'small' ? 2 : size === 'large' ? 4 : 3,
    borderRadius: 3,
    background:
      variant === 'contained'
        ? `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)`
        : variant === 'outlined'
        ? 'transparent'
        : 'transparent',
    border: variant === 'outlined' ? '2px solid' : 'none',
    borderColor: `${gradient.from}`,
    boxShadow:
      variant === 'contained'
        ? `0 4px 16px ${gradient.glow}`
        : '0 2px 8px rgba(0, 0, 0, 0.04)',
    color: variant === 'contained' ? 'white' : gradient.from,
    fontSize: size === 'small' ? '0.8125rem' : size === 'large' ? '1rem' : '0.9375rem',
    fontWeight: 600,
    textTransform: 'none',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow:
        variant === 'contained'
          ? `0 8px 24px ${gradient.glow}`
          : `0 6px 20px ${gradient.glow}`,
      background:
        variant === 'contained'
          ? `linear-gradient(135deg, ${gradient.from}dd 0%, ${gradient.to}dd 100%)`
          : `${gradient.from}10`,
    },
    '&:active': {
      transform: 'translateY(0)',
    },
    '&.Mui-disabled': {
      opacity: 0.5,
      color: variant === 'contained' ? 'white' : gradient.from,
      background:
        variant === 'contained'
          ? `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)`
          : 'transparent',
    },
    ...sx,
  };

  return (
    <>
      {/* Icon Button - Show on iPad/Mobile (xs, sm, md) */}
      <Tooltip title={label} arrow placement={tooltipPlacement}>
        <span>
          <IconButton
            onClick={onClick}
            disabled={disabled}
            type={type}
            sx={{
              ...iconButtonStyles,
              display: { xs: 'inline-flex', lg: 'none' },
            }}
          >
            {icon}
          </IconButton>
        </span>
      </Tooltip>

      {/* Full Button - Show on Desktop (lg, xl) */}
      <Button
        onClick={onClick}
        disabled={disabled}
        type={type}
        variant={variant}
        color={color}
        size={size}
        fullWidth={fullWidth}
        startIcon={startIcon || icon}
        sx={{
          ...fullButtonStyles,
          display: { xs: 'none', lg: 'inline-flex' },
        }}
      >
        {label}
      </Button>
    </>
  );
};

export default ResponsiveButton;
