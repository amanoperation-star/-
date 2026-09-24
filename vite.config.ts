import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // <--- هذه الإضافة هي المسؤولة عن تجميع وتحويل تنسيقات Tailwind والألوان للموقع
  ],
  server: {
    hmr: false,
  },
  base: './', // يجعل كافة مسارات الملفات المترجمة نسبية وتعمل على GitHub Pages بدون مشاكل
})
