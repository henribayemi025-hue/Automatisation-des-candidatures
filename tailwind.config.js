/**
 * Finjaro Accounting — design system « Terre & Or », identique à la marketplace :
 * crème, terracotta, laiton, encres chaudes. Valeurs verrouillées.
 */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Surfaces et encres passent par des variables : un seul jeu de classes
        // pour le mode clair et le mode sombre.
        base: 'rgb(var(--c-base) / <alpha-value>)',
        cream: 'rgb(var(--c-base) / <alpha-value>)',
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        hairline: 'rgb(var(--c-hairline) / <alpha-value>)',
        brass: 'rgb(var(--c-brass) / <alpha-value>)',
        muted: 'rgb(var(--c-muted) / <alpha-value>)',
        teal: {
          DEFAULT: 'rgb(var(--c-accent) / <alpha-value>)',
          hover: 'rgb(var(--c-accent-hover) / <alpha-value>)',
          light: 'rgb(var(--c-accent-soft) / <alpha-value>)',
        },
        brand: {
          50: '#F4EFE6',
          100: '#F4E9DE',
          200: '#EACBB8',
          300: '#DEA98D',
          400: '#D08363',
          500: '#C25E38',
          600: '#AC4F2D',
          700: '#8F4126',
          800: '#74351F',
          900: '#5E2B1A',
        },
        ink: {
          DEFAULT: 'rgb(var(--c-ink) / <alpha-value>)',
          700: 'rgb(var(--c-ink-700) / <alpha-value>)',
          800: 'rgb(var(--c-ink-800) / <alpha-value>)',
          900: 'rgb(var(--c-ink) / <alpha-value>)',
          950: 'rgb(var(--c-ink-950) / <alpha-value>)',
        },
        vintage: {
          plum: '#7C5295',
          green: '#2F6D62',
          mustard: '#B8860B',
          bronze: '#8C6A3D',
          slate: '#4A5568',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        // Titres : la serif Finjaro, réservée aux en-têtes d'écran et à la marque.
        display: ['Fraunces', 'Georgia', 'serif'],
        // Chiffres : grotesque à chasse fixe, comme sur les outils financiers.
        figure: ['IBM Plex Sans', 'Inter', 'SF Mono', 'monospace'],
      },
      fontSize: {
        title: ['22px', { lineHeight: '1.3', fontWeight: '600' }],
        section: ['18px', { lineHeight: '1.35', fontWeight: '600' }],
        body: ['15px', { lineHeight: '1.5', fontWeight: '400' }],
        caption: ['13px', { lineHeight: '1.5', fontWeight: '400' }],
      },
      borderRadius: {
        input: '8px',
        card: '12px',
        pill: '24px',
      },
      transitionDuration: {
        DEFAULT: '175ms',
      },
    },
  },
  plugins: [],
};
