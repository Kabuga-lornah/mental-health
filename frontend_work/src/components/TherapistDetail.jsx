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
  Divider,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, addDays } from 'date-fns';

// Define theme colors for consistency based on tailwind.config.js
const themePrimaryColor = '#780000'; // maroon-800
const themeLightBackground = '#fff8e1'; // cream-100 (Overall page background)
const themeCardBackground = 'white'; // Used for main content blocks like the top photo/intro section
const themeSectionBackground = '#fdf8f5'; // A slightly off-white for internal sections (like 'My Philosophy', 'My Approach', etc.)
const themeButtonHoverColor = '#5a0000'; // Darker maroon for hover
const themeAccentColor = '#DCC8C8'; // A subtle accent for chips and borders
const themeTextColor = '#333'; // Standard dark text
const themeLightTextColor = '#666'; // Lighter text for secondary info
const themeBorderColor = '#e0e0e0'; // Neutral gray for borders

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

  // State to control visibility of the booking form (unchanged)
  const [showBookingForm, setShowBookingForm] = useState(false);


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
      navigate('/login');
      return;
    }
    const roomName = `chat_${Math.min(user.id, therapist.id)}_${Math.max(user.id, therapist.id)}`;
    navigate(`/chat/${roomName}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', backgroundColor: themeLightBackground }}>
        <CircularProgress sx={{ color: themePrimaryColor }} />
        <Typography sx={{ ml: 2, color: themePrimaryColor }}>Loading therapist details...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4, backgroundColor: themeLightBackground, minHeight: '80vh', py: 8 }}>
        <Typography color="error" variant="h6">{error}</Typography>
        <Button
          variant="contained"
          sx={{ mt: 2, backgroundColor: themePrimaryColor, '&:hover': { backgroundColor: themeButtonHoverColor } }}
          onClick={() => navigate('/find-therapist')}
        >
          Back to Therapists
        </Button>
      </Box>
    );
  }

  if (!therapist) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4, backgroundColor: themeLightBackground, minHeight: '80vh', py: 8 }}>
        <Typography variant="h6" sx={{ color: themePrimaryColor }}>Therapist not found or not available.</Typography>
        <Button
          variant="contained"
          sx={{ mt: 2, backgroundColor: themePrimaryColor, '&:hover': { backgroundColor: themeButtonHoverColor } }}
          onClick={() => navigate('/find-therapist')}
        >
          Back to Therapists
        </Button>
      </Box>
    );
  }

  const isButtonDisabled = (user && user.is_therapist) || !therapist.is_available;

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: themeLightBackground, py: { xs: 4, md: 8 } }}>
      {/* Container wraps the main Paper and ensures it's horizontally centered */}
      <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'center' }}>
        {/* Main Paper container acts as the overall background for the profile content */}
        <Paper elevation={8} sx={{
            p: { xs: 0, sm: 0 }, // No padding on the paper itself, Grid items handle it
            borderRadius: 4,
            backgroundColor: themeCardBackground,
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            width: '100%', // Take full width of its container
            maxWidth: '1200px', // Explicit max-width for the entire card to control overall size
          }}>
          {/* Top Section: Layered Photo on Left, Meet [Name] + Intro + Session Info on Right */}
          <Grid container spacing={0} sx={{ minHeight: { md: '450px' } }}>
            {/* Layered Photo Section - Left side */}
            <Grid item xs={12} md={6}>
              <Box 
                sx={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  minHeight: { xs: '300px', md: '450px' },
                  overflow: 'hidden',
                  borderRadius: { xs: '4px 4px 0 0', md: '4px 0 0 4px' },
                  backgroundImage: 'url(/photo.jpeg)', // Ensure photo.jpeg exists in public folder
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  display: 'flex', // Use flexbox to center the inner image
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: themeSectionBackground, // Fallback background if photo.jpeg is missing
                  // Add padding to create space from the frame/edge
                  p: { xs: 2, sm: 4 }, // Add padding directly here
                }}
              >
                {/* Therapist's actual profile image positioned at an angle */}
                <Box
                  sx={{
                    position: 'relative', // Relative positioning within flex parent for z-index and transformations
                    width: { xs: '70%', sm: '60%', md: '80%' }, // Adjusted size to ensure it doesn't touch the edge
                    maxWidth: 320, // Max size for inner image
                    height: { xs: '70%', sm: '60%', md: '80%' }, // Maintain aspect ratio
                    maxHeight: 320, // Max height for inner image
                    overflow: 'hidden',
                    borderRadius: '8px', // Slight rounding for the angled image
                    boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
                    transform: 'rotate(-5deg)', // Apply rotation for the angled effect
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: themeCardBackground, // Fallback background if no profile picture
                    zIndex: 1, // Ensure it's above the background image
                  }}
                >
                  <img
                    src={therapist.profile_picture || `https://placehold.co/300x300/${themePrimaryColor.substring(1)}/${themeLightBackground.substring(1)}?text=Therapist`}
                    alt={therapist.full_name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                </Box>
              </Box>
            </Grid>

            {/* "Meet [Name]" + Intro + Session Information - Right side */}
            <Grid item xs={12} md={6}>
              <Box sx={{ p: { xs: 3, sm: 5 } }}> {/* Generous padding inside this content box */}
                {/* Meet [Name] */}
                <Typography variant="h4" sx={{ color: themePrimaryColor, fontWeight: 'bold', mb: 1 }}>
                  Meet {therapist.first_name}
                </Typography>
                <Typography variant="h6" color={themeLightTextColor} sx={{ mb: 3, fontStyle: 'italic', fontSize: '1.15rem' }}>
                  {therapist.license_credentials || 'Licensed Professional'}
                </Typography>
                
                {/* Main Intro Bio */}
                <Typography variant="body1" color={themeTextColor} sx={{ lineHeight: 1.8, mb: 3 }}>
                    {therapist.bio || `Dr. ${therapist.full_name} is a dedicated and compassionate therapist. Learn more about their approach and how they can support you on your wellness journey.`}
                </Typography>

                {/* Session Information - NOW CORRECTLY PLACED HERE on the right of the photo */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="body1" sx={{ color: themeTextColor, mb: 1 }}>
                        <strong>Session Modes:</strong> {therapist.session_modes ? therapist.session_modes.replace('both', 'Online & Physical') : 'N/A'}
                    </Typography>
                    {therapist.session_modes && (therapist.session_modes === 'physical' || therapist.session_modes === 'both') && (
                        <Typography variant="body1" sx={{ color: themeTextColor, mt: 1 }}>
                            <strong>Physical Location:</strong> {therapist.physical_address || 'Not specified'}
                        </Typography>
                    )}
                    {!therapist.is_free_consultation && (
                        <>
                            <Typography variant="body1" sx={{ color: themeTextColor, mt: 1 }}>
                                <strong>Hourly Rate:</strong> {therapist.hourly_rate ? `Ksh ${parseFloat(therapist.hourly_rate).toFixed(2)}` : 'N/A'}
                            </Typography>
                            <Typography variant="body1" sx={{ color: themeTextColor, mt: 1 }}>
                                <strong>Accepts Insurance:</strong> {therapist.insurance_accepted ? 'Yes' : 'No'}
                            </Typography>
                        </>
                    )}
                    {therapist.is_free_consultation && (
                        <Typography variant="body1" sx={{ color: 'green', fontWeight: 'bold', mt: 1 }}>
                            <strong>Consultation Fee:</strong> Free Initial Consultation
                        </Typography>
                    )}
                </Box>

                {/* Chat Button */}
                {user && user.id !== therapist.id && (
                  <Button
                      variant="outlined"
                      onClick={handleStartChat}
                      sx={{
                          borderColor: themePrimaryColor,
                          color: themePrimaryColor,
                          '&:hover': {
                              backgroundColor: `${themePrimaryColor}10`,
                              borderColor: themeButtonHoverColor,
                              color: themeButtonHoverColor,
                          },
                          mt: 2,
                          py: 1,
                          px: 3,
                          borderRadius: 2,
                          fontSize: '1rem',
                          fontWeight: 'bold',
                      }}
                  >
                      Chat with {therapist.first_name}
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>

          {/* Two-Card Section: My Philosophy & My Approach (with corrected colors and content) */}
          <Grid container spacing={{ xs: 4, md: 6 }} sx={{ p: { xs: 3, sm: 5 }, pt: 0, pb: 0, mt: 0, mb: 6 }}>
            {/* My Philosophy Card (uses therapist.bio) */}
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: { xs: 3, sm: 4 }, borderRadius: 3, backgroundColor: themeSectionBackground, boxShadow: '0 5px 15px rgba(0,0,0,0.08)', height: '100%', color: themeTextColor }}>
                <Typography variant="h5" sx={{ color: themePrimaryColor, fontWeight: 'bold', mb: 2, borderBottom: `2px solid ${themeAccentColor}`, pb: 1.5 }}>
                  My Philosophy
                </Typography>
                <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                  {therapist.bio || 'This therapist has not yet provided a personal philosophy statement. Typically, this section would cover their core beliefs and guiding principles in therapy, how they view mental health, and their overall approach to healing.'}
                </Typography>
              </Paper>
            </Grid>

            {/* My Approach Card (uses therapist.approach_modalities) */}
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: { xs: 3, sm: 4 }, borderRadius: 3, backgroundColor: themeSectionBackground, boxShadow: '0 5px 15px rgba(0,0,0,0.08)', height: '100%', color: themeTextColor }}>
                <Typography variant="h5" sx={{ color: themePrimaryColor, fontWeight: 'bold', mb: 2, borderBottom: `2px solid ${themeAccentColor}`, pb: 1.5 }}>
                  My Approach
                </Typography>
                <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                  {therapist.approach_modalities || 'This section outlines the specific therapeutic modalities and methods used by the therapist to help clients achieve their goals, such as CBT, EMDR, Psychodynamic therapy, etc.'}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
          
          {/* Education and Experience (Full-Width Block - Corrected to be here) */}
          <Box sx={{ width: '100%', px: { xs: 3, sm: 5 }, mb: 6, py: { xs: 3, sm: 4 }, borderRadius: 3, backgroundColor: themeSectionBackground, boxShadow: '0 5px 15px rgba(0,0,0,0.08)' }}>
              <Typography variant="h5" sx={{ color: themePrimaryColor, fontWeight: 'bold', mb: 2, borderBottom: `2px solid ${themeAccentColor}`, pb: 1.5 }}>
                Education and Experience
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={12}>
                  <Typography variant="body1" sx={{ color: themeTextColor }}><strong>Years of Experience:</strong> {therapist.years_of_experience || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body1" sx={{ color: themeTextColor }}><strong>License Credentials:</strong> {therapist.license_credentials || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body1" sx={{ color: themeTextColor }}><strong>Languages Spoken:</strong> {therapist.languages_spoken || 'Not specified'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body1" sx={{ color: themeTextColor }}><strong>Client Focus:</strong> {therapist.client_focus || 'Not specified'}</Typography>
                </Grid>
              </Grid>
          </Box>

          {/* Specializations (Full-Width Block) */}
          {therapist.specializations && therapist.specializations.length > 0 && (
            <Box sx={{ width: '100%', px: { xs: 3, sm: 5 }, mb: 6, py: { xs: 3, sm: 4 }, borderRadius: 3, backgroundColor: themeSectionBackground, boxShadow: '0 5px 15px rgba(0,0,0,0.08)' }}>
              <Typography variant="h5" sx={{ color: themePrimaryColor, fontWeight: 'bold', mb: 2, borderBottom: `2px solid ${themeAccentColor}`, pb: 1.5 }}>
                Specializations
              </Typography>
              <Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap">
                {therapist.specializations.split(',').map((spec, index) => (
                  <Chip key={index} label={spec.trim()} size="medium"
                    sx={{
                      backgroundColor: themeAccentColor,
                      color: themeTextColor,
                      fontWeight: 'medium',
                      fontSize: '0.9rem',
                      p: '5px 10px',
                      borderRadius: '16px',
                    }}
                  />
                ))}
              </Stack>
            </Box>
          )}

          {/* Video Introduction - (Full-Width Block if it exists) */}
          {therapist.video_introduction_url && (
            <Box sx={{ width: '100%', px: { xs: 3, sm: 5 }, mb: 6, py: { xs: 3, sm: 4 }, borderRadius: 3, backgroundColor: themeSectionBackground, boxShadow: '0 5px 15px rgba(0,0,0,0.08)' }}>
              <Typography variant="h5" sx={{ color: themePrimaryColor, fontWeight: 'bold', mb: 2, borderBottom: `2px solid ${themeAccentColor}`, pb: 1.5 }}>
                Video Introduction
              </Typography>
              <Box sx={{ maxWidth: 600, mx: 'auto', bgcolor: themeCardBackground, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: 2, p: 2 }}>
                <Typography variant="body2" color={themeLightTextColor} sx={{ mb: 2 }}>
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
              <Typography variant="caption" display="block" sx={{ mt: 1.5, textAlign: 'center', color: themeLightTextColor }}>
                <a href={therapist.video_introduction_url} target="_blank" rel="noopener noreferrer" style={{ color: themePrimaryColor, textDecoration: 'none', fontWeight: 'bold' }}>
                  Open video in new tab <i className="fas fa-external-link-alt" style={{ marginLeft: '5px' }}></i>
                </a>
              </Typography>
            </Box>
          )}

          {/* Call to Action for Booking - Styled like the "Connect with Me" button in the image */}
          <Box sx={{ textAlign: 'center', my: 6, px: { xs: 3, sm: 5 } }}>
            <Typography variant="h5" sx={{ color: themePrimaryColor, mb: 3, fontWeight: 'bold' }}>
              Ready to start your healing journey?
            </Typography>
            <Button
              variant="contained"
              sx={{
                backgroundColor: themePrimaryColor,
                color: themeCardBackground,
                py: 2,
                px: 6,
                borderRadius: 3,
                fontSize: '1.2rem',
                fontWeight: 'bold',
                boxShadow: '0 6px 15px rgba(0,0,0,0.2)',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  backgroundColor: themeButtonHoverColor,
                  transform: 'translateY(-3px)',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
                },
              }}
              onClick={() => setShowBookingForm(!showBookingForm)}
              disabled={isButtonDisabled}
            >
              {isButtonDisabled ?
                (user && user.is_therapist ? "Therapists Cannot Book Sessions" : "Therapist Not Available for Booking")
                : (showBookingForm ? "Hide Booking Options" : "Connect With Me")}
            </Button>
          </Box>

          {/* Booking Section - Conditionally rendered */}
          {showBookingForm && (
            <Box sx={{ width: '100%', px: { xs: 3, sm: 5 }, mt: { xs: 4, md: 6 }, pb: { xs: 3, sm: 5 }, borderRadius: 4, backgroundColor: themeLightBackground, boxShadow: '0 8px 20px rgba(0,0,0,0.15)' }}>
              <Typography variant="h4" sx={{ color: themePrimaryColor, mb: 4, fontWeight: 'bold', textAlign: 'center' }}>
                Book a Session
              </Typography>

              {therapist.is_free_consultation ? (
                <Typography variant="h6" sx={{ mb: 3, color: 'green', fontWeight: 'bold', textAlign: 'center' }}>
                  This therapist offers a FREE initial consultation. No payment is required!
                </Typography>
              ) : (
                <Typography variant="h6" sx={{ mb: 3, color: themePrimaryColor, fontWeight: 'bold', textAlign: 'center' }}>
                  Session Rate: Ksh {therapist.hourly_rate ? parseFloat(therapist.hourly_rate).toFixed(2) : 'N/A'} per session
                </Typography>
              )}

              <Grid container spacing={4}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="h6" sx={{ mb: 1.5, color: themePrimaryColor, fontWeight: 'bold' }}>Select Date:</Typography>
                  <DatePicker
                    selected={selectedDate}
                    onChange={(date) => {
                      setSelectedDate(date);
                      setSelectedSlot(null);
                    }}
                    minDate={new Date()}
                    dateFormat="yyyy-MM-dd"
                    placeholderText="Click to select a date"
                    customInput={<TextField fullWidth variant="outlined" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, borderColor: themeBorderColor }, '& .MuiInputLabel-root': { color: themeLightTextColor } }} />}
                    filterDate={(date) => date.getDay() !== 0 && date.getDay() !== 6}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="h6" sx={{ mb: 1.5, color: themePrimaryColor, fontWeight: 'bold' }}>Available Time Slots:</Typography>
                  <Paper variant="outlined" sx={{ p: 2.5, minHeight: 150, maxHeight: 250, overflowY: 'auto', bgcolor: themeSectionBackground, borderRadius: 2, border: `1px solid ${themeAccentColor}` }}>
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
                                      borderColor: themePrimaryColor,
                                      color: selectedSlot?.date === formattedDate && selectedSlot?.start_time === slot.start_time ? themeCardBackground : themePrimaryColor,
                                      backgroundColor: selectedSlot?.date === formattedDate && selectedSlot?.start_time === slot.start_time ? themePrimaryColor : 'transparent',
                                      '&:hover': {
                                        backgroundColor: themeButtonHoverColor,
                                        color: themeCardBackground,
                                        borderColor: themeButtonHoverColor,
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
                          return <Typography variant="body1" color={themeLightTextColor} sx={{ mt: 2, textAlign: 'center' }}>No available slots for this date. Please try another date.</Typography>;
                        }
                      })()
                    ) : (
                      <Typography variant="body1" color={themeLightTextColor} sx={{ mt: 2, textAlign: 'center' }}>Please select a date to view available time slots.</Typography>
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
                    sx={{ mt: 2, '& .MuiOutlinedInput-root': { borderRadius: 2, borderColor: themeBorderColor }, '& .MuiInputLabel-root': { color: themeLightTextColor } }}
                    placeholder="Share any specific concerns or questions you have for the therapist."
                  />
                </Grid>
              </Grid>
              <Button
                variant="contained"
                fullWidth
                sx={{
                  backgroundColor: themePrimaryColor,
                  '&:hover': { backgroundColor: themeButtonHoverColor },
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
          )}
        </Paper>
      </Container>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onClose={handleClosePaymentModal} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ backgroundColor: themePrimaryColor, color: themeCardBackground, fontWeight: 'bold', pb: 2 }}>
          Complete Payment
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            You are requesting a session with <span style={{ fontWeight: 'bold', color: themePrimaryColor }}>{therapist?.full_name}</span> on <span style={{ fontWeight: 'bold' }}>{selectedSlot?.date}</span> at <span style={{ fontWeight: 'bold' }}>{selectedSlot?.start_time}</span>.
          </Typography>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: '#5a0000' }}>
            Amount Due: <span style={{ color: themePrimaryColor }}>KES {therapist.hourly_rate ? parseFloat(therapist.hourly_rate).toFixed(2) : 'N/A'}</span>
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
            sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2, borderColor: themeBorderColor }, '& .MuiInputLabel-root': { color: themeLightTextColor } }}
            disabled={paymentProcessing}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={handleClosePaymentModal} sx={{ color: themePrimaryColor, '&:hover': { backgroundColor: '#f5f5f5' } }} disabled={paymentProcessing}>Cancel</Button>
          <Button onClick={handleInitiatePayment} variant="contained"
            sx={{
              backgroundColor: themePrimaryColor,
              '&:hover': { backgroundColor: themeButtonHoverColor },
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