// File: frontend_work/src/components/Dashboard.jsx
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Button,
  Typography,
  Box,
  CircularProgress,
  Paper,
  Grid,
  Snackbar,
  Alert,
  List,
  ListItem,
  ListItemText,
  Chip,
  Collapse,
  IconButton,
  Slide,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ButtonGroup,
  TextField,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  AccessTime,
  Event,
  CheckCircleOutline,
  ExpandMore,
  ExpandLess,
  Recommend,
  VideoCall,
  LocationOn,
  AttachMoney,
  Notes,
  NotificationsActiveOutlined,
  Clear,
  SelfImprovement,
  AutoAwesome,
  Pause,
  PlayArrow,
  Stop,
  Category,
  Favorite,
  Healing,
  ChatBubbleOutline,
  Send,
  MusicNote,
} from "@mui/icons-material";
import { keyframes } from "@emotion/react";
import { styled } from "@mui/system";
import {
  format,
  isBefore,
  isAfter,
  addMinutes,
  subMinutes,
  parseISO,
  isToday,
  isTomorrow,
  isWithinInterval,
} from "date-fns";

// Import GoogleGenerativeAI for direct API call
import { GoogleGenerativeAI } from "@google/generative-ai";

// Define theme colors (consistent with other components)
const themePrimaryColor = "#780000"; // Dark red/maroon
const themeLightBackground = "#f8f2e7"; // Slightly warmer light cream/yellowish white
const themeButtonHoverColor = "#5a0000"; // Darker red/maroon for hover
const themeCardBackground = "white"; // White for cards
const themeAccentColor = "#DCC8C8"; // A subtle accent for chips

// Define general animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideInLeft = keyframes`
  from { opacity: 0; transform: translateX(-50px); }
  to { opacity: 1; transform: translateX(0); }
`;

const slideInRight = keyframes`
  from { opacity: 0; transform: translateX(50px); }
  to { opacity: 1; transform: translateX(0); }
`;

const scaleIn = keyframes`
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
`;

// Bubble animations
const float = keyframes`
  0% { transform: translateY(0px) rotate(0deg); opacity: 0.7; border-radius: 50%; }
  25% { transform: translateY(-20px) translateX(10px) rotate(5deg); opacity: 0.8; }
  50% { transform: translateY(-40px) rotate(0deg); opacity: 0.7; }
  75% { transform: translateY(-20px) translateX(-10px) rotate(-5deg); opacity: 0.8; }
  100% { transform: translateY(0px) rotate(0deg); opacity: 0.7; border-radius: 50%; }
`;

const BubblesContainer = styled(Box)({
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  overflow: "hidden",
  zIndex: 0, // Ensure bubbles are behind content
});

const Bubble = styled("div")(
  ({ size, animationDuration, delay, left, top }) => ({
    position: "absolute",
    display: "block",
    listStyle: "none",
    borderRadius: "50%",
    backgroundColor: "rgba(255, 204, 153, 0.4)",
    animation: `${float} ${animationDuration}s linear infinite`,
    animationDelay: `${delay}s`,
    width: `${size}px`,
    height: `${size}px`,
    left: `${left}%`,
    top: `${top}%`,
    boxShadow: "0 0 15px rgba(255, 204, 153, 0.6)",
  })
);

const bubbleData = [
  { size: 60, animationDuration: 10, delay: 0, left: 10, top: 20 },
  { size: 80, animationDuration: 12, delay: 2, left: 80, top: 10 },
  { size: 70, animationDuration: 9, delay: 4, left: 20, top: 80 },
  { size: 90, animationDuration: 11, delay: 6, left: 90, top: 70 },
  { size: 50, animationDuration: 8, delay: 1, left: 50, top: 5 },
  { size: 75, animationDuration: 13, delay: 3, left: 5, top: 60 },
  { size: 65, animationDuration: 10, delay: 5, left: 70, top: 40 },
  { size: 85, animationDuration: 14, delay: 7, left: 30, top: 30 },
];

// Breathing animation
const breatheIn = keyframes`
  from { transform: scale(1); }
  to { transform: scale(1.2); }
`;

const breatheOut = keyframes`
  from { transform: scale(1.2); }
  to { transform: scale(1); }
`;

const breatheHold = keyframes`
  from { transform: scale(1.2); }
  to { transform: scale(1.2); } /* Remains expanded */
`;

const breatheHoldOut = keyframes`
  from { transform: scale(1); }
  to { transform: scale(1); } /* Remains normal size */
`;

const BreathingCircle = styled(Box)(({ phase, duration }) => ({
  width: "150px",
  height: "150px",
  borderRadius: "50%",
  backgroundColor: themePrimaryColor,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  color: "white",
  fontSize: "1.5rem",
  fontWeight: "bold",
  transition: "background-color 0.5s ease-in-out",
  boxShadow: "0px 0px 20px rgba(0,0,0,0.2)",
  ...(phase === "inhale" && {
    backgroundColor: themeButtonHoverColor,
    animation: `${breatheIn} ${duration}s ease-in-out forwards`,
  }),
  ...(phase === "exhale" && {
    backgroundColor: themePrimaryColor,
    animation: `${breatheOut} ${duration}s ease-in-out forwards`,
  }),
  ...(phase === "hold" && {
    backgroundColor: themeAccentColor,
    color: themePrimaryColor,
    animation: `${breatheHold} ${duration}s ease-in-out forwards`,
  }),
  ...(phase === "hold_out" && {
    backgroundColor: themeAccentColor,
    color: themePrimaryColor,
    animation: `${breatheHoldOut} ${duration}s ease-in-out forwards`,
  }),
  // No specific animation for 'idle' if it's not rendered as a circle
  // ...(phase === "idle" && {
  //  backgroundColor: themePrimaryColor,
  //  animation: "none",
  // }),
}));

// --- Breathing Exercise Data ---
const breathingCategories = [
  {
    id: "general_wellness",
    name: "General Wellness",
    icon: <SelfImprovement />,
  },
  { id: "anxiety_panic", name: "Anxiety & Panic Attacks", icon: <Healing /> },
  { id: "stress_relief", name: "Stress Relief", icon: <Favorite /> },
];

const breathingTechniques = {
  general_wellness: [
    {
      id: "four_seven_eight",
      name: "4-7-8 Breathing",
      description: "Relaxing breath technique for general calmness.",
      phases: [
        { name: "Inhale", duration: 4 },
        { name: "Hold", duration: 7 },
        { name: "Exhale", duration: 8 },
      ],
    },
    {
      id: "diaphragmatic",
      name: "Diaphragmatic Breathing",
      description: "Deep belly breathing for relaxation.",
      phases: [
        { name: "Inhale", duration: 4 },
        { name: "Exhale", duration: 6 },
      ],
    },
  ],
  anxiety_panic: [
    {
      id: "box_breathing",
      name: "Box Breathing",
      description: "Steady, controlled breathing for anxiety and panic.",
      phases: [
        { name: "Inhale", duration: 4 },
        { name: "Hold", duration: 4 },
        { name: "Exhale", duration: 4 },
        { name: "Hold Out", duration: 4 },
      ],
    },
    {
      id: "paced_breathing",
      name: "Paced Breathing",
      description: "Slow, rhythmic breathing to regain control.",
      phases: [
        { name: "Inhale", duration: 5 },
        { name: "Exhale", duration: 5 },
      ],
    },
  ],
  stress_relief: [
    {
      id: "equal_breathing",
      name: "Equal Breathing",
      description: "Balance your breath to reduce stress.",
      phases: [
        { name: "Inhale", duration: 4 },
        { name: "Exhale", duration: 4 },
      ],
    },
    {
      id: "progressive_relaxation",
      name: "Progressive Muscle Relaxation (Paired with Breath)",
      description: "Release tension throughout your body with each exhale.",
      phases: [
        { name: "Inhale", duration: 4 },
        { name: "Exhale", duration: 6 },
      ],
    },
  ],
};

export default function Dashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [scheduledSessions, setScheduledSessions] = useState([]);
  const [completedSessions, setCompletedSessions] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [expandedNotes, setExpandedNotes] = useState({});

  // States for controlling Dialog visibility
  const [openPendingDialog, setOpenPendingDialog] = useState(false);
  const [openScheduledDialog, setOpenScheduledDialog] = useState(false);
  const [openCompletedDialog, setOpenCompletedDialog] = useState(false);
  const [openBreathingDialog, setOpenBreathingDialog] = useState(false);
  const [openChatbotDialog, setOpenChatbotDialog] = useState(false);
  const [openSelfCareDialog, setOpenSelfCareDialog] = useState(false);
  // New state for YouTube playback dialog
  const [openYoutubePlaybackDialog, setOpenYoutubePlaybackDialog] = useState(false);
  const [selectedVideoForPlayback, setSelectedVideoForPlayback] = useState(null);


  // State for the floating notification pop-up
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [notificationMessages, setNotificationMessages] = useState([]);

  // Breathing Exercise States
  const [selectedBreathingCategory, setSelectedBreathingCategory] =
    useState(null);
  const [selectedBreathingTechnique, setSelectedBreathingTechnique] =
    useState(null);
  const [breathingDuration, setBreathingDuration] = useState(0);
  // breathingPhase will now directly represent the active phase (inhale, exhale, hold, hold_out)
  // No longer need "idle" as a phase for the circle itself, it's implied by isBreathingRunning
  const [breathingPhase, setBreathingPhase] = useState("idle");
  const [breathingCountdown, setBreathingCountdown] = useState(0);
  const [totalTimeElapsed, setTotalTimeElapsed] = useState(0);
  const [isBreathingRunning, setIsBreathingRunning] = useState(false);

  // Chatbot States
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatbotTyping, setIsChatbotTyping] = useState(false);
  const chatMessagesEndRef = useRef(null);
  const chatSessionRef = useRef(null);

  // Refs for breathing exercise
  const exerciseTimerRef = useRef(null);
  const phaseTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null); // Ref for the countdown interval
  const breathingDurationRef = useRef(breathingDuration);
  const totalTimeElapsedRef = useRef(totalTimeElapsed);
  const selectedTechniqueRef = useRef(selectedBreathingTechnique);
  const currentPhaseIndexRef = useRef(0); // New ref to track current phase index


  // --- Gemini API Key & Model for "Friend" Persona (Dashboard's own chatbot) ---
  const GEMINI_API_KEY = "AIzaSyCqeMz--Pc8Q7kLJ13iNFinF_zvPFi14BE"; // The key you provided earlier
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  // --- YouTube API Key & Search Logic ---
  // API Key from Meditation.jsx which is working: AIzaSyAP8LY0p-ah_dXTWxcg81kt63JqmUrVWuw
  const YOUTUBE_API_KEY = "AIzaSyAP8LY0p-ah_dXTWxcg81kt63JqmUrVWuw"; // Use the working key
  const YOUTUBE_API_BASE_URL = "https://www.googleapis.com/youtube/v3/search";

  // State to store fetched YouTube videos
  const [youtubeVideos, setYoutubeVideos] = useState([]);
  const [isFetchingYoutube, setIsFetchingYoutube] = useState(false);
  const [youtubeError, setYoutubeError] = useState(null);

  // Define search queries for different relaxing categories
  const youtubeSearchQueries = {
    "Sleep Apnea": "sleep apnea relaxing music",
    "Sleep Sounds": "sleep sounds white noise rain",
    "Anxiety Relief": "calming music anxiety relief meditation",
    "Stress Reduction": "relaxing music stress reduction ambient",
    "Nature Sounds": "nature sounds for sleep forest ocean rain",
  };

  // Function to fetch YouTube videos - Using fetch() directly, mirroring Meditation.jsx
  const fetchYoutubeVideos = async (query) => {
    setIsFetchingYoutube(true);
    setYoutubeError(null);
    try {
      const response = await fetch(
        `${YOUTUBE_API_BASE_URL}?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=6&videoEmbeddable=true&safeSearch=strict&key=${YOUTUBE_API_KEY}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('YouTube API request failed (non-OK response):', response.status, errorData);
        throw new Error(`YouTube API request failed with status ${response.status}: ${errorData.error ? errorData.error.message : 'Unknown error'}`);
      }

      const data = await response.json();

      const fetchedVideos = data.items
        .filter((item) => item.id.videoId)
        .map((item) => ({
          id: item.id.videoId,
          name: item.snippet.title,
          description: item.snippet.description,
          thumbnail: item.snippet.thumbnails.high.url,
        }));
      setYoutubeVideos(fetchedVideos);
    } catch (err) {
      console.error(
        "Error fetching YouTube videos:",
        err.message
      );
      setYoutubeError(
        "Failed to load music. Please check your YouTube API key or try again later."
      );
    } finally {
      setIsFetchingYoutube(false);
    }
  };

  // Helper function to get YouTube embed URL - NOT USED FOR INITIAL DISPLAY, ONLY FOR PLAYBACK DIALOG
  const getYouTubeEmbedUrl = (videoId) => `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&loop=1&playlist=${videoId}`;


  // Function to handle video card click
  const handleVideoCardClick = (video) => {
    setSelectedVideoForPlayback(video);
    setOpenYoutubePlaybackDialog(true);
  };

  // Function to close YouTube playback dialog
  const handleCloseYoutubePlaybackDialog = () => {
    setSelectedVideoForPlayback(null);
    setOpenYoutubePlaybackDialog(false);
  };


  useEffect(() => {
    breathingDurationRef.current = breathingDuration;
    totalTimeElapsedRef.current = totalTimeElapsed;
    selectedTechniqueRef.current = selectedBreathingTechnique;
  }, [breathingDuration, totalTimeElapsed, selectedBreathingTechnique]);

  // Scroll to bottom of chat history
  useEffect(() => {
    if (chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory]);

  // Initialize Gemini chat session when chatbot dialog opens
  useEffect(() => {
    if (openChatbotDialog && !chatSessionRef.current) {
      // System instruction for the "friend" persona
      const systemInstruction = `
        You are a friendly, empathetic AI companion for mental wellness. Your core purpose is to listen actively, provide emotional support, and act as a virtual shoulder to lean on. Engage in natural, supportive, and conversational dialogue.

        Guidelines:
        1.  **Emotional Support & Validation:** Acknowledge and validate the user's feelings. Express care and understanding.
        2.  **General Self-Care Ideas (NOT medical advice):** If appropriate and without giving specific "remedies" or "techniques" that sound like medical advice, you can suggest general self-soothing practices (e.g., "Sometimes focusing on your breath can be helpful," "Journaling can be a great way to process thoughts," "Connecting with loved ones can bring comfort"). You can also mention that the platform has tools like breathing exercises for them to explore.
        3.  **Professional Referral (Gentle, for persistent or serious issues):** If the user expresses persistent distress, feeling overwhelmed, or mentions symptoms that sound like they might benefit from professional help (e.g., prolonged sadness, difficulty coping), gently encourage them to consider talking to a mental health professional (like a therapist or counselor). Frame it as an option for deeper, personalized support.
        4.  **CRISIS REDIRECTION (Immediate & Unconditional):** If the user expresses any direct intent of self-harm, suicide, or an immediate life-threatening emergency, you MUST immediately and unconditionally provide the following crisis contacts for Kenya and then gently encourage them to reach out to these professionals. Cease further conversational responses related to the crisis.
            * Kenya Red Cross Mental Health Hotline: 1190
            * Befrienders Kenya: +254 722 178177
            * Local Emergency Services: 999 or 112
        5.  **Strictly NO Medical/Therapeutic Advice:** Reiterate that you are an AI and not a substitute for a licensed professional. Do not diagnose, prescribe, or offer specific therapeutic interventions.
        6.  **No External Knowledge (General Topics):** While you are a friend, you do not have knowledge of specific current events, celebrities, history, complex science, or pop culture. Politely guide the conversation back to the user's feelings or general well-being if they stray into these areas, e.g., "I'm here to focus on what you're going through, how are you feeling about that?" or "My purpose is to be a supportive companion, so let's keep our chat focused on your well-being." Avoid explicit refusal phrases unless absolutely necessary for very out-of-scope or harmful topics.
        7.  **Maintain Companion Tone:** Use "I" statements to express empathy and connect with the user. Your role is to be relatable and understanding.

        Start the conversation with: ""Hi there! My name is Soni. I'm here to listen. Feel free to share anything that's on your mind. I'm a safe space for you to talk.","
        `;

      chatSessionRef.current = model.startChat({
        history: [
          {
            role: "user",
            parts: [{ text: systemInstruction }],
          },
          {
            role: "model",
            parts: [
              {
                text: "Hi there! My name is Soni. I'm here to listen. Feel free to share anything that's on your mind. I'm a safe space for you to talk.",
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 500,
        },
      });
      // Set initial message in chat history
      setChatHistory([
        {
          sender: "ai",
          text: "Hi there! I'm here to listen. Feel free to share anything that's on your mind. I'm a safe space for you to talk.",
        },
      ]);
    } else if (!openChatbotDialog && chatSessionRef.current) {
      // Clear session history and reset when closing the dialog
      setChatHistory([]);
      chatSessionRef.current = null;
    }
  }, [openChatbotDialog]);

  useEffect(() => {
    const fetchUserSessions = async () => {
      if (!user || !token) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const pendingResponse = await axios.get(
          "http://localhost:8000/api/client/session-requests/?status=pending",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setPendingRequests(pendingResponse.data);

        const activeSessionsResponse = await axios.get(
          "http://localhost:8000/api/client/sessions/?status=scheduled",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setScheduledSessions(activeSessionsResponse.data);

        const completedSessionsResponse = await axios.get(
          "http://localhost:8000/api/client/sessions/?status=completed",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setCompletedSessions(completedSessionsResponse.data);
      } catch (err) {
        console.error("Error fetching sessions:", err);
        setError("Failed to load your sessions. Please try again later.");
        setSnackbarMessage("Failed to load your sessions.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    };

    fetchUserSessions();
  }, [user, token]);

  useEffect(() => {
    const newNotifications = [];

    pendingRequests.forEach((request) => {
      newNotifications.push({
        id: `pending-${request.id}`,
        message: `Your request to Dr. ${request.therapist_name} for ${format(
          parseISO(request.requested_date),
          "PPP"
        )} at ${request.requested_time} is pending.`,
        severity: "warning",
      });
    });

    scheduledSessions.forEach((session) => {
      const sessionDateTime = parseISO(
        `${session.session_date}T${session.session_time}`
      );
      const now = new Date();
      const oneHourBefore = subMinutes(sessionDateTime, 60);

      if (
        isWithinInterval(now, { start: oneHourBefore, end: sessionDateTime })
      ) {
        newNotifications.push({
          id: `upcoming-urgent-${session.id}`,
          message: `Your session with Dr. ${session.therapist_name} is in less than an hour!`,
          severity: "info",
        });
      } else if (isToday(sessionDateTime) && isAfter(sessionDateTime, now)) {
        newNotifications.push({
          id: `today-${session.id}`,
          message: `You have a session today with Dr. ${
            session.therapist_name
          } at ${format(sessionDateTime, "p")}.`,
          severity: "info",
        });
      } else if (isTomorrow(sessionDateTime)) {
        newNotifications.push({
          id: `tomorrow-${session.id}`,
          message: `You have a session tomorrow with Dr. ${
            session.therapist_name
          } at ${format(sessionDateTime, "p")}.`,
          severity: "info",
        });
      }
    });

    if (newNotifications.length > 0) {
      setNotificationMessages(newNotifications);
    }
  }, [pendingRequests, scheduledSessions]);

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
  };

  const toggleNotesExpansion = (sessionId) => {
    setExpandedNotes((prev) => ({ ...prev, [sessionId]: !prev[sessionId] }));
  };

  const calculateCountdown = (sessionDate, sessionTime) => {
    const sessionDateTime = parseISO(`${sessionDate}T${sessionTime}`);
    const now = new Date();
    const difference = sessionDateTime.getTime() - now.getTime();

    if (difference <= 0) {
      return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return { expired: false, days, hours, minutes, seconds };
  };

  const [countdowns, setCountdowns] = useState({});

  useEffect(() => {
    const interval = setInterval(() => {
      const newCountdowns = {};
      scheduledSessions.forEach((session) => {
        if (session.session_type === "online") {
          newCountdowns[session.id] = calculateCountdown(
            session.session_date,
            session.session_time
          );
        }
      });
      setCountdowns(newCountdowns);
    }, 1000);

    return () => clearInterval(interval);
  }, [scheduledSessions]);

  // --- Breathing Exercise Logic ---
  const resetBreathingExercise = () => {
    if (exerciseTimerRef.current) clearInterval(exerciseTimerRef.current);
    if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current); // Clear this specific interval

    setBreathingDuration(0);
    setBreathingPhase("idle"); // Reset phase to idle (for UI logic of showing start button)
    setBreathingCountdown(0);
    setTotalTimeElapsed(0);
    setIsBreathingRunning(false);
    setSelectedBreathingCategory(null);
    setSelectedBreathingTechnique(null);
    currentPhaseIndexRef.current = 0; // Reset phase index
  };

  const startBreathingExercise = (durationOverride = 0) => {
    const duration = durationOverride || breathingDurationRef.current;
    if (!selectedTechniqueRef.current || duration === 0) return;

    setBreathingDuration(duration);
    setTotalTimeElapsed(0);
    setIsBreathingRunning(true); // Set true here
    currentPhaseIndexRef.current = 0; // Start from the first phase

    if (exerciseTimerRef.current) clearInterval(exerciseTimerRef.current);
    if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current); 

    const newExerciseTimer = setInterval(() => {
      totalTimeElapsedRef.current += 1;
      setTotalTimeElapsed((prev) => prev + 1);

      if (totalTimeElapsedRef.current >= breathingDurationRef.current) {
        clearInterval(exerciseTimerRef.current);
        clearTimeout(phaseTimerRef.current);
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        setBreathingPhase("idle");
        setIsBreathingRunning(false);
        setBreathingCountdown(0);
        setOpenBreathingDialog(false);
        setSnackbarMessage("Breathing exercise completed!");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
        resetBreathingExercise();
      }
    }, 1000);
    exerciseTimerRef.current = newExerciseTimer;

    // Use a small timeout to ensure isBreathingRunning state has propagated
    setTimeout(() => {
      const firstPhase = selectedTechniqueRef.current.phases[currentPhaseIndexRef.current];
      runBreathingPhase(
        firstPhase.name.toLowerCase().replace(" ", "_"),
        firstPhase.duration,
        currentPhaseIndexRef.current
      );
    }, 50); // Small delay
  };

  const runBreathingPhase = (phaseName, duration, phaseIndex) => {
    // This check is now less critical since startBreathingExercise ensures isBreathingRunning is true
    // However, it's good to keep for robust error handling.
    // We remove the condition if (!isBreathingRunning && phaseName !== "idle") return;
    // as "idle" phase won't trigger this function directly for animation

    setBreathingPhase(phaseName);
    setBreathingCountdown(duration);
    currentPhaseIndexRef.current = phaseIndex;

    const currentTechniquePhases = selectedTechniqueRef.current.phases;
    // Calculate next phase index considering looping if needed
    const nextPhaseIndex = (phaseIndex + 1) % currentTechniquePhases.length;

    // Clear previous phase timer to prevent multiple timers running
    if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);

    const newPhaseTimer = setTimeout(() => {
      // Check total time elapsed before moving to next phase to ensure overall duration is respected
      if (totalTimeElapsedRef.current < breathingDurationRef.current) {
        const nextPhase = currentTechniquePhases[nextPhaseIndex];
        runBreathingPhase(
          nextPhase.name.toLowerCase().replace(" ", "_"),
          nextPhase.duration,
          nextPhaseIndex
        );
      }
    }, duration * 1000);
    phaseTimerRef.current = newPhaseTimer;

    // Handle the phase-specific countdown
    let currentCountdown = duration;
    // Clear any existing countdown interval to prevent multiple intervals running
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current); // Use ref here
    countdownIntervalRef.current = setInterval(() => { // Store interval ID in ref
      currentCountdown--;
      if (currentCountdown < 0) {
        clearInterval(countdownIntervalRef.current);
      } else {
        setBreathingCountdown(currentCountdown);
      }
    }, 1000);
  };

  const pauseBreathingExercise = () => {
    setIsBreathingRunning(false);
    if (exerciseTimerRef.current) clearInterval(exerciseTimerRef.current);
    if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current); // Clear countdown interval on pause
  };

  const resumeBreathingExercise = () => {
    setIsBreathingRunning(true);
    const newExerciseTimer = setInterval(() => {
      totalTimeElapsedRef.current += 1;
      setTotalTimeElapsed((prev) => prev + 1);

      if (totalTimeElapsedRef.current >= breathingDurationRef.current) {
        clearInterval(exerciseTimerRef.current);
        clearTimeout(phaseTimerRef.current);
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        setBreathingPhase("idle");
        setIsBreathingRunning(false);
        setBreathingCountdown(0);
        setOpenBreathingDialog(false);
        setSnackbarMessage("Breathing exercise completed!");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
        resetBreathingExercise();
      }
    }, 1000);
    exerciseTimerRef.current = newExerciseTimer;

    // Ensure state updates before resuming phase
    setTimeout(() => {
      const currentPhase = selectedTechniqueRef.current.phases[currentPhaseIndexRef.current];
      // Use the remaining breathingCountdown for the phase duration when resuming
      runBreathingPhase(currentPhase.name.toLowerCase().replace(" ", "_"), breathingCountdown, currentPhaseIndexRef.current);
    }, 50); // Small delay
  };

  const stopBreathingExercise = () => {
    resetBreathingExercise();
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current); // Ensure interval is cleared on stop
  };
  // --- End Breathing Exercise Logic ---

  // --- Chatbot Logic (Re-implemented for "friend" persona) ---
  const handleChatInputChange = (event) => {
    setChatInput(event.target.value);
  };

  const handleSendMessage = async () => {
    if (chatInput.trim() === "") return;

    const userMessageText = chatInput.trim();
    const userMessage = { sender: "user", text: userMessageText };
    setChatHistory((prev) => [...prev, userMessage]);
    setChatInput("");
    setIsChatbotTyping(true);

    // Crisis keywords for IMMEDIATE EMERGENCY REDIRECTION (very severe)
    const severeCrisisKeywords = [
      "harm myself",
      "suicide",
      "kill myself",
      "ending my life",
      "danger",
      "emergency",
      "need urgent help",
    ];
    const userTextLower = userMessageText.toLowerCase();
    const isSevereCrisis = severeCrisisKeywords.some((keyword) =>
      userTextLower.includes(keyword)
    );

    if (isSevereCrisis) {
      const crisisResponse = {
        sender: "ai",
        text: `It sounds like you're going through a very difficult time, and your safety is paramount. Please know that you're not alone and immediate help is available. As an AI, I cannot provide professional medical or psychological help, but there are compassionate human professionals who can. \n\n**Please reach out to one of these resources immediately:**\n\n* **Kenya Red Cross Mental Health Hotline:** 1190\n* **Befrienders Kenya:** +254 722 178177\n* **Local Emergency Services:** 999 or 112\n\nYour well-being is important. Please connect with a professional. I am here to listen, but for immediate safety, these resources are vital.`,
      };
      setChatHistory((prev) => [...prev, crisisResponse]);
      setIsChatbotTyping(false);
      return; // Stop here, do not call API
    }

    try {
      // Re-initialize session if it was cleared (e.g., dialog closed and reopened)
      if (!chatSessionRef.current) {
        // System instruction for the "friend" persona (replicated from useEffect for resilience)
        const systemInstruction = `
            You are a friendly, empathetic AI companion for mental wellness. Your core purpose is to listen actively, provide emotional support, and act as a virtual shoulder to lean on. Engage in natural, supportive, and conversational dialogue.

            Guidelines:
            1.  **Emotional Support & Validation:** Acknowledge and validate the user's feelings. Express care and understanding.
            2.  **General Self-Care Ideas (NOT medical advice):** If appropriate and without giving specific "remedies" or "techniques" that sound like medical advice, you can suggest general self-soothing practices (e.g., "Sometimes focusing on your breath can be helpful," "Journaling can be a great way to process thoughts," "Connecting with loved ones can bring comfort"). You can also mention that the platform has tools like breathing exercises for them to explore.
            3.  **Professional Referral (Gentle, for persistent or serious issues):** If the user expresses persistent distress, feeling overwhelmed, or mentions symptoms that sound like they might benefit from professional help (e.g., prolonged sadness, difficulty coping), gently encourage them to consider talking to a mental health professional (like a therapist or counselor). Frame it as an option for deeper, personalized support.
            4.  **CRISIS REDIRECTION (Immediate & Unconditional):** If the user expresses any direct intent of self-harm, suicide, or an immediate life-threatening emergency, you MUST immediately and unconditionally provide the following crisis contacts for Kenya and then gently encourage them to reach out to these professionals. Cease further conversational responses related to the crisis.
                * Kenya Red Cross Mental Health Hotline: 1190
                * Befrienders Kenya: +254 722 178177
                * Local Emergency Services: 999 or 112
            5.  **Strictly NO Medical/Therapeutic Advice:** Reiterate that you are an AI and not a substitute for a licensed professional. Do not diagnose, prescribe, or offer specific therapeutic interventions.
            6.  **No External Knowledge (General Topics):** While you are a friend, you do not have knowledge of specific current events, celebrities, history, complex science, or pop culture. Politely guide the conversation back to the user's feelings or general well-being if they stray into these areas, e.g., "I'm here to focus on what you're going through, how are you feeling about that?" or "My purpose is to be a supportive companion, so let's keep our chat focused on your well-being." Avoid explicit refusal phrases unless absolutely necessary for very out-of-scope or harmful topics.
            7.  **Maintain Companion Tone:** Use "I" statements to express empathy and connect with the user. Your role is to be relatable and understanding.

            Start the conversation with: "Hi there! I'm here to listen. Feel free to share anything that's on your mind. I'm a safe space for you to talk."
        `;

        chatSessionRef.current = model.startChat({
          history: [
            { role: "user", parts: [{ text: systemInstruction }] },
            {
              role: "model",
              parts: [
                {
                  text: "Hi there! I'm here to listen. Feel free to share anything that's on your mind. I'm a safe space for you to talk.",
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 500,
          },
        });
      }

      const result = await chatSessionRef.current.sendMessage(userMessageText);
      const botResponseText = result.response.text();

      setChatHistory((prev) => [
        ...prev,
        { sender: "ai", text: botResponseText },
      ]);
    } catch (err) {
      console.error(
        "Error communicating with AI chatbot:",
        err.response ? err.response.data : err.message
      );
      let errorMessage =
        "I'm sorry, I couldn't connect right now. Please try again later. It seems there was an issue on my end.";
      if (err.response && err.response.status === 429) {
        errorMessage =
          "I'm experiencing high traffic right now. Please try again in a moment.";
      } else if (err.response && err.response.status === 401) {
        errorMessage =
          "It seems there's an authentication issue. Please ensure the API key is correct and authorized.";
      } else if (
        err.response &&
        err.response.data &&
        err.response.data.error &&
        err.response.data.error.message
      ) {
        errorMessage = `Error: ${err.response.data.error.message}. Please try again.`;
      }
      setChatHistory((prev) => [...prev, { sender: "ai", text: errorMessage }]);
    } finally {
      setIsChatbotTyping(false);
    }
  };
  // --- End Chatbot Logic ---

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "80vh",
          backgroundColor: themeLightBackground,
        }}
      >
        <CircularProgress sx={{ color: themePrimaryColor }} />
        <Typography sx={{ ml: 2, color: themePrimaryColor }}>
          Loading your dashboard...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        padding: 4,
        backgroundColor: themeLightBackground,
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Bubbles Background */}
      <BubblesContainer>
        {bubbleData.map((bubble, index) => (
          <Bubble
            key={index}
            size={bubble.size}
            animationDuration={bubble.animationDuration}
            delay={bubble.delay}
            left={bubble.left}
            top={bubble.top}
          />
        ))}
      </BubblesContainer>

      {/* Main Content (z-index ensures it's above bubbles) */}
      <Box sx={{ position: "relative", zIndex: 1 }}>
        {/* Top Header / Notification Bell (now a placeholder, moved to bottom) */}
        {/* <Box
           sx={{
             display: "flex",
             justifyContent: "flex-end",
             width: "100%",
             mb: 2,
           }}
         >
           <IconButton
             onClick={() => setShowNotificationPopup(true)}
             color="inherit"
             sx={{
               backgroundColor: themePrimaryColor,
               color: "white",
               "&:hover": { backgroundColor: themeButtonHoverColor },
               p: 1.5,
               borderRadius: "50%",
               boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
             }}
           >
             <NotificationsActiveOutlined fontSize="large" />
             {notificationMessages.length > 0 && (
               <Box
                 sx={{
                   position: "absolute",
                   top: 5,
                   right: 5,
                   backgroundColor: "red",
                   color: "white",
                   borderRadius: "50%",
                   width: 20,
                   height: 20,
                   display: "flex",
                   alignItems: "center",
                   justifyContent: "center",
                   fontSize: "0.75rem",
                   fontWeight: "bold",
                   zIndex: 1,
                 }}
               >
                 {notificationMessages.length}
               </Box>
             )}
           </IconButton>
         </Box> */}

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 3, animation: `${fadeIn} 0.5s ease-out forwards` }}
          >
            {error}
          </Alert>
        )}

        {/* --- Session Buttons at the Very Top --- */}
        <Box
          sx={{
            mb: 4,
            display: "flex",
            justifyContent: "center",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Button
            variant="contained"
            onClick={() => setOpenPendingDialog(true)}
            sx={{
              backgroundColor: themePrimaryColor,
              "&:hover": { backgroundColor: themeButtonHoverColor },
              color: "white",
              py: 1.5,
              px: 3,
              borderRadius: 2,
              fontWeight: "bold",
            }}
            endIcon={<Event />}
          >
            Pending ({pendingRequests.length})
          </Button>
          <Button
            variant="contained"
            onClick={() => setOpenScheduledDialog(true)}
            sx={{
              backgroundColor: themePrimaryColor,
              "&:hover": { backgroundColor: themeButtonHoverColor },
              color: "white",
              py: 1.5,
              px: 3,
              borderRadius: 2,
              fontWeight: "bold",
            }}
            endIcon={<Event />}
          >
            Scheduled ({scheduledSessions.length})
          </Button>
          <Button
            variant="contained"
            onClick={() => setOpenCompletedDialog(true)}
            sx={{
              backgroundColor: themePrimaryColor,
              "&:hover": { backgroundColor: themeButtonHoverColor },
              color: "white",
              py: 1.5,
              px: 3,
              borderRadius: 2,
              fontWeight: "bold",
            }}
            endIcon={<Event />}
          >
            Completed ({completedSessions.length})
          </Button>
        </Box>

        {/* --- Main Grid Container for the rest of the dashboard content --- */}
        <Grid container spacing={4}>
          {/* Breathing Exercise Card (Left Column) */}
          <Grid
            item
            xs={12}
            md={6}
            lg={6} // Adjusted to take more space after removing other columns
            sx={{
              animation: `${slideInLeft} 1s ease-out forwards 0.9s`,
              animationFillMode: "backwards",
            }}
          >
            <Paper
              elevation={6}
              sx={{
                p: 3,
                backgroundColor: themeCardBackground,
                borderRadius: 3,
                border: `1px solid ${themePrimaryColor}30`,
                boxShadow: "0px 8px 20px rgba(0,0,0,0.1)",
                minHeight: "250px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center",
              }}
            >
              <Typography
                variant="h5"
                sx={{ color: themePrimaryColor, mb: 2, fontWeight: "bold" }}
              >
                Breathing Exercise
              </Typography>
              <SelfImprovement
                sx={{ fontSize: 80, color: themePrimaryColor, mb: 2 }}
              />
              <Typography variant="body1" sx={{ color: "#555", mb: 2 }}>
                Find your calm.
              </Typography>
              <Button
                variant="contained"
                sx={{
                  backgroundColor: themePrimaryColor,
                  "&:hover": { backgroundColor: themeButtonHoverColor },
                  py: 1.5,
                  borderRadius: 2,
                }}
                onClick={() => {
                  setOpenBreathingDialog(true);
                  resetBreathingExercise();
                }}
              >
                Start Breathing
              </Button>
            </Paper>
          </Grid>

          {/* Your Progress */}
          <Grid
            item
            xs={12}
            md={6}
            lg={6} // Adjusted to take more space
            sx={{
              animation: `${slideInRight} 1s ease-out forwards 1.1s`,
              animationFillMode: "backwards",
            }}
          >
            <Paper
              elevation={6}
              sx={{
                p: 3,
                backgroundColor: themeCardBackground,
                borderRadius: 3,
                border: `1px solid ${themePrimaryColor}30`,
                boxShadow: "0px 8px 20px rgba(0,0,0,0.1)",
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  color: themePrimaryColor,
                  mb: 2,
                  fontWeight: "bold",
                  borderBottom: `2px solid ${themePrimaryColor}20`,
                  pb: 1,
                }}
              >
                Your Progress
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  alignItems: "center",
                  justifyContent: "space-around",
                  py: 2,
                }}
              >
                <Box
                  sx={{
                    position: "relative",
                    display: "inline-flex",
                    mb: { xs: 3, sm: 0 },
                  }}
                >
                  <CircularProgress
                    variant="determinate"
                    value={80}
                    size={120}
                    thickness={5}
                    sx={{ color: themePrimaryColor }}
                  />
                  <Box
                    sx={{
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      position: "absolute",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography
                      variant="h5"
                      component="div"
                      color="text.secondary"
                      sx={{ fontWeight: "bold" }}
                    >
                      80%
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ textAlign: { xs: "center", sm: "left" } }}>
                  <Typography
                    variant="h6"
                    sx={{ color: themePrimaryColor, fontWeight: "bold", mb: 1 }}
                  >
                    Session Completion Rate
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    You're consistently engaging with your therapy journey. Keep
                    up the great work!
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Quick Actions (now takes full width) */}
          <Grid
            item
            xs={12}
            // lg={4} // Removed specific lg size
            sx={{
              animation: `${slideInLeft} 1s ease-out forwards 1.3s`,
              animationFillMode: "backwards",
            }}
          >
            <Paper
              elevation={6}
              sx={{
                p: 3,
                backgroundColor: themeCardBackground,
                borderRadius: 3,
                border: `1px solid ${themePrimaryColor}30`,
                boxShadow: "0px 8px 20px rgba(0,0,0,0.1)",
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  color: themePrimaryColor,
                  mb: 2,
                  fontWeight: "bold",
                  borderBottom: `2px solid ${themePrimaryColor}20`,
                  pb: 1,
                }}
              >
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<Notes />}
                    component={Link}
                    to="/journal"
                    sx={{
                      backgroundColor: themePrimaryColor,
                      "&:hover": { backgroundColor: themeButtonHoverColor },
                      py: 1.5,
                      borderRadius: 2,
                    }}
                  >
                    New Journal Entry
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<AutoAwesome />}
                    onClick={() => setOpenChatbotDialog(true)}
                    sx={{
                      backgroundColor: themePrimaryColor,
                      "&:hover": { backgroundColor: themeButtonHoverColor },
                      py: 1.5,
                      borderRadius: 2,
                    }}
                  >
                    Chat with Soni
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<MusicNote />}
                    onClick={() => setOpenSelfCareDialog(true)} // Open Self-Care Dialog
                    sx={{
                      backgroundColor: themePrimaryColor,
                      "&:hover": { backgroundColor: themeButtonHoverColor },
                      py: 1.5,
                      borderRadius: 2,
                    }}
                  >
                    Relaxing Music
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<Event />}
                    component={Link}
                    to="/find-therapist"
                    sx={{
                      backgroundColor: themePrimaryColor,
                      "&:hover": { backgroundColor: themeButtonHoverColor },
                      py: 1.5,
                      borderRadius: 2,
                    }}
                  >
                    Find a Therapist
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>

        {/* Floating Notification Pop-up - MOVED TO BOTTOM RIGHT */}
        <Slide
          direction="up" // Changed direction back to up for bottom-right
          in={showNotificationPopup}
          mountOnEnter
          unmountOnExit
        >
          <Paper
            elevation={10}
            sx={{
              position: "fixed",
              bottom: 20,
              right: 20, // Changed back to right
              width: { xs: "90%", sm: 350 },
              backgroundColor: themeCardBackground,
              borderRadius: 3,
              boxShadow: "0px 8px 25px rgba(0,0,0,0.25)",
              zIndex: 1200,
              p: 2,
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
              border: `1px solid ${themePrimaryColor}60`,
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: "bold",
                  color: themePrimaryColor,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <NotificationsActiveOutlined sx={{ mr: 1 }} /> Important Updates
              </Typography>
              <IconButton
                size="small"
                onClick={() => setShowNotificationPopup(false)}
              >
                <Clear />
              </IconButton>
            </Box>
            <Divider />
            <List dense disablePadding>
              {notificationMessages.length > 0 ? (
                notificationMessages.map((notif, index) => (
                  <Alert
                    key={notif.id || index}
                    severity={notif.severity}
                    sx={{
                      mb: 1,
                      p: 1,
                      backgroundColor: `${
                        notif.severity === "warning"
                          ? "#fff3e0"
                          : notif.severity === "info"
                          ? "#e3f2fd"
                          : "#e8f5e9"
                      }`,
                      color: "#333",
                    }}
                  >
                    <Typography variant="body2">{notif.message}</Typography>
                  </Alert>
                ))
              ) : (
                <Typography
                  variant="body2"
                  sx={{ color: "#666", textAlign: "center" }}
                >
                  No new notifications.
                </Typography>
              )}
            </List>
            {notificationMessages.length > 0 && (
              <Button
                variant="outlined"
                size="small"
                sx={{
                  color: themePrimaryColor,
                  borderColor: themePrimaryColor,
                }}
                onClick={() => navigate("/my-sessions-requests")}
              >
                View All Activity
              </Button>
            )}
          </Paper>
        </Slide>

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
        >
          <Alert
            onClose={handleSnackbarClose}
            severity={snackbarSeverity}
            sx={{ width: "100%" }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>

      {/* --- DIALOGS FOR SESSION DETAILS --- */}

      {/* Dialog for Pending Sessions */}
      <Dialog
        open={openPendingDialog}
        onClose={() => setOpenPendingDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          sx={{
            backgroundColor: themePrimaryColor,
            color: "white",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            variant="body1"
            sx={{ color: "white", fontWeight: "bold" }}
          >
            Pending Session Requests
          </Typography>
          <IconButton
            onClick={() => setOpenPendingDialog(false)}
            sx={{ color: "white" }}
          >
            <Clear />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {pendingRequests.length === 0 ? (
            <Box sx={{ p: 3, textAlign: "center" }}>
              <Typography variant="body1" color="text.secondary">
                No pending session requests.
              </Typography>
            </Box>
          ) : (
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{ border: "1px solid #eee" }}
            >
              <Table size="small">
                <TableHead sx={{ backgroundColor: themeLightBackground }}>
                  <TableRow>
                    <TableCell
                      sx={{ fontWeight: "bold", color: themePrimaryColor }}
                    >
                      Therapist
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: "bold", color: themePrimaryColor }}
                    >
                      Requested Date
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: "bold", color: themePrimaryColor }}
                    >
                      Requested Time
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: "bold", color: themePrimaryColor }}
                    >
                      Message
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>{request.therapist_name}</TableCell>
                      <TableCell>
                        {format(parseISO(request.requested_date), "PPP")}
                      </TableCell>
                      <TableCell>{request.requested_time}</TableCell>
                      <TableCell
                        sx={{
                          maxWidth: 200,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {request.message}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenPendingDialog(false)}
            sx={{ color: themePrimaryColor }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog for Scheduled Sessions */}
      <Dialog
        open={openScheduledDialog}
        onClose={() => setOpenScheduledDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          sx={{
            backgroundColor: themePrimaryColor,
            color: "white",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            variant="body1"
            sx={{ color: "white", fontWeight: "bold" }}
          >
            Your Scheduled Sessions
          </Typography>
          <IconButton
            onClick={() => setOpenScheduledDialog(false)}
            sx={{ color: "white" }}
          >
            <Clear />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {scheduledSessions.length === 0 ? (
            <Box sx={{ p: 3, textAlign: "center" }}>
              <Typography variant="body1" color="text.secondary">
                No scheduled sessions.
              </Typography>
            </Box>
          ) : (
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{ border: "1px solid #eee" }}
            >
              <Table size="small">
                <TableHead sx={{ backgroundColor: themeLightBackground }}>
                  <TableRow>
                    <TableCell
                      sx={{ fontWeight: "bold", color: themePrimaryColor }}
                    >
                      Therapist
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: "bold", color: themePrimaryColor }}
                    >
                      Date
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: "bold", color: themePrimaryColor }}
                    >
                      Time
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: "bold", color: themePrimaryColor }}
                    >
                      Type
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: "bold", color: themePrimaryColor }}
                    >
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {scheduledSessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>{session.therapist_name}</TableCell>
                      <TableCell>
                        {format(parseISO(session.session_date), "PPP")}
                      </TableCell>
                      <TableCell>
                        {format(
                          parseISO(
                            `${session.session_date}T${session.session_time}`
                          ),
                          "p"
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={
                            session.session_type === "online" ? (
                              <VideoCall />
                            ) : (
                              <LocationOn />
                            )
                          }
                          label={
                            session.session_type === "online"
                              ? "Online"
                              : "In-Person"
                          }
                          size="small"
                          sx={{
                            backgroundColor: themeAccentColor,
                            color: themePrimaryColor,
                            fontWeight: "bold",
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {session.session_type === "online" &&
                          session.zoom_meeting_url &&
                          // isJoinable is not defined in this scope, removing for now to prevent errors
                          // (isJoinable ? (
                          true ? ( // Temporarily set to true to allow button to show
                            <Button
                              variant="contained"
                              size="small"
                              href={session.zoom_meeting_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{
                                backgroundColor: themePrimaryColor,
                                "&:hover": {
                                  backgroundColor: themeButtonHoverColor,
                                },
                              }}
                            >
                              Join Now
                            </Button>
                          ) : (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {countdowns[session.id] &&
                                !countdowns[session.id].expired
                                ? `${countdowns[session.id].days}d ${
                                    countdowns[session.id].hours
                                  }h ${countdowns[session.id].minutes}m ${
                                    countdowns[session.id].seconds
                                  }s`
                                : "Session ended or not yet started"}
                            </Typography>
                          )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenScheduledDialog(false)}
            sx={{ color: themePrimaryColor }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog for Completed Sessions */}
      <Dialog
        open={openCompletedDialog}
        onClose={() => setOpenCompletedDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          sx={{
            backgroundColor: themePrimaryColor,
            color: "white",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            variant="body1"
            sx={{ color: "white", fontWeight: "bold" }}
          >
            Your Completed Sessions
          </Typography>
          <IconButton
            onClick={() => setOpenCompletedDialog(false)}
            sx={{ color: "white" }}
          >
            <Clear />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {completedSessions.length === 0 ? (
            <Box sx={{ p: 3, textAlign: "center" }}>
              <Typography variant="body1" color="text.secondary">
                No completed sessions yet.
              </Typography>
            </Box>
          ) : (
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{ border: "1px solid #eee" }}
            >
              <Table size="small">
                <TableHead sx={{ backgroundColor: themeLightBackground }}>
                  <TableRow>
                    <TableCell
                      sx={{ fontWeight: "bold", color: themePrimaryColor }}
                    >
                      Therapist
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: "bold", color: themePrimaryColor }}
                    >
                      Date
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: "bold", color: themePrimaryColor }}
                    >
                      Notes
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: "bold", color: themePrimaryColor }}
                    >
                      Recommendations
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: "bold", color: themePrimaryColor }}
                    >
                      Follow-up
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {completedSessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>{session.therapist_name}</TableCell>
                      <TableCell>
                        {format(parseISO(session.session_date), "PPP")}
                      </TableCell>
                      <TableCell
                        sx={{
                          maxWidth: 200,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {session.notes || "N/A"}
                      </TableCell>
                      <TableCell
                        sx={{
                          maxWidth: 200,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {session.recommendations || "N/A"}
                      </TableCell>
                      <TableCell>
                        {session.follow_up_required && session.next_session_date
                          ? format(parseISO(session.next_session_date), "PPP")
                          : "No"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenCompletedDialog(false)}
            sx={{ color: themePrimaryColor }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- Breathing Exercise Dialog --- */}
      <Dialog
        open={openBreathingDialog}
        onClose={stopBreathingExercise}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            backgroundColor: themePrimaryColor,
            color: "white",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            variant="body1"
            sx={{ color: "white", fontWeight: "bold" }}
          >
            Breathing Exercise
          </Typography>
          <IconButton onClick={stopBreathingExercise} sx={{ color: "white" }}>
            <Clear />
          </IconButton>
        </DialogTitle>
        <DialogContent
          dividers
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            py: 4,
            px: 2,
          }}
        >
          {!selectedBreathingCategory ? (
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="h6" sx={{ color: themePrimaryColor, mb: 3 }}>
                <Category sx={{ mr: 1 }} /> Select a Category:
              </Typography>
              <Grid container spacing={2} justifyContent="center">
                {breathingCategories.map((category) => (
                  <Grid item key={category.id}>
                    <Button
                      variant="outlined"
                      sx={{
                        borderColor: themePrimaryColor,
                        color: themePrimaryColor,
                        "&:hover": {
                          backgroundColor: `${themePrimaryColor}10`,
                        },
                        py: 1.5,
                        px: 3,
                        borderRadius: 2,
                        flexDirection: "column",
                        minWidth: 120,
                        textTransform: "none",
                      }}
                      onClick={() => setSelectedBreathingCategory(category.id)}
                    >
                      {category.icon}
                      <Typography variant="button" sx={{ mt: 1 }}>
                        {category.name}
                      </Typography>
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ) : !selectedBreathingTechnique ? (
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="h6" sx={{ color: themePrimaryColor, mb: 3 }}>
                <Healing sx={{ mr: 1 }} /> Select a Technique for{" "}
                <Chip
                  label={
                    breathingCategories.find(
                      (c) => c.id === selectedBreathingCategory
                    )?.name
                  }
                  sx={{
                    bgcolor: themeAccentColor,
                    color: themePrimaryColor,
                    fontWeight: "bold",
                  }}
                />
                :
              </Typography>
              <Grid container spacing={2} justifyContent="center">
                {breathingTechniques[selectedBreathingCategory]?.map(
                  (technique) => (
                    <Grid item key={technique.id}>
                      <Button
                        variant="outlined"
                        sx={{
                          borderColor: themePrimaryColor,
                          color: themePrimaryColor,
                          "&:hover": {
                            backgroundColor: `${themePrimaryColor}10`,
                          },
                          py: 1.5,
                          px: 3,
                          borderRadius: 2,
                          textTransform: "none",
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          textAlign: "center",
                        }}
                        onClick={() => setSelectedBreathingTechnique(technique)}
                      >
                        <Typography
                          variant="button"
                          sx={{ fontWeight: "bold" }}
                        >
                          {technique.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ mt: 0.5, color: "text.secondary" }}
                        >
                          {technique.description}
                        </Typography>
                      </Button>
                    </Grid>
                  )
                )}
              </Grid>
              <Button
                variant="text"
                sx={{ mt: 3, color: themePrimaryColor }}
                onClick={() => {
                  setSelectedBreathingTechnique(null);
                  setBreathingDuration(0);
                }}
              >
                Back to Techniques
              </Button>
            </Box>
          ) : breathingDuration === 0 ? (
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="h6" sx={{ color: themePrimaryColor, mb: 3 }}>
                Choose duration for{" "}
                <Chip
                  label={selectedBreathingTechnique.name}
                  sx={{
                    bgcolor: themeAccentColor,
                    color: themePrimaryColor,
                    fontWeight: "bold",
                  }}
                />
                :
              </Typography>
              <ButtonGroup
                variant="contained"
                aria-label="breathing duration selection"
              >
                <Button
                  sx={{
                    backgroundColor: themePrimaryColor,
                    "&:hover": { backgroundColor: themeButtonHoverColor },
                  }}
                  onClick={() => setBreathingDuration(60)}
                >
                  1 min
                </Button>
                <Button
                  sx={{
                    backgroundColor: themePrimaryColor,
                    "&:hover": { backgroundColor: themeButtonHoverColor },
                  }}
                  onClick={() => setBreathingDuration(120)}
                >
                  2 min
                </Button>
                <Button
                  sx={{
                    backgroundColor: themePrimaryColor,
                    "&:hover": { backgroundColor: themeButtonHoverColor },
                  }}
                  onClick={() => setBreathingDuration(180)}
                >
                  3 min
                </Button>
              </ButtonGroup>
              <Button
                variant="text"
                sx={{ mt: 3, color: themePrimaryColor }}
                onClick={() => {
                  setSelectedBreathingTechnique(null);
                  setBreathingDuration(0);
                }}
              >
                Back to Techniques
              </Button>
            </Box>
          ) : (
            // This is the main display for the breathing exercise
            <Box sx={{ textAlign: "center" }}>
              {!isBreathingRunning ? (
                // Display the "Start Exercise" button when not running
                <Button
                  variant="contained"
                  startIcon={<PlayArrow />}
                  sx={{
                    backgroundColor: themePrimaryColor,
                    "&:hover": { backgroundColor: themeButtonHoverColor },
                    py: 2,
                    px: 4,
                    fontSize: "1.2rem",
                    borderRadius: 3,
                    mt: 2,
                    mb: 4, // Add margin to separate from time left text
                  }}
                  onClick={() => startBreathingExercise()}
                >
                  Start Exercise
                </Button>
              ) : (
                // Display the BreathingCircle when running
                <BreathingCircle
                  phase={breathingPhase}
                  duration={
                    selectedBreathingTechnique.phases[
                      currentPhaseIndexRef.current
                    ]?.duration || 1
                  }
                >
                  <Typography
                    variant="h5"
                    sx={{
                      color:
                        breathingPhase === "hold" ||
                        breathingPhase === "hold_out"
                          ? themePrimaryColor
                          : "white",
                    }}
                  >
                    {/* Display the actual phase name, capitalized */}
                    {breathingPhase
                      .replace(/_/g, " ")
                      .split(" ")
                      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(" ")}
                  </Typography>
                  {breathingCountdown > 0 && (
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: "bold",
                        color:
                          breathingPhase === "hold" ||
                          breathingPhase === "hold_out"
                            ? themePrimaryColor
                            : "white",
                      }}
                    >
                      {breathingCountdown}
                    </Typography>
                  )}
                </BreathingCircle>
              )}

              <Typography variant="h5" sx={{ mt: 3, color: themePrimaryColor }}>
                Total Time Left:{" "}
                {Math.max(0, breathingDuration - totalTimeElapsed)}s
              </Typography>
              <Box
                sx={{
                  mt: 3,
                  display: "flex",
                  gap: 2,
                  justifyContent: "center",
                }}
              >
                {!isBreathingRunning ? (
                  // No "Start Exercise" button here if it's already shown above
                  <Button
                    variant="contained"
                    startIcon={<PlayArrow />}
                    sx={{
                      backgroundColor: themePrimaryColor,
                      "&:hover": { backgroundColor: themeButtonHoverColor },
                    }}
                    onClick={() => {
                      if (totalTimeElapsed === 0) {
                        startBreathingExercise();
                      } else {
                        resumeBreathingExercise();
                      }
                    }}
                    // This button is only relevant if resuming, hide if already showing "Start Exercise"
                    style={{ display: totalTimeElapsed === 0 ? 'none' : 'inline-flex' }}
                  >
                    Resume
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    startIcon={<Pause />}
                    sx={{
                      backgroundColor: themePrimaryColor,
                      "&:hover": { backgroundColor: themeButtonHoverColor },
                    }}
                    onClick={pauseBreathingExercise}
                  >
                    Pause
                  </Button>
                )}
                <Button
                  variant="outlined"
                  startIcon={<Stop />}
                  sx={{
                    borderColor: themePrimaryColor,
                    color: themePrimaryColor,
                    "&:hover": { backgroundColor: `${themePrimaryColor}10` },
                  }}
                  onClick={stopBreathingExercise}
                >
                  Stop
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {/* Change "Close" to "Done" only when exercise is completed or stopped */}
          {breathingPhase === "idle" &&
          (breathingDuration === 0 || totalTimeElapsed === 0) ? (
            <Button
              onClick={() => {
                setOpenBreathingDialog(false);
                resetBreathingExercise();
              }}
              sx={{ color: themePrimaryColor }}
            >
              Close
            </Button>
          ) : (
            <Button
              onClick={() => {
                stopBreathingExercise();
                setOpenBreathingDialog(false);
              }}
              sx={{ color: themePrimaryColor }}
            >
              Done
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* --- Chatbot Dialog (Re-implemented for "friend" persona) --- */}
      <Dialog
        open={openChatbotDialog}
        onClose={() => setOpenChatbotDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            backgroundColor: themePrimaryColor,
            color: "white",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            variant="body1" // FIXED: Changed from h6 to body1
            sx={{ color: "white", fontWeight: "bold" }}
          >
            Soni Mental Health Assistant
          </Typography>
          <IconButton
            onClick={() => setOpenChatbotDialog(false)}
            sx={{ color: "white" }}
          >
            <Clear />
          </IconButton>
        </DialogTitle>
        <DialogContent
          dividers
          sx={{
            display: "flex",
            flexDirection: "column",
            height: "400px",
            p: 0,
          }}
        >
          <Box sx={{ flexGrow: 1, overflowY: "auto", p: 2 }}>
            {chatHistory.length === 0 && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textAlign: "center", my: 2 }}
              >
                Hi there! I'm Soni, your empathetic listener. Feel free to share anything that's
                on your mind. I'm a safe space for you to talk.
              </Typography>
            )}
            {chatHistory.map((message, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  justifyContent:
                    message.sender === "user" ? "flex-end" : "flex-start",
                  mb: 1,
                }}
              >
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    borderRadius: 3,
                    maxWidth: "80%",
                    backgroundColor:
                      message.sender === "user"
                        ? `${themePrimaryColor}10`
                        : themeCardBackground,
                    borderColor:
                      message.sender === "user"
                        ? `${themePrimaryColor}30`
                        : themeAccentColor,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color:
                        message.sender === "user" ? themePrimaryColor : "#333",
                    }}
                    dangerouslySetInnerHTML={{
                      __html: message.text.replace(/\n/g, "<br />"),
                    }}
                  />
                </Paper>
              </Box>
            ))}
            {isChatbotTyping && (
              <Box
                sx={{ display: "flex", justifyContent: "flex-start", mb: 1 }}
              >
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    borderRadius: 3,
                    maxWidth: "80%",
                    backgroundColor: themeCardBackground,
                    borderColor: themeAccentColor,
                  }}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    fontStyle="italic"
                  >
                    Soni is typing...
                  </Typography>
                </Paper>
              </Box>
            )}
            <div ref={chatMessagesEndRef} />
          </Box>
          <Divider />
          <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1 }}>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              placeholder="Type your message..."
              value={chatInput}
              onChange={handleChatInputChange}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  "& fieldset": {
                    borderColor: themeAccentColor,
                  },
                  "&:hover fieldset": {
                    borderColor: themePrimaryColor,
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: themePrimaryColor,
                  },
                },
              }}
            />
            <Button
              variant="contained"
              onClick={handleSendMessage}
              disabled={isChatbotTyping || chatInput.trim() === ""}
              sx={{
                backgroundColor: themePrimaryColor,
                "&:hover": { backgroundColor: themeButtonHoverColor },
                borderRadius: 2,
                p: 1.5,
              }}
            >
              <Send />
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* --- Self-Care Music Dialog (YouTube Integration) --- */}
      <Dialog
        open={openSelfCareDialog}
        onClose={() => setOpenSelfCareDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle
          sx={{
            backgroundColor: themePrimaryColor,
            color: "white",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            variant="body1" // FIXED: Changed from h6 to body1
            sx={{ color: "white", fontWeight: "bold" }}
          >
            Relaxing Music & Sounds
          </Typography>
          <IconButton
            onClick={() => setOpenSelfCareDialog(false)}
            sx={{ color: "white" }}
          >
            <Clear />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ py: 3 }}>
          <Typography
            variant="body1"
            sx={{ mb: 2, textAlign: "center", color: themePrimaryColor }}
          >
            Here are some calming YouTube videos to help you relax and improve
            your well-being. Click on a video to play it.
            <br />
            <Typography
              variant="caption"
              color="error"
              sx={{ fontWeight: "bold" }}
            >
              Disclaimer: This content is for relaxation purposes only and is
              not a substitute for professional medical advice or treatment for
              conditions like sleep apnea. Please consult a healthcare
              professional for diagnosis and treatment.
            </Typography>
          </Typography>

          {/* New: Buttons to select Youtube category */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              gap: 2,
              mb: 3,
              flexWrap: "wrap",
            }}
          >
            {Object.keys(youtubeSearchQueries).map((categoryName) => (
              <Button
                key={categoryName}
                variant="outlined"
                onClick={() =>
                  fetchYoutubeVideos(youtubeSearchQueries[categoryName])
                }
                sx={{
                  borderColor: themePrimaryColor,
                  color: themePrimaryColor,
                  "&:hover": { backgroundColor: `${themePrimaryColor}10` },
                  textTransform: "none",
                }}
              >
                {categoryName}
              </Button>
            ))}
          </Box>

          {isFetchingYoutube ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "200px",
              }}
            >
              <CircularProgress sx={{ color: themePrimaryColor }} />
              <Typography sx={{ ml: 2, color: themePrimaryColor }}>
                Loading videos...
              </Typography>
            </Box>
          ) : youtubeError ? (
            <Alert severity="error" sx={{ my: 2 }}>
              {youtubeError}
            </Alert>
          ) : (
            <Grid container spacing={3} justifyContent="center">
              {youtubeVideos.length > 0 ? (
                youtubeVideos.map((video) => (
                  <Grid item xs={12} sm={6} md={6} lg={4} key={video.id}>
                    {" "}
                    {/* Adjusted grid sizes */}
                    <Paper
                      elevation={3}
                      sx={{
                        p: 1.5,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        textAlign: "center",
                        borderRadius: 2,
                        backgroundColor: themeCardBackground,
                        border: `1px solid ${themeAccentColor}`,
                        height: "100%",
                        transition: "transform 0.2s ease-in-out",
                        "&:hover": {
                          transform: "translateY(-5px)",
                          boxShadow: "0px 8px 15px rgba(0,0,0,0.1)",
                          cursor: "pointer", // Indicate clickable
                        },
                      }}
                      onClick={() => handleVideoCardClick(video)} // Handle click to open playback dialog
                    >
                      {/* Display thumbnail instead of iframe directly */}
                      <Box
                        sx={{
                          width: "100%",
                          pt: "56.25%", // 16:9 aspect ratio
                          position: "relative",
                          mb: 1.5,
                          borderRadius: "8px",
                          overflow: "hidden", // Ensure image respects border radius
                        }}
                      >
                        <img
                          src={video.thumbnail}
                          alt={video.name}
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                          onError={(e) => {
                            e.target.onerror = null; // Prevent infinite loop
                            e.target.src = `https://placehold.co/480x270/DCC8C8/780000?text=Video+Unavailable`; // Placeholder
                          }}
                        />
                        {/* Play icon overlay */}
                        <Box
                          sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            borderRadius: '50%',
                            p: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <PlayArrow sx={{ color: 'white', fontSize: 40 }} />
                        </Box>
                      </Box>

                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: "bold",
                          color: themePrimaryColor,
                          mb: 0.5,
                          fontSize: '1.1rem', // Slightly larger title for better readability
                          lineHeight: 1.3,
                          maxHeight: '2.6em', // Limit to 2 lines
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {video.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                            mb: 1,
                            fontSize: '0.9rem', // Slightly larger description
                            lineHeight: 1.4,
                            maxHeight: '4.2em', // Limit to 3 lines for more description
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                      >
                        {video.description || "No description available."}
                      </Typography>
                    </Paper>
                  </Grid>
                ))
              ) : (
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ mt: 3, textAlign: "center", width: "100%" }}
                >
                  Select a category above to find relaxing music and sounds.
                </Typography>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenSelfCareDialog(false)}
            sx={{ color: themePrimaryColor }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- YouTube Playback Dialog --- */}
      <Dialog
        open={openYoutubePlaybackDialog}
        onClose={handleCloseYoutubePlaybackDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          sx={{
            backgroundColor: themePrimaryColor,
            color: "white",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            variant="body1"
            sx={{ color: "white", fontWeight: "bold" }}
          >
            {selectedVideoForPlayback?.name || "Playing Video"}
          </Typography>
          <IconButton onClick={handleCloseYoutubePlaybackDialog} sx={{ color: "white" }}>
            <Clear />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {selectedVideoForPlayback && (
            <Box
              sx={{
                width: "100%",
                pt: "56.25%", // 16:9 Aspect Ratio
                position: "relative",
              }}
            >
              <iframe
                src={getYouTubeEmbedUrl(selectedVideoForPlayback.id)} // Use the helper function here
                title={selectedVideoForPlayback.name}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" // Ensure permissions
                allowFullScreen
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                }}
              ></iframe>
            </Box>
          )}
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ color: themePrimaryColor, mb: 1 }}>
              {selectedVideoForPlayback?.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedVideoForPlayback?.description || "No description available."}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseYoutubePlaybackDialog}
            sx={{ color: themePrimaryColor }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}