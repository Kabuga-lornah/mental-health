// frontend_work/src/components/Auth/AuthPage.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
  Box,
  Button,
  TextField,
  Typography,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  Snackbar
} from "@mui/material";

// specializationsList is no longer needed in AuthPage.jsx once therapist fields are removed from here
// const specializationsList = [
//   'Anxiety and Stress Management',
//   'Depression and Mood Disorders',
//   'Relationship and Marital Issues',
//   'Family Counseling',
//   'Trauma and PTSD',
//   'Grief and Loss',
//   'Addiction and Substance Abuse',
//   'Child and Adolescent Therapy',
//   'Anger Management',
//   'Self-Esteem and Personal Growth',
//   'Career and Work-related Stress',
//   'LGBTQ+ Counseling',
// ];

export default function AuthPage() {
  const location = useLocation();
  const [isRegisterMode, setIsRegisterMode] = useState(location.pathname === "/register");

  useEffect(() => {
    setIsRegisterMode(location.pathname === "/register");
  }, [location.pathname]);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    password2: "", // ADDED: Field for password confirmation
    first_name: "",
    last_name: "",
    phone: "",
    registerAsTherapist: false,
    // REMOVED: All therapist-specific fields from formData state
    // They will be handled on the TherapistApplicationForm page.
  });
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [error, setError] = useState("");
  const { register, login } = useAuth();
  const navigate = useNavigate();

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleRadioChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      registerAsTherapist: e.target.value === "therapist",
      // No need to reset therapist-specific fields here as they are no longer in formData.
    }));
  };

  // REMOVED: handleSpecializationChange as specializations are not collected on registration
  // const handleSpecializationChange = (event) => {
  //   const { value } = event.target;
  //   setFormData(prev => ({
  //     ...prev,
  //     specializations: typeof value === 'string' ? value.split(',') : value,
  //   }));
  // };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Frontend validation for password match
    if (formData.password !== formData.password2) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const payload = {
        email: formData.email,
        password: formData.password,
        password2: formData.password2, // ADDED: Include password2 in the payload
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        isTherapist: formData.registerAsTherapist,
      };

      // REMOVED: All therapist-specific fields from payload construction
      // They are not sent during initial user registration.

      const response = await register(payload);

      if (response.success) {
        let message = "Registration successful! Please log in.";
        if (formData.registerAsTherapist) {
            message = "Therapist account created! Please log in to complete your application.";
        }
        setSnackbarMessage(message);
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        setIsRegisterMode(false); // Switch to login form
        setLoginEmail(formData.email);
        setLoginPassword('');
        navigate("/login", { replace: true });
      } else {
        setError(response.error || "Registration failed. Please try again.");
      }
    } catch (err) {
      setError(err.error || err.message || "An unexpected error occurred during registration.");
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await login(loginEmail, loginPassword);

      if (response && response.user) {
        if (response.user.is_staff && response.user.is_superuser) {
          navigate("/admin/applications");
        } else if (response.user.is_therapist) {
          // Redirect to therapist application form if therapist and not verified
          navigate(response.user.is_verified ? "/therapist/dashboard" : "/therapist-apply");
        } else {
          navigate("/homepage");
        }
      } else {
        setError(response.error || "Login failed. Please try again.");
      }
    } catch (err) {
      setError(err.error || err.message || "An unexpected error occurred during login.");
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#fefae0",
        p: 2,
        fontFamily: "'Raleway', serif",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          width: "100%",
          maxWidth: 900,
          overflow: "hidden",
          backgroundColor: "#fefae0",
          borderRadius: '30px',
        }}
      >
        {/* Left Panel: Image Section */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            p: { xs: 0, md: 0 },
            minHeight: { xs: 200, md: 'auto' },
            backgroundColor: "#fefae0",
            borderRadius: '30px',
            overflow: 'hidden',
          }}
        >
          <img
            src="/reg.jpeg"
            alt="Authentication"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              borderRadius: '30px',
            }}
          />
        </Box>

        {/* Right Panel: Auth Form (Register or Login) */}
        <Box
          sx={{
            flex: 1,
            p: { xs: 4, md: 6 },
            backgroundColor: "white",
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: '10px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          }}
        >
          <Typography
            variant="h4"
            component="h2"
            sx={{
              fontWeight: 'bold',
              mb: 3,
              textAlign: 'center',
              color: '#333',
            }}
          >
            {isRegisterMode ? "Sign Up" : "Sign In"}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3, width: '100%', whiteSpace: 'pre-line' }}>
              {error}
            </Alert>
          )}

          {isRegisterMode ? (
            // Register Form
            <Box component="form" onSubmit={handleRegisterSubmit} noValidate style={{ width: "100%" }}>
              <TextField
                label="First Name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                fullWidth
                required
                variant="standard"
                sx={{ mb: 2, '& .MuiInput-underline:after': { borderColor: '#780000' } }}
              />
              <TextField
                label="Last Name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                fullWidth
                required
                variant="standard"
                sx={{ mb: 2, '& .MuiInput-underline:after': { borderColor: '#780000' } }}
              />
              <TextField
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                fullWidth
                required
                variant="standard"
                sx={{ mb: 2, '& .MuiInput-underline:after': { borderColor: '#780000' } }}
              />
              <TextField
                label="Phone Number (Optional)"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                fullWidth
                variant="standard"
                sx={{ mb: 2, '& .MuiInput-underline:after': { borderColor: '#780000' } }}
              />
              <TextField
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                fullWidth
                required
                variant="standard"
                sx={{ mb: 2, '& .MuiInput-underline:after': { borderColor: '#780000' } }}
              />
              <TextField
                label="Confirm Password" // ADDED: Confirm Password field
                name="password2"
                type="password"
                value={formData.password2}
                onChange={handleChange}
                fullWidth
                required
                variant="standard"
                sx={{ mb: 3, '& .MuiInput-underline:after': { borderColor: '#780000' } }}
              />

              <FormControl component="fieldset" sx={{ mb: 3, mt: 1, width: '100%' }}>
                <FormLabel component="legend" sx={{ color: '#555', fontWeight: 'bold' }}>
                  Register as:
                </FormLabel>
                <RadioGroup
                  row
                  name="registerAsTherapist"
                  value={formData.registerAsTherapist ? "therapist" : "user"}
                  onChange={handleRadioChange}
                >
                  <FormControlLabel
                    value="user"
                    control={<Radio sx={{ color: '#780000' }} />}
                    label="User"
                  />
                  <FormControlLabel
                    value="therapist"
                    control={<Radio sx={{ color: '#780000' }} />}
                    label="Apply as Therapist"
                  />
                </RadioGroup>
              </FormControl>

              {/* REMOVED: The therapist-specific fields section. */}
              {/* This content will now be handled on TherapistApplicationForm.jsx */}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                sx={{
                  backgroundColor: '#780000',
                  color: '#fefae0',
                  fontWeight: 'bold',
                  py: 1.5,
                  borderRadius: 1,
                  mt: 1,
                  '&:hover': {
                    backgroundColor: '#400000',
                  },
                  boxShadow: 'none',
                }}
              >
                SIGN UP
              </Button>
            </Box>
          ) : (
            // Login Form
            <Box component="form" onSubmit={handleLoginSubmit} noValidate style={{ width: "100%" }}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                variant="standard"
                sx={{ mb: 3, '& .MuiInput-underline:after': { borderColor: '#780000' } }}
              />

              <TextField
                fullWidth
                label="Password"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                variant="standard"
                sx={{ mb: 4, '& .MuiInput-underline:after': { borderColor: '#780000' } }}
              />

              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                sx={{
                  backgroundColor: '#780000',
                  color: '#fefae0',
                  py: 1.5,
                  borderRadius: 1,
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  '&:hover': {
                    backgroundColor: '#400000',
                  },
                  boxShadow: 'none',
                }}
              >
                SIGN IN
              </Button>
            </Box>
          )}

          <Typography
            variant="body2"
            sx={{ mt: 3, textAlign: "center", color: '#555' }}
          >
            {isRegisterMode ? "Already have an account?" : "Don't have an account?"}{" "}
            <Link
              to="#"
              onClick={() => {
                setIsRegisterMode((prev) => !prev);
                setError("");
                setLoginEmail('');
                setLoginPassword('');
                setFormData({
                    email: "",
                    password: "",
                    password2: "", // Clear password2 as well when toggling modes
                    first_name: "",
                    last_name: "",
                    phone: "",
                    registerAsTherapist: false,
                    // No need to clear therapist-specific fields here as they are no longer in formData.
                });
                navigate(isRegisterMode ? "/login" : "/register", { replace: true });
              }}
              style={{ color: '#780000', textDecoration: "underline", fontWeight: "bold", cursor: "pointer" }}
            >
              {isRegisterMode ? "Login Here" : "Sign Up Here"}
            </Link>
          </Typography>
        </Box>
      </Box>

        <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
            <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%', whiteSpace: 'pre-line' }}>
                {snackbarMessage}
            </Alert>
        </Snackbar>
    </Box>
  );
}