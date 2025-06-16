import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext"; // Corrected import path
import { useNavigate, Link } from "react-router-dom";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
} from "@mui/material";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, user: authUser } = useAuth(); // Renamed 'user' to 'authUser' for clarity
  const navigate = useNavigate(); // Hook for navigation

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors
    try {
      console.log("DEBUG: Login.jsx: Attempting login with email:", email);
      const response = await login(email, password); // Call login

      console.log("DEBUG: Login.jsx - Response from login function:", response);
      console.log("DEBUG: Login.jsx - user from response:", response?.user);

      if (response && response.user) {
        console.log("DEBUG: Login.jsx: User object from response: ", response.user);
        console.log("DEBUG: Login.jsx: is_staff: ", response.user.is_staff, "is_superuser: ", response.user.is_superuser);

        // Admin redirect - Added delay to ensure AuthContext state is updated
        if (response.user.is_staff && response.user.is_superuser) {
          console.log("DEBUG: Login.jsx - Redirecting to admin applications with navigate.");
          // Add a small delay to ensure AuthContext state is updated
          setTimeout(() => {
            navigate("/admin/applications");
          }, 300); // Increased delay to ensure AuthContext updates properly
          return; // Stop further execution
        }
        // Therapist redirect (based on verification)
        else if (response.user.is_therapist) {
          console.log("DEBUG: Login.jsx - Redirecting therapist.");
          setTimeout(() => {
            navigate(response.user.is_verified ? "/therapist/dashboard" : "/therapist-apply");
          }, 300);
        }
        // Regular user redirect
        else {
          console.log("DEBUG: Login.jsx - Redirecting regular user to homepage.");
          setTimeout(() => {
            navigate("/homepage");
          }, 300);
        }
      } else {
        console.warn("DEBUG: Login.jsx - Login successful but user object not immediately available from response. Redirecting based on AuthContext user state.");
        // Use the user from AuthContext directly, which should be updated by now
        setTimeout(() => {
          if (authUser) {
            console.log("DEBUG: Login.jsx - Fallback: user from AuthContext: ", authUser);
            console.log("DEBUG: Login.jsx - Fallback: is_staff: ", authUser.is_staff, "is_superuser: ", authUser.is_superuser);
            if (authUser.is_staff && authUser.is_superuser) {
              console.log("DEBUG: Login.jsx - Fallback: Redirecting to admin applications (from AuthContext user) with navigate.");
              navigate("/admin/applications");
              return; // Stop further execution
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
        }, 500);
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
        backgroundColor: "#fefae0",
      }}
    >
      <Paper
        elevation={3}
        sx={{
          padding: 4,
          width: "100%",
          maxWidth: "400px",
          backgroundColor: "white",
          borderRadius: 2,
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

        <form onSubmit={handleSubmit}>
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
  );
}