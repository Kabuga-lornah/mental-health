// frontend_work/src/components/TherapistDetail.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Container,
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
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, addDays } from 'date-fns';

// Define colors based on user's strict request: "#fefae0" and "#780000"
const mainMaroon = '#780000'; // Primary color
const lightCream = '#fefae0'; // Secondary color

// Derived colors, strictly from the two main colors or variations thereof
const themePrimaryColor = mainMaroon;
const themeLightBackground = lightCream;
const themeCardBackground = lightCream; // Used for main content blocks like sections
const themeSectionBackground = '#f8f2de'; // A slightly darker cream derived from lightCream
const themeButtonHoverColor = '#5a0000'; // Darker shade of mainMaroon
const themeAccentColor = '#d3a9a9'; // A muted, lighter tint of mainMaroon for subtle accents/borders
const themeTextColor = mainMaroon; // Using mainMaroon for primary text
const themeLightTextColor = '#9f8585'; // A softer, lighter shade of mainMaroon for secondary text
const themeBorderColor = '#b39494'; // A mid-tone derived from mainMaroon for borders

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
  const [message, setMessage] = useState(''); // State for therapist message
  const [messageWordCount, setMessageWordCount] = useState(0); // State for word count

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [mpesaPhoneNumber, setMpesaPhoneNumber] = useState('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [currentSessionRequestId, setCurrentSessionRequestId] = useState(null);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const [showBookingForm, setShowBookingForm] = useState(false);

  // Update word count whenever message changes
  useEffect(() => {
    const words = message.split(/\s+/).filter(Boolean); // Split by whitespace and remove empty strings
    setMessageWordCount(words.length);
  }, [message]);

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

    // Word limit validation
    if (messageWordCount > 100) {
      setSnackbarMessage("Your message exceeds the 100-word limit.");
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
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
    <Box sx={{ minHeight: '100vh', backgroundColor: lightCream }}> {/* Main page background */}
      {/* Main Content Area */}
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
        {/* Meet [Name] Section */}
        <Grid container spacing={0} sx={{ mb: { xs: 4, md: 8 }, backgroundColor: lightCream }}>
          {/* Image Section (Left) */}
          <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: { xs: 2, md: 4 } }}> {/* Changed justifyContent to center */}
            <Box
              sx={{
                width: { xs: 250, md: 350 }, // Set fixed width for square shape
                height: { xs: 250, md: 350 }, // Set fixed height equal to width for square shape
                mx: 'auto', // Center this box horizontally within its grid item
                my: 'auto', // Center this box vertically within its grid item
                overflow: 'hidden',
                borderRadius: '8px',
                boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: themeSectionBackground, // This is the background of the box containing the image
                flexShrink: 0, // Prevent shrinking if content is too large
              }}
            >
              <img
                src={therapist.profile_picture || `https://via.placeholder.com/300x400/${mainMaroon.substring(1)}/${lightCream.substring(1)}?text=Therapist`}
                alt={therapist.full_name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </Box>
          </Grid>
          {/* Text Introduction Section (Right) */}
          <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', p: { xs: 3, md: 4 } }}>
            <Typography variant="h4" sx={{ color: themePrimaryColor, fontWeight: 'bold', mb: 2 }}>
              {therapist.license_credentials || 'Therapist'} {therapist.full_name}
            </Typography>
            
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
                <Typography variant="body1" sx={{ color: mainMaroon, fontWeight: 'bold', mt: 1 }}>
                  <strong>Consultation Fee:</strong> Free Initial Consultation
                </Typography>
              )}
            </Box>
           
          </Grid>
        </Grid>

        {/* About Me, My Philosophy & My Approach Sections */}
        <Grid container spacing={4} sx={{ mb: { xs: 8, md: 10 }, alignItems: 'stretch' }}>
          {/* Left Column: About Me & My Philosophy */}
          <Grid item xs={12} md={5.8}> {/* Adjusted width slightly to make space for divider */}
            {/* About Me Section */}
            <Box sx={{ p: { xs: 3, md: 4 }, height: 'auto', display: 'flex', flexDirection: 'column', mb: 4, backgroundColor: themeSectionBackground, borderRadius: 3, boxShadow: '0 5px 15px rgba(0,0,0,0.08)' }}> {/* Added mb: 4 and section background/shadow */}
              <Typography variant="h5" sx={{ color: themePrimaryColor, fontWeight: 'bold', mb: 2, borderBottom: `2px solid ${themeAccentColor}`, pb: 1.5, textAlign: 'center' }}>
                About Me
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: themeTextColor, flexGrow: 1, textAlign: 'center' }}>
                {therapist.bio || `Dr. ${therapist.full_name} is a dedicated and compassionate therapist. Learn more about their approach and how they can support you on your wellness journey.`}
              </Typography>
            </Box>

            {/* My Philosophy Section */}
            
          </Grid>

          <Grid item xs={false} md={0.4} sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', justifyContent: 'center' }}>
            <Divider orientation="vertical" flexItem sx={{ borderColor: themeBorderColor, height: '80%' }} /> {/* Vertical Divider */}
          </Grid>
          
          {/* My Approach (right column) */}
          <Grid item xs={12} md={5.8}> {/* Adjusted width slightly */}
            <Box sx={{ p: { xs: 3, md: 4 }, height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: themeSectionBackground, borderRadius: 3, boxShadow: '0 5px 15px rgba(0,0,0,0.08)' }}> {/* Added section background/shadow */}
              <Typography variant="h5" sx={{ color: themePrimaryColor, fontWeight: 'bold', mb: 2, borderBottom: `2px solid ${themeAccentColor}`, pb: 1.5, textAlign: 'center' }}>
                My Approach
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: themeTextColor, flexGrow: 1, textAlign: 'center' }}>
                {therapist.approach_modalities || 'This section outlines the specific therapeutic modalities and methods used by the therapist to help clients achieve their goals, such as CBT, EMDR, Psychodynamic therapy, etc.'}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Education and Experience */}
        <Box sx={{ backgroundColor: themeSectionBackground, p: { xs: 3, md: 4 }, mb: { xs: 4, md: 8 }, borderRadius: 3, boxShadow: '0 5px 15px rgba(0,0,0,0.08)' }}>
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

        {/* Specializations */}
        {therapist.specializations && therapist.specializations.length > 0 && (
          <Box sx={{ backgroundColor: themeSectionBackground, p: { xs: 3, md: 4 }, mb: { xs: 4, md: 8 }, borderRadius: 3, boxShadow: '0 5px 15px rgba(0,0,0,0.08)' }}>
            <Typography variant="h5" sx={{ color: themePrimaryColor, fontWeight: 'bold', mb: 2, borderBottom: `2px solid ${themeAccentColor}`, pb: 1.5 }}>
              Specializations
            </Typography>
            <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap"> {/* Increased spacing to 2 */}
              {therapist.specializations.split(',').map((spec, index) => (
                <Chip key={index} label={spec.trim()} size="medium"
                  sx={{
                    backgroundColor: themeSectionBackground, // Changed background to a lighter cream
                    color: themeTextColor,
                    fontWeight: 'medium',
                    fontSize: '0.9rem',
                    px: 2, // Increased horizontal padding
                    py: 1, // Increased vertical padding
                    borderRadius: '16px',
                    border: `1px solid ${themeAccentColor}`, // Added a subtle border
                  }}
                />
              ))}
            </Stack>
          </Box>
        )}

        {/* Video Introduction */}
        {therapist.video_introduction_url && (
          <Box sx={{ backgroundColor: themeSectionBackground, p: { xs: 3, md: 4 }, mb: { xs: 4, md: 8 }, borderRadius: 3, boxShadow: '0 5px 15px rgba(0,0,0,0.08)' }}>
            <Typography variant="h5" sx={{ color: themePrimaryColor, fontWeight: 'bold', mb: 2, borderBottom: `2px solid ${themeAccentColor}`, pb: 1.5 }}>
              Video Introduction
            </Typography>
            <Box sx={{ maxWidth: 600, mx: 'auto', bgcolor: themeCardBackground, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: 2, p: 2 }}>
              <Typography variant="body2" color={themeLightTextColor} sx={{ mb: 2, textAlign: 'center' }}>
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
              <Typography variant="caption" display="block" sx={{ mt: 1.5, textAlign: 'center', color: themeLightTextColor }}>
                <a href={therapist.video_introduction_url} target="_blank" rel="noopener noreferrer" style={{ color: themePrimaryColor, textDecoration: 'none', fontWeight: 'bold' }}>
                  Open video in new tab <i className="fas fa-external-link-alt" style={{ marginLeft: '5px' }}></i>
                </a>
              </Typography>
            </Box>
          </Box>
        )}

        {/* Call to Action for Booking */}
        <Box sx={{ textAlign: 'center', my: { xs: 4, md: 6 } }}>
          <Typography variant="h5" sx={{ color: themePrimaryColor, mb: 3, fontWeight: 'bold' }}>
            Ready to start your healing journey?
          </Typography>
          <Button
            variant="contained"
            sx={{
              backgroundColor: mainMaroon, // Match button color from image
              color: 'white',
              py: 2,
              px: 6,
              borderRadius: 3,
              fontSize: '1.2rem',
              fontWeight: 'bold',
              boxShadow: '0 6px 15px rgba(0,0,0,0.2)',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                backgroundColor: themeButtonHoverColor, // Darker color on hover
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

        {/* Booking Section */}
        {showBookingForm && (
          <Box sx={{ p: { xs: 3, sm: 5 }, mt: { xs: 4, md: 6 }, pb: { xs: 3, sm: 5 }, borderRadius: 4, backgroundColor: themeSectionBackground, boxShadow: '0 8px 20px rgba(0,0,0,0.15)' }}>
          

            {therapist.is_free_consultation ? (
              <Typography variant="h6" sx={{ mb: 3, color: mainMaroon, fontWeight: 'bold', textAlign: 'center' }}>
                This therapist offers a FREE initial consultation. No payment is required!
              </Typography>
            ) : (
              <Typography variant="h6" sx={{ mb: 3, color: themePrimaryColor, fontWeight: 'bold', textAlign: 'center' }}>
                Session Rate: Ksh {therapist.hourly_rate ? parseFloat(therapist.hourly_rate).toFixed(2) : 'N/A'} per session
              </Typography>
            )}

            <Grid container spacing={4}>
              <Grid item xs={12} sm={selectedDate ? 4 : 6}> {/* Adjust width if slots are hidden */}
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
              {/* Conditional rendering for Available Time Slots */}
              {selectedDate && ( // Only render this Grid item if a date is selected
                <Grid item xs={12} sm={4}> {/* Adjusted width */}
                  <Typography variant="h6" sx={{ mb: 1.5, color: themePrimaryColor, fontWeight: 'bold' }}>Available Time Slots:</Typography>
                  <Box sx={{ p: 2.5, minHeight: 150, maxHeight: 250, overflowY: 'auto', bgcolor: themeCardBackground, borderRadius: 2, border: `1px solid ${themeAccentColor}` }}>
                    {/* The content inside this Box remains the same */}
                    {(() => {
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
                    })()}
                  </Box>
                </Grid>
              )}
              <Grid item xs={12} sm={selectedDate ? 4 : 6}> {/* Adjusted width */}
                <Typography variant="h6" sx={{ mb: 1.5, color: themePrimaryColor, fontWeight: 'bold' }}>Message to Therapist (Optional) - Max 100 words</Typography>
                <Box
                  sx={{
                    p: 2, // Padding inside the "page"
                    backgroundColor: themeCardBackground, // Light cream for page background
                    border: `1px solid ${themeBorderColor}`, // Subtle border for the page
                    borderRadius: '4px',
                    overflow: 'hidden', // Ensure lines are clipped if overflowing
                    backgroundImage: 'repeating-linear-gradient(rgba(0,0,0,0.05) 0px, rgba(0,0,0,0.05) 1px, transparent 1px, transparent 20px)', // Ruled lines
                    backgroundSize: '100% 20px', // Adjust line spacing as needed
                    backgroundPositionY: '30px', // Offset to make lines appear below the first line of text
                    minHeight: 150, // Minimum height for the page
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <TextField
                    fullWidth
                    multiline
                    rows={5} // Set initial rows for a reasonable height
                    variant="standard" // Remove outline
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    sx={{
                      '& .MuiInputBase-root': {
                        backgroundColor: 'transparent',
                        padding: 0, // Remove default textfield padding
                        lineHeight: '20px', // Match line height to line spacing
                      },
                      '& .MuiInputBase-input': {
                        padding: 0,
                        lineHeight: '20px',
                        color: themeTextColor, // Ensure text color is consistent
                      },
                      '& .MuiInput-underline:before, & .MuiInput-underline:after': {
                        borderBottom: 'none !important', // Remove underline
                      },
                      overflow: 'visible',
                    }}
                    placeholder="Type your message here..."
                    inputProps={{ style: { padding: 0 } }} // Attempt to remove internal padding
                  />
                </Box>
                <Typography variant="caption" color={messageWordCount > 100 ? 'error' : 'text.secondary'} sx={{ mt: 1 }}>
                  Word count: {messageWordCount}/100
                </Typography>
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
                boxShadow: '0 4px 10px rgba(120, 0, 0, 0.4)', // Using a maroon shadow for consistency
              }}
              onClick={handleSessionRequest}
              disabled={isButtonDisabled || !selectedSlot || paymentProcessing || messageWordCount > 100}
            >
              {isButtonDisabled ?
                (user && user.is_therapist ? "Therapists Cannot Book Sessions" : "Therapist Not Available for Booking")
                : (paymentProcessing ? <CircularProgress size={26} color="inherit" /> : 'Request Session Now')}
            </Button>
          </Box>
        )}
      </Container>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onClose={handleClosePaymentModal} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ backgroundColor: themePrimaryColor, color: lightCream, fontWeight: 'bold', pb: 2 }}>
          Complete Payment
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            You are requesting a session with <span style={{ fontWeight: 'bold', color: themePrimaryColor }}>{therapist?.full_name}</span> on <span style={{ fontWeight: 'bold' }}>{selectedSlot?.date}</span> at <span style={{ fontWeight: 'bold' }}>{selectedSlot?.start_time}</span>.
          </Typography>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: mainMaroon }}>
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
          <Button onClick={handleClosePaymentModal} sx={{ color: themePrimaryColor, '&:hover': { backgroundColor: themeSectionBackground } }} disabled={paymentProcessing}>Cancel</Button>
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