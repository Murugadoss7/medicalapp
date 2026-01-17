import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks';

interface PublicRouteProps {
  children: ReactNode;
}

/**
 * Public route that redirects authenticated users to dashboard
 * Use this for landing page, login, register, etc.
 */
export const PublicRoute = ({ children }: PublicRouteProps) => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
