/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palet utama dibaca dari variabel CSS agar TEMA bisa mengganti warna
        // tanpa mengubah satu pun kelas di komponen (lihat src/index.css).
        clinical: {
          50: 'rgb(var(--clinical-50) / <alpha-value>)',
          100: 'rgb(var(--clinical-100) / <alpha-value>)',
          200: 'rgb(var(--clinical-200) / <alpha-value>)',
          300: 'rgb(var(--clinical-300) / <alpha-value>)',
          400: 'rgb(var(--clinical-400) / <alpha-value>)',
          500: 'rgb(var(--clinical-500) / <alpha-value>)',
          600: 'rgb(var(--clinical-600) / <alpha-value>)',
          700: 'rgb(var(--clinical-700) / <alpha-value>)',
          800: 'rgb(var(--clinical-800) / <alpha-value>)',
          900: 'rgb(var(--clinical-900) / <alpha-value>)',
          navy: 'rgb(var(--clinical-navy) / <alpha-value>)',
          sidebar: 'rgb(var(--clinical-sidebar) / <alpha-value>)',
          dark: 'rgb(var(--clinical-dark) / <alpha-value>)',
        },
        teal: {
          medical: '#0d9488',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
