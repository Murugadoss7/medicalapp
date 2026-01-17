/**
 * Admin Clinics Page - View all clinic locations across all doctors in the tenant
 */

import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Container,
  Fade,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  LocalHospital as DoctorIcon,
  Star as StarIcon,
  Business as ClinicIcon,
} from '@mui/icons-material';
import { useGetTenantOfficesQuery } from '../../store/api';
import theme from '../../theme/medicalFuturismTheme';

export const AdminClinics = () => {
  const { data: officesData, isLoading, error } = useGetTenantOfficesQuery();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Failed to load clinics. Please try again.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ ...theme.layouts.pageContainer, py: 2 }}>
      <Box sx={theme.layouts.floatingOrb} />

      <Container maxWidth="lg" disableGutters sx={{ position: 'relative', zIndex: 1, px: { xs: 1.5, sm: 2 } }}>
        {/* Header */}
        <Fade in timeout={600}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                mr: 2,
              }}
            >
              <ClinicIcon sx={{ fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight="bold">
                All Clinic Locations
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {officesData?.total || 0} clinics across all doctors
              </Typography>
            </Box>
          </Box>
        </Fade>

        {/* Clinics Grid */}
        <Grid container spacing={3}>
          {officesData?.offices.map((office, index) => (
            <Grid item xs={12} md={6} key={office.id}>
              <Fade in timeout={800 + index * 100}>
                <Paper
                  elevation={0}
                  sx={{
                    ...theme.components.glassPaper,
                    p: 0,
                    overflow: 'hidden',
                    border: office.is_tenant_default ? '2px solid' : '1px solid',
                    borderColor: office.is_tenant_default ? 'success.main' : 'rgba(102, 126, 234, 0.2)',
                  }}
                >
                  {/* Clinic Header */}
                  <Box
                    sx={{
                      p: 2,
                      background: office.is_tenant_default
                        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationIcon />
                        <Typography variant="h6" fontWeight="bold">
                          {office.name || 'Unnamed Clinic'}
                        </Typography>
                      </Box>
                      {office.is_tenant_default && (
                        <Chip
                          size="small"
                          label="Registered Clinic"
                          sx={{
                            bgcolor: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            fontWeight: 'bold',
                          }}
                        />
                      )}
                    </Box>
                    <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                      {office.address || 'No address provided'}
                    </Typography>
                  </Box>

                  {/* Doctors List */}
                  <Box sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      Doctors at this location ({office.doctors.length})
                    </Typography>
                    <List dense sx={{ py: 0 }}>
                      {office.doctors.map((doctor, docIndex) => (
                        <Box key={doctor.id}>
                          {docIndex > 0 && <Divider />}
                          <ListItem sx={{ px: 0 }}>
                            <ListItemAvatar>
                              <Avatar
                                sx={{
                                  bgcolor: 'primary.light',
                                  color: 'primary.main',
                                  width: 36,
                                  height: 36,
                                }}
                              >
                                <DoctorIcon sx={{ fontSize: 18 }} />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body2" fontWeight="medium">
                                    {doctor.name}
                                  </Typography>
                                  {doctor.is_primary && (
                                    <Chip
                                      icon={<StarIcon sx={{ fontSize: 14 }} />}
                                      label="Primary"
                                      size="small"
                                      color="warning"
                                      sx={{ height: 20, fontSize: '0.65rem' }}
                                    />
                                  )}
                                </Box>
                              }
                              secondary={doctor.specialization || 'General Practice'}
                            />
                          </ListItem>
                        </Box>
                      ))}
                    </List>
                  </Box>
                </Paper>
              </Fade>
            </Grid>
          ))}
        </Grid>

        {/* Empty State */}
        {(!officesData?.offices || officesData.offices.length === 0) && (
          <Paper
            elevation={0}
            sx={{
              ...theme.components.glassPaper,
              p: 4,
              textAlign: 'center',
            }}
          >
            <LocationIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No clinics found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Register doctors to see their clinic locations here.
            </Typography>
          </Paper>
        )}
      </Container>
    </Box>
  );
};

export default AdminClinics;
