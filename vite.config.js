import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  esbuild: {
    legalComments: 'none',
  },
  test: {
    environment: 'node',
  },
});
