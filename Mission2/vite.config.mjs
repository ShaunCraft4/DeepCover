import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** Same repo-root `.env` as Dossier + Mission1 (`DeepCover/.env`). */
const repoRoot = path.join(__dirname, "..");

export default defineConfig({
  root: __dirname,
  /** Match folder name `Mission2/` in the URL (case-sensitive on Linux hosts). */
  base: "/Mission2/",
  envDir: repoRoot,
  envPrefix: ["VITE_", "GEMINI_", "GOOGLE_", "PUBLIC_"],
  /**
   * Normal full-stack dev: run `npm run dev` from the repo root — Mission2 is served on :5173
   * as a second HTML entry (no separate port). Use this config only for `npm run dev` / `build`
   * inside `Mission2/` alone.
   */
  server: {
    port: 5173,
    strictPort: false,
  },
  preview: {
    port: 4173,
  },
});
