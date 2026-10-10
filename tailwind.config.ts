import type { Config } from 'tailwindcss'
import colors from 'tailwindcss/colors'

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        // Map slate to neutral to remove the blue tint for a stark black/white look
        slate: colors.neutral,
      },
      boxShadow: {
        panel: '0 1px 2px rgba(0, 0, 0, 0.06)'
      }
    }
  },
  plugins: []
} satisfies Config
