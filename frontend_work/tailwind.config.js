// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        maroon: {
          50: '#FDF3F3',
          100: '#FBE8E8',
          200: '#F5D0D0',
          300: '#EEB8B8',
          400: '#E7A0A0',
          500: '#E08888',
          600: '#D97070',
          700: '#B00000', // Darker maroon for primary use
          800: '#780000', // Your main maroon
          900: '#400000',
        },
        cream: {
          50: '#fdfdfd', // Your lightest cream background
          100: '#fff8e1', // Your main cream background
          200: '#f7edcc',
          300: '#f0e2b8',
          400: '#e9d7a3',
          500: '#e2cc8f',
          600: '#d9c07b',
          700: '#d0b467',
          800: '#c7a854',
          900: '#be9c40',
        },
        accent: { // Added a subtle accent color if needed, e.g., for buttons
          500: '#ff4d4d', // A brighter red
        }
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
      },
      keyframes: {
        fadeIn: {
          'from': { opacity: '0', transform: 'translateY(40px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          'from': { opacity: '0', transform: 'translateX(-100px)' },
          'to': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          'from': { opacity: '0', transform: 'translateX(100px)' },
          'to': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          'from': { opacity: '0', transform: 'scale(0.7)' },
          'to': { opacity: '1', transform: 'scale(1)' },
        },
        pulse: {
          '0%, 100%': { transform: 'scale(1)', boxShadow: '0 0 0 rgba(120, 0, 0, 0.4)' },
          '50%': { transform: 'scale(1.03)', boxShadow: '0 0 20px rgba(120, 0, 0, 0.7)' },
        },
        heroBackgroundPan: {
          '0%': { 'background-position': '0% 0%' },
          '100%': { 'background-position': '100% 100%' },
        },
        circleMove1: { /* ... (copy circleMove1 keyframes from JS) ... */ },
        circleMove2: { /* ... (copy circleMove2 keyframes from JS) ... */ },
        circleMove3: { /* ... (copy circleMove3 keyframes from JS) ... */ },
      },
      animation: {
        fadeIn: 'fadeIn 1.2s ease-out forwards',
        slideInLeft: 'slideInLeft 1s ease-out forwards',
        slideInRight: 'slideInRight 1s ease-out forwards',
        scaleIn: 'scaleIn 1s ease-out forwards',
        pulse: 'pulse 2s infinite',
        heroBackgroundPan: 'heroBackgroundPan 60s linear infinite alternate',
        circleMove1: 'circleMove1 25s ease-in-out infinite alternate',
        circleMove2: 'circleMove2 30s ease-in-out infinite alternate',
        circleMove3: 'circleMove3 20s ease-in-out infinite alternate',
      }
    },
  },
  plugins: [],
};