// frontend_work/src/components/Auth/Register.jsx
import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import {
  Box,
  Button,
  TextField,
  Typography,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
} from "@mui/material"; // Removed Paper import

export default function Register() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone: "",
    registerAsTherapist: false,
  });
  const [error, setError] = useState("");
  const { register } = useAuth(); //
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRadioChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      registerAsTherapist: e.target.value === "therapist",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await register({ //
        ...formData,
        isTherapist: formData.registerAsTherapist,
      });

      if (response.success) { //
        navigate("/login");
      } else {
        setError(response.error || "Registration failed. Please try again."); //
      }
    } catch (err) {
      setError(err.error || err.message || "An unexpected error occurred during registration.");
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
          // No border radius or shadow directly on this box, content will define its own shape
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
            src="/reg.jpeg" // Your image for the registration section
            alt="Join Us"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover", // Ensures the image covers the area
              display: "block",
            }}
          />
        </Box>

        {/* Right Panel: Registration Form */}
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
              mb: 3, // Increased margin bottom
              textAlign: 'center',
              color: '#333', // Dark text color for contrast
            }}
          >
            Sign Up
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3, width: '100%', whiteSpace: 'pre-line' }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate style={{ width: "100%" }}>
            <TextField
              label="First Name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              fullWidth
              required
              sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
            />
            <TextField
              label="Last Name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              fullWidth
              required
              sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
            />
            <TextField
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              fullWidth
              required
              sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
            />
            <TextField
              label="Phone Number (Optional)"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              fullWidth
              sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
            />
            <TextField
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              fullWidth
              required
              sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
            />

            <FormControl component="fieldset" sx={{ mb: 3, mt: 1, width: '100%' }}>
              <FormLabel component="legend" sx={{ color: '#555', fontWeight: 'bold' }}>
                Register as:
              </FormLabel>
              <RadioGroup
                row
                name="registerAsTherapist"
                value={formData.registerAsTherapist ? "therapist" : "user"}
                onChange={handleRadioChange}
              >
                <FormControlLabel
                  value="user"
                  control={<Radio sx={{ color: '#780000' }} />} // Maroon radio button
                  label="User"
                />
                <FormControlLabel
                  value="therapist"
                  control={<Radio sx={{ color: '#780000' }} />} // Maroon radio button
                  label="Apply as Therapist"
                />
              </RadioGroup>
            </FormControl>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{
                backgroundColor: '#780000', // Maroon color
                color: '#fefae0', // Cream text
                fontWeight: 'bold',
                py: 1.5,
                borderRadius: 1, // Less rounded button
                mt: 1,
                '&:hover': {
                  backgroundColor: '#400000', // Darker maroon on hover
                },
                boxShadow: 'none', // Remove button shadow
              }}
            >
              SIGN UP
            </Button>
          </Box>

          <Typography
            variant="body2"
            sx={{ mt: 3, textAlign: "center", color: '#555' }}
          >
            Already have an account?{" "}
            <Link to="/login" style={{ color: '#780000', textDecoration: "none", fontWeight: "bold" }}> {/* Maroon link */}
              Login Here
            </Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}