/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        fairway: {
          50: "#f0f9f0",
          100: "#dcf0dc",
          400: "#4a9e4a",
          500: "#2f7a2f",
          600: "#256125",
          700: "#1d4d1d",
          900: "#0f2b0f",
        },
      },
    },
  },
  plugins: [],
};
