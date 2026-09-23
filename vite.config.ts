import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // 👈 يضمن تحميل ملفات CSS و JS من المسار الصحيح
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
