import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { 
  Button, Typography, Box, CircularProgress, Paper, Grid,
  Snackbar, Alert, List, ListItem, ListItemText, Chip 
} from "@mui/material";
import { Link } from "react-router-dom";
import axios from "axios";
import { AccessTime, Event, CheckCircleOutline } from "@mui/icons-material";

export default function Dashboard() {
  const { user, logout, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scheduledSessions, setScheduledSessions] = useState([]);
  const [completedSessions, setCompletedSessions] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  useEffect(() => {
    const fetchUserSessions = async () => {
      if (!user || !token) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        // Fetch scheduled sessions
        // Changed endpoint to client/session-requests/
        const scheduledResponse = await axios.get(
          "http://localhost:8000/api/client/session-requests/?status=accepted", 
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setScheduledSessions(scheduledResponse.data);

        // Fetch completed sessions
        // Changed endpoint to client/session-requests/
        const completedResponse = await axios.get(
          "http://localhost:8000/api/client/session-requests/?status=completed", 
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setCompletedSessions(completedResponse.data);

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
        {/* Scheduled Sessions Section */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, backgroundColor: 'white', borderRadius: 2 }}>
            <Typography variant="h5" sx={{ color: "#780000", mb: 2, fontWeight: 'bold' }}>
              Your Scheduled Sessions
            </Typography>
            {scheduledSessions.length === 0 ? (
              <Box>
                <Typography sx={{ mb: 2 }}>You don't have any scheduled sessions yet.</Typography>
                <Button 
                  component={Link} 
                  to="/find-therapist" 
                  variant="contained" 
                  sx={{ 
                    backgroundColor: "#780000", 
                    "&:hover": { backgroundColor: "#5a0000" } 
                  }}
                >
                  Find a Therapist
                </Button>
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
                                Date: {session.requested_date}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                              <AccessTime sx={{ fontSize: 16, mr: 1, color: '#780000' }} />
                              <Typography variant="body2">
                                Time: {session.requested_time}
                              </Typography>
                            </Box>
                            {session.message && (
                              <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic', color: '#555' }}>
                                Your message: "{session.message}"
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

        {/* Completed Sessions Section */}
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
                          </Typography>
                        }
                        secondary={
                          <>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                              <CheckCircleOutline sx={{ fontSize: 16, mr: 1, color: '#4CAF50' }} />
                              <Typography variant="body2">
                                Date: {session.requested_date} (Completed)
                              </Typography>
                            </Box>
                            {session.session_notes && (
                              <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic', color: '#555' }}>
                                Notes: "{session.session_notes.substring(0, 100)}{session.session_notes.length > 100 ? '...' : ''}"
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
      </Grid>

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Button
          onClick={logout}
          variant="contained"
          sx={{
            backgroundColor: "#780000",
            "&:hover": { backgroundColor: "#5a0000" },
          }}
        >
          Logout
        </Button>
      </Box>

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}