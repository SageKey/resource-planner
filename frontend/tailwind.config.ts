import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#f0f3ff",
          100: "#dbe1fe",
          200: "#bfc8fe",
          300: "#93a0fd",
          400: "#6070fa",
          500: "#3b46f6",
          600: "#2527eb",
          700: "#1d1dd8",
          800: "#1e1baf",
          900: "#1e1d8a",
          950: "#131254",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
} satisfies Config;
