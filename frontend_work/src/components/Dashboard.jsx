// File: frontend_work/src/components/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Button, Typography, Box, CircularProgress, Paper, Grid,
  Snackbar, Alert, List, ListItem, ListItemText, Chip,
  Collapse, IconButton
} from "@mui/material";
import { Link } from "react-router-dom";
import axios from "axios";
import { AccessTime, Event, CheckCircleOutline, ExpandMore, ExpandLess, Recommend, VideoCall, LocationOn, AttachMoney, Notes } from "@mui/icons-material";
import { keyframes } from '@emotion/react';
import { styled } from '@mui/system';

// Define theme colors (consistent with other components)
const themePrimaryColor = '#780000'; // Dark red/maroon
const themeLightBackground = '#f8f2e7'; // Slightly warmer light cream/yellowish white
const themeButtonHoverColor = '#5a0000'; // Darker red/maroon for hover
const themeCardBackground = 'white'; // White for cards
const themeAccentColor = '#DCC8C8'; // A subtle accent for chips

// Define general animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideInLeft = keyframes`
  from { opacity: 0; transform: translateX(-50px); }
  to { opacity: 1; transform: translateX(0); }
`;

const slideInRight = keyframes`
  from { opacity: 0; transform: translateX(50px); }
  to { opacity: 1; transform: translateX(0); }
`;

// Bubble animations
const float = keyframes`
  0% { transform: translateY(0px) rotate(0deg); opacity: 0.7; border-radius: 50%; }
  25% { transform: translateY(-20px) translateX(10px) rotate(5deg); opacity: 0.8; }
  50% { transform: translateY(-40px) rotate(0deg); opacity: 0.7; }
  75% { transform: translateY(-20px) translateX(-10px) rotate(-5deg); opacity: 0.8; }
  100% { transform: translateY(0px) rotate(0deg); opacity: 0.7; border-radius: 50%; }
`;

const BubblesContainer = styled(Box)({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  zIndex: 0, // Ensure bubbles are behind content
});

const Bubble = styled('div')(({ size, animationDuration, delay, left, top }) => ({
  position: 'absolute',
  display: 'block',
  listStyle: 'none',
  borderRadius: '50%',
  backgroundColor: 'rgba(255, 204, 153, 0.4)', // A soft, slightly peachy/orange tint
  animation: `${float} ${animationDuration}s linear infinite`,
  width: `${size}px`,
  height: `${size}px`,
  left: `${left}%`,
  top: `${top}%`,
  animationDelay: `${delay}s`,
  boxShadow: '0 0 15px rgba(255, 204, 153, 0.6)',
}));

// Moved bubbleData outside the component to ensure it's always defined
const bubbleData = [
  { size: 60, animationDuration: 10, delay: 0, left: 10, top: 20 },
  { size: 80, animationDuration: 12, delay: 2, left: 80, top: 10 },
  { size: 70, animationDuration: 9, delay: 4, left: 20, top: 80 },
  { size: 90, animationDuration: 11, delay: 6, left: 90, top: 70 },
  { size: 50, animationDuration: 8, delay: 1, left: 50, top: 5 },
  { size: 75, animationDuration: 13, delay: 3, left: 5, top: 60 },
  { size: 65, animationDuration: 10, delay: 5, left: 70, top: 40 },
  { size: 85, animationDuration: 14, delay: 7, left: 30, top: 30 },
];

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

  // States for toggling visibility of each section
  const [showPending, setShowPending] = useState(true); // Start expanded for visibility
  const [showScheduled, setShowScheduled] = useState(true); // Start expanded for visibility
  const [showCompleted, setShowCompleted] = useState(true); // Start expanded for visibility

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
            headers: { Authorization: `Bearer ${token}`, }
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

  // Helper function to calculate countdown
  const calculateCountdown = (sessionDate, sessionTime) => {
    const sessionDateTime = new Date(`${sessionDate}T${sessionTime}`);
    const now = new Date();
    const difference = sessionDateTime.getTime() - now.getTime();

    if (difference <= 0) {
      return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return { expired: false, days, hours, minutes, seconds };
  };

  const [countdowns, setCountdowns] = useState({});

  useEffect(() => {
    const interval = setInterval(() => {
      const newCountdowns = {};
      scheduledSessions.forEach(session => {
        if (session.session_type === 'online') {
          newCountdowns[session.id] = calculateCountdown(session.session_date, session.session_time);
        }
      });
      setCountdowns(newCountdowns);
    }, 1000);

    return () => clearInterval(interval);
  }, [scheduledSessions]);


  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', backgroundColor: themeLightBackground }}>
        <CircularProgress sx={{ color: themePrimaryColor }} />
        <Typography sx={{ ml: 2, color: themePrimaryColor }}>Loading your dashboard...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 4, backgroundColor: themeLightBackground, minHeight: "100vh", position: 'relative', overflow: 'hidden' }}>
      {/* Bubbles Background */}
      <BubblesContainer>
        {bubbleData.map((bubble, index) => (
          <Bubble
            key={index}
            size={bubble.size}
            animationDuration={bubble.animationDuration}
            delay={bubble.delay}
            left={bubble.left}
            top={bubble.top}
          />
        ))}
      </BubblesContainer>

      {/* Main Content (z-index ensures it's above bubbles) */}
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {/* Welcome Section */}
        <Box sx={{
          textAlign: 'center',
          mb: 5,
          animation: `${fadeIn} 1s ease-out forwards`,
          animationFillMode: 'backwards',
        }}>
          <Typography variant="h3" sx={{
            color: themePrimaryColor,
            fontWeight: 'bold',
            mb: 1.5,
            fontFamily: 'Poppins, sans-serif',
          }}>
            Welcome Back, {user?.first_name}!
          </Typography>
          <Typography variant="h6" sx={{
            color: '#555',
            maxWidth: '700px',
            mx: 'auto',
            lineHeight: 1.6,
            fontFamily: 'Inter, sans-serif',
          }}>
            Here's a quick overview of your MindWell journey. Stay updated on your session requests and upcoming appointments.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, animation: `${fadeIn} 0.5s ease-out forwards` }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={4}> {/* Increased spacing for better visual separation */}
          {/* Pending Requests Section */}
          <Grid item xs={12} md={6} sx={{ animation: `${slideInLeft} 1s ease-out forwards 0.3s`, animationFillMode: 'backwards' }}>
            <Paper elevation={6} sx={{ p: 3, backgroundColor: themeCardBackground, borderRadius: 3, border: `1px solid ${themePrimaryColor}30`, boxShadow: '0px 8px 20px rgba(0,0,0,0.1)' }}>
              <Typography variant="h5" sx={{ color: themePrimaryColor, mb: 2, fontWeight: 'bold', borderBottom: `2px solid ${themePrimaryColor}20`, pb: 1 }}>
                Pending Session Requests
                <Button
                  onClick={() => setShowPending(!showPending)}
                  endIcon={showPending ? <ExpandLess /> : <ExpandMore />}
                  sx={{ ml: 2, color: themePrimaryColor }}
                >
                  {showPending ? 'Hide' : 'View'} ({pendingRequests.length})
                </Button>
              </Typography>
              <Collapse in={showPending}>
                {pendingRequests.length === 0 ? (
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body1" sx={{ mb: 2, color: '#666' }}>You don't have any pending session requests at the moment.</Typography>
                    <Button
                      component={Link}
                      to="/find-therapist"
                      variant="contained"
                      sx={{ backgroundColor: themePrimaryColor, '&:hover': { backgroundColor: themeButtonHoverColor }, transition: 'all 0.3s ease' }}
                    >
                      Find a Therapist
                    </Button>
                  </Box>
                ) : (
                  <List>
                    {pendingRequests.map((request) => (
                      <Paper key={request.id} elevation={1} sx={{ mb: 2, p: 2, borderLeft: '5px solid #FFC107', borderRadius: 2, transition: 'transform 0.2s ease-in-out', '&:hover': { transform: 'translateY(-3px)' } }}>
                        <ListItem disableGutters>
                          <ListItemText
                            primary={
                              <Typography variant="h6" sx={{ color: themePrimaryColor, fontWeight: 'bold' }}>
                                Request to Dr. {request.therapist_name}
                              </Typography>
                            }
                            secondary={
                              <>
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                  <Event sx={{ fontSize: 18, mr: 1, color: themePrimaryColor }} />
                                  <Typography variant="body2" sx={{ color: '#444' }}>
                                    Date: {request.requested_date}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                  <AccessTime sx={{ fontSize: 18, mr: 1, color: themePrimaryColor }} />
                                  <Typography variant="body2" sx={{ color: '#444' }}>
                                    Time: {request.requested_time}
                                  </Typography>
                                </Box>
                                {request.message && (
                                  <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic', color: '#555' }}>
                                    Your message: "{request.message}"
                                  </Typography>
                                )}
                                <Chip label="Pending" color="warning" size="small" sx={{ mt: 1, bgcolor: '#FFC107', color: 'white', fontWeight: 'bold' }} />
                              </>
                            }
                          />
                        </ListItem>
                      </Paper>
                    ))}
                  </List>
                )}
              </Collapse>
            </Paper>
          </Grid>

          {/* Scheduled Sessions Section */}
          <Grid item xs={12} md={6} sx={{ animation: `${slideInRight} 1s ease-out forwards 0.5s`, animationFillMode: 'backwards' }}>
            <Paper elevation={6} sx={{ p: 3, backgroundColor: themeCardBackground, borderRadius: 3, border: `1px solid ${themePrimaryColor}30`, boxShadow: '0px 8px 20px rgba(0,0,0,0.1)' }}>
              <Typography variant="h5" sx={{ color: themePrimaryColor, mb: 2, fontWeight: 'bold', borderBottom: `2px solid ${themePrimaryColor}20`, pb: 1 }}>
                Your Scheduled Sessions
                <Button
                  onClick={() => setShowScheduled(!showScheduled)}
                  endIcon={showScheduled ? <ExpandLess /> : <ExpandMore />}
                  sx={{ ml: 2, color: themePrimaryColor }}
                >
                  {showScheduled ? 'Hide' : 'View'} ({scheduledSessions.length})
                </Button>
              </Typography>
              <Collapse in={showScheduled}>
                {scheduledSessions.length === 0 ? (
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Typography sx={{ mb: 2, color: '#666' }}>You don't have any upcoming scheduled sessions.</Typography>
                    <img src="https://assets.website-files.com/5f76269b52a16d2b36a103c8/603e911c75c8b52579b291d9_undraw_empty_re_opql.svg" alt="No sessions" style={{ maxWidth: '150px', opacity: 0.7 }} />
                  </Box>
                ) : (
                  <List>
                    {scheduledSessions.map((session) => {
                      const countdown = countdowns[session.id] || { expired: false, days: 0, hours: 0, minutes: 0, seconds: 0 };
                      const isJoinable = countdown.expired;

                      return (
                        <Paper key={session.id} elevation={1} sx={{ mb: 2, p: 2, borderLeft: '5px solid #4CAF50', borderRadius: 2, transition: 'transform 0.2s ease-in-out', '&:hover': { transform: 'translateY(-3px)' } }}>
                          <ListItem disableGutters>
                            <ListItemText
                              primary={
                                <Typography variant="h6" sx={{ color: '#4CAF50', fontWeight: 'bold' }}>
                                  Session with Dr. {session.therapist_name}
                                </Typography>
                              }
                              secondary={
                                <>
                                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                    <Event sx={{ fontSize: 18, mr: 1, color: '#4CAF50' }} />
                                    <Typography variant="body2" sx={{ color: '#444' }}>
                                      Date: {session.session_date}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                    <AccessTime sx={{ fontSize: 18, mr: 1, color: '#4CAF50' }} />
                                    <Typography variant="body2" sx={{ color: '#444' }}>
                                      Time: {session.session_time}
                                    </Typography>
                                  </Box>
                                  <Chip
                                    icon={session.session_type === 'online' ? <VideoCall /> : <LocationOn />}
                                    label={session.session_type === 'online' ? 'Online' : 'In-Person'}
                                    size="small"
                                    sx={{ mt: 1, backgroundColor: themeAccentColor, color: themePrimaryColor, fontWeight: 'bold' }}
                                  />
                                  {session.session_type === 'online' && session.zoom_meeting_url && (
                                      <Box sx={{ mt: 1 }}>
                                          <Typography variant="body2" sx={{ color: themePrimaryColor, fontWeight: 'bold' }}>
                                              Online Meeting Link:
                                          </Typography>
                                          {isJoinable ? (
                                              <Button
                                                  variant="contained"
                                                  color="primary"
                                                  size="small"
                                                  href={session.zoom_meeting_url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  sx={{ mt: 1, backgroundColor: '#28a745', '&:hover': { backgroundColor: '#218838' } }}
                                              >
                                                  Join Session Now!
                                              </Button>
                                          ) : (
                                              <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic', color: '#888' }}>
                                                  Session starts in: {countdown.days}d {countdown.hours}h {countdown.minutes}m {countdown.seconds}s
                                                  <br /> (Link will become active at session time)
                                              </Typography>
                                          )}
                                          <Typography variant="caption" sx={{ display: 'block', color: '#777', mt: 0.5 }}>
                                                {session.zoom_meeting_url}
                                          </Typography>
                                      </Box>
                                  )}
                                </>
                              }
                            />
                          </ListItem>
                        </Paper>
                      );
                    })}
                  </List>
                )}
              </Collapse>
            </Paper>
          </Grid>

          {/* Completed Sessions Section */}
          <Grid item xs={12} sx={{ animation: `${fadeIn} 1s ease-out forwards 0.7s`, animationFillMode: 'backwards' }}>
            <Paper elevation={6} sx={{ p: 3, backgroundColor: themeCardBackground, borderRadius: 3, border: `1px solid ${themePrimaryColor}30`, boxShadow: '0px 8px 20px rgba(0,0,0,0.1)' }}>
              <Typography variant="h5" sx={{ color: themePrimaryColor, mb: 2, fontWeight: 'bold', borderBottom: `2px solid ${themePrimaryColor}20`, pb: 1 }}>
                Your Completed Sessions
                <Button
                  onClick={() => setShowCompleted(!showCompleted)}
                  endIcon={showCompleted ? <ExpandLess /> : <ExpandMore />}
                  sx={{ ml: 2, color: themePrimaryColor }}
                >
                  {showCompleted ? 'Hide' : 'View'} ({completedSessions.length})
                </Button>
              </Typography>
              <Collapse in={showCompleted}>
                {completedSessions.length === 0 ? (
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Typography sx={{ mb: 2, color: '#666' }}>No completed sessions yet. Keep going!</Typography>
                    <img src="https://assets.website-files.com/5f76269b52a16d2b36a103c8/603e913a1727768565a4e5ed_undraw_progress_tracking_re_ulfg.svg" alt="No completed sessions" style={{ maxWidth: '150px', opacity: 0.7 }} />
                  </Box>
                ) : (
                  <List>
                    {completedSessions.map((session) => (
                      <Paper key={session.id} elevation={1} sx={{ mb: 2, p: 2, borderLeft: '5px solid #1976D2', borderRadius: 2, transition: 'transform 0.2s ease-in-out', '&:hover': { transform: 'translateY(-3px)' } }}>
                        <ListItem disableGutters>
                          <ListItemText
                            primary={
                              <Typography variant="h6" sx={{ color: '#1976D2', fontWeight: 'bold' }}>
                                Session with Dr. {session.therapist_name}
                                <IconButton
                                  onClick={() => toggleNotesExpansion(session.id)}
                                  size="small"
                                  sx={{ ml: 1, color: '#1976D2' }}
                                >
                                  {expandedNotes[session.id] ? <ExpandLess /> : <ExpandMore />}
                                </IconButton>
                              </Typography>
                            }
                            secondary={
                              <>
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                  <CheckCircleOutline sx={{ fontSize: 18, mr: 1, color: '#1976D2' }} />
                                  <Typography variant="body2" sx={{ color: '#444' }}>
                                    Date: {session.session_date} (Completed)
                                  </Typography>
                                </Box>

                                <Collapse in={expandedNotes[session.id]}>
                                  <Box sx={{ mt: 2, borderTop: '1px solid #eee', pt: 2 }}>
                                    {session.notes && ( // Display therapist's notes
                                      <Box sx={{ mb: 1 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', color: themePrimaryColor }}>
                                          <Notes sx={{ fontSize: 18, mr: 0.5, color: themePrimaryColor }} /> Therapist Notes:
                                        </Typography>
                                        <Typography variant="body2" sx={{ mt: 0.5, color: '#555', pl: 3 }}>
                                          {session.notes}
                                        </Typography>
                                      </Box>
                                    )}
                                    {session.recommendations && (
                                      <Box sx={{ mb: 1 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', color: themePrimaryColor }}>
                                          <Recommend sx={{ fontSize: 20, mr: 0.5, color: themePrimaryColor }} /> Recommendations:
                                        </Typography>
                                        <Typography variant="body2" sx={{ mt: 0.5, color: '#555', pl: 3 }}>
                                          {session.recommendations}
                                        </Typography>
                                      </Box>
                                    )}
                                    {session.follow_up_required && session.next_session_date && (
                                      <Box sx={{ mt: 1, p: 1.5, border: `1px solid ${themePrimaryColor}60`, borderRadius: 1, backgroundColor: `${themePrimaryColor}05` }}>
                                        <Typography variant="body2" sx={{ fontStyle: 'italic', color: themePrimaryColor, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                                          <Event sx={{ fontSize: 18, mr: 0.5 }} /> Recommended Next Session: {session.next_session_date}
                                        </Typography>
                                        {/* Placeholder for payment prompt */}
                                        <Button
                                          variant="contained"
                                          startIcon={<AttachMoney />}
                                          size="small"
                                          sx={{ mt: 1, backgroundColor: '#FFD700', color: '#333', '&:hover': { backgroundColor: '#FFC107' } }}
                                          // onClick={() => handlePayForRecommendedSession(session.id, session.therapist_id, session.next_session_date)}
                                        >
                                          Pay for this Session (Placeholder)
                                        </Button>
                                        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#777' }}>
                                            *Actual payment functionality requires backend integration.
                                        </Typography>
                                      </Box>
                                    )}
                                    {!session.notes && !session.recommendations && !session.follow_up_required && (
                                      <Typography variant="body2" sx={{ mt: 1, color: '#555' }}>
                                        No specific notes, recommendations, or follow-up noted for this session.
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
              </Collapse>
            </Paper>
          </Grid>
        </Grid>

        <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
          <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
}