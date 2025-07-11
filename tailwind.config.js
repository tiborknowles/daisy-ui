/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'daisy-blue': '#2563eb',
        'daisy-purple': '#7c3aed',
      },
    },
  },
  plugins: [],
}