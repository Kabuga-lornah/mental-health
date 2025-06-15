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
  CircularProgress,
  Link as MuiLink
} from "@mui/material";
import axios from "axios";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function TherapistApplicationForm() {
  const { user, token, loading: authLoading } = useAuth();
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
  const [existingApplicationData, setExistingApplicationData] = useState(null);
  const [error, setError] = useState(null);
  // Initialize loading to true to ensure we wait for auth and application status
  const [loading, setLoading] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [hasSubmittedApplication, setHasSubmittedApplication] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState(null);

  const fileInputRefs = {
    license_document: useRef(null),
    id_document: useRef(null),
    professional_photo: useRef(null),
  };

  // Handler functions
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e) => {
    setFiles({
      ...files,
      [e.target.name]: e.target.files[0],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const submitData = new FormData();
    submitData.append("license_number", formData.license_number);
    submitData.append("id_number", formData.id_number);
    submitData.append("motivation_statement", formData.motivation_statement);

    // Make sure files are always appended for a new submission, even if it's a re-submission
    if (files.license_document) {
      submitData.append("license_document", files.license_document);
    } else {
        // If re-submitting and no new file selected, consider if existing one should be kept or re-uploaded
        // For simplicity and stricter re-submission, we'll require re-upload.
        // In a real app, you might differentiate between initial and re-submission to preserve files.
        setError("License document is required.");
        setSnackbarMessage("License document is required.");
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        setLoading(false);
        return;
    }
    if (files.id_document) {
      submitData.append("id_document", files.id_document);
    } else {
        setError("ID document is required.");
        setSnackbarMessage("ID document is required.");
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        setLoading(false);
        return;
    }
    if (files.professional_photo) {
      submitData.append("professional_photo", files.professional_photo);
    } else {
        setError("Professional photo is required.");
        setSnackbarMessage("Professional photo is required.");
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        setLoading(false);
        return;
    }


    try {
      // Use the specific endpoint for user's own applications if available, otherwise rely on backend preventing duplicates.
      // Assuming 'therapist-applications/' endpoint correctly handles the 'me/' logic on the backend for POST.
      await axios.post("http://localhost:8000/api/therapist-applications/", submitData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setSnackbarMessage("Application submitted successfully! You will be notified once reviewed.");
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

      // After successful submission, update state to show the submitted view
      setHasSubmittedApplication(true);
      setApplicationStatus('pending'); // Assuming new submissions are always pending
      setExistingApplicationData({
          ...formData, // Use current form data for display
          status: 'pending',
          // Assuming backend returns paths to uploaded files immediately or provides them
          license_document: URL.createObjectURL(files.license_document),
          id_document: URL.createObjectURL(files.id_document),
          professional_photo: URL.createObjectURL(files.professional_photo),
      });

    } catch (err) {
      console.error("Error submitting application:", err.response?.data || err.message);
      let errorMessage = err.response?.data?.detail || "Failed to submit application. Please try again.";
      if (err.response && err.response.data && err.response.data.applicant && err.response.data.applicant[0] === 'therapist application with this applicant already exists.') {
          errorMessage = "You have already submitted an application. Please await review.";
          // If this error occurs, it means an application already exists.
          // Re-fetch to get the actual status and display.
          const fetchAgain = async () => {
            try {
              const response = await axios.get('http://localhost:8000/api/therapist-applications/me/', {
                headers: { Authorization: `Bearer ${token}` }
              });
              setExistingApplicationData(response.data);
              setHasSubmittedApplication(true);
              setApplicationStatus(response.data.status);
            } catch (innerErr) {
              console.error("Error re-fetching after duplicate submission attempt:", innerErr);
              // Fallback if re-fetch fails
              setHasSubmittedApplication(true); // Assume submitted even if data not loaded
              setApplicationStatus('unknown');
            }
          };
          fetchAgain();
      }
      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  useEffect(() => {
    const fetchExistingApplication = async () => {
      if (authLoading) {
        setLoading(true); // Keep loading true while auth is loading
        return;
      }

      // If user is a verified therapist, redirect to dashboard
      if (user && user.is_therapist && user.is_verified) {
        navigate("/therapist/dashboard", { replace: true });
        return;
      }

      // If user is not logged in or not marked as intending to be a therapist
      if (!user || !user.is_therapist) {
        setLoading(false); // No application to fetch if not a therapist
        return;
      }

      setLoading(true); // Start loading for API call
      setError(null);
      try {
        // Attempt to fetch the user's own therapist application
        // This endpoint should be protected and only return the current user's application.
        const response = await axios.get('http://localhost:8000/api/therapist-applications/me/', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const appData = response.data;
        setExistingApplicationData(appData);
        setHasSubmittedApplication(true);
        setApplicationStatus(appData.status);

        // If application is approved, redirect to dashboard
        if (appData.status === 'approved') {
          navigate("/therapist/dashboard", { replace: true });
        }

      } catch (err) {
        if (err.response && err.response.status === 404) {
          // No application found for this user, so they need to submit one
          setHasSubmittedApplication(false);
          setApplicationStatus(null);
        } else {
          console.error("Error fetching existing application:", err.response?.data || err.message);
          setError("Failed to load application status.");
          setSnackbarMessage("Failed to load application status.");
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
        }
      } finally {
        setLoading(false); // End loading after API call completes
      }
    };
    fetchExistingApplication();
  }, [user, token, authLoading, navigate]);

  // --- Conditional Rendering Logic ---

  // 1. Show loading indicator while authentication or application data is being determined
  if (authLoading || loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress sx={{ color: '#780000' }} />
        <Typography sx={{ ml: 2, color: '#780000' }}>Loading application data...</Typography>
      </Box>
    );
  }

  // 2. Access control - if user is not a therapist (meaning they didn't register as one)
  if (!user || !user.is_therapist) {
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

  // 3. If therapist is already verified, redirect to their dashboard (should be caught by ProtectedRoute too)
  if (user.is_verified) {
    return <Navigate to="/therapist/dashboard" replace />;
  }

  // 4. If an application HAS been submitted (and is not null), display its status and details.
  // This is the CRITICAL block that prevents the form from showing if an application exists.
  // It also allows re-submission if the status is 'rejected'.
  if (hasSubmittedApplication && existingApplicationData) {
    // If application is rejected, allow re-submission.
    if (applicationStatus === 'rejected') {
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
                            {existingApplicationData.reviewer_notes && (
                                <>
                                    <br/>
                                    **Reviewer's Notes:** {existingApplicationData.reviewer_notes}
                                </>
                            )}
                        </Typography>
                        {error && (
                            <Typography color="error" sx={{ mb: 2, textAlign: "center" }}>
                                {error}
                            </Typography>
                        )}
                        <form onSubmit={handleSubmit}>
                            {/* Form fields for re-submission, similar to the initial form */}
                            <TextField
                                fullWidth
                                label="License Number"
                                name="license_number"
                                value={formData.license_number}
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
                                Upload License Document (PDF/IMAGE)
                                <input type="file" name="license_document" hidden onChange={handleFileChange} ref={fileInputRefs.license_document} />
                            </Button>
                            {files.license_document && <Typography variant="caption" sx={{ mb: 2, display: 'block' }}>File selected: {files.license_document.name}</Typography>}
                            {existingApplicationData.license_document && !files.license_document && <Typography variant="caption" sx={{ mb: 2, display: 'block', color: 'gray' }}>Previously uploaded: <MuiLink href={existingApplicationData.license_document} target="_blank" rel="noopener">View</MuiLink> (Re-upload if changed)</Typography>}

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
                                Upload ID Document (PDF/IMAGE)
                                <input type="file" name="id_document" hidden onChange={handleFileChange} ref={fileInputRefs.id_document} />
                            </Button>
                            {files.id_document && <Typography variant="caption" sx={{ mb: 2, display: 'block' }}>File selected: {files.id_document.name}</Typography>}
                            {existingApplicationData.id_document && !files.id_document && <Typography variant="caption" sx={{ mb: 2, display: 'block', color: 'gray' }}>Previously uploaded: <MuiLink href={existingApplicationData.id_document} target="_blank" rel="noopener">View</MuiLink> (Re-upload if changed)</Typography>}

                            <Button
                                variant="outlined"
                                component="label"
                                fullWidth
                                sx={{ mb: 2, borderColor: '#780000', color: '#780000', '&:hover': { backgroundColor: 'rgba(120,0,0,0.05)' } }}
                            >
                                Upload Professional Photo
                                <input type="file" name="professional_photo" hidden onChange={handleFileChange} ref={fileInputRefs.professional_photo} />
                            </Button>
                            {files.professional_photo && <Typography variant="caption" sx={{ mb: 2, display: 'block' }}>File selected: {files.professional_photo.name}</Typography>}
                            {existingApplicationData.professional_photo && !files.professional_photo && <Typography variant="caption" sx={{ mb: 2, display: 'block', color: 'gray' }}>Previously uploaded: <MuiLink href={existingApplicationData.professional_photo} target="_blank" rel="noopener">View</MuiLink> (Re-upload if changed)</Typography>}


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
    } else {
        // If application exists and is NOT rejected (i.e., pending or approved)
        return (
            <Box sx={{ minHeight: '100vh', backgroundColor: '#fefae0', py: 4 }}>
                <Container maxWidth="md">
                    <Paper elevation={3} sx={{ padding: 4, backgroundColor: "white", borderRadius: 2 }}>
                        <Typography variant="h4" sx={{ color: "#780000", mb: 3, textAlign: "center", fontWeight: "bold" }}>
                            Therapist Application Status
                        </Typography>
                        <Typography variant="h5" sx={{ color: '#780000', mb: 2, fontWeight: 'bold', textAlign: 'center' }}>
                            Status: {applicationStatus ? applicationStatus.charAt(0).toUpperCase() + applicationStatus.slice(1) : 'Unknown'}
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 3, textAlign: 'center' }}>
                            Your therapist application is currently {applicationStatus}.
                            {applicationStatus === 'pending' && ' You will gain access to the full therapist dashboard once your application is approved.'}
                        </Typography>

                        <Box sx={{ textAlign: 'left', mt: 4, mb: 4, p: 3, border: '1px solid #eee', borderRadius: 2, backgroundColor: '#f9f9f9' }}>
                            <Typography variant="h6" sx={{ color: "#780000", mb: 2, borderBottom: '1px solid #ccc', pb: 1 }}>
                                Submitted Details
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 1 }}>
                                <strong>License Number:</strong> {existingApplicationData.license_number}
                            </Typography>
                            {existingApplicationData.license_document && (
                                <Typography variant="body1" sx={{ mb: 1 }}>
                                    <strong>License Document:</strong> <MuiLink href={existingApplicationData.license_document} target="_blank" rel="noopener" sx={{ color: '#780000' }}>View Document</MuiLink>
                                </Typography>
                            )}
                            <Typography variant="body1" sx={{ mb: 1 }}>
                                <strong>ID Number:</strong> {existingApplicationData.id_number}
                            </Typography>
                            {existingApplicationData.id_document && (
                                <Typography variant="body1" sx={{ mb: 1 }}>
                                    <strong>ID Document:</strong> <MuiLink href={existingApplicationData.id_document} target="_blank" rel="noopener" sx={{ color: '#780000' }}>View Document</MuiLink>
                                </Typography>
                            )}
                            {existingApplicationData.professional_photo && (
                                <Box sx={{ my: 2, textAlign: 'center' }}>
                                    <img
                                        src={existingApplicationData.professional_photo}
                                        alt="Professional"
                                        style={{
                                            maxWidth: '100%',
                                            maxHeight: '300px',
                                            height: 'auto',
                                            borderRadius: '8px',
                                            objectFit: 'contain'
                                        }}
                                    />
                                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>Professional Photo</Typography>
                                </Box>
                            )}
                            <Typography variant="body1" sx={{ mt: 2 }}>
                                <strong>Motivation Statement:</strong>
                            </Typography>
                            <Paper variant="outlined" sx={{ p: 2, mt: 1, backgroundColor: 'white', whiteSpace: 'pre-wrap' }}>
                                <Typography variant="body2">{existingApplicationData.motivation_statement}</Typography>
                            </Paper>
                            {existingApplicationData.reviewer_notes && (
                                <>
                                    <Typography variant="body1" sx={{ mt: 2 }}>
                                        <strong>Reviewer Notes:</strong>
                                    </Typography>
                                    <Paper variant="outlined" sx={{ p: 2, mt: 1, backgroundColor: 'white', whiteSpace: 'pre-wrap' }}>
                                        <Typography variant="body2">{existingApplicationData.reviewer_notes}</Typography>
                                    </Paper>
                                </>
                            )}
                        </Box>

                        <Typography variant="body2" sx={{ mb: 3, fontStyle: 'italic', textAlign: 'center' }}>
                            Please check your <Link to="/therapist/dashboard" style={{ color: "#780000", textDecoration: "none", fontWeight: "bold" }}>Therapist Dashboard</Link> for updates or contact support if you have questions.
                        </Typography>
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
  }

  // 5. If no application exists (or was rejected and is now being re-submitted), show the form.
  // This is the default and fallback.
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

          {error && (
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
              required
              variant="outlined"
            />
            <Button
              variant="outlined"
              component="label"
              fullWidth
              sx={{ mb: 2, borderColor: '#780000', color: '#780000', '&:hover': { backgroundColor: 'rgba(120,0,0,0.05)' } }}
            >
              Upload License Document (PDF/IMAGE)
              <input type="file" name="license_document" hidden onChange={handleFileChange} ref={fileInputRefs.license_document} />
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
              Upload ID Document (PDF/IMAGE)
              <input type="file" name="id_document" hidden onChange={handleFileChange} ref={fileInputRefs.id_document} />
            </Button>
            {files.id_document && <Typography variant="caption" sx={{ mb: 2, display: 'block' }}>File selected: {files.id_document.name}</Typography>}

            <Button
              variant="outlined"
              component="label"
              fullWidth
              sx={{ mb: 2, borderColor: '#780000', color: '#780000', '&:hover': { backgroundColor: 'rgba(120,0,0,0.05)' } }}
            >
              Upload Professional Photo
              <input type="file" name="professional_photo" hidden onChange={handleFileChange} ref={fileInputRefs.professional_photo} />
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