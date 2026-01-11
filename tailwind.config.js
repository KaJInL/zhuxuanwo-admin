/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [function ({ addBase, theme }) {
    addBase({
      '.el-button': {
        'background-color': 'var(--el-button-bg-color,val(--el-color-white))',
      },
    })
  },],
  corePlugins: {
    preflight: true
  }
}
