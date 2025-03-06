/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        parabole: ["Parabole", "sans-serif"],
        fraktion: ["Fraktion", "sans-serif"],
        valorax:   ["Valorax" , "sans-serif"],
        dragon:   ["Dragon" , "sans-serif"],
        monst  : ["Montserrat", "sans-serif"]
      
      },
    },
  },
  plugins: [],
};
