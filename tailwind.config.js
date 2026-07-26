/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        vercel: {
          ink: '#171717',
          body: '#4d4d4d',
          mute: '#888888',
          hairline: '#ebebeb',
          'hairline-strong': '#a1a1a1',
          canvas: '#ffffff',
          'canvas-soft': '#fafafa',
          'canvas-soft-2': '#f5f5f5',
          link: '#0070f3',
          error: '#ee0000',
          warning: '#f5a623',
          cyan: '#50e3c2',
          pink: '#ff0080',
          violet: '#7928ca',
        },
      },
      fontFamily: {
        sans: ['Geist', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Geist Mono', 'JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
