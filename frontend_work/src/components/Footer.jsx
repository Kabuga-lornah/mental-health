// File: kabuga-lornah/mental-health/mental-health-aaa15d5fed6b7d8daea3e72a8c1d563f64a15561/frontend_work/src/components/Footer.jsx
import { Box, Typography, Link, Stack, TextField, Button, Grid, Divider, IconButton } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { styled } from '@mui/system';
import { Email, Phone, LocationOn, Facebook, Twitter, Instagram, LinkedIn } from '@mui/icons-material';

// Theme colors
const themePrimaryColor = "#780000";
const themeLightBackground = "#fefae0";
const themeButtonHoverColor = "#5a0000";
const themeSecondaryColor = "#8b0000";

// Styled component for the main footer container
const FooterContainer = styled(Box)({
  background: `linear-gradient(135deg, ${themePrimaryColor} 0%, ${themeSecondaryColor} 50%, #4a0000 100%)`,
  position: 'relative',
  overflow: 'hidden',
});

// Styled component for enhanced text fields
const StyledTextField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: 'white',
    height: '35px',
    fontSize: '0.8rem',
    '& fieldset': {
      borderColor: 'rgba(255,255,255,0.3)',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(255,255,255,0.6)',
    },
    '&.Mui-focused fieldset': {
      borderColor: themeLightBackground,
    },
  },
  '& .MuiInputBase-input::placeholder': {
    color: 'rgba(255,255,255,0.8)',
    opacity: 1,
  },
});

// Styled component for enhanced button
const StyledButton = styled(Button)({
  backgroundColor: themeLightBackground,
  color: themePrimaryColor,
  fontWeight: 'bold',
  borderRadius: '8px',
  padding: '6px 14px',
  textTransform: 'none',
  fontSize: '0.8rem',
  height: '35px',
  '&:hover': {
    backgroundColor: '#ffffff',
  },
});

// Styled component for footer links
const StyledLink = styled(Link)({
  color: themeLightBackground,
  textDecoration: 'none',
  fontSize: '0.78rem',
  fontWeight: '400',
  transition: 'color 0.3s ease',
  '&:hover': {
    color: 'white',
  },
});

// Styled component for social media icons
const SocialIconButton = styled(IconButton)({
  color: themeLightBackground,
  backgroundColor: 'rgba(255,255,255,0.1)',
  margin: '0 8px',
  padding: '6px',
  '&:hover': {
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: 'white',
  },
});

export default function Footer() {
  return (
    <FooterContainer
      component="footer"
      sx={{
        mt: 0,
        py: 3,
        px: { xs: 2, sm: 6, md: 10 }, // Increased horizontal padding for wider distribution
        textAlign: "left", // Keep text align left within columns
        color: "white",
        position: 'relative',
      }}
    >
      {/* Main Footer Content */}
      <Box sx={{ position: 'relative', zIndex: 1 }}>

        {/* Four-Column Layout (Adjusted for distribution) */}
        <Grid
          container
          spacing={{ xs: 2, sm: 4 }} // Adjusted spacing for better fit
          justifyContent="space-between" // Distribute items evenly
          sx={{ mb: 4 }}
        >
          {/* Column 0: Logo/Company */}
          <Grid item xs={12} sm={3} md={2.5}> {/* Adjusted md size slightly */}
            <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: "600",
                  mb: 0.5,
                  fontFamily: 'Poppins, sans-serif',
                  color: 'white',
                  fontSize: '1rem',
                }}
              >
                MINDWELL
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: themeLightBackground,
                  opacity: 0.9,
                  fontSize: '0.75rem',
                }}
              >
                Your Wellness Journey
              </Typography>
            </Box>
          </Grid>

          {/* Column 1: Navigation Links */}
          <Grid item xs={12} sm={3} md={2.5}> {/* Adjusted md size slightly */}
            <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 'bold',
                  mb: 1,
                  color: 'white',
                  fontSize: '0.8rem',
                }}
              >
                Quick Links
              </Typography>
              <Stack direction="column" spacing={0.5} alignItems={{ xs: 'center', sm: 'flex-start' }}>
                <StyledLink component={RouterLink} to="/homepage">
                  About MindWell
                </StyledLink>
                <StyledLink component={RouterLink} to="/journal">
                  Start Journaling
                </StyledLink>
                <StyledLink component={RouterLink} to="/meditation">
                  Meditation Hub
                </StyledLink>
                <StyledLink component={RouterLink} to="/find-therapist">
                  Find a Therapist
                </StyledLink>
                <StyledLink component={RouterLink} to="/therapist-apply">
                  Become a Therapist
                </StyledLink>
              </Stack>
            </Box>
          </Grid>

          {/* Column 2: Services */}
          <Grid item xs={12} sm={3} md={2.5}> {/* Adjusted md size slightly */}
            <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 'bold',
                  mb: 1,
                  color: 'white',
                  fontSize: '0.8rem',
                }}
              >
                Services
              </Typography>
              <Stack direction="column" spacing={0.5} alignItems={{ xs: 'center', sm: 'flex-start' }}>
                <StyledLink href="#">Mental Health Blog</StyledLink>
                <StyledLink href="#">Online Therapy</StyledLink>
                <StyledLink href="#">Workshops</StyledLink>
                <StyledLink href="#">Support Groups</StyledLink>
              </Stack>
            </Box>
          </Grid>

          {/* Column 3: Support */}
          <Grid item xs={12} sm={3} md={2.5}> {/* Adjusted md size slightly */}
            <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 'bold',
                  mb: 1,
                  color: 'white',
                  fontSize: '0.8rem',
                }}
              >
                Support
              </Typography>
              <Stack direction="column" spacing={0.5} alignItems={{ xs: 'center', sm: 'flex-start' }}>
                <StyledLink href="#">FAQs</StyledLink>
                <StyledLink href="#">Contact Us</StyledLink>
                <StyledLink href="#">Help Center</StyledLink>
              </Stack>
            </Box>
          </Grid>
        </Grid>

        {/* Divider */}
        <Divider
          sx={{
            my: 3,
            borderColor: 'rgba(255,255,255,0.2)',
          }}
        />

        {/* Social Media Section (Centered) */}
        <Box sx={{ mb: 2, textAlign: 'center' }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 2 }}>
            <SocialIconButton>
              <Facebook fontSize="small" />
            </SocialIconButton>
            <SocialIconButton>
              <Twitter fontSize="small" />
            </SocialIconButton>
            <SocialIconButton>
              <Instagram fontSize="small" />
            </SocialIconButton>
            <SocialIconButton>
              <LinkedIn fontSize="small" />
            </SocialIconButton>
          </Box>
        </Box>

        {/* Copyright Section (Centered) */}
        <Box
          sx={{
            textAlign: 'center',
            opacity: 0.8,
            pt: 0.5,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: themeLightBackground,
              fontSize: '0.7rem',
            }}
          >
            &copy; {new Date().getFullYear()} MindWell. All rights reserved.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 0.5 }}>
            <Link
              href="#"
              sx={{
                color: themeLightBackground,
                fontSize: '0.7rem',
                textDecoration: 'none',
                '&:hover': { color: 'white' },
              }}
            >
              Privacy Policy
            </Link>
            <Link
              href="#"
              sx={{
                color: themeLightBackground,
                fontSize: '0.7rem',
                textDecoration: 'none',
                '&:hover': { color: 'white' },
              }}
            >
              Terms of Service
            </Link>
          </Box>
        </Box>
      </Box>
    </FooterContainer>
  );
}