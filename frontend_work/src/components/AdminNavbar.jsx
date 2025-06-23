// frontend_work/src/components/AdminNavbar.jsx
import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  CssBaseline,
  Typography,
  Toolbar,
  AppBar,
  IconButton,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  CalendarMonth as CalendarMonthIcon,
  Analytics as AnalyticsIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  Book as BookIcon,
} from '@mui/icons-material';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const drawerWidth = 240;

export default function AdminNavbar({ children }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [isClosing, setIsClosing] = React.useState(false);

  const handleDrawerClose = () => {
    setIsClosing(true);
    setMobileOpen(false);
  };

  const handleDrawerTransitionEnd = () => {
    setIsClosing(false);
  };

  const handleDrawerToggle = () => {
    if (!isClosing) {
      setMobileOpen(!mobileOpen);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const drawer = (
    <div>
      <Toolbar sx={{ backgroundColor: '#780000' }}>
        <Typography variant="h6" noWrap component="div" sx={{ color: 'white', flexGrow: 1 }}>
          Admin Panel
        </Typography>
      </Toolbar>
      <List>
        {[
          { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin' },
          { text: 'Therapist Applications', icon: <AssignmentIcon />, path: '/admin/applications' },
          { text: 'User Management', icon: <PeopleIcon />, path: '/admin/users' },
          { text: 'Sessions', icon: <CalendarMonthIcon />, path: '/admin/sessions' },
          { text: 'Journal Entries', icon: <BookIcon />, path: '/admin/journals' },
          { text: 'Analytics', icon: <AnalyticsIcon />, path: '/admin/analytics' },
        ].map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component={NavLink}
              to={item.path}
              sx={{
                '&.active': {
                  backgroundColor: '#fefae0',
                  color: '#780000',
                  fontWeight: 'bold',
                  '& .MuiListItemIcon-root': {
                    color: '#780000',
                  },
                },
                color: '#780000',
              }}
            >
              <ListItemIcon sx={{ color: '#780000' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Box sx={{ flexGrow: 1 }} />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          backgroundColor: '#780000',
          display: { sm: 'none' }
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Admin Panel
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onTransitionEnd={handleDrawerTransitionEnd}
          onClose={handleDrawerClose}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, backgroundColor: '#fefae0' },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, backgroundColor: '#fefae0' },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          // Updated width and added marginLeft for larger screens
          width: { xs: '100%', sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` }, // This pushes the content to the right
          mt: { xs: '64px', sm: '0px' }
        }}
      >
        {children}
      </Box>
    </Box>
  );
}