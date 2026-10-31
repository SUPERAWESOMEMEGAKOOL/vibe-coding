import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Relative assets work both locally and under the GitHub Pages repository path.
  base: './',
  plugins: [react()],
  server: { host: '0.0.0.0', port: 5173, strictPort: true },
  build: { rollupOptions: { output: { manualChunks: { math: ['katex'] } } } },
});
