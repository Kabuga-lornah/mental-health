import React, { useState, useEffect } from 'react';
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

export default function TherapistDashboard() {
  const { user, token, loading: authLoading } = useAuth();
  const [loadingContent, setLoadingContent] = useState(true);
  const [error, setError] = useState(null);
  const [sessionRequests, setSessionRequests] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [completedSessions, setCompletedSessions] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  
  // Modal states
  const [openAcceptModal, setOpenAcceptModal] = useState(false);
  const [openSessionNotesModal, setOpenSessionNotesModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  
  // Session management states
  const [sessionType, setSessionType] = useState('online');
  const [sessionLocation, setSessionLocation] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [keyTakeaways, setKeyTakeaways] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [nextSessionDate, setNextSessionDate] = useState('');
  
  // UI states
  const [expandedSessions, setExpandedSessions] = useState({});

  // Initial check and redirect for unverified therapists
  if (!authLoading && user && user.is_therapist && !user.is_verified) {
    return <Navigate to="/therapist-apply" replace />;
  }

  const fetchAllSessions = async () => {
    if (!user || !user.is_therapist || !user.is_verified || !token) {
      setLoadingContent(false);
      setSessionRequests([]);
      return;
    }
    setLoadingContent(true);
    setError(null);
    try {
      // FIX: Corrected URL to match backend routes for fetching session requests.
      const response = await axios.get('http://localhost:8000/api/therapist/session-requests/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSessionRequests(response.data);
    } catch (err) {
      // This is the line from the original error log
      console.error("Error fetching sessions:", err);
      setError("Failed to load session requests.");
    } finally {
      setLoadingContent(false);
    }
  };

  const fetchActiveSessions = async () => {
    // This is mock data. You would replace this with an API call to fetch active/scheduled sessions.
    // Example: GET /api/therapist/sessions/?status=scheduled
    setActiveSessions([
      {
        id: 1,
        client_name: "John Doe",
        client_email: "john@example.com",
        session_date: "2025-06-20",
        session_time: "14:00",
        session_type: "online",
        status: "scheduled"
      }
    ]);
  };

  const fetchCompletedSessions = async () => {
    // This is mock data. You would replace this with an API call to fetch completed sessions.
    // Example: GET /api/therapist/sessions/?status=completed
    setCompletedSessions([
      {
        id: 1,
        client_name: "Jane Smith",
        client_email: "jane@example.com",
        session_date: "2025-06-15",
        session_time: "10:00",
        session_type: "physical",
        status: "completed",
        notes: "Client showed significant improvement in managing anxiety.",
        key_takeaways: "Breathing exercises are working well. Client is more confident.",
        recommendations: "Continue daily meditation, consider group therapy sessions.",
        follow_up_required: true,
        next_session_date: "2025-06-29"
      }
    ]);
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
      fetchAllSessions(); // Changed function name to match error log for clarity
      fetchActiveSessions();
      fetchCompletedSessions();
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

  const handleAcceptRequest = (request) => {
    setSelectedRequest(request);
    setSessionType('online');
    setSessionLocation('');
    setOpenAcceptModal(true);
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await axios.patch(`http://localhost:8000/api/session-requests/${requestId}/`,
        { status: 'rejected' },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      setSnackbarMessage("Session request rejected.");
      setSnackbarSeverity('info');
      setSnackbarOpen(true);
      fetchAllSessions();
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
      // Step 1: Update the original request status to 'accepted'
      await axios.patch(`http://localhost:8000/api/session-requests/${selectedRequest.id}/`,
        { status: 'accepted' },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
  
      // Step 2: Create a new session record
      // FIX: Changed 'client_id' to 'client' and ensured it passes the client's ID.
      // Also removed fields not in the SessionRequest model like 'location' and 'session_type'.
      const sessionData = {
        client: selectedRequest.client, // The backend expects a 'client' field with the user ID.
        therapist: user.id, // The therapist is the current user.
        requested_date: selectedRequest.requested_date,
        requested_time: selectedRequest.requested_time,
        status: 'accepted' // A new session created by a therapist is implicitly accepted.
      };
  
      await axios.post('http://localhost:8000/api/therapist/sessions/', sessionData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
  
      setSnackbarMessage("Session scheduled successfully!");
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      fetchAllSessions();
      fetchActiveSessions();
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
        status: 'completed'
      };

      await axios.patch(`http://localhost:8000/api/therapist/sessions/${selectedSession.id}/`, sessionData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      setSnackbarMessage("Session notes saved successfully!");
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      fetchActiveSessions();
      fetchCompletedSessions();
      handleCloseSessionNotesModal();
    } catch (err)      {
      console.error("Error saving session notes:", err);
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
    setExpandedSessions(prev => ({
      ...prev,
      [sessionId]: !prev[sessionId]
    }));
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

        {loadingContent ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
            <CircularProgress sx={{ color: '#780000' }} />
            <Typography sx={{ ml: 2, color: '#780000' }}>Loading your dashboard data...</Typography>
          </Box>
        ) : error ? (
          <Typography color="error" sx={{ textAlign: 'center', mt: 4 }}>{error}</Typography>
        ) : (
          <Grid container spacing={4}>
            {/* Session Requests */}
            <Grid item xs={12} md={6}>
              <Paper elevation={3} sx={{ p: 4, backgroundColor: 'white', borderRadius: 2 }}>
                <Typography variant="h6" sx={{ color: '#780000', mb: 2 }}>
                  Pending Session Requests
                </Typography>
                <Box sx={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {sessionRequests.filter(req => req.status === 'pending').length === 0 ? (
                    <Typography>No pending session requests.</Typography>
                  ) : (
                    sessionRequests.filter(req => req.status === 'pending').map((request) => (
                      <Card key={request.id} sx={{ mb: 2, border: '1px solid #eee' }}>
                        <CardContent>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#780000' }}>
                            {request.client_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {request.client_email}
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            <strong>Date:</strong> {request.requested_date}<br />
                            <strong>Time:</strong> {request.requested_time}
                          </Typography>
                          {request.message && (
                            <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                              "{request.message}"
                            </Typography>
                          )}
                        </CardContent>
                        <CardActions sx={{ justifyContent: 'space-between' }}>
                          <Button
                            variant="contained"
                            size="small"
                            sx={{ backgroundColor: '#780000', '&:hover': { backgroundColor: '#5a0000' } }}
                            onClick={() => handleAcceptRequest(request)}
                          >
                            Accept
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            color="error"
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

            {/* Active Sessions */}
            <Grid item xs={12} md={6}>
              <Paper elevation={3} sx={{ p: 4, backgroundColor: 'white', borderRadius: 2 }}>
                <Typography variant="h6" sx={{ color: '#780000', mb: 2 }}>
                  Scheduled Sessions
                </Typography>
                <Box sx={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {activeSessions.length === 0 ? (
                    <Typography>No scheduled sessions.</Typography>
                  ) : (
                    activeSessions.map((session) => (
                      <Card key={session.id} sx={{ mb: 2, border: '1px solid #eee' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#780000', flexGrow: 1 }}>
                              {session.client_name}
                            </Typography>
                            <Chip
                              icon={session.session_type === 'online' ? <VideoCall /> : <LocationOn />}
                              label={session.session_type}
                              size="small"
                              color={session.session_type === 'online' ? 'primary' : 'secondary'}
                            />
                          </Box>
                          <Typography variant="body2">
                            <strong>Date:</strong> {session.session_date}<br />
                            <strong>Time:</strong> {session.session_time}
                          </Typography>
                        </CardContent>
                        <CardActions>
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<Notes />}
                            sx={{ backgroundColor: '#780000', '&:hover': { backgroundColor: '#5a0000' } }}
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
              <Paper elevation={3} sx={{ p: 4, backgroundColor: 'white', borderRadius: 2 }}>
                <Typography variant="h6" sx={{ color: '#780000', mb: 2 }}>
                  Recent Completed Sessions
                </Typography>
                <Box sx={{ maxHeight: '500px', overflowY: 'auto' }}>
                  {completedSessions.length === 0 ? (
                    <Typography>No completed sessions.</Typography>
                  ) : (
                    completedSessions.map((session) => (
                      <Card key={session.id} sx={{ mb: 2, border: '1px solid #eee' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#780000', flexGrow: 1 }}>
                              {session.client_name}
                            </Typography>
                            <Chip
                              icon={<CheckCircle />}
                              label="Completed"
                              size="small"
                              color="success"
                            />
                            <IconButton
                              onClick={() => toggleSessionExpansion(session.id)}
                              size="small"
                              sx={{ ml: 1 }}
                            >
                              {expandedSessions[session.id] ? <ExpandLess /> : <ExpandMore />}
                            </IconButton>
                          </Box>
                          <Typography variant="body2">
                            <strong>Date:</strong> {session.session_date} | <strong>Time:</strong> {session.session_time}
                          </Typography>
                          
                          <Collapse in={expandedSessions[session.id]}>
                            <Box sx={{ mt: 2 }}>
                              <Divider sx={{ my: 2 }} />
                              
                              {session.notes && (
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#780000' }}>
                                    Session Notes:
                                  </Typography>
                                  <Typography variant="body2" sx={{ mt: 1 }}>
                                    {session.notes}
                                  </Typography>
                                </Box>
                              )}
                              
                              {session.key_takeaways && (
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#780000' }}>
                                    Key Takeaways:
                                  </Typography>
                                  <Typography variant="body2" sx={{ mt: 1 }}>
                                    {session.key_takeaways}
                                  </Typography>
                                </Box>
                              )}
                              
                              {session.recommendations && (
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#780000' }}>
                                    Recommendations:
                                  </Typography>
                                  <Typography variant="body2" sx={{ mt: 1 }}>
                                    {session.recommendations}
                                  </Typography>
                                </Box>
                              )}
                              
                              {session.follow_up_required && (
                                <Box sx={{ mb: 2 }}>
                                  <Chip
                                    icon={<Schedule />}
                                    label={`Follow-up: ${session.next_session_date}`}
                                    color="warning"
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
                            sx={{ borderColor: '#780000', color: '#780000' }}
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

            {/* Client Journal Entries */}
            <Grid item xs={12}>
              <Paper elevation={3} sx={{ p: 4, backgroundColor: 'white', borderRadius: 2 }}>
                <Typography variant="h6" sx={{ color: '#780000', mb: 2 }}>
                  Recent Client Journal Entries
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
          </Grid>
        )}
      </Container>

      {/* Accept Session Modal */}
      <Dialog open={openAcceptModal} onClose={handleCloseAcceptModal} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: '#780000', fontWeight: 'bold' }}>
          Schedule Session
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 3 }}>
            <strong>Client:</strong> {selectedRequest?.client_name}<br />
            <strong>Requested Date:</strong> {selectedRequest?.requested_date}<br />
            <strong>Requested Time:</strong> {selectedRequest?.requested_time}
          </Typography>
          
          <FormControl component="fieldset" sx={{ mb: 3 }}>
            <FormLabel component="legend" sx={{ color: '#780000', fontWeight: 'bold' }}>
              Session Type
            </FormLabel>
            <RadioGroup
              value={sessionType}
              onChange={(e) => setSessionType(e.target.value)}
              row
            >
              <FormControlLabel value="online" control={<Radio />} label="Online Session" />
              <FormControlLabel value="physical" control={<Radio />} label="In-Person Session" />
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
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAcceptModal} sx={{ color: '#780000' }}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmSession} 
            variant="contained" 
            sx={{ backgroundColor: '#780000', '&:hover': { backgroundColor: '#5a0000' } }}
          >
            Schedule Session
          </Button>
        </DialogActions>
      </Dialog>

      {/* Session Notes Modal */}
      <Dialog open={openSessionNotesModal} onClose={handleCloseSessionNotesModal} maxWidth="md" fullWidth>
        <DialogTitle sx={{ color: '#780000', fontWeight: 'bold' }}>
          Session Notes & Recommendations
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 3, color: 'text.secondary' }}>
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
            placeholder="Detailed notes about the session, client's mood, progress, concerns discussed..."
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
            placeholder="Main insights, breakthroughs, or important observations from this session..."
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
            placeholder="Specific recommendations, exercises, resources, or actions for the client to follow..."
          />

          <FormControlLabel
            control={
              <input
                type="checkbox"
                checked={followUpRequired}
                onChange={(e) => setFollowUpRequired(e.target.checked)}
              />
            }
            label="Follow-up session required"
            sx={{ mb: 2 }}
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
              }}
              sx={{ mb: 2 }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSessionNotesModal} sx={{ color: '#780000' }}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveSessionNotes} 
            variant="contained" 
            startIcon={<Recommend />}
            sx={{ backgroundColor: '#780000', '&:hover': { backgroundColor: '#5a0000' } }}
          >
            Save Notes & Recommendations
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}