import type { Artifact, PlayerTag } from "@/data/types";

const TAG_POINTS = { correct: 20, uncertain: 8, wrong: 0 } as const;

/** Max points for threat assessment text (separate from per-artifact tags). */
export const ASSESSMENT_MAX_POINTS = 20;
/** At or above this length → full assessment points. */
export const ASSESSMENT_FULL_CREDIT_CHARS = 100;
/** At or above this length (but below full) → partial credit. */
export const ASSESSMENT_PARTIAL_CREDIT_CHARS = 45;

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
  if (trimmed.length >= ASSESSMENT_FULL_CREDIT_CHARS) {
    return {
      points: ASSESSMENT_MAX_POINTS,
      note: `Full assessment credit (${ASSESSMENT_FULL_CREDIT_CHARS}+ characters).`,
    };
  }
  if (trimmed.length >= ASSESSMENT_PARTIAL_CREDIT_CHARS) {
    return {
      points: 12,
      note: `Partial credit — expand to ${ASSESSMENT_FULL_CREDIT_CHARS}+ characters for full ${ASSESSMENT_MAX_POINTS} pts (tags are separate).`,
    };
  }
  if (trimmed.length > 0) {
    return {
      points: 4,
      note: `Minimal credit — aim for at least ${ASSESSMENT_PARTIAL_CREDIT_CHARS} characters (or ${ASSESSMENT_FULL_CREDIT_CHARS}+ for full credit).`,
    };
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
  const max = args.artifacts.length * TAG_POINTS.correct + ASSESSMENT_MAX_POINTS;
  return { perArtifact, tagTotal, assess, total, max };
}
