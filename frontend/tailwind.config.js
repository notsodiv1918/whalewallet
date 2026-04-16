export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        noir: {
          900: "#080808",
          800: "#111111",
          700: "#1a1a1a",
          600: "#242424",
        }
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "monospace"],
        sans: ["'Inter'", "sans-serif"],
      }
    }
  },
  plugins: []
}
