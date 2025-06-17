import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, Typography, Container, Paper, Grid, Button, CircularProgress, 
  Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions, 
  Select, MenuItem, FormControl, InputLabel, TextField, Chip, 
  RadioGroup, FormControlLabel, Radio, FormLabel, Divider,
  Card, CardContent, CardActions, IconButton, Collapse
} from '@mui/material';
import { 
  VideoCall, LocationOn, ExpandMore, ExpandLess, 
  Notes, Recommend, CheckCircle, Schedule 
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link, Navigate } from 'react-router-dom';

// Theme colors
const primaryColor = '#780000'; // Maroon
const secondaryColor = '#fefae0'; // Cream/light background
const buttonHoverColor = '#5a0000'; // Darker maroon for hover
const textColor = '#333'; // Dark text
const lightTextColor = '#666'; // Lighter text
const borderColor = '#ddd'; // Light border

export default function TherapistDashboard() {
  const { user, token, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // LIVE DATA STATES
  const [sessionRequests, setSessionRequests] = useState([]);
  const [scheduledSessions, setScheduledSessions] = useState([]);
  const [completedSessions, setCompletedSessions] = useState([]);
  
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  
  // Modal states
  const [openAcceptModal, setOpenAcceptModal] = useState(false);
  const [openSessionNotesModal, setOpenSessionNotesModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  
  // Session management states for modals
  const [sessionType, setSessionType] = useState('online');
  const [sessionLocation, setSessionLocation] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [keyTakeaways, setKeyTakeaways] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [nextSessionDate, setNextSessionDate] = useState('');
  
  // UI states
  const [expandedSessions, setExpandedSessions] = useState({});

  // Central function to fetch all required data from the backend
  const fetchData = useCallback(async () => {
    if (!user || !token) return;
    setLoading(true);
    setError(null);
    try {
      const [requestsRes, sessionsRes] = await Promise.all([
        axios.get('http://localhost:8000/api/therapist/session-requests/', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get('http://localhost:8000/api/therapist/sessions/', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      
      // Filter requests to show only pending ones
      setSessionRequests(requestsRes.data.filter(req => req.status === 'pending'));

      // Filter sessions into scheduled and completed
      const allSessions = sessionsRes.data;
      setScheduledSessions(allSessions.filter(s => s.status === 'scheduled'));
      setCompletedSessions(allSessions.filter(s => s.status === 'completed'));

    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [user, token]);

  useEffect(() => {
    if (!authLoading && user && user.is_therapist && user.is_verified) {
      fetchData();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, token, authLoading, fetchData]);

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };
  
  const handleAcceptRequest = (request) => {
    setSelectedRequest(request);
    setOpenAcceptModal(true);
  };
  
  const handleRejectRequest = async (requestId) => {
    try {
      await axios.patch(`http://localhost:8000/api/session-requests/${requestId}/`,
        { status: 'rejected' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSnackbarMessage("Session request rejected.");
      setSnackbarSeverity('info');
      setSnackbarOpen(true);
      fetchData(); // Re-fetch all data
    } catch (err) {
      console.error("Error rejecting request:", err);
      setSnackbarMessage("Failed to reject request.");
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleConfirmSession = async () => {
    if (!selectedRequest) return;
  
    try {
      // This single API call now handles accepting the request AND creating the session
      await axios.post('http://localhost:8000/api/therapist/sessions/create/', 
        {
          session_request: selectedRequest.id,
          session_type: sessionType,
          location: sessionType === 'physical' ? sessionLocation : '',
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      setSnackbarMessage("Session scheduled successfully!");
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      fetchData(); // Re-fetch data to update all lists
      handleCloseAcceptModal();
    } catch (err) {
      console.error("Error creating session:", err.response?.data || err.message);
      setSnackbarMessage(err.response?.data?.error || "Failed to schedule session.");
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };
  
  const handleOpenSessionNotes = (session) => {
    setSelectedSession(session);
    setSessionNotes(session.notes || '');
    setKeyTakeaways(session.key_takeaways || '');
    setRecommendations(session.recommendations || '');
    setFollowUpRequired(session.follow_up_required || false);
    setNextSessionDate(session.next_session_date || '');
    setOpenSessionNotesModal(true);
  };

  const handleSaveSessionNotes = async () => {
    if (!selectedSession) return;

    try {
      const sessionData = {
        notes: sessionNotes,
        key_takeaways: keyTakeaways,
        recommendations: recommendations,
        follow_up_required: followUpRequired,
        next_session_date: followUpRequired ? nextSessionDate : null,
        status: 'completed' // Mark the session as completed
      };
      
      // Use the new detail update view
      await axios.patch(`http://localhost:8000/api/therapist/sessions/${selectedSession.id}/`, sessionData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSnackbarMessage("Session notes saved and marked as complete!");
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      fetchData(); // Re-fetch data to move session from scheduled to completed
      handleCloseSessionNotesModal();
    } catch (err) {
      console.error("Error saving session notes:", err.response?.data || err);
      setSnackbarMessage("Failed to save session notes.");
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };
  
  const handleCloseAcceptModal = () => {
    setOpenAcceptModal(false);
    setSelectedRequest(null);
    setSessionType('online');
    setSessionLocation('');
  };

  const handleCloseSessionNotesModal = () => {
    setOpenSessionNotesModal(false);
    setSelectedSession(null);
    setSessionNotes('');
    setKeyTakeaways('');
    setRecommendations('');
    setFollowUpRequired(false);
    setNextSessionDate('');
  };

  const toggleSessionExpansion = (sessionId) => {
    setExpandedSessions(prev => ({ ...prev, [sessionId]: !prev[sessionId] }));
  };

  // Render logic for loading, auth checks, and main content...
  if (authLoading || loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress sx={{ color: primaryColor }} />
        <Typography sx={{ ml: 2, color: primaryColor }}>Loading Dashboard...</Typography>
      </Box>
    );
  }

  if (!user || !user.is_therapist) {
     return <Navigate to="/login" replace />;
  }

   if (!user.is_verified) {
    return <Navigate to="/therapist-apply" replace />;
  }
  
  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: secondaryColor }}>
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h4" sx={{ color: primaryColor, mb: 4, textAlign: 'center', fontWeight: 'bold' }}>
          Therapist Dashboard
        </Typography>

        {error ? (
          <Typography color="error" sx={{ textAlign: 'center', mt: 4 }}>{error}</Typography>
        ) : (
          <Grid container spacing={4}>
            {/* Session Requests */}
            <Grid item xs={12} md={6}>
              <Paper elevation={3} sx={{ p: 4, backgroundColor: 'white', borderRadius: 2, border: `1px solid ${borderColor}` }}>
                <Typography variant="h6" sx={{ color: primaryColor, mb: 2, fontWeight: 'bold' }}>
                  Pending Session Requests
                </Typography>
                <Box sx={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {sessionRequests.length === 0 ? (
                    <Typography sx={{ color: lightTextColor }}>No pending session requests.</Typography>
                  ) : (
                    sessionRequests.map((request) => (
                      <Card key={request.id} sx={{ mb: 2, border: `1px solid ${borderColor}` }}>
                        <CardContent>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: primaryColor }}>
                            {request.client_name}
                          </Typography>
                          <Typography variant="body2" sx={{ color: lightTextColor }}>
                            {request.client_email}
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1, color: textColor }}>
                            <strong>Date:</strong> {request.requested_date}<br />
                            <strong>Time:</strong> {request.requested_time}
                          </Typography>
                          {request.message && (
                            <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic', color: textColor }}>
                              "{request.message}"
                            </Typography>
                          )}
                        </CardContent>
                        <CardActions sx={{ justifyContent: 'space-between' }}>
                          <Button
                            variant="contained"
                            size="small"
                            sx={{ 
                              backgroundColor: primaryColor, 
                              '&:hover': { backgroundColor: buttonHoverColor },
                              fontWeight: 'bold'
                            }}
                            onClick={() => handleAcceptRequest(request)}
                          >
                            Accept
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            sx={{ 
                              borderColor: primaryColor, 
                              color: primaryColor,
                              '&:hover': { 
                                borderColor: buttonHoverColor,
                                backgroundColor: 'rgba(120, 0, 0, 0.04)'
                              },
                              fontWeight: 'bold'
                            }}
                            onClick={() => handleRejectRequest(request.id)}
                          >
                            Reject
                          </Button>
                        </CardActions>
                      </Card>
                    ))
                  )}
                </Box>
              </Paper>
            </Grid>

            {/* Scheduled Sessions */}
            <Grid item xs={12} md={6}>
              <Paper elevation={3} sx={{ p: 4, backgroundColor: 'white', borderRadius: 2, border: `1px solid ${borderColor}` }}>
                <Typography variant="h6" sx={{ color: primaryColor, mb: 2, fontWeight: 'bold' }}>
                  Scheduled Sessions
                </Typography>
                <Box sx={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {scheduledSessions.length === 0 ? (
                    <Typography sx={{ color: lightTextColor }}>No scheduled sessions.</Typography>
                  ) : (
                    scheduledSessions.map((session) => (
                      <Card key={session.id} sx={{ mb: 2, border: `1px solid ${borderColor}` }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: primaryColor, flexGrow: 1 }}>
                              {session.client_name}
                            </Typography>
                            <Chip
                              icon={session.session_type === 'online' ? <VideoCall /> : <LocationOn />}
                              label={session.session_type}
                              size="small"
                              sx={{
                                backgroundColor: session.session_type === 'online' ? 'rgba(120, 0, 0, 0.1)' : 'rgba(0, 0, 120, 0.1)',
                                color: session.session_type === 'online' ? primaryColor : '#000078',
                                fontWeight: 'bold'
                              }}
                            />
                          </Box>
                          <Typography variant="body2" sx={{ color: textColor }}>
                            <strong>Date:</strong> {session.session_date}<br />
                            <strong>Time:</strong> {session.session_time}
                          </Typography>
                        </CardContent>
                        <CardActions>
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<Notes />}
                            sx={{ 
                              backgroundColor: primaryColor, 
                              '&:hover': { backgroundColor: buttonHoverColor },
                              fontWeight: 'bold'
                            }}
                            onClick={() => handleOpenSessionNotes(session)}
                          >
                            Add Session Notes
                          </Button>
                        </CardActions>
                      </Card>
                    ))
                  )}
                </Box>
              </Paper>
            </Grid>

            {/* Completed Sessions */}
            <Grid item xs={12}>
              <Paper elevation={3} sx={{ p: 4, backgroundColor: 'white', borderRadius: 2, border: `1px solid ${borderColor}` }}>
                <Typography variant="h6" sx={{ color: primaryColor, mb: 2, fontWeight: 'bold' }}>
                  Recent Completed Sessions
                </Typography>
                <Box sx={{ maxHeight: '500px', overflowY: 'auto' }}>
                  {completedSessions.length === 0 ? (
                    <Typography sx={{ color: lightTextColor }}>No completed sessions.</Typography>
                  ) : (
                    completedSessions.map((session) => (
                      <Card key={session.id} sx={{ mb: 2, border: `1px solid ${borderColor}` }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: primaryColor, flexGrow: 1 }}>
                              {session.client_name}
                            </Typography>
                            <Chip
                              icon={<CheckCircle />}
                              label="Completed"
                              size="small"
                              sx={{
                                backgroundColor: 'rgba(0, 120, 0, 0.1)',
                                color: '#007800',
                                fontWeight: 'bold'
                              }}
                            />
                            <IconButton
                              onClick={() => toggleSessionExpansion(session.id)}
                              size="small"
                              sx={{ ml: 1, color: primaryColor }}
                            >
                              {expandedSessions[session.id] ? <ExpandLess /> : <ExpandMore />}
                            </IconButton>
                          </Box>
                          <Typography variant="body2" sx={{ color: textColor }}>
                            <strong>Date:</strong> {session.session_date} | <strong>Time:</strong> {session.session_time}
                          </Typography>
                          
                          <Collapse in={expandedSessions[session.id]}>
                            <Box sx={{ mt: 2 }}>
                              <Divider sx={{ my: 2, borderColor: borderColor }} />
                              {session.notes && (
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: primaryColor }}>Session Notes:</Typography>
                                  <Typography variant="body2" sx={{ mt: 1, color: textColor }}>{session.notes}</Typography>
                                </Box>
                              )}
                              {session.key_takeaways && (
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: primaryColor }}>Key Takeaways:</Typography>
                                  <Typography variant="body2" sx={{ mt: 1, color: textColor }}>{session.key_takeaways}</Typography>
                                </Box>
                              )}
                              {session.recommendations && (
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: primaryColor }}>Recommendations:</Typography>
                                  <Typography variant="body2" sx={{ mt: 1, color: textColor }}>{session.recommendations}</Typography>
                                </Box>
                              )}
                              {session.follow_up_required && (
                                <Box sx={{ mb: 2 }}>
                                  <Chip 
                                    icon={<Schedule />} 
                                    label={`Follow-up: ${session.next_session_date}`} 
                                    sx={{
                                      backgroundColor: 'rgba(120, 0, 0, 0.1)',
                                      color: primaryColor,
                                      fontWeight: 'bold'
                                    }}
                                    size="small" 
                                  />
                                </Box>
                              )}
                            </Box>
                          </Collapse>
                        </CardContent>
                        <CardActions>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Notes />}
                            sx={{ 
                              borderColor: primaryColor, 
                              color: primaryColor,
                              '&:hover': { 
                                borderColor: buttonHoverColor,
                                backgroundColor: 'rgba(120, 0, 0, 0.04)'
                              },
                              fontWeight: 'bold'
                            }}
                            onClick={() => handleOpenSessionNotes(session)}
                          >
                            Edit Notes
                          </Button>
                        </CardActions>
                      </Card>
                    ))
                  )}
                </Box>
              </Paper>
            </Grid>
          </Grid>
        )}
      </Container>
      
      {/* Accept Session Modal */}
      <Dialog open={openAcceptModal} onClose={handleCloseAcceptModal} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: primaryColor, fontWeight: 'bold' }}>Schedule Session</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 3, color: textColor }}>
            <strong>Client:</strong> {selectedRequest?.client_name}<br />
            <strong>Requested Date:</strong> {selectedRequest?.requested_date}<br />
            <strong>Requested Time:</strong> {selectedRequest?.requested_time}
          </Typography>
          <FormControl component="fieldset" sx={{ mb: 3 }}>
            <FormLabel component="legend" sx={{ color: primaryColor, fontWeight: 'bold' }}>Session Type</FormLabel>
            <RadioGroup value={sessionType} onChange={(e) => setSessionType(e.target.value)} row>
              <FormControlLabel 
                value="online" 
                control={<Radio sx={{ color: primaryColor, '&.Mui-checked': { color: primaryColor } }} />} 
                label="Online Session" 
                sx={{ color: textColor }}
              />
              <FormControlLabel 
                value="physical" 
                control={<Radio sx={{ color: primaryColor, '&.Mui-checked': { color: primaryColor } }} />} 
                label="In-Person Session" 
                sx={{ color: textColor }}
              />
            </RadioGroup>
          </FormControl>
          {sessionType === 'physical' && (
            <TextField 
              fullWidth 
              label="Location/Address" 
              value={sessionLocation} 
              onChange={(e) => setSessionLocation(e.target.value)} 
              multiline 
              rows={2} 
              variant="outlined" 
              sx={{ mb: 2 }} 
              InputLabelProps={{
                style: { color: lightTextColor },
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCloseAcceptModal} 
            sx={{ 
              color: primaryColor,
              fontWeight: 'bold',
              '&:hover': {
                backgroundColor: 'rgba(120, 0, 0, 0.04)'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmSession} 
            variant="contained" 
            sx={{ 
              backgroundColor: primaryColor, 
              '&:hover': { backgroundColor: buttonHoverColor },
              fontWeight: 'bold'
            }}
          >
            Schedule Session
          </Button>
        </DialogActions>
      </Dialog>

      {/* Session Notes Modal */}
      <Dialog open={openSessionNotesModal} onClose={handleCloseSessionNotesModal} maxWidth="md" fullWidth>
        <DialogTitle sx={{ color: primaryColor, fontWeight: 'bold' }}>Session Notes & Recommendations</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 3, color: textColor }}>
            <strong>Client:</strong> {selectedSession?.client_name}<br />
            <strong>Session Date:</strong> {selectedSession?.session_date} at {selectedSession?.session_time}
          </Typography>
          <TextField 
            fullWidth 
            label="Session Notes" 
            value={sessionNotes} 
            onChange={(e) => setSessionNotes(e.target.value)} 
            multiline 
            rows={4} 
            variant="outlined" 
            sx={{ mb: 3 }} 
            placeholder="Detailed notes about the session..." 
            InputLabelProps={{
              style: { color: lightTextColor },
            }}
          />
          <TextField 
            fullWidth 
            label="Key Takeaways" 
            value={keyTakeaways} 
            onChange={(e) => setKeyTakeaways(e.target.value)} 
            multiline 
            rows={3} 
            variant="outlined" 
            sx={{ mb: 3 }} 
            placeholder="Main insights from this session..." 
            InputLabelProps={{
              style: { color: lightTextColor },
            }}
          />
          <TextField 
            fullWidth 
            label="Recommendations for Client" 
            value={recommendations} 
            onChange={(e) => setRecommendations(e.target.value)} 
            multiline 
            rows={4} 
            variant="outlined" 
            sx={{ mb: 3 }} 
            placeholder="Specific recommendations or actions for the client..." 
            InputLabelProps={{
              style: { color: lightTextColor },
            }}
          />
          <FormControlLabel 
            control={
              <input 
                type="checkbox" 
                checked={followUpRequired} 
                onChange={(e) => setFollowUpRequired(e.target.checked)} 
                style={{ 
                  accentColor: primaryColor,
                  marginRight: '8px'
                }} 
              />
            } 
            label="Follow-up session required" 
            sx={{ mb: 2, color: textColor }} 
          />
          {followUpRequired && (
            <TextField 
              fullWidth 
              label="Next Session Date" 
              type="date" 
              value={nextSessionDate} 
              onChange={(e) => setNextSessionDate(e.target.value)} 
              InputLabelProps={{ 
                shrink: true,
                style: { color: lightTextColor } 
              }} 
              sx={{ mb: 2 }} 
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCloseSessionNotesModal} 
            sx={{ 
              color: primaryColor,
              fontWeight: 'bold',
              '&:hover': {
                backgroundColor: 'rgba(120, 0, 0, 0.04)'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveSessionNotes} 
            variant="contained" 
            startIcon={<Recommend />} 
            sx={{ 
              backgroundColor: primaryColor, 
              '&:hover': { backgroundColor: buttonHoverColor },
              fontWeight: 'bold'
            }}
          >
            Save & Mark as Complete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbarSeverity} 
          sx={{ 
            width: '100%',
            backgroundColor: snackbarSeverity === 'error' ? '#ffebee' : 
                            snackbarSeverity === 'success' ? '#e8f5e9' : 
                            snackbarSeverity === 'info' ? '#e3f2fd' : '#fff8e1',
            color: textColor
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}