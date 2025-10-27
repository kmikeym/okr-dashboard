import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Spaceship command center theme
        space: {
          50: '#e6f0ff',
          100: '#cce0ff',
          200: '#99c2ff',
          300: '#66a3ff',
          400: '#3385ff',
          500: '#0066ff',
          600: '#0052cc',
          700: '#003d99',
          800: '#002966',
          900: '#001433',
          950: '#000a1a',
        },
        alert: {
          critical: '#ff3333',
          warning: '#ff9933',
          caution: '#ffcc00',
          normal: '#33ff99',
          info: '#33ccff',
        },
        panel: {
          bg: '#0f0f12',
          border: '#1a1a1f',
          hover: '#1f1f24',
          active: '#252529',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'IBM Plex Mono', 'Roboto Mono', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 20px rgba(51, 133, 255, 0.3)',
        'glow-sm': '0 0 10px rgba(51, 133, 255, 0.2)',
        'panel': '0 4px 20px rgba(0, 0, 0, 0.5)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan': 'scan 2s linear infinite',
      },
      keyframes: {
        scan: {
          '0%, 100%': { opacity: '0.2' },
          '50%': { opacity: '0.8' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
