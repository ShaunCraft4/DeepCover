import { create } from "zustand";

import type { Artifact, PlayerTag } from "@/data/types";
import {
  ARTIFACTS,
  MISSION_BRIEF,
  OBJECTIVE_VARIANTS,
  THREAT_ASSESSMENT_PROMPTS,
} from "@/data/mission1-mock";
import { computeMissionScore } from "@/lib/scoring";

export type AiDebrief = {
  objective: string;
  strengths: string[];
  risks: string[];
  next_actions: string[];
  per_artifact: Array<{ id: string; note: string }>;
};

export type DebriefResult = ReturnType<typeof computeMissionScore> & {
  ai?: AiDebrief | null;
  aiError?: string | null;
};

type MissionPhase = "briefing" | "operations" | "debrief";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function initTags(artifacts: Artifact[]): Record<string, PlayerTag | null> {
  return Object.fromEntries(artifacts.map((a) => [a.id, null])) as Record<
    string,
    PlayerTag | null
  >;
}

function toDataUrlMp3(b64: string | undefined | null): string | null {
  if (!b64) return null;
  return `data:audio/mpeg;base64,${b64}`;
}

type MissionState = {
  phase: MissionPhase;
  startedAt: number | null;
  artifacts: Artifact[];
  sessionObjective: string;
  assessmentQuestion: string;
  promptsLoading: boolean;
  /** Gemini-generated per-artifact challenge text. */
  artifactQuestions: Record<string, string>;
  /** Gemini image output data URLs keyed by artifact id. */
  generatedImages: Record<string, string>;
  /** Override transcript lines for audio artifact id. */
  transcriptById: Record<string, string[]>;
  /** Override memo body (art-policy-memo). */
  documentBodyOverride: string[] | null;
  /** Override social post (art-viral-post). */
  socialPostOverride: string | null;
  /** ElevenLabs: full intercept clip. */
  audioMainSrc: string | null;
  /** ElevenLabs: spoken challenge per artifact. */
  questionAudioSrc: Record<string, string>;
  selectedId: string | null;
  tags: Record<string, PlayerTag | null>;
  assessment: string;
  debrief: DebriefResult | null;
  submitting: boolean;
  /** Set when `/api/mission/session` fails so the UI is not silent about fallback content. */
  sessionBootstrapError: string | null;
  /** Non-fatal issues from a successful session (e.g. missing ElevenLabs key, image gen failed). */
  sessionHints: string | null;
  initSession: () => Promise<void>;
  startMission: () => void;
  selectArtifact: (id: string | null) => void;
  setTag: (id: string, tag: PlayerTag) => void;
  setAssessment: (text: string) => void;
  submitMission: () => Promise<void>;
  closeDebrief: () => void;
};

function applyFallbackSession(
  shuffled: Artifact[],
): Pick<
  MissionState,
  | "sessionObjective"
  | "assessmentQuestion"
  | "artifactQuestions"
  | "generatedImages"
  | "transcriptById"
  | "documentBodyOverride"
  | "socialPostOverride"
  | "audioMainSrc"
  | "questionAudioSrc"
> {
  const ids = ARTIFACTS.map((a) => a.id);
  const artifactQuestions: Record<string, string> = {};
  for (const id of ids) {
    artifactQuestions[id] =
      "Classify this artifact (REAL / SYNTHETIC / UNCERTAIN) using the evidence in view.";
  }
  return {
    sessionObjective: pick(OBJECTIVE_VARIANTS),
    assessmentQuestion: pick(THREAT_ASSESSMENT_PROMPTS),
    artifactQuestions,
    generatedImages: {},
    transcriptById: {},
    documentBodyOverride: null,
    socialPostOverride: null,
    audioMainSrc: null,
    questionAudioSrc: {},
  };
}

export const useMissionStore = create<MissionState>((set, get) => ({
  phase: "briefing",
  startedAt: null,
  artifacts: [...ARTIFACTS],
  sessionObjective: MISSION_BRIEF.objective,
  assessmentQuestion: THREAT_ASSESSMENT_PROMPTS[0] ?? "What is the likely objective of this disinformation campaign?",
  promptsLoading: false,
  artifactQuestions: {},
  generatedImages: {},
  transcriptById: {},
  documentBodyOverride: null,
  socialPostOverride: null,
  audioMainSrc: null,
  questionAudioSrc: {},
  selectedId: ARTIFACTS[0]?.id ?? null,
  tags: initTags([...ARTIFACTS]),
  assessment: "",
  debrief: null,
  submitting: false,
  sessionBootstrapError: null,
  sessionHints: null,

  initSession: async () => {
    set({ promptsLoading: true, sessionBootstrapError: null, sessionHints: null });

    const shuffled = shuffle([...ARTIFACTS]);
    let bundle = applyFallbackSession(shuffled);
    let sessionBootstrapError: string | null = null;
    let sessionHints: string | null = null;

    try {
      const resp = await fetch("/mission1/api/mission/session", { method: "POST" });
      if (resp.ok) {
        const data = (await resp.json()) as {
          sessionObjective?: string;
          assessmentQuestion?: string;
          artifactQuestions?: Record<string, string>;
          generatedImages?: Record<string, string>;
          secureLineTranscript?: string[];
          documentBody?: string[];
          socialPostText?: string | null;
          audioMainBase64?: string | null;
          questionAudioBase64?: Record<string, string>;
          warnings?: string[];
        };

        if (Array.isArray(data.warnings) && data.warnings.length > 0) {
          sessionHints = data.warnings.join(" ");
        }

        const questionAudioSrc: Record<string, string> = {};
        for (const [id, b64] of Object.entries(data.questionAudioBase64 ?? {})) {
          const url = toDataUrlMp3(b64);
          if (url) questionAudioSrc[id] = url;
        }

        bundle = {
          sessionObjective:
            (typeof data.sessionObjective === "string" && data.sessionObjective.trim()) ||
            bundle.sessionObjective,
          assessmentQuestion:
            (typeof data.assessmentQuestion === "string" && data.assessmentQuestion.trim()) ||
            bundle.assessmentQuestion,
          artifactQuestions: {
            ...bundle.artifactQuestions,
            ...(data.artifactQuestions ?? {}),
          },
          generatedImages: data.generatedImages ?? {},
          transcriptById:
            Array.isArray(data.secureLineTranscript) && data.secureLineTranscript.length > 0
              ? { "art-secure-line": data.secureLineTranscript }
              : {},
          documentBodyOverride:
            Array.isArray(data.documentBody) && data.documentBody.length > 0
              ? data.documentBody
              : null,
          socialPostOverride:
            typeof data.socialPostText === "string" && data.socialPostText.trim()
              ? data.socialPostText.trim()
              : null,
          audioMainSrc: toDataUrlMp3(data.audioMainBase64),
          questionAudioSrc,
        };
      } else {
        const raw = await resp.text();
        try {
          const j = JSON.parse(raw) as { error?: string; detail?: string };
          sessionBootstrapError =
            j.detail && j.error
              ? `${j.error} (${j.detail.slice(0, 280)})`
              : j.error || j.detail || raw.slice(0, 400);
        } catch {
          sessionBootstrapError = `${resp.status} ${raw.slice(0, 400)}`;
        }
      }
    } catch (e) {
      sessionBootstrapError = String(e instanceof Error ? e.message : e);
    }

    set({
      phase: "briefing",
      startedAt: null,
      artifacts: shuffled,
      sessionObjective: bundle.sessionObjective,
      assessmentQuestion: bundle.assessmentQuestion,
      artifactQuestions: bundle.artifactQuestions,
      generatedImages: bundle.generatedImages,
      transcriptById: bundle.transcriptById,
      documentBodyOverride: bundle.documentBodyOverride,
      socialPostOverride: bundle.socialPostOverride,
      audioMainSrc: bundle.audioMainSrc,
      questionAudioSrc: bundle.questionAudioSrc,
      tags: initTags(shuffled),
      assessment: "",
      debrief: null,
      submitting: false,
      selectedId: shuffled[0]?.id ?? null,
      promptsLoading: false,
      sessionBootstrapError,
      sessionHints,
    });
  },

  startMission: () =>
    set({
      phase: "operations",
      startedAt: Date.now(),
      selectedId: get().selectedId ?? get().artifacts[0]?.id ?? null,
    }),

  selectArtifact: (id) => set({ selectedId: id }),

  setTag: (id, tag) =>
    set((s) => ({ tags: { ...s.tags, [id]: tag }, selectedId: id })),

  setAssessment: (text) => set({ assessment: text }),

  submitMission: async () => {
    const { tags, assessment, artifacts } = get();
    const base = computeMissionScore({ artifacts, tags, assessment });
    set({ debrief: { ...base, ai: null, aiError: null }, phase: "debrief", submitting: true });

    try {
      const resp = await fetch("/mission1/api/debrief", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          missionCode: "M01-DEEPFAKE",
          missionTitle: "Mission 01 — Deepfake Detection",
          artifacts: artifacts.map((a) => ({
            id: a.id,
            title: a.title,
            type: a.type,
            tellType: a.tellType,
            isSynthetic: a.isSynthetic,
            anomalyHints: a.anomalyHints,
          })),
          tags,
          assessment,
          score: {
            total: base.total,
            max: base.max,
            tagTotal: base.tagTotal,
            assessPoints: base.assess.points,
          },
        }),
      });

      if (!resp.ok) {
        const t = await resp.text();
        set((s) => ({
          submitting: false,
          debrief: s.debrief ? { ...s.debrief, ai: null, aiError: t } : s.debrief,
        }));
        return;
      }

      const ai = (await resp.json()) as AiDebrief;
      set((s) => ({
        submitting: false,
        debrief: s.debrief ? { ...s.debrief, ai, aiError: null } : s.debrief,
      }));
    } catch (e: any) {
      set((s) => ({
        submitting: false,
        debrief: s.debrief
          ? { ...s.debrief, ai: null, aiError: String(e?.message ?? e) }
          : s.debrief,
      }));
    }
  },

  closeDebrief: () => {
    void get().initSession();
  },
}));

export function taggedCount(tags: Record<string, PlayerTag | null>) {
  return Object.values(tags).filter(Boolean).length;
}
