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
  RadioGroup, // Added for radio buttons
  Radio,      // Added for radio buttons
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Theme colors
const primaryColor = '#780000'; // Maroon
const pageBackground = '#FFF8E1'; // Light yellow/peach background
const buttonHoverColor = '#5a0000'; // Darker maroon for hover
const textColor = '#333'; // Dark text
const lightTextColor = '#666'; // Lighter text
const borderColor = '#ddd'; // Light border

const Input = styled('input')({
  display: 'none',
});

// List of available specializations for the multi-select dropdown
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
  const { user, token } = useAuth();
  const navigate = useNavigate();

  // State for form fields, including new ones
  const [formData, setFormData] = useState({
    license_number: '',
    id_number: '',
    motivation_statement: '',
    specializations: [],
    license_credentials: '',
    approach_modalities: '',
    languages_spoken: '',
    client_focus: '',
    insurance_accepted: false,
    
    // NEW pricing and session fields
    session_type_choice: 'paid', // 'free' or 'paid'
    hourly_rate: '',
    rate_per_week: '',
    rate_per_month: '',
    free_sessions_offered: 0,
    mpesa_phone_number: '', // For Mpesa prompting
  });

  const [files, setFiles] = useState({
    license_document: null,
    id_document: null,
    professional_photo: null,
  });

  const [existingApplication, setExistingApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Fetch existing application status
  useEffect(() => {
    const fetchExistingApplication = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response = await axios.get('http://localhost:8000/api/therapist-applications/me/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setExistingApplication(response.data);
      } catch (err) {
        if (err.response?.status === 404) {
          setExistingApplication(null);
        } else {
          setError("Could not check your application status. Please refresh the page.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchExistingApplication();
  }, [token]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };
  
  const handleSpecializationChange = (event) => {
    const { value } = event.target;
    setFormData({
      ...formData,
      specializations: typeof value === 'string' ? value.split(',') : value,
    });
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    if (selectedFiles.length > 0) {
      setFiles({ ...files, [name]: selectedFiles[0] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    // Validation checks
    if (!formData.license_number.trim() || !formData.id_number.trim() || 
        !formData.motivation_statement.trim() || !formData.license_credentials.trim() ||
        !formData.approach_modalities.trim() || !formData.languages_spoken.trim() ||
        !formData.client_focus.trim()
    ) {
      setError("Please fill in all required text fields for professional details.");
      setSubmitting(false);
      return;
    }
    
    if (formData.specializations.length === 0) {
        setError("Please select at least one specialization.");
        setSubmitting(false);
        return;
    }

    if (!files.license_document || !files.id_document || !files.professional_photo) {
      setError("Please upload all required documents (License, ID, Photo).");
      setSubmitting(false);
      return;
    }

    // Pricing validation
    if (formData.session_type_choice === 'paid') {
      if (!formData.hourly_rate || isNaN(parseFloat(formData.hourly_rate)) || parseFloat(formData.hourly_rate) <= 0) {
        setError("Please provide a valid hourly rate for paid sessions.");
        setSubmitting(false);
        return;
      }
      if (formData.rate_per_week && isNaN(parseFloat(formData.rate_per_week))) {
        setError("Weekly rate must be a valid number.");
        setSubmitting(false);
        return;
      }
      if (formData.rate_per_month && isNaN(parseFloat(formData.rate_per_month))) {
        setError("Monthly rate must be a valid number.");
        setSubmitting(false);
        return;
      }
    } else { // Free sessions
      if (isNaN(parseInt(formData.free_sessions_offered))) {
        setError("Number of free sessions must be a valid number.");
        setSubmitting(false);
        return;
      }
    }

    // Create FormData object
    const submissionFormData = new FormData();
    submissionFormData.append('license_number', formData.license_number);
    submissionFormData.append('id_number', formData.id_number);
    submissionFormData.append('motivation_statement', formData.motivation_statement);
    submissionFormData.append('specializations', formData.specializations.join(','));
    submissionFormData.append('license_document', files.license_document);
    submissionFormData.append('id_document', files.id_document);
    submissionFormData.append('professional_photo', files.professional_photo);
    
    // Append existing new fields
    submissionFormData.append('license_credentials', formData.license_credentials);
    submissionFormData.append('approach_modalities', formData.approach_modalities);
    submissionFormData.append('languages_spoken', formData.languages_spoken);
    submissionFormData.append('client_focus', formData.client_focus);
    submissionFormData.append('insurance_accepted', formData.insurance_accepted);

    // NEW: Append pricing and session fields
    submissionFormData.append('is_free_consultation', formData.session_type_choice === 'free'); // Boolean based on choice
    if (formData.session_type_choice === 'paid') {
      submissionFormData.append('hourly_rate', parseFloat(formData.hourly_rate));
      if (formData.rate_per_week) submissionFormData.append('rate_per_week', parseFloat(formData.rate_per_week));
      if (formData.rate_per_month) submissionFormData.append('rate_per_month', parseFloat(formData.rate_per_month));
    } else {
      submissionFormData.append('free_sessions_offered', parseInt(formData.free_sessions_offered));
    }
    if (formData.mpesa_phone_number.trim()) {
      submissionFormData.append('mpesa_phone_number', formData.mpesa_phone_number.trim());
    }


    try {
      const response = await axios.post('http://localhost:8000/api/therapist-applications/submit/', submissionFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      setExistingApplication(response.data);
      setSnackbar({ open: true, message: 'Application submitted successfully!', severity: 'success' });

    } catch (err) {
      let errorMessage = "An unexpected error occurred. Please try again.";
      if (err.response?.data) {
          const errors = err.response.data;
          if (errors.detail) {
              errorMessage = errors.detail;
          } else {
              const errorMessages = Object.entries(errors).map(([field, fieldErrors]) => 
                  `${field.replace(/_/g, ' ')}: ${Array.isArray(fieldErrors) ? fieldErrors.join(', ') : fieldErrors}`
              );
              if (errorMessages.length > 0) {
                  errorMessage = errorMessages.join('\n');
              }
          }
      }
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Loading state UI
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        backgroundColor: pageBackground
      }}>
        <CircularProgress sx={{ color: primaryColor }} />
        <Typography sx={{ ml: 2, color: primaryColor }}>Checking your application status...</Typography>
      </Box>
    );
  }

  // UI for users with an existing application
  if (existingApplication) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        backgroundColor: pageBackground,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2
      }}>
        <Container maxWidth="sm">
          <Paper elevation={3} sx={{ 
            p: 4, 
            textAlign: 'center', 
            borderRadius: 2,
            backgroundColor: 'white'
          }}>
            <Typography variant="h5" sx={{ 
              fontWeight: 'bold', 
              mb: 2,
              color: primaryColor
            }}>
              Application Status
            </Typography>
            <Typography variant="h6" sx={{ mb: 3, color: textColor }}>
              Your application is currently: <strong style={{ 
                textTransform: 'capitalize',
                color: existingApplication.status === 'approved' ? primaryColor : 
                      existingApplication.status === 'pending' ? '#FFA500' : '#FF0000'
              }}>
                {existingApplication.status}
              </strong>
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, color: textColor }}>
              Thank you for your submission. You will be notified via email of any updates.
            </Typography>
          </Paper>
        </Container>
      </Box>
    );
  }

  // Main application form UI
  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: pageBackground,
      py: 8
    }}>
      <Container maxWidth="md">
        <Paper elevation={6} sx={{ 
          p: { xs: 2, sm: 4 }, 
          borderRadius: 2,
          backgroundColor: 'white'
        }}>
          <Typography component="h1" variant="h4" sx={{ 
            fontWeight: 'bold', 
            textAlign: 'center', 
            mb: 3,
            color: primaryColor
          }}>
            Therapist Application
          </Typography>
          <Typography variant="body1" sx={{ 
            textAlign: 'center', 
            mb: 4,
            color: textColor
          }}>
            Please provide your credentials for verification.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ 
              mb: 3, 
              whiteSpace: 'pre-line',
              backgroundColor: '#FFEBEE',
              color: textColor
            }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            {/* Section 1: Basic Professional Details */}
            <Typography variant="h6" sx={{ color: primaryColor, mb: 2, borderBottom: `2px solid ${borderColor}`, pb: 1 }}>
              Professional Information
            </Typography>
            <Grid container spacing={3} mb={4}>
              <Grid item xs={12} sm={6}>
                <TextField 
                  required 
                  fullWidth 
                  label="License Number" 
                  name="license_number" 
                  value={formData.license_number} 
                  onChange={handleInputChange}
                  sx={{
                    '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: borderColor }, '&:hover fieldset': { borderColor: primaryColor }, '&.Mui-focused fieldset': { borderColor: primaryColor } },
                    '& .MuiInputLabel-root': { color: lightTextColor, '&.Mui-focused': { color: primaryColor } },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  required 
                  fullWidth 
                  label="National ID Number" 
                  name="id_number" 
                  value={formData.id_number} 
                  onChange={handleInputChange}
                  sx={{
                    '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: borderColor }, '&:hover fieldset': { borderColor: primaryColor }, '&.Mui-focused fieldset': { borderColor: primaryColor } },
                    '& .MuiInputLabel-root': { color: lightTextColor, '&.Mui-focused': { color: primaryColor } },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField 
                  required 
                  fullWidth 
                  label="License & Credentials" 
                  name="license_credentials" 
                  value={formData.license_credentials} 
                  onChange={handleInputChange}
                  helperText="E.g., LMFT, LCSW, PhD"
                  sx={{
                    '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: borderColor }, '&:hover fieldset': { borderColor: primaryColor }, '&.Mui-focused fieldset': { borderColor: primaryColor } },
                    '& .MuiInputLabel-root': { color: lightTextColor, '&.Mui-focused': { color: primaryColor } },
                    '& .MuiFormHelperText-root': { color: lightTextColor },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField 
                  required 
                  fullWidth 
                  label="Motivation Statement" 
                  name="motivation_statement" 
                  multiline 
                  rows={5} 
                  value={formData.motivation_statement} 
                  onChange={handleInputChange} 
                  helperText="Briefly describe why you want to be a therapist on our platform."
                  sx={{
                    '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: borderColor }, '&:hover fieldset': { borderColor: primaryColor }, '&.Mui-focused fieldset': { borderColor: primaryColor } },
                    '& .MuiInputLabel-root': { color: lightTextColor, '&.Mui-focused': { color: primaryColor } },
                    '& .MuiFormHelperText-root': { color: lightTextColor },
                  }}
                />
              </Grid>
            </Grid>
              
            {/* Section 2: Specializations and Approach */}
            <Typography variant="h6" sx={{ color: primaryColor, mb: 2, borderBottom: `2px solid ${borderColor}`, pb: 1 }}>
              Specializations & Approach
            </Typography>
            <Grid container spacing={3} mb={4}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: lightTextColor }}>Specializations</InputLabel>
                  <Select
                    multiple
                    name="specializations"
                    value={formData.specializations}
                    onChange={handleSpecializationChange}
                    input={<OutlinedInput label="Specializations" />}
                    renderValue={(selected) => selected.join(', ')}
                    sx={{
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: borderColor },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: primaryColor },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: primaryColor },
                    }}
                  >
                    {specializationsList.map((name) => (
                      <MenuItem key={name} value={name}>
                        <Checkbox 
                          checked={formData.specializations.indexOf(name) > -1} 
                          sx={{ color: primaryColor, '&.Mui-checked': { color: primaryColor } }}
                        />
                        <ListItemText primary={name} />
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText sx={{ color: lightTextColor }}>
                    Select one or more areas you specialize in.
                  </FormHelperText>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField 
                  required 
                  fullWidth 
                  label="Approach/Therapeutic Modalities" 
                  name="approach_modalities" 
                  multiline 
                  rows={3}
                  value={formData.approach_modalities} 
                  onChange={handleInputChange}
                  helperText="E.g., CBT, EMDR, Psychodynamic. Describe your core therapeutic approaches."
                  sx={{
                    '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: borderColor }, '&:hover fieldset': { borderColor: primaryColor }, '&.Mui-focused fieldset': { borderColor: primaryColor } },
                    '& .MuiInputLabel-root': { color: lightTextColor, '&.Mui-focused': { color: primaryColor } },
                    '& .MuiFormHelperText-root': { color: lightTextColor },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  required 
                  fullWidth 
                  label="Languages Spoken" 
                  name="languages_spoken" 
                  value={formData.languages_spoken} 
                  onChange={handleInputChange}
                  helperText="Comma-separated, e.g., English, Spanish, French"
                  sx={{
                    '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: borderColor }, '&:hover fieldset': { borderColor: primaryColor }, '&.Mui-focused fieldset': { borderColor: primaryColor } },
                    '& .MuiInputLabel-root': { color: lightTextColor, '&.Mui-focused': { color: primaryColor } },
                    '& .MuiFormHelperText-root': { color: lightTextColor },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  required 
                  fullWidth 
                  label="Client Focus" 
                  name="client_focus" 
                  value={formData.client_focus} 
                  onChange={handleInputChange}
                  helperText="E.g., Adults, Teens, LGBTQ+, Couples"
                  sx={{
                    '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: borderColor }, '&:hover fieldset': { borderColor: primaryColor }, '&.Mui-focused fieldset': { borderColor: primaryColor } },
                    '& .MuiInputLabel-root': { color: lightTextColor, '&.Mui-focused': { color: primaryColor } },
                    '& .MuiFormHelperText-root': { color: lightTextColor },
                  }}
                />
              </Grid>
            </Grid>

            {/* Section 3: Pricing and Payment */}
            <Typography variant="h6" sx={{ color: primaryColor, mb: 2, borderBottom: `2px solid ${borderColor}`, pb: 1 }}>
              Pricing & Session Details
            </Typography>
            <Grid container spacing={3} mb={4}>
              <Grid item xs={12}>
                <FormControl component="fieldset" fullWidth>
                  <Typography variant="body1" sx={{ color: textColor, mb: 1, fontWeight: 'medium' }}>
                    Session Fee Structure:
                  </Typography>
                  <RadioGroup
                    row
                    name="session_type_choice"
                    value={formData.session_type_choice}
                    onChange={handleInputChange}
                  >
                    <FormControlLabel 
                      value="paid" 
                      control={<Radio sx={{ color: primaryColor, '&.Mui-checked': { color: primaryColor } }} />} 
                      label={<Typography sx={{ color: textColor }}>Paid Sessions</Typography>} 
                    />
                    <FormControlLabel 
                      value="free" 
                      control={<Radio sx={{ color: primaryColor, '&.Mui-checked': { color: primaryColor } }} />} 
                      label={<Typography sx={{ color: textColor }}>Offer Free Consultation</Typography>} 
                    />
                  </RadioGroup>
                </FormControl>
              </Grid>

              {formData.session_type_choice === 'paid' ? (
                <>
                  <Grid item xs={12} sm={4}>
                    <TextField 
                      required 
                      fullWidth 
                      label="Hourly Rate (Ksh)" 
                      name="hourly_rate" 
                      type="number"
                      value={formData.hourly_rate} 
                      onChange={handleInputChange}
                      inputProps={{ min: 0 }}
                      sx={{
                        '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: borderColor }, '&:hover fieldset': { borderColor: primaryColor }, '&.Mui-focused fieldset': { borderColor: primaryColor } },
                        '& .MuiInputLabel-root': { color: lightTextColor, '&.Mui-focused': { color: primaryColor } },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField 
                      fullWidth 
                      label="Weekly Rate (Ksh, Optional)" 
                      name="rate_per_week" 
                      type="number"
                      value={formData.rate_per_week} 
                      onChange={handleInputChange}
                      inputProps={{ min: 0 }}
                      sx={{
                        '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: borderColor }, '&:hover fieldset': { borderColor: primaryColor }, '&.Mui-focused fieldset': { borderColor: primaryColor } },
                        '& .MuiInputLabel-root': { color: lightTextColor, '&.Mui-focused': { color: primaryColor } },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField 
                      fullWidth 
                      label="Monthly Rate (Ksh, Optional)" 
                      name="rate_per_month" 
                      type="number"
                      value={formData.rate_per_month} 
                      onChange={handleInputChange}
                      inputProps={{ min: 0 }}
                      sx={{
                        '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: borderColor }, '&:hover fieldset': { borderColor: primaryColor }, '&.Mui-focused fieldset': { borderColor: primaryColor } },
                        '& .MuiInputLabel-root': { color: lightTextColor, '&.Mui-focused': { color: primaryColor } },
                      }}
                    />
                  </Grid>
                </>
              ) : (
                <Grid item xs={12} sm={6}>
                  <TextField 
                    fullWidth 
                    label="Number of Free Sessions Offered" 
                    name="free_sessions_offered" 
                    type="number"
                    value={formData.free_sessions_offered} 
                    onChange={handleInputChange}
                    inputProps={{ min: 0 }}
                    helperText="e.g., '1' for one free introductory session."
                    sx={{
                      '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: borderColor }, '&:hover fieldset': { borderColor: primaryColor }, '&.Mui-focused fieldset': { borderColor: primaryColor } },
                      '& .MuiInputLabel-root': { color: lightTextColor, '&.Mui-focused': { color: primaryColor } },
                      '& .MuiFormHelperText-root': { color: lightTextColor },
                    }}
                  />
                </Grid>
              )}
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.insurance_accepted}
                      onChange={handleInputChange}
                      name="insurance_accepted"
                      sx={{ color: primaryColor, '&.Mui-checked': { color: primaryColor } }}
                    />
                  }
                  label={<Typography sx={{ color: textColor }}>Do you accept insurance?</Typography>}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField 
                  fullWidth 
                  label="Mpesa Phone Number (for payments)" 
                  name="mpesa_phone_number" 
                  value={formData.mpesa_phone_number} 
                  onChange={handleInputChange}
                  helperText="Enter the phone number associated with your Mpesa account for client payments."
                  sx={{
                    '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: borderColor }, '&:hover fieldset': { borderColor: primaryColor }, '&.Mui-focused fieldset': { borderColor: primaryColor } },
                    '& .MuiInputLabel-root': { color: lightTextColor, '&.Mui-focused': { color: primaryColor } },
                    '& .MuiFormHelperText-root': { color: lightTextColor },
                  }}
                />
              </Grid>
            </Grid>

            {/* Section 4: Document Uploads */}
            <Typography variant="h6" sx={{ color: primaryColor, mb: 2, borderBottom: `2px solid ${borderColor}`, pb: 1 }}>
              Document Uploads
            </Typography>
            <Grid container spacing={3} mb={4}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth error={!files.license_document && submitting}>
                  <Button 
                    variant="outlined" 
                    component="label" 
                    sx={{ 
                      py: 2,
                      borderColor: primaryColor,
                      color: primaryColor,
                      '&:hover': { borderColor: buttonHoverColor },
                    }}
                  >
                    Upload License
                    <Input type="file" name="license_document" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" />
                  </Button>
                  {files.license_document ? 
                    <FormHelperText sx={{ color: textColor }}>{files.license_document.name}</FormHelperText> : 
                    <FormHelperText sx={{ color: lightTextColor }}>PDF, JPG, PNG</FormHelperText>}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth error={!files.id_document && submitting}>
                  <Button 
                    variant="outlined" 
                    component="label" 
                    sx={{ 
                      py: 2,
                      borderColor: primaryColor,
                      color: primaryColor,
                      '&:hover': { borderColor: buttonHoverColor },
                    }}
                  >
                    Upload ID Document
                    <Input type="file" name="id_document" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" />
                  </Button>
                  {files.id_document ? 
                    <FormHelperText sx={{ color: textColor }}>{files.id_document.name}</FormHelperText> : 
                    <FormHelperText sx={{ color: lightTextColor }}>PDF, JPG, PNG</FormHelperText>}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth error={!files.professional_photo && submitting}>
                  <Button 
                    variant="outlined" 
                    component="label" 
                    sx={{ 
                      py: 2,
                      borderColor: primaryColor,
                      color: primaryColor,
                      '&:hover': { borderColor: buttonHoverColor },
                    }}
                  >
                    Upload Profile Photo
                    <Input type="file" name="professional_photo" accept="image/*" onChange={handleFileChange} />
                  </Button>
                  {files.professional_photo ? 
                    <FormHelperText sx={{ color: textColor }}>{files.professional_photo.name}</FormHelperText> : 
                    <FormHelperText sx={{ color: lightTextColor }}>JPG, PNG</FormHelperText>}
                </FormControl>
              </Grid>
            </Grid>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={submitting}
              sx={{ 
                mt: 4, 
                py: 1.5, 
                fontSize: '1.1rem',
                backgroundColor: primaryColor,
                '&:hover': { backgroundColor: buttonHoverColor }
              }}
            >
              {submitting ? <CircularProgress size={26} color="inherit" /> : 'Submit Application'}
            </Button>
          </Box>
        </Paper>
      </Container>
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
    </Box>
  );
}
