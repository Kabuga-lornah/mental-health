import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Grid,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  Chip,
  Stack
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; 
import { useNavigate } from 'react-router-dom';

export default function FindTherapist() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [therapists, setTherapists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
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

  const handleTherapistCardClick = (therapistId) => {
    navigate(`/therapists/${therapistId}`);
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
                <Paper 
                  elevation={3} 
                  sx={{ 
                    p: 3, 
                    backgroundColor: 'white', 
                    borderRadius: 2, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    height: '100%',
                    cursor: 'pointer',
                    '&:hover': {
                      boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.15)',
                    }
                  }}
                  onClick={() => handleTherapistCardClick(therapist.id)}
                >
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
                        {therapist.hourly_rate && parseFloat(therapist.hourly_rate) > 0 ? 
                          `Ksh ${parseFloat(therapist.hourly_rate).toFixed(2)}/hour` : 
                          'Free Consultation'}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
}
