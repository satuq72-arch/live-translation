/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/core/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        mono: ['DM Mono', 'Fira Mono', 'monospace'],
      },
      colors: {
        page:    '#07061a',
        surface: '#0f0d20',
        raised:  '#131130',
        rim:     '#1e1b38',
        dim:     '#4b4870',
        muted:   '#8b87b0',
        prose:   '#e0deff',
      },
      keyframes: {
        'ring-out': {
          '0%':   { transform: 'scale(1)',   opacity: '0.6' },
          '100%': { transform: 'scale(2.4)', opacity: '0'   },
        },
        'ring-out-2': {
          '0%':   { transform: 'scale(1)',   opacity: '0.4' },
          '100%': { transform: 'scale(1.9)', opacity: '0'   },
        },
        'slide-in': {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to:   { opacity: '1', transform: 'translateY(0)'    },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to:   { opacity: '1', transform: 'translateY(0)'   },
        },
        'glow-idle': {
          '0%, 100%': { boxShadow: '0 0 0 1px rgba(99,102,241,.3), 0 0 24px rgba(99,102,241,.4), 0 8px 24px rgba(0,0,0,.6)' },
          '50%':      { boxShadow: '0 0 0 1px rgba(99,102,241,.5), 0 0 40px rgba(99,102,241,.6), 0 8px 32px rgba(0,0,0,.6)' },
        },
        'wave': {
          '0%, 100%': { height: '3px'  },
          '50%':      { height: '14px' },
        },
      },
      animation: {
        'ring-out':   'ring-out 1.6s ease-out infinite',
        'ring-out-2': 'ring-out-2 1.6s ease-out 0.4s infinite',
        'slide-in':   'slide-in 0.28s ease forwards',
        'fade-up':    'fade-up 0.3s ease forwards',
        'glow-idle':  'glow-idle 3s ease-in-out infinite',
        'wave':       'wave 0.9s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
