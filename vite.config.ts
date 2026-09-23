import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // يجعل كافة مسارات الملفات المترجمة نسبية وتعمل على GitHub Pages بدون مشاكل
})
