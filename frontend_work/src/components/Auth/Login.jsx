import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Box, Button, TextField, Typography, Paper } from "@mui/material";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, user: authUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      console.log("DEBUG: Login.jsx: Attempting login with email:", email);
      const response = await login(email, password);

      console.log("DEBUG: Login.jsx - Response from login function:", response);

      if (response && response.user) {
        console.log("DEBUG: Login.jsx: User object from response: ", response.user);
        console.log("DEBUG: Login.jsx: is_staff: ", response.user.is_staff, "is_superuser: ", response.user.is_superuser);

        // Admin redirect
        if (response.user.is_staff && response.user.is_superuser) {
          console.log("DEBUG: Login.jsx - Redirecting to admin applications with navigate.");
          navigate("/admin/applications");
          return;
        }
        // Therapist redirect
        else if (response.user.is_therapist) {
          console.log("DEBUG: Login.jsx - Redirecting therapist.");
          navigate(authUser.is_verified ? "/therapist/dashboard" : "/therapist-apply");
        }
        // Regular user redirect
        else {
          console.log("DEBUG: Login.jsx - Redirecting regular user to homepage.");
          navigate("/homepage");
        }
      } else {
        console.warn("DEBUG: Login.jsx - Login successful but user object not immediately available from response. Redirecting based on AuthContext user state.");

        if (authUser) {
          console.log("DEBUG: Login.jsx - Fallback: user from AuthContext: ", authUser);
          if (authUser.is_staff && authUser.is_superuser) {
            console.log("DEBUG: Login.jsx - Fallback: Redirecting to admin applications (from AuthContext user) with navigate.");
            navigate("/admin/applications");
            return;
          } else if (authUser.is_therapist) {
            console.log("DEBUG: Login.jsx - Fallback: Redirecting therapist (from AuthContext user).");
            navigate(authUser.is_verified ? "/therapist/dashboard" : "/therapist-apply");
          } else {
            console.log("DEBUG: Login.jsx - Fallback: Redirecting regular user to homepage (from AuthContext user).");
            navigate("/homepage");
          }
        } else {
          console.log("DEBUG: Login.jsx - Fallback: No user in AuthContext. Defaulting to homepage.");
          navigate("/homepage");
        }
      }
    } catch (err) {
      setError(err.error || err.message || "Invalid credentials");
      console.error("DEBUG: Login.jsx - Login error:", err);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#fefae0", // Main background color
        p: 3, // Keep some padding around the whole unit
      }}
    >
      {/* Container for Image and Form */}
      <Box
        sx={{
          display: "flex",
          boxShadow: 3, // Apply shadow to the combined unit
          borderRadius: 2, // Apply border radius to the combined unit
          overflow: "hidden", // Ensure border radius clips content
          maxWidth: "900px", // Max width for the combined unit
          width: "100%", // Take full width up to maxWidth
        }}
      >
        {/* Image Section */}
        <Box
          sx={{
            flex: 1, // Allows the image section to take available space
            display: { xs: "none", md: "flex" }, // Hide on small screens, show on medium and up
            justifyContent: "center", // Center image horizontally within its box
            alignItems: "center", // Center image vertically within its box
            // We'll let the content define its own width based on objectFit
            minWidth: "400px", // Minimum width for the image section
            // height is derived from the image or from the form's height
            backgroundColor: "white", // Background for the image side (if image doesn't fill entirely)
          }}
        >
          <img
            src="/login%201.jpeg" // Path to your image in the public folder
            alt="Your mental health" // Alt text for accessibility
            style={{
              maxWidth: "100%", // Image will scale down to fit its container
              height: "auto", // Maintain aspect ratio
              objectFit: "contain", // Crucial: Resizes to fit without cropping
              display: "block",
              // Optional: Set a specific height for the image if you want to control its vertical space
              // For example: height: '450px',
            }}
          />
        </Box>

        {/* Login Form Section */}
        <Paper
          elevation={0} // No shadow on the paper itself as the parent Box has it
          sx={{
            padding: 4,
            width: "100%",
            maxWidth: "400px", // Keeps the form's max width for good readability
            backgroundColor: "rgba(255, 255, 255, 0.7)", // Make the form transparent
            borderRadius: 0, // No border radius on the paper itself
            flexShrink: 0, // Prevent the form from shrinking
            display: "flex",
            flexDirection: "column",
            justifyContent: "center", // Vertically center content inside the form
            alignItems: "center", // Horizontally center content inside the form
            py: { xs: 4, md: 6 }, // Add more vertical padding for overall height
          }}
        >
          <Typography variant="h4" sx={{ color: "#780000", mb: 3, textAlign: "center", fontWeight: "bold" }}>
            Login
          </Typography>

          {error && (
            <Typography color="error" sx={{ mb: 2, textAlign: "center" }}>
              {error}
            </Typography>
          )}

          <form onSubmit={handleSubmit} style={{ width: "100%" }}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 2 }}
              required
              variant="outlined"
            />

            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 3 }}
              required
              variant="outlined"
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              sx={{
                backgroundColor: "#780000",
                "&:hover": { backgroundColor: "#5a0000" },
                py: 1.5,
                borderRadius: 2,
              }}
            >
              Login
            </Button>
          </form>

          <Typography sx={{ mt: 2, textAlign: "center" }}>
            Don't have an account?{" "}
            <Link to="/register" style={{ color: "#780000", textDecoration: "none", fontWeight: "bold" }}>
              Register
            </Link>
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}