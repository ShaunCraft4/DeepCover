import type { PsychType, PublicSuspectProfile, SuspectProfile } from "./types";

const PSYCH: PsychType[] = ["narcissist", "deflector", "minimizer", "projector"];

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function isStringArray(v: unknown, min: number): v is string[] {
  return Array.isArray(v) && v.length >= min && v.every((x) => typeof x === "string");
}

export function validateSuspectProfile(raw: unknown): SuspectProfile | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const psych = o.psychological_profile;
  if (!psych || typeof psych !== "object") return null;
  const p = psych as Record<string, unknown>;
  const micro = o.micro_expression_states;
  if (!micro || typeof micro !== "object") return null;
  const m = micro as Record<string, unknown>;

  const psychType = p.type;
  if (!PSYCH.includes(psychType as PsychType)) return null;

  if (!isNonEmptyString(o.name)) return null;
  if (typeof o.age !== "number" || !Number.isFinite(o.age) || o.age < 16 || o.age > 90) return null;
  if (!isNonEmptyString(o.occupation)) return null;
  if (!isNonEmptyString(o.surface_story)) return null;
  if (!isNonEmptyString(o.hidden_truth)) return null;
  if (!isNonEmptyString(o.launch_code)) return null;
  if (!/^[A-Z0-9]{6}$/i.test(String(o.launch_code).trim())) return null;
  if (!isStringArray(o.known_facts, 1)) return null;
  if (!isStringArray(o.contradictions_to_plant, 3)) return null;
  if (!isNonEmptyString(o.voice_id)) return null;
  if (!isStringArray(p.tells, 1)) return null;
  if (!isStringArray(p.vulnerability_triggers, 1)) return null;

  for (const key of ["neutral", "nervous", "caught", "smug"] as const) {
    if (!isNonEmptyString(m[key])) return null;
  }

  return {
    name: String(o.name).trim(),
    age: Math.round(o.age),
    occupation: String(o.occupation).trim(),
    surface_story: String(o.surface_story).trim(),
    hidden_truth: String(o.hidden_truth).trim(),
    launch_code: String(o.launch_code).trim().toUpperCase(),
    psychological_profile: {
      type: psychType as PsychType,
      tells: (p.tells as string[]).map((x) => x.trim()),
      vulnerability_triggers: (p.vulnerability_triggers as string[]).map((x) => x.trim()),
    },
    known_facts: (o.known_facts as string[]).map((x) => x.trim()),
    contradictions_to_plant: (o.contradictions_to_plant as string[]).map((x) => x.trim()),
    voice_id: String(o.voice_id).trim(),
    micro_expression_states: {
      neutral: String(m.neutral).trim(),
      nervous: String(m.nervous).trim(),
      caught: String(m.caught).trim(),
      smug: String(m.smug).trim(),
    },
  };
}

export function toPublicSuspect(s: SuspectProfile): PublicSuspectProfile {
  const { hidden_truth: _h, launch_code: _l, ...rest } = s;
  return rest;
}
