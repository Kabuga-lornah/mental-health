import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
  CircularProgress,
  Chip,
  Stack,
  Card,
  CardContent,
  Avatar
} from '@mui/material';
import {
  OnlinePredictionOutlined,
  PinDropOutlined
} from '@mui/icons-material';
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
        <Typography variant="h4" sx={{ 
          color: '#780000', 
          mb: 6, 
          textAlign: 'center', 
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: 1
        }}>
          Find a Therapist
        </Typography>

        {therapists.length === 0 ? (
          <Typography variant="h6" sx={{ textAlign: 'center', color: '#780000', mt: 4 }}>
            No therapists currently available. Please check back later!
          </Typography>
        ) : (
          <Grid container spacing={4} justifyContent="center">
            {therapists.map((therapist) => (
              <Grid
                item
                xs={12}
                sm={6}
                md={4}
                lg={3}
                key={therapist.id}
                sx={{
                  display: 'flex',
                  justifyContent: 'center'
                }}
              >
                <Card
                  onClick={() => handleTherapistCardClick(therapist.id)}
                  sx={{
                    width: '100%',
                    maxWidth: 300,
                    minHeight: 300,
                    border: '1px solid rgba(120, 0, 0, 0.2)',
                    borderRadius: 3,
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 6px 12px rgba(120, 0, 0, 0.2)',
                      borderColor: '#780000'
                    },
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center',
                      mb: 2
                    }}>
                      <Avatar
                        src={therapist.profile_picture || `https://placehold.co/100x100/780000/fefae0?text=${(therapist.full_name || 'T').charAt(0)}`}
                        alt={therapist.full_name}
                        sx={{ 
                          width: 80, 
                          height: 80, 
                          mb: 2,
                          bgcolor: '#780000',
                          color: '#fefae0',
                          fontSize: '2rem'
                        }}
                      />
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          color: '#780000', 
                          fontWeight: 'bold',
                          textAlign: 'center'
                        }}
                      >
                        {therapist.license_credentials ? `${therapist.license_credentials} ` : ''}{therapist.full_name}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: 'text.secondary',
                          textAlign: 'center',
                          mt: 0.5
                        }}
                      >
                        {therapist.is_free_consultation ? (
                          'Free Initial Consultation'
                        ) : (
                          therapist.hourly_rate && parseFloat(therapist.hourly_rate) > 0 ?
                            `Ksh ${parseFloat(therapist.hourly_rate).toFixed(2)}/hour` : 'N/A'
                        )}
                      </Typography>
                    </Box>
                    
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        mb: 2,
                        textAlign: 'center',
                        fontStyle: therapist.bio ? 'normal' : 'italic'
                      }}
                    >
                      {therapist.bio ? `${therapist.bio.substring(0, 100)}${therapist.bio.length > 100 ? '...' : ''}` : 'No bio provided yet.'}
                    </Typography>
                    
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'center',
                      flexWrap: 'wrap',
                      gap: 1,
                      mt: 'auto'
                    }}>
                      {therapist.session_modes === 'online' && (
                        <Chip
                          icon={<OnlinePredictionOutlined fontSize="small" />}
                          label="Online"
                          size="small"
                          sx={{ 
                            backgroundColor: '#fff3e0', 
                            color: '#780000',
                            border: '1px solid #78000020'
                          }}
                        />
                      )}
                      {therapist.session_modes === 'physical' && (
                        <Chip
                          icon={<PinDropOutlined fontSize="small" />}
                          label="Physical"
                          size="small"
                          sx={{ 
                            backgroundColor: '#f3e5f5', 
                            color: '#780000',
                            border: '1px solid #78000020'
                          }}
                        />
                      )}
                      {therapist.session_modes === 'both' && (
                        <>
                          <Chip
                            icon={<OnlinePredictionOutlined fontSize="small" />}
                            label="Online"
                            size="small"
                            sx={{ 
                              backgroundColor: '#fff3e0', 
                              color: '#780000',
                              border: '1px solid #78000020'
                            }}
                          />
                          <Chip
                            icon={<PinDropOutlined fontSize="small" />}
                            label="Physical"
                            size="small"
                            sx={{ 
                              backgroundColor: '#f3e5f5', 
                              color: '#780000',
                              border: '1px solid #78000020'
                            }}
                          />
                        </>
                      )}
                      <Chip
                        label={therapist.is_available ? "Available" : "Not Available"}
                        size="small"
                        sx={{
                          backgroundColor: therapist.is_available ? '#f0f7e6' : '#f5f5f5',
                          color: therapist.is_available ? '#2e7d32' : '#999',
                          border: `1px solid ${therapist.is_available ? '#2e7d3220' : '#ccc'}`,
                          fontWeight: therapist.is_available ? 'bold' : 'normal'
                        }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
}