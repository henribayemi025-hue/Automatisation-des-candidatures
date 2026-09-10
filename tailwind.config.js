/**
 * Finia — palette « Terre & Or », alignée sur le design system Finjaro :
 * crème, terracotta, laiton, encres chaudes.
 */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FAF6F0',
        hairline: '#E8DFD1',
        brass: '#E09F3E',
        brand: {
          50: '#FBF4EF',
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
          700: '#2A3247',
          800: '#232B3E',
          900: '#171B26',
          950: '#10131C',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
