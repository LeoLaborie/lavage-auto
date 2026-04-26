/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Legacy tokens — kept for dashboards and existing pages
        primary: '#004aad',
        secondary: '#19c0c6',
        accent: '#ffcc53',
        primaryLight: '#004aad20',
        secondaryLight: '#19c0c620',
        accentLight: '#ffcc5320',
        // Cinétique direction (landing redesign)
        ink: '#06080d',
        ink2: '#1a1f2e',
        blue: {
          DEFAULT: '#1d4ed8',
          electric: '#3b82f6',
          deep: '#0a1c5c',
          wash: '#eaf0fc',
        },
        rule: 'rgba(6, 8, 13, 0.094)',
      },
      fontFamily: {
        intro: ['Intro Rust', 'sans-serif'],
        display: ['var(--font-display)', 'Inter Tight', 'Inter', 'sans-serif'],
        cinsans: ['var(--font-cin-sans)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-custom': 'linear-gradient(to right bottom, #004aad, #19c0c6)',
      },
      maxWidth: {
        cin: '1320px',
      },
      boxShadow: {
        'cin-card': '0 8px 24px rgba(0,0,0,0.05)',
        'cin-feature': '0 20px 60px rgba(10,28,92,0.4)',
        'cin-button': '0 8px 24px rgba(10,28,92,0.3)',
      },
      animation: {
        'cin-spin': 'cinSpin 4s linear infinite',
        'cin-pulse': 'cinPulse 2s ease-in-out infinite',
        'cin-ticker': 'cinTicker 30s linear infinite',
        'cin-ticker-fast': 'cinTicker 25s linear infinite',
      },
      keyframes: {
        cinSpin: {
          to: { transform: 'rotate(360deg)' },
        },
        cinPulse: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        cinTicker: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
}
