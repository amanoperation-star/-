import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    cssCodeSplit: false, // 👈 يضمن تجميع كل التنسيقات في ملف CSS واحد وعدم تشتيتها
  },
});
