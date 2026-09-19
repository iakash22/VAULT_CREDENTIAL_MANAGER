/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Outfit", "system-ui", "sans-serif"],
        display: ["Syne", "Outfit", "system-ui", "sans-serif"],
      },
      colors: {
        ink: {
          950: "#070b16",
          900: "#0c1224",
          800: "#141c34",
        },
        accent: {
          300: "#7ee0d0",
          400: "#3dcfb8",
          500: "#1fb39c",
        },
      },
      boxShadow: {
        glass: "0 10px 40px rgba(3, 8, 20, 0.45)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.45" },
          "50%": { opacity: "0.8" },
        },
      },
      animation: {
        "fade-up": "fade-up 420ms ease-out both",
        pulseGlow: "pulseGlow 4.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
