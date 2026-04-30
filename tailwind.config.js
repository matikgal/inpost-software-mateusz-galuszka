/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        inpost: {
          yellow: '#FFD100',
          black: '#0e1014',
        },
        dash: {
          950: '#0e1014',
          900: '#15181d',
          800: '#1a1e24',
          700: '#23272e',
          600: '#2c313a',
        },
        pos: '#6dbf8a',
        neg: '#d97070',
      },
      fontFamily: {
        sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
