// frontend_work/src/components/TherapistDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Typography, Box, Paper, Button, CircularProgress,
  Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
  Select, MenuItem, FormControl, InputLabel, TextField, Chip,
  RadioGroup, FormControlLabel, Radio, FormLabel, Divider,
  Card, CardContent, CardActions, IconButton, Collapse, Grid, // Added Grid import
  List, ListItem, ListItemText, ListItemSecondaryAction
} from '@mui/material';
import {
  VideoCall, LocationOn, ExpandMore, ExpandLess,
  CheckCircle, Cancel, Notes,
  InfoOutlined, AttachMoney, Category, Psychology // Added missing icon imports
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { format } from 'date-fns';

const primaryColor = '#4a90e2';
const secondaryColor = '#50e3c2';
const accentColor = '#f5a623';
const textColor = '#333333';
const lightTextColor = '#666666';
const borderColor = '#e0e0e0';
const buttonHoverColor = '#3a7bd5';

const TherapistDashboard = () => {
  const { user, token, authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [therapistProfile, setTherapistProfile] = useState(null);
  const [sessionRequests, setSessionRequests] = useState([]);
  const [expandedSessions, setExpandedSessions] = useState({});
  const [scheduledSessions, setScheduledSessions] = useState([]);
  const [completedSessions, setCompletedSessions] = useState([]);

  // Availability states
  const [availabilities, setAvailabilities] = useState([]);
  const [openAvailabilityModal, setOpenAvailabilityModal] = useState(false);
  const [editingAvailability, setEditingAvailability] = useState(null);
  const [dayOfWeek, setDayOfWeek] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [slotDuration, setSlotDuration] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const fetchData = useCallback(async () => {
    try {
      if (!user || !token) {
        setLoading(false);
        return;
      }

      // CORRECTED: Fetch therapist profile from /api/user/ endpoint
      const profileResponse = await axios.get('http://localhost:8000/api/user/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Assuming 'profileResponse.data' directly contains the user object
      setTherapistProfile(profileResponse.data);

      // Fetch session requests for the therapist
      const requestsResponse = await axios.get('http://localhost:8000/api/therapist/session-requests/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSessionRequests(requestsResponse.data);

      // Fetch all sessions for the therapist
      const sessionsResponse = await axios.get('http://localhost:8000/api/therapist/sessions/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const allSessions = sessionsResponse.data;
      setScheduledSessions(allSessions.filter(s => s.status === 'scheduled')); // Only 'scheduled'
      setCompletedSessions(allSessions.filter(s => s.status === 'completed')); // Only 'completed'

    } catch (err) {
      console.error("Error fetching dashboard data:", err.response?.data || err);
      // More specific error for 404 on profile fetch
      if (err.response && err.response.status === 404 && err.config.url.includes('/api/therapists/me/')) {
        setError("Profile data not found at the expected endpoint. Please check API routes.");
      } else {
        setError("Failed to load dashboard data. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  }, [user, token]);

  const fetchAvailability = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/therapists/me/availability/', { headers: { Authorization: `Bearer ${token}` } });
      setAvailabilities(response.data);
    } catch (err) {
      console.error("Error fetching availabilities:", err.response?.data || err);
    }
  }, [token]);

  useEffect(() => {
    if (!authLoading && user && user.is_therapist && user.is_verified) {
      fetchData();
      fetchAvailability();
    } else if (!authLoading && (!user || !user.is_therapist || !user.is_verified)) {
      setError("Access Denied. You must be a verified therapist to view this page.");
      setLoading(false);
    }
  }, [user, token, authLoading, fetchData, fetchAvailability]);

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  const handleUpdateRequest = async (requestId, status) => {
    try {
      await axios.patch(`http://localhost:8000/api/session-requests/${requestId}/`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSnackbarMessage(`Request ${status} successfully!`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      fetchData(); // Re-fetch data to update lists
    } catch (err) {
      console.error("Error updating request:", err.response?.data || err);
      setSnackbarMessage(err.response?.data?.detail || "Failed to update request.");
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleCreateSession = async (requestId) => {
    try {
      const request = sessionRequests.find(req => req.id === requestId);
      if (!request) {
        setSnackbarMessage("Session request not found.");
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }

      // Check if the request is paid, essential before creating session
      if (!request.is_paid) {
        setSnackbarMessage("Cannot create session: Payment not confirmed for this request.");
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }
      
      // Ensure the correct endpoint for creating a session from a request is used
      // Your urls.py defines 'therapist/sessions/create/' for this purpose
      const response = await axios.post('http://localhost:8000/api/therapist/sessions/create/',
        {
          session_request: request.id, // Pass the session_request ID
          // The backend view (TherapistSessionCreateView) will pull client, therapist,
          // requested_date, requested_time, duration_minutes from the session_request
          // You might send session_type, location, zoom_meeting_url if not implicitly handled
          session_type: request.session_type || 'online', // Default if not explicitly set in request
          location: request.location || null,
          // zoom_meeting_url: ... (if you want to send a default or hardcoded one from frontend)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSnackbarMessage("Session created and request confirmed successfully!");
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      fetchData(); // Re-fetch data to reflect changes
    } catch (err) {
      console.error("Error creating session:", err.response?.data || err);
      const errorMessage = err.response?.data?.detail || "Failed to create session.";
      setSnackbarMessage(errorMessage);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };


  const handleJoinSession = async (session) => {
    if (session.zoom_meeting_url) {
      window.open(session.zoom_meeting_url, '_blank');
    } else {
      setSnackbarMessage("Zoom meeting URL not available yet.");
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
    }
  };

  const toggleSessionExpand = (sessionId) => {
    setExpandedSessions(prev => ({ ...prev, [sessionId]: !prev[sessionId] }));
  };

  // Availability Handlers
  const handleOpenAddAvailabilityModal = () => {
    setEditingAvailability(null);
    setDayOfWeek('');
    setStartTime('');
    setEndTime('');
    setSlotDuration('');
    setOpenAvailabilityModal(true);
  };

  const handleOpenEditAvailabilityModal = (availability) => {
    setEditingAvailability(availability);
    setDayOfWeek(availability.day_of_week);
    setStartTime(availability.start_time);
    setEndTime(availability.end_time);
    setSlotDuration(availability.slot_duration || '');
    setOpenAvailabilityModal(true);
  };

  const handleCloseAvailabilityModal = () => {
    setOpenAvailabilityModal(false);
    setEditingAvailability(null);
  };

  const handleSaveAvailability = async () => {
    if (!dayOfWeek || !startTime || !endTime || !slotDuration) {
      setSnackbarMessage("All availability fields are required.");
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    try {
      const data = {
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        slot_duration: parseInt(slotDuration),
      };
      if (editingAvailability) {
        await axios.put(`http://localhost:8000/api/therapists/me/availability/${editingAvailability.id}/`, data, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSnackbarMessage("Availability updated successfully!");
      } else {
        await axios.post('http://localhost:8000/api/therapists/me/availability/', data, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSnackbarMessage("Availability added successfully!");
      }
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      fetchAvailability(); // Re-fetch list
      handleCloseAvailabilityModal();
    } catch (err) {
      console.error("Error saving availability:", err.response?.data || err);
      setSnackbarMessage(err.response?.data?.detail || "Failed to save availability.");
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleDeleteAvailability = async (idToDelete) => {
    try {
      await axios.delete(`http://localhost:8000/api/therapists/me/availability/${idToDelete}/`, { headers: { Authorization: `Bearer ${token}` } });
      setSnackbarMessage("Availability deleted successfully!");
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      fetchAvailability(); // Re-fetch list
    } catch (err) {
      console.error("Error deleting availability:", err.response?.data || err);
      setSnackbarMessage(err.response?.data?.detail || "Failed to delete availability.");
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };
  // Render logic for loading, auth checks, and main content...
  if (authLoading || loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!user || !user.is_therapist || !user.is_verified) {
    return (
      <Container sx={{ py: 8 }}>
        <Paper elevation={3} sx={{ p: 4, backgroundColor: 'white', borderRadius: 2 }}>
          <Typography variant="h6" color="error">
            {error || "Access Denied. You must be a verified therapist to view this page."}
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Box sx={{ backgroundColor: '#f4f6f8', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ color: primaryColor, fontWeight: 'bold', mb: 4 }}>
          Therapist Dashboard
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Profile Summary */}
        {therapistProfile && (
          <Paper elevation={3} sx={{ p: 4, mb: 4, backgroundColor: 'white', borderRadius: 2, border: `1px solid ${borderColor}` }}>
            <Typography variant="h5" sx={{ color: primaryColor, mb: 2, fontWeight: 'bold' }}>
              Welcome, Dr. {therapistProfile.first_name} {therapistProfile.last_name}!
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1" sx={{ color: lightTextColor }}>
                  <InfoOutlined sx={{ verticalAlign: 'middle', mr: 1, color: accentColor }} />
                  <strong>Status:</strong> {therapistProfile.is_verified ? 'Verified' : 'Pending Verification'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1" sx={{ color: lightTextColor }}>
                  <AttachMoney sx={{ verticalAlign: 'middle', mr: 1, color: accentColor }} />
                  <strong>Hourly Rate:</strong> KES {therapistProfile.hourly_rate || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body1" sx={{ color: lightTextColor }}>
                  <Category sx={{ verticalAlign: 'middle', mr: 1, color: accentColor }} />
                  <strong>Specializations:</strong> {therapistProfile.specializations || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body1" sx={{ color: lightTextColor }}>
                  <Psychology sx={{ verticalAlign: 'middle', mr: 1, color: accentColor }} />
                  <strong>Approach & Modalities:</strong> {therapistProfile.approach_modalities || 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Session Requests */}
        <Paper elevation={3} sx={{ p: 4, mb: 4, backgroundColor: 'white', borderRadius: 2, border: `1px solid ${borderColor}` }}>
          <Typography variant="h6" sx={{ color: primaryColor, mb: 2, fontWeight: 'bold' }}>
            New Session Requests
          </Typography>
          {sessionRequests.length === 0 ? (
            <Typography sx={{ color: lightTextColor }}>No pending session requests.</Typography>
          ) : (
            sessionRequests.map((request) => (
              <Card key={request.id} variant="outlined" sx={{ mb: 2, borderColor: borderColor }}>
                <CardContent>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    Client: {request.client_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Requested Date: {format(new Date(request.requested_date), 'PPP')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Requested Time: {request.requested_time}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Session Duration: {request.session_duration} minutes
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Message: {request.message || 'No message provided.'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Payment Status: {request.is_paid ? <Chip label="Paid" color="success" size="small" /> : <Chip label="Pending Payment" color="warning" size="small" />}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    startIcon={<CheckCircle />}
                    sx={{ color: 'green', '&:hover': { backgroundColor: 'rgba(0,128,0,0.05)' } }}
                    onClick={() => handleCreateSession(request.id)}
                    disabled={!request.is_paid}
                  >
                    Confirm & Create Session
                  </Button>
                  <Button
                    size="small"
                    startIcon={<Cancel />}
                    sx={{ color: 'red', '&:hover': { backgroundColor: 'rgba(255,0,0,0.05)' } }}
                    onClick={() => handleUpdateRequest(request.id, 'rejected')}
                  >
                    Reject
                  </Button>
                </CardActions>
              </Card>
            ))
          )}
        </Paper>

        {/* Scheduled Sessions */}
        <Paper elevation={3} sx={{ p: 4, mb: 4, backgroundColor: 'white', borderRadius: 2, border: `1px solid ${borderColor}` }}>
          <Typography variant="h6" sx={{ color: primaryColor, mb: 2, fontWeight: 'bold' }}>
            Scheduled Sessions ({scheduledSessions.length})
          </Typography>
          {scheduledSessions.length === 0 ? (
            <Typography sx={{ color: lightTextColor }}>No upcoming scheduled sessions.</Typography>
          ) : (
            scheduledSessions.map((session) => (
              <Card key={session.id} variant="outlined" sx={{ mb: 2, borderColor: borderColor }}>
                <CardContent>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    Client: {session.client_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Date: {format(new Date(session.session_date), 'PPP')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Time: {session.session_time}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Duration: {session.duration_minutes} minutes
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Session Type: {session.session_type}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Status: <Chip label={session.status} color={session.status === 'scheduled' ? 'info' : 'success'} size="small" />
                  </Typography>
                </CardContent>
                <CardActions disableSpacing>
                  <Button
                    size="small"
                    startIcon={<VideoCall />}
                    sx={{ color: primaryColor, '&:hover': { backgroundColor: 'rgba(74,144,226,0.05)' } }}
                    onClick={() => handleJoinSession(session)}
                    disabled={!session.zoom_meeting_url}
                  >
                    Join Session
                  </Button>
                  <IconButton
                    onClick={() => toggleSessionExpand(session.id)}
                    aria-expanded={expandedSessions[session.id] || false}
                    aria-label="show more"
                    sx={{ marginLeft: 'auto' }}
                  >
                    {expandedSessions[session.id] ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                </CardActions>
                <Collapse in={expandedSessions[session.id]} timeout="auto" unmountOnExit>
                  <CardContent sx={{ pt: 0 }}>
                    <Typography paragraph variant="body2" color="text.secondary">
                      {session.zoom_meeting_url ? (
                        <a href={session.zoom_meeting_url} target="_blank" rel="noopener noreferrer">Zoom Link</a>
                      ) : (
                        "Zoom link will be available closer to the session time."
                      )}
                    </Typography>
                    {/* Add more session details if needed */}
                  </CardContent>
                </Collapse>
              </Card>
            ))
          )}
        </Paper>

        {/* Completed Sessions */}
        <Paper elevation={3} sx={{ p: 4, mb: 4, backgroundColor: 'white', borderRadius: 2, border: `1px solid ${borderColor}` }}>
          <Typography variant="h6" sx={{ color: primaryColor, mb: 2, fontWeight: 'bold' }}>
            Completed Sessions ({completedSessions.length})
          </Typography>
          {completedSessions.length === 0 ? (
            <Typography sx={{ color: lightTextColor }}>No completed sessions yet.</Typography>
          ) : (
            completedSessions.map((session) => (
              <Card key={session.id} variant="outlined" sx={{ mb: 2, borderColor: borderColor }}>
                <CardContent>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    Client: {session.client_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Date: {format(new Date(session.session_date), 'PPP')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Time: {session.session_time}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Session Type: {session.session_type}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Status: <Chip label="Completed" color="success" size="small" />
                  </Typography>
                  {session.notes && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      <Notes sx={{ verticalAlign: 'middle', mr: 0.5, fontSize: 'small' }} />
                      Notes: {session.notes.substring(0, 50)}...
                    </Typography>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </Paper>

        {/* Therapist Availability Section */}
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Paper elevation={3} sx={{ p: 4, backgroundColor: 'white', borderRadius: 2, border: `1px solid ${borderColor}` }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ color: primaryColor, fontWeight: 'bold' }}>
                Manage Your Availability
              </Typography>
              <Button
                variant="contained"
                size="small"
                sx={{
                  backgroundColor: primaryColor,
                  '&:hover': { backgroundColor: buttonHoverColor },
                  fontWeight: 'bold'
                }}
                onClick={handleOpenAddAvailabilityModal}
              >
                Add Availability
              </Button>
            </Box>
            {availabilities.length === 0 ? (
              <Typography sx={{ color: lightTextColor }}>No availability set. Add your schedule to start receiving requests.</Typography>
            ) : (
              <List>
                {availabilities.map((avail) => (
                  <ListItem key={avail.id} divider>
                    <ListItemText
                      primary={<Typography variant="body1" sx={{ fontWeight: 'bold' }}>{avail.day_of_week}</Typography>}
                      secondary={
                        <>
                          <Typography variant="body2" color="text.secondary">
                            {avail.start_time} - {avail.end_time} ({avail.slot_duration} min slots)
                          </Typography>
                          {avail.break_start_time && avail.break_end_time && (
                            <Typography variant="body2" color="text.secondary">
                              Break: {avail.break_start_time} - {avail.break_end_time}
                            </Typography>
                          )}
                        </>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" aria-label="edit" onClick={() => handleOpenEditAvailabilityModal(avail)}>
                        <Notes sx={{ color: primaryColor }} />
                      </IconButton>
                      <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteAvailability(avail.id)}>
                        <Cancel sx={{ color: 'red' }} />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Container>

        {/* Availability Modal (Add/Edit) */}
        <Dialog open={openAvailabilityModal} onClose={handleCloseAvailabilityModal} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ color: primaryColor, fontWeight: 'bold' }}>
            {editingAvailability ? 'Edit Availability' : 'Add New Availability'}
          </DialogTitle>
          <DialogContent dividers>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Day of Week</InputLabel>
              <Select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value)}
                label="Day of Week"
                disabled={!!editingAvailability} 
              >
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                  <MenuItem key={day} value={day}>{day}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Start Time (HH:MM)"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="End Time (HH:MM)"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Slot Duration (Minutes)"
              type="number"
              value={slotDuration}
              onChange={(e) => setSlotDuration(e.target.value)}
              sx={{ mb: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseAvailabilityModal} sx={{ color: primaryColor }}>Cancel</Button>
            <Button onClick={handleSaveAvailability} variant="contained" sx={{ backgroundColor: primaryColor, '&:hover': { backgroundColor: buttonHoverColor } }}>
              {editingAvailability ? 'Save Changes' : 'Add Availability'}
            </Button>
          </DialogActions>
        </Dialog>


        <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
          <Alert
            onClose={handleSnackbarClose}
            severity={snackbarSeverity}
            sx={{ width: '100%' }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default TherapistDashboard;