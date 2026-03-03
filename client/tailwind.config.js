/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#09090b",
        foreground: "#fafafa",
        primary: {
          DEFAULT: "#e11d48", // Rose 600
          foreground: "#fff1f2",
        },
        card: {
          DEFAULT: "#18181b", // Zinc 900
          foreground: "#fafafa",
        },
        border: "#27272a",
      },
    },
  },
  plugins: [],
};
