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
        primary: '#004aad',
        secondary: '#19c0c6',
        accent: '#ffcc53',
        primaryLight: '#004aad20',
        secondaryLight: '#19c0c620',
        accentLight: '#ffcc5320',
      },
      fontFamily: {
        'intro': ['Intro Rust', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-custom': 'linear-gradient(to right bottom, #004aad, #19c0c6)',
      },
    },
  },
  plugins: [],
}