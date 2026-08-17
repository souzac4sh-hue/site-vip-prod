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
        background: '#080808',
        surface: {
          50: '#1c1c1f',
          100: '#18181b',
          200: '#151515',
          300: '#101010',
          400: '#0c0c0d',
        },
        brand: {
          50: '#fff0f3',
          100: '#ffe1e7',
          200: '#ffc3cf',
          300: '#ff94a9',
          400: '#ff5478',
          500: '#FF295C', // Main Accent
          600: '#e61448',
          700: '#c20937',
          800: '#a20c32',
          900: '#870f2f',
          950: '#4c0214',
        },
        muted: {
          DEFAULT: '#71717A',
          foreground: '#A1A1AA',
        },
        border: 'rgba(255, 255, 255, 0.08)',
        'border-highlight': 'rgba(255, 41, 92, 0.3)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.3s ease-out forwards',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 15px rgba(255, 41, 92, 0.2)' },
          '100%': { boxShadow: '0 0 30px rgba(255, 41, 92, 0.45)' },
        }
      },
      boxShadow: {
        'card': '0 8px 32px 0 rgba(0, 0, 0, 0.6)',
        'card-hover': '0 12px 40px 0 rgba(0, 0, 0, 0.8), 0 0 1px 1px rgba(255, 255, 255, 0.1)',
        'brand': '0 8px 24px -4px rgba(255, 41, 92, 0.35)',
        'brand-lg': '0 12px 32px -4px rgba(255, 41, 92, 0.5)',
      }
    },
  },
  plugins: [],
}
