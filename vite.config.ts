import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // السطر ده هو اللي بيخلي كل ملفات الـ JS والـ CSS تفتح صح على GitHub Pages
})
