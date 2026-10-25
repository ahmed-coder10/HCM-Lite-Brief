/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        aurora: {
          bg: '#05060B',
          surface: '#10141F',
          card: '#161B2A',
          border: 'rgba(255, 255, 255, 0.08)',
          violet: '#7C5CFF',
          btnViolet: '#5B3EE8',
          cyan: '#22D3EE',
          mint: '#3DDC97',
          amber: '#FFB86B',
          rose: '#FF6B8A',
          text: '#EEF1F8',
          muted: '#9AA3B8'
        }
      },
      fontFamily: {
        heading: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
