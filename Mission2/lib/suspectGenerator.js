import { callGemini } from "../api/gemini.js";
import { getFallbackSuspect } from "./fallbackSuspect.js";

function stripCodeFences(text) {
  return text.replace(/```json\s*|```/gi, "").trim();
}

function normalizeSuspect(raw, clearanceLevel) {
  const s = { ...raw };
  s.clearance_level = clearanceLevel;
  if (typeof s.age !== "number" || s.age < 28 || s.age > 58) {
    s.age = 28 + Math.floor(Math.random() * 31);
  }
  let code = String(s.secret_code ?? "")
    .replace(/\D/g, "")
    .slice(0, 4);
  if (code.length < 4) {
    code = String(1000 + Math.floor(Math.random() * 9000));
  }
  if (["0000", "1234", "9999"].includes(code)) {
    code = "6381";
  }
  s.secret_code = code;
  if (!Array.isArray(s.known_facts) || s.known_facts.length < 3) {
    s.known_facts = [
      "Subject activity flagged near sensitive systems during the incident window.",
      "Travel records show inconsistencies with their first statement.",
      "A witness places them away from their claimed location earlier that evening.",
    ];
  }
  if (!Array.isArray(s.confession_keywords) || s.confession_keywords.length < 2) {
    s.confession_keywords = ["closed", "impossible", "not there", "wrong"];
  }
  return s;
}

async function retryOrFallback(clearanceLevel) {
  try {
    const prompt = buildGenerationPrompt(clearanceLevel);
    const response = await callGemini({
      systemInstruction: `You generate randomized interrogation suspects for a spy game. 
                        Return ONLY valid JSON. No markdown fences. No explanation. Just JSON.`,
      userMessage: prompt,
      temperature: 0.7,
      maxTokens: 1500,
    });
    const suspect = JSON.parse(stripCodeFences(response));
    return normalizeSuspect(suspect, clearanceLevel);
  } catch {
    return normalizeSuspect(getFallbackSuspect(clearanceLevel), clearanceLevel);
  }
}

export async function generateSuspect(clearanceLevel) {
  const prompt = buildGenerationPrompt(clearanceLevel);

  const response = await callGemini({
    systemInstruction: `You generate randomized interrogation suspects for a spy game. 
                        Return ONLY valid JSON. No markdown fences. No explanation. Just JSON.`,
    userMessage: prompt,
    temperature: 1.0,
    maxTokens: 1500,
  });

  let suspect;
  try {
    suspect = JSON.parse(stripCodeFences(response));
    suspect = normalizeSuspect(suspect, clearanceLevel);
  } catch {
    suspect = await retryOrFallback(clearanceLevel);
  }

  return suspect;
}

function buildGenerationPrompt(clearanceLevel) {
  return `
Generate a completely randomized enemy spy suspect for an interrogation game.
Every field must be creative, specific, and different from any default examples.
Do not use names like "John Smith" or locations like "the warehouse." Be original.

Return this exact JSON structure:

{
  "name": "Full name. Random gender, ethnicity, age 28–58.",
  
  "age": number between 28 and 58,
  
  "occupation": "Their convincing cover job. Must be specific and interesting. 
                  Examples: marine cargo inspector, pharmaceutical rep, hotel night 
                  auditor, antiques appraiser, freelance translator. Never just 'businessman'.",

  "appearance": "2 sentences describing how they look sitting in the interrogation room. 
                  Clothing, demeanor, tells. Example: 'Wearing a rumpled linen blazer 
                  with a coffee stain on the sleeve. Keeps tapping the table with two fingers.'",

  "personality_type": "How they behave under pressure. Pick one combination:
                        Option A: nervous and over-explains everything
                        Option B: cold, clipped, gives minimal answers
                        Option C: aggressively deflects with questions of their own
                        Option D: falsely friendly and cooperative-seeming",

  "known_facts": [
    "Fact the interrogator is given. Must be true and hint at guilt. Max 1 sentence.",
    "Second true fact. Must be verifiable and suspicious.",
    "Third true fact. Must suggest opportunity or motive."
  ],

  "surface_story": "Their alibi. What they CLAIM they were doing the night in question. 
                    Must name a specific real-sounding location and a specific time window. 
                    Must be told in first person as if they're saying it. 2–3 sentences.",

  "alibi_location": "The specific named place in their alibi. Examples: 
                      'The Meridian Hotel bar', 'Portside Fish & Grill', 
                      'Club Obsidian', 'Farrow's 24-Hour Diner'.",

  "alibi_time": "The time window. Example: '9 PM until just after midnight'.",

  "alibi_supporting_detail": "One vivid specific detail they add to seem credible. 
                               Example: 'The bartender had a tattoo of an anchor on his wrist',
                               'A couple at the next table kept arguing about a flight they missed',
                               'They were playing that old Sinatra record all night'.",

  "fatal_flaw": "The ONE fact that makes their alibi impossible. Must be concrete and 
                  checkable. The alibi_location must have a specific reason it could not 
                  have been visited. Examples:
                  - 'The Meridian Hotel bar was closed for a private event that entire evening'
                  - 'Portside Fish & Grill burned down four months ago'
                  - 'Club Obsidian has been shut by the city for code violations since March'
                  - 'Farrow's Diner closed permanently last year, the building is now a parking lot'
                  The flaw must be something an interrogator could know or discover.",

  "hidden_truth": "What they were ACTUALLY doing. 1 sentence. The real secret.",

  "secret_code": "A 4-digit string. Random. Never '0000', '1234', or '9999'. Example: '4817'.",

  "confession_keywords": [
    "3 to 6 words or short phrases that, if the player says them, signal they've found the flaw.",
    "Must directly reference the fatal_flaw.",
    "Examples if flaw is 'burned down': ['burned down', 'fire', 'closed', 'doesnt exist', 'shut down']",
    "Examples if flaw is 'private event': ['private event', 'closed that night', 'booked out', 'reservation only']"
  ],

  "cover_up_response": "What the suspect says to deflect the FIRST time they're caught 
                         (used on difficulty 2 and 3). Must sound like a panicked re-explanation 
                         that introduces a new (false) detail to patch the hole. 2 sentences max.",

  "clearance_level": ${clearanceLevel}
}

Difficulty calibration for clearance_level ${clearanceLevel}:
Level 1 — RECRUIT: 
  The fatal flaw is very obvious. The alibi_location is something that visibly no longer 
  exists (burned down, demolished, turned into something else). The suspect is nervous and 
  rambles, occasionally saying things that nearly contradict themselves without being pushed.

Level 2 — OPERATIVE: 
  The fatal flaw requires one follow-up question to confirm (e.g. "the bar was closed 
  that night" — player might need to ask about the location specifically). The suspect is 
  composed but cracks after being called out once, tries to cover up, then folds on second push.

Level 3 — HANDLER: 
  The fatal flaw is subtle and specific (e.g. "the ferry was docked for maintenance that week"). 
  The suspect is a skilled liar who covers up convincingly twice before finally breaking 
  on the third direct confrontation. They also drop false hints to waste the player's questions.
`;
}

/** Fields safe to show in the dossier intel panel (no secret payload). */
export function toPublicSuspect(full) {
  return {
    name: full.name,
    age: full.age,
    occupation: full.occupation,
    appearance: full.appearance,
    known_facts: full.known_facts,
  };
}
