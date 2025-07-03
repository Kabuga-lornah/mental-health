// frontend_work/src/components/Meditation.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Container, Typography, Paper, Grid,
  Card, CardContent, Button, CircularProgress,
  Snackbar, Alert, Chip, Divider
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { GoogleGenerativeAI } from '@google/generative-ai';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';

// Define theme colors
const themePrimaryColor = '#780000'; // Dark red/maroon
const themeLightBackground = '#fefae0'; // Light cream/yellowish white
const themeButtonHoverColor = '#5a0000'; // Darker red/maroon for hover
const themeCardBackground = 'white'; // White for cards
const themeAccentColor = '#DCC8C8'; // A subtle accent for chips

// Define animations
import { keyframes } from '@emotion/react';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const scaleIn = keyframes`
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
`;


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
      console.error('Youtube error:', error);
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
      // Filter journal entries for the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentEntries = journalEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= sevenDaysAgo;
      }).map(entry => ({
        date: new Date(entry.date).toLocaleDateString(),
        mood: entry.mood || 'neutral',
        content: entry.entry || 'No content'
      }));

      if (recentEntries.length === 0) {
        setSnackbarMessage("No journal entries found for the last 7 days to analyze.");
        setSnackbarSeverity('info');
        setSnackbarOpen(true);
        setLoadingRecommendation(false);
        return;
      }


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
          "Youtube_query": "Specific search term for finding relevant YouTube videos about this technique"
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
      const youtubeVideos = await searchYouTubeVideos(aiData.Youtube_query);

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
    <Box sx={{ minHeight: '100vh', backgroundColor: themeLightBackground, py: 8, fontFamily: 'Inter, sans-serif' }}>
      <Container maxWidth="lg">
        {/* Removed Paper elevation and styling here */}
        <Typography variant="h4" align="center" sx={{ color: themePrimaryColor, mb: 4, fontWeight: 'bold', fontFamily: 'Poppins, sans-serif' }}>
          <SelfImprovementIcon sx={{ mr: 1, fontSize: '2.5rem', verticalAlign: 'bottom' }} /> Mindfulness & Meditation Hub
        </Typography>

        <Box sx={{ mb: 5, p: { xs: 2, sm: 4 }, borderRadius: 3, backgroundColor: themeCardBackground, boxShadow: '0px 6px 15px rgba(0,0,0,0.1)', animation: `${fadeIn} 1s ease-out forwards 0.2s`, animationFillMode: 'backwards' }}>
          <Typography variant="h5" sx={{ color: themePrimaryColor, mb: 2, fontWeight: 'bold', borderBottom: `2px solid ${themeAccentColor}50`, pb: 1 }}>
            Your Recent Moods (from Journal Entries)
          </Typography>

          {loadingJournals ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 100 }}>
              <CircularProgress size={20} sx={{ color: themePrimaryColor }} />
              <Typography sx={{ ml: 1, color: themePrimaryColor }}>Loading journal insights...</Typography>
            </Box>
          ) : journalEntries.length > 0 ? (
            <Grid container spacing={3}>
              {journalEntries.slice(0, 5).map((entry, index) => (
                <Grid item xs={12} sm={6} md={4} key={entry.id} sx={{ animation: `${scaleIn} 0.8s ease-out forwards ${0.1 * index + 0.3}s`, animationFillMode: 'backwards' }}>
                  <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: themeLightBackground, p: 2, height: '100%', boxShadow: '0px 4px 10px rgba(0,0,0,0.05)' }}>
                    <CardContent>
                      <Typography variant="subtitle2" sx={{ color: themePrimaryColor, mb: 1, fontWeight: 'bold' }}>
                        Date: {new Date(entry.date).toLocaleDateString()}
                      </Typography>
                      <Box sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body1" component="span" sx={{ mr: 1, color: '#555' }}>Mood:</Typography>
                        <Chip label={entry.mood || 'N/A'} size="small" sx={{ bgcolor: themeAccentColor, color: themePrimaryColor, fontWeight: 'bold' }} />
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
                          WebkitBoxOrient: 'vertical',
                          color: '#444'
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
              <Grid item xs={12} sx={{ textAlign: 'center', mt: 3 }}>
                <Button
                  variant="contained"
                  onClick={analyzeMoodAndRecommend}
                  disabled={loadingRecommendation}
                  sx={{
                    backgroundColor: themePrimaryColor,
                    color: themeCardBackground,
                    py: 1.5,
                    px: 4,
                    borderRadius: 2,
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    '&:hover': {
                      backgroundColor: themeButtonHoverColor,
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 15px rgba(120, 0, 0, 0.4)'
                    },
                    '&:disabled': {
                      backgroundColor: '#ccc',
                      color: '#666'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  {loadingRecommendation ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1, color: themeCardBackground }} />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <AutoFixHighIcon sx={{ mr: 1 }} /> Analyze Mood & Get Recommendations
                    </>
                  )}
                </Button>
              </Grid>
            </Grid>
          ) : (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                Start journaling to unlock personalized meditation recommendations!
              </Typography>
              <img src="https://assets.website-files.com/5f76269b52a16d2b36a103c8/603e913a1727768565a4e5ed_undraw_empty_re_opql.svg" alt="No journal entries" style={{ maxWidth: '200px', opacity: 0.7 }} />
              <Button
                component={Link}
                to="/journal"
                variant="outlined"
                sx={{ mt: 3, borderColor: themePrimaryColor, color: themePrimaryColor, '&:hover': { backgroundColor: `${themePrimaryColor}10` } }}
              >
                Go to Journal
              </Button>
            </Box>
          )}
        </Box>

        {aiRecommendation && (
          <Box sx={{ mt: 4, p: 4, border: `2px solid ${themePrimaryColor}`, borderRadius: 3, backgroundColor: themeLightBackground, boxShadow: '0 8px 20px rgba(0,0,0,0.15)', animation: `${scaleIn} 1s ease-out forwards` }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: themePrimaryColor, mb: 3, display: 'flex', alignItems: 'center', borderBottom: `2px solid ${themePrimaryColor}20`, pb: 1 }}>
              <LightbulbOutlinedIcon sx={{ mr: 1, fontSize: '2.5rem' }} /> Your Personalized Meditation Recommendation
            </Typography>
            
            <Box sx={{ mb: 3, p: 2, backgroundColor: themeCardBackground, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: themePrimaryColor, mb: 1 }}>
                Mood Analysis:
              </Typography>
              <Typography variant="body1" sx={{ mb: 0, color: '#333' }}>
                {aiRecommendation.mood_summary}
              </Typography>
            </Box>

            <Box sx={{ mb: 3, p: 2, backgroundColor: themeCardBackground, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: themePrimaryColor, mb: 1 }}>
                Recommended Technique: <span style={{ color: '#555', fontWeight: 'normal' }}>{aiRecommendation.recommended_technique}</span>
              </Typography>
              <Typography variant="body1" sx={{ mb: 1, color: '#333' }}>
                <strong>How to practice:</strong> {aiRecommendation.technique_explanation}
              </Typography>
              <Typography variant="body1" sx={{ color: '#333' }}>
                <strong>Why this technique:</strong> {aiRecommendation.reason_for_choice}
              </Typography>
            </Box>

            {aiRecommendation.youtube_videos && aiRecommendation.youtube_videos.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: themePrimaryColor, mb: 2, borderBottom: `1px dashed ${themeAccentColor}`, pb: 1 }}>
                  📺 Recommended Videos:
                </Typography>
                <Grid container spacing={3}>
                  {aiRecommendation.youtube_videos.map((video, index) => (
                    <Grid item xs={12} md={6} key={video.id.videoId} sx={{ animation: `${scaleIn} 0.8s ease-out forwards ${0.1 * index + 0.8}s`, animationFillMode: 'backwards' }}>
                      <Card sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                        <Box sx={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                          <iframe
                            src={`https://www.youtube.com/embed/${video.id.videoId}`}
                            title={video.snippet.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
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
                        <CardContent sx={{ bgcolor: themeCardBackground }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, color: themePrimaryColor }}>
                            {video.snippet.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ color: '#444' }}>
                            {video.snippet.description.length > 100 
                              ? video.snippet.description.substring(0, 100) + '...'
                              : video.snippet.description}
                          </Typography>
                          <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#666', fontStyle: 'italic' }}>
                            Channel: {video.snippet.channelTitle}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            <Box sx={{ mt: 4, p: 2.5, backgroundColor: `${themePrimaryColor}10`, borderRadius: 2, border: `1px solid ${themePrimaryColor}30`, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <Typography variant="body2" sx={{ fontStyle: 'italic', color: themePrimaryColor, fontWeight: 'medium' }}>
                💡 <strong>Tip:</strong> Consistency is key. Practice this technique for 5-10 minutes daily for best results. 
                Remember, meditation is a practice - be patient and kind with yourself as you develop this skill.
              </Typography>
            </Box>
          </Box>
        )}

      </Container>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Meditation;