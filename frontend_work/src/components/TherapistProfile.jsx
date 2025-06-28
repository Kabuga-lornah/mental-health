import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Container, Paper, TextField, Button,
  CircularProgress, Snackbar, Alert, Grid, Avatar, IconButton,
  Select, MenuItem, FormControl, InputLabel, Checkbox, ListItemText,
  RadioGroup, FormControlLabel, Radio, Chip, Stack
} from '@mui/material';
import { PhotoCamera, Delete } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

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

export default function TherapistProfile() {
  const { user, token, refreshAccessToken, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    bio: '',
    profile_picture: null, // This will hold the File object or null
    current_profile_picture_url: '', // To display current image
    years_of_experience: '',
    specializations: [], // Array for multi-select
    hourly_rate: '',
    license_credentials: '',
    approach_modalities: '',
    languages_spoken: '',
    client_focus: '',
    insurance_accepted: false,
    video_introduction_url: '',
    is_free_consultation: false,
    session_modes: 'online', // Default value
    physical_address: '',
    is_available: false, // Therapist availability status
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  useEffect(() => {
    if (!authLoading && user && user.is_therapist) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
        profile_picture: null,
        current_profile_picture_url: user.profile_picture || '',
        years_of_experience: user.years_of_experience || '',
        specializations: user.specializations ? user.specializations.split(',') : [],
        hourly_rate: user.hourly_rate || '',
        license_credentials: user.license_credentials || '',
        approach_modalities: user.approach_modalities || '',
        languages_spoken: user.languages_spoken || '',
        client_focus: user.client_focus || '',
        insurance_accepted: user.insurance_accepted,
        video_introduction_url: user.video_introduction_url || '',
        is_free_consultation: user.is_free_consultation,
        session_modes: user.session_modes || 'online',
        physical_address: user.physical_address || '',
        is_available: user.is_available,
      });
      setLoading(false);
    } else if (!authLoading && (!user || !user.is_therapist)) {
      navigate('/login'); // Redirect if not logged in or not a therapist
    }
  }, [user, authLoading, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSpecializationChange = (event) => {
    const { value } = event.target;
    setFormData(prev => ({
      ...prev,
      specializations: typeof value === 'string' ? value.split(',') : value,
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData(prev => ({
        ...prev,
        profile_picture: file,
        current_profile_picture_url: URL.createObjectURL(file)
      }));
    }
  };

  const handleRemovePhoto = () => {
    setFormData(prev => ({
      ...prev,
      profile_picture: null,
      current_profile_picture_url: ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSnackbarOpen(false);

    const data = new FormData();
    // Append basic user fields
    data.append('first_name', formData.first_name);
    data.append('last_name', formData.last_name);
    data.append('phone', formData.phone);
    data.append('bio', formData.bio);
    data.append('is_available', formData.is_available); // General availability status

    // Handle profile picture
    if (formData.profile_picture) {
      data.append('profile_picture', formData.profile_picture);
    } else if (formData.current_profile_picture_url === '') {
      data.append('profile_picture', ''); // Signal to remove existing photo
    }

    // Append therapist-specific fields
    data.append('years_of_experience', formData.years_of_experience);
    data.append('specializations', formData.specializations.join(','));
    data.append('license_credentials', formData.license_credentials);
    data.append('approach_modalities', formData.approach_modalities);
    data.append('languages_spoken', formData.languages_spoken);
    data.append('client_focus', formData.client_focus);
    data.append('insurance_accepted', formData.insurance_accepted);
    data.append('video_introduction_url', formData.video_introduction_url);
    data.append('is_free_consultation', formData.is_free_consultation);
    data.append('session_modes', formData.session_modes);
    data.append('physical_address', formData.physical_address);

    // Only include hourly_rate if free consultation is NOT offered
    if (!formData.is_free_consultation && formData.hourly_rate) {
      data.append('hourly_rate', parseFloat(formData.hourly_rate));
    } else if (formData.is_free_consultation) {
        data.append('hourly_rate', ''); // Send empty to clear if it was set before
    }


    try {
      const response = await axios.patch('http://localhost:8000/api/user/', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      await refreshAccessToken();

      setSnackbarMessage('Profile updated successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

    } catch (err) {
      console.error('Error updating profile:', err.response?.data || err);
      const errorMessage = err.response?.data?.detail
        ? (Array.isArray(err.response.data.detail) ? err.response.data.detail.join(', ') : err.response.data.detail)
        : (err.response?.data ? Object.values(err.response.data).flat().join(', ') : 'Failed to update profile. Please try again.');
      setSnackbarMessage(errorMessage);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', backgroundColor: '#fefae0' }}>
        <CircularProgress sx={{ color: '#780000' }} />
        <Typography sx={{ ml: 2, color: '#780000' }}>Loading therapist profile...</Typography>
      </Box>
    );
  }

  // Ensure only verified therapists can see this page
  if (!user || !user.is_therapist || !user.is_verified) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4, minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <Typography variant="h6" color="error" sx={{ mb: 2 }}>
          Access Denied: You must be a verified therapist to view this page.
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Please ensure your therapist application is approved.
        </Typography>
        <Button onClick={() => navigate('/therapist-apply')} variant="contained" sx={{ backgroundColor: '#780000', '&:hover': { backgroundColor: '#5a0000' } }}>
          View Application Status
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#fefae0', py: 8 }}>
      <Container maxWidth="lg">
        <Paper elevation={6} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 3, backgroundColor: 'white' }}>
          <Typography variant="h4" align="center" sx={{ color: '#780000', mb: 4, fontWeight: 'bold' }}>
            My Therapist Profile
          </Typography>

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Profile Picture Section */}
              <Grid item xs={12} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                <Avatar
                  src={formData.current_profile_picture_url || '/default-therapist-avatar.png'}
                  alt="Therapist Profile Picture"
                  sx={{ width: 150, height: 150, mb: 2, border: '4px solid #780000' }}
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <label htmlFor="upload-photo">
                    <Button variant="outlined" component="span" startIcon={<PhotoCamera />}
                      sx={{ borderColor: '#780000', color: '#780000', '&:hover': { backgroundColor: 'rgba(120,0,0,0.05)' } }}
                    >
                      Upload Photo
                    </Button>
                    <input
                      type="file"
                      accept="image/*"
                      id="upload-photo"
                      hidden
                      onChange={handleFileChange}
                    />
                  </label>
                  {formData.current_profile_picture_url && (
                    <Button variant="outlined" startIcon={<Delete />} onClick={handleRemovePhoto}
                      sx={{ borderColor: '#a4161a', color: '#a4161a', '&:hover': { backgroundColor: 'rgba(164,22,26,0.05)' } }}
                    >
                      Remove Photo
                    </Button>
                  )}
                </Box>
              </Grid>

              {/* Personal Info */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ color: '#780000', mb: 2, borderBottom: '2px solid #ddd', pb: 1 }}>
                  Personal Information
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="First Name" name="first_name" value={formData.first_name} onChange={handleChange} required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Last Name" name="last_name" value={formData.last_name} onChange={handleChange} required />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Email" name="email" value={formData.email} disabled />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Bio / About Me"
                  name="bio"
                  multiline
                  rows={4}
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Share your professional background, philosophy, and approach to therapy."
                />
              </Grid>

              {/* Professional Details */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ color: '#780000', mt: 4, mb: 2, borderBottom: '2px solid #ddd', pb: 1 }}>
                  Professional Details
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Years of Experience" name="years_of_experience" type="number" value={formData.years_of_experience} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="License & Credentials" name="license_credentials" value={formData.license_credentials} onChange={handleChange} helperText="e.g., LMFT, LCSW, PhD" />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
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
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Approach/Therapeutic Modalities" name="approach_modalities" multiline rows={3} value={formData.approach_modalities} onChange={handleChange} helperText="e.g., CBT, EMDR, Psychodynamic" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Languages Spoken" name="languages_spoken" value={formData.languages_spoken} onChange={handleChange} helperText="Comma-separated, e.g., English, Swahili" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Client Focus" name="client_focus" value={formData.client_focus} onChange={handleChange} helperText="e.g., Adults, Teens, LGBTQ+, Couples" />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Video Introduction URL" name="video_introduction_url" value={formData.video_introduction_url} onChange={handleChange} helperText="Link to a brief video introduction (e.g., YouTube)" />
              </Grid>

              {/* Session & Availability Details */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ color: '#780000', mt: 4, mb: 2, borderBottom: '2px solid #ddd', pb: 1 }}>
                  Session & Availability
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <FormControl component="fieldset" fullWidth>
                  <RadioGroup row name="session_modes" value={formData.session_modes} onChange={handleChange}>
                    <FormControlLabel value="online" control={<Radio />} label="Online Sessions" />
                    <FormControlLabel value="physical" control={<Radio />} label="Physical (In-Person) Sessions" />
                    <FormControlLabel value="both" control={<Radio />} label="Both Online & Physical" />
                  </RadioGroup>
                </FormControl>
              </Grid>
              {(formData.session_modes === 'physical' || formData.session_modes === 'both') && (
                <Grid item xs={12}>
                  <TextField fullWidth label="Physical Location/Address" name="physical_address" multiline rows={3} value={formData.physical_address} onChange={handleChange} helperText="Address for in-person sessions" />
                </Grid>
              )}
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={<Checkbox checked={formData.is_free_consultation} onChange={handleChange} name="is_free_consultation" />}
                  label="Offer a free initial consultation?"
                />
              </Grid>
              {!formData.is_free_consultation && (
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Hourly Rate (Ksh)" name="hourly_rate" type="number" value={formData.hourly_rate} onChange={handleChange} inputProps={{ min: 0 }} />
                </Grid>
              )}
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={<Checkbox checked={formData.insurance_accepted} onChange={handleChange} name="insurance_accepted" />}
                  label="Accept insurance?"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={<Checkbox checked={formData.is_available} onChange={handleChange} name="is_available" />}
                  label="Are you available for new sessions?"
                />
              </Grid>
            </Grid>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{
                mt: 4,
                py: 1.5,
                backgroundColor: '#780000',
                '&:hover': { backgroundColor: '#a4161a' },
                fontWeight: 'bold',
                fontSize: '1.1rem'
              }}
              disabled={submitting}
            >
              {submitting ? <CircularProgress size={24} color="inherit" /> : 'Save Therapist Profile'}
            </Button>
          </form>
        </Paper>
      </Container>

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}