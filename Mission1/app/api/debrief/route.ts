import { NextResponse } from "next/server";

import { GEMINI_TEXT_MODELS, geminiGenerateContentFirstOk } from "@/lib/gemini-text";
import { getGeminiApiKey } from "@/lib/server-env";

type DebriefRequest = {
  missionCode?: string;
  missionTitle?: string;
  artifacts: Array<{
    id: string;
    title: string;
    type: string;
    tellType?: string;
    isSynthetic?: boolean;
    anomalyHints?: string[];
  }>;
  tags: Record<string, string | null>;
  assessment: string;
  score: {
    total: number;
    max: number;
    tagTotal: number;
    assessPoints: number;
  };
};

function extractJson(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  const slice = text.slice(start, end + 1);
  try {
    return JSON.parse(slice);
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing Gemini API key (GEMINI_API_KEY or VITE_GEMINI_API_KEY)." },
      { status: 501 },
    );
  }

  let body: DebriefRequest;
  try {
    body = (await req.json()) as DebriefRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const prompt = [
    "You are an intelligence training debrief assistant for a deepfake detection mission.",
    "Write a concise debrief of the operator's submission.",
    "",
    "Return STRICT JSON ONLY (no markdown, no prose outside JSON) with this shape:",
    "{",
    '  "objective": string,',
    '  "strengths": string[],',
    '  "risks": string[],',
    '  "next_actions": string[],',
    '  "per_artifact": Array<{ "id": string, "note": string }>',
    "}",
    "",
    "Rules:",
    "- Keep each list to 3–6 items.",
    "- per_artifact must include every artifact id exactly once.",
    "- Notes must be specific to the artifact's tellType and hints, and reference the operator's tag when helpful.",
    "- Don't reveal chain-of-thought; just final feedback.",
    "",
    "Mission:",
    JSON.stringify(
      {
        missionCode: body.missionCode,
        missionTitle: body.missionTitle,
        score: body.score,
        assessment: body.assessment,
        artifacts: body.artifacts.map((a) => ({
          id: a.id,
          title: a.title,
          type: a.type,
          tellType: a.tellType,
          isSynthetic: a.isSynthetic,
          operatorTag: body.tags?.[a.id] ?? null,
          anomalyHints: a.anomalyHints ?? [],
        })),
      },
      null,
      2,
    ),
  ].join("\n");

  try {
    const requestBody = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 900,
      },
    };
    let data: unknown;
    try {
      const r = await geminiGenerateContentFirstOk(apiKey, GEMINI_TEXT_MODELS, requestBody);
      data = r.data;
    } catch (geminiErr: unknown) {
      const raw = String(geminiErr instanceof Error ? geminiErr.message : geminiErr);
      const invalidKey =
        /API_KEY_INVALID|API key not valid/i.test(raw) ||
        raw.toLowerCase().includes("invalid api key");
      return NextResponse.json(
        {
          error: "Gemini request failed.",
          detail: raw.slice(0, 800),
          hint: invalidKey
            ? "Your key was rejected by Google. Create a new key at https://aistudio.google.com/apikey , enable the Generative Language API for the project, and set GEMINI_API_KEY or VITE_GEMINI_API_KEY in the repo-root .env (restart npm run dev). If the key was exposed publicly, rotate it in Google Cloud."
            : "Check GEMINI_API_KEY / VITE_GEMINI_API_KEY in repo-root .env and restart the dev server.",
        },
        { status: 502 },
      );
    }
    const typed = data as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text =
      typed?.candidates?.[0]?.content?.parts?.map((p) => p?.text).join("") ?? "";

    const json = extractJson(text);
    if (!json) {
      return NextResponse.json(
        { error: "Model did not return valid JSON.", raw: text.slice(0, 2000) },
        { status: 502 },
      );
    }

    return NextResponse.json(json, { status: 200 });
  } catch (e: unknown) {
    return NextResponse.json(
      {
        error: "Unexpected debrief error.",
        detail: String(e instanceof Error ? e.message : e),
        hint: "Try again; if it persists, check server logs and Gemini API status.",
      },
      { status: 500 },
    );
  }
}

