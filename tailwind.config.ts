/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [

    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
          inner: "var(--card-inner)",
          "inner-hover": "var(--card-inner-hover)",
        },
        "border-dark": "var(--border-dark)",
        chart: {
          background: "var(--chart-background)",
          grid: "var(--chart-grid)",
          text: "var(--chart-text)",
          up: "var(--chart-up)",
          down: "var(--chart-down)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "scaleBall": {
          '0%, 100%': { transform: 'scale(0.8)', opacity: '0.6' },
          '50%': { transform: 'scale(1.2)', opacity: '1' },
        },
        "fade": {
          "0%, 16.67%, 33.33%, 50%, 66.67%, 83.33%": {
            opacity: 0
          },
          "8.33%, 25%, 41.67%, 58.33%, 75%, 91.67%": {
            opacity: 1
          }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-ball": "scaleBall 1.5s infinite ease-in-out",
        "chatthink":"fade 2s steps(1) infinite"
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
