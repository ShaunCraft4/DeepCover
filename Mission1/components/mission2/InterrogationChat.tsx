"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import { createTurn, useMission2Store } from "@/lib/mission2/store";
import type { PublicSuspectProfile } from "@/lib/mission2/types";

type DonePayload = {
  behavioral_flag: string | null;
  contradiction_introduced: boolean;
  tension_delta: number;
  code_revealed: boolean;
  launch_code?: string;
  audio_mp3_base64?: string | null;
  contradiction: { statement_a: string; statement_b: string } | null;
};

type Props = {
  suspect: PublicSuspectProfile;
  onVerdictNeeded: () => void;
};

export function InterrogationChat({ suspect, onVerdictNeeded }: Props) {
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState("");
  const [awaiting, setAwaiting] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [lastContra, setLastContra] = useState(false);

  const conversationHistory = useMission2Store((s) => s.conversationHistory);
  const pushTurn = useMission2Store((s) => s.pushTurn);
  const applyTensionDelta = useMission2Store((s) => s.applyTensionDelta);
  const bumpTurn = useMission2Store((s) => s.bumpTurn);
  const turnNumber = useMission2Store((s) => s.turnNumber);
  const questionsRemaining = useMission2Store((s) => s.questionsRemaining);
  const consumeQuestion = useMission2Store((s) => s.consumeQuestion);
  const codeRevealed = useMission2Store((s) => s.codeRevealed);
  const setCodeRevealed = useMission2Store((s) => s.setCodeRevealed);
  const setVerdictUnlocked = useMission2Store((s) => s.setVerdictUnlocked);
  const spyStatements = useMission2Store((s) => s.spyStatements);
  const addSpyStatement = useMission2Store((s) => s.addSpyStatement);
  const addContradiction = useMission2Store((s) => s.addContradiction);
  const setBehavioralFlag = useMission2Store((s) => s.setBehavioralFlag);
  const selectedSpyTurnId = useMission2Store((s) => s.selectedSpyTurnIdForChallenge);
  const setSelectedSpyTurn = useMission2Store((s) => s.setSelectedSpyTurn);
  const setLastContradictionIntroduced = useMission2Store(
    (s) => s.setLastContradictionIntroduced,
  );

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const completedTurns = useMemo(() => turnNumber, [turnNumber]);

  const playBase64Mp3 = useCallback((b64: string | null | undefined) => {
    if (!b64) return;
    try {
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      setVoiceActive(true);
      audio.onended = () => {
        setVoiceActive(false);
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => {
        setVoiceActive(false);
        URL.revokeObjectURL(url);
      };
      void audio.play();
    } catch {
      setVoiceActive(false);
    }
  }, []);

  const parseSse = useCallback(
    async (resp: Response, onToken: (t: string) => void, onDone: (d: DonePayload) => void) => {
      const reader = resp.body?.getReader();
      if (!reader) throw new Error("No stream");
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        for (;;) {
          const sep = buffer.indexOf("\n\n");
          if (sep === -1) break;
          const packet = buffer.slice(0, sep);
          buffer = buffer.slice(sep + 2);
          let eventName = "message";
          const dataParts: string[] = [];
          for (const line of packet.split("\n")) {
            if (line.startsWith("event:")) eventName = line.slice(6).trim();
            else if (line.startsWith("data:")) dataParts.push(line.slice(5).trim());
          }
          const dataStr = dataParts.join("");
          if (!dataStr) continue;
          const data = JSON.parse(dataStr) as Record<string, unknown>;
          if (eventName === "token" && typeof data.text === "string") {
            onToken(data.text);
          } else if (eventName === "done") {
            onDone(data as unknown as DonePayload);
          } else if (eventName === "error") {
            throw new Error(typeof data.message === "string" ? data.message : "Stream error");
          }
        }
      }
    },
    [],
  );

  const finalizeSpyReply = useCallback(
    (spyTextRaw: string, done: DonePayload) => {
      const spyText = spyTextRaw.trim();
      const spyTurn = createTurn("spy", spyText);
      pushTurn(spyTurn);
      addSpyStatement({ id: `stmt-${spyTurn.id}`, turnId: spyTurn.id, text: spyText });

      const delta = done.tension_delta ?? 5;
      applyTensionDelta(delta);
      setBehavioralFlag(done.behavioral_flag);
      const contra = Boolean(done.contradiction_introduced);
      setLastContra(contra);
      setLastContradictionIntroduced(contra);

      if (done.contradiction?.statement_a && done.contradiction?.statement_b) {
        addContradiction({
          id: `auto-${spyTurn.id}`,
          statementA: done.contradiction.statement_a,
          statementB: done.contradiction.statement_b,
          autoDetected: true,
          createdAt: Date.now(),
          spyTurnId: spyTurn.id,
        });
      }

      if (done.code_revealed) {
        setCodeRevealed(true);
        setVerdictUnlocked(true);
        onVerdictNeeded();
      } else {
        const remaining = useMission2Store.getState().questionsRemaining;
        if (!useMission2Store.getState().codeRevealed && remaining <= 0) {
          setVerdictUnlocked(true);
          onVerdictNeeded();
        }
      }

      bumpTurn();
      playBase64Mp3(done.audio_mp3_base64);
      setStreaming("");
      setAwaiting(false);
    },
    [
      addContradiction,
      addSpyStatement,
      applyTensionDelta,
      bumpTurn,
      onVerdictNeeded,
      playBase64Mp3,
      pushTurn,
      setBehavioralFlag,
      setCodeRevealed,
      setVerdictUnlocked,
      setLastContradictionIntroduced,
    ],
  );

  const sendQuestion = async () => {
    const q = input.trim();
    if (!q || awaiting) return;
    if (!codeRevealed && questionsRemaining <= 0) return;

    if (!codeRevealed) {
      consumeQuestion();
    }

    const userTurn = createTurn("user", q);
    pushTurn(userTurn);
    setInput("");
    setAwaiting(true);
    setStreaming("");
    setLastContra(false);
    setLastContradictionIntroduced(false);

    const nextTurnNumber = completedTurns + 1;
    const vulnerability_window_active = [4, 8, 12].includes(nextTurnNumber);
    const historyPayload = [...conversationHistory, userTurn].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    let accumulated = "";

    try {
      const resp = await fetch("/api/mission2/interrogate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          public_suspect: suspect,
          conversation_history: historyPayload,
          operative_question: q,
          tension_level: useMission2Store.getState().tensionLevel,
          turn_number: nextTurnNumber,
          vulnerability_window_active,
          previous_spy_statements: spyStatements.map((s) => s.text),
        }),
      });

      if (!resp.ok) {
        throw new Error("Interrogation link failed");
      }

      await parseSse(
        resp,
        (t) => {
          accumulated += t;
          setStreaming(accumulated);
        },
        (done) => {
          finalizeSpyReply(accumulated, done);
        },
      );
    } catch {
      setAwaiting(false);
      setStreaming("");
      pushTurn(
        createTurn(
          "spy",
          "— Channel noise. Repeat your question; I didn't catch that.",
        ),
      );
    } finally {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendQuestion();
    }
  };

  return (
    <div className="relative flex min-h-[420px] flex-col rounded-xl border border-[var(--border)] bg-[var(--panel)] shadow-glow">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[var(--text-secondary)]">
          Interrogation
        </p>
        <p
          className={`font-mono text-[10px] uppercase tracking-[0.2em] ${
            questionsRemaining < 5 ? "animate-pulse text-red-400" : "text-[var(--accent)]"
          }`}
        >
          QUESTIONS REMAINING: {Math.max(0, questionsRemaining)} / 15
        </p>
      </div>

      <div className="min-h-[280px] flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {conversationHistory.map((m) => (
          <div
            key={m.id}
            className={`animate-fade-slide-up ${
              m.role === "user" ? "ml-auto max-w-[85%] text-right" : "mr-auto max-w-[92%]"
            }`}
          >
            {m.role === "spy" ? (
              <button
                type="button"
                onClick={() => setSelectedSpyTurn(m.id === selectedSpyTurnId ? null : m.id)}
                className={`w-full rounded-lg border border-l-4 border-[var(--border)] border-l-[var(--accent)] bg-[#111111] px-3 py-3 text-left font-mono text-sm leading-relaxed text-[var(--text-primary)] transition hover:border-[rgba(0,255,157,0.3)] hover:bg-[rgba(0,255,157,0.04)] ${
                  selectedSpyTurnId === m.id ? "ring-1 ring-[rgba(0,255,157,0.35)]" : ""
                }`}
              >
                {m.content}
              </button>
            ) : (
              <div className="inline-block rounded-lg border border-[var(--border)] bg-black/35 px-3 py-3 text-sm leading-relaxed text-[var(--text-primary)]">
                {m.content}
              </div>
            )}
            {m.role === "spy" && selectedSpyTurnId === m.id && (
              <p className="mt-1 text-[10px] text-[var(--accent)]">Selected — reference this in your next message if you press.</p>
            )}
          </div>
        ))}

        {streaming ? (
          <div className="animate-fade-slide-up mr-auto max-w-[92%] rounded-lg border border-l-4 border-[var(--border)] border-l-[var(--accent)] bg-[#111111] px-3 py-3 font-mono text-sm leading-relaxed text-[var(--text-primary)]">
            {streaming}
            <span className="ml-1 inline-block h-4 w-1 animate-pulse bg-[var(--accent)] align-middle" />
          </div>
        ) : null}

        {awaiting && !streaming ? (
          <div className="flex items-center gap-2 px-2 py-2 font-mono text-xs text-[var(--text-muted)]">
            <span className="inline-flex gap-1">
              <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--accent)] [animation-delay:-0.2s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--accent)] [animation-delay:-0.1s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--accent)]" />
            </span>
            Subject is composing…
          </div>
        ) : null}

        <div ref={bottomRef} />
      </div>

      {streaming || voiceActive ? (
        <div className="border-t border-[var(--border)] px-4 py-2">
          <div className="flex h-8 items-end gap-1">
            {Array.from({ length: 16 }).map((_, i) => (
              <div
                key={i}
                className="w-1 flex-1 origin-bottom rounded-sm bg-[rgba(0,255,157,0.35)] animate-wave-bar"
                style={{ animationDelay: `${i * 60}ms` }}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="border-t border-[var(--border)] p-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          rows={3}
          placeholder="Type your question…"
          disabled={awaiting || (!codeRevealed && questionsRemaining <= 0)}
          className="w-full resize-none rounded-lg border border-[var(--border)] bg-black/40 px-3 py-2 font-mono text-sm text-[var(--text-primary)] outline-none transition focus:border-[rgba(0,255,157,0.35)] disabled:opacity-50"
        />
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] text-[var(--text-muted)]">
            {lastContra ? (
              <span className="text-[var(--text-secondary)]">Possible slip — check the left panel.</span>
            ) : (
              <span className="text-[var(--text-muted)]">Enter to send</span>
            )}
          </p>
          <button
            type="button"
            onClick={() => void sendQuestion()}
            disabled={awaiting || (!codeRevealed && questionsRemaining <= 0)}
            className="rounded-md border border-[rgba(0,255,157,0.35)] bg-[rgba(0,255,157,0.08)] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--accent)] transition hover:bg-[rgba(0,255,157,0.12)] disabled:opacity-40"
          >
            Transmit
          </button>
        </div>
      </div>
    </div>
  );
}
