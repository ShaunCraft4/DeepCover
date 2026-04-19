/**
 * Percentage score: starts at 100%. Each missed packet or incorrect decision costs an equal share of 100%.
 * @param {{ kind: 'miss' | 'decision'; wasCorrect: boolean }[]} decisions
 * @param {number} totalPackets
 */
export function computePenaltyPercentScore(decisions, totalPackets) {
  if (totalPackets <= 0) return 100;
  let penalties = 0;
  for (const d of decisions) {
    if (d.kind === 'miss') penalties += 1;
    else if (d.kind === 'decision' && !d.wasCorrect) penalties += 1;
  }
  const raw = 100 - (penalties * 100) / totalPackets;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

/**
 * @param {'allow' | 'block'} choice
 * @param {{ isMalicious: boolean }} packet
 */
export function evaluateDecision(choice, packet) {
  const malicious = packet.isMalicious;
  const blocked = choice === 'block';
  const correct = malicious ? blocked : !blocked;
  return { correct };
}
