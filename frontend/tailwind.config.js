/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ksp: {
          navy: '#0B3D91',
          royal: '#1E5AA8',
          gold: '#D4AF37',
          bg: '#F5F7FA',
          text: '#1A1A1A',
        },
      },
    },
  },
  plugins: [],
}
