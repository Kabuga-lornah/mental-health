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
  Card,
  CardContent,
  Divider,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import DatePicker from 'react-datepicker'; // Import react-datepicker
import 'react-datepicker/dist/react-datepicker.css'; // Import react-datepicker styles
import { format, addDays } from 'date-fns'; // Import date-fns utilities

export default function TherapistDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth(); // Assuming 'token' contains the access token directly from AuthContext
  const [therapist, setTherapist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New states for scheduling
  const [selectedDate, setSelectedDate] = useState(null); // Date selected by user in calendar
  const [availableSlots, setAvailableSlots] = useState({}); // { 'YYYY-MM-DD': [{start_time: 'HH:MM', end_time: 'HH:MM', duration_minutes: N}] }
  const [selectedSlot, setSelectedSlot] = useState(null); // The actual slot object selected {date: 'YYYY-MM-DD', start_time: 'HH:MM', end_time: 'HH:MM'}
  const [message, setMessage] = useState(''); // Message to therapist

  // New states for payment and session request flow
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [mpesaPhoneNumber, setMpesaPhoneNumber] = useState('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [currentSessionRequestId, setCurrentSessionRequestId] = useState(null); // ID of the created SessionRequest

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  // Removed old requestedDate, requestedTime, openRequestModal, paymentAmount (derived from therapist.hourly_rate), handleSubmitSessionRequest, handleSubmitPayment

  const fetchTherapistDetailsAndAvailability = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch therapist details
      const therapistResponse = await axios.get(`http://localhost:8000/api/therapists/${id}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setTherapist(therapistResponse.data);

      // 2. Fetch therapist availability for a range (e.g., next 60 days)
      const today = new Date();
      const futureDate = addDays(today, 60); // Fetch for the next 60 days

      const formattedToday = format(today, 'yyyy-MM-dd');
      const formattedFutureDate = format(futureDate, 'yyyy-MM-dd');

      const availabilityResponse = await axios.get(`http://localhost:8000/api/therapists/${id}/available-slots/?start_date=${formattedToday}&end_date=${formattedFutureDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAvailableSlots(availabilityResponse.data); // Store available slots grouped by date

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
    // Optionally, clear currentSessionRequestId if the payment flow is cancelled entirely
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  // New function to handle the initial session request (before payment)
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

    setPaymentProcessing(true); // Indicate that a request is being processed
    setSnackbarMessage('Creating session request...');
    setSnackbarSeverity('info');
    setSnackbarOpen(true);
    setError(null);

    const requestData = {
      therapist: id,
      requested_date: selectedSlot.date,
      requested_time: selectedSlot.start_time,
      message: message,
      session_duration: selectedSlot.duration_minutes || 120, // Send the actual duration
      // status and is_paid are set by backend default
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
        // --- MODIFICATION START ---
        navigate('/dashboard'); // Redirect to dashboard for free consultations
        // --- MODIFICATION END ---
      } else {
        // For paid sessions, proceed to show the M-Pesa payment modal
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


  // Function to handle the M-Pesa STK Push initiation
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
      amount: parseFloat(therapist.hourly_rate), // Use the therapist's actual hourly rate
      mpesa_phone_number: mpesaPhoneNumber
    };

    try {
      const response = await axios.post('http://localhost:8000/api/payments/initiate/', paymentData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSnackbarMessage("M-Pesa STK Push initiated. Please check your phone to complete the payment.");
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setShowPaymentModal(false); // Close payment modal
      setMpesaPhoneNumber('');
      setSelectedSlot(null); // Clear selected slot after successful initiation
      setMessage(''); // Clear message

      // --- MODIFICATION START ---
      // Redirect to dashboard after payment initiation
      setTimeout(() => {
        navigate('/dashboard'); // Redirect to client's dashboard
      }, 3000);
      // --- MODIFICATION END ---

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

  const isButtonDisabled = (user && user.is_therapist) || !therapist.is_available;

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#fefae0', py: 8 }}>
      <Container maxWidth="md">
        <Paper elevation={6} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 3, backgroundColor: 'white' }}>
          <Grid container spacing={4} alignItems="flex-start">
            <Grid item xs={12} md={4}>
              <img
                src={therapist.profile_picture || `https://placehold.co/150x150/780000/fefae0?text=${(therapist.full_name || 'T').charAt(0)}`}
                alt={therapist.full_name}
                style={{ borderRadius: '50%', width: 180, height: 180, objectFit: 'cover', border: '4px solid #780000' }}
              />
              <Typography variant="h5" sx={{ color: '#780000', mt: 2, fontWeight: 'bold' }}>
                {therapist.license_credentials ? `${therapist.license_credentials} ` : ''}{therapist.full_name}
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
                  {!therapist.is_free_consultation && (
                    <>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2"><strong>Hourly Rate:</strong> {therapist.hourly_rate ? `Ksh ${parseFloat(therapist.hourly_rate).toFixed(2)}` : 'N/A'}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2"><strong>Accepts Insurance:</strong> {therapist.insurance_accepted ? 'Yes' : 'No'}</Typography>
                      </Grid>
                    </>
                  )}
                  {therapist.is_free_consultation && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2"><strong>Consultation Fee:</strong> Free Initial Consultation</Typography>
                    </Grid>
                  )}
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

              <Divider sx={{ my: 2 }} />
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ color: '#780000', fontWeight: 'bold', mb: 1 }}>
                  Session Information
                </Typography>
                <Typography variant="body2">
                  <strong>Session Modes:</strong> {therapist.session_modes ? therapist.session_modes.replace('both', 'Online & Physical') : 'N/A'}
                </Typography>
                {therapist.session_modes && (therapist.session_modes === 'physical' || therapist.session_modes === 'both') && (
                  <Typography variant="body2">
                    <strong>Physical Location:</strong> {therapist.physical_address || 'Not specified'}
                  </Typography>
                )}
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
                        <Box sx={{ position: 'relative', width: '100%', paddingTop: '56.25%' }}>
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
          <Divider sx={{ my: 4 }} /> {/* Separator for booking section */}

          {/* New Booking Section */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" sx={{ color: '#780000', mb: 3, fontWeight: 'bold' }}>
              Book a Session
            </Typography>

            {therapist.is_free_consultation ? (
              <Typography variant="body1" sx={{ mb: 2, color: 'green', fontWeight: 'bold' }}>
                This therapist offers a FREE initial consultation. No payment is required.
              </Typography>
            ) : (
              <Typography variant="body1" sx={{ mb: 2, color: '#780000', fontWeight: 'bold' }}>
                Session Rate: Ksh {therapist.hourly_rate ? parseFloat(therapist.hourly_rate).toFixed(2) : 'N/A'} per session
              </Typography>
            )}

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" sx={{ mb: 1, color: '#780000' }}>Select Date:</Typography>
                <DatePicker
                  selected={selectedDate}
                  onChange={(date) => {
                    setSelectedDate(date);
                    setSelectedSlot(null); // Reset selected slot when date changes
                  }}
                  minDate={new Date()} // Cannot select past dates
                  dateFormat="yyyy-MM-dd"
                  placeholderText="Click to select a date"
                  customInput={<TextField fullWidth variant="outlined" />}
                  filterDate={(date) => date.getDay() !== 0 && date.getDay() !== 6} // Example: disable weekends
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" sx={{ mb: 1, color: '#780000' }}>Available Time Slots:</Typography>
                <Paper variant="outlined" sx={{ p: 2, minHeight: 120, maxHeight: 200, overflowY: 'auto', bgcolor: '#fdf8f5' }}>
                  {selectedDate ? (
                    (() => {
                      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
                      const slots = availableSlots[formattedDate];
                      if (slots && slots.length > 0) {
                        return (
                          <Grid container spacing={1}>
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
                                  }}
                                >
                                  {slot.start_time} - {slot.end_time}
                                </Button>
                              </Grid>
                            ))}
                          </Grid>
                        );
                      } else {
                        return <Typography variant="body2" color="text.secondary">No available slots for this date. Try another date.</Typography>;
                      }
                    })()
                  ) : (
                    <Typography variant="body2" color="text.secondary">Please select a date to see available slots.</Typography>
                  )}
                </Paper>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Message to Therapist (Optional)"
                  multiline
                  rows={3}
                  variant="outlined"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  sx={{ mt: 2 }}
                />
              </Grid>
            </Grid>
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
              onClick={handleSessionRequest}
              disabled={isButtonDisabled || !selectedSlot || paymentProcessing}
            >
              {isButtonDisabled ?
                (user && user.is_therapist ? "Therapists Cannot Book" : "Therapist Not Available")
                : (paymentProcessing ? <CircularProgress size={24} color="inherit" /> : 'Request Session')}
            </Button>
          </Box>
        </Paper>
      </Container>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onClose={handleClosePaymentModal}>
        <DialogTitle sx={{ color: '#780000', fontWeight: 'bold' }}>Complete Payment</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            You are requesting a session with {therapist?.first_name} {therapist?.last_name} on {selectedSlot?.date} at {selectedSlot?.start_time}.
          </Typography>
          <Typography variant="body1" sx={{ mb: 2, fontWeight: 'bold' }}>
            Amount Due: KES {therapist.hourly_rate ? parseFloat(therapist.hourly_rate).toFixed(2) : 'N/A'}
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
            helperText="Enter your M-Pesa registered phone number for simulation."
            sx={{ mb: 2 }}
            disabled={paymentProcessing}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePaymentModal} sx={{ color: '#780000' }} disabled={paymentProcessing}>Cancel</Button>
          <Button onClick={handleInitiatePayment} variant="contained" sx={{ backgroundColor: '#780000', '&:hover': { backgroundColor: '#5a0000' } }} disabled={!mpesaPhoneNumber || paymentProcessing}>
            {paymentProcessing ? <CircularProgress size={24} color="inherit" /> : 'Pay Now'}
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