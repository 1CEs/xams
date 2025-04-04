import type { Config } from "tailwindcss";
import { nextui } from '@nextui-org/react'

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: "class",
  plugins: [nextui({
    prefix: "nextui", // prefix for themes variables
    addCommonColors: false, // override common colors (e.g. "blue", "green", "pink").
    defaultTheme: "dark", // default theme from the themes object
    defaultExtendTheme: "light", // default theme to extend on custom themes
    layout: {}, // common layout tokens (applied to all themes)
    themes: {
      light: {
        layout: {}, // light theme layout tokens
        colors: {
          primary: "#82f4b1",
          secondary: "#30c67c",
          background: "#ECFFEB",
          foreground: "#000",
        }, // light theme colors
      },
      dark: {
        layout: {}, // dark theme layout tokens
        colors: {
          primary: "#82f4b1",
          secondary: "#30c67c",
          background: "#101010",
          foreground: "#eee",
        }, // dark theme colors
      },
      // ... custom themes
    },
  })],
};
export default config;
