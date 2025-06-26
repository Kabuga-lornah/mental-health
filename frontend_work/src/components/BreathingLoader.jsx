// frontend_work/src/components/BreathingLoader.jsx
import React from 'react';
import { Box, Typography, keyframes } from '@mui/material';
import { styled } from '@mui/system';

const breatheIn = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.5); }
  100% { transform: scale(1); }
`;

const BreathingDot = styled(Box)({
  width: '20px',
  height: '20px',
  backgroundColor: '#fefae0',
  borderRadius: '50%',
  animation: `${breatheIn} 8s infinite ease-in-out`,
  animationDelay: '0s',
});

const BreathingLoader = () => {
  const [breatheText, setBreatheText] = React.useState('Breathe In...');

  React.useEffect(() => {
    let phase = 0;
    const interval = setInterval(() => {
      if (phase === 0) {
        setBreatheText('Breathe Out...');
        phase = 1;
      } else {
        setBreatheText('Breathe In...');
        phase = 0;
      }
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(120, 0, 0, 0.9)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        color: 'white',
        textAlign: 'center',
      }}
    >
      <BreathingDot sx={{ mb: 3 }} />
      <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
        {breatheText}
      </Typography>
      <Typography variant="body1" sx={{ mt: 1, px: 2 }}>
        Please wait while the page loads...
      </Typography>
    </Box>
  );
};

export default BreathingLoader;
