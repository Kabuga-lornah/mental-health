import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Container,
  Snackbar,
  Alert,
  CircularProgress
} from "@mui/material";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom"; // Import Link
import { useAuth } from "../context/AuthContext";

export default function TherapistApplicationForm() {
  const { user, token, loading: authLoading } = useAuth(); // Destructure authLoading
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    license_number: "",
    id_number: "",
    motivation_statement: "",
  });
  const [files, setFiles] = useState({
    license_document: null,
    id_document: null,
    professional_photo: null,
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true); // Changed to true initially to handle authLoading
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [hasSubmittedApplication, setHasSubmittedApplication] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState(null); // To store the actual application status

  // Refs for file inputs (no longer strictly needed for validation but kept for potential future use)
  const fileInputRefs = {
    license_document: useRef(null),
    id_document: useRef(null),
    professional_photo: useRef(null),
  };

  // Check if user is already a therapist and if they have submitted an application
  useEffect(() => {
    const checkApplicationStatus = async () => {
      // If authLoading, don't proceed yet
      if (authLoading) return;

      // If user is not logged in or not marked as is_therapist (meaning they didn't select "Apply as Therapist" during registration)
      if (!user || !user.is_therapist) {
        setLoading(false);
        return; // Early exit, will be handled by the initial render checks
      }

      setLoading(true);
      try {
        // Fetch the user's *own* application status
        // A dedicated endpoint for a user to check their application status is ideal.
        // For now, we might need a workaround or assume the user object reflects verification status.
        // The /api/user/ endpoint should already contain `is_verified` and potentially other application states.
        // However, to check *pending* applications, a therapist needs to query their own application.
        // Since we don't have a specific `GET /api/therapist-applications/me/` yet,
        // we'll rely on the `is_verified` field on the user object after login, and only allow submission if `is_verified` is false.
        // We can extend this with a direct check for application existence if needed.

        // A better approach: if user.is_therapist is true, check if they have a pending application
        // This requires an API endpoint for a user to query their own application.
        // For simplicity, we'll assume if `user.is_therapist` is true AND `user.is_verified` is false,
        // they are either pending or haven't applied yet.
        // The backend `TherapistApplicationCreateView` already prevents duplicate submissions.

        // Let's directly check for existence of their application.
        // This requires the admin endpoint to be accessible (which it shouldn't be for non-admins)
        // OR a new endpoint: /api/therapist-applications/my-application/
        // For now, we will make a slightly less efficient call to the admin list and filter
        // (this would be inefficient in a real app but works for demonstration if secured correctly)
        try {
          const response = await axios.get('http://localhost:8000/api/admin/therapist-applications/', {
            headers: { Authorization: `Bearer ${token}` }
          });
          // Filter to find the current user's application
          const currentUserApplication = response.data.find(app => app.applicant === user.id);
          if (currentUserApplication) {
            setHasSubmittedApplication(true);
            setApplicationStatus(currentUserApplication.status);
            if (currentUserApplication.status === 'pending') {
              setSnackbarMessage("You have a pending therapist application. Please wait for review.");
              setSnackbarSeverity('info');
              setSnackbarOpen(true);
            } else if (currentUserApplication.status === 'approved') {
              setSnackbarMessage("Your therapist application has been approved!");
              setSnackbarSeverity('success');
              setSnackbarOpen(true);
            } else if (currentUserApplication.status === 'rejected') {
                setSnackbarMessage("Your therapist application was rejected. You may submit a new one if allowed.");
                setSnackbarSeverity('error');
                setSnackbarOpen(true);
            }
          } else {
            setHasSubmittedApplication(false);
            setApplicationStatus(null);
          }
        } catch (err) {
          if (err.response && err.response.status === 403) {
            // This is expected if a regular therapist or user without admin rights tries to hit admin endpoint
            console.log("Not authorized to view admin application list, assuming no existing application for self-check via this route or waiting for dedicated endpoint.");
            // If we cannot check if they applied, we let them proceed to try and apply.
            // The backend's `TherapistApplicationCreateView` will prevent duplicates.
          } else {
            console.error("Error checking application status:", err);
            setError("Failed to check application status.");
          }
        }

      } catch (err) {
        console.error("Error checking application status:", err.response?.data || err.message);
        setError("Failed to check application status.");
      } finally {
        setLoading(false);
      }
    };
    checkApplicationStatus();
  }, [user, token, authLoading]); // Depend on user, token, and authLoading

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFiles({ ...files, [e.target.name]: e.target.files[0] });
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!user || !user.is_therapist) {
      setError("You must be a registered user intending to be a therapist to submit an application. Please register first.");
      setLoading(false);
      return;
    }

    if (hasSubmittedApplication && applicationStatus !== 'rejected') { // Allow re-submission only if rejected
      setError(`You have already submitted a therapist application. Status: ${applicationStatus}. Please wait for review.`);
      setLoading(false);
      return;
    }

    // Manual validation for required fields, especially files
    if (
      !formData.license_number ||
      !formData.id_number ||
      !formData.motivation_statement ||
      !files.license_document ||
      !files.id_document ||
      !files.professional_photo
    ) {
      setError("Please fill in all required text fields and upload all required documents: License, ID, and Professional Photo.");
      setLoading(false);
      setSnackbarMessage("Please fill in all required fields and upload all documents.");
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    const data = new FormData();
    data.append('applicant', user.id); // Ensure `user.id` is available
    data.append('license_number', formData.license_number);
    data.append('id_number', formData.id_number);
    data.append('motivation_statement', formData.motivation_statement);
    data.append('license_document', files.license_document);
    data.append('id_document', files.id_document);
    data.append('professional_photo', files.professional_photo);

    try {
      await axios.post('http://localhost:8000/api/therapist-applications/submit/', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
      });
      setSnackbarMessage("Therapist application submitted successfully! Please wait for admin review.");
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setHasSubmittedApplication(true); // Mark as submitted
      setApplicationStatus('pending'); // Update status immediately
      // Optionally redirect after successful submission
      setTimeout(() => {
        navigate('/therapist/dashboard'); // Redirect to dashboard, where they'll see pending status
      }, 3000);
    } catch (err) {
      console.error("Application submission error:", err.response?.data || err.message);
      let errorMessage = "Failed to submit application.";
      if (err.response && err.response.data) {
        if (typeof err.response.data === 'object') {
          // Handle specific backend validation errors, especially for duplicate applications
          if (err.response.data.detail) {
            errorMessage = err.response.data.detail;
          } else if (err.response.data.applicant && err.response.data.applicant[0] === 'This field must be unique.') {
             errorMessage = "You have already submitted an application. Please await review.";
             setHasSubmittedApplication(true); // Ensure UI reflects this
             setApplicationStatus('pending'); // Assume it's pending if unique constraint hit
          } else {
            errorMessage = Object.values(err.response.data).flat().join(' ');
          }
        } else {
          errorMessage = err.response.data;
        }
      }
      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // Show loading while auth state is being determined
  if (authLoading || loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress sx={{ color: '#780000' }} />
        <Typography sx={{ ml: 2, color: '#780000' }}>Loading...</Typography>
      </Box>
    );
  }

  // If user is not logged in, redirect to login (ProtectedRoute handles this too, but for clarity)
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user is logged in but not marked as is_therapist, they shouldn't be here.
  // They should be redirected to register as a therapist.
  if (!user.is_therapist) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4, minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <Typography variant="h6" color="error" sx={{ mb: 2 }}>
          Access Denied: Only users intending to be therapists can submit this application.
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Please ensure you registered with the "Apply as Therapist" option.
        </Typography>
        <Button component={Link} to="/register" variant="contained" sx={{ backgroundColor: '#780000', '&:hover': { backgroundColor: '#5a0000' } }}>
          Register as Therapist
        </Button>
      </Box>
    );
  }

  // If therapist has already submitted and it's not rejected, show pending message
  if (hasSubmittedApplication && applicationStatus !== 'rejected') {
    return (
      <Box sx={{ textAlign: 'center', mt: 4, minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ color: '#780000', mb: 2, fontWeight: 'bold' }}>
          Application Status: {applicationStatus ? applicationStatus.charAt(0).toUpperCase() + applicationStatus.slice(1) : 'Unknown'}
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          You have already submitted your therapist application. It is currently under review by our administration team.
        </Typography>
        <Typography variant="body2" sx={{ mb: 3, fontStyle: 'italic' }}>
          Please check your <Link to="/therapist/dashboard" style={{ color: "#780000", textDecoration: "none", fontWeight: "bold" }}>Therapist Dashboard</Link> for updates or contact support if you have questions.
        </Typography>
        <Button component={Link} to="/" variant="contained" sx={{ backgroundColor: '#780000', '&:hover': { backgroundColor: '#5a0000' } }}>
          Go to Homepage
        </Button>
      </Box>
    );
  }

  // If therapist has submitted and it was rejected, allow re-submission
  if (hasSubmittedApplication && applicationStatus === 'rejected') {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          backgroundColor: "#fefae0",
          py: 4,
        }}
      >
        <Container maxWidth="md">
          <Paper elevation={3} sx={{ padding: 4, backgroundColor: "white", borderRadius: 2 }}>
            <Typography variant="h4" sx={{ color: "#780000", mb: 3, textAlign: "center", fontWeight: "bold" }}>
              Therapist Application (Re-submission)
            </Typography>
            <Typography color="error" sx={{ mb: 2, textAlign: "center" }}>
              Your previous application was rejected. Please review and re-submit with correct information.
            </Typography>
            {error && ( // Display submission errors
              <Typography color="error" sx={{ mb: 2, textAlign: "center" }}>
                {error}
              </Typography>
            )}
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="License Number"
                name="license_number"
                value={formData.license_number}
                onChange={handleChange}
                sx={{ mb: 2 }}
                required // Keep required for TextField as it's visible
                variant="outlined"
              />
              <Button
                variant="outlined"
                component="label"
                fullWidth
                sx={{ mb: 2, borderColor: '#780000', color: '#780000', '&:hover': { backgroundColor: 'rgba(120,0,0,0.05)' } }}
              >
                Upload License Document (PDF/Image)
                <input type="file" name="license_document" hidden onChange={handleFileChange} ref={fileInputRefs.license_document} /> {/* Removed 'required' */}
              </Button>
              {files.license_document && <Typography variant="caption" sx={{ mb: 2, display: 'block' }}>File selected: {files.license_document.name}</Typography>}

              <TextField
                fullWidth
                label="ID Number (National ID/Passport)"
                name="id_number"
                value={formData.id_number}
                onChange={handleChange}
                sx={{ mb: 2 }}
                required
                variant="outlined"
              />
              <Button
                variant="outlined"
                component="label"
                fullWidth
                sx={{ mb: 2, borderColor: '#780000', color: '#780000', '&:hover': { backgroundColor: 'rgba(120,0,0,0.05)' } }}
              >
                Upload ID Document (PDF/Image)
                <input type="file" name="id_document" hidden onChange={handleFileChange} ref={fileInputRefs.id_document} /> {/* Removed 'required' */}
              </Button>
              {files.id_document && <Typography variant="caption" sx={{ mb: 2, display: 'block' }}>File selected: {files.id_document.name}</Typography>}

              <Button
                variant="outlined"
                component="label"
                fullWidth
                sx={{ mb: 2, borderColor: '#780000', color: '#780000', '&:hover': { backgroundColor: 'rgba(120,0,0,0.05)' } }}
              >
                Upload Professional Photo
                <input type="file" name="professional_photo" hidden onChange={handleFileChange} ref={fileInputRefs.professional_photo} /> {/* Removed 'required' */}
              </Button>
              {files.professional_photo && <Typography variant="caption" sx={{ mb: 2, display: 'block' }}>File selected: {files.professional_photo.name}</Typography>}

              <TextField
                fullWidth
                label="Motivation Statement / Bio"
                name="motivation_statement"
                value={formData.motivation_statement}
                onChange={handleChange}
                multiline
                rows={5}
                sx={{ mb: 3 }}
                required
                variant="outlined"
                placeholder="Tell us about your experience, approach to therapy, and why you want to join MindWell."
              />

              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                sx={{
                  backgroundColor: "#780000",
                  "&:hover": { backgroundColor: "#5a0000" },
                  py: 1.5,
                  borderRadius: 2,
                }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : "Re-submit Application"}
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

  // Default case: User is a therapist and has not submitted an application yet or wants to submit for the first time after registration
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#fefae0",
        py: 4,
      }}
    >
      <Container maxWidth="md">
        <Paper elevation={3} sx={{ padding: 4, backgroundColor: "white", borderRadius: 2 }}>
          <Typography variant="h4" sx={{ color: "#780000", mb: 3, textAlign: "center", fontWeight: "bold" }}>
            Therapist Application
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, textAlign: "center", color: "#555" }}>
            Please provide your credentials for review by our administration team. All fields are required.
          </Typography>

          {error && ( // Display submission errors
            <Typography color="error" sx={{ mb: 2, textAlign: "center" }}>
              {error}
            </Typography>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="License Number"
              name="license_number"
              value={formData.license_number}
              onChange={handleChange}
              sx={{ mb: 2 }}
              required // Keep required for TextField as it's visible
              variant="outlined"
            />
            <Button
              variant="outlined"
              component="label"
              fullWidth
              sx={{ mb: 2, borderColor: '#780000', color: '#780000', '&:hover': { backgroundColor: 'rgba(120,0,0,0.05)' } }}
            >
              Upload License Document (PDF/Image)
              <input type="file" name="license_document" hidden onChange={handleFileChange} ref={fileInputRefs.license_document} /> {/* Removed 'required' */}
            </Button>
            {files.license_document && <Typography variant="caption" sx={{ mb: 2, display: 'block' }}>File selected: {files.license_document.name}</Typography>}

            <TextField
              fullWidth
              label="ID Number (National ID/Passport)"
              name="id_number"
              value={formData.id_number}
              onChange={handleChange}
              sx={{ mb: 2 }}
              required
              variant="outlined"
            />
            <Button
              variant="outlined"
              component="label"
              fullWidth
              sx={{ mb: 2, borderColor: '#780000', color: '#780000', '&:hover': { backgroundColor: 'rgba(120,0,0,0.05)' } }}
            >
              Upload ID Document (PDF/Image)
              <input type="file" name="id_document" hidden onChange={handleFileChange} ref={fileInputRefs.id_document} /> {/* Removed 'required' */}
            </Button>
            {files.id_document && <Typography variant="caption" sx={{ mb: 2, display: 'block' }}>File selected: {files.id_document.name}</Typography>}

            <Button
              variant="outlined"
              component="label"
              fullWidth
              sx={{ mb: 2, borderColor: '#780000', color: '#780000', '&:hover': { backgroundColor: 'rgba(120,0,0,0.05)' } }}
            >
              Upload Professional Photo
              <input type="file" name="professional_photo" hidden onChange={handleFileChange} ref={fileInputRefs.professional_photo} /> {/* Removed 'required' */}
            </Button>
            {files.professional_photo && <Typography variant="caption" sx={{ mb: 2, display: 'block' }}>File selected: {files.professional_photo.name}</Typography>}

            <TextField
              fullWidth
              label="Motivation Statement / Bio"
              name="motivation_statement"
              value={formData.motivation_statement}
              onChange={handleChange}
              multiline
              rows={5}
              sx={{ mb: 3 }}
              required
              variant="outlined"
              placeholder="Tell us about your experience, approach to therapy, and why you want to join MindWell."
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              sx={{
                backgroundColor: "#780000",
                "&:hover": { backgroundColor: "#5a0000" },
                py: 1.5,
                borderRadius: 2,
              }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Submit Application"}
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
