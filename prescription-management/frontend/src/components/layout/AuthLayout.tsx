import { Outlet } from 'react-router-dom';
import { Box, Container, Paper, Typography } from '@mui/material';
import { LocalHospital, Healing, MedicalServices, Medication } from '@mui/icons-material';

export const AuthLayout = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        overflow: 'hidden',
      }}
    >
      {/* Left Side - Login Form */}
      <Box
        sx={{
          flex: { xs: 'none', md: 1 },
          width: { xs: '100%', md: '50%' },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          py: { xs: 3, sm: 4 },
          px: { xs: 2, sm: 3 },
          minHeight: { xs: '100vh', md: '100vh' },
        }}
      >
          <Container maxWidth="sm">
            <Paper
              elevation={24}
              sx={{
                p: { xs: 3, sm: 4 },
                borderRadius: 3,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                width: '100%',
              }}
            >
              <Box sx={{ textAlign: 'center', mb: { xs: 3, sm: 4 } }}>
                <Typography
                  variant="h4"
                  component="h1"
                  gutterBottom
                  sx={{
                    color: 'primary.main',
                    fontWeight: 'bold',
                    fontSize: { xs: '1.75rem', sm: '2.125rem' },
                  }}
                >
                  RX Manager
                </Typography>
                <Typography
                  variant="subtitle1"
                  color="text.secondary"
                  sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                >
                  Prescription Management System
                </Typography>
              </Box>

              <Outlet />
            </Paper>
          </Container>
        </Box>

        {/* Right Side - Medical Themed Image Section */}
        <Box
          sx={{
            flex: { xs: 'none', md: 1 },
            width: { xs: '100%', md: '50%' },
            display: { xs: 'none', md: 'flex' },
            position: 'relative',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            minHeight: '100vh',
          }}
        >
          {/* Background Pattern */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: 0.1,
              backgroundImage: `repeating-linear-gradient(
                45deg,
                transparent,
                transparent 10px,
                rgba(103, 126, 234, 0.1) 10px,
                rgba(103, 126, 234, 0.1) 20px
              )`,
            }}
          />

          {/* Medical Icons with Animation */}
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              p: 4,
            }}
          >
            {/* Main Illustration Area */}
            <Box
              sx={{
                position: 'relative',
                width: '80%',
                maxWidth: 500,
                height: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Central Medical Icon */}
              <Box
                sx={{
                  position: 'absolute',
                  width: 200,
                  height: 200,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 20px 60px rgba(103, 126, 234, 0.4)',
                  animation: 'pulse 3s ease-in-out infinite',
                  '@keyframes pulse': {
                    '0%, 100%': {
                      transform: 'scale(1)',
                    },
                    '50%': {
                      transform: 'scale(1.05)',
                    },
                  },
                }}
              >
                <LocalHospital sx={{ fontSize: 100, color: 'white' }} />
              </Box>

              {/* Orbiting Icons */}
              {[
                { Icon: Medication, angle: 0, delay: 0 },
                { Icon: MedicalServices, angle: 120, delay: 1 },
                { Icon: Healing, angle: 240, delay: 2 },
              ].map(({ Icon, angle, delay }, index) => (
                <Box
                  key={index}
                  sx={{
                    position: 'absolute',
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                    animation: `orbit 10s linear infinite`,
                    animationDelay: `${delay}s`,
                    transformOrigin: 'center',
                    '@keyframes orbit': {
                      '0%': {
                        transform: `rotate(${angle}deg) translateX(150px) rotate(-${angle}deg)`,
                      },
                      '100%': {
                        transform: `rotate(${angle + 360}deg) translateX(150px) rotate(-${angle + 360}deg)`,
                      },
                    },
                  }}
                >
                  <Icon sx={{ fontSize: 40, color: '#667eea' }} />
                </Box>
              ))}
            </Box>

            {/* Text Content */}
            <Box sx={{ mt: { xs: 4, lg: 6 }, textAlign: 'center', maxWidth: 500, px: 2 }}>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 2,
                  fontSize: { xs: '1.75rem', md: '2.5rem', lg: '3rem' },
                }}
              >
                Smart Healthcare Management
              </Typography>
              <Typography
                variant="h6"
                color="text.secondary"
                sx={{
                  mb: 3,
                  fontWeight: 400,
                  fontSize: { xs: '1rem', md: '1.125rem', lg: '1.25rem' },
                  px: { xs: 2, md: 0 },
                }}
              >
                Streamline your medical practice with our comprehensive prescription
                management system
              </Typography>

              {/* Feature Pills */}
              <Box sx={{ display: 'flex', gap: { xs: 1.5, md: 2 }, flexWrap: 'wrap', justifyContent: 'center' }}>
                {[
                  'Digital Prescriptions',
                  'Patient Records',
                  'Appointment Scheduling',
                  'Medicine Catalog',
                ].map((feature, index) => (
                  <Box
                    key={index}
                    sx={{
                      px: { xs: 2, md: 3 },
                      py: { xs: 0.75, md: 1 },
                      borderRadius: 20,
                      background: 'white',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                      fontSize: { xs: 12, md: 14 },
                      fontWeight: 500,
                      color: '#667eea',
                    }}
                  >
                    {feature}
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
    </Box>
  );
};