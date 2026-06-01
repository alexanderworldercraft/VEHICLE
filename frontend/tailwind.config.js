/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    ".public/*.{js,jsx,ts,tsx,html}"
  ],
  theme: {
    extend: {
      aspectRatio: {
        '2/3': '2 / 3',
      },
      minWidth: {
        '192': '48rem',
      },
    },
  },
  plugins: [],
}