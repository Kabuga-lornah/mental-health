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

  // This Navbar is now specifically for regular users.
  // The TherapistNavbar will be rendered conditionally in App.js based on user.is_therapist.
  if (user && user.is_therapist) {
    return null; // Or render a placeholder if needed, but App.js will handle redirect
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
        {/* Logo */}
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

        {/* Right Side */}
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          {user ? (
            <>
              <Button component={Link} to="/homepage" sx={{ color: "#fefae0" }}>
                Home
              </Button>

              {/* Start Journaling Button */}
              <Button component={Link} to="/journal" sx={{ color: "#fefae0" }}>
                Start Journaling
              </Button>

              {/* Avatar Menu */}
              <IconButton onClick={handleMenuOpen} size="small">
                <Avatar src={user.photo} sx={{ bgcolor: "#fefae0", color: "#780000" }}>
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
              <Button component={Link} to="/login" sx={{ backgroundColor: "#fefae0", color: "#780000", "&:hover": { backgroundColor: "white"}}}>
                Login
              </Button>
              {/* <Button
                component={Link}
                to="/login?as=therapist"
                sx={{ color: "#fefae0" }}
              >
                Therapist Login
              </Button> */}
              {/* <Button
                component={Link}
                to="/register"
                variant="contained"
                sx={{
                  backgroundColor: "#fefae0",
                  color: "#780000",
                  "&:hover": { backgroundColor: "white" },
                }}
              >
                Register
              </Button> */}
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
