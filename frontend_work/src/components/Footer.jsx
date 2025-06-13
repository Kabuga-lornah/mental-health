import { Box, Typography, Link, Stack } from "@mui/material";

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        mt: 6,
        py: 3,
        px: 2,
        textAlign: "center",
        backgroundColor: "#780000",
        color: "white",
      }}
    >
      <Typography variant="body1" sx={{ fontWeight: "bold", mb: 1 }}>
        Keep writing. Keep healing.
      </Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        Your thoughts matter — this space is yours.
      </Typography>

      <Stack direction="row" spacing={3} justifyContent="center">
        <Link href="#" underline="hover" sx={{ color: "white" }}>
          About
        </Link>
        <Link href="#" underline="hover" sx={{ color: "white" }}>
          Privacy
        </Link>
        <Link href="#" underline="hover" sx={{ color: "white" }}>
          Contact
        </Link>
      </Stack>

      <Typography variant="caption" display="block" sx={{ mt: 2 }}>
        &copy; {new Date().getFullYear()} Journal Space. All rights reserved.
      </Typography>
    </Box>
  );
}
