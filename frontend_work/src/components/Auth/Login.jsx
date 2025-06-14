import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
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
  const { login, user } = useAuth(); // Destructure user from useAuth
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors
    try {
      const response = await login(email, password); // Call login without role
      // After successful login, the user state in AuthContext will be updated.
      // We can then use the updated user object to redirect.
      // This logic relies on the user object being updated by the AuthContext
      // immediately after a successful login API call.
      if (response && response.user) {
        navigate(response.user.is_therapist ? "/therapist/dashboard" : "/homepage");
      } else {
        // Fallback in case response.user is not immediately available or structured differently
        // (though AuthContext should handle setting the user state)
        console.warn("Login successful but user object not immediately available from response. Redirecting based on AuthContext user state.");
        // Use the user from AuthContext directly, which should be updated by now
        if (user && user.is_therapist) {
          navigate("/therapist/dashboard");
        } else {
          navigate("/homepage");
        }
      }
    } catch (err) {
      setError(err.error || err.message || "Invalid credentials");
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
          borderRadius: 2, // Added rounded corners
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
            variant="outlined" // Use outlined variant
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
            size="large" // Make button larger
            sx={{
              backgroundColor: "#780000",
              "&:hover": { backgroundColor: "#5a0000" },
              py: 1.5, // Padding for height
              borderRadius: 2, // Rounded corners for button
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
