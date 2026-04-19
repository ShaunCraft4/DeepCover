export type PsychType = "narcissist" | "deflector" | "minimizer" | "projector";

export interface SuspectProfile {
  name: string;
  age: number;
  occupation: string;
  surface_story: string;
  hidden_truth: string;
  launch_code: string;
  psychological_profile: {
    type: PsychType;
    tells: string[];
    vulnerability_triggers: string[];
  };
  known_facts: string[];
  contradictions_to_plant: string[];
  voice_id: string;
  micro_expression_states: {
    neutral: string;
    nervous: string;
    caught: string;
    smug: string;
  };
}

export type PublicSuspectProfile = Omit<SuspectProfile, "hidden_truth" | "launch_code">;

export interface Turn {
  id: string;
  role: "user" | "spy";
  content: string;
  timestamp: number;
}

export interface SpyStatement {
  id: string;
  turnId: string;
  text: string;
}

export interface ContradictionEntry {
  id: string;
  statementA: string;
  statementB: string;
  autoDetected: boolean;
  createdAt: number;
  spyTurnId?: string;
}

export interface Mission2Secrets {
  hidden_truth: string;
  launch_code: string;
}

export interface VerdictPayload {
  what_hiding: string;
  key_evidence: string;
  recommended_action: "Detain" | "Release" | "Further Interrogation";
}

export type Mission2Phase = "briefing" | "interrogation" | "verdict" | "debrief";

export interface DebriefClientPayload {
  hidden_truth: string;
  planted_contradictions: string[];
  caught_summary: string[];
  missed_summary: string[];
  rating: "ELITE" | "PROFICIENT" | "DEVELOPING" | "COMPROMISED";
  score: number;
  xp: number;
  dimensions: {
    contradiction: number;
    verdict: number;
    evidence: number;
    speed: number;
  };
  rationale?: string;
}
