import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-syne)", "sans-serif"],
        mono: ["var(--font-dm-mono)", "monospace"],
      },
      colors: {
        glass: "rgba(255,255,255,0.04)",
        "glass-2": "rgba(255,255,255,0.07)",
        "glass-3": "rgba(255,255,255,0.10)",
        border: "rgba(255,255,255,0.08)",
        "border-2": "rgba(255,255,255,0.14)",
        "border-3": "rgba(255,255,255,0.22)",
      },
    },
  },
  plugins: [],
};
export default config;
