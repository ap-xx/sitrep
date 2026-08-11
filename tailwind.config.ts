import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        panel: "#0b0f14",
        "panel-border": "#1f2a33",
        severity: {
          low: "#3fb950",
          medium: "#d4a72c",
          high: "#e8590c",
          critical: "#da3633",
        },
      },
    },
  },
  plugins: [],
};

export default config;
