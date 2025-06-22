// frontend_work/src/components/SimpleChatbot.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  IconButton,
  TextField,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  Fab
} from '@mui/material';
import { Chat as ChatIcon, Close as CloseIcon, Send as SendIcon } from '@mui/icons-material';
import { styled } from '@mui/system';

// Styled components for the chatbot UI
const ChatbotContainer = styled(Box)({
  position: 'fixed',
  bottom: '20px',
  right: '20px',
  zIndex: 1000,
});

const ChatWindow = styled(Paper)({
  width: '320px',
  height: '400px',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: '15px',
  boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.2)',
  overflow: 'hidden',
});

const ChatHeader = styled(Box)({
  backgroundColor: '#780000',
  color: 'white',
  padding: '10px 15px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderTopLeftRadius: '15px',
  borderTopRightRadius: '15px',
});

const MessageList = styled(List)({
  flexGrow: 1,
  overflowY: 'auto',
  padding: '10px',
  backgroundColor: '#fefae0', // Light background for chat area
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
    backgroundColor: '#DCC8C8', // Your theme's lighter color
    color: '#333',
    borderRadius: '10px',
    padding: '8px 12px',
    display: 'inline-block',
    maxWidth: '80%',
    textAlign: 'right',
  },
});

const BotMessage = styled(ListItemText)({
  '& .MuiTypography-root': {
    backgroundColor: '#E0F2F7', // A light blue for bot messages
    color: '#333',
    borderRadius: '10px',
    padding: '8px 12px',
    display: 'inline-block',
    maxWidth: '80%',
    textAlign: 'left',
  },
});

const SimpleChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  // Messages are ephemeral - they won't persist across page reloads or new chats
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // Initial bot message when the chat opens or component mounts
    if (isOpen && messages.length === 0) {
      setMessages([
        { text: "Hello! Welcome to MindWell. How can I assist you today?", sender: 'bot' },
        { text: "Please note: Right now, we are updating the server. I'll be able to talk to you properly once the server is back online. Thank you for your patience!", sender: 'bot' }
      ]);
    }
    scrollToBottom(); // Scroll to bottom when messages change
  }, [isOpen, messages]);

  const handleToggleChat = () => {
    setIsOpen(!isOpen);
    // When opening a new chat, reset messages for ephemeral behavior
    if (!isOpen) {
      setMessages([]);
    }
  };

  const handleSendMessage = () => {
    if (inputMessage.trim() === '') return;

    const userMsg = { text: inputMessage, sender: 'user' };
    setMessages((prevMessages) => [...prevMessages, userMsg]);
    setInputMessage('');

    // Simulate bot response - always the server update message for now
    setTimeout(() => {
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: "Thank you for your message! Currently, we are performing server updates. I will be fully operational once the updates are complete. We appreciate your understanding!", sender: 'bot' }
      ]);
    }, 500); // Simulate a short delay for bot response
  };

  return (
    <ChatbotContainer>
      {!isOpen ? (
        <Fab
          color="primary"
          aria-label="open chat"
          onClick={handleToggleChat}
          sx={{ backgroundColor: '#780000', '&:hover': { backgroundColor: '#5a0000' } }}
        >
          <ChatIcon />
        </Fab>
      ) : (
        <ChatWindow elevation={6}>
          <ChatHeader>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>MindWell Bot</Typography>
            <IconButton onClick={handleToggleChat} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </ChatHeader>
          <MessageList>
            {messages.map((msg, index) => (
              <ListItem key={index} sx={{ justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start', paddingY: '4px' }}>
                {msg.sender === 'user' ? (
                  <UserMessage primary={msg.text} />
                ) : (
                  <BotMessage primary={msg.text} />
                )}
              </ListItem>
            ))}
            <div ref={messagesEndRef} /> {/* For auto-scrolling */}
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
      )}
    </ChatbotContainer>
  );
};

export default SimpleChatbot;