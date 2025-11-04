import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx'; 
import { Box, Paper, IconButton, TextField, Typography, List, ListItem, ListItemText, CircularProgress, AppBar, Toolbar, Avatar, Popover } from '@mui/material'; // Added Popover
import { Send as SendIcon, ArrowBack as ArrowBackIcon, InsertEmoticon as InsertEmoticonIcon, DoneAll as DoneAllIcon } from '@mui/icons-material'; // Added InsertEmoticonIcon, DoneAllIcon
import { styled } from '@mui/system';
import axios from 'axios';
import EmojiPicker from 'emoji-picker-react'; // <-- IMPORT EMOJI PICKER
import { formatDistanceToNow } from 'date-fns'; // <-- For "last seen"

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

// --- NEW STYLED COMPONENT for Online/Offline Dot ---
const StatusDot = styled(Box, { 
  shouldForwardProp: (prop) => prop !== 'isOnline',
})(({ isOnline }) => ({
  width: 10,
  height: 10,
  borderRadius: '50%',
  backgroundColor: isOnline ? '#4caf50' : '#9e9e9e', // Green for online, gray for offline
  boxShadow: isOnline ? '0 0 8px #4caf50' : 'none',
  marginLeft: '12px',
  transition: 'all 0.3s ease',
  ...(isOnline && {
    animation: 'pulse 2s infinite',
    '@keyframes pulse': {
      '0%, 100%': { opacity: 1 },
      '50%': { opacity: 0.5 }
    }
  })
}));

// --- NEW COMPONENT for Read Receipt ---
const ReadReceipt = styled(DoneAllIcon, {
  shouldForwardProp: (prop) => prop !== 'isRead',
})(({ isRead }) => ({
  fontSize: '1rem',
  marginLeft: '8px',
  color: isRead ? '#4fc3f7' : '#9e9e9e', // Blue for read, gray for sent
  verticalAlign: 'middle',
}));


export default function ChatInterface() {
  const { roomName } = useParams();
  const { user, token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);
  
  // --- NEW STATES ---
  const [chatPartner, setChatPartner] = useState(null);
  const [partnerStatus, setPartnerStatus] = useState({ is_online: false, last_seen: null });
  const [emojiPickerAnchor, setEmojiPickerAnchor] = useState(null);
  // --- END NEW STATES ---


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

  // --- NEW: Format "last seen" time ---
  const formatLastSeen = (isoString) => {
    if (!isoString) return 'Offline';
    try {
      return `Last seen ${formatDistanceToNow(new Date(isoString), { addSuffix: true })}`;
    } catch (e) {
      return 'Offline';
    }
  };

  useEffect(() => {
    if (!user || !token) return;

    const fetchChatData = async () => {
      try {
        // --- MODIFIED: Fetch messages and partner details in parallel ---
        const api = axios.create({
          headers: { Authorization: `Bearer ${token}` }
        });

        const [messagesResponse, partnerResponse] = await Promise.all([
          api.get(`http://localhost:8000/api/chat/messages/${roomName}/`),
          api.get(`http://localhost:8000/api/chat/partner-details/${roomName}/`)
        ]);

        // Set Partner Details
        setChatPartner(partnerResponse.data);
        setPartnerStatus({
          is_online: partnerResponse.data.is_online,
          last_seen: partnerResponse.data.last_seen
        });

        // Set Messages
        const loadedMessages = messagesResponse.data.map(msg => ({
          id: msg.id, // <-- STORE MESSAGE ID
          text: msg.message_content,
          sender: msg.sender === user.id ? 'user' : 'other',
          timestamp: msg.timestamp,
          is_read: msg.is_read // <-- STORE READ STATUS
        }));
        setMessages(loadedMessages);

        // --- NEW: Mark fetched messages as read ---
        const unreadMessageIds = loadedMessages
          .filter(msg => msg.sender === 'other' && !msg.is_read)
          .map(msg => msg.id);

        // We will send the read receipt *after* the socket connects
        return unreadMessageIds; 

      } catch (error) {
        console.error("Error fetching chat data:", error);
        return [];
      } finally {
        setIsLoading(false);
      }
    };

    let unreadIdsToMark = [];
    fetchChatData().then(unreadIds => {
      unreadIdsToMark = unreadIds;
    });

    const ws = new WebSocket(`ws://localhost:8000/ws/chat/${roomName}/?token=${encodeURIComponent(token)}`);

    ws.onopen = () => {
      console.log("WebSocket connected!");
      setSocket(ws); // <-- Set socket here

      // --- NEW: Send read receipts for historical messages ---
      if (unreadIdsToMark.length > 0) {
        ws.send(JSON.stringify({
          type: 'mark_as_read',
          message_ids: unreadIdsToMark
        }));
      }
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Received WebSocket data:", data);

      switch (data.type) {
        case 'chat_message':
          const newMessage = {
            id: data.message_id, // <-- Get ID
            text: data.message,
            sender: data.sender_id === user.id ? 'user' : 'other',
            timestamp: data.timestamp,
            is_read: data.is_read // <-- Get read status
          };
          
          setMessages((prevMessages) => [...prevMessages, newMessage]);
          
          // --- NEW: If we receive a message, mark it as read immediately ---
          // (A more advanced implementation would wait for it to be in view)
          if (newMessage.sender === 'other' && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'mark_as_read',
              message_ids: [newMessage.id]
            }));
          }
          break;

        case 'presence_update':
          // Update partner status if the update is about them
          if (data.user_id !== user.id) {
            setPartnerStatus({
              is_online: data.is_online,
              last_seen: data.last_seen
            });
          }
          break;

        case 'messages_read':
          // Update the 'is_read' status of our sent messages
          if (data.reader_id !== user.id) {
            setMessages((prevMessages) =>
              prevMessages.map((msg) =>
                data.message_ids.includes(msg.id)
                  ? { ...msg, is_read: true }
                  : msg
              )
            );
          }
          break;
        
        default:
          console.warn("Unknown WebSocket message type:", data.type);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected.");
      setSocket(null);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

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
      type: 'chat_message', // <-- Specify type
      message: inputMessage,
      sender_id: user.id,
    };
    socket.send(JSON.stringify(messagePayload));
    setInputMessage('');
    if (emojiPickerAnchor) {
      setEmojiPickerAnchor(null); // Close emoji picker on send
    }
  };

  // --- NEW: Emoji Picker Handlers ---
  const handleEmojiClick = (emojiObject) => {
    setInputMessage((prevInput) => prevInput + emojiObject.emoji);
  };

  const handleEmojiPickerToggle = (event) => {
    setEmojiPickerAnchor(emojiPickerAnchor ? null : event.currentTarget);
  };

  const closeEmojiPicker = () => {
    setEmojiPickerAnchor(null);
  };
  // --- END Emoji Picker Handlers ---

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
          
          {/* --- NEW: Avatar --- */}
          {chatPartner && (
            <Avatar 
              src={chatPartner.profile_picture} 
              alt={chatPartner.full_name}
              sx={{ ml: 1 }}
            />
          )}

          {/* --- MODIFIED: Name and Status --- */}
          <Box sx={{ flexGrow: 1, ml: 2 }}>
            <Typography variant="h6" component="div" sx={{ 
              fontWeight: 600,
              letterSpacing: '0.5px',
              lineHeight: 1.2
            }}>
              {chatPartner ? chatPartner.full_name : 'Chat'}
            </Typography>
            <Typography variant="caption" sx={{ color: theme.white, opacity: 0.8 }}>
              {partnerStatus.is_online ? 'Online' : formatLastSeen(partnerStatus.last_seen)}
            </Typography>
          </Box>
          
          {/* --- MODIFIED: Status Dot --- */}
          <StatusDot isOnline={partnerStatus.is_online} />

        </Toolbar>
      </AppBar>
      <MessageList>
        {messages.map((msg) => (
          <ListItem 
            key={msg.id} // <-- Use message ID as key
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
                secondary={
                  <>
                    {formatTimestamp(msg.timestamp)}
                    {/* --- NEW: Read Receipt Icon --- */}
                    <ReadReceipt isRead={msg.is_read} />
                  </>
                }
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
        {/* --- NEW: Emoji Button --- */}
        <IconButton onClick={handleEmojiPickerToggle} sx={{ color: theme.primary }}>
          <InsertEmoticonIcon />
        </IconButton>
        <Popover
          open={Boolean(emojiPickerAnchor)}
          anchorEl={emojiPickerAnchor}
          onClose={closeEmojiPicker}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
        >
          <EmojiPicker onEmojiClick={handleEmojiClick} />
        </Popover>
        {/* --- END Emoji Button --- */}

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