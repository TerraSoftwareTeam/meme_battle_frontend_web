/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        unbounded: ['Unbounded', 'sans-serif'],
        nunito: ['Nunito', 'sans-serif'],
      },
      colors: {
        base: "rgb(var(--bg-base) / <alpha-value>)",
        surface: "rgb(var(--bg-surface) / <alpha-value>)",
        elevated: "rgb(var(--bg-elevated) / <alpha-value>)",
        border: "rgb(var(--border-color) / <alpha-value>)",
        primary: {
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          shadow: "rgb(var(--primary-shadow) / <alpha-value>)",
          foreground: "rgb(var(--bg-base) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "rgb(var(--secondary) / <alpha-value>)",
          shadow: "rgb(var(--secondary-shadow) / <alpha-value>)",
          foreground: "rgb(var(--text-primary) / <alpha-value>)",
        },
        danger: "rgb(var(--danger) / <alpha-value>)",
        warning: "rgb(var(--warning) / <alpha-value>)",
        
        // shadcn aliases
        background: "rgb(var(--background))",
        foreground: "rgb(var(--foreground))",
        muted: {
          DEFAULT: "rgb(var(--muted))",
          foreground: "rgb(var(--muted-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      }
    },
  },
  plugins: [],
}
