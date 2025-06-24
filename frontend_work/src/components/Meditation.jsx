// frontend_work/src/components/Meditation.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Container, Typography, Paper, Grid,
  Card, CardContent, Button, CircularProgress,
  Snackbar, Alert, Chip
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function Meditation() {
  const { user, token } = useAuth();
  const [journalEntries, setJournalEntries] = useState([]);
  const [loadingJournals, setLoadingJournals] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('error');
  const [aiRecommendation, setAiRecommendation] = useState(null);

  const fetchJournalEntries = useCallback(async () => {
    if (!user || !token) {
      setLoadingJournals(false);
      return;
    }
    setLoadingJournals(true);
    try {
      const response = await axios.get('http://localhost:8000/api/journal/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJournalEntries(response.data);
    } catch (err) {
      console.error("Error fetching journal entries:", err.response?.data || err);
      setSnackbarMessage("Failed to load your journal entries.");
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoadingJournals(false);
    }
  }, [user, token]);

  useEffect(() => {
    fetchJournalEntries();
  }, [fetchJournalEntries]);

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  const analyzeMoodAndRecommend = async () => {
    if (!journalEntries.length) {
      setSnackbarMessage("No journal entries to analyze yet! Start writing to see insights.");
      setSnackbarSeverity('info');
      setSnackbarOpen(true);
      return;
    }

    setSnackbarMessage("Analyzing your journal entries for personalized recommendations...");
    setSnackbarSeverity('info');
    setSnackbarOpen(true);
    setAiRecommendation(null);

    // Get recent journal entries to send to the backend AI
    const recentJournalContent = journalEntries.slice(0, 10).map(entry => ({ // Use up to 10 entries
      date: new Date(entry.date).toLocaleDateString(),
      mood: entry.mood,
      content: entry.entry
    }));

    try {
      const response = await axios.post('http://localhost:8000/api/ai/recommendations/', // NEW ENDPOINT
        { journal_entries: recentJournalContent },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = response.data;

      // Update state with AI-generated recommendation
      setAiRecommendation({
        mood_summary: data.mood_summary,
        recommended_technique_title: data.recommended_technique_title,
        recommended_technique_explanation: data.recommended_technique_explanation,
        recommended_technique_reason: data.recommended_technique_reason,
        recommended_resource_type: data.recommended_resource_type,
        recommended_resource_title: data.recommended_resource_title,
        recommended_resource_link_or_id: data.recommended_resource_link_or_id,
      });

      setSnackbarMessage("AI analysis complete! See your personalized recommendation below.");
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

    } catch (error) {
      console.error("Error fetching AI recommendation:", error.response?.data || error);
      const errorMessage = error.response?.data?.error || "Failed to get AI recommendation. Please try again later.";
      setSnackbarMessage(errorMessage);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      setAiRecommendation(null); // Clear previous recommendation on error
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#fefae0', py: 8, fontFamily: 'Inter, sans-serif' }}>
      <Container maxWidth="lg">
        <Paper elevation={6} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 3, backgroundColor: 'white' }}>
          <Typography variant="h4" align="center" sx={{ color: '#780000', mb: 4, fontWeight: 'bold' }}>
            Mindfulness & Meditation Hub
          </Typography>

          <Box sx={{ mb: 5 }}>
            <Typography variant="h5" sx={{ color: '#780000', mb: 2, fontWeight: 'bold' }}>
              Your Recent Moods (from Journal Entries)
            </Typography>

            {loadingJournals ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 100 }}>
                <CircularProgress size={20} sx={{ color: '#780000' }} />
                <Typography sx={{ ml: 1, color: '#780000' }}>Loading journal insights...</Typography>
              </Box>
            ) : journalEntries.length > 0 ? (
              <Grid container spacing={2}>
                {journalEntries.slice(0, 5).map((entry) => (
                  <Grid item xs={12} sm={6} md={4} key={entry.id}>
                    <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: '#fdf8f5', p: 2, height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle2" sx={{ color: '#780000', mb: 1 }}>
                          Date: {new Date(entry.date).toLocaleDateString()}
                        </Typography>
                        <Box sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body1" component="span" sx={{ mr: 1 }}>Mood:</Typography>
                          <Chip label={entry.mood || 'N/A'} size="small" sx={{ bgcolor: '#DCC8C8', color: '#333' }} />
                        </Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mt: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical'
                          }}
                        >
                          {entry.entry
                            ? `"${entry.entry.length > 100 ? entry.entry.substring(0, 100) + '...' : entry.entry}"`
                            : "No entry content available."}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    onClick={analyzeMoodAndRecommend}
                    sx={{
                      backgroundColor: '#780000',
                      color: 'white',
                      mt: 2,
                      '&:hover': {
                        backgroundColor: '#a4161a'
                      }
                    }}
                  >
                    Analyze Mood & Get Recommendations
                  </Button>
                </Grid>
              </Grid>
            ) : (
              <Typography>No journal entries available yet.</Typography>
            )}
          </Box>

          {aiRecommendation && (
            <Box sx={{ mt: 4, p: 3, border: '1px solid #ccc', borderRadius: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#780000' }}>
                AI Recommendation:
              </Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                {aiRecommendation.mood_summary}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>Technique:</strong> {aiRecommendation.recommended_technique_title}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>Explanation:</strong> {aiRecommendation.recommended_technique_explanation}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>Why:</strong> {aiRecommendation.recommended_technique_reason}
              </Typography>
              {aiRecommendation.recommended_resource_type === 'youtube' && aiRecommendation.recommended_resource_link_or_id && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Recommended Video:</strong> {aiRecommendation.recommended_resource_title}
                  </Typography>
                  <iframe
                    width="100%"
                    height="315"
                    src={`https://www.youtube.com/embed/${aiRecommendation.recommended_resource_link_or_id}`} // Corrected YouTube embed URL format
                    title="YouTube video player"
                    frameBorder="0"
                    allowFullScreen
                  ></iframe>
                </Box>
              )}
               {aiRecommendation.recommended_resource_type === 'none' && (
                <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic', color: 'text.secondary' }}>
                  No specific video resource recommended at this time.
                </Typography>
              )}
            </Box>
          )}

        </Paper>
      </Container>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Meditation;