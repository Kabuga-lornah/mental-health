// frontend_work/src/components/Meditation.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Container, Typography, Paper, Grid,
  Card, CardContent, Button, CircularProgress,
  Snackbar, Alert, Chip
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { GoogleGenerativeAI } from '@google/generative-ai';

// API Keys - In production, these should be environment variables
const GEMINI_API_KEY = 'AIzaSyCzfeeSL53b5qVuGp2UyKyWQJ_rctM3Kjc';
const YOUTUBE_API_KEY = 'AIzaSyAP8LY0p-ah_dXTWxcg81kt63JqmUrVWuw';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

function Meditation() {
  const { user, token } = useAuth();
  const [journalEntries, setJournalEntries] = useState([]);
  const [loadingJournals, setLoadingJournals] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('error');
  const [aiRecommendation, setAiRecommendation] = useState(null);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);

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

  const searchYouTubeVideos = async (query) => {
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=3&key=${YOUTUBE_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error('YouTube API request failed');
      }
      
      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('YouTube search error:', error);
      return [];
    }
  };

  const analyzeMoodAndRecommend = async () => {
    if (!journalEntries.length) {
      setSnackbarMessage("No journal entries to analyze yet! Start writing to see insights.");
      setSnackbarSeverity('info');
      setSnackbarOpen(true);
      return;
    }

    setLoadingRecommendation(true);
    setSnackbarMessage("Analyzing your journal entries for personalized recommendations...");
    setSnackbarSeverity('info');
    setSnackbarOpen(true);
    setAiRecommendation(null);

    try {
      // Prepare recent journal entries for analysis
      const recentEntries = journalEntries.slice(0, 10).map(entry => ({
        date: new Date(entry.date).toLocaleDateString(),
        mood: entry.mood || 'neutral',
        content: entry.entry || 'No content'
      }));

      // Create prompt for Gemini AI
      const prompt = `
        As a mindfulness and meditation expert, analyze these recent journal entries and provide personalized meditation recommendations:

        Journal Entries:
        ${recentEntries.map(entry => `Date: ${entry.date}, Mood: ${entry.mood}, Content: "${entry.content}"`).join('\n')}

        Please provide your response in this exact JSON format:
        {
          "mood_summary": "Brief summary of the person's overall mood patterns and emotional state",
          "recommended_technique": "Name of the meditation/mindfulness technique",
          "technique_explanation": "Detailed explanation of how to practice this technique (2-3 sentences)",
          "reason_for_choice": "Why this technique is specifically recommended based on their journal entries",
          "youtube_search_query": "Specific search term for finding relevant YouTube videos about this technique"
        }

        Focus on evidence-based meditation techniques like mindfulness, breathing exercises, body scan, loving-kindness, etc.
      `;

      // Get AI recommendation
      const result = await model.generateContent(prompt);
      const aiResponseText = result.response.text();
      
      // Parse JSON response
      let aiData;
      try {
        // Clean the response text to extract JSON
        const jsonMatch = aiResponseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        throw new Error('Invalid AI response format');
      }

      // Search for YouTube videos
      const youtubeVideos = await searchYouTubeVideos(aiData.youtube_search_query);

      // Set the recommendation with YouTube videos
      setAiRecommendation({
        mood_summary: aiData.mood_summary,
        recommended_technique: aiData.recommended_technique,
        technique_explanation: aiData.technique_explanation,
        reason_for_choice: aiData.reason_for_choice,
        youtube_videos: youtubeVideos
      });

      setSnackbarMessage("AI analysis complete! See your personalized recommendation below.");
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

    } catch (error) {
      console.error("Error getting AI recommendation:", error);
      setSnackbarMessage("Failed to get AI recommendation. Please try again later.");
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      setAiRecommendation(null);
    } finally {
      setLoadingRecommendation(false);
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
                    disabled={loadingRecommendation}
                    sx={{
                      backgroundColor: '#780000',
                      color: 'white',
                      mt: 2,
                      '&:hover': {
                        backgroundColor: '#a4161a'
                      },
                      '&:disabled': {
                        backgroundColor: '#ccc'
                      }
                    }}
                  >
                    {loadingRecommendation ? (
                      <>
                        <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
                        Analyzing...
                      </>
                    ) : (
                      'Analyze Mood & Get Recommendations'
                    )}
                  </Button>
                </Grid>
              </Grid>
            ) : (
              <Typography>No journal entries available yet.</Typography>
            )}
          </Box>

          {aiRecommendation && (
            <Box sx={{ mt: 4, p: 3, border: '2px solid #780000', borderRadius: 3, backgroundColor: '#fdf8f5' }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#780000', mb: 3 }}>
                🧘 Your Personalized Meditation Recommendation
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#780000', mb: 1 }}>
                  Mood Analysis:
                </Typography>
                <Typography variant="body1" sx={{ mb: 2, p: 2, backgroundColor: 'white', borderRadius: 2 }}>
                  {aiRecommendation.mood_summary}
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#780000', mb: 1 }}>
                  Recommended Technique: {aiRecommendation.recommended_technique}
                </Typography>
                <Typography variant="body1" sx={{ mb: 2, p: 2, backgroundColor: 'white', borderRadius: 2 }}>
                  <strong>How to practice:</strong> {aiRecommendation.technique_explanation}
                </Typography>
                <Typography variant="body1" sx={{ p: 2, backgroundColor: 'white', borderRadius: 2 }}>
                  <strong>Why this technique:</strong> {aiRecommendation.reason_for_choice}
                </Typography>
              </Box>

              {aiRecommendation.youtube_videos && aiRecommendation.youtube_videos.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#780000', mb: 2 }}>
                    📺 Recommended Videos:
                  </Typography>
                  <Grid container spacing={2}>
                    {aiRecommendation.youtube_videos.map((video, index) => (
                      <Grid item xs={12} md={6} key={video.id.videoId}>
                        <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
                          <Box sx={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                            <iframe
                              src={`https://www.youtube.com/embed/${video.id.videoId}`}
                              title={video.snippet.title}
                              frameBorder="0"
                              allowFullScreen
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%'
                              }}
                            />
                          </Box>
                          <CardContent>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                              {video.snippet.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {video.snippet.description.length > 100 
                                ? video.snippet.description.substring(0, 100) + '...'
                                : video.snippet.description}
                            </Typography>
                            <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#780000' }}>
                              Channel: {video.snippet.channelTitle}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              <Box sx={{ mt: 3, p: 2, backgroundColor: '#fff3cd', borderRadius: 2, border: '1px solid #ffeaa7' }}>
                <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#856404' }}>
                  💡 <strong>Tip:</strong> Practice this technique for 5-10 minutes daily for best results. 
                  Remember, meditation is a practice - be patient and kind with yourself as you develop this skill.
                </Typography>
              </Box>
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