// File: frontend_work/src/components/TherapistApplicationForm.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Paper,
  Grid,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  TextField,
  FormControl,
  FormHelperText,
  Card,
  CardContent,
  CardActions,
  Select,
  MenuItem,
  InputLabel,
  Checkbox,
  ListItemText,
  OutlinedInput,
  FormControlLabel,
  RadioGroup,
  Radio,
  Chip, // Added Chip for displaying selected items
  Stack, // Added Stack for layout
  Avatar // Added Avatar for professional photo preview
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { PhotoCamera, UploadFile, Delete } from '@mui/icons-material'; // Added UploadFile icon

// Cloudinary Configuration
// IMPORTANT: For production, store these securely (e.g., environment variables)
const CLOUDINARY_CLOUD_NAME = 'dgdf0svqx'; // Replace with your Cloudinary Cloud Name
const CLOUDINARY_UPLOAD_PRESET = 'mental health'; // Replace with your Cloudinary Upload Preset

const primaryColor = '#780000';
const pageBackground = '#FFF8E1';
const buttonHoverColor = '#5a0000';
const textColor = '#333';
const lightTextColor = '#666';
const borderColor = '#ddd';

const Input = styled('input')({
  display: 'none',
});

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

export default function TherapistApplicationForm() {
  const { user, token, refreshAccessToken } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    license_number: '',
    license_document: null, // Will store Cloudinary URL
    id_number: '',
    id_document: null,     // Will store Cloudinary URL
    professional_photo: null, // Will store Cloudinary URL
    motivation_statement: '',
    specializations: [], // Changed to array to match Select multiple
    years_of_experience: '',
    license_credentials: '',
    approach_modalities: '',
    languages_spoken: '',
    client_focus: '',
    insurance_accepted: false,
    is_free_consultation: false,
    session_modes: 'online', // Default value
    physical_address: '', // Required only for physical/both sessions
    hourly_rate: null, // Default to null, depends on is_free_consultation
  });

  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info',
  });
  const [errors, setErrors] = useState({});
  const [fileUploadLoading, setFileUploadLoading] = useState({
    license_document: false,
    id_document: false,
    professional_photo: false,
  });

  useEffect(() => {
    // Redirect if user is not logged in or is not a therapist
    if (!user && !refreshAccessToken.loading) { // Check user and if token refresh is still happening
      navigate('/login');
    } else if (user && !user.is_therapist) {
      navigate('/dashboard'); // Or some other appropriate page for non-therapists
    } else if (user && user.is_verified) {
      // If user is already verified as a therapist, redirect to their dashboard
      navigate('/therapist/dashboard');
    }
  }, [user, navigate, refreshAccessToken.loading]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'is_free_consultation') {
      setFormData((prevData) => ({
        ...prevData,
        [name]: checked,
        hourly_rate: checked ? null : prevData.hourly_rate, // Set hourly_rate to null if free
      }));
    } else if (name === 'session_modes') {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
        physical_address: value === 'online' ? '' : prevData.physical_address, // Clear if only online
      }));
    } else if (type === 'checkbox') {
      setFormData((prevData) => ({
        ...prevData,
        [name]: checked,
      }));
    } else if (name === 'specializations') {
      // Handle multiple select for specializations
      setFormData((prevData) => ({
        ...prevData,
        [name]: typeof value === 'string' ? value.split(',') : value,
      }));
    } else if (name === 'years_of_experience' && value !== '') {
        // Convert to integer or null
        const intValue = parseInt(value, 10);
        setFormData((prevData) => ({
            ...prevData,
            [name]: isNaN(intValue) ? null : intValue,
        }));
    }
    else if (name === 'hourly_rate' && value !== '') {
        // Convert to float or null
        const floatValue = parseFloat(value);
        setFormData((prevData) => ({
            ...prevData,
            [name]: isNaN(floatValue) ? null : floatValue,
        }));
    }
    else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
    setErrors((prev) => ({ ...prev, [name]: undefined })); // Clear specific error on change
  };

  const handleFileUpload = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileUploadLoading((prev) => ({ ...prev, [fieldName]: true }));
    setErrors((prev) => ({ ...prev, [fieldName]: undefined })); // Clear previous file errors

    const formDataUpload = new FormData();
    formDataUpload.append('file', file);
    formDataUpload.append('upload_preset', CLOUDINARY_UPLOAD_PRESET); // Your upload preset

    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`,
        formDataUpload
      );
      const fileUrl = response.data.secure_url;
      setFormData((prevData) => ({
        ...prevData,
        [fieldName]: fileUrl, // Store the Cloudinary URL
      }));
      setSnackbar({
        open: true,
        message: `${fieldName.replace('_', ' ')} uploaded successfully!`,
        severity: 'success',
      });
    } catch (error) {
      console.error(`Error uploading ${fieldName} to Cloudinary:`, error);
      setErrors((prev) => ({ ...prev, [fieldName]: 'Failed to upload file.' }));
      setSnackbar({
        open: true,
        message: `Failed to upload ${fieldName.replace('_', ' ')}.`,
        severity: 'error',
      });
    } finally {
      setFileUploadLoading((prev) => ({ ...prev, [fieldName]: false }));
    }
  };

  const handleRemoveFile = (fieldName) => {
    setFormData((prevData) => ({
      ...prevData,
      [fieldName]: null,
    }));
    setErrors((prev) => ({ ...prev, [fieldName]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({}); // Clear previous errors

    // Client-side validation for required fields (can be more extensive)
    const newErrors = {};
    if (!formData.license_number) newErrors.license_number = 'License number is required.';
    if (!formData.license_document) newErrors.license_document = 'License document is required.';
    if (!formData.id_number) newErrors.id_number = 'ID number is required.';
    if (!formData.id_document) newErrors.id_document = 'ID document is required.';
    if (!formData.professional_photo) newErrors.professional_photo = 'Professional photo is required.';
    if (!formData.motivation_statement) newErrors.motivation_statement = 'Motivation statement is required.';
    if (formData.specializations.length === 0) newErrors.specializations = 'At least one specialization is required.';
    if (formData.years_of_experience === null || formData.years_of_experience === '') newErrors.years_of_experience = 'Years of experience is required.';
    if (!formData.license_credentials) newErrors.license_credentials = 'License credentials are required.';
    if (!formData.approach_modalities) newErrors.approach_modalities = 'Approach modalities are required.';
    if (!formData.languages_spoken) newErrors.languages_spoken = 'Languages spoken are required.';
    if (!formData.client_focus) newErrors.client_focus = 'Client focus is required.';

    if (!formData.is_free_consultation && (formData.hourly_rate === null || formData.hourly_rate === '')) {
      newErrors.hourly_rate = 'Hourly rate is required if not offering free consultation.';
    }
    if (formData.is_free_consultation && formData.hourly_rate !== null && formData.hourly_rate !== '') {
      newErrors.hourly_rate = 'Hourly rate must be null if offering free consultation.';
    }

    if (['physical', 'both'].includes(formData.session_modes) && !formData.physical_address) {
      newErrors.physical_address = 'Physical address is required for in-person sessions.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSnackbar({
        open: true,
        message: 'Please fill in all required fields.',
        severity: 'error',
      });
      setSubmitting(false);
      return;
    }

    try {
      const applicationPayload = {
        applicant: user.id, // The backend will likely derive this from the token
        license_number: formData.license_number,
        license_document: formData.license_document, // This is now a URL
        id_number: formData.id_number,
        id_document: formData.id_document,       // This is now a URL
        professional_photo: formData.professional_photo, // This is now a URL
        motivation_statement: formData.motivation_statement,
        specializations: formData.specializations.join(','), // Convert array back to comma-separated string for backend
        years_of_experience: formData.years_of_experience,
        license_credentials: formData.license_credentials,
        approach_modalities: formData.approach_modalities,
        languages_spoken: formData.languages_spoken,
        client_focus: formData.client_focus,
        insurance_accepted: formData.insurance_accepted,
        is_free_consultation: formData.is_free_consultation,
        session_modes: formData.session_modes,
        physical_address: formData.physical_address || null,
        hourly_rate: formData.hourly_rate || null,
      };

      await axios.post(
        'http://localhost:8000/api/therapist-applications/',
        applicationPayload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json', // Ensure JSON content type
          },
        }
      );

      setSnackbar({
        open: true,
        message: 'Application submitted successfully! Please wait for admin approval.',
        severity: 'success',
      });
      // Optionally redirect to a pending page or dashboard
      navigate('/dashboard'); // Or navigate to a "application pending" page
    } catch (error) {
      console.error('Application submission error:', error);
      if (error.response && error.response.data) {
        setErrors(error.response.data);
        // Display generic or specific backend errors
        if (error.response.data.non_field_errors) {
            setSnackbar({
                open: true,
                message: error.response.data.non_field_errors[0],
                severity: 'error',
            });
        } else {
            const fieldErrors = Object.values(error.response.data).flat().join(' ');
            setSnackbar({
                open: true,
                message: `Submission failed: ${fieldErrors || 'Please check the form for errors.'}`,
                severity: 'error',
            });
        }
      } else {
        setSnackbar({
          open: true,
          message: 'An unexpected error occurred during submission.',
          severity: 'error',
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  // Show a loading spinner if auth context is still loading user
  if (refreshAccessToken.loading || !user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // If user is a therapist and verified, they shouldn't be on this form,
  // but if somehow they land here before useEffect redirects, show message
  if (user && user.is_therapist && user.is_verified) {
    return (
      <Container component="main" maxWidth="md" sx={{ my: 4 }}>
        <Paper elevation={6} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography variant="h5" component="h1" gutterBottom color="primary">
            You are already an approved therapist.
          </Typography>
          <Button component={Link} to="/therapist/dashboard" variant="contained" sx={{ mt: 2 }}>
            Go to Dashboard
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="md" sx={{ my: 4, backgroundColor: pageBackground, p: 4, borderRadius: 2 }}>
      <Paper elevation={6} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: primaryColor, fontWeight: 'bold' }}>
          Therapist Application
        </Typography>
        <Typography variant="subtitle1" gutterBottom sx={{ color: textColor, mb: 3 }}>
          Please fill out the form below to apply as a therapist.
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
          <Grid container spacing={3}>
            {/* License Number */}
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="License Number"
                name="license_number"
                value={formData.license_number}
                onChange={handleChange}
                error={!!errors.license_number}
                helperText={errors.license_number}
              />
            </Grid>

            {/* License Document Upload */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.license_document}>
                <Typography variant="body2" sx={{ mb: 1, color: textColor }}>
                  Upload License Document *
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <label htmlFor="license-document-upload">
                    <Input
                      accept="application/pdf,image/*"
                      id="license-document-upload"
                      type="file"
                      onChange={(e) => handleFileUpload(e, 'license_document')}
                      disabled={fileUploadLoading.license_document}
                    />
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<UploadFile />}
                      disabled={fileUploadLoading.license_document}
                    >
                      {fileUploadLoading.license_document ? <CircularProgress size={24} /> : 'Choose File'}
                    </Button>
                  </label>
                  {formData.license_document && (
                    <Button
                      variant="text"
                      color="error"
                      startIcon={<Delete />}
                      onClick={() => handleRemoveFile('license_document')}
                    >
                      Remove
                    </Button>
                  )}
                </Box>
                {formData.license_document && (
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    File Uploaded: <Link href={formData.license_document} target="_blank" rel="noopener noreferrer">View Document</Link>
                  </Typography>
                )}
                {errors.license_document && (
                  <FormHelperText>{errors.license_document}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            {/* ID Number */}
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="ID Number"
                name="id_number"
                value={formData.id_number}
                onChange={handleChange}
                error={!!errors.id_number}
                helperText={errors.id_number}
              />
            </Grid>

            {/* ID Document Upload */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.id_document}>
                <Typography variant="body2" sx={{ mb: 1, color: textColor }}>
                  Upload ID Document *
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <label htmlFor="id-document-upload">
                    <Input
                      accept="application/pdf,image/*"
                      id="id-document-upload"
                      type="file"
                      onChange={(e) => handleFileUpload(e, 'id_document')}
                      disabled={fileUploadLoading.id_document}
                    />
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<UploadFile />}
                      disabled={fileUploadLoading.id_document}
                    >
                      {fileUploadLoading.id_document ? <CircularProgress size={24} /> : 'Choose File'}
                    </Button>
                  </label>
                  {formData.id_document && (
                    <Button
                      variant="text"
                      color="error"
                      startIcon={<Delete />}
                      onClick={() => handleRemoveFile('id_document')}
                    >
                      Remove
                    </Button>
                  )}
                </Box>
                {formData.id_document && (
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    File Uploaded: <Link href={formData.id_document} target="_blank" rel="noopener noreferrer">View Document</Link>
                  </Typography>
                )}
                {errors.id_document && (
                  <FormHelperText>{errors.id_document}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            {/* Professional Photo Upload */}
            <Grid item xs={12} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              <Typography variant="body2" sx={{ mb: 1, color: textColor }}>
                Upload Professional Photo *
              </Typography>
              <Avatar src={formData.professional_photo || ''} sx={{ width: 100, height: 100, mb: 2 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <label htmlFor="professional-photo-upload">
                  <Input
                    accept="image/*"
                    id="professional-photo-upload"
                    type="file"
                    onChange={(e) => handleFileUpload(e, 'professional_photo')}
                    disabled={fileUploadLoading.professional_photo}
                  />
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<PhotoCamera />}
                    disabled={fileUploadLoading.professional_photo}
                  >
                    {fileUploadLoading.professional_photo ? <CircularProgress size={24} /> : 'Choose Photo'}
                  </Button>
                </label>
                {formData.professional_photo && (
                  <Button
                    variant="text"
                    color="error"
                    startIcon={<Delete />}
                    onClick={() => handleRemoveFile('professional_photo')}
                  >
                    Remove Photo
                  </Button>
                )}
              </Box>
              {errors.professional_photo && (
                <FormHelperText error>{errors.professional_photo}</FormHelperText>
              )}
            </Grid>

            {/* Motivation Statement */}
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                multiline
                rows={4}
                label="Motivation Statement"
                name="motivation_statement"
                value={formData.motivation_statement}
                onChange={handleChange}
                error={!!errors.motivation_statement}
                helperText={errors.motivation_statement}
              />
            </Grid>

            {/* Specializations */}
            <Grid item xs={12}>
              <FormControl fullWidth required error={!!errors.specializations}>
                <InputLabel id="specializations-label">Specializations *</InputLabel>
                <Select
                  labelId="specializations-label"
                  id="specializations"
                  multiple
                  name="specializations"
                  value={formData.specializations}
                  onChange={handleChange}
                  input={<OutlinedInput id="select-multiple-chip" label="Specializations *" />}
                  renderValue={(selected) => (
                    <Stack gap={1} direction="row" flexWrap="wrap">
                      {selected.map((value) => (
                        <Chip key={value} label={value} />
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
                {errors.specializations && (
                  <FormHelperText>{errors.specializations}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            {/* Years of Experience */}
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Years of Experience"
                name="years_of_experience"
                type="number"
                value={formData.years_of_experience}
                onChange={handleChange}
                error={!!errors.years_of_experience}
                helperText={errors.years_of_experience}
                inputProps={{ min: 0 }}
              />
            </Grid>

            {/* License Credentials */}
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="License Credentials (e.g., M.S., Ph.D.)"
                name="license_credentials"
                value={formData.license_credentials}
                onChange={handleChange}
                error={!!errors.license_credentials}
                helperText={errors.license_credentials}
              />
            </Grid>

            {/* Approach Modalities */}
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Approach Modalities (e.g., CBT, DBT, Psychodynamic)"
                name="approach_modalities"
                value={formData.approach_modalities}
                onChange={handleChange}
                error={!!errors.approach_modalities}
                helperText={errors.approach_modalities}
              />
            </Grid>

            {/* Languages Spoken */}
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Languages Spoken (comma-separated)"
                name="languages_spoken"
                value={formData.languages_spoken}
                onChange={handleChange}
                error={!!errors.languages_spoken}
                helperText={errors.languages_spoken}
              />
            </Grid>

            {/* Client Focus */}
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Client Focus (e.g., Adults, Children, Couples)"
                name="client_focus"
                value={formData.client_focus}
                onChange={handleChange}
                error={!!errors.client_focus}
                helperText={errors.client_focus}
              />
            </Grid>

            {/* Session Modes */}
            <Grid item xs={12}>
              <FormControl component="fieldset" fullWidth error={!!errors.session_modes}>
                <Typography variant="body2" sx={{ mb: 1, color: textColor }}>
                  Session Modes *
                </Typography>
                <RadioGroup
                  row
                  name="session_modes"
                  value={formData.session_modes}
                  onChange={handleChange}
                >
                  <FormControlLabel value="online" control={<Radio />} label="Online" />
                  <FormControlLabel value="physical" control={<Radio />} label="Physical (In-Person)" />
                  <FormControlLabel value="both" control={<Radio />} label="Both Online & Physical" />
                </RadioGroup>
                {errors.session_modes && (
                  <FormHelperText>{errors.session_modes}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            {/* Physical Address (conditional) */}
            {['physical', 'both'].includes(formData.session_modes) && (
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Physical Address"
                  name="physical_address"
                  value={formData.physical_address}
                  onChange={handleChange}
                  error={!!errors.physical_address}
                  helperText={errors.physical_address}
                />
              </Grid>
            )}

            {/* Is Free Consultation */}
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.is_free_consultation}
                    onChange={handleChange}
                    name="is_free_consultation"
                  />
                }
                label="Offer Free Consultation?"
              />
            </Grid>

            {/* Hourly Rate (conditional) */}
            {!formData.is_free_consultation && (
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Hourly Rate (KSH)"
                  name="hourly_rate"
                  type="number"
                  value={formData.hourly_rate || ''} // Use empty string for display if null
                  onChange={handleChange}
                  error={!!errors.hourly_rate}
                  helperText={errors.hourly_rate}
                  inputProps={{ min: 0, step: "0.01" }}
                />
              </Grid>
            )}

            {/* Insurance Accepted */}
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.insurance_accepted}
                    onChange={handleChange}
                    name="insurance_accepted"
                  />
                }
                label="Accept insurance?"
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            {Object.keys(errors).length > 0 && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Please correct the errors in the form.
              </Alert>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 2 }}>
              <Typography variant="body2" sx={{
                color: lightTextColor,
                fontStyle: 'italic'
              }}>
                By submitting this application, you confirm that all information provided is accurate and complete.
              </Typography>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={submitting || Object.values(fileUploadLoading).some(Boolean)} // Disable if any file is uploading
              sx={{
                mt: 2,
                py: 1.5,
                fontSize: '1.1rem',
                backgroundColor: primaryColor,
                '&:hover': { backgroundColor: buttonHoverColor }
              }}
            >
              {submitting ? <CircularProgress size={26} color="inherit" /> : 'Submit Application'}
            </Button>
          </Box>
        </Box>
      </Paper>
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{
            width: '100%',
            backgroundColor: snackbar.severity === 'error' ? '#ffebee' :
                            snackbar.severity === 'success' ? '#e8f5e9' :
                            snackbar.severity === 'info' ? '#e3f2fd' : '#fff8e1',
            color: textColor
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}