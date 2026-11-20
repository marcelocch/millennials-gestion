import type { Config } from 'tailwindcss'

// Colores tomados del logo de Millennials: azul marino y la llama ámbar → naranja.
export default <Partial<Config>>{
  content: ['./components/**/*.vue', './layouts/**/*.vue', './pages/**/*.vue', './app.vue'],
  theme: {
    extend: {
      fontFamily: { sans: ['Figtree', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      colors: {
        marino: { DEFAULT: '#021B49', 900: '#01122F', 800: '#021B49', 700: '#0B2A66', 600: '#17408F', 500: '#2C5CC0', 300: '#9DB4E3', 100: '#E4EBF9', 50: '#F2F5FC' },
        llama: { DEFAULT: '#FF8403', ambar: '#FFAE00', naranja: '#FF8403', 700: '#C25E00', 100: '#FFEFD6', 50: '#FFF8EB' },
        papel: '#F3F5FA',
        tinta: { DEFAULT: '#0B1B3F', suave: '#4E5B7C', tenue: '#8690AA' },
        regla: '#DCE1ED',
        ok: { DEFAULT: '#12805C', fondo: '#E3F4EC' },
        aviso: { DEFAULT: '#A86400', fondo: '#FFF1D6' },
        mora: { DEFAULT: '#C2362F', fondo: '#FCE8E6' },
      },
      borderRadius: { panel: '14px' },
    },
  },
}
