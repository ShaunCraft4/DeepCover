"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useMission2Store } from "@/lib/mission2/store";
import type { DebriefClientPayload, VerdictPayload } from "@/lib/mission2/types";

type Props = {
  open: boolean;
};

export function VerdictForm({ open }: Props) {
  const router = useRouter();
  const suspect = useMission2Store((s) => s.suspect);
  const conversationHistory = useMission2Store((s) => s.conversationHistory);
  const turnNumber = useMission2Store((s) => s.turnNumber);
  const codeRevealed = useMission2Store((s) => s.codeRevealed);
  const contradictionsLogged = useMission2Store((s) => s.contradictionsLogged);
  const setDebriefPayload = useMission2Store((s) => s.setDebriefPayload);
  const setScore = useMission2Store((s) => s.setScore);
  const setXp = useMission2Store((s) => s.setXp);

  const [what, setWhat] = useState("");
  const [evidence, setEvidence] = useState("");
  const [action, setAction] = useState<VerdictPayload["recommended_action"]>("Further Interrogation");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const transcript = conversationHistory.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const verdict: VerdictPayload = {
        what_hiding: what,
        key_evidence: evidence,
        recommended_action: action,
      };
      const autoCaught = contradictionsLogged.filter((c) => c.autoDetected).length;
      const resp = await fetch("/api/mission2/evaluate-verdict", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          transcript,
          verdict,
          turns_used: Math.max(1, Math.min(15, turnNumber || 1)),
          code_revealed: codeRevealed,
          auto_contradictions_caught: autoCaught,
          planted_reference: suspect?.contradictions_to_plant ?? [],
        }),
      });
      if (!resp.ok) {
        throw new Error("Evaluation failed");
      }
      const data = (await resp.json()) as DebriefClientPayload;
      setScore(data.score);
      setXp(data.xp);
      setDebriefPayload(data);
      router.push("/mission2/debrief");
    } catch {
      setError("Unable to submit verdict. Check API keys and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-xl rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-glow">
        <h2 className="font-display text-2xl font-extrabold tracking-[-0.02em] text-[var(--text-primary)]">
          Final verdict
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
          Summarize what they were hiding and what evidence you used.
        </p>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
              What is the suspect hiding?
            </span>
            <textarea
              value={what}
              onChange={(e) => setWhat(e.target.value)}
              rows={4}
              className="mt-2 w-full resize-none rounded-lg border border-[var(--border)] bg-black/40 px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition focus:border-[rgba(0,255,157,0.35)]"
            />
          </label>
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
              Key evidence / contradiction
            </span>
            <textarea
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              rows={4}
              className="mt-2 w-full resize-none rounded-lg border border-[var(--border)] bg-black/40 px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition focus:border-[rgba(0,255,157,0.35)]"
            />
          </label>
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
              Recommended action
            </span>
            <select
              value={action}
              onChange={(e) =>
                setAction(e.target.value as VerdictPayload["recommended_action"])
              }
              className="mt-2 w-full rounded-lg border border-[var(--border)] bg-black/40 px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition focus:border-[rgba(0,255,157,0.35)]"
            >
              <option value="Detain">Detain</option>
              <option value="Release">Release</option>
              <option value="Further Interrogation">Further Interrogation</option>
            </select>
          </label>
        </div>

        {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            disabled={busy || !what.trim() || !evidence.trim()}
            onClick={() => void submit()}
            className="rounded-md border border-[rgba(0,255,157,0.35)] bg-[rgba(0,255,157,0.1)] px-5 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--accent)] transition hover:bg-[rgba(0,255,157,0.16)] disabled:opacity-40"
          >
            {busy ? "Submitting…" : "Submit verdict"}
          </button>
        </div>
      </div>
    </div>
  );
}
