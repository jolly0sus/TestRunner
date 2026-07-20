import { defineConfig } from 'vite';

// Relative base so the built bundle also runs when opened directly from disk
// or embedded in a playable-ad iframe.
export default defineConfig({
  base: './',
  server: {
    host: true,
    port: 5173,
    open: true,
  },
  build: {
    target: 'es2021',
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
});
