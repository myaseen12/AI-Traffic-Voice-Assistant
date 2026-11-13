/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        deepNavy: '#071B35',
        darkNavy: '#092B50',
        bodyDark: '#26364A',
        royalBlue: '#1479E8',
        royalBlueHover: '#1067C7',
        brightBlue: '#1685F5',
        lightBlue: '#EAF2FC',
        cardBorder: '#E2E8F0',
        subtleBorder: '#D1E3F8',
        mainBg: '#F7F9FC',
        mainText: '#10233F',
        mutedGrey: '#64748B',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 10px rgba(6, 29, 56, 0.04)',
        'card-hover': '0 8px 24px rgba(6, 29, 56, 0.08)',
        subtle: '0 1px 4px rgba(6, 29, 56, 0.03)',
      }
    },
  },
  plugins: [],
};
