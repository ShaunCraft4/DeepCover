import { NextResponse } from "next/server";

import { FALLBACK_SUSPECT } from "@/lib/mission2/fallbackSuspect";
import { generateSuspectWithGemini } from "@/lib/mission2/geminiMission2";
import { saveMission2Secrets } from "@/lib/mission2/session";
import { toPublicSuspect } from "@/lib/mission2/validateSuspect";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST() {
  let suspect = await generateSuspectWithGemini();
  if (!suspect) {
    suspect = await generateSuspectWithGemini();
  }
  if (!suspect) {
    suspect = FALLBACK_SUSPECT;
  }

  await saveMission2Secrets({
    hidden_truth: suspect.hidden_truth,
    launch_code: suspect.launch_code,
  });

  const publicProfile = toPublicSuspect(suspect);
  const envVoice = process.env.ELEVENLABS_SPY_VOICE_ID?.trim();
  const suspectOut = envVoice ? { ...publicProfile, voice_id: envVoice } : publicProfile;
  return NextResponse.json({ suspect: suspectOut }, { status: 200 });
}
