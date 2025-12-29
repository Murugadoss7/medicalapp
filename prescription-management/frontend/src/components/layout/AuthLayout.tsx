import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  IconButton,
  useMediaQuery,
  Slide,
  Fade,
} from '@mui/material';
import {
  LocalHospital,
  Healing,
  MedicalServices,
  Medication,
  Vaccines,
  MonitorHeart,
  LightMode,
  DarkMode,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

export const AuthLayout = () => {
  const [darkMode, setDarkMode] = useState(false);
  const theme = useTheme();
  const isLandscape = useMediaQuery('(min-width: 900px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1366px)');

  useEffect(() => {
    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(prefersDark);
  }, []);

  const handleToggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Dynamic color scheme based on dark mode
  const colors = {
    bg: darkMode ? '#0a0e27' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    cardBg: darkMode ? 'rgba(26, 31, 54, 0.95)' : 'rgba(255, 255, 255, 0.98)',
    brandBg: darkMode ? '#1a1f36' : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    text: darkMode ? '#ffffff' : '#1a1f36',
    textSecondary: darkMode ? '#a0aec0' : '#4a5568',
    accent: '#667eea',
    accentDark: '#764ba2',
  };

  // Feature pills data
  const features = [
    { icon: <LocalHospital />, label: 'Digital Prescriptions', color: '#667eea' },
    { icon: <Healing />, label: 'Patient Records', color: '#764ba2' },
    { icon: <MedicalServices />, label: 'Appointment Scheduling', color: '#00d4ff' },
    { icon: <Medication />, label: 'Medicine Catalog', color: '#ff6b9d' },
  ];

  // Floating medical icons for background
  const floatingIcons = [
    { Icon: Vaccines, top: '15%', left: '10%', delay: 0, duration: 8 },
    { Icon: MonitorHeart, top: '70%', left: '15%', delay: 2, duration: 10 },
    { Icon: Medication, top: '30%', right: '12%', delay: 1, duration: 9 },
    { Icon: Healing, top: '60%', right: '20%', delay: 3, duration: 7 },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: isLandscape ? 'row' : 'column',
        overflow: 'hidden',
        position: 'relative',
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Dark Mode Toggle - Fixed Position */}
      <IconButton
        onClick={handleToggleDarkMode}
        sx={{
          position: 'fixed',
          top: { xs: 16, sm: 24 },
          right: { xs: 16, sm: 24 },
          zIndex: 1300,
          width: { xs: 44, sm: 52 },
          height: { xs: 44, sm: 52 },
          background: darkMode
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(12px)',
          border: darkMode
            ? '1px solid rgba(255, 255, 255, 0.1)'
            : '1px solid rgba(102, 126, 234, 0.2)',
          boxShadow: darkMode
            ? '0 8px 24px rgba(0, 0, 0, 0.4)'
            : '0 8px 24px rgba(102, 126, 234, 0.25)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            background: darkMode
              ? 'rgba(255, 255, 255, 0.15)'
              : 'rgba(255, 255, 255, 1)',
            transform: 'rotate(180deg) scale(1.1)',
            boxShadow: darkMode
              ? '0 12px 32px rgba(0, 0, 0, 0.5)'
              : '0 12px 32px rgba(102, 126, 234, 0.35)',
          },
        }}
      >
        {darkMode ? (
          <LightMode sx={{ color: '#ffd700', fontSize: { xs: 22, sm: 26 } }} />
        ) : (
          <DarkMode sx={{ color: '#667eea', fontSize: { xs: 22, sm: 26 } }} />
        )}
      </IconButton>

      {/* Left/Top Side - Login Form */}
      <Box
        sx={{
          flex: isLandscape ? 1 : 'none',
          width: isLandscape ? '50%' : '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: colors.bg,
          py: { xs: 4, sm: 5, md: 6 },
          px: { xs: 2, sm: 3, md: 4 },
          minHeight: isLandscape ? '100vh' : '100vh',
          position: 'relative',
          overflow: 'hidden',
          transition: 'background 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Animated background particles/grid */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: darkMode ? 0.15 : 0.08,
            background: darkMode
              ? `radial-gradient(circle at 20% 50%, rgba(102, 126, 234, 0.3) 0%, transparent 50%),
                 radial-gradient(circle at 80% 80%, rgba(118, 75, 162, 0.3) 0%, transparent 50%)`
              : `repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 2px,
                  rgba(255, 255, 255, 0.1) 2px,
                  rgba(255, 255, 255, 0.1) 4px
                ),
                repeating-linear-gradient(
                  90deg,
                  transparent,
                  transparent 2px,
                  rgba(255, 255, 255, 0.1) 2px,
                  rgba(255, 255, 255, 0.1) 4px
                )`,
            backgroundSize: '60px 60px',
            animation: 'gridMove 20s linear infinite',
            '@keyframes gridMove': {
              '0%': {
                transform: 'translate(0, 0)',
              },
              '100%': {
                transform: 'translate(60px, 60px)',
              },
            },
          }}
        />

        <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
          <Slide direction={isLandscape ? 'right' : 'down'} in timeout={800}>
            <Paper
              elevation={darkMode ? 8 : 24}
              sx={{
                p: { xs: 3, sm: 4, md: 5 },
                borderRadius: { xs: 3, sm: 4 },
                background: colors.cardBg,
                backdropFilter: 'blur(20px)',
                border: darkMode
                  ? '1px solid rgba(102, 126, 234, 0.2)'
                  : '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: darkMode
                  ? '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(102, 126, 234, 0.1)'
                  : '0 24px 72px rgba(102, 126, 234, 0.2)',
                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'linear-gradient(90deg, #667eea 0%, #764ba2 50%, #667eea 100%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 3s linear infinite',
                },
                '@keyframes shimmer': {
                  '0%': {
                    backgroundPosition: '200% 0',
                  },
                  '100%': {
                    backgroundPosition: '-200% 0',
                  },
                },
              }}
            >
              {/* Logo/Brand Section */}
              <Fade in timeout={1000}>
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: { xs: 64, sm: 72 },
                      height: { xs: 64, sm: 72 },
                      borderRadius: '20px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      mb: 2,
                      boxShadow: '0 12px 28px rgba(102, 126, 234, 0.4)',
                      animation: 'float 3s ease-in-out infinite',
                      '@keyframes float': {
                        '0%, 100%': {
                          transform: 'translateY(0px)',
                        },
                        '50%': {
                          transform: 'translateY(-8px)',
                        },
                      },
                    }}
                  >
                    <LocalHospital sx={{ fontSize: { xs: 36, sm: 42 }, color: 'white' }} />
                  </Box>
                  <Typography
                    variant="h3"
                    component="h1"
                    sx={{
                      fontWeight: 800,
                      fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      mb: 0.5,
                      letterSpacing: '-0.03em',
                    }}
                  >
                    RX Manager
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      color: colors.textSecondary,
                      fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                      fontWeight: 500,
                    }}
                  >
                    Prescription Management System
                  </Typography>
                </Box>
              </Fade>

              {/* Form Content */}
              <Outlet context={{ darkMode }} />
            </Paper>
          </Slide>
        </Container>
      </Box>

      {/* Right/Bottom Side - Branding Section */}
      <Box
        sx={{
          flex: isLandscape ? 1 : 'none',
          width: isLandscape ? '50%' : '100%',
          display: { xs: 'none', md: 'flex' },
          position: 'relative',
          background: colors.brandBg,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          minHeight: isLandscape ? '100vh' : '50vh',
          transition: 'background 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Animated gradient orbs */}
        <Box
          sx={{
            position: 'absolute',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: darkMode
              ? 'radial-gradient(circle, rgba(102, 126, 234, 0.2) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(102, 126, 234, 0.15) 0%, transparent 70%)',
            top: '-200px',
            right: '-200px',
            animation: 'orbitSlow 25s linear infinite',
            '@keyframes orbitSlow': {
              '0%': {
                transform: 'rotate(0deg) translateX(50px) rotate(0deg)',
              },
              '100%': {
                transform: 'rotate(360deg) translateX(50px) rotate(-360deg)',
              },
            },
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: darkMode
              ? 'radial-gradient(circle, rgba(118, 75, 162, 0.2) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(118, 75, 162, 0.15) 0%, transparent 70%)',
            bottom: '-100px',
            left: '-100px',
            animation: 'orbitReverse 20s linear infinite',
            '@keyframes orbitReverse': {
              '0%': {
                transform: 'rotate(360deg) translateX(30px) rotate(-360deg)',
              },
              '100%': {
                transform: 'rotate(0deg) translateX(30px) rotate(0deg)',
              },
            },
          }}
        />

        {/* Floating medical icons */}
        {floatingIcons.map(({ Icon, top, left, delay, duration, ...pos }, index) => (
          <Box
            key={index}
            sx={{
              position: 'absolute',
              top,
              left,
              ...pos,
              opacity: darkMode ? 0.15 : 0.08,
              animation: `floatRandom${index} ${duration}s ease-in-out infinite`,
              animationDelay: `${delay}s`,
              [`@keyframes floatRandom${index}`]: {
                '0%, 100%': {
                  transform: 'translate(0, 0) rotate(0deg)',
                },
                '25%': {
                  transform: `translate(${10 + index * 5}px, ${-15 - index * 3}px) rotate(90deg)`,
                },
                '50%': {
                  transform: `translate(${-10 - index * 3}px, ${-20 - index * 5}px) rotate(180deg)`,
                },
                '75%': {
                  transform: `translate(${-15 - index * 5}px, ${10 + index * 3}px) rotate(270deg)`,
                },
              },
            }}
          >
            <Icon sx={{ fontSize: { md: 48, lg: 64 }, color: darkMode ? 'rgba(255, 255, 255, 0.6)' : colors.accent }} />
          </Box>
        ))}

        {/* Main Content */}
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: { md: 4, lg: 6 },
            zIndex: 1,
          }}
        >
          {/* Central Medical Visualization */}
          <Fade in timeout={1200}>
            <Box
              sx={{
                position: 'relative',
                width: { md: '320px', lg: '400px' },
                height: { md: '320px', lg: '400px' },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: { md: 4, lg: 6 },
              }}
            >
              {/* Pulsing rings */}
              {[1, 2, 3].map((ring) => (
                <Box
                  key={ring}
                  sx={{
                    position: 'absolute',
                    width: `${ring * 25}%`,
                    height: `${ring * 25}%`,
                    borderRadius: '50%',
                    border: darkMode
                      ? '2px solid rgba(102, 126, 234, 0.3)'
                      : '2px solid rgba(102, 126, 234, 0.2)',
                    animation: `pulse ${2 + ring}s ease-in-out infinite`,
                    animationDelay: `${ring * 0.3}s`,
                    '@keyframes pulse': {
                      '0%, 100%': {
                        transform: 'scale(1)',
                        opacity: 0.8,
                      },
                      '50%': {
                        transform: 'scale(1.1)',
                        opacity: 0.4,
                      },
                    },
                  }}
                />
              ))}

              {/* Central Icon */}
              <Box
                sx={{
                  width: { md: 140, lg: 180 },
                  height: { md: 140, lg: 180 },
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: darkMode
                    ? '0 24px 72px rgba(102, 126, 234, 0.6)'
                    : '0 24px 72px rgba(102, 126, 234, 0.4)',
                  animation: 'breathe 4s ease-in-out infinite',
                  '@keyframes breathe': {
                    '0%, 100%': {
                      transform: 'scale(1)',
                    },
                    '50%': {
                      transform: 'scale(1.08)',
                    },
                  },
                }}
              >
                <LocalHospital sx={{ fontSize: { md: 70, lg: 90 }, color: 'white' }} />
              </Box>

              {/* Orbiting Feature Icons */}
              {features.map((feature, index) => {
                const angle = (index * 360) / features.length;
                return (
                  <Box
                    key={index}
                    sx={{
                      position: 'absolute',
                      width: { md: 60, lg: 70 },
                      height: { md: 60, lg: 70 },
                      borderRadius: '50%',
                      background: darkMode ? 'rgba(26, 31, 54, 0.8)' : 'white',
                      border: darkMode
                        ? '2px solid rgba(102, 126, 234, 0.3)'
                        : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: darkMode
                        ? '0 8px 24px rgba(0, 0, 0, 0.4)'
                        : '0 12px 32px rgba(0, 0, 0, 0.12)',
                      animation: `orbit 12s linear infinite`,
                      animationDelay: `${index * -3}s`,
                      transformOrigin: 'center',
                      '@keyframes orbit': {
                        '0%': {
                          transform: `rotate(${angle}deg) translateX(${isTablet ? 130 : 160}px) rotate(-${angle}deg)`,
                        },
                        '100%': {
                          transform: `rotate(${angle + 360}deg) translateX(${isTablet ? 130 : 160}px) rotate(-${angle + 360}deg)`,
                        },
                      },
                    }}
                  >
                    {feature.icon}
                  </Box>
                );
              })}
            </Box>
          </Fade>

          {/* Text Content */}
          <Fade in timeout={1400}>
            <Box sx={{ textAlign: 'center', maxWidth: 540, px: 2 }}>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 800,
                  fontSize: { md: '2rem', lg: '2.75rem' },
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 2,
                  letterSpacing: '-0.03em',
                  lineHeight: 1.2,
                }}
              >
                Smart Healthcare
                <br />
                Management
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: colors.textSecondary,
                  mb: 4,
                  fontWeight: 500,
                  fontSize: { md: '1rem', lg: '1.125rem' },
                  lineHeight: 1.6,
                }}
              >
                Streamline your medical practice with our comprehensive prescription
                management system
              </Typography>

              {/* Feature Pills */}
              <Box
                sx={{
                  display: 'flex',
                  gap: 1.5,
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                }}
              >
                {features.map((feature, index) => (
                  <Fade key={index} in timeout={1600 + index * 200}>
                    <Box
                      sx={{
                        px: 3,
                        py: 1.25,
                        borderRadius: 20,
                        background: darkMode
                          ? 'rgba(102, 126, 234, 0.15)'
                          : 'white',
                        border: darkMode
                          ? '1px solid rgba(102, 126, 234, 0.3)'
                          : 'none',
                        boxShadow: darkMode
                          ? 'none'
                          : '0 4px 16px rgba(0, 0, 0, 0.08)',
                        fontSize: { md: 13, lg: 14 },
                        fontWeight: 600,
                        color: darkMode ? '#a0aec0' : feature.color,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        cursor: 'default',
                        '&:hover': {
                          transform: 'translateY(-2px) scale(1.05)',
                          boxShadow: darkMode
                            ? '0 8px 24px rgba(102, 126, 234, 0.3)'
                            : '0 8px 24px rgba(0, 0, 0, 0.15)',
                        },
                      }}
                    >
                      {feature.label}
                    </Box>
                  </Fade>
                ))}
              </Box>
            </Box>
          </Fade>
        </Box>
      </Box>
    </Box>
  );
};
