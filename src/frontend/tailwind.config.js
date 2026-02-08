/** @type {import('tailwindcss').Config} */
export default {
  content: ["index.html", "src/**/*.{js,ts,jsx,tsx,html,css}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      colors: {
        brand: {
          // Light mode - Creamy warm tones
          bg: "#FDF8F3", // Creamy background
          surface: "#FFFDF9", // Warm white cards

          // Primary accent - Soft green
          primary: {
            50: "#f0fdf4",
            100: "#dcfce7",
            400: "#4ade80",
            500: "#22c55e",
            600: "#16a34a",
          },

          // Secondary accent - Subtle blue
          secondary: {
            400: "#60a5fa",
            500: "#3b82f6",
            600: "#2563eb",
          },

          // Grays - Warm, creamy tones
          gray: {
            50: "#FDFBF7",
            100: "#FAF7F2",
            200: "#EDE9E3",
            300: "#DDD8D0",
            400: "#B0A89D",
            500: "#7A746A",
            600: "#5A554D",
            700: "#433F3A",
            800: "#2C2925",
            900: "#1A1815",
          },
        },
        // shadcn/ui color mappings
        primary: {
          DEFAULT: "#22c55e",
          foreground: "#ffffff",
        },
        background: "#FDF8F3",
        foreground: "#1A1815",
        input: "#EDE9E3",
        ring: "#22c55e",
        muted: {
          DEFAULT: "#FAF7F2",
          foreground: "#7A746A",
        },
        accent: {
          DEFAULT: "#FAF7F2",
          foreground: "#1A1815",
        },
        border: "#EDE9E3",
      },
      boxShadow: {
        soft: "0 2px 8px -2px rgba(0, 0, 0, 0.08), 0 1px 4px -1px rgba(0, 0, 0, 0.06)",
        "soft-lg":
          "0 8px 24px -4px rgba(0, 0, 0, 0.10), 0 2px 6px -2px rgba(0, 0, 0, 0.08)",
        "soft-xl":
          "0 12px 40px -8px rgba(0, 0, 0, 0.12), 0 4px 12px -4px rgba(0, 0, 0, 0.10)",
        xs: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
      },
      borderRadius: {
        card: "16px",
        lg: "14px",
        xl: "20px",
      },
      borderWidth: {
        DEFAULT: "2px",
      },
      fontWeight: {
        thin: "100",
        extralight: "200",
        light: "300",
        normal: "400",
        medium: "500",
        semibold: "600",
      },
      transitionDuration: {
        250: "250ms",
        400: "400ms",
      },
    },
  },
  plugins: [],
};
