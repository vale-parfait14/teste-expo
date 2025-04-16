module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#128C7E',
          dark: '#075E54',
          light: '#25D366'
        },
        secondary: '#34B7F1',
        whatsapp: {
          'light-green': '#DCF8C6',
          'chat-bg': '#E5DDD5',
        }
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      maxHeight: {
        '3/4': '75vh',
      },
      minHeight: {
        '1/2': '50vh',
      }
    },
    screens: {
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
      'tv': '1920px',
    },
  },
  plugins: [],
}