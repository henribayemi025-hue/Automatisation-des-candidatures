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
        base: '#FAF6F0',
        cream: '#FAF6F0',
        hairline: '#E8DFD1',
        brass: '#E09F3E',
        muted: '#6B6B6B',
        teal: { DEFAULT: '#C25E38', hover: '#D95D39', light: '#F4EFE6' },
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
          DEFAULT: '#171B26',
          700: '#2A3247',
          800: '#232B3E',
          900: '#171B26',
          950: '#10131C',
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
        display: ['Fraunces', 'Georgia', 'serif'],
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
