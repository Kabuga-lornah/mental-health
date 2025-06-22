import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Avatar,
  Menu,
  MenuItem,
  IconButton
} from "@mui/material";
import { useState } from "react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // If the user is a therapist, this Navbar component should not render.
  // The AppNavbar component in App.jsx will handle rendering TherapistNavbar instead.
  if (user && user.is_therapist) {
    return null; 
  }

  return (
    <AppBar
      position="static"
      sx={{
        backgroundColor: "#780000",
        boxShadow: "none",
        padding: "0.5rem 0",
      }}
    >
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography
          variant="h5"
          component={Link}
          to="/"
          sx={{
            color: "#fefae0",
            textDecoration: "none",
            fontWeight: "bold",
            "&:hover": { color: "white" },
          }}
        >
          MindWell
        </Typography>

        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          {user ? (
            <>
              {/* Main navigation links for logged-in users */}
              <Button component={Link} to="/dashboard" sx={{ color: "#fefae0" }}>
                Dashboard
              </Button>
              
              <Button component={Link} to="/find-therapist" sx={{ color: "#fefae0" }}>
                Find a Therapist
              </Button>

              <Button component={Link} to="/journal" sx={{ color: "#fefae0" }}>
                Start Journaling
              </Button>

              {/* NEW: Button for Meditation & Mindfulness */}
              <Button component={Link} to="/meditation" sx={{ color: "#fefae0" }}>
                Meditation
              </Button>

              {/* User Profile Menu */}
              <IconButton onClick={handleMenuOpen} size="small">
                <Avatar src={user.photo} sx={{ bgcolor: "#fefae0", color: "#780000" }}>
                  {/* Display first initial if no photo */}
                  {!user.photo && user.first_name?.charAt(0)}
                </Avatar>
              </IconButton>

              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleMenuClose}
                PaperProps={{
                  sx: { mt: 1.5, minWidth: 200 },
                }}
              >
                <MenuItem disabled>
                  <strong>{user.first_name} {user.last_name}</strong>
                </MenuItem>
                <MenuItem component={Link} to="/profile" onClick={handleMenuClose}>
                  View Profile
                </MenuItem>
                <MenuItem component={Link} to="/profile/photo" onClick={handleMenuClose}>
                  Upload/Remove Photo
                </MenuItem>
                <MenuItem onClick={() => { handleLogout(); handleMenuClose(); }}>
                  Logout
                </MenuItem>
              </Menu>
            </>
          ) : (
            <>
              {/* Buttons for logged-out users */}
              <Button component={Link} to="/login" sx={{ backgroundColor: "#fefae0", color: "#780000", "&:hover": { backgroundColor: "white"}}}>
                Login
              </Button>
              {/* <Button component={Link} to="/register" sx={{ backgroundColor: "#fefae0", color: "#780000", "&:hover": { backgroundColor: "white"}}}>
                Register
              </Button> */}
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}