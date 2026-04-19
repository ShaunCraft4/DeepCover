"use client";

import { create } from "zustand";

import type {
  ContradictionEntry,
  DebriefClientPayload,
  Mission2Phase,
  PublicSuspectProfile,
  SpyStatement,
  Turn,
} from "./types";

export interface Mission2State {
  phase: Mission2Phase;
  suspect: PublicSuspectProfile | null;
  conversationHistory: Turn[];
  tensionLevel: number;
  turnNumber: number;
  contradictionsLogged: ContradictionEntry[];
  codeRevealed: boolean;
  missionStartTime: number;
  score: number | null;
  xpAwarded: number | null;
  questionsRemaining: number;
  spyStatements: SpyStatement[];
  selectedSpyTurnIdForChallenge: string | null;
  verdictUnlocked: boolean;
  debriefPayload: DebriefClientPayload | null;
  behavioralFlag: string | null;
  lastContradictionIntroduced: boolean;
  resetMission: () => void;
  setPhase: (p: Mission2Phase) => void;
  setSuspect: (s: PublicSuspectProfile | null) => void;
  pushTurn: (t: Turn) => void;
  setTension: (n: number) => void;
  applyTensionDelta: (d: number) => void;
  bumpTurn: () => void;
  addContradiction: (c: ContradictionEntry) => void;
  setCodeRevealed: (v: boolean) => void;
  setScore: (n: number | null) => void;
  setXp: (n: number | null) => void;
  addSpyStatement: (s: SpyStatement) => void;
  setSelectedSpyTurn: (id: string | null) => void;
  setVerdictUnlocked: (v: boolean) => void;
  setDebriefPayload: (p: DebriefClientPayload | null) => void;
  setBehavioralFlag: (s: string | null) => void;
  setLastContradictionIntroduced: (v: boolean) => void;
  consumeQuestion: () => void;
}

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

const initial = (): Omit<
  Mission2State,
  | "resetMission"
  | "setPhase"
  | "setSuspect"
  | "pushTurn"
  | "setTension"
  | "bumpTurn"
  | "addContradiction"
  | "setCodeRevealed"
  | "setScore"
  | "setXp"
  | "addSpyStatement"
  | "setSelectedSpyTurn"
  | "setVerdictUnlocked"
  | "setDebriefPayload"
  | "setBehavioralFlag"
  | "consumeQuestion"
  | "applyTensionDelta"
  | "setLastContradictionIntroduced"
> => ({
  phase: "briefing",
  suspect: null,
  conversationHistory: [],
  tensionLevel: 12,
  turnNumber: 0,
  contradictionsLogged: [],
  codeRevealed: false,
  missionStartTime: Date.now(),
  score: null,
  xpAwarded: null,
  questionsRemaining: 15,
  spyStatements: [],
  selectedSpyTurnIdForChallenge: null,
  verdictUnlocked: false,
  debriefPayload: null,
  behavioralFlag: null,
  lastContradictionIntroduced: false,
});

export const useMission2Store = create<Mission2State>((set, get) => ({
  ...initial(),
  resetMission: () => set({ ...initial(), missionStartTime: Date.now() }),
  setPhase: (p) => set({ phase: p }),
  setSuspect: (s) => set({ suspect: s }),
  pushTurn: (t) => set({ conversationHistory: [...get().conversationHistory, t] }),
  setTension: (n) =>
    set({ tensionLevel: Math.min(100, Math.max(0, Math.round(n))) }),
  applyTensionDelta: (d) =>
    set({
      tensionLevel: Math.min(
        100,
        Math.max(0, Math.round(get().tensionLevel + d)),
      ),
    }),
  bumpTurn: () => set({ turnNumber: get().turnNumber + 1 }),
  addContradiction: (c) =>
    set({ contradictionsLogged: [...get().contradictionsLogged, c] }),
  setCodeRevealed: (v) => set({ codeRevealed: v }),
  setScore: (n) => set({ score: n }),
  setXp: (n) => set({ xpAwarded: n }),
  addSpyStatement: (s) => set({ spyStatements: [...get().spyStatements, s] }),
  setSelectedSpyTurn: (id) => set({ selectedSpyTurnIdForChallenge: id }),
  setVerdictUnlocked: (v) => set({ verdictUnlocked: v }),
  setDebriefPayload: (p) => set({ debriefPayload: p }),
  setBehavioralFlag: (behavioralFlag) => set({ behavioralFlag }),
  setLastContradictionIntroduced: (v) => set({ lastContradictionIntroduced: v }),
  consumeQuestion: () =>
    set({ questionsRemaining: Math.max(0, get().questionsRemaining - 1) }),
}));

export function createTurn(role: Turn["role"], content: string): Turn {
  return { id: uid(), role, content, timestamp: Date.now() };
}
