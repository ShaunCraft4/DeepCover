import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dossier: {
          bg: "#050505",
          panel: "#111111",
          accent: "#00FF9D",
          text: "#F0F0F0",
          muted: "#888888",
          border: "#1E1E1E",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
        display: ["var(--font-syne)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 40px rgba(0, 255, 157, 0.08)",
        "glow-sm": "0 0 20px rgba(0, 255, 157, 0.06)",
      },
      keyframes: {
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.35" },
          "50%": { opacity: "0.6" },
        },
        fadeSlideUp: {
          from: { opacity: "0", transform: "translateY(24px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        scanLine: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        radarSweep: {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        tensionPulse: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(0,255,157,0.4)" },
          "50%": { boxShadow: "0 0 0 8px rgba(0,255,157,0)" },
        },
        waveBar: {
          "0%, 100%": { transform: "scaleY(0.35)" },
          "50%": { transform: "scaleY(1)" },
        },
      },
      animation: {
        scan: "scan 6s linear infinite",
        "pulse-soft": "pulseSoft 3s ease-in-out infinite",
        "fade-slide-up": "fadeSlideUp 0.7s ease forwards",
        "scan-line": "scanLine 3s linear infinite",
        "radar-sweep": "radarSweep 14s linear infinite",
        "tension-pulse": "tensionPulse 1.8s ease-in-out infinite",
        "wave-bar": "waveBar 0.9s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
