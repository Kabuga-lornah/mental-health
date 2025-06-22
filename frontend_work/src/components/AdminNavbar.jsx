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
  AppBar, // We'll still use a small AppBar for a "menu" icon to open/close the drawer
  IconButton,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  CalendarMonth as CalendarMonthIcon, // For Sessions
  Analytics as AnalyticsIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon, // Icon for opening the drawer
  Book as BookIcon, // For Journal Entries
} from '@mui/icons-material';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const drawerWidth = 240; // Define the width of your vertical navbar

export default function AdminNavbar({ children }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = React.useState(false); // For responsive drawer
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
          { text: 'Journal Entries', icon: <BookIcon />, path: '/admin/journals' }, // New path
          { text: 'Analytics', icon: <AnalyticsIcon />, path: '/admin/analytics' }, // New path
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
      <Box sx={{ flexGrow: 1 }} /> {/* Pushes logout to bottom */}
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
          backgroundColor: '#780000', // Keep a top bar for the menu icon on small screens
          display: { sm: 'none' } // Hide on larger screens when drawer is always open
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
        {/* The implementation can be swapped with js to avoid SEO duplication of the drawer. */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onTransitionEnd={handleDrawerTransitionEnd}
          onClose={handleDrawerClose}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
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
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: { xs: '64px', sm: '0px' } // Adjust content margin for top app bar on mobile
        }}
      >
        {/* Children (e.g., Admin.jsx content) will be rendered here */}
        {children}
      </Box>
    </Box>
  );
}