// frontend_work/src/components/FindTherapist.jsx
import React, { useState, useEffect } from 'react';
import {
  // Container, // Removed Container
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
  CardMedia,
  Avatar
} from '@mui/material';
import { Search, Clear, Person, Star, LocationOn } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; // Removed .jsx extension to help with resolution

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
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '80vh', 
        backgroundColor: "#fefae0",
        gap: 2
      }}>
        <CircularProgress 
          sx={{ 
            color: '#780000',
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
            }
          }} 
          size={60}
          thickness={4}
        />
        <Typography 
          variant="h6" 
          sx={{ 
            color: '#780000',
            fontWeight: 500,
            textAlign: 'center'
          }}
        >
          Finding the perfect therapists for you...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ 
        textAlign: 'center', 
        mt: 8,
        backgroundColor: '#fefae0',
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Typography 
          variant="h5" 
          color="error" 
          sx={{ mb: 3, fontWeight: 600 }}
        >
          {error}
        </Typography>
        <Button
          variant="contained"
          size="large"
          sx={{ 
            backgroundColor: '#780000', 
            '&:hover': { 
              backgroundColor: '#5a0000',
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 25px rgba(120, 0, 0, 0.3)'
            },
            borderRadius: 3,
            px: 4,
            py: 1.5,
            fontWeight: 600,
            transition: 'all 0.3s ease-in-out'
          }}
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </Box>
    );
  }

  return (
    // Changed Container to Box and added responsive horizontal padding
    <Box sx={{ py: 6, px: { xs: 2, sm: 3, md: 4, lg: 6 }, backgroundColor: '#fefae0', minHeight: '100vh' }}>
      {/* Header Section */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography 
          variant="h3" 
          sx={{ 
            color: '#780000', 
            mb: 2, 
            fontWeight: 700,
            background: 'linear-gradient(135deg, #780000 0%, #a00000 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 2px 4px rgba(120, 0, 0, 0.1)'
          }}
        >
          Find Your Perfect Therapist
        </Typography>
        <Typography 
          variant="h6" 
          sx={{ 
            color: '#666',
            fontWeight: 400,
            maxWidth: 600,
            mx: 'auto',
            lineHeight: 1.6
          }}
        >
          Connect with qualified mental health professionals who understand your needs
        </Typography>
      </Box>

      {/* Search Section */}
      <Box sx={{ mb: 6, display: 'flex', justifyContent: 'center' }}>
        <TextField
          label="Search by name"
          variant="outlined"
          value={searchTerm}
          onChange={handleSearchChange}
          fullWidth
          sx={{ 
            maxWidth: 600,
            '& .MuiOutlinedInput-root': { 
              borderRadius: 4,
              backgroundColor: 'white',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              '&:hover': {
                boxShadow: '0 6px 25px rgba(0, 0, 0, 0.12)',
              },
              '&.Mui-focused': {
                boxShadow: '0 8px 30px rgba(120, 0, 0, 0.15)',
              }
            },
            '& .MuiInputLabel-root': {
              color: '#666',
            },
            '& .MuiOutlinedInput-input': {
              py: 2,
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: '#780000' }} />
              </InputAdornment>
            ),
            endAdornment: (
              searchTerm && (
                <InputAdornment position="end">
                  <IconButton 
                    onClick={handleClearSearch}
                    sx={{ 
                      color: '#666',
                      '&:hover': { 
                        color: '#780000',
                        backgroundColor: 'rgba(120, 0, 0, 0.04)'
                      }
                    }}
                  >
                    <Clear />
                  </IconButton>
                </InputAdornment>
              )
            ),
          }}
        />
      </Box>

      {/* Results Count */}
      {!loading && (
        <Typography 
          variant="body1" 
          sx={{ 
            color: '#666',
            mb: 4,
            textAlign: 'center',
            fontWeight: 500
          }}
        >
          {therapists.length > 0 
            ? `Found ${therapists.length} therapist${therapists.length !== 1 ? 's' : ''}`
            : 'No therapists found matching your search'
          }
        </Typography>
      )}

      {/* No Results Message */}
      {therapists.length === 0 && !loading && (
        <Box sx={{ 
          textAlign: 'center', 
          py: 8,
          backgroundColor: 'white',
          borderRadius: 4,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
          mx: 'auto',
          maxWidth: 500
        }}>
          <Person sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            No therapists found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search terms or browse all available therapists
          </Typography>
          <Button
            variant="outlined"
            sx={{ 
              mt: 3,
              borderColor: '#780000',
              color: '#780000',
              '&:hover': {
                borderColor: '#5a0000',
                backgroundColor: 'rgba(120, 0, 0, 0.04)'
              }
            }}
            onClick={() => setSearchTerm('')}
          >
            Clear Search
          </Button>
        </Box>
      )}

      {/* Therapist Cards Grid */}
      <Grid container spacing={4}>
        {therapists.map((therapist) => (
          <Grid item xs={12} sm={6} lg={4} xl={3} key={therapist.id}>
            <Card
              elevation={0}
              sx={{
                height: 480, 
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 4,
                backgroundColor: 'white',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
                overflow: 'hidden',
                position: 'relative',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.12)',
                  borderColor: 'rgba(120, 0, 0, 0.2)',
                  '& .therapist-image': {
                    transform: 'scale(1.05)',
                  },
                  '& .view-details-btn': {
                    backgroundColor: '#5a0000',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(120, 0, 0, 0.3)'
                  }
                },
              }}
              onClick={() => handleViewDetails(therapist.id)}
            >
              {/* Image/Avatar Section */}
              <Box sx={{ position: 'relative', height: 200, overflow: 'hidden' }}>
                {therapist.profile_picture ? (
                  <CardMedia
                    component="img"
                    height="200"
                    image={therapist.profile_picture}
                    alt={therapist.full_name}
                    className="therapist-image"
                    sx={{ 
                      objectFit: 'cover',
                      transition: 'transform 0.3s ease-in-out'
                    }}
                  />
                ) : (
                  <Box
                    className="therapist-image"
                    sx={{
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'linear-gradient(135deg, #DCC8C8 0%, #C4A4A4 100%)',
                      color: '#780000',
                      transition: 'transform 0.3s ease-in-out'
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 80,
                        height: 80,
                        backgroundColor: 'rgba(120, 0, 0, 0.1)',
                        color: '#780000',
                        fontSize: '2.5rem',
                        fontWeight: 'bold',
                        border: '3px solid rgba(120, 0, 0, 0.2)'
                      }}
                    >
                      {(therapist.first_name || therapist.full_name || 'T').charAt(0).toUpperCase()}
                    </Avatar>
                  </Box>
                )}
                
                {/* Status Badge - Only show if free consultation */}
                {therapist.is_free_consultation && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      px: 2,
                      py: 0.5,
                      borderRadius: 2,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      backdropFilter: 'blur(10px)',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                    }}
                  >
                    Free Consultation
                  </Box>
                )}
              </Box>

              {/* Content Section */}
              <CardContent
                sx={{
                  flexGrow: 1,
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5
                }}
              >
                {/* Name */}
                <Typography
                  variant="h6"
                  sx={{
                    color: '#780000',
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    lineHeight: 1.3,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    minHeight: '2.6rem'
                  }}
                >
                  {therapist.full_name}
                </Typography>

                {/* Client Focus */}
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#666',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      mb: 0.5
                    }}
                  >
                    Specializes in:
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#333',
                      fontSize: '0.9rem',
                      lineHeight: 1.4,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      minHeight: '2.5rem'
                    }}
                  >
                    {therapist.client_focus || 'General mental health support'}
                  </Typography>
                </Box>

                {/* Spacer for consistent layout */}
                <Box sx={{ flexGrow: 1 }} />

                {/* Price/Consultation Chip */}
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 'auto' }}>
                  {therapist.is_free_consultation ? (
                    <Chip 
                      label="Free Initial Consultation" 
                      sx={{ 
                        backgroundColor: '#E8F5E8',
                        color: '#2E7D32',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        border: '1px solid #4CAF50'
                      }} 
                    />
                  ) : therapist.hourly_rate ? (
                    <Chip 
                      label={`KSh ${parseFloat(therapist.hourly_rate).toLocaleString()}/session`}
                      sx={{ 
                        backgroundColor: '#FFF3E0',
                        color: '#F57C00',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        border: '1px solid #FFB74D'
                      }} 
                    />
                  ) : (
                    <Chip 
                      label="Contact for Pricing"
                      sx={{ 
                        backgroundColor: '#F5F5F5',
                        color: '#666',
                        fontWeight: 600,
                        fontSize: '0.8rem'
                      }} 
                    />
                  )}
                </Box>
              </CardContent>

              {/* Action Button */}
              <CardActions
                sx={{
                  p: 3,
                  pt: 0
                }}
              >
                <Button
                  variant="contained"
                  fullWidth
                  className="view-details-btn"
                  sx={{
                    backgroundColor: '#780000',
                    borderRadius: 3,
                    py: 1.5,
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    textTransform: 'none',
                    transition: 'all 0.3s ease-in-out',
                    boxShadow: '0 4px 15px rgba(120, 0, 0, 0.2)',
                    '&:hover': {
                      backgroundColor: '#5a0000'
                    }
                  }}
                >
                  View Profile & Book
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      
     
    </Box>
  );
}
