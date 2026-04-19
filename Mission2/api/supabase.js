import { createClient } from "@supabase/supabase-js";

let cachedClient = null;
const localSessions = new Map();

function buildLocalSessionId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function createLocalSession(payload) {
  const session_id = buildLocalSessionId();
  const row = {
    session_id,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    ...payload,
  };
  localSessions.set(session_id, row);
  return row;
}

function getSupabaseClient() {
  if (cachedClient) return cachedClient;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const serviceRole = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  const clientKey = serviceRole || anonKey;

  if (!supabaseUrl || !clientKey) {
    throw new Error(
      "Mission2 Supabase env vars are missing. Set VITE_SUPABASE_URL and a key in Mission2/.env.",
    );
  }

  cachedClient = createClient(supabaseUrl, clientKey);
  return cachedClient;
}

export function hasSupabaseConfig() {
  return Boolean(
    import.meta.env.VITE_SUPABASE_URL &&
      (import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY),
  );
}

export async function createSession(hiddenTruth, secretCode, fullSuspect, clearanceLevel) {
  const payload = {
    hidden_truth: hiddenTruth,
    secret_code: secretCode,
    full_suspect: fullSuspect,
    clearance_level: clearanceLevel,
  };

  if (!hasSupabaseConfig()) {
    return createLocalSession(payload).session_id;
  }

  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from("mission2_sessions")
      .insert(payload)
      .select("session_id")
      .single();
    if (error) throw error;
    return data.session_id;
  } catch {
    return createLocalSession(payload).session_id;
  }
}

export async function getSession(sessionId) {
  if (localSessions.has(sessionId)) return localSessions.get(sessionId);
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("mission2_sessions")
    .select("*")
    .eq("session_id", sessionId)
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSession(sessionId) {
  if (localSessions.has(sessionId)) {
    localSessions.delete(sessionId);
    return;
  }
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("mission2_sessions").delete().eq("session_id", sessionId);
  if (error) throw error;
}
