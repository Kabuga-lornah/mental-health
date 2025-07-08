// frontend_work/src/components/Auth/Register.jsx
import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
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
  Stack
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

export default function Register() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone: "",
    registerAsTherapist: false,
    // Therapist-specific fields (default values for registration)
    is_available: false,
    is_free_consultation: false,
    hourly_rate: '',
    session_modes: 'online', // Default to online
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
  const [error, setError] = useState("");
  const { register } = useAuth();
  const navigate = useNavigate();

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
      // Reset therapist-specific fields if switching back to user
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const payload = {
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        isTherapist: formData.registerAsTherapist, // This maps to is_therapist on backend
      };

      if (formData.registerAsTherapist) {
        payload.is_available = formData.is_available;
        payload.is_free_consultation = formData.is_free_consultation;
        payload.hourly_rate = formData.is_free_consultation ? null : (formData.hourly_rate === '' ? null : parseFloat(formData.hourly_rate));
        payload.session_modes = formData.session_modes;
        payload.physical_address = formData.physical_address;
        payload.years_of_experience = formData.years_of_experience === '' ? null : parseInt(formData.years_of_experience);
        payload.specializations = formData.specializations; // Array will be joined in AuthContext
        payload.license_credentials = formData.license_credentials;
        payload.approach_modalities = formData.approach_modalities;
        payload.languages_spoken = formData.languages_spoken;
        payload.client_focus = formData.client_focus;
        payload.insurance_accepted = formData.insurance_accepted;
        payload.video_introduction_url = formData.video_introduction_url;
      }

      const response = await register(payload);

      if (response.success) {
        navigate("/login");
      } else {
        setError(response.error || "Registration failed. Please try again.");
      }
    } catch (err) {
      setError(err.error || err.message || "An unexpected error occurred during registration.");
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
          }}
        >
          <img
            src="/reg.jpeg"
            alt="Join Us"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        </Box>

        {/* Right Panel: Registration Form */}
        <Box
          sx={{
            flex: 1,
            p: { xs: 4, md: 6 },
            backgroundColor: "white",
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
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
            Sign Up
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3, width: '100%', whiteSpace: 'pre-line' }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate style={{ width: "100%" }}>
            <TextField
              label="First Name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              fullWidth
              required
              sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
            />
            <TextField
              label="Last Name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              fullWidth
              required
              sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
            />
            <TextField
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              fullWidth
              required
              sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
            />
            <TextField
              label="Phone Number (Optional)"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              fullWidth
              sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
            />
            <TextField
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              fullWidth
              required
              sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
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
                  sx={{ mb: 2 }}
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
                  >
                    {specializationsList.map((name) => (
                      <MenuItem key={name} value={name}>
                        <Checkbox checked={formData.specializations.indexOf(name) > -1} />
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
                  sx={{ mb: 2 }}
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
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Languages Spoken"
                  name="languages_spoken"
                  value={formData.languages_spoken}
                  onChange={handleChange}
                  helperText="Comma-separated, e.g., English, Swahili"
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Client Focus"
                  name="client_focus"
                  value={formData.client_focus}
                  onChange={handleChange}
                  helperText="e.g., Adults, Teens, LGBTQ+, Couples"
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Video Introduction URL"
                  name="video_introduction_url"
                  value={formData.video_introduction_url}
                  onChange={handleChange}
                  helperText="Link to a brief video introduction (e.g., YouTube)"
                  sx={{ mb: 2 }}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.insurance_accepted}
                      onChange={handleChange}
                      name="insurance_accepted"
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
                    sx={{ mb: 2 }}
                  />
                )}
                <FormControl component="fieldset" fullWidth sx={{ mb: 2 }}>
                  <FormLabel component="legend">Session Modes</FormLabel>
                  <RadioGroup row name="session_modes" value={formData.session_modes} onChange={handleChange}>
                    <FormControlLabel value="online" control={<Radio />} label="Online" />
                    <FormControlLabel value="physical" control={<Radio />} label="Physical (In-Person)" />
                    <FormControlLabel value="both" control={<Radio />} label="Both" />
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
                    sx={{ mb: 2 }}
                  />
                )}
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.is_available}
                      onChange={handleChange}
                      name="is_available"
                    />
                  }
                  label="Available for new sessions?"
                  sx={{ mb: 2 }}
                />
              </Box>
            )}

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

          <Typography
            variant="body2"
            sx={{ mt: 3, textAlign: "center", color: '#555' }}
          >
            Already have an account?{" "}
            <Link to="/login" style={{ color: '#780000', textDecoration: "none", fontWeight: "bold" }}>
              Login Here
            </Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
