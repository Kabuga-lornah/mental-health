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

    const recentJournalContent = journalEntries.slice(0, 5).map(entry => ({
      date: new Date(entry.date).toLocaleDateString(),
      mood: entry.mood,
      content: entry.entry
    }));

    const moods = recentJournalContent.map(entry => entry.mood).filter(Boolean);
    let mostFrequentMood = null;
    if (moods.length > 0) {
      const moodCounts = moods.reduce((acc, mood) => {
        acc[mood] = (acc[mood] || 0) + 1;
        return acc;
      }, {});
      mostFrequentMood = Object.keys(moodCounts).reduce((a, b) => moodCounts[a] > moodCounts[b] ? a : b, null);
    }

    let simulatedRecommendation = {
      mood_summary: "Based on your recent entries, your overall mood seems balanced.",
      recommended_technique_title: "Mindfulness Breathing",
      recommended_technique_reason: "It's a foundational technique that can help ground you and observe your thoughts without judgment, beneficial for various emotional states.",
      recommended_resource_type: "none",
      recommended_resource_title: "No specific resource recommended at this time.",
      recommended_resource_link_or_id: ""
    };

    if (mostFrequentMood) {
      simulatedRecommendation.mood_summary = `Based on your recent entries, you frequently feel: ${mostFrequentMood}.`;
      switch (mostFrequentMood.toLowerCase()) {
        case 'stressed':
        case 'anxious':
          simulatedRecommendation = {
            ...simulatedRecommendation,
            recommended_technique_title: "Guided Meditation for Stress Relief",
            recommended_technique_reason: "Guided meditations can help you follow along and gently guide your focus away from stressors, promoting deep relaxation.",
            recommended_resource_type: "youtube",
            recommended_resource_title: "10-Minute Meditation for Anxiety",
            recommended_resource_link_or_id: "inpohvC0G0g"
          };
          break;
        case 'sad':
        case 'lonely':
          simulatedRecommendation = {
            ...simulatedRecommendation,
            recommended_technique_title: "Loving-Kindness Meditation",
            recommended_technique_reason: "This technique fosters self-compassion and connection, which can be particularly helpful when experiencing feelings of sadness or loneliness.",
            recommended_resource_type: "none"
          };
          break;
        case 'tired':
        case 'exhausted':
          simulatedRecommendation = {
            ...simulatedRecommendation,
            recommended_technique_title: "Body Scan Meditation",
            recommended_technique_reason: "A body scan can help you relax tension in your physical body, preparing you for restful sleep or just deep relaxation.",
            recommended_resource_type: "youtube",
            recommended_resource_title: "Relaxing Rain & Thunder Sounds for Sleep",
            recommended_resource_link_or_id: "Ll_4z5yI9Jg"
          };
          break;
        case 'happy':
        case 'joyful':
          simulatedRecommendation = {
            ...simulatedRecommendation,
            recommended_technique_title: "Mindfulness Breathing",
            recommended_technique_reason: "Even when happy, mindfulness breathing can deepen your appreciation for the present moment and maintain a sense of calm and clarity.",
            recommended_resource_type: "none"
          };
          break;
        default:
          break;
      }
    }

    setAiRecommendation(simulatedRecommendation);
    setSnackbarMessage("AI analysis complete! See your personalized recommendation below.");
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
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
                <strong>Why:</strong> {aiRecommendation.recommended_technique_reason}
              </Typography>
              {aiRecommendation.recommended_resource_type === 'youtube' && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Recommended Video:</strong> {aiRecommendation.recommended_resource_title}
                  </Typography>
                  <iframe
                    width="100%"
                    height="315"
                    src={`https://www.youtube.com/embed/${aiRecommendation.recommended_resource_link_or_id}`}
                    title="YouTube video player"
                    frameBorder="0"
                    allowFullScreen
                  ></iframe>
                </Box>
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
