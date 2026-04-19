import { defineConfig } from 'vite';

/**
 * Next.js Mission1 uses `basePath: "/mission1"`, so chunks live at `/mission1/_next/...`.
 * If anything requests `/_next/...` without the prefix (e.g. devtools or a stale tab), Vite would
 * 404 — rewrite those to the Next app.
 */
const mission1DevProxy = {
  "/mission1": {
    target: "http://127.0.0.1:3000",
    changeOrigin: true,
  },
  "/_next": {
    target: "http://127.0.0.1:3000",
    changeOrigin: true,
    rewrite: (path) => "/mission1" + path,
  },
};

export default defineConfig({
  root: '.',
  // Mission 02 keeps its env vars in Mission2/.env
  envDir: 'Mission2',
  envPrefix: ['VITE_'],
  server: {
    port: 5173,
    proxy: mission1DevProxy,
  },
  preview: {
    port: 4173,
    proxy: mission1DevProxy,
  },
});
