import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-syne)", "sans-serif"],
        mono: ["var(--font-dm-mono)", "monospace"],
      },
      fontSize: {
        xs: ['0.85rem', { lineHeight: '1.25rem' }],
        sm: ['0.95rem', { lineHeight: '1.35rem' }],
        base: ['1.05rem', { lineHeight: '1.5rem' }],
        lg: ['1.2rem', { lineHeight: '1.75rem' }],
        xl: ['1.35rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.6rem', { lineHeight: '2rem' }],
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
