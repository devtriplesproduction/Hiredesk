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
        bg: "var(--bg)",
        bg2: "var(--bg2)",
        bg3: "var(--bg3)",
        glass: "var(--glass)",
        "glass-2": "var(--glass-2)",
        "glass-3": "var(--glass-3)",
        border: "var(--border)",
        "border-2": "var(--border-2)",
        "border-3": "var(--border-3)",
        text: "var(--text)",
        "text-2": "var(--text-2)",
        "text-3": "var(--text-3)",
        accent: "var(--accent)",
        green: "var(--green)",
        yellow: "var(--yellow)",
        red: "var(--red)",
      },
    },
  },
  plugins: [],
};
export default config;
