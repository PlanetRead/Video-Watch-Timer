/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          light: "#8B5CF6", // Light mode primary color
          dark: "#A78BFA",  // Dark mode primary color
        },
        background: {
          light: "#FFFFFF", // Light mode background
          dark: "#1F2937",  // Dark mode background
        },
        text: {
          light: "#1F2937", // Light mode text
          dark: "#F9FAFB",  // Dark mode text
        },
        card: {
          light: "#F3F4F6", // Light mode card background
          dark: "#374151",  // Dark mode card background
        },
      },
    },
  },
  plugins: [],
}