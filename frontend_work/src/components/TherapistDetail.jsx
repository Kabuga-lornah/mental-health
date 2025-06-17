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
  Snackbar,
  Alert,
  Chip,
  Stack,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function TherapistDetail() {
  const { id } = useParams(); // Get therapist ID from URL
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [therapist, setTherapist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // States for Session Request Modal
  const [openRequestModal, setOpenRequestModal] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestedDate, setRequestedDate] = useState('');
  const [requestedTime, setRequestedTime] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  useEffect(() => {
    const fetchTherapistDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`http://localhost:8000/api/therapists/${id}/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setTherapist(response.data);
      } catch (err) {
        console.error("Error fetching therapist details:", err);
        setError("Failed to load therapist details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (user && token && id) {
      fetchTherapistDetails();
    }
  }, [user, token, id]);

  const handleRequestSessionClick = () => {
    setOpenRequestModal(true);
  };

  const handleCloseRequestModal = () => {
    setOpenRequestModal(false);
    setRequestMessage('');
    setRequestedDate('');
    setRequestedTime('');
  };

  const handleSubmitSessionRequest = async () => {
    try {
      if (!user) throw new Error("You must be logged in to request a session.");
      if (!therapist) throw new Error("Therapist data not loaded.");
      if (!requestedDate || !requestedTime) throw new Error("Please select a preferred date and time.");

      const payload = {
        therapist: therapist.id,
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
      
      setSnackbarMessage(`Session request sent to ${therapist.full_name}!`);
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
        <Typography sx={{ ml: 2, color: '#780000' }}>Loading therapist details...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography color="error">{error}</Typography>
        <Button 
          variant="contained" 
          sx={{ mt: 2, backgroundColor: '#780000', '&:hover': { backgroundColor: '#5a0000' } }} 
          onClick={() => navigate('/find-therapist')}
        >
          Back to Therapists
        </Button>
      </Box>
    );
  }

  if (!therapist) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="h6" sx={{ color: '#780000' }}>Therapist not found or not available.</Typography>
        <Button 
          variant="contained" 
          sx={{ mt: 2, backgroundColor: '#780000', '&:hover': { backgroundColor: '#5a0000' } }} 
          onClick={() => navigate('/find-therapist')}
        >
          Back to Therapists
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#fefae0', py: 8 }}>
      <Container maxWidth="md">
        <Paper elevation={6} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 3, backgroundColor: 'white' }}>
          <Grid container spacing={4} alignItems="flex-start">
            <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
              <img
                src={therapist.profile_picture || `https://placehold.co/150x150/780000/fefae0?text=${(therapist.full_name || 'T').charAt(0)}`}
                alt={therapist.full_name}
                style={{ borderRadius: '50%', width: 180, height: 180, objectFit: 'cover', border: '4px solid #780000' }}
              />
              <Typography variant="h5" sx={{ color: '#780000', mt: 2, fontWeight: 'bold' }}>
                {therapist.full_name}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
                {therapist.license_credentials}
              </Typography>
              <Chip 
                label={therapist.is_available ? 'Available' : 'Not Available'} 
                color={therapist.is_available ? 'success' : 'error'} 
                size="small" 
                sx={{ mt: 1, px: 1 }}
              />
              <Button
                variant="contained"
                fullWidth
                sx={{
                  backgroundColor: '#780000',
                  '&:hover': { backgroundColor: '#5a0000' },
                  mt: 3,
                  py: 1.5,
                  borderRadius: 2,
                }}
                onClick={handleRequestSessionClick}
                disabled={!therapist.is_available || (user && user.is_therapist)}
              >
                {user && user.is_therapist ? "Therapists Cannot Request" : "Request Session"}
              </Button>
            </Grid>

            <Grid item xs={12} md={8}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ color: '#780000', fontWeight: 'bold', mb: 1 }}>
                  About Me
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {therapist.bio || 'No bio provided yet.'}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ color: '#780000', fontWeight: 'bold', mb: 1 }}>
                  Professional Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2"><strong>Years of Experience:</strong> {therapist.years_of_experience || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2"><strong>Hourly Rate:</strong> {therapist.hourly_rate ? `Ksh ${parseFloat(therapist.hourly_rate).toFixed(2)}` : 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2"><strong>Accepts Insurance:</strong> {therapist.insurance_accepted ? 'Yes' : 'No'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2"><strong>Languages Spoken:</strong> {therapist.languages_spoken || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2"><strong>Client Focus:</strong> {therapist.client_focus || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2"><strong>Approach/Modalities:</strong> {therapist.approach_modalities || 'No specific approach listed.'}</Typography>
                  </Grid>
                </Grid>
              </Box>

              {therapist.specializations && therapist.specializations.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ color: '#780000', fontWeight: 'bold', mb: 1 }}>
                      Specializations
                    </Typography>
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                      {therapist.specializations.split(',').map((spec, index) => (
                        <Chip key={index} label={spec.trim()} size="medium" sx={{ backgroundColor: '#DCC8C8', color: '#333' }} />
                      ))}
                    </Stack>
                  </Box>
                </>
              )}

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ color: '#780000', fontWeight: 'bold', mb: 1 }}>
                  Contact
                </Typography>
                <Typography variant="body2"><strong>Email:</strong> {therapist.email}</Typography>
                <Typography variant="body2"><strong>Phone:</strong> {therapist.phone || 'N/A'}</Typography>
              </Box>

              {therapist.video_introduction_url && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ color: '#780000', fontWeight: 'bold', mb: 1 }}>
                      Video Introduction
                    </Typography>
                    <Card sx={{ maxWidth: 560, mx: 'auto', bgcolor: '#f5f5f5' }}>
                      <CardContent>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Watch this brief video to learn more about the therapist's approach.
                        </Typography>
                        <Box sx={{ position: 'relative', width: '100%', paddingTop: '56.25%' /* 16:9 Aspect Ratio */ }}>
                            <iframe
                                src={therapist.video_introduction_url}
                                title="Therapist Introduction"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                            ></iframe>
                        </Box>
                      </CardContent>
                    </Card>
                    <Typography variant="caption" display="block" sx={{ mt: 1, textAlign: 'center', color: 'text.secondary' }}>
                      <a href={therapist.video_introduction_url} target="_blank" rel="noopener noreferrer" style={{ color: '#780000' }}>
                        Open video in new tab
                      </a>
                    </Typography>
                  </Box>
                </>
              )}
            </Grid>
          </Grid>
        </Paper>
      </Container>

      {/* Session Request Modal */}
      <Dialog open={openRequestModal} onClose={handleCloseRequestModal}>
        <DialogTitle sx={{ color: '#780000', fontWeight: 'bold' }}>Request Session with {therapist?.full_name}</DialogTitle>
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
