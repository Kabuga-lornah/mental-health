// frontend_work/src/components/Homepage.jsx
import React from "react";
import { Box, Typography, Button, Container, Grid, Paper, Divider, Card, CardMedia, CardContent } from "@mui/material";
import { Link } from "react-router-dom";
import AIChatbot from './AIChatbot'; // Ensure AIChatbot.jsx is in the same directory as Homepage.jsx

// Material-UI Icons
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import CreateOutlinedIcon from '@mui/icons-material/CreateOutlined';
import SelfImprovementOutlinedIcon from "@mui/icons-material/SelfImprovementOutlined";
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';

// For animations using @emotion/react's keyframes
import { keyframes } from '@emotion/react';

// Define keyframe animations (slightly toned down for subtle effect)
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

const pulse = keyframes`
  0% { transform: scale(1); box-shadow: 0 0 0 rgba(120, 0, 0, 0.3); }
  50% { transform: scale(1.01); box-shadow: 0 0 10px rgba(120, 0, 0, 0.5); }
  100% { transform: scale(1); box-shadow: 0 0 0 rgba(120, 0, 0, 0.3); }
`;

// No background zoom for video, it's typically full motion
// const heroBackgroundZoom = keyframes`
//   0% { transform: scale(1); }
//   100% { transform: scale(1.03); }
// `;

// const heroImage = "/background.jpeg"; // REMOVED - no longer needed

const brainflowerImage = "/brainflower.jpeg";
const photoImage = ""

export default function Homepage() {
  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#fdfdfd", fontFamily: 'Inter, sans-serif' }}>
      {/* Hero Section */}
      <Box
        sx={{
          // Dynamic gradient overlay for depth and vibrancy
          // This will now sit *on top* of the video
          backgroundImage: `linear-gradient(135deg, rgba(120, 0, 0, 0.85) 0%, rgba(200, 50, 50, 0.75) 100%)`,
          minHeight: "75vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
          // The overlay will act like the ::before pseudo-element did
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.3)', // A slight dark tint for contrast over video
            zIndex: 1, // Ensure overlay is above video but below content
          },
        }}
      >
        {/* Video Background */}
        <Box
          component="video"
          autoPlay
          loop
          muted
          playsInline
          src="/intro.mp4" // Path to your video in the public folder
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover", // Ensure video covers the entire area
            zIndex: 0, // Place video behind the overlay and text
            filter: 'brightness(0.7) saturate(1.1)', // Adjust brightness/saturation of the video itself
          }}
        />

        <Container maxWidth="md" sx={{ position: "relative", zIndex: 2, py: { xs: 6, md: 8 } }}>
          <Typography
            variant="h3"
            component="h1"
            sx={{
              mb: 2,
              fontWeight: 900,
              color: "white",
              fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
              textShadow: '3px 3px 10px rgba(0,0,0,0.6)',
              animation: `${fadeIn} 1s ease-out forwards`,
              animationFillMode: 'backwards',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            Your Holistic Path to Mental Wellness
          </Typography>
          <Typography
            variant="h6"
            component="p"
            sx={{
              mb: 4,
              maxWidth: "700px",
              mx: "auto",
              lineHeight: 1.6,
              color: "#f5f5f5",
              fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' },
              animation: `${fadeIn} 1.2s ease-out forwards 0.2s`,
              animationFillMode: 'backwards',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Empowering Kenyans to navigate their mental health journey with compassionate support and innovative tools.
          </Typography>
        </Container>
      </Box>

      {/* Introduction/Mission Section - MODIFIED */}
      <Box sx={{ backgroundColor: "#fff8e1", py: { xs: 6, md: 8 }, boxShadow: 'inset 0 6px 15px rgba(0,0,0,0.05)' }}> {/* Removed textAlign: 'center' */}
        <Container maxWidth="lg"> {/* Changed maxWidth to lg for more space */}
          <Grid container spacing={4} alignItems="center"> {/* Added Grid container */}
            <Grid item xs={12} md={6}> {/* Grid item for text content */}
              <Typography
                variant="h5"
                component="h2"
                sx={{
                  mb: 3,
                  fontWeight: 900,
                  color: "#780000",
                  fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.5rem' },
                  animation: `${fadeIn} 1s ease-out forwards`,
                  animationFillMode: 'backwards',
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                Bridging the Gap to Better Mental Health
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  mb: 3,
                  // Removed mx: "auto"
                  fontSize: { xs: "1rem", md: "1.1rem" },
                  lineHeight: 1.7,
                  color: "#5a5a5a",
                  maxWidth: '700px',
                  animation: `${fadeIn} 1s ease-out forwards 0.1s`,
                  animationFillMode: 'backwards',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                MindWell is a pioneering digital platform meticulously crafted to empower individuals in Kenya to proactively manage their mental well-being. We understand the unique challenges you face and are dedicated to bridging the gap between accessible self-help tools and professional mental health services.
              </Typography>
            </Grid>
            <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}> {/* Grid item for image */}
              <Box
                sx={{
                  width: '100%',
                  maxWidth: '500px', // Adjust max width as needed
                  borderRadius: 3,
                  overflow: 'hidden',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
                  animation: `${scaleIn} 1s ease-out forwards 0.5s`,
                  animationFillMode: 'backwards',
                }}
              >
                
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Connect with Certified Therapists Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
        <Paper
          elevation={8}
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: 3,
            backgroundColor: '#ffffff',
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
            transition: 'transform 0.3s cubic-bezier(.25,.8,.25,1), box-shadow 0.3s cubic-bezier(.25,.8,.25,1)',
            '&:hover': {
              transform: 'translateY(-5px) scale(1.005)',
              boxShadow: '0 12px 35px rgba(0,0,0,0.2)',
            },
            animation: `${slideInLeft} 0.8s ease-out forwards`,
            animationFillMode: 'backwards',
          }}
        >
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography
                variant="h5"
                component="h2"
                sx={{
                  color: "#780000",
                  mb: 3,
                  fontWeight: 900,
                  fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.5rem' },
                  animation: `${fadeIn} 1s ease-out forwards 0.1s`,
                  animationFillMode: 'backwards',
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                Connect with Certified Therapists
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7, fontSize: { xs: "1rem", md: "1.1rem" }, color: "#495057", animation: `${fadeIn} 1s ease-out forwards 0.2s`, animationFillMode: 'backwards', fontFamily: 'Inter, sans-serif', }}>
                When you're ready for professional support, MindWell connects you with a network of certified and vetted Kenyan therapists, making quality care accessible and convenient.
              </Typography>

              {/* Feature Boxes */}
              {[
                { icon: <LockOutlinedIcon />, title: "Secure & Convenient Sessions", desc: "Engage in therapy sessions through secure video, audio, or text, all from the comfort and privacy of your space." },
                { icon: <CheckCircleOutlineOutlinedIcon />, title: "Rigorous Vetting Process", desc: "Every therapist on our platform undergoes a thorough vetting process and must be licensed and registered with the Counsellors and Psychologists Board (CPB) in Kenya. This ensures you receive professional, ethical, and high-quality care." },
                { icon: <CalendarTodayOutlinedIcon />, title: "Flexible Options", desc: "Book free initial consultations to find the right fit or schedule paid sessions based on transparent hourly rates. Our therapists manage their availability to ensure you can find times that work for you." }
              ].map((feature, index) => (
                <Box
                  key={index}
                  sx={{
                    mb: 2.5,
                    display: 'flex',
                    alignItems: 'flex-start',
                    animation: `${slideInLeft} 0.8s ease-out forwards ${0.3 + index * 0.1}s`,
                    animationFillMode: 'backwards',
                    transition: 'transform 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateX(5px)',
                    }
                  }}
                >
                  <Typography variant="h6" sx={{ color: "#780000", mb: 1, fontWeight: 'bold', display: 'flex', alignItems: 'center', fontSize: { xs: '1.1rem', md: '1.2rem' }, fontFamily: 'Poppins, sans-serif' }}>
                    {React.cloneElement(feature.icon, { sx: { mr: 1.5, fontSize: '1.8rem', color: '#a00' } })} {feature.title}
                  </Typography>
                  <Typography variant="body1" sx={{ lineHeight: 1.6, ml: 4, color: "#6c757d", fontSize: { xs: "0.95rem", md: "1.05rem" }, fontFamily: 'Inter, sans-serif' }}>
                    {feature.desc}
                  </Typography>
                </Box>
              ))}

              <Button
                component={Link}
                to="/find-therapist"
                variant="contained"
                size="medium"
                sx={{
                  backgroundColor: "#780000",
                  color: "white",
                  '&:hover': {
                    backgroundColor: "#5a0000",
                    transform: 'scale(1.05) translateY(-2px)',
                    boxShadow: '0 8px 20px rgba(120, 0, 0, 0.5)',
                  },
                  px: 4,
                  py: 1.5,
                  borderRadius: 3,
                  fontWeight: 'bold',
                  fontSize: { xs: "1rem", md: "1.1rem" },
                  transition: 'all 0.3s cubic-bezier(.25,.8,.25,1)',
                  mt: 3,
                  animation: `${scaleIn} 1s ease-out forwards 0.8s`,
                  animationFillMode: 'backwards',
                }}
              >
                Find a Therapist
              </Button>
            </Grid>
            {/* Image for this section */}
            <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              
            </Grid>
          </Grid>
        </Paper>
      </Container>

      {/* Unlock Your Inner World with Smart Journaling Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
        <Card
          elevation={8}
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            borderRadius: 3,
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
            transition: 'transform 0.3s cubic-bezier(.25,.8,.25,1), box-shadow 0.3s cubic-bezier(.25,.8,.25,1)',
            '&:hover': {
              transform: 'translateY(-5px) scale(1.005)',
              boxShadow: '0 12px 35px rgba(0,0,0,0.2)',
            },
            animation: `${scaleIn} 0.8s ease-out forwards`,
            animationFillMode: 'backwards',
          }}
        >
          <CardMedia
            component="img"
            image={brainflowerImage}
            alt="Brain Flower representing journaling insights"
            sx={{
              width: { xs: "100%", md: "45%" },
              objectFit: "cover",
              borderRadius: { xs: '3px 3px 0 0', md: '3px 0 0 3px' },
              minHeight: { xs: '220px', md: '450px' },
              filter: 'brightness(0.9) saturate(1.1)',
              animation: `${slideInLeft} 1s ease-out forwards 0.1s`,
              animationFillMode: 'backwards',
            }}
          />
          <CardContent sx={{ p: { xs: 3, md: 5 }, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography
              variant="h5"
              component="h2"
              sx={{
                fontWeight: 900,
                color: "#780000",
                mb: 2.5,
                fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.5rem' },
                animation: `${fadeIn} 1s ease-out forwards 0.2s`,
                animationFillMode: 'backwards',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              Unlock Your Inner World with Smart Journaling
            </Typography>
            <Typography sx={{ mb: 3, color: "#555", fontSize: { xs: "1rem", md: "1.1rem" }, lineHeight: 1.7, animation: `${fadeIn} 1s ease-out forwards 0.3s`, animationFillMode: 'backwards', fontFamily: 'Inter, sans-serif' }}>
              Transform daily writing into emotional breakthroughs. Capture your moods, vent your thoughts, and track patterns that lead to healing and self-discovery.
            </Typography>
            <Divider sx={{ my: 3, borderColor: '#ddd' }} />
            {[
              { icon: <InsightsOutlinedIcon />, title: "Mood Tracking", desc: "Log daily emotions and visualize trends with beautiful, insightful charts." },
              { icon: <CreateOutlinedIcon />, title: "Free-form Expression", desc: "Write your thoughts freely or use guided prompts like #gratitude, #anxiety, and #reflection." },
              { icon: <SelfImprovementOutlinedIcon />, title: "Self-Discovery & Growth", desc: "Uncover emotional triggers, identify recurring patterns, and track your personal development journey." }
            ].map((feature, index) => (
              <Box
                key={index}
                sx={{
                  mb: 2.5,
                  display: 'flex',
                  alignItems: 'flex-start',
                  animation: `${slideInRight} 0.8s ease-out forwards ${0.4 + index * 0.1}s`,
                  animationFillMode: 'backwards',
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateX(-5px)',
                  }
                }}
              >
                {React.cloneElement(feature.icon, { sx: { color: "#780000", mr: 1.5, fontSize: '1.8rem' } })}
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: "#780000", mb: 0.5, fontSize: { xs: '1.1rem', md: '1.2rem' }, fontFamily: 'Poppins, sans-serif' }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#6c757d", fontSize: { xs: "0.95rem", md: "1.05rem" }, fontFamily: 'Inter, sans-serif' }}>
                    {feature.desc}
                  </Typography>
                </Box>
              </Box>
            ))}
            <Button
              component={Link}
              to="/journal"
              variant="contained"
              size="medium"
              sx={{
                mt: 3,
                backgroundColor: "#780000",
                color: "white",
                "&:hover": {
                  backgroundColor: "#5a0000",
                  transform: 'scale(1.05) translateY(-2px)',
                  boxShadow: '0 8px 20px rgba(120, 0, 0, 0.5)',
                },
                px: 4, py: 1.5,
                borderRadius: 3,
                fontWeight: 'bold',
                fontSize: { xs: "1rem", md: "1.1rem" },
                transition: 'all 0.3s cubic-bezier(.25,.8,.25,1)',
                animation: `${scaleIn} 1s ease-out forwards 0.8s`,
                animationFillMode: 'backwards',
              }}
            >
              Start Journaling Now
            </Button>
          </CardContent>
        </Card>
      </Container>

      {/* Personalized Support: Meditation & AI Guidance Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
        <Paper
          elevation={8}
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: 3,
            backgroundColor: '#ffffff',
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
            transition: 'transform 0.3s cubic-bezier(.25,.8,.25,1), box-shadow 0.3s cubic-bezier(.25,.8,.25,1)',
            '&:hover': {
              transform: 'translateY(-5px) scale(1.005)',
              boxShadow: '0 12px 35px rgba(0,0,0,0.2)',
            },
            animation: `${slideInRight} 0.8s ease-out forwards`,
            animationFillMode: 'backwards',
          }}
        >
          <Grid container spacing={4} alignItems="center" direction={{ xs: 'column-reverse', md: 'row' }}>
            <Grid item xs={12} md={6}>
              <Typography
                variant="h5"
                component="h2"
                sx={{
                  color: "#780000",
                  mb: 3,
                  fontWeight: 900,
                  fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.5rem' },
                  animation: `${fadeIn} 1s ease-out forwards 0.1s`,
                  animationFillMode: 'backwards',
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                Personalized Support: Meditation & AI Guidance
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7, fontSize: { xs: "1rem", md: "1.1rem" }, color: "#495057", animation: `${fadeIn} 1s ease-out forwards 0.2s`, animationFillMode: 'backwards', fontFamily: 'Inter, sans-serif' }}>
                At MindWell, we believe in providing diverse avenues for self-care and support. Our platform offers a rich library of resources and intelligent AI assistance to guide you on your wellness journey.
              </Typography>

              {/* Feature Boxes */}
              <Box
                sx={{
                  mb: 2.5,
                  animation: `${slideInRight} 0.8s ease-out forwards 0.3s`,
                  animationFillMode: 'backwards',
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateX(-5px)',
                  }
                }}
              >
                <Typography variant="h6" sx={{ color: "#780000", mb: 1, fontWeight: 'bold', display: 'flex', alignItems: 'center', fontSize: { xs: '1.1rem', md: '1.2rem' }, fontFamily: 'Poppins, sans-serif' }}>
                  <SelfImprovementOutlinedIcon sx={{ mr: 1.5, fontSize: '1.8rem', color: '#a00' }} /> Rich Self-Care & Meditation Library
                </Typography>
                <Typography variant="body1" sx={{ lineHeight: 1.6, ml: 4, color: "#6c757d", fontSize: { xs: "0.95rem", md: "1.05rem" }, fontFamily: 'Inter, sans-serif' }}>
                  Dive into our comprehensive collection of curated meditations, breathing exercises, and mindfulness techniques. Access insightful articles and videos designed to support your daily wellness journey. Our platform can even recommend personalized meditation techniques based on the insights from your journal entries.
                </Typography>
              </Box>

              <Box
                sx={{
                  mb: 3,
                  animation: `${slideInRight} 0.8s ease-out forwards 0.4s`,
                  animationFillMode: 'backwards',
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateX(-5px)',
                  }
                }}
              >
                <Typography variant="h6" sx={{ color: "#780000", mb: 1, fontWeight: 'bold', display: 'flex', alignItems: 'center', fontSize: { xs: '1.1rem', md: '1.2rem' }, fontFamily: 'Poppins, sans-serif' }}>
                  <SmartToyOutlinedIcon sx={{ mr: 1.5, fontSize: '1.8rem', color: '#a00' }}/> AI-Powered Support
                </Typography>
                <Typography variant="body1" sx={{ lineHeight: 1.6, ml: 4, color: "#6c757d", fontSize: { xs: "0.95rem", md: "1.05rem" }, fontFamily: 'Inter, sans-serif' }}>
                  Our intelligent chatbot is more than just a responder; it's your real-time companion. Get immediate guidance and self-care suggestions whenever you need them. This empathetic chatbot can offer personalized mood insights derived from your journal entries, designed to support your journey.
                </Typography>
                <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#888', mt: 1.5, ml: 4, fontSize: { xs: "0.85rem", md: "0.95rem" }, fontFamily: 'Inter, sans-serif' }}>
                  Please remember, our AI assistant is a supportive tool and not a substitute for professional medical advice or therapy. It includes built-in crisis detection to remind you to seek professional help when appropriate.
                </Typography>
              </Box>

              <Button
                component={Link}
                to="/meditation"
                variant="contained"
                size="medium"
                sx={{
                  backgroundColor: "#780000",
                  color: "white",
                  '&:hover': {
                    backgroundColor: "#5a0000",
                    transform: 'scale(1.05) translateY(-2px)',
                    boxShadow: '0 8px 20px rgba(120, 0, 0, 0.5)',
                  },
                  px: 4, py: 1.5,
                  borderRadius: 3,
                  fontWeight: 'bold',
                  fontSize: { xs: "1rem", md: "1.1rem" },
                  transition: 'all 0.3s cubic-bezier(.25,.8,.25,1)',
                  animation: `${scaleIn} 1s ease-out forwards 0.8s`,
                  animationFillMode: 'backwards',
                }}
              >
                Discover Meditation & Self-Care
              </Button>
            </Grid>
            {/* Image for this section */}
            <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
             
            </Grid>
          </Grid>
        </Paper>
      </Container>

      <AIChatbot />
    </Box>
  );
}