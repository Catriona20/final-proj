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
        healthcare: {
          50: '#FFF7F2',
          100: '#FFEEDD',
          200: '#FFD6B5', // Accent: Light Orange
          300: '#FFB685',
          400: '#FF9F5E',
          500: '#FF8A3D', // Secondary: Soft Orange
          600: '#E56D20',
          700: '#B84E0F',
          800: '#8A370A',
          900: '#5C2204',
        },
        slatebg: '#F8FAFC',
        darktext: '#1F2937',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 41, 55, 0.08)',
        'glass-hover': '0 12px 40px 0 rgba(255, 138, 61, 0.15)',
        'soft': '0 4px 20px -2px rgba(31, 41, 55, 0.05)',
        'floating': '0 10px 30px -5px rgba(255, 138, 61, 0.25)',
      },
      backdropBlur: {
        'glass': '16px',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 4s ease-in-out infinite',
        'spin-slow': 'spin 12s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
}
