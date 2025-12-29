import { Outlet } from 'react-router-dom';
import {
  Box,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  CalendarToday,
  People,
  LocalPharmacy,
  VpnKey,
  AccountCircle,
  Logout,
  Settings,
  LocalHospital,
  EventNote,
  Timeline,
} from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../hooks';
import { logout } from '../../store/slices/authSlice';
import { toggleSidebar, toggleAppointmentsSidebar } from '../../store/slices/uiSlice';
import { TodayAppointmentsSidebar } from '../dashboard/TodayAppointmentsSidebar';

const drawerWidth = 240;

export const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));
  const { user } = useAppSelector((state) => state.auth);
  const { sidebarOpen, appointmentsSidebarOpen } = useAppSelector((state) => state.ui);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isDoctor = user?.role === 'doctor';

  // Dashboard always shows persistent sidebar, other pages only on large screens
  const isDashboard = location.pathname === '/doctor/dashboard';
  const shouldShowPersistentSidebar = isDoctor && appointmentsSidebarOpen && (isLargeScreen || isDashboard);
  const rightSidebarWidth = shouldShowPersistentSidebar ? 320 : 0;

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/auth/login');
    handleUserMenuClose();
  };

  const handleSidebarToggle = () => {
    dispatch(toggleSidebar());
  };

  const handleAppointmentsSidebarToggle = () => {
    dispatch(toggleAppointmentsSidebar());
  };

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <Dashboard />,
      path: '/doctor/dashboard',
      roles: ['doctor', 'admin'],
    },
    {
      text: 'Appointments',
      icon: <CalendarToday />,
      path: '/appointments',
      roles: ['doctor', 'admin', 'receptionist'],
    },
    {
      text: 'Patients',
      icon: <People />,
      path: '/patients',
      roles: ['doctor', 'admin', 'receptionist'],
    },
    {
      text: 'Doctor Management',
      icon: <LocalHospital />,
      path: '/doctors',
      roles: ['doctor', 'admin'],
    },
    {
      text: 'Medicines',
      icon: <LocalPharmacy />,
      path: '/medicines',
      roles: ['doctor', 'admin'],
    },
    {
      text: 'Short Keys',
      icon: <VpnKey />,
      path: '/short-keys',
      roles: ['doctor'],
    },
    {
      text: 'Treatments',
      icon: <Timeline />,
      path: '/treatments',
      roles: ['doctor', 'admin'],
    },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    !item.roles || (user && item.roles.includes(user.role))
  );

  return (
    <Box sx={{
      display: 'flex',
      height: '100vh',
      height: '100dvh', // Dynamic viewport height for mobile
      height: '-webkit-fill-available', // Safari fallback
      overflow: 'hidden'
    }}>
      <CssBaseline />
      
      {/* App Bar - Medical Futurism Purple Gradient */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: sidebarOpen ? `calc(100% - ${drawerWidth}px)` : '100%' },
          ml: { sm: sidebarOpen ? `${drawerWidth}px` : 0 },
          transition: 'width 0.3s, margin-left 0.3s',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="toggle drawer"
            edge="start"
            onClick={handleSidebarToggle}
            sx={{ mr: { xs: 1, sm: 2 } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              flexGrow: 1,
              fontSize: { xs: '0.9rem', sm: '1.25rem' },
              display: { xs: 'none', sm: 'block' },
            }}
          >
            Prescription Management System
          </Typography>

          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              flexGrow: 1,
              fontSize: '1rem',
              display: { xs: 'block', sm: 'none' },
            }}
          >
            RX Manager
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
            {/* Today's Appointments Toggle - Doctors Only */}
            {isDoctor && (
              <IconButton
                color="inherit"
                onClick={handleAppointmentsSidebarToggle}
                sx={{
                  bgcolor: appointmentsSidebarOpen ? 'rgba(255,255,255,0.2)' : 'transparent',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.15)',
                  },
                }}
              >
                <EventNote />
              </IconButton>
            )}
            <Typography
              variant="body2"
              sx={{ display: { xs: 'none', md: 'block' } }}
            >
              Welcome, {user?.first_name || 'User'}
            </Typography>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleUserMenuOpen}
              color="inherit"
            >
              <Avatar sx={{ width: { xs: 28, sm: 32 }, height: { xs: 28, sm: 32 } }}>
                {user?.first_name?.charAt(0) || 'U'}
              </Avatar>
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleUserMenuClose}
            >
              <MenuItem onClick={handleUserMenuClose}>
                <ListItemIcon>
                  <AccountCircle fontSize="small" />
                </ListItemIcon>
                Profile
              </MenuItem>
              <MenuItem onClick={handleUserMenuClose}>
                <ListItemIcon>
                  <Settings fontSize="small" />
                </ListItemIcon>
                Settings
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <Logout fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer (Temporary) */}
      <Drawer
        variant="temporary"
        anchor="left"
        open={sidebarOpen}
        onClose={handleSidebarToggle}
        disableRestoreFocus={true}
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar sx={{
          borderBottom: '1px solid rgba(102, 126, 234, 0.15)',
          mb: 1
        }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '0.5px',
            }}
          >
            Medical Portal
          </Typography>
        </Toolbar>
        <Divider />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {filteredMenuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  onClick={(event) => {
                    // Blur button before navigation to prevent aria-hidden focus trap
                    const target = event.currentTarget;
                    if (target instanceof HTMLElement) {
                      target.blur();
                    }
                    navigate(item.path);
                    handleSidebarToggle();
                  }}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Desktop Drawer (Persistent) */}
      <Drawer
        variant="persistent"
        anchor="left"
        open={sidebarOpen}
        sx={{
          display: { xs: 'none', md: 'block' },
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar sx={{
          borderBottom: '1px solid rgba(102, 126, 234, 0.15)',
          mb: 1
        }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '0.5px',
            }}
          >
            Medical Portal
          </Typography>
        </Toolbar>
        <Divider />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {filteredMenuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  onClick={(event) => {
                    // Blur button before navigation to prevent aria-hidden focus trap
                    const target = event.currentTarget;
                    if (target instanceof HTMLElement) {
                      target.blur();
                    }
                    navigate(item.path);
                  }}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          ml: { md: sidebarOpen ? 0 : `-${drawerWidth}px` },
          mr: rightSidebarWidth > 0 ? `${rightSidebarWidth}px` : 0,
          transition: 'margin-left 0.3s, margin-right 0.3s',
          height: '100%', // Use 100% instead of 100vh to inherit from parent
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0, // Prevent flex item from overflowing
        }}
      >
        <Toolbar />
        <Box
          sx={{
            flexGrow: 1,
            p: { xs: 1.5, sm: 2, md: 2.5 },
            overflow: 'auto', // Enable scrolling
            // On iPad/tablet (md), allow horizontal scroll when both sidebars are open
            overflowX: { xs: 'auto', md: 'auto', lg: 'hidden' },
            display: 'flex',
            flexDirection: 'column',
            // Minimum width to prevent content from being too squeezed on tablet
            '& > *': {
              minWidth: { xs: 'auto', md: 500, lg: 'auto' },
            },
          }}
        >
          <Outlet />
        </Box>
      </Box>

      {/* Today's Appointments Sidebar - Doctors Only */}
      {isDoctor && <TodayAppointmentsSidebar />}
    </Box>
  );
};