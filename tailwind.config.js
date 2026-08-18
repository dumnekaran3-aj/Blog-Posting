/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#2563EB",
        primaryDark: "#1E3A8A",
        secondary: "#0EA5A4",
        accent: "#F59E0B",
        bgLight: "#F8FAFC",
        textDark: "#1E293B",
        textMuted: "#64748B",
        success: "#16A34A",
        danger: "#DC2626",
        borderClr: "#E2E8F0",
      },
    },
  },
  plugins: [],
};