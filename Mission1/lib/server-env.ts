import path from "path";
import { fileURLToPath } from "url";
import { config as loadDotenv } from "dotenv";

/**
 * Repo root = Mission1/lib -> ../..
 * Next's `loadEnvConfig` in `next.config.mjs` can miss keys if `process.env` already has empty
 * placeholders. We re-load the same files Vite uses with `override: true` so repo-root `.env`
 * wins for API routes. `dotenv` ignores missing files (no `fs` needed — avoids webpack edge cases).
 */
const REPO_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

for (const name of [".env", ".env.local"]) {
  loadDotenv({ path: path.join(REPO_ROOT, name), override: true });
}

export function getGeminiApiKey(): string {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    ""
  ).trim();
}

export function getElevenLabsApiKey(): string {
  return (process.env.ELEVENLABS_API_KEY || process.env.VITE_ELEVENLABS_API_KEY || "").trim();
}

export function getElevenLabsVoiceId(): string {
  return (process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM").trim();
}
