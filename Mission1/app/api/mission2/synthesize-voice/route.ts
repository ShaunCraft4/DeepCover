import { NextResponse } from "next/server";

import { synthesizeMission2Mp3 } from "@/lib/mission2/tts";

export const runtime = "nodejs";

type Body = {
  text?: string;
  voice_id?: string;
  tension_level?: number;
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text : "";
  const voiceId = typeof body.voice_id === "string" ? body.voice_id : "";
  const tension =
    typeof body.tension_level === "number" && Number.isFinite(body.tension_level)
      ? body.tension_level
      : 40;

  if (!text.trim() || !voiceId.trim()) {
    return NextResponse.json({ error: "Missing text or voice_id" }, { status: 400 });
  }

  const result = await synthesizeMission2Mp3(voiceId, text, tension);
  if (!result.ok) {
    return NextResponse.json({ ok: false }, { status: 200 });
  }

  return NextResponse.json({ ok: true, audio_mp3_base64: result.base64 }, { status: 200 });
}
