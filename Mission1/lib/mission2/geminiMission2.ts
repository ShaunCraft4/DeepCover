import { extractJsonObject } from "@/lib/gemini-json";
import { GEMINI_TEXT_MODELS, geminiGenerateContentFirstOk } from "@/lib/gemini-text";
import { getGeminiApiKey } from "@/lib/server-env";

import type { SuspectProfile } from "./types";
import { validateSuspectProfile } from "./validateSuspect";

export const MISSION2_GENERATE_MODELS = [
  "gemini-1.5-pro",
  "gemini-2.0-flash",
  ...GEMINI_TEXT_MODELS,
] as const;

export const MISSION2_STREAM_MODELS = [
  "gemini-1.5-pro",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
] as const;

const SUSPECT_JSON_SCHEMA = `Strict JSON with name, age, occupation, surface_story, hidden_truth, launch_code (6 A-Z0-9), psychological_profile { type, tells[], vulnerability_triggers[] }, known_facts[], contradictions_to_plant[] (3), voice_id, micro_expression_states { neutral, nervous, caught, smug }.`;

export async function generateSuspectWithGemini(): Promise<SuspectProfile | null> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;

  const prompt = [
    "Design a fictional interrogation suspect. Return STRICT JSON ONLY.",
    SUSPECT_JSON_SCHEMA,
    "Rules: contradictions_to_plant must have exactly 3 items; launch_code exactly 6 alphanumeric.",
  ].join("\n");

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { data } = await geminiGenerateContentFirstOk(apiKey, MISSION2_GENERATE_MODELS, {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 4096,
        },
      });
      const raw =
        (data as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> })
          ?.candidates?.[0]?.content?.parts?.map((p) => p?.text).join("") ?? "";
      const parsed = extractJsonObject(raw);
      const v = validateSuspectProfile(parsed);
      if (v) return v;
    } catch {
      /* retry */
    }
  }
  return null;
}

export async function* streamSpyReply(params: {
  systemInstruction: string;
  history: { role: string; content: string }[];
  userText: string;
}): AsyncGenerator<string, void, void> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) throw new Error("Missing Gemini API key");

  const contents = [
    ...params.history.map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    })),
    { role: "user" as const, parts: [{ text: params.userText }] },
  ];

  const body = {
    systemInstruction: { parts: [{ text: params.systemInstruction }] },
    contents,
    generationConfig: {
      temperature: 0.85,
      maxOutputTokens: 1024,
    },
  };

  let lastErr: Error | null = null;
  for (const model of MISSION2_STREAM_MODELS) {
    const url = new URL(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        model,
      )}:streamGenerateContent`,
    );
    url.searchParams.set("key", apiKey);
    url.searchParams.set("alt", "sse");

    try {
      const resp = await fetch(url.toString(), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!resp.ok || !resp.body) {
        lastErr = new Error(`Stream failed (${resp.status})`);
        continue;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const t = line.trim();
          if (!t.startsWith("data:")) continue;
          const payload = t.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const json = JSON.parse(payload) as {
              candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
            };
            const parts = json?.candidates?.[0]?.content?.parts ?? [];
            for (const part of parts) {
              const text = part?.text;
              if (text) yield text;
            }
          } catch {
            /* skip */
          }
        }
      }
      return;
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
    }
  }
  if (lastErr) throw lastErr;
}
