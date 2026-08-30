/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        neon: {
          blue: "#00d4ff",
          purple: "#a855f7",
          green: "#22c55e",
          red: "#ef4444",
          yellow: "#eab308",
        },
      },
      boxShadow: {
        neon: "0 0 20px rgba(0, 212, 255, 0.3)",
        "neon-purple": "0 0 20px rgba(168, 85, 247, 0.3)",
        "neon-green": "0 0 20px rgba(34, 197, 94, 0.3)",
        "neon-red": "0 0 20px rgba(239, 68, 68, 0.3)",
      },
    },
  },
  plugins: [],
};
