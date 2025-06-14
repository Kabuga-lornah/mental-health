import React from "react";
import { Box, Typography, Button, Container, Grid, Paper } from "@mui/material";
import { Link } from "react-router-dom";
import Navbar from "./Navbar";

const heroImage = "/images/hero-image.jpg";
const feature1Image = "/images/feature1.jpg";
const feature2Image = "/images/feature2.jpg";
const feature3Image = "/images/feature3.jpg";

export default function Homepage() {
  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "white" }}>
   

      {/* Hero Section */}
      <Box
        sx={{
          backgroundImage: `linear-gradient(rgba(120, 0, 0, 0.6), rgba(120, 0, 0, 0.6)), url(${heroImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          height: "90vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          color: "white",
          px: 2
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h2" sx={{ fontWeight: 700, mb: 2 }}>
            Discover Your Path to Peace
          </Typography>
          <Typography variant="h6" sx={{ mb: 4 }}>
            A smarter way to journal, heal, and grow – powered by AI, guided by therapists, built for Kenya.
          </Typography>
          <Button
            component={Link}
            to="/register"
            variant="contained"
            size="large"
            sx={{ backgroundColor: "white", color: "#780000", '&:hover': { backgroundColor: "#f5f5f5" } }}
          >
            Join Now
          </Button>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h4" align="center" sx={{ color: "#780000", mb: 6 }}>
          What Makes Us Different
        </Typography>

        <Grid container spacing={4}>
          {[{
            title: "Smart Journaling",
            desc: "Track emotions, write freely, and spot trends with smart visualizations.",
            img: feature1Image
          }, {
            title: "Real Therapists, Real Time",
            desc: "Meet certified professionals on demand through secure sessions.",
            img: feature2Image
          }, {
            title: "AI-Powered Support",
            desc: "Get real-time guidance, mood insights, and care suggestions from our chatbot.",
            img: feature3Image
          }].map((item, i) => (
            <Grid xs={12} md={4} key={i}>
              <Paper elevation={4} sx={{ p: 3, height: "100%", borderRadius: 3 }}>
                <Box
                  component="img"
                  src={item.img}
                  alt={item.title}
                  sx={{ width: "100%", height: 220, objectFit: "cover", borderRadius: 2, mb: 2 }}
                />
                <Typography variant="h6" sx={{ color: "#780000", mb: 1 }}>
                  {item.title}
                </Typography>
                <Typography>{item.desc}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Stories Section */}
      <Box sx={{ backgroundColor: "#f9f9f9", py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" align="center" sx={{ color: "#780000", mb: 5 }}>
            Stories That Inspire
          </Typography>
          <Grid container spacing={4}>
            {["I found peace after years of anxiety.", "My therapist helped me rediscover myself.", "The AI assistant saved me during a tough night."].map((story, index) => (
              <Grid xs={12} md={4} key={index}>
                <Paper elevation={2} sx={{ p: 4, borderLeft: "5px solid #780000", height: "100%" }}>
                  <Typography variant="body1" sx={{ mb: 2, fontStyle: "italic" }}>
                    "{story}"
                  </Typography>
                  <Typography variant="subtitle2" sx={{ color: "#780000" }}>
                    – MindWell User
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Footer */}
      <Box sx={{ backgroundColor: "#780000", py: 6, color: "white", textAlign: "center" }}>
        <Container>
          <Typography variant="h4" sx={{ mb: 2 }}>
            Start Your Healing Journey Today
          </Typography>
          <Button
            component={Link}
            to="/register"
            variant="contained"
            sx={{ backgroundColor: "white", color: "#780000", '&:hover': { backgroundColor: "#f1f1f1" }, px: 4, py: 1.5 }}
          >
            Sign Up Free
          </Button>
        </Container>
      </Box>
    </Box>
  );
}