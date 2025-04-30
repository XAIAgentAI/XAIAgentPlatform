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
        "fade-left-to-right": {
          "0%": { opacity: 0.4 },
          "50%": { opacity: 0.88 },
          "100%": { opacity: 0.4 }
        },
        "smoothShine": {
          '0%': { 
            transform: 'translateX(-100%)', 
            opacity: '0.3' 
          },
          '100%': { 
            transform: 'translateX(100%)', 
            opacity: '0.3' 
          },
        },
       "combined": {
          '0%': {
              transform: 'scale(1)',
              background: 'linear-gradient(to right, hsl(25, 100%, 60%) 0%, rgba(255, 107, 0, 1))'
          },
          '12.5%': {
              transform: 'scale(1.02)',
              background: 'linear-gradient(to right, hsl(25, 100%, 60%) 10%, rgba(255, 107, 0, 1))'
          },
          '25%': {
              transform: 'scale(1.04)',
              background: 'linear-gradient(to right, hsl(25, 100%, 60%) 20%, rgba(255, 107, 0, 1))'
          },
          '37.5%': {
              transform: 'scale(1.08)',
              background: 'linear-gradient(to right, hsl(25, 100%, 60%) 30%, rgba(255, 107, 0, 1))'
          },
          '50%': {
              transform: 'scale(1.12)',
              background: 'linear-gradient(to right, hsl(25, 100%, 60%) 50%, rgba(255, 107, 0, 1))'
          },
          '62.5%': {
              transform: 'scale(1.08)',
              background: 'linear-gradient(to right, hsl(25, 100%, 60%) 70%, rgba(255, 107, 0, 1))'
          },
          '75%': {
              transform: 'scale(1.04)',
              background: 'linear-gradient(to right, hsl(25, 100%, 60%) 80%, rgba(255, 107, 0, 1))'
          },
          '87.5%': {
              transform: 'scale(1.02)',
              background: 'linear-gradient(to right, hsl(25, 100%, 60%) 90%, rgba(255, 107, 0, 1))'
          },
          '100%': {
              transform: 'scale(1)',
              background: 'linear-gradient(to right, hsl(25, 100%, 60%) 100%, rgba(255, 107, 0, 1))'
          }
      }
      },
      animation: {
        "combined-ani": "combined 0.5s ease-in-out infinite",
        'smooth-shine': 'smoothShine 3.2s ease-in-out infinite',
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-ball": "scaleBall 1.5s infinite ease-in-out",
        "chatthink": "fade-left-to-right 2s linear infinite"
      },      
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    function({ addVariant }:{ addVariant: (name:string,definition:string) => void}) {
          addVariant('max-lg', '@media (max-width: 1023px)')
    }
  ],
}
