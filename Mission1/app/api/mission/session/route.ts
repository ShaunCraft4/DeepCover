import { randomUUID } from "crypto";

import { NextResponse } from "next/server";

import { ARTIFACTS } from "@/data/mission1-mock";
import { elevenLabsToMp3Base64 } from "@/lib/elevenlabs-tts";
import { geminiGenerateImageDataUrl } from "@/lib/gemini-image";
import { extractJsonObject } from "@/lib/gemini-json";
import { GEMINI_TEXT_MODELS, geminiGenerateContentFirstOk } from "@/lib/gemini-text";
import { getElevenLabsApiKey, getElevenLabsVoiceId, getGeminiApiKey } from "@/lib/server-env";
import { linesToTtsText } from "@/lib/transcript-tts";

export const maxDuration = 300;

const ARTIFACT_IDS = ARTIFACTS.map((a) => a.id);

function ensureQuestions(raw: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const id of ARTIFACT_IDS) {
    const q = raw[id];
    out[id] =
      typeof q === "string" && q.trim()
        ? q.trim()
        : "Based on the evidence shown, classify this artifact and justify uncertainty if the signal is ambiguous.";
  }
  return out;
}

async function geminiParseJson(
  geminiKey: string,
  prompt: string,
  generationConfig: Record<string, unknown>,
): Promise<{ parsed: Record<string, unknown>; raw: string } | null> {
  const requestBody = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig,
  };
  const { data } = await geminiGenerateContentFirstOk(geminiKey, GEMINI_TEXT_MODELS, requestBody);
  const typed = data as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const raw =
    typed?.candidates?.[0]?.content?.parts?.map((p) => p?.text).join("") ?? "";
  const parsed = extractJsonObject(raw);
  if (!parsed) return null;
  return { parsed, raw };
}

function buildQuestionsPrompt(
  catalog: Array<{
    id: string;
    type: string;
    title: string;
    tellType: string;
    isSynthetic: boolean;
  }>,
  runNonce: string,
) {
  const typeGuide = [
    "image: probe provenance, pixels, lighting, EXIF/ICC plausibility, generative tells.",
    "audio: probe prosody, room tone, compression, transcript alignment, synthetic speech cues.",
    "document: probe routing stamps, template drift, classification banners, registry consistency.",
    "surveillance: probe encoder chain, noise, timestamp/hash plausibility vs social recompress.",
    "social: probe UI fidelity, engagement consistency, verified-badge typography, copy style.",
  ].join("\n");

  return [
    "Mission M01 — QUESTION SET ONLY (Meridian Summit / deepfake training).",
    `Training run id (uniqueness anchor): ${runNonce}`,
    "Every session MUST read differently: do not reuse canned analyst boilerplate, stock phrases, or the same sentence openings as generic security-training templates.",
    "",
    "Return STRICT JSON ONLY (no markdown). Shape:",
    "{",
    '  "sessionObjective": string,',
    '  "assessmentQuestion": string,',
    '  "artifactQuestions": { <artifact id>: string, ... }',
    "}",
    "",
    "Categories (generate a fresh variant for EACH):",
    '  (1) "sessionObjective": 2–4 sentences; briefing-style mission framing.',
    '  (2) "assessmentQuestion": ONE demanding written question about campaign objective, failure modes, or how synthetic and real artifacts interact.',
    `  (3) "artifactQuestions": exactly one string per artifact id, keyed by id. Each string is ONE sharp analyst prompt (not multiple choice).`,
    "",
    `artifactQuestions MUST contain exactly these keys: ${ARTIFACT_IDS.join(", ")}.`,
    "For each artifact, tailor the prompt to its TYPE (see catalog) and the type guide:",
    typeGuide,
    "Vary analytical angles across artifacts: do not copy-paste the same question skeleton with different nouns.",
    "",
    "Artifact catalog:",
    JSON.stringify(catalog, null, 2),
  ].join("\n");
}

function buildContentPrompt(
  catalog: Array<{
    id: string;
    type: string;
    title: string;
    tellType: string;
    isSynthetic: boolean;
  }>,
  runNonce: string,
) {
  return [
    "Mission M01 — NARRATIVE / MEDIA CONTENT (no player-facing questions).",
    `Content run id: ${runNonce}`,
    "Return STRICT JSON ONLY (no markdown). Shape:",
    "{",
    '  "imagePrompts": { "art-press-pool": string, "art-garage-still": string },',
    '  "secureLineTranscript": string[],',
    '  "documentBody": string[],',
    '  "socialPostText": string',
    "}",
    "",
    "Rules:",
    "- imagePrompts: detailed English prompts for Gemini image generation — photoreal press-pool still, and gritty CCTV garage still. No text in-image.",
    "- secureLineTranscript: 4–6 lines, each starting with a fake timestamp like [00:12]; dialogue about summit leaks / optics (classified tone).",
    "- documentBody: exactly 3 short paragraphs for a forged policy memo (Meridian office style).",
    "- socialPostText: one plausible social post denying/forging the memo (<= 400 chars).",
    "",
    "Artifact catalog (context only):",
    JSON.stringify(catalog, null, 2),
  ].join("\n");
}

/** Single-call fallback if split JSON passes fail (same run nonce for coherence). */
function buildCombinedPrompt(
  catalog: Array<{
    id: string;
    type: string;
    title: string;
    tellType: string;
    isSynthetic: boolean;
  }>,
  runNonce: string,
) {
  return [
    "You author a NEW training run for Mission M01 (Meridian Summit disinformation / deepfake detection).",
    `Training run id: ${runNonce} — vary all player-facing wording; avoid stock training boilerplate.`,
    "Return STRICT JSON ONLY (no markdown). Shape:",
    "{",
    '  "sessionObjective": string,',
    '  "assessmentQuestion": string,',
    '  "artifactQuestions": { ... },',
    '  "imagePrompts": { "art-press-pool": string, "art-garage-still": string },',
    '  "secureLineTranscript": string[],',
    '  "documentBody": string[],',
    '  "socialPostText": string',
    "}",
    "",
    "Rules:",
    `- artifactQuestions MUST contain exactly these keys: ${ARTIFACT_IDS.join(", ")}.`,
    "- Each artifact question: one sharp analyst prompt for THAT artifact’s media type; do not reuse the same question template with swapped nouns.",
    "- sessionObjective: 2–4 sentences; assessmentQuestion: one demanding written question about campaign objective / failure modes.",
    "- imagePrompts: detailed English prompts for Gemini image generation — photoreal press-pool still, and gritty CCTV garage still. No text in-image.",
    "- secureLineTranscript: 4–6 lines, each starting with a fake timestamp like [00:12]; dialogue about summit leaks / optics (classified tone).",
    "- documentBody: exactly 3 short paragraphs for a forged policy memo (Meridian office style).",
    "- socialPostText: one plausible social post denying/forging the memo (<= 400 chars).",
    "",
    "Artifact catalog:",
    JSON.stringify(catalog, null, 2),
  ].join("\n");
}

export async function POST(req: Request) {
  const geminiKey = getGeminiApiKey();
  const elevenKey = getElevenLabsApiKey();

  if (!geminiKey) {
    return NextResponse.json(
      { error: "Missing Gemini API key. Set GEMINI_API_KEY or VITE_GEMINI_API_KEY in repo-root .env" },
      { status: 501 },
    );
  }

  let runNonce: string = randomUUID();
  try {
    const body = (await req.json()) as { runId?: string };
    if (typeof body?.runId === "string" && body.runId.trim().length >= 8) {
      runNonce = body.runId.trim();
    }
  } catch {
    /* empty body or invalid JSON — server nonce only */
  }

  const catalog = ARTIFACTS.map((a) => ({
    id: a.id,
    type: a.type,
    title: a.title,
    tellType: a.tellType,
    isSynthetic: a.isSynthetic,
  }));

  const questionGen = {
    temperature: 1,
    topP: 0.95,
    maxOutputTokens: 8192,
  };
  const contentGen = {
    temperature: 0.95,
    topP: 0.92,
    maxOutputTokens: 8192,
  };

  let spec: Record<string, unknown>;
  try {
    const [qResult, cResult] = await Promise.all([
      geminiParseJson(geminiKey, buildQuestionsPrompt(catalog, runNonce), questionGen),
      geminiParseJson(geminiKey, buildContentPrompt(catalog, runNonce), contentGen),
    ]);

    if (qResult?.parsed && cResult?.parsed) {
      spec = { ...cResult.parsed, ...qResult.parsed };
    } else {
      const combined = await geminiParseJson(
        geminiKey,
        buildCombinedPrompt(catalog, runNonce),
        { temperature: 0.98, topP: 0.95, maxOutputTokens: 8192 },
      );
      if (!combined?.parsed) {
        const rawHint = [qResult?.raw, cResult?.raw, combined?.raw]
          .filter(Boolean)
          .join("\n---\n")
          .slice(0, 2000);
        return NextResponse.json(
          {
            error: "Model did not return valid JSON (split or combined pass).",
            raw: rawHint,
          },
          { status: 502 },
        );
      }
      spec = combined.parsed;
    }
  } catch (e: unknown) {
    return NextResponse.json(
      { error: "Gemini crashed.", detail: String(e instanceof Error ? e.message : e) },
      { status: 500 },
    );
  }

  const sessionObjective = String(spec.sessionObjective ?? "").trim();
  const assessmentQuestion = String(spec.assessmentQuestion ?? "").trim();
  const artifactQuestions = ensureQuestions(
    (spec.artifactQuestions ?? {}) as Record<string, unknown>,
  );

  const imagePrompts = spec.imagePrompts as Record<string, unknown> | undefined;
  const defaultPress =
    "Photorealistic press pool photograph inside a modern summit briefing room, TV cameras and photographers, neutral lighting, security detail in background, no text or logos in frame.";
  const defaultGarage =
    "Gritty CCTV security camera still of an underground parking garage, heavy grain, wide angle, fluorescent flicker, no readable text or timestamps.";

  const pressPrompt =
    (typeof imagePrompts?.["art-press-pool"] === "string"
      ? imagePrompts["art-press-pool"].trim()
      : "") || defaultPress;
  const garagePrompt =
    (typeof imagePrompts?.["art-garage-still"] === "string"
      ? imagePrompts["art-garage-still"].trim()
      : "") || defaultGarage;

  const generatedImages: Record<string, string> = {};
  const [imgPress, imgGarage] = await Promise.all([
    pressPrompt ? geminiGenerateImageDataUrl(geminiKey, pressPrompt) : Promise.resolve(null),
    garagePrompt ? geminiGenerateImageDataUrl(geminiKey, garagePrompt) : Promise.resolve(null),
  ]);
  if (imgPress) generatedImages["art-press-pool"] = imgPress;
  if (imgGarage) generatedImages["art-garage-still"] = imgGarage;

  let secureLineTranscript: string[] = Array.isArray(spec.secureLineTranscript)
    ? (spec.secureLineTranscript as unknown[]).map((x) => String(x))
    : [];
  if (secureLineTranscript.length < 3) {
    secureLineTranscript = [
      "[00:02] Fallback line: the optics have to read as collapse before Geneva.",
      "[00:18] If the public believes we folded on Article nine, we inherit leverage.",
      "[00:35] Push the narrative hard before midnight.",
    ];
  }

  let documentBody: string[] = Array.isArray(spec.documentBody)
    ? (spec.documentBody as unknown[]).map((x) => String(x))
    : [];
  if (documentBody.length < 2) {
    const memo = ARTIFACTS.find((a) => a.id === "art-policy-memo");
    documentBody =
      memo?.content.kind === "document" ? [...memo.content.body] : ["(Document body unavailable.)"];
  }

  const socialPostText =
    typeof spec.socialPostText === "string" && spec.socialPostText.trim()
      ? spec.socialPostText.trim()
      : null;

  const voiceId = getElevenLabsVoiceId();
  const audioMainBase64 = elevenKey
    ? await elevenLabsToMp3Base64(elevenKey, linesToTtsText(secureLineTranscript), voiceId)
    : null;

  const questionAudioBase64: Record<string, string> = {};
  if (elevenKey) {
    for (const id of ARTIFACT_IDS) {
      const q = artifactQuestions[id];
      if (!q) continue;
      const b64 = await elevenLabsToMp3Base64(elevenKey, q.slice(0, 1200), voiceId);
      if (b64) questionAudioBase64[id] = b64;
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  const warnings: string[] = [];
  if (!elevenKey) {
    warnings.push(
      "No ElevenLabs API key — set ELEVENLABS_API_KEY or VITE_ELEVENLABS_API_KEY in repo-root .env for AI voice.",
    );
  } else if (!audioMainBase64) {
    warnings.push(
      "ElevenLabs did not return audio (check API key, quota, or ELEVENLABS_VOICE_ID).",
    );
  }
  if (Object.keys(generatedImages).length === 0) {
    warnings.push(
      "Gemini image models returned no bitmaps (billing / model access). Still images fall back to bundled URLs.",
    );
  }

  return NextResponse.json(
    {
      sessionObjective:
        sessionObjective ||
        "Classify each artifact and document uncertainty. Then assess the campaign objective.",
      assessmentQuestion:
        assessmentQuestion ||
        "What objective is this package engineered to achieve, and how do synthetic pieces depend on real anchors?",
      artifactQuestions,
      generatedImages,
      secureLineTranscript,
      documentBody,
      socialPostText,
      audioMainBase64,
      questionAudioBase64,
      warnings,
    },
    { status: 200 },
  );
}
