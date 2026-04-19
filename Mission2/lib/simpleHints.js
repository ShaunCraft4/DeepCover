/**
 * Clear, deterministic hints — no AI required. Cycles as the player taps GET HINT.
 */
const PRIMER = [
  "Goal: their story about where they were is wrong somewhere. Your job is to find the impossible detail.",
  "Step 1 — Lock the basics: ask the exact name of the place and the time window (arrive / leave).",
  "Step 2 — Ask for one sensory detail only someone there would know (smell, sound, staff, layout).",
  "Step 3 — Ask the same question again later; if details shift, call it out calmly.",
  "Step 4 — When something cannot be true, say what’s wrong (you can hint you “checked” without naming secrets).",
  "Step 5 — On Recruit they break fast. On Operative they may dodge once — ask again. On Handler they may dodge twice — keep pressing the same weak point.",
];

let hintIndex = 1;

export function resetHintRotation() {
  hintIndex = 1;
}

export function getNextStaticHint() {
  const line = PRIMER[hintIndex % PRIMER.length];
  hintIndex += 1;
  return line;
}

export function getMissionPrimer() {
  return PRIMER[0];
}
