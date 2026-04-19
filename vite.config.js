import { defineConfig } from 'vite';

const mission1Proxy = {
  "/mission1": {
    target: "http://127.0.0.1:3000",
    changeOrigin: true,
  },
};

export default defineConfig({
  root: '.',
  // Mission 02 keeps its env vars in Mission2/.env
  envDir: 'Mission2',
  envPrefix: ['VITE_'],
  server: {
    port: 5173,
    proxy: mission1Proxy,
  },
  preview: {
    port: 4173,
    proxy: mission1Proxy,
  },
});
