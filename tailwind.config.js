/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--canvas)',
        surface: 'var(--surface)',
        ink: {
          DEFAULT: 'var(--ink)',
          60: 'var(--ink-60)',
          45: 'var(--ink-45)',
          40: 'var(--ink-40)',
        },
        hairline: 'var(--hairline)',
        'dusty-blue': 'var(--dusty-blue)',
        sage: 'var(--sage)',
        'sand-gold': 'var(--sand-gold)',
        terracotta: 'var(--terracotta)',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        display: ['36px', { lineHeight: '40px', fontWeight: '600' }],
        heading: ['24px', { lineHeight: '28px', fontWeight: '600' }],
        subhead: ['18px', { lineHeight: '24px' }],
        body: ['16px', { lineHeight: '1.6' }],
        caption: ['13px', { lineHeight: '1.4' }],
        micro: ['12px', { lineHeight: '1.4' }],
      },
      borderRadius: {
        card: '20px',
        button: '12px',
        badge: '8px',
        pill: '9999px',
      },
      maxWidth: {
        column: '720px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(2,16,52,0.04)',
        pop: '0 12px 32px rgba(2,16,52,0.12)',
      },
      transitionTimingFunction: {
        calm: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
}
