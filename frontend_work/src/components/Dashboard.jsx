import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Button, Typography, Box, CircularProgress, Paper, Grid,
  Snackbar, Alert, List, ListItem, ListItemText, Chip,
  Collapse, IconButton
} from "@mui/material";
import { Link } from "react-router-dom";
import axios from "axios";
import { AccessTime, Event, CheckCircleOutline, ExpandMore, ExpandLess, Recommend } from "@mui/icons-material"; // Removed Notes icon as notes won't be displayed

export default function Dashboard() {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [scheduledSessions, setScheduledSessions] = useState([]);
  const [completedSessions, setCompletedSessions] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [expandedNotes, setExpandedNotes] = useState({});

  useEffect(() => {
    const fetchUserSessions = async () => {
      if (!user || !token) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        // Fetch PENDING session requests (from the client's perspective)
        const pendingResponse = await axios.get(
          "http://localhost:8000/api/client/session-requests/?status=pending",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setPendingRequests(pendingResponse.data);

        // Fetch SCHEDULED sessions (actual Session objects from the new endpoint)
        const activeSessionsResponse = await axios.get(
          "http://localhost:8000/api/client/sessions/?status=scheduled",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setScheduledSessions(activeSessionsResponse.data);

        // Fetch COMPLETED sessions (actual Session objects from the new endpoint)
        const completedSessionsResponse = await axios.get(
          "http://localhost:8000/api/client/sessions/?status=completed",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setCompletedSessions(completedSessionsResponse.data);

      } catch (err) {
        console.error("Error fetching sessions:", err);
        setError("Failed to load your sessions. Please try again later.");
        setSnackbarMessage("Failed to load your sessions.");
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    };

    fetchUserSessions();
  }, [user, token]);

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const toggleNotesExpansion = (sessionId) => {
    setExpandedNotes(prev => ({ ...prev, [sessionId]: !prev[sessionId] }));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', backgroundColor: "#fefae0" }}>
        <CircularProgress sx={{ color: '#780000' }} />
        <Typography sx={{ ml: 2, color: '#780000' }}>Loading your dashboard...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 4, backgroundColor: "#fefae0", minHeight: "100vh" }}>
      <Typography variant="h4" sx={{ color: "#780000", mb: 3, fontWeight: 'bold' }}>
        Welcome, {user?.first_name}!
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Pending Requests Section */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, backgroundColor: 'white', borderRadius: 2 }}>
            <Typography variant="h5" sx={{ color: "#780000", mb: 2, fontWeight: 'bold' }}>
              Pending Session Requests
            </Typography>
            {pendingRequests.length === 0 ? (
              <Box>
                <Typography sx={{ mb: 2 }}>You don't have any pending session requests.</Typography>
                <Button
                  component={Link}
                  to="/find-therapist"
                  variant="contained"
                  sx={{ backgroundColor: '#780000', '&:hover': { backgroundColor: '#5a0000' } }}
                >
                  Find a Therapist
                </Button>
              </Box>
            ) : (
              <List>
                {pendingRequests.map((request) => (
                  <Paper key={request.id} elevation={1} sx={{ mb: 2, p: 2, borderLeft: '5px solid #FFC107' }}>
                    <ListItem disableGutters>
                      <ListItemText
                        primary={
                          <Typography variant="h6" sx={{ color: '#FFC107' }}>
                            Request to {request.therapist_name}
                          </Typography>
                        }
                        secondary={
                          <>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                              <Event sx={{ fontSize: 16, mr: 1, color: '#FFC107' }} />
                              <Typography variant="body2">
                                Date: {request.requested_date}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                              <AccessTime sx={{ fontSize: 16, mr: 1, color: '#FFC107' }} />
                              <Typography variant="body2">
                                Time: {request.requested_time}
                              </Typography>
                            </Box>
                            {request.message && (
                              <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic', color: '#555' }}>
                                Your message: "{request.message}"
                              </Typography>
                            )}
                            <Chip label="Pending" color="warning" size="small" sx={{ mt: 1 }} />
                          </>
                        }
                      />
                    </ListItem>
                  </Paper>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Scheduled Sessions Section */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, backgroundColor: 'white', borderRadius: 2 }}>
            <Typography variant="h5" sx={{ color: "#780000", mb: 2, fontWeight: 'bold' }}>
              Your Scheduled Sessions
            </Typography>
            {scheduledSessions.length === 0 ? (
              <Box>
                <Typography sx={{ mb: 2 }}>You don't have any scheduled sessions yet.</Typography>
              </Box>
            ) : (
              <List>
                {scheduledSessions.map((session) => (
                  <Paper key={session.id} elevation={1} sx={{ mb: 2, p: 2, borderLeft: '5px solid #780000' }}>
                    <ListItem disableGutters>
                      <ListItemText
                        primary={
                          <Typography variant="h6" sx={{ color: '#780000' }}>
                            Session with {session.therapist_name}
                          </Typography>
                        }
                        secondary={
                          <>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                              <Event sx={{ fontSize: 16, mr: 1, color: '#780000' }} />
                              <Typography variant="body2">
                                Date: {session.session_date}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                              <AccessTime sx={{ fontSize: 16, mr: 1, color: '#780000' }} />
                              <Typography variant="body2">
                                Time: {session.session_time}
                              </Typography>
                            </Box>
                            <Chip
                              label={session.session_type === 'online' ? 'Online' : 'In-Person'}
                              size="small"
                              sx={{ mt: 1, backgroundColor: session.session_type === 'online' ? '#E3F2FD' : '#FFF3E0', color: '#3F51B5' }}
                            />
                            {session.location && session.session_type === 'physical' && (
                              <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic', color: '#555' }}>
                                Location: {session.location}
                              </Typography>
                            )}
                          </>
                        }
                      />
                    </ListItem>
                  </Paper>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Completed Sessions Section (Updated to display ONLY recommendations) */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, backgroundColor: 'white', borderRadius: 2 }}>
            <Typography variant="h5" sx={{ color: "#780000", mb: 2, fontWeight: 'bold' }}>
              Your Completed Sessions
            </Typography>
            {completedSessions.length === 0 ? (
              <Typography>No completed sessions yet.</Typography>
            ) : (
              <List>
                {completedSessions.map((session) => (
                  <Paper key={session.id} elevation={1} sx={{ mb: 2, p: 2, borderLeft: '5px solid #4CAF50' }}>
                    <ListItem disableGutters>
                      <ListItemText
                        primary={
                          <Typography variant="h6" sx={{ color: '#4CAF50' }}>
                            Session with {session.therapist_name}
                            <IconButton
                              onClick={() => toggleNotesExpansion(session.id)}
                              size="small"
                              sx={{ ml: 1, color: '#4CAF50' }}
                            >
                              {expandedNotes[session.id] ? <ExpandLess /> : <ExpandMore />}
                            </IconButton>
                          </Typography>
                        }
                        secondary={
                          <>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                              <CheckCircleOutline sx={{ fontSize: 16, mr: 1, color: '#4CAF50' }} />
                              <Typography variant="body2">
                                Date: {session.session_date} (Completed)
                              </Typography>
                            </Box>

                            <Collapse in={expandedNotes[session.id]}>
                              <Box sx={{ mt: 2, borderTop: '1px solid #eee', pt: 2 }}>
                                {/* Only display recommendations */}
                                {session.recommendations && (
                                  <Box sx={{ mb: 1 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                                      <Recommend sx={{ fontSize: 18, mr: 0.5 }} /> Recommendations:
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 0.5, color: '#555' }}>
                                      {session.recommendations}
                                    </Typography>
                                  </Box>
                                )}
                                {session.follow_up_required && session.next_session_date && (
                                  <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic', color: '#780000', fontWeight: 'bold' }}>
                                    Follow-up required by: {session.next_session_date}
                                  </Typography>
                                )}
                                {!session.recommendations && !session.follow_up_required && (
                                  <Typography variant="body2" sx={{ mt: 1, color: '#555' }}>
                                    No specific recommendations or follow-up noted for this session.
                                  </Typography>
                                )}
                              </Box>
                            </Collapse>
                          </>
                        }
                      />
                    </ListItem>
                  </Paper>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}