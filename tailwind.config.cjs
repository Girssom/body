/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx,jsx,js}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['system-ui', 'ui-sans-serif', 'sans-serif'],
      },
      colors: {
        // 接近 iOS 系统蓝
        brand: {
          50: '#f5f8ff',
          100: '#e3efff',
          200: '#c3ddff',
          300: '#8fbfff',
          400: '#559dff',
          500: '#007aff',
          600: '#0062cc',
          700: '#004a99',
          800: '#00366f',
          900: '#002244'
        }
      },
      boxShadow: {
        card: '0 12px 30px rgba(15, 23, 42, 0.08)',
      },
    },
  },
  plugins: [],
};

