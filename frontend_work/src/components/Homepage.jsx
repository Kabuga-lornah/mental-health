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
import SelfImprovementOutlinedIcon from '@mui/icons-material/SelfImprovementOutlined';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';

// For animations using @emotion/react's keyframes
import { keyframes } from '@emotion/react';

// Define keyframe animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(30px); } /* Increased translateY for more visible effect */
  to { opacity: 1; transform: translateY(0); }
`;

const slideInLeft = keyframes`
  from { opacity: 0; transform: translateX(-80px); } /* Increased translateX for more visible effect */
  to { opacity: 1; transform: translateX(0); }
`;

const slideInRight = keyframes`
  from { opacity: 0; transform: translateX(80px); } /* Increased translateX for more visible effect */
  to { opacity: 1; transform: translateX(0); }
`;

const scaleIn = keyframes`
  from { opacity: 0; transform: scale(0.8); } /* More pronounced scale effect */
  to { opacity: 1; transform: scale(1); }
`;

const pulse = keyframes`
  0% { transform: scale(1); box-shadow: 0 0 0 rgba(120, 0, 0, 0.4); }
  50% { transform: scale(1.02); box-shadow: 0 0 15px rgba(120, 0, 0, 0.6); } /* More visible pulse */
  100% { transform: scale(1); box-shadow: 0 0 0 rgba(120, 0, 0, 0.4); }
`;

const heroBackgroundZoom = keyframes`
  0% { transform: scale(1); }
  100% { transform: scale(1.05); } /* Subtle zoom for hero background */
`;

const heroImage = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80";
// Changed to a placeholder URL for better compatibility.
// If you have a local 'brainflower.jpeg', ensure it's in your 'public' folder or adjust the path accordingly.
const brainflowerImage = "https://placehold.co/600x400/780000/FFFFFF?text=Brainflower+Image+Placeholder";

export default function Homepage() {
  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#fdfdfd", fontFamily: 'Inter, sans-serif' }}>
      {/* Hero Section */}
      <Box
        sx={{
          // Dynamic gradient overlay for depth and vibrancy
          backgroundImage: `linear-gradient(135deg, rgba(120, 0, 0, 0.9) 0%, rgba(200, 50, 50, 0.8) 100%)`, // Stronger gradient
          minHeight: "85vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${heroImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.35, // Increased opacity for more visual presence
            zIndex: 1,
            filter: 'brightness(0.7)', // Darken background image more
            animation: `${heroBackgroundZoom} 10s ease-in-out infinite alternate`, // Subtle zoom animation
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 2, py: { xs: 8, md: 12 } }}>
          <Typography
            variant="h2"
            component="h1"
            sx={{
              mb: 3,
              fontWeight: 900,
              color: "white",
              fontSize: { xs: '3rem', sm: '4.5rem', md: '5.5rem' }, // Even larger font sizes
              textShadow: '4px 4px 12px rgba(0,0,0,0.7)', // More pronounced shadow
              animation: `${fadeIn} 1.2s ease-out forwards`, // Longer fade-in
              animationFillMode: 'backwards',
              fontFamily: 'Poppins, sans-serif', // New font for headings
            }}
          >
            Your Holistic Path to Mental Wellness
          </Typography>
          <Typography
            variant="h5"
            component="p"
            sx={{
              mb: 5,
              maxWidth: "900px",
              mx: "auto",
              lineHeight: 1.7,
              color: "#f0f0f0", // Lighter text for contrast
              fontSize: { xs: '1.3rem', sm: '1.6rem', md: '1.9rem' }, // Larger font sizes
              animation: `${fadeIn} 1.5s ease-out forwards 0.3s`, // Delayed and longer fade-in
              animationFillMode: 'backwards',
              fontFamily: 'Inter, sans-serif', // Keep Inter for body/sub-headings
            }}
          >
            Empowering Kenyans to navigate their mental health journey with compassionate support and innovative tools.
          </Typography>
          {/* Example of an animated button, uncomment if needed */}
          {/* <Button
            component={Link}
            to="/register"
            variant="contained"
            size="large"
            sx={{
              backgroundColor: "#ff4d4d", // Brighter red for call to action
              color: "white",
              '&:hover': {
                backgroundColor: "#e60000",
                transform: 'scale(1.15) translateY(-8px)', // More dramatic hover
                boxShadow: '0 10px 30px rgba(255, 77, 77, 0.7)', // Vivid shadow on hover
              },
              px: { xs: 6, md: 8 },
              py: { xs: 2, md: 2.5 },
              borderRadius: 5,
              fontWeight: 'bold',
              fontSize: { xs: "1.2rem", md: "1.4rem" },
              transition: 'all 0.4s cubic-bezier(.25,.8,.25,1)', // Smoother, more complex transition
              boxShadow: '0 6px 20px rgba(120, 0, 0, 0.4)',
              animation: `${scaleIn} 1.2s ease-out forwards 0.6s, ${pulse} 2s infinite 2s`, // Scale-in and then pulse
              animationFillMode: 'backwards',
            }}
          >
            Start Your Journey Today
          </Button> */}
        </Container>
      </Box>

      {/* Introduction/Mission Section */}
      <Box sx={{ backgroundColor: "#fff8e1", py: { xs: 8, md: 12 }, textAlign: 'center', boxShadow: 'inset 0 8px 20px rgba(0,0,0,0.08)' }}>
        <Container maxWidth="md">
          <Typography
            variant="h4"
            component="h2"
            sx={{
              mb: 4,
              fontWeight: 900, // Bolder
              color: "#780000",
              fontSize: { xs: '2.2rem', sm: '2.8rem', md: '3.2rem' },
              animation: `${fadeIn} 1.2s ease-out forwards`,
              animationFillMode: 'backwards',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            Bridging the Gap to Better Mental Health
          </Typography>
          <Typography
            variant="body1"
            sx={{
              mb: 4,
              mx: "auto",
              fontSize: { xs: "1.15rem", md: "1.3rem" },
              lineHeight: 1.9, // Increased line height for readability
              color: "#5a5a5a",
              maxWidth: '850px',
              animation: `${fadeIn} 1.2s ease-out forwards 0.2s`,
              animationFillMode: 'backwards',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            MindWell is a pioneering digital platform meticulously crafted to empower individuals in Kenya to proactively manage their mental well-being. We understand the unique challenges you face and are dedicated to bridging the gap between accessible self-help tools and professional mental health services.
          </Typography>
        </Container>
      </Box>

      {/* Connect with Certified Therapists Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Paper
          elevation={16} // Even higher elevation for more depth
          sx={{
            p: { xs: 4, md: 8 },
            borderRadius: 5, // More rounded corners
            backgroundColor: '#ffffff',
            boxShadow: '0 20px 50px rgba(0,0,0,0.2)', // More prominent shadow
            transition: 'transform 0.4s cubic-bezier(.25,.8,.25,1), box-shadow 0.4s cubic-bezier(.25,.8,.25,1)', // Smoother transition
            '&:hover': {
              transform: 'translateY(-10px) scale(1.01)', // More dramatic lift and slight scale
              boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
            },
            animation: `${slideInLeft} 1s ease-out forwards`,
            animationFillMode: 'backwards',
          }}
        >
          <Grid container spacing={8} alignItems="center"> {/* Increased spacing */}
            <Grid item xs={12} md={6}>
              <Typography
                variant="h4"
                component="h2"
                sx={{
                  color: "#780000",
                  mb: 4,
                  fontWeight: 900,
                  fontSize: { xs: '2.2rem', sm: '2.8rem', md: '3.2rem' },
                  animation: `${fadeIn} 1.2s ease-out forwards 0.2s`,
                  animationFillMode: 'backwards',
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                Connect with Certified Therapists
              </Typography>
              <Typography variant="body1" sx={{ mb: 4, lineHeight: 1.9, fontSize: { xs: "1.15rem", md: "1.25rem" }, color: "#495057", animation: `${fadeIn} 1.2s ease-out forwards 0.4s`, animationFillMode: 'backwards', fontFamily: 'Inter, sans-serif', }}>
                When you're ready for professional support, MindWell connects you with a network of certified and vetted Kenyan therapists, making quality care accessible and convenient.
              </Typography>

              {/* Feature Boxes with more distinct animations */}
              {[
                { icon: <LockOutlinedIcon />, title: "Secure & Convenient Sessions", desc: "Engage in therapy sessions through secure video, audio, or text, all from the comfort and privacy of your space." },
                { icon: <CheckCircleOutlineOutlinedIcon />, title: "Rigorous Vetting Process", desc: "Every therapist on our platform undergoes a thorough vetting process and must be licensed and registered with the Counsellors and Psychologists Board (CPB) in Kenya. This ensures you receive professional, ethical, and high-quality care." },
                { icon: <CalendarTodayOutlinedIcon />, title: "Flexible Options", desc: "Book free initial consultations to find the right fit or schedule paid sessions based on transparent hourly rates. Our therapists manage their availability to ensure you can find times that work for you." }
              ].map((feature, index) => (
                <Box
                  key={index}
                  sx={{
                    mb: 3,
                    display: 'flex',
                    alignItems: 'flex-start',
                    animation: `${slideInLeft} 1s ease-out forwards ${0.6 + index * 0.15}s`, // Increased delay for cascade
                    animationFillMode: 'backwards',
                    transition: 'transform 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateX(10px)', // Slide right on hover
                    }
                  }}
                >
                  <Typography variant="h6" sx={{ color: "#780000", mb: 1.5, fontWeight: 'bold', display: 'flex', alignItems: 'center', fontSize: { xs: '1.2rem', md: '1.35rem' }, fontFamily: 'Poppins, sans-serif' }}>
                    {React.cloneElement(feature.icon, { sx: { mr: 2, fontSize: '2.2rem', color: '#a00' } })} {feature.title}
                  </Typography>
                  <Typography variant="body1" sx={{ lineHeight: 1.8, ml: 5, color: "#6c757d", fontSize: { xs: "1rem", md: "1.15rem" }, fontFamily: 'Inter, sans-serif' }}>
                    {feature.desc}
                  </Typography>
                </Box>
              ))}

              <Button
                component={Link}
                to="/find-therapist"
                variant="contained"
                size="large" // Make button larger
                sx={{
                  backgroundColor: "#780000",
                  color: "white",
                  '&:hover': {
                    backgroundColor: "#5a0000",
                    transform: 'scale(1.08) translateY(-4px)', // More dramatic hover
                    boxShadow: '0 10px 25px rgba(120, 0, 0, 0.6)',
                  },
                  px: 6,
                  py: 2,
                  borderRadius: 4, // Slightly more rounded
                  fontWeight: 'bold',
                  fontSize: { xs: "1.1rem", md: "1.25rem" },
                  transition: 'all 0.4s cubic-bezier(.25,.8,.25,1)',
                  mt: 5, // More margin top
                  animation: `${scaleIn} 1.2s ease-out forwards 1.2s`,
                  animationFillMode: 'backwards',
                }}
              >
                Find a Therapist
              </Button>
            </Grid>
            {/* Image for this section */}
            <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Box
                component="img"
                src="https://images.unsplash.com/photo-1576091160550-fd43750e2101?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" // Example image
                alt="Therapist session"
                sx={{
                  width: '100%',
                  maxWidth: '550px', // Slightly larger image
                  height: 'auto',
                  borderRadius: 5, // More rounded
                  boxShadow: '0 15px 40px rgba(0,0,0,0.25)', // Stronger shadow
                  animation: `${scaleIn} 1.2s ease-out forwards 0.5s`,
                  animationFillMode: 'backwards',
                }}
              />
            </Grid>
          </Grid>
        </Paper>
      </Container>

      {/* Unlock Your Inner World with Smart Journaling Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Card
          elevation={16} // Even higher elevation
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            borderRadius: 5, // More rounded
            boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
            transition: 'transform 0.4s cubic-bezier(.25,.8,.25,1), box-shadow 0.4s cubic-bezier(.25,.8,.25,1)',
            '&:hover': {
              transform: 'translateY(-10px) scale(1.01)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
            },
            animation: `${scaleIn} 1s ease-out forwards`,
            animationFillMode: 'backwards',
          }}
        >
          <CardMedia
            component="img"
            image={brainflowerImage}
            alt="Brain Flower representing journaling insights"
            sx={{
              width: { xs: "100%", md: "48%" }, // Slightly wider image
              objectFit: "cover",
              borderRadius: { xs: '5px 5px 0 0', md: '5px 0 0 5px' }, // More rounded
              minHeight: { xs: '280px', md: '550px' }, // Larger image area
              filter: 'brightness(0.85) saturate(1.2)', // Enhance image more
              animation: `${slideInLeft} 1.2s ease-out forwards 0.2s`,
              animationFillMode: 'backwards',
            }}
          />
          <CardContent sx={{ p: { xs: 4, md: 6 }, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography
              variant="h4"
              component="h2"
              sx={{
                fontWeight: 900,
                color: "#780000",
                mb: 3,
                fontSize: { xs: '2.2rem', sm: '2.8rem', md: '3.2rem' },
                animation: `${fadeIn} 1.2s ease-out forwards 0.4s`,
                animationFillMode: 'backwards',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              Unlock Your Inner World with Smart Journaling
            </Typography>
            <Typography sx={{ mb: 4, color: "#555", fontSize: { xs: "1.15rem", md: "1.25rem" }, lineHeight: 1.9, animation: `${fadeIn} 1.2s ease-out forwards 0.6s`, animationFillMode: 'backwards', fontFamily: 'Inter, sans-serif' }}>
              Transform daily writing into emotional breakthroughs. Capture your moods, vent your thoughts, and track patterns that lead to healing and self-discovery.
            </Typography>
            <Divider sx={{ my: 4, borderColor: '#ccc' }} /> {/* Thicker divider */}
            {[
              { icon: <InsightsOutlinedIcon />, title: "Mood Tracking", desc: "Log daily emotions and visualize trends with beautiful, insightful charts." },
              { icon: <CreateOutlinedIcon />, title: "Free-form Expression", desc: "Write your thoughts freely or use guided prompts like #gratitude, #anxiety, and #reflection." },
              { icon: <SelfImprovementOutlinedIcon />, title: "Self-Discovery & Growth", desc: "Uncover emotional triggers, identify recurring patterns, and track your personal development journey." }
            ].map((feature, index) => (
              <Box
                key={index}
                sx={{
                  mb: 3,
                  display: 'flex',
                  alignItems: 'flex-start',
                  animation: `${slideInRight} 1s ease-out forwards ${0.8 + index * 0.15}s`,
                  animationFillMode: 'backwards',
                  transition: 'transform 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateX(-10px)', // Slide left on hover
                  }
                }}
              >
                {React.cloneElement(feature.icon, { sx: { color: "#780000", mr: 2, fontSize: '2.2rem' } })}
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: "#780000", mb: 0.5, fontSize: { xs: '1.2rem', md: '1.35rem' }, fontFamily: 'Poppins, sans-serif' }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#6c757d", fontSize: { xs: "1rem", md: "1.15rem" }, fontFamily: 'Inter, sans-serif' }}>
                    {feature.desc}
                  </Typography>
                </Box>
              </Box>
            ))}
            <Button
              component={Link}
              to="/journal"
              variant="contained"
              size="large"
              sx={{
                mt: 5,
                backgroundColor: "#780000",
                color: "white",
                "&:hover": {
                  backgroundColor: "#5a0000",
                  transform: 'scale(1.08) translateY(-4px)',
                  boxShadow: '0 10px 25px rgba(120, 0, 0, 0.6)',
                },
                px: 6, py: 2,
                borderRadius: 4,
                fontWeight: 'bold',
                fontSize: { xs: "1.1rem", md: "1.25rem" },
                transition: 'all 0.4s cubic-bezier(.25,.8,.25,1)',
                animation: `${scaleIn} 1.2s ease-out forwards 1.2s`,
                animationFillMode: 'backwards',
              }}
            >
              Start Journaling Now
            </Button>
          </CardContent>
        </Card>
      </Container>

      {/* Personalized Support: Meditation & AI Guidance Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Paper
          elevation={16} // Even higher elevation
          sx={{
            p: { xs: 4, md: 8 },
            borderRadius: 5, // More rounded
            backgroundColor: '#ffffff',
            boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
            transition: 'transform 0.4s cubic-bezier(.25,.8,.25,1), box-shadow 0.4s cubic-bezier(.25,.8,.25,1)',
            '&:hover': {
              transform: 'translateY(-10px) scale(1.01)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
            },
            animation: `${slideInRight} 1s ease-out forwards`,
            animationFillMode: 'backwards',
          }}
        >
          <Grid container spacing={8} alignItems="center" direction={{ xs: 'column-reverse', md: 'row' }}>
            <Grid item xs={12} md={6}>
              <Typography
                variant="h4"
                component="h2"
                sx={{
                  color: "#780000",
                  mb: 4,
                  fontWeight: 900,
                  fontSize: { xs: '2.2rem', sm: '2.8rem', md: '3.2rem' },
                  animation: `${fadeIn} 1.2s ease-out forwards 0.2s`,
                  animationFillMode: 'backwards',
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                Personalized Support: Meditation & AI Guidance
              </Typography>
              <Typography variant="body1" sx={{ mb: 4, lineHeight: 1.9, fontSize: { xs: "1.15rem", md: "1.25rem" }, color: "#495057", animation: `${fadeIn} 1.2s ease-out forwards 0.4s`, animationFillMode: 'backwards', fontFamily: 'Inter, sans-serif' }}>
                At MindWell, we believe in providing diverse avenues for self-care and support. Our platform offers a rich library of resources and intelligent AI assistance to guide you on your wellness journey.
              </Typography>

              {/* Feature Boxes with more distinct animations */}
              <Box
                sx={{
                  mb: 3,
                  animation: `${slideInRight} 1s ease-out forwards 0.6s`,
                  animationFillMode: 'backwards',
                  transition: 'transform 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateX(-10px)', // Slide left on hover
                  }
                }}
              >
                <Typography variant="h6" sx={{ color: "#780000", mb: 1.5, fontWeight: 'bold', display: 'flex', alignItems: 'center', fontSize: { xs: '1.2rem', md: '1.35rem' }, fontFamily: 'Poppins, sans-serif' }}>
                  <SelfImprovementOutlinedIcon sx={{ mr: 2, fontSize: '2.2rem', color: '#a00' }} /> Rich Self-Care & Meditation Library
                </Typography>
                <Typography variant="body1" sx={{ lineHeight: 1.8, ml: 5, color: "#6c757d", fontSize: { xs: "1rem", md: "1.15rem" }, fontFamily: 'Inter, sans-serif' }}>
                  Dive into our comprehensive collection of curated meditations, breathing exercises, and mindfulness techniques. Access insightful articles and videos designed to support your daily wellness journey. Our platform can even recommend personalized meditation techniques based on the insights from your journal entries.
                </Typography>
              </Box>

              <Box
                sx={{
                  mb: 4,
                  animation: `${slideInRight} 1s ease-out forwards 0.75s`, // Increased delay
                  animationFillMode: 'backwards',
                  transition: 'transform 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateX(-10px)', // Slide left on hover
                  }
                }}
              >
                <Typography variant="h6" sx={{ color: "#780000", mb: 1.5, fontWeight: 'bold', display: 'flex', alignItems: 'center', fontSize: { xs: '1.2rem', md: '1.35rem' }, fontFamily: 'Poppins, sans-serif' }}>
                  <SmartToyOutlinedIcon sx={{ mr: 2, fontSize: '2.2rem', color: '#a00' }}/> AI-Powered Support
                </Typography>
                <Typography variant="body1" sx={{ lineHeight: 1.8, ml: 5, color: "#6c757d", fontSize: { xs: "1rem", md: "1.15rem" }, fontFamily: 'Inter, sans-serif' }}>
                  Our intelligent chatbot is more than just a responder; it's your real-time companion. Get immediate guidance and self-care suggestions whenever you need them. This empathetic chatbot can offer personalized mood insights derived from your journal entries, designed to support your journey.
                </Typography>
                <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#888', mt: 2, ml: 5, fontSize: { xs: "0.9rem", md: "1rem" }, fontFamily: 'Inter, sans-serif' }}>
                  Please remember, our AI assistant is a supportive tool and not a substitute for professional medical advice or therapy. It includes built-in crisis detection to remind you to seek professional help when appropriate.
                </Typography>
              </Box>

              <Button
                component={Link}
                to="/meditation"
                variant="contained"
                size="large"
                sx={{
                  backgroundColor: "#780000",
                  color: "white",
                  '&:hover': {
                    backgroundColor: "#5a0000",
                    transform: 'scale(1.08) translateY(-4px)',
                    boxShadow: '0 10px 25px rgba(120, 0, 0, 0.6)',
                  },
                  px: 6,
                  py: 2,
                  borderRadius: 4,
                  fontWeight: 'bold',
                  fontSize: { xs: "1.1rem", md: "1.25rem" },
                  transition: 'all 0.4s cubic-bezier(.25,.8,.25,1)',
                  animation: `${scaleIn} 1.2s ease-out forwards 1.2s`,
                  animationFillMode: 'backwards',
                }}
              >
                Discover Meditation & Self-Care
              </Button>
            </Grid>
            {/* Image for this section */}
            <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Box
                component="img"
                src="https://images.unsplash.com/photo-1554160359-216990425622?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" // Example image
                alt="Meditation and AI guidance"
                sx={{
                  width: '100%',
                  maxWidth: '550px',
                  height: 'auto',
                  borderRadius: 5,
                  boxShadow: '0 15px 40px rgba(0,0,0,0.25)',
                  animation: `${scaleIn} 1.2s ease-out forwards 0.5s`,
                  animationFillMode: 'backwards',
                }}
              />
            </Grid>
          </Grid>
        </Paper>
      </Container>

      <AIChatbot />
    </Box>
  );
}
