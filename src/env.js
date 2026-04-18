/**
 * All client-side secrets and config come from `.env` at project root.
 * Vite injects only variables prefixed with `VITE_` (see vite.config.js envPrefix).
 */
export function getClientEnv() {
  return {
    supabaseUrl: String(import.meta.env.VITE_SUPABASE_URL ?? '').trim(),
    supabaseAnonKey: String(import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim(),
    geminiApiKey: String(import.meta.env.VITE_GEMINI_API_KEY ?? '').trim(),
    elevenLabsApiKey: String(import.meta.env.VITE_ELEVENLABS_API_KEY ?? '').trim(),
  };
}
