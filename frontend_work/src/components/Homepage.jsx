import React from "react";
import { Box, Typography, Button, Container, Grid, Paper, Divider } from "@mui/material";
import { Link } from "react-router-dom";
import AIChatbot from "./AIChatbot"; // Import the new AI Chatbot component

// Navbar import is kept but handled by App.jsx's AppNavbar, so it's not directly rendered here.

// Placeholder images - consider replacing with actual, relevant images
const heroImage = "https://placehold.co/1920x1080/780000/fefae0?text=MindWell+Hero"; // Large banner image
const journalingFeatureImage = "https://placehold.co/600x400/C13F3F/fefae0?text=Smart+Journaling";
const therapistFeatureImage = "https://placehold.co/600x400/A02C2C/fefae0?text=Expert+Therapists";
const aiSupportFeatureImage = "https://placehold.co/600x400/8B0000/fefae0?text=AI+Chatbot";
const resourcesFeatureImage = "https://placehold.co/600x400/C13F3F/fefae0?text=Self-Care+Resources";
const rewardsFeatureImage = "https://placehold.co/600x400/A02C2C/fefae0?text=Rewards+Challenge";

const processImage1 = "https://placehold.co/400x300/780000/fefae0?text=Register";
const processImage2 = "https://placehold.co/400x300/780000/fefae0?text=Journal";
const processImage3 = "https://placehold.co/400x300/780000/fefae0?text=Connect";
const processImage4 = "https://placehold.co/400x300/780000/fefae0?text=Grow";

const introImage = "https://placehold.co/800x500/780000/fefae0?text=Mental+Wellness";
const journalingBenefitsImage = "https://placehold.co/800x500/A02C2C/fefae0?text=Journaling+Benefits";


export default function Homepage() {
  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "white" }}>
      {/* Hero Section */}
   

      {/* New Section: What is MindWell? & Benefits of Journaling */}
      <Box sx={{ backgroundColor: "#fefae0", py: 8 }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h4" sx={{ color: "#780000", mb: 3, fontWeight: 700 }}>
                Welcome to MindWell: Your Holistic Path to Mental Wellness
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7 }}>
                MindWell is a digital platform designed to empower individuals in Kenya to proactively manage their mental well-being. We bridge the gap between accessible self-help tools and professional mental health services, offering a seamless journey from daily emotional tracking to direct therapy. Our platform focuses on affordability, engagement, and providing comprehensive support for your healing and growth.
              </Typography>
              <Button
                component={Link}
                to="/register"
                variant="contained"
                sx={{
                  backgroundColor: "#780000",
                  color: "white",
                  '&:hover': { backgroundColor: "#5a0000" },
                  px: 4,
                  py: 1.2,
                  borderRadius: 2,
                }}
              >
                Learn More & Join
              </Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                component="img"
                src={introImage}
                alt="Welcome to MindWell"
                sx={{ width: "100%", height: 'auto', borderRadius: 3, boxShadow: '0px 8px 20px rgba(0,0,0,0.1)' }}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 8, borderColor: '#ccc' }} />

          <Grid container spacing={6} alignItems="center" direction={{ xs: 'column-reverse', md: 'row' }}>
            <Grid item xs={12} md={6}>
              <Box
                component="img"
                src={journalingBenefitsImage}
                alt="Benefits of Journaling"
                sx={{ width: "100%", height: 'auto', borderRadius: 3, boxShadow: '0px 8px 20px rgba(0,0,0,0.1)' }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h4" sx={{ color: "#780000", mb: 3, fontWeight: 700 }}>
                Unlock Your Inner World with Journaling
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.7 }}>
                Journaling is a powerful tool for self-reflection and emotional processing. With MindWell's personalized journal:
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                <Typography component="li" variant="body1" sx={{ mb: 1, lineHeight: 1.7 }}>
                  **Mood Tracking:** Intuitively log your daily emotions and visualize mood trends over time with interactive charts.
                </Typography>
                <Typography component="li" variant="body1" sx={{ mb: 1, lineHeight: 1.7 }}>
                  **Free-form Expression:** Write freely about your thoughts and feelings, using customizable prompts and tags like #anxiety or #gratitude for easy organization.
                </Typography>
                <Typography component="li" variant="body1" sx={{ mb: 1, lineHeight: 1.7 }}>
                  **Self-Discovery:** Identify emotional patterns, understand your triggers, and track your personal growth journey.
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ mt: 2, lineHeight: 1.7 }}>
                It's a simple yet profound way to gain self-understanding and take control of your mental well-being.
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section - What Makes Us Different (Horizontal Layout Emphasis) */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h4" align="center" sx={{ color: "#780000", mb: 6, fontWeight: 700 }}>
          What Makes MindWell Unique?
        </Typography>

        <Grid container spacing={4} justifyContent="center">
          {[
            {
              title: "Smart Journaling",
              desc: "Track emotions, write freely, and spot trends with smart visualizations tailored to your well-being journey.",
              img: journalingFeatureImage,
            },
            {
              title: "Real Therapists, Real Time",
              desc: "Connect with certified Kenyan therapists on demand through secure video, audio, or text sessions.",
              img: therapistFeatureImage,
            },
            {
              title: "AI-Powered Support",
              desc: "Get real-time guidance, personalized mood insights, and self-care suggestions from our intelligent chatbot.",
              img: aiSupportFeatureImage,
            },
            {
              title: "Rich Self-Care Library",
              desc: "Access a comprehensive collection of curated meditations, breathing exercises, articles, and videos to support your daily wellness.",
              img: resourcesFeatureImage,
            },
            {
              title: "Engaging Challenges & Rewards",
              desc: "Stay motivated with journaling challenges, earn badges, track progress, and unlock free therapy sessions.",
              img: rewardsFeatureImage,
            },
          ].map((item, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Paper elevation={4} sx={{
                p: 3, height: "100%", borderRadius: 3, display: 'flex', flexDirection: 'column',
                transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                '&:hover': { transform: 'translateY(-8px)', boxShadow: '0px 12px 25px rgba(0,0,0,0.2)' }
              }}>
                <Box
                  component="img"
                  src={item.img}
                  alt={item.title}
                  sx={{ width: "100%", height: 200, objectFit: "cover", borderRadius: 2, mb: 2 }}
                />
                <Typography variant="h6" sx={{ color: "#780000", mb: 1, fontWeight: 'bold' }}>
                  {item.title}
                </Typography>
                <Typography variant="body2" sx={{ flexGrow: 1, color: '#555' }}>{item.desc}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* How It Works Section */}
      <Box sx={{ backgroundColor: "white", py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" align="center" sx={{ color: "#780000", mb: 6, fontWeight: 700 }}>
            Your Journey to Well-being: How MindWell Works
          </Typography>
          <Grid container spacing={4} justifyContent="center" textAlign="center">
            {[
              {
                step: "1. Register & Personalize",
                desc: "Sign up in minutes and tailor your profile to your unique mental wellness goals and preferences.",
                icon: processImage1
              },
              {
                step: "2. Journal & Discover",
                desc: "Engage with smart journaling, track your moods, and gain insights into your emotional patterns.",
                icon: processImage2
              },
              {
                step: "3. Connect & Heal",
                desc: "Find and book sessions with certified therapists, or chat with our AI assistant for immediate support.",
                icon: processImage3
              },
              {
                step: "4. Grow & Thrive",
                desc: "Utilize self-care resources, complete challenges, and continue your path to lasting peace and resilience.",
                icon: processImage4
              },
            ].map((item, i) => (
              <Grid item xs={12} sm={6} md={3} key={i}>
                <Paper elevation={2} sx={{
                  p: 3, height: "100%", borderRadius: 3, borderBottom: '4px solid #780000',
                  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                  '&:hover': { transform: 'translateY(-5px)', boxShadow: '0px 8px 20px rgba(0,0,0,0.15)' }
                }}>
                    <Box
                        component="img"
                        src={item.icon}
                        alt={`Step ${i + 1}`}
                        sx={{ width: '80%', maxWidth: 150, height: 'auto', borderRadius: 2, mb: 2 }}
                    />
                  <Typography variant="h6" sx={{ color: "#780000", mb: 1 }}>{item.step}</Typography>
                  <Typography variant="body2">{item.desc}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Our Commitment Section - Trust and Security */}
      <Box sx={{ backgroundColor: "#fefae0", py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" align="center" sx={{ color: "#780000", mb: 6, fontWeight: 700 }}>
            Our Commitment to Your Well-being
          </Typography>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box sx={{ pr: { md: 4 } }}>
                <Typography variant="h5" sx={{ color: "#780000", mb: 2, fontWeight: 'bold' }}>
                  Your Privacy & Security, Our Priority
                </Typography>
                <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7 }}>
                  At MindWell, we understand the sensitive nature of mental health. All your data—journal entries, chat logs, and personal information—is protected with robust end-to-end encryption. We strictly adhere to Kenya's Data Protection Act, 2019, ensuring your consent is paramount in all data handling.
                </Typography>
                <Typography variant="h5" sx={{ color: "#780000", mb: 2, fontWeight: 'bold' }}>
                  Verified Professionals, Ethical Care
                </Typography>
                <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7 }}>
                  Every therapist on MindWell undergoes a rigorous vetting process and must be licensed and registered with the Counsellors and Psychologists Board (CPB) in Kenya. This ensures you receive professional, ethical, and high-quality care. Our AI assistant is a supportive tool, clearly not a substitute for professional therapy, with built-in crisis detection for immediate support.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                component="img"
                src="https://placehold.co/600x400/780000/fefae0?text=Security+and+Trust"
                alt="Security and Trust"
                sx={{ width: "100%", height: 'auto', borderRadius: 3, boxShadow: '0px 8px 20px rgba(0,0,0,0.1)' }}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Removed Stories Section as per user request */}

      {/* CTA Footer */}
      <Box sx={{ backgroundColor: "#780000", py: 6, color: "white", textAlign: "center" }}>
        <Container>
          <Typography variant="h4" sx={{ mb: 2, fontWeight: 700 }}>
            Ready to Start Your Healing Journey?
          </Typography>
          <Typography variant="h6" sx={{ mb: 4 }}>
            Join MindWell today and discover a smarter, more supported path to mental wellness.
          </Typography>
          <Button
            component={Link}
            to="/register"
            variant="contained"
            size="large"
            sx={{
              backgroundColor: "white",
              color: "#780000",
              '&:hover': { backgroundColor: "#f1f1f1", transform: 'scale(1.05)' },
              px: 5,
              py: 1.8,
              borderRadius: 5,
              fontWeight: 'bold',
              transition: 'transform 0.2s ease-in-out'
            }}
          >
            Sign Up Free
          </Button>
        </Container>
      </Box>

      {/* AI Chatbot Component */}
      <AIChatbot />
    </Box>
  );
}
