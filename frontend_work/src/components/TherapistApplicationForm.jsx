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
  CardActions
} from '@mui/material';
import { styled } from '@mui/material/styles';

const Input = styled('input')({
  display: 'none',
});

export default function TherapistApplicationForm() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    license_number: '',
    id_number: '',
    motivation_statement: '',
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
        if (err.response && err.response.status === 404) {
          console.log("No existing application found for this user. Ready for a new submission.");
          setExistingApplication(null);
        } else {
          console.error("Error fetching application status:", err);
          setError("Could not check your application status. Please refresh the page.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchExistingApplication();
  }, [token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
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

    // Validation
    if (!formData.license_number.trim()) {
      setError("License number is required.");
      setSubmitting(false);
      return;
    }

    if (!formData.id_number.trim()) {
      setError("ID number is required.");
      setSubmitting(false);
      return;
    }

    if (!formData.motivation_statement.trim()) {
      setError("Motivation statement is required.");
      setSubmitting(false);
      return;
    }

    if (!files.license_document || !files.id_document || !files.professional_photo) {
      setError("Please upload all required documents.");
      setSubmitting(false);
      return;
    }

    // Debug logging
    console.log("DEBUG: Form data being submitted:", formData);
    console.log("DEBUG: Files being uploaded:", {
      license_document: files.license_document?.name,
      id_document: files.id_document?.name,
      professional_photo: files.professional_photo?.name
    });
    console.log("DEBUG: User token exists:", !!token);
    console.log("DEBUG: User object:", user);

    const submissionFormData = new FormData();
    submissionFormData.append('license_number', formData.license_number);
    submissionFormData.append('id_number', formData.id_number);
    submissionFormData.append('motivation_statement', formData.motivation_statement);
    submissionFormData.append('license_document', files.license_document);
    submissionFormData.append('id_document', files.id_document);
    submissionFormData.append('professional_photo', files.professional_photo);
    
    // Debug: Log FormData contents
    console.log("DEBUG: FormData contents:");
    for (let [key, value] of submissionFormData.entries()) {
      console.log(`${key}:`, value);
    }

    try {
      const response = await axios.post('http://localhost:8000/api/therapist-applications/submit/', submissionFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("DEBUG: Application submitted successfully:", response.data);
      setExistingApplication(response.data);
      setSnackbar({ open: true, message: 'Application submitted successfully! You will be notified once it is reviewed.', severity: 'success' });

    } catch (err) {
        console.error("DEBUG: Full error object:", err);
        console.error("DEBUG: Error response:", err.response);
        console.error("DEBUG: Error response data:", err.response?.data);
        console.error("DEBUG: Error response status:", err.response?.status);
        console.error("DEBUG: Error response headers:", err.response?.headers);
        
        let errorMessage = "An unexpected error occurred. Please try again.";
        
        if (err.response && err.response.data) {
            const errors = err.response.data;
            console.log("DEBUG: Detailed error breakdown:", errors);
            
            // Handle different error formats
            if (typeof errors === 'string') {
                errorMessage = errors;
            } else if (errors.detail) {
                errorMessage = errors.detail;
            } else if (errors.non_field_errors) {
                errorMessage = Array.isArray(errors.non_field_errors) 
                    ? errors.non_field_errors.join(', ') 
                    : errors.non_field_errors;
            } else {
                // Handle field-specific errors
                const errorMessages = [];
                for (const [field, fieldErrors] of Object.entries(errors)) {
                    const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    const fieldErrorText = Array.isArray(fieldErrors) ? fieldErrors.join(', ') : fieldErrors;
                    errorMessages.push(`${fieldName}: ${fieldErrorText}`);
                }
                if (errorMessages.length > 0) {
                    errorMessage = errorMessages.join('\n');
                }
            }
        } else if (err.response?.status === 401) {
            errorMessage = "Authentication failed. Please log in again.";
        } else if (err.response?.status === 403) {
            errorMessage = "You don't have permission to submit an application.";
        } else if (err.message) {
            errorMessage = err.message;
        }
        
        setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress sx={{ color: '#780000' }} />
        <Typography sx={{ ml: 2, color: '#780000' }}>Checking your application status...</Typography>
      </Box>
    );
  }

  if (existingApplication) {
    return (
        <Container maxWidth="sm" sx={{ py: 8 }}>
            <Paper elevation={3} sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
                <Typography variant="h5" sx={{ color: '#780000', fontWeight: 'bold', mb: 2 }}>Application Status</Typography>
                <Typography variant="h6" sx={{ mb: 3 }}>
                    Your application is currently: <strong style={{ textTransform: 'capitalize', color: existingApplication.status === 'pending' ? 'orange' : existingApplication.status === 'approved' ? 'green' : 'red' }}>{existingApplication.status}</strong>
                </Typography>
                <Typography variant="body1" sx={{ mb: 4 }}>
                    Thank you for your submission. You will be notified via email of any updates.
                </Typography>
                <Button component={Link} to="/dashboard" variant="contained" sx={{ backgroundColor: '#780000', '&:hover': { backgroundColor: '#5a0000' } }}>
                    Go to Dashboard
                </Button>
            </Paper>
        </Container>
    );
  }

  return (
    <Container component="main" maxWidth="md" sx={{ py: 8 }}>
      <Paper elevation={6} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2 }}>
        <Typography component="h1" variant="h4" sx={{ color: '#780000', fontWeight: 'bold', textAlign: 'center', mb: 3 }}>
          Therapist Application
        </Typography>
        <Typography variant="body1" sx={{ textAlign: 'center', mb: 4 }}>
          Please provide your credentials for verification.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3, whiteSpace: 'pre-line' }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                id="license_number"
                label="License Number"
                name="license_number"
                value={formData.license_number}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                id="id_number"
                label="National ID Number"
                name="id_number"
                value={formData.id_number}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="motivation_statement"
                label="Motivation Statement"
                name="motivation_statement"
                multiline
                rows={5}
                value={formData.motivation_statement}
                onChange={handleInputChange}
                helperText="Briefly describe why you want to be a therapist on our platform."
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth error={!files.license_document && submitting}>
                <Button variant="outlined" component="label" sx={{ py: 2 }}>
                  Upload License
                  <Input type="file" name="license_document" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" />
                </Button>
                {files.license_document ? <FormHelperText>{files.license_document.name}</FormHelperText> : <FormHelperText>PDF, JPG, PNG</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth error={!files.id_document && submitting}>
                <Button variant="outlined" component="label" sx={{ py: 2 }}>
                  Upload ID Document
                  <Input type="file" name="id_document" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" />
                </Button>
                {files.id_document ? <FormHelperText>{files.id_document.name}</FormHelperText> : <FormHelperText>PDF, JPG, PNG</FormHelperText>}
                </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth error={!files.professional_photo && submitting}>
                <Button variant="outlined" component="label" sx={{ py: 2 }}>
                  Upload Profile Photo
                  <Input type="file" name="professional_photo" accept="image/*" onChange={handleFileChange} />
                </Button>
                {files.professional_photo ? <FormHelperText>{files.professional_photo.name}</FormHelperText> : <FormHelperText>JPG, PNG</FormHelperText>}
              </FormControl>
            </Grid>
          </Grid>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={submitting}
            sx={{ mt: 4, py: 1.5, fontSize: '1.1rem', backgroundColor: '#780000', '&:hover': { backgroundColor: '#5a0000' } }}
          >
            {submitting ? <CircularProgress size={26} color="inherit" /> : 'Submit Application'}
          </Button>
        </Box>
      </Paper>
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}