/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Color palette for the rian.io theme
      colors: {
        background: '#0D0D0D',
        foreground: '#FFFFFF',
        card: '#262626',
        'card-foreground': '#FFFFFF',
        primary: '#FFFFFF',
        'primary-foreground': '#0D0D0D',
        secondary: '#232323',
        'secondary-foreground': '#FFFFFF',
        muted: '#A1A1A1',
        'muted-foreground': '#D1D5DB',
        accent: {
          DEFAULT: '#67F5C8',
          secondary: '#ADFF15',
        },
        border: 'hsl(0 0% 100% / 0.1)',
        input: 'hsl(0 0% 100% / 0.1)',
      },
      // CHANGED: 'Geist Sans' is now 'Onest'
      fontFamily: {
        sans: ['"Onest"', 'sans-serif'],
      },
      letterSpacing: {
        tight: '-0.015em',
        normal: '0',
        wide: '0.015em',
      },
      // Keyframe animation for the shine effect
      keyframes: {
        shine: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        }
      },
      animation: {
        shine: 'shine 14s linear infinite',
      },
    },
  },
  plugins: [],
}
