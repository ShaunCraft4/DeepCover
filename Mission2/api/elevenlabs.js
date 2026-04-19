const audioCache = new Map();

function hashText(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return String(h);
}

let sharedCtx = null;

function getAudioContext() {
  if (!sharedCtx) {
    sharedCtx = new AudioContext();
  }
  return sharedCtx;
}

/**
 * Must run synchronously inside the click/key handler (before any await).
 * Creates context, resumes it, and plays a near-silent blip so later decodeAudioData + start() work.
 */
export function unlockAudioPlayback() {
  try {
    const ctx = getAudioContext();
    void ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.value = 0.0001;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.03);
  } catch (e) {
    console.warn("[Audio] unlock failed:", e);
  }
}

function speakViaWebSpeech(text) {
  return new Promise((resolve) => {
    if (typeof speechSynthesis === "undefined") {
      resolve();
      return;
    }
    const clean = text.replace(/\[[^\]]+\]/g, "").trim();
    if (!clean) {
      resolve();
      return;
    }
    console.log("[Audio] Web Speech (fallback), length:", clean.length);
    const u = new SpeechSynthesisUtterance(clean.slice(0, 4000));
    u.rate = 1;
    u.onend = resolve;
    u.onerror = (ev) => {
      console.warn("[Audio] speechSynthesis error:", ev);
      resolve();
    };
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  });
}

export async function speakText(text) {
  unlockAudioPlayback();

  const key = hashText(text);
  if (audioCache.has(key)) {
    return playBuffer(audioCache.get(key));
  }

  const voiceId = String(import.meta.env.VITE_ELEVENLABS_VOICE_ID ?? "").trim();
  const apiKey = String(import.meta.env.VITE_ELEVENLABS_API_KEY ?? "").trim();

  if (!voiceId || !apiKey) {
    console.log("[Audio] ElevenLabs env missing — using Web Speech");
    await speakViaWebSpeech(text);
    return;
  }

  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: text.slice(0, 2500),
        model_id: "eleven_turbo_v2",
        voice_settings: {
          stability: 0.55,
          similarity_boost: 0.88,
          style: 0.2,
          use_speaker_boost: true,
        },
      }),
    });

    const errBody = await res.text();
    if (!res.ok) {
      console.warn("[Audio] ElevenLabs HTTP", res.status, errBody.slice(0, 400));
      await speakViaWebSpeech(text);
      return;
    }

    const buffer = await res.arrayBuffer();
    if (buffer.byteLength < 100) {
      console.warn("[Audio] ElevenLabs returned tiny buffer, using Web Speech");
      await speakViaWebSpeech(text);
      return;
    }

    audioCache.set(key, buffer);
    console.log("[Audio] ElevenLabs OK, bytes:", buffer.byteLength);
    await playBuffer(buffer);
  } catch (e) {
    console.warn("[Audio] ElevenLabs:", e);
    await speakViaWebSpeech(text);
  }
}

async function playBuffer(buffer) {
  unlockAudioPlayback();
  const ctx = getAudioContext();
  try {
    await ctx.resume();
  } catch {
    /* ignore */
  }
  const copy = buffer.slice(0);
  const decoded = await ctx.decodeAudioData(copy);
  const source = ctx.createBufferSource();
  source.buffer = decoded;
  source.connect(ctx.destination);
  source.start(0);
  return new Promise((resolve) => {
    source.onended = resolve;
  });
}
