import { defineConfig } from 'vite';

export default defineConfig({
  root: 'app',
  base: '/magic_and_movement/',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
});