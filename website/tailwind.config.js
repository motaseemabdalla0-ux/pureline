/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0F6B3A',
          50: '#e8f5ee', 100: '#c8e6d5', 200: '#9fd3b5',
          300: '#6dbb90', 400: '#3CB371', 500: '#0F6B3A',
          600: '#0c5a31', 700: '#0a4a28', 800: '#073820', 900: '#052616',
        },
        secondary: { DEFAULT: '#3CB371' },
        accent: { DEFAULT: '#D4AF37', light: '#E7C868' },
        neutral: {
          light: '#F7F9F8', gray: '#8A9691', dark: '#111815',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        arabic: ['Tajawal', 'Cairo', 'sans-serif'],
        display: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'mesh-green': 'radial-gradient(at 20% 20%, rgba(60,179,113,0.25) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(15,107,58,0.30) 0px, transparent 50%), radial-gradient(at 80% 100%, rgba(212,175,55,0.15) 0px, transparent 50%)',
      },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-12px)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 8s linear infinite',
      },
    },
  },
  plugins: [],
}
