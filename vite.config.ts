/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/pop/',
  build: {
    outDir: 'dist',
    target: 'es2022',
  },
  test: {
    environment: 'node',
  },
});
