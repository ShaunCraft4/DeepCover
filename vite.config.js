import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  // Mission 02 keeps its env vars in Mission2/.env
  envDir: 'Mission2',
  envPrefix: ['VITE_'],
  server: {
    port: 5173,
  },
});
