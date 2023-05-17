/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [
    require('tailwind-scrollbar-hide'),
    require('@tailwindcss/line-clamp'),
    require('@tailwindcss/typography'),
    require('daisyui'),
  ],

  daisyui: {
    styled: true,
    themes: [{
      light: {
        ...require("daisyui/src/colors/themes")["[data-theme=light]"],
        "--rounded-btn": "0.15rem",
      },
    }, {
      dark: {
        ...require("daisyui/src/colors/themes")["[data-theme=dark]"],
        "--rounded-btn": "0.15rem",
      }
    }],
    base: true,
    utils: true,
    logs: true,
    rtl: false,
    prefix: "",
    darkTheme: "dark",
  },
}
