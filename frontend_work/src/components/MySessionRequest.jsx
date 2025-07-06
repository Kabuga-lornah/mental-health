// File: frontend_work/src/components/MySessionRequest.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Chip,
  Tabs,
  Tab,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  Paper,
  Grid
} from '@mui/material';
import {
  Schedule,
  Person,
  CheckCircle,
  Pending,
  Cancel,
  Refresh,
  EventNote,
  Psychology,  // Changed from Recommendations to Psychology
  Wifi, // Icon for online sessions
  Room // Icon for physical sessions
} from '@mui/icons-material';
import { isPast, parseISO, parse, isValid, addMinutes } from 'date-fns';


const MySessionRequests = () => {
  const { user } = useAuth();
  const [sessionRequests, setSessionRequests] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [selectedSession, setSelectedSession] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSessionRequests();
    fetchSessions();
  }, []);

  const fetchSessionRequests = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/client/session-requests/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSessionRequests(data);
      } else {
        setError('Failed to fetch session requests');
      }
    } catch (error) {
      console.error('Error fetching session requests:', error);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/client/sessions/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'accepted': return 'info'; // Changed accepted to info for distinction
      case 'rejected': return 'error';
      case 'cancelled': return 'default';
      case 'completed': return 'success';
      case 'expired': return 'default'; // For expired requests/sessions
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Pending />;
      case 'accepted': return <CheckCircle />;
      case 'rejected': return <Cancel />;
      case 'cancelled': return <Cancel />;
      case 'completed': return <CheckCircle />;
      case 'expired': return <Cancel />; // Or a specific expired icon if available
      default: return <Schedule />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return new Date(`1970-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper to determine if a session/request is expired
  const isSessionExpired = (dateString, timeString, durationMinutes = 0) => {
    if (!dateString || !timeString) return false;
    
    // Combine date and time to create a full datetime object
    const [year, month, day] = dateString.split('-').map(Number);
    const [hours, minutes] = timeString.split(':').map(Number);
    
    // Create a date object using local time to avoid timezone issues with `new Date()`
    const sessionDateTime = new Date(year, month - 1, day, hours, minutes, 0);

    // Add duration if provided to get the end time of the session
    const sessionEndTime = addMinutes(sessionDateTime, durationMinutes);
    
    // Check if the session end time is in the past
    return isPast(sessionEndTime);
  };

  const hasActiveSessions = () => {
    return sessions.some(session => 
      (session.status === 'scheduled' || session.status === 'in_progress') && !isSessionExpired(session.session_date, session.session_time, session.duration_minutes)
    );
  };

  const hasPendingRequests = () => {
    return sessionRequests.some(request => request.status === 'pending' && !isSessionExpired(request.requested_date, request.requested_time));
  };

  const canRequestNewSession = () => {
    return !hasActiveSessions() && !hasPendingRequests();
  };

  const handleViewSessionDetails = (session) => {
    setSelectedSession(session);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedSession(null);
  };

  const cancelRequest = async (requestId) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/api/session-requests/${requestId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        fetchSessionRequests();
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to cancel request');
      }
    } catch (error) {
      console.error('Error cancelling request:', error);
      setError('Network error occurred');
    }
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );

  if (loading) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <Typography>Loading your sessions...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        My Therapy Sessions
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!canRequestNewSession() && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {hasActiveSessions() 
            ? "You have an active session. Complete it before requesting a new one."
            : "You have a pending request. Wait for therapist response before requesting another session."
          }
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Session Requests" />
          <Tab label="Active Sessions" />
          <Tab label="Completed Sessions" />
        </Tabs>
      </Box>

      {/* Session Requests Tab */}
      <TabPanel value={tabValue} index={0}>
        {sessionRequests.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              No session requests found
            </Typography>
            <Typography color="text.secondary">
              Visit the "Find a Therapist" page to request your first session
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {sessionRequests.map((request) => {
              const expired = isSessionExpired(request.requested_date, request.requested_time);
              const displayStatus = expired && request.status !== 'completed' && request.status !== 'cancelled' ? 'expired' : request.status;

              return (
                <Grid item xs={12} md={6} key={request.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="h6">
                          Dr. {request.therapist_name}
                        </Typography>
                        <Chip
                          icon={getStatusIcon(displayStatus)}
                          label={displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
                          color={getStatusColor(displayStatus)}
                          size="small"
                        />
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Schedule sx={{ mr: 1, fontSize: 20 }} />
                        <Typography variant="body2">
                          {formatDate(request.requested_date)} at {formatTime(request.requested_time)}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Person sx={{ mr: 1, fontSize: 20 }} />
                        <Typography variant="body2">
                          {request.therapist.specializations || 'General Therapy'}
                        </Typography>
                      </Box>

                      {request.message && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          <strong>Your message:</strong> {request.message}
                        </Typography>
                      )}

                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        {request.session_request_is_paid ? (
                          <Chip label="Paid" color="success" size="small" sx={{ mr: 1 }} />
                        ) : (
                          <Chip label="Pending Payment" color="warning" size="small" sx={{ mr: 1 }} />
                        )}
                        {request.therapist.session_modes === 'online' && (
                          <Chip icon={<Wifi />} label="Online Session" size="small" />
                        )}
                        {request.therapist.session_modes === 'physical' && (
                          <Chip icon={<Room />} label="Physical Session" size="small" />
                        )}
                        {request.therapist.session_modes === 'both' && (
                          <Chip icon={<Wifi />} label="Online/Physical" size="small" />
                        )}
                      </Box>

                      <Typography variant="caption" color="text.secondary">
                        Requested on {formatDate(request.created_at)}
                      </Typography>

                      {displayStatus === 'pending' && (
                        <Box sx={{ mt: 2 }}>
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={() => cancelRequest(request.id)}
                            disabled={expired}
                          >
                            Cancel Request
                          </Button>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </TabPanel>

      {/* Active Sessions Tab */}
      <TabPanel value={tabValue} index={1}>
        {sessions.filter(session => ['scheduled', 'in_progress'].includes(session.status)).length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              No active sessions
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {sessions
              .filter(session => ['scheduled', 'in_progress'].includes(session.status))
              .map((session) => {
                const expired = isSessionExpired(session.session_date, session.session_time, session.duration_minutes);
                const displayStatus = expired ? 'expired' : session.status;

                return (
                  <Grid item xs={12} md={6} key={session.id}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Typography variant="h6">
                            Dr. {session.therapist_name}
                          </Typography>
                          <Chip
                            label={displayStatus === 'expired' ? 'Expired' : (session.status === 'scheduled' ? 'Scheduled' : 'In Progress')}
                            color={getStatusColor(displayStatus)}
                            size="small"
                          />
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Schedule sx={{ mr: 1, fontSize: 20 }} />
                          <Typography variant="body2">
                            {formatDate(session.session_date)} at {formatTime(session.session_time)}
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          {session.session_type === 'online' && (
                            <Chip icon={<Wifi />} label="Online Session" size="small" />
                          )}
                          {session.session_type === 'physical' && (
                            <Chip icon={<Room />} label="Physical Session" size="small" />
                          )}
                        </Box>

                        {session.location && (
                          <Typography variant="body2" color="text.secondary">
                            Location: {session.location}
                          </Typography>
                        )}

                        <Box sx={{ mt: 2 }}>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleViewSessionDetails(session)}
                          >
                            View Details
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
          </Grid>
        )}
      </TabPanel>

      {/* Completed Sessions Tab */}
      <TabPanel value={tabValue} index={2}>
        {sessions.filter(session => session.status === 'completed').length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              No completed sessions yet
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {sessions
              .filter(session => session.status === 'completed')
              .map((session) => (
                <Grid item xs={12} md={6} key={session.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="h6">
                          Dr. {session.therapist_name}
                        </Typography>
                        <Chip
                          label="Completed"
                          color="success"
                          size="small"
                        />
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Schedule sx={{ mr: 1, fontSize: 20 }} />
                        <Typography variant="body2">
                          {formatDate(session.session_date)} at {formatTime(session.session_time)}
                        </Typography>
                      </Box>

                      {session.therapist_notes && (
                        <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
                          <strong>Therapist Notes:</strong> {session.therapist_notes}
                        </Alert>
                      )}

                      {session.recommendations && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Psychology sx={{ mr: 1, fontSize: 20 }} />
                            <Box>
                              <strong>Recommendations:</strong> {session.recommendations}
                            </Box>
                          </Box>
                        </Alert>
                      )}

                      {session.follow_up_needed && (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                          <Refresh sx={{ mr: 1 }} />
                          Therapist recommends a follow-up session
                        </Alert>
                      )}

                      <Box sx={{ mt: 2 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleViewSessionDetails(session)}
                        >
                          View Full Details
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
          </Grid>
        )}
      </TabPanel>

      {/* Session Details Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        {selectedSession && (
          <>
            <DialogTitle>
              Session with Dr. {selectedSession.therapist_name}
            </DialogTitle>
            <DialogContent>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Date & Time"
                    secondary={`${formatDate(selectedSession.session_date)} at ${formatTime(selectedSession.session_time)}`}
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Session Type"
                    secondary={selectedSession.session_type === 'online' ? 'Online' : 'Physical'}
                  />
                </ListItem>
                {selectedSession.location && (
                  <>
                    <Divider />
                    <ListItem>
                      <ListItemText
                        primary="Location"
                        secondary={selectedSession.location}
                      />
                    </ListItem>
                  </>
                )}
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Status"
                    secondary={
                      <Chip
                        label={selectedSession.status.charAt(0).toUpperCase() + selectedSession.status.slice(1)}
                        color={selectedSession.status === 'completed' ? 'success' : 'primary'}
                        size="small"
                      />
                    }
                  />
                </ListItem>
                
                {selectedSession.therapist_notes && (
                  <>
                    <Divider />
                    <ListItem>
                      <ListItemText
                        primary="Therapist Notes"
                        secondary={selectedSession.therapist_notes}
                      />
                    </ListItem>
                  </>
                )}
                
                {selectedSession.recommendations && (
                  <>
                    <Divider />
                    <ListItem>
                      <Psychology sx={{ mr: 1, fontSize: 20, color: 'primary.main' }} />
                      <ListItemText
                        primary="Recommendations"
                        secondary={selectedSession.recommendations}
                      />
                    </ListItem>
                  </>
                )}
                
                {selectedSession.follow_up_needed && (
                  <>
                    <Divider />
                    <ListItem>
                      <ListItemText
                        primary="Follow-up Recommended"
                        secondary="Your therapist recommends scheduling another session"
                      />
                    </ListItem>
                  </>
                )}
              </List>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default MySessionRequests;