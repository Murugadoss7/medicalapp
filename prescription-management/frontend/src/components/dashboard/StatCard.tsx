/**
 * Stat Card Component - Medical Futurism Design
 * Enhanced with glassmorphism, gradients, and smooth animations
 * iPad-friendly responsive sizing
 */

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

// Enhanced color mappings with Medical Futurism gradients
const colorStyles = {
  primary: {
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    iconBg: 'rgba(102, 126, 234, 0.15)',
    iconColor: '#667eea',
    valueColor: '#667eea',
    glow: 'rgba(102, 126, 234, 0.25)',
  },
  secondary: {
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    iconBg: 'rgba(240, 147, 251, 0.15)',
    iconColor: '#f093fb',
    valueColor: '#f093fb',
    glow: 'rgba(240, 147, 251, 0.25)',
  },
  success: {
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    iconBg: 'rgba(16, 185, 129, 0.15)',
    iconColor: '#10b981',
    valueColor: '#10b981',
    glow: 'rgba(16, 185, 129, 0.25)',
  },
  warning: {
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    iconBg: 'rgba(245, 158, 11, 0.15)',
    iconColor: '#f59e0b',
    valueColor: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.25)',
  },
  error: {
    gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    iconBg: 'rgba(239, 68, 68, 0.15)',
    iconColor: '#ef4444',
    valueColor: '#ef4444',
    glow: 'rgba(239, 68, 68, 0.25)',
  },
  info: {
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    iconBg: 'rgba(59, 130, 246, 0.15)',
    iconColor: '#3b82f6',
    valueColor: '#3b82f6',
    glow: 'rgba(59, 130, 246, 0.25)',
  },
};

export const StatCard = ({
  title,
  value,
  icon,
  loading = false,
  color = 'primary',
  subtitle,
  onClick,
}: StatCardProps) => {
  const styles = colorStyles[color];

  if (loading) {
    return (
      <Box
        sx={{
          borderRadius: 4,
          p: 3,
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(102, 126, 234, 0.15)',
        }}
      >
        <Skeleton variant="circular" width={56} height={56} sx={{ mb: 2 }} />
        <Skeleton variant="text" width="60%" height={36} />
        <Skeleton variant="text" width="80%" height={20} />
      </Box>
    );
  }

  return (
    <Box
      onClick={onClick}
      sx={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: 4,
        p: { xs: 2, sm: 2.5, md: 2, lg: 3 }, // Compact on iPad, spacious on desktop
        height: '100%',
        minHeight: { xs: 140, sm: 160, md: 120, lg: 160 }, // Shorter on iPad
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: `0 4px 20px ${styles.glow}`,
        border: '1px solid rgba(102, 126, 234, 0.15)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': onClick
          ? {
              transform: 'translateY(-4px)',
              boxShadow: `0 8px 32px ${styles.glow}`,
              '&::before': {
                opacity: 1,
              },
            }
          : {
              transform: 'translateY(-2px)',
              boxShadow: `0 6px 24px ${styles.glow}`,
            },
        // Gradient top border
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: styles.gradient,
          opacity: 0.8,
          transition: 'opacity 0.3s',
        },
      }}
    >
      {/* Icon */}
      {icon && (
        <Box
          sx={{
            width: { xs: 48, sm: 52, md: 44, lg: 56 }, // Smaller on iPad
            height: { xs: 48, sm: 52, md: 44, lg: 56 },
            borderRadius: 3,
            background: styles.iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: styles.iconColor,
            mb: { xs: 1.5, sm: 2, md: 1.25, lg: 2 }, // Less margin on iPad
            boxShadow: `0 4px 12px ${styles.glow}`,
            '& svg': {
              fontSize: { xs: 24, sm: 26, md: 22, lg: 28 }, // Smaller icons on iPad
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
          fontWeight: 600,
          fontSize: { xs: '0.75rem', sm: '0.8125rem' },
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          mb: 0.75,
          lineHeight: 1.3,
        }}
      >
        {title}
      </Typography>

      {/* Value */}
      <Typography
        variant="h3"
        sx={{
          fontWeight: 800,
          background: styles.gradient,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1.2,
          fontSize: { xs: '2rem', sm: '2.25rem', md: '1.75rem', lg: '2.5rem' }, // Smaller on iPad
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
            pt: 1,
            fontSize: { xs: '0.75rem', sm: '0.8125rem' },
            lineHeight: 1.4,
            fontWeight: 500,
          }}
        >
          {subtitle}
        </Typography>
      )}
    </Box>
  );
};
