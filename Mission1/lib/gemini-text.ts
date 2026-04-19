/**
 * Text/JSON calls against the Generative Language API. Model IDs change; we try a chain.
 * @see https://ai.google.dev/gemini-api/docs/models/gemini
 */
export const GEMINI_TEXT_MODELS = [
  "gemini-2.0-flash",
  "gemini-2.5-flash",
  "gemini-1.5-flash",
] as const;

export async function geminiGenerateContentFirstOk(
  apiKey: string,
  models: readonly string[],
  requestBody: Record<string, unknown>,
): Promise<{ model: string; data: unknown }> {
  let lastStatus = 0;
  let lastBody = "";
  for (const model of models) {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
        apiKey,
      )}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(requestBody),
      },
    );
    if (resp.ok) {
      return { model, data: await resp.json() };
    }
    lastStatus = resp.status;
    lastBody = await resp.text();
  }
  throw new Error(
    `Gemini text request failed (${lastStatus}): ${lastBody.slice(0, 1200)}`,
  );
}
