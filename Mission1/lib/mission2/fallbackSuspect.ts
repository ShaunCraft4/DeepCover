import type { SuspectProfile } from "./types";

export const FALLBACK_SUSPECT: SuspectProfile = {
  name: "Marcus Vance",
  age: 34,
  occupation: "Trade attaché (claimed)",
  surface_story:
    "I was escorting a cultural shipment through Rotterdam. Customs held the crate; I stayed overnight for paperwork. I never accessed any secure facility.",
  hidden_truth:
    "You moved a dead-drop package from a bonded warehouse to a handler outside the port using a forged customs release.",
  launch_code: "K7Q2M9",
  psychological_profile: {
    type: "deflector",
    tells: [
      "Redirects to procedural details when pressed on timelines",
      "Over-specifies trivial facts while staying vague on names",
      "Uses passive voice when describing movement of objects",
    ],
    vulnerability_triggers: ["timeline gaps", "witness corroboration", "chain of custody"],
  },
  known_facts: [
    "Detained at Rotterdam after a flagged shipment inspection.",
    "Passport shows three Schengen entries in the last 90 days.",
    "Phone contains a deleted navigation pin near Maasvlakte logistics.",
  ],
  contradictions_to_plant: [
    "Claims he never left the hotel, but mentions dinner near the port district.",
    "Says the crate was sealed, then describes opening it for a customs photo.",
    "States he traveled alone, then references a colleague driving the van.",
  ],
  voice_id: "pNInz6obpgDQGcFmaJgB",
  micro_expression_states: {
    neutral: "Calm mask; steady gaze",
    nervous: "Jaw tight; eyes flick left",
    caught: "Wide eyes; micro-sweat at temple",
    smug: "One-sided smile; chin lifted",
  },
};
