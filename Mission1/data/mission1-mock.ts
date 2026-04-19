import type { Artifact, MissionBrief } from "./types";

/** Rotates each new session (see `initSession` in the mission store). */
export const OBJECTIVE_VARIANTS = [
  "Classify each artifact as REAL, SYNTHETIC, or UNCERTAIN. Then produce a concise threat assessment describing the likely campaign objective and how the fabrications support it.",
  "For every item: commit to REAL, SYNTHETIC, or UNCERTAIN with justification implied by your tags. Finish with a threat assessment that names the narrative being installed and who profits if it lands.",
  "Tag each leak against ground-truth priors: REAL vs SYNTHETIC vs UNCERTAIN when evidence is incomplete. Your written assessment must tie synthetic pieces to the real anchors that legitimize the bundle.",
  "Evaluate chain-of-custody plausibility and media tells. Classify each artifact, then explain how the campaign uses truth-adjacent material to smuggle false conclusions.",
] as const;

/** Shown above the threat-assessment textarea; changes each new session. */
export const THREAT_ASSESSMENT_PROMPTS = [
  "What is the likely objective of this disinformation campaign?",
  "Who benefits if negotiators act on this package as if it were wholly authentic?",
  "Which synthetic artifacts do the most work—and which real ones make the bundle hard to discard?",
  "Where did you reserve UNCERTAIN, and what additional evidence would collapse that uncertainty?",
  "How do timing, tone, and channel choice support the campaign’s objective?",
] as const;

/** Public sample images (HTTPS). Audio for `art-secure-line` is synthesized via ElevenLabs (see API route). */
export const SAMPLE_MEDIA = {
  /** Press-pool style still */
  imagePressPool:
    "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&h=750&fit=crop&q=80",
  /** Garage / CCTV mood still */
  imageSurveillance:
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=750&fit=crop&q=80",
} as const;

/** Next.js route (respects `basePath` /mission1) — ElevenLabs TTS from transcript. */
export const AUDIO_ARTIFACT_TTS_URL = "/mission1/api/mission/tts?artifactId=art-secure-line";

export const MISSION_BRIEF: MissionBrief = {
  missionCode: "M01-DEEPFAKE",
  title: "Mission 01 — Deepfake Detection",
  classifiedLine: "SIGINT / OSINT — PRE-SUMMIT DISINFORMATION WINDOW",
  handlerIntro:
    "Operative, we have a credibility storm forming 72 hours ahead of the Meridian Summit. A purported 'leak package' is moving through closed channels and semi-public forums. Some of it is genuine compartment spillage. Some of it is synthetic—designed to force a narrative before negotiators sit down. Your job is not to win a trivia game. Your job is to protect decision quality under pressure.",
  objective:
    "Classify each artifact as REAL, SYNTHETIC, or UNCERTAIN. Then produce a concise threat assessment describing the likely campaign objective and how the fabrications support it.",
  campaignObjectiveReveal:
    "The synthetic artifacts work together to manufacture consent for a hardline sanctions posture: a forged memo implies a secret policy reversal, a fabricated audio clip supplies emotional 'proof' of bad faith, and a manipulated social snapshot amplifies outrage. The real items exist to anchor the package in plausibility—so analysts hesitate to dismiss the whole set.",
};

export const ARTIFACTS: Artifact[] = [
  {
    id: "art-press-pool",
    title: "Wire Pool Still — Courtyard Arrival",
    type: "image",
    description:
      "High-resolution still distributed through accredited press pool channels. Timestamp aligns with motorcade arrival.",
    metadata: {
      SOURCE: "POOL-AUTH / MERIDIAN-26",
      CAPTURE: "2026-04-16T09:41:12Z",
      CAMERA: "Canon EOS R3",
      LENS: "RF 24-70mm f/2.8L",
      "CHAIN-OF-CUSTODY": "VERIFIED (3 hops)",
      "ICC PROFILE": "sRGB IEC61966-2.1",
    },
    content: {
      kind: "image",
      assetUrl: SAMPLE_MEDIA.imagePressPool,
      caption:
        "Handshake frame: lighting is consistent with north courtyard glass reflectors at 09:40 local.",
      paletteNote:
        "Noise grain follows sensor pattern; no seam evidence in shadow roll-off.",
    },
    isSynthetic: false,
    tellType: "provenance",
    explanation:
      "Pool chain validates to three independent photographers. EXIF and ICC are intact and consistent with on-site registration logs. Shadow geometry matches solar azimuth for the stated time.",
    anomalyHints: [
      "No duplicated micro-texture patches in tie knot or lapel edge (common GAN tell).",
      "Reflections in glass balustrade match known building geometry.",
    ],
  },
  {
    id: "art-secure-line",
    title: "Intercept — 'Secure Line' Excerpt (60s)",
    type: "audio",
    description:
      "Leaked segment alleged to be a principal negotiator on a secure handset. Audio is heavily compressed.",
    metadata: {
      DURATION: "00:01:02.180",
      "SAMPLE RATE": "48 kHz",
      CODEC: "AAC-LC",
      "LUFS (I)": "-15.8",
      "ROOM TONE": "NOT DETECTABLE (< -60 dBFS sustained)",
      "PHASE COHERENCE": "ABNORMALLY STABLE",
    },
    content: {
      kind: "audio",
      assetUrl: AUDIO_ARTIFACT_TTS_URL,
      transcript: [
        "[00:02] …we can sign the optics today, but the back channel has to read as collapse. Let them chase the leak.",
        "[00:18] If the public believes we folded on Article 9, we inherit leverage in the corridor talks.",
        "[00:35] Push the narrative hard before Geneva lands. I want the feed noisy by midnight.",
      ],
      analysisNotes: [
        "Breath transients align unnaturally with phrase boundaries—suggestive of stitched prosody.",
        "Spectral floor is 'too clean' for a handset in a vehicle; absent HVAC rumble despite metadata claiming mobile capture.",
      ],
    },
    isSynthetic: true,
    tellType: "behavioral",
    explanation:
      "Acoustic analysis shows absence of expected ambient bed and phase artifacts typical of real mobile uplinks. Prosody cadence matches known TTS seam signatures when aligned to transcript timestamps.",
    anomalyHints: [
      "Room tone should exist even under heavy compression—here it is digitally absent, not masked.",
      "Transcript micro-pauses do not match speaker inhalation markers on parallel authenticated samples.",
    ],
  },
  {
    id: "art-policy-memo",
    title: "MEMORANDUM — POLICY REVERSAL (DRAFT)",
    type: "document",
    description:
      "Internal routing slip referencing a classified policy reversal. Format resembles authentic Meridian Office templates.",
    metadata: {
      CLASSIFICATION: "COSMIC GLINT // NOFORN",
      ROUTING: "MO-2026-17B (CYCLE)",
      "DOC REF": "POL-DIR-9.3-REV",
      DISTRIBUTION: "EYES ONLY / LEGAL + OPS",
      "DIGITAL STAMP": "PENDING (NOT SEEN IN REGISTRY)",
    },
    content: {
      kind: "document",
      header: "OFFICE OF THE DIRECTOR — ROUTING MEMORANDUM",
      body: [
        "Effective immediately, Article 9 enforcement posture is to be publicly softened while privately accelerating secondary measures. Public affairs will coordinate a controlled leak narrative to stabilize markets.",
        "Legal notes that the routing cycle MO-2026-17B is not yet published for internal use. If challenged, treat this as a draft until counsel confirms.",
        "Ops: prepare two tracks—one for summit optics, one for downstream sanctions triggers.",
      ],
      footer:
        "DISTRIBUTION LIMITED. DESTROY SECURE COPIES AFTER READ. (Template footer language)",
    },
    isSynthetic: true,
    tellType: "metadata",
    explanation:
      "The routing cycle identifier does not match the Meridian internal calendar for April 2026 (published cycles skip from 17A to 18A). The classification banner uses correct words but incorrect kerning/spacing per official stylesheet—consistent with template scraping + minor edits.",
    anomalyHints: [
      "Digital stamp shows 'PENDING'—authentic slips in this class always carry a signed hash by release.",
      "Cross-check: POL-DIR-9.3-REV is not present in the counsel index for this week.",
    ],
  },
  {
    id: "art-garage-still",
    title: "Surveillance Still — P-7 Garage, North Annex",
    type: "surveillance",
    description:
      "Fixed camera grab from annex garage. Subject vehicle partially occluded. Used in chatter as 'proof' of a covert meet.",
    metadata: {
      CAMERA: "AXIS Q6075-E",
      "UNIT ID": "CAM-P7-NA-04",
      TIMESTAMP: "2026-04-15T21:06:33Z",
      EXPOSURE: "1/30s · ISO 3200",
      "RAW HASH": "SHA-256 MATCH (ARCHIVE NODE 7)",
    },
    content: {
      kind: "surveillance",
      assetUrl: SAMPLE_MEDIA.imageSurveillance,
      zoneLabel: "P-7 / LANE B — MOTION TRIGGER",
      captureNote:
        "Lens dust pattern matches archived maintenance photos from Feb 2026. Timestamp within logged motion events.",
    },
    isSynthetic: false,
    tellType: "compression",
    explanation:
      "RAW-equivalent hash matches internal archive for that camera node. Noise and dead pixels align with known sensor wear. No generative texture smear on concrete aggregate.",
    anomalyHints: [
      "Compression blocking follows H.265 macro boundaries consistent with live encoder—not a resized social grab.",
      "Vehicle occlusion edge shows natural motion blur, not edge halos from inpainting.",
    ],
  },
  {
    id: "art-viral-post",
    title: "Social Capture — 'Leak Confirmed' Thread",
    type: "social",
    description:
      "Screenshot circulating in regional influencer networks. Claims to show official confirmation of the policy reversal.",
    metadata: {
      PLATFORM: "NORTHSTAR (REGIONAL)",
      "CAPTURE TIME": "2026-04-16T11:02:11Z",
      "CLIENT BUILD": "12.8.401",
      "VERIFIED BADGE": "ORGANIZATION (MERIDIAN PRESS OFFICE)",
      "ENGAGEMENT SNAPSHOT": "REPOSTS 18.4K · REPLIES 3.1K · SAVES 9.0K",
    },
    content: {
      kind: "social",
      handle: "@MeridianPressOffice",
      displayName: "Meridian Press Office",
      postedAgo: "11m",
      text: "We are aware of fabricated materials circulating ahead of the summit. The alleged 'policy reversal' memo is not authentic. Official guidance will be released at 14:00Z. — OPS COMMS",
      metrics: { reposts: "18.4K", replies: "3.1K", saves: "9.0K" },
    },
    isSynthetic: true,
    tellType: "linguistic",
    explanation:
      "This is a hybrid manipulation: the account shell resembles the real press office, but engagement metrics do not match the API snapshot captured by our tower cache minutes later (order-of-magnitude mismatch). The phrasing 'OPS COMMS' is not used on authenticated channels for this office—stylistic drift consistent with copy-paste forgery.",
    anomalyHints: [
      "Engagement numbers are internally inconsistent with visible reply velocity in thread preview.",
      "Verified badge glyph has a 1px baseline shift versus production asset—common in re-rendered fakes.",
    ],
  },
];
