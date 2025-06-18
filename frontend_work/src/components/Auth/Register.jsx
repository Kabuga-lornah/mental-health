import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Box, Button, TextField, Typography, Paper, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio } from "@mui/material";

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
  
    const processedValue = name === 'registerAsTherapist' ? value === 'therapist' : value;
    setFormData({
      ...formData,
      [name]: processedValue,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); 
    try {

      await register({ ...formData, isTherapist: formData.registerAsTherapist });

      navigate('/login');
      
    } catch (err) {
      setError(err.error || "Registration failed");
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
          Register
        </Typography>
        {error && (
          <Typography color="error" sx={{ mb: 2, textAlign: "center" }}>
            {error}
          </Typography>
        )}
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="First Name"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            sx={{ mb: 2 }}
            required
            variant="outlined" 
          />
          <TextField
            fullWidth
            label="Last Name"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            sx={{ mb: 2 }}
            required
            variant="outlined"
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            sx={{ mb: 2 }}
            required
            variant="outlined"
          />
          <TextField
            fullWidth
            label="Phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            sx={{ mb: 2 }}
            variant="outlined"
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            sx={{ mb: 3 }}
            required
            variant="outlined"
          />

          <FormControl component="fieldset" sx={{ mb: 3, width: "100%" }}>
            <FormLabel component="legend" sx={{ color: "#780000", fontWeight: "bold", mb: 1 }}>Register as:</FormLabel>
            <RadioGroup
              row
              name="registerAsTherapist"
              value={formData.registerAsTherapist ? "therapist" : "user"}
              onChange={handleChange}
              sx={{ justifyContent: "center" }}
            >
              <FormControlLabel value="user" control={<Radio sx={{ color: "#780000" }} />} label="User" />
              <FormControlLabel value="therapist" control={<Radio sx={{ color: "#780000" }} />} label="Apply as Therapist" /> {/* Changed label */}
            </RadioGroup>
          </FormControl>

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
            Register
          </Button>
        </form>
        <Typography sx={{ mt: 2, textAlign: "center" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#780000", textDecoration: "none", fontWeight: "bold" }}>
            Login
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}