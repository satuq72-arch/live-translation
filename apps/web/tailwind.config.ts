import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
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
          'from': { opacity: '0', transform: 'translateY(-8px)' },
          'to':   { opacity: '1', transform: 'translateY(0)'    },
        },
        'fade-up': {
          'from': { opacity: '0', transform: 'translateY(6px)' },
          'to':   { opacity: '1', transform: 'translateY(0)'   },
        },
        'glow-idle': {
          '0%, 100%': { boxShadow: '0 0 32px rgba(99,102,241,.4), 0 8px 32px rgba(0,0,0,.4)' },
          '50%':       { boxShadow: '0 0 52px rgba(99,102,241,.7), 0 8px 40px rgba(0,0,0,.4)' },
        },
      },
      animation: {
        'ring-out':   'ring-out 1.6s ease-out infinite',
        'ring-out-2': 'ring-out-2 1.6s ease-out 0.4s infinite',
        'slide-in':   'slide-in 0.28s ease forwards',
        'fade-up':    'fade-up 0.3s ease forwards',
        'glow-idle':  'glow-idle 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
