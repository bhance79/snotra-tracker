/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        baskerville: ['"Libre Baskerville"', 'serif'],
      },
      colors: {
        brand: {
          red: '#FF6165',
          green: '#4AD968',
          yellow: '#FEDF43',
          crimson: '#761F21',
          silver: '#C4C4C4',
          black: '#0a0a0a',
          card: '#0a0a0a',
        },
      },
    },
  },
  plugins: [],
}
