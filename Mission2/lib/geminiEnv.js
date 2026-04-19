/**
 * Repo-root `.env` is loaded via `vite.config.mjs` (`envDir`).
 * Use only static `import.meta.env.*` names so Vite can inject values at build time.
 * Mirrors Mission1 `lib/server-env` variable names (without `process.env`).
 */
export function readGeminiKey() {
  return String(
    import.meta.env.VITE_GEMINI_API_KEY ||
      import.meta.env.GEMINI_API_KEY ||
      import.meta.env.GOOGLE_API_KEY ||
      import.meta.env.GOOGLE_AI_API_KEY ||
      import.meta.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      "",
  ).trim();
}

/** Default aligned with Mission1 `lib/gemini-text` first model. */
export function readGeminiModel() {
  return String(import.meta.env.VITE_GEMINI_MODEL || "gemini-2.0-flash").trim();
}
