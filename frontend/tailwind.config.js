/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        stage: 'var(--color-stage)',
        'stage-deep': 'var(--color-stage-deep)',
        paper: 'var(--color-paper)',
        'paper-dark': 'var(--color-paper-dark)',
        ink: 'var(--color-ink)',
        chalk: 'var(--color-chalk)',
        muted: 'var(--color-muted)',
        'dollar-green': 'var(--color-dollar-green)',
        'dollar-green-dim': 'var(--color-dollar-green-dim)',
        'naira-green': 'var(--color-naira-green)',
        'naira-green-dim': 'var(--color-naira-green-dim)',
        brass: 'var(--color-brass)',
        'brass-dim': 'var(--color-brass-dim)',
        vermilion: 'var(--color-vermilion)',
        'vermilion-dim': 'var(--color-vermilion-dim)',
        'glass-bg': 'var(--glass-bg)',
        'glass-edge': 'var(--glass-edge)',
        'glass-shine': 'var(--glass-shine)',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['"Hanken Grotesk"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
        'glass-lg': '0 20px 48px -8px rgba(0, 0, 0, 0.65)',
        stamp: 'inset 0 0 0 2px currentColor, 0 2px 8px rgba(0, 0, 0, 0.15)',
        ledger: '0 4px 20px -2px rgba(11, 18, 16, 0.25)',
      },
      backdropBlur: {
        glass: '22px',
      },
    },
  },
  plugins: [],
}
