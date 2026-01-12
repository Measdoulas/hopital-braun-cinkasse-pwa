/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'bg-primary',
    'bg-primary-dark',
    'bg-neutral-light',
    'text-neutral-darkest'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563EB', // Blue-600
          dark: '#1D4ED8',    // Blue-700
          light: '#DBEAFE',   // Blue-100
        },
        secondary: {
          DEFAULT: '#10B981', // Emerald-500
          light: '#D1FAE5',   // Emerald-100
        },
        alert: {
          DEFAULT: '#F59E0B', // Amber-500
          light: '#FEF3C7',   // Amber-100
        },
        danger: {
          DEFAULT: '#EF4444', // Red-500
          light: '#FEE2E2',   // Red-100
        },
        neutral: {
          darkest: '#0F172A', // Slate-900
          dark: '#64748B',    // Slate-500
          light: '#F8FAFC',   // Slate-50
          white: '#FFFFFF',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
