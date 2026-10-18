/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: "#07090e",
          surface: "#0f141e",
          card: "#151b27",
          border: "#202a3d",
          muted: "#64748b",
        },
        neon: {
          cyan: "#00f0ff",
          purple: "#9333ea",
          violet: "#8b5cf6",
          pink: "#ff2a85",
          emerald: "#10b981",
          amber: "#f59e0b",
        },
      },
      boxShadow: {
        'neon-cyan': '0 0 20px -3px rgba(0, 240, 255, 0.45)',
        'neon-purple': '0 0 20px -3px rgba(147, 51, 234, 0.45)',
        'neon-pink': '0 0 20px -3px rgba(255, 42, 133, 0.45)',
        'flutter-card': '0 10px 30px -10px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.06)',
        'flutter-glow': '0 12px 35px -5px rgba(0, 240, 255, 0.25), 0 0 0 1px rgba(0, 240, 255, 0.3)',
      },
      borderRadius: {
        'flutter': '22px',
        'flutter-lg': '28px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-flow': 'glow 4s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { filter: 'drop-shadow(0 0 8px rgba(0,240,255,0.4))' },
          '100%': { filter: 'drop-shadow(0 0 16px rgba(147,51,234,0.6))' },
        }
      }
    },
  },
  plugins: [],
};
