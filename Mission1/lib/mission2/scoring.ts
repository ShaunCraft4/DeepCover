export type ClearanceRating = "ELITE" | "PROFICIENT" | "DEVELOPING" | "COMPROMISED";

export function clearanceMultiplier(rating: ClearanceRating): number {
  switch (rating) {
    case "ELITE":
      return 1.25;
    case "PROFICIENT":
      return 1.1;
    case "DEVELOPING":
      return 1.0;
    default:
      return 0.85;
  }
}

export function speedBonusFactor(turnsUsed: number): number {
  const t = Math.min(15, Math.max(1, turnsUsed));
  return 0.85 + (0.15 * (16 - t)) / 15;
}

export function computeXp(baseScore: number, rating: ClearanceRating, turnsUsed: number): number {
  const roundedBase = Math.round(Math.min(100, Math.max(0, baseScore)));
  const xp = roundedBase * clearanceMultiplier(rating) * speedBonusFactor(turnsUsed);
  return Math.round(xp * 10) / 10;
}

export function ratingFromBaseScore(score: number): ClearanceRating {
  if (score >= 86) return "ELITE";
  if (score >= 70) return "PROFICIENT";
  if (score >= 50) return "DEVELOPING";
  return "COMPROMISED";
}
