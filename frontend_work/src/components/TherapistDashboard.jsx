// Overwriting file: frontend_work/src/components/TherapistDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Typography, Box, Button, CircularProgress,
  Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
  Select, MenuItem, FormControl, InputLabel, TextField, Chip,
  RadioGroup, FormControlLabel, Radio, FormLabel, Divider,
  IconButton, Collapse, Grid, Checkbox, // Added Checkbox import
  List, ListItem, ListItemText, ListItemSecondaryAction, Slide,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import {
  VideoCall, LocationOn, ExpandMore, ExpandLess,
  CheckCircle, Cancel, Notes,
  InfoOutlined, AttachMoney, Category, Psychology, Edit as EditIcon, Close as CloseIcon,
  PeopleAltOutlined, AssignmentOutlined, CalendarTodayOutlined, NotificationsOutlined, TrendingUpOutlined,
  LightbulbOutlined // New icon for reminders
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useSessionFilter } from '../context/SessionFilterContext';
import axios from 'axios';
import { format, isBefore, isAfter, addMinutes, subMinutes, parseISO, addDays, startOfDay, isWithinInterval, parse, isToday, isTomorrow } from 'date-fns';

// Define theme colors
const themePrimaryColor = '#780000'; // Dark red/maroon
const themeLightBackground = '#fefae0'; // Light cream/yellowish white
const themeButtonHoverColor = '#5a0000'; // Darker red/maroon for hover
const themeUserMessageColor = '#DCC8C8'; // Lighter red/pinkish color for user messages
const themeTextColor = '#333'; // Standard dark text color
const themeBorderColor = '#e0e0e0'; // Neutral gray for borders

const TherapistDashboard = () => {
  const { user, token, authLoading } = useAuth();
  const { clientSearchTerm, sessionDateFilter } = useSessionFilter(); // Consume from context
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [therapistProfile, setTherapistProfile] = useState(null);
  const [sessionRequests, setSessionRequests] = useState([]);
  const [expandedSessions, setExpandedSessions] = useState({}); // Corrected: Initialized with useState({})
  const [scheduledSessions, setScheduledSessions] = useState([]); // Renamed to Upcoming Appointments in UI
  const [completedSessions, setCompletedSessions] = useState([]);

  // Availability states (keeping states if backend still uses, UI is removed)
  const [availabilities, setAvailabilities] = useState([]);
  const [openAvailabilityModal, setOpenAvailabilityModal] = useState(false); // Unused, but kept
  const [editingAvailability, setEditingAvailability] = useState(null); // Unused, but kept
  const [dayOfWeek, setDayOfWeek] = useState(''); // Unused, but kept
  const [startTime, setStartTime] = useState(''); // Unused, but kept
  const [endTime, setEndTime] = useState(''); // Unused, but kept
  const [slotDuration, setSlotDuration] = useState(''); // Unused, but kept

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  // State for Notepad panel
  const [showNotepad, setShowNotepad] = useState(false);
  const [currentSessionToEdit, setCurrentSessionToEdit] = useState(null);
  const [sessionNotes, setSessionNotes] = useState('');
  const [keyTakeaways, setKeyTakeaways] = useState('');
  const [recommendations, setRecommendations] = useState('');
  // New states for follow-up recommendation
  const [followUpRecommended, setFollowUpRecommended] = useState(false);
  const [recommendedFollowUpDate, setRecommendedFollowUpDate] = useState(null); // Stored as Date object

  // Dialog states for "View All" buttons
  const [showAllCompletedModal, setShowAllCompletedModal] = useState(false);
  const [showAllRequestsModal, setShowAllRequestsModal] = useState(false);

  // Dynamic Therapist Schedule based on availabilities and scheduled sessions
  const [dynamicTherapistSchedule, setDynamicTherapistSchedule] = useState([]);

  // State for the floating reminder panel visibility
  const [showReminderPanel, setShowReminderPanel] = useState(true);


  // Function to generate schedule blocks from availabilities and sessions
  const generateScheduleBlocks = useCallback(() => {
    // const today = startOfDay(new Date()); // Not directly used in filtering here
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const daysOfWeekFull = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const schedule = days.map((day, index) => {
      const fullDayName = daysOfWeekFull[index];
      const availabilityForDay = availabilities.find(avail => avail.day_of_week === fullDayName);

      const dayEntries = [];
      
      const sessionsForDay = scheduledSessions.filter(session => {
        const sessionDate = parseISO(session.session_date);
        return format(sessionDate, 'iii') === day; // Filter by short day name (e.g., 'Mon')
      });

      if (availabilityForDay) {
        let currentSlotTime = parse(availabilityForDay.start_time, 'HH:mm', new Date());
        const endTime = parse(availabilityForDay.end_time, 'HH:mm', new Date());
        const slotDuration = availabilityForDay.slot_duration || 60;

        while (isBefore(currentSlotTime, endTime)) {
          const slotEnd = addMinutes(currentSlotTime, slotDuration);
          if (isAfter(slotEnd, endTime)) break; // Prevent overshooting end time

          const currentSlotStartFormatted = format(currentSlotTime, 'HH:mm');
          // const currentSlotEndFormatted = format(slotEnd, 'HH:mm'); // Not used

          let isBooked = false;
          let bookedClientName = '';

          for (const session of sessionsForDay) {
            const sessionStart = parse(session.session_time, 'HH:mm', new Date());
            const sessionEnd = addMinutes(sessionStart, session.duration_minutes || 60);

            // Check if the current slot overlaps with an existing session
            if (
              (isWithinInterval(currentSlotTime, { start: sessionStart, end: sessionEnd }) ||
              isWithinInterval(slotEnd, { start: sessionStart, end: sessionEnd }) ||
              (isBefore(currentSlotTime, sessionStart) && isAfter(slotEnd, sessionEnd)))
            ) {
              isBooked = true;
              bookedClientName = session.client_name;
              break;
            }
          }

          dayEntries.push({
            id: `${day}-${currentSlotStartFormatted}`,
            time: currentSlotStartFormatted,
            client: isBooked ? bookedClientName : 'Available',
            type: isBooked ? 'Session' : 'Available',
          });

          currentSlotTime = slotEnd;
        }
      } else if (sessionsForDay.length > 0) {
         // If no availability, but sessions exist for the day, list them
         sessionsForDay.forEach(session => {
           dayEntries.push({
             id: `${day}-${session.session_time}-${session.id}`,
             time: session.session_time,
             client: session.client_name,
             type: 'Session',
           });
         });
      } else {
        dayEntries.push({ id: `${day}-no-entries`, time: '', client: 'No entries', type: 'None' });
      }

      return { day, entries: dayEntries };
    });

    setDynamicTherapistSchedule(schedule);
  }, [availabilities, scheduledSessions]);

  useEffect(() => {
    generateScheduleBlocks();
  }, [availabilities, scheduledSessions, generateScheduleBlocks]);


  const fetchData = useCallback(async () => {
    try {
      if (!user || !token) {
        setLoading(false);
        return;
      }

      const profileResponse = await axios.get('http://localhost:8000/api/user/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTherapistProfile(profileResponse.data);

      const commonParams = new URLSearchParams();
      if (clientSearchTerm) {
        commonParams.append('client_search', clientSearchTerm);
      }
      if (sessionDateFilter) {
        commonParams.append('session_date', format(sessionDateFilter, 'yyyy-MM-dd'));
      }

      const requestsResponse = await axios.get(`http://localhost:8000/api/therapist/session-requests/?${commonParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSessionRequests(requestsResponse.data);

      const scheduledParams = new URLSearchParams(commonParams);
      scheduledParams.append('status', 'scheduled');
      const scheduledSessionsResponse = await axios.get(`http://localhost:8000/api/therapist/sessions/?${scheduledParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setScheduledSessions(scheduledSessionsResponse.data);

      const completedParams = new URLSearchParams(commonParams);
      completedParams.append('status', 'completed');
      const completedSessionsResponse = await axios.get(`http://localhost:8000/api/therapist/sessions/?${completedParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCompletedSessions(completedSessionsResponse.data);

    } catch (err) {
      console.error("Error fetching dashboard data:", err.response?.data || err);
      if (err.response && err.response.status === 404 && err.config.url.includes('/api/therapists/me/')) {
        setError("Profile data not found at the expected endpoint. Please check API routes.");
      } else {
        setError("Failed to load dashboard data. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  }, [user, token, clientSearchTerm, sessionDateFilter]);

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

  useEffect(() => {
    if (!authLoading && user && user.is_therapist && user.is_verified) {
      const handler = setTimeout(() => {
        fetchData();
      }, 300);
      return () => clearTimeout(handler);
    }
  }, [clientSearchTerm, sessionDateFilter, authLoading, user, fetchData]);


  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
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

      if (!request.is_paid) {
        setSnackbarMessage("Cannot create session: Payment not confirmed for this request.");
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }

      // Ensure session_duration is converted to minutes if it's in hours or another unit
      const sessionDurationMinutes = request.session_duration_minutes || request.session_duration * 60 || 60; // Default to 60 if not specified

      const response = await axios.post('http://localhost:8000/api/therapist/sessions/create/',
        {
          session_request: request.id,
          session_type: request.session_type || 'online',
          location: request.location || null,
          duration_minutes: sessionDurationMinutes, // Pass duration in minutes
          // The backend should handle setting session_date and session_time based on the request
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSnackbarMessage("Session created and request confirmed successfully!");
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      fetchData(); // Re-fetch data to update UI
    } catch (err) {
      console.error("Error creating session:", err.response?.data || err);
      const errorMessage = err.response?.data?.detail || "Failed to create session.";
      setSnackbarMessage(errorMessage);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };


  const handleJoinSession = async (session) => {
    const sessionDateTime = new Date(`${session.session_date}T${session.session_time}`);
    const now = new Date();
    const fifteenMinsBefore = subMinutes(sessionDateTime, 15);
    const sessionEndTime = addMinutes(sessionDateTime, session.duration_minutes || 60);

    if (session.zoom_meeting_url && isAfter(now, fifteenMinsBefore) && isBefore(now, sessionEndTime)) {
      window.open(session.zoom_meeting_url, '_blank');
    } else {
      let message = "Zoom meeting URL not available yet.";
      if (session.zoom_meeting_url) {
        message = "You can only join the session 15 minutes before its start time and until it ends.";
      }
      setSnackbarMessage(message);
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
    }
  };

  // Session expansion is not directly used for details anymore with the modal approach, but can be kept for other purposes
  const toggleSessionExpand = (sessionId) => {
    setExpandedSessions(prev => ({ ...prev, [sessionId]: !prev[sessionId] }));
  };

  const handleClearFilters = () => {
    // These setters are now from context, so no local action needed here
  };

  // Notepad Handlers
  const handleOpenNotepad = (session) => {
    setCurrentSessionToEdit(session);
    setSessionNotes(session.notes || '');
    setKeyTakeaways(session.key_takeaways || '');
    setRecommendations(session.recommendations || '');
    setFollowUpRecommended(session.follow_up_required || false); // Populate new state
    setRecommendedFollowUpDate(session.next_session_date ? parseISO(session.next_session_date) : null); // Populate new state as Date object
    setShowNotepad(true);
  };

  const handleCloseNotepad = () => {
    setShowNotepad(false);
    setCurrentSessionToEdit(null);
    setSessionNotes('');
    setKeyTakeaways('');
    setRecommendations('');
    setFollowUpRecommended(false); // Reset on close
    setRecommendedFollowUpDate(null); // Reset on close
  };

  const handleSaveNotes = async () => {
    if (!currentSessionToEdit) return;

    try {
      const updateData = {
        notes: sessionNotes,
        key_takeaways: keyTakeaways,
        recommendations: recommendations,
        // Include new fields for saving
        follow_up_required: followUpRecommended,
        next_session_date: recommendedFollowUpDate ? format(recommendedFollowUpDate, 'yyyy-MM-dd') : null, // Format Date object to string
      };

      await axios.patch(`http://localhost:8000/api/therapist/sessions/${currentSessionToEdit.id}/`, updateData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSnackbarMessage("Session notes and follow-up recommendation updated successfully!");
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      fetchData(); // Refresh data to reflect updated notes
      handleCloseNotepad();
    } catch (err) {
      console.error("Error saving notes:", err.response?.data || err);
      setSnackbarMessage(err.response?.data?.detail || "Failed to save notes.");
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  // New handler for marking session as complete
  const handleMarkComplete = async (sessionId) => {
      try {
          await axios.patch(`http://localhost:8000/api/therapist/sessions/${sessionId}/`, {
              status: 'completed'
          }, {
              headers: { Authorization: `Bearer ${token}` }
          });

          // Immediately remove the session from the upcoming list for instant UI feedback
          setScheduledSessions(prevSessions => prevSessions.filter(session => session.id !== sessionId));

          setSnackbarMessage('Session marked as completed!');
          setSnackbarSeverity('success');
          setSnackbarOpen(true);
          fetchData(); // Still call fetchData to ensure full data consistency from backend
      } catch (err) {
          console.error("Error marking session complete:", err.response?.data || err);
          setSnackbarMessage(err.response?.data?.detail || "Failed to mark session as complete.");
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
      }
  };

  const handleScheduleFollowUp = (clientName, clientId) => {
    navigate(`/schedule-session/${clientId}`, { state: { clientName } });
    setSnackbarMessage(`Initiating follow-up session for ${clientName}.`);
    setSnackbarSeverity('info');
    setSnackbarOpen(true);
  };


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
        <Box sx={{ p: 4, backgroundColor: 'white', borderRadius: 2, border: `1px solid ${themeBorderColor}` }}>
          <Typography variant="h6" color="error">
            {error || "Access Denied. You must be a verified therapist to view this page."}
          </Typography>
        </Box>
      </Container>
    );
  }

  const getAlertStyles = (severity) => {
    const baseStyle = {
      fontWeight: 'bold',
    };
    if (severity === 'error') {
      return {
        ...baseStyle,
        backgroundColor: themePrimaryColor,
        color: themeLightBackground,
      };
    } else if (severity === 'success') {
      return {
        ...baseStyle,
        backgroundColor: themePrimaryColor,
        color: themeLightBackground,
      };
    }
    return {
      ...baseStyle,
      backgroundColor: themePrimaryColor,
      color: themeLightBackground,
    };
  };

  const isJoinButtonActive = (session) => {
    if (!session.zoom_meeting_url) return false;
    const sessionDateTime = new Date(`${session.session_date}T${session.session_time}`);
    const now = new Date();
    const fifteenMinsBefore = subMinutes(sessionDateTime, 15);
    const sessionEndTime = addMinutes(sessionDateTime, session.duration_minutes || 60);

    return isAfter(now, fifteenMinsBefore) && isBefore(now, sessionEndTime);
  };

  const upcomingReminders = scheduledSessions.filter(session => {
    const sessionDate = parseISO(session.session_date);
    return isToday(sessionDate) || isTomorrow(sessionDate);
  }).slice(0, 3); // Still showing 3 for the reminder panel

  const newRequestRemindersSummary = sessionRequests.slice(0, 2); // Show only 2 requests in summary box


  return (
    <Box sx={{ backgroundColor: themeLightBackground, minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: themePrimaryColor, fontWeight: 'bold', mb: 4 }}>
          Therapist Dashboard
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Profile Summary - No card styling */}
        {therapistProfile && (
          <Box sx={{ p: 4, mb: 4, backgroundColor: 'transparent', borderRadius: 0, border: 'none' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" sx={{ color: themePrimaryColor, fontWeight: 'bold' }}>
                    Welcome, Dr. {therapistProfile.first_name} {therapistProfile.last_name}!
                </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1" sx={{ color: themeTextColor }}>
                  <InfoOutlined sx={{ verticalAlign: 'middle', mr: 1, color: themePrimaryColor }} />
                  <strong>Status:</strong> {therapistProfile.is_verified ? 'Verified' : 'Pending Verification'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1" sx={{ color: themeTextColor }}>
                  <AttachMoney sx={{ verticalAlign: 'middle', mr: 1, color: themePrimaryColor }} />
                  <strong>Hourly Rate:</strong> KES {therapistProfile.hourly_rate || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body1" sx={{ color: themeTextColor }}>
                  <Category sx={{ verticalAlign: 'middle', mr: 1, color: themePrimaryColor }} />
                  <strong>Specializations:</strong> {therapistProfile.specializations || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body1" sx={{ color: themeTextColor }}>
                  <Psychology sx={{ verticalAlign: 'middle', mr: 1, color: themePrimaryColor }} />
                  <strong>Approach & Modalities:</strong> {therapistProfile.approach_modalities || 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Dashboard Overview Metrics - No card styling */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 2, backgroundColor: 'transparent', borderRadius: 0, border: 'none', textAlign: 'center' }}>
              <PeopleAltOutlined sx={{ fontSize: 40, color: themePrimaryColor, mb: 1 }} />
              <Typography variant="h5" sx={{ color: themePrimaryColor, fontWeight: 'bold' }}>{completedSessions.length}</Typography>
              <Typography variant="subtitle2" sx={{ color: themeTextColor }}>Total Clients</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 2, backgroundColor: 'transparent', borderRadius: 0, border: 'none', textAlign: 'center' }}>
              <AssignmentOutlined sx={{ fontSize: 40, color: themePrimaryColor, mb: 1 }} />
              <Typography variant="h5" sx={{ color: themePrimaryColor, fontWeight: 'bold' }}>{completedSessions.length + scheduledSessions.length}</Typography>
              <Typography variant="subtitle2" sx={{ color: themeTextColor }}>Total Sessions</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 2, backgroundColor: 'transparent', borderRadius: 0, border: 'none', textAlign: 'center' }}>
              <TrendingUpOutlined sx={{ fontSize: 40, color: themePrimaryColor, mb: 1 }} />
              <Typography variant="h5" sx={{ color: therapistProfile?.years_of_experience ? themePrimaryColor : themeTextColor, fontWeight: 'bold' }}>{therapistProfile?.years_of_experience || 'N/A'}</Typography>
              <Typography variant="subtitle2" sx={{ color: themeTextColor }}>Years of Experience</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 2, backgroundColor: 'transparent', borderRadius: 0, border: 'none', textAlign: 'center' }}>
              <CalendarTodayOutlined sx={{ fontSize: 40, color: themePrimaryColor, mb: 1 }} />
              <Typography variant="h5" sx={{ color: themePrimaryColor, fontWeight: 'bold' }}>{scheduledSessions.length}</Typography>
              <Typography variant="subtitle2" sx={{ color: themeTextColor }}>Upcoming</Typography>
            </Box>
          </Grid>
        </Grid>

        {/* New Row for Important Schedule, New Sessions, Completed Sessions (as requested in previous turns) */}
        {/* This grid container ensures these 3 items are in a single row taking full width */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Important Schedule / Latest Notifications - No card styling */}
            <Grid item xs={12} md={4}>
                <Box sx={{ p: 4, backgroundColor: 'transparent', borderRadius: 0, border: 'none' }}>
                <Typography variant="h6" sx={{ color: themePrimaryColor, mb: 2, fontWeight: 'bold' }}>
                    Important Schedule / Notifications
                </Typography>
                {(upcomingReminders.length === 0 && newRequestRemindersSummary.length === 0) ? (
                    <Typography variant="body2" sx={{ color: themeTextColor }}>No urgent reminders at the moment!</Typography>
                ) : (
                    <List dense>
                    {upcomingReminders.length > 0 && (
                        <>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: themePrimaryColor }}>Upcoming Sessions:</Typography>
                        {upcomingReminders.map(session => (
                            <ListItem key={session.id} sx={{ py: 0.5, borderBottom: `1px dashed ${themeBorderColor}`, '&:last-child': { borderBottom: 'none' } }}>
                            <ListItemText
                                primary={<Typography variant="body2" sx={{ fontWeight: 'bold', color: themeTextColor }}>{session.client_name} - {format(parseISO(session.session_date), 'MMM dd')} at {session.session_time}</Typography>}
                                secondary={<Chip label={session.session_type} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />}
                            />
                            <ListItemSecondaryAction>
                                <NotificationsOutlined sx={{ color: themePrimaryColor }} />
                            </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                        </>
                    )}
                    {newRequestRemindersSummary.length > 0 && (
                        <>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: themePrimaryColor, mt: upcomingReminders.length > 0 ? 1 : 0 }}>New Requests:</Typography>
                        {newRequestRemindersSummary.map(request => (
                            <ListItem key={request.id} sx={{ py: 0.5, borderBottom: `1px dashed ${themeBorderColor}`, '&:last-child': { borderBottom: 'none' } }}>
                            <ListItemText
                                primary={<Typography variant="body2" sx={{ fontWeight: 'bold', color: themeTextColor }}>{request.client_name} - {format(parseISO(request.requested_date), 'MMM dd')}</Typography>}
                                secondary={<Chip label="Pending" size="small" sx={{ height: 20, fontSize: '0.7rem' }} />}
                            />
                            <ListItemSecondaryAction>
                                <NotificationsOutlined sx={{ color: themePrimaryColor }} />
                            </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                        </>
                    )}
                    </List>
                )}
                </Box>
            </Grid>

            {/* New Session Requests (Summary) - No card styling */}
            <Grid item xs={12} md={4}>
                <Box sx={{ p: 4, backgroundColor: 'transparent', borderRadius: 0, border: 'none' }}>
                <Typography variant="h6" sx={{ color: themePrimaryColor, mb: 2, fontWeight: 'bold' }}>
                    New Session Requests ({sessionRequests.length})
                </Typography>
                {sessionRequests.length === 0 ? (
                    <Typography sx={{ color: themeTextColor }}>No new requests.</Typography>
                ) : (
                    <List dense>
                    {/* Display only 2 requests */}
                    {newRequestRemindersSummary.map((request) => (
                        <ListItem key={request.id} sx={{ borderBottom: `1px dashed ${themeBorderColor}`, '&:last-child': { borderBottom: 'none' } }}>
                        <ListItemText
                            primary={<Typography variant="body1" sx={{ fontWeight: 'bold', color: themeTextColor }}>{request.client_name}</Typography>}
                            secondary={
                            <>
                                <Typography variant="body2" color="text.secondary">
                                {format(new Date(request.requested_date), 'MMM dd,yyyy')} at {request.requested_time}
                                </Typography>
                                <Chip
                                label={request.is_paid ? 'Paid' : 'Pending Payment'}
                                sx={{ backgroundColor: request.is_paid ? themePrimaryColor : themeUserMessageColor, color: request.is_paid ? themeLightBackground : themeTextColor, mt: 0.5 }}
                                size="small"
                                />
                            </>
                            }
                        />
                        <ListItemSecondaryAction sx={{ alignSelf: 'center' }}> {/* Center vertically */}
                            <Button
                            variant="contained"
                            size="small"
                            sx={{
                                backgroundColor: themePrimaryColor,
                                '&:hover': { backgroundColor: themeButtonHoverColor },
                                py: 0.5, // Reduced vertical padding
                                px: 1, // Reduced horizontal padding
                                fontSize: '0.75rem', // Smaller font size
                                minWidth: 'auto', // Allow button to shrink
                            }}
                            onClick={() => handleCreateSession(request.id)}
                            disabled={!request.is_paid}
                            >
                            Confirm
                            </Button>
                        </ListItemSecondaryAction>
                        </ListItem>
                    ))}
                    {sessionRequests.length > 2 && ( // Changed from 3 to 2 for the "View All" threshold
                        <Box sx={{ textAlign: 'center', mt: 2 }}>
                        <Button
                            variant="outlined"
                            sx={{ borderColor: themePrimaryColor, color: themePrimaryColor }}
                            onClick={() => setShowAllRequestsModal(true)} // Open modal
                        >
                            View All Requests
                        </Button>
                        </Box>
                    )}
                    </List>
                )}
                </Box>
            </Grid>

            {/* Completed Sessions (Summary) - No card styling */}
            <Grid item xs={12} md={4}>
                <Box sx={{ p: 4, backgroundColor: 'transparent', borderRadius: 0, border: 'none' }}>
                <Typography variant="h6" sx={{ color: themePrimaryColor, mb: 2, fontWeight: 'bold' }}>
                    Completed Sessions ({completedSessions.length})
                </Typography>
                {completedSessions.length === 0 ? (
                    <Typography sx={{ color: themeTextColor }}>No completed sessions yet.</Typography>
                ) : (
                    <List dense>
                    {completedSessions.slice(0, 3).map((session) => (
                        <ListItem key={session.id} sx={{ borderBottom: `1px dashed ${themeBorderColor}`, '&:last-child': { borderBottom: 'none' } }}>
                      <ListItemText
                            primary={<Typography variant="body1" sx={{ fontWeight: 'bold', color: themeTextColor }}>{session.client_name}</Typography>}
                            secondary={
                            <>
                                <Typography variant="body2" color="text.secondary">
                                {format(new Date(session.session_date), 'MMM dd,yyyy')}
                                </Typography>
                                {session.notes && (
                                <Typography variant="caption" color="text.secondary" noWrap>
                                    {session.notes.substring(0, 50)}...
                                </Typography>
                                )}
                            </>
                            }
                        />
                        <ListItemSecondaryAction>
                            <IconButton
                            size="small"
                            onClick={() => handleOpenNotepad(session)}
                            sx={{ color: themePrimaryColor }}
                            >
                            <EditIcon />
                            </IconButton>
                        </ListItemSecondaryAction>
                        </ListItem>
                    ))}
                    {completedSessions.length > 3 && (
                        <Box sx={{ textAlign: 'center', mt: 2 }}>
                        <Button
                            variant="outlined"
                            sx={{ borderColor: themePrimaryColor, color: themePrimaryColor }}
                            onClick={() => setShowAllCompletedModal(true)} // Open modal
                        >
                            View All Completed
                        </Button>
                        </Box>
                    )}
                    </List>
                )}
                </Box>
            </Grid>
        </Grid>

        {/* Main Content Grid - Now only contains Upcoming Appointments & Your Schedule */}
        <Grid container spacing={3}>
          {/* Upcoming Appointments & Your Schedule will now take full width of this grid */}
          <Grid item xs={12} md={12}> {/* Changed from md={8} to md={12} */}
            {/* Upcoming Appointments - No card styling */}
            <Box sx={{ p: 4, mb: 3, backgroundColor: 'transparent', borderRadius: 0, border: 'none' }}>
              <Typography variant="h6" sx={{ color: themePrimaryColor, mb: 2, fontWeight: 'bold' }}>
                Upcoming Appointments ({scheduledSessions.length})
              </Typography>
              {scheduledSessions.length === 0 ? (
                <Typography sx={{ color: themeTextColor }}>No upcoming scheduled sessions matching your filters.</Typography>
              ) : (
                <TableContainer sx={{ border: 'none', borderRadius: 0 }}>
                  <Table sx={{ minWidth: 650 }} aria-label="scheduled sessions table">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: themeLightBackground }}>
                        <TableCell sx={{ fontWeight: 'bold', color: themePrimaryColor }}>Client</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: themePrimaryColor }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: themePrimaryColor }}>Time</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: themePrimaryColor }}>Duration</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: themePrimaryColor }}>Type</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: themePrimaryColor }}>Actions</TableCell> {/* New column */}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {scheduledSessions.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell>{session.client_name}</TableCell>
                          <TableCell>{format(new Date(session.session_date), 'PPP')}</TableCell>
                          <TableCell>{session.session_time}</TableCell>
                          <TableCell>{session.duration_minutes} min</TableCell>
                          <TableCell>
                            <Chip
                              icon={session.session_type === 'online' ? <VideoCall /> : <LocationOn />}
                              label={session.session_type}
                              size="small"
                              sx={{ backgroundColor: session.session_type === 'online' ? '#E3F2FD' : '#FFF3E0', color: '#3F51B5' }}
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<VideoCall />}
                              sx={{ mr: 1, borderColor: themePrimaryColor, color: themePrimaryColor, '&:hover': { backgroundColor: `${themePrimaryColor}10` } }}
                              onClick={() => handleJoinSession(session)}
                              disabled={!isJoinButtonActive(session)}
                            >
                              Join
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<Notes />}
                              sx={{ mr: 1, borderColor: themePrimaryColor, color: themePrimaryColor, '&:hover': { backgroundColor: `${themePrimaryColor}10` } }}
                              onClick={() => handleOpenNotepad(session)}
                            >
                              Takeaways
                            </Button>
                            {/* New Mark Complete Button */}
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<CheckCircle />}
                              sx={{ backgroundColor: themePrimaryColor, '&:hover': { backgroundColor: themeButtonHoverColor } }}
                              onClick={() => handleMarkComplete(session.id)}
                            >
                              Complete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>

            {/* Your Schedule - No card styling, dynamically generated */}
            <Box sx={{ p: 4, backgroundColor: 'transparent', borderRadius: 0, border: 'none' }}>
              <Typography variant="h6" sx={{ color: themePrimaryColor, mb: 2, fontWeight: 'bold' }}>
                Your Schedule
              </Typography>
              <Grid container spacing={1} sx={{ border: 'none', borderRadius: 0, p: 1 }}>
                {dynamicTherapistSchedule.map(daySchedule => (
                  <Grid item xs={12} sm={1.7} key={daySchedule.day} sx={{ textAlign: 'center', borderRight: '1px solid #eee', '&:last-child': { borderRight: 'none' } }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: themePrimaryColor, mb: 1 }}>{daySchedule.day}</Typography>
                    <Box sx={{ height: 150, overflowY: 'auto', p: 0.5, backgroundColor: 'transparent', borderRadius: 0 }}>
                      {daySchedule.entries.length > 0 ? (
                        daySchedule.entries.map(item => (
                          <Chip
                            key={item.id}
                            label={`${item.time} - ${item.client}`}
                            size="small"
                            sx={{
                              mb: 0.5,
                              width: '100%',
                              backgroundColor: item.type === 'Session' ? '#DCC8C8' : (item.type === 'Available' ? '#F0F8FF' : '#e0e0e0'),
                              color: themeTextColor,
                              fontWeight: 'medium',
                              // New styles for truncation
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '120px', // Set a max-width for consistent chip size
                              justifyContent: 'flex-start' // Align text to start
                            }}
                          />
                        ))
                      ) : (
                        <Typography variant="caption" sx={{ color: themeTextColor }}>No entries</Typography>
                      )}
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Grid>

        </Grid> {/* End Main Content Grid */}

        {/* Floating Important Reminders Panel */}
        {(upcomingReminders.length > 0 || newRequestRemindersSummary.length > 0) && showReminderPanel && (
          <Slide direction="up" in={showReminderPanel} mountOnEnter unmountOnExit>
            <Box
              sx={{
                position: 'fixed',
                bottom: 20,
                right: 20,
                width: { xs: '90%', sm: 350 },
                backgroundColor: themeUserMessageColor, // Lighter background for pop-up
                color: themeTextColor,
                borderRadius: 2,
                boxShadow: '0px 4px 20px rgba(0,0,0,0.15)',
                zIndex: 1400,
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
                border: `1px solid ${themeBorderColor}`,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: themePrimaryColor, display: 'flex', alignItems: 'center' }}>
                  <LightbulbOutlined sx={{ mr: 1 }} /> Important Reminders
                </Typography>
                <IconButton size="small" onClick={() => setShowReminderPanel(false)}>
                  <CloseIcon sx={{ color: themePrimaryColor }} />
                </IconButton>
              </Box>
              <Divider />
              {upcomingReminders.length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: themePrimaryColor }}>Upcoming Sessions:</Typography>
                  <List dense disablePadding>
                    {upcomingReminders.map(session => (
                      <ListItem key={session.id} sx={{ py: 0.5 }}>
                        <ListItemText
                          primary={<Typography variant="body2" sx={{ fontWeight: 'bold' }}>{session.client_name} - {format(parseISO(session.session_date), 'MMM dd')} at {session.session_time}</Typography>}
                          secondary={<Chip label={session.session_type} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />}
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
              {newRequestRemindersSummary.length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: themePrimaryColor, mt: upcomingReminders.length > 0 ? 1 : 0 }}>New Requests:</Typography>
                  <List dense disablePadding>
                    {newRequestRemindersSummary.map(request => (
                      <ListItem key={request.id} sx={{ py: 0.5 }}>
                        <ListItemText
                          primary={<Typography variant="body2" sx={{ fontWeight: 'bold' }}>{request.client_name} - {format(parseISO(request.requested_date), 'MMM dd')}</Typography>}
                          secondary={<Chip label="Pending" size="small" sx={{ height: 20, fontSize: '0.7rem' }} />}
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
              {(upcomingReminders.length === 0 && newRequestRemindersSummary.length === 0) && (
                <Typography variant="body2" sx={{ color: themeTextColor }}>No urgent reminders at the moment!</Typography>
              )}
            </Box>
          </Slide>
        )}

        {/* Notepad Panel */}
        <Slide direction="left" in={showNotepad} mountOnEnter unmountOnExit>
            <Box
                elevation={6} // Still keeping elevation, but on the Box itself
                sx={{
                    position: 'fixed',
                    top: 0,
                    right: 0,
                    width: { xs: '100%', sm: '80%', md: '60%', lg: '40%' },
                    height: '100vh',
                    backgroundColor: themeLightBackground,
                    borderLeft: `2px solid ${themeBorderColor}`,
                    zIndex: 1300,
                    display: 'flex',
                    flexDirection: 'column',
                    p: 3,
                    boxSizing: 'border-box',
                    overflowY: 'auto',
                    fontFamily: 'Georgia, serif',
                    lineHeight: 1.6,
                    backgroundImage: 'repeating-linear-gradient(rgba(0,0,0,0.05) 0px, rgba(0,0,0,0.05) 1px, transparent 1px, transparent 20px)',
                    backgroundSize: '100% 20px',
                    boxShadow: '-8px 0px 15px rgba(0,0,0,0.2)',
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5" sx={{ color: themePrimaryColor, fontWeight: 'bold' }}>
                        Session Takeaways
                    </Typography>
                    <IconButton onClick={handleCloseNotepad}>
                        <CloseIcon sx={{ color: themePrimaryColor }} />
                    </IconButton>
                </Box>
                <Divider sx={{ mb: 3, bgcolor: themePrimaryColor }} />

                <Typography variant="subtitle1" sx={{ mb: 1, color: themeTextColor }}>
                  Session with: <Typography component="span" sx={{ fontWeight: 'bold', color: themePrimaryColor }}>{currentSessionToEdit?.client_name}</Typography>
                </Typography>
                <Typography variant="subtitle2" sx={{ mb: 2, color: themeTextColor }}>
                  Date: <Typography component="span" sx={{ fontWeight: 'bold', color: themePrimaryColor }}>{currentSessionToEdit ? format(new Date(currentSessionToEdit.session_date), 'PPP') : 'N/A'}</Typography>
                </Typography>

                <TextField
                    fullWidth
                    label="Session Notes"
                    multiline
                    rows={8}
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    variant="standard"
                    sx={{ mb: 3, '& .MuiInputBase-input': { backgroundColor: 'transparent' } }}
                />
                <TextField
                    fullWidth
                    label="Key Takeaways"
                    multiline
                    rows={4}
                    value={keyTakeaways}
                    onChange={(e) => setKeyTakeaways(e.target.value)}
                    variant="standard"
                    sx={{ mb: 3, '& .MuiInputBase-input': { backgroundColor: 'transparent' } }}
                />
                <TextField
                    fullWidth
                    label="Recommendations"
                    multiline
                    rows={4}
                    value={recommendations}
                    onChange={(e) => setRecommendations(e.target.value)}
                    variant="standard"
                    sx={{ mb: 3, '& .MuiInputBase-input': { backgroundColor: 'transparent' } }}
                />

                {/* New: Recommend Follow-up Session */}
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={followUpRecommended}
                            onChange={(e) => setFollowUpRecommended(e.target.checked)}
                            sx={{ color: themePrimaryColor, '&.Mui-checked': { color: themePrimaryColor } }}
                        />
                    }
                    label={<Typography sx={{ color: themeTextColor }}>Recommend Follow-up Session</Typography>}
                    sx={{ mb: 2 }}
                />
                {followUpRecommended && (
                    <TextField
                        fullWidth
                        label="Recommended Follow-up Date"
                        type="date"
                        value={recommendedFollowUpDate ? format(recommendedFollowUpDate, 'yyyy-MM-dd') : ''}
                        onChange={(e) => setRecommendedFollowUpDate(e.target.value ? parseISO(e.target.value) : null)}
                        InputLabelProps={{
                            shrink: true,
                        }}
                        variant="standard"
                        sx={{ mb: 3 }}
                    />
                )}

                <Button
                    variant="contained"
                    onClick={handleSaveNotes}
                    sx={{ backgroundColor: themePrimaryColor, '&:hover': { backgroundColor: themeButtonHoverColor }, mt: 'auto', py: 1.5, fontSize: '1rem', fontWeight: 'bold' }}
                >
                    Save Session Takeaways
                </Button>
            </Box>
        </Slide>

        {/* Dialog for View All Completed Sessions */}
        <Dialog open={showAllCompletedModal} onClose={() => setShowAllCompletedModal(false)} maxWidth="md" fullWidth>
            <DialogTitle sx={{ backgroundColor: themePrimaryColor, color: themeLightBackground, fontWeight: 'bold' }}>All Completed Sessions</DialogTitle>
            <DialogContent dividers>
                {completedSessions.length === 0 ? (
                    <Typography>No completed sessions to display.</Typography>
                ) : (
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ backgroundColor: themeLightBackground }}>
                                    <TableCell sx={{ fontWeight: 'bold', color: themePrimaryColor }}>Client</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: themePrimaryColor }}>Date</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: themePrimaryColor }}>Time</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: themePrimaryColor }}>Notes</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: themePrimaryColor }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {completedSessions.map((session) => (
                                    <TableRow key={session.id}>
                                        <TableCell>{session.client_name}</TableCell>
                                        <TableCell>{format(new Date(session.session_date), 'PPP')}</TableCell>
                                        <TableCell>{session.session_time}</TableCell>
                                        <TableCell>{session.notes ? session.notes.substring(0, 70) + '...' : 'No notes'}</TableCell>
                                        <TableCell>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                startIcon={<Notes />}
                                                sx={{ borderColor: themePrimaryColor, color: themePrimaryColor, '&:hover': { backgroundColor: `${themePrimaryColor}10` } }}
                                                onClick={() => handleOpenNotepad(session)}
                                            >
                                                View Notes
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setShowAllCompletedModal(false)} sx={{ color: themePrimaryColor }}>Close</Button>
            </DialogActions>
        </Dialog>

        {/* Dialog for View All Session Requests */}
        <Dialog open={showAllRequestsModal} onClose={() => setShowAllRequestsModal(false)} maxWidth="md" fullWidth>
            <DialogTitle sx={{ backgroundColor: themePrimaryColor, color: themeLightBackground, fontWeight: 'bold' }}>All New Session Requests</DialogTitle>
            <DialogContent dividers>
                {sessionRequests.length === 0 ? (
                    <Typography>No new session requests to display.</Typography>
                ) : (
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ backgroundColor: themeLightBackground }}>
                                    <TableCell sx={{ fontWeight: 'bold', color: themePrimaryColor }}>Client</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: themePrimaryColor }}>Requested Date</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: themePrimaryColor }}>Requested Time</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: themePrimaryColor }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: themePrimaryColor }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {sessionRequests.map((request) => (
                                    <TableRow key={request.id}>
                                        <TableCell>{request.client_name}</TableCell>
                                        <TableCell>{format(new Date(request.requested_date), 'PPP')}</TableCell>
                                        <TableCell>{request.requested_time}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={request.is_paid ? 'Paid' : 'Pending Payment'}
                                                sx={{ backgroundColor: request.is_paid ? themePrimaryColor : themeUserMessageColor, color: request.is_paid ? themeLightBackground : themeTextColor }}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="contained"
                                                size="small"
                                                sx={{ backgroundColor: themePrimaryColor, '&:hover': { backgroundColor: themeButtonHoverColor } }}
                                                onClick={() => handleCreateSession(request.id)}
                                                disabled={!request.is_paid}
                                            >
                                                Confirm
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setShowAllRequestsModal(false)} sx={{ color: themePrimaryColor }}>Close</Button>
            </DialogActions>
        </Dialog>

        <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
          <Alert
            onClose={handleSnackbarClose}
            severity={snackbarSeverity}
            sx={{ ...getAlertStyles(snackbarSeverity), width: '100%' }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default TherapistDashboard;