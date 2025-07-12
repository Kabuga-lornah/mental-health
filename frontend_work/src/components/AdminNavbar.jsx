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
  // Removed AppBar and IconButton as the top navbar is being removed
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  CalendarMonth as CalendarMonthIcon,
  Analytics as AnalyticsIcon,
  Logout as LogoutIcon,
  // Removed MenuIcon as it's part of the top navbar
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

  // Removed handleDrawerToggle as it was for the mobile top navbar menu icon

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
          // Removed DashboardIcon if it's not used
          { text: 'Therapist Applications', icon: <AssignmentIcon />, path: '/admin/applications' },
          { text: 'User Management', icon: <PeopleIcon />, path: '/admin/users' },
          { text: 'Sessions', icon: <CalendarMonthIcon />, path: '/admin/sessions' },
          // Removed Journal Entries from the sidebar navigation as it's hidden
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
      {/* Removed AppBar for the top navigation */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        {/* The temporary drawer for mobile can also be removed if not needed,
            as the main navigation is now purely through the permanent drawer.
            However, keeping it for potential future mobile responsiveness. */}
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
          width: { xs: '100%', sm: `calc(100% - ${drawerWidth}px)` },
          // Removed ml: { sm: `${drawerWidth}px` } because the main content should start from the left
          // if there's no top app bar pushing it right.
          // Also removed mt for xs as there's no top app bar anymore.
          mt: 0 // Ensure no top margin from a removed AppBar
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
