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
  Avatar,
  Stack
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
        console.error("Error fetching therapists:", err);
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
            <Card elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3 }}>
              <CardContent sx={{ flexGrow: 1, textAlign: 'center', p: 3 }}>
                <Avatar 
                  src={therapist.profile_picture_url || `https://placehold.co/100x100/780000/fefae0?text=${(therapist.full_name || 'T').charAt(0)}`}
                  alt={therapist.full_name}
                  sx={{ width: 100, height: 100, mx: 'auto', mb: 2, border: '3px solid #780000' }}
                />
                <Typography variant="h6" sx={{ color: '#780000', mb: 0.5, fontWeight: 'bold' }}>
                  {therapist.full_name}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  {therapist.license_credentials}
                </Typography>
                <Stack direction="row" spacing={1} justifyContent="center" useFlexGap flexWrap="wrap" sx={{ mb: 1 }}>
                  {/* Removed the availability chip as requested */}
                  {therapist.is_free_consultation ? (
                    <Chip label="Free Consultation" color="info" size="small" sx={{ px: 1 }} />
                  ) : (
                    therapist.hourly_rate && (
                      <Chip label={`Ksh ${parseFloat(therapist.hourly_rate).toFixed(2)}/hr`} color="primary" size="small" sx={{ px: 1, backgroundColor: '#DCC8C8', color: '#333' }} />
                    )
                  )}
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, height: 40, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {therapist.bio || 'No bio provided.'}
                </Typography>
                {therapist.specializations && (
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    Specializes in: 
                    <span style={{ fontWeight: 'normal', fontStyle: 'italic', marginLeft: '4px' }}>
                      {therapist.specializations.split(',').slice(0, 2).map(s => s.trim()).join(', ')}...
                    </span>
                  </Typography>
                )}
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                <Button
                  variant="contained"
                  sx={{
                    backgroundColor: '#780000',
                    '&:hover': { backgroundColor: '#5a0000' },
                    borderRadius: 2,
                    px: 3,
                    py: 1,
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
