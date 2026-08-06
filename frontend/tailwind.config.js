/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0B0D10",
          900: "#12151A",
          800: "#1B1F26",
          700: "#262B34",
          600: "#363D48",
        },
        parchment: "#F3EFE6",
        amber: {
          400: "#E8A33D",
          500: "#D6902A",
        },
        teal: {
          400: "#3FA9A0",
          500: "#2F8A82",
        },
        rose: {
          400: "#C15B4A",
        },
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["'IBM Plex Sans'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};
