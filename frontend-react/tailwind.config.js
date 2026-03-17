/** @type {import('tailwindcss').Config} */
export default {
  // --- 关键点在这里 ---
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // 确保这行存在且路径正确
  ],
  // -------------------
  theme: {
    extend: {},
  },
  plugins: [],
}
