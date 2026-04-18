import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  envPrefix: ['VITE_'],
  server: {
    port: 5173,
  },
});
