import { NextResponse } from "next/server";

import { ARTIFACTS } from "@/data/mission1-mock";
import { elevenLabsSynthesizeMp3 } from "@/lib/elevenlabs-tts";
import { linesToTtsText } from "@/lib/transcript-tts";
import { getElevenLabsApiKey, getElevenLabsVoiceId } from "@/lib/server-env";

/** In-memory cache (per server instance) to avoid repeat ElevenLabs charges in dev. */
const audioCache = new Map<string, ArrayBuffer>();

function cacheKey(voiceId: string, kind: string, text: string) {
  return `${voiceId}:${kind}:${text.slice(0, 400)}`;
}

function mp3Response(buf: ArrayBuffer) {
  return new NextResponse(buf, {
    status: 200,
    headers: {
      "content-type": "audio/mpeg",
      "cache-control": "public, max-age=3600",
    },
  });
}

export async function GET(req: Request) {
  const key = getElevenLabsApiKey();
  const voiceId = getElevenLabsVoiceId();

  if (!key) {
    return NextResponse.json(
      { error: "Missing ELEVENLABS_API_KEY on the Mission1 server." },
      { status: 501 },
    );
  }

  const { searchParams } = new URL(req.url);
  const artifactId = (searchParams.get("artifactId") || "").trim();
  if (!artifactId) {
    return NextResponse.json({ error: "Missing artifactId query parameter." }, { status: 400 });
  }

  const artifact = ARTIFACTS.find((a) => a.id === artifactId);
  if (!artifact || artifact.type !== "audio" || artifact.content.kind !== "audio") {
    return NextResponse.json({ error: "Unknown or non-audio artifact." }, { status: 404 });
  }

  const text = linesToTtsText(artifact.content.transcript);
  if (!text) {
    return NextResponse.json({ error: "No transcript text to synthesize." }, { status: 400 });
  }

  const ck = cacheKey(voiceId, `artifact:${artifactId}`, text);
  const cached = audioCache.get(ck);
  if (cached) {
    return mp3Response(cached);
  }

  const result = await elevenLabsSynthesizeMp3(key, voiceId, text);
  if (!result.ok) {
    return NextResponse.json(
      { error: "ElevenLabs request failed.", status: result.status, detail: result.message },
      { status: result.status >= 400 && result.status < 600 ? result.status : 502 },
    );
  }

  audioCache.set(ck, result.buffer);
  return mp3Response(result.buffer);
}

/**
 * Body: `{ "text": "..." }` and/or `{ "lines": ["[00:01] foo", "..."] }` (lines are stripped like GET).
 * Used when session inline audio is absent but the UI still needs ElevenLabs speech.
 */
export async function POST(req: Request) {
  const key = getElevenLabsApiKey();
  const voiceId = getElevenLabsVoiceId();

  if (!key) {
    return NextResponse.json(
      { error: "Missing ELEVENLABS_API_KEY on the Mission1 server." },
      { status: 501 },
    );
  }

  let body: { text?: unknown; lines?: unknown };
  try {
    body = (await req.json()) as { text?: unknown; lines?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const fromText = typeof body.text === "string" ? body.text.trim() : "";
  const fromLines =
    Array.isArray(body.lines) && body.lines.length > 0
      ? linesToTtsText(body.lines.map((x) => String(x)))
      : "";
  const text = fromText || fromLines;
  if (!text) {
    return NextResponse.json(
      { error: "Provide non-empty `text` or `lines` for ElevenLabs synthesis." },
      { status: 400 },
    );
  }

  const ck = cacheKey(voiceId, "post", text);
  const cached = audioCache.get(ck);
  if (cached) {
    return mp3Response(cached);
  }

  const result = await elevenLabsSynthesizeMp3(key, voiceId, text);
  if (!result.ok) {
    return NextResponse.json(
      { error: "ElevenLabs request failed.", status: result.status, detail: result.message },
      { status: result.status >= 400 && result.status < 600 ? result.status : 502 },
    );
  }

  audioCache.set(ck, result.buffer);
  return mp3Response(result.buffer);
}
