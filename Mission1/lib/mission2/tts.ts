import { getElevenLabsApiKey } from "@/lib/server-env";

export type Mission2TtsResult =
  | { ok: true; base64: string }
  | { ok: false };

const cache = new Map<string, string>();

function cacheKey(voiceId: string, tension: number, text: string): string {
  const t = text.trim().slice(0, 4000);
  return `${voiceId}|${tension}|${t.length}|${t.slice(0, 64)}`;
}

export async function synthesizeMission2Mp3(
  voiceId: string,
  text: string,
  tensionLevel: number,
): Promise<Mission2TtsResult> {
  const apiKey = getElevenLabsApiKey();
  if (!apiKey) return { ok: false };

  const trimmed = text.trim().slice(0, 2500);
  if (!trimmed) return { ok: false };

  const key = cacheKey(voiceId, tensionLevel, trimmed);
  const hit = cache.get(key);
  if (hit) return { ok: true, base64: hit };

  const tension = Math.min(100, Math.max(0, tensionLevel));
  const stability = Math.max(0.3, 0.7 - tension / 200);
  const style = Math.min(0.4, tension / 250);

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`;

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "content-type": "application/json",
        accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: trimmed,
        model_id: "eleven_turbo_v2",
        voice_settings: {
          stability,
          similarity_boost: 0.85,
          style,
          use_speaker_boost: true,
        },
      }),
    });

    if (!resp.ok) {
      return { ok: false };
    }

    const buf = await resp.arrayBuffer();
    const base64 = Buffer.from(buf).toString("base64");
    cache.set(key, base64);
    return { ok: true, base64 };
  } catch {
    return { ok: false };
  }
}
