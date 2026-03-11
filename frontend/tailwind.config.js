/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          950: '#020617',
        },
        main: {
          DEFAULT: 'rgb(var(--bg-main) / <alpha-value>)',
          card: 'rgb(var(--bg-card) / <alpha-value>)',
        },
        display: {
          DEFAULT: 'rgb(var(--text-main) / <alpha-value>)',
          muted: 'rgb(var(--text-muted) / <alpha-value>)',
        },
        trim: 'rgb(var(--border-subtle) / <alpha-value>)',
        primary: {
          50: 'rgb(var(--primary-raw) / 0.05)',
          100: 'rgb(var(--primary-raw) / 0.1)',
          200: 'rgb(var(--primary-raw) / 0.2)',
          300: 'rgb(var(--primary-raw) / 0.4)',
          400: 'rgb(var(--primary-raw) / 0.6)',
          500: 'rgb(var(--primary-raw) / <alpha-value>)',
          600: 'rgb(var(--primary-raw) / 0.9)',
          700: 'rgb(var(--primary-raw) / 0.8)',
          800: 'rgb(var(--primary-raw) / 0.7)',
          900: 'rgb(var(--primary-raw) / 0.6)',
          950: 'rgb(var(--primary-raw) / 0.5)',
        },
        accent: {
          emerald: '#10b981',
          rose: '#f43f5e',
          amber: '#f59e0b',
          glow: 'rgb(var(--accent-glow) / <alpha-value>)',
        }
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'premium': '0 10px 15px -3px rgba(0, 0, 0, 0.04), 0 4px 6px -2px rgba(0, 0, 0, 0.02)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
      }
    },
  },
  plugins: [],
}
