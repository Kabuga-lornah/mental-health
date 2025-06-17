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
    years_of_experience: '', // NEW: Years of experience
    is_free_consultation: false, // NEW: Free consultation option
    session_modes: 'online', // NEW: Session types: 'online', 'physical', 'both'
    physical_address: '', // NEW: Physical address for in-person sessions
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
        !formData.client_focus.trim() || !formData.years_of_experience
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

    // Conditional validation for session modes and physical address
    if ((formData.session_modes === 'physical' || formData.session_modes === 'both') && !formData.physical_address.trim()) {
        setError("Physical address is required if offering in-person sessions.");
        setSubmitting(false);
        return;
    }
    // For now, hourly_rate is not directly in the application model,
    // it's set on the User model upon approval via admin.
    // The application form is just collecting 'is_free_consultation'
    // and the logic on the user model will determine if hourly_rate is needed.

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
    
    // NEW: Append years of experience, free consultation, session modes, and physical address
    submissionFormData.append('years_of_experience', formData.years_of_experience);
    submissionFormData.append('is_free_consultation', formData.is_free_consultation);
    submissionFormData.append('session_modes', formData.session_modes);
    submissionFormData.append('physical_address', formData.physical_address);


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
              {/* NEW: Years of Experience field */}
              <Grid item xs={12}>
                <TextField 
                  required 
                  fullWidth 
                  label="Years of Experience" 
                  name="years_of_experience" 
                  type="number"
                  value={formData.years_of_experience} 
                  onChange={handleInputChange}
                  inputProps={{ min: 0 }}
                  sx={{
                    '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: borderColor }, '&:hover fieldset': { borderColor: primaryColor }, '&.Mui-focused fieldset': { borderColor: primaryColor } },
                    '& .MuiInputLabel-root': { color: lightTextColor, '&.Mui-focused': { color: primaryColor } },
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

            {/* Section 3: Pricing and Session Modes */}
            <Typography variant="h6" sx={{ color: primaryColor, mb: 2, borderBottom: `2px solid ${borderColor}`, pb: 1 }}>
              Session & Availability Details
            </Typography>
            <Grid container spacing={3} mb={4}>
                {/* NEW: Session Modes (Online/Physical/Both) */}
                <Grid item xs={12}>
                    <FormControl component="fieldset" fullWidth>
                        <Typography variant="body1" sx={{ color: textColor, mb: 1, fontWeight: 'medium' }}>
                            Session Delivery:
                        </Typography>
                        <RadioGroup
                            row
                            name="session_modes"
                            value={formData.session_modes}
                            onChange={handleInputChange}
                        >
                            <FormControlLabel 
                                value="online" 
                                control={<Radio sx={{ color: primaryColor, '&.Mui-checked': { color: primaryColor } }} />} 
                                label={<Typography sx={{ color: textColor }}>Online</Typography>} 
                            />
                            <FormControlLabel 
                                value="physical" 
                                control={<Radio sx={{ color: primaryColor, '&.Mui-checked': { color: primaryColor } }} />} 
                                label={<Typography sx={{ color: textColor }}>Physical (In-Person)</Typography>} 
                            />
                            <FormControlLabel 
                                value="both" 
                                control={<Radio sx={{ color: primaryColor, '&.Mui-checked': { color: primaryColor } }} />} 
                                label={<Typography sx={{ color: textColor }}>Both</Typography>} 
                            />
                        </RadioGroup>
                    </FormControl>
                </Grid>
                {/* NEW: Physical Address if physical sessions are offered */}
                {(formData.session_modes === 'physical' || formData.session_modes === 'both') && (
                    <Grid item xs={12}>
                        <TextField 
                            required 
                            fullWidth 
                            label="Physical Location/Address" 
                            name="physical_address" 
                            multiline 
                            rows={3}
                            value={formData.physical_address} 
                            onChange={handleInputChange}
                            helperText="Provide the address where in-person sessions will take place."
                            sx={{
                                '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: borderColor }, '&:hover fieldset': { borderColor: primaryColor }, '&.Mui-focused fieldset': { borderColor: primaryColor } },
                                '& .MuiInputLabel-root': { color: lightTextColor, '&.Mui-focused': { color: primaryColor } },
                                '& .MuiFormHelperText-root': { color: lightTextColor },
                            }}
                        />
                    </Grid>
                )}

              {/* NEW: Is Free Consultation */}
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.is_free_consultation}
                      onChange={handleInputChange}
                      name="is_free_consultation"
                      sx={{ color: primaryColor, '&.Mui-checked': { color: primaryColor } }}
                    />
                  }
                  label={<Typography sx={{ color: textColor }}>Offer a free consultation?</Typography>}
                />
              </Grid>

              {/* Conditionally render payment fields based on is_free_consultation */}
              {!formData.is_free_consultation && (
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
                  {/* These fields are no longer directly in the TherapistApplication model for the backend,
                      but can be collected here if desired and handled by the system logic later.
                      For now, they are removed from the form as the backend doesn't store them in TherapistApplication.
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
                  */}
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

                  {/* Mpesa phone number is not directly stored on the therapist application itself,
                      but can be a user profile field updated after approval.
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
                  */}
                </>
              )}
              
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
