import { NextResponse } from "next/server";

import { extractJsonObject } from "@/lib/gemini-json";
import { GEMINI_TEXT_MODELS, geminiGenerateContentFirstOk } from "@/lib/gemini-text";
import { getGeminiApiKey } from "@/lib/server-env";
import {
  computeXp,
  ratingFromBaseScore,
  type ClearanceRating,
} from "@/lib/mission2/scoring";
import { readMission2Secrets } from "@/lib/mission2/session";
import type { VerdictPayload } from "@/lib/mission2/types";

export const runtime = "nodejs";
export const maxDuration = 120;

type ReqBody = {
  transcript?: { role: string; content: string }[];
  verdict?: VerdictPayload;
  turns_used?: number;
  code_revealed?: boolean;
  auto_contradictions_caught?: number;
  planted_reference?: string[];
};

export async function POST(req: Request) {
  const geminiKey = getGeminiApiKey();
  if (!geminiKey) {
    return NextResponse.json({ error: "Missing Gemini API key" }, { status: 501 });
  }

  let body: ReqBody;
  try {
    body = (await req.json()) as ReqBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const secrets = await readMission2Secrets();
  if (!secrets) {
    return NextResponse.json({ error: "No active mission session" }, { status: 401 });
  }

  const transcript = Array.isArray(body.transcript) ? body.transcript : [];
  const verdict = body.verdict;
  if (!verdict || typeof verdict !== "object") {
    return NextResponse.json({ error: "Missing verdict" }, { status: 400 });
  }

  const turnsUsed =
    typeof body.turns_used === "number" && Number.isFinite(body.turns_used)
      ? Math.min(15, Math.max(1, Math.round(body.turns_used)))
      : 15;

  const codeRevealed = Boolean(body.code_revealed);
  const autoCaught =
    typeof body.auto_contradictions_caught === "number" ? body.auto_contradictions_caught : 0;

  const plantedRef = Array.isArray(body.planted_reference)
    ? body.planted_reference.map((x) => String(x))
    : [];

  const prompt = [
    "Grade a training interrogation verdict. Return STRICT JSON ONLY:",
    '{ "contradiction_score": number, "verdict_score": number, "evidence_score": number, "speed_score": number, "planted_hits": string[], "planted_misses": string[], "rationale": string }',
    "Weights: contradiction 40%, verdict 30%, evidence 20%, speed 10% for overall.",
    "Ground truth hidden:",
    secrets.hidden_truth,
    "Launch code revealed:",
    String(codeRevealed),
    "Turns:",
    String(turnsUsed),
    "Auto contradictions:",
    String(autoCaught),
    "Planted seeds:",
    JSON.stringify(plantedRef),
    "Verdict:",
    JSON.stringify(verdict),
    "Transcript:",
    JSON.stringify(transcript.slice(-40)),
  ].join("\n");

  let parsed: Record<string, unknown> | null = null;
  try {
    const { data } = await geminiGenerateContentFirstOk(geminiKey, GEMINI_TEXT_MODELS, {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
    });
    const raw =
      (data as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> })
        ?.candidates?.[0]?.content?.parts?.map((p) => p?.text).join("") ?? "";
    parsed = extractJsonObject(raw);
  } catch {
    parsed = null;
  }

  const contradiction = num(parsed?.contradiction_score, 55);
  const verdictS = num(parsed?.verdict_score, 50);
  const evidence = num(parsed?.evidence_score, 50);
  const speed = num(parsed?.speed_score, 50);

  const base_score = Math.round(
    contradiction * 0.4 + verdictS * 0.3 + evidence * 0.2 + speed * 0.1,
  );

  const rating: ClearanceRating = ratingFromBaseScore(base_score);
  const xp = computeXp(base_score, rating, turnsUsed);

  const planted_hits = Array.isArray(parsed?.planted_hits)
    ? (parsed?.planted_hits as unknown[]).map((x) => String(x))
    : [];
  const planted_misses = Array.isArray(parsed?.planted_misses)
    ? (parsed?.planted_misses as unknown[]).map((x) => String(x))
    : [];

  return NextResponse.json(
    {
      hidden_truth: secrets.hidden_truth,
      planted_contradictions: plantedRef.length ? plantedRef : planted_hits,
      caught_summary: planted_hits,
      missed_summary: planted_misses,
      rating,
      score: base_score,
      xp,
      dimensions: {
        contradiction: contradiction,
        verdict: verdictS,
        evidence,
        speed,
      },
      rationale: typeof parsed?.rationale === "string" ? parsed.rationale : "",
    },
    { status: 200 },
  );
}

function num(v: unknown, fallback: number) {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(100, Math.max(0, Math.round(n)));
}
