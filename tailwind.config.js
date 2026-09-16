/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        mc: {
          action: 'rgb(var(--mc-action) / <alpha-value>)',
          structure: 'rgb(var(--mc-structure) / <alpha-value>)',
          background: 'rgb(var(--mc-background) / <alpha-value>)',
          surface: { DEFAULT: 'rgb(var(--mc-surface) / <alpha-value>)', secondary: 'rgb(var(--mc-surface-secondary) / <alpha-value>)' },
          border: 'rgb(var(--mc-border) / <alpha-value>)',
          text: { primary: 'rgb(var(--mc-text-primary) / <alpha-value>)', secondary: 'rgb(var(--mc-text-secondary) / <alpha-value>)' },
          success: 'rgb(var(--mc-success) / <alpha-value>)',
          warning: 'rgb(var(--mc-warning) / <alpha-value>)',
          error: 'rgb(var(--mc-error) / <alpha-value>)',
          info: 'rgb(var(--mc-info) / <alpha-value>)',
          focus: 'rgb(var(--mc-focus) / <alpha-value>)',
        },
        primary: {
          dark: '#0a0e1a',
          blue: '#3b82f6',
          accent: '#0ea5e9',
          red: '#DC2626',
          orange: '#f97316',
        },
        brand: {
          red: '#DC2626',
          black: '#000000',
          white: '#FFFFFF',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
        display: ['var(--font-space-grotesk)', 'Space Grotesk', 'sans-serif'],
        'mc-interface': ['var(--font-inter)', 'Inter', 'sans-serif'],
        'mc-display': ['var(--font-space-grotesk)', 'Space Grotesk', 'sans-serif'],
      },
      // New utilities are opt-in; native Tailwind scales remain intact.
      fontSize: {
        'mc-display': ['3rem', { lineHeight: '3.5rem', fontWeight: '700' }],
        'mc-h1': ['2.25rem', { lineHeight: '2.75rem', fontWeight: '600' }],
        'mc-h2': ['1.75rem', { lineHeight: '2.25rem', fontWeight: '600' }],
        'mc-h3': ['1.375rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        'mc-body': ['1rem', { lineHeight: '1.5rem', fontWeight: '400' }],
        'mc-small': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '400' }],
        'mc-caption': ['0.75rem', { lineHeight: '1rem', fontWeight: '400' }],
      },
      borderRadius: {
        'mc-small': 'var(--mc-radius-small)',
        'mc-medium': 'var(--mc-radius-medium)',
        'mc-large': 'var(--mc-radius-large)',
        'mc-full': 'var(--mc-radius-full)',
      },
      spacing: Object.fromEntries([4, 8, 12, 16, 24, 32, 48, 64].map(value => [`mc-${value}`, `var(--mc-space-${value})`])),
      transitionDuration: {
        'mc-fast': 'var(--mc-motion-fast)',
        'mc-normal': 'var(--mc-motion-normal)',
        'mc-slow': 'var(--mc-motion-slow)',
      },
      boxShadow: {
        'mc-none': 'var(--mc-shadow-none)',
        'mc-subtle': 'var(--mc-shadow-subtle)',
        'mc-elevated': 'var(--mc-shadow-elevated)',
        'glow-primary': '0 0 20px rgba(59, 130, 246, 0.5)',
        'glow-accent': '0 0 20px rgba(14, 165, 233, 0.5)',
      },
      backgroundImage: {
        'gradient-hero': 'radial-gradient(ellipse at top, rgba(59, 130, 246, 0.1), transparent)',
        'gradient-card': 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(14, 165, 233, 0.1))',
        'gradient-text': 'linear-gradient(135deg, #3b82f6, #0ea5e9)',
      },
    },
  },
  plugins: [],
}
