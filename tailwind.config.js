/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#D91B24',
          crimson: '#761F21',
          silver: '#C4C4C4',
          black: '#111111',
        },
      },
    },
  },
  plugins: [],
}
