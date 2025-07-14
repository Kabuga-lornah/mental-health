import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, Paper, IconButton, TextField, Typography, List, ListItem, ListItemText, CircularProgress, AppBar, Toolbar } from '@mui/material';
import { Send as SendIcon, Close as CloseIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { styled } from '@mui/system';
import axios from 'axios'; // For fetching historical messages

const ChatWindow = styled(Paper)({
  width: '100%', // Maximize width within its container
  height: 'calc(100vh - 64px)', // Adjust based on your header/footer
  display: 'flex',
  flexDirection: 'column',
  borderRadius: '8px',
  boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.1)',
  overflow: 'hidden',
  maxWidth: '900px', // Example max width
  margin: '20px auto', // Center it
  backgroundColor: '#fefae0',
});

const MessageList = styled(List)({
  flexGrow: 1,
  overflowY: 'auto',
  padding: '15px',
  backgroundColor: '#fefae0',
});

const MessageInputArea = styled(Box)({
  padding: '10px',
  backgroundColor: 'white',
  borderTop: '1px solid #e0e0e0',
  display: 'flex',
  alignItems: 'center',
});

const UserMessage = styled(ListItemText)({
  '& .MuiTypography-root': {
    backgroundColor: '#DCC8C8',
    color: '#333',
    borderRadius: '10px',
    padding: '8px 12px',
    display: 'inline-block',
    maxWidth: '80%',
    textAlign: 'right',
  },
});

const OtherMessage = styled(ListItemText)({
  '& .MuiTypography-root': {
    backgroundColor: '#E0F2F7',
    color: '#333',
    borderRadius: '10px',
    padding: '8px 12px',
    display: 'inline-block',
    maxWidth: '80%',
    textAlign: 'left',
  },
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
          sender: data.sender_email === user.email ? 'user' : 'other', // Use email for sender
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
      <AppBar position="static" sx={{ backgroundColor: '#780000' }}>
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
              <UserMessage primary={msg.text} />
            ) : (
              <OtherMessage primary={msg.text} />
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
          sx={{ mr: 1, '& fieldset': { borderRadius: '20px' } }}
        />
        <IconButton
          color="primary"
          onClick={handleSendMessage}
          sx={{ backgroundColor: '#780000', color: 'white', '&:hover': { backgroundColor: '#5a0000' } }}
        >
          <SendIcon />
        </IconButton>
      </MessageInputArea>
    </ChatWindow>
  );
}