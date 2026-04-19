/**
 * ElevenLabs Text-to-speech — single implementation for session JSON, /api/mission/tts, etc.
 * @see https://elevenlabs.io/docs/api-reference/text-to-speech/convert
 */

export type ElevenLabsSynthesizeResult =
  | { ok: true; buffer: ArrayBuffer }
  | { ok: false; status: number; message: string };

const TTS_MODEL = "eleven_multilingual_v2";
const MAX_CHARS = 2500;

function ttsUrl(voiceId: string): string {
  const u = new URL(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`,
  );
  u.searchParams.set("output_format", "mp3_44100_128");
  return u.toString();
}

/** Raw MP3 bytes from ElevenLabs, or structured failure (never throws). */
export async function elevenLabsSynthesizeMp3(
  apiKey: string,
  voiceId: string,
  text: string,
): Promise<ElevenLabsSynthesizeResult> {
  const trimmed = text.trim().slice(0, MAX_CHARS);
  if (!trimmed) {
    return { ok: false, status: 0, message: "Empty text" };
  }
  if (!apiKey) {
    return { ok: false, status: 0, message: "Missing API key" };
  }

  try {
    const resp = await fetch(ttsUrl(voiceId), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "xi-api-key": apiKey,
        accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: trimmed,
        model_id: TTS_MODEL,
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.8,
        },
      }),
    });

    if (!resp.ok) {
      const message = await resp.text();
      if (process.env.NODE_ENV === "development") {
        console.error("[ElevenLabs TTS]", resp.status, message.slice(0, 600));
      }
      return { ok: false, status: resp.status, message: message.slice(0, 2000) };
    }

    const buffer = await resp.arrayBuffer();
    return { ok: true, buffer };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, status: 0, message };
  }
}

/** Base64 MP3 for JSON session payloads (Node API routes). */
export async function elevenLabsToMp3Base64(
  apiKey: string,
  text: string,
  voiceId: string,
): Promise<string | null> {
  const result = await elevenLabsSynthesizeMp3(apiKey, voiceId, text);
  if (!result.ok) return null;
  return Buffer.from(result.buffer).toString("base64");
}
