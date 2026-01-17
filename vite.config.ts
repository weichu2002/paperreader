
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          // pdfjs-dist is loaded via CDN, do not bundle it
          vendor: ['react', 'react-dom', 'react-router-dom']
        }
      }
    }
  }
});
