/**
 * Image-capable models (IDs change on AI Studio). Order: prefer stable image endpoints.
 * Native image generation typically expects TEXT + IMAGE response modalities.
 * @see https://ai.google.dev/gemini-api/docs/image-generation
 */
const IMAGE_MODELS = [
  "gemini-2.0-flash-preview-image-generation",
  "gemini-2.5-flash-image",
  "gemini-2.5-flash-image-preview",
  "gemini-3-pro-image-preview",
];

/**
 * Returns a data URL suitable for `<img src>` or null if generation fails.
 */
export async function geminiGenerateImageDataUrl(
  apiKey: string,
  prompt: string,
): Promise<string | null> {
  const p = prompt.trim();
  if (!p || !apiKey) return null;

  for (const model of IMAGE_MODELS) {
    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
          apiKey,
        )}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: p }] }],
            generationConfig: {
              // IMAGE-only requests often return no inline image; include TEXT.
              responseModalities: ["TEXT", "IMAGE"],
              temperature: 0.9,
            },
          }),
        },
      );
      if (!resp.ok) {
        if (process.env.NODE_ENV === "development") {
          const err = await resp.text();
          console.error(`[Gemini image] ${model} ${resp.status}`, err.slice(0, 400));
        }
        continue;
      }

      const data = (await resp.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { mimeType?: string; data?: string } }> } }>;
      };
      const parts = data?.candidates?.[0]?.content?.parts ?? [];
      for (const part of parts) {
        const mime = part.inlineData?.mimeType;
        const b64 = part.inlineData?.data;
        if (mime && b64) {
          return `data:${mime};base64,${b64}`;
        }
      }
    } catch {
      /* try next model */
    }
  }
  return null;
}
