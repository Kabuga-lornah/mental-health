import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx'; 
import { Box, Paper, IconButton, TextField, Typography, List, ListItem, ListItemText, CircularProgress, AppBar, Toolbar, Avatar } from '@mui/material';
import { Send as SendIcon, Close as CloseIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { styled } from '@mui/system';
import axios from 'axios';

// --- THEME COLORS ---
const theme = {
  primary: '#780000',
  secondary: '#5a0000',
  accent: '#780000',
  background: '#fefae0',
  mental: '#ffffff',
  calm: '#faf9f6ff',
  white: '#f5f1caff'
};

// Main chat window container with improved shadow and border
const ChatWindow = styled(Paper)({
  width: '100%',
  height: '85vh',
  maxHeight: '900px',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: '16px',
  boxShadow: '0px 10px 40px rgba(120, 0, 0, 0.15)',
  overflow: 'hidden',
  maxWidth: '1000px',
  margin: '20px auto',
  backgroundColor: theme.background,
  border: `1px solid ${theme.calm}`,
  transition: 'box-shadow 0.3s ease',
  '&:hover': {
    boxShadow: '0px 12px 45px rgba(120, 0, 0, 0.2)',
  }
});

// List area for messages with custom scrollbar
const MessageList = styled(List)({
  flexGrow: 1,
  overflowY: 'auto',
  padding: '24px',
  backgroundColor: theme.white,
  backgroundImage: `linear-gradient(${theme.white} 0%, ${theme.background} 100%)`,
  '&::-webkit-scrollbar': {
    width: '8px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: theme.calm,
    borderRadius: '10px',
    transition: 'background 0.3s ease',
  },
  '&::-webkit-scrollbar-thumb:hover': {
    background: theme.primary,
  },
});

// Bottom input area with improved styling
const MessageInputArea = styled(Box)({
  padding: '20px 24px',
  backgroundColor: theme.background,
  borderTop: `2px solid ${theme.calm}`,
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.05)',
});

// User's message bubble with animation
const UserMessage = styled(ListItemText)({
  flex: 'none',
  animation: 'slideInRight 0.3s ease-out',
  '@keyframes slideInRight': {
    from: {
      opacity: 0,
      transform: 'translateX(20px)',
    },
    to: {
      opacity: 1,
      transform: 'translateX(0)',
    },
  },
  '& .MuiTypography-root': {
    backgroundColor: theme.primary,
    color: theme.white,
    borderRadius: '18px 18px 4px 18px',
    padding: '12px 18px',
    display: 'inline-block',
    maxWidth: '75%',
    textAlign: 'left',
    boxShadow: '0 3px 8px rgba(120, 0, 0, 0.25)',
    fontSize: '0.95rem',
    lineHeight: '1.5',
    wordWrap: 'break-word',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(120, 0, 0, 0.3)',
    }
  },
  '& .MuiListItemText-secondary': {
    textAlign: 'right',
    fontSize: '0.7rem',
    marginTop: '6px',
    color: '#999',
    fontWeight: 500,
  }
});

// Other person's message bubble with animation
const OtherMessage = styled(ListItemText)({
  flex: 'none',
  animation: 'slideInLeft 0.3s ease-out',
  '@keyframes slideInLeft': {
    from: {
      opacity: 0,
      transform: 'translateX(-20px)',
    },
    to: {
      opacity: 1,
      transform: 'translateX(0)',
    },
  },
  '& .MuiTypography-root': {
    backgroundColor: theme.mental,
    color: theme.primary,
    borderRadius: '18px 18px 18px 4px',
    padding: '12px 18px',
    display: 'inline-block',
    maxWidth: '75%',
    textAlign: 'left',
    boxShadow: '0 3px 8px rgba(0, 0, 0, 0.1)',
    border: `1px solid ${theme.calm}`,
    fontSize: '0.95rem',
    lineHeight: '1.5',
    wordWrap: 'break-word',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    }
  },
  '& .MuiListItemText-secondary': {
    textAlign: 'left',
    fontSize: '0.7rem',
    marginTop: '6px',
    color: '#999',
    fontWeight: 500,
  }
});

// Styled send button with pulse animation
const SendButton = styled(IconButton)({
  backgroundColor: theme.primary,
  color: 'white',
  padding: '12px',
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: theme.secondary,
    transform: 'scale(1.05)',
    boxShadow: '0 4px 12px rgba(120, 0, 0, 0.3)',
  },
  '&:active': {
    transform: 'scale(0.95)',
  },
  '&.Mui-disabled': {
    backgroundColor: theme.calm,
    color: '#ccc',
  }
});

export default function ChatInterface() {
  const { roomName } = useParams();
  const { user, token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatTimestamp = (isoString) => {
    if (!isoString) return '';
    try {
      return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      console.error("Error formatting date:", e);
      return '';
    }
  };

  useEffect(() => {
    if (!user || !token) return;

    const fetchMessages = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/api/chat/messages/${roomName}/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessages(response.data.map(msg => ({
          text: msg.message_content,
          sender: msg.sender === user.id ? 'user' : 'other',
          timestamp: msg.timestamp
        })));
      } catch (error) {
        console.error("Error fetching historical messages:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();

    const ws = new WebSocket(`ws://localhost:8000/ws/chat/${roomName}/?token=${encodeURIComponent(token)}`);

    ws.onopen = () => {
      console.log("WebSocket connected!");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Received message:", data);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          text: data.message,
          sender: data.sender_id === user.id ? 'user' : 'other',
          timestamp: data.timestamp
        },
      ]);
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected.");
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [roomName, user, token]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = () => {
    if (inputMessage.trim() === '' || !socket) return;

    const messagePayload = {
      message: inputMessage,
      sender_id: user.id,
    };
    socket.send(JSON.stringify(messagePayload));
    setInputMessage('');
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', flexDirection: 'column' }}>
        <CircularProgress sx={{ color: theme.primary, mb: 2 }} size={50} />
        <Typography sx={{ color: theme.primary, fontWeight: 500 }}>Loading chat...</Typography>
      </Box>
    );
  }

  return (
    <ChatWindow>
      <AppBar position="static" sx={{ 
        backgroundColor: theme.primary,
        boxShadow: '0 2px 8px rgba(120, 0, 0, 0.2)'
      }}>
        <Toolbar>
          <IconButton 
            edge="start" 
            color="inherit" 
            aria-label="back" 
            onClick={() => window.history.back()}
            sx={{ 
              transition: 'transform 0.2s ease',
              '&:hover': { transform: 'scale(1.1)' }
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ 
            flexGrow: 1, 
            ml: 2,
            fontWeight: 600,
            letterSpacing: '0.5px'
          }}>
            {roomName}
          </Typography>
          <Box sx={{ 
            width: 10, 
            height: 10, 
            borderRadius: '50%', 
            backgroundColor: '#4caf50',
            boxShadow: '0 0 8px #4caf50',
            animation: 'pulse 2s infinite',
            '@keyframes pulse': {
              '0%, 100%': { opacity: 1 },
              '50%': { opacity: 0.5 }
            }
          }} />
        </Toolbar>
      </AppBar>
      <MessageList>
        {messages.map((msg, index) => (
          <ListItem 
            key={index} 
            sx={{ 
              justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start', 
              paddingY: '8px',
              display: 'flex',
              alignItems: 'flex-end'
            }}
          >
            {msg.sender === 'user' ? (
              <UserMessage
                primary={msg.text}
                secondary={formatTimestamp(msg.timestamp)}
              />
            ) : (
              <OtherMessage
                primary={msg.text}
                secondary={formatTimestamp(msg.timestamp)}
              />
            )}
          </ListItem>
        ))}
        <div ref={messagesEndRef} />
      </MessageList>
      <MessageInputArea>
        <TextField
          fullWidth
          variant="outlined"
          size="medium"
          placeholder="Type your message..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          multiline
          maxRows={3}
          sx={{ 
            backgroundColor: theme.white,
            '& .MuiOutlinedInput-root': {
              borderRadius: '24px',
              fontSize: '0.95rem',
              transition: 'all 0.3s ease',
              '& fieldset': {
                borderColor: theme.calm,
                borderWidth: '2px',
              },
              '&:hover fieldset': {
                borderColor: theme.secondary,
              },
              '&.Mui-focused fieldset': {
                borderColor: theme.accent,
                borderWidth: '2px',
              },
            },
          }}
        />
        <SendButton
          onClick={handleSendMessage}
          disabled={inputMessage.trim() === '' || !socket}
        >
          <SendIcon />
        </SendButton>
      </MessageInputArea>
    </ChatWindow>
  );
}