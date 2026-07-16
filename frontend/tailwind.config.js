/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary:   "#471087ff",
        secondary: "#6f47cdff",
        accent:    "#F59E0B",
        "accent-hover": "#E67E22",
        "light-purple": "#F8F4FF",
        "lighter-purple": "#F3ECFF",
        "border-purple": "#E9E5F5",
        "text-primary":  "#1A1A2E",
        "text-secondary":"#4B5563",
        "text-muted":    "#9CA3AF",
        success: "#22C55E",
        danger:  "#EF4444",
        warning: "#F59E0B",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "xl":  "12px",
        "2xl": "16px",
        "3xl": "20px",
        "4xl": "24px",
      },
      boxShadow: {
        "card":     "0 2px 16px rgba(111,45,189,0.08)",
        "card-md":  "0 4px 24px rgba(111,45,189,0.12)",
        "card-lg":  "0 8px 40px rgba(111,45,189,0.15)",
        "btn":      "0 2px 8px rgba(111,45,189,0.25)",
        "nav":      "0 1px 0 #E9E5F5",
      },
      backgroundImage: {
        "hero-gradient":   "linear-gradient(135deg, #F8F4FF 0%, #FFFFFF 60%, #FFF8F0 100%)",
        "purple-gradient": "linear-gradient(135deg, #6F2DBD 0%, #8B5CF6 100%)",
        "orange-gradient": "linear-gradient(135deg, #F59E0B 0%, #E67E22 100%)",
        "card-gradient":   "linear-gradient(180deg, #FFFFFF 0%, #FAFAFC 100%)",
      },
    },
  },
  plugins: [],
};
