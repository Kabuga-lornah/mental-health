// frontend_work/src/components/FindTherapist.jsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  TextField,
  InputAdornment,
  IconButton,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Stack,
  CardMedia
} from '@mui/material';
import { Search, Clear } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function FindTherapist() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [therapists, setTherapists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchTherapists = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`http://localhost:8000/api/therapists/?search=${searchTerm}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setTherapists(response.data);
      } catch (err) {
        console.error("Error fetching therapists:", err.response?.data || err.message);
        setError("Failed to load therapists. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (user && token) {
      fetchTherapists();
    }
  }, [user, token, searchTerm]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  const handleViewDetails = (id) => {
    navigate(`/therapists/${id}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', backgroundColor: "#fefae0" }}>
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

  // --- Strict Pixel-Based Height Definitions for Consistency ---
  const CARD_TOTAL_HEIGHT_PX = 420; // Fixed total height of the card in pixels
  const IMAGE_HEIGHT_PX = 210;     // Fixed height for the image section (50% of 420)
  const ACTIONS_HEIGHT_PX = 70;    // Fixed height for the button area

  // Calculate remaining height for CardContent strictly
  const CARD_CONTENT_HEIGHT_PX = CARD_TOTAL_HEIGHT_PX - IMAGE_HEIGHT_PX - ACTIONS_HEIGHT_PX; // 420 - 210 - 70 = 140px

  // Individual content line heights and margins within CardContent
  const NAME_LINE_HEIGHT_PX = 28;
  const INFO_LINE_HEIGHT_PX = 20;
  const CHIP_ROW_HEIGHT_PX = 35;
  const PADDING_VERTICAL_CARD_CONTENT = 16; // p:2 means 16px vertical padding (top+bottom)

  // Sum of fixed heights for content elements + their vertical margins + CardContent padding
  // This helps ensure the math lines up for the 140px CardContent
  const SUM_OF_INTERNAL_CONTENT_HEIGHTS = 
    NAME_LINE_HEIGHT_PX + 8 + // Name + mb
    INFO_LINE_HEIGHT_PX + 8 + // Client Focus + mb
    INFO_LINE_HEIGHT_PX + 12 + // Approach + mb
    CHIP_ROW_HEIGHT_PX; // Chips Stack

  // Just a check to ensure our fixed heights fit within CardContent
  // console.log("Calculated CardContent actual content height:", SUM_OF_INTERNAL_CONTENT_HEIGHTS + (2 * PADDING_VERTICAL_CARD_CONTENT)); // Should be 103 + 32 = 135px + a bit more for flex distribution.
  // We'll rely on strict heights and overflow hidden.
  // -------------------------------------------------------------

  return (
    <Container maxWidth="lg" sx={{ py: 4, backgroundColor: '#fefae0', minHeight: '100vh' }}>
      <Typography variant="h4" sx={{ color: '#780000', mb: 3, fontWeight: 'bold', textAlign: 'center' }}>
        Find a Therapist
      </Typography>

      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
        <TextField
          label="Search Therapists"
          variant="outlined"
          value={searchTerm}
          onChange={handleSearchChange}
          fullWidth
          sx={{ maxWidth: 500, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
            endAdornment: (
              searchTerm && (
                <InputAdornment position="end">
                  <IconButton onClick={handleClearSearch}>
                    <Clear />
                  </IconButton>
                </InputAdornment>
              )
            ),
          }}
        />
      </Box>

      {therapists.length === 0 && !loading && (
        <Typography variant="h6" color="text.secondary" textAlign="center" sx={{ mt: 4 }}>
          No therapists found matching your search.
        </Typography>
      )}

      <Grid container spacing={4}>
        {therapists.map((therapist) => (
          <Grid item xs={12} sm={6} md={4} key={therapist.id}>
            <Card
              elevation={6}
              sx={{
                height: `${CARD_TOTAL_HEIGHT_PX}px`, // Fixed total height for the card
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 3,
                transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 12px 24px rgba(0,0,0,0.2)',
                },
                border: '1px solid #e0e0e0',
                overflow: 'hidden', // Ensures everything respects card borders
              }}
            >
              {/* Image section */}
              {therapist.profile_picture ? (
                <CardMedia
                  component="img"
                  height={`${IMAGE_HEIGHT_PX}px`} // Fixed height for the image
                  image={therapist.profile_picture}
                  alt={therapist.full_name}
                  sx={{ objectFit: 'cover' }}
                />
              ) : (
                // Fallback for no profile picture
                <Box
                  sx={{
                    height: `${IMAGE_HEIGHT_PX}px`, // Fixed height for fallback
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: '#DCC8C8', // Placeholder background color
                    color: '#780000', // Placeholder text color
                    fontSize: '3rem',
                    fontWeight: 'bold',
                    borderBottom: '1px solid #e0e0e0', // Separator from content
                  }}
                >
                  {(therapist.first_name || 'T').charAt(0).toUpperCase()}
                </Box>
              )}

              <CardContent
                sx={{
                  flexGrow: 1, // Allows content area to take remaining space
                  textAlign: 'center',
                  p: 2, // Consistent padding around content
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between', // Distribute content vertically within its fixed space
                  height: `${CARD_CONTENT_HEIGHT_PX}px`, // Strict fixed height for CardContent
                  overflow: 'hidden', // Crucial for text truncation and preventing overflow
                }}
              >
                <Box sx={{ flexShrink: 0 }}> {/* Group elements that should not flex or stretch */}
                  <Typography
                    variant="h6"
                    sx={{
                      color: '#780000',
                      mb: 0.5, // Small margin below name
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap', // Force single line
                      overflow: 'hidden',    // Hide overflow
                      textOverflow: 'ellipsis', // Show ellipsis for overflow
                      width: '100%', // Ensure it respects container width
                      display: 'block',
                      height: `${NAME_LINE_HEIGHT_PX}px`, // Fixed height for name line
                      lineHeight: `${NAME_LINE_HEIGHT_PX}px` // Match line-height to height for perfect vertical centering
                    }}
                  >
                    {therapist.full_name}
                  </Typography>

                  {/* Display Client Focus */}
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 'bold',
                      mt: 0.5, // Small margin above
                      mb: 0.5, // Small margin below
                      whiteSpace: 'nowrap', // Force single line
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      width: '100%',
                      display: 'block',
                      height: `${INFO_LINE_HEIGHT_PX}px`, // Fixed height for client focus line
                      lineHeight: `${INFO_LINE_HEIGHT_PX}px` // Match line-height to height
                    }}
                  >
                    Client Focus:
                    <span style={{ fontWeight: 'normal', fontStyle: 'italic', marginLeft: '4px' }}>
                      {therapist.client_focus || 'N/A'}
                    </span>
                  </Typography>

                  {/* Display Approach Modalities */}
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 'bold',
                      mt: 0.5, // Small margin above
                      mb: 1, // Slightly larger margin before chips
                      whiteSpace: 'nowrap', // Force single line
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      width: '100%',
                      display: 'block',
                      height: `${INFO_LINE_HEIGHT_PX}px`, // Fixed height for approach line
                      lineHeight: `${INFO_LINE_HEIGHT_PX}px` // Match line-height to height
                    }}
                  >
                    Approach:
                    <span style={{ fontWeight: 'normal', fontStyle: 'italic', marginLeft: '4px' }}>
                      {therapist.approach_modalities ? therapist.approach_modalities.split(',')[0].trim() + (therapist.approach_modalities.split(',').length > 1 ? '...' : '') : 'N/A'}
                    </span>
                  </Typography>
                </Box>
                <Stack
                  direction="row"
                  spacing={1}
                  justifyContent="center"
                  useFlexGap
                  flexWrap="wrap"
                  sx={{
                    mt: 'auto', // Pushes this stack to the bottom within content area
                    mb: 1, // Consistent bottom margin
                    flexShrink: 0, // Prevent this section from shrinking
                    height: `${CHIP_ROW_HEIGHT_PX}px`, // Fixed height for the chip row
                    alignItems: 'center', // Vertically center chips within their row
                  }}
                >
                  {therapist.is_free_consultation ? (
                    <Chip label="Free Consultation" color="info" size="small" sx={{ px: 1, bgcolor: '#B0C4DE', color: '#1A202C', fontWeight: 'bold' }} />
                  ) : (
                    therapist.hourly_rate && (
                      <Chip label={`Ksh ${parseFloat(therapist.hourly_rate).toFixed(2)}/hr`} color="primary" size="small" sx={{ px: 1, backgroundColor: '#DCC8C8', color: '#333', fontWeight: 'bold' }} />
                    )
                  )}
                </Stack>
              </CardContent>
              <CardActions
                sx={{
                  justifyContent: 'center',
                  pb: 2,
                  height: `${ACTIONS_HEIGHT_PX}px`, // Fixed height for the actions section
                  flexShrink: 0, // Prevent actions from shrinking
                }}
              >
                <Button
                  variant="contained"
                  sx={{
                    backgroundColor: '#780000',
                    '&:hover': { backgroundColor: '#5a0000', transform: 'scale(1.05)' },
                    borderRadius: 2,
                    px: 3,
                    py: 1,
                    fontWeight: 'bold',
                    transition: 'transform 0.2s ease-in-out',
                  }}
                  onClick={() => handleViewDetails(therapist.id)}
                >
                  View Details
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}