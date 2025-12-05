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
        sans: ['Inter', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
      },
      boxShadow: {
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

