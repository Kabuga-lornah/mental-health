//
// FILENAME: kabuga-lornah/mental-health/mental-health-5adb6da1f187483339d21664b8dc58ed73a5aa9b/frontend_work/src/components/ChatInterface.jsx
//
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, Paper, IconButton, TextField, Typography, List, ListItem, ListItemText, CircularProgress, AppBar, Toolbar } from '@mui/material';
import { Send as SendIcon, Close as CloseIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { styled } from '@mui/system';
import axios from 'axios'; // For fetching historical messages

// --- STYLE UPDATE ---
// Switched to a more flexible vh-based height with a max-height.
// Changed background to a cleaner, neutral color.
const ChatWindow = styled(Paper)({
  width: '100%',
  height: '80vh', // Use viewport height
  maxHeight: '800px', // But set a reasonable max
  display: 'flex',
  flexDirection: 'column',
  borderRadius: '12px', // Slightly larger radius
  boxShadow: '0px 5px 20px rgba(0, 0, 0, 0.1)', // Softer, more prominent shadow
  overflow: 'hidden',
  maxWidth: '900px',
  margin: '20px auto',
  backgroundColor: '#f9f9f9', // Cleaner background
});

// --- STYLE UPDATE ---
// Changed background to white so bubbles pop
const MessageList = styled(List)({
  flexGrow: 1,
  overflowY: 'auto',
  padding: '20px',
  backgroundColor: '#ffffff',
});

// --- STYLE UPDATE ---
// Added more padding and matched background to ChatWindow
const MessageInputArea = styled(Box)({
  padding: '15px 20px',
  backgroundColor: '#f9f9f9', // Match window chrome
  borderTop: '1px solid #eeeeee',
  display: 'flex',
  alignItems: 'center',
});

// --- STYLE UPDATE ---
// Using a primary color (blue) for the user's messages.
// Kept text-align left for readability, as the parent ListItem handles alignment.
// Added a subtle shadow and tweaked border-radius for a "bubble" feel.
const UserMessage = styled(ListItemText)({
  flex: 'none',
  '& .MuiTypography-root': {
    backgroundColor: '#1976d2', // MUI primary blue
    color: 'white',
    borderRadius: '15px',
    borderBottomRightRadius: '4px', // Bubble tail effect
    padding: '10px 15px',
    display: 'inline-block',
    maxWidth: '80%',
    textAlign: 'left', // Better for readability
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  // --- STYLE UPDATE ---
  // Style for the timestamp
  '& .MuiListItemText-secondary': {
    textAlign: 'right',
    fontSize: '0.75rem',
    marginTop: '4px',
    color: '#999',
  }
});

// --- STYLE UPDATE ---
// Using a neutral gray for other messages.
// Added shadow and tweaked border-radius.
const OtherMessage = styled(ListItemText)({
  flex: 'none',
  '& .MuiTypography-root': {
    backgroundColor: '#e0e0e0', // Neutral gray
    color: '#222',
    borderRadius: '15px',
    borderBottomLeftRadius: '4px', // Bubble tail effect
    padding: '10px 15px',
    display: 'inline-block',
    maxWidth: '80%',
    textAlign: 'left',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  // --- STYLE UPDATE ---
  // Style for the timestamp
  '& .MuiListItemText-secondary': {
    textAlign: 'left',
    fontSize: '0.75rem',
    marginTop: '4px',
    color: '#999',
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

  // --- STYLE UPDATE ---
  // Helper function to format timestamp
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

    // Fetch historical messages
    const fetchMessages = async () => {
        try {
            const response = await axios.get(`http://localhost:8000/api/chat/messages/${roomName}/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(response.data.map(msg => ({
                text: msg.message_content,
                sender: msg.sender === user.id ? 'user' : 'other', // Use user ID for sender
                timestamp: msg.timestamp
            })));
        } catch (error) {
            console.error("Error fetching historical messages:", error);
        } finally {
            setIsLoading(false);
        }
    };

    fetchMessages();

    // Establish WebSocket connection with the token as a query parameter
    // The token needs to be URL-encoded.
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
          // *** THIS IS THE FIX ***
          // Use sender_id and user.id to check for 'user' vs 'other'
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
  }, [messages, isLoading]); // Scroll when messages or loading state changes

  const handleSendMessage = () => {
    if (inputMessage.trim() === '' || !socket) return;

    const messagePayload = {
      message: inputMessage,
      sender_id: user.id, // Send sender ID for the backend
    };
    socket.send(JSON.stringify(messagePayload));
    setInputMessage('');
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading chat...</Typography>
      </Box>
    );
  }

  return (
    <ChatWindow>
      {/* --- STYLE UPDATE ---
          Changed AppBar color to match the user's message bubble for theme cohesion.
      */}
      <AppBar position="static" sx={{ backgroundColor: '#1976d2' }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" aria-label="back" onClick={() => window.history.back()}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, ml: 2 }}>
            Chat Room: {roomName}
          </Typography>
        </Toolbar>
      </AppBar>
      <MessageList>
        {messages.map((msg, index) => (
          <ListItem key={index} sx={{ justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start', paddingY: '4px' }}>
            {msg.sender === 'user' ? (
              // --- STYLE UPDATE ---
              // Added secondary prop to display the formatted timestamp
              <UserMessage
                primary={msg.text}
                secondary={formatTimestamp(msg.timestamp)}
              />
            ) : (
              // --- STYLE UPDATE ---
              // Added secondary prop to display the formatted timestamp
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
          size="small"
          placeholder="Type a message..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSendMessage();
            }
          }}
          sx={{ mr: 1, '& fieldset': { borderRadius: '20px' }, backgroundColor: 'white' }}
        />
        {/* --- STYLE UPDATE ---
            Changed send button color to match the new primary theme color.
        */}
        <IconButton
          color="primary"
          onClick={handleSendMessage}
          sx={{ backgroundColor: '#1976d2', color: 'white', '&:hover': { backgroundColor: '#115293' } }}
        >
          <SendIcon />
        </IconButton>
      </MessageInputArea>
    </ChatWindow>
  );
}