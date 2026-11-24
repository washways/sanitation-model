/**
 * Palette and type follow the WASHways app family (see apps.washways.org/waterpointplanner):
 * dark navy top bar, teal primary, cool grey page, flat white cards with a thin border.
 * @type {import('tailwindcss').Config}
 */
export default {
  content: ['./index.html', './*.{ts,tsx}', './components/**/*.{ts,tsx}', './utils/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Hanken Grotesk"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
      colors: {
        navy: '#263238', // top bar
        'navy-sub': '#9FB0B6', // top bar subtitle
        'navy-tab': '#26A6C1', // active tab underline
        page: '#EEF1F2', // page background
        line: '#DDE2E4', // card borders
        'brand-primary': '#0B6E80', // teal: buttons, links, key figures
        'brand-dark': '#263238', // headings / dark surfaces
        'brand-accent': '#26A6C1', // secondary highlight
        'brand-surface': '#E8F2F4', // light teal tint
        // Re-map sky so existing hover states use the teal family.
        sky: {
          50: '#E8F2F4',
          100: '#CFE5EA',
          500: '#095C6B',
          600: '#095C6B',
        },
      },
    },
  },
  plugins: [],
};
