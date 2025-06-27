import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
} from "@mui/material";

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
  const { register } = useAuth();
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
      await register({
        ...formData,
        isTherapist: formData.registerAsTherapist,
      });
      navigate("/login");
    } catch (err) {
      setError(err.error || "Registration failed");
    }
  };

  return (
    <Box
      sx={{
        backgroundColor: "#FFF9DC",
        minHeight: "100vh",
        py: 8,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          px: 2,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            width: "100%",
            maxWidth: 800,
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          {/* Image Section */}
          <Box
            sx={{
              width: { xs: "100%", md: 380 },
              height: { xs: 200, md: "auto" },
              flexShrink: 0,
              background: "#222",
            }}
          >
            <img
              src="/reg.jpeg"
              alt="Register Visual"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          </Box>

          {/* Registration Form Section */}
          <Box sx={{ flex: 1, p: 4, minWidth: 0 }}>
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={{ fontWeight: "bold", color: "#7b1818", textAlign: "center" }}
            >
              Register
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <TextField
                label="First Name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                fullWidth
                required
                sx={{ mb: 2 }}
              />
              <TextField
                label="Last Name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                fullWidth
                required
                sx={{ mb: 2 }}
              />
              <TextField
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                fullWidth
                required
                sx={{ mb: 2 }}
              />
              <TextField
                label="Phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                fullWidth
                sx={{ mb: 2 }}
              />
              <TextField
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                fullWidth
                required
                sx={{ mb: 2 }}
              />

              <FormControl component="fieldset" sx={{ mb: 2 }}>
                <FormLabel component="legend" sx={{ color: "#7b1818", mb: 1 }}>
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
                    control={<Radio />}
                    label="User"
                  />
                  <FormControlLabel
                    value="therapist"
                    control={<Radio />}
                    label="Apply as Therapist"
                  />
                </RadioGroup>
              </FormControl>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{
                  backgroundColor: "#7b1818",
                  color: "#fff",
                  fontWeight: "bold",
                  py: 1.5,
                  mt: 1,
                  mb: 1,
                  "&:hover": {
                    backgroundColor: "#5c1313",
                  },
                }}
              >
                REGISTER
              </Button>
            </Box>

            <Typography
              variant="body2"
              sx={{ mt: 2, textAlign: "center" }}
              color="text.secondary"
            >
              Already have an account?{" "}
              <Link to="/login" style={{ color: "#7b1818", fontWeight: "bold" }}>
                Login
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
