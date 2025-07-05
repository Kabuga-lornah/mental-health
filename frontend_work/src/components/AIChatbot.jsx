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
  StopOutlined as StopOutlinedIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon
} from '@mui/icons-material';

import axios from 'axios'; // Still import axios if other parts of the app use it, though AI calls are direct now.
import { GoogleGenerativeAI } from '@google/generative-ai'; // Direct Gemini import

// Define theme colors (consistent with other components)
const themePrimaryColor = '#780000'; // Dark red/maroon
const themeLightBackground = '#fefae0'; // Slightly warmer light cream/yellowish white
const themeButtonHoverColor = '#5a0000'; // Darker red/maroon for hover
const themeCardBackground = 'white'; // White for cards
const themeAccentColor = '#DCC8C8'; // A subtle accent for chips
const themeUserMessageColor = '#DCC8C8'; // Lighter red/pinkish color for user messages
const themeBotMessageColor = '#E0F2F7'; // A light blue for bot messages
const themeTextColor = '#333'; // Standard dark text color

// DIRECT GEMINI API KEY AND SETUP (As per your request for dummy project)
// WARNING: Exposing API keys in frontend code is NOT recommended for production.
const GEMINI_API_KEY = 'AIzaSyCzfeeSL53b5qVuGp2UyKyWQJ_rctM3Kjc'; // Replace with your actual key if different
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });


export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatMessagesRef = useRef(null);

  const chatSessionRef = useRef(null); // Reference to the Gemini chat session

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageIndex, setSpeakingMessageIndex] = useState(null);

  // State to track likes/dislikes for each message
  const [messageReactions, setMessageReactions] = useState({});

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');

  const speak = useCallback((text, messageIndex) => {
    if (!window.speechSynthesis || !text) return;

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    
    setIsSpeaking(true);
    setSpeakingMessageIndex(messageIndex);
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
      setSpeakingMessageIndex(null);
    };
    utterance.onerror = (event) => {
        console.error('SpeechSynthesisUtterance.onerror', event);
        setIsSpeaking(false);
        setSpeakingMessageIndex(null);
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setSpeakingMessageIndex(null);
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
      const initialBotMessage = "Hi there! I'm MindWell's AI assistant. I can help with questions about our platform, mental health, journaling, and meditation. How can I assist you today?";
      setMessages([
        { type: 'bot', text: initialBotMessage }
      ]);
      
      // Initialize Gemini chat session with the strict system prompt
      chatSessionRef.current = model.startChat({
        history: [
          {
            role: "user", // The system instruction is given as the first user turn in history
            parts: [{ text: `
                You are MindWell's AI assistant. Your **ABSOLUTE AND ONLY PURPOSE** is to provide information **STRICTLY LIMITED** to:
                1.  **The MindWell platform:** Its features (Smart Digital Journaling, Professional Therapist Connections, AI-Powered Support, Self-Care & Meditation Library, Engaging Challenges & Rewards), how to use them, and general information about the platform's mission and services.
                2.  **General mental wellness topics:** Concepts, benefits, and practices related to journaling and meditation for self-care, as well as general mental health understanding (e.g., understanding stress, basic emotional regulation).

                **CRITICAL AND UNCONDITIONAL RULES - ADHERE TO THESE ABSOLUTELY, WITHOUT EXCEPTION:**
                * **NO EXTERNAL KNOWLEDGE OR SEARCHES:** You **MUST NOT** access, retrieve, or provide ANY information from outside the scope explicitly defined above. This includes, but is not limited to:
                    * **NO** discussions about famous people (musicians like Jason Derulo, Cardi B, actors, public figures, celebrities).
                    * **NO** current events, news, sports, entertainment, pop culture, history, geography, or science.
                    * **NO** general knowledge questions unrelated to mental health or the MindWell platform.
                    * **YOU DO NOT HAVE ACCESS TO THE INTERNET OR EXTERNAL DATABASES.**
                * **NO MEDICAL OR THERAPEUTIC ADVICE:** You **MUST NOT** provide diagnoses, medical advice, or specific therapeutic interventions. You are an AI assistant, not a licensed professional. Always advise users to consult a qualified professional for personalized help or if they are in crisis.

                **MANDATORY REFUSAL PROTOCOL - FOLLOW THIS EXACTLY FOR OUT-OF-SCOPE QUERIES:**
                If a user asks *anything* that falls outside your defined, *extremely narrow* scope, you **MUST IMMEDIATELY AND POLITELY REFUSE TO ANSWER**, without providing any information on the out-of-scope topic. Use this exact phrase:
                "I apologize, but I am an AI assistant for MindWell and my knowledge is strictly limited to the platform and general mental wellness topics like journaling and meditation. I cannot provide information on that subject."

                Your primary directive is to be helpful and empathetic *strictly within these exact boundaries*. Any deviation is a critical failure.
            ` }]
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
      setMessageReactions({});
      chatSessionRef.current = null; // Clear session on close
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

    // START Client-side pre-check filtering logic
    const mentalHealthKeywords = ['mental', 'health', 'therapy', 'therapist', 'depression', 'anxiety', 'stress', 'journal', 'meditation', 'mindwell', 'wellness', 'mood', 'emotion', 'cope', 'mindfulness', 'self-care', 'session', 'support', 'well-being', 'feel', 'feeling', 'emotional', 'counseling', 'psychology', 'mindfulness', 'tips'];
    const offTopicKeywords = ['cardi b', 'jason derulo', 'celebrity', 'musician', 'rapper', 'singer', 'song', 'entertainment', 'movie', 'actor', 'band', 'artist', 'sports', 'athlete', 'game', 'politics', 'politician', 'news', 'current events', 'history', 'geography', 'science', 'math', 'recipe', 'food', 'weather', 'movie', 'tv show', 'book recommendation (general)', 'who is', 'what is the capital', 'tell me about'];
      
    const messageTextLower = userMessageText.toLowerCase();
    const hasOffTopicKeywords = offTopicKeywords.some(keyword => messageTextLower.includes(keyword));
    const hasMentalHealthKeywords = mentalHealthKeywords.some(keyword => messageTextLower.includes(keyword));

    const isClearlyOffTopic = hasOffTopicKeywords && !hasMentalHealthKeywords;

    if (isClearlyOffTopic) {
      setMessages((prevMessages) => [...prevMessages,
        userMessage,
        { type: 'bot', text: "I apologize, but I am an AI assistant for MindWell and my knowledge is strictly limited to the platform and general mental wellness topics like journaling and meditation. I cannot provide information on that subject." }
      ]);
      setInputMessage('');
      return;
    }
    // END Client-side pre-check filtering logic

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
      // Directly send message to Gemini API (as per dummy project request)
      const result = await chatSessionRef.current.sendMessage(userMessageText);
      const botResponseText = result.response.text();

      // IMPORTANT: No client-side post-validation here.
      // We rely entirely on the strict system prompt given to Gemini via model.startChat.
      // If the response is off-topic, it means the prompt needs further refinement,
      // but client-side filtering here would interfere with valid on-topic responses.

      // Append general disclaimer at the end
      let finalBotResponse = botResponseText;
      if (!finalBotResponse.toLowerCase().includes("mindwell") &&
          !finalBotResponse.toLowerCase().includes("journaling") &&
          !finalBotResponse.toLowerCase().includes("platform") &&
          !finalBotResponse.toLowerCase().includes("mental") &&
          !finalBotResponse.toLowerCase().includes("wellness") &&
          !finalBotResponse.toLowerCase().includes("therapist") &&
          !finalBotResponse.toLowerCase().includes("session") &&
          !finalBotResponse.toLowerCase().includes("meditation") &&
          !finalBotResponse.toLowerCase().includes("resource") &&
          // Also check for refusal phrases to avoid adding disclaimer to refusals
          !finalBotResponse.toLowerCase().includes("i apologize") &&
          !finalBotResponse.toLowerCase().includes("cannot provide information") &&
          !finalBotResponse.toLowerCase().includes("strictly limited")) {
        finalBotResponse += "\n\n*Please remember I am an AI assistant and not a substitute for professional medical advice or therapy. If you are in crisis, please seek immediate professional help.*";
      }


      setMessages((prevMessages) => [...prevMessages, { type: 'bot', text: finalBotResponse }]);
    } catch (error) {
      console.error("Error communicating with AI:", error);
      
      let errorMessage = "I'm having trouble connecting right now. Please try again later.";
      
      // Better error handling for direct API calls
      if (error.response && error.response.status === 429) {
        errorMessage = "I'm receiving too many requests. Please wait a moment and try again.";
      } else if (error.message && error.message.includes('504 Deadline Exceeded')) {
        errorMessage = "The AI is taking too long to respond. Please try again or rephrase your question.";
      } else if (error.message && error.message.includes('500') || (error.response && (error.response.status === 500 || error.response.status === 503))) {
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

  // --- Action Handlers for individual message actions ---

  const handleLike = (messageIndex) => {
    setMessageReactions(prev => ({
      ...prev,
      [messageIndex]: {
        ...prev[messageIndex],
        liked: !prev[messageIndex]?.liked,
        disliked: false // Reset dislike if liked
      }
    }));
    setSnackbarMessage("Thanks for your feedback!");
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
  };

  const handleDislike = (messageIndex) => {
    setMessageReactions(prev => ({
      ...prev,
      [messageIndex]: {
        ...prev[messageIndex],
        disliked: !prev[messageIndex]?.disliked,
        liked: false // Reset like if disliked
      }
    }));
    setSnackbarMessage("Feedback received. We'll improve!");
    setSnackbarSeverity('info');
    setSnackbarOpen(true);
  };

  const handleRegenerateResponse = async (messageIndex) => {
    stopSpeaking();
    
    // Find the user message that corresponds to this bot response
    let userMessageIndex = -1;
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (messages[i].type === 'user') {
        userMessageIndex = i;
        break;
      }
    }

    if (userMessageIndex !== -1) {
      const userMessage = messages[userMessageIndex];
      setSnackbarMessage("Regenerating response...");
      setSnackbarSeverity('info');
      setSnackbarOpen(true);
      
      setIsTyping(true);
      
      try {
        const result = await chatSessionRef.current.sendMessage(userMessage.text);
        const botResponseText = result.response.text();

        // IMPORTANT: No client-side post-validation here.
        // We rely entirely on the strict system prompt given to Gemini via model.startChat.
        let finalBotResponse = botResponseText;
        if (!finalBotResponse.toLowerCase().includes("mindwell") &&
            !finalBotResponse.toLowerCase().includes("journaling") &&
            !finalBotResponse.toLowerCase().includes("platform") &&
            !finalBotResponse.toLowerCase().includes("mental") &&
            !finalBotResponse.toLowerCase().includes("wellness") &&
            !finalBotResponse.toLowerCase().includes("therapist") &&
            !finalBotResponse.toLowerCase().includes("session") &&
            !finalBotResponse.toLowerCase().includes("meditation") &&
            !finalBotResponse.toLowerCase().includes("resource") &&
            // Also check for refusal phrases to avoid adding disclaimer to refusals
            !finalBotResponse.toLowerCase().includes("i apologize") &&
            !finalBotResponse.toLowerCase().includes("cannot provide information") &&
            !finalBotResponse.toLowerCase().includes("strictly limited")) {
          finalBotResponse += "\n\n*Please remember I am an AI assistant and not a substitute for professional medical advice or therapy. If you are in crisis, please seek immediate professional help.*";
        }

        // Replace the bot message at the specific index
        setMessages(prev => prev.map((msg, idx) => 
          idx === messageIndex ? { ...msg, text: finalBotResponse } : msg
        ));
        
        // Clear reactions for this message since it's regenerated
        setMessageReactions(prev => {
          const newReactions = { ...prev };
          delete newReactions[messageIndex];
          return newReactions;
        });
        
      } catch (error) {
        console.error("Error regenerating response:", error);
        setSnackbarMessage("Failed to regenerate response. Please try again.");
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      } finally {
        setIsTyping(false);
      }
    } else {
      setSnackbarMessage("No corresponding user message found.");
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
    }
  };

  const handleCopyResponse = (text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
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
      setSnackbarMessage("Clipboard not supported in this browser.");
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
    }
  };

  const handleSpeakResponse = (text, messageIndex) => {
    speak(text, messageIndex);
  };

  const handleStopSpeaking = () => {
    stopSpeaking();
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
            backgroundColor: themePrimaryColor,
            color: 'white',
            '&:hover': { backgroundColor: themeButtonHoverColor },
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
            backgroundColor: themeLightBackground,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: themePrimaryColor,
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
              backgroundColor: themeLightBackground,
            }}
          >
            {messages.map((msg, index) => (
              <Box key={index}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      maxWidth: '80%',
                      backgroundColor: msg.type === 'user' ? themeUserMessageColor : themeCardBackground,
                      color: themeTextColor,
                      borderColor: msg.type === 'user' ? themePrimaryColor : themeAccentColor,
                      borderWidth: '1px',
                      wordBreak: 'break-word',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    <Typography variant="body2">{msg.text}</Typography>
                  </Paper>
                </Box>
                
                {/* Action bar for bot messages */}
                {msg.type === 'bot' && (
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'flex-start',
                      gap: 0.5,
                      mt: 0.5,
                      ml: 1,
                    }}
                  >
                    <IconButton 
                      size="small" 
                      onClick={() => handleLike(index)} 
                      aria-label="Like response" 
                      sx={{ 
                        color: messageReactions[index]?.liked ? '#4caf50' : themePrimaryColor, 
                        '&:hover': { backgroundColor: 'rgba(120, 0, 0, 0.08)' },
                        p: 0.25
                      }}
                    >
                      {messageReactions[index]?.liked ? 
                        <ThumbUpIcon fontSize="small" /> : 
                        <ThumbUpOutlinedIcon fontSize="small" />
                      }
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleDislike(index)} 
                      aria-label="Dislike response" 
                      sx={{ 
                        color: messageReactions[index]?.disliked ? '#f44336' : themePrimaryColor, 
                        '&:hover': { backgroundColor: 'rgba(120, 0, 0, 0.08)' },
                        p: 0.25
                      }}
                    >
                      {messageReactions[index]?.disliked ? 
                        <ThumbDownIcon fontSize="small" /> : 
                        <ThumbDownOutlinedIcon fontSize="small" />
                      }
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleRegenerateResponse(index)} 
                      aria-label="Regenerate response" 
                      sx={{ 
                        color: themePrimaryColor, 
                        '&:hover': { backgroundColor: 'rgba(120, 0, 0, 0.08)' },
                        p: 0.25
                      }} 
                      disabled={isTyping}
                    >
                      <RefreshOutlinedIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleCopyResponse(msg.text)} 
                      aria-label="Copy response" 
                      sx={{ 
                        color: themePrimaryColor, 
                        '&:hover': { backgroundColor: 'rgba(120, 0, 0, 0.08)' },
                        p: 0.25
                      }}
                    >
                      <ContentCopyOutlinedIcon fontSize="small" />
                    </IconButton>
                    {isSpeaking && speakingMessageIndex === index ? (
                      <IconButton 
                        size="small" 
                        onClick={handleStopSpeaking} 
                        aria-label="Stop speaking" 
                        sx={{ 
                          color: '#a4161a', 
                          '&:hover': { backgroundColor: 'rgba(164, 22, 26, 0.08)' },
                          p: 0.25
                        }}
                      >
                        <StopOutlinedIcon fontSize="small" />
                      </IconButton>
                    ) : (
                      <IconButton 
                        size="small" 
                        onClick={() => handleSpeakResponse(msg.text, index)} 
                        aria-label="Speak response" 
                        sx={{ 
                          color: themePrimaryColor, 
                          '&:hover': { backgroundColor: 'rgba(120, 0, 0, 0.08)' },
                          p: 0.25
                        }}
                      >
                        <VolumeUpIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                )}
              </Box>
            ))}
            {isTyping && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                <CircularProgress size={20} sx={{ color: themePrimaryColor }} />
                <Typography variant="body2" sx={{ ml: 1, color: themePrimaryColor }}>Thinking...</Typography>
              </Box>
            )}
          </Box>

          {/* Input and Buttons at the very bottom */}
          <Box sx={{ 
              display: 'flex', 
              p: 1.5, 
              borderTop: '1px solid #ccc',
              backgroundColor: themeLightBackground, 
              alignItems: 'flex-end',
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
                  backgroundColor: themeCardBackground,
                  '& fieldset': { borderColor: `${themePrimaryColor} !important` },
                },
                '& .MuiInputBase-input': {
                    color: themeTextColor,
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
                          color: isListening ? '#a4161a' : themePrimaryColor,
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
                        color: themePrimaryColor,
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