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
import { useState, useEffect } from "react";


const loadCinzelFont = () => {
  const link = document.createElement("link");
  link.href = "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap";
  link.rel = "stylesheet";
  document.head.appendChild(link);
};

export default function TherapistNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  useEffect(() => {
    loadCinzelFont();
  }, []);

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    logout();
    navigate("/");
  };


  if (!user || !user.is_therapist) return null;

  return (
    <AppBar
      position="static"
      sx={{
        backgroundColor: "#780000",
        boxShadow: "none",
        padding: "0.5rem 0",
        fontFamily: "'Cinzel', serif",
      }}
    >
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography
          variant="h5"
          component={Link}
          to="/"
          sx={{
            fontFamily: "'Cinzel', serif",
            fontWeight: 700,
            fontSize: "2rem",
            color: "#fefae0",
            textDecoration: "none",
            letterSpacing: "1px",
            textTransform: "uppercase",
            "&:hover": { color: "white" },
          }}
        >
          {/* MindWell */}
        </Typography>

        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          {user && user.is_therapist ? (
            <>
              <Button
                component={Link}
                to="/therapist/dashboard"
                sx={{ color: "#fefae0", fontFamily: "'Cinzel', serif" }}
              >
                Dashboard
              </Button>

              <Button
                component={Link}
                to="/journal" // Assuming therapists can also journal
                sx={{ color: "#fefae0", fontFamily: "'Cinzel', serif" }}
              >
                Journal
              </Button>

              <Button
                component={Link}
                to="/meditation" // Assuming therapists can also use meditation
                sx={{ color: "#fefae0", fontFamily: "'Cinzel', serif" }}
              >
                Meditation
              </Button>

              <IconButton onClick={handleMenuOpen} size="small">
                <Avatar src={user.profile_picture} sx={{ bgcolor: "#fefae0", color: "#780000" }}>
                  {!user.profile_picture && user.first_name?.charAt(0)}
                </Avatar>
              </IconButton>

              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleMenuClose}
                PaperProps={{
                  sx: {
                    mt: 1.5,
                    minWidth: 200,
                    fontFamily: "'Cinzel', serif",
                  },
                }}
              >
                <MenuItem disabled>
                  <strong>Dr. {user.first_name} {user.last_name}</strong>
                </MenuItem>
                <MenuItem
                  component={Link}
                  to="/therapist/profile" // NEW: Point to therapist profile route
                  onClick={handleMenuClose}
                  sx={{ fontFamily: "'Cinzel', serif" }}
                >
                  View/Edit Profile
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    handleLogout();
                    handleMenuClose();
                  }}
                  sx={{ fontFamily: "'Cinzel', serif" }}
                >
                  Logout
                </MenuItem>
              </Menu>
            </>
          ) : (
         
            <Button
              component={Link}
              to="/login"
              sx={{
                backgroundColor: "#fefae0",
                color: "#780000",
                fontWeight: "bold",
                fontFamily: "'Cinzel', serif",
                "&:hover": {
                  backgroundColor: "white",
                },
              }}
            >
              Login
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}