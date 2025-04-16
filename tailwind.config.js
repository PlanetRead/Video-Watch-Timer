/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#6B21A8", // purple-800
          dark: "#4C1D95", // purple-900
          light: "#8B5CF6", // purple-500
        },
        background: {
          light: "#FFFFFF",
          dark: "#121212",
        },
        text: {
          light: "#1F2937", // gray-800
          dark: "#F3F4F6", // gray-100
        },
        surface: {
          light: "#F9FAFB", // gray-50
          dark: "#1F2937", // gray-800
        },
        border: {
          light: "#E5E7EB", // gray-200
          dark: "#374151", // gray-700
        },
      },
    },
  },
  plugins: [],
}