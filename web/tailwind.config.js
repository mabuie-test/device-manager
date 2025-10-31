/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        midnight: '#0f172a',
        ocean: '#0ea5e9',
        emerald: '#10b981',
        amber: '#f59e0b',
      },
    },
  },
  plugins: [],
};
