/** @type {import('tailwindcss').Config} */
import type { Config } from 'tailwindcss'
/*
you must add dark: classes to each component because Tailwind only generates styles for classes present in your source files.
There's no automatic dark mode styling unless you use a global CSS invert filter (not recommended).
*/
const config: Config = {
// module.exports = {
  darkMode: 'class', // <--- This is the crucial line , not recommended to use it 
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './ui/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      primary: {
        DEFAULT: '#3b82f6',  // blue-500
        foreground: '#ffffff',
      },
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
    },
  },
  plugins: [],
}
export default config