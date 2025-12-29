import { useState } from 'react';
import { useNavigate, useLocation, Link as RouterLink, useOutletContext } from 'react-router-dom';
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
  IconButton,
  InputAdornment,
  Divider,
  Fade,
  Zoom,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Google,
  Microsoft,
  Email,
  Lock,
} from '@mui/icons-material';
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
  const [showPassword, setShowPassword] = useState(false);

  // Get dark mode state from AuthLayout via Outlet context
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();

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

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      {/* Header */}
      <Fade in timeout={600}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography
            variant="h4"
            component="h2"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1,
              letterSpacing: '-0.02em',
            }}
          >
            Welcome Back
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: 'text.secondary',
              fontSize: { xs: '0.875rem', sm: '0.9375rem' },
              fontWeight: 500,
            }}
          >
            Sign in to access your healthcare dashboard
          </Typography>
        </Box>
      </Fade>

      {/* Alerts */}
      {welcomeMessage && (
        <Zoom in>
          <Alert
            severity="success"
            sx={{
              mb: 3,
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)',
            }}
          >
            {welcomeMessage}
          </Alert>
        </Zoom>
      )}

      {errorMessage && (
        <Zoom in>
          <Alert
            severity="error"
            sx={{
              mb: 3,
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(244, 67, 54, 0.15)',
            }}
          >
            {errorMessage}
          </Alert>
        </Zoom>
      )}

      {/* Social Login Buttons */}
      <Fade in timeout={800}>
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Google />}
              sx={{
                py: 1.5,
                borderRadius: 2,
                borderColor: darkMode ? 'rgba(255, 255, 255, 0.2)' : 'divider',
                color: darkMode ? '#ffffff' : 'text.primary',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.9375rem',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  borderColor: '#667eea',
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 16px rgba(102, 126, 234, 0.2)',
                },
              }}
            >
              Google
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Microsoft />}
              sx={{
                py: 1.5,
                borderRadius: 2,
                borderColor: darkMode ? 'rgba(255, 255, 255, 0.2)' : 'divider',
                color: darkMode ? '#ffffff' : 'text.primary',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.9375rem',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  borderColor: '#667eea',
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 16px rgba(102, 126, 234, 0.2)',
                },
              }}
            >
              Microsoft
            </Button>
          </Box>

          <Divider sx={{ position: 'relative', borderColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : undefined }}>
            <Typography
              variant="body2"
              sx={{
                px: 2,
                color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary',
                fontWeight: 500,
                fontSize: '0.8125rem',
              }}
            >
              OR CONTINUE WITH EMAIL
            </Typography>
          </Divider>
        </Box>
      </Fade>

      {/* Email Field */}
      <Fade in timeout={1000}>
        <Box sx={{ mb: 2 }}>
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
                error={!!errors.email}
                helperText={errors.email?.message}
                InputLabelProps={{
                  sx: {
                    color: darkMode ? 'rgba(255, 255, 255, 0.7)' : undefined,
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  sx: {
                    color: darkMode ? '#ffffff' : undefined,
                  },
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: darkMode ? 'rgba(255, 255, 255, 0.2)' : undefined,
                    },
                    '&:hover': {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#667eea',
                      },
                    },
                    '&.Mui-focused': {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderWidth: 2,
                        borderColor: '#667eea',
                        boxShadow: '0 0 0 4px rgba(102, 126, 234, 0.1)',
                      },
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#667eea',
                  },
                  '& .MuiFormHelperText-root': {
                    color: darkMode && !errors.email ? 'rgba(255, 255, 255, 0.7)' : undefined,
                  },
                }}
              />
            )}
          />
        </Box>
      </Fade>

      {/* Password Field */}
      <Fade in timeout={1200}>
        <Box sx={{ mb: 2 }}>
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                error={!!errors.password}
                helperText={errors.password?.message}
                InputLabelProps={{
                  sx: {
                    color: darkMode ? 'rgba(255, 255, 255, 0.7)' : undefined,
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleTogglePasswordVisibility}
                        edge="end"
                        sx={{
                          color: darkMode ? 'rgba(255, 255, 255, 0.7)' : undefined,
                          transition: 'all 0.2s',
                          '&:hover': {
                            background: 'rgba(102, 126, 234, 0.1)',
                          },
                        }}
                      >
                        {showPassword ? (
                          <VisibilityOff sx={{ fontSize: 20 }} />
                        ) : (
                          <Visibility sx={{ fontSize: 20 }} />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: {
                    color: darkMode ? '#ffffff' : undefined,
                  },
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: darkMode ? 'rgba(255, 255, 255, 0.2)' : undefined,
                    },
                    '&:hover': {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#667eea',
                      },
                    },
                    '&.Mui-focused': {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderWidth: 2,
                        borderColor: '#667eea',
                        boxShadow: '0 0 0 4px rgba(102, 126, 234, 0.1)',
                      },
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#667eea',
                  },
                  '& .MuiFormHelperText-root': {
                    color: darkMode && !errors.password ? 'rgba(255, 255, 255, 0.7)' : undefined,
                  },
                }}
              />
            )}
          />
        </Box>
      </Fade>

      {/* Remember Me & Forgot Password */}
      <Fade in timeout={1400}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 3,
          }}
        >
          <Controller
            name="remember_me"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Checkbox
                    {...field}
                    sx={{
                      color: darkMode ? 'rgba(255, 255, 255, 0.7)' : '#667eea',
                      '&.Mui-checked': {
                        color: '#667eea',
                      },
                    }}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.875rem', color: darkMode ? '#ffffff' : undefined }}>
                    Remember me
                  </Typography>
                }
              />
            )}
          />
          <Link
            href="#"
            underline="hover"
            sx={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#667eea',
              transition: 'all 0.2s',
              '&:hover': {
                color: '#764ba2',
              },
            }}
          >
            Forgot Password?
          </Link>
        </Box>
      </Fade>

      {/* Sign In Button */}
      <Fade in timeout={1600}>
        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={isLoading}
          sx={{
            py: 1.75,
            mb: 3,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            fontSize: '1rem',
            fontWeight: 700,
            textTransform: 'none',
            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.35)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5568d3 0%, #66348a 100%)',
              transform: 'translateY(-2px)',
              boxShadow: '0 12px 32px rgba(102, 126, 234, 0.45)',
            },
            '&:active': {
              transform: 'translateY(0)',
            },
            '&.Mui-disabled': {
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              opacity: 0.6,
            },
          }}
        >
          {isLoading ? (
            <CircularProgress size={24} sx={{ color: 'white' }} />
          ) : (
            'Sign In'
          )}
        </Button>
      </Fade>

      {/* Sign Up Link */}
      <Fade in timeout={1800}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary', fontSize: '0.875rem' }}>
            Don't have an account?{' '}
            <Link
              component={RouterLink}
              to="/auth/register"
              underline="hover"
              sx={{
                fontWeight: 700,
                color: '#667eea',
                transition: 'all 0.2s',
                '&:hover': {
                  color: '#764ba2',
                },
              }}
            >
              Sign Up
            </Link>
          </Typography>
        </Box>
      </Fade>
    </Box>
  );
};
