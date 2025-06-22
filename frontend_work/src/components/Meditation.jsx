import React, { useState, useEffect, useCallback } from 'react';
import { Box, Container, Typography, Paper, Grid, Card, CardContent, CardMedia, Button, CircularProgress, Snackbar, Alert, Chip, Stack } from '@mui/material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

/**
 * Meditation component provides a hub for mindfulness and meditation resources.
 * It fetches recent journal entries to display mood insights and offers curated content
 * like meditation techniques, sleep podcasts, and calming YouTube videos.
 */
function Meditation() {
  const { user, token } = useAuth();
  const [journalEntries, setJournalEntries] = useState([]);
  const [loadingJournals, setLoadingJournals] = useState(true);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('error');
  const [aiRecommendation, setAiRecommendation] = useState(null);

  /**
   * Fetches the user's journal entries from the backend.
   * This data can be used to display recent moods or as input for potential mood analysis.
   */
  const fetchJournalEntries = useCallback(async () => {
    if (!user || !token) {
      setLoadingJournals(false);
      return;
    }
    setLoadingJournals(true);
    try {
      // Make a GET request to your Django backend's journal entries API
      const response = await axios.get('http://localhost:8000/api/journal/', { // Corrected API endpoint as per previous discussion
        headers: { Authorization: `Bearer ${token}` }
      });
      setJournalEntries(response.data);
    } catch (err) {
      console.error("Error fetching journal entries:", err.response?.data || err);
      setError("Failed to load journal entries. Please try again later.");
      setSnackbarMessage("Failed to load your journal entries.");
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoadingJournals(false);
    }
  }, [user, token]);

  // Effect hook to fetch journal entries when the component mounts or user/token changes
  useEffect(() => {
    fetchJournalEntries();
  }, [fetchJournalEntries]);

  /**
   * Handles closing the Snackbar message.
   */
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  /**
   * Analyzes mood based on journal entries and provides AI-driven recommendations.
   * This function now simulates an LLM call to generate more personalized advice.
   */
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

    // Extract relevant data for AI analysis (e.g., last 5 entries content and moods)
    const recentJournalContent = journalEntries.slice(0, 5).map(entry => ({
      date: new Date(entry.date).toLocaleDateString(),
      mood: entry.mood,
      content: entry.entry // Use 'entry' field from the Django model for journal content
    }));

    // --- REAL LLM API CALL PLACEHOLDER ---
    try {
        // ... (LLM API call commented out as it's a placeholder)
    } catch (llmError) {
        console.error("Error calling LLM for mood analysis:", llmError);
        setSnackbarMessage("Failed to get AI recommendations due to an error. Please try again.");
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        setAiRecommendation(null);
        return;
    }

    // --- SIMULATED AI RESPONSE (if not using actual LLM API for demo) ---
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
          simulatedRecommendation.recommended_technique_title = "Guided Meditation for Stress Relief";
          simulatedRecommendation.recommended_technique_reason = "Guided meditations can help you follow along and gently guide your focus away from stressors, promoting deep relaxation.";
          simulatedRecommendation.recommended_resource_type = "youtube";
          simulatedRecommendation.recommended_resource_title = "10-Minute Meditation for Anxiety";
          simulatedRecommendation.recommended_resource_link_or_id = "inpohvC0G0g";
          break;
        case 'sad':
        case 'lonely':
          simulatedRecommendation.recommended_technique_title = "Loving-Kindness Meditation";
          simulatedRecommendation.recommended_technique_reason = "This technique fosters self-compassion and connection, which can be particularly helpful when experiencing feelings of sadness or loneliness.";
          simulatedRecommendation.recommended_resource_type = "none";
          break;
        case 'tired':
        case 'exhausted':
          simulatedRecommendation.recommended_technique_title = "Body Scan Meditation";
          simulatedRecommendation.recommended_technique_reason = "A body scan can help you relax tension in your physical body, preparing you for restful sleep or just deep relaxation.";
          simulatedRecommendation.recommended_resource_type = "podcast";
          simulatedRecommendation.recommended_resource_title = "Sleep with Me";
          simulatedRecommendation.recommended_resource_link_or_id = "https://www.sleepwithmepodcast.com/";
          break;
        case 'happy':
        case 'joyful':
          simulatedRecommendation.recommended_technique_title = "Mindfulness Breathing";
          simulatedRecommendation.recommended_technique_reason = "Even when happy, mindfulness breathing can deepen your appreciation for the present moment and maintain a sense of calm and clarity.";
          simulatedRecommendation.recommended_resource_type = "none";
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

  // Curated list of meditation techniques
  const meditationTechniques = [
    {
      title: "Guided Meditation for Stress Relief",
      description: "A popular technique to calm the mind and body. Focus on a guide's voice as they lead you through relaxation exercises.",
      benefits: ["Reduces stress", "Improves focus", "Promotes relaxation"]
    },
    {
      title: "Mindfulness Breathing",
      description: "Pay attention to your breath without judgment. Notice the sensation of air entering and leaving your body.",
      benefits: ["Increases self-awareness", "Grounds you in the present", "Reduces anxiety"]
    },
    {
      title: "Body Scan Meditation",
      description: "Systematically bring awareness to different parts of your body, noticing any sensations without trying to change them.",
      benefits: ["Enhances body awareness", "Relieves tension", "Promotes sleep"]
    },
    {
      title: "Loving-Kindness Meditation",
      description: "Cultivate feelings of warmth, kindness, and compassion towards yourself and others.",
      benefits: ["Boosts positive emotions", "Reduces self-criticism", "Enhances empathy"]
    },
  ];

  // Curated list of soothing podcasts for sleep deprivation
  const sleepPodcasts = [
    {
      title: "Sleep with Me",
      description: "The podcast that puts you to sleep. A soothing voice tells meandering, bedtime stories that are just boring enough to help you drift off.",
      link: "https://www.sleepwithmepodcast.com/"
    },
    {
      title: "Nothing Much Happens",
      description: "Bedtime stories for grown-ups. Gently told stories to help you relax and fall asleep.",
      link: "https://www.nothingmuchhappens.com/"
    },
    {
      title: "Sleep Whispers",
      description: "Gentle whispered ramblings and readings designed to help you fall asleep.",
      link: "https://sleepwhispers.com/"
    },
  ];

  // Curated list of YouTube videos for calming and mental health
  const youtubeVideos = [
    {
      title: "10-Minute Meditation for Anxiety",
      description: "A quick, guided meditation perfect for easing anxiety and finding inner calm.",
      embedId: "inpohvC0G0g"
    },
    {
      title: "Calm Your Mind & Body: Gentle Guided Meditation",
      description: "A longer session for deep relaxation and mental clarity, suitable for unwinding after a long day.",
      embedId: "Qp4x9n6I0yY"
    },
    {
      title: "Breathwork for Stress Release",
      description: "Learn simple yet powerful breathing exercises to release tension, calm your nervous system, and feel more grounded.",
      embedId: "p5yT9190Q98"
    },
    {
      title: "Relaxing Rain & Thunder Sounds for Sleep",
      description: "Immerse yourself in calming natural sounds to promote deep sleep and relaxation.",
      embedId: "Ll_4z5yI9Jg"
    },
  ];

  // Function to find a specific video by embedId
  const findYoutubeVideo = (embedId) => {
    return youtubeVideos.find(video => video.embedId === embedId);
  };

  // Function to find a specific podcast by link
  const findPodcast = (link) => {
    return sleepPodcasts.find(podcast => podcast.link === link);
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#fefae0', py: 8, fontFamily: 'Inter, sans-serif' }}>
      <Container maxWidth="lg">
        <Paper elevation={6} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 3, backgroundColor: 'white' }}>
          <Typography variant="h4" align="center" sx={{ color: '#780000', mb: 4, fontWeight: 'bold' }}>
            Mindfulness & Meditation Hub
          </Typography>

          {/* Section: Your Journal Insights / Mood Analysis Placeholder */}
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
                        <Typography variant="body1" sx={{ mb: 1 }}>
                          Mood: <Chip label={entry.mood || 'N/A'} size="small" sx={{ bgcolor: '#DCC8C8', color: '#333' }} />
                        </Typography>
                        {/* --- FIX APPLIED HERE --- */}
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                          {entry.entry ? // Check if entry.entry exists
                            `"${entry.entry.length > 100 ? entry.entry.substring(0, 100) + '...' : entry.entry}"`
                            : "No entry content available."}
                        </Typography>
                        {/* --- END FIX --- */}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    sx={{
                      backgroundColor: '#780000',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: '#5a0000',
                      },
                      mt: 3,
                      py: 1.2,
                      borderRadius: 2,
                    }}
                    onClick={analyzeMoodAndRecommend}
                  >
                    Get Personalized AI Recommendations
                  </Button>
                  <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                    *Click here to analyze your recent journal entries for tailored meditation advice.
                  </Typography>
                </Grid>
              </Grid>
            ) : (
              <Typography variant="body1" color="text.secondary">
                You haven't added any journal entries yet. Start journaling to track your moods and get insights!
              </Typography>
            )}
          </Box>

          {/* Section: AI Personalized Recommendation */}
          {aiRecommendation && (
            <Box sx={{ mb: 5 }}>
              <Typography variant="h5" sx={{ color: '#007800', mb: 2, fontWeight: 'bold' }}>
                AI's Personalized Recommendation
              </Typography>
              <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2, bgcolor: '#e8f5e9', border: '1px solid #a5d6a7' }}>
                <Typography variant="body1" sx={{ mb: 1.5, fontWeight: 'medium' }}>
                  <span style={{ color: '#004d00' }}>Mood Summary:</span> {aiRecommendation.mood_summary}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1.5, fontWeight: 'medium' }}>
                  <span style={{ color: '#004d00' }}>Recommended Technique:</span> {aiRecommendation.recommended_technique_title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  <span style={{ color: '#004d00' }}>Reasoning:</span> {aiRecommendation.recommended_technique_reason}
                </Typography>

                {aiRecommendation.recommended_resource_type !== "none" && aiRecommendation.recommended_resource_link_or_id && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" sx={{ color: '#004d00', mb: 1, fontWeight: 'bold' }}>
                      Suggested Resource:
                    </Typography>
                    {aiRecommendation.recommended_resource_type === "youtube" ? (
                      (() => {
                        const video = findYoutubeVideo(aiRecommendation.recommended_resource_link_or_id);
                        if (video) {
                          return (
                            <Card elevation={1} sx={{ borderRadius: 2, bgcolor: '#dcf8dd' }}>
                              <CardMedia
                                component="iframe"
                                src={`https://www.youtube.com/embed/$${video.embedId}`}
                                title={video.title}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                sx={{ aspectRatio: '16/9', width: '100%', borderRadius: 'inherit' }}
                              />
                              <CardContent>
                                <Typography variant="subtitle1" sx={{ color: '#004d00', fontWeight: 'bold' }}>
                                  {video.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {video.description}
                                </Typography>
                              </CardContent>
                            </Card>
                          );
                        }
                        return <Typography variant="body2" color="text.secondary">Recommended YouTube video not found in list.</Typography>;
                      })()
                    ) : (
                      (() => {
                        const podcast = findPodcast(aiRecommendation.recommended_resource_link_or_id);
                        if (podcast) {
                          return (
                            <Card elevation={1} sx={{ borderRadius: 2, bgcolor: '#dcf8dd', display: 'flex', flexDirection: { xs: 'column', sm: 'row' } }}>
                              <CardContent sx={{ flexGrow: 1 }}>
                                <Typography variant="subtitle1" sx={{ color: '#004d00', fontWeight: 'bold' }}>
                                  {podcast.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                  {podcast.description}
                                </Typography>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  sx={{
                                    mt: 1,
                                    borderColor: '#004d00',
                                    color: '#004d00',
                                    '&:hover': { backgroundColor: '#c8e6c9' },
                                    textTransform: 'none'
                                  }}
                                  href={podcast.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  Listen Now
                                </Button>
                              </CardContent>
                            </Card>
                          );
                        }
                        return <Typography variant="body2" color="text.secondary">Recommended podcast not found in list.</Typography>;
                      })()
                    )}
                  </Box>
                )}
                {aiRecommendation.recommended_resource_type === "none" && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        No specific audio/video resource recommended at this time based on your current mood.
                    </Typography>
                )}
              </Paper>
            </Box>
          )}

          {/* Stack for consistent spacing between major sections */}
          <Stack spacing={6}>
            {/* Section: Meditation Techniques */}
            <Box>
              <Typography variant="h5" sx={{ color: '#780000', mb: 2, fontWeight: 'bold' }}>
                Explore Meditation Techniques
              </Typography>
              <Grid container spacing={3}>
                {meditationTechniques.map((tech, index) => (
                  <Grid item xs={12} md={6} lg={3} key={index}>
                    <Card elevation={3} sx={{ borderRadius: 2, bgcolor: '#fdf8f5', height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" sx={{ color: '#780000', mb: 1, fontWeight: 'bold' }}>{tech.title}</Typography>
                        <Typography variant="body2" color="text.secondary">{tech.description}</Typography>
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" sx={{ color: '#780000', mb: 0.5 }}>Benefits:</Typography>
                          <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
                            {tech.benefits.map((benefit, bIndex) => (
                              <Chip key={bIndex} label={benefit} size="small" sx={{ bgcolor: '#EADDDD', color: '#333', mr: 0.5, mb: 0.5 }} />
                            ))}
                          </Stack>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>

            {/* Section: Soothing Podcasts for Sleep */}
            <Box>
              <Typography variant="h5" sx={{ color: '#780000', mb: 2, fontWeight: 'bold' }}>
                Soothing Podcasts for Sleep
              </Typography>
              <Grid container spacing={3}>
                {sleepPodcasts.map((podcast, index) => (
                  <Grid item xs={12} md={6} key={index}>
                    <Card elevation={3} sx={{ borderRadius: 2, bgcolor: '#fdf8f5', display: 'flex', flexDirection: { xs: 'column', sm: 'row' } }}>
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" sx={{ color: '#780000', mb: 1, fontWeight: 'bold' }}>{podcast.title}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{podcast.description}</Typography>
                        {podcast.link && (
                          <Button
                            variant="outlined"
                            size="small"
                            sx={{
                              mt: 2,
                              borderColor: '#780000',
                              color: '#780000',
                              '&:hover': { backgroundColor: '#DCC8C8' },
                              textTransform: 'none'
                            }}
                            href={podcast.link}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Listen Now
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>

            {/* Section: YouTube Videos for Calming & Mental Health */}
            <Box>
              <Typography variant="h5" sx={{ color: '#780000', mb: 2, fontWeight: 'bold' }}>
                YouTube Videos for Calming & Mental Health
              </Typography>
              <Grid container spacing={3}>
                {youtubeVideos.map((video, index) => (
                  <Grid item xs={12} md={6} key={index}>
                    <Card elevation={3} sx={{ borderRadius: 2, bgcolor: '#fdf8f5', height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <CardMedia
                        component="iframe"
                        src={`https://www.youtube.com/embed/$${video.embedId}`}
                        title={video.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        sx={{
                          aspectRatio: '16/9',
                          borderTopLeftRadius: 8,
                          borderTopRightRadius: 8,
                          width: '100%',
                          minHeight: { xs: 200, sm: 250, md: 300 }
                        }}
                      />
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" sx={{ color: '#780000', mb: 1, fontWeight: 'bold' }}>{video.title}</Typography>
                        <Typography variant="body2" color="text.secondary">{video.description}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Stack>
        </Paper>
      </Container>
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%', borderRadius: 2 }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Meditation;