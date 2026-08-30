import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    assetsInlineLimit: 2048,
    rollupOptions: {
      output: {
        // GSAP is the only heavy dependency; keep it in its own chunk so the
        // shell and the first paint never wait on it.
        manualChunks: { gsap: ['gsap'] },
      },
    },
  },
});
