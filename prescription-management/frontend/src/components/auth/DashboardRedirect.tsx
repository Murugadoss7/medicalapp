import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useGetCurrentUserQuery } from '../../store/api';
import { CircularProgress, Box } from '@mui/material';

export const DashboardRedirect = () => {
  // Check if we have a token before making API call
  const hasToken = !!localStorage.getItem('access_token');
  const { data: user, isLoading, error } = useGetCurrentUserQuery(undefined, {
    skip: !hasToken, // Skip API call if no token
  });

  // If no token, redirect to login immediately
  if (!hasToken) {
    return <Navigate to="/auth/login" replace />;
  }

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !user) {
    return <Navigate to="/auth/login" replace />;
  }

  // Redirect based on user role
  switch (user.role) {
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    case 'doctor':
      return <Navigate to="/doctor/dashboard" replace />;
    case 'patient':
      return <Navigate to="/patient/dashboard" replace />;
    case 'nurse':
    case 'receptionist':
      return <Navigate to="/doctor/dashboard" replace />; // Default to doctor dashboard for now
    default:
      return <Navigate to="/doctor/dashboard" replace />;
  }
};