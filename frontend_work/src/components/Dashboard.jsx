
import React from "react";
import { useAuth } from "../context/AuthContext";
import { Button, Typography, Box } from "@mui/material";

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <Box sx={{ padding: 4, backgroundColor: "#fefae0", minHeight: "100vh" }}>
      <Typography variant="h4" sx={{ color: "#780000", mb: 3 }}>
        Welcome, {user?.first_name}!
      </Typography>
      <Button
        onClick={logout}
        variant="contained"
        sx={{
          backgroundColor: "#780000",
          "&:hover": { backgroundColor: "#5a0000" },
        }}
      >
        Logout
      </Button>
    </Box>
  );
}