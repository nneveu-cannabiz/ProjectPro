/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        blue: {
          25: '#f7faff', // Lighter shade of blue
        }
      }
    },
  },
  plugins: [],
};