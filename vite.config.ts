import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      // These headers are REQUIRED for high-performance WASM/OPFS
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  optimizeDeps: {
    // Prevent Vite from confusing the sqlite dependency
    exclude: ['@sqlite.org/sqlite-wasm'],
  },
});