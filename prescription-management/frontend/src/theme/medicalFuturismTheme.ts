/**
 * Medical Futurism Theme - Reusable Styles
 * Based on MEDICAL_FUTURISM_DESIGN_SYSTEM.md
 */

import { SxProps, Theme } from '@mui/material';

// Color Palette
export const colors = {
  primary: {
    main: '#667eea',
    dark: '#5568d3',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    gradientHover: 'linear-gradient(135deg, #5568d3 0%, #66348a 100%)',
    light: 'rgba(102, 126, 234, 0.08)',
    border: 'rgba(102, 126, 234, 0.15)',
    glow: 'rgba(102, 126, 234, 0.2)',
  },
  status: {
    success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    error: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    info: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
  },
  background: {
    page: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)',
    glass: 'rgba(255, 255, 255, 0.95)',
    glassAlt: 'rgba(255, 255, 255, 0.5)',
  },
};

// Typography Styles
export const typography = {
  pageTitle: {
    fontWeight: 700,
    fontSize: { xs: '1.25rem', sm: '1.5rem' },
    color: colors.primary.main,
    letterSpacing: '-0.01em',
  } as SxProps<Theme>,

  sectionTitle: {
    fontWeight: 700,
    fontSize: '0.9375rem',
    color: colors.primary.main,
  } as SxProps<Theme>,

  cardTitle: {
    fontWeight: 700,
    fontSize: { xs: '0.875rem', sm: '0.9375rem' },
    color: 'text.primary',
  } as SxProps<Theme>,

  caption: {
    fontSize: '0.75rem',
    color: 'text.secondary',
    fontWeight: 500,
  } as SxProps<Theme>,
};

// Component Styles
export const components = {
  // Primary Button (Purple Gradient)
  primaryButton: {
    minHeight: { xs: 40, sm: 48 },
    px: { xs: 2, sm: 3 },
    fontSize: { xs: '0.8125rem', sm: '0.9375rem' },
    fontWeight: 700,
    background: colors.primary.gradient,
    boxShadow: '0 4px 16px rgba(102, 126, 234, 0.4)',
    borderRadius: 2,
    '&:hover': {
      background: colors.primary.gradientHover,
      boxShadow: '0 6px 20px rgba(102, 126, 234, 0.5)',
    },
  } as SxProps<Theme>,

  // Outlined Button
  outlinedButton: {
    minHeight: { xs: 40, sm: 48 },
    px: { xs: 2, sm: 3 },
    borderColor: colors.primary.main,
    color: colors.primary.main,
    fontWeight: 600,
    borderRadius: 2,
    '&:hover': {
      borderColor: colors.primary.dark,
      background: colors.primary.light,
    },
  } as SxProps<Theme>,

  // Icon Button (Purple)
  iconButton: {
    minWidth: 44,
    minHeight: 44,
    background: colors.primary.light,
    color: colors.primary.main,
    '&:hover': {
      background: colors.primary.border,
      transform: 'scale(1.05)',
    },
  } as SxProps<Theme>,

  // Glassmorphism Paper
  glassPaper: {
    borderRadius: 3,
    background: colors.background.glass,
    backdropFilter: 'blur(20px)',
    border: `1px solid ${colors.primary.border}`,
    boxShadow: '0 8px 32px rgba(102, 126, 234, 0.1)',
  } as SxProps<Theme>,

  // Paper with Top Accent
  accentPaper: {
    borderRadius: 4,
    background: colors.background.glass,
    backdropFilter: 'blur(20px)',
    border: `1px solid ${colors.primary.border}`,
    boxShadow: '0 8px 32px rgba(102, 126, 234, 0.1)',
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '3px',
      background: colors.primary.gradient,
    },
  } as SxProps<Theme>,

  // Card (Hover Effect)
  card: {
    p: { xs: 1.25, sm: 1.5 },
    borderRadius: 2,
    background: colors.background.glass,
    backdropFilter: 'blur(10px)',
    border: `1px solid ${colors.primary.border}`,
    boxShadow: '0 1px 8px rgba(102, 126, 234, 0.1)',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      transform: 'translateX(4px)',
      boxShadow: '0 4px 16px rgba(102, 126, 234, 0.2)',
      borderColor: colors.primary.main,
    },
  } as SxProps<Theme>,

  // Status Chip (Purple)
  chip: {
    textTransform: 'capitalize',
    fontWeight: 700,
    fontSize: '0.6875rem',
    height: 24,
    background: colors.primary.gradient,
    color: 'white',
    border: 'none',
    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
  } as SxProps<Theme>,

  // Text Field (Purple Theme)
  textField: {
    '& .MuiOutlinedInput-root': {
      '& fieldset': {
        borderColor: colors.primary.border,
      },
      '&:hover fieldset': {
        borderColor: colors.primary.main,
      },
      '&.Mui-focused fieldset': {
        borderColor: colors.primary.main,
      },
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: colors.primary.main,
    },
  } as SxProps<Theme>,

  // Avatar (Purple Gradient)
  avatar: {
    width: { xs: 40, sm: 48 },
    height: { xs: 40, sm: 48 },
    background: colors.primary.gradient,
    fontSize: '1rem',
    fontWeight: 700,
    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.25)',
  } as SxProps<Theme>,

  // Custom Scrollbar
  scrollbar: {
    WebkitOverflowScrolling: 'touch',
    '&::-webkit-scrollbar': {
      width: '6px',
    },
    '&::-webkit-scrollbar-track': {
      background: colors.primary.light,
      borderRadius: 10,
    },
    '&::-webkit-scrollbar-thumb': {
      background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
      borderRadius: 10,
      '&:hover': {
        background: 'linear-gradient(180deg, #5568d3 0%, #66348a 100%)',
      },
    },
  } as SxProps<Theme>,
};

// Layout Styles
export const layouts = {
  // Page Container
  pageContainer: {
    minHeight: '100vh',
    background: colors.background.page,
    position: 'relative',
    py: 2,
  } as SxProps<Theme>,

  // Floating Gradient Orb
  floatingOrb: {
    position: 'fixed',
    width: '600px',
    height: '600px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(102, 126, 234, 0.08) 0%, transparent 70%)',
    top: '-200px',
    right: '-150px',
    animation: 'float 20s ease-in-out infinite',
    zIndex: 0,
    '@keyframes float': {
      '0%, 100%': {
        transform: 'translate(0, 0) scale(1)',
      },
      '50%': {
        transform: 'translate(-30px, 30px) scale(1.05)',
      },
    },
  } as SxProps<Theme>,

  // Content Container with Scrollbar
  scrollableContent: {
    p: { xs: 1.5, sm: 2 },
    maxHeight: 'calc(100vh - 280px)',
    overflowY: 'auto',
    overflowX: 'hidden',
    ...components.scrollbar,
  } as SxProps<Theme>,
};

// Spacing Constants
export const spacing = {
  compact: { py: 2, mb: 2, gap: 1 },
  card: { p: { xs: 1.25, sm: 1.5 } },
  section: { mb: 2 },
  grid: { spacing: 2 },
};

// Animation Presets
export const animations = {
  fadeIn: (delay = 0) => ({
    in: true,
    timeout: 600 + delay,
  }),
  staggeredFadeIn: (index: number) => ({
    in: true,
    timeout: 1200 + index * 50,
  }),
};

// Helper Functions
export const mergeStyles = (...styles: SxProps<Theme>[]): SxProps<Theme> => {
  return styles.reduce((acc, style) => ({ ...acc, ...style }), {});
};

export default {
  colors,
  typography,
  components,
  layouts,
  spacing,
  animations,
  mergeStyles,
};
