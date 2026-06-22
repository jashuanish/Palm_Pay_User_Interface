import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // PalmPay brand system
        ink: {
          DEFAULT: '#05070A',
          900: '#05070A',
          800: '#080B11',
          700: '#0B0F17',
          600: '#10141E',
          500: '#161B27',
        },
        primary: {
          DEFAULT: '#00E5FF',
          glow: '#00E5FF',
        },
        secondary: {
          DEFAULT: '#7B61FF',
          glow: '#7B61FF',
        },
        accent: {
          DEFAULT: '#00FFA3',
          glow: '#00FFA3',
        },
        danger: '#FF4D6D',
        warn: '#FFB020',
        mist: {
          DEFAULT: '#9AA7BD',
          50: '#F5F7FB',
          100: '#E4E9F2',
          200: '#C7D0E0',
          300: '#9AA7BD',
          400: '#6B7689',
          500: '#454E5E',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      backgroundImage: {
        'aurora':
          'radial-gradient(1200px 600px at 15% -10%, rgba(0,229,255,0.18), transparent 60%), radial-gradient(900px 500px at 85% 0%, rgba(123,97,255,0.20), transparent 55%), radial-gradient(700px 700px at 50% 120%, rgba(0,255,163,0.12), transparent 60%)',
        'grid-faint':
          'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
        'brand-gradient':
          'linear-gradient(135deg, #00E5FF 0%, #7B61FF 50%, #00FFA3 100%)',
        'brand-soft':
          'linear-gradient(135deg, rgba(0,229,255,0.16), rgba(123,97,255,0.16))',
        'sheen':
          'linear-gradient(120deg, transparent 20%, rgba(255,255,255,0.12) 50%, transparent 80%)',
      },
      boxShadow: {
        glow: '0 0 40px -8px rgba(0,229,255,0.45)',
        'glow-purple': '0 0 40px -8px rgba(123,97,255,0.5)',
        'glow-green': '0 0 40px -8px rgba(0,255,163,0.45)',
        glass: '0 8px 40px -12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
        float: '0 24px 80px -24px rgba(0,0,0,0.8)',
      },
      backdropBlur: {
        xs: '2px',
      },
      keyframes: {
        'aurora-shift': {
          '0%, 100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '50%': { transform: 'translate3d(2%, -2%, 0) scale(1.08)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.8)', opacity: '0.7' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        },
        'spin-slow': {
          to: { transform: 'rotate(360deg)' },
        },
        'dash-flow': {
          to: { strokeDashoffset: '-1000' },
        },
        'gradient-pan': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        'aurora-shift': 'aurora-shift 18s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
        'pulse-ring': 'pulse-ring 2.4s cubic-bezier(0.4,0,0.2,1) infinite',
        'spin-slow': 'spin-slow 24s linear infinite',
        'dash-flow': 'dash-flow 20s linear infinite',
        'gradient-pan': 'gradient-pan 6s ease infinite',
      },
    },
  },
  plugins: [],
};

export default config;
