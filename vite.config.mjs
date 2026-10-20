import { defineConfig } from 'vite';
export default defineConfig({
  base: './',
  build: { target: 'es2022', outDir: 'dist', emptyOutDir: true, sourcemap: true },
  server: { host: '0.0.0.0', port: 8000, strictPort: true },
  preview: { host: '0.0.0.0', port: 8000, strictPort: true },
});
