// frontend_work/src/components/AIChatbot.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box, Button, TextField, Typography, Paper, CircularProgress, IconButton,
  Snackbar, Alert // Removed RadioGroup, FormControlLabel, Radio, FormControl, FormLabel, Select, MenuItem
} from '@mui/material';
import { Close as CloseIcon, Send as SendIcon, Chat as ChatIcon, Mic as MicIcon, Stop as StopIcon, VolumeUp as VolumeUpIcon } from '@mui/icons-material';

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

  // State for Speech-to-Text (STT)
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null); // Ref for SpeechRecognition instance

  // State for Text-to-Speech (TTS)
  // Removed selectedVoiceGender as it's now hardcoded to female
  const [isSpeaking, setIsSpeaking] = useState(false); // To indicate if the bot is currently speaking

  // State for Snackbar (for error/info messages)
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');

  // Initialize Speech Synthesis Voices (simplified)
  useEffect(() => {
    // This useEffect is now simpler as we no longer need to track availableVoices state for UI selection
    // The voices will be fetched directly in the speak function.
  }, []);

  // Function to speak text
  const speak = useCallback((text) => {
    if (!window.speechSynthesis || !text) return;

    // Stop any ongoing speech before starting a new one
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    
    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Select a female voice by default
    const voices = window.speechSynthesis.getVoices();
    let voiceToUse = null;

    // Prioritize female English voices
    voiceToUse = voices.find(
      (voice) => voice.lang.startsWith('en') && (voice.name.toLowerCase().includes('female') || voice.name.toLowerCase().includes('woman'))
    );
    
    // Fallback to any English voice if a specific female voice isn't found
    if (!voiceToUse) {
        voiceToUse = voices.find(voice => voice.lang.startsWith('en'));
    }

    // Final fallback to default browser voice if no specific English voice is found
    if (!voiceToUse && voices.length > 0) {
        voiceToUse = voices[0];
    }
    
    if (voiceToUse) {
      utterance.voice = voiceToUse;
    } else {
        console.warn("No suitable female or English voice found. Using default.");
    }

    utterance.pitch = 1; // Default pitch
    utterance.rate = 1;  // Default rate (speed)

    utterance.onend = () => {
      setIsSpeaking(false);
    };
    utterance.onerror = (event) => {
        console.error('SpeechSynthesisUtterance.onerror', event);
        setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  }, []); // speak no longer depends on selectedVoiceGender

  // Function to stop current speech
  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false; 
      recognitionRef.current.interimResults = true; // IMPORTANT: Enable interim results for live typing
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
        
        // Update input message with interim results, or finalize with final results
        setInputMessage(finalTranscript || interimTranscript);

        if (finalTranscript) {
          setIsListening(false);
          // If you want to auto-send the message once spoken, uncomment below:
          // handleSendMessage(); 
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
  }, []); // Run once on component mount

  // Toggle listening for speech input
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
      stopSpeaking(); // Stop bot speaking when user starts talking
      setInputMessage(''); // Clear previous input
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
      speak(initialBotMessage); // Speak the initial message
      
      // Initialize chat session with more detailed system instruction
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
      stopSpeaking(); // Stop speaking when chat closes
    }
  }, [isOpen, speak, messages.length, stopSpeaking]);

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (inputMessage.trim() === '') return;

    stopSpeaking(); // Stop any ongoing speech when user sends a message

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
      
      // Add disclaimer for responses that don't seem to be about the platform or wellness
      if (!finalBotResponse.toLowerCase().includes("mindwell") &&
          !finalBotResponse.toLowerCase().includes("journaling") &&
          !finalBotResponse.toLowerCase().includes("platform") &&
          !finalBotResponse.toLowerCase().includes("mental") &&
          !finalBotResponse.toLowerCase().includes("wellness") &&
          !finalBotResponse.toLowerCase().includes("therapist") &&
          !finalBotResponse.toLowerCase().includes("session") &&
          !finalBotResponse.toLowerCase().includes("meditation") &&
          !finalBotResponse.toLowerCase().includes("resource")) { // Added more keywords
        finalBotResponse += "\n\n*Please remember I am an AI assistant and not a substitute for professional medical advice or therapy. If you are in crisis, please seek immediate professional help.*";
      }

      setMessages((prevMessages) => [...prevMessages, { type: 'bot', text: finalBotResponse }]);
      speak(finalBotResponse); // Speak the AI's response
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
      speak(errorMessage); // Speak the error message
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

          {/* Voice Selection UI removed */}

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
                  alignItems: 'center', // Align items for icon next to message
                  gap: 1, // Space between message and icon
                }}
              >
                {/* Speaker Icon for Bot Messages */}
                {msg.type === 'bot' && (
                  <IconButton
                    size="small"
                    onClick={() => speak(msg.text)}
                    sx={{ color: '#780000' }}
                    aria-label="Replay message"
                  >
                    <VolumeUpIcon fontSize="small" />
                  </IconButton>
                )}
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
            {isSpeaking && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                {/* <VolumeUpIcon sx={{ color: '#780000', fontSize: '1.2rem', mr: 0.5 }} /> */}
                <Typography variant="body2" sx={{ color: '#780000', fontStyle: 'italic' }}>Speaking...</Typography>
                {/* Stop Speaking Button */}
                <Button
                  variant="text"
                  size="small"
                  onClick={stopSpeaking}
                  sx={{ color: '#a4161a', ml: 1, textTransform: 'none' }}
                >
                  Stop
                </Button>
              </Box>
            )}
          </Box>

          <Box sx={{ display: 'flex', p: 1.5, borderTop: '1px solid #ccc', backgroundColor: '#fefae0' }}>
            {recognitionRef.current && ( // Only show mic button if STT is supported
              <IconButton
                color="primary"
                onClick={handleListen}
                sx={{
                  backgroundColor: isListening ? '#a4161a' : '#780000',
                  color: 'white',
                  '&:hover': { backgroundColor: isListening ? '#780000' : '#5a0000' },
                  '&:disabled': { backgroundColor: '#ccc' },
                  borderRadius: 2,
                  minWidth: '40px',
                  p: '8px',
                  alignSelf: 'flex-end',
                  mr: 1,
                }}
                disabled={isTyping}
                aria-label={isListening ? "Stop listening" : "Start listening"}
              >
                {isListening ? <StopIcon /> : <MicIcon />}
              </IconButton>
            )}
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
                mr: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: 'white',
                  '& fieldset': { borderColor: '#780000 !important' },
                },
                '& .MuiInputBase-input': {
                    color: '#333',
                }
              }}
              size="small"
              disabled={isTyping}
            />
            <Button
              variant="contained"
              sx={{
                backgroundColor: '#780000',
                '&:hover': { backgroundColor: '#5a0000' },
                '&:disabled': { backgroundColor: '#ccc' },
                borderRadius: 2,
                minWidth: '40px',
                p: '8px',
                alignSelf: 'flex-end',
              }}
              onClick={handleSendMessage}
              disabled={isTyping || inputMessage.trim() === ''}
              aria-label="Send message"
            >
              <SendIcon />
            </Button>
          </Box>
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