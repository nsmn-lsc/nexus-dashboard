import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#090d16",
        void: "#090d16",
        panel: {
          DEFAULT: "#0d1322",
          light: "#121a2e",
          border: "rgba(0, 243, 255, 0.2)",
        },
        hud: {
          cyan: "#00f3ff",
          green: "#00ff66",
          magenta: "#ff0055",
          yellow: "#fcee0a",
          muted: "#64748b",
          border: "#1e293b",
        },
      },
      fontFamily: {
        rajdhani: ["var(--font-rajdhani)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      clipPath: {
        tactical: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))",
      },
    },
  },
  plugins: [],
};

export default config;
