import { Box, Container, type SxProps, type Theme } from '@mui/material';
import type { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
  /**
   * Maximum width of the content area
   * - 'sm' (600px): Narrow forms, login-like pages
   * - 'md' (900px): Standard forms, multi-step wizards
   * - 'lg' (1200px): Tables, dashboards, list views
   * - 'xl' (1536px): Wide dashboards
   * - 'full': No max-width constraint (uses parent width)
   */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /**
   * Whether to center the content horizontally
   * Default: true
   */
  centered?: boolean;
  /**
   * Additional styles for the container
   */
  sx?: SxProps<Theme>;
}

/**
 * PageContainer - Provides consistent width and centering for page content
 *
 * Use this wrapper for all page content to ensure consistent layout:
 * - List views: maxWidth="lg" (default)
 * - Forms/Wizards: maxWidth="md"
 * - Dashboards: maxWidth="lg" or "xl"
 * - Narrow forms: maxWidth="sm"
 *
 * @example
 * // List page (default - full width up to lg)
 * <PageContainer>
 *   <PatientList />
 * </PageContainer>
 *
 * @example
 * // Form page with consistent width
 * <PageContainer maxWidth="md">
 *   <DoctorEditForm />
 * </PageContainer>
 */
export const PageContainer = ({
  children,
  maxWidth = 'lg',
  centered = true,
  sx,
}: PageContainerProps) => {
  // For 'full' width, just return a Box without Container
  if (maxWidth === 'full') {
    return (
      <Box
        sx={{
          width: '100%',
          minHeight: '100%',
          ...sx,
        }}
      >
        {children}
      </Box>
    );
  }

  return (
    <Container
      maxWidth={maxWidth}
      disableGutters
      sx={{
        minHeight: '100%',
        mx: centered ? 'auto' : 0,
        px: { xs: 0, sm: 0 }, // Padding handled by MainLayout
        ...sx,
      }}
    >
      {children}
    </Container>
  );
};

/**
 * FormPageContainer - Specialized container for multi-step forms
 *
 * Ensures consistent width across all form steps, preventing
 * the jarring expand/shrink effect when navigating between steps.
 *
 * Features:
 * - Fixed width regardless of content
 * - Centered horizontally
 * - Minimum height to prevent vertical jumping
 *
 * @example
 * <FormPageContainer>
 *   <Stepper />
 *   <FormContent />
 *   <NavigationButtons />
 * </FormPageContainer>
 */
export const FormPageContainer = ({
  children,
  maxWidth = 'md',
  sx,
}: Omit<PageContainerProps, 'centered'>) => {
  return (
    <Container
      maxWidth={maxWidth}
      disableGutters
      sx={{
        minHeight: '100%',
        mx: 'auto',
        // Ensure content doesn't cause width changes
        '& > *': {
          width: '100%',
        },
        ...sx,
      }}
    >
      <Box
        sx={{
          width: '100%',
          minWidth: maxWidth === 'sm' ? 500 : maxWidth === 'md' ? 700 : 900,
        }}
      >
        {children}
      </Box>
    </Container>
  );
};

export default PageContainer;
