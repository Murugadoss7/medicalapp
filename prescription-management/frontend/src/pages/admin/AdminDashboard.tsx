import { useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PatientsIcon,
  LocalHospital as DoctorsIcon,
  CalendarToday as AppointmentsIcon,
  LocalPharmacy as MedicinesIcon,
  Assessment as ReportsIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  TrendingUp as TrendingUpIcon,
  PersonAdd as PersonAddIcon,
  MedicalServices as MedicalIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useGetCurrentUserQuery } from '../../store/api';
import { StatCard } from '../../components/dashboard/StatCard';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { data: currentUser } = useGetCurrentUserQuery();

  useEffect(() => {
    // Redirect non-admin users
    if (currentUser && currentUser.role !== 'admin') {
      switch (currentUser.role) {
        case 'doctor':
          navigate('/doctor/dashboard');
          break;
        case 'patient':
          navigate('/patient/dashboard');
          break;
        default:
          navigate('/dashboard');
      }
    }
  }, [currentUser, navigate]);

  // Mock statistics for admin dashboard
  const adminStats = {
    totalDoctors: 15,
    totalPatients: 1250,
    totalAppointments: 89,
    totalPrescriptions: 156,
    activeUsers: 1265,
    pendingRegistrations: 8,
  };

  const quickActions = [
    {
      title: 'Book Appointment',
      description: 'Schedule new patient appointment',
      icon: <AppointmentsIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      action: () => navigate('/appointments/book'),
      color: 'primary',
    },
    {
      title: 'Register New Doctor',
      description: 'Add a new doctor to the system',
      icon: <PersonAddIcon sx={{ fontSize: 40, color: 'secondary.main' }} />,
      action: () => navigate('/doctors/register'),
      color: 'secondary',
    },
    {
      title: 'Manage Doctors',
      description: 'View and manage doctor profiles',
      icon: <DoctorsIcon sx={{ fontSize: 40, color: 'success.main' }} />,
      action: () => navigate('/doctors'),
      color: 'success',
    },
    {
      title: 'Patient Management',
      description: 'Search and manage patient records',
      icon: <PatientsIcon sx={{ fontSize: 40, color: 'info.main' }} />,
      action: () => navigate('/patients'),
      color: 'info',
    },
    {
      title: 'Medicine Catalog',
      description: 'Manage medicine inventory',
      icon: <MedicinesIcon sx={{ fontSize: 40, color: 'warning.main' }} />,
      action: () => navigate('/medicines'),
      color: 'warning',
    },
  ];

  const systemOverview = [
    { label: 'System Status', value: 'Operational', status: 'success' },
    { label: 'Database Health', value: 'Good', status: 'success' },
    { label: 'Active Sessions', value: '47', status: 'info' },
    { label: 'Last Backup', value: '2 hours ago', status: 'default' },
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome back, {currentUser?.first_name}! Here's an overview of your system.
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Total Doctors"
            value={adminStats.totalDoctors}
            icon={<DoctorsIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Total Patients"
            value={adminStats.totalPatients}
            icon={<PatientsIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Today's Appointments"
            value={adminStats.totalAppointments}
            icon={<AppointmentsIcon />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Prescriptions"
            value={adminStats.totalPrescriptions}
            icon={<MedicalIcon />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Active Users"
            value={adminStats.activeUsers}
            icon={<TrendingUpIcon />}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Pending Approvals"
            value={adminStats.pendingRegistrations}
            icon={<SecurityIcon />}
            color="error"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Quick Actions */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <DashboardIcon sx={{ mr: 1 }} />
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              {quickActions.map((action, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Card 
                    sx={{ 
                      height: '100%', 
                      cursor: 'pointer',
                      '&:hover': { 
                        boxShadow: 3,
                        transform: 'translateY(-2px)',
                        transition: 'all 0.2s ease-in-out'
                      } 
                    }}
                    onClick={action.action}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        {action.icon}
                        <Box sx={{ ml: 2 }}>
                          <Typography variant="h6" component="div">
                            {action.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {action.description}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                    <CardActions>
                      <Button size="small" color={action.color as any}>
                        Open
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* System Overview */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <ReportsIcon sx={{ mr: 1 }} />
              System Overview
            </Typography>
            <List dense>
              {systemOverview.map((item, index) => (
                <div key={index}>
                  <ListItem>
                    <ListItemIcon>
                      <SettingsIcon color="action" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.label}
                      secondary={
                        <Chip 
                          label={item.value} 
                          size="small" 
                          color={item.status as any}
                          variant="outlined"
                        />
                      }
                    />
                  </ListItem>
                  {index < systemOverview.length - 1 && <Divider variant="inset" component="li" />}
                </div>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};