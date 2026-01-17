import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Stack,
  Chip,
  alpha,
  Link,
} from '@mui/material';
import {
  LocalHospital,
  CalendarToday,
  Description,
  People,
  TrendingUp,
  Security,
  Speed,
  Support,
  Check,
} from '@mui/icons-material';

export const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <LocalHospital />,
      title: 'Patient Management',
      description: 'Complete patient records with family support',
    },
    {
      icon: <CalendarToday />,
      title: 'Smart Scheduling',
      description: 'Efficient appointment booking and management',
    },
    {
      icon: <Description />,
      title: 'Digital Prescriptions',
      description: 'Create, manage and track prescriptions',
    },
    {
      icon: <People />,
      title: 'Multi-Doctor Support',
      description: 'Manage multiple doctors and clinics',
    },
    {
      icon: <TrendingUp />,
      title: 'Analytics Dashboard',
      description: 'Real-time insights and reports',
    },
    {
      icon: <Security />,
      title: 'Secure & Compliant',
      description: 'HIPAA-ready data security',
    },
  ];

  const plans = [
    {
      name: 'Trial',
      price: 'Free',
      duration: '30 days',
      features: [
        'Up to 5 doctors',
        'Up to 1,000 patients',
        'All core features',
        'Email support',
      ],
      cta: 'Start Free Trial',
      highlighted: true,
    },
    {
      name: 'Basic',
      price: '₹2,999',
      duration: 'per month',
      features: [
        'Up to 20 doctors',
        'Up to 10,000 patients',
        'Multi-clinic support',
        'Priority support',
      ],
      cta: 'Start with Basic',
      highlighted: false,
    },
    {
      name: 'Premium',
      price: '₹9,999',
      duration: 'per month',
      features: [
        'Up to 100 doctors',
        'Unlimited patients',
        'Advanced analytics',
        'Dedicated support',
      ],
      cta: 'Go Premium',
      highlighted: false,
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header */}
      <Box
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          py: 2,
          bgcolor: 'background.paper',
        }}
      >
        <Container maxWidth="lg">
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1} alignItems="center">
              <LocalHospital color="primary" sx={{ fontSize: 32 }} />
              <Typography variant="h6" fontWeight="bold">
                MediManager
              </Typography>
            </Stack>
            <Stack direction="row" spacing={2}>
              <Button
                color="inherit"
                onClick={() => navigate('/auth/login')}
              >
                Sign In
              </Button>
              <Button
                variant="contained"
                onClick={() => navigate('/auth/register-clinic')}
              >
                Get Started
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* Hero Section */}
      <Box
        sx={{
          background: (theme) =>
            `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(
              theme.palette.primary.main,
              0.05
            )} 100%)`,
          py: { xs: 8, md: 12 },
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography
                variant="h2"
                fontWeight="bold"
                gutterBottom
                sx={{ fontSize: { xs: '2.5rem', md: '3.5rem' } }}
              >
                Manage Your Clinic{' '}
                <Box component="span" color="primary.main">
                  Digitally
                </Box>
              </Typography>
              <Typography
                variant="h6"
                color="text.secondary"
                paragraph
                sx={{ mb: 4 }}
              >
                Complete practice management system for modern healthcare
                providers. Patient records, appointments, prescriptions, and more
                - all in one place.
              </Typography>
              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<Speed />}
                  onClick={() => navigate('/auth/register-clinic')}
                >
                  Start Free Trial
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/auth/login')}
                >
                  Sign In
                </Button>
              </Stack>
              <Stack direction="row" spacing={3} sx={{ mt: 3 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Check color="success" fontSize="small" />
                  <Typography variant="body2">No credit card required</Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Check color="success" fontSize="small" />
                  <Typography variant="body2">30-day free trial</Typography>
                </Stack>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  p: 3,
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                  boxShadow: 3,
                }}
              >
                <Typography variant="h6" gutterBottom>
                  ✨ What You Get:
                </Typography>
                <Stack spacing={1.5}>
                  {[
                    'Complete patient management system',
                    'Digital prescription generation',
                    'Smart appointment scheduling',
                    'Family member registration',
                    'Multi-clinic & multi-doctor support',
                    'Secure cloud storage',
                  ].map((item, index) => (
                    <Stack key={index} direction="row" spacing={1}>
                      <Check color="primary" fontSize="small" />
                      <Typography variant="body2">{item}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" align="center" fontWeight="bold" gutterBottom>
          Everything You Need
        </Typography>
        <Typography
          variant="h6"
          align="center"
          color="text.secondary"
          paragraph
          sx={{ mb: 6 }}
        >
          Powerful features to streamline your practice
        </Typography>
        <Grid container spacing={3}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-4px)' },
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      color: 'primary.main',
                      mb: 2,
                      '& svg': { fontSize: 40 },
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Pricing Section */}
      <Box sx={{ bgcolor: 'background.paper', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" align="center" fontWeight="bold" gutterBottom>
            Simple, Transparent Pricing
          </Typography>
          <Typography
            variant="h6"
            align="center"
            color="text.secondary"
            paragraph
            sx={{ mb: 6 }}
          >
            Start free, upgrade as you grow
          </Typography>
          <Grid container spacing={3} justifyContent="center">
            {plans.map((plan, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    position: 'relative',
                    border: plan.highlighted ? 2 : 0,
                    borderColor: 'primary.main',
                    transform: plan.highlighted ? 'scale(1.05)' : 'none',
                  }}
                >
                  {plan.highlighted && (
                    <Chip
                      label="Most Popular"
                      color="primary"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                      }}
                    />
                  )}
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                      {plan.name}
                    </Typography>
                    <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mb: 3 }}>
                      <Typography variant="h3" fontWeight="bold">
                        {plan.price}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {plan.duration}
                      </Typography>
                    </Stack>
                    <Stack spacing={2} sx={{ mb: 4 }}>
                      {plan.features.map((feature, idx) => (
                        <Stack key={idx} direction="row" spacing={1}>
                          <Check color="primary" fontSize="small" />
                          <Typography variant="body2">{feature}</Typography>
                        </Stack>
                      ))}
                    </Stack>
                    <Button
                      variant={plan.highlighted ? 'contained' : 'outlined'}
                      fullWidth
                      size="large"
                      onClick={() => navigate('/auth/register-clinic')}
                    >
                      {plan.cta}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 8 }}>
        <Container maxWidth="md">
          <Typography variant="h3" align="center" fontWeight="bold" gutterBottom>
            Ready to Get Started?
          </Typography>
          <Typography variant="h6" align="center" paragraph sx={{ mb: 4 }}>
            Join hundreds of clinics already using MediManager
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="contained"
              size="large"
              sx={{ bgcolor: 'white', color: 'primary.main' }}
              onClick={() => navigate('/auth/register-clinic')}
            >
              Start Free Trial
            </Button>
            <Button
              variant="outlined"
              size="large"
              sx={{ borderColor: 'white', color: 'white' }}
              onClick={() => navigate('/auth/login')}
            >
              Sign In
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: 'background.paper', py: 4, borderTop: 1, borderColor: 'divider' }}>
        <Container maxWidth="lg">
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            flexWrap="wrap"
            spacing={2}
          >
            <Typography variant="body2" color="text.secondary">
              © 2026 MediManager. All rights reserved.
            </Typography>
            <Stack direction="row" spacing={3}>
              <Link href="#" color="text.secondary" underline="hover">
                <Support fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                Support
              </Link>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};
