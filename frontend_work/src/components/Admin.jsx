import React, { useState, useEffect } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Link as MuiLink,
  AppBar,
  Toolbar
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function AdminDashboard() {
  const { user, token, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [openReviewModal, setOpenReviewModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [reviewerNotes, setReviewerNotes] = useState('');

  const fetchApplications = async () => {
    // Only proceed if there's an authenticated admin user
    if (!user || !user.is_staff || !user.is_superuser || !token) {
      setLoading(false);
      setError("Access Denied: You must be an administrator to view this page.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:8000/api/admin/therapist-applications/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setApplications(response.data);
    } catch (err) {
      if (err.response && err.response.status === 403) {
        setError("Failed to load applications. You do not have permission to access this resource.");
      } else {
        setError("Failed to load therapist applications. Please ensure the backend server is running.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch data only after the authentication status has been determined
    if (!authLoading) {
      fetchApplications();
    }
  }, [user, token, authLoading]);

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const handleOpenReviewModal = (application) => {
    setSelectedApplication(application);
    setNewStatus(application.status);
    setReviewerNotes(application.reviewer_notes || '');
    setOpenReviewModal(true);
  };

  const handleCloseReviewModal = () => {
    setOpenReviewModal(false);
    setSelectedApplication(null);
    setNewStatus('');
    setReviewerNotes('');
  };

  const handleSaveReview = async () => {
    if (!selectedApplication || !newStatus) return;

    try {
      await axios.patch(`http://localhost:8000/api/admin/therapist-applications/${selectedApplication.id}/`,
        { status: newStatus, reviewer_notes: reviewerNotes },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      setSnackbarMessage("Application status updated successfully!");
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      fetchApplications(); // Refresh the list after update
      handleCloseReviewModal();
    } catch (err) {
      console.error("Error updating application status:", err.response?.data || err.message);
      setSnackbarMessage("Failed to update application status.");
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };
  
  // Show loading spinner while checking auth or fetching data
  if (authLoading || loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress sx={{ color: '#780000' }} />
        <Typography sx={{ ml: 2, color: '#780000' }}>Loading admin dashboard...</Typography>
      </Box>
    );
  }

  // Show access denied message if user is not an admin
  if (!user || !user.is_staff || !user.is_superuser) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4, minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <Typography variant="h6" color="error" sx={{ mb: 2 }}>
          Access Denied: You must be an administrator to view this page.
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Please log in with an administrator account.
        </Typography>
        <Button component={Link} to="/login" variant="contained" sx={{ backgroundColor: '#780000', '&:hover': { backgroundColor: '#5a0000' } }}>
          Go to Login
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#fefae0' }}>
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h4" sx={{ color: '#780000', mb: 4, textAlign: 'center', fontWeight: 'bold' }}>
          Admin Dashboard - Therapist Applications
        </Typography>

        {error ? (
          <Typography color="error" sx={{ textAlign: 'center', mt: 4 }}>{error}</Typography>
        ) : applications.length === 0 ? (
          <Typography variant="h6" sx={{ textAlign: 'center', color: '#780000', mt: 4 }}>
            No therapist applications found.
          </Typography>
        ) : (
          <Paper elevation={3} sx={{ p: 3, backgroundColor: 'white', borderRadius: 2 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', color: '#780000' }}>Applicant Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#780000' }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#780000' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#780000' }}>Submitted At</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#780000' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {applications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell>{app.applicant_full_name}</TableCell>
                      <TableCell>{app.applicant_email}</TableCell>
                      <TableCell sx={{ textTransform: 'capitalize', fontWeight: 'bold', color: app.status === 'pending' ? 'orange' : app.status === 'approved' ? 'green' : 'red' }}>
                        {app.status}
                      </TableCell>
                      <TableCell>{new Date(app.submitted_at).toLocaleString()}</TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          size="small"
                          sx={{ borderColor: '#780000', color: '#780000', '&:hover': { backgroundColor: 'rgba(120,0,0,0.05)' } }}
                          onClick={() => handleOpenReviewModal(app)}
                        >
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
      </Container>

      {/* Snackbar for feedback */}
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Review Application Modal */}
      <Dialog open={openReviewModal} onClose={handleCloseReviewModal} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: '#780000', fontWeight: 'bold' }}>Review Therapist Application</DialogTitle>
        <DialogContent dividers>
          {selectedApplication && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Applicant:</strong> {selectedApplication.applicant_full_name} ({selectedApplication.applicant_email})
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>License No:</strong> {selectedApplication.license_number} &nbsp;|&nbsp;
                <MuiLink href={selectedApplication.license_document} target="_blank" rel="noopener" sx={{ color: '#780000' }}>View License</MuiLink>
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>ID No:</strong> {selectedApplication.id_number} &nbsp;|&nbsp;
                <MuiLink href={selectedApplication.id_document} target="_blank" rel="noopener" sx={{ color: '#780000' }}>View ID</MuiLink>
              </Typography>
              {selectedApplication.professional_photo && (
                <Box sx={{ my: 2, textAlign: 'center' }}>
                  <img src={selectedApplication.professional_photo} alt="Professional" style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px' }} />
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>Professional Photo</Typography>
                </Box>
              )}
              <Typography variant="body1" sx={{ mt: 2, fontWeight: 'bold' }}>Motivation Statement:</Typography>
              <Paper variant="outlined" sx={{ p: 2, backgroundColor: '#f9f9f9', whiteSpace: 'pre-wrap' }}>
                <Typography variant="body2">{selectedApplication.motivation_statement}</Typography>
              </Paper>
              
              {/* Display Specializations */}
              <Typography variant="body1" sx={{ mt: 2, fontWeight: 'bold' }}>Specializations:</Typography>
              <Paper variant="outlined" sx={{ p: 2, backgroundColor: '#f9f9f9' }}>
                  <Typography variant="body2">
                  {selectedApplication.specializations || "Not specified"}
                  </Typography>
              </Paper>
            </Box>
          )}

          <FormControl fullWidth variant="outlined" sx={{ mt: 3, mb: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              label="Status"
            >
              <MenuItem value="pending">Pending Review</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Reviewer Notes (Optional)"
            multiline
            rows={4}
            variant="outlined"
            value={reviewerNotes}
            onChange={(e) => setReviewerNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReviewModal} sx={{ color: '#780000' }}>Cancel</Button>
          <Button onClick={handleSaveReview} variant="contained" sx={{ backgroundColor: '#780000', '&:hover': { backgroundColor: '#5a0000' } }}>Save Review</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
