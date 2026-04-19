import { NextResponse } from "next/server";

import { checkSpyContradiction } from "@/lib/mission2/contradictionEngine";
import { streamSpyReply } from "@/lib/mission2/geminiMission2";
import { mergePublicWithSecrets } from "@/lib/mission2/mergeSuspect";
import { analyzeInterrogationExchange } from "@/lib/mission2/metaAnalysis";
import { buildSpySystemPrompt } from "@/lib/mission2/spyPrompt";
import { readMission2Secrets } from "@/lib/mission2/session";
import { synthesizeMission2Mp3 } from "@/lib/mission2/tts";
import type { PublicSuspectProfile } from "@/lib/mission2/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const CODE_RE = /\[CODE:([A-Z0-9]{6})\]/i;

type ReqBody = {
  public_suspect?: PublicSuspectProfile;
  conversation_history?: { role: string; content: string }[];
  operative_question?: string;
  tension_level?: number;
  turn_number?: number;
  vulnerability_window_active?: boolean;
  previous_spy_statements?: string[];
};

export async function POST(req: Request) {
  let body: ReqBody;
  try {
    body = (await req.json()) as ReqBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const secrets = await readMission2Secrets();
  if (!secrets) {
    return NextResponse.json({ error: "No active mission session" }, { status: 401 });
  }

  const pub = body.public_suspect;
  if (!pub) {
    return NextResponse.json({ error: "Missing public_suspect" }, { status: 400 });
  }

  const question = String(body.operative_question ?? "").trim();
  if (!question) {
    return NextResponse.json({ error: "Missing operative_question" }, { status: 400 });
  }

  const history = Array.isArray(body.conversation_history) ? body.conversation_history : [];
  const tension = clamp(
    typeof body.tension_level === "number" ? body.tension_level : 40,
    0,
    100,
  );
  const turnNumber =
    typeof body.turn_number === "number" && Number.isFinite(body.turn_number)
      ? Math.max(1, Math.round(body.turn_number))
      : 1;
  const vuln = Boolean(body.vulnerability_window_active);
  const prevStatements = Array.isArray(body.previous_spy_statements)
    ? body.previous_spy_statements.map((s) => String(s))
    : [];

  const suspect = mergePublicWithSecrets(pub, secrets);
  const systemInstruction = buildSpySystemPrompt(suspect);

  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      let fullText = "";
      try {
        for await (const chunk of streamSpyReply({
          systemInstruction,
          history: history.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          userText: question,
        })) {
          fullText += chunk;
          send("token", { text: chunk });
        }
      } catch {
        send("error", { message: "Interrogation channel interrupted." });
        controller.close();
        return;
      }

      if (!fullText.trim()) {
        send("error", { message: "Empty response from subject." });
        controller.close();
        return;
      }

      const codeMatch = fullText.match(CODE_RE);
      const extracted = codeMatch ? codeMatch[1].toUpperCase() : null;
      const code_revealed = Boolean(extracted && extracted === secrets.launch_code.toUpperCase());

      const [contraCheck, meta] = await Promise.all([
        checkSpyContradiction(fullText, prevStatements),
        analyzeInterrogationExchange({
          userQuestion: question,
          spyReply: fullText,
          turnNumber,
          vulnerabilityWindow: vuln,
        }),
      ]);

      const contradiction_introduced =
        Boolean(contraCheck.contradiction) || Boolean(meta.contradiction_introduced);

      const tts = await synthesizeMission2Mp3(suspect.voice_id, fullText, tension);

      send("done", {
        behavioral_flag: meta.behavioral_flag,
        contradiction_introduced,
        tension_delta: meta.tension_delta,
        code_revealed,
        launch_code: code_revealed ? secrets.launch_code : undefined,
        audio_mp3_base64: tts.ok ? tts.base64 : null,
        contradiction:
          contraCheck.contradiction && contraCheck.statement_a && contraCheck.statement_b
            ? {
                statement_a: contraCheck.statement_a,
                statement_b: contraCheck.statement_b,
              }
            : null,
      });

      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
    },
  });
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
