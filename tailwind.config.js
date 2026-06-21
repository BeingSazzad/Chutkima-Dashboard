/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Chutkima brand — teal/emerald green
        brand: {
          50: '#e9f7f1',
          100: '#c8ecdd',
          200: '#94dcc1',
          300: '#5fc8a3',
          400: '#2eaf85',
          500: '#0f9270', // primary
          600: '#0c7d60', // buttons / hover
          700: '#0a654f',
          800: '#08503f',
          900: '#063b30',
          950: '#03241d',
        },
        // Light mint surfaces used across the app screens
        mint: {
          50: '#f3faf7',
          100: '#e1f0ea',
          200: '#cfe8df',
        },
        // Semantic status colors (order journey, stock, etc.)
        success: '#16a34a',
        warning: '#f59e0b',
        danger: '#dc2626',
        info: '#2563eb',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(6, 59, 48, 0.04), 0 4px 16px -4px rgba(6, 59, 48, 0.08)',
        'card-hover': '0 4px 24px -6px rgba(6, 59, 48, 0.16)',
        sidebar: '4px 0 24px -12px rgba(6, 59, 48, 0.12)',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          from: { opacity: '0', transform: 'translateX(-8px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.8)', opacity: '0.8' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out',
        'slide-in': 'slide-in 0.2s ease-out',
        'scale-in': 'scale-in 0.18s ease-out',
        'pulse-ring': 'pulse-ring 1.6s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
