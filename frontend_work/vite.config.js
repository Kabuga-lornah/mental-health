import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Ensure your build target supports import.meta.env
  build: {
    target: 'es2020', // or 'esnext' for the latest available features
  },
});
