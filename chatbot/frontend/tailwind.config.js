/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#0F6B3A', 600: '#0c5a31' },
        secondary: '#3CB371',
        accent: '#D4AF37',
      },
    },
  },
  plugins: [],
}
