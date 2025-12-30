/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2d676e',
        competent: '#a6ae3d',
        competentDark: '#7d8530', // WCAG AA compliant for text (5:1 ratio)
        warning: '#da8a0c',
        critical: '#ef4444',
        background: '#f5f5f5',
        surface: '#ffffff',
      },
      fontFamily: {
        sans: ['system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
