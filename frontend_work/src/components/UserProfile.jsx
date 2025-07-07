import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Container, Paper, TextField, Button,
  CircularProgress, Snackbar, Alert, Grid, Avatar, IconButton
} from '@mui/material';
import { PhotoCamera, Delete } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Cloudinary Configuration - FOR DEMONSTRATION ONLY (INSECURE FOR PROD)
const CLOUDINARY_CLOUD_NAME = 'dgdf0svqx';
const CLOUDINARY_UPLOAD_PRESET = 'ml_default'; // You might need to set up an unsigned upload preset in Cloudinary settings

export default function UserProfile() {
  const { user, token, refreshAccessToken, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    bio: '',
    profile_picture: null, // This will hold the File object or null
    current_profile_picture_url: '' // To display current image
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  useEffect(() => {
    if (!authLoading && user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
        profile_picture: null,
        current_profile_picture_url: user.profile_picture || ''
      });
      setLoading(false);
    } else if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData(prev => ({
        ...prev,
        profile_picture: file,
        current_profile_picture_url: URL.createObjectURL(file) // Show preview
      }));
    }
  };

  const handleRemovePhoto = () => {
    setFormData(prev => ({
      ...prev,
      profile_picture: null, // Indicate no file to upload
      current_profile_picture_url: '' // Clear preview and signal removal to backend
    }));
  };

  const uploadImageToCloudinary = async (file) => {
    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append('file', file);
    cloudinaryFormData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET); // Use your unsigned upload preset

    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        cloudinaryFormData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data.secure_url; // Return the secure URL of the uploaded image
    } catch (error) {
      console.error('Error uploading image to Cloudinary:', error.response?.data || error);
      throw new Error('Failed to upload image to Cloudinary.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSnackbarOpen(false);

    let profilePictureUrl = formData.current_profile_picture_url; // Default to current URL

    try {
      if (formData.profile_picture) {
        // If a new file is selected, upload it to Cloudinary
        profilePictureUrl = await uploadImageToCloudinary(formData.profile_picture);
      } else if (formData.current_profile_picture_url === '') {
        // If photo was explicitly removed and no new one selected
        profilePictureUrl = ''; // Clear the URL in the backend
      }

      const dataToSubmit = new FormData();
      dataToSubmit.append('first_name', formData.first_name);
      dataToSubmit.append('last_name', formData.last_name);
      dataToSubmit.append('phone', formData.phone);
      dataToSubmit.append('bio', formData.bio);
      dataToSubmit.append('profile_picture', profilePictureUrl); // Send the Cloudinary URL or empty string

      const response = await axios.patch('http://localhost:8000/api/user/', dataToSubmit, {
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
        <Typography sx={{ ml: 2, color: '#780000' }}>Loading profile...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#fefae0', py: 8 }}>
      <Container maxWidth="md">
        <Paper elevation={6} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 3, backgroundColor: 'white' }}>
          <Typography variant="h4" align="center" sx={{ color: '#780000', mb: 4, fontWeight: 'bold' }}>
            My Profile
          </Typography>

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Profile Picture Section */}
              <Grid item xs={12} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                <Avatar
                  src={formData.current_profile_picture_url || '/default-avatar.png'}
                  alt="Profile Picture"
                  sx={{ width: 120, height: 120, mb: 2, border: '3px solid #780000' }}
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

              {/* Basic Info */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  value={formData.email}
                  disabled
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Bio"
                  name="bio"
                  multiline
                  rows={4}
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Tell us a little about yourself."
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
              {submitting ? <CircularProgress size={24} color="inherit" /> : 'Save Profile'}
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