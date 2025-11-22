import { useState } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  FormControlLabel,
  Checkbox,
  Link,
  CircularProgress,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useLoginMutation } from '../../store/api';
import { useAppDispatch } from '../../hooks';
import { setCredentials } from '../../store/slices/authSlice';

interface LoginFormData {
  email: string;
  password: string;
  remember_me: boolean;
}

const schema = yup.object({
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email'),
  password: yup
    .string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters'),
  remember_me: yup.boolean(),
});

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const [errorMessage, setErrorMessage] = useState('');

  // Get welcome message from registration redirect
  const welcomeMessage = location.state?.message;
  const emailFromRegistration = location.state?.email;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      email: emailFromRegistration || '',
      password: '',
      remember_me: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setErrorMessage('');
      const response = await login(data).unwrap();
      
      dispatch(setCredentials({
        user: response.user,
        tokens: response.tokens,
      }));

      // Navigate based on user role
      const from = location.state?.from?.pathname || '/dashboard';
      switch (response.user.role) {
        case 'doctor':
          navigate('/doctor/dashboard');
          break;
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'patient':
          navigate('/patient/dashboard');
          break;
        default:
          navigate(from);
      }
    } catch (error: any) {
      setErrorMessage(error.data?.detail || 'Login failed. Please try again.');
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Typography
        variant="h5"
        component="h2"
        gutterBottom
        sx={{ textAlign: 'center', mb: 3 }}
      >
        Sign In
      </Typography>

      {welcomeMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {welcomeMessage}
        </Alert>
      )}

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}

      <Controller
        name="email"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            fullWidth
            label="Email Address"
            type="email"
            autoComplete="email"
            autoFocus
            margin="normal"
            error={!!errors.email}
            helperText={errors.email?.message}
          />
        )}
      />

      <Controller
        name="password"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            fullWidth
            label="Password"
            type="password"
            autoComplete="current-password"
            margin="normal"
            error={!!errors.password}
            helperText={errors.password?.message}
          />
        )}
      />

      <Controller
        name="remember_me"
        control={control}
        render={({ field }) => (
          <FormControlLabel
            control={<Checkbox {...field} color="primary" />}
            label="Remember me"
            sx={{ mt: 1 }}
          />
        )}
      />

      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2, py: 1.5 }}
        disabled={isLoading}
      >
        {isLoading ? (
          <CircularProgress size={24} color="inherit" />
        ) : (
          'Sign In'
        )}
      </Button>

      <Box sx={{ textAlign: 'center' }}>
        <Link
          component={RouterLink}
          to="/auth/register"
          variant="body2"
          underline="hover"
        >
          Don't have an account? Sign Up
        </Link>
      </Box>
    </Box>
  );
};