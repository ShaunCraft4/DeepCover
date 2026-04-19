/** Hardcoded backup suspect if Gemini generation fails twice. */
export function getFallbackSuspect(clearanceLevel) {
  return {
    name: "Maren Okonkwo",
    age: 41,
    occupation: "Regional compliance auditor for cold-chain pharmaceutical shipping",
    appearance:
      "Wire-rim glasses slightly askew, blazer sleeves rolled once as if she stopped mid-task. " +
      "She keeps smoothing a crease on her trousers — a tell when she's buying time.",
    personality_type: "cold, clipped, gives minimal answers",
    known_facts: [
      "Her badge was scanned near the logistics annex at 22:14 on the incident night.",
      "She accessed a shipment manifest unrelated to her usual route that same hour.",
      "A camera caught her car circling the back gate twice before she parked.",
    ],
    surface_story:
      "I was at the Harborlight Oyster House from about 8:30 until a little after midnight. " +
      "I sat at the bar, ordered the same drink twice, and talked to nobody important. " +
      "I needed air after a brutal audit week.",
    alibi_location: "Harborlight Oyster House",
    alibi_time: "8:30 PM until just after midnight",
    alibi_supporting_detail:
      "The bartender kept arguing with the kitchen about whether the mignonette was too acidic — " +
      "I remember because it was loud enough to ruin my focus.",
    fatal_flaw:
      "Harborlight Oyster House was closed for asbestos remediation that entire week — " +
      "the dining room never opened, and the bar service was suspended.",
    hidden_truth:
      "She was loading copied drive images into a dead-drop dead-bolted crate at the logistics annex.",
    secret_code: "6381",
    confession_keywords: [
      "asbestos",
      "remediation",
      "closed that week",
      "never opened",
      "suspended",
      "wasnt open",
    ],
    cover_up_response:
      "You're mixing up nights — I meant the pop-up seafood counter at the ferry terminal, not the restaurant proper. " +
      "Same name on the sign, different stall. I should have been clearer.",
    clearance_level: clearanceLevel,
  };
}
