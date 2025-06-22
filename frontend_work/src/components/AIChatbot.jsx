import React, { useState, useRef, useEffect } from 'react';
import { Box, Button, TextField, Typography, Paper, CircularProgress, IconButton } from '@mui/material';
import { Close as CloseIcon, Send as SendIcon, Chat as ChatIcon } from '@mui/icons-material';

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatMessagesRef = useRef(null);

  // Initial welcome message from the bot
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        { type: 'bot', text: "Hi there! I'm MindWell's AI assistant. I can help answer questions about our platform, journaling, and general mental wellness topics. How can I assist you today?" }
      ]);
    }
  }, [isOpen, messages.length]);

  // Scroll to bottom of messages whenever messages change
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (inputMessage.trim() === '') return;

    const userMessage = { type: 'user', text: inputMessage.trim() };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      let chatHistory = messages.map(msg => ({ role: msg.type === 'user' ? 'user' : 'model', parts: [{ text: msg.text }] }));
      chatHistory.push({ role: "user", parts: [{ text: userMessage.text }] });

      const payload = {
        contents: chatHistory,
        generationConfig: {
          temperature: 0.7, 
          maxOutputTokens: 200,
        },
      };

      const apiKey = "AIzaSyA2YJJIC2WI_7JV3nPWBmBXmRXtGy8DxLE"; 
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      let botResponseText = "Sorry, I couldn't get a response. Please try again.";
      if (result.candidates && result.candidates.length > 0 &&
          result.candidates[0].content && result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0) {
        botResponseText = result.candidates[0].content.parts[0].text;
      } else {
        console.error("Unexpected API response structure:", result);
      }

      // Add a disclaimer to general mental health advice
      if (!botResponseText.toLowerCase().includes("mindwell") && !botResponseText.toLowerCase().includes("journaling") && !botResponseText.toLowerCase().includes("platform")) {
        botResponseText += "\n\n*Please remember I am an AI assistant and not a substitute for professional medical advice or therapy. If you are in crisis, please seek immediate professional help.*";
      }

      setMessages((prevMessages) => [...prevMessages, { type: 'bot', text: botResponseText }]);
    } catch (error) {
      console.error("Error communicating with AI:", error);
      setMessages((prevMessages) => [...prevMessages, { type: 'bot', text: "I'm having trouble connecting right now. Please try again later." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isTyping) {
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
            backgroundColor: '#fefae0', // Light background for chat window
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
            <IconButton onClick={() => setIsOpen(false)} sx={{ color: 'white' }}>
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
              backgroundColor: '#fefae0', // Ensure consistent background
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
                    backgroundColor: msg.type === 'user' ? '#DCC8C8' : '#FFFFFF', // User message color: slightly darker red, Bot message color: white
                    color: msg.type === 'user' ? '#333' : '#333',
                    borderColor: msg.type === 'user' ? '#780000' : '#E0E0E0',
                    borderWidth: '1px',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap', // Preserve line breaks for AI disclaimers
                  }}
                >
                  <Typography variant="body2">{msg.text}</Typography>
                </Paper>
              </Box>
            ))}
            {isTyping && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
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
              sx={{
                mr: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: 'white',
                  '& fieldset': { borderColor: '#780000 !important' }, // Ensure border color on focus
                },
                '& .MuiInputBase-input': {
                    color: '#333', // Text color in input
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
                borderRadius: 2,
                minWidth: '40px', // Adjust button size
                p: '8px', // Adjust padding for icon button
              }}
              onClick={handleSendMessage}
              disabled={isTyping}
            >
              <SendIcon />
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
}
