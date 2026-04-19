import { defineConfig } from 'vite';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Next.js Mission1 uses `basePath: "/mission1"`, so chunks live at `/mission1/_next/...`.
 * If anything requests `/_next/...` without the prefix (e.g. devtools or a stale tab), Vite would
 * 404 — rewrite those to the Next app.
 */
const mission1DevProxy = {
  '/mission1': {
    target: 'http://127.0.0.1:3000',
    changeOrigin: true,
    /** Next.js dev HMR / WebSocket — use only http://localhost:5173 for Mission1 in the browser. */
    ws: true,
  },
  '/_next': {
    target: 'http://127.0.0.1:3000',
    changeOrigin: true,
    rewrite: (path) => '/mission1' + path,
  },
};

/** Mission2 / Mission3 — extra HTML entries on :5173 (multi-page app). */
const devProxy = { ...mission1DevProxy };

export default defineConfig({
  root: '.',
  /** Repo-root `.env` — same file `src/env.js` documents. */
  envDir: '.',
  /** Dossier: `VITE_`. Mission2 `lib/geminiEnv.js` also reads `GEMINI_*` / `GOOGLE_*` (static names). */
  envPrefix: ['VITE_', 'GEMINI_', 'GOOGLE_', 'PUBLIC_'],
  server: {
    port: 5173,
    strictPort: true,
    proxy: devProxy,
  },
  preview: {
    port: 4173,
    proxy: devProxy,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        mission2: resolve(__dirname, 'Mission2/index.html'),
        mission3: resolve(__dirname, 'Mission3/index.html'),
      },
    },
  },
});
