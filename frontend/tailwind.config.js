/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // YOUR UNIQUE BRAND PALETTE
        pro: {
          dark: "#0F172A",    // Deep Navy (Sidebar)
          light: "#F1F5F9",   // Clean Background
          white: "#FFFFFF",   // Pure White

          // The "Teal" Accent - High Contrast & Modern
          primary: "#0D9488", // Teal-600 (Main Buttons)
          hover: "#0F766E",   // Teal-700 (Hover State)

          // Text Colors
          text: {
            main: "#334155",  // Slate-700
            sub: "#64748B",   // Slate-500
          }
        }
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)', // Expensive "float" look
      }
    },
  },
  plugins: [],
}