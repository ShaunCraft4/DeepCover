import { extractJsonObject } from "@/lib/gemini-json";
import { GEMINI_TEXT_MODELS, geminiGenerateContentFirstOk } from "@/lib/gemini-text";
import { getGeminiApiKey } from "@/lib/server-env";

export type ContradictionCheckResult = {
  contradiction: boolean;
  statement_a: string;
  statement_b: string;
};

const cache = new Map<string, ContradictionCheckResult>();

function hashKey(latest: string, previous: string[]): string {
  return `${latest.length}:${previous.length}:${latest.slice(0, 120)}`;
}

export async function checkSpyContradiction(
  latestSpyResponse: string,
  previousSpyStatements: string[],
): Promise<ContradictionCheckResult> {
  const key = hashKey(latestSpyResponse, previousSpyStatements);
  const hit = cache.get(key);
  if (hit) return hit;

  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return { contradiction: false, statement_a: "", statement_b: "" };
  }

  const prompt = [
    "You compare an interrogation subject's NEW reply against their EARLIER factual claims.",
    "Return STRICT JSON ONLY (no markdown):",
    '{ "contradiction": boolean, "statement_a": string, "statement_b": string }',
    "If contradiction is false, use empty strings for statement_a and statement_b.",
    "A contradiction means two claims cannot both be true in the real world (not mere vagueness).",
    "",
    "EARLIER CLAIMS (spy lines, oldest to newest):",
    previousSpyStatements.length
      ? previousSpyStatements.map((s, i) => `${i + 1}. ${s}`).join("\n")
      : "(none)",
    "",
    "NEW REPLY:",
    latestSpyResponse,
  ].join("\n");

  try {
    const { data } = await geminiGenerateContentFirstOk(apiKey, GEMINI_TEXT_MODELS, {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 512,
      },
    });
    const raw =
      (data as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> })
        ?.candidates?.[0]?.content?.parts?.map((p) => p?.text).join("") ?? "";
    const parsed = extractJsonObject(raw) as Record<string, unknown> | null;
    if (!parsed) {
      const out: ContradictionCheckResult = {
        contradiction: false,
        statement_a: "",
        statement_b: "",
      };
      cache.set(key, out);
      return out;
    }
    const out: ContradictionCheckResult = {
      contradiction: Boolean(parsed.contradiction),
      statement_a: String(parsed.statement_a ?? ""),
      statement_b: String(parsed.statement_b ?? ""),
    };
    cache.set(key, out);
    return out;
  } catch {
    return { contradiction: false, statement_a: "", statement_b: "" };
  }
}
