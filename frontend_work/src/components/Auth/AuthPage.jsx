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
  Checkbox,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  ListItemText,
  Snackbar
} from "@mui/material";

const specializationsList = [
  'Anxiety and Stress Management',
  'Depression and Mood Disorders',
  'Relationship and Marital Issues',
  'Family Counseling',
  'Trauma and PTSD',
  'Grief and Loss',
  'Addiction and Substance Abuse',
  'Child and Adolescent Therapy',
  'Anger Management',
  'Self-Esteem and Personal Growth',
  'Career and Work-related Stress',
  'LGBTQ+ Counseling',
];

export default function AuthPage() {
  const location = useLocation();
  const [isRegisterMode, setIsRegisterMode] = useState(location.pathname === "/register");

  useEffect(() => {
    setIsRegisterMode(location.pathname === "/register");
  }, [location.pathname]);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone: "",
    registerAsTherapist: false,
    // Restored therapist-specific fields to formData state
    is_available: false,
    is_free_consultation: false,
    hourly_rate: '', // Kept as string for TextField
    session_modes: 'online',
    physical_address: '',
    years_of_experience: '', // Kept as string for TextField
    specializations: [],
    license_credentials: '',
    approach_modalities: '',
    languages_spoken: '',
    client_focus: '',
    insurance_accepted: false,
    video_introduction_url: '',
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
      // Reset therapist-specific fields if switching back to user (as in original Register.jsx)
      ...(e.target.value === "user" && {
        is_available: false,
        is_free_consultation: false,
        hourly_rate: '',
        session_modes: 'online',
        physical_address: '',
        years_of_experience: '',
        specializations: [],
        license_credentials: '',
        approach_modalities: '',
        languages_spoken: '',
        client_focus: '',
        insurance_accepted: false,
        video_introduction_url: '',
      })
    }));
  };

  const handleSpecializationChange = (event) => {
    const { value } = event.target;
    setFormData(prev => ({
      ...prev,
      specializations: typeof value === 'string' ? value.split(',') : value,
    }));
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const payload = {
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        isTherapist: formData.registerAsTherapist,
      };

      // Restored original logic for therapist-specific fields inclusion in payload
      if (formData.registerAsTherapist) {
        payload.is_available = formData.is_available;
        payload.is_free_consultation = formData.is_free_consultation;
        // Parse hourly_rate correctly: null if free consultation, otherwise parse float or null if empty
        payload.hourly_rate = formData.is_free_consultation ? null : (formData.hourly_rate === '' ? null : parseFloat(formData.hourly_rate));
        payload.session_modes = formData.session_modes;
        payload.physical_address = formData.physical_address;
        // Parse years_of_experience: null if empty string, otherwise parse int
        payload.years_of_experience = formData.years_of_experience === '' ? null : parseInt(formData.years_of_experience);
        payload.specializations = formData.specializations; // Array will be joined in AuthContext/Serializer if needed
        payload.license_credentials = formData.license_credentials;
        payload.approach_modalities = formData.approach_modalities;
        payload.languages_spoken = formData.languages_spoken;
        payload.client_focus = formData.client_focus;
        payload.insurance_accepted = formData.insurance_accepted;
        payload.video_introduction_url = formData.video_introduction_url;
      }

      const response = await register(payload);

      if (response.success) {
        let message = "Registration successful! Please log in.";
        // This condition implies a new therapist who needs to fill the form later
        // The previous redirection logic from login handler will take care of this.
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
          navigate(response.user.is_verified ? "/therapist/dashboard" : "/therapist-apply");
        } else {
          navigate("/homepage");
        }
      } else {
        setError(response.error || "Login failed. Please try again.");
        navigate("/homepage");
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

              {/* Restored Therapist-specific fields section */}
              {formData.registerAsTherapist && (
                <Box sx={{ width: '100%', mt: 2 }}>
                  <Typography variant="h6" sx={{ color: '#780000', mb: 2, borderBottom: '1px solid #eee', pb: 1 }}>
                    Therapist Details
                  </Typography>
                  <TextField
                    fullWidth
                    label="Years of Experience"
                    name="years_of_experience"
                    type="number"
                    value={formData.years_of_experience}
                    onChange={handleChange}
                    sx={{ mb: 2, '& .MuiInput-underline:after': { borderColor: '#780000' } }} // Apply theme color
                  />
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Specializations</InputLabel>
                    <Select
                      multiple
                      name="specializations"
                      value={formData.specializations}
                      onChange={handleSpecializationChange}
                      renderValue={(selected) => (
                        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                          {selected.map((value) => (
                            <Chip key={value} label={value} size="small" />
                          ))}
                        </Stack>
                      )}
                      variant="standard" // Apply standard variant
                      sx={{ '& .MuiInput-underline:after': { borderColor: '#780000' } }} // Apply theme color
                    >
                      {specializationsList.map((name) => (
                        <MenuItem key={name} value={name}>
                          <Checkbox checked={formData.specializations.indexOf(name) > -1} sx={{ color: '#780000' }} />
                          <ListItemText primary={name} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    fullWidth
                    label="License & Credentials"
                    name="license_credentials"
                    value={formData.license_credentials}
                    onChange={handleChange}
                    helperText="e.g., LMFT, LCSW, PhD"
                    variant="standard" // Apply standard variant
                    sx={{ mb: 2, '& .MuiInput-underline:after': { borderColor: '#780000' } }} // Apply theme color
                  />
                  <TextField
                    fullWidth
                    label="Approach/Therapeutic Modalities"
                    name="approach_modalities"
                    value={formData.approach_modalities}
                    onChange={handleChange}
                    multiline
                    rows={2}
                    helperText="e.g., CBT, EMDR, Psychodynamic"
                    variant="standard" // Apply standard variant
                    sx={{ mb: 2, '& .MuiInput-underline:after': { borderColor: '#780000' } }} // Apply theme color
                  />
                  <TextField
                    fullWidth
                    label="Languages Spoken"
                    name="languages_spoken"
                    value={formData.languages_spoken}
                    onChange={handleChange}
                    helperText="Comma-separated, e.g., English, Swahili"
                    variant="standard" // Apply standard variant
                    sx={{ mb: 2, '& .MuiInput-underline:after': { borderColor: '#780000' } }} // Apply theme color
                  />
                  <TextField
                    fullWidth
                    label="Client Focus"
                    name="client_focus"
                    value={formData.client_focus}
                    onChange={handleChange}
                    helperText="e.g., Adults, Teens, LGBTQ+, Couples"
                    variant="standard" // Apply standard variant
                    sx={{ mb: 2, '& .MuiInput-underline:after': { borderColor: '#780000' } }} // Apply theme color
                  />
                  <TextField
                    fullWidth
                    label="Video Introduction URL"
                    name="video_introduction_url"
                    value={formData.video_introduction_url}
                    onChange={handleChange}
                    helperText="Link to a brief video introduction (e.g., YouTube)"
                    variant="standard" // Apply standard variant
                    sx={{ mb: 2, '& .MuiInput-underline:after': { borderColor: '#780000' } }} // Apply theme color
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.insurance_accepted}
                        onChange={handleChange}
                        name="insurance_accepted"
                        sx={{ color: '#780000' }} // Apply theme color
                      />
                    }
                    label="Accept insurance?"
                    sx={{ mb: 1 }}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.is_free_consultation}
                        onChange={handleChange}
                        name="is_free_consultation"
                        sx={{ color: '#780000' }} // Apply theme color
                      />
                    }
                    label="Offer a free initial consultation?"
                    sx={{ mb: 1 }}
                  />
                  {!formData.is_free_consultation && (
                    <TextField
                      fullWidth
                      label="Hourly Rate (Ksh)"
                      name="hourly_rate"
                      type="number"
                      value={formData.hourly_rate}
                      onChange={handleChange}
                      inputProps={{ min: 0 }}
                      variant="standard" // Apply standard variant
                      sx={{ mb: 2, '& .MuiInput-underline:after': { borderColor: '#780000' } }} // Apply theme color
                    />
                  )}
                  <FormControl component="fieldset" fullWidth sx={{ mb: 2 }}>
                    <FormLabel component="legend">Session Modes</FormLabel>
                    <RadioGroup row name="session_modes" value={formData.session_modes} onChange={handleChange}>
                      <FormControlLabel value="online" control={<Radio sx={{ color: '#780000' }} />} label="Online" />
                      <FormControlLabel value="physical" control={<Radio sx={{ color: '#780000' }} />} label="Physical (In-Person)" />
                      <FormControlLabel value="both" control={<Radio sx={{ color: '#780000' }} />} label="Both" />
                    </RadioGroup>
                  </FormControl>
                  {(formData.session_modes === 'physical' || formData.session_modes === 'both') && (
                    <TextField
                      fullWidth
                      label="Physical Address"
                      name="physical_address"
                      value={formData.physical_address}
                      onChange={handleChange}
                      multiline
                      rows={2}
                      variant="standard" // Apply standard variant
                      sx={{ mb: 2, '& .MuiInput-underline:after': { borderColor: '#780000' } }} // Apply theme color
                    />
                  )}
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.is_available}
                        onChange={handleChange}
                        name="is_available"
                        sx={{ color: '#780000' }} // Apply theme color
                      />
                    }
                    label="Available for new sessions?"
                    sx={{ mb: 2 }}
                  />
                </Box>
              )}
              {/* End of Restored Therapist-specific fields section */}

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
                    first_name: "",
                    last_name: "",
                    phone: "",
                    registerAsTherapist: false,
                    // Reset therapist fields if toggling to user mode
                    is_available: false,
                    is_free_consultation: false,
                    hourly_rate: '',
                    session_modes: 'online',
                    physical_address: '',
                    years_of_experience: '',
                    specializations: [],
                    license_credentials: '',
                    approach_modalities: '',
                    languages_spoken: '',
                    client_focus: '',
                    insurance_accepted: false,
                    video_introduction_url: '',
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