import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  // В продакшене это не используется, но оставим для совместимости
  server: {
    host: true,
    port: 80,
  }
});
