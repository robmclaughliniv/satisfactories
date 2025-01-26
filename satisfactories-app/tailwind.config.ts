import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      minHeight: {
        screen: '100vh',
        full: '100%',
      },
      height: {
        screen: '100vh',
        full: '100%',
      },
      colors: {
        dark: {
          '950': '#0a0a0a',
          '900': '#171717',
          '800': '#262626',
        },
      },
    },
  },
  plugins: [],
}

export default config
