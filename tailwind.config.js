/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          base: '#0B0E11',
          panel: '#12161C',
          border: '#1E2630',
          accent: '#D9A441',
          steel: '#4A6572',
          text: '#E8E6E1',
          muted: '#8A9099',
          low: '#6B8E5A',
          elevated: '#C97A2B',
          flag: '#A33F3F'
        },
        light: {
          base: '#F4F2ED',
          panel: '#FFFFFF',
          border: '#D8D4CA',
          accent: '#1F3A5F',
          steel: '#8C8574',
          text: '#1A1D21',
          muted: '#6B6F76',
          low: '#3F6B3F',
          elevated: '#B85C1F',
          flag: '#7A2E2E'
        }
      },
      fontFamily: {
        sans: ['"Roboto Condensed"', '"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Roboto Mono"', 'monospace']
      }
    },
  },
  plugins: [],
}
