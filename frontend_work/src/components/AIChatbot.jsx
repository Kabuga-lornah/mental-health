import React, { useState, useRef, useEffect } from 'react';
import { Box, Button, TextField, Typography, Paper, CircularProgress, IconButton } from '@mui/material';
import { Close as CloseIcon, Send as SendIcon, Chat as ChatIcon } from '@mui/icons-material';

import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = 'AIzaSyCzfeeSL53b5qVuGp2UyKyWQJ_rctM3Kjc';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
// Updated to use the current model name - Gemini 1.5 Flash is widely available and cost-effective
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatMessagesRef = useRef(null);

  const chatSessionRef = useRef(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        { type: 'bot', text: "Hi there! I'm MindWell's AI assistant. I can help answer questions about our platform, journaling, and general mental wellness topics. How can I assist you today?" }
      ]);
      
      // Initialize chat session - remove systemInstruction as it's causing issues with this API version
      chatSessionRef.current = model.startChat({
        history: [
          {
            role: "user",
            parts: [{ text: "You are MindWell's AI assistant, a helpful and empathetic chatbot focused on mental wellness, journaling, and supporting users with their mental health journey. Always be supportive, never provide medical diagnosis or treatment, and remind users to seek professional help when appropriate. Please acknowledge this role." }]
          },
          {
            role: "model", 
            parts: [{ text: "I understand. I'm MindWell's AI assistant, here to provide supportive guidance on mental wellness and journaling. I'll be empathetic and helpful while reminding users that I'm not a substitute for professional medical advice. How can I help you today?" }]
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
    }
  }, [isOpen]);

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (inputMessage.trim() === '') return;

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
          !finalBotResponse.toLowerCase().includes("wellness")) {
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
      } else if (error.status === 400) {
        errorMessage = "Invalid request. Please try rephrasing your message.";
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
                }}
              >
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

          <Box sx={{ display: 'flex', p: 1.5, borderTop: '1px solid #ccc', backgroundColor: '#fefae0' }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Type your message..."
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
    </Box>
  );
}