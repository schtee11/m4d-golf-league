/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Deep pine green — primary brand color
        fairway: {
          50: "#f2f6ef",
          100: "#e1ebda",
          200: "#c3d6ba",
          300: "#9dbb8e",
          400: "#719a60",
          500: "#4f7c40",
          600: "#3a6030",
          700: "#2c4a25",
          800: "#20351b",
          900: "#152512",
          950: "#0b160a",
        },
        // Trophy gold — accent for highlights, medals, focus states
        gold: {
          50: "#fbf6e8",
          100: "#f4e7bf",
          200: "#ecd692",
          300: "#e0be64",
          400: "#cea343",
          500: "#b68b30",
          600: "#946e26",
          700: "#71531d",
        },
        // Warm parchment — background/paper tones
        cream: {
          50: "#fefdfb",
          100: "#faf5e9",
          200: "#f1e6cb",
          300: "#e3d2a5",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        serif: ["Fraunces", "ui-serif", "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(21 37 18 / 0.04), 0 8px 24px -8px rgb(21 37 18 / 0.14)",
        elevated: "0 4px 6px -1px rgb(21 37 18 / 0.06), 0 16px 40px -12px rgb(21 37 18 / 0.22)",
        gold: "0 6px 20px -6px rgb(182 139 48 / 0.45)",
        inset: "inset 0 1px 2px 0 rgb(21 37 18 / 0.06)",
      },
      backgroundImage: {
        grain:
          "radial-gradient(circle at 1px 1px, rgb(21 37 18 / 0.05) 1px, transparent 0)",
      },
      backgroundSize: {
        grain: "18px 18px",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
        shimmer: "shimmer 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
