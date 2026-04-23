import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0a0a0f',
        surface: '#13131a',
        surface2: '#1a1a24',
        border: '#1e1e2e',
        border2: '#2a2a3e',
        accent: '#6366f1',
        accent2: '#818cf8',
        danger: '#f43f5e',
        success: '#22c55e',
        warning: '#f59e0b',
        text: '#e2e8f0',
        text2: '#94a3b8',
        text3: '#475569',
        online: '#22c55e',
        offline: '#334155',
      },
      fontFamily: {
        display: ['var(--font-space)', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],
        ui: ['var(--font-geist)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-ring': 'pulse-ring 1.5s ease-out infinite',
        'level-up': 'level-up 0.5s ease-out',
        'shimmer': 'shimmer 1.5s infinite',
        'fade-in-up': 'fadeInUp 150ms ease-out',
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
        'buzz-ring': 'buzz-ring 1.5s ease-in-out infinite',
        'count-up': 'count-up 300ms ease-out',
      },
      keyframes: {
        pulseRing: {
          '0%': { boxShadow: '0 0 0 0 rgba(244, 63, 94, 0.4)' },
          '70%': { boxShadow: '0 0 0 15px rgba(244, 63, 94, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(244, 63, 94, 0)' },
        },
        levelUp: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        buzzRing: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.05)', opacity: '0.8' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        countUp: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      minHeight: {
        'screen-minus-nav': 'calc(100vh - 56px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config