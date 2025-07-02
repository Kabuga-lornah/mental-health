import React, { useState, useEffect } from 'react';
import {
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
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  Paper,
  Divider
} from '@mui/material';
import { Search, Clear, Person, LocationOn, MedicalServices, FilterList, Money } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const specializationsList = [
  'Anxiety and Stress Management',
  'Depression and Mood Disorders',
  'Relationship and Marital Issues',
  'Family Counseling',
  'Trauma and PTSD',
  'Grief and Loss',
  'Addiction and Substance Abuse',
  'Child and Adolescent Therapy',
  'Anger Management',
  'Self-Esteem and Personal Growth',
  'Career and Work-related Stress',
  'LGBTQ+ Counseling',
];

const sessionModesList = [
  { value: '', label: 'Any Mode' },
  { value: 'online', label: 'Online' },
  { value: 'physical', label: 'In-Person' },
  { value: 'both', label: 'Online & In-Person' },
];

export default function FindTherapist() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [therapists, setTherapists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState('');
  const [pricingFilter, setPricingFilter] = useState('any'); // 'any', 'free', 'paid'
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sessionModeFilter, setSessionModeFilter] = useState('');


  // Debounce effect for search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms debounce delay

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  useEffect(() => {
    const fetchTherapists = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
        if (specializationFilter) params.append('specialization', specializationFilter);
        if (pricingFilter && pricingFilter !== 'any') params.append('pricing_type', pricingFilter);
        if (pricingFilter === 'paid') {
          if (minPrice) params.append('min_hourly_rate', minPrice);
          if (maxPrice) params.append('max_hourly_rate', maxPrice);
        }
        if (sessionModeFilter) params.append('session_modes', sessionModeFilter);


        const response = await axios.get(`http://localhost:8000/api/therapists/?${params.toString()}`, {
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
  }, [user, token, debouncedSearchTerm, specializationFilter, pricingFilter, minPrice, maxPrice, sessionModeFilter]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  const handleSpecializationChange = (event) => {
    setSpecializationFilter(event.target.value);
  };

  const handlePricingFilterChange = (event) => {
    setPricingFilter(event.target.value);
    if (event.target.value !== 'paid') {
      setMinPrice('');
      setMaxPrice('');
    }
  };

  const handleMinPriceChange = (event) => {
    // Only allow positive numbers
    const value = event.target.value;
    if (value === '' || (Number(value) >= 0 && !isNaN(Number(value)))) {
      setMinPrice(value);
    }
  };

  const handleMaxPriceChange = (event) => {
    // Only allow positive numbers
    const value = event.target.value;
    if (value === '' || (Number(value) >= 0 && !isNaN(Number(value)))) {
      setMaxPrice(value);
    }
  };

  const handleSessionModeChange = (event) => {
    setSessionModeFilter(event.target.value);
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
          Connect with qualified mental health professionals who understand your needs. Utilize our filters to narrow down your search and find the best fit for your journey towards well-being.
        </Typography>
      </Box>

      {/* Filter and Search Section */}
      <Paper elevation={4} sx={{ p: { xs: 2, md: 4 }, mb: 6, borderRadius: 3, backgroundColor: 'white', boxShadow: '0 8px 25px rgba(0,0,0,0.1)' }}>
        <Typography variant="h5" sx={{ color: '#780000', mb: 3, fontWeight: 700, display: 'flex', alignItems: 'center' }}>
          <FilterList sx={{ mr: 1 }} /> Refine Your Search
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Search by Name or Email"
              variant="outlined"
              value={searchTerm}
              onChange={handleSearchChange}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': { borderRadius: 2 },
                '& .MuiInputLabel-root': { color: '#666' },
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
                        sx={{ color: '#666', '&:hover': { color: '#780000' } }}
                      >
                        <Clear />
                      </IconButton>
                    </InputAdornment>
                  )
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth variant="outlined">
              <InputLabel sx={{ color: '#666' }}>Specialization</InputLabel>
              <Select
                value={specializationFilter}
                onChange={handleSpecializationChange}
                label="Specialization"
                sx={{ '& .MuiOutlinedInput-notchedOutline': { borderRadius: 2 } }}
              >
                <MenuItem value=""><em>All Specializations</em></MenuItem>
                {specializationsList.map((spec) => (
                  <MenuItem key={spec} value={spec}>{spec}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" sx={{ color: '#780000', mb: 1, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
              <Money sx={{ fontSize: 18, mr: 0.5 }} /> Pricing Options:
            </Typography>
            <RadioGroup
              row
              name="pricingFilter"
              value={pricingFilter}
              onChange={handlePricingFilterChange}
              sx={{ justifyContent: 'flex-start', mb: 2 }}
            >
              <FormControlLabel value="any" control={<Radio sx={{ color: '#780000' }} />} label="Any" />
              <FormControlLabel value="free" control={<Radio sx={{ color: '#780000' }} />} label="Free Consultation" />
              <FormControlLabel value="paid" control={<Radio sx={{ color: '#780000' }} />} label="Paid Sessions" />
            </RadioGroup>
          </Grid>
          <Grid item xs={12} md={6}>
             <FormControl fullWidth variant="outlined">
              <InputLabel sx={{ color: '#666' }}>Session Mode</InputLabel>
              <Select
                value={sessionModeFilter}
                onChange={handleSessionModeChange}
                label="Session Mode"
                sx={{ '& .MuiOutlinedInput-notchedOutline': { borderRadius: 2 } }}
              >
                {sessionModesList.map((mode) => (
                  <MenuItem key={mode.value} value={mode.value}>{mode.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {pricingFilter === 'paid' && (
            <Grid item xs={12}>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="subtitle1" sx={{ color: '#780000', mb: 1, fontWeight: 600 }}>Hourly Rate Range:</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Min Hourly Rate (Ksh)"
                    type="number"
                    value={minPrice}
                    onChange={handleMinPriceChange}
                    fullWidth
                    variant="outlined"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    InputProps={{ startAdornment: <InputAdornment position="start">Ksh</InputAdornment> }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Max Hourly Rate (Ksh)"
                    type="number"
                    value={maxPrice}
                    onChange={handleMaxPriceChange}
                    fullWidth
                    variant="outlined"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    InputProps={{ startAdornment: <InputAdornment position="start">Ksh</InputAdornment> }}
                  />
                </Grid>
              </Grid>
            </Grid>
          )}
        </Grid>
      </Paper>


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
            ? `Found ${therapists.length} therapist${therapists.length !== 1 ? 's' : ''} matching your criteria.`
            : 'No therapists found matching your search and filters.'
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
            Try adjusting your search terms or filters.
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
            onClick={() => {
              setSearchTerm('');
              setSpecializationFilter('');
              setPricingFilter('any');
              setMinPrice('');
              setMaxPrice('');
              setSessionModeFilter('');
            }}
          >
            Clear All Filters
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

                {/* Specializations */}
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#666',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      mb: 0.5,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <MedicalServices sx={{ fontSize: 16, mr: 0.5 }} /> Specializes in:
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
                    {therapist.specializations || 'General mental health support'}
                  </Typography>
                </Box>
                {/* Session Modes */}
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#666',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      mb: 0.5,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <LocationOn sx={{ fontSize: 16, mr: 0.5 }} /> Session Modes:
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
                    {therapist.session_modes === 'online' ? 'Online' :
                     therapist.session_modes === 'physical' ? 'In-Person' :
                     therapist.session_modes === 'both' ? 'Online & In-Person' : 'Not specified'}
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