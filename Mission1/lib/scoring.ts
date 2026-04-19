import type { Artifact, PlayerTag } from "@/data/types";

const TAG_POINTS = { correct: 20, uncertain: 8, wrong: 0 } as const;

export function scoreTag(player: PlayerTag | null, truth: boolean): number {
  if (!player) return 0;
  const actuallySynthetic = truth;
  if (player === "UNCERTAIN") return TAG_POINTS.uncertain;
  if (player === "SYNTHETIC" && actuallySynthetic) return TAG_POINTS.correct;
  if (player === "REAL" && !actuallySynthetic) return TAG_POINTS.correct;
  return TAG_POINTS.wrong;
}

export function isTagCorrect(player: PlayerTag | null, isSynthetic: boolean) {
  if (!player || player === "UNCERTAIN") return null;
  if (player === "SYNTHETIC") return isSynthetic;
  return !isSynthetic;
}

export function scoreAssessment(text: string): { points: number; note: string } {
  const trimmed = text.trim();
  if (trimmed.length >= 140) {
    return {
      points: 20,
      note: "Assessment meets depth threshold (placeholder rule).",
    };
  }
  if (trimmed.length >= 60) {
    return {
      points: 12,
      note: "Assessment is directionally complete (placeholder rule).",
    };
  }
  if (trimmed.length > 0) {
    return { points: 4, note: "Minimal assessment captured (placeholder rule)." };
  }
  return { points: 0, note: "No assessment text submitted." };
}

export function computeMissionScore(args: {
  artifacts: Artifact[];
  tags: Record<string, PlayerTag | null>;
  assessment: string;
}) {
  const perArtifact = args.artifacts.map((a) => {
    const tag = args.tags[a.id] ?? null;
    const points = scoreTag(tag, a.isSynthetic);
    const correctness = isTagCorrect(tag, a.isSynthetic);
    return { id: a.id, title: a.title, tag, points, correctness };
  });
  const tagTotal = perArtifact.reduce((s, x) => s + x.points, 0);
  const assess = scoreAssessment(args.assessment);
  const total = tagTotal + assess.points;
  const max = args.artifacts.length * TAG_POINTS.correct + 20;
  return { perArtifact, tagTotal, assess, total, max };
}
