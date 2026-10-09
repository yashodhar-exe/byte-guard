import type { Config } from 'tailwindcss'

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        panel: '0 1px 2px rgba(15, 23, 42, 0.06)'
      }
    }
  },
  plugins: []
} satisfies Config
