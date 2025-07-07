import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Container, Paper, TextField, Button,
  CircularProgress, Snackbar, Alert, Grid, Avatar,
  Select, MenuItem, FormControl, InputLabel, Checkbox, ListItemText,
  RadioGroup, FormControlLabel, Radio, Chip, Stack
} from '@mui/material';
import { PhotoCamera, Delete } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Cloudinary Configuration - FOR DEMONSTRATION ONLY (INSECURE FOR PROD)
const CLOUDINARY_CLOUD_NAME = 'dgdf0svqx';
const CLOUDINARY_UPLOAD_PRESET = 'mental health';

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
        profile_picture: null, // Always null on initial load, it's for new uploads
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
        current_profile_picture_url: URL.createObjectURL(file) // Display the newly selected image
      }));
    }
  };

  const handleRemovePhoto = () => {
    setFormData(prev => ({
      ...prev,
      profile_picture: null, // Clear the file object if any was selected
      current_profile_picture_url: '' // Signal to remove existing photo on backend
    }));
  };

  const uploadImageToCloudinary = async (file) => {
    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append('file', file);
    cloudinaryFormData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        cloudinaryFormData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            // Explicitly set Authorization to undefined/null to override any global defaults/interceptors
            Authorization: undefined,
          },
        }
      );
      return response.data.secure_url;
    } catch (error) {
      console.error('Error uploading image to Cloudinary:', error.response?.data || error);
      throw new Error('Failed to upload image to Cloudinary.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSnackbarOpen(false);

    try {
      let profilePictureUrl = formData.current_profile_picture_url; // Start with the current URL

      // Case 1: A new profile picture file has been selected
      if (formData.profile_picture) {
        profilePictureUrl = await uploadImageToCloudinary(formData.profile_picture);
      }
      // Case 2: The user explicitly removed the photo (current_profile_picture_url is '').
      // We set profilePictureUrl to null to signal removal on the backend.
      else if (formData.current_profile_picture_url === '') {
        profilePictureUrl = null;
      }
      // Case 3: No new file selected and no removal, profilePictureUrl remains current_profile_picture_url

      // Prepare the payload for the single PATCH request
      const payload = {
        // Basic user fields
        first_name: String(formData.first_name || ''),
        last_name: String(formData.last_name || ''),
        phone: String(formData.phone || ''),
        bio: String(formData.bio || ''),
        is_available: Boolean(formData.is_available),
        profile_picture: profilePictureUrl, // Include the determined profile_picture URL here

        // Therapist-specific fields
        years_of_experience: formData.years_of_experience ? String(formData.years_of_experience) : null,
        specializations: Array.isArray(formData.specializations) && formData.specializations.length > 0
          ? formData.specializations.join(',') : null,
        license_credentials: formData.license_credentials ? String(formData.license_credentials) : null,
        approach_modalities: formData.approach_modalities ? String(formData.approach_modalities) : null,
        languages_spoken: formData.languages_spoken ? String(formData.languages_spoken) : null,
        client_focus: formData.client_focus ? String(formData.client_focus) : null,
        insurance_accepted: Boolean(formData.insurance_accepted),
        video_introduction_url: formData.video_introduction_url ? String(formData.video_introduction_url) : null,
        is_free_consultation: Boolean(formData.is_free_consultation),
        session_modes: String(formData.session_modes || 'online'),
        physical_address: formData.physical_address ? String(formData.physical_address) : null,
      };

      // Only include hourly_rate if free consultation is NOT offered
      if (!formData.is_free_consultation && formData.hourly_rate) {
        payload.hourly_rate = parseFloat(formData.hourly_rate);
      } else if (formData.is_free_consultation) {
        payload.hourly_rate = null; // Ensure hourly_rate is null if free consultation is offered
      }

      // Remove null, undefined, or empty string values from the payload
      // This prevents sending fields with no meaningful data and allows backend to interpret missing as 'no change'
      Object.keys(payload).forEach(key => {
        // Specifically handle string fields that should be omitted if empty
        if (typeof payload[key] === 'string' && payload[key].trim() === '') {
          delete payload[key];
        }
        // Handle null/undefined values, but be careful not to delete legitimate `false` booleans
        if (payload[key] === null || payload[key] === undefined) {
          delete payload[key];
        }
      });

      console.log('Payload being sent:', payload);

      const response = await axios.patch('http://localhost:8000/api/user/', payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      // Refresh the access token and user data to reflect changes immediately
      await refreshAccessToken();

      setSnackbarMessage('Profile updated successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

    } catch (err) {
      console.error('Error updating profile:', err.response?.data || err);
      console.error('Full error response:', err.response);

      let errorMessage = 'Failed to update profile. Please try again.';

      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data.detail) {
          errorMessage = Array.isArray(err.response.data.detail)
            ? err.response.data.detail.join(', ')
            : err.response.data.detail;
        } else {
          // Attempt to parse validation errors from backend
          const errorFields = Object.keys(err.response.data);
          const errors = errorFields.map(field => {
            const fieldError = err.response.data[field];
            return `${field}: ${Array.isArray(fieldError) ? fieldError.join(', ') : fieldError}`;
          });
          errorMessage = errors.join('; ');
        }
      }

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