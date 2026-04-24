/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6', // Xanh lam chuẩn
        secondary: '#10b981', // Xanh lá
        dark: '#1e293b',
        light: '#f8fafc',
      }
    },
  },
  plugins: [],
}
