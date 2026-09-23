import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // يضمن تحميل كافة ملفات الـ CSS والـ JS من المسارات النسبية الصحيحة
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
