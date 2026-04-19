const KEY = String(import.meta.env.VITE_GEMINI_API_KEY ?? "").trim();
const MODEL = String(import.meta.env.VITE_GEMINI_MODEL || "gemini-2.0-flash").trim();
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`;
const GEMINI_STREAM_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:streamGenerateContent?alt=sse&key=${KEY}`;

function partToText(p) {
  if (!p || typeof p !== "object") return "";
  if (typeof p.text === "string") return p.text;
  return "";
}

function extractTextFromGenerateResponse(data) {
  const fb = data?.promptFeedback;
  if (fb?.blockReason) {
    console.warn("[Gemini] promptFeedback:", fb);
  }
  const cands = data?.candidates;
  if (!cands?.length) {
    console.warn("[Gemini] no candidates in response");
    return "";
  }
  const cand = cands[0];
  const finish = cand?.finishReason;
  if (finish && finish !== "STOP" && finish !== "MAX_TOKENS") {
    console.warn("[Gemini] finishReason:", finish);
  }
  const parts = cand?.content?.parts;
  if (!parts?.length) {
    console.warn("[Gemini] no content.parts", cand);
    return "";
  }
  const joined = parts.map(partToText).join("");
  return joined;
}

function buildContentParts(role, text) {
  return { role, parts: [{ text }] };
}

const DIALOGUE_CONFIG = {
  temperature: 1,
  maxOutputTokens: 768,
  topP: 0.95,
  topK: 64,
};

export async function callGemini({
  systemInstruction,
  userMessage,
  temperature = 0.85,
  maxTokens = 1000,
}) {
  const body = {
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents: [buildContentParts("user", userMessage)],
    generationConfig: { temperature, maxOutputTokens: maxTokens },
  };

  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    console.warn("Gemini generateContent HTTP", res.status, data);
    return "";
  }
  return extractTextFromGenerateResponse(data);
}

export async function generateContentNonStream({ systemInstruction, contents, generationConfig }) {
  const body = {
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents,
    generationConfig: { ...DIALOGUE_CONFIG, ...generationConfig },
  };

  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    console.warn("Gemini generateContent (fallback) HTTP", res.status, data);
    return "";
  }
  return extractTextFromGenerateResponse(data);
}

/**
 * Single round-trip: your text → Gemini → model reply. No SSE parsing.
 * Logs full raw JSON (truncated) and extracted string to the console.
 */
export async function generateInterrogationReply({
  systemInstruction,
  conversationHistory,
  newMessage,
}) {
  if (!KEY) {
    console.error("[Gemini] Missing VITE_GEMINI_API_KEY (check Mission2/.env — no spaces around =).");
    return "";
  }

  const contents = [
    ...conversationHistory.map((t) => ({
      role: t.role,
      parts: [{ text: t.content }],
    })),
    buildContentParts("user", newMessage),
  ];

  const body = {
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents,
    generationConfig: { ...DIALOGUE_CONFIG },
  };

  console.log("[Gemini] model:", MODEL);
  console.log("[Gemini] YOU SEND (last user line):", newMessage);
  console.log("[Gemini] history turns:", conversationHistory.length);

  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const rawText = await res.text();
  let data;
  try {
    data = JSON.parse(rawText);
  } catch (e) {
    console.error("[Gemini] not JSON:", rawText.slice(0, 500));
    return "";
  }

  console.log("[Gemini] HTTP", res.status);
  console.log("[Gemini] RAW RESPONSE JSON:", rawText.length > 8000 ? `${rawText.slice(0, 8000)}…(truncated)` : rawText);

  if (!res.ok) {
    console.warn("[Gemini] error body:", data);
    return "";
  }

  const reply = extractTextFromGenerateResponse(data);
  console.log("[Gemini] EXTRACTED REPLY:", reply);
  return reply;
}

export async function callGeminiStream({
  systemInstruction,
  conversationHistory,
  newMessage,
  onChunk,
  onDone,
}) {
  const contents = [
    ...conversationHistory.map((t) => ({
      role: t.role,
      parts: [{ text: t.content }],
    })),
    buildContentParts("user", newMessage),
  ];

  const generationConfig = { ...DIALOGUE_CONFIG };

  const streamBody = {
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents,
    generationConfig,
  };

  const res = await fetch(GEMINI_STREAM_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(streamBody),
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    console.warn("Gemini stream HTTP", res.status, errJson);
    const fallback = await generateContentNonStream({
      systemInstruction,
      contents,
      generationConfig,
    });
    await Promise.resolve(onDone(fallback));
    return fallback;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    const fallback = await generateContentNonStream({
      systemInstruction,
      contents,
      generationConfig,
    });
    await Promise.resolve(onDone(fallback));
    return fallback;
  }

  const decoder = new TextDecoder();
  let fullText = "";
  let sseBuffer = "";

  function emitParsedJson(json) {
    const parts = json?.candidates?.[0]?.content?.parts;
    const chunk = parts?.map(partToText).join("") ?? "";
    if (chunk) {
      fullText += chunk;
      onChunk(chunk);
    }
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    sseBuffer += decoder.decode(value, { stream: true });
    const lines = sseBuffer.split("\n");
    sseBuffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const json = JSON.parse(payload);
        if (Array.isArray(json)) {
          for (const item of json) emitParsedJson(item);
        } else {
          emitParsedJson(json);
        }
      } catch {
        /* skip */
      }
    }
  }

  if (!fullText.trim()) {
    fullText = await generateContentNonStream({
      systemInstruction,
      contents,
      generationConfig,
    });
    if (fullText) onChunk(fullText);
  }

  await Promise.resolve(onDone(fullText));
  return fullText;
}

export async function repairSuspectReply({ systemInstruction, conversationHistory, newMessage }) {
  const contents = [
    ...conversationHistory.map((t) => ({
      role: t.role,
      parts: [{ text: t.content }],
    })),
    buildContentParts("user", newMessage),
  ];
  const repairPrefix = `Your last reply failed to transmit. Answer again in character — same person, natural speech.\n\n`;
  return generateContentNonStream({
    systemInstruction: repairPrefix + systemInstruction,
    contents,
    generationConfig: { temperature: 1, maxOutputTokens: 500 },
  });
}
