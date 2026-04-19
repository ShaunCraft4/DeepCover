import { extractJsonObject } from "@/lib/gemini-json";
import { GEMINI_TEXT_MODELS, geminiGenerateContentFirstOk } from "@/lib/gemini-text";
import { getGeminiApiKey } from "@/lib/server-env";

export type ExchangeMeta = {
  behavioral_flag: string | null;
  tension_delta: number;
  contradiction_introduced: boolean;
};

export async function analyzeInterrogationExchange(params: {
  userQuestion: string;
  spyReply: string;
  turnNumber: number;
  vulnerabilityWindow: boolean;
}): Promise<ExchangeMeta> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return {
      behavioral_flag: null,
      tension_delta: 4,
      contradiction_introduced: false,
    };
  }

  const prompt = [
    "Analyze one interrogation exchange. Return STRICT JSON ONLY:",
    '{ "behavioral_flag": string | null, "tension_delta": number, "contradiction_introduced": boolean }',
    "tension_delta: integer -5 to +15.",
    `Turn ${params.turnNumber}. Vulnerability: ${params.vulnerabilityWindow}.`,
    "QUESTION:",
    params.userQuestion,
    "REPLY:",
    params.spyReply,
  ].join("\n");

  try {
    const { data } = await geminiGenerateContentFirstOk(apiKey, GEMINI_TEXT_MODELS, {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.15, maxOutputTokens: 256 },
    });
    const raw =
      (data as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> })
        ?.candidates?.[0]?.content?.parts?.map((p) => p?.text).join("") ?? "";
    const parsed = extractJsonObject(raw) as Record<string, unknown> | null;
    if (!parsed) {
      return {
        behavioral_flag: null,
        tension_delta: 6,
        contradiction_introduced: false,
      };
    }
    const td = Number(parsed.tension_delta);
    const tension_delta = Number.isFinite(td)
      ? Math.min(15, Math.max(-5, Math.round(td)))
      : 6;
    const behavioral =
      parsed.behavioral_flag === null || parsed.behavioral_flag === undefined
        ? null
        : String(parsed.behavioral_flag).trim().slice(0, 120) || null;
    return {
      behavioral_flag: behavioral,
      tension_delta,
      contradiction_introduced: Boolean(parsed.contradiction_introduced),
    };
  } catch {
    return {
      behavioral_flag: null,
      tension_delta: 5,
      contradiction_introduced: false,
    };
  }
}
