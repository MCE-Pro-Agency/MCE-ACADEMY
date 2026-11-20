import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Bleu clair MCE (logo)
        brand: {
          50: '#EBF7FD',
          100: '#D4EEFB',
          200: '#A9DCF6',
          300: '#7BC8F0',
          400: '#4FB4E8',
          500: '#2B9FDC',
          600: '#1C82BD',
          700: '#186898',
          800: '#16547A',
          900: '#123F5C',
        },
        // Bleu foncé / marine MCE
        navy: {
          50: '#EEF3F8',
          100: '#D5E0EC',
          200: '#AABFD6',
          300: '#7898B8',
          400: '#4D7299',
          500: '#30567E',
          600: '#224466',
          700: '#183452',
          800: '#112842',
          900: '#0B1D33',
          950: '#06111F',
        },
        // Doré — à utiliser avec parcimonie (badges, certificats, distinctions)
        gold: {
          100: '#FBF3D6',
          300: '#EBD27E',
          400: '#DDBA4C',
          500: '#C9A227',
          600: '#A6841C',
        },
      },
      fontFamily: {
        sans: ['"Noto Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', '"Noto Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(11, 29, 51, 0.04), 0 4px 16px rgba(11, 29, 51, 0.06)',
        lift: '0 10px 30px rgba(11, 29, 51, 0.12)',
      },
      keyframes: {
        'fade-in': { from: { opacity: 0, transform: 'translateY(6px)' }, to: { opacity: 1, transform: 'none' } },
        grow: { from: { width: '0%' } },
      },
      animation: {
        'fade-in': 'fade-in .35s ease-out both',
        grow: 'grow .9s ease-out both',
      },
    },
  },
  plugins: [typography],
};
