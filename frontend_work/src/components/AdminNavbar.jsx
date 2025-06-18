import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login'); 
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: '#780000' }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          <Link to="/admin/applications" style={{ textDecoration: 'none', color: 'inherit' }}>
            MindWell Admin Portal
          </Link>
        </Typography>
        <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
          {user ? (
            <>
              <Button color="inherit" component={Link} to="/admin/applications">Applications</Button>
              {/* Add other admin-specific links here, e.g., /admin/users, /admin/settings */}
              <Button color="inherit" onClick={handleLogout}>Logout</Button>
            </>
          ) : (
            <>
              <Button color="inherit" component={Link} to="/login">Login</Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
