/**
 * All client-side secrets and config come from `.env` at project root.
 * Vite injects only variables prefixed with `VITE_` (see vite.config.js envPrefix).
 */
export function getClientEnv() {
  const mission1FromEnv = String(import.meta.env.VITE_MISSION1_URL ?? '').trim();
  return {
    supabaseUrl: String(import.meta.env.VITE_SUPABASE_URL ?? '').trim(),
    supabaseAnonKey: String(import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim(),
    geminiApiKey: String(import.meta.env.VITE_GEMINI_API_KEY ?? '').trim(),
    elevenLabsApiKey: String(import.meta.env.VITE_ELEVENLABS_API_KEY ?? '').trim(),
    /**
     * Base URL where Mission1 is reachable (no trailing slash).
     * Empty: same origin as the dossier, path `/mission1` (Vite dev proxy → Next on :3000).
     * Set for production, e.g. `https://example.com/mission1` or a dedicated Next origin.
     */
    mission1Url: mission1FromEnv,
  };
}
