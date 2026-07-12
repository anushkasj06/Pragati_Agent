/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        meesho: {
          pink: "#F43397",
          purple: "#7B2D8E",
        },
      },
    },
  },
  plugins: [],
};
