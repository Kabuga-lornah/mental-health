// frontend_work/src/components/Auth/Login.jsx
import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Box, Button, TextField, Typography, Alert } from "@mui/material";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await login(email, password);

      if (response && response.user) {
        if (response.user.is_staff && response.user.is_superuser) {
          navigate("/admin/applications");
        } else if (response.user.is_therapist) {
          navigate(response.user.is_verified ? "/therapist/dashboard" : "/therapist-apply");
        } else {
          navigate("/dashboard");
        }
      } else {
        // This block might be hit if login is successful but user data isn't fully returned,
        // or if the `login` function returns success: false with a custom error message.
        setError(response.error || "Login successful, but user data not fully retrieved. Redirecting to homepage.");
        // Consider if you always want to navigate to dashboard here, or if it should be more conditional.
        // For now, keeping original logic.
        navigate("/dashboard");
      }
    } catch (err) {
      // The useAuth login function now returns an object with `success` and `error` properties.
      // The outer catch block might only be hit for network errors or unhandled exceptions.
      // The `login` function itself handles the API error and returns `success: false` with `error`.
      setError(err.error || err.message || "An unexpected error occurred during login.");
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#fefae0", // Main page background color
        p: 2,
      }}
    >
      <Box // This Box replaces the Paper and holds the two-column layout
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          width: "100%",
          maxWidth: 900,
          overflow: "hidden", // Ensures content respects boundaries
          backgroundColor: "#fefae0", // Ensure consistent background within the content area
        }}
      >
        {/* Left Panel: Image Section */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            p: { xs: 0, md: 0 }, // Removed padding for a flush image
            minHeight: { xs: 200, md: 'auto' }, // Minimum height for mobile
            backgroundColor: "#fefae0", // Match page background
          }}
        >
          <img
            src="/login%201.jpeg" // Your image for the login section
            alt="Welcome"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover", // Ensures the image covers the area
              display: "block",
            }}
          />
        </Box>

        {/* Right Panel: Login Form */}
        <Box
          sx={{
            flex: 1,
            p: { xs: 4, md: 6 }, // Padding inside the form area
            backgroundColor: "white", // White background for the form itself
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center', // Center content horizontally
          }}
        >
          <Typography
            variant="h4"
            component="h2"
            sx={{
              fontWeight: 'bold',
              mb: 4, // Increased margin bottom
              textAlign: 'center',
              color: '#333', // Dark text color for contrast
            }}
          >
            Sign In
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3, width: '100%', whiteSpace: 'pre-line' }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} style={{ width: "100%" }}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: 1 } }} // Slightly less rounded corners
              required
              variant="outlined"
            />

            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 4, '& .MuiOutlinedInput-root': { borderRadius: 1 } }} // Slightly less rounded corners
              required
              variant="outlined"
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              sx={{
                backgroundColor: '#780000', // Maroon color
                color: '#fefae0', // Cream text
                py: 1.5,
                borderRadius: 1, // Less rounded button
                fontWeight: 'bold',
                fontSize: '1.1rem',
                '&:hover': {
                  backgroundColor: '#400000', // Darker maroon on hover
                },
                boxShadow: 'none', // Remove button shadow
              }}
            >
              SIGN IN
            </Button>
          </form>

          {/* "Already have an account?" link or separator */}
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#555' }}>
              Don't have an account?{" "}
              <Link to="/register" style={{ color: '#780000', textDecoration: "none", fontWeight: "bold" }}> {/* Maroon link */}
                Sign Up Here
              </Link>
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
