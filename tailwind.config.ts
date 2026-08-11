import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        panel: "#040a06",
        "panel-border": "#12321d",
        phosphor: {
          DEFAULT: "#39ff88",
          dim: "#1f8f4d",
        },
        severity: {
          low: "#39ff88",
          medium: "#f4ff45",
          high: "#ff9f1c",
          critical: "#ff2d55",
        },
      },
      fontFamily: {
        mono: [
          "var(--font-terminal)",
          "ui-monospace",
          "SFMono-Regular",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
