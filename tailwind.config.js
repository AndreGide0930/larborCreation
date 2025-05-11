import { fontFamily } from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'brand': {
          'blue': '#2A3B4D',
          'orange': '#FF6B6B',
          'gray': '#F5F7FA',
          'mint': '#4DB6AC'
        }
      },
      fontFamily: {
        'montserrat': ['Montserrat', ...fontFamily.sans],
        'opensans': ['Open Sans', ...fontFamily.sans],
      },
      backdropFilter: {
        'glass': 'blur(10px)',
      },
      scale: {
        '102': '1.02'
      }
    },
  },
  plugins: [],
}