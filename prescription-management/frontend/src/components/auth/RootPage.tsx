import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks';
import { LandingPage } from '../../pages/LandingPage';

/**
 * Root page component that shows:
 * - LandingPage if user is NOT authenticated
 * - Redirects to dashboard if user IS authenticated
 */
export const RootPage = () => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <LandingPage />;
};
