// frontend_work/src/components/Homepage.jsx
import React from "react";
import { Box, Typography, Button, Container, Grid, Paper, Divider, Card, CardMedia, CardContent } from "@mui/material";
import { Link } from "react-router-dom";
import AIChatbot from './AIChatbot'; // Corrected import for AIChatbot

import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import CreateOutlinedIcon from '@mui/icons-material/CreateOutlined';
import SelfImprovementOutlinedIcon from '@mui/icons-material/SelfImprovementOutlined';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';

const heroImage = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80";
const brainflowerImage = "/brainflower.jpeg";

export default function Homepage() {
  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "white", fontFamily: 'Inter, sans-serif' }}>
      {/* Hero Section */}
      <Box
        sx={{
          backgroundImage: `linear-gradient(135deg, rgba(245, 245, 245, 0.9) 0%, rgba(235, 235, 234, 0.9) 100%)`,
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
            opacity: 0.2,
            zIndex: 1,
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 2, py: { xs: 8, md: 12 } }}>
          <Typography
            variant="h2"
            component="h1"
            sx={{
              mb: 3,
              fontWeight: 800,
              color: "white",
              fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
              textShadow: '2px 2px 8px rgba(0,0,0,0.4)'
            }}
          >
            Your Holistic Path to Mental Wellness
          </Typography>
          <Typography
            variant="h5"
            component="p"
            sx={{
              mb: 5,
              maxWidth: "800px",
              mx: "auto",
              lineHeight: 1.6,
              color: "#000000",
              fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' }
            }}
          >
            Empowering Kenyans to navigate their mental health journey with compassionate support and innovative tools.
          </Typography>
          
          {/* <Button
            component={Link}
            to="/register"
            variant="contained"
            size="large"
            sx={{
              backgroundColor: "#780000",
              color: "white",
              '&:hover': { backgroundColor: "#5a0000", transform: 'scale(1.05)' },
              px: { xs: 5, md: 6 },
              py: { xs: 1.5, md: 2 },
              borderRadius: 5,
              fontWeight: 'bold',
              fontSize: { xs: "1rem", md: "1.1rem" },
              transition: 'transform 0.3s ease-in-out, background-color 0.3s ease-in-out',
              boxShadow: '0 6px 20px rgba(120, 0, 0, 0.4)'
            }}
          >
            Start Your Journey Today
          </Button> */}
        </Container>
      </Box>

      {/* Introduction/Mission Section (New) */}
      <Box sx={{ backgroundColor: "#fefae0", py: { xs: 6, md: 10 }, textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography
            variant="h4"
            component="h2"
            sx={{
              mb: 4,
              fontWeight: 700,
              color: "#780000",
              fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.5rem' }
            }}
          >
            Bridging the Gap to Better Mental Health
          </Typography>
          <Typography
            variant="body1"
            sx={{
              mb: 4,
              mx: "auto",
              fontSize: { xs: "1rem", md: "1.15rem" },
              lineHeight: 1.7,
              color: "#495057",
              maxWidth: '800px'
            }}
          >
            MindWell is a pioneering digital platform meticulously crafted to empower individuals in Kenya to proactively manage their mental well-being. We understand the unique challenges you face and are dedicated to bridging the gap between accessible self-help tools and professional mental health services.
          </Typography>
        </Container>
      </Box>

      {/* Connect with Certified Therapists Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Paper elevation={8} sx={{ p: { xs: 4, md: 8 }, borderRadius: 4, backgroundColor: '#ffffff', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography
                variant="h4"
                component="h2"
                sx={{
                  color: "#780000",
                  mb: 4,
                  fontWeight: 700,
                  fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.5rem' }
                }}
              >
                Connect with Certified Therapists
              </Typography>
              <Typography variant="body1" sx={{ mb: 4, lineHeight: 1.7, fontSize: { xs: "1rem", md: "1.1rem" }, color: "#495057" }}>
                When you're ready for professional support, MindWell connects you with a network of certified and vetted Kenyan therapists, making quality care accessible and convenient.
              </Typography>

              {/* Feature Boxes */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ color: "#780000", mb: 1.5, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                  <LockOutlinedIcon sx={{ mr: 1.5, fontSize: '1.8rem' }} /> Secure & Convenient Sessions
                </Typography>
                <Typography variant="body1" sx={{ lineHeight: 1.7, ml: 4, color: "#6c757d" }}>
                  Engage in therapy sessions through secure video, audio, or text, all from the comfort and privacy of your space.
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ color: "#780000", mb: 1.5, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                  <CheckCircleOutlineOutlinedIcon sx={{ mr: 1.5, fontSize: '1.8rem' }} /> Rigorous Vetting Process
                </Typography>
                <Typography variant="body1" sx={{ lineHeight: 1.7, ml: 4, color: "#6c757d" }}>
                  Every therapist on our platform undergoes a thorough vetting process and must be licensed and registered with the Counsellors and Psychologists Board (CPB) in Kenya. This ensures you receive professional, ethical, and high-quality care.
                </Typography>
              </Box>

              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ color: "#780000", mb: 1.5, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                  <CalendarTodayOutlinedIcon sx={{ mr: 1.5, fontSize: '1.8rem' }} /> Flexible Options
                </Typography>
                <Typography variant="body1" sx={{ lineHeight: 1.7, ml: 4, color: "#6c757d" }}>
                  Book free initial consultations to find the right fit or schedule paid sessions based on transparent hourly rates. Our therapists manage their availability to ensure you can find times that work for you.
                </Typography>
              </Box>

              <Button
                component={Link}
                to="/find-therapist"
                variant="contained"
                sx={{
                  backgroundColor: "#780000",
                  color: "white",
                  '&:hover': { backgroundColor: "#5a0000", transform: 'scale(1.05)' },
                  px: 4,
                  py: 1.5,
                  borderRadius: 3,
                  fontWeight: 'bold',
                  transition: 'transform 0.2s ease-in-out',
                }}
              >
                Find a Therapist
              </Button>
            </Grid>
            
          </Grid>
        </Paper>
      </Container>

      {/* Unlock Your Inner World with Smart Journaling Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Card elevation={8} sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, borderRadius: 4, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
          <CardMedia
            component="img"
            image={brainflowerImage}
            alt="Brain Flower representing journaling insights"
            sx={{
              width: { xs: "100%", md: "45%" },
              objectFit: "cover",
              borderRadius: { xs: '4px 4px 0 0', md: '4px 0 0 4px' },
              minHeight: { xs: '200px', md: '450px' }
            }}
          />
          <CardContent sx={{ p: { xs: 4, md: 6 }, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography
              variant="h4"
              component="h2"
              sx={{
                fontWeight: 700,
                color: "#780000",
                mb: 3,
                fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.5rem' }
              }}
            >
              Unlock Your Inner World with Smart Journaling
            </Typography>
            <Typography sx={{ mb: 4, color: "#555", fontSize: { xs: "1rem", md: "1.1rem" }, lineHeight: 1.8 }}>
              Transform daily writing into emotional breakthroughs. Capture your moods, vent your thoughts, and track patterns that lead to healing and self-discovery.
            </Typography>
            <Divider sx={{ my: 3 }} />
            {[
              { icon: <InsightsOutlinedIcon sx={{ color: "#780000", mr: 1.5, fontSize: '1.8rem' }} />, title: "Mood Tracking", desc: "Log daily emotions and visualize trends with beautiful, insightful charts." },
              { icon: <CreateOutlinedIcon sx={{ color: "#780000", mr: 1.5, fontSize: '1.8rem' }} />, title: "Free-form Expression", desc: "Write your thoughts freely or use guided prompts like #gratitude, #anxiety, and #reflection." },
              { icon: <SelfImprovementOutlinedIcon sx={{ color: "#780000", mr: 1.5, fontSize: '1.8rem' }} />, title: "Self-Discovery & Growth", desc: "Uncover emotional triggers, identify recurring patterns, and track your personal development journey." }
            ].map((feature, index) => (
              <Box key={index} sx={{ mb: 3, display: 'flex', alignItems: 'flex-start' }}>
                {feature.icon}
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: "#780000", mb: 0.5 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#6c757d" }}>
                    {feature.desc}
                  </Typography>
                </Box>
              </Box>
            ))}
            <Button
              component={Link}
              to="/journal"
              variant="contained"
              sx={{
                mt: 4,
                backgroundColor: "#780000",
                color: "white",
                "&:hover": { backgroundColor: "#5a0000", transform: 'scale(1.05)' },
                px: 4, py: 1.5,
                borderRadius: 3,
                fontWeight: 'bold',
                transition: 'transform 0.2s ease-in-out',
              }}
            >
              Start Journaling Now
            </Button>
          </CardContent>
        </Card>
      </Container>

      {/* Personalized Support: Meditation & AI Guidance Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Paper elevation={8} sx={{ p: { xs: 4, md: 8 }, borderRadius: 4, backgroundColor: '#ffffff', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
          <Grid container spacing={6} alignItems="center" direction={{ xs: 'column-reverse', md: 'row' }}>
            <Grid item xs={12} md={6}>
              <Typography
                variant="h4"
                component="h2"
                sx={{
                  color: "#780000",
                  mb: 4,
                  fontWeight: 700,
                  fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.5rem' }
                }}
              >
                Personalized Support: Meditation & AI Guidance
              </Typography>
              <Typography variant="body1" sx={{ mb: 4, lineHeight: 1.7, fontSize: { xs: "1rem", md: "1.1rem" }, color: "#495057" }}>
                At MindWell, we believe in providing diverse avenues for self-care and support. Our platform offers a rich library of resources and intelligent AI assistance to guide you on your wellness journey.
              </Typography>

              {/* Feature Boxes */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ color: "#780000", mb: 1.5, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                  <SelfImprovementOutlinedIcon sx={{ mr: 1.5, fontSize: '1.8rem' }} /> Rich Self-Care & Meditation Library
                </Typography>
                <Typography variant="body1" sx={{ lineHeight: 1.7, ml: 4, color: "#6c757d" }}>
                  Dive into our comprehensive collection of curated meditations, breathing exercises, and mindfulness techniques. Access insightful articles and videos designed to support your daily wellness journey. Our platform can even recommend personalized meditation techniques based on the insights from your journal entries.
                </Typography>
              </Box>

              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ color: "#780000", mb: 1.5, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                  <SmartToyOutlinedIcon sx={{ mr: 1.5, fontSize: '1.8rem' }} /> AI-Powered Support
                </Typography>
                <Typography variant="body1" sx={{ lineHeight: 1.7, ml: 4, color: "#6c757d" }}>
                  Our intelligent chatbot is more than just a responder; it's your real-time companion. Get immediate guidance and self-care suggestions whenever you need them. This empathetic chatbot can offer personalized mood insights derived from your journal entries, designed to support your journey.
                </Typography>
                <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#666', mt: 2, ml: 4 }}>
                  Please remember, our AI assistant is a supportive tool and not a substitute for professional medical advice or therapy. It includes built-in crisis detection to remind you to seek professional help when appropriate.
                </Typography>
              </Box>

              <Button
                component={Link}
                to="/meditation"
                variant="contained"
                sx={{
                  backgroundColor: "#780000",
                  color: "white",
                  '&:hover': { backgroundColor: "#5a0000", transform: 'scale(1.05)' },
                  px: 4,
                  py: 1.5,
                  borderRadius: 3,
                  fontWeight: 'bold',
                  transition: 'transform 0.2s ease-in-out',
                }}
              >
                Discover Meditation & Self-Care
              </Button>
            </Grid>
           
          </Grid>
        </Paper>
      </Container>

      <AIChatbot />
    </Box>
  );
}