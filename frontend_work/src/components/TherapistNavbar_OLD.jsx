// Overwriting file: TherapistNavbar_OLD.jsx
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSessionFilter } from "../context/SessionFilterContext"; // Import useSessionFilter
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
  TextField, // Added TextField
  InputAdornment // Added InputAdornment
} from "@mui/material";
import { useState, useEffect } from "react";
import { DatePicker } from "@mui/x-date-pickers/DatePicker"; // Added DatePicker
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"; // Added LocalizationProvider
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"; // Added AdapterDateFns
import { Search as SearchIcon, Clear as ClearIcon } from "@mui/icons-material"; // Added Icons

const loadCinzelFont = () => {
  const link = document.createElement("link");
  link.href = "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap";
  link.rel = "stylesheet";
  document.head.appendChild(link);
};

export default function TherapistNavbar() {
  const { user, logout } = useAuth();
  const { clientSearchTerm, setClientSearchTerm, sessionDateFilter, setSessionDateFilter } = useSessionFilter(); // Use session filter context
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

  const handleClearFilters = () => {
    setClientSearchTerm('');
    setSessionDateFilter(null);
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
      <Toolbar sx={{ display: "flex", justifyContent: "space-between", flexWrap: 'wrap' }}>
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
            minWidth: 'fit-content' // Prevent text from shrinking too much
          }}
        >
          {/* MindWell */}
        </Typography>

        {/* Search and Filter Bar in Navbar */}
        <Box sx={{ flexGrow: 1, display: 'flex', gap: 1, alignItems: 'center', mx: 2, my: { xs: 1, sm: 0 }, maxWidth: 600 }}>
          <TextField
            label="Search Client"
            variant="outlined"
            size="small"
            value={clientSearchTerm}
            onChange={(e) => setClientSearchTerm(e.target.value)}
            sx={{
              flexGrow: 1,
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: 1,
              '& .MuiInputBase-root': { color: '#fefae0' },
              '& .MuiInputLabel-root': { color: '#fefae0' },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.4)' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#fefae0' },
              '& .Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#fefae0' },
              input: { color: '#fefae0' }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#fefae0' }} />
                </InputAdornment>
              ),
              endAdornment: (
                clientSearchTerm && (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setClientSearchTerm('')} size="small">
                      <ClearIcon sx={{ color: '#fefae0' }} />
                    </IconButton>
                  </InputAdornment>
                )
              ),
            }}
          />
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Filter Date"
              value={sessionDateFilter}
              onChange={(newValue) => setSessionDateFilter(newValue)}
              slotProps={{
                textField: {
                  variant: 'outlined',
                  size: 'small',
                  sx: {
                    minWidth: 120,
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    borderRadius: 1,
                    '& .MuiInputBase-root': { color: '#fefae0' },
                    '& .MuiInputLabel-root': { color: '#fefae0' },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.4)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#fefae0' },
                    '& .Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#fefae0' },
                    input: { color: '#fefae0' }
                  },
                  clearButton: {
                    size: 'small',
                    sx: { color: '#fefae0' }
                  }
                },
              }}
            />
          </LocalizationProvider>
          {(clientSearchTerm || sessionDateFilter) && (
            <Button
              variant="outlined"
              size="small"
              onClick={handleClearFilters}
              sx={{ borderColor: '#fefae0', color: '#fefae0', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
            >
              Clear
            </Button>
          )}
        </Box>

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
                to="/journal"
                sx={{ color: "#fefae0", fontFamily: "'Cinzel', serif" }}
              >
                Journal
              </Button>

              <Button
                component={Link}
                to="/meditation"
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
                  to="/therapist/profile"
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