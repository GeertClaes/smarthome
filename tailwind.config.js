/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx,mdx}",
    "./components/**/*.{js,jsx,ts,tsx,mdx}",
    "./lib/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        jws11: {
          primary: "#0b8a80",
          "primary-content": "#ecfffb",
          secondary: "#7fd9c4",
          "secondary-content": "#042120",
          accent: "#5ec4f0",
          "accent-content": "#041018",
          neutral: "#152232",
          "neutral-content": "#d8ebfb",
          "base-100": "#0a121c",
          "base-200": "#101a28",
          "base-300": "#162232",
          "base-content": "#e8f4ff",
          info: "#5ec4f0",
          success: "#7fd9c4",
          warning: "#f5c26b",
          error: "#f87171",
        },
      },
    ],
  },
};
