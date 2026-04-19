import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { config as loadDotenv } from "dotenv";

/**
 * Resolve repo root (DeepCover) so we always load the same `.env` as Vite (`envDir: '.'`).
 * `import.meta.url` from `Mission1/lib/*` is stable; bundled chunks may not be — fall back to `cwd`.
 */
function resolveRepoRoot(): string {
  const fromThisFile = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
  const candidates = [
    fromThisFile,
    path.join(process.cwd(), ".."),
    process.cwd(),
  ];
  for (const dir of candidates) {
    try {
      const mission1 = path.join(dir, "Mission1", "package.json");
      const envFile = path.join(dir, ".env");
      if (fs.existsSync(mission1) && fs.existsSync(envFile)) {
        return dir;
      }
    } catch {
      /* continue */
    }
  }
  return fromThisFile;
}

const REPO_ROOT = resolveRepoRoot();

for (const name of [".env", ".env.local"]) {
  const p = path.join(REPO_ROOT, name);
  if (fs.existsSync(p)) {
    loadDotenv({ path: p, override: true });
  }
}

/**
 * Gemini / Google AI — read from repo-root `.env` (see `VITE_GEMINI_API_KEY` or `GEMINI_API_KEY`).
 * Order: un-prefixed server vars first, then Vite-exposed names.
 */
export function getGeminiApiKey(): string {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    ""
  ).trim();
}

export function getElevenLabsApiKey(): string {
  return (process.env.ELEVENLABS_API_KEY || process.env.VITE_ELEVENLABS_API_KEY || "").trim();
}

export function getElevenLabsVoiceId(): string {
  return (process.env.ELEVENLABS_VOICE_ID || process.env.VITE_ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM").trim();
}
