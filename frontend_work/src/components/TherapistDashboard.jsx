import React, { useState, useEffect } from 'react';
import { Box, Typography, Container, Paper, Grid, Button, CircularProgress, Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link, Navigate } from 'react-router-dom';

export default function TherapistDashboard() {
  const { user, token, loading: authLoading } = useAuth();
  const [loadingContent, setLoadingContent] = useState(true);
  const [error, setError] = useState(null);
  const [sessionRequests, setSessionRequests] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [openStatusModal, setOpenStatusModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [newStatus, setNewStatus] = useState('');

  // Initial check and redirect for unverified therapists
  // This acts as a double-check to the ProtectedRoute
  if (!authLoading && user && user.is_therapist && !user.is_verified) {
    return <Navigate to="/therapist-apply" replace />;
  }

  const fetchSessionRequests = async () => {
    if (!user || !user.is_therapist || !user.is_verified || !token) {
      setLoadingContent(false);
      setSessionRequests([]);
      return;
    }
    setLoadingContent(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:8000/api/therapist/session-requests/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSessionRequests(response.data);
    } catch (err) {
      console.error("Error fetching session requests:", err);
      setError("Failed to load session requests.");
    } finally {
      setLoadingContent(false);
    }
  };

  const fetchClientJournalEntries = async () => {

    setJournalEntries([
        { client_name: "John Doe", latest_entry: "Feeling much better after our last session. Journaling helps clear my thoughts.", date: "2025-07-14" },
        { client_name: "Jane Smith", latest_entry: "Struggling with anxiety today. Used the AI assistant for coping strategies.", date: "2025-07-13" },
        { client_name: "Peter Jones", latest_entry: "Reflecting on my progress. It's been a tough but rewarding journey.", date: "2025-07-12" },
    ]);
  };

  useEffect(() => {
    if (!authLoading && user && user.is_therapist && user.is_verified) {
        fetchSessionRequests();
        fetchClientJournalEntries();
    } else if (!authLoading && !user) {
        setLoadingContent(false);
    }
  }, [user, token, authLoading]);

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const handleUpdateStatusClick = (request) => {
    setSelectedRequest(request);
    setNewStatus(request.status);
    setOpenStatusModal(true);
  };

  const handleCloseStatusModal = () => {
    setOpenStatusModal(false);
    setSelectedRequest(null);
    setNewStatus('');
  };

  const handleSaveStatus = async () => {
    if (!selectedRequest || !newStatus) return;

    try {
      await axios.patch(`http://localhost:8000/api/session-requests/${selectedRequest.id}/`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      setSnackbarMessage("Session request status updated successfully!");
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      fetchSessionRequests();
      handleCloseStatusModal();
    } catch (err) {
      console.error("Error updating status:", err.response?.data || err.message);
      setSnackbarMessage("Failed to update status. " + (err.response?.data?.status?.[0] || ""));
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  if (authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress sx={{ color: '#780000' }} />
        <Typography sx={{ ml: 2, color: '#780000' }}>Loading authentication...</Typography>
      </Box>
    );
  }


  if (!user || !user.is_therapist) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4, minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <Typography variant="h6" color="error" sx={{ mb: 2 }}>
          Access Denied: You are not authorized to view the therapist dashboard.
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Please ensure you are logged in with a therapist account.
        </Typography>
        <Button component={Link} to="/login" variant="contained" sx={{ backgroundColor: '#780000', '&:hover': { backgroundColor: '#5a0000' } }}>
          Login as Therapist
        </Button>
      </Box>
    );
  }

 
  if (!user.is_verified) {
  
    return null; 
  }


  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#fefae0' }}>
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h4" sx={{ color: '#780000', mb: 4, textAlign: 'center', fontWeight: 'bold' }}>
          Therapist Dashboard
        </Typography>

        {loadingContent ? ( // Use loadingContent here for data fetching
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
            <CircularProgress sx={{ color: '#780000' }} />
            <Typography sx={{ ml: 2, color: '#780000' }}>Loading your dashboard data...</Typography>
          </Box>
        ) : error ? (
          <Typography color="error" sx={{ textAlign: 'center', mt: 4 }}>{error}</Typography>
        ) : (
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Paper elevation={3} sx={{ p: 4, backgroundColor: 'white', borderRadius: 2 }}>
                <Typography variant="h6" sx={{ color: '#780000', mb: 2 }}>
                  Upcoming Session Requests
                </Typography>
                <Box sx={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {sessionRequests.length === 0 ? (
                    <Typography>No new session requests.</Typography>
                  ) : (
                    sessionRequests.map((request) => (
                      <Box key={request.id} sx={{ mb: 2, pb: 1.5, borderBottom: '1px solid #eee' }}>
                        <Typography>
                          <strong>Client:</strong> {request.client_name} ({request.client_email})<br />
                          <strong>Date:</strong> {request.requested_date || 'N/A'}<br />
                          <strong>Time:</strong> {request.requested_time || 'N/A'}<br />
                          <strong>Status:</strong> <span style={{ textTransform: 'capitalize', fontWeight: 'bold', color: request.status === 'pending' ? 'orange' : request.status === 'accepted' ? 'green' : 'red' }}>
                            {request.status}
                          </span><br />
                          <Typography variant="caption" color="text.secondary">Message: {request.message || 'No message.'}</Typography>
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          sx={{ mt: 1, borderColor: '#780000', color: '#780000', '&:hover': { backgroundColor: 'rgba(120,0,0,0.05)' } }}
                          onClick={() => handleUpdateStatusClick(request)}
                        >
                          Update Status
                        </Button>
                      </Box>
                    ))
                  )}
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper elevation={3} sx={{ p: 4, backgroundColor: 'white', borderRadius: 2 }}>
                <Typography variant="h6" sx={{ color: '#780000', mb: 2 }}>
                  Client Journal Entries (Placeholder)
                </Typography>
                <Box sx={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {journalEntries.length === 0 ? (
                    <Typography>No client journal entries available.</Typography>
                  ) : (
                    journalEntries.map((entry, index) => (
                      <Box key={index} sx={{ mb: 2, pb: 1.5, borderBottom: '1px solid #eee' }}>
                          <Typography>
                              <strong>Client Name:</strong> {entry.client_name}<br />
                              <strong>Latest Entry:</strong> "{entry.latest_entry}" ({entry.date})
                          </Typography>
                      </Box>
                    ))
                  )}
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Paper elevation={3} sx={{ p: 4, backgroundColor: 'white', borderRadius: 2 }}>
                <Typography variant="h6" sx={{ color: '#780000', mb: 2 }}>
                  Quick Actions
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <Button
                    variant="contained"
                    sx={{ backgroundColor: '#780000', '&:hover': { backgroundColor: '#5a0000' }, borderRadius: 2, px: 3, py: 1.5 }}
                  >
                    View All Clients
                  </Button>
                  <Button
                    variant="contained"
                    sx={{ backgroundColor: '#780000', '&:hover': { backgroundColor: '#5a0000' }, borderRadius: 2, px: 3, py: 1.5 }}
                  >
                    Schedule New Appointment
                  </Button>
                  <Button
                    variant="contained"
                    sx={{ backgroundColor: '#780000', '&:hover': { backgroundColor: '#5a0000' }, borderRadius: 2, px: 3, py: 1.5 }}
                  >
                    Review Journal Entries
                  </Button>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        )}
      </Container>

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>

      <Dialog open={openStatusModal} onClose={handleCloseStatusModal}>
        <DialogTitle sx={{ color: '#780000', fontWeight: 'bold' }}>Update Request Status</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            <strong>Client:</strong> {selectedRequest?.client_name}<br />
            <strong>Requested Date:</strong> {selectedRequest?.requested_date}<br />
            <strong>Requested Time:</strong> {selectedRequest?.requested_time}
          </Typography>
          <FormControl fullWidth variant="outlined">
            <InputLabel>Status</InputLabel>
            <Select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              label="Status"
            >
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="accepted">Accepted</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseStatusModal} sx={{ color: '#780000' }}>Cancel</Button>
          <Button onClick={handleSaveStatus} variant="contained" sx={{ backgroundColor: '#780000', '&:hover': { backgroundColor: '#5a0000' } }}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
