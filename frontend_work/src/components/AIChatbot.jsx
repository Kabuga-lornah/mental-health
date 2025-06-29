// frontend_work/src/components/AIChatbot.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box, Button, TextField, Typography, Paper, CircularProgress, IconButton,
  Snackbar, Alert, InputAdornment
} from '@mui/material';
import {
  Close as CloseIcon, Send as SendIcon, Chat as ChatIcon, Mic as MicIcon, Stop as StopIcon, VolumeUp as VolumeUpIcon,
  ThumbUpOutlined as ThumbUpOutlinedIcon,
  ThumbDownOutlined as ThumbDownOutlinedIcon,
  RefreshOutlined as RefreshOutlinedIcon,
  ContentCopyOutlined as ContentCopyOutlinedIcon,
  StopOutlined as StopOutlinedIcon
} from '@mui/icons-material';

import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = 'AIzaSyCzfeeSL53b5qVuGp2UyKyWQJ_rctM3Kjc';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatMessagesRef = useRef(null);

  const chatSessionRef = useRef(null);

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const [isSpeaking, setIsSpeaking] = useState(false);
  // Removed speakingMessageIndex as it's no longer needed for individual message icons
  // const [speakingMessageIndex, setSpeakingMessageIndex] = useState(null);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');

  useEffect(() => {
    // This useEffect hook is empty and can be removed or used for other initializations
  }, []);

  const speak = useCallback((text) => { // Removed index parameter as it's not needed for individual icons
    if (!window.speechSynthesis || !text) return;

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    
    setIsSpeaking(true);
    // setSpeakingMessageIndex(index); // Removed setting speaking index
    const utterance = new SpeechSynthesisUtterance(text);
    
    const voices = window.speechSynthesis.getVoices();
    let voiceToUse = null;

    voiceToUse = voices.find(
      (voice) => voice.lang.startsWith('en') && (voice.name.toLowerCase().includes('female') || voice.name.toLowerCase().includes('woman'))
    );
    
    if (!voiceToUse) {
        voiceToUse = voices.find(voice => voice.lang.startsWith('en'));
    }

    if (!voiceToUse && voices.length > 0) {
        voiceToUse = voices[0];
    }
    
    if (voiceToUse) {
      utterance.voice = voiceToUse;
    } else {
        console.warn("No suitable female or English voice found. Using default.");
    }

    utterance.pitch = 1;
    utterance.rate = 1;

    utterance.onend = () => {
      setIsSpeaking(false);
      // setSpeakingMessageIndex(null); // Removed clearing speaking index on end
    };
    utterance.onerror = (event) => {
        console.error('SpeechSynthesisUtterance.onerror', event);
        setIsSpeaking(false);
        // setSpeakingMessageIndex(null); // Removed clearing speaking index on error
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      // setSpeakingMessageIndex(null); // Removed clearing speaking index
    }
  }, []);

  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false; 
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        setInputMessage(finalTranscript || interimTranscript);

        if (finalTranscript) {
          setIsListening(false);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setSnackbarMessage(`Speech recognition error: ${event.error}. Please ensure microphone access is granted.`);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    } else {
      console.warn("Web Speech API (Speech Recognition) not supported in this browser.");
      setSnackbarMessage("Speech input is not supported in your browser.");
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
    }
  }, []);

  const handleListen = () => {
    if (!recognitionRef.current) {
      setSnackbarMessage("Speech recognition not supported or initialized.");
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      stopSpeaking();
      setInputMessage('');
      setMessages((prev) => [...prev, { type: 'system', text: "Listening... speak now." }]);
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const initialBotMessage = "Hi there! I'm MindWell's AI assistant. I can help answer questions about our platform, journaling, and general mental wellness topics. How can I assist you today?";
      setMessages([
        { type: 'bot', text: initialBotMessage }
      ]);
      
      chatSessionRef.current = model.startChat({
        history: [
          {
            role: "user",
            parts: [{ text: `You are MindWell's AI assistant. MindWell is a comprehensive mental wellness platform designed for individuals in Kenya. Our key features include:

            1.  **Smart Digital Journaling:**
                * Mood tracking with intuitive logging and interactive charts to visualize trends.
                * Free-form entries with customizable prompts and tags (e.g., #anxiety, #gratitude).
                * Allows users to upload attachments (images, voice notes) to entries.
                * Helps with self-reflection, emotional processing, identifying patterns, and personal growth.
            2.  **Professional Therapist Connections:**
                * Connects users with certified and vetted Kenyan therapists.
                * Offers secure video, audio, and text sessions.
                * Therapists undergo a rigorous vetting process and must be licensed with the Counsellors and Psychologists Board (CPB) in Kenya.
                * Supports booking free initial consultations or paid sessions based on hourly rates.
                * Therapists can manage their availability and session details.
            3.  **AI-Powered Support (This Chatbot):**
                * Provides real-time guidance and self-care suggestions.
                * Offers personalized mood insights based on journal entries (in the Meditation Hub).
                * Designed to be empathetic and supportive.
                * Crucially, it is **not a substitute for professional medical advice or therapy.**
                * Includes built-in crisis detection with reminders to seek professional help.
            4.  **Rich Self-Care & Meditation Library:**
                * Access to curated meditations, breathing exercises, and mindfulness techniques.
                * Offers articles and videos for daily wellness support.
                * Can recommend personalized meditation techniques based on journal analysis.
            5.  **Engaging Challenges & Rewards:**
                * Journaling challenges to encourage consistent practice.
                * Users can earn badges and track progress.
                * Opportunity to unlock free therapy sessions through participation.

            **Core Values:** Affordability, accessibility, engagement, comprehensive support.
            **Security & Privacy:** All data (journal entries, chat logs, personal info) is protected with robust end-to-end encryption. MindWell adheres to Kenya's Data Protection Act, 2019, ensuring user consent is paramount.

            Always be supportive, empathetic, and helpful. Guide users on how to use MindWell's features, and remind them that you do not provide medical diagnoses or treatment, always deferring to professional help when appropriate. Acknowledge this role.` }]
          },
          {
            role: "model", 
            parts: [{ text: "I understand. I'm MindWell's AI assistant, here to provide supportive guidance on mental wellness and journaling, and help you navigate our platform's features. I'll be empathetic and helpful while reminding users that I'm not a substitute for professional medical advice. How can I help you today?" }]
          }
        ],
        generationConfig: {
          maxOutputTokens: 200,
          temperature: 0.7,
        },
      });
    } else if (!isOpen) {
      setMessages([]);
      chatSessionRef.current = null;
      stopSpeaking();
    }
  }, [isOpen, messages.length, stopSpeaking]);

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (inputMessage.trim() === '') return;

    stopSpeaking();

    const userMessageText = inputMessage.trim();
    const userMessage = { type: 'user', text: userMessageText };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    if (!chatSessionRef.current) {
      console.error("Chat session not initialized.");
      setMessages((prevMessages) => [...prevMessages, { type: 'bot', text: "Error: AI service not ready. Please try again." }]);
      setIsTyping(false);
      return;
    }

    try {
      const result = await chatSessionRef.current.sendMessage(userMessageText);
      const botResponseText = result.response.text();

      let finalBotResponse = botResponseText;
      
      if (!finalBotResponse.toLowerCase().includes("mindwell") &&
          !finalBotResponse.toLowerCase().includes("journaling") &&
          !finalBotResponse.toLowerCase().includes("platform") &&
          !finalBotResponse.toLowerCase().includes("mental") &&
          !finalBotResponse.toLowerCase().includes("wellness") &&
          !finalBotResponse.toLowerCase().includes("therapist") &&
          !finalBotResponse.toLowerCase().includes("session") &&
          !finalBotResponse.toLowerCase().includes("meditation") &&
          !finalBotResponse.toLowerCase().includes("resource")) {
        finalBotResponse += "\n\n*Please remember I am an AI assistant and not a substitute for professional medical advice or therapy. If you are in crisis, please seek immediate professional help.*";
      }

      setMessages((prevMessages) => [...prevMessages, { type: 'bot', text: finalBotResponse }]);
    } catch (error) {
      console.error("Error communicating with AI:", error);
      
      let errorMessage = "I'm having trouble connecting right now. Please try again later.";
      
      if (error.status === 429) {
        errorMessage = "I'm receiving too many requests. Please wait a moment and try again.";
      } else if (error.status === 500 || error.status === 503) {
        errorMessage = "The AI service is currently unavailable. Please try again later.";
      } else if (error.message && error.message.includes('not found')) {
        errorMessage = "The AI model is currently unavailable. Please try again later or contact support.";
      }
      
      setMessages((prevMessages) => [...prevMessages, { type: 'bot', text: errorMessage }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isTyping) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  // --- Action Handlers for Gemini-like bottom bar ---

  const handleLike = () => {
    setSnackbarMessage("Thanks for your feedback!");
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
    // TODO: Implement actual like logic (e.g., send feedback to backend)
  };

  const handleDislike = () => {
    setSnackbarMessage("Feedback received. We'll improve!");
    setSnackbarSeverity('info');
    setSnackbarOpen(true);
    // TODO: Implement actual dislike logic (e.g., send feedback to backend)
  };

  const handleRegenerateLastResponse = async () => {
    stopSpeaking(); // Stop any ongoing speech
    const lastUserMessage = messages.slice().reverse().find(msg => msg.type === 'user');

    if (lastUserMessage) {
        setSnackbarMessage("Regenerating response...");
        setSnackbarSeverity('info');
        setSnackbarOpen(true);
        // Remove the last bot message before sending the request again
        setMessages(prev => prev.filter(msg => !(msg.type === 'bot' && prev.indexOf(msg) === prev.length -1)));
        setInputMessage(lastUserMessage.text); // Pre-fill input with last user message
        await handleSendMessage(); // Re-send the last user message to get a new bot response
    } else {
        setSnackbarMessage("No previous user message to regenerate from.");
        setSnackbarSeverity('warning');
        setSnackbarOpen(true);
    }
  };

  const handleCopyLastResponse = () => {
    const lastBotMessage = messages.slice().reverse().find(msg => msg.type === 'bot');
    if (lastBotMessage && navigator.clipboard) {
      navigator.clipboard.writeText(lastBotMessage.text)
        .then(() => {
          setSnackbarMessage("Response copied to clipboard!");
          setSnackbarSeverity('success');
          setSnackbarOpen(true);
        })
        .catch(err => {
          console.error('Failed to copy: ', err);
          setSnackbarMessage("Failed to copy response.");
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
        });
    } else {
      setSnackbarMessage("No bot response to copy.");
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
    }
  };

  const handleSpeakLastResponse = () => {
    const lastBotMessage = messages.slice().reverse().find(msg => msg.type === 'bot');
    if (lastBotMessage) {
      speak(lastBotMessage.text); // Call speak without index, as no individual icons
    } else {
      setSnackbarMessage("No bot response to speak.");
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
    }
  };

  const handleStopSpeakingFromActionBar = () => {
    stopSpeaking();
  };

  // Determine if the action bar should be visible
  const lastMessage = messages[messages.length - 1];
  const showActionBar = !isTyping && lastMessage && lastMessage.type === 'bot';

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 1000,
      }}
    >
      {!isOpen && (
        <IconButton
          color="primary"
          sx={{
            backgroundColor: '#780000',
            color: 'white',
            '&:hover': { backgroundColor: '#5a0000' },
            width: 64,
            height: 64,
            borderRadius: '50%',
            boxShadow: '0px 4px 10px rgba(0,0,0,0.25)',
          }}
          onClick={() => setIsOpen(true)}
          aria-label="Open AI Chat"
        >
          <ChatIcon fontSize="large" />
        </IconButton>
      )}

      {isOpen && (
        <Paper
          elevation={5}
          sx={{
            width: { xs: '90vw', sm: 380 },
            height: { xs: '70vh', sm: 500 },
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: '0px 8px 20px rgba(0,0,0,0.3)',
            backgroundColor: '#fefae0',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#780000',
              color: 'white',
              p: 2,
              borderTopLeftRadius: 3,
              borderTopRightRadius: 3,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>MindWell AI Chat</Typography>
            <IconButton 
              onClick={() => setIsOpen(false)} 
              sx={{ color: 'white' }}
              aria-label="Close chat"
            >
              <CloseIcon />
            </IconButton>
          </Box>

          <Box
            ref={chatMessagesRef}
            sx={{
              flexGrow: 1,
              overflowY: 'auto',
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
              backgroundColor: '#fefae0',
            }}
          >
            {messages.map((msg, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start',
                  alignItems: 'center', // Keep center alignment for consistent spacing
                  gap: 1,
                  // If it's a bot message and the last one, add some bottom margin
                  // to provide space for the action bar, if the bar is shown.
                  mb: (msg.type === 'bot' && index === messages.length - 1 && showActionBar) ? 0.5 : 0,
                }}
              >
                {/* REMOVED: Individual message replay button */}
                {/* {msg.type === 'bot' && (
                  <IconButton
                    size="small"
                    onClick={() => speak(msg.text, index)}
                    sx={{ color: speakingMessageIndex === index && isSpeaking ? '#a4161a' : '#780000' }}
                    aria-label="Replay message"
                  >
                    <VolumeUpIcon fontSize="small" />
                  </IconButton>
                )} */}
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    maxWidth: '80%',
                    backgroundColor: msg.type === 'user' ? '#DCC8C8' : '#FFFFFF',
                    color: msg.type === 'user' ? '#333' : '#333',
                    borderColor: msg.type === 'user' ? '#780000' : '#E0E0E0',
                    borderWidth: '1px',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  <Typography variant="body2">{msg.text}</Typography>
                </Paper>
              </Box>
            ))}
            {isTyping && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                <CircularProgress size={20} sx={{ color: '#780000' }} />
                <Typography variant="body2" sx={{ ml: 1, color: '#780000' }}>Thinking...</Typography>
              </Box>
            )}
          </Box>

          {/* Conditional Action bar at the bottom of the chat display */}
          {showActionBar && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                gap: 1,
                p: 0.5, // Reduced padding
                borderTop: '1px solid #e0e0e0',
                backgroundColor: '#fdf8f5',
                // Added top margin to separate it visually from the last message
                mt: 1,
              }}
            >
              <IconButton size="small" onClick={handleLike} aria-label="Like response" sx={{ color: '#5a0000', '&:hover': { backgroundColor: 'rgba(120, 0, 0, 0.08)' } }}>
                <ThumbUpOutlinedIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={handleDislike} aria-label="Dislike response" sx={{ color: '#5a0000', '&:hover': { backgroundColor: 'rgba(120, 0, 0, 0.08)' } }}>
                <ThumbDownOutlinedIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={handleRegenerateLastResponse} aria-label="Regenerate response" sx={{ color: '#5a0000', '&:hover': { backgroundColor: 'rgba(120, 0, 0, 0.08)' } }} disabled={isTyping}>
                <RefreshOutlinedIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={handleCopyLastResponse} aria-label="Copy response" sx={{ color: '#5a0000', '&:hover': { backgroundColor: 'rgba(120, 0, 0, 0.08)' } }}>
                <ContentCopyOutlinedIcon fontSize="small" />
              </IconButton>
              {isSpeaking ? (
                <IconButton size="small" onClick={handleStopSpeakingFromActionBar} aria-label="Stop speaking" sx={{ color: '#a4161a', '&:hover': { backgroundColor: 'rgba(164, 22, 26, 0.08)' } }}>
                  <StopOutlinedIcon fontSize="small" />
                </IconButton>
              ) : (
                <IconButton size="small" onClick={handleSpeakLastResponse} aria-label="Speak response" sx={{ color: '#5a0000', '&:hover': { backgroundColor: 'rgba(120, 0, 0, 0.08)' } }}>
                  <VolumeUpIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          )}

          {/* Input and Buttons at the very bottom */}
          <Box sx={{ 
              display: 'flex', 
              p: 1.5, 
              borderTop: showActionBar ? 'none' : '1px solid #ccc', // Remove border top if action bar is visible
              backgroundColor: '#fefae0', 
              alignItems: 'flex-end',
              // Add top margin if action bar is NOT visible, to maintain consistent spacing
              mt: showActionBar ? 0 : 1, 
            }}
          >
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Type your message or speak..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              multiline
              maxRows={3}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: 'white',
                  '& fieldset': { borderColor: '#780000 !important' },
                },
                '& .MuiInputBase-input': {
                    color: '#333',
                },
                pr: 0.5,
              }}
              size="small"
              disabled={isTyping}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end" sx={{ mt: 'auto', mb: 'auto' }}>
                    {recognitionRef.current && (
                      <IconButton
                        color="primary"
                        onClick={handleListen}
                        sx={{
                          backgroundColor: 'transparent',
                          color: isListening ? '#a4161a' : '#780000',
                          '&:hover': { backgroundColor: 'rgba(120, 0, 0, 0.08)' },
                          '&:disabled': { color: '#ccc' },
                          p: 0.5,
                        }}
                        disabled={isTyping}
                        aria-label={isListening ? "Stop listening" : "Start listening"}
                      >
                        {isListening ? <StopIcon /> : <MicIcon />}
                      </IconButton>
                    )}
                    <IconButton
                      color="primary"
                      onClick={handleSendMessage}
                      sx={{
                        backgroundColor: 'transparent',
                        color: '#780000',
                        '&:hover': { backgroundColor: 'rgba(120, 0, 0, 0.08)' },
                        '&:disabled': { color: '#ccc' },
                        p: 0.5,
                      }}
                      disabled={isTyping || inputMessage.trim() === ''}
                      aria-label="Send message"
                    >
                      <SendIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* Helper text at the very bottom */}
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', mb: 1.5, mx: 2 }}>
            MindWell AI can make mistakes, so double-check it.
          </Typography>
        </Paper>
      )}

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}