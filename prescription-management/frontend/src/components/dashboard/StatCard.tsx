import { Box, Typography, Skeleton } from '@mui/material';
import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon?: ReactNode;
  loading?: boolean;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  subtitle?: string;
  onClick?: () => void;
}

// Color mappings with gradient backgrounds
const colorStyles = {
  primary: {
    gradient: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
    iconBg: 'rgba(25, 118, 210, 0.12)',
    iconColor: '#1976d2',
    valueColor: '#1976d2',
  },
  secondary: {
    gradient: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
    iconBg: 'rgba(156, 39, 176, 0.12)',
    iconColor: '#9c27b0',
    valueColor: '#9c27b0',
  },
  success: {
    gradient: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
    iconBg: 'rgba(46, 125, 50, 0.12)',
    iconColor: '#2e7d32',
    valueColor: '#2e7d32',
  },
  warning: {
    gradient: 'linear-gradient(135deg, #ed6c02 0%, #e65100 100%)',
    iconBg: 'rgba(237, 108, 2, 0.12)',
    iconColor: '#ed6c02',
    valueColor: '#ed6c02',
  },
  error: {
    gradient: 'linear-gradient(135deg, #d32f2f 0%, #c62828 100%)',
    iconBg: 'rgba(211, 47, 47, 0.12)',
    iconColor: '#d32f2f',
    valueColor: '#d32f2f',
  },
  info: {
    gradient: 'linear-gradient(135deg, #0288d1 0%, #01579b 100%)',
    iconBg: 'rgba(2, 136, 209, 0.12)',
    iconColor: '#0288d1',
    valueColor: '#0288d1',
  },
};

export const StatCard = ({
  title,
  value,
  icon,
  loading = false,
  color = 'primary',
  subtitle,
  onClick
}: StatCardProps) => {
  const styles = colorStyles[color];

  if (loading) {
    return (
      <Box
        sx={{
          bgcolor: 'white',
          borderRadius: 2,
          p: 2.5,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        }}
      >
        <Skeleton variant="circular" width={44} height={44} sx={{ mb: 2 }} />
        <Skeleton variant="text" width="50%" height={36} />
        <Skeleton variant="text" width="70%" height={20} />
      </Box>
    );
  }

  return (
    <Box
      onClick={onClick}
      sx={{
        bgcolor: 'white',
        borderRadius: 2,
        p: { xs: 1.5, sm: 2, md: 2.5 },
        height: '100%',
        minHeight: { xs: 110, sm: 120, md: 140 },
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        border: '1px solid rgba(0,0,0,0.04)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease-in-out',
        '&:hover': onClick ? {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 25px rgba(0,0,0,0.1), 0 4px 10px rgba(0,0,0,0.06)',
        } : {},
        // Subtle accent bar at top
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: styles.gradient,
        },
      }}
    >
      {/* Icon */}
      {icon && (
        <Box
          sx={{
            width: { xs: 36, sm: 40, md: 44 },
            height: { xs: 36, sm: 40, md: 44 },
            borderRadius: 1.5,
            bgcolor: styles.iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: styles.iconColor,
            mb: { xs: 1, sm: 1.5 },
            '& svg': {
              fontSize: { xs: 20, sm: 22, md: 24 },
            },
          }}
        >
          {icon}
        </Box>
      )}

      {/* Title */}
      <Typography
        variant="body2"
        sx={{
          color: 'text.secondary',
          fontWeight: 500,
          fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' },
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          mb: 0.5,
          lineHeight: 1.3,
        }}
      >
        {title}
      </Typography>

      {/* Value */}
      <Typography
        variant="h3"
        sx={{
          fontWeight: 700,
          color: styles.valueColor,
          lineHeight: 1.2,
          fontSize: { xs: '1.75rem', sm: '2rem' },
        }}
      >
        {value}
      </Typography>

      {/* Subtitle */}
      {subtitle && (
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            mt: 'auto',
            pt: 0.5,
            fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
            lineHeight: 1.3,
          }}
        >
          {subtitle}
        </Typography>
      )}
    </Box>
  );
};
