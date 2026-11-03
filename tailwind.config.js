/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./neon_drift_anime_3d_racing.tsx"
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          pink: '#ff007f',
          cyan: '#00f0ff',
          neon: '#39ff14',
          yellow: '#fcee0a',
          purple: '#8b5cf6',
          dark: '#070814',
        }
      },
      fontFamily: {
        sans: ['"Rajdhani"', 'system-ui', 'sans-serif'],
        display: ['"Russo One"', '"Orbitron"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

