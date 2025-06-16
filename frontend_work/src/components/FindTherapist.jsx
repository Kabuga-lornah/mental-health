import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Grid,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Snackbar,
  Alert,
  Chip,
  Stack
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; 

export default function FindTherapist() {
  const { user, token } = useAuth();
  const [therapists, setTherapists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openRequestModal, setOpenRequestModal] = useState(false);
  const [selectedTherapist, setSelectedTherapist] = useState(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestedDate, setRequestedDate] = useState('');
  const [requestedTime, setRequestedTime] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  useEffect(() => {
    const fetchTherapists = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get('http://localhost:8000/api/therapists/', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setTherapists(response.data);
      } catch (err) {
        console.error("Error fetching therapists:", err);
        setError("Failed to load therapists. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (user && token) {
      fetchTherapists();
    }
  }, [user, token]);

  const handleRequestSessionClick = (therapist) => {
    setSelectedTherapist(therapist);
    setOpenRequestModal(true);
  };

  const handleCloseRequestModal = () => {
    setOpenRequestModal(false);
    setSelectedTherapist(null);
    setRequestMessage('');
    setRequestedDate('');
    setRequestedTime('');
  };

  const handleSubmitSessionRequest = async () => {
    try {
      if (!user) throw new Error("You must be logged in to request a session.");
      if (!selectedTherapist) throw new Error("No therapist selected.");
      if (!requestedDate || !requestedTime) throw new Error("Please select a preferred date and time.");

      const payload = {
        therapist: selectedTherapist.id,
        message: requestMessage,
        requested_date: requestedDate,
        requested_time: requestedTime,
        status: 'pending'
      };

      await axios.post('http://localhost:8000/api/session-requests/', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      setSnackbarMessage(`Session request sent to ${selectedTherapist.full_name}!`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      handleCloseRequestModal();
    } catch (err) {
      console.error("Error sending session request:", err.response?.data || err.message);
      setSnackbarMessage(err.response?.data?.therapist?.[0] || err.message || "Failed to send session request.");
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress sx={{ color: '#780000' }} />
        <Typography sx={{ ml: 2, color: '#780000' }}>Loading therapists...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#fefae0', py: 8 }}>
      <Container maxWidth="lg">
        <Typography variant="h4" sx={{ color: '#780000', mb: 4, textAlign: 'center', fontWeight: 'bold' }}>
          Find a Therapist
        </Typography>

        {therapists.length === 0 ? (
          <Typography variant="h6" sx={{ textAlign: 'center', color: '#780000', mt: 4 }}>
            No therapists currently available. Please check back later!
          </Typography>
        ) : (
          <Grid container spacing={4}>
            {therapists.map((therapist) => (
              <Grid item xs={12} sm={6} md={4} key={therapist.id}>
                <Paper elevation={3} sx={{ p: 3, backgroundColor: 'white', borderRadius: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <img
                      src={therapist.profile_picture || `https://placehold.co/60x60/780000/fefae0?text=${(therapist.full_name || 'T').charAt(0)}`}
                      alt={therapist.full_name}
                      style={{ borderRadius: '50%', width: 60, height: 60, objectFit: 'cover', marginRight: 15 }}
                    />
                    <Box>
                      <Typography variant="h6" sx={{ color: '#780000', fontWeight: 'bold' }}>
                        {therapist.full_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {therapist.email}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>Availability:</strong> {therapist.is_available ? 'Available' : 'Not Available'}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>Rate:</strong> {therapist.hourly_rate ? `Ksh ${parseFloat(therapist.hourly_rate).toFixed(2)}/hour` : 'N/A'}
                  </Typography>
                  {therapist.years_of_experience && (
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Experience:</strong> {therapist.years_of_experience} years
                    </Typography>
                  )}
                  
                  {/* Display Specializations as Chips */}
                  {therapist.specializations && (
                    <Box sx={{ my: 2 }}>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                        Specializations:
                      </Typography>
                      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                        {therapist.specializations.split(',').map((spec, index) => (
                          <Chip key={index} label={spec.trim()} size="small" sx={{ backgroundColor: '#DCC8C8', color: '#333' }} />
                        ))}
                      </Stack>
                    </Box>
                  )}

                  {therapist.bio && (
                    <Typography variant="body2" sx={{ mb: 2, flexGrow: 1 }}>
                      {therapist.bio.length > 100 ? `${therapist.bio.substring(0, 100)}...` : therapist.bio}
                    </Typography>
                  )}

                  <Button
                    variant="contained"
                    fullWidth
                    sx={{
                      backgroundColor: '#780000',
                      '&:hover': { backgroundColor: '#5a0000' },
                      mt: 'auto',
                      borderRadius: 2,
                    }}
                    onClick={() => handleRequestSessionClick(therapist)}
                    disabled={!therapist.is_available || (user && user.is_therapist)}
                  >
                    {user && user.is_therapist ? "Therapists Cannot Request" : "Request Session"}
                  </Button>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      {/* Session Request Modal */}
      <Dialog open={openRequestModal} onClose={handleCloseRequestModal}>
        <DialogTitle sx={{ color: '#780000', fontWeight: 'bold' }}>Request Session with {selectedTherapist?.full_name}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Preferred Date"
            type="date"
            fullWidth
            variant="outlined"
            InputLabelProps={{ shrink: true }}
            value={requestedDate}
            onChange={(e) => setRequestedDate(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Preferred Time"
            type="time"
            fullWidth
            variant="outlined"
            InputLabelProps={{ shrink: true }}
            value={requestedTime}
            onChange={(e) => setRequestedTime(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Message (Optional)"
            type="text"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={requestMessage}
            onChange={(e) => setRequestMessage(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRequestModal} sx={{ color: '#780000' }}>Cancel</Button>
          <Button onClick={handleSubmitSessionRequest} variant="contained" sx={{ backgroundColor: '#780000', '&:hover': { backgroundColor: '#5a0000' } }}>Send Request</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for feedback */}
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
