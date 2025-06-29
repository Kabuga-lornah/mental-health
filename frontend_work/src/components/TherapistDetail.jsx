// frontend_work/src/components/TherapistDetail.jsx
import React, { useState, useEffect, useCallback } from 'react';
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
  // Card, CardContent removed
  Divider,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, addDays } from 'date-fns';

export default function TherapistDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [therapist, setTherapist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedDate, setSelectedDate] = useState(null);
  const [availableSlots, setAvailableSlots] = useState({});
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [message, setMessage] = useState('');

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [mpesaPhoneNumber, setMpesaPhoneNumber] = useState('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [currentSessionRequestId, setCurrentSessionRequestId] = useState(null);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const fetchTherapistDetailsAndAvailability = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const therapistResponse = await axios.get(`http://localhost:8000/api/therapists/${id}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setTherapist(therapistResponse.data);

      const today = new Date();
      const futureDate = addDays(today, 60);

      const formattedToday = format(today, 'yyyy-MM-dd');
      const formattedFutureDate = format(futureDate, 'yyyy-MM-dd');

      const availabilityResponse = await axios.get(`http://localhost:8000/api/therapists/${id}/available-slots/?start_date=${formattedToday}&end_date=${formattedFutureDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAvailableSlots(availabilityResponse.data);

    } catch (err) {
      console.error("Error fetching therapist details or availability:", err.response?.data || err.message);
      setError("Failed to load therapist details or availability. Please ensure the backend is running and the therapist ID is valid.");
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    if (user && token && id) {
      fetchTherapistDetailsAndAvailability();
    }
  }, [user, token, id, fetchTherapistDetailsAndAvailability]);

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
    setMpesaPhoneNumber('');
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  const handleSessionRequest = async () => {
    if (!selectedSlot) {
      setSnackbarMessage("Please select an available time slot first.");
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    if (!user) {
      navigate('/login');
      return;
    }

    setPaymentProcessing(true);
    setSnackbarMessage('Creating session request...');
    setSnackbarSeverity('info');
    setSnackbarOpen(true);
    setError(null);

    const requestData = {
      therapist: id,
      requested_date: selectedSlot.date,
      requested_time: selectedSlot.start_time,
      message: message,
      session_duration: selectedSlot.duration_minutes || 120,
    };

    try {
      const response = await axios.post('http://localhost:8000/api/session-requests/', requestData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCurrentSessionRequestId(response.data.session_request_id);

      if (response.data.is_free_consultation) {
        setSnackbarMessage("Session request submitted for free consultation. Therapist will review.");
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        navigate('/dashboard');
      } else {
        setSnackbarMessage("Session request created. Proceeding to payment.");
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        setShowPaymentModal(true);
      }

    } catch (err) {
      console.error("Error creating session request:", err.response?.data || err);
      const errorMessage = err.response?.data?.detail
        ? (Array.isArray(err.response.data.detail) ? err.response.data.detail.join(', ') : err.response.data.detail)
        : "Failed to send session request. Please try again.";
      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleInitiatePayment = async () => {
    setPaymentProcessing(true);
    setSnackbarMessage('Initiating M-Pesa STK Push...');
    setSnackbarSeverity('info');
    setSnackbarOpen(true);
    setError(null);

    if (!mpesaPhoneNumber || !currentSessionRequestId || !therapist?.id || !therapist?.hourly_rate) {
      setSnackbarMessage("Missing payment details. Please try again.");
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      setPaymentProcessing(false);
      return;
    }

    const paymentData = {
      session_request_id: currentSessionRequestId,
      therapist: therapist.id,
      amount: parseFloat(therapist.hourly_rate),
      mpesa_phone_number: mpesaPhoneNumber
    };

    try {
      const response = await axios.post('http://localhost:8000/api/payments/initiate/', paymentData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSnackbarMessage("M-Pesa STK Push initiated. Please check your phone to complete the payment.");
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setShowPaymentModal(false);
      setMpesaPhoneNumber('');
      setSelectedSlot(null);
      setMessage('');

      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);

    } catch (err) {
      console.error("Error initiating M-Pesa payment:", err.response?.data || err.message);
      const errorMessage = err.response?.data?.error || "Failed to initiate M-Pesa payment. Please try again.";
      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleStartChat = () => {
    if (!user || !therapist) {
      // Redirect to login or show an alert
      navigate('/login');
      return;
    }
    // Generate room name (ensure consistent ordering)
    const roomName = `chat_${Math.min(user.id, therapist.id)}_${Math.max(user.id, therapist.id)}`;
    navigate(`/chat/${roomName}`); // Navigate to a new chat route
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', backgroundColor: '#fefae0' }}>
        <CircularProgress sx={{ color: '#780000' }} />
        <Typography sx={{ ml: 2, color: '#780000' }}>Loading therapist details...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4, backgroundColor: '#fefae0', minHeight: '80vh', py: 8 }}>
        <Typography color="error" variant="h6">{error}</Typography>
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
      <Box sx={{ textAlign: 'center', mt: 4, backgroundColor: '#fefae0', minHeight: '80vh', py: 8 }}>
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

  const isButtonDisabled = (user && user.is_therapist) || !therapist.is_available;

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#fefae0', py: { xs: 4, md: 8 } }}>
      <Container maxWidth="lg">
        <Paper elevation={8} sx={{ p: { xs: 3, sm: 5 }, borderRadius: 4, backgroundColor: 'white', overflow: 'hidden' }}>
          <Grid container spacing={{ xs: 4, md: 6 }} alignItems="flex-start">
            {/* Therapist Profile and Photo Section (Left Column) */}
            <Grid item xs={12} md={4} sx={{ textAlign: 'center', pr: { md: 4 } }}>
              {/* Unique Photo Display */}
              <Box
                sx={{
                  width: 240, // Increased size for more impact
                  height: 280, // Rectangular shape
                  overflow: 'hidden',
                  mx: 'auto',
                  mb: 3,
                  border: '6px solid #780000',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.3)', // Stronger shadow
                  position: 'relative', // For pseudo-elements or more complex shapes
                  // Example: A skewed rectangle
                  transform: 'skewY(-5deg)',
                  '& img': {
                    transform: 'skewY(5deg)', // Counter-skew the image
                  },
                  borderRadius: 2, // Slight border radius
                }}
              >
                <img
                  src={therapist.profile_picture || `https://placehold.co/240x280/780000/fefae0?text=${(therapist.full_name || 'T').charAt(0)}`}
                  alt={therapist.full_name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </Box>
              <Typography variant="h4" sx={{ color: '#780000', fontWeight: 'bold', mb: 1.5, letterSpacing: 0.5 }}>
                {therapist.full_name}
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 2.5, fontStyle: 'italic', fontSize: '1.15rem' }}>
                {therapist.license_credentials || 'Licensed Therapist'}
              </Typography>
              {user && user.id !== therapist.id && ( // Only show chat button if not viewing your own profile
                <Button
                    variant="contained"
                    onClick={handleStartChat}
                    sx={{
                        backgroundColor: '#780000',
                        '&:hover': { backgroundColor: '#5a0000' },
                        mt: 2,
                        py: 1,
                        px: 3,
                        borderRadius: 2,
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 10px rgba(120, 0, 0, 0.4)',
                    }}
                >
                    Chat with {therapist.first_name}
                </Button>
            )}
            </Grid>

            {/* Therapist Details Section (Right Column) */}
            <Grid item xs={12} md={8}>
              {/* About Me */}
              <Box sx={{ mb: 4, p: 3.5, borderRadius: 3, backgroundColor: '#fdf8f5', boxShadow: '0 5px 15px rgba(0,0,0,0.08)' }}>
                <Typography variant="h5" sx={{ color: '#780000', fontWeight: 'bold', mb: 2, borderBottom: '2px solid #DCC8C8', pb: 1.5 }}>
                  About Me
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                  {therapist.bio || 'This therapist has not yet provided a personal biography. Please check back later for more details about their background and philosophy.'}
                </Typography>
              </Box>

              {/* Professional Details */}
              <Box sx={{ mb: 4, p: 3.5, borderRadius: 3, backgroundColor: '#fdf8f5', boxShadow: '0 5px 15px rgba(0,0,0,0.08)' }}>
                <Typography variant="h5" sx={{ color: '#780000', fontWeight: 'bold', mb: 2, borderBottom: '2px solid #DCC8C8', pb: 1.5 }}>
                  Professional Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1" sx={{ color: '#5a0000' }}><strong>Years of Experience:</strong> {therapist.years_of_experience || 'N/A'}</Typography>
                  </Grid>
                  {!therapist.is_free_consultation && (
                    <>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body1" sx={{ color: '#5a0000' }}><strong>Hourly Rate:</strong> {therapist.hourly_rate ? `Ksh ${parseFloat(therapist.hourly_rate).toFixed(2)}` : 'N/A'}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body1" sx={{ color: '#5a0000' }}><strong>Accepts Insurance:</strong> {therapist.insurance_accepted ? 'Yes' : 'No'}</Typography>
                      </Grid>
                    </>
                  )}
                  {therapist.is_free_consultation && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body1" sx={{ color: 'green', fontWeight: 'bold' }}><strong>Consultation Fee:</strong> Free Initial Consultation</Typography>
                    </Grid>
                  )}
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1" sx={{ color: '#5a0000' }}><strong>Languages Spoken:</strong> {therapist.languages_spoken || 'Not specified'}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body1" sx={{ color: '#5a0000' }}><strong>Client Focus:</strong> {therapist.client_focus || 'Not specified'}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body1" sx={{ color: '#5a0000' }}><strong>Approach/Modalities:</strong> {therapist.approach_modalities || 'No specific approach listed.'}</Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* Session Information */}
              <Box sx={{ mb: 4, p: 3.5, borderRadius: 3, backgroundColor: '#fdf8f5', boxShadow: '0 5px 15px rgba(0,0,0,0.08)' }}>
                <Typography variant="h5" sx={{ color: '#780000', fontWeight: 'bold', mb: 2, borderBottom: '2px solid #DCC8C8', pb: 1.5 }}>
                  Session Information
                </Typography>
                <Typography variant="body1" sx={{ color: '#5a0000' }}>
                  <strong>Session Modes:</strong> {therapist.session_modes ? therapist.session_modes.replace('both', 'Online & Physical') : 'N/A'}
                </Typography>
                {therapist.session_modes && (therapist.session_modes === 'physical' || therapist.session_modes === 'both') && (
                  <Typography variant="body1" sx={{ color: '#5a0000', mt: 1 }}>
                    <strong>Physical Location:</strong> {therapist.physical_address || 'Not specified'}
                  </Typography>
                )}
              </Box>

              {/* Specializations */}
              {therapist.specializations && therapist.specializations.length > 0 && (
                <Box sx={{ mb: 4, p: 3.5, borderRadius: 3, backgroundColor: '#fdf8f5', boxShadow: '0 5px 15px rgba(0,0,0,0.08)' }}>
                  <Typography variant="h5" sx={{ color: '#780000', fontWeight: 'bold', mb: 2, borderBottom: '2px solid #DCC8C8', pb: 1.5 }}>
                    Specializations
                  </Typography>
                  <Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap">
                    {therapist.specializations.split(',').map((spec, index) => (
                      <Chip key={index} label={spec.trim()} size="medium"
                        sx={{
                          backgroundColor: '#DCC8C8',
                          color: '#333',
                          fontWeight: 'medium',
                          fontSize: '0.9rem',
                          p: '5px 10px',
                          borderRadius: '16px', // Standard chip look
                        }}
                      />
                    ))}
                  </Stack>
                </Box>
              )}

              {/* Video Introduction */}
              {therapist.video_introduction_url && (
                <Box sx={{ mb: 4, p: 3.5, borderRadius: 3, backgroundColor: '#fdf8f5', boxShadow: '0 5px 15px rgba(0,0,0,0.08)' }}>
                  <Typography variant="h5" sx={{ color: '#780000', fontWeight: 'bold', mb: 2, borderBottom: '2px solid #DCC8C8', pb: 1.5 }}>
                    Video Introduction
                  </Typography>
                  {/* Replaced Card with Box for video embed */}
                  <Box sx={{ maxWidth: 600, mx: 'auto', bgcolor: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: 2, p: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Watch this brief video to learn more about the therapist's approach.
                    </Typography>
                    <Box sx={{ position: 'relative', width: '100%', paddingTop: '56.25%', borderRadius: 1, overflow: 'hidden' }}>
                      <iframe
                        src={therapist.video_introduction_url}
                        title="Therapist Introduction"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                      ></iframe>
                    </Box>
                  </Box>
                  <Typography variant="caption" display="block" sx={{ mt: 1.5, textAlign: 'center', color: 'text.secondary' }}>
                    <a href={therapist.video_introduction_url} target="_blank" rel="noopener noreferrer" style={{ color: '#780000', textDecoration: 'none', fontWeight: 'bold' }}>
                      Open video in new tab <i className="fas fa-external-link-alt" style={{ marginLeft: '5px' }}></i>
                    </a>
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>

          {/* Booking Section */}
          <Box sx={{ mt: { xs: 4, md: 6 }, p: { xs: 3, sm: 5 }, borderRadius: 4, backgroundColor: '#fff3e0', boxShadow: '0 8px 20px rgba(0,0,0,0.15)' }}>
            <Typography variant="h4" sx={{ color: '#780000', mb: 4, fontWeight: 'bold', textAlign: 'center' }}>
              Book a Session
            </Typography>

            {therapist.is_free_consultation ? (
              <Typography variant="h6" sx={{ mb: 3, color: 'green', fontWeight: 'bold', textAlign: 'center' }}>
                This therapist offers a FREE initial consultation. No payment is required!
              </Typography>
            ) : (
              <Typography variant="h6" sx={{ mb: 3, color: '#780000', fontWeight: 'bold', textAlign: 'center' }}>
                Session Rate: Ksh {therapist.hourly_rate ? parseFloat(therapist.hourly_rate).toFixed(2) : 'N/A'} per session
              </Typography>
            )}

            <Grid container spacing={4}>
              <Grid item xs={12} sm={6}>
                <Typography variant="h6" sx={{ mb: 1.5, color: '#780000', fontWeight: 'bold' }}>Select Date:</Typography>
                <DatePicker
                  selected={selectedDate}
                  onChange={(date) => {
                    setSelectedDate(date);
                    setSelectedSlot(null);
                  }}
                  minDate={new Date()}
                  dateFormat="yyyy-MM-dd"
                  placeholderText="Click to select a date"
                  customInput={<TextField fullWidth variant="outlined" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />}
                  filterDate={(date) => date.getDay() !== 0 && date.getDay() !== 6}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="h6" sx={{ mb: 1.5, color: '#780000', fontWeight: 'bold' }}>Available Time Slots:</Typography>
                <Paper variant="outlined" sx={{ p: 2.5, minHeight: 150, maxHeight: 250, overflowY: 'auto', bgcolor: '#fdf8f5', borderRadius: 2, border: '1px solid #DCC8C8' }}>
                  {selectedDate ? (
                    (() => {
                      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
                      const slots = availableSlots[formattedDate];
                      if (slots && slots.length > 0) {
                        return (
                          <Grid container spacing={1.5}>
                            {slots.map((slot, index) => (
                              <Grid item key={index} xs={6}>
                                <Button
                                  fullWidth
                                  variant={selectedSlot?.date === formattedDate && selectedSlot?.start_time === slot.start_time ? 'contained' : 'outlined'}
                                  onClick={() => setSelectedSlot({ date: formattedDate, start_time: slot.start_time, end_time: slot.end_time, duration_minutes: slot.duration_minutes })}
                                  sx={{
                                    borderColor: '#780000',
                                    color: selectedSlot?.date === formattedDate && selectedSlot?.start_time === slot.start_time ? 'white' : '#780000',
                                    backgroundColor: selectedSlot?.date === formattedDate && selectedSlot?.start_time === slot.start_time ? '#780000' : 'transparent',
                                    '&:hover': {
                                      backgroundColor: '#5a0000',
                                      color: 'white',
                                      borderColor: '#5a0000',
                                    },
                                    textTransform: 'none',
                                    borderRadius: 1.5,
                                    py: 1,
                                  }}
                                >
                                  {slot.start_time} - {slot.end_time}
                                </Button>
                              </Grid>
                            ))}
                          </Grid>
                        );
                      } else {
                        return <Typography variant="body1" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>No available slots for this date. Please try another date.</Typography>;
                      }
                    })()
                  ) : (
                    <Typography variant="body1" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>Please select a date to view available time slots.</Typography>
                  )}
                </Paper>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Message to Therapist (Optional)"
                  multiline
                  rows={4}
                  variant="outlined"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  sx={{ mt: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  placeholder="Share any specific concerns or questions you have for the therapist."
                />
              </Grid>
            </Grid>
            <Button
              variant="contained"
              fullWidth
              sx={{
                backgroundColor: '#780000',
                '&:hover': { backgroundColor: '#5a0000' },
                mt: 4,
                py: 1.8,
                borderRadius: 2.5,
                fontSize: '1.1rem',
                fontWeight: 'bold',
                boxShadow: '0 4px 10px rgba(120, 0, 0, 0.4)',
              }}
              onClick={handleSessionRequest}
              disabled={isButtonDisabled || !selectedSlot || paymentProcessing}
            >
              {isButtonDisabled ?
                (user && user.is_therapist ? "Therapists Cannot Book Sessions" : "Therapist Not Available for Booking")
                : (paymentProcessing ? <CircularProgress size={26} color="inherit" /> : 'Request Session Now')}
            </Button>
          </Box>
        </Paper>
      </Container>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onClose={handleClosePaymentModal} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ backgroundColor: '#780000', color: 'white', fontWeight: 'bold', pb: 2 }}>
          Complete Payment
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            You are requesting a session with <span style={{ fontWeight: 'bold', color: '#780000' }}>{therapist?.full_name}</span> on <span style={{ fontWeight: 'bold' }}>{selectedSlot?.date}</span> at <span style={{ fontWeight: 'bold' }}>{selectedSlot?.start_time}</span>.
          </Typography>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: '#5a0000' }}>
            Amount Due: <span style={{ color: '#780000' }}>KES {therapist.hourly_rate ? parseFloat(therapist.hourly_rate).toFixed(2) : 'N/A'}</span>
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="M-Pesa Phone Number (e.g., 254712345678)"
            type="tel"
            fullWidth
            variant="outlined"
            value={mpesaPhoneNumber}
            onChange={(e) => setMpesaPhoneNumber(e.target.value)}
            helperText="Enter your M-Pesa registered phone number for the STK Push simulation."
            sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            disabled={paymentProcessing}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={handleClosePaymentModal} sx={{ color: '#780000', '&:hover': { backgroundColor: '#f5f5f5' } }} disabled={paymentProcessing}>Cancel</Button>
          <Button onClick={handleInitiatePayment} variant="contained"
            sx={{
              backgroundColor: '#780000',
              '&:hover': { backgroundColor: '#5a0000' },
              py: 1,
              px: 3,
              borderRadius: 2,
            }}
            disabled={!mpesaPhoneNumber || paymentProcessing}>
            {paymentProcessing ? <CircularProgress size={24} color="inherit" /> : 'Pay Now'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}